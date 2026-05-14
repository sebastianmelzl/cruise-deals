import type { BoardType, CabinType } from '../types/cruise.js';

export function parseIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  // DD.MM.YYYY (German)
  const dmY = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dmY) return `${dmY[3]}-${dmY[2].padStart(2, '0')}-${dmY[1].padStart(2, '0')}`;

  // DD/MM/YYYY
  const dmYSlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmYSlash)
    return `${dmYSlash[3]}-${dmYSlash[2].padStart(2, '0')}-${dmYSlash[1].padStart(2, '0')}`;

  // Try native parse as last resort
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  return null;
}

export function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isFinite(val) ? val : null;
}

export function parseNights(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isInteger(raw) ? raw : Math.round(raw);
  const match = String(raw).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function normalizeCabinType(raw: string | null | undefined): CabinType {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('innen') || s.includes('inside') || s.includes('interior')) return 'inside';
  if (s.includes('balkon') || s.includes('balcony') || s.includes('verandah')) return 'balcony';
  if (s.includes('suite')) return 'suite';
  if (s.includes('studio')) return 'studio';
  if (s.includes('außen') || s.includes('aussen') || s.includes('outside') || s.includes('ocean view')) return 'outside';
  return 'other';
}

export function normalizeBoardType(raw: string | null | undefined): BoardType {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('all inclusive') || s.includes('all-inclusive') || s.includes('alles inklusive')) return 'all-inclusive';
  if (s.includes('vollpension') || s.includes('full board') || s.includes('vp')) return 'full-board';
  if (s.includes('halbpension') || s.includes('half board') || s.includes('hp')) return 'half-board';
  if (s.includes('frühstück') || s.includes('breakfast') || s.includes('übernachtung')) return 'breakfast';
  if (s.includes('ohne verpflegung') || s.includes('room only') || s.includes('no meals')) return 'none';
  return 'other';
}

export function normalizeDestinationRegion(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes('mittelmeer') || s.includes('mediterranean') || s.includes('mediterran')) return 'Mittelmeer';
  if (s.includes('karibik') || s.includes('caribbean') || s.includes('karib')) return 'Karibik';
  if (s.includes('norwegen') || s.includes('norway') || s.includes('fjord') || s.includes('nordkap')) return 'Norwegen & Fjorde';
  if (s.includes('baltikum') || s.includes('ostsee') || s.includes('baltic') || s.includes('skandinavien')) return 'Ostsee & Baltikum';
  if (s.includes('kanaren') || s.includes('canary') || s.includes('madeira') || s.includes('kapverd')) return 'Kanaren & Atlantik';
  if (s.includes('dubai') || s.includes('arabien') || s.includes('persisch') || s.includes('indien') || s.includes('oman')) return 'Arabien & Indien';
  if (s.includes('asien') || s.includes('asia') || s.includes('japan') || s.includes('china') || s.includes('vietnam')) return 'Asien';
  if (s.includes('usa') || s.includes('alaska') || s.includes('florida') || s.includes('bahamas')) return 'USA & Bahamas';
  if (s.includes('südamerika') || s.includes('south america') || s.includes('panama') || s.includes('argentinien')) return 'Südamerika';
  if (s.includes('nordeuropa') || s.includes('england') || s.includes('irland') || s.includes('island') || s.includes('grönland')) return 'Nordeuropa';
  if (s.includes('weltreise') || s.includes('world cruise') || s.includes('round the world')) return 'Weltreise';
  return raw.trim();
}

export function trimStr(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}
