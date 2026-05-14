import { Router } from 'express';
import { z } from 'zod';
import { getDb, dbToCruise } from '../db/index.js';
import { listCruises, getCruiseById, getFilterOptions } from '../services/cruiseService.js';
import type { SortField } from '@cruise-deals/shared';

export const cruisesRouter = Router();

const SortFieldEnum = z.enum([
  'cheapest', 'best-deal', 'soonest-departure', 'shortest', 'longest', 'newest-scraped'
]);

const listQuerySchema = z.object({
  maxPrice: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  minNights: z.coerce.number().int().optional(),
  maxNights: z.coerce.number().int().optional(),
  departureMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  departurePort: z.string().optional(),
  destinationRegion: z.string().optional(),
  cruiseLine: z.string().optional(),
  cabinType: z.enum(['inside', 'outside', 'balcony', 'suite', 'studio', 'other']).optional(),
  boardType: z.enum(['all-inclusive', 'full-board', 'half-board', 'breakfast', 'none', 'other']).optional(),
  source: z.string().optional(),
  minDealScore: z.coerce.number().min(0).max(100).optional(),
  search: z.string().optional(),
  sort: SortFieldEnum.default('best-deal'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

cruisesRouter.get('/', (req, res) => {
  const parse = listQuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid query', details: parse.error.issues });
  }

  const { sort, page, pageSize, ...filters } = parse.data;
  const db = getDb();

  const { rows, total } = listCruises(db, { filters, sort: sort as SortField, page, pageSize });
  const data = rows.map(dbToCruise);

  return res.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    filters,
    sort,
  });
});

cruisesRouter.get('/filters', (_req, res) => {
  const db = getDb();
  const options = getFilterOptions(db);
  return res.json(options);
});

cruisesRouter.get('/:id', (req, res) => {
  const db = getDb();
  const row = getCruiseById(db, req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  return res.json(dbToCruise(row));
});
