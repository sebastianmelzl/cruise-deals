import type { SourceConfig } from '@cruise-deals/shared';

/**
 * Source configuration registry.
 *
 * Before enabling any source, verify:
 * 1. robots.txt allows crawling the relevant paths
 * 2. Terms of Service do not explicitly prohibit automated access
 * 3. The source is technically accessible without bypassing auth/CAPTCHA
 *
 * Flags:
 *   enabled:         Whether to include in scrape runs
 *   allowed:         Legal/technical assessment passed (must be true to scrape)
 *   requiresBrowser: Needs Playwright (JS-rendered)
 *   rateLimitMs:     Minimum ms between requests to this source
 */
export const SOURCES: SourceConfig[] = [
  {
    id: 'mock',
    name: 'Mock Data',
    baseUrl: 'internal://mock',
    enabled: true,
    allowed: true,
    requiresBrowser: false,
    rateLimitMs: 0,
    notes: 'Built-in seed data for development and demo. Always available.',
  },

  // ─── ASSESSMENT: kreuzfahrten.de ─────────────────────────────────────────
  // Public German cruise comparison portal.
  // robots.txt (as of 2024): disallows /admin/, /user/, /api/ but allows /kreuzfahrten/.
  // No explicit anti-scraping clause found in ToS at time of review.
  // Site is largely JS-rendered (React SPA) — requires Playwright.
  // Conservative approach: 1 request per 3-4s, no parallel sessions.
  // Status: ENABLED as exemplary adapter, but selectors need live verification.
  // TODO: Re-verify robots.txt before going to production.
  {
    id: 'kreuzfahrten-de',
    name: 'kreuzfahrten.de',
    baseUrl: 'https://www.kreuzfahrten.de',
    enabled: false,
    allowed: true,
    requiresBrowser: false,
    rateLimitMs: 2000,
    notes: 'Server-rendered HTML. Cheerio adapter scrapes /termin/ search results.',
    searchParams: {
      srcOrderBy: 'preis_asc',
      srcReiseArt: 'Hochsee',
      srcPriceMin: '0',
      srcPriceMax: '0',
      srcRouteDurationMin: '0',
      srcRouteDurationMax: '0',
      'per-page': '20',
      _maxPages: '5',
    },
    legalNotes: 'Verify robots.txt /kreuzfahrten/ path and ToS before production use.',
  },

  // ─── ASSESSMENT: kreuzfahrt.de ───────────────────────────────────────────
  // Another German aggregator. Static HTML pages for search results observed.
  // TODO: Verify robots.txt. Adapter stub implemented.
  {
    id: 'kreuzfahrt-de',
    name: 'kreuzfahrt.de',
    baseUrl: 'https://www.kreuzfahrt.de',
    enabled: false,
    allowed: true, // tentative — verify before enabling
    requiresBrowser: false,
    rateLimitMs: 2500,
    notes: 'Appears to serve static HTML search results. Cheerio adapter stub. Selectors need live verification.',
    legalNotes: 'Verify robots.txt and ToS before production use.',
  },

  // ─── ASSESSMENT: AIDA (aida.de) ──────────────────────────────────────────
  // Direct operator. ToS explicitly prohibit automated access and data extraction.
  // DO NOT scrape. Use only for manual reference.
  {
    id: 'aida-de',
    name: 'AIDA Cruises',
    baseUrl: 'https://www.aida.de',
    enabled: false,
    allowed: false, // ToS prohibit scraping
    requiresBrowser: true,
    rateLimitMs: 0,
    notes: 'DISABLED. AIDA ToS prohibit automated access.',
    legalNotes: 'ToS section "Verbot der automatisierten Nutzung" explicitly prohibits scraping.',
  },

  // ─── ASSESSMENT: TUI Cruises (meinschiff.com) ────────────────────────────
  // Direct operator. Similar ToS restrictions as AIDA.
  {
    id: 'tui-cruises',
    name: 'TUI Cruises (Mein Schiff)',
    baseUrl: 'https://www.meinschiff.com',
    enabled: false,
    allowed: false,
    requiresBrowser: true,
    rateLimitMs: 0,
    notes: 'DISABLED. ToS likely prohibit scraping — verify and do not enable without legal clearance.',
    legalNotes: 'Standard TUI ToS prohibit automated data extraction.',
  },

  // ─── ASSESSMENT: MSC Cruises ─────────────────────────────────────────────
  {
    id: 'msc-cruises',
    name: 'MSC Cruises',
    baseUrl: 'https://www.msccruises.de',
    enabled: false,
    allowed: false,
    requiresBrowser: true,
    rateLimitMs: 0,
    notes: 'DISABLED. ToS likely prohibit scraping.',
    legalNotes: 'Do not enable without explicit legal clearance.',
  },

  // ─── ASSESSMENT: Holidaycheck / HolidayPirates ───────────────────────────
  // Deal aggregators. HolidayPirates sometimes features cruise deals.
  // robots.txt check needed. Marked as tentative.
  {
    id: 'holidaypirates',
    name: 'HolidayPirates',
    baseUrl: 'https://www.holidaypirates.com',
    enabled: false,
    allowed: true, // tentative
    requiresBrowser: true,
    rateLimitMs: 4000,
    notes: 'Potential source for deal posts. No adapter implemented yet. Verify robots.txt.',
    legalNotes: 'Verify robots.txt and ToS. Cruise deals may be user-submitted posts — public.',
  },
];

export function getSource(id: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function getEnabledSources(): SourceConfig[] {
  return SOURCES.filter((s) => s.enabled && s.allowed);
}
