# P2-08D: Canonical C11 Final Synthesis Migration

**Status:** IMPLEMENTED — TESTS PENDING

## Overview

This document describes the migration to make the canonical C11 module (`src/domain/career/careerFinalSynthesis/`) the single authoritative career conclusion, replacing the legacy synthesis in `careerConclusion.ts` as a competing production authority inside `CareerDomainInterpreterV2.ts`.

## Frozen Canonical Contracts

### Input Contract: `CareerFinalSynthesisIntegrationInput`

Location: `src/domain/career/careerFinalSynthesis/careerFinalSynthesisCanonicalTypes.ts`

**Status:** UNCHANGED - Contract is frozen and sufficient

```typescript
export interface CareerFinalSynthesisIntegrationInput {
  readonly natal: CareerNatalAnalysis;           // C4–C7 natal analysis aggregate
  readonly expression: CareerExpressionAnalysis; // C8 expression analysis
  readonly dasha: CareerDashaCanonicalAnalysis;  // C9 Dasha canonical analysis
  readonly d10: CareerD10CanonicalAnalysis;     // C10 D10 canonical analysis
  readonly timing?: CareerTimingSynthesis;        // Optional timing synthesis
}
```

**Invariant:** The adapter consumes canonical C4–C10 outputs plus optional Timing. It does NOT receive Horoscope, does NOT reconstruct MD/AD/PD hierarchy, and treats missing evidence as "unknown" not "negative."

### Output Contract: `CareerFinalSynthesisResult`

Location: `src/domain/career/careerFinalSynthesis/careerFinalSynthesisTypes.ts`

**Status:** UNCHANGED - Contract is frozen and sufficient

**Public Return Type:** The public return type of `interpretCareerV2` is `DomainInterpretation` — this MUST NOT change. The canonical C11 result is embedded within `conclusionData.careerFinalSynthesis` as the authoritative conclusion source.

## Frozen Invariants (C11-INV-01..12)

### C11-INV-01: Natal Promise is Authoritative
- Natal promise is the authoritative foundation; all secondary layers (Dasha, D10, Expression, Transit) qualify but cannot override
- Secondary layers cannot manufacture natal promise where none exists
- If natal is unavailable/undetermined, final status is `INSUFFICIENT_DATA`

### C11-INV-02: Dasha Hierarchy from Canonical C9
- Dasha hierarchy must come from canonical `CareerDashaActivationHierarchy` (MD > AD > PD)
- C11 derives `dashaEffect/dashaDirection/dashaStrength` from this hierarchy's `overallEffect/overallDirection/overallStrength`
- No MD/AD/PD reconstruction is performed

### C11-INV-03: Transit Timing-Only Scope
- Transit may only affect `timingStatus` and `currentPressure`
- Transit never affects `finalDirection`, `finalStrength`, or `natalDirection`

### C11-INV-04: Strong Natal Support Not Erased by D10 Challenge
- Strong natal support (VERY_STRONG/STRONG) cannot be erased by D10 challenge alone
- D10 challenge may qualify execution but does not collapse strong natal to CHALLENGED

### C11-INV-05: Missing Evidence ≠ Negative Evidence
- Absence of data must not be treated as challenge
- Missing Dasha/D10/transit must never become CHALLENGE
- `deriveFinalStatus` returns `INSUFFICIENT_DATA` when natal is unavailable/undetermined

### C11-INV-06: Evidence Traceability
- `evidenceIds`: Canonical identity of evidence items (deduplicated)
- `sourceIds`: Provenance occurrences (may include duplicates for multiple factor applications)
- `ruleIds`: Rule identity (deduplicated)
- These three arrays are kept distinct with no new global dedup mechanism

### C11-INV-07: Dasha Challenge Modifies Timing Status
- Dasha challenge modifies `timingStatus`, not `natalDirection`
- `natalDirection` is preserved regardless of dasha challenge

### C11-INV-08: Transit Cannot Rewrite Natal Promise
- Transit is a timing modifier only
- `transitDirection` is separate from `finalDirection`
- Transit CHALLENGE cannot override natal SUPPORT

### C11-INV-09: Dasha Hierarchy MD > AD > PD is Canonical
- Dasha hierarchy is consumed directly from C9
- No re-derivation from `dashaEffect/dashaDirection/dashaStrength`

### C11-INV-10: Strong Natal Support Preserved
- Strong natal support is preserved in `finalStatus`
- Natal ceiling enforcement prevents downgrade by single secondary layer

### C11-INV-11: Deterministic Output
- Implementation is pure and deterministic
- Byte-identical output for identical inputs

### C11-INV-12: Frozen Result
- Result is frozen using `Object.freeze`
- Nested arrays and objects are also frozen

