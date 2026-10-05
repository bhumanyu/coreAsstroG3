# P2-07C Career Mechanism Model

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

This module defines the canonical mechanism MODEL only — no resolution rules, no pattern→mechanism mapping (that's P2-07D), no dispositor refinement (P2-07E).

The mechanism model provides the pure data model for career mechanisms: the vocabulary, families, pathways, status, evidence sources, and canonical records. Mechanisms are structural classifications of HOW career activity manifests, not WHAT profession a person has.

## Module Structure

```
src/domain/career/careerMechanism/
├── careerMechanismTypes.ts          # Type definitions (§3–§11, §20–§21)
├── careerMechanismRegistry.ts       # Mechanism definitions registry (§18)
├── careerMechanismUtils.ts          # Utility functions (§16)
├── careerMechanismEvidence.ts       # Evidence helpers (§9)
├── careerMechanismProvenance.ts     # Provenance helpers (§10)
├── careerMechanismTypes.test.ts     # Test suites (§23–§31)
└── index.ts                         # Public API exports (§22)
```

## Type Definitions (§3–§11, §20–§21)

### CareerMechanismType (§4)

The canonical mechanism vocabulary union. These are structural classifications of HOW career activity manifests, not WHAT profession.

**Members:**
- Expression family: AGENCY, SELF_DIRECTION, INITIATIVE, VISIBILITY, STATUS, AUTHORITY, LEADERSHIP, STRATEGY, ADVISORY, TEACHING, INNOVATION, DECISION_MAKING, COMMUNICATION, WRITING, PUBLIC_INTERFACE, CLIENT_INTERACTION, CONTRACTUAL_INTERACTION, PARTNERSHIP, COMMERCIAL_INTERACTION, ENTREPRENEURIAL_EFFORT
- Execution family: EXECUTION, HANDS_ON_CAPABILITY, COURAGE, SELF_EFFORT, SKILL_DEVELOPMENT, SERVICE_EMPLOYMENT, COMPETITION, PROFESSIONALIZATION, PROFESSIONAL_GAINS, CREATIVE_INTELLECTUAL, DHARMA_DRIVEN_PROFESSION, AUTHORITY_LEADERSHIP, STABILITY, WORK_ENVIRONMENT, ADMINISTRATIVE_FOUNDATION, EXPENDITURE
- Knowledge family: INTELLIGENCE, SPECIALIZED_KNOWLEDGE, RESEARCH, INVESTIGATION, TRANSFORMATION
- Business family: BUSINESS, CONSULTING, BANKING_FINANCE, INSURANCE, TAXATION, COMPLIANCE, RISK, CRISIS, CRISIS_MANAGEMENT
- Institutional family: INSTITUTIONAL_BASE, INSTITUTIONAL_SERVICE, INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT, STABILITY, WORK_ENVIRONMENT, ADMINISTRATIVE_FOUNDATION
- Transformation family: RISK, CRISIS, CRISIS_MANAGEMENT
- Foreign family: FOREIGN, FOREIGN_WORK, REMOTE_WORK

**Note:** MIXED was removed from the union. Mixed resolution should be represented structurally on the candidate/result model (e.g., a set containing multiple candidates) rather than as a mechanism type.

### CareerMechanismFamily (§3)

High-level groupings of related mechanism types:
- EXPRESSION
- EXECUTION
- KNOWLEDGE
- COMMUNICATION
- BUSINESS
- INSTITUTIONAL
- TRANSFORMATION
- FOREIGN

### CareerMechanismPathway (§5)

How a mechanism is detected or derived:
- HOUSE
- PLANETARY
- RELATIONSHIP
- PATTERN
- YOGA
- DISPOSITOR
- COMBINED

### CareerMechanismStatus (§7)

Lifecycle status of a mechanism:
- CANDIDATE
- QUALIFIED
- REFINED
- INSUFFICIENT_DATA

**Note:** Do NOT reuse P2-07A qualification status.

### CareerMechanismEvidenceSource (§8)

Where evidence for a mechanism comes from:
- PATTERN
- PARTICIPANT_ROLE
- PLANETARY_RELEVANCE
- PLANETARY_CONDITION
- LORDSHIP
- RELATIONSHIP
- YOGA
- DISPOSITOR
- D10

**Invariant:** 'D10' is allowed ONLY as refinement evidence, NEVER as an establishing source. This invariant is enforced at the builder level (buildCareerMechanismEvidence throws for D10).

### CareerMechanismRefinementSource (§8)

Sources that can ONLY be used for refinement evidence, never establishing:
- D10

Currently only 'D10' is a refinement-only source. Future refinement sources are added to this union. The `buildRefiningMechanismEvidence` and `buildRefiningMechanismEvidenceArray` functions are restricted to accept only this type.

### CareerMechanismEvidenceRole (§9)

Distinguishes between establishing and refinement evidence:
- ESTABLISHING: Evidence that initially establishes a mechanism candidate (structural sources)
- REFINING: Evidence that refines or qualifies an existing mechanism (e.g., D10)

**Invariant:** ESTABLISHING evidence can never carry source: 'D10'. This is enforced by the evidence builders.

### CareerMechanismDefinition (§11)

Static metadata for each mechanism type:
```typescript
interface CareerMechanismDefinition {
  readonly type: CareerMechanismType;
  readonly family: CareerMechanismFamily;
  readonly description: string;
}
```

### CareerMechanismEvidence (§9)

Evidence record for a mechanism. Must cite real participant/relationship IDs; no fabrication.
```typescript
interface CareerMechanismEvidence {
  readonly evidenceId: string;
  readonly mechanismType: CareerMechanismType;
  readonly source: CareerMechanismEvidenceSource;
  readonly role: CareerMechanismEvidenceRole;
  readonly participantIds: readonly ParticipantId[];
  readonly relationshipIds: readonly string[];
  readonly patternId?: string;
  readonly explanation: string;
}
```

### CareerMechanismSourceStage (§10)

Tracks the stage or source type that contributed to a mechanism. Currently aliased to CareerMechanismEvidenceSource as stages and sources are identical in the current model. If stages diverge from sources in the future, this should be changed to an explicit union.

### CareerMechanismProvenance (§10)

Provenance tracking for a mechanism:
```typescript
interface CareerMechanismProvenance {
  readonly patternIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly participantIds: readonly ParticipantId[];
  readonly evidenceIds: readonly string[];
  readonly sourceStages: readonly CareerMechanismSourceStage[];
}
```

### CareerMechanism (§6)

Canonical mechanism record:
```typescript
interface CareerMechanism {
  readonly mechanismId: string;
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly pathway: CareerMechanismPathway;
  readonly participants: readonly ParticipantId[];
  readonly coreParticipants: readonly ParticipantId[];
  readonly supportingParticipants: readonly ParticipantId[];
  readonly challengingParticipants: readonly ParticipantId[];
  readonly status: CareerMechanismStatus;
  readonly explanation: string;
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
}
```

### CareerMechanismInput (§13)

Input for mechanism creation:
```typescript
interface CareerMechanismInput {
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly pathway: CareerMechanismPathway;
  readonly participants: readonly ParticipantId[];
  readonly coreParticipants: readonly ParticipantId[];
  readonly supportingParticipants: readonly ParticipantId[];
  readonly challengingParticipants: readonly ParticipantId[];
  readonly status: CareerMechanismStatus;
  readonly explanation: string;
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
}
```

### CareerMechanismCandidate (§14)

Candidate mechanism before qualification:
```typescript
interface CareerMechanismCandidate {
  readonly candidateId: string;
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly pathway: CareerMechanismPathway;
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
  readonly explanation: string;
}
```

### CareerMechanismCandidateSet (§15)

Collection of mechanism candidates with set-level provenance:
```typescript
interface CareerMechanismCandidateSet {
  readonly patternId: string;
  readonly candidates: readonly CareerMechanismCandidate[];
  readonly evidence: readonly CareerMechanismEvidence[];
  readonly provenance: CareerMechanismProvenance;
}
```

The evidence and provenance fields represent the aggregate of all candidates, deduplicated and sorted via mergeCareerMechanismProvenances.

## Registry (§18)

### CAREER_MECHANISM_DEFINITIONS

Hand-written definition for EVERY enum member (no generated descriptions). Provides static metadata for all mechanism types.

### CareerMechanismRegistry Interface

```typescript
interface CareerMechanismRegistry {
  get(type: CareerMechanismType): CareerMechanismDefinition;
  has(type: CareerMechanismType): boolean;
  all(): readonly CareerMechanismDefinition[];
  getByFamily(family: CareerMechanismFamily): readonly CareerMechanismDefinition[];
}
```

### DefaultCareerMechanismRegistry

Default implementation of the registry interface. Provides canonical lookup operations.

**Note:** Registry ≠ resolver — this is a static lookup table for mechanism metadata, not a mechanism resolution engine (that's P2-07D).

## Utility Functions (§16)

### ID Generation

- `createCareerMechanismId(patternId, mechanismType)` → `CAREER_MECHANISM:{patternId}:{type}`
- `createCareerMechanismCandidateId(patternId, mechanismType)` → `CAREER_MECHANISM_CANDIDATE:{patternId}:{type}`
- `createCareerMechanismEvidenceId(mechanismId, source, participantIds, relationshipIds)` → `CAREER_MECHANISM_EVIDENCE:{mechanismId}:{source}:P[{participants}]:R[{relationships}]`

**Evidence ID encoding:** The P[] and R[] segment markers are always emitted (with empty brackets when empty) to ensure segment position is unambiguous. This prevents boundary collisions where participant and relationship data could be misinterpreted (e.g., `['A'], ['B']` vs `[], ['A:B']`).

**Evidence ID canonicalization rule:** Two evidence units differing in any array member must produce different IDs.

### Participant Ordering

- `compareParticipantIds(a, b)` — Compares using canonical planet order
- `sortParticipantIds(participantIds)` — Sorts using canonical planet order

### Evidence Deduplication

- `deduplicateCareerMechanismEvidence(evidence)` — Maps by evidenceId, sorts by evidenceId, returns frozen array

### Mechanism Creation

- `createCareerMechanism(input)` — Deep-freezes all arrays and rebuilds provenance.evidenceIds from deduplicated evidence

**Note:** No Date/random/UUID usage — all IDs are deterministic and derived from input data.

## Evidence Helpers (§9)

- `buildCareerMechanismEvidence(input)` — Builds evidence record with validation (role: 'ESTABLISHING')
- `buildRefiningMechanismEvidence(input)` — Builds refining evidence record (role: 'REFINING', source restricted to CareerMechanismRefinementSource)
- `buildCareerMechanismEvidenceArray(inputs)` — Builds multiple evidence records
- `buildRefiningMechanismEvidenceArray(inputs)` — Builds multiple refining evidence records (source restricted to CareerMechanismRefinementSource)

### Per-Source Validation Matrix

The following validation rules are enforced by `buildCareerMechanismEvidence`:

| Source | Required Fields |
|--------|-----------------|
| PATTERN | patternId |
| PARTICIPANT_ROLE | participantIds (non-empty) |
| PLANETARY_RELEVANCE | participantIds (non-empty) |
| PLANETARY_CONDITION | participantIds (non-empty) |
| LORDSHIP | relationshipIds (non-empty) |
| RELATIONSHIP | relationshipIds (non-empty) |
| YOGA | relationshipIds (non-empty) |
| DISPOSITOR | relationshipIds (non-empty) AND participantIds (non-empty) |
| D10 | Not allowed in buildCareerMechanismEvidence (use buildRefiningMechanismEvidence) |

## Provenance Helpers (§10)

- `buildCareerMechanismProvenance(input)` — Builds provenance with sorted-unique arrays
- `mergeCareerMechanismProvenances(provenances)` — Merges multiple provenance records
- `areProvenancesEqual(a, b)` — Checks if two provenance records are equal

## Public API (§22)

The module exports exactly the following:

**Types:**
- CareerMechanismType
- CareerMechanismFamily
- CareerMechanismPathway
- CareerMechanismStatus
- CareerMechanismEvidenceSource
- CareerMechanismRefinementSource
- CareerMechanismEvidenceRole
- CareerMechanismSourceStage
- CareerMechanismDefinition
- CareerMechanismEvidence
- CareerMechanismProvenance
- CareerMechanism
- CareerMechanismInput
- CareerMechanismCandidate
- CareerMechanismCandidateSet

**Registry:**
- CAREER_MECHANISM_DEFINITIONS
- DefaultCareerMechanismRegistry
- defaultCareerMechanismRegistry
- CareerMechanismRegistry (type)

**Utils:**
- createCareerMechanismId
- createCareerMechanismCandidateId
- createCareerMechanismEvidenceId
- compareParticipantIds
- sortParticipantIds
- deduplicateCareerMechanismEvidence
- createCareerMechanism
- createCareerMechanismCandidate

**Evidence helpers:**
- buildCareerMechanismEvidence
- buildRefiningMechanismEvidence
- buildCareerMechanismEvidenceArray
- buildRefiningMechanismEvidenceArray

**Provenance helpers:**
- buildCareerMechanismProvenance
- mergeCareerMechanismProvenances
- areProvenancesEqual

## Test Suites (§23–§31)

### §23 Deterministic Identity

Tests that mechanism IDs, candidate IDs, and evidence IDs are deterministic and reproducible. Includes regression tests for:
- Changing only participant membership changes the ID
- Changing only relationship membership changes the ID
- Boundary collision cases (e.g., `['A'], ['B']` vs `[], ['A:B']`) produce different IDs with P[]/R[] encoding

### §24 Distinct Identity Per Type

Tests that different mechanism types produce distinct IDs.

### §25 Candidate≠Qualified (No Silent Conversion API)

Tests that there is no API that silently converts candidates to qualified mechanisms.

### §26 Missing-Evidence → INSUFFICIENT_DATA with Empty Evidence

Tests that missing evidence results in INSUFFICIENT_DATA status with empty evidence array (missing ≠ negative).

### §27 Evidence Deduplication

Tests that evidence is deduplicated by evidenceId.

### §28 Evidence Ordering

Tests that evidence is sorted by evidenceId.

### §29 Core/Supporting/Challenging Preservation

Tests that core, supporting, and challenging participant arrays are preserved.

### §30 Mechanism-Not-Profession Guard

Tests that mechanism types do not contain profession-specific values (e.g., SOFTWARE_ENGINEER, BANKER, DOCTOR).

### §31 No DASHA in CareerMechanismEvidenceSource

Tests that DASHA is not included in CareerMechanismEvidenceSource and that no createMechanismFromD10 API exists.

### No Scoring Fields

Tests that the model does not contain score, strength, confidence, or weight fields.

## Guardrails (§33)

1. **Evidence-Role Invariant Enforcement:** The ESTABLISHING vs REFINING evidence role invariant is enforced at the builder level, not deferred to P2-07D. `buildCareerMechanismEvidence` assigns `role: 'ESTABLISHING'` and throws for `source: 'D10'`. `buildRefiningMechanismEvidence` assigns `role: 'REFINING'` and accepts only CareerMechanismRefinementSource (currently only 'D10').

2. **Mechanism ≠ Profession:** Mechanism types do NOT contain profession-specific values like SOFTWARE_ENGINEER, BANKER, DOCTOR. Those belong in a later synthesis layer.

3. **No DASHA Evidence Source:** DASHA is not included in CareerMechanismEvidenceSource. Timing-related evidence is handled in a separate layer.

4. **D10 as Refinement Only:** 'D10' in CareerMechanismEvidenceSource is allowed ONLY as refinement evidence, NEVER as an establishing source. This invariant is enforced at the builder level (buildCareerMechanismEvidence throws for D10) and by the CareerMechanismRefinementSource type restriction on buildRefiningMechanismEvidence.

5. **No Scoring Fields:** The model does not contain score, strength, confidence, weight, or qualificationScore fields anywhere.

6. **No Silent Conversion:** There is no API that silently converts candidates to qualified mechanisms. Conversion must be explicit.

7. **Missing ≠ Negative:** Missing evidence results in INSUFFICIENT_DATA status with empty evidence array. Negative evidence is explicit evidence with negative findings.

8. **Deterministic IDs:** All IDs are deterministic and derived from input data. No Date/random/UUID usage.

9. **Evidence Citation:** Evidence records cite real participant/relationship IDs. No fabrication of evidence.

10. **Boundary Enforcement:** The module must NOT import from careerDasha, careerD10, careerExpression, careerFinalSynthesis, or domain/timing.

11. **Registry ≠ Resolver:** The registry is a static lookup table for mechanism metadata, not a mechanism resolution engine. Resolution logic is in P2-07D.

12. **Builders as Sole Construction Path:** CareerMechanismEvidence should be constructed only through the builder functions (buildCareerMechanismEvidence, buildRefiningMechanismEvidence). Manual construction may violate the evidence-role invariant. The type system does not currently enforce this invariant at the type level (discriminated union), so builders are the canonical construction path.

## Migration Notes

### Naming Collision Resolution

The existing `CareerMechanism` type in `src/domain/career/careerPattern/careerPatternTypes.ts` has been renamed to `CareerMechanismType` and moved to `careerMechanism/careerMechanismTypes.ts`.

**Updated files:**
- `careerPatternTypes.ts` — Added import of CareerMechanismType, changed export to deprecated type alias
- `kendraTrikonaDetector.ts` — Updated import and type references
- `dusthanaTransformationDetector.ts` — Updated import and type references
- `careerPatternAnalysis.ts` — Updated import and type references
- `careerPatternClassificationRules.ts` — Updated import and type references

The old `CareerMechanism` name is retained as a deprecated type alias in `careerPatternTypes.ts` for backward compatibility:
```typescript
/** @deprecated Use CareerMechanismType from careerMechanism/careerMechanismTypes.ts instead. */
export type CareerMechanism = CareerMechanismType;
```

This alias exists only for external callers until removal. Internal consumers have been migrated to use `CareerMechanismType` directly.

### Taxonomy Freeze Note

The following mechanism types are marked as borderline-domain (mechanism vs domain vs outcome) and should be reviewed in P2-07D:
- BANKING_FINANCE
- INSURANCE
- TAXATION
- COMPLIANCE
- FOREIGN_WORK
- REMOTE_WORK
- INSTITUTIONAL_WORK
- PROFESSIONAL_GAINS

These types are annotated with `@review P2-07D` comments in the registry and type definitions. The decision should be made before the resolver consumes the union:
- If mechanism: keep as-is
- If domain: move to a separate domain taxonomy
- If outcome: move to a separate outcome/impact taxonomy

**MIXED removal:** MIXED was removed from the union and registry. Mixed resolution should be represented structurally on the candidate/result model (e.g., a set containing multiple candidates) rather than as a mechanism type.

## Taxonomy Decisions Deferred to P2-07D

The following taxonomy ambiguities are intentionally frozen in P2-07C and deferred to P2-07D for resolution:

### Multi-Family Mechanism Types

The following mechanism types currently appear in multiple families in the `CareerMechanismType` union. This represents an intentional design decision that a mechanism can belong to multiple families, rather than an error requiring deduplication:

- **RISK**: Appears in both BUSINESS and TRANSFORMATION families
- **CRISIS**: Appears in both BUSINESS and TRANSFORMATION families
- **CRISIS_MANAGEMENT**: Appears in both BUSINESS and TRANSFORMATION families

This overlap allows mechanisms to be classified from multiple perspectives (e.g., a crisis can be both a business challenge and a transformational trigger). P2-07D should confirm whether this multi-family classification is the intended design or whether consolidation is needed.

### TRANSFORMATION as Both Type and Family

`TRANSFORMATION` currently has dual roles in the taxonomy:
1. As a mechanism type under the KNOWLEDGE family in the `CareerMechanismType` union
2. As a family label in the `CareerMechanismFamily` union

P2-07D should determine whether this is:
- A deliberate classification (TRANSFORMATION as a mechanism type happens to be categorized under KNOWLEDGE, while also being a higher-level family concept)
- An inconsistency that should be resolved before the resolver consumes the union

This decision affects how the P2-07D resolver interprets the union and constructs mechanism-family mappings.
