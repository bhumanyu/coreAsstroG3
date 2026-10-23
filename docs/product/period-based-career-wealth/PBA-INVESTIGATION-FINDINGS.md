# PBA Investigation Findings - Bhu Chart (May 8 1988)

**Date:** 2026-10-22
**Chart:** Bhu (1988-05-08T09:30:00+05:30, Patna, India)
**Period Tested:** MOON MD → MOON AD (first selectable period in timeline as of analysisAsOf 2026-01-01T00:00:00Z)
**Investigation Method:** Programmatic analysis using the period-based activation engine (deleted investigation test artifact)

---

## Executive Summary

The investigation confirms that the Career and Wealth issues are genuine engine coverage gaps, not rendering bugs:

1. **Career**: Pattern classification detects `CAREER_HOUSE_NETWORK` but `CAREER_MECHANISM_RESOLUTION_RULES` has no rule for this family, resulting in empty `resolvedMechanisms`.
2. **Wealth**: ACCUMULATION has no natal promise evidence (house 2 promise not generated). FORTUNE and SPECULATION have promise evidence but the conservative house-only linkage rule fails because the dasha lord (Moon) does not touch houses 9 or 5.
3. **Wealth Defect**: GAINS shows `insufficientReason: LINKED` but `effect: UNKNOWN`, a contradiction where a linked dimension does not receive a determinate effect. This is an open defect requiring investigation into the wealth dimension activation logic.

---

## Career Findings

### Pattern Detection
- **Total pattern candidates:** 1
- **Pattern family detected:** `CAREER_HOUSE_NETWORK`
- **Pattern ID:** `CAREER_PATTERN:CAREER_HOUSE_NETWORK:CAREER_HOUSE_NETWORK:HOUSES:6,8,11:TOPOLOGY:STAR:RELATIONSHIPS:LORD_OF:PLANET:MARS→HOUSE:11|LORD_OF:PLANET:MARS→HOUSE:6`

### Mechanism Resolution
- **Total resolved mechanisms:** 0
- **Mechanism candidates:** none

### Root Cause
The `CAREER_HOUSE_NETWORK` pattern family has no corresponding rule in `CAREER_MECHANISM_RESOLUTION_RULES` (`src/domain/career/careerMechanism/resolver/careerMechanismResolverRules.ts`).

The pattern layer (C4/P2-03) successfully detects a career house network (houses 6, 8, 11 with Mars as lord of 11 and 6), but the mechanism resolution layer (P2-07D) cannot match this to a career mechanism because no rule exists for this pattern family.

### Required Fix (Priority 3)
Add mechanism-resolution rules for non-dusthana pattern families:
- `CAREER_HOUSE_NETWORK` → needs mechanism resolution rule
- `KENDRA_TRIKONA` → needs mechanism resolution rule
- `UPACHAYA_PROGRESSION` → needs mechanism resolution rule
- `PARIVARTANA_YOGA` → needs mechanism resolution rule
- `CAREER_YOGA_STRUCTURE` → needs mechanism resolution rule

Follow the existing rule shape (`applies`/`resolve`, canonical edge resolution via `hasCanonicalHousePairRelationship`, intersection invariant on `establishingRelationshipIds`). Gate each rule by real establishing edges to prevent false positives.

---

## Wealth Findings

### Dimension: ACCUMULATION (House 2)
- **Effect:** INSUFFICIENT_DATA
- **Insufficient reason:** NO_PROMISE_EVIDENCE
- **Promise evidence count:** 0
- **MD dasha rule count:** 0
- **AD dasha rule count:** 0
- **Promise evidence houses:** []
- **MD dasha houses:** []
- **AD dasha houses:** []

**Root Cause:** No natal promise evidence generated for house 2 (accumulation). The wealth theme interpreter (`interpretWealthTheme`) is not producing natal promise evidence for this dimension.

### Dimension: GAINS (House 11)
- **Effect:** UNKNOWN
- **Insufficient reason:** LINKED
- **Promise evidence count:** 4
- **MD dasha rule count:** 2
- **AD dasha rule count:** 2
- **Promise evidence houses:** [11, 2]
- **MD dasha houses:** [2, 8, 11]
- **AD dasha houses:** [2, 8, 11]

