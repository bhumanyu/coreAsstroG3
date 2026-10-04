# P2-06D Provenance Continuity

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

P2-06D is a narrow provenance-hardening wave that strengthens the provenance chain for Career pattern classification. It introduces fine-grained provenance tracking with strict validation to prevent fabrication of synthetic relationship IDs.

## Provenance Chain Diagram

```
CareerHouseNetwork (network.relationships)
         │
         ├── edge.identityKey (actual edges in graph)
         │
         ▼
CareerPatternRuleMatch (establishingRelationshipIds, supportingRelationshipIds)
         │
         ├── Validation: every ID must resolve to edge in network.relationships
         ├── Rejection: fabricated IDs → error, never fallback
         │
         ▼
buildPatternProvenance()
         │
         ├── Dedupe + sort all ID collections
         ├── Derive evidence IDs: P2-06D-EVIDENCE:{relationshipId}
         ├── Deep freeze all collections
         │
         ▼
CareerPatternClassificationProvenance
         │
         ├── sourceNetworkIds: readonly string[]
         ├── relationshipIds: readonly string[] (establishing ∪ supporting, backward compat)
         ├── ruleIds: readonly string[]
         ├── establishingRelationshipIds: readonly string[] (new)
         └── supportingRelationshipIds: readonly string[] (new)
```

## Establishing vs Supporting Relationship Contract

### Establishing Relationships
- **Definition:** Relationship IDs that directly establish the pattern classification
- **Requirement:** Must be provided by classifiers in `CareerPatternRuleMatch.establishingRelationshipIds`
- **Validation:** Every ID must resolve to a `CareerGraphEdge` in `network.relationships` via `edge.identityKey`
- **Evidence:** One `CareerPatternClassificationEvidence` per establishing relationship with `relationshipId` field

### Supporting Relationships
- **Definition:** Relationship IDs that provide context but do not directly establish the pattern
- **Requirement:** Optional; classifiers may provide in `CareerPatternRuleMatch.supportingRelationshipIds`
- **Validation:** Every ID must resolve to a `CareerGraphEdge` in `network.relationships` via `edge.identityKey`
- **Evidence:** No direct evidence records; included in provenance for traceability

### Backward Compatibility
- The legacy `relationshipIds` field is retained and populated as `establishingRelationshipIds ∪ supportingRelationshipIds`
- Existing consumers that read `provenance.relationshipIds` continue to work without modification
- New consumers should prefer `establishingRelationshipIds` for establishing evidence and `supportingRelationshipIds` for context

## Generic Carrier Exception

**CONTRACT:** `CAREER_HOUSE_NETWORK` is the generic carrier classification.

- **Behavior:** Its `establishingRelationshipIds` may legitimately span the whole network per its contract
- **Reason:** As a structural carrier, it represents the entire network's connectivity pattern
- **Distinction:** Specialized classifications (e.g., `WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS`) must only carry establishing IDs that directly establish the specific semantic pattern
- **Implementation:** This distinction is contractual at the classifier level, not inferred by the provenance builder

**Code Comment Freeze:**
```typescript
// GENERIC CARRIER EXCEPTION:
// CAREER_HOUSE_NETWORK is the generic carrier — its establishingRelationshipIds may legitimately
// span the whole network per its contract. Specialized classifications must only carry establishing
// IDs that directly establish the specific pattern. This distinction is contractual, not inferred.
```

## No-Fabrication Rule

**PRINCIPLE:** Never emit synthetic or fallback relationship IDs.

**Validation:**
- Every `establishingRelationshipId` and `supportingRelationshipId` must resolve to a `CareerGraphEdge` actually present in `network.relationships` via `edge.identityKey`
- If any ID is fabricated (missing from network), `buildPatternProvenance` throws `RelationshipNotFoundError`
- No fallback/synthetic relationship IDs are ever emitted

**Error Handling:**
- Missing establishing relationship → pattern NOT emitted (classification returns empty match array)
- Missing supporting relationship → error thrown (supporting IDs must also be valid)
- Consumers must handle `RelationshipNotFoundError` and treat missing data as `INSUFFICIENT_DATA`

**Rationale:** Fabricated IDs break the provenance chain and make audit impossible. Strict validation ensures every relationship ID can be traced back to an actual edge in the graph.

## Canonical Ordering Guarantees

All ID collections are deduplicated and deterministically sorted:

1. **Deduplication:** `Array.from(new Set(ids))` removes duplicates
2. **Sorting:** `.sort()` ensures deterministic order (string locale compare)
3. **Freezing:** `Object.freeze()` prevents mutation after construction

**Guarantee:** Input permutations produce identical canonical provenance.

```typescript
canonicalizeProvenance({
  sourceNetworkIds: ['B', 'A'],
  establishingRelationshipIds: ['Z', 'Y', 'X'],
  supportingRelationshipIds: ['B', 'A'],
  ruleIds: ['RULE_2', 'RULE_1']
})
// Returns:
// {
//   sourceNetworkIds: ['A', 'B'],
//   establishingRelationshipIds: ['X', 'Y', 'Z'],
//   supportingRelationshipIds: ['A', 'B'],
//   ruleIds: ['RULE_1', 'RULE_2']
// }
```

## Evidence ID Derivation

