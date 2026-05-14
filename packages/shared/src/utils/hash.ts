import { createHash } from 'crypto';
import type { Cruise } from '../types/cruise.js';

/**
 * rawHash: fingerprint of the raw scraped content (detect changes in source data).
 * normalizedHash: fingerprint of normalized key fields (deduplicate across sources).
 */
export function computeRawHash(raw: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(raw)).digest('hex').slice(0, 16);
}

export function computeNormalizedHash(cruise: Partial<Cruise>): string {
  const key = [
    (cruise.cruiseLine ?? '').toLowerCase().replace(/\s+/g, ''),
    (cruise.shipName ?? '').toLowerCase().replace(/\s+/g, ''),
    cruise.departureDate ?? '',
    String(cruise.nights ?? ''),
    (cruise.departurePort ?? '').toLowerCase().replace(/\s+/g, ''),
    (cruise.cabinType ?? ''),
  ].join('|');
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}

/**
 * Fuzzy similarity of two strings via normalized Levenshtein (Sørensen–Dice approximation).
 * Returns 0.0 – 1.0. Used for title-based dedup fallback.
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const na = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const nb = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (na === nb) return 1;

  const setA = new Set(bigrams(na));
  const setB = new Set(bigrams(nb));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  return (2 * intersection) / (setA.size + setB.size);
}

function bigrams(str: string): string[] {
  const result: string[] = [];
  for (let i = 0; i < str.length - 1; i++) result.push(str.slice(i, i + 2));
  return result;
}