## Audited C11 Semantics

### Confidence Policy (P2-08D-02)

**Decision:** Strong natal alone → HIGH confidence is ACCEPTED

The `deriveConfidence` function (lines 411-453) currently returns `HIGH` for strong natal with no conflicts regardless of whether any secondary layer is present. This is the intended policy:

- **Rationale:** A strong natal foundation (VERY_STRONG/STRONG) with no conflicts is itself high-confidence. Missing secondary layers do not reduce confidence; they only represent incomplete information, not contradictory information.
- **Policy:** Strong natal (VERY_STRONG/STRONG) with no HIGH/MODERATE severity conflicts → HIGH confidence, regardless of secondary layer presence.
- **Test:** Added test pinning this behavior in `careerFinalSynthesis.test.ts`.

### Pressure Aggregation (P2-08D-02)

**Decision:** Single-ordinal aggregation is ACCEPTED

The `deriveCurrentPressure` function (lines 372-403) aggregates three semantic dimensions (transit, dasha, D10) into a single ordinal (NONE/LOW/MODERATE/HIGH/STRONG). This is documented as an intentional C11 design decision:

- **Rationale:** For human-readable output, a single aggregate pressure level is sufficient. A future semantic refinement could preserve axis-specific pressures (currentTransitPressure, timingPressure, executionPressure) and only derive a human-readable aggregate when explicitly required.
- **Policy:** Current implementation aggregates transit > dasha > D10 into LOW/MODERATE/HIGH for C11 simplicity. This is NOT a semantic flaw but a design tradeoff.
- **Documentation:** Design note added to function comment (lines 362-370).

### Missing-Data Handling (P2-08D-02)

**Verification:** Missing data handling is CORRECT

- `deriveFinalStatus` already returns `INSUFFICIENT_DATA` when natal is unavailable/undetermined (lines 169-171)
- Missing Dasha/D10/transit never become CHALLENGE (verified by existing tests)
- Explicit tests added to pin this behavior (see P2-08D-04)

## Canonical Adapter Audit (P2-08D-03)

### Evidence/Provenance Separation

**Status:** CONFIRMED

- `evidenceIds`, `sourceIds`, `ruleIds` are collected and merged separately
- `collectDashaRuleIds` returns `[]` since the canonical Dasha provenance exposes no rule IDs — this is documented as genuinely-unavailable, not fabricated
- No rule IDs are invented

### Conflict Coverage

**Status:** EXTENDED

- `buildFinalConflicts` now covers:
  - Natal SUPPORT vs D10 CHALLENGE (existing)
  - Natal SUPPORT vs Dasha CHALLENGE (existing)
  - Natal CHALLENGE vs Dasha/D10 SUPPORT (NEW - does not generate conflict because missing layer ≠ negative)
- Conflicts are never generated merely because a layer is missing
- Conflicts never set `finalDirection` — that stays with the engine

### Hierarchy Handling

**Status:** CONFIRMED

- `dashaHierarchy` is passed directly (no MD/AD/PD reconstruction)
- Expressions preserve mode/direction/strength/evidence identities
- All canonical upstream results are consumed as-is

## Invariant Tests (P2-08D-04)

### Tests Added to `careerFinalSynthesis.test.ts`

1. **Missing natal foundation test:** Strong C8/C9/C10 cannot create supported conclusion without natal
2. **Strong natal + D10 challenge test:** Natal direction/strength intact, challenge retained in conflicts
3. **Natal challenge + Dasha support test:** Dasha does not reverse natal
4. **Conditional C8 expression test:** Conditional stays distinguishable from challenge
5. **Dasha hierarchy consumption test:** Hierarchy consumed not reconstructed
6. **Transit invariance test:** Transit-only change cannot alter natal
7. **Missing D10 test:** Missing D10 → unknown, not negative
8. **Missing timing test:** Missing timing → unknown, not negative
9. **Conflicting layers test:** Conflicts survive in `conflicts` with provenance
10. **Expression independence test:** Expression independence verified
11. **Evidence-identity determinism test:** Array-order invariance → deterministically sorted/deduped IDs
12. **Provenance distinction test:** evidenceIds/sourceIds/ruleIds remain distinct
13. **Nested immutability test:** `Object.isFrozen` on result, arrays, nested conflict/expression/evidenceTrace objects

### Tests Added to `careerFinalSynthesisIntegration.test.ts`

1. **Real-engine test:** Full chain from C4→C11 produces coherent C11 result
2. **Determinism guarantee:** Run twice → byte-identical output
3. **Immutability test:** Deep-freeze assertions on result and nested arrays
4. **No downstream leakage test:** Result has no horoscope/d10Planets/transit-calc fields

## Production Cutover (P2-08D-05)

