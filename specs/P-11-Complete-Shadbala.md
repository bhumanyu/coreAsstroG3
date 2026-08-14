# P-11 Complete Shadbala Aggregation Specification

## 1. Overview & Purpose
Shadbala (Sixfold Planetary Strength) is the classical system of quantified planetary potency in Vedic astrology (Brihat Parashara Hora Shastra).
The P-11 aggregation layer combines the six fundamental strength components into a single canonical Shadbala aggregate per planet:
1. **Sthana Bala** (Positional Strength) — P-07
2. **Dig Bala** (Directional Strength) — P-06
3. **Kala Bala** (Temporal Strength) — P-08
4. **Cheshta Bala** (Motional Strength) — P-09
5. **Naisargika Bala** (Natural Strength) — P-06
6. **Drik Bala** (Aspectual Strength) — P-10

The aggregation layer provides strict component gating, conversion between Shastiamsas and Rupas, canonical minimum strength threshold evaluation, detailed evidence generation, and immutable output.

---

## 2. Six Major Strength Components
Every classical planet has six primary components evaluated in Shastiamsas ($1/60\text{th}$ of a Rupa):

| Component Enum | Component Name | Source Module / Spec | Canonical Range (Shastiamsa) |
|---|---|---|---|
| `STHANA_BALA` | Positional Strength | `sthanaBala.ts` / P-07 | $[0, 450]$ |
| `DIG_BALA` | Directional Strength | `planetaryStrength.ts` / P-06 | $[0, 60]$ |
| `KALA_BALA` | Temporal Strength | `kalaBala.ts` / P-08 | Variable ($\approx [100, 450]$) |
| `CHESHTA_BALA` | Motional Strength | `cheshtaBala.ts` / P-09 | $[0, 60]$ |
| `NAISARGIKA_BALA` | Natural Strength | `planetaryStrength.ts` / P-06 | Fixed $[8.57, 60.00]$ |
| `DRIK_BALA` | Aspectual Strength | `drikBala.ts` / P-10 | $[-75, +75]$ (Unclamped) |

---

## 3. Aggregation Contract

### 3.1 Function Signature
```ts
export interface ShadbalaAggregationInput {
  readonly planet: Planet;
  readonly components: readonly PlanetStrengthComponent[];
  readonly kalaBalaCoreTotal?: number;
  readonly completeKalaBala?: number;
}

export function calculateShadbala(input: ShadbalaAggregationInput): ShadbalaAggregation;
```

### 3.2 Gating Rules
- **Input Validation:** Requires valid `input`, valid `planet` (classical 7 or Rahu/Ketu), and array of `components`.
- **Node Policy:** For `RAHU` and `KETU`, returns `status: INCOMPLETE`, `missingComponents: [STHANA_BALA, DIG_BALA, KALA_BALA, CHESHTA_BALA, NAISARGIKA_BALA, DRIK_BALA]`, and reason that Rahu/Ketu do not have a canonical P-11 minimum Shadbala requirement.
- **Component Availability:** All six components must have `status: 'CALCULATED'` with a finite numeric value.
- **Kala Bala Gating:** `completeKalaBala` must be defined and finite. `kalaBalaCoreTotal` is **never** substituted for `completeKalaBala`. If `completeKalaBala` is undefined, `KALA_BALA` is treated as missing.
- **Missing Components:** If any component is missing or incomplete, returns `status: INCOMPLETE` with the exact list of missing components and no published totals.

### 3.3 Aggregation Formulas
When all six components are available and complete:
$$\text{rawTotal} = \text{SthanaBala} + \text{DigBala} + \text{CompleteKalaBala} + \text{CheshtaBala} + \text{NaisargikaBala} + \text{DrikBala}$$
$$\text{totalShastiamsa} = \text{roundTo2}(\text{rawTotal})$$
$$\text{totalRupa} = \text{shastiamsaToRupa}(\text{totalShastiamsa}) = \text{roundTo2}\left(\frac{\text{totalShastiamsa}}{60}\right)$$
$$\text{ratioToMinimum} = \text{roundTo4}\left(\frac{\text{totalShastiamsa}}{\text{requiredShastiamsa}}\right)$$
$$\text{percentageOfMinimum} = \text{roundTo2}(\text{ratioToMinimum} \times 100)$$
$$\text{meetsMinimum} = \text{totalShastiamsa} \ge \text{requiredShastiamsa}$$

---

## 4. Canonical Minimum Strength Requirements
The canonical minimum strength thresholds (BPHS / classical standards) are defined in `SHADBALA_MINIMUM_REQUIREMENTS` typed as `Readonly<Partial<Record<Planet, ShadbalaMinimumRequirement>>>` for the seven classical grahas (Rahu and Ketu have no entry):

| Planet | Required Shastiamsa | Required Rupa |
|---|---|---|
| **Sun** (`SUN`) | $390.00$ | $6.50$ |
| **Moon** (`MOON`) | $360.00$ | $6.00$ |
| **Mars** (`MARS`) | $300.00$ | $5.00$ |
| **Mercury** (`MERCURY`) | $420.00$ | $7.00$ |
| **Jupiter** (`JUPITER`) | $390.00$ | $6.50$ |
| **Venus** (`VENUS`) | $330.00$ | $5.50$ |
| **Saturn** (`SATURN`) | $300.00$ | $5.00$ |

---

## 5. Rupa Conversion Helpers
Located in `src/engine/planetaryStrength/rupa.ts`:
- `shastiamsaToRupa(shastiamsa: number): number` — Converts Shastiamsa to Rupa rounded to 2 decimal places. Supports negative values. Throws `TypeError` on non-finite input.
- `rupaToShastiamsa(rupa: number): number` — Converts Rupa to Shastiamsa rounded to 2 decimal places. Supports negative values. Throws `TypeError` on non-finite input.

---

## 6. Evidence Contract & Rule IDs
The planetary strength evidence report contains structured audit trails for Shadbala aggregation:
- `SHADBALA_TOTAL_001`: Complete Shadbala aggregation computed from six components.
- `SHADBALA_TOTAL_INCOMPLETE`: Emitted when one or more components are incomplete.
- `SHADBALA_RUPA_CONVERSION_001`: Shastiamsa to Rupa conversion reference rule.
- `SHADBALA_MINIMUM_REQUIREMENT_001`: Minimum strength threshold reference rule.
- `SHADBALA_MINIMUM_RATIO_001`: Ratio and percentage to minimum threshold calculation rule.

---

## 7. Scope Boundaries & Non-Goals
- **No Interpretation or Ranking:** Does not assign auspiciousness/inauspiciousness labels, strength tiers, or relative ranking.
- **No Yuddha Bala:** Planetary war adjustments are separate and not included in P-11.
- **No Clamping:** Negative Drik Bala values are preserved without artificial floor clamping.
- **No Fallbacks:** Incomplete data strictly results in `INCOMPLETE` aggregation status.

---

## 8. Integration with P-08 Kala Bala
Currently, `completeKalaBala` is `undefined` pending complete wiring of all temporal subcomponents (Ayana Bala, Tribhaga Bala, etc.).
Once complete Kala Bala is wired, the aggregator will automatically produce `COMPLETE` status and populate `calculatedTotal` across all classical planets without architectural changes.
