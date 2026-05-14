import { Router } from 'express';
import { getDb } from '../db/index.js';
import { getAllSources, setSourceEnabled, setSourceSearchParams } from '../services/sourceService.js';

export const sourcesRouter = Router();

sourcesRouter.get('/', (_req, res) => {
  const db = getDb();
  const sources = getAllSources(db);
  return res.json({ sources });
});

sourcesRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { enabled, searchParams } = req.body as { enabled?: boolean; searchParams?: Record<string, string> };
  const db = getDb();

  if (typeof enabled === 'boolean') {
    const updated = setSourceEnabled(db, id, enabled);
    if (!updated) return res.status(404).json({ error: 'Source not found or scraping not allowed' });
    return res.json({ source: updated });
  }

  if (searchParams && typeof searchParams === 'object') {
    const updated = setSourceSearchParams(db, id, searchParams);
    if (!updated) return res.status(404).json({ error: 'Source not found or scraping not allowed' });
    return res.json({ source: updated });
  }

  return res.status(400).json({ error: 'Provide `enabled` (boolean) or `searchParams` (object)' });
});
