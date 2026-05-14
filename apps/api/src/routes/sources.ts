import { Router } from 'express';
import { getDb } from '../db/index.js';
import { getAllSources, setSourceEnabled } from '../services/sourceService.js';

export const sourcesRouter = Router();

sourcesRouter.get('/', (_req, res) => {
  const db = getDb();
  const sources = getAllSources(db);
  return res.json({ sources });
});

sourcesRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body as { enabled?: boolean };
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: '`enabled` must be a boolean' });
  }
  const db = getDb();
  const updated = setSourceEnabled(db, id, enabled);
  if (!updated) {
    return res.status(404).json({ error: 'Source not found or scraping not allowed' });
  }
  return res.json({ source: updated });
});
