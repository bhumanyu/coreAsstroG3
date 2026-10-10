# P2-08E-P1: Canonical Career Evidence Mapper

## Status

IMPLEMENTED — VERIFIED

## Purpose

This document describes the canonical Career evidence mapper (`canonicalCareerEvidenceMapper.ts`), which converts canonical Career reasoning outputs (C4–C10) into the existing `DomainEvidence` model. The mapper reuses established identity/provenance conventions from `careerStructuralReasoningIntegration.ts` and preserves the canonical evidence dedup contract (W0.2).

## Scope

This PR delivers:
- The mapper implementation (`src/domain/career/canonicalCareerEvidenceMapper.ts`)
- Comprehensive unit tests (`src/domain/career/canonicalCareerEvidenceMapper.test.ts`)
- This documentation

**NOT in scope** (deferred follow-up):
- Wiring the mapper into `interpretCareerV2`/`mergedEvidence`
- Integration with the existing Career interpreter

The C4 structural evidence already enters `mergedEvidence` via `toDomainEvidence` in `CareerDomainInterpreterV2.ts`. Wiring the canonical mapper now would double-count natal facts. Interpreter integration will be a separate PR after maintainer confirmation of the cutover approach.

## Per-Layer Mapping Table

| Layer | Phase | Source | SourceType | Role | Polarity Source | Strength Source | Notes |
|-------|-------|--------|-----------|------|-----------------|-----------------|-------|
| C4–C7 (Natal) | `NATAL_PROMISE` | `C4_STRUCTURAL_REASONING` | From `layer` (YOGA→YOGA, others→STRUCTURAL) | From `layer` (PRIMARY_PROMISE→PRIMARY, SECONDARY_SUPPORT→SECONDARY, etc.) | From `direction` (SUPPORT→SUPPORTING, CHALLENGE→CHALLENGING, NEUTRAL→NEUTRAL) | From `strength` (VERY_STRONG/STRONG/MODERATE/WEAK) | MIXED split via C4 convention preserving shared identityKey; unmappable strength excluded |
| C8 (Expression) | `MODIFIER` | `D1` | `PLANET` | `MODIFIER` | From parent `CareerExpression.direction` (SUPPORTED→SUPPORTING, CONDITIONAL→SUPPORTING with notes, NEUTRAL→NEUTRAL) | From parent `CareerExpression.strength` (STRONG/MODERATE/WEAK) | UNAVAILABLE strength excludes record; no ruleId fabricated |
| C9 (Dasha) | `DASHA_ACTIVATION` | `DASHA` | `PLANET` | `TIMING` | From `direction` | From `strength` via exhaustive mapping | Cannot be PRIMARY natal (enforced by phase); no fabricated ruleId (CareerDashaCanonicalProvenance does not expose ruleId); polarity/effect consistency enforced |
| C10 (D10) | `VARGA_CONFIRMATION` | `D10` | `HOUSE` | `CONFIRMATION` | From `direction` (MIXED split into SUPPORTING+CHALLENGING) | From `d10Strength` via exhaustive mapping | Cannot establish natal promise (enforced by phase); MIXED split via natal convention |
| Transit | N/A | N/A | N/A | N/A | N/A | N/A | No canonical transit evidence producer; intentionally not mapped |

## Three-Level Identity Contract

The mapper preserves the canonical evidence identity contract (W0.2) with three distinct identity levels:

### 1. Occurrence ID (`evidenceId`)
- Unique identifier for each evidence occurrence
- Includes effect/strength in the identifier
- Example: `natal-evidence-1`, `dasha-evidence-1`
- Mapped to `DomainEvidence.id`

### 2. Semantic Identity Key (`identityKey`)
- Canonical semantic identity
- Excludes effect/strength to enable identity-based deduplication
- Same fact with different direction/strength shares the same identityKey
- Example: `natal-identity-1`, `dasha-identity-1`
- Mapped to `DomainEvidence.identityKey`

### 3. Source IDs (`sourceIds`)
- Array of all occurrence IDs that were merged into the canonical fact
- Provides provenance traceability to original input evidence items
- Mapped to `DomainEvidence.relatedEvidenceIds`

### Relationship
```
occurrenceId(SUPPORT) != occurrenceId(CHALLENGE)
identityKey(SUPPORT) == identityKey(CHALLENGE)
sourceIds = [occurrenceId(SUPPORT), occurrenceId(CHALLENGE), ...]
```

### Rule ID (`ruleId`)
- Rule identity (deduplicated)
- Distinct from occurrence ID and semantic identity
- Mapped to `DomainEvidence.ruleId`
- Expression evidence has no ruleId (not fabricated)
- Dasha evidence has no ruleId (CareerDashaCanonicalProvenance does not expose ruleId)
- D10 evidence uses first ruleId from `provenance.ruleIds` if present

## Exhaustive Strength Mapping

### DomainStrength → EvidenceStrength (Natal, Dasha)

