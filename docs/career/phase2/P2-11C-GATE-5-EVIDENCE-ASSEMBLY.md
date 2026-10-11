# P2-11C: Gate 5 - Evidence Assembly

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

Gate 5 is the evidence assembly layer in the Career Domain Interpreter V2. It replaces legacy evidence paths with the canonical evidence mapper (`mapCanonicalCareerEvidence`) to produce DomainEvidence from canonical C4-C10 analysis outputs. This prevents double-counting and ensures canonical identity contracts are preserved.

## Implementation Location

- Module: `src/domain/career/`
- Files:
  - `canonicalCareerEvidenceMapper.ts` — Mapper from canonical C4-C10 to DomainEvidence
  - `CareerDomainInterpreterV2.ts` — Production integration (lines 138-144, 255-276)

## Architecture

### Evidence Assembly Flow

```
C4-C7 (Natal)     C8 (Expression)     C9 (Dasha)     C10 (D10)
     |                  |                  |               |
     v                  v                  v               v
canonicalCareerEvidenceMapper (mapCanonicalCareerEvidence)
     |
     v
DomainEvidence[] (with identityKey deduplication)
     |
     v
C11 Reference Validation (validateAgainstFinalSynthesis)
     |
     v
DomainInterpretation.conclusionData.canonicalCareerFinalSynthesis
```

### Dependency Graph

**Important:** The mapper builds DomainEvidence from C4-C10 inputs, NOT from C11 conclusions. C11 is used only for reference validation (cross-checking that produced evidence IDs are cross-referenceable). There is NO circular dependency.

- Mapper inputs: C4-C10 canonical analysis results
- Mapper output: DomainEvidence[]
- C11 role: Reference validation only (does not feed back into mapper)

## Canonical Evidence Mapper

### Contract

```typescript
export interface CanonicalCareerEvidenceInput {
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly dasha: CareerDashaCanonicalAnalysis;
  readonly d10: CareerD10CanonicalAnalysis;
  readonly finalSynthesis: CareerFinalSynthesisResult;
}

export interface CanonicalCareerEvidenceOutput {
  readonly evidence: readonly DomainEvidence[];
  readonly c11Validation: C11ValidationResult;
}
```

### Key Features

1. **Identity Preservation:** Preserves `identityKey`, `ruleId`, `sourceIds` as distinct concepts
2. **Per-Layer Mapping:** Maps each layer with appropriate phase/source/role assignments
3. **Deduplication:** Deduplicates by `identityKey` without weight inflation
4. **Deterministic Output:** Deep-frozen, deterministic output regardless of input order
5. **C11 Validation:** Uses C11 only for reference validation, never as an evidence source

### Layer Mappings

| Layer | Phase | Source | Role | Polarity Mapping |
|-------|-------|--------|------|-----------------|
| Natal (C4-C7) | NATAL_PROMISE | C4_STRUCTURAL_REASONING | PRIMARY/SECONDARY/MODIFIER (from layer) | SUPPORT→SUPPORTING, CHALLENGE→CHALLENGING, MIXED→split |
| Expression (C8) | MODIFIER | D1 | MODIFIER | SUPPORTED/CONDITIONAL→SUPPORTING, NEUTRAL→NEUTRAL |
| Dasha (C9) | DASHA_ACTIVATION | DASHA | TIMING | SUPPORT→SUPPORTING, CHALLENGE→CHALLENGING, MIXED→split |
| D10 (C10) | VARGA_CONFIRMATION | D10 | CONFIRMATION | SUPPORT→SUPPORTING, CHALLENGE→CHALLENGING, MIXED→split |
| Transit | (deferred) | (deferred) | (deferred) | (deferred) |

### MIXED Direction Handling

For MIXED direction evidence, the mapper splits into two occurrences (SUPPORTING and CHALLENGING) that share the same `identityKey`. The dedup logic then merges these back into a single MIXED record if they have matching non-polarity fields. This preserves the C4 MIXED contract.

