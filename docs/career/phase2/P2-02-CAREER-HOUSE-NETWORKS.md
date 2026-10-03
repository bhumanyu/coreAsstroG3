# P2-02 — Career House Networks

> **STATUS: IMPLEMENTED**
>
> Network detection layer implemented as deterministic adapter-only system.

## Purpose

P2-02 implements the network detection layer that consumes the P2-01 `CareerAstroGraph` and emits `CareerHouseNetwork[]`. This is a structural, deterministic adapter that:
- Detects house networks from graph topology
- Classifies network topology (DIRECT_LINK, CHAIN, TRIANGLE, LOOP, STAR, CLUSTER)
- Resolves network direction (FORWARD, REVERSE, BIDIRECTIONAL)
- Preserves provenance without fabrication
- Does NOT perform pattern classification or semantic interpretation (owned by P2-03)

## Implementation Overview

### Pipeline Position

```
CareerAstroGraph (P2-01)
        ↓
    House Projection
        ↓
  Topology Detection
        ↓
CareerHouseNetwork[] (P2-02)
        ↓
Pattern Classification (P2-03, future)
```

### Core Components

**1. Type Definitions (`careerNetworkDetectionTypes.ts`)**
- `CareerNetworkDetectionInput { graph: CareerAstroGraph }`
- `CareerNetworkDetectionResult { networks: readonly CareerHouseNetwork[] }`
- Internal `CareerHouseConnectionKind = 'DIRECT' | 'SHARED_PARTICIPANT'`
- Internal `CareerHouseConnection` with houseA, houseB, kind, sourceEdgeIds, participantNodeIds

**2. Topology Resolution (`careerNetworkDetectionRules.ts`)**
- `resolveCareerNetworkTopology(houses, adjacency)` with strict precedence
- `resolveCareerNetworkDirection(connections)` from directed house connections
- Helpers: `countUndirectedEdges`, `isTriangle`, `isLoop`, `isStar`, `isChain`

**3. Network Detection (`careerNetworkDetection.ts`)**
- `detectCareerHouseNetworks(input): CareerNetworkDetectionResult`
- Pipeline:
  1. Extract HOUSE nodes filtered through `classifyCareerHouse` (exclude 'NEUTRAL')
  2. Extract edges touching those houses
  3. Build house-projection graph with DIRECT vs SHARED_PARTICIPANT connections
  4. Find connected components (sorted BFS, numeric ordering)
  5. Per component: resolve topology and direction
  6. Collect lords via planet-node parsing (canonical planet order)
  7. Build provenance by unioning edge.provenance (never fabricate)
  8. Build evidenceIds as unique+sorted union of sourceIds
  9. Call `buildCareerHouseNetwork(...)`
  10. Sort output networks by identityKey
  11. Deep-freeze result

### Connection Kinds

**DIRECT Connection**
- Both endpoints are houses
- OR explicit house-linking relationship (e.g., LORD_OF from house to house via planet)

**SHARED_PARTICIPANT Connection**
- Houses connected only via a shared planet node
- Pairwise projection: e.g., Saturn→6 and Saturn→10 yields 6–10 SHARED_PARTICIPANT

### Topology Precedence Order (Strict)

1. **DIRECT_LINK** (2 nodes) - Simplest case
2. **TRIANGLE** (3 nodes, all degree 2) - Checked before LOOP because a triangle is also a loop
3. **LOOP** (≥3 nodes, all degree 2) - But not a triangle
4. **STAR** (one node of degree n-1, rest degree 1)
5. **CHAIN** (exactly two degree-1, rest degree-2)
6. **CLUSTER** (fallback for any other configuration)

The TRIANGLE → LOOP precedence is semantically required: a triangle is technically a loop (all nodes have degree 2), but we classify it as TRIANGLE for its special significance.

### Boundary Enforcement

The network detection layer must NOT import from:
- `careerDasha`
- `careerD10`
- `careerFinalSynthesis`
- `careerExpression*`
- `domain/timing`

This is enforced via architectural comments in each module file.

### No Classification Boundary

P2-02 is structural only. It does NOT:
- Classify semantic patterns (owned by P2-03)
- Calculate scores or confidence
- Produce predictions or qualifications
- Depend on C5–C11/Dasha/D10/Timing

The detection layer answers "what houses are connected and how" (structural topology), while P2-03 will answer "what does this network mean for Career" (semantic classification).

## Network Identity

`CareerHouseNetwork.identityKey` format:
```
${sortedHouses}:${topology}:${direction}:${sortedRelationshipIdentities}
```

Identity is based on:
- Sorted house set (numeric order)
- Topology type
- Direction (FORWARD/REVERSE/BIDIRECTIONAL)
- Sorted structural relationship identities

Identity must NOT include:
- Strength/dignity/condition
- Dasha/D10/Timing data
- Score/confidence fields

## Exports (from `src/domain/career/careerGraph/index.ts`)

```typescript
// P2-02 Network detection
export {
  detectCareerHouseNetworks
} from './careerNetworkDetection';

export type {
  CareerNetworkDetectionInput,
  CareerNetworkDetectionResult
} from './careerNetworkDetectionTypes';

// Network builders (used by detection)
export {
  buildCareerHouseNetwork,
  buildCareerHouseNetworkIdentityKey
} from './careerHouseNetwork';
```

## Test Coverage

`careerNetworkDetection.test.ts` covers:
- DIRECT_LINK (6→10)
- CHAIN (6→10→11 and 3→6→10→11 golden case)
- TRIANGLE (5→9→10)
- LOOP (6→10→11→6 canonical loop)
- STAR (10 connected to 2,6,11,5)
- CLUSTER
- Disconnected components → 2 networks in deterministic order
- Neutral houses (1,4) excluded from components
- Input-order independence (JSON equality across input permutations)
- Duplicate edges → no duplicate networks/relationships
- Provenance preservation (sourceIds carried through, none invented)
- evidenceIds unique+sorted
- Topology precedence (triangle not reported as LOOP)
- Deep immutability of result/networks/relationships/provenance
- Forbidden-field assertions (no pattern/mechanism/score/confidence/prediction/qualification)
- Real-engine test: full chain from calculateHoroscope → buildCareerStructuralReasoning → buildCareerGraphFactsFromStructural → buildCareerAstroGraph → detectCareerHouseNetworks

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority
- [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md) — W0.3 ownership table, W0.4 evidence identity contract
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — Pattern taxonomy (consumes networks)
