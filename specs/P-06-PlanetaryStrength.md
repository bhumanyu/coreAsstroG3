# P-06: Planetary Strength (Shadbala Foundation) Layer

## 1. Scope & Design Philosophy

P-06 implements a deterministic planetary-strength layer for the D1/Rasi chart based on classical Parashari principles. This module serves as a foundational component for planetary strength evaluation.

### Inputs
P-06 depends solely on `PlanetFacts` (ecliptic longitude and whole-sign house position for each planet) plus static canonical strength tables (debilitation points, directional strength houses, and fixed natural strength values). It does not depend on `planetAnalysis`, `houseAnalysis`, `functionalNature`, `houseLordship`, yoga, dasha, or transit layers.

In P-06, only three classical subcomponents are implemented:
1. **Uchcha Bala** (subcomponent of Sthana Bala)
2. **Dig Bala** (Directional Strength)
3. **Naisargika Bala** (Natural Strength)

### Explicit Non-Goal & Limitations
- **NOT Full Shadbala**: This layer does NOT compute full Shadbala. Other subcomponents of Sthana Bala (Saptavargiya, Ojhayugmarasi, Kendra, Drekkana Bala) and other main components (Kala Bala, Cheshta Bala, Drik Bala) are NOT implemented.
- **No Calculated Total**: `calculatedTotal` is intentionally kept `undefined`. Summing partial components without full Shadbala produces misleading metrics.
- **No Ranking / Percentages / Interpretation**: P-06 provides raw, deterministic values in Shastiamsa units only.

---

## 2. Implemented Components & Formulas

All values are expressed in **Shastiamsa** units (where 60 Shastiamsas = 1 Rupa).

### 2.1 Uchcha Bala (`STHANA_BALA` / `UCHCHA_BALA`)
- **Rule ID**: `SHADBALA_UCHCHA_BALA_001`
- **Formula**:
  $$\text{Angular Distance} = \text{circularDistance}(\text{Planet Longitude}, \text{Debilitation Longitude})$$
  $$\text{Uchcha Bala} = \frac{\text{Angular Distance}}{3}$$
- **Range**: $0.00$ to $60.00$ Shastiamsas.
  - At debilitation point ($\text{distance} = 0^\circ$): Strength = $0.00$.
  - At exaltation point ($\text{distance} = 180^\circ$): Strength = $60.00$.
  - At midpoint ($\text{distance} = 90^\circ$): Strength = $30.00$.
- **Precision**: Rounded to 2 decimal places in public output (`Number(value.toFixed(2))`).

### 2.2 Dig Bala (`DIG_BALA` / `DIG_BALA`)
- **Rule ID**: `SHADBALA_DIG_BALA_001`
- **Directional Strength Houses**:
  - Jupiter, Mercury: House 1 (Lagna)
  - Sun, Mars: House 10 (10th House)
  - Moon, Venus: House 4 (4th House)
  - Saturn: House 7 (7th House)
- **Weak Point**: The house opposite to the directional strength house ($\text{Weak House} = (\text{Strength House} + 5) \bmod 12 + 1$).
- **Formula**:
  $$\text{House Distance} = \min(\text{offsetFromWeak}, 12 - \text{offsetFromWeak})$$
  $$\text{Dig Bala} = \frac{\text{House Distance}}{6} \times 60$$
- **Range**: $0.00$ to $60.00$ Shastiamsas.

### 2.3 Naisargika Bala (`NAISARGIKA_BALA` / `NAISARGIKA_BALA`)
- **Rule ID**: `SHADBALA_NAISARGIKA_BALA_001`
- **Fixed Values (Classical Table)**:
  - Sun: $60.00$
  - Moon: $51.43$
  - Venus: $42.86$
  - Jupiter: $34.29$
  - Mercury: $25.71$
  - Mars: $17.14$
  - Saturn: $8.57$

---

## 3. Rahu / Ketu Policy

The lunar nodes (Rahu and Ketu) are handled conservatively:
- **Dig Bala & Naisargika Bala**: Marked as `NOT_IMPLEMENTED`. The current repository does not adopt a validated canonical rule for Rahu/Ketu Dig Bala or Naisargika Bala. P-06 therefore leaves these values unimplemented rather than selecting a disputed tradition.
- **Uchcha Bala**: Marked as `NOT_IMPLEMENTED`. Although traditional extensions assign exaltation/debilitation signs to Rahu and Ketu, these are non-classical extensions and are excluded to avoid fabricating non-standard Shadbala values.
- **Value Assignment**: Values for Rahu/Ketu remain `undefined` with `status: NOT_IMPLEMENTED`. They are never assigned 0.

---

## 4. Non-Implemented Components

The following components are marked as `NOT_IMPLEMENTED` with `status: NOT_IMPLEMENTED` and `value: undefined`:
- `KALA_BALA`
- `CHESHTA_BALA`
- `DRIK_BALA`

Reason: Outside the P-06 implemented scope.