**Formula:** `P2-06D-EVIDENCE:{relationshipId}`

**Stability:** This formula is frozen and must not be changed without a migration plan.

**Example:**
- Relationship ID: `REL:LORD_OF:SATURN:10`
- Evidence ID: `P2-06D-EVIDENCE:REL:LORD_OF:SATURN:10`

**Distinction:**
- `relationshipId`: References the establishing edge in the graph
- `evidenceId`: Opaque identifier for the evidence record
- `patternId`: Identifier for the pattern itself
- These three IDs are structurally distinct and must not be conflated

## Type Extensions

### CareerPatternClassificationEvidence
```typescript
export interface CareerPatternClassificationEvidence {
  readonly evidenceId: string;
  readonly ruleId: string;
  readonly sourceNetworkId: string;
  readonly sourceNetworkIdentityKey: string;
  readonly relationshipId?: string; // P2-06D: new field
}
```

### CareerPatternClassificationProvenance
```typescript
export interface CareerPatternClassificationProvenance {
  readonly sourceNetworkIds: readonly string[];
  readonly relationshipIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly establishingRelationshipIds: readonly string[]; // P2-06D: new field
  readonly supportingRelationshipIds: readonly string[]; // P2-06D: new field
}
```

### CareerPatternRuleMatch
```typescript
export interface CareerPatternRuleMatch {
  readonly ruleId: string;
  readonly classification: CareerPatternClassification;
  readonly family: 'CAREER_HOUSE_NETWORK' | 'KENDRA_TRIKONA' | 'UPACHAYA' | 'PARIVARTANA';
  readonly houseRoles: Readonly<Record<number, CareerPatternHouseRole>>;
  readonly establishingRelationshipIds: readonly string[];
  readonly supportingRelationshipIds?: readonly string[]; // P2-06D: new field
}
```

## Module: careerPatternProvenance.ts

### Exports

- `buildPatternProvenance(input, network): BuildPatternProvenanceResult`
  - Constructs provenance with strict validation
  - Throws `RelationshipNotFoundError` on fabricated IDs
  - Returns frozen provenance and evidence records

- `canonicalizeProvenance(provenance): CanonicalizedProvenance`
  - Normalizes provenance by deduplicating and sorting all ID collections
  - Ensures input permutations produce identical canonical provenance

### Types

- `BuildPatternProvenanceInput`
- `BuildPatternProvenanceResult`
- `CanonicalizedProvenance`
- `RelationshipNotFoundError`

## Integration Points

### careerPatternClassification.ts
- `buildCareerPattern` now uses `buildPatternProvenance` instead of inline provenance construction
- Emits one `CareerPatternClassificationEvidence` per establishing relationship (with `relationshipId`)
- Retains pattern-level evidence record for backward compatibility
- `deduplicatePatterns` extended to merge `establishingRelationshipIds` and `supportingRelationshipIds`

### careerPatternClassificationRules.ts
- `CareerPatternRuleMatch` extended with optional `supportingRelationshipIds`
- Classifiers may provide supporting IDs; defaults to empty array if not provided

### dusthanaRelationshipValidation.ts
- Aligned only if evidence records need the shared `relationshipId` field
- Detection logic NOT refactored (per spec boundary enforcement)

## Test Coverage

### careerPatternProvenance.test.ts (new)
Covers the spec's matrix:
- Exact establishing IDs on pattern
- Unrelated network edges excluded
- Duplicate establishing IDs collapse to one
- Input permutations produce identical provenance
- Missing establishing relationship → pattern NOT emitted (or reject), never fabricated
- Relationship from network-B cannot establish a pattern on network-A
- Wrong-type/reverse relationships can't establish
- Every `evidenceIds` entry resolves to a real `establishingRelationshipId` and vice versa (no orphans)
- Same edge referenced by two patterns does not produce duplicated underlying evidence identity
- Generic carrier broader than specialized on the same network
- Missing data → `INSUFFICIENT_DATA`/not emitted, never a negative pattern
- Provenance arrays deeply frozen (mutation of `network.relationships` after build doesn't alter pattern)
- Fabricated `"does-not-exist"` ID rejected
- Multiple coexisting patterns keep independent provenance
- Permutation + duplicate canonical-equivalence via `canonicalizeProvenance`
- Real-engine golden (`calculateHoroscope` → C4 → facts → graph → networks → `classifyCareerPatterns`, assert exact `ruleId`/`networkId`/`establishingRelationshipIds`/`evidenceIds` for a pinned canonical pattern)

### careerPatternNegativeSuite.test.ts (extended)
Extended with provenance tests:
- Validation of no-fabrication rule
- Cross-network relationship rejection
- Frozen provenance immutability

## Boundaries (Unchanged)

Per spec, the following are NOT changed:
- C4–C7 careerAstroGraph edge types
- P2-06A predicate semantics
- P2-06B relationship-type taxonomy (PLANET_MEDIATED stays as frozen)
- P2-05 dispositors
- No scoring/Dasha/D10/timing/mechanism logic added
- No `source: string` generic provenance fields

## Verification

Run the following to verify implementation:

```bash
npm run lint  # tsc --noEmit
npm test -- careerPattern
npm test -- careerGraph
npm test -- careerDispositor
npm test -- careerPatternQualification
```

All test suites must pass green.
