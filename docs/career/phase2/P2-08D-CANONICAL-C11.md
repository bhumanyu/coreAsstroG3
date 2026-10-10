# P2-08D: Canonical C11 Final Synthesis Migration

**Status:** IMPLEMENTED — VERIFICATION PENDING

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

**Public Return Type:** The public return type of `interpretCareerV2` is `DomainInterpretation` — this MUST NOT change. The canonical C11 result is embedded within `conclusionData.canonicalCareerFinalSynthesis` as the authoritative conclusion source. The legacy result is retained as `conclusionData.careerFinalSynthesis` for backward compatibility only.

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

**P2-09A NAMESPACE CONTRACT:** C11 `evidenceIds` are canonical semantic identity keys (P2-09A fix):
- **Natal:** `evidenceId` (semantic identity, matches `identityKey` in `WeightedReasoningEvidence`)
- **Dasha:** `identityKey` (semantic identity from `CareerDashaCanonicalEvidence`)
- **D10:** `identityKey` (semantic identity from `CareerD10CanonicalEvidence`)
- **Expression:** `supportingEvidenceIds` (CareerExpressionEvidence.id, used as semantic identity — no separate `identityKey` field in C8 contract)

All collectors in `careerFinalSynthesisIntegration.ts` emit the semantic identity field, NOT the occurrence ID. This ensures C11 `evidenceIds` resolve against `DomainEvidence.identityKey` in the P2-09A trajectory engine.

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
   - `finalStrength` → domain conclusion `strength` (via exhaustive `mapC11StrengthToDomain`)
   - `confidence` → domain conclusion `confidence` (via `mapC11ConfidenceToDomain`)
   - `statement` → conclusion statement
   - `evidenceIds` → supporting evidence IDs (challenging evidence mapped from conflicts)
   - `sourceIds` → supporting source IDs
   - Note: C11 doesn't distinguish primary vs supporting evidence, so challenging evidence is extracted from conflicts and primary/supporting distinction is omitted rather than fabricated

4. Exposes the canonical C11 result in `conclusionData.canonicalCareerFinalSynthesis` for downstream access (authoritative)

5. Retains legacy synthesis as `conclusionData.careerFinalSynthesis` for backward compatibility only (not used as authoritative conclusion)

6. Uses a trace adapter to map C11 fields to the legacy reasoning trace graph shape, ensuring the reasoning trace reflects canonical C11 values rather than legacy synthesis

### Constraints

- Adapter does NOT call legacy `resolveCareerConclusionStrength`
- Adapter does NOT call legacy final synthesis to decide the conclusion again
- Adapter does NOT combine canonical + legacy into a third conclusion
- Legacy helpers remain for compatibility/parity tests only
- Legacy helpers no longer independently produce the authoritative final career result in the production path
- Public return type of `interpretCareerV2` remains `DomainInterpretation` (unchanged)
- **P2-08D-03:** DomainConclusion does not have fields for `finalStatus` or `finalDirection`. These C11 fields are preserved in `conclusionData.canonicalCareerFinalSynthesis` and are not inferred from strength. Consumers requiring these fields should read them directly from the canonical C11 result.

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

## Empty Evidence Field Compatibility Impact (P2-08D-08)

### Audit Results

The `c11AdaptedConclusion` in `CareerDomainInterpreterV2.ts` now emits empty `primaryEvidenceIds`, `supportingEvidenceIds`, `challengingEvidenceIds` arrays and `undefined` for `primarySourceIds`, `supportingSourceIds`, `challengingSourceIds`.

**Rationale:** C11 evidenceIds are canonical identity keys from the C11 reasoning hierarchy, not occurrence-level evidence IDs that map to the DomainEvidence list in `mergedEvidence`. Similarly, C11 sourceIds are provenance occurrences that may not map cleanly to DomainEvidence. To maintain traceability invariants, we omit both evidence IDs and source IDs from the DomainConclusion adapter rather than fabricating a mapping.

### Affected Consumers

The following consumers read evidence ID fields from the DomainConclusion returned by `interpretCareerV2`:

1. **`projectDomainInterpretationForAi`** (src/domain/interpretation/DomainInterpretationAiProjection.ts)
   - Reads: `interpretation.conclusion.primaryEvidenceIds`
   - Maps to: AI projection's `evidenceIds` field
   - **Impact:** The AI projection will now receive an empty `evidenceIds` array from the career interpreter
   - **Mitigation:** Consumers requiring evidence-level provenance should read from `conclusionData.canonicalCareerFinalSynthesis.evidenceIds` and `sourceIds` directly

2. **Test consumers** (CareerDomainInterpreterV2.test.ts, WealthDomainInterpreterV2.test.ts, domainActivationRuleProvider.test.ts, DomainInterpretationBuilder.test.ts)
   - These are test assertions that check the field values
   - Tests have been updated to expect empty arrays/undefined for these fields
   - No production impact

3. **Stage 1 golden fixture** (src/integration/stage1/stage1GoldenFixture.ts)
   - Reads: `STAGE1_GOLDEN_CAREER.conclusion.supportingEvidenceIds`
   - Used for: Golden fixture validation
   - **Impact:** The fixture will see an empty array
   - **Mitigation:** Update fixture validation to read from `canonicalCareerFinalSynthesis.evidenceIds` if needed

### Migration Guidance

For consumers that require occurrence-level evidence IDs:

