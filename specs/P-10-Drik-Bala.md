# P-10 Drik Bala (Aspectual Strength) Specification

## 1. Overview
Drik Bala (Aspectual Strength) is the sixth major component of the classical Shadbala (Sixfold Planetary Strength) engine in Vedic astrology.
It quantifies the cumulative strength a planet receives or loses through the continuous geometric aspects (Sphuta Drishti) cast upon it by the other classical planets, rectified according to the natural benefic or malefic disposition of the aspecting grahas.

---

## 2. Scope & Seven-Graha Policy
- **Classical Seven Grahas:** Drik Bala is strictly computed for the seven classical planets: `SUN`, `MOON`, `MARS`, `MERCURY`, `JUPITER`, `VENUS`, and `SATURN`.
- **Lunar Nodes (Rahu and Ketu):**
  - Rahu and Ketu do not possess Drik Bala in canonical Shadbala.
  - When evaluated as target planets, their status is returned as `NOT_IMPLEMENTED` with no numeric value and an empty contributions array.
  - Nodes never cast numeric aspectual contributions onto other planets.
  - Rahu and Ketu participate solely as condition modifiers for Mercury's natural benefic/malefic classification when occupying the same whole-sign house.

---

## 3. Sphuta Drishti Geometry & Formulas

### 3.1 Directional Aspect Angle
Aspect angle $\theta$ is directional from source planet to target planet:
$$\theta = \text{normalizeDegree}(\lambda_{\text{target}} - \lambda_{\text{source}})$$
where $\theta \in [0, 360)^\circ$.

### 3.2 General Saravali Aspect Curve (Default Planets)
Default planets (`SUN`, `MOON`, `MERCURY`, `VENUS`) follow the continuous classical Saravali piecewise curve across half-open intervals $[0, 30), [30, 60), \dots, [330, 360)^\circ$:

| Interval | Drishti Value ($V$) Formula | Endpoint Values |
|---|---|---|
| $[0, 30)^\circ$ | $0$ | at $0^\circ \to 0$ |
| $[30, 60)^\circ$ | $\frac{\theta - 30}{2}$ | at $30^\circ \to 0$, as $\theta \to 60^\circ \to 15$ |
| $[60, 90)^\circ$ | $\theta - 45$ | at $60^\circ \to 15$, as $\theta \to 90^\circ \to 45$ |
| $[90, 120)^\circ$ | $30 + \frac{120 - \theta}{2}$ | at $90^\circ \to 45$, as $\theta \to 120^\circ \to 30$ |
| $[120, 150)^\circ$ | $150 - \theta$ | at $120^\circ \to 30$, as $\theta \to 150^\circ \to 0$ |
| $[150, 180)^\circ$ | $2 \times (\theta - 150)$ | at $150^\circ \to 0$, as $\theta \to 180^\circ \to 60$ |
| $[180, 300)^\circ$ | $\frac{300 - \theta}{2}$ | at $180^\circ \to 60$, at $210^\circ \to 45$, at $240^\circ \to 30$, at $270^\circ \to 15$, as $\theta \to 300^\circ \to 0$ |
| $[300, 360)^\circ$ | $0$ | at $300^\circ \to 0$, at $330^\circ \to 0$ |

### 3.3 Special Planetary Overrides
- **Mars (Special 4th and 8th House Aspects):**
  - $[90, 120)^\circ$: $45 + \frac{\theta - 90}{2}$ (at $90^\circ \to 45$, at $120^\circ \to 60$)
  - $[120, 150)^\circ$: $2 \times (150 - \theta)$ (at $120^\circ \to 60$, at $150^\circ \to 0$)
  - $[180, 210)^\circ$: $60$ (full aspect throughout $[180, 210)$)
  - $[210, 240)^\circ$: $270 - \theta$ (at $210^\circ \to 60$, at $240^\circ \to 30$)
  - All other intervals: general Saravali curve.

- **Jupiter (Special 5th and 9th House Aspects):**
  - $[90, 120)^\circ$: $45 + \frac{\theta - 90}{2}$ (at $90^\circ \to 45$, at $120^\circ \to 60$)
  - $[120, 150)^\circ$: $2 \times (150 - \theta)$ (at $120^\circ \to 60$, at $150^\circ \to 0$)
  - $[210, 240)^\circ$: $45 + \frac{\theta - 210}{2}$ (at $210^\circ \to 45$, at $240^\circ \to 60$)
  - $\theta = 240^\circ$: $60$ (peak 9th aspect)
  - $(240, 270)^\circ$: $15 + \frac{2 \times (270 - \theta)}{3}$ (at $270^\circ \to 15$)
  - All other intervals: general Saravali curve.

