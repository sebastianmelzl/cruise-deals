/**
 * Adapter: kreuzfahrten.de
 *
 * The /angebote page is server-rendered HTML — no Playwright required.
 * Each card is a grouped deal (cruise line + route for a date range),
 * not an individual departure.
 */

import { load } from 'cheerio';
import type { CruiseInsert } from '@cruise-deals/shared';
import {
  parsePrice,
  parseNights,
  normalizeCabinType,
  normalizeBoardType,
  normalizeDestinationRegion,
  trimStr,
} from '@cruise-deals/shared';
import { BaseScraper, withRetry, type ScraperContext } from '../../core/base.js';
import type { SourceConfig } from '@cruise-deals/shared';

const SEARCH_URL = 'https://www.kreuzfahrten.de/angebote';

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export class KreuzfahrtenDeScraper extends BaseScraper {
  constructor(config: SourceConfig, context: ScraperContext) {
    super(config, context);
  }

  async run(): Promise<CruiseInsert[]> {
    this.log.info('Starting kreuzfahrten.de scraper');

    const html = await withRetry(async () => {
      const res = await fetch(SEARCH_URL, {
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'de-DE,de;q=0.9',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${SEARCH_URL}`);
      return res.text();
    });

    const $ = load(html);
    const results: CruiseInsert[] = [];

    $('.specialItem').each((_i, el) => {
      const card = $(el);

      const raw: Record<string, string | null> = {
        title:       card.find('.subtitle').first().text().trim() || null,
        cruiseLine:  card.find('.title').first().text().trim() || null,
        departureDate: card.find('.zeitraum').first().text().trim() || null,
        route:       card.find('.route').first().text().trim() || null,
        price:       card.find('.price').first().text().trim() || null,
        cabinType:   card.find('.priceCategory').first().text().trim() || null,
        imageUrl:    card.find('.specialImageWrapper img').first().attr('src') ?? null,
        bookingLink: card.find('a.button-highlight').first().attr('href') ?? null,
      };

      const cruise = this.normalizeCard(raw);
      if (cruise) results.push(cruise);
    });

    this.log.info({ total: results.length }, 'kreuzfahrten.de scraper done');

    if (results.length === 0) {
      await this.saveSnapshot(html, 'no-cards');
      this.log.warn('No cards found — HTML snapshot saved');
    }

    return results;
  }

  private normalizeCard(raw: Record<string, string | null>): CruiseInsert | null {
    const title = trimStr(raw.title);
    if (!title) return null;

    // route: "z. B. 7 Nächte ab/bis Kiel"
    const routeText = raw.route ?? '';
    const nights = parseNights(routeText);
    const portMatch = routeText.match(/ab(?:\/bis)?\s+([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\s\-]*?)(?:\s*$)/i);
    const departurePort = portMatch ? trimStr(portMatch[1]) : null;

    // price: "699,-"
    const priceStr = raw.price?.replace(/[,\-]+$/, '').trim() ?? null;
    const priceTotal = parsePrice(priceStr);
    const pricePerNight =
      priceTotal !== null && nights !== null && nights > 0
        ? Math.round((priceTotal / nights) * 100) / 100
        : null;

    const region = normalizeDestinationRegion(raw.title);

    const bookingHref = raw.bookingLink ?? null;
    const sourceUrl = bookingHref
      ? bookingHref.startsWith('http')
        ? bookingHref
        : `${this.config.baseUrl}${bookingHref}`
      : null;

    const imageHref = raw.imageUrl ?? null;
    const imageUrl = imageHref
      ? imageHref.startsWith('http') ? imageHref : `${this.config.baseUrl}${imageHref}`
      : null;

    const partial = {
      source: this.config.id,
      sourceUrl,
      cruiseLine: trimStr(raw.cruiseLine),
      shipName: trimStr(raw.cruiseLine),
      title,
      departurePort,
      destinationRegion: region,
      itinerarySummary: routeText || null,
      departureDate: null,
      returnDate: null,
      nights,
      cabinType: normalizeCabinType(raw.cabinType),
      boardType: normalizeBoardType(null),
      priceTotal,
      pricePerNight,
      currency: 'EUR',
      taxesIncluded: null,
      availabilityText: trimStr(raw.departureDate),
      bookingLabel: 'Zum Angebot',
      imageUrl,
    };

    return this.finalizeCruise(partial, raw as Record<string, unknown>);
  }
}