| DomainStrength | EvidenceStrength | Action |
|----------------|------------------|--------|
| VERY_STRONG | VERY_STRONG | Map directly |
| STRONG | STRONG | Map directly |
| MODERATE | MODERATE | Map directly |
| WEAK | WEAK | Map directly |
| UNAVAILABLE | N/A | Exclude record |
| UNDETERMINED | N/A | Exclude record |
| VERY_WEAK | N/A | Exclude record |
| MIXED | N/A | Exclude record |

### CareerD10QualificationStrength → EvidenceStrength (D10)

| CareerD10QualificationStrength | EvidenceStrength | Action |
|-------------------------------|------------------|--------|
| VERY_STRONG | VERY_STRONG | Map directly |
| STRONG | STRONG | Map directly |
| MODERATE | MODERATE | Map directly |
| WEAK | WEAK | Map directly |
| VERY_WEAK | N/A | Exclude record |
| UNDETERMINED | N/A | Exclude record |

### Exclusion Rule

Records with unmappable strength are **excluded** rather than defaulted to STRONG. This prevents weak/unavailable evidence from being inflated into strong evidence. Strength is never inferred from C11 confidence or another layer.

## Missing Data Is Not Negative Evidence

The mapper follows the invariant that missing evidence ≠ negative evidence:

- Empty `natal.evidence` → emits no natal evidence (not negative evidence)
- Empty `expression.expressions` → emits no expression evidence (not negative evidence)
- Empty `dasha.evidence` → emits no dasha evidence (not negative evidence)
- Empty `d10.evidence` → emits no D10 evidence (not negative evidence)
- UNAVAILABLE expression direction → emits nothing (not negative evidence)

This aligns with C11-INV-05 from the convergence contract.

## C11 Reference-Only Boundary

C11 is used **only for reference validation**, never as an evidence source:

- The mapper validates that produced evidence IDs are cross-referenceable against `finalSynthesis.evidenceIds`
- Unknown references are handled explicitly (ignored, never fabricated)
- Validation result is returned as a structured `{ unreferenced: string[]; missing: string[] }` via `validateC11References()`
- The mapper does **not** create `DomainEvidence` from:
  - `finalSynthesis.statement`
  - `finalSynthesis.finalStatus`
  - `finalSynthesis.finalDirection`
  - `finalSynthesis.confidence`

This preserves the C11 invariant that it is a synthesis layer, not an evidence producer.

## Deferred Interpreter Integration

### Current State

The C4 structural evidence already enters `mergedEvidence` via `toDomainEvidence` in `CareerDomainInterpreterV2.ts`. This means:

- C4 natal facts are already being counted in the production result
- Wiring the canonical mapper now would double-count these facts

### Double-Count Risk

If the canonical mapper were integrated into `interpretCareerV2` without removing the existing `toDomainEvidence` call:

```
C4 → toDomainEvidence → mergedEvidence (existing path)
C4 → canonicalMapper → DomainEvidence → mergedEvidence (new path)
```

This would result in the same natal facts being counted twice.

### Deferred Follow-Up

Interpreter integration is a separate PR that will:

1. Confirm the cutover approach with the maintainer
2. Remove or disable the existing `toDomainEvidence` call for C4
3. Wire the canonical mapper into `interpretCareerV2`
4. Validate that no double-counting occurs
5. Run regression tests to ensure parity

The integration PR will document the specific changes to `CareerDomainInterpreterV2.ts` and the validation steps performed.

## MIXED Evidence Handling

The mapper reuses the C4 MIXED evidence identity contract (§9 of CW-R1):

- MIXED direction is split into two occurrences (SUPPORTING and CHALLENGING)
- Both occurrences share the same `identityKey`
- Both occurrences share the same `ruleId`
- Both occurrences have distinct `id` values
- `provenance.effect` is `MIXED` for both
- During canonical deduplication, the two occurrences merge into one MIXED record
- Weight is the max single-occurrence, not the sum

This prevents duplicate representations of one underlying structural fact from independently contributing to the Career conclusion.

## Deduplication and Merge Policy

The mapper enforces semantic field safety during deduplication:

- For non-MIXED same-identity groups, all merge-relevant semantic fields must agree
- Fields checked: polarity, strength, phase, source, role, provenance
- If fields disagree, an error is thrown (silent merging is prevented)
- Records without an `identityKey` are preserved as separate, non-deduplicable items (grouped by `id` instead)
- MIXED occurrences (SUPPORTING + CHALLENGING with same identityKey) are kept separate for downstream canonical dedup

This policy prevents silent merging of semantically incompatible evidence and ensures merge conflicts are visible.

## Enum Fallback Policy

All enum mapping functions use exhaustive mappings with explicit error handling:

- `mapLayerToRole`: throws on unexpected layer values
- `mapStrength`: returns `null` for unmappable strengths (excludes record)
- `mapLayerToSourceType`: returns STRUCTURAL for most layers, YOGA for yoga evidence
- `mapD10DirectionToPolarity`: throws on unexpected direction values
- `mapD10DirectionToProvenanceEffect`: throws on unexpected direction values
- `mapDashaEffectToProvenanceEffect`: throws on unexpected effect values

