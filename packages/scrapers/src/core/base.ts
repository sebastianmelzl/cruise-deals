import { randomInt } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import type { Cruise, CruiseInsert } from '@cruise-deals/shared';
import { computeNormalizedHash, computeRawHash, computeDealScore } from '@cruise-deals/shared';
import type { Logger } from 'pino';
import { scraperLogger } from './logger.js';
import type { SourceConfig } from '@cruise-deals/shared';

export interface ScraperContext {
  screenshotDir: string;
  snapshotDir: string;
}

export abstract class BaseScraper {
  protected log: Logger;
  protected config: SourceConfig;
  protected context: ScraperContext;

  constructor(config: SourceConfig, context: ScraperContext) {
    this.config = config;
    this.context = context;
    this.log = scraperLogger(config.id);
  }

  /** Main entry point: scrape and return normalized cruise records. */
  abstract run(): Promise<CruiseInsert[]>;

  /** Pause for the configured rate limit + optional random jitter (±20%). */
  protected async rateLimit(): Promise<void> {
    const base = this.config.rateLimitMs;
    if (base <= 0) return;
    const jitter = randomInt(0, Math.floor(base * 0.2));
    await sleep(base + jitter);
  }

  protected finalizeCruise(partial: Omit<CruiseInsert, 'rawHash' | 'normalizedHash' | 'dealScore' | 'scrapedAt'>, raw: Record<string, unknown>): CruiseInsert {
    const rawHash = computeRawHash(raw);
    const normalizedHash = computeNormalizedHash(partial as Partial<Cruise>);
    const scrapedAt = new Date().toISOString();
    const withMeta: CruiseInsert = { ...partial, rawHash, normalizedHash, scrapedAt, dealScore: null };
    const { total } = computeDealScore(withMeta as Cruise);
    return { ...withMeta, dealScore: total };
  }

  protected async saveScreenshot(page: unknown, name: string): Promise<void> {
    try {
      await mkdir(this.context.screenshotDir, { recursive: true });
      const path = join(this.context.screenshotDir, `${this.config.id}_${name}_${Date.now()}.png`);
      await (page as { screenshot(opts: { path: string }): Promise<void> }).screenshot({ path });
      this.log.info({ path }, 'Screenshot saved');
    } catch (err) {
      this.log.warn({ err }, 'Failed to save screenshot');
    }
  }

  protected async saveSnapshot(html: string, name: string): Promise<void> {
    try {
      await mkdir(this.context.snapshotDir, { recursive: true });
      const path = join(this.context.snapshotDir, `${this.config.id}_${name}_${Date.now()}.html`);
      await writeFile(path, html, 'utf-8');
      this.log.info({ path }, 'HTML snapshot saved');
    } catch (err) {
      this.log.warn({ err }, 'Failed to save snapshot');
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  return fn().catch(async (err) => {
    if (retries <= 0) throw err;
    await sleep(delayMs);
    return withRetry(fn, retries - 1, delayMs * 1.5);
  });
}
