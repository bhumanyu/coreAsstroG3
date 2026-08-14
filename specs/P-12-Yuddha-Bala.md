# P-12 Yuddha Bala (Planetary War Detection) Specification

## 1. Overview
Yuddha Bala (Planetary War) occurs when two planetary bodies meet in close proximity within ecliptic longitude.
In classical Vedic astrology, Yuddha Bala applies exclusively to the five non-luminary star planets: **Mars, Mercury, Jupiter, Venus, Saturn**.
Sun, Moon, Rahu, and Ketu do not participate in Yuddha Bala.

The numerical distribution of Yuddha Bala points requires a validated winner/loser determination rule and astronomical disc-diameter (Bimba Parimana) data. Because no canonical consensus or validated disc-diameter dataset exists, numerical point transfer is **explicitly deferred**.

This module implements **deterministic war detection, pairing, and evidence generation** without fabricating unverified point transfers or declaring arbitrary winners.

---

## 2. Applicability Matrix

| Body | Yuddha Bala Applicability | Status |
| :--- | :--- | :--- |
| **Mars, Mercury, Jupiter, Venus, Saturn** | Applicable | `NOT_IMPLEMENTED` (detection & evidence populated; numerical value `undefined`) |
| **Sun, Moon, Rahu, Ketu** | Non-Applicable | `NOT_APPLICABLE` |

---

## 3. Planetary War Detection Rule

For all 10 unique pairs among the 5 applicable planets:
$$\text{raw} = (|\lambda_A - \lambda_B|) \bmod 360^\circ$$
$$\text{separation} = \min(\text{raw}, 360^\circ - \text{raw})$$

War condition (half-open interval):
$$\text{isYuddha} = 0^\circ < \text{separation} < 1^\circ$$

- **Exact $0^\circ$ separation:** `isYuddha = false` (`ruleId: 'YUDDHA_BALA_NO_WAR'`)
- **Separation $\ge 1^\circ$:** `isYuddha = false` (`ruleId: 'YUDDHA_BALA_NO_WAR'`)
- **Separation $0.0001^\circ$ to $0.9999^\circ$:** `isYuddha = true` (`ruleId: 'YUDDHA_BALA_001'`)

---

## 4. Subcomponent and Evidence Rules

1. **Applicable Planets (Mars, Mercury, Jupiter, Venus, Saturn):**
   - **Subcomponent Status:** `StrengthComponentStatus.NOT_IMPLEMENTED`
   - **Value:** `undefined`
   - **Rule ID:** `YUDDHA_BALA_001` if participating in a war, `YUDDHA_BALA_NO_WAR` if no war detected, or `SHADBALA_YUDDHA_BALA_NOT_IMPLEMENTED` if yuddha report omitted.
   - **Evidence:** Contains inputs with `opponent`, `separation`, `longitude`, `opponentLongitude` for each detected war pair.

2. **Non-Applicable Planets (Sun, Moon, Rahu, Ketu):**
   - **Subcomponent Status:** `StrengthComponentStatus.NOT_APPLICABLE`
   - **Value:** `undefined`
   - **Rule ID:** `YUDDHA_BALA_NOT_APPLICABLE`
   - **Reason:** Body is outside classical planetary war scope.

---

## 5. Integration with Kala Bala & Shadbala (P-11)

- Yuddha Bala evidence is attached to the Kala Bala subcomponents list under subcomponent `YUDDHA_BALA`.
- Because numerical Yuddha Bala is deferred, `completeKalaBala` remains `undefined` on `PlanetaryStrength`.
- `completeShadbala` and `calculatedTotal` remain `undefined`, ensuring P-11 aggregation status stays `INCOMPLETE` for production charts.
