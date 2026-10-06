# P2-07G: 10L Condition and Relationships

**Status:** IMPLEMENTED — LOCAL VERIFICATION REPORTED — CI VERIFICATION PENDING

## Architecture Position

P2-07G extends the P2-07F 10H structural context to add 10L (10th lord) condition and relationship analysis. It sits in the structural foundation layer:

```
P2-07F (10H Structural Context)
  ↓
P2-07G (10L Condition & Relationships) ← THIS MODULE
  ↓
P2-07H (Convergence Integration)
  ↓
P2-07I (Evidence Generation)
```

## Purpose

P2-07G consumes `Career10HFoundation` from P2-07F and produces `Career10LFoundation` with per-reference `Career10LContext` containing:

1. **10L Identity & Placement** - Consumed verbatim from `Career10HContext.house10Lord`/`lordHouse`
2. **Career10LCondition** - Adapted from `PlanetAnalysisReport` (dignity, motion, combustion, placement)
3. **Career10LRelationship[]** - Filtered canonical `CareerGraphEdge` views for six target lord pairs (1, 5, 6, 8, 9, 12)

This is a D1-only, deterministic, facts/derived-facts layer with NO interpretation.

## Key Design Decisions

### MOOLATRIKONA → OWN_SIGN Fold

The engine's `DignityStatus` enum includes `MOOLATRIKONA`, but `CareerPlanetaryDignity` does not. Per spec decision, `MOOLATRIKONA` is folded into `OWN_SIGN` for career context.

**Rationale:** This is a deliberate simplification to avoid expanding the career dignity union. The distinction between own sign and moolatrikona is nuanced; for career structural analysis, both represent strong dignity.

**Implementation:** In `career10LCondition.ts`, the `mapDignityStatus` function explicitly maps `MOOLATRIKONA` → `OWN_SIGN` with a code comment documenting the decision.

### Moon-Lordship Contract (CANONICAL)

For Moon context, the six target house lords are **Lagna-relative** house lords from `houseLordship.houseLords` (the D1 lordship table).

**CANONICAL CONTRACT:**
- Moon context 10L identity/placement comes from P2-07F Moon-relative coordinates
- Target-lord relationships are evaluated against the D1/Lagna lordship table (houseLordship.houseLords)
- Moon-relative lordship is out of scope pending a canonical Moon-chart lordship report
- This is the canonical contract; not a deferred question

### "UNAVAILABLE ≠ None" Status Rule

The module distinguishes between:
- `UNAVAILABLE`: Engine report is absent (no data source)
- Empty array: Engine report present but no matching data (e.g., no relationships found)

**Example:** If `careerGraph` is absent, `relationshipDataStatus` is `UNAVAILABLE` and `relationships` is an empty array. If `careerGraph` is present but has no edges connecting 10L to target lords, `relationshipDataStatus` is `AVAILABLE` and `relationships` is an empty array.

This mirrors P2-07F's `aspectDataStatus` convention.

## Module Structure

### 1. Types (`career10LFoundationTypes.ts`)

Defines all type interfaces for the module:

- `Career10LStatus`: `'COMPLETE' | 'INSUFFICIENT_DATA'`
- `Career10LDataStatus`: `'AVAILABLE' | 'UNAVAILABLE'`
- `Career10LRelationship`: Represents a relationship between 10L and target lord
- `Career10LCondition`: Condition of 10L (dignity, motion, combustion, placement)
- `Career10LContext`: Complete context for a reference point
- `Career10LFoundation`: Complete foundation with Lagna and Moon contexts
- `Career10LProvenance`: Provenance tracking
- `Career10LFoundationInput`: Input for resolution
- `Career10LFoundationResult`: Result of resolution

**NOT List:**
- No `Career10LRelationshipType` enum (reuses `CareerGraphEdgeType`)
- No scores, support/challenge fields, or planet-level interpretation strings

### 2. Condition Adapter (`career10LCondition.ts`)

