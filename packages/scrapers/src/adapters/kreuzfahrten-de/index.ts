/**
 * Adapter: kreuzfahrten.de
 *
 * Status: EXEMPLARY / STUB
 * Legal: Allowed (tentative — verify robots.txt before production use)
 * Rendering: JS-rendered SPA — requires Playwright
 *
 * IMPORTANT: Selectors are marked TODO because they require live verification
 * against the current DOM. The scraping framework, normalization, and retry
 * logic are fully implemented. Only the CSS selectors and field extraction
 * need to be filled in after manual inspection.
 *
 * How to complete this adapter:
 * 1. Run: npx playwright open https://www.kreuzfahrten.de/kreuzfahrten/
 * 2. Inspect the cruise card elements and fill in the TODO selectors below.
 * 3. Set enabled: true in sources.config.ts.
 * 4. Re-run: npm run scrape
 */

import type { Page } from 'playwright';
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
import { newContext } from '../../core/browser.js';
import type { SourceConfig } from '@cruise-deals/shared';

// TODO: Verify these selectors by inspecting live DOM
const SELECTORS = {
  // URL to search results — adjust query params as needed
  searchUrl: 'https://www.kreuzfahrten.de/kreuzfahrten/?sort=preis_asc',

  // Selector for the "load more" or pagination button
  loadMoreButton: '[data-testid="load-more"], .load-more-button, button[aria-label*="mehr"]',

  // Container for each cruise card
  cruiseCard: '.cruise-card, [data-testid="cruise-card"], .offer-card',

  // Fields within each card — TODO: verify each
  title: '.cruise-card__title, .offer-title, h2',
  cruiseLine: '.cruise-card__line, .cruise-line-name, [data-testid="cruise-line"]',
  shipName: '.cruise-card__ship, .ship-name, [data-testid="ship-name"]',
  departureDate: '.cruise-card__date, .departure-date, [data-testid="departure-date"]',
  nights: '.cruise-card__nights, .duration, [data-testid="nights"]',
  price: '.cruise-card__price, .price-amount, [data-testid="price"]',
  departurePort: '.cruise-card__port, .departure-port',
  destination: '.cruise-card__destination, .destination-name',
  boardType: '.cruise-card__board, .board-type',
  cabinType: '.cruise-card__cabin, .cabin-type',
  itinerary: '.cruise-card__route, .itinerary-summary',
  imageUrl: '.cruise-card__image img, .offer-image img',
  bookingLink: 'a.cruise-card__link, a.offer-link, a[data-testid="booking-link"]',
};

const MAX_PAGES = 5; // Limit pages per run — conservative

export class KreuzfahrtenDeScraper extends BaseScraper {
  constructor(config: SourceConfig, context: ScraperContext) {
    super(config, context);
  }

  async run(): Promise<CruiseInsert[]> {
    this.log.info('Starting kreuzfahrten.de scraper');

    const ctx = await newContext();
    const page = await ctx.newPage();
    const results: CruiseInsert[] = [];

    try {
      await withRetry(async () => {
        await page.goto(SELECTORS.searchUrl, {
          waitUntil: 'networkidle',
          timeout: 30_000,
        });
      });

      this.log.info('Page loaded, extracting cards');

      let pageNum = 0;
      while (pageNum < MAX_PAGES) {
        pageNum++;
        await page.waitForTimeout(500);

        const cards = await this.extractCards(page);
        results.push(...cards);
        this.log.info({ pageNum, cardCount: cards.length }, 'Extracted cards');

        const hasMore = await this.clickLoadMore(page);
        if (!hasMore) break;

        await this.rateLimit();
      }
    } catch (err) {
      this.log.error({ err }, 'Scraper failed');
      await this.saveScreenshot(page, 'error');
    } finally {
      await ctx.close();
    }

    this.log.info({ total: results.length }, 'kreuzfahrten.de scraper done');
    return results;
  }

  private async extractCards(page: Page): Promise<CruiseInsert[]> {
    // TODO: Verify SELECTORS.cruiseCard matches the live DOM
    const rawCards = await page.evaluate((sel) => {
      const cards = document.querySelectorAll(sel.cruiseCard);
      return Array.from(cards).map((card) => ({
        title: card.querySelector(sel.title)?.textContent ?? null,
        cruiseLine: card.querySelector(sel.cruiseLine)?.textContent ?? null,
        shipName: card.querySelector(sel.shipName)?.textContent ?? null,
        departureDate: card.querySelector(sel.departureDate)?.textContent ?? null,
        nights: card.querySelector(sel.nights)?.textContent ?? null,
        price: card.querySelector(sel.price)?.textContent ?? null,
        departurePort: card.querySelector(sel.departurePort)?.textContent ?? null,
        destination: card.querySelector(sel.destination)?.textContent ?? null,
        boardType: card.querySelector(sel.boardType)?.textContent ?? null,
        cabinType: card.querySelector(sel.cabinType)?.textContent ?? null,
        itinerary: card.querySelector(sel.itinerary)?.textContent ?? null,
        imageUrl: card.querySelector(sel.imageUrl)?.getAttribute('src') ?? null,
        bookingLink: card.querySelector(sel.bookingLink)?.getAttribute('href') ?? null,
      }));
    }, SELECTORS);

    if (rawCards.length === 0) {
      this.log.warn('No cards found — selectors may need updating');
      const html = await page.content();
      await this.saveSnapshot(html, 'no-cards');
    }

    return rawCards
      .map((raw) => this.normalizeCard(raw))
      .filter((c): c is CruiseInsert => c !== null);
  }

  private normalizeCard(raw: Record<string, string | null>): CruiseInsert | null {
    const title = trimStr(raw.title);
    if (!title) return null;

    const nights = parseNights(raw.nights);
    const priceTotal = parsePrice(raw.price);
    const pricePerNight =
      priceTotal !== null && nights !== null && nights > 0
        ? Math.round((priceTotal / nights) * 100) / 100
        : null;

    const departureDate = parseIsoDate(raw.departureDate);
    const region = normalizeDestinationRegion(raw.destination);

    // Build a full source URL from relative booking link
    const sourceUrl = raw.bookingLink
      ? raw.bookingLink.startsWith('http')
        ? raw.bookingLink
        : `${this.config.baseUrl}${raw.bookingLink}`
      : null;

    const partial = {
      source: this.config.id,
      sourceUrl,
      cruiseLine: trimStr(raw.cruiseLine),
      shipName: trimStr(raw.shipName),
      title,
      departurePort: trimStr(raw.departurePort),
      destinationRegion: region,
      itinerarySummary: trimStr(raw.itinerary),
      departureDate,
      returnDate: null, // not always available on card level
      nights,
      cabinType: normalizeCabinType(raw.cabinType),
      boardType: normalizeBoardType(raw.boardType),
      priceTotal,
      pricePerNight,
      currency: 'EUR',
      taxesIncluded: null,
      availabilityText: null,
      bookingLabel: 'Angebot ansehen',
      imageUrl: raw.imageUrl ? (raw.imageUrl.startsWith('http') ? raw.imageUrl : `${this.config.baseUrl}${raw.imageUrl}`) : null,
    };

    return this.finalizeCruise(partial, raw as Record<string, unknown>);
  }

  private async clickLoadMore(page: Page): Promise<boolean> {
    try {
      const btn = page.locator(SELECTORS.loadMoreButton).first();
      const visible = await btn.isVisible({ timeout: 2000 });
      if (!visible) return false;
      await btn.click();
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
      return true;
    } catch {
      return false;
    }
  }
}