This ensures contract drift fails loudly rather than defaulting to incorrect values.

## Determinism

The mapper guarantees deterministic output:

- Evidence is sorted by phase, then identityKey, then id
- Phase order: NATAL_PROMISE < MODIFIER < DASHA_ACTIVATION < TRANSIT_TRIGGER < VARGA_CONFIRMATION
- `mapCanonicalCareerEvidence(input)` twice yields identical deep-equal results
- Input order does not affect output

## Immutability

The mapper produces deeply frozen output:

- The output array is frozen using `Object.freeze`
- Each `DomainEvidence` record is frozen by `createDomainEvidence`
- Nested objects (provenance, timing) are frozen

## Test Coverage

The test suite (`canonicalCareerEvidenceMapper.test.ts`) covers:

- Natal supporting → NATAL_PROMISE/SUPPORTING with identity preserved
- Natal challenging stays CHALLENGING
- MIXED preserves both occurrences under one identityKey without doubled weight
- Expression evidence preserved without manufactured conclusion
- CONDITIONAL expression maps to SUPPORTING with notes
- UNAVAILABLE expression emits nothing
- Dasha → DASHA_ACTIVATION and cannot be PRIMARY natal
- Dasha evidence has no fabricated ruleId (omitted when real ruleId does not exist)
- Dasha evidence preserves sourceIds in relatedEvidenceIds
- Dasha polarity/effect consistency: throws on SUPPORTING with CHALLENGE effect
- D10 → VARGA_CONFIRMATION and cannot establish natal promise
- D10 MIXED direction splits into SUPPORTING and CHALLENGING occurrences
- Expression strength derived from parent CareerExpression.strength
- Expression UNAVAILABLE strength excludes record
- Deduplication throws on polarity disagreement in dedup
- Records without identityKey are preserved as separate items
- Missing-layer data yields no fabricated negative evidence
- Missing provenance leaves ruleId absent (no fabrication for C8)
- Duplicate semantic identity dedupes without weight inflation
- Multiple occurrences retain required sourceIds
- Input-order invariance (determinism)
- Distinct id, sourceIds, and ruleId as separate concepts
- Unknown C11 evidence references handled explicitly
- C11 validation returns structured result with unreferenced and missing IDs
- Nested immutability (Object.isFrozen)

No `as any` casts are used in the test fixtures.

## Verification

Run the following to verify the implementation:

```bash
# Type checking
npm run lint  # Runs tsc --noEmit

# New test suite
npm test -- canonicalCareerEvidenceMapper.test.ts

# Existing test suites (regression check)
npm test -- careerStructuralReasoningIntegration.test.ts
npm test -- careerNatalConvergence.test.ts
npm test -- careerFinalSynthesisIntegration.test.ts
```

## API Reference

### Input Type

```typescript
interface CanonicalCareerEvidenceInput {
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly dasha: CareerDashaCanonicalAnalysis;
  readonly d10: CareerD10CanonicalAnalysis;
  readonly finalSynthesis: CareerFinalSynthesisResult;
}
```

### Main Function

```typescript
function mapCanonicalCareerEvidence(
  input: CanonicalCareerEvidenceInput
): readonly DomainEvidence[]
```

Returns a frozen array of `DomainEvidence` items.

### Per-Layer Helpers

```typescript
function mapNatalEvidence(natal: CareerNatalAnalysis): DomainEvidence[]
function mapExpressionEvidence(expression: CareerExpressionAnalysis): DomainEvidence[]
function mapDashaEvidence(dasha: CareerDashaCanonicalAnalysis): DomainEvidence[]
function mapD10Evidence(d10: CareerD10CanonicalAnalysis): DomainEvidence[]
function deduplicateCanonicalEvidence(evidence: readonly DomainEvidence[]): DomainEvidence[]
function sortCanonicalEvidence(evidence: readonly DomainEvidence[]): DomainEvidence[]
```

### Validation Function

```typescript
interface C11ValidationResult {
  readonly unreferenced: readonly string[];
  readonly missing: readonly string[];
}

function validateC11References(
  evidence: readonly DomainEvidence[],
  finalSynthesis: CareerFinalSynthesisResult
): C11ValidationResult
```

Exposes C11 reference validation for testing without affecting the main mapper output.

## References

- `src/domain/career/canonicalCareerEvidenceMapper.ts` — Implementation
- `src/domain/career/canonicalCareerEvidenceMapper.test.ts` — Tests
- `src/domain/career/careerStructuralReasoningIntegration.ts` — C4 toDomainEvidence conventions
- `src/domain/interpretation/DomainEvidence.ts` — DomainEvidence model
- `src/domain/interpretation/DomainInterpretationTypes.ts` — Type definitions
- `src/domain/careerWealth/provenance/evidenceProvenance.ts` — Provenance types
- `docs/career/CW-R1-CAREER-CONVERGENCE-CONTRACT.md` — Convergence contract
