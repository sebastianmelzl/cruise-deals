import { chromium, type Browser, type BrowserContext } from 'playwright';
import { logger } from './logger.js';

let browserInstance: Browser | null = null;

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    logger.info('Launching Playwright browser');
    browserInstance = await chromium.launch({
      headless: process.env.SCRAPER_HEADLESS !== 'false',
    });
  }
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    logger.info('Browser closed');
  }
}

export async function newContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    userAgent: DESKTOP_UA,
    locale: 'de-DE',
    viewport: { width: 1440, height: 900 },
    // Do not store cookies/session between independent scrape runs
    storageState: undefined,
  });
}