**Status:** OPEN DEFECT - Data Status COMPLETE but effect Insufficient/Unknown contradiction.

The dimension shows `insufficientReason: LINKED` (indicating linkage succeeded) but `effect: UNKNOWN` (indicating the dimension did not activate). This is contradictory: if linkage succeeded, the effect should be ACTIVATES, PARTIALLY_ACTIVATES, or CHALLENGES based on the dasha evidence polarity, not UNKNOWN.

This represents the "Data Status COMPLETE but effect Insufficient/Unknown" contradiction observed in the UI screenshot. The root cause is unknown and requires investigation into the wealth dimension activation logic to determine why LINKED dimensions are not being assigned a determinate effect.

### Dimension: FORTUNE (House 9)
- **Effect:** INSUFFICIENT_DATA
- **Insufficient reason:** PROMISE_NOT_LINKED
- **Promise evidence count:** 3
- **MD dasha rule count:** 0
- **AD dasha rule count:** 0
- **Promise evidence houses:** [9, 5]
- **MD dasha houses:** []
- **AD dasha houses:** []

**Root Cause:** Promise evidence exists for houses 9 and 5, but the dasha lord (Moon) does not touch these houses in the selected period. The conservative house-only linkage rule in `isLinkedToDimension` (line 152-168 of `selectedWealthDashaActivation.ts`) requires the dasha evidence to reference the actual house of the promise evidence. Moon's dasha evidence does not reference houses 9 or 5, so linkage fails.

### Dimension: SPECULATION (House 5)
- **Effect:** INSUFFICIENT_DATA
- **Insufficient reason:** PROMISE_NOT_LINKED
- **Promise evidence count:** 1
- **MD dasha rule count:** 0
- **AD dasha rule count:** 0
- **Promise evidence houses:** [5]
- **MD dasha houses:** []
- **AD dasha houses:** []

**Root Cause:** Same as FORTUNE. Promise evidence exists for house 5, but Moon's dasha evidence does not reference house 5, so the conservative house-only linkage fails.

### Open Defect: GAINS Effect Assignment

**Issue:** GAINS dimension shows `insufficientReason: LINKED` (linkage succeeded) but `effect: UNKNOWN` (no determinate effect assigned). This is a contradiction in the activation logic.

**Expected Behavior:** When `insufficientReason` is `LINKED`, the dimension should have a determinate effect (ACTIVATES, PARTIALLY_ACTIVATES, or CHALLENGES) based on the polarity of the linked dasha evidence.

**Actual Behavior:** The dimension remains in UNKNOWN state despite successful linkage.

**Impact:** This causes the "Data Status COMPLETE but effect Insufficient/Unknown" contradiction visible in the UI screenshot.

**Required Investigation:** Examine the wealth dimension activation logic in `evaluateSelectedWealthPeriodActivation` to determine why LINKED dimensions are not being assigned a determinate effect. This is separate from the linkage rule itself and may indicate a bug in the effect assignment logic.

---

### Resolution: GAINS Effect Assignment (PR Decision Record)

**Date:** 2026-10-23
**Resolution:** NOT A DEFECT — defined intermediate state

**Finding:** The LINKED dimension with only-NEUTRAL dasha evidence legitimately yields `effect: UNKNOWN`. This is not a contradiction — it is a defined intermediate state in the activation contract.

**Contract (from selectedWealthDashaActivation.ts resolveEffect, lines 183-203):**
- No evidence → INSUFFICIENT_DATA
- Neutral-only → UNKNOWN
- Support + challenge or MIXED → PARTIALLY_ACTIVATES
- Support only → ACTIVATES
- Challenge only → CHALLENGES

**Synthesis Layer Handling:**
The synthesis layer (`selectedPeriodSynthesis.ts`) already maps this state correctly:
- `effect: UNKNOWN` + `insufficientReason: LINKED` → `dataStatus: PARTIAL`
- Emits `WEALTH_DIMENSION_COMPLETE_BUT_INDETERMINATE` diagnostic

