# P-08 Kala Bala (Temporal Strength) Specification

## 1. Overview
Kala Bala is the temporal component of the classical Shadbala (Sixfold Planetary Strength) engine in Vedic astrology.
It assesses planetary strength derived from time factors including time of day, lunar phase, day segment, year/month/day/hour lordships, and declination.

This implementation implements eight CALCULATED temporal subcomponents, an explicit `NOT_IMPLEMENTED` boundary for Yuddha Bala (planetary war), and aggregates a `KALA_BALA` core total (`kalaBalaCoreTotal`).
In accordance with classical Shadbala governance, total Shadbala (`calculatedTotal`) remains `undefined` as Cheshta Bala and Drik Bala remain uncalculated.

---

## 2. Architecture & Dependency Flow
The dependency graph strictly enforces one-way flow:
`chartMath` / `solarTime` -> `planetaryStrength` / `kalaBala` -> `astroEngine`

`kalaBala.ts` relies on `solarTime.ts` for solar ephemeris, sunrise/sunset, declination, and solar ingress calculations without back-dependencies on `astroEngine.ts`.

---

## 3. Subcomponent Equations & Rules

### 3.1 Natonnata Bala (`NATONNATA_BALA`)
- **Diurnal Planets:** Sun, Jupiter, Venus (peak 60 at Solar Noon, 0 at Solar Midnight).
- **Nocturnal Planets:** Moon, Mars, Saturn (peak 60 at Solar Midnight, 0 at Solar Noon).
- **Mercury:** Statically receives 60 Shastiamsas at all times.
- **Sunrise/Sunset:** Both diurnal and nocturnal planets receive 30 Shastiamsas.
- **Rule ID:** `SHADBALA_NATONNATA_BALA_001`

### 3.2 Paksha Bala (`PAKSHA_BALA`)
- Measures angular separation between Sun and Moon ($\Delta \in [0^\circ, 180^\circ]$).
- $\text{beneficBase} = \Delta / 3$.
- **Benefics (Jupiter, Venus, Mercury, Moon):** $\text{value} = \text{beneficBase}$.
- **Malefics (Sun, Mars, Saturn):** $\text{value} = 60 - \text{beneficBase}$.
- **Moon:** Doubled and capped at 60 Shastiamsas ($\min(60, \text{beneficBase} \times 2)$).
- **Rule ID:** `SHADBALA_PAKSHA_BALA_001`

### 3.3 Tribhaga Bala (`TRIBHAGA_BALA`)
- **Jupiter:** Statically receives 60 Shastiamsas at all times.
- **Daytime (Sunrise to Sunset):** Split into 3 equal parts. Part 1 lord = Mercury, Part 2 lord = Sun, Part 3 lord = Saturn.
- **Nighttime (Sunset to Next Sunrise):** Split into 3 equal parts. Part 1 lord = Moon, Part 2 lord = Venus, Part 3 lord = Mars.
- **Rule ID:** `SHADBALA_TRIBHAGA_BALA_001`

### 3.4 Varsha Bala (`VARSHA_BALA`)
- Identifies the previous solar ingress into $0^\circ$ Aries sidereal using an explicit-bracket algorithm (stepping backward day-by-day to bracket the crossing point before binary searching to $\le 1$ second precision).
- Weekday lord determination uses the actual local sunrise at the ingress location computed from `BirthDetails.latitude` and `longitude`:
  - Ingress after local civil midnight but before actual local sunrise $\rightarrow$ previous civil weekday.
  - Ingress at/after local sunrise $\rightarrow$ current civil weekday.
- Awards 15 Shastiamsas to the weekday lord of that ingress's solar day.
- **Rule ID:** `SHADBALA_VARSHA_BALA_001`

### 3.5 Masa Bala (`MASA_BALA`)
- Identifies the previous solar ingress into the start of the current sidereal sign ($0^\circ, 30^\circ, 60^\circ, \dots$) using an explicit-bracket algorithm (stepping backward day-by-day to bracket the crossing point before binary searching to $\le 1$ second precision).
- Weekday lord determination uses the actual local sunrise at the ingress location computed from `BirthDetails.latitude` and `longitude`:
  - Ingress after local civil midnight but before actual local sunrise $\rightarrow$ previous civil weekday.
  - Ingress at/after local sunrise $\rightarrow$ current civil weekday.
- Awards 30 Shastiamsas to the weekday lord of that ingress's solar day.
- **Rule ID:** `SHADBALA_MASA_BALA_001`

### 3.6 Dina Bala (`DINA_BALA`)
- Identifies the local civil weekday lord at birth using the explicit offset in birth details.
- Awards 45 Shastiamsas to the birth weekday lord.
- **Rule ID:** `SHADBALA_DINA_BALA_001`

### 3.7 Hora Bala (`HORA_BALA`)
- Day and night are divided into 12 equal horas each (24 horas per solar day).
- The first hora lord at sunrise is the solar day's weekday lord.
- Hora lords advance according to the Chaldean order: Sun -> Venus -> Mercury -> Moon -> Saturn -> Jupiter -> Mars.
- Awards 60 Shastiamsas to the active hora lord.
- **Rule ID:** `SHADBALA_HORA_BALA_001`

### 3.8 Ayana Bala (`AYANA_BALA`)
- Derived from tropical declination ($\delta$):
  $$\text{raw} = \frac{24 + \delta_{\text{signed}}}{48} \times 60$$
- **Signed Declination ($\delta_{\text{signed}}$):**
  - $+\delta$ for Sun, Mars, Jupiter, Venus.
  - $-\delta$ for Moon, Saturn.
  - $|\delta|$ for Mercury.
- **Sun:** Doubled and capped at 60 Shastiamsas.
- **Rule ID:** `SHADBALA_AYANA_BALA_001`

### 3.9 Yuddha Bala (`YUDDHA_BALA`)
- Numerical Yuddha Bala point distribution is explicitly marked as `NOT_IMPLEMENTED`.
- **Reason:** Deferral due to lack of validated planetary war winner selection rules and Bimba Parimana disc-diameter astronomical data.
- **War Detection:** Deterministic detection for Mars, Mercury, Jupiter, Venus, and Saturn when $0^\circ < \text{separation} < 1^\circ$. Evidence emitted with rule ID `YUDDHA_BALA_001` or `YUDDHA_BALA_NO_WAR`.
- **Non-applicable planets (Sun, Moon, Rahu, Ketu):** Status set to `NOT_APPLICABLE` with rule ID `YUDDHA_BALA_NOT_APPLICABLE`.
- **See also:** `specs/P-12-Yuddha-Bala.md`

### 3.10 Kala Bala Core Aggregate (`KALA_BALA`)
- Sum of the eight calculated temporal components for the 7 primary planets.
- Published under `kalaBalaCoreTotal` on `PlanetaryStrength`.
- `completeKalaBala` is set to `undefined` because Yuddha Bala is `NOT_IMPLEMENTED`.
- `calculatedTotal` stays `undefined`.
- **Rule ID:** `SHADBALA_KALA_BALA_001`

---

## 4. Lunar Nodes Policy
For Rahu and Ketu, all Kala Bala subcomponents are emitted as `NOT_IMPLEMENTED` with ruleId `SHADBALA_<SUBCOMPONENT>_NOT_IMPLEMENTED` and reason `Rahu/Ketu policy: temporal strength components are not implemented for lunar nodes.`
No `KALA_BALA` aggregate or `kalaBalaCoreTotal` is produced for Rahu/Ketu.
