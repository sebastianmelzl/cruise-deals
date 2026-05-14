import type { Cruise } from '../types/cruise.js';

/**
 * Deal Score: transparent heuristic, 0–100.
 *
 * Components:
 *   A. Price efficiency  (0–40 pts) — pricePerNight vs. median bucket
 *   B. Duration bonus    (0–15 pts) — longer = better value/experience
 *   C. Board type bonus  (0–15 pts) — all-inclusive = best deal
 *   D. Data quality      (0–15 pts) — complete records score higher
 *   E. Departure window  (0–15 pts) — 30–90 days out = sweet spot for deals
 *
 * Total: sum clamped to [0, 100].
 * No machine learning — just documented arithmetic.
 */

export interface DealScoreBreakdown {
  priceEfficiency: number;
  durationBonus: number;
  boardTypeBonus: number;
  dataQuality: number;
  departureWindow: number;
  total: number;
}

/**
 * Rough price-per-night benchmarks by region (EUR, economy cabin).
 * These are conservative estimates from public market data; update as real
 * data accumulates in the database.
 */
const REGION_PRICE_BENCHMARKS: Record<string, number> = {
  Mittelmeer: 90,
  Karibik: 120,
  'Norwegen & Fjorde': 100,
  'Ostsee & Baltikum': 75,
  'Kanaren & Atlantik': 95,
  'Arabien & Indien': 130,
  Asien: 140,
  'USA & Bahamas': 130,
  Südamerika: 150,
  Nordeuropa: 110,
  Weltreise: 160,
  default: 100,
};

function getPriceBenchmark(region: string | null): number {
  if (!region) return REGION_PRICE_BENCHMARKS.default;
  return REGION_PRICE_BENCHMARKS[region] ?? REGION_PRICE_BENCHMARKS.default;
}

function scorePriceEfficiency(cruise: Cruise): number {
  const ppn = cruise.pricePerNight;
  if (ppn === null || ppn <= 0) return 0;
  const benchmark = getPriceBenchmark(cruise.destinationRegion);
  const ratio = ppn / benchmark;
  if (ratio <= 0.5) return 40;
  if (ratio <= 0.65) return 35;
  if (ratio <= 0.8) return 28;
  if (ratio <= 0.95) return 20;
  if (ratio <= 1.1) return 12;
  if (ratio <= 1.3) return 5;
  return 0;
}

function scoreDuration(nights: number | null): number {
  if (!nights || nights <= 0) return 0;
  if (nights >= 21) return 15;
  if (nights >= 14) return 12;
  if (nights >= 10) return 10;
  if (nights >= 7) return 7;
  if (nights >= 4) return 4;
  return 2;
}

function scoreBoardType(boardType: Cruise['boardType']): number {
  switch (boardType) {
    case 'all-inclusive': return 15;
    case 'full-board': return 10;
    case 'half-board': return 6;
    case 'breakfast': return 3;
    case 'none': return 1;
    default: return 0;
  }
}

function scoreDataQuality(cruise: Cruise): number {
  const fields: (keyof Cruise)[] = [
    'cruiseLine', 'shipName', 'departurePort', 'destinationRegion',
    'departureDate', 'nights', 'cabinType', 'boardType',
    'priceTotal', 'currency', 'sourceUrl',
  ];
  const filled = fields.filter((f) => cruise[f] !== null && cruise[f] !== undefined).length;
  const ratio = filled / fields.length;
  if (ratio >= 0.9) return 15;
  if (ratio >= 0.75) return 10;
  if (ratio >= 0.55) return 5;
  return 0;
}

function scoreDepartureWindow(departureDate: string | null): number {
  if (!departureDate) return 0;
  const now = new Date();
  const dep = new Date(departureDate);
  const daysOut = Math.round((dep.getTime() - now.getTime()) / 86_400_000);
  if (daysOut < 0) return 0; // already departed
  if (daysOut <= 14) return 3; // very last-minute — hard to plan
  if (daysOut <= 30) return 8;
  if (daysOut <= 90) return 15; // sweet spot
  if (daysOut <= 180) return 10;
  if (daysOut <= 365) return 5;
  return 2;
}

export function computeDealScore(cruise: Cruise): DealScoreBreakdown {
  const priceEfficiency = scorePriceEfficiency(cruise);
  const durationBonus = scoreDuration(cruise.nights);
  const boardTypeBonus = scoreBoardType(cruise.boardType);
  const dataQuality = scoreDataQuality(cruise);
  const departureWindow = scoreDepartureWindow(cruise.departureDate);

  const total = Math.min(
    100,
    Math.max(0, priceEfficiency + durationBonus + boardTypeBonus + dataQuality + departureWindow)
  );

  return { priceEfficiency, durationBonus, boardTypeBonus, dataQuality, departureWindow, total };
}
