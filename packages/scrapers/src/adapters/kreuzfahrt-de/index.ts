/**
 * Adapter: kreuzfahrt.de
 *
 * Status: STUB — selectors need live verification
 * Legal: Allowed (tentative — verify robots.txt)
 * Rendering: Static HTML — uses Cheerio (no browser needed)
 *
 * How to complete this adapter:
 * 1. Open https://www.kreuzfahrt.de/kreuzfahrten/ in browser DevTools
 * 2. Inspect the cruise listing HTML structure
 * 3. Fill in the TODO selectors in SELECTORS below
 * 4. Set enabled: true in sources.config.ts
 */

import * as cheerio from 'cheerio';
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
import { BaseScraper, withRetry, type ScraperContext } from '../../core/base.js';
import type { SourceConfig } from '@cruise-deals/shared';

// TODO: Verify by inspecting live HTML source
const SELECTORS = {
  searchUrl: 'https://www.kreuzfahrt.de/kreuzfahrten/?sort=preis_aufsteigend',

  // Pagination — next page link
  nextPage: 'a.pagination__next, a[rel="next"], .pager__next a',

  // Each offer container
  offerCard: '.cruise-offer, .offer-item, article.offer',

  // Fields — TODO: inspect live HTML
  title: '.offer-title, h2.title, .cruise-name',
  cruiseLine: '.cruise-line, .veranstalter, .operator',
  shipName: '.ship-name, .schiff',
  price: '.price, .preis, .offer-price',
  nights: '.nights, .naechte, .duration',
  departureDate: '.departure, .abfahrt-datum, .travel-date',
  departurePort: '.port, .hafen, .departure-port',
  destination: '.destination, .reiseziel, .region',
  boardType: '.board, .verpflegung',
  cabinType: '.cabin, .kabine',
  itinerary: '.route, .itinerary, .hafen-liste',
  imageUrl: 'img.offer-image, img.cruise-image',
  bookingLink: 'a.offer-link, a.buchen-link, .cta a',
};

const MAX_PAGES = 4;

export class KreuzfahrtDeScraper extends BaseScraper {
  constructor(config: SourceConfig, context: ScraperContext) {
    super(config, context);
  }

  async run(): Promise<CruiseInsert[]> {
    this.log.info('Starting kreuzfahrt.de scraper');
    const results: CruiseInsert[] = [];
    let url: string | null = SELECTORS.searchUrl;
    let page = 0;

    while (url && page < MAX_PAGES) {
      page++;
      this.log.info({ url, page }, 'Fetching page');

      let html: string;
      try {
        html = await withRetry(() => this.fetchHtml(url!));
      } catch (err) {
        this.log.error({ err, url }, 'Failed to fetch page');
        break;
      }

      const { cruises, nextUrl } = this.parsePage(html, url);
      results.push(...cruises);
      this.log.info({ page, count: cruises.length }, 'Parsed cards');

      if (cruises.length === 0) {
        this.log.warn('No cards parsed — saving snapshot for debugging');
        await this.saveSnapshot(html, `page-${page}-no-cards`);
      }

      url = nextUrl;
      if (url) await this.rateLimit();
    }

    this.log.info({ total: results.length }, 'kreuzfahrt.de scraper done');
    return results;
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return response.text();
  }

  private parsePage(html: string, baseUrl: string): { cruises: CruiseInsert[]; nextUrl: string | null } {
    const $ = cheerio.load(html);
    const cruises: CruiseInsert[] = [];

    $(SELECTORS.offerCard).each((_i, el) => {
      const raw = {
        title: $(el).find(SELECTORS.title).first().text() || null,
        cruiseLine: $(el).find(SELECTORS.cruiseLine).first().text() || null,
        shipName: $(el).find(SELECTORS.shipName).first().text() || null,
        price: $(el).find(SELECTORS.price).first().text() || null,
        nights: $(el).find(SELECTORS.nights).first().text() || null,
        departureDate: $(el).find(SELECTORS.departureDate).first().text() || null,
        departurePort: $(el).find(SELECTORS.departurePort).first().text() || null,
        destination: $(el).find(SELECTORS.destination).first().text() || null,
        boardType: $(el).find(SELECTORS.boardType).first().text() || null,
        cabinType: $(el).find(SELECTORS.cabinType).first().text() || null,
        itinerary: $(el).find(SELECTORS.itinerary).first().text() || null,
        imageUrl: $(el).find(SELECTORS.imageUrl).first().attr('src') || null,
        bookingLink: $(el).find(SELECTORS.bookingLink).first().attr('href') || null,
      };

      const cruise = this.normalizeCard(raw, baseUrl);
      if (cruise) cruises.push(cruise);
    });

    // Resolve next page URL
    const nextHref = $(SELECTORS.nextPage).first().attr('href');
    let nextUrl: string | null = null;
    if (nextHref) {
      nextUrl = nextHref.startsWith('http')
        ? nextHref
        : new URL(nextHref, baseUrl).toString();
    }

    return { cruises, nextUrl };
  }

  private normalizeCard(raw: Record<string, string | null>, baseUrl: string): CruiseInsert | null {
    const title = trimStr(raw.title);
    if (!title) return null;

    const nights = parseNights(raw.nights);
    const priceTotal = parsePrice(raw.price);
    const pricePerNight =
      priceTotal !== null && nights !== null && nights > 0
        ? Math.round((priceTotal / nights) * 100) / 100
        : null;

    const sourceUrl = raw.bookingLink
      ? raw.bookingLink.startsWith('http')
        ? raw.bookingLink
        : new URL(raw.bookingLink, baseUrl).toString()
      : null;

    const partial = {
      source: this.config.id,
      sourceUrl,
      cruiseLine: trimStr(raw.cruiseLine),
      shipName: trimStr(raw.shipName),
      title,
      departurePort: trimStr(raw.departurePort),
      destinationRegion: normalizeDestinationRegion(raw.destination),
      itinerarySummary: trimStr(raw.itinerary),
      departureDate: parseIsoDate(raw.departureDate),
      returnDate: null,
      nights,
      cabinType: normalizeCabinType(raw.cabinType),
      boardType: normalizeBoardType(raw.boardType),
      priceTotal,
      pricePerNight,
      currency: 'EUR',
      taxesIncluded: null,
      availabilityText: null,
      bookingLabel: 'Zum Angebot',
      imageUrl: raw.imageUrl ?? null,
    };

    return this.finalizeCruise(partial, raw as Record<string, unknown>);
  }
}
