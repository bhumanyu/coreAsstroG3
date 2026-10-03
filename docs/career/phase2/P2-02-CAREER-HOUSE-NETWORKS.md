# P2-02 — Career House Networks

> **STATUS: IMPLEMENTED — VERIFICATION PENDING**
>
> Network detection layer implemented as deterministic adapter-only system.
> Direction resolution and SHARED_PARTICIPANT topology rules now properly defined.

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
- Internal `CareerDirectedHouseConnection` with sourceHouse, targetHouse, sourceEdgeIds (preserves directed flow)
- Internal `CareerHouseConnection` with houseA, houseB, kind, sourceEdgeIds, participantNodeIds, directedConnections

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

### SHARED_PARTICIPANT Topology Rule

A component connected purely through one shared participant (pairwise clique of n houses) classifies as **STAR** (participant-mediated hub), NOT TRIANGLE/LOOP.

**Implementation Details:**
- When computing degree for topology, count only DIRECT connections toward CHAIN/TRIANGLE/LOOP eligibility
- SHARED_PARTICIPANT-only components resolve to:
  - **STAR** (single participant connecting all houses)
  - **CLUSTER** (multiple participants)

This rule ensures that participant-mediated connections are distinguished from direct house-to-house structural connections.

### Direction Resolution Rule

Network direction is resolved from directed house connections with the following deterministic contract:

**Deterministic Contract:**
- **BIDIRECTIONAL**: if any house pair has directed connections in both directions
- **FORWARD**: if directed connections flow predominantly from lower-numbered to higher-numbered houses
- **REVERSE**: if directed connections flow predominantly from higher-numbered to lower-numbered houses
- For **SHARED_PARTICIPANT-only** connections: direction is derived from participant edge orientation
  - PLANET→HOUSE edges = FORWARD semantics (flow into house)
  - HOUSE→PLANET edges = REVERSE semantics (flow from house)

**Golden Tests:**
- 6→10→11 produces FORWARD
- 11→10→6 produces REVERSE
- A two-way pair produces BIDIRECTIONAL

**Implementation Details:**
- Directed connections are preserved through the house projection layer via `CareerDirectedHouseConnection`
- Each directed connection records the actual `sourceHouse`/`targetHouse` from the original edge
- Direction resolution analyzes these directed connections to determine the dominant flow direction
- The contract is deterministic and order-independent

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
- CHAIN (6→10→11 → CLUSTER per SHARED_PARTICIPANT rule)
- TRIANGLE (5→9→10)
- LOOP (6→10→11→6 → CLUSTER per SHARED_PARTICIPANT rule)
- STAR (single participant connecting multiple houses)
- CLUSTER (multiple participants)
- Disconnected components → 2 networks in deterministic order
- Neutral houses (1,4) excluded from components
- Input-order independence (JSON equality across input permutations)
- True permutation tests (permuted fact arrays produce identical output)
- Duplicate edges → no duplicate networks/relationships
- Provenance preservation (sourceIds carried through, none invented)
- evidenceIds unique+sorted
- Topology precedence (triangle not reported as LOOP)
- Direction resolution (FORWARD/REVERSE/BIDIRECTIONAL golden tests)
- Deep immutability of result/networks/relationships/provenance
- Forbidden-field assertions (no pattern/mechanism/score/confidence/prediction/qualification)
- Real-engine test: full chain from calculateHoroscope → buildCareerStructuralReasoning → buildCareerGraphFactsFromStructural → buildCareerAstroGraph → detectCareerHouseNetworks
- Real-engine permutation test (permuted facts produce identical output)

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority
- [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md) — W0.3 ownership table, W0.4 evidence identity contract
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — Pattern taxonomy (consumes networks)
