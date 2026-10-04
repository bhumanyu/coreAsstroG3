# P2-07B Participant Roles

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

P2-07B is the participant roles layer that sits ABOVE the pattern qualification layer (P2-07A) and consumes qualified patterns, networks, planetary conditions, and relevance results. This layer deterministically assigns participant roles (CORE, SUPPORTING, MODIFIER, CHALLENGING) based on structural evidence from P2-06 and P2-07A facts.

## Role Taxonomy

### CORE
Participants that resolve from `establishingRelationshipIds` edges' `sourceNodeId`/`targetNodeId` where the node is `PLANET:*`. A participant appearing in establishing evidence is CORE, not because of planetary importance.

### SUPPORTING
Participants that appear only in `supportingRelationshipIds` edges and are not CORE/MODIFIER.

### MODIFIER
Participants with an explicit deterministic relationship (CONJUNCT or ASPECTS edge) to an already-established CORE participant. Never semantic interpretation (no "Mercury = communication career").

### CHALLENGING
Participants with a deterministic adverse fact relevant to the pattern:
- An adverse `CareerPlanetaryConditionResult` (affliction/dignity) on a pattern participant
- An explicit adverse edge to a CORE planet

Natural maleficence alone never produces CHALLENGING. Missing evidence never produces CHALLENGING.

## Evidence Source Table

| Source Type | Description | Activation Condition |
|-------------|-------------|---------------------|
| ESTABLISHING_RELATIONSHIP | Participant in establishing relationships | Participant appears in pattern.provenance.establishingRelationshipIds |
| SUPPORTING_RELATIONSHIP | Participant only in supporting relationships | Participant appears only in pattern.provenance.supportingRelationshipIds |
| MODIFIER_RELATIONSHIP | CONJUNCT/ASPECTS edge to CORE participant | Edge between candidate and CORE planet |
| ADVERSE_CONDITION | Adverse planetary condition | WEAK/AFFLICTED/DEBILITATED/SEVERE condition on participant |
| ADVERSE_EDGE | Adverse relationship to CORE participant | DEFERRED — requires frozen P2-06 adverse-edge taxonomy |

## Primary Role Model

### Primary Role Types
- CORE
- SUPPORTING
- MODIFIER

Note: CHALLENGING is excluded from primary role — it is a cross-cutting adverse flag.

### Role Precedence
Primary role assignment follows the precedence: CORE > MODIFIER > SUPPORTING

### Challenging Flag
The `isChallenging` flag is independent of primary role. A CORE participant with challenging evidence keeps `primaryRole: 'CORE'` and `isChallenging: true` with both evidence records.

## Qualification Gate

The qualification status from P2-07A gates role assignment:

- **QUALIFIED** → Full role assignment
- **UNQUALIFIED** → No role assignments (empty result)
- **INSUFFICIENT_DATA** → Only assignments with resolved edge identity (evidence-only or inferred MODIFIER/SUPPORTING assignments are suppressed)

P2-07B NEVER mutates or reinterprets the P2-07A status.

## Candidate Set Contract

`pattern.planets` is the authoritative participant candidate set; graph edges classify candidates, they never create participants not already in `pattern.planets`. The role assignment logic iterates over `pattern.planets` using the canonical planet order, and only participants present in that array are considered for role assignment.

## Missing Evidence Semantics

Missing role policy or missing evidence → no assignment, not negative roles.

Per spec §26: NO `unassignedParticipants` field — only participants with evidence are assigned roles.

## Evidence Identity

### Evidence ID Format
```
P2-07B:EVIDENCE:${ruleId}:${participantId}:${role}:${edge.identityKey}
```

### Deduplication
Deduplication is on `(ruleId, participantId, role, edge.identityKey)`. The same participant may legitimately hold multiple CORE evidence records plus CHALLENGING evidence.

## Determinism

### Assignment Ordering
Assignments are sorted by `CANONICAL_PLANET_ORDER` from `src/domain/career/careerPlanetOrder.ts`.

### Evidence Ordering
`roleEvidence` is sorted by `evidenceId`.

### Output Freezing
All outputs are `Object.freeze` deeply (freeze evidence records, arrays, result).

## Module Structure

```
src/domain/career/careerParticipantRoles/
├── participantRoleTypes.ts          # Core types and interfaces
├── participantRoleUtils.ts          # Utility functions (resolveRelationshipEdges, evidence ID generation)
├── participantRolePredicates.ts    # Role detection predicates
├── participantRoleEngine.ts        # Main engine (assignParticipantRoles)
├── participantRoleRegistry.ts     # Policy registry
├── policies/
│   ├── serviceProfessionGainsRolePolicy.ts
│   └── careerHouseNetworkRolePolicy.ts
├── index.ts                        # Public API re-exports
└── careerParticipantRoles.test.ts  # Comprehensive test suite
```

## Policy Registry

| Classification | Policy | Status |
|----------------|--------|--------|
| SERVICE_TO_PROFESSION_TO_GAINS | serviceProfessionGainsRolePolicy | IMPLEMENTED |
| CAREER_HOUSE_NETWORK | careerHouseNetworkRolePolicy | IMPLEMENTED |
| All other classifications | null | NO POLICY |

## Boundary Enforcement

This module must NOT:
- Perform qualification (P2-07A)
- Calculate mechanisms (P2-07C)
- Assign professions (P2-10A)
- Process Dasha/D10/transit/timing
- Use AI interpretation or semantic role assignment

NO scores, NO qualification changes, NO mechanisms, NO professions, NO Dasha/D10/transit/C11, NO natural-stereotype role assignment.

## Testing

The test suite covers:
- CORE positive/negative (establishing vs supporting-only)
- SUPPORTING positive/negative (establishing+supporting → CORE)
- MODIFIER positive/negative (explicit modifier edge vs unrelated edge)
- CHALLENGING positive/negative (explicit adverse fact vs natural-malefic non-trigger)
- Mixed CORE+CHALLENGING preserving both
- Supporting-evidence-doesn't-change-pattern-identity
- Unrelated-edge invariance (extra unrelated edge → identical output)
- Duplicate-edge canonical equivalence (whole result)
- Relationship-order permutation byte-equality
- Missing-data → no role (not CHALLENGING)
- Qualification-boundary (UNQUALIFIED → empty, status unchanged; INSUFFICIENT_DATA → only evidenced roles)
- No-policy → empty result
- Determinism (canonical ordering, byte-level determinism)
- Evidence identity and deduplication
- Primary role precedence

## References

- Spec §1–§57: P2-07B Participant Roles layer specification
- P2-07A: Pattern Qualification layer
- P2-06: Career graph networks and relationships
- C5: Career Planetary Relevance
- C6: Career Planetary Condition
