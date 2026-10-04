# P2-06B — Dusthana Relationship Validation

> **STATUS: IMPLEMENTED — VERIFICATION PENDING**

## Purpose

P2-06B implements a structural relationship validator for dusthana houses (6, 8, 12) and career anchor houses (2, 6, 10, 11). This module validates which relationships are established between these house pairs, returning evidence records that identify the specific graph edges that establish each relationship.

This is a structural relationship VALIDATOR — no scoring, no confidence numbers, no mechanism inference, no dignity/Dasha/D10/transit/timing.

## Relationship Types Validated

The following relationship types are detected and validated:

| Relationship Type | Description | Evidence Semantics |
|-------------------|-------------|-------------------|
| COMMON_LORD | Shared planet lords both houses | LORD_OF edges from shared planet to both houses |
| CROSS_LORDSHIP | Planet lords dusthana and occupies/aspects career anchor (and reverse) | OCCUPIES/ASPECTS edges from dusthana lord to anchor, plus LORD_OF edges |
| CONJUNCTION | Lords of two houses are conjunct | CONJUNCT edge between lords + LORD_OF edges identifying both lords |
| ASPECT | Lords of two houses aspect each other | ASPECTS edge between lords + LORD_OF edges identifying both lords |
| EXCHANGE | Lords of two houses exchange positions | EXCHANGES edge between lords + LORD_OF edges identifying both lords |
| HOUSE_PLACEMENT | Dusthana lord occupies career anchor house | OCCUPIES edge + dusthana LORD_OF edge |
| PLANET_MEDIATED | Shared planet participation with no direct house-to-house edge | Shared planet's LORD_OF/OCCUPIES/ASPECTS edges into both houses |

## Key Implementation Details

### Evidence Records

**One Evidence Record Per RelationshipId**: Each evidence record references exactly one establishing edge (relationshipId). A COMMON_LORD validation over Saturn lords 8+10 yields two evidence entries — one for `REL:LORD_OF:SATURN:8`, one for `REL:LORD_OF:SATURN:10` — never a single `relationshipId` containing commas.

This invariant ensures:
- Precise traceability from evidence to specific graph edges
- No loss of granularity when multiple edges establish a relationship
- Consistent evidence structure across all relationship types

### PLANET_MEDIATED Evidence Semantics

PLANET_MEDIATED is defined by the ABSENCE of direct house-to-house relationships (COMMON_LORD, CROSS_LORDSHIP, CONJUNCTION, ASPECT, EXCHANGE, HOUSE_PLACEMENT). When only shared planet participation exists (via lordship, OCCUPIES, or ASPECTS), PLANET_MEDIATED is emitted.

The establishing evidence for PLANET_MEDIATED is the shared-participation edges themselves:
- LORD_OF edges from the shared planet to both houses
- OCCUPIES edges from the shared planet to both houses
- ASPECTS edges from the shared planet to both houses

These edges are the establishing evidence because they demonstrate the shared participation that defines the relationship, even though the relationship is semantically about what's NOT present (direct edges).

### Evidence Construction

Evidence records are constructed directly from structured evidence candidates generated during validation. The encode-then-parse pattern (previously used to embed metadata in evidenceId strings) has been removed in favor of:

1. `validatePair` returns structured `EvidenceCandidate` objects containing networkId, networkIdentityKey, relationshipId, relationshipType, and house information
2. `validateDusthanaRelationships` constructs `DusthanaRelationshipEvidence` records directly from these candidates
3. evidenceId is generated deterministically from structured fields for identity purposes but never parsed back

### Aggregate vs Summarize

The function previously named `aggregateDusthanaRelationshipValidation` has been renamed to `summarizeDusthanaRelationshipValidation` to clarify its contract:

- **`summarizeDusthanaRelationshipValidation`**: A summary-only projection that computes counts and provenance from validations. Does NOT reconstruct evidence records since it only has validations, not the original networks. Evidence construction requires network access to resolve sourceNetworkIdentityKey.
- **`validateDusthanaRelationships`**: The canonical validation function that returns the full result including evidence records.

The old `aggregateDusthanaRelationshipValidation` name is kept as a deprecated alias for backward compatibility.

## Detector Functions

Each relationship type has a dedicated detector function that returns the exact edge identity keys that establish the relationship:

- `detectCommonLord`: Returns LORD_OF edges from shared planet to both houses
- `detectCrossLordship`: Returns OCCUPIES/ASPECTS edges establishing directed relationship in both directions
- `detectConjunction`: Returns CONJUNCT edges between lords plus LORD_OF edges
- `detectAspect`: Returns ASPECTS edges between lords plus LORD_OF edges
- `detectExchange`: Returns EXCHANGES edges between lords plus LORD_OF edges
- `detectHousePlacement`: Returns OCCUPIES edge plus dusthana LORD_OF edge
- `detectPlanetMediated`: Returns shared planet's LORD_OF/OCCUPIES/ASPECTS edges into both houses

## Validation Flow

For every dusthana-anchor pair:

1. Find networks containing both houses → none → NOT_VALIDATED
2. Check for sufficient data (lordship edges present) → none → INSUFFICIENT_DATA
3. Run detectors over network.relationships and network.lords
4. Emit one validation record per relationship type actually established
5. Construct evidence records from structured candidates (one per establishing edge)

Multiple relationship types per pair coexist (never collapse to one). Multi-lord houses evaluate ALL lord combinations. Identity normalization: undirected types normalize endpoints canonically; directed types keep order. Dedup by relationshipId across networks.

## Test Coverage

Comprehensive test suite covers:

- All relationship type detection with correct establishing edge IDs
- PLANET_MEDIATED detection with shared participation and no direct edge
- PLANET_MEDIATED suppression when direct relationship exists
- One evidence record per relationshipId invariant (no comma-separated relationshipIds)
- Provenance tracking (evidence records reference exact establishing edges)
- Multi-lord handling
- INSUFFICIENT_DATA vs NOT_VALIDATED distinction
- Deduplication across networks
- Determinism with permuted network order

## Boundary Enforcement

This module must NOT import from:
- careerDasha
- careerD10
- careerFinalSynthesis
- careerExpression*
- domain/timing

## Verification

Run `npm run lint` (`tsc --noEmit`) and the `careerPattern` test suite to verify:
- Type checking passes
- All validation tests pass
- Evidence records have single-valued relationshipId
- PLANET_MEDIATED returns establishing edge IDs
