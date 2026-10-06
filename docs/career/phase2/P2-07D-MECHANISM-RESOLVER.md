# P2-07D Career Mechanism Resolver

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

The P2-07D Career Mechanism Resolver is the resolution layer that maps pattern structural facts to mechanism candidates. This layer sits ABOVE the pattern layer (P2-03/P2-06) and consumes patterns, participant roles, and establishing evidence to produce mechanism candidate sets.

**Important:** Mechanism candidates ≠ final mechanisms. This layer produces candidates based on structural pattern facts. Final mechanism qualification and synthesis happens in later phases.

## Pipeline Position

```
P2-03/P2-06 (Pattern Detection & Classification)
  ↓
P2-07A (Pattern Qualification)
  ↓
P2-07B (Participant Roles)
  ↓
P2-07D (Mechanism Resolution) ← THIS LAYER
  ↓
P2-07E (Dispositor Refinement) - Future
  ↓
P2-10A (Profession Assignment) - Future
```

## Resolution Pipeline

The resolver follows a deterministic pipeline:

1. **Validate input** - Pattern must be present
2. **Qualification gating** - Skip UNQUALIFIED patterns, resolve structurally for INSUFFICIENT_DATA
3. **Filter applicable rules** - Preserve registry order
4. **FlatMap resolve() results** - Apply all applicable rules
5. **Dedupe mechanism types** - Preserve deterministic sort
6. **Build candidates** - Create candidates with evidence and provenance
7. **Return CandidateSet** - One per pattern, never merged

## Qualification Gating Policy

The resolver implements the following qualification gating policy:

- **UNQUALIFIED:** Skip resolution, return empty CandidateSet
- **QUALIFIED:** Resolve normally
- **INSUFFICIENT_DATA:** Resolve structurally (fallback to pattern-level facts)

**Rationale:** This policy ensures that unqualified patterns don't produce candidates, while patterns with insufficient data can still generate structurally-valid candidates for downstream consumption. This is a deliberate design choice to avoid blocking the pipeline when qualification data is missing but pattern structure is valid.

## Rule Table

| Rule ID | Pattern | Mechanism Types | Notes |
|---------|---------|-----------------|-------|
| RULE_MECHANISM_PATTERN_DUSTHANA_8_10 | 8↔10 dusthana transformation | RESEARCH, INVESTIGATION, TRANSFORMATION, INSURANCE, TAXATION, BANKING_FINANCE, COMPLIANCE, CRISIS_MANAGEMENT | Uses canonical edge resolution |
| RULE_MECHANISM_PATTERN_DUSTHANA_12_10 | 12↔10 dusthana transformation | FOREIGN_WORK, REMOTE_WORK, INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT | Uses canonical edge resolution |
| RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10 | Composite 8-12-10 | Union of both 8↔10 and 12↔10 sets (no MIXED, no duplicates) | Subsumes pair rules (see precedence below) |

## Composite-Subsumption Precedence

The composite rule subsumes the pair rules:

- If `RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10` applies for a pattern, the pair rules (`RULE_MECHANISM_PATTERN_DUSTHANA_8_10` and `RULE_MECHANISM_PATTERN_DUSTHANA_12_10`) do NOT also apply for the same pattern.
- This is enforced in the resolver's `resolve()` method by checking composite precedence before applying pair rules.
- This ensures each mechanism type appears exactly once when the composite pattern is present.

## Canonical Edge Resolution

The resolver uses canonical P2-06A predicates from `careerPatternPredicates.ts` to verify house-pair relationships:

- **hasDirectHouseRelationship:** Umbrella predicate that includes directed, common lord, conjunction, aspect, and exchange relationships
- **hasDirectedHouseRelationship:** Directed relationships only (OCCUPIES, ASPECTS)
- **hasCommonLordRelationship:** Common lord relationships
- **getDirectHouseRelationshipIds:** ID-returning umbrella predicate that returns edge IDs for direct relationships

