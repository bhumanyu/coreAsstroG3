# P-07 Complete Sthana Bala Specification

## Overview

P-07 completes the **Sthana Bala** (Positional Strength) component of Shadbala for the D1/Rasi chart based on classical Parashari principles. It extends the foundation established in P-06 by adding four new subcomponents—Saptavargaja Bala, Oja-Yugma Bala, Kendradi Bala, and Drekkana Bala—reusing the existing Uchcha Bala, and aggregating a complete Sthana Bala total.

> **Note on Scope**: P-07 completes Sthana Bala. P-07 does NOT complete Shadbala; total Shadbala (`calculatedTotal`) remains `undefined` because Kala Bala, Cheshta Bala, and Drik Bala remain unimplemented.

---

## 1. Subcomponents & Point Ladders

Sthana Bala consists of five subcomponents measured in **Shastiamsas** (1/60th of a Rupa):

### 1.1 Uchcha Bala (`SHADBALA_UCHCHA_BALA_001`)
- **Formula**: Angular distance in degrees from planet's debilitation point divided by 3 (Range: 0 to 60 Shastiamsas).
- Reused directly from P-06.

### 1.2 Saptavargaja Bala (`SHADBALA_SAPTAVARGAJA_BALA_001`)
Evaluates dignity/friendship across **exactly seven divisional charts (vargas)**:
- **Included Vargas**: D1 (Rasi), D2 (Hora), D3 (Drekkana), D7 (Saptamsa), D9 (Navamsa), D12 (Dwadasamsa), D30 (Trimsamsa).
- **Explicit Exclusion**: D10 (Dasamsa) is strictly excluded from Saptavargaja Bala.
- **Point Ladder per Varga**:
  - Moolatrikona: 45.0 Shastiamsas
  - Own Sign (Swakshetra): 30.0 Shastiamsas
  - Great Friend (Ati Mitra): 22.5 Shastiamsas
  - Friend (Mitra): 15.0 Shastiamsas
  - Neutral (Sama): 7.5 Shastiamsas
  - Enemy (Shatru): 3.75 Shastiamsas
  - Great Enemy (Ati Shatru): 1.875 Shastiamsas
- **Moolatrikona Note**: Only the D1 chart evaluates degree-bounded Moolatrikona status (reusing P-03 `PlanetFacts.dignity`). For sign-only divisional charts (D2–D30), a Moolatrikona-sign match is evaluated as Own Sign (30.0 Shastiamsas) since exact degree sub-ranges are not resolved at the sign level.
- **Compound Relationship (Panchadha Maitri)**: Friendship in non-owned varga signs combines Natural Relationship (Friend/Neutral/Enemy) with Temporal Relationship (Tatkalika Friend if placed in 2nd, 3rd, 4th, 10th, 11th, or 12th house relative to the varga sign's ruler in that varga, else Temporal Enemy).

### 1.3 Oja-Yugma Bala (`SHADBALA_OJA_YUGMA_BALA_001`)
Evaluates sign parity preference in Rasi (D1) and Navamsa (D9):
- **Odd-preferring group** (Sun, Mars, Jupiter, Mercury, Saturn):
  - +15 Shastiamsas if Rasi sign is Odd (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius).
  - +15 Shastiamsas if Navamsa sign is Odd.
- **Even-preferring group** (Moon, Venus):
  - +15 Shastiamsas if Rasi sign is Even (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces).
  - +15 Shastiamsas if Navamsa sign is Even.
- **Total Range**: 0, 15, or 30 Shastiamsas.

### 1.4 Kendradi Bala (`SHADBALA_KENDRADI_BALA_001`)
Evaluates house position strength in the D1 Rasi chart:
- **Kendra Houses** (1, 4, 7, 10): 60 Shastiamsas.
- **Panapara Houses** (2, 5, 8, 11): 30 Shastiamsas.
- **Apoklima Houses** (3, 6, 9, 12): 15 Shastiamsas.

### 1.5 Drekkana Bala (`SHADBALA_DREKKANA_BALA_001`)
Evaluates 10° Drekkana placement within the D1 sign (`degreesWithinSign = normalizeDegree(longitude) % 30`):
- **Drekkana 1** (0° to <10°): Preferred by **Male planets** (Sun, Mars, Jupiter) -> 15 Shastiamsas if matched, else 0.
- **Drekkana 2** (10° to <20°): Preferred by **Neutral planets** (Mercury, Saturn) -> 15 Shastiamsas if matched, else 0.
- **Drekkana 3** (20° to <30°): Preferred by **Female planets** (Moon, Venus) -> 15 Shastiamsas if matched, else 0.

---

## 2. Sthana Bala Aggregation (`SHADBALA_STHANA_BALA_001`)

When all five subcomponents (`UCHCHA_BALA`, `SAPTAVARGAJA_BALA`, `OJA_YUGMA_BALA`, `KENDRADI_BALA`, `DREKKANA_BALA`) are `CALCULATED` for a planet:
- `sthanaBalaTotal = uchchaBala + saptavargajaBala + ojaYugmaBala + kendradiBala + drekkanaBala`
- Unit: `SHASTIAMSA`
- Public value is formatted to 2 decimal places (`Number(x.toFixed(2))`).
- An aggregate component and evidence record are emitted.

If any required subcomponent is `NOT_IMPLEMENTED` (e.g., for Rahu and Ketu), no partial aggregate total is emitted.

---

## 3. Rahu / Ketu Policy

- **Kendradi Bala**: `CALCULATED` (pure house-based calculation: 60, 30, or 15 Shastiamsas).
- **Uchcha, Saptavargaja, Oja-Yugma, Drekkana Bala**: Marked `NOT_IMPLEMENTED` with clear explanation reasons.
- **Dig Bala & Naisargika Bala**: Marked `NOT_IMPLEMENTED` (retained from P-06).
- **Sthana Bala Aggregate**: `undefined` / omitted for nodes.

---

## 4. Rule IDs

- `SHADBALA_UCHCHA_BALA_001`
- `SHADBALA_SAPTAVARGAJA_BALA_001`
- `SHADBALA_OJA_YUGMA_BALA_001`
- `SHADBALA_KENDRADI_BALA_001`
- `SHADBALA_DREKKANA_BALA_001`
- `SHADBALA_STHANA_BALA_001`
- `SHADBALA_DIG_BALA_001`
- `SHADBALA_NAISARGIKA_BALA_001`