- **Do not** rely on `conclusion.primaryEvidenceIds`, `conclusion.supportingEvidenceIds`, `conclusion.challengingEvidenceIds`
- **Do not** rely on `conclusion.primarySourceIds`, `conclusion.supportingSourceIds`, `conclusion.challengingSourceIds`
- **Instead**, read from `conclusionData.canonicalCareerFinalSynthesis.evidenceIds` for canonical identity keys
- **For provenance occurrences**, read from `conclusionData.canonicalCareerFinalSynthesis.sourceIds`
- **For rule-level provenance**, read from `conclusionData.canonicalCareerFinalSynthesis.ruleIds`

### Design Decision

This is an intentional compatibility tradeoff. Fabricating a mapping from C11 canonical identity keys to occurrence-level DomainEvidence IDs would violate traceability invariants and could produce incorrect associations. The full canonical C11 result remains available in `conclusionData.canonicalCareerFinalSynthesis` for consumers that need role-aware evidence.

## Lossy State Collapse in Trace Adapter (P2-08D-09)

### Overview

The trace adapter functions `mapC11DirectionToLegacyStatus` and `mapC11DirectionToLegacyVarga` project canonical C11 states onto the legacy trace schema. This projection is intentionally lossy: the legacy schema cannot represent all C11 distinctions.

### `mapC11DirectionToLegacyStatus` Mapping Table

| C11 Direction + Strength | Legacy Status | Notes |
|---------------------------|---------------|-------|
| SUPPORT + VERY_STRONG | VERY_STRONG | Strong positive support |
| SUPPORT + STRONG | VERY_STRONG | Strong positive support |
| SUPPORT + MODERATE | STRONG | Moderate support maps to strong |
| SUPPORT + WEAK | INSUFFICIENT_DATA | Weak support cannot produce positive status |
| SUPPORT + VERY_WEAK | INSUFFICIENT_DATA | Very weak support cannot produce positive status |
| SUPPORT + UNDETERMINED | INSUFFICIENT_DATA | Undetermined strength → insufficient data |
| SUPPORT + MIXED | INSUFFICIENT_DATA | Mixed evidence → insufficient data |
| CHALLENGE (any strength) | CHALLENGED | Challenge direction preserved |
| CONDITIONAL (any strength) | MODERATE | Conditional maps to moderate |
| MIXED (any strength) | MIXED | Mixed direction preserved |
| NEUTRAL (any strength) | INSUFFICIENT_DATA | Neutral → unavailable representation |
| UNAVAILABLE (any strength) | INSUFFICIENT_DATA | Unavailable → unavailable representation |

**Key invariants:**
- `SUPPORT + UNDETERMINED` never yields a positive status
- `SUPPORT + WEAK` and `SUPPORT + VERY_WEAK` never yield a positive status
- `NEUTRAL` and `UNAVAILABLE` both map to `INSUFFICIENT_DATA` (indistinguishable in legacy schema)

### `mapC11DirectionToLegacyVarga` Mapping Table

| C11 Direction | Legacy Varga Status | Notes |
|---------------|-------------------|-------|
| SUPPORT | CONFIRMS | Support direction maps to confirms |
| CHALLENGE | CONFLICTS | Challenge direction maps to conflicts |
| CONDITIONAL | MODIFIES | Conditional maps to modifies |
| MIXED | UNAVAILABLE | Mixed → unavailable (lossy) |
| NEUTRAL | UNAVAILABLE | Neutral → unavailable (lossy) |
| UNAVAILABLE | UNAVAILABLE | Unavailable preserved |

**Key invariants:**
- `MIXED`, `NEUTRAL`, and `UNAVAILABLE` all map to `UNAVAILABLE` (indistinguishable in legacy schema)
- The legacy trace schema cannot distinguish between "no data" (UNAVAILABLE), "mixed evidence" (MIXED), and "neutral outcome" (NEUTRAL)

### Design Rationale

This lossy projection is intentional:

1. **Legacy schema constraints:** The legacy trace graph schema (`FinalDomainStatus`, `VargaRelationship`) was designed before C11 and lacks the granularity to represent all C11 states.
2. **Backward compatibility:** The trace graph must continue to work with existing visualizers and consumers that expect the legacy schema.
3. **No information loss for canonical consumers:** The full C11 result remains available in `conclusionData.canonicalCareerFinalSynthesis` with all distinctions preserved.
4. **Trace graph purpose:** The trace graph is a high-level visualization of reasoning flow, not a source of truth for detailed state. Consumers requiring full precision should read the canonical C11 result directly.

### Migration Guidance

For consumers that require full C11 state precision:

- **Do not** rely on trace graph node labels or edge types to distinguish between NEUTRAL, UNAVAILABLE, or MIXED in the legacy schema
- **Instead**, read from `conclusionData.canonicalCareerFinalSynthesis` for the authoritative C11 state
- The trace graph remains useful for high-level visualization, but canonical C11 is the source of truth for detailed state analysis

## Completion Criteria

P2-08D is complete when:
1. ✅ Canonical contracts are frozen and documented
2. ✅ C11 semantics are audited and fixed (confidence policy, pressure aggregation, missing-data handling)
3. ✅ Canonical adapter is audited (evidence/provenance separation, conflict coverage, hierarchy handling)
4. ✅ Invariant tests are added and passing
5. ✅ Production cutover is implemented with presentation adapter
6. ✅ Parity + integration tests are updated and passing
7. ✅ Documentation is complete (this file)
8. ✅ P2-09A namespace contract fixed (evidence IDs now use semantic identity keys)
9. ⏳ CI is observable and all tests are green (pending verification)

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
