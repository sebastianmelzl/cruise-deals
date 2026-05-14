import { Router } from 'express';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { runScrape } from '../services/scrapeService.js';

export const scrapeRouter = Router();

const scrapeBodySchema = z.object({
  sourceIds: z.array(z.string()).optional(),
});

// Simple in-memory lock to prevent concurrent scrape runs
let scrapeRunning = false;

scrapeRouter.post('/run', async (req, res) => {
  if (scrapeRunning) {
    return res.status(409).json({ error: 'A scrape run is already in progress' });
  }

  const parse = scrapeBodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.issues });
  }

  scrapeRunning = true;
  const startedAt = new Date().toISOString();

  try {
    const db = getDb();
    const { runId, results, totalNew, totalUpdated } = await runScrape(db, parse.data.sourceIds);
    const completedAt = new Date().toISOString();

    return res.json({ runId, results, startedAt, completedAt, totalNew, totalUpdated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Scrape failed', message: msg });
  } finally {
    scrapeRunning = false;
  }
});
