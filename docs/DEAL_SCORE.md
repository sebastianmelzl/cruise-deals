# Deal Score — Dokumentation

## Überblick

Der Deal Score ist eine **transparente Heuristik** von 0–100. Kein Machine Learning, keine Blackbox.

Er aggregiert fünf Komponenten zu einem Gesamtscore, der Nutzern hilft, echte Preis-Leistungs-Angebote schnell zu identifizieren.

## Formel

```
Score = A (Preis) + B (Dauer) + C (Verpflegung) + D (Datenqualität) + E (Abfahrtsfenster)
Score = clamp(Score, 0, 100)
```

---

## Komponenten

### A. Preis-Effizienz (0–40 Punkte)

Vergleicht `pricePerNight` mit einem regionalen Benchmark-Preis (EUR, Economy-Kabine).

| Verhältnis (tatsächlich / Benchmark) | Punkte |
|---|---|
| ≤ 50 % | 40 |
| ≤ 65 % | 35 |
| ≤ 80 % | 28 |
| ≤ 95 % | 20 |
| ≤ 110 % | 12 |
| ≤ 130 % | 5 |
| > 130 % | 0 |

**Benchmarks (EUR / Nacht, Economy):**

| Region | Benchmark |
|---|---|
| Mittelmeer | 90 |
| Karibik | 120 |
| Norwegen & Fjorde | 100 |
| Ostsee & Baltikum | 75 |
| Kanaren & Atlantik | 95 |
| Arabien & Indien | 130 |
| Asien | 140 |
| USA & Bahamas | 130 |
| Südamerika | 150 |
| Nordeuropa | 110 |
| Weltreise | 160 |
| (Fallback) | 100 |

→ Benchmarks sollten aus echten Marktdaten aktualisiert werden, sobald genug reale Daten akkumuliert sind.

---

### B. Dauer-Bonus (0–15 Punkte)

Längere Reisen bieten in der Regel besseres Preis-Leistungs-Verhältnis und werden als attraktiver gewertet.

| Nächte | Punkte |
|---|---|
| ≥ 21 | 15 |
| ≥ 14 | 12 |
| ≥ 10 | 10 |
| ≥ 7 | 7 |
| ≥ 4 | 4 |
| < 4 | 2 |

---

### C. Verpflegungsbonus (0–15 Punkte)

All-Inclusive-Angebote sind faktisch günstiger als ihr Grundpreis suggeriert.

| Verpflegung | Punkte |
|---|---|
| All-Inclusive | 15 |
| Vollpension | 10 |
| Halbpension | 6 |
| Frühstück | 3 |
| Ohne Verpflegung | 1 |
| Unbekannt | 0 |

---

### D. Datenqualität (0–15 Punkte)

Unvollständige Angebote werden niedriger bewertet, da das Preisbild verzerrend sein kann.

Geprüfte Felder: `cruiseLine`, `shipName`, `departurePort`, `destinationRegion`, `departureDate`, `nights`, `cabinType`, `boardType`, `priceTotal`, `currency`, `sourceUrl`

| Befüllungsgrad | Punkte |
|---|---|
| ≥ 90 % | 15 |
| ≥ 75 % | 10 |
| ≥ 55 % | 5 |
| < 55 % | 0 |

---

### E. Abfahrtsfenster (0–15 Punkte)

Das optimale Buchungsfenster für Deal-Jäger liegt bei 30–90 Tagen vor Abfahrt.

| Tage bis Abfahrt | Punkte | Begründung |
|---|---|---|
| < 0 (vergangen) | 0 | Irrelevant |
| 0–14 | 3 | Sehr kurzfristig — schwer planbar |
| 15–30 | 8 | Last-Minute-Zone |
| 31–90 | 15 | Sweet Spot für Deals |
| 91–180 | 10 | Frühbucher-Bereich |
| 181–365 | 5 | Gut für Planung |
| > 365 | 2 | Zu weit in der Zukunft |

---

## Beispiele

**Costa Mittelmeer, 7 Nächte, 549€, Halbpension:**
- pricePerNight: 78,43€ → 87% des Benchmarks (90€) → 12 Punkte
- 7 Nächte → 7 Punkte
- Halbpension → 6 Punkte
- Datenqualität 100% → 15 Punkte
- Abfahrt in 50 Tagen → 15 Punkte
- **Total: 55 — "Solide"**

**AIDA Kanaren, 11 Nächte, 1299€, All-Inclusive:**
- pricePerNight: 118,09€ → 124% des Benchmarks (95€) → 5 Punkte
- 11 Nächte → 10 Punkte
- All-Inclusive → 15 Punkte
- Datenqualität 100% → 15 Punkte
- Abfahrt in 178 Tagen → 5 Punkte
- **Total: 50 — "Okay"**

---

## Weiterentwicklung

Der Score kann in zukünftigen Versionen verbessert werden durch:
- Echte Medianpreise aus akkumulierten DB-Daten statt statischen Benchmarks
- Historische Preisvergleiche (war der Preis früher höher?)
- Benutzerpräferenzen (bevorzugte Regionen, Kabinen)

Wichtig: Die Heuristik muss **nachvollziehbar bleiben**. Kein verstecktes Scoring.
