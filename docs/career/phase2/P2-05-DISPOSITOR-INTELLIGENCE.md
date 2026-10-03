# P2-05 — Career Dispositor Intelligence

> **STATUS: IMPLEMENTED — VERIFICATION PENDING**
>
> Dispositor chain analysis implemented as deterministic structural model.
> Self-contained Phase 2 module independent of CareerAstroGraph (P2-01).

## Purpose

P2-05 implements deterministic natal dispositor chain analysis for Career-relevant planets. This is a self-contained Phase 2 module that:
- Models dispositor chains from Career lords and Career house occupants
- Detects cycles and mutual reception patterns
- Classifies termination conditions and destinations
- Preserves provenance without fabrication
- Does NOT create DISPOSITOR_OF edges in CareerAstroGraph (P2-01 contract excludes this)
- Does NOT perform strength scoring, semantic interpretation, or negative inference

## Implementation Overview

### Pipeline Position

```
CareerStructuralReasoning (C4)
        ↓
    Start Planet Derivation
        ↓
  Dispositor Chain Traversal
        ↓
CareerDispositorResult (P2-05)
```

### Core Components

**1. Type Definitions (`careerDispositorTypes.ts`)**
- `CareerDispositorStartRole` (CAREER_LORD/CAREER_HOUSE_OCCUPANT/CAREER_RELEVANT_PLANET)
- `CareerDispositorRelationship` (DISPOSITOR_OF/SELF_DISPOSITOR)
- `CareerDispositorTermination` (SELF_DISPOSITOR/CYCLE/MUTUAL_RECEPTION/CAREER_TERMINAL/NON_CAREER_TERMINAL/UNAVAILABLE)
- `CareerDispositorDestination` (CAREER_LORD/CAREER_HOUSE/CAREER_HOUSE_OCCUPANT/CAREER_RELEVANT_PLANET/DUSTHANA_CAREER_CONTEXT/NON_CAREER/UNAVAILABLE)
- `CareerDispositorLink` (sourcePlanet, targetPlanet, sourceSign, targetSign, relationship)
- `CareerDispositorChain` (startPlanet, startRole, links, terminalPlanet, termination, destination, cycleStartPlanet, mutualReception, depth)
- `CareerDispositorProvenance` (ruleIds, sourceIds)
- `CareerDispositorStart` (planet, role, sourceIds)
- `CareerDispositorIntegrationInput` (horoscope, starts)
- `CareerDispositorResult` (chains)

**2. Identity Functions (`careerDispositorIdentity.ts`)**
- `buildCareerDispositorIdentityKey(startPlanet, startRole, chain, cycle, mutualReception)` → `CAREER_DISPOSITOR:<startRole>:<startPlanet>:<chain.join('>')>:CYCLE:Y|N:MUTUAL:Y|N`
- `buildCareerDispositorChainId(startPlanet, chain)` → `CAREER_DISPOSITOR_CHAIN:<startPlanet>:<chain.join('>')>`
- Identity excludes condition/dignity/Dasha/D10/timing/strength/qualification (spec §6)

**3. Rules Constants (`careerDispositorRules.ts`)**
- `CAREER_HOUSES = [6, 10, 11]`
- `CAREER_LORD_START_HOUSES = [5, 6, 9, 10, 11]`
- `MAX_DISPOSITOR_DEPTH = 9` (technical guard for nine modeled planets, NOT astrological strength rule)
- `isCareerHouse(house)` → boolean
- `resolveCareerDestination(terminalPlanet, terminalHouse, isCareerLord, isCareerHouseOccupant, isCareerRelevant)` → CareerDispositorDestination
- `resolveTermination(cycle, mutualReception, isSelfDispositor, isCareerTerminal, hasTerminalPlanet)` → CareerDispositorTermination

