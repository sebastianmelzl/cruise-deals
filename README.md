# Cruise Deals

Filterbares Deal-Dashboard für günstige Kreuzfahrten.

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# .env anlegen
cp .env.example .env

# Datenbank initialisieren + Mock-Daten laden
npm run seed

# Entwicklungsserver starten (API + Frontend gleichzeitig)
npm run dev
```

→ Frontend: http://localhost:5173  
→ API: http://localhost:3001

## Anforderungen

- Node.js ≥ 20
- npm ≥ 9

## Befehle

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | API + Frontend gleichzeitig starten |
| `npm run dev:api` | Nur API starten (Port 3001) |
| `npm run dev:web` | Nur Frontend starten (Port 5173) |
| `npm run seed` | Mock-Daten in DB laden |
| `npm run scrape` | Alle aktivierten Scraper ausführen |
| `npm run build` | Alle Pakete bauen |
| `npm run typecheck` | TypeScript-Typen prüfen |

## Scraper

```bash
# Alle aktivierten Quellen scrapen
npm run scrape

# Nur Mock-Daten (immer verfügbar)
SOURCE_IDS=mock npm run scrape --workspace=apps/api

# Bestimmte Quellen
SOURCE_IDS=mock,kreuzfahrten-de npm run scrape --workspace=apps/api
```

## Neue Quelle hinzufügen

→ [docs/ADD_NEW_SOURCE.md](docs/ADD_NEW_SOURCE.md)

## Deal Score

→ [docs/DEAL_SCORE.md](docs/DEAL_SCORE.md)

## Quellen-Assessment

→ [docs/SOURCES_ASSESSMENT.md](docs/SOURCES_ASSESSMENT.md)

## Architektur

→ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## TODO Produktion

- [ ] Selektoren für kreuzfahrten.de und kreuzfahrt.de live verifizieren
- [ ] robots.txt-Checks vor Aktivierung realer Quellen wiederholen
- [ ] Cron-Job für automatische Scrape-Runs (z.B. 2x täglich)
- [ ] Deal-Score-Benchmarks aus echten DB-Daten kalibrieren
- [ ] Preishistorie implementieren (Tabelle `price_history`)
- [ ] E-Mail/Telegram-Benachrichtigung bei neuen Top-Deals
- [ ] Rate-Limiting auf der API (express-rate-limit)
- [ ] Health-Monitoring für Scraper (PagerDuty o.ä.)
- [ ] Tests für Normalisierungsfunktionen ausbauen
- [ ] Playwright-Browser-Pool für parallele Scraper

## Rechtliche Hinweise

Dieses Tool scrapet nur öffentlich zugängliche Seiten, wo kein explizites Verbot in robots.txt oder ToS vorliegt. Direkte Kreuzfahrtanbieter (AIDA, TUI, MSC) sind als `allowed: false` markiert und werden nicht gescrapt. Vor Aktivierung neuer Quellen ist immer eine manuelle rechtliche Prüfung erforderlich.
