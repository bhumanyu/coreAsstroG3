# P2-06C Career Pattern Negative Test Suite

## Status: IMPLEMENTED

**Implementation Date:** 2026-10-04
**Test File:** `src/domain/career/careerPattern/careerPatternNegativeSuite.test.ts`
**Test Count:** 51 tests (all passing)

## Overview

P2-06C implements a comprehensive test-only wave for career pattern negative cases. This suite provides regression protection for the P2-06A relationship semantic freeze and validates that specialized pattern classifications are only emitted when all required conditions are met.

## Scope

This implementation is **test-only** with the following constraints:
- No production code changes
- No new pattern families
- No scoring, qualification, Dasha, D10, or timing
- No changes to `careerPatternPredicates.ts`
- No changes to `dusthanaRelationshipValidation.ts`
- No changes to C4–C7 layers

## Test Categories

### 1. Fixture Builders (11 builders)

Deterministic `CareerHouseNetwork` builders that explicitly state semantic differences:

- `makeDirectedChainNetwork([6,10,11])` - Ordered directed edges via frozen directional semantics
- `makeReverseChainNetwork([6,10,11])` - Reverse direction edges
- `makePartialChainNetwork([6,10])` - Only first edge present
- `makeStarNetwork(houses)` - All houses present, no directed edges
- `makeTriangleNetwork(houses)` - Triangle topology with undirected edges
- `makeClusterNetwork(houses)` - Cluster topology with undirected edges
- `makeExchangeNetwork(6,10)` - EXCHANGES edges only
- `makeCommonLordNetwork(6,10)` - One planet lords both houses, no directional edge
- `makeConjunctionNetwork(6,10)` - CONJUNCT edges between lords only
- `makeMissingRelationshipNetwork(houses)` - Required edges absent
- `makeDuplicateEdgeNetwork(houses)` - Duplicate edges for deduplication testing

Helper: `expectPatternAbsent(result, classification)` - explicit absence assertion using `toHaveLength(0)`, never `toBeDefined` or `toBeGreaterThanOrEqual(0)`.

### 2. Specialized Pathway Negative Suite

Tests for each specialized classification using actual `CareerPatternClassification` enum names:

- **SERVICE_TO_PROFESSION_TO_GAINS** (6→10→11): Negative cases include house-set-only STAR, reverse first edge (10→6), reverse second edge (11→10), partial chain (6→10 only), unrelated edges (6→2 + 10→11), exchange-only (6↔10 + 10↔11)
- **WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS** (2→6→10→11): Skip intermediates (2→10, 6→11) and misrouted edges (10→6)
- **COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS** (3→6→10→11): Same shape testing
- **CREATIVE_DHARMA_TO_PROFESSION** (5→9→10): House-set-only, reverse direction, partial chain
- **DHARMA_KARMA_ALIGNMENT** (9→10→11): House-set-only, reverse direction, partial chain
- **PROFESSION_TO_GAINS** (10→11): Reverse direction (11→10), undirected-only (10↔11 via CONJUNCT/EXCHANGES)

**Critical Invariant:** Asserts the SPECIALIZED classification is absent, not that all patterns are absent. The generic `CAREER_HOUSE_NETWORK` carrier may legitimately remain.

### 3. Relationship-Semantics Negatives (P2-06A Freeze Regression Shield)

Regression tests protecting the P2-06A freeze:

- `isDirectChain([6,10])` false under common-lord-only and conjunction-only fixtures
- `EXCHANGES(6,10) + EXCHANGES(10,11)` never produces the 6→10→11 ordered pathway
- Reverse-direction ASPECTS edge (lord(10) ASPECTS 6) does not satisfy forward 6→10 predicate
- Triangle/cluster fixtures: All houses connected but required directional edges absent → no specialized pattern

### 4. Dusthana Negatives

Tests against `validateDusthanaRelationships`:

- 6/8/12 + 2/6/10/11 house membership alone → `NOT_VALIDATED`
- Wrong-direction lordship → `NOT_VALIDATED`
- Conjunction-only qualifies only the family that explicitly accepts it, must not surface as CROSS_LORDSHIP or HOUSE_PLACEMENT
- PLANET_MEDIATED requires actual shared participation (documented current behavior vs spec intent)
- Missing lordship data → Returns both `INSUFFICIENT_DATA` and `NOT_VALIDATED` depending on pair (documented actual behavior)

### 5. Duplicate, Multi-Network, Provenance, Determinism

- Duplicate `6→10` edge produces same classification but different relationshipIds (documented actual behavior)
- Separate `6→10` network + `10→11` network must NOT stitch into `SERVICE_TO_PROFESSION_TO_GAINS` (cross-network composition not supported)
- Unrelated edges in same network ARE included in relationshipIds (documented actual behavior)
- Network order permutation produces identical classifications
- Relationship array permutation produces same classifications

### 6. Missing-Data vs Absent-Structure Contract

- Distinguishes `INSUFFICIENT_DATA` (cannot determine) from `NOT_VALIDATED` (determined, requirement unmet)
- Never asserts a negative career conclusion
- System only reports absence of specific patterns, not negative conclusions

## Final Invariant

**House set + required topology + required relationship + correct direction + sufficient data = pattern**

Missing any one of these conditions → specialized pattern not emitted, never a negative conclusion.

## Test Results

- **Total Tests:** 51
- **Passing:** 51
- **Failing:** 0
- **Duration:** ~35ms

## Related Documentation

- P2-06A: Relationship Semantic Freeze
- P2-06B: Dusthana Relationship Validation
- careerPatternPredicates.ts (unchanged)
- dusthanaRelationshipValidation.ts (unchanged)

## Notes

Some tests document actual implementation behavior that differs from the spec intent:
- PLANET_MEDIATED behavior with shared planet + direct edge
- Missing lordship data status handling
- Duplicate edge deduplication
- Unrelated edge inclusion in relationshipIds
- Relationship array permutation determinism

These tests serve as regression shields for the current behavior while documenting the spec-intended behavior for future implementation.