This replaces the prior ID-string check approach (`hasDirectedHouseRelationshipId` in `careerPatternQualification/policyUtils.ts`) with canonical relationship resolution.

**Prior precedent:** The ID-string check was a temporary bridge. The canonical resolution using P2-06A predicates is the correct approach.

### Intersection Invariant

The resolver enforces an intersection invariant in `hasCanonicalHousePairRelationship`:

1. Collect establishing edge IDs for the house pair using `getDirectHouseRelationshipIds` (or the directed variants)
2. Compute the intersection: `pairEstablishingIds ∩ pattern.provenance.establishingRelationshipIds`
3. Return true only if the intersection is non-empty

This ensures that the relationship satisfying the predicate is among the pattern's establishing edges. The current `establishingRelationshipIds.length > 0` + independent predicate check is insufficient — the relationship must be provenanced.

## Evidence Construction

The resolver builds evidence for each candidate using the following sources:

- **PATTERN:** Pattern-derived evidence (always present)
- **PARTICIPANT_ROLE:** Participant role evidence (when participant roles are present)
- **RELATIONSHIP:** Establishing relationship evidence (when establishing relationships exist)
- **establishingEvidence from input:** Pre-built evidence from upstream layers (when present)

Evidence is built using the P2-07C `buildCareerMechanismEvidence` helper, ensuring:
- Source 'PATTERN' for pattern-derived evidence
- Source 'PARTICIPANT_ROLE' where participant roles contributed
- Source 'RELATIONSHIP' for establishing relationships
- Provenance traces to real relationship/participant/evidence IDs, never fabricated

### Establishing-Evidence Source Firewall

The resolver enforces a source firewall in `buildCandidateEvidence` when copying `input.establishingEvidence`:

- Only structural sources are allowed: `PATTERN`, `PARTICIPANT_ROLE`, `RELATIONSHIP`
- Later-stage inputs are filtered out: `D10`, `DISPOSITOR`, `PLANETARY_RELEVANCE`, `PLANETARY_CONDITION`, `LORDSHIP`, `YOGA`, `DASHA`
- This firewall applies anywhere input evidence feeds provenance

The constant `ESTABLISHING_EVIDENCE_SOURCES` defines the allowed structural sources.

### Evidence↔Provenance Set Equality Invariant

The resolver enforces an equality invariant between evidence and provenance:

- In `buildCandidateProvenance`, `evidenceIds` is set to the IDs of the evidence actually attached to the candidate
- Evidence is built before provenance in the resolve() pipeline
- Invariant: `candidate.evidence[*].evidenceId` (sorted) equals `candidate.provenance.evidenceIds` (sorted)
- This ensures provenance traces to the actual evidence, not the input evidence stream

## Per-Pattern Isolation

The resolver maintains per-pattern isolation:

- `resolve(input)` returns one `CandidateSet` per pattern
- `resolveAll(inputs)` returns one `CandidateSet` per input pattern, never merged
- CandidateSets are never merged across patterns
- This preserves pattern-level provenance and allows downstream layers to handle pattern interactions

## Determinism

The resolver is fully deterministic:

- Rules are applied in registry order
- Mechanism types are deduped and sorted
- Candidates are sorted by mechanismType then candidateId
- Evidence is sorted by evidenceId
- Provenance arrays are sorted-unique
- Repeated resolution produces identical output

## Boundary Enforcement

This module must NOT import from:

- `careerDasha`
- `careerD10`
- `careerExpression`
- `careerFinalSynthesis`
- `domain/timing`
- Any AI/profession module

**Boundary test:** A test in `careerMechanismResolver.test.ts` asserts that no such imports exist in the resolver directory.

## Implementation

### Files

