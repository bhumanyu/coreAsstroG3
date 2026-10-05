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
- Communication family: TEACHING, COMMUNICATION, WRITING, PUBLIC_INTERFACE, CLIENT_INTERACTION, CONTRACTUAL_INTERACTION, PARTNERSHIP, COMMERCIAL_INTERACTION
- Business family: BUSINESS, CONSULTING, BANKING_FINANCE, INSURANCE, TAXATION, COMPLIANCE, RISK, CRISIS, CRISIS_MANAGEMENT, ENTREPRENEURIAL_EFFORT, COMMERCIAL_INTERACTION, PARTNERSHIP, CONTRACTUAL_INTERACTION, CLIENT_INTERACTION
- Institutional family: INSTITUTIONAL_BASE, INSTITUTIONAL_SERVICE, INSTITUTIONAL_WORK, ISOLATION, STABILITY, WORK_ENVIRONMENT, ADMINISTRATIVE_FOUNDATION
- Transformation family: TRANSFORMATION, RESEARCH, INVESTIGATION, RISK, CRISIS, CRISIS_MANAGEMENT
- Foreign family: FOREIGN, FOREIGN_WORK, REMOTE_WORK
- Legacy: MIXED

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

**Invariant:** 'D10' is allowed ONLY as refinement evidence, NEVER as an establishing source. This invariant must be documented and enforced by the mechanism resolution layer (P2-07D).

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
  readonly participantIds: readonly ParticipantId[];
  readonly relationshipIds: readonly string[];
  readonly patternId?: string;
  readonly explanation: string;
}
```

### CareerMechanismProvenance (§10)

Provenance tracking for a mechanism:
```typescript
interface CareerMechanismProvenance {
  readonly patternIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly participantIds: readonly ParticipantId[];
  readonly evidenceIds: readonly string[];
  readonly sourceStages: readonly string[];
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

Collection of mechanism candidates:
```typescript
interface CareerMechanismCandidateSet {
  readonly patternId: string;
  readonly candidates: readonly CareerMechanismCandidate[];
}
```

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
- `createCareerMechanismEvidenceId(mechanismId, source, participantId, relationshipId)` → `CAREER_MECHANISM_EVIDENCE:{mechanismId}:{source}:{participantId}:{relationshipId}`

### Participant Ordering

- `compareParticipantIds(a, b)` — Compares using canonical planet order
- `sortParticipantIds(participantIds)` — Sorts using canonical planet order

### Evidence Deduplication

- `deduplicateCareerMechanismEvidence(evidence)` — Maps by evidenceId, sorts by evidenceId, returns frozen array

### Mechanism Creation

- `createCareerMechanism(input)` — Deep-freezes all arrays and rebuilds provenance.evidenceIds from deduplicated evidence

**Note:** No Date/random/UUID usage — all IDs are deterministic and derived from input data.

## Evidence Helpers (§9)

- `buildCareerMechanismEvidence(input)` — Builds evidence record with validation
- `buildCareerMechanismEvidenceArray(inputs)` — Builds multiple evidence records

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
- buildCareerMechanismEvidenceArray

**Provenance helpers:**
- buildCareerMechanismProvenance
- mergeCareerMechanismProvenances
- areProvenancesEqual

## Test Suites (§23–§31)

### §23 Deterministic Identity

Tests that mechanism IDs, candidate IDs, and evidence IDs are deterministic and reproducible.

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

1. **Mechanism ≠ Profession:** Mechanism types do NOT contain profession-specific values like SOFTWARE_ENGINEER, BANKER, DOCTOR. Those belong in a later synthesis layer.

2. **No DASHA Evidence Source:** DASHA is not included in CareerMechanismEvidenceSource. Timing-related evidence is handled in a separate layer.

3. **D10 as Refinement Only:** 'D10' in CareerMechanismEvidenceSource is allowed ONLY as refinement evidence, NEVER as an establishing source. This invariant is enforced by the mechanism resolution layer (P2-07D).

4. **No Scoring Fields:** The model does not contain score, strength, confidence, weight, or qualificationScore fields anywhere.

5. **No Silent Conversion:** There is no API that silently converts candidates to qualified mechanisms. Conversion must be explicit.

6. **Missing ≠ Negative:** Missing evidence results in INSUFFICIENT_DATA status with empty evidence array. Negative evidence is explicit evidence with negative findings.

7. **Deterministic IDs:** All IDs are deterministic and derived from input data. No Date/random/UUID usage.

8. **Evidence Citation:** Evidence records cite real participant/relationship IDs. No fabrication of evidence.

9. **Boundary Enforcement:** The module must NOT import from careerDasha, careerD10, careerExpression, careerFinalSynthesis, or domain/timing.

10. **Registry ≠ Resolver:** The registry is a static lookup table for mechanism metadata, not a mechanism resolution engine. Resolution logic is in P2-07D.

## Migration Notes

### Naming Collision Resolution

The existing `CareerMechanism` type in `src/domain/career/careerPattern/careerPatternTypes.ts` has been renamed to `CareerMechanismType` and moved to `careerMechanism/careerMechanismTypes.ts`.

**Updated files:**
- `careerPatternTypes.ts` — Added import of CareerMechanismType, changed export to type alias
- `kendraTrikonaDetector.ts` — Updated import and type references
- `dusthanaTransformationDetector.ts` — Updated import and type references
- `careerPatternAnalysis.ts` — Updated import and type references
- `careerPatternClassificationRules.ts` — Updated import and type references

The old `CareerMechanism` name is retained as a type alias in `careerPatternTypes.ts` for backward compatibility:
```typescript
export type CareerMechanism = CareerMechanismType;
```

This alias can be removed in a future cleanup wave after all call sites have been updated to use `CareerMechanismType` directly.