**Conclusion:** This is a valid intermediate state, not a defect. The system correctly identifies that a dimension has linkage but the linked evidence is neutral (neither supportive nor challenging), resulting in an indeterminate activation effect. This is semantically distinct from both "no linkage" and "determinate activation."

**Alternative Path:** If the domain owner decides that neutral-linked evidence should force a determinate effect (e.g., ACTIVATES), this would require a separate scoped PR to change the `resolveEffect` contract. The current behavior is intentional and well-documented.

---

## Wealth Linkage Rule Analysis

### Current Implementation (`isLinkedToDimension`)
The current linkage rule in `selectedWealthDashaActivation.ts` (lines 152-168) is **conservative**:

```typescript
function isLinkedToDimension(
  dashaEvidence: DashaInterpretationEvidence,
  dimension: WealthDimension,
  promiseEvidence: readonly DomainEvidence[]
): boolean {
  // Check house linkage: dasha evidence must reference the actual house of the promise evidence
  for (const promise of promiseEvidence) {
    if (promise.house !== undefined && dashaEvidence.houses?.includes(promise.house)) {
      return true;
    }
  }

  // Planet overlap alone is NOT sufficient for linkage
  return false;
}
```

**Key constraint:** Planet overlap alone is NOT sufficient for linkage. The dasha evidence must explicitly reference the house via the `houses` field.

### Investigation Finding
For the MOON MD → MOON AD period:
- Moon is the lord of house 4 (Cancer ascendant) in this chart
- Moon's dasha evidence does not reference houses 9 or 5
- Therefore, FORTUNE (house 9) and SPECULATION (house 5) fail linkage despite having promise evidence

### Required Fix Options (Priority 3)

**Option A (Conservative - document current behavior):**
- Keep the house-only linkage rule as-is
- Document this as the intentional contract
- Add clearer dimension diagnostics distinguishing "promise present but dasha lord does not touch the dimension's house" from true insufficiency
- Surface this as a design decision: the system requires explicit house linkage, not just planetary association

**Option B (Extend linkage rule):**
- Extend the linkage rule to include lord/karaka-based association
- If the dasha lord (Moon) owns or aspects the dimension's house, count as linkage
- If the dasha lord is the karaka for the dimension, count as linkage
- Per spec, this would allow lord/karaka-based linkage to activate dimensions

**Recommendation:** Coordinate with the domain owner to determine which option aligns with the Wealth spec and astrological intent.

---

## Next Steps (Priority 3)

### Career
1. Add mechanism-resolution rules in `src/domain/career/careerMechanism/resolver/careerMechanismResolverRules.ts` for:
   - `CAREER_HOUSE_NETWORK`
   - `KENDRA_TRIKONA` → `DHARMA_KARMA_ALIGNMENT`/`AUTHORITY_PATTERN`/`PROFESSIONAL_RISE_PATTERN`
   - `UPACHAYA_PROGRESSION`
   - `PARIVARTANA_YOGA`
   - `CAREER_YOGA_STRUCTURE`
2. Follow existing rule shape and guard with real establishing edges
3. Add rule-level unit tests
4. Add real-chart end-to-end test asserting `qualificationBasis` becomes `CANONICAL_STATUS`

### Wealth
1. **GAINS Effect Assignment Defect (URGENT):** Investigate why LINKED dimensions receive `effect: UNKNOWN` instead of a determinate effect. Examine the effect assignment logic in `evaluateSelectedWealthPeriodActivation` to identify the bug that causes the `insufficientReason: LINKED` / `effect: UNKNOWN` contradiction.
2. Decide on linkage rule approach (Option A or B above) for FORTUNE/SPECULATION
3. If Option A: Add clearer diagnostics for "promise present but not linked"
4. If Option B: Extend `isLinkedToDimension` to include lord/karaka-based linkage
5. Add per-dimension tests for the real chart

---

## Investigation Artifact Status

**File:** `src/domain/career/orchestration/canonicalCareerFoundationBuilder.investigation.test.ts`
**Status:** DELETED (removed as part of commit ad9c322 follow-up)
**Purpose:** Investigation artifact to ground Priority 3 fixes in actual engine output
**Note:** The programmatic investigation was completed and the findings are recorded in this document. The test file was deleted after extracting the key findings.
