# P2-07F 10H Structural Context

**Status:** IMPLEMENTED — VERIFIED

## Overview

P2-07F is the structural-only 10th house analysis layer that composes existing engine reports (`HouseLordshipReport`, `HouseAnalysisReport`, `NatalGrahaDrishtiReport`) into a canonical 10H/10L context for Lagna and Moon reference points. This layer adds **no** new astrology logic — it only reorganizes and composes existing facts.

## Module Purpose

This module provides the foundational 10th house facts needed for career analysis without interpretation or evidence generation. It serves as the structural base for higher-level career intelligence layers.

## Core Types

### CareerReferencePoint
- `LAGNA` — 10th house from Ascendant
- `MOON` — 10th house from Moon sign

### Career10HContext
Structural context for the 10th house from a reference point with explicit coordinate model:
- `referencePoint` — LAGNA or MOON
- `referenceHouseNumber` — Always 10 (the 10th house FROM the reference point)
- `referenceHouseSign` — The sign occupying the 10th house from the reference point
- `lagnaRelativeHouseNumber` — The Lagna-relative house number where referenceHouseSign sits (lookup key into houseAnalysis.houses)
- `house10Lord` — The lord of the 10th house (10L) — lord of referenceHouseSign
- `lordHouse` — The house number where the 10L is placed (from houseAnalysis.houses[lagnaRelativeHouseNumber].lordAnalysis.house)
- `occupants` — Planets occupying the 10th house (as ParticipantId array) — from houseAnalysis.houses[lagnaRelativeHouseNumber]
- `aspectsOn10H` — Aspects on the 10th house from NatalGrahaDrishtiReport — from houseAnalysis.houses[lagnaRelativeHouseNumber]
- `aspectDataStatus` — Status of aspect data ('AVAILABLE' if report present, 'UNAVAILABLE' if report absent)
- `provenance` — Source report IDs and locators for tracking

**Coordinate Model:**
- For LAGNA: referenceHouseSign = sign of Lagna house 10, lagnaRelativeHouseNumber = 10
- For MOON: referenceHouseSign = 10th-from-Moon sign, lagnaRelativeHouseNumber = calculated via sign arithmetic
- Occupants and aspects are always Lagna-relative by design, since HouseAnalysisReport is keyed on Lagna-relative houses

### Career10HFoundation
Complete 10H foundation containing both Lagna and Moon contexts:
- `lagnaContext` — 10th house context from Lagna reference point
- `moonContext` — 10th house context from Moon reference point

**NOTE:** NO `convergence` field — that's P2-07I (later phase).

### Career10HFoundationInput
Input for resolving 10H foundation:
- `horoscope` — Horoscope with pre-computed reports (optional)
- `houseLordship` — Pre-computed house lordship report (optional if horoscope provided)
- `houseAnalysis` — Pre-computed house analysis report (optional if horoscope provided)
- `natalGrahaDrishti` — Pre-computed natal graha drishti report (optional if horoscope provided)

### Career10HFoundationResult
Result of 10H foundation resolution:
- `status` — COMPLETE or INSUFFICIENT_DATA
- `foundation` — Career10HFoundation with contexts
- `missingInputs` — List of missing required inputs

## Analysis Logic

### LAGNA Reference Point
For LAGNA reference:
- `referenceHouseNumber` = 10 (always)
- `referenceHouseSign` = sign of Lagna house 10 from `HouseAnalysisReport.houses[10].sign`
- `lagnaRelativeHouseNumber` = 10
- `house10Lord` = lord of referenceHouseSign from `SIGNS_METADATA[referenceHouseSign].ruler`
- Occupants and aspects from `HouseAnalysisReport.houses[10]` (via lagnaRelativeHouseNumber)
- Lord's house placement from `houseAnalysis.houses[10].lordAnalysis.house`

### MOON Reference Point
For MOON reference:
- `referenceHouseNumber` = 10 (always)
- Derive Moon's sign from `planetFacts[Planet.MOON].sign` or `.position.sign`
- Calculate 10th-from-Moon sign via sign arithmetic:
  - 10th-from-Moon sign = (MoonSignNumber + 9) mod 12 + 1
- `referenceHouseSign` = 10th-from-Moon sign
- `lagnaRelativeHouseNumber` = map referenceHouseSign back to Lagna-relative house number
- `house10Lord` = lord of referenceHouseSign from `SIGNS_METADATA[referenceHouseSign].ruler`
- Occupants and aspects from `HouseAnalysisReport.houses[lagnaRelativeHouseNumber]`

### Sign Arithmetic
The 10th-from-Moon calculation uses sign arithmetic:
1. Get Moon's sign number (1-12) from `SIGNS_METADATA`
2. 10th-from-Moon sign number = (MoonSignNumber + 9) mod 12 + 1
3. Convert to Lagna-relative house number:
   - houseNumber = (10thFromMoonSignNumber - ascendantSignNumber + 12) mod 12 + 1