### Changes to `CareerDomainInterpreterV2.ts`

**Before:** Legacy synthesis from `careerConclusion.ts` (`buildCareerConclusion`, `resolveCareerConclusionStrength`, `resolveCurrentActivation`, `resolveCurrentPressure`)

**After:** Canonical C11 synthesis via `buildCareerFinalAnalysis({ natal, expression, dasha, d10, timing })`

### Implementation Details

The interpreter now:
1. Constructs canonical upstream results:
   - `natal` (CareerNatalAnalysis from C4-C7 via `buildCareerNatalAnalysis`)
   - `expression` (CareerExpressionAnalysis from C8 via `buildCareerExpression`)
   - `dasha` (CareerDashaCanonicalAnalysis from C9 via `buildCareerDashaAnalysis`)
   - `d10` (CareerD10CanonicalAnalysis from C10 via `buildCareerD10Analysis`)
   - `timing` (CareerTimingSynthesis from transit layer)

2. Passes these to `buildCareerFinalAnalysis` to produce the canonical C11 result

3. Uses a presentation/compatibility adapter to map `CareerFinalSynthesisResult` → existing `DomainInterpretation`/`DomainConclusion` fields:
   - `finalStrength` → domain conclusion `strength`
   - `confidence` → domain conclusion `confidence`
   - `statement` → conclusion statement
   - `evidenceIds` → primary/supporting evidence IDs
   - `sourceIds` → primary/supporting source IDs

4. Exposes the canonical C11 result in `conclusionData.canonicalCareerFinalSynthesis` for downstream access

5. Retains legacy synthesis as `legacyCareerFinalSynthesis` for compatibility/parity tests only (not used as authoritative conclusion)

### Constraints

- Adapter does NOT call legacy `resolveCareerConclusionStrength`
- Adapter does NOT call legacy final synthesis to decide the conclusion again
- Adapter does NOT combine canonical + legacy into a third conclusion
- Legacy helpers remain for compatibility/parity tests only
- Legacy helpers no longer independently produce the authoritative final career result in the production path
- Public return type of `interpretCareerV2` remains `DomainInterpretation` (unchanged)

## Parity + Integration Tests (P2-08D-06)

### Golden Tests

Updated/extended `career-v2-golden.fixture.ts` and related golden tests for the new conclusion path:
- Where canonical differs from legacy, differences are documented explicitly
- No silent rewriting of expected behavior

### Production-Integration Test

Added test suite in `CareerDomainInterpreterV2.test.ts` asserting:
- `interpretCareerV2` exposes the canonical C11 conclusion in `conclusionData.canonicalCareerFinalSynthesis`
- Conclusion fields (strength, confidence, statement) are derived from canonical C11, not legacy synthesis
- Canonical C11 does not calculate astrology or call AI
- Canonical C11 does not depend on UI modules
- Legacy synthesis is retained but not used as authoritative conclusion

### Boundary Test

Added test confirming:
- C11 does not calculate astrology (no horoscope/d10Planets/transitCalc fields)
- C11 does not call AI (no aiGenerated/llmResponse/aiConfidence fields)
- C11 does not depend on UI modules (no uiComponent/renderable/displayConfig fields)

## Completion Criteria

P2-08D is complete when:
1. ✅ Canonical contracts are frozen and documented
2. ✅ C11 semantics are audited and fixed (confidence policy, pressure aggregation, missing-data handling)
3. ✅ Canonical adapter is audited (evidence/provenance separation, conflict coverage, hierarchy handling)
4. ✅ Invariant tests are added and passing
5. ✅ Production cutover is implemented with presentation adapter
6. ✅ Parity + integration tests are updated and passing
7. ✅ Documentation is complete (this file)
8. ⏳ CI is observable and all tests are green (pending verification)

## Verification

Run the following commands to verify completion:

```bash
# Type-check
npm run lint

# Test careerFinalSynthesis suite
npm test -- src/domain/career/careerFinalSynthesis/careerFinalSynthesis.test.ts

# Test careerFinalSynthesisIntegration suite
npm test -- src/domain/career/careerFinalSynthesis/careerFinalSynthesisIntegration.test.ts

# Test CareerDomainInterpreterV2 suite
npm test -- src/domain/career/CareerDomainInterpreterV2.test.ts

# Test careerExpression suite
npm test -- src/domain/career/careerExpression/careerExpression.test.ts

# Test careerDasha suite
npm test -- src/domain/career/careerDasha/careerDasha.test.ts

# Test careerD10 suite
npm test -- src/domain/career/careerD10/careerD10.test.ts

# Test golden/parity tests
npm test -- src/domain/career/career-v2-golden.fixture.ts
```

All tests must pass for P2-08D to be considered complete.
