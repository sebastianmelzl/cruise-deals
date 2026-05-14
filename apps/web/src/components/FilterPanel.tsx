import { X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { CruiseFilters, FilterOptions } from '../types/index.ts';
import clsx from 'clsx';
import { useState } from 'react';

interface Props {
  filters: CruiseFilters;
  options: FilterOptions | undefined;
  onChange: (f: CruiseFilters) => void;
  onReset: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function Select({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: string[];
  placeholder: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="input appearance-none pr-8"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function RangeInput({
  label,
  min,
  max,
  value,
  unit,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number | undefined;
  unit?: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          placeholder={String(max)}
          className="input"
        />
        {unit && <span className="text-sm text-slate-400 shrink-0">{unit}</span>}
      </div>
    </div>
  );
}

const activeFilterCount = (f: CruiseFilters): number =>
  Object.values(f).filter((v) => v !== undefined && v !== '').length;

export function FilterPanel({ filters, options, onChange, onReset, mobileOpen, onMobileClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const count = activeFilterCount(filters);

  const update = (partial: Partial<CruiseFilters>) => onChange({ ...filters, ...partial });

  const content = (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">Filter</span>
          {count > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-ocean-600 text-white font-medium">
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <button onClick={onReset} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Zurücksetzen
            </button>
          )}
          <button onClick={onMobileClose} className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price */}
      <RangeInput
        label="Max. Preis (€)"
        min={0}
        max={options?.priceRange.max ?? 20000}
        value={filters.maxPrice}
        onChange={(v) => update({ maxPrice: v })}
      />

      {/* Nights */}
      <div className="grid grid-cols-2 gap-2">
        <RangeInput
          label="Min. Nächte"
          min={1}
          max={60}
          value={filters.minNights}
          onChange={(v) => update({ minNights: v })}
        />
        <RangeInput
          label="Max. Nächte"
          min={1}
          max={60}
          value={filters.maxNights}
          onChange={(v) => update({ maxNights: v })}
        />
      </div>

      {/* Region */}
      <Select
        label="Region"
        value={filters.destinationRegion}
        options={options?.destinationRegions ?? []}
        placeholder="Alle Regionen"
        onChange={(v) => update({ destinationRegion: v })}
      />

      {/* Departure port */}
      <Select
        label="Abfahrtshafen"
        value={filters.departurePort}
        options={options?.departurePorts ?? []}
        placeholder="Alle Häfen"
        onChange={(v) => update({ departurePort: v })}
      />

      {/* Month */}
      <div>
        <label className="label">Abfahrtsmonat</label>
        <input
          type="month"
          value={filters.departureMonth ?? ''}
          onChange={(e) => update({ departureMonth: e.target.value || undefined })}
          className="input"
        />
      </div>

      {/* More filters toggle */}
      <button
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        onClick={() => setExpanded((e) => !e)}
      >
        <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} />
        {expanded ? 'Weniger Filter' : 'Weitere Filter'}
      </button>

      {expanded && (
        <>
          <Select
            label="Reederei"
            value={filters.cruiseLine}
            options={options?.cruiseLines ?? []}
            placeholder="Alle Reedereien"
            onChange={(v) => update({ cruiseLine: v })}
          />

          <Select
            label="Kabinentyp"
            value={filters.cabinType as string | undefined}
            options={options?.cabinTypes ?? []}
            placeholder="Alle Typen"
            onChange={(v) => update({ cabinType: v as CruiseFilters['cabinType'] })}
          />

          <Select
            label="Verpflegung"
            value={filters.boardType as string | undefined}
            options={options?.boardTypes ?? []}
            placeholder="Alle"
            onChange={(v) => update({ boardType: v as CruiseFilters['boardType'] })}
          />

          <Select
            label="Quelle"
            value={filters.source}
            options={options?.sources ?? []}
            placeholder="Alle Quellen"
            onChange={(v) => update({ source: v })}
          />

          <RangeInput
            label="Min. Deal Score"
            min={0}
            max={100}
            value={filters.minDealScore}
            onChange={(v) => update({ minDealScore: v })}
          />
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gray-900">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative ml-auto w-80 max-w-full h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