`resolveCareer10LCondition(context10H, planetAnalysis)`: Extracts 10L condition from `PlanetAnalysisReport`.

**Logic:**
1. Look up `planetAnalysis.planets[context10H.house10Lord]`
2. If absent → `status: UNAVAILABLE`, all optional fields undefined
3. Otherwise copy verbatim:
   - `sign`, `house` from planet analysis
   - `dignity.status` → map `DignityStatus` → `CareerPlanetaryDignity` (with MOOLATRIKONA → OWN_SIGN fold)
   - `state.motion.retrograde` → `RETROGRADE`/`DIRECT`
   - `state.condition` `COMBUST`/`DEEP_COMBUST` → `COMBUST`, else `NOT_COMBUST`
4. `sourceRuleIds` = ruleIds of `PlanetAnalysisEvidence` entries that produced the copied facts (SIGN_PLACEMENT, DIGNITY, RETROGRADE, COMBUSTION)

**Constraints:**
- No interpretation logic (e.g., no `if (planet === SATURN && sign === PISCES)` checks)
- Never fabricate data - return `UNAVAILABLE` when source is absent

### 3. Relationship Foundation (`career10LRelationships.ts`)

`resolveCareer10LRelationships(context10H, houseLordship, graph)`: Resolves relationships between 10L and six target house lords.

**Logic:**
1. If `graph` or `houseLordship` absent → `dataStatus: UNAVAILABLE`, empty relationships
2. For each target house in `CAREER_10L_RELATIONSHIP_HOUSES = [1, 5, 6, 8, 9, 12]`:
   - `sourceLord = houseLordship.houseLords[targetHouse]` (canonical lord identity from analyzeHouseLordship)
   - Find edges in `graph.edges` where the pair `{sourceNodeId, targetNodeId}` connects `PLANET:${sourceLord}` and `PLANET:${tenL}` in either direction
   - Filter by edge type ∈ `{ASPECTS, CONJUNCT, EXCHANGES}` (planet-to-planet only)
   - Each match → one `Career10LRelationship` with `relationshipId = edge.identityKey`, `relationshipType = edge.type`, `provenance = edge.provenance` (verbatim)
3. Dedupe by `identityKey` (same semantic relationship from both directions → one record)
4. Sort deterministically:
   - By `CAREER_10L_RELATIONSHIP_HOUSES` order
   - By edge type canonical order (LORD_OF < OCCUPIES < ASPECTS < CONJUNCT < EXCHANGES)
   - By `identityKey` lexicographic

**Relationship Contract (Explicit Chain):**
- Target house → `houseLordship.houseLords[house]` (canonical lord identity from analyzeHouseLordship)
- Planet↔planet graph edges (ASPECTS|CONJUNCT|EXCHANGES, either direction, dedup by identityKey) → `Career10LRelationship`
- LORD_OF/OCCUPIES are planet→house edges and cannot join two lords by definition

**Constraints:**
- LORD_OF and OCCUPIES are planet→house edges and cannot join two lords (excluded)
- For Moon context: uses Lagna-relative house lords from D1 lordship table (Moon chart lordship not canonical)

### 4. Foundation Resolver (`defaultCareer10LFoundation.ts`)

`DefaultCareer10LFoundation.resolve(input)`: Main entry point for resolving 10L foundation.

**Logic:**
1. Validate required input (`foundation`)
2. For each non-null `Career10HContext` in `foundation.lagnaContext`/`moonContext`:
   - Build `Career10LContext` = consumed 10L/lordHouse + `resolveCareer10LCondition` + `resolveCareer10LRelationships`
3. Populate `missingInputs` entries: `'PLANET_ANALYSIS'`, `'CAREER_GRAPH'`, `'HOUSE_LORDSHIP'` as applicable
4. Status `INSUFFICIENT_DATA` when a required input is missing
5. Mirror P2-07F's aspectDataStatus convention: graph absent → `relationshipDataStatus UNAVAILABLE` but status can still be COMPLETE if the missing input is declared optional
6. Deep-freeze all output

## Implementation Details

