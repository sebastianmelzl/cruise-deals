# Neue Quelle hinzufügen

## Schritt-für-Schritt-Anleitung

### 1. Rechtliche & technische Vorprüfung

Bevor du irgendetwas implementierst:

```bash
# robots.txt prüfen
curl https://www.example-site.de/robots.txt

# ToS/Nutzungsbedingungen lesen — suche nach:
# "automated", "scraping", "crawling", "harvesting", "robot"
```

Frage dich:
- Verbieten die ToS automatisierten Zugriff? → Nicht implementieren
- Erlaubt robots.txt den relevanten Pfad? → Weiter
- Braucht die Seite Login/CAPTCHA? → Nicht implementieren
- Ist die Seite statisch oder JS-gerendert?

### 2. Quelle in `sources.config.ts` eintragen

```typescript
// packages/scrapers/src/sources.config.ts
{
  id: 'meine-neue-quelle',
  name: 'Meine Neue Quelle',
  baseUrl: 'https://www.example.de',
  enabled: false,           // erst false, bis Adapter fertig
  allowed: true,            // nur true nach rechtlicher Prüfung!
  requiresBrowser: false,   // true wenn JS-gerendert
  rateLimitMs: 3000,        // konservativ starten
  notes: 'Kurze Beschreibung der Quelle',
  legalNotes: 'robots.txt geprüft am DATUM, Pfad /kreuzfahrten/ erlaubt',
}
```

### 3. Scraper-Adapter implementieren

**Für statische HTML-Seiten (Cheerio):**

```typescript
// packages/scrapers/src/adapters/meine-neue-quelle/index.ts

import * as cheerio from 'cheerio';
import type { CruiseInsert } from '@cruise-deals/shared';
import { parseIsoDate, parsePrice, parseNights, ... } from '@cruise-deals/shared';
import { BaseScraper } from '../../core/base.js';

const SELECTORS = {
  searchUrl: 'https://www.example.de/kreuzfahrten/?sort=preis',
  nextPage: 'a[rel="next"]',
  offerCard: '.cruise-offer',
  // ... alle relevanten Selektoren
};

export class MeineNeueQuelleScraper extends BaseScraper {
  async run(): Promise<CruiseInsert[]> {
    // Implementierung analog zu kreuzfahrt-de/index.ts
  }
}
```

**Für JS-gerenderte Seiten (Playwright):**

```typescript
// Analog zu kreuzfahrten-de/index.ts
// Nutze newContext() aus core/browser.ts
```

### 4. Interface

Jeder Adapter implementiert die Basis-Methode `run()`:

```typescript
abstract run(): Promise<CruiseInsert[]>
```

Und nutzt intern:
- `this.rateLimit()` — zwischen Requests
- `this.finalizeCruise(partial, raw)` — Hashes + Deal Score berechnen
- `this.saveScreenshot(page, name)` — bei Fehlern
- `this.saveSnapshot(html, name)` — für Debug

### 5. In scrapeService.ts registrieren

```typescript
// apps/api/src/services/scrapeService.ts
import { MeineNeueQuelleScraper } from '@cruise-deals/scrapers';

function createScraper(config: SourceConfig): BaseScraper | null {
  switch (config.id) {
    case 'meine-neue-quelle': return new MeineNeueQuelleScraper(config, SCRAPER_CONTEXT);
    // ...
  }
}
```

### 6. In scrapers/index.ts exportieren

```typescript
export { MeineNeueQuelleScraper } from './adapters/meine-neue-quelle/index.js';
```

### 7. Testen

```bash
# Einzeln testen
SOURCE_IDS=meine-neue-quelle npm run scrape --workspace=apps/api

# Debug: Snapshots anschauen
ls data/snapshots/
```

### 8. enabled: true setzen

Erst wenn:
- Selektoren validiert ✓
- Rate Limit passt ✓
- Rechtliche Prüfung abgeschlossen ✓

## Normalisierungsregeln

Alle Adapter **müssen** die Normalisierungsfunktionen aus `@cruise-deals/shared` nutzen:

| Funktion | Zweck |
|---|---|
| `parseIsoDate(str)` | Datum → ISO YYYY-MM-DD |
| `parsePrice(str)` | Preis → `number \| null` |
| `parseNights(str)` | Nächte → `number \| null` |
| `normalizeCabinType(str)` | Kabinentyp → Enum |
| `normalizeBoardType(str)` | Verpflegung → Enum |
| `normalizeDestinationRegion(str)` | Region → Standard-Label |
| `trimStr(str)` | Whitespace bereinigen |

## Feldpflicht

| Feld | Pflicht | Hinweis |
|---|---|---|
| `title` | Ja | Fallback: Reederei + Region |
| `source` | Ja | = config.id |
| `priceTotal` | Empfohlen | null wenn nicht extrahierbar |
| `departureDate` | Empfohlen | ISO-Format |
| `nights` | Empfohlen | Für Deal Score wichtig |
| `cruiseLine` | Empfohlen | |
| `destinationRegion` | Empfohlen | Normalisiert über `normalizeDestinationRegion` |

Fehlende Werte → **null**, niemals halluzinieren.
