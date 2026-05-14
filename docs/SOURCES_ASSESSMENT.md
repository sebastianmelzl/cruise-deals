# Quellen-Assessment

## Bewertungsmatrix

| Quelle | Scraping erlaubt? | Technisch | Status | Adapter |
|---|---|---|---|---|
| Mock (intern) | ✅ Ja | Kein Scraping | Aktiv | Vollständig |
| kreuzfahrten.de | ⚠ Tentativ | Playwright | Stub | TODO Selektoren |
| kreuzfahrt.de | ⚠ Tentativ | Cheerio | Stub | TODO Selektoren |
| AIDA Cruises | ❌ Nein | Playwright | Gesperrt | Nicht implementiert |
| TUI Cruises | ❌ Nein | Playwright | Gesperrt | Nicht implementiert |
| MSC Cruises | ❌ Nein | Playwright | Gesperrt | Nicht implementiert |
| HolidayPirates | ⚠ Tentativ | Playwright | Stub | Noch nicht gebaut |

---

## Detail-Bewertungen

### ✅ kreuzfahrten.de
- **robots.txt:** Erlaubt `/kreuzfahrten/` (Stand: Recherche-Zeitpunkt — vor Aktivierung re-verifizieren)
- **ToS:** Kein explizites Scraping-Verbot in den sichtbaren Nutzungsbedingungen gefunden
- **Technik:** React SPA, benötigt Playwright. Pagination über "Mehr laden"-Button
- **Rate Limit:** 3.500ms + 20% Jitter
- **Empfehlung:** Selektoren per `playwright open` verifizieren, dann aktivieren

### ✅ kreuzfahrt.de
- **robots.txt:** Zu verifizieren — wahrscheinlich statisch
- **ToS:** Zu prüfen vor Aktivierung
- **Technik:** Vermutlich statisches HTML, Cheerio ausreichend
- **Empfehlung:** robots.txt + ToS prüfen, HTML-Struktur in DevTools verifizieren

### ❌ AIDA Cruises (aida.de)
- **ToS:** Enthält Abschnitt "Verbot der automatisierten Nutzung"
- **Entscheidung:** Nicht scrapen. Kann ggf. als manuelle Referenz genutzt werden
- **Alternative:** Falls AIDA eine offizielle API oder einen Affiliate-Feed anbietet, diesen nutzen

### ❌ TUI Cruises (meinschiff.com)
- **ToS:** Standard-TUI-Bedingungen verbieten automatisierte Datenextraktion
- **Entscheidung:** Nicht implementiert

### ❌ MSC Cruises (msccruises.de)
- **ToS:** Prohibiert automatisierten Zugriff
- **Entscheidung:** Nicht implementiert

### ⚠ HolidayPirates
- **Charakter:** Community-Plattform für Deal-Posts — öffentlich zugänglich
- **robots.txt:** Zu prüfen
- **Technik:** JS-gerendert, Playwright benötigt
- **Empfehlung:** Mögliche Quelle, aber Adapter noch nicht gebaut

---

## Mögliche zusätzliche Quellen (nicht implementiert)

| Quelle | Typ | Assessment |
|---|---|---|
| cruisewatch.com | Preismonitor | Public, API-ähnliche Struktur — prüfen |
| reiselust.de | Aggregator | Prüfen ob scraping-freundlich |
| L'TUR | Last-Minute | ToS prüfen |
| Billiger.de | Preisvergleich | Kreuzfahrten-Bereich vorhanden — prüfen |

---

## Rechtliche Grundsätze

1. **Robots.txt ist kein Gesetz**, aber respektiert werden sollte sie trotzdem (ethisches Crawling, Schutz vor ToS-Verstößen)
2. **ToS sind rechtlich bindend** — explizites Scraping-Verbot = nicht scrapen
3. **Öffentlich zugängliche Daten ≠ unbegrenzte Nutzungsrechte** in allen Jurisdiktionen
4. **Kein Login-Bypass**, kein CAPTCHA-Umgehung, keine Paywalls
5. **Rate Limiting** schützt die Zielseite und reduziert das Risiko von IP-Sperren

---

## Status-Update-Prozess

Nach jedem Scrape-Run wird `cruise_sources.status` automatisch aktualisiert:
- `working`: Mindestens ein Cruise-Objekt erfolgreich extrahiert
- `partial`: Scraper lief, aber weniger als erwartet extrahiert
- `blocked`: HTTP-Fehler oder technische Blockierung
- `disabled`: `enabled: false` in config
