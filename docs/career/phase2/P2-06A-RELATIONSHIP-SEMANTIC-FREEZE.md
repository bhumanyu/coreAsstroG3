# P2-06A — Relationship Semantic Freeze

> **STATUS: IMPLEMENTED — VERIFICATION PENDING**

## Purpose

P2-06A freezes the relationship semantics used in career pattern predicates. This freeze defines directional and non-directional relationship types, and explicitly excludes undirected relationships from ordered pathway validation.

## Relationship Semantics (FROZEN)

The following relationship semantics are frozen and must not be changed without explicit approval:

| Relationship Type | Directional | Ordered Pathway | Notes |
|-------------------|-------------|-----------------|-------|
| COMMON_LORD | No | No | Undirected, can never satisfy directed relationships or ordered chains |
| OCCUPIES | Yes | Yes | Directional (planet→house), establishes ordered pathways |
| ASPECTS (house target) | Yes | Yes | Directional (planet→house), establishes ordered pathways |
| ASPECTS (planet target) | Yes | Yes | Directional (lord→lord via lord-of-house), requires sourceLord !== targetLord |
| CONJUNCT | No | No | Direct but undirected, can never satisfy ordered chains |
| EXCHANGES | Bidirectional | No | Bidirectional but never establishes ordered pathways (handled by Parivartana-specific logic) |
| Cross-house lordship | No | No | Not directional (no ordered pathway) |
| Shared participant | No | No | No ordered pathway |

## Key Changes from P2-03

1. **COMMON_LORD is undirected**: Can never satisfy directed relationships or ordered chains. Previously, common lordship was incorrectly considered directed.

2. **OCCUPIES is directional**: Only lord(from) OCCUPIES→toHouse establishes a directed relationship. Reverse direction is not accepted.

3. **ASPECTS has two forms**:
   - Planet→house ASPECTS: directional, establishes ordered pathways
   - Planet→planet ASPECTS via lord-of-house: directional, requires sourceLord !== targetLord

4. **CONJUNCT is undirected**: Direct but undirected, can never satisfy ordered chains.

5. **EXCHANGES is bidirectional**: Establishes bidirectional lord-exchange but never ordered pathways. Handled by Parivartana-specific logic.

6. **Cross-house lordship is not directional**: lordA lords houseB does not establish a directed relationship from houseA to houseB.

7. **Shared participant has no ordered pathway**: Shared OCCUPIES/ASPECTS participation does not establish ordered pathways.

## Predicate Layer Implementation

### `careerPatternPredicates.ts`

The predicate layer implements the frozen relationship semantics:

- `getLordsOfHouse(relationships, house)`: Returns ALL lords (multi-lord facts preserved), sorted for determinism.
- `buildLordshipMap(relationships)`: Builds planet→houses map from LORD_OF edges only.
- `hasCommonLordRelationship(network, a, b)`: Undirected, returns false if a===b.
- `hasDirectedHouseRelationship(network, from, to)`: True only via:
  1. lord(from) OCCUPIES→to
  2. lord(from) ASPECTS→to (house target)
  3. lord(from) ASPECTS→lord(to) planet-level, requiring sourceLord !== targetLord
  Common lordship, conjunction, exchange explicitly excluded.
- `hasDirectHouseRelationship(network, a, b)`: Undirected umbrella: common lord OR directed either direction OR lord conjunction/aspect-either-direction/exchange between distinct lords.
- `hasPlanetMediatedRelationship`: False if direct relationship exists; shared OCCUPIES/ASPECTS participation check.
- `isDirectChain(network, orderedHouses)`: Requires every consecutive pair to satisfy `hasDirectedHouseRelationship`; rejects duplicates, length<2.
- New explicit helpers: `hasExchangeRelationship`, `hasConjunctionRelationship`, `hasLordAspectRelationship` (all documented as non-directional for ordered pathways).
- Private helpers: `hasPlanetConjunction`, `hasPlanetAspect`, `hasPlanetAspectEitherDirection`, `hasPlanetExchange` (symmetric lookup for CONJUNCT/EXCHANGES, directional for ASPECTS).

### `careerPatternPredicates.test.ts`

Comprehensive test suite covering:
- Common-lord undirected + cannot satisfy directed/chain
- OCCUPIES directional one-way
- House ASPECTS directional
- Planet-level ASPECTS directional via lord-of-source→lord-of-target
- CONJUNCT direct-but-undirected, no ordered direction
- EXCHANGES bidirectional-direct but never ordered
- `hasDirectHouseRelationship` undirected umbrella
- Planet-mediated false for direct relationships
- `isDirectChain` accepts genuine 6→10→11, rejects reverse, partial (only 6→10 or only 10→11), STAR topology, TRIANGLE without pathway, EXCHANGES-only, CONJUNCT-only, common-lord-only, duplicate-house sequence, empty/single sequence
- Symmetry invariants for common-lord/exchange and asymmetry for OCCUPIES/planet-ASPECTS

## Impact on Other Modules

### `kendraTrikonaDetector.ts`

- Removed unused `LORD_RELATIONSHIP_EDGE_TYPES` constant
- Removed unused `import type { CareerGraphEdgeType }`

### `dusthanaTransformationDetector.ts`

- Updated `has8to10Relationship` to delegate to `hasDirectHouseRelationship(network, 8, 10)` (undirected, not directed, per the 8↔10 / 12↔10 methodology)
- Updated `has12to10Relationship` to delegate to `hasDirectHouseRelationship(network, 12, 10)` (undirected, not directed, per the 8↔10 / 12↔10 methodology)
- House membership alone no longer qualifies

### `careerPatternClassificationRules.ts`

- Chain classifiers already consult `isDirectChain`/`hasDirectedHouseRelationship`
- Confirmed to compile against new signatures
- No `isSharedParticipant`/topology helpers needed in the freeze file
- Retained thin implementation if existing callers require it

## Expected Test Changes

With the freeze implementation, some existing specialized-classification fixtures are expected to flip to generic `CAREER_HOUSE_NETWORK` now that common-lordship can't satisfy ordered chains. These expectations should be updated to the semantically correct result, never re-adding the old behavior.

## Verification

Run `npm run lint` (`tsc --noEmit`) and the `careerPattern` test suite to verify:
- Type checking passes
- All predicate tests pass
- Any failing classification fixtures are updated to semantically correct results

## Boundary Enforcement

This module must NOT import from:
- careerDasha
- careerD10
- careerFinalSynthesis
- careerExpression*
- domain/timing