- **Saturn (Special 3rd and 10th House Aspects):**
  - $[30, 60)^\circ$: $(\theta - 30) \times 2$ (at $30^\circ \to 0$, at $60^\circ \to 60$)
  - $[60, 90)^\circ$: $45 + \frac{90 - \theta}{2}$ (at $60^\circ \to 60$, at $90^\circ \to 45$)
  - $[210, 240)^\circ$: $45 + \frac{\theta - 210}{2}$ (at $210^\circ \to 45$, at $240^\circ \to 60$)
  - $[240, 270)^\circ$: $\theta - 210$ (at $240^\circ \to 30$, at $270^\circ \to 60$)
  - $[270, 300)^\circ$: $2 \times (300 - \theta)$ (at $270^\circ \to 60$, at $300^\circ \to 0$)
  - $[300, 330)^\circ$: $0$
  - All other intervals: general Saravali curve.

---

## 4. Natural Benefic / Malefic Classification & Rectification

### 4.1 Natural Classification Rules
Drik Bala strictly adheres to natural (Naisargika) planetary nature, completely decoupled from functional nature or lordship:
1. **Jupiter and Venus:** Always `BENEFIC`.
2. **Sun, Mars, and Saturn:** Always `MALEFIC`.
3. **Moon:**
   - Evaluated by phase elongation: $\text{phase} = \text{normalizeDegree}(\lambda_{\text{Moon}} - \lambda_{\text{Sun}})$.
   - If $0 < \text{phase} < 180^\circ$ (waxing / Shukla Paksha), classified as `BENEFIC`.
   - Otherwise (waning / Krishna Paksha, exact new moon $\text{phase} = 0$, or full moon boundary $\text{phase} = 180^\circ$), classified as `MALEFIC`.
4. **Mercury:**
   - Classified as `BENEFIC` unless conjunct with any natural malefic.
   - Evaluated by whole-sign house conjunction: if Mercury shares the same house with `SUN`, `MARS`, `SATURN`, `RAHU`, or `KETU`, it is classified as `MALEFIC`.

### 4.2 Rectification Factors
Aspects cast by natural benefics increase the target planet's strength, while aspects cast by natural malefics decrease it:
- **Benefic Aspect:** $\text{Rectification Factor} = 1.25$ (+25% / 125% of raw Sphuta Drishti)
- **Malefic Aspect:** $\text{Rectification Factor} = 0.75$ (-25% / 75% of raw Sphuta Drishti)

*Note:* Rectified aspect values are not capped at 60 (e.g. a full 60 Shastiamsa aspect from Jupiter rectifies to $60 \times 1.25 = 75.00$ Shastiamsas).

---

## 5. Net Drik Bala Calculation
For each classical target planet:
1. Iterate over all other six classical planets as sources (skip source = target).
2. Calculate raw Sphuta Drishti $V$. If $V = 0$, omit contribution.
3. Determine source natural classification and apply rectification factor:
   $$\text{Rectified Drishti} = V \times \text{Factor}$$
4. Accumulate totals:
   $$\text{Benefic Total} = \sum \text{Rectified Benefic Aspects}$$
   $$\text{Malefic Total} = \sum \text{Rectified Malefic Aspects}$$
5. Net Drik Bala is the algebraic difference:
   $$\text{Drik Bala} = \text{Benefic Total} - \text{Malefic Total}$$
6. **Unboundedness:** Drik Bala is not clamped to zero and not capped at $\pm 60$. When malefic aspects dominate, Drik Bala is negative. The final public value is rounded to 2 decimal places.

---

## 6. Evidence Contract & Immutability
- Each contribution is recorded with source and target longitudes, aspect angle, raw Sphuta Drishti, natural classification, rectification factor, rectified value, rule ID, and explanatory mathematical reasoning.
- All returned objects, arrays, and evidence containers are deeply frozen with `Object.freeze`.
- Inputs (`planetFacts`) are strictly immutable and never mutated.

---

## 7. Integration with Complete Shadbala Engine
- Integrated into `src/engine/planetaryStrength/planetaryStrength.ts` under `ShadbalaComponent.DRIK_BALA` and `ShadbalaSubcomponent.DRIK_BALA`.
- Independent of Sthana Bala subcomponent aggregation (P-07).
- Total Shadbala aggregation remains `undefined` pending final total integration policy.