- `resolver/careerMechanismResolverTypes.ts` - Type definitions
- `resolver/careerMechanismResolverRules.ts` - Resolution rules
- `resolver/careerMechanismResolverUtils.ts` - Utility functions
- `resolver/defaultCareerMechanismResolver.ts` - Default resolver implementation
- `resolver/careerMechanismResolver.test.ts` - Test suite
- `resolver/index.ts` - Public API exports

### Key Types

```typescript
interface CareerMechanismResolutionInput {
  readonly pattern: CareerPattern;
  readonly qualification: QualifiedCareerPattern;
  readonly participantRoles: readonly ParticipantRoleAssignment[];
  readonly establishingEvidence: readonly CareerMechanismEvidence[];
  readonly networks: readonly CareerHouseNetwork[];
}

interface CareerMechanismResolver {
  resolve(input: CareerMechanismResolutionInput): CareerMechanismCandidateSet;
  resolveAll(inputs: readonly CareerMechanismResolutionInput[]): readonly CareerMechanismCandidateSet[];
}
```

### Exports

The resolver is exported from `careerMechanism/index.ts`:

```typescript
export type {
  CareerMechanismResolutionInput,
  CareerMechanismResolutionRule,
  CareerMechanismResolver
} from './resolver/careerMechanismResolverTypes';

export {
  CAREER_MECHANISM_RESOLUTION_RULES,
  DefaultCareerMechanismResolver,
  defaultCareerMechanismResolver
} from './resolver/defaultCareerMechanismResolver';

export {
  compareCareerMechanismCandidates,
  deduplicateCareerMechanismCandidates,
  mergeCandidateEvidence,
  mergeCandidateProvenances,
  createCareerMechanismCandidateSet
} from './resolver/careerMechanismResolverUtils';
```

## Testing

The test suite (`resolver/careerMechanismResolver.test.ts`) covers:

- **Positive cases per rule:** 8↔10, 12↔10, composite producing the union with no MIXED and no duplicates
- **Negative cases:** House pair present but no establishing relationship between those specific houses → no candidates (firewall test)
- **Rule-precedence test:** Composite input emits each type exactly once, rule attribution correct
- **Qualification gating:** UNQUALIFIED → empty, INSUFFICIENT_DATA → structural resolution, QUALIFIED → normal
- **resolveAll per-pattern isolation:** One CandidateSet per pattern, never merged
- **Determinism:** Repeat resolve → identical output
- **Mechanism type validation:** Every emitted `mechanismType` exists in `CAREER_MECHANISM_DEFINITIONS`
- **Provenance traceability:** Provenance traces to real relationship/participant/evidence IDs, never fabricated
- **Boundary enforcement:** Asserts no forbidden imports in resolver directory
- **Regression test A (intersection invariant):** Pattern houses [8,10], establishing = `['REL:6→10']`, but mock network contains real `REL:8→10` edge AND the 6→10 edges → asserts zero candidates because intersection is empty
- **Regression test B (establishing-evidence source firewall):** Pass `establishingEvidence` containing records with `source: 'D10'` and `'DISPOSITOR'` → asserts they do not appear in `candidate.evidence` nor in `provenance.evidenceIds`
- **Regression test C (provenance linkage):** Asserts `candidate.evidence.map(e=>e.evidenceId).sort()` equals `candidate.provenance.evidenceIds.slice().sort()` for every emitted candidate

## Future Work

### P2-07E Dispositor Refinement

Future phases will add dispositor refinement (P2-07E) to qualify and refine mechanism candidates based on dispositor chains and planetary conditions.

### Additional Rules

As more pattern families are frozen (Kendra-Trikona, Parivartana, Career Yoga), additional resolution rules will be added to the registry. Only proven mappings are added; speculative rules are deferred until their evidence contract is stable.

### Composite Rule Extensions

The composite-subsumption pattern may be extended to other composite patterns (e.g., Kendra-Trikona composites) in future phases.

## Commit Label

**Note:** Future commits should use P2-07D, not P2-08D. The commit 91fc94052c was mislabeled.