## C11 Reference Validation

### Validation Contract

```typescript
export interface C11ValidationResult {
  readonly unreferenced: readonly string[];  // Produced IDs not referenced in C11
  readonly missing: readonly string[];       // C11 IDs not produced by mapper
}
```

### Resolution Logic

- Compares canonical identities (`identityKey`) against C11 `evidenceIds`
- Uses `identityKey` when present and non-empty, falling back to `id` only when `identityKey` is absent or empty
- Handles unknown references explicitly (ignores them, never fabricates)
- This is a lightweight validation; it does not affect the mapping output

### Non-Fatal Discrepancies

The following discrepancies are non-fatal warnings:
- `unreferenced`: Evidence produced by mapper but not referenced in C11 (valid, may be evidence from other sources not in C11 scope)
- `missing`: C11 references not produced by mapper (may be evidence from other sources not in mapper scope)

These do not indicate a bug; they surface information about scope differences between mapper and C11.

## Legacy Evidence Paths (Disabled)

The following legacy evidence paths are disabled in Gate 5 to prevent double-counting:

1. `buildCareerEvidence` — Legacy career evidence construction
2. `toDomainEvidence` — Legacy C4 evidence conversion
3. `dashaFactorsEvidence` — Legacy Dasha evidence

Each natal/expression/dasha/d10 fact is now counted exactly once via `identityKey` deduplication in the canonical mapper.

## Transit Evidence (Deferred)

**Status:** DEFERRED — No canonical transit evidence producer exists yet.

### Current State

- The mapper emits no transit evidence (`transitEvidence: []`)
- C11 still receives `transitDirection` from timing synthesis for timing-only calculation
- `DomainInterpretation.transitTrigger` remains `NO_MATERIAL_TRIGGER`

### Migration Boundary Decision

**Decision:** Accept that `DomainInterpretation.transitTrigger` stays `NO_MATERIAL_TRIGGER` for Gate 5 while careerTimingSynthesis still feeds a transit direction into C11 via the timing input.

**Rationale:**
- Transit remains timing-only and is not double-counted
- Transit direction influences C11 `timingStatus` and `currentPressure` (timing-only fields)
- C11 contract explicitly forbids transit from affecting `finalDirection`, `finalStrength`, or `natalDirection` (C11-INV-03: Transit Timing-Only Scope)
- A canonical transit evidence producer would require a new upstream component to emit `CareerTransitCanonicalEvidence` with `identityKey` semantics

**Future Work:**
If canonical transit evidence is needed, implement a producer that:
- Emits `CareerTransitCanonicalEvidence` with `identityKey`, `id`, `sourceIds`
- Maps to DomainEvidence with phase `TRANSIT_TRIGGER`, source `TRANSIT`, role `MODIFIER`
- Requires actual transit planet lord dignity / yoga condition evidence (not inferred from house number or planet presence)

## Manifestation Gap (Deferred)

**Status:** DEFERRED — Canonical manifestation-matching contract does not exist.

### Current State

The adapter `adaptCanonicalRuleIdToManifestationRules` (lines 83-94 in `canonicalCareerEvidenceMapper.ts`) returns an empty array for `CAREER_STRUCTURAL_*` ruleIds.

### Rationale

Canonical C4 evidence emits ruleIds like `CAREER_STRUCTURAL_10:11:COMMON_LORD:SUN:SATURN:PRIMARY:SUPPORT:STRONG:false` based on specific house relationships. Manifestation synthesis expects legacy rule patterns like `CAREER_10H_STRONG_001`, `CAREER_SUN_RELEVANCE_001`, etc.

The canonical evidence does NOT encode:
- Lord dignity (required for `CAREER_10L_DIGNITY_001`)
- Specific yoga conditions (required for `CAREER_YOGA_CONFIRMATION_001`)
- Manifestation-specific planet relevance (beyond mere presence as lordA/lordB)