**4. Chain Traversal (`careerDispositor.ts`)**
- `traverseDispositorChain(horoscope, startPlanet)` → chain analysis
- Uses `SIGNS_METADATA[sign].ruler` from `src/data/astroData.ts` (spec §5)
- Visited-set cycle detection returning `cycleStartPlanet` and `terminalPlanet: undefined` on cycle (spec §18)
- `depth` = number of dispositor transitions (links.length), not planet count (spec §4)
- Missing planetFact/sign/ruler → terminate with `terminalPlanet: undefined`
- `detectMutualReception(horoscope, a, b)` via cross-sign rulership check
- `detectChainMutualReception` helper for chain-wide detection
- Sign read as `fact.sign ?? fact.position?.sign`

**5. Integration Layer (`careerDispositorIntegration.ts`)**
- `buildCareerDispositorStartPlanets(careerLordPlanets, careerHouseOccupants)` → deduped by planet (CAREER_LORD wins over CAREER_HOUSE_OCCUPANT), sorted by `CANONICAL_CAREER_PLANET_ORDER` (spec §13)
- `buildCareerDispositorStartsFromStructural(horoscope, structural)` → adapter deriving start planets/roles/sourceIds from C4 CareerStructuralReasoning evidence (spec §38)
- `buildCareerDispositorAnalysis({ horoscope, starts })` → chains sorted by `identityKey.localeCompare`, deeply frozen
- `buildCareerDispositorChain` orchestration per spec §16 with `sourceIds = Object.freeze([...new Set(start.sourceIds)].sort())` and sorted `ruleIds` (spec §17)

### Termination Resolution Rules

Termination is resolved with the following precedence (spec §7):
1. **UNAVAILABLE** → missing planetFact/sign/ruler
2. **SELF_DISPOSITOR** → planet rules its own sign (NOT a cycle)
3. **MUTUAL_RECEPTION** → cycle + mutualReception detected
4. **CYCLE** → cycle detected without mutual reception
5. **CAREER_TERMINAL** → terminal planet is career-relevant
6. **NON_CAREER_TERMINAL** → terminal planet is not career-relevant

### Destination Resolution Rules

Destination is resolved with the following precedence (spec §7):
1. **CAREER_LORD** → terminal planet is lord of Career house (5, 6, 9, 10, 11)
2. **CAREER_HOUSE_OCCUPANT** → terminal planet occupies Career house (6, 10, 11)
3. **DUSTHANA_CAREER_CONTEXT** → terminal planet occupies dusthana (6, 8, 12) - structural context, NOT negative
4. **CAREER_HOUSE** → terminal planet is lord of Career house
5. **CAREER_RELEVANT_PLANET** → terminal planet is career-relevant
6. **NON_CAREER** → terminal planet is not career-relevant
7. **UNAVAILABLE** → missing data

**Important:** Dusthana (6, 8, 12) produces `DUSTHANA_CAREER_CONTEXT`, never NEGATIVE or CAREER_LOSS (per spec §14).

### Boundary Enforcement

The dispositor module must NOT import from:
- `careerDasha`
- `careerD10`
- `careerFinalSynthesis`
- `careerExpression*`
- `domain/timing`
- `careerPattern*`
- `careerPatternQualification*`
- `careerAstroGraph*` (no DISPOSITOR_OF edge type - P2-01 contract excludes it)

This is enforced via architectural comments in each module file (spec §43).

### No Score/Confidence Boundary

P2-05 is structural only. It does NOT include:
- `DispositorStrength` / `DispositorScore` / scores / confidence
- `cycleMeaning`
- Negative dusthana inference (dusthana is structural context, not negative)
- Dasha/D10/transit/timing/C11 inputs

The dispositor module answers "what is the dispositor chain structure" (structural topology), while downstream modules will answer "what does this chain mean for Career" (semantic interpretation).

## Chain Identity

`CareerDispositorChain.identityKey` format (via `buildCareerDispositorIdentityKey`):
```
CAREER_DISPOSITOR:<startRole>:<startPlanet>:<chain.join('>')>:CYCLE:Y|N:MUTUAL:Y|N
```