### Internal Stages

The implementation ships as three internal stages in one wave:

1. **Condition Stage** (`career10LCondition.ts`) - Extracts 10L condition from planet analysis
2. **Relationships Stage** (`career10LRelationships.ts`) - Resolves 10L relationships with target lords
3. **Integration Stage** (`defaultCareer10LFoundation.ts`) - Combines condition and relationships into foundation

### Boundary Enforcement

The module enforces strict boundaries:

**NOT List:**
- No imports from `careerDasha`, `careerD10`, `careerExpression`, `careerProfession`, `careerFinalSynthesis`
- No imports from `domain/timing`
- No imports from `careerMechanism`
- No strength/score calculations
- No evidence or interpretation generation
- No Dasha/D10/transit/profession/domain inference
- No AI calls or yoga generation
- No MOOLATRIKONA addition to career dignity union (fold into OWN_SIGN)
- No `Career10LRelationshipType` enum (reuse `CareerGraphEdgeType`)
- No scores, support/challenge fields, or planet-level interpretation strings

A static boundary test (`career10hBoundary.test.ts`) verifies no forbidden imports exist in the module.

## Provenance Tracking

Provenance is tracked at two levels:

1. **Condition Provenance** (`Career10LProvenance.conditionSourceIds`):
   - Real upstream evidence ruleIds from `PlanetAnalysisEvidence`
   - Only includes ruleIds for SIGN_PLACEMENT, DIGNITY, RETROGRADE, COMBUSTION
   - No fabricated IDs

2. **Relationship Provenance** (`Career10LProvenance.relationshipIds`):
   - Collected edge identityKeys from `CareerGraphEdge`
   - Verbatim from source edges
   - No fabricated IDs

## Testing

### Test Coverage (`career10LFoundation.test.ts`)

1. **Identity/Placement Tests:**
   - Lagna 10L preserved
   - Moon regression: Moon=Cancer → 10th-from-Moon Aries, `house10Lord: MARS`, `lordHouse` = Mars's actual Lagna house (assert Lagna 10L is NOT reused)

2. **Condition Tests:**
   - Own-sign/exalted/debilitated/combust/retrograde fixture cases via real `PlanetFact` fields
   - Absent `planetAnalysis` → `UNAVAILABLE`, not fabricated NEUTRAL
   - MOOLATRIKONA → OWN_SIGN fold verification

3. **Relationship Tests:**
   - Each of the six pairs with a real graph edge
   - Each edge type (ASPECTS/CONJUNCT/EXCHANGES)
   - Dedupe on identityKey
   - Canonical ordering

4. **Negative Tests (spec §32):**
   - Unrelated planet-pair edges excluded
   - 2L↔10L absent from the six-set
   - Arbitrary CONJUNCT edge between two non-lord planets does not appear

5. **Provenance Tests:**
   - `relationshipId` equals an actual `edge.identityKey`
   - `conditionSourceIds` only real ruleIds
   - No fabricated IDs

6. **Status Semantics Tests:**
   - Graph absent → `relationshipDataStatus: UNAVAILABLE` while conditions remain AVAILABLE
   - Empty relationships + AVAILABLE = valid complete result (spec §28)

7. **Determinism Tests:**
   - `Object.isFrozen` deep assertions
   - Matching `career10HFoundation.test.ts` conventions

### Boundary Enforcement Test (`career10hBoundary.test.ts`)

Replicates P2-07F static boundary test:
- Reads all `src/domain/career/career10h/**` source files
- Asserts no imports from forbidden modules
- Asserts no AI module imports

## Verification

**Status:** IMPLEMENTED — LOCAL VERIFICATION REPORTED — CI VERIFICATION PENDING

Local verification completed:
```bash
npm run lint          # tsc --noEmit - PASSED
npm test -- career10h # career10h + engine planetAnalysis/houseLordship/careerGraph suites - PASSED
npm test              # Full test suite - PASSED (3961 tests, 3 skipped)
```

All tests passed successfully locally. CI verification pending.
