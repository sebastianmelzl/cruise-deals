# Architektur

## Übersicht

```
cruise-deals/
├── apps/
│   ├── api/          Express + TypeScript + SQLite (Port 3001)
│   └── web/          React + Vite + Tailwind (Port 5173)
├── packages/
│   ├── shared/       Typen, Normalisierung, Deal Score, Hashing
│   └── scrapers/     Scraper-Kern + Quellenadapter
├── data/             SQLite-Datenbank, Screenshots, Snapshots, Seed
└── docs/             Architektur, Quellenassessment, Deal Score
```

## Datenfluss

```
[Quelle] → [Adapter] → [BaseScraper.finalizeCruise()] → [cruiseService.upsertCruises()] → [SQLite]
                          ↓                                ↓
                     Deal Score                    Normalisierter Hash
                     Raw Hash                      Deduplizierung
```

## Normalisierungspipeline

1. **Adapter** extrahiert Rohdaten aus HTML/DOM
2. **normalize.ts** konvertiert Strings → typisierte Felder (Datum, Preis, Enum)
3. **hash.ts** berechnet rawHash (Änderungserkennung) und normalizedHash (Deduplizierung)
4. **dealScore.ts** berechnet Deal Score 0–100
5. **cruiseService.upsertCruises()** schreibt in SQLite mit ON CONFLICT → UPDATE

## Deduplizierung

`normalizedHash` = SHA-256 von:
```
cruiseLine|shipName|departureDate|nights|departurePort|cabinType
```

Bei gleichem `normalizedHash` wird das bestehende Angebot aktualisiert (nicht dupliziert), auch wenn es von einer anderen Quelle kommt. Source-Bezug bleibt über das `source`-Feld erhalten.

## API

```
GET  /api/cruises          Liste mit Filter/Sort/Pagination
GET  /api/cruises/:id      Einzelnes Angebot
GET  /api/cruises/filters  Verfügbare Filterwerte
GET  /api/sources          Quellenstatus
POST /api/scrape/run       Scraper starten { sourceIds?: string[] }
GET  /api/health           Health check
```

## Scraper-Architektur

```
BaseScraper (abstract)
  ├── MockScraper          — Seed-Daten
  ├── KreuzfahrtenDeScraper — Playwright
  └── KreuzfahrtDeScraper  — Cheerio/fetch
```

Jeder Adapter:
- Implementiert `run(): Promise<CruiseInsert[]>`
- Nutzt `this.rateLimit()` zwischen Requests
- Ruft `this.finalizeCruise()` für alle Felder auf
- Speichert Debug-Screenshots und HTML-Snapshots bei Fehlern

## Frontend

```
App
├── Navbar + Theme Toggle
├── Dashboard (Hauptansicht)
│   ├── FilterPanel (Desktop-Sidebar / Mobile-Drawer)
│   ├── CruiseCard / CruiseTable (umschaltbar)
│   ├── DealBadge
│   └── Pagination
└── Sources (Admin-View)
    └── SourceStatusBadge
```

State Management: React Query für Server-State, useState für UI-State.

## Datenbank-Schema

Drei Tabellen:
- `cruises` — normalisierte Kreuzfahrtangebote
- `cruise_sources` — Quellen-Registry + Status
- `scrape_runs` — Protokoll der Scrape-Läufe

Wichtige Indizes: `normalized_hash`, `deal_score`, `departure_date`, `price_total`