Therefore, the adapter returns an empty array for canonical ruleIds. The semantic information needed to establish legacy manifestation rules is not present in the canonical evidence.

### Conservative Approach

This conservative approach prevents false positives and maintains correctness. The legacy manifestation synthesis should be updated to:
- Directly interpret canonical ruleIds, OR
- Canonical analysis should be enhanced to emit the missing semantic information

**DO NOT** change expected manifestation results back to `STRONGLY_SUPPORTED` to make old tests green. Leave the adapter returning empty arrays until a canonical manifestation-matching contract exists.

## Invariants

1. **No Double-Counting:** Each fact is counted exactly once via identityKey deduplication
2. **Identity Preservation:** Identity keys are preserved from producers (never modified)
3. **No Circular Dependency:** Mapper builds from C4-C10; C11 used only for validation
4. **MIXED Contract:** MIXED direction splits into two occurrences with shared identityKey
5. **Empty Arrays for Missing Data:** Missing evidence is represented as empty arrays (not fabricated)
6. **Deep Freeze:** All outputs are deeply frozen to ensure immutability
7. **Determinism:** Output is deterministic and input-order independent

## Tests

### CanonicalCareerEvidenceMapper.test.ts

Test coverage includes:
- Natal evidence mapping (supporting, challenging, MIXED)
- Expression evidence mapping (SUPPORTED, CONDITIONAL, UNAVAILABLE)
- Dasha evidence mapping (MIXED direction/effect validation)
- Deduplication logic (identityKey merging, non-polarity field agreement)
- Deterministic sorting

### CareerDomainInterpreterV2.test.ts

Test coverage includes:
- Gate 5 integration test asserting canonical evidence mapper is used
- Legacy evidence paths are disabled
- C11 reference validation is performed
- No double-counting occurs

### Regression Tests (FINDING 1)

Added in `careerFinalSynthesisIntegration.test.ts` (Test Group O):
- Natal evidence with `identityKey !== evidenceId` emits identityKey in C11 evidenceIds
- Natal evidence without identityKey or with empty identityKey falls back to evidenceId

Added in `careerTrajectoryEngine.test.ts`:
- Full chain test: natal semantic reference with `identityKey !== evidenceId` resolves in trajectory

## Completion Criteria

P2-11C is complete when:
1. ✅ Canonical evidence mapper is implemented and documented
2. ✅ Legacy evidence paths are disabled in CareerDomainInterpreterV2
3. ✅ C11 reference validation is implemented
4. ✅ Identity deduplication logic is correct
5. ✅ MIXED direction handling preserves C4 contract
6. ✅ Regression tests for identityKey resolution are added
7. ✅ Manifestation gap is documented (deferred decision)
8. ✅ Transit migration boundary is documented (deferred decision)
9. ✅ Stale circular dependency comments are corrected
10. ⏳ CI is observable and all tests are green (pending verification)

## Verification

Run the following commands to verify completion:

```bash
# Type-check
npm run lint

# Test canonicalCareerEvidenceMapper suite
npm test -- src/domain/career/canonicalCareerEvidenceMapper.test.ts

# Test careerFinalSynthesisIntegration suite
npm test -- src/domain/career/careerFinalSynthesis/careerFinalSynthesisIntegration.test.ts

# Test careerTrajectoryEngine suite
npm test -- src/domain/career/careerTrajectory/careerTrajectoryEngine.test.ts

# Test CareerDomainInterpreterV2 suite
npm test -- src/domain/career/CareerDomainInterpreterV2.test.ts

# Test careerManifestationSynthesis suite
npm test -- src/domain/career/manifestation/careerManifestationSynthesis.test.ts
```

All tests must pass for P2-11C to be considered complete.

## References

- P2-08D: Canonical C11 Final Synthesis Migration
- P2-09A: Career Trajectory Engine
- CW-R1: Career Convergence Contract
