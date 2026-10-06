# P2-08B: Dasha Activation (C9)

## Overview

P2-08B implements the Career Dasha activation layer (C9) that determines whether and how active Vimshottari Dasha periods (MD/AD/PD) activate career promise established in the natal chart. C9 consumes natal career analysis (C5-C8) and active Dasha timing from the canonical Vimshottari engine to produce activation effects (ACTIVATES, CHALLENGES, PARTIALLY_ACTIVATES, DOES_NOT_ACTIVATE, INSUFFICIENT_DATA).

## IMPLEMENTED — VERIFICATION PENDING

## Core Responsibilities

1. **Vimshottari Timing Consumption**
   - Consumes active MD/AD/PD from `engine/dasha/vimshottari.ts getActiveDasha()` output
   - Preserves planet + start + end verbatim from the canonical Vimshottari engine
   - Verified: `horoscope.dashaInterpretation.current` is populated by `engine/astroEngine.ts` via `analyzeActiveDasha()` which calls `getActiveDasha()`

2. **Planet Context Building**
   - Builds relevance and condition maps from natal analysis (C5/C6/C7)
   - Builds expressions-by-planet map from C8 expression analysis
   - Iterates planets in canonical order (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu)
   - Skips planets with no C5 relevance (missing evidence is not negative evidence)
   - Preserves C6 UNAVAILABLE condition (never coerces to WEAK/NEUTRAL/CHALLENGE)
   - Sorts relatedHouses numerically and relatedPlanets by canonical order

3. **Activation Resolution**
   - Resolves activation direction (SUPPORT, CHALLENGE, MIXED, NEUTRAL, UNAVAILABLE) based on relevance, condition, and expressions
   - Resolves activation effect (ACTIVATES, CHALLENGES, PARTIALLY_ACTIVATES, DOES_NOT_ACTIVATE, INSUFFICIENT_DATA) based on structural promise and planetary activation
   - Resolves activation strength (VERY_STRONG, STRONG, MODERATE, WEAK, VERY_WEAK, UNDETERMINED) based on condition and direction
   - Produces frozen activation objects with evidence arrays

4. **Evidence Generation**
   - Generates canonical evidence keys in format: `level:planet:role:direction:id` (positional, no sorting)
   - Emits evidence rows for STRUCTURAL, PLANETARY_RELEVANCE, PLANETARY_CONDITION, EXPRESSION, TIMING, ACTIVATION
   - PLANETARY_CONDITION row includes `direction: 'CHALLENGE'` when `doesPlanetChallengeCareerPromise()` is true
   - Populates `challengedPromiseEvidenceIds` from PLANETARY_CONDITION evidence with direction: 'CHALLENGE'
   - Populates `activatedPromiseEvidenceIds` from PLANETARY_RELEVANCE and PLANETARY_CONDITION evidence indicating promise activation
   - Populates `expressionEvidenceIds` from real C8 expression evidence IDs
   - Uses `relatedPlanetIds` (not `relationshipIds`) to carry related planet names from planet context

5. **Evidence Gap Documentation**
   - `relevanceEvidenceIds` and `conditionEvidenceIds` are empty pending upstream evidence-ID exposure
   - C6 (CareerPlanetaryRelevance) and C7 (CareerPlanetaryCondition) do not currently expose individual evidence IDs
   - These fields are reserved for future W1 work that establishes a root evidence tree structure
   - Evidence IDs are never fabricated via string matching or other heuristics

## Key Invariants

1. **No New Career Promise**
   - C9 may activate existing career promise but never creates new promise
   - Activation is conditional on established structural promise from natal analysis

2. **Canonical Evidence Keys**
   - Evidence keys use positional format: `level:planet:role:direction:id`
   - No sorting or deduplication of key segments
   - Ensures deterministic key generation

3. **Deep Freeze**
   - All activation objects and nested arrays are frozen
   - Ensures immutability of activation results

4. **Planet Context Isolation**
   - Each planet has independent evidence
   - Changing one Dasha level does not affect others

## Exports

Key helpers exported through `careerDasha/index.ts`:

- `createCanonicalEvidenceKey` - Generates canonical evidence keys
- `assertDeepFrozen` - Verifies deep immutability
- `resolveCareerDashaPlanetDirection` - Resolves activation direction
- `isCareerDashaRelevant` - Checks if planet is career-relevant
- `isCareerDashaConditionUsable` - Checks if condition is usable
- `isCareerDashaConditionSupportive` - Checks if condition is supportive
- `hasEstablishedCareerPromise` - Checks if career promise is established
- `doesPlanetActivateCareerPromise` - Checks if planet activates promise
- `doesPlanetChallengeCareerPromise` - Checks if planet challenges promise
- `resolveCareerDashaStrength` - Resolves activation strength

## Testing

Golden tests in `careerDashaActivation.test.ts`:

- Test 1: No career promise → INSUFFICIENT_DATA
- Test 2: Primary lord activates
- Test 3: Natural Karaka alone does NOT activate (golden C6 guardrail)
- Test 4: Challenging relevant planet → CHALLENGES
- Test 5: MD-support + AD-challenge → PARTIALLY_ACTIVATES
- Test 6: MD-challenge + AD-support → PARTIALLY_ACTIVATES
- Test 7: MD+AD support → ACTIVATES
- Test 8: PD challenge refines (dominantLevel AD, PARTIALLY_ACTIVATES)
- Test 9: Missing planet context → INSUFFICIENT_DATA/UNAVAILABLE
- Test 10: Only C8 expressions activate
- Test 11: CONDITIONAL stays conditional
- Test 12: Deterministic ordering (toEqual on repeat)
- Test 13: Frozen outputs
- Test 14: Canonical Dasha dates preserved
- Test 15: Changing MD planet changes result
- Test 16: Canonical hierarchy invariants
- Test 17: PRIMARY-relevant STRONG-condition planet activates without C8 expression
- Test 18: P2-08B Golden Tests - Evidence IDs and Deep Freeze
  - active is false when effect is INSUFFICIENT_DATA
  - active is true when planet activates career promise
  - expressionEvidenceIds carries real C8 evidence IDs
  - CONDITIONAL expression never produces ACTIVATES effect (§25 invariant)
  - evidence objects include new fields: level, relatedPlanetIds, relevanceEvidenceIds, conditionEvidenceIds, expressionEvidenceIds, activationRuleIds, sourceIds
  - canonical evidence key format is level:planet:role:direction:id
  - deep freeze: all objects and nested arrays are frozen
  - planet-evidence isolation: each planet has independent evidence
  - MD/AD/PD independence: changing one level does not affect others
  - AFFLICTED challenger planet populates challengedPromiseEvidenceIds

## Type Changes

- Renamed `relationshipIds` to `relatedPlanetIds` in `CareerDashaActivationEvidence` to accurately reflect that these are planet names, not relationship provenance IDs
- Updated all references in activation logic and tests