Identity is based on:
- Start role (CAREER_LORD/CAREER_HOUSE_OCCUPANT/CAREER_RELEVANT_PLANET)
- Start planet
- Chain sequence (planet names joined by >)
- Cycle flag (Y/N)
- Mutual reception flag (Y/N)

Identity must NOT include:
- Condition/dignity/strength
- Dasha/D10/Timing data
- Score/confidence fields
- House numbers (except in destination classification)

## Exports (from `src/domain/career/careerDispositor/index.ts`)

```typescript
// Type exports
export type {
  CareerDispositorStartRole,
  CareerDispositorRelationship,
  CareerDispositorTermination,
  CareerDispositorDestination,
  CareerDispositorLink,
  CareerDispositorChain,
  CareerDispositorProvenance,
  CareerDispositorStart,
  CareerDispositorIntegrationInput,
  CareerDispositorResult
} from './careerDispositorTypes';

// Identity exports
export {
  buildCareerDispositorIdentityKey,
  buildCareerDispositorChainId
} from './careerDispositorIdentity';

// Rules exports
export {
  CAREER_HOUSES,
  CAREER_LORD_START_HOUSES,
  MAX_DISPOSITOR_DEPTH,
  isCareerHouse,
  resolveCareerDestination,
  resolveTermination
} from './careerDispositorRules';

// Core dispositor exports
export {
  traverseDispositorChain,
  detectMutualReception
} from './careerDispositor';

// Integration exports
export {
  buildCareerDispositorStartPlanets,
  buildCareerDispositorStartsFromStructural,
  buildCareerDispositorAnalysis
} from './careerDispositorIntegration';
```

## Test Coverage

`careerDispositor.test.ts` covers:

**Test Group A: Single link**
- Single dispositor link MARS → VENUS

**Test Group B: Self-dispositor**
- Self-dispositor SUN in LEO (cycle=false, depth=0)

**Test Group C: Multi-level chain**
- Multi-level chain MARS→VENUS→SATURN→JUPITER (depth=3)

**Test Group D: Simple cycle**
- Simple cycle A↔B (terminalPlanet undefined)

**Test Group E: 4-planet cycle**
- 4-planet cycle A→B→C→D→A

**Test Group F: Mutual reception detection**
- Mutual-reception pair detection

**Test Group G: Career destination**
- Career destination CAREER_HOUSE_OCCUPANT with house
- Career destination CAREER_LORD

**Test Group H: Dusthana produces no negative type**
- Dusthana producing no negative type (6th house → DUSTHANA_CAREER_CONTEXT)

**Test Group I: Input-order determinism**
- Input-order determinism on permuted starts (identical JSON)

**Test Group J: Missing sign/fact → UNAVAILABLE**
- Missing sign → UNAVAILABLE (never invented, never negative)
- Missing planet fact → UNAVAILABLE

**Test Group K: Deep immutability**
- Deep immutability (result/chains/chain/links/provenance frozen)

**Test Group L: Identity independence**
- Identity independence from condition/relevance/Dasha/D10 inputs

**Test Group M: No downstream imports**
- Module does not import from disallowed modules

**Test Group N: Career house constants**
- CAREER_HOUSES contains 6, 10, 11
- isCareerHouse correctly identifies career houses

**Test Group O: Start planet deduplication**
- CAREER_LORD wins over CAREER_HOUSE_OCCUPANT
- Starts are sorted by CANONICAL_CAREER_PLANET_ORDER

**Test Group P: Real-engine + golden test**
- Real-engine golden test closure (spec §38-39)
  - `calculateHoroscope(CANONICAL_BIRTH_DETAILS)` → `buildCareerStructuralReasoning` → `buildCareerDispositorStartsFromStructural` → `buildCareerDispositorAnalysis`
  - Run twice, assert identical JSON
  - Frozen result
  - Once actual chains are observed, freeze as golden fixture

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — CareerAstroGraph (P2-01) - no DISPOSITOR_OF edge type per contract
- [`P2-04-DISPOSITOR-MODEL.md`](./P2-04-DISPOSITOR-MODEL.md) — Dispositor model specification
