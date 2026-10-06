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
Structural context for the 10th house from a reference point:
- `referencePoint` — LAGNA or MOON
- `house10Number` — The house number (1-12) that is the 10th house from the reference point
- `house10Sign` — The sign occupying the 10th house
- `house10Lord` — The lord of the 10th house (10L)
- `lordHouse` — The house number where the 10L is placed
- `occupants` — Planets occupying the 10th house (as ParticipantId array)
- `aspectsOn10H` — Aspects on the 10th house from NatalGrahaDrishtiReport
- `provenance` — Source report IDs for tracking

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
- House 10 is simply the 10th house from Ascendant
- Sign and lord from `HouseLordshipReport.houseLords[10]`
- Occupants and aspects from `HouseAnalysisReport.houses[10]`
- Lord's house placement from `houseAnalysis.houses[10].lordAnalysis.house`

### MOON Reference Point
For MOON reference:
- Derive Moon's sign from `planetFacts[Planet.MOON].sign` or `.position.sign`
- Calculate 10th-from-Moon house via sign arithmetic:
  - 10th-from-Moon sign = (MoonSignNumber + 9) mod 12 + 1
  - Map that sign back to Lagna-relative house number
- Occupants and aspects from the corresponding house in `HouseAnalysisReport`

### Sign Arithmetic
The 10th-from-Moon calculation uses sign arithmetic:
1. Get Moon's sign number (1-12) from `SIGNS_METADATA`
2. 10th-from-Moon sign number = (MoonSignNumber + 9) mod 12 + 1
3. Convert to Lagna-relative house number:
   - houseNumber = (10thFromMoonSignNumber - ascendantSignNumber + 12) mod 12 + 1

Example: Lagna = Aries (1), Moon = Cancer (4)
- 10th-from-Moon = (4 + 9) mod 12 + 1 = 13 mod 12 + 1 = 1 + 1 = 2 (Taurus)
- Taurus is Lagna house 2, so house10Number = 2

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
- `buildCareer10HEvidenceId(referencePoint, evidenceType, detail)` — Builds evidence ID

### Frozen Builders
- `freezeCareer10HContext(context)` — Creates frozen copy of context
- `freezeCareer10HFoundation(foundation)` — Creates frozen copy of foundation

### Validation
- `isValidReferencePoint(value)` — Validates reference point
- `isValidHouseNumber(value)` — Validates house number (1-12)

### Participant ID Utilities
- `sortParticipantIds(ids)` — Sorts participant IDs in canonical order
- `dedupParticipantIds(ids)` — Deduplicates and sorts participant IDs

## Determinism

### Context ID
Context IDs are deterministic based on reference point and signs:
- Format: `CAREER_10H_CONTEXT:{refPoint}:{ascSign}:{moonSign}`
- Same inputs always produce same ID

### Occupant Ordering
Occupants are sorted alphabetically by ParticipantId for determinism.

### Aspect Ordering
Aspects are extracted in the order they appear in the source report.

### Output Freezing
All outputs are `Object.freeze` deeply (freeze contexts, arrays, nested objects).

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
- If aspect report is missing, `aspectsOn10H` is empty array (not fabricated)
- If lord house is missing, context is `null` (not fabricated)
- If Moon sign is missing, Moon context is `null` (not fabricated)

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
- Lagna context extraction
- Moon context extraction
- Same horoscope different reference points
- 10H sign/lord/occupants/aspects verification
- 10L identification + house placement
- Determinism (stable ordering/identity/dup-free/frozen)
- Boundary (no Dasha/D10/transit/profession/AI imports)
- Missing data (no Moon / no aspect report → clean INSUFFICIENT_DATA, no fabricated evidence)

### Test Strategy
Tests use minimal fixtures that replicate the structure of engine reports without requiring full horoscope calculation. This ensures fast, isolated unit tests.

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
- [x] `career10HFoundationTypes.ts` implemented with core types
- [x] `career10HFoundationUtils.ts` implemented with ID builders
- [x] `career10HStructuralAnalyzer.ts` implemented with `analyzeCareer10HContext`
- [x] `defaultCareer10HFoundation.ts` implemented with `resolveCareer10HFoundation`
- [x] `index.ts` created for module exports
- [x] Comprehensive tests written in `career10HFoundation.test.ts`
- [x] Documentation created in `P2-07F-10H-STRUCTURAL-CONTEXT.md`
- [x] `npm run lint` passes (type safety verification)
- [x] Tests pass (including houseAnalysis/houseLordship tests)
- [x] No boundary violations (no forbidden imports)
- [x] Determinism verified (stable ordering/identity)
- [x] Missing data handling verified (INSUFFICIENT_DATA, no fabrication)