Example: Lagna = Aries (1), Moon = Cancer (4)
- 10th-from-Moon = (4 + 9) mod 12 + 1 = 13 mod 12 + 1 = 1 + 1 = 2 (Taurus)
- Taurus is Lagna house 2, so lagnaRelativeHouseNumber = 2

## Reuse Contract

This module MUST NOT recompute existing engine data:
- **Never recompute lordship** — use `resolveHouseLords`/`HouseLordshipReport`
- **Never recompute aspects** — use `natalGrahaDrishti` report
- **Never recompute occupancy** — use `analyzeHouses` output

The legacy `themeInterpretation` career rules (`CAREER_10H_STRONG_001` etc.) stay untouched — P2-07F exposes the underlying facts so those rules can migrate later; do not duplicate or rename them.

## Utility Functions

### ID Builders
- `buildCareer10HContextId(referencePoint, ascendantSign, moonSign?)` — Builds deterministic context ID
- `buildCareer10HFoundationId(ascendantSign, moonSign)` — Builds foundation ID

### Frozen Builders
- `freezeCareer10HContext(context)` — Creates frozen copy of context
- `freezeCareer10HFoundation(foundation)` — Creates frozen copy of foundation

### Validation
- `isValidReferencePoint(value)` — Validates reference point
- `isValidHouseNumber(value)` — Validates house number (1-12)

### Participant ID Utilities
- `sortParticipantIds(ids)` — Sorts participant IDs using canonical planet order from careerPlanetOrder
- `dedupParticipantIds(ids)` — Deduplicates and sorts participant IDs in a single pass

## Determinism

### Context ID
Context IDs are deterministic based on reference point and signs:
- Format: `CAREER_10H_CONTEXT:{refPoint}:{ascSign}:{moonSign}`
- Same inputs always produce same ID

### Occupant Ordering
Occupants are sorted using canonical planet order from careerPlanetOrder via `compareParticipantIds`.

### Aspect Ordering
Aspects are extracted in the order they appear in the source report.

### Output Freezing
All outputs are `Object.freeze` deeply (freeze contexts, arrays, nested objects).

## Provenance Contract

Provenance tracking distinguishes between real source IDs and locators:

### Career10HProvenance Structure
- `houseLordshipEvidenceId?: string` — Real ruleId from HouseLordshipReport (if available)
- `sourceHouseIndex: number` — Locator - the Lagna-relative house number used to fetch data from HouseAnalysisReport
- `drishtiSource: { reportPresent: boolean; aspectCount: number }` — Structural reference to aspect data
- `drishtiAspectIds: readonly string[]` — Real aspect identity IDs from source report (if available), empty array if absent

### Provenance Rule
Provenance contains only IDs that exist upstream; locators are fields, not fabricated IDs:
- If the source aspect record carries an identity field, use it
- Otherwise, drishtiAspectIds is an empty array (no fabricated IDs like `DRISHTI:...:${index}`)
- sourceHouseIndex is a locator (field), not a provenance ID

### Aspect Identity Matching
The `buildProvenance` function attempts to recover aspect identity IDs from `natalGrahaDrishti` records:
- **Primary match**: Full semantic tuple (`sourcePlanet`, `targetHouse`, `aspectType`, `houseOffset`) when source record has these fields
- **Fallback match**: `sourcePlanet + targetHouse` only when source record lacks extra fields
- **Multiple matches**: If multiple records match, include all matching identity IDs (do not silently take the first)

**Note**: `drishtiAspectIds` is best-effort until `natalGrahaDrishti` records carry a canonical `identityKey` per the project-wide one-fact-one-key convention. This is a tracked follow-up, not completed provenance.

## Aspect Availability Semantics

Aspect data is treated as an enrichment, not a structural prerequisite:

### aspectDataStatus Field
- `'AVAILABLE'` — NatalGrahaDrishtiReport is present and was processed
- `'UNAVAILABLE'` — NatalGrahaDrishtiReport is absent or invalid

### Status Impact
- COMPLETE status means structural data is complete; aspect-unavailable is expressed via aspectDataStatus
- Missing aspect report does NOT cause INSUFFICIENT_DATA status
- contexts can be built without aspect data (aspectsOn10H will be empty array, aspectDataStatus will be 'UNAVAILABLE')

### Missing Data Handling
- When aspect report is absent: aspectsOn10H = [], aspectDataStatus = 'UNAVAILABLE'
- When aspect report is present but has no aspects for target house: aspectsOn10H = [], aspectDataStatus = 'AVAILABLE'

## Boundary Enforcement

This module MUST NOT:
- Implement any new astrology calculations or interpretations
- Import from careerDasha, careerD10, careerFinalSynthesis, careerExpression
- Import from domain/timing
- Import careerMechanism, careerProfession
- Perform strength/score calculations
- Generate evidence or interpretations
- Process Dasha/D10/transit/profession/domain inference
- Make AI calls or generate yoga

**Note**: Canonical planet ordering is available from `careerPlanetOrder` (not `careerMechanism`).

**Facts ≠ derived evidence ≠ interpretation** — `Career10HEvidence` is a later phase.

## Missing Data Handling

