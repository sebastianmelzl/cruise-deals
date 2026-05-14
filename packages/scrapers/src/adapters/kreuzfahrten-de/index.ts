/**
 * Adapter: kreuzfahrten.de — /termin/ search results
 *
 * Server-rendered HTML, Cheerio scraper, paginated via ?page=N.
 * Search parameters are read from this.config.searchParams and forwarded
 * to the URL query string (except _maxPages which controls pagination depth).
 *
 * Selectors verified against live DOM, May 2026.
 */

import { load } from 'cheerio';
import type { CruiseInsert } from '@cruise-deals/shared';
import {
  parseIsoDate,
  parsePrice,
  parseNights,
  normalizeCabinType,
  normalizeBoardType,
  normalizeDestinationRegion,
  trimStr,
} from '@cruise-deals/shared';
import { BaseScraper, withRetry, sleep, type ScraperContext } from '../../core/base.js';
import type { SourceConfig } from '@cruise-deals/shared';

const BASE_URL = 'https://www.kreuzfahrten.de';
const SEARCH_PATH = '/termin/';

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export class KreuzfahrtenDeScraper extends BaseScraper {
  constructor(config: SourceConfig, context: ScraperContext) {
    super(config, context);
  }

  async run(): Promise<CruiseInsert[]> {
    this.log.info('Starting kreuzfahrten.de scraper');

    const params = this.config.searchParams ?? {};
    const maxPages = parseInt(params['_maxPages'] ?? '5', 10);

    // Build base query params (strip internal _ params)
    const baseQuery: Record<string, string> = { 'per-page': '20', srcOrderBy: 'preis_asc' };
    for (const [k, v] of Object.entries(params)) {
      if (!k.startsWith('_') && v !== '' && v !== '0' || k === 'srcPriceMin' || k === 'per-page') {
        baseQuery[k] = v;
      }
    }
    // Always include these even if 0
    baseQuery['srcPriceMin'] = params['srcPriceMin'] ?? '0';
    baseQuery['srcPriceMax'] = params['srcPriceMax'] ?? '0';

    const results: CruiseInsert[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const qs = new URLSearchParams({ ...baseQuery, page: String(page) }).toString();
      const url = `${BASE_URL}${SEARCH_PATH}?${qs}`;
      this.log.info({ page, url }, 'Fetching page');

      let html: string;
      try {
        html = await withRetry(async () => {
          const res = await fetch(url, {
            headers: {
              'User-Agent': DESKTOP_UA,
              'Accept': 'text/html,application/xhtml+xml',
              'Accept-Language': 'de-DE,de;q=0.9',
            },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
          return res.text();
        });
      } catch (err) {
        this.log.error({ err, page }, 'Failed to fetch page');
        break;
      }

      const cards = this.extractCards(html);
      this.log.info({ page, cards: cards.length }, 'Extracted cards');

      if (cards.length === 0) {
        if (page === 1) {
          await this.saveSnapshot(html, 'no-cards');
          this.log.warn('No cards on page 1 — HTML snapshot saved');
        }
        break; // no more results
      }

      results.push(...cards);

      if (page < maxPages) await sleep(this.config.rateLimitMs);
    }

    this.log.info({ total: results.length }, 'kreuzfahrten.de scraper done');
    return results;
  }

  private extractCards(html: string): CruiseInsert[] {
    const $ = load(html);
    const results: CruiseInsert[] = [];

    $('.routeListItem').each((_i, el) => {
      const card = $(el);

      const routeNameRaw = card.find('.routeName').first().text().trim();
      const nights = parseNights(routeNameRaw);
      // Title: strip the leading "X Nächte" prefix
      const title = trimStr(routeNameRaw.replace(/^\d+\s*Nächte?\s*/i, '')) || trimStr(routeNameRaw);
      if (!title) return;

      const shipName = trimStr(card.find('.shipName a.lnkCruise').first().text());
      const bookingHref = card.find('.shipName a.lnkCruise').first().attr('href') ?? null;
      const cruiseLine = trimStr(card.find('img.vendorPic').first().attr('alt'));

      // Ports: "Kiel - Kiel" or "Kiel - Kiel"
      const harborText = card.find('.harborNames').first().text().trim();
      const portParts = harborText.split(/\s*[ \-]+\s*/);
      const departurePort = trimStr(portParts[0]?.replace(/[^\wÄÖÜäöüß\s\-]/g, ''));

      // Active (non-sold-out) departure date
      const activeDatum = card.find('.alleTermine .aktiv:not(.ausgebucht)').first();
      const depDateRaw = activeDatum.attr('data-datum-von') ?? null;
      const retDateRaw = activeDatum.attr('data-datum-bis') ?? null;
      const departureDate = parseIsoDate(depDateRaw);
      const returnDate = parseIsoDate(retDateRaw);

      // Price: in .preisWrapper span.price:not(.hidden), value in inner span
      const priceSpan = card.find('.preisWrapper span.price').not('.hidden').first();
      const priceText = priceSpan.find('span').last().text().trim(); // inner span: "€ 298,-"
      const priceTotal = parsePrice(priceText);

      const sourceUrl = bookingHref
        ? bookingHref.startsWith('http') ? bookingHref : `${BASE_URL}${bookingHref}`
        : null;

      // Image: first carousel img (not the vendor logo)
      const imgSrc = card.find('.carousel-item img').first().attr('src')
        ?? card.find('.bildWrapper img:not(.vendorPic)').first().attr('src')
        ?? null;
      const imageUrl = imgSrc
        ? (imgSrc.startsWith('http') ? imgSrc : `${BASE_URL}${imgSrc}`)
        : null;

      const pricePerNight =
        priceTotal !== null && nights !== null && nights > 0
          ? Math.round((priceTotal / nights) * 100) / 100
          : null;

      const raw: Record<string, unknown> = {
        routeNameRaw, shipName, cruiseLine, harborText, depDateRaw, retDateRaw, priceText,
      };

      const partial = {
        source: this.config.id,
        sourceUrl,
        cruiseLine: cruiseLine ?? null,
        shipName: shipName ?? null,
        title,
        departurePort: departurePort ?? null,
        destinationRegion: normalizeDestinationRegion(title),
        itinerarySummary: harborText || null,
        departureDate,
        returnDate,
        nights,
        cabinType: normalizeCabinType(null),
        boardType: normalizeBoardType(null),
        priceTotal,
        pricePerNight,
        currency: 'EUR',
        taxesIncluded: null,
        availabilityText: null,
        bookingLabel: 'Zum Angebot',
        imageUrl,
      };

      results.push(this.finalizeCruise(partial, raw));
    });

    return results;
  }
}
