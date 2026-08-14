# P-09 Cheshta Bala (Motional Strength) Specification

## 1. Overview
Cheshta Bala is the motional strength component of the classical Shadbala (Sixfold Planetary Strength) engine in Vedic astrology.
It assesses the strength a planet acquires due to its relative speed and elongation with respect to its Sheeghrochcha (fast apex / apex of speed), reflecting the observational dynamics of planetary retrograde, stationary, and direct motion cycles.

---

## 2. Astronomical Reference Frame: Single Canonical Sidereal Epoch

### 2.1 Elimination of Legacy Hybrid Framework
The computation operates strictly within a single canonical sidereal reference frame anchored at the 1900.0 epoch (`1900-01-01T00:00:00Z`, Julian Day 2415020.5).
All mean longitudes and Sheeghrochcha values are computed directly from sidereal epoch constants and mean daily sidereal motion rates:
$$\text{siderealMean} = \text{normalizeDegree}(\text{base} + \text{rate} \times \text{elapsedDays})$$

This completely eliminates the legacy hybrid methodology that computed tropical mean longitudes and subsequently subtracted Lahiri ayanamsa.

### 2.2 Canonical 1900-Epoch Sidereal Constants
Stored in the frozen `EPOCH_MEAN_LONGITUDE` and `MEAN_LONGITUDE_RATES` maps:

| Planet | 1900.0 Sidereal Base Longitude | Mean Daily Sidereal Rate (°/day) |
|---|---|---|
| **SUN** | $257.4568^\circ$ | $0.98564736^\circ$ |
| **MARS** | $270.2200^\circ$ | $0.52403295^\circ$ |
| **JUPITER** | $220.0400^\circ$ | $0.08309121^\circ$ |
| **SATURN** | $236.7400^\circ$ | $0.03345973^\circ$ |

---

## 3. Canonical Formulations for Planetary Roles

### 3.1 Exterior Planets (Mars, Jupiter, Saturn)
- **Mean Longitude ($\bar{\lambda}$):** Planet's own sidereal mean longitude computed from its canonical 1900 base and daily rate.
- **Sheeghrochcha ($S$):** The Sun's sidereal mean longitude.

### 3.2 Interior Planets (Mercury, Venus)
- **Mean Longitude ($\bar{\lambda}$):** Tied directly to the Sun's sidereal mean longitude ($\bar{\lambda}_{\text{Mercury}} = \bar{\lambda}_{\text{Venus}} = \bar{\lambda}_{\text{Sun}}$).
- **Sheeghrochcha ($S$):** Evaluated using a consistent linear daily rate formula without mixed secular-$t$ polynomial terms:
  - **Mercury Sheeghrochcha:** $\text{normalizeDegree}(164.0^\circ + 4.09233443^\circ \times \text{elapsedDays})$
  - **Venus Sheeghrochcha:** $\text{normalizeDegree}(328.51^\circ + 1.60213047^\circ \times \text{elapsedDays})$

### 3.3 Sun and Moon Special Rules
- **Sun:** By classical rule (Surya Siddhanta / Brihat Parashara Hora Shastra), the Sun does not possess planetary Cheshta Bala. Its motional strength is substituted by its **Ayana Bala** (declination strength).
- **Moon:** The Moon's motional strength is substituted by its **Paksha Bala** (lunar phase strength).

### 3.4 Lunar Nodes (Rahu and Ketu)
- Nodes do not have Cheshta Bala in standard Shadbala calculations.
- Status is returned as `NOT_IMPLEMENTED`.
- In `cheshtaAstronomy.ts`, querying `MOON`, `RAHU`, or `KETU` throws an explicit Error (`Cheshta astronomy is not defined for <planet>`).

---

## 4. Cheshta Kendra & Bala Mathematics

### 4.1 Low-Level Helper: `calculateCheshtaBalaFromLongitudes`
The pure mathematical helper calculates the Cheshta Kendra and base Cheshta Bala directly from longitudes:

1. **Average Longitude ($\lambda_{\text{avg}}$):**
   $$\lambda_{\text{avg}} = \text{normalizeDegree}\left(\frac{\bar{\lambda} + \lambda_{\text{true}}}{2}\right)$$
2. **Cheshta Kendra ($K$):**
   $$K = \text{normalizeDegree}(S - \lambda_{\text{avg}})$$
3. **Reduced Cheshta Kendra ($K_{\text{reduced}}$):**
   $$K_{\text{reduced}} = \begin{cases} 360^\circ - K & \text{if } K > 180^\circ \\ K & \text{if } K \le 180^\circ \end{cases}$$
4. **Cheshta Bala Value ($V$):**
   $$V = \frac{K_{\text{reduced}}}{3} \quad (V \in [0, 60] \text{ Shastiamsas})$$

---

## 5. Motion State: Evidence-Only Governance

Planetary motion status (`RETROGRADE`, `STATIONARY`, `DIRECT`) is preserved as observational evidence and diagnostic metadata.
Under no circumstances does motion state override or short-circuit the mathematical calculation to a fixed 60.0 value. Cheshta Bala is strictly derived from the reduced Cheshta Kendra formula $K_{\text{reduced}} / 3$.

---

## 6. Validation & Regression Safeguards
- **1900 Epoch Constants:** Verified at `1900-01-01T00:00:00Z` against canonical sidereal base values.
- **Kendra Math Assertions:**
  - $K = 0^\circ \rightarrow V = 0$
  - $K = 180^\circ \rightarrow V = 60$
  - $K = 280^\circ \rightarrow K_{\text{reduced}} = 80^\circ \rightarrow V = 26.67$
  - Circular wrap-around angles correctly resolved.
- **Node Rejection:** `calculateCheshtaAstronomy` throws for `MOON`, `RAHU`, and `KETU`.
