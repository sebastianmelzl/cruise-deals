import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { cruisesRouter } from './routes/cruises.js';
import { sourcesRouter } from './routes/sources.js';
import { scrapeRouter } from './routes/scrape.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.use('/api/cruises', cruisesRouter);
  app.use('/api/sources', sourcesRouter);
  app.use('/api/scrape', scrapeRouter);

  // In production: serve the pre-built React frontend
  if (process.env.NODE_ENV === 'production') {
    const webDist = join(__dirname, '../../../web/dist');
    if (existsSync(webDist)) {
      app.use(express.static(webDist));
      app.get('*', (_req, res) => res.sendFile(join(webDist, 'index.html')));
    }
  }

  app.use(errorHandler);

  return app;
}