### INSUFFICIENT_DATA
The module returns `INSUFFICIENT_DATA` status when:
- `houseLordship` report is missing
- `houseAnalysis` report is missing
- `planetFacts` is missing
- `ascendantSign` is missing
- Moon sign is missing (for MOON reference)

### Partial Contexts
When Moon context cannot be resolved but Lagna context can:
- `lagnaContext` is populated
- `moonContext` is `null`
- Status is `INSUFFICIENT_DATA`
- `missingInputs` includes `'moonContext'`

### No Fabrication
The module NEVER fabricates missing data:
- If aspect report is missing, `aspectsOn10H` is empty array and `aspectDataStatus` is 'UNAVAILABLE' (not fabricated)
- If lord house is missing, context is `null` (not fabricated)
- If Moon sign is missing, Moon context is `null` (not fabricated)
- natalGrahaDrishti is an enrichment, not a structural prerequisite — missing it does not cause INSUFFICIENT_DATA

## Module Structure

```
src/domain/career/career10h/
├── career10HFoundationTypes.ts       # Core types and interfaces
├── career10HFoundationUtils.ts      # Utility functions (ID builders, frozen builders)
├── career10HStructuralAnalyzer.ts    # Main analyzer (analyzeCareer10HContext)
├── defaultCareer10HFoundation.ts     # Foundation resolver (resolveCareer10HFoundation)
├── index.ts                          # Module exports
└── career10HFoundation.test.ts       # Comprehensive tests
```

## Testing

### Test Coverage
- Lagna context extraction with explicit coordinate model
- Moon context extraction with sign arithmetic
- Same horoscope different reference points
- 10H sign/lord/occupants/aspects verification
- 10L identification + house placement
- Determinism (stable ordering/identity/dup-free/frozen)
- Boundary enforcement (no forbidden imports in source files)
- Integration tests with real analyzeHouseLordship output
- Missing data (no Moon / no aspect report → correct status, no fabricated evidence)
- Aspect availability semantics (AVAILABLE vs UNAVAILABLE)

### Test Strategy
Tests use a mix of:
- Minimal fixtures that replicate the structure of engine reports for fast, isolated unit tests
- Integration tests that call real engine functions (analyzeHouseLordship) to verify compatibility

## Integration Points

### Upstream Dependencies
- `HouseLordshipReport` from `src/engine/houseLordship/houseLordship.ts`
- `HouseAnalysisReport` from `src/types.ts`
- `NatalGrahaDrishtiReport` from `src/types.ts`
- `PlanetFacts` from `src/types.ts`
- `SIGNS_METADATA` from `src/data/astroData.ts`
- `createParticipantId` from `src/domain/career/careerParticipantRoles/participantRoleUtils.ts`

### Downstream Consumers
This module provides the structural 10H facts for:
- P2-07I — 10H Convergence (later phase)
- Career evidence generation layers
- Career interpretation layers

## Future Phases

### P2-07I — 10H Convergence
Will add `convergence` field to `Career10HFoundation` that analyzes relationships between Lagna and Moon contexts.

### Evidence Generation
Later phases will add `Career10HEvidence` types that interpret the structural facts from this module.

## Verification Checklist

- [x] Module directory structure created
- [x] `career10HFoundationTypes.ts` implemented with core types and explicit coordinate model
- [x] `career10HFoundationUtils.ts` implemented with ID builders and canonical participant ordering
- [x] `career10HStructuralAnalyzer.ts` implemented with `analyzeCareer10HContext` and real provenance
- [x] `defaultCareer10HFoundation.ts` implemented with `resolveCareer10HFoundation`
- [x] `index.ts` created for module exports
- [x] Comprehensive tests written in `career10HFoundation.test.ts`
- [x] Documentation created in `P2-07F-10H-STRUCTURAL-CONTEXT.md`
- [x] Explicit coordinate model (referenceHouseNumber, referenceHouseSign, lagnaRelativeHouseNumber)
- [x] Provenance contract (real source IDs vs locators, no fabricated IDs)
- [x] Aspect availability semantics (aspectDataStatus field, enrichment vs prerequisite)
- [x] Participant ordering using compareParticipantIds from careerPlanetOrder
- [x] `buildCareer10HEvidenceId` removed (evidence IDs belong to deferred evidence layer)
- [x] All `as any` casts removed from codebase
- [x] Fake boundary tests replaced with real boundary enforcement and integration tests
- [x] Moon-10L regression test (Moon 10H sign ≠ Lagna 10H sign)
- [x] Coordinate-model guardrail test
- [x] Aspect-identity matching tightened (full semantic tuple)
- [x] Boundary test hardening (comment stripping, careerMechanism in forbidden list)
- [x] careerMechanism import removed (moved to careerPlanetOrder)
- [x] `npm run lint` passes (type safety verification)
- [x] Tests pass (including houseAnalysis/houseLordship tests)
- [x] No boundary violations (no forbidden imports)
- [x] Determinism verified (stable ordering/identity)
- [x] Missing data handling verified (INSUFFICIENT_DATA, no fabrication)
