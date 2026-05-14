import type { Cruise } from '../types/index.ts';
import { DealBadge } from './DealBadge.tsx';
import { MapPin, Clock, Ship, Anchor, ExternalLink, Calendar } from 'lucide-react';

interface Props {
  cruise: Cruise;
}

const BOARD_LABELS: Record<string, string> = {
  'all-inclusive': 'All Inclusive',
  'full-board': 'Vollpension',
  'half-board': 'Halbpension',
  breakfast: 'Frühstück',
  none: 'Ohne Verpflegung',
  other: 'Sonstige',
};

const CABIN_LABELS: Record<string, string> = {
  inside: 'Innenkabine',
  outside: 'Außenkabine',
  balcony: 'Balkone',
  suite: 'Suite',
  studio: 'Studio',
  other: 'Sonstige',
};

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(amount: number | null, currency = 'EUR'): string {
  if (amount === null) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=60';

export function CruiseCard({ cruise }: Props) {
  const imgSrc = cruise.imageUrl ?? FALLBACK_IMAGE;

  return (
    <article className="card group flex flex-col hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60 transition-all duration-200 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative overflow-hidden h-44 bg-slate-100 dark:bg-slate-800">
        <img
          src={imgSrc}
          alt={cruise.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
        />
        {/* Deal badge overlay */}
        <div className="absolute top-2 left-2">
          <DealBadge score={cruise.dealScore} />
        </div>
        {/* Source label */}
        <div className="absolute top-2 right-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
            {cruise.source}
          </span>
        </div>
        {cruise.availabilityText && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-xs text-white/90">{cruise.availabilityText}</p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title + ship */}
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
            {cruise.title}
          </h3>
          {(cruise.cruiseLine || cruise.shipName) && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Ship className="w-3 h-3 shrink-0" />
              {[cruise.cruiseLine, cruise.shipName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Route info */}
        <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400">
          {cruise.departurePort && (
            <div className="flex items-start gap-1.5">
              <Anchor className="w-3 h-3 shrink-0 mt-0.5" />
              <span>ab {cruise.departurePort}</span>
            </div>
          )}
          {cruise.destinationRegion && (
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{cruise.destinationRegion}</span>
            </div>
          )}
          {cruise.itinerarySummary && (
            <p className="text-slate-400 dark:text-slate-500 line-clamp-1 ml-4.5">
              {cruise.itinerarySummary}
            </p>
          )}
        </div>

        {/* Date + duration */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(cruise.departureDate)}
          </div>
          {cruise.nights && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {cruise.nights} Nächte
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {cruise.cabinType && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {CABIN_LABELS[cruise.cabinType] ?? cruise.cabinType}
            </span>
          )}
          {cruise.boardType && (
            <span className="text-xs px-2 py-0.5 rounded bg-ocean-50 dark:bg-ocean-950/50 text-ocean-700 dark:text-ocean-300">
              {BOARD_LABELS[cruise.boardType] ?? cruise.boardType}
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {formatPrice(cruise.priceTotal, cruise.currency)}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {cruise.pricePerNight
                ? `${formatPrice(cruise.pricePerNight, cruise.currency)} / Nacht`
                : 'Gesamtpreis'}
              {cruise.taxesIncluded === false && ' · zzgl. Steuern'}
              {cruise.taxesIncluded === true && ' · inkl. Steuern'}
            </p>
          </div>

          {cruise.sourceUrl && (
            <a
              href={cruise.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs shrink-0"
            >
              {cruise.bookingLabel ?? 'Angebot'}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
