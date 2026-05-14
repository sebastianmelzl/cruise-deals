import { Router } from 'express';
import { getDb } from '../db/index.js';
import { getAllSources } from '../services/sourceService.js';

export const sourcesRouter = Router();

sourcesRouter.get('/', (_req, res) => {
  const db = getDb();
  const sources = getAllSources(db);
  return res.json({ sources });
});
