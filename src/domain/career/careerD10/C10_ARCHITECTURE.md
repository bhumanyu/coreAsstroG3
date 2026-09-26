# C10 Architecture and Integration

## Overview

C10 (Career D10 Qualification) is the designated authoritative D10 qualification layer for the Career Synthesis architecture. It provides a semantic interpretation of how D10 (Dasamsa) chart evidence qualifies, modifies, or preserves natal career direction and strength.

## Canonical Integration Adapter (Current Implementation)

### Architecture Pattern

C10 follows the C9 Dasha integration pattern: an adapter-only wave over the existing C10 semantic engine. The implementation consists of:

1. **`careerD10CanonicalTypes.ts`** - Canonical types per spec §4:
   - `CareerD10CanonicalAvailability` - Availability status
   - `CareerD10CanonicalRelationship` - Relationship types (REINFORCES, QUALIFIES, MODIFIES, CONFLICTS, PRESERVES, UNAVAILABLE)
   - `CareerD10CanonicalProvenance` - Evidence provenance with source tracking
   - `CareerD10CanonicalEvidence` - Canonical evidence with identityKey/id separation
   - `CareerD10Conflict` - Conflict detection for evidence
   - `CareerD10ExpressionQualificationCanonical` - Expression qualification
   - `CareerD10CanonicalAnalysis` - Final canonical analysis (no dasha/timing/C11 fields)

2. **`careerD10Integration.ts`** - Adapter implementation:
   - `CareerD10IntegrationInput = { horoscope: Horoscope; natal: CareerNatalAnalysis; expression: CareerExpressionAnalysis }`
   - C10 is parallel to C9 (no Dasha dependency)
   - `mapD10Condition(dignity: DignityStatus | undefined): CareerPlanetaryCondition` - Maps dignity to condition
   - `CANONICAL_D10_PLANETS` - Frozen planet order (SUN…KETU)
   - `buildD10PlanetContexts(horoscope)` - Reads D10 planets from divisionalInterpretation
   - `buildD10HouseContexts(horoscope)` - Reads D10 houses with occupants
   - `buildCareerD10Context(input)` - Builds context per spec §10
   - `resolveCanonicalRelationship(effect)` - Maps effects to relationships
   - `buildD10EvidenceIdentityKey(source, direction, role)` - Evidence identity key generation
   - `canonicalizeEvidence(evidence, result)` - Canonical evidence attachment
   - `buildD10Conflicts(canonicalEvidence)` - Conflict detection
   - `resolveExpressionRelationship(expression, d10Direction)` - Expression relationship resolution
   - `qualifyExpression(expression, result)` - Expression qualification
   - `resolveAvailability(result)` - Availability resolution
   - `resolveNatalRootEvidenceIds` - Conservative empty array (mirror C9)
   - `buildCareerD10Analysis(input)` - Main public function

3. **`careerD10Integration.test.ts`** - Comprehensive test coverage:
   - Test groups A–O covering spec requirements
   - Real-engine chain test (§41)
   - Natal preservation tests (§26-30)
   - Expression qualification tests (§31-32)
   - Determinism and immutability tests (§34-38)
   - Evidence identityKey vs id tests (§36)
   - D10 does not mutate horoscope (§39)
   - No timing/transit/finalConclusion properties (§40)

### Key Design Decisions

**Canonical Integration Pattern**: C10 is an adapter-only wave that wraps the existing C10 semantic engine (`careerD10Qualification.ts`) without modifying it. This preserves the existing implementation while providing a canonical interface.

**Parallel to C9**: C10 consumes `Horoscope` + `CareerNatalAnalysis` + C8 `CareerExpressionAnalysis`, but does NOT include C9/Dasha input. C10 is parallel to C9 in the layering: Natal foundation → Career promise → Expression → {C9 Dasha, C10 D10} → C11.

**Qualifies but Never Creates**: C10 only qualifies existing C8 expressions; it never invents new expressions from D10 alone. This preserves natal C4–C7 authority.

**Evidence IdentityKey vs ID**: Canonical evidence uses separate identityKey (semantic identity) and id (occurrence identity) for proper deduplication and traceability.

**Root Evidence Empty**: `resolveNatalRootEvidenceIds` returns an empty array (conservative approach, mirror C9) since WeightedReasoningEvidence does not expose structured planet/subject fields.

**Missing D10 ≠ Negative D10**: When D10 data is unavailable, C10 returns `UNAVAILABLE` for availability/d10Direction/d10Effect but preserves natal direction/strength. Missing evidence is not negative evidence.

**mapD10Condition Decision**: Neutral dignity (NEUTRAL, NEUTRAL_SIGN, undefined) maps to `UNAVAILABLE` condition, not `MODERATE`. This is a conservative decision: neutral dignity does not imply moderate planetary condition.

**NatalHouse Placeholder**: The `natalHouse` field in `CareerD10PlanetContext` is set to 0 as a documented placeholder for future migration. Real natal house mapping is deferred.

**Tenant Population**: D10 house contexts populate `tenants` and `tenantConditions` from the real `occupants` array in the D10 house interpretation, not hardcoded empty arrays.

### Input Contracts

**C10 Consumes**:
- `Horoscope.divisionalInterpretation?.d10?.planets` - D10 planet interpretations
- `Horoscope.divisionalInterpretation?.d10?.houses` - D10 house interpretations
- `CareerNatalAnalysis` - Natal C4–C7 boundary
- `CareerExpressionAnalysis` - C8 expression analysis

**C10 Does NOT Consume**:
- C9/Dasha input (parallel architecture)
- Legacy `d10CareerManifestation` results (deferred migration)
- `VargaRelationship` evidence (deferred migration)

### Output Contracts

**`CareerD10CanonicalAnalysis` Contains**:
- `availability` - AVAILABLE or UNAVAILABLE
- `natalDirection`/`natalStrength` - Copied from natal (never mutated)
- `d10Effect`/`d10Direction`/`d10Strength` - D10 qualification results
- `qualifiedDirection`/`qualifiedStrength` - Final qualified results
- `natalPromisePreserved` - Boolean flag
- `relationship` - Canonical relationship type
- `evidence` - Canonical evidence array
- `conflicts` - Conflict detection results
- `expressionQualifications` - Expression qualification results
- `rootEvidenceIds` - Deduplicated sorted array (empty in current implementation)
- `statement` - Human-readable summary

**`CareerD10CanonicalAnalysis` Does NOT Contain**:
- `dashaEffect`/`dashaDirection`/`dashaStrength` (C9 fields)
- `timing` fields
- `transit` fields
- `finalConclusion` (C11 field)

### Deferred Items

The following items are deferred to future waves:

1. **NatalHouse Migration**: The `natalHouse` field is currently set to 0 as a placeholder. Future migration will map D10 planet positions to their natal house positions.

2. **d10CareerManifestation Integration**: Existing `d10CareerManifestation` logic in `src/domain/career/d10/` will feed into C10's context in a future wave.

3. **VargaRelationship Migration**: Legacy `VargaRelationship` logic will be migrated to use C10's semantic model.

4. **Legacy D10 Removal**: After A/B testing, legacy D10 logic will be removed from `careerConclusion.ts`.

## Relationship to Existing D10 Logic

### Current State

The codebase contains existing D10 career logic in `src/domain/career/d10/`:
- `d10CareerManifestation.ts` - D10 manifestation interpretation
- `d10CareerManifestationRules.ts` - Rules for D10 manifestation
- `d10CareerManifestationTypes.ts` - Types for D10 manifestation

Additionally, there is D10-aware infrastructure:
- `careerDashaD10Context.ts` - D10 context for dasha analysis
- Existing career conclusion logic that consumes `VargaRelationship` with values like `CONFIRMS`, `PARTIALLY_CONFIRMS`, `MODIFIES`, `CONFLICTS`, `UNAVAILABLE`

### C10's Role

C10 is **not** a second independent D10 interpretation engine. It serves as the **qualification layer** that sits on top of existing D10 interpretation:

```
D10 Chart (Raw Data)
        ↓
Existing D10 Interpretation (d10CareerManifestation) [Deferred]
        ↓
D10 Deterministic Facts
        ↓
C10 Qualification (careerD10Qualification) [Current Semantic Engine]
        ↓
C10 Canonical Adapter (careerD10Integration) [New Adapter]
        ↓
Conflict Resolution
        ↓
Final Career Synthesis
```

### Integration Strategy

During the current migration phase:

1. **C10 Foundation**: C10 implements the core qualification semantics (direction, effect, strength) using raw D10 chart data (houses, planets, conditions)

2. **Canonical Adapter**: C10 now has a canonical integration adapter that wraps the semantic engine with proper typing, evidence canonicalization, and conflict detection

3. **Future Integration**: Before C10 is frozen for final Career Synthesis, the architecture will establish:
   - C10 as the single authoritative D10 qualification layer
   - Existing `d10CareerManifestation` logic will feed into C10's context
   - Legacy `VargaRelationship` logic will be migrated to use C10's semantic model
   - One D10 truth: C10's output becomes the definitive D10 qualification result

### Key Architectural Principles

1. **Single Source of Truth**: C10 will be the only D10 qualification layer in final Career Synthesis

2. **Semantic Clarity**: C10 uses clear semantic vocabulary:
   - `QUALIFIES`, `WEAKENS`, `REINFORCES`, `CONFLICTS` (effects)
   - `SUPPORT`, `CHALLENGE`, `MIXED`, `NEUTRAL` (directions)
   - `VERY_STRONG`, `STRONG`, `MODERATE`, `WEAK`, `VERY_WEAK` (strengths)

3. **Natal Preservation**: C10 cannot create career promise where none exists; it only qualifies established natal states

4. **Dasha Independence**: C10 is parallel to C9 (no Dasha dependency)

5. **Adapter-Only Wave**: C10 integration is an adapter-only wave that does not modify the existing semantic engine

## Implementation Notes

### What C10 Currently Does

- Consumes raw D10 chart data (houses, planets, conditions) via divisionalInterpretation
- Applies semantic hierarchy: PRIMARY > SECONDARY > MODIFIER evidence
- Resolves D10 direction using house-based semantics
- Resolves D10 strength using evidence hierarchy (not arbitrary ratios)
- Qualifies natal career states without overwriting them
- Generates deterministic evidence IDs based on source evidence
- Canonicalizes evidence with identityKey/id separation
- Detects conflicts in canonical evidence
- Qualifies existing C8 expressions (never creates new ones)
- Provides frozen immutable output

### What C10 Does Not Yet Do

- Consume existing `d10CareerManifestation` results (deferred)
- Consume `VargaRelationship` evidence (deferred)
- Integrate with legacy career conclusion D10 logic (deferred)
- Map natal houses for D10 planets (deferred - placeholder 0)

### Future Work

Before C10 freeze:
1. Establish data flow from `d10CareerManifestation` → C10 context
2. Migrate `VargaRelationship` semantics to C10's model
3. Remove legacy D10 logic from `careerConclusion.ts`
4. Implement natal house mapping for D10 planets
5. Document final C10 contract for Career Synthesis

## Design Decisions

### Evidence Hierarchy

C10 uses a semantic hierarchy rather than count-based scoring:
- **PRIMARY evidence**: 10th house lord, planets in PRIMARY houses
- **SECONDARY evidence**: SUPPORTING houses, planets in SUPPORTING houses  
- **MODIFIER evidence**: Tenants, planets in non-career houses

This ensures that career-critical evidence outweighs peripheral evidence.

### D10 House Role Semantics

**Intentional Design Decision**: C10 applies the same career house portfolio semantics to D10 houses as used in natal career analysis.

Specifically:
- D10 house 10 = PRIMARY (career-critical)
- D10 houses 6, 2, 11 = SUPPORTING (career-supportive)
- D10 houses 8, 12 = CHALLENGING (career-challenging)

This is explicitly defined in `CAREER_HOUSE_PORTFOLIO` and applied via `classifyCareerHouse()` to D10 house numbers.

**Rationale**: D10 (Dasamsa) is the career-specific divisional chart. Its house semantics directly map to career significance:
- The 10th house in D10 represents the career manifestation axis itself
- The supporting houses (6, 2, 11) represent service, resources, and gains in career context
- The challenging houses (8, 12) represent obstacles and loss in career context

This mapping is intentional and not an accidental borrowing of natal semantics. Future refactoring may create a dedicated D10 house portfolio if astrological justification requires different semantics, but the current design treats D10 house roles as isomorphic to natal career house roles.

### Deterministic Evidence IDs

Evidence IDs are derived from source evidence rather than sequential counters:
- Semantic identityKey: `CAREER_D10:<source>:<direction>:<role>`
- Occurrence id: `identityKey:<d10Effect>:<d10Strength>`

This ensures stable IDs for evidence linking across resolver invocations and proper deduplication.

### Natal State Preservation

C10 distinguishes between:
- **UNAVAILABLE**: No data, cannot qualify
- **NEUTRAL/UNDETERMINED**: No established promise to qualify
- **SUPPORT/MIXED/CHALLENGE**: Established states that can be qualified

CHALLENGE states are preserved as authoritative; D10 cannot manufacture SUPPORT where natal shows CHALLENGE.

### Canonical Natal Aspect/D10 Authority

C10 respects canonical natal aspect authority from C4. D10 qualification operates as a parallel layer to C9 Dasha activation, with clear boundaries:
- C4–C8: Authoritative producer of natal Career structural evidence and promise
- C9: Authoritative producer of Dasha activation insights
- C10: Authoritative producer of D10 qualification insights
- C11: Authoritative producer of final Career synthesis

C10 does not mutate natal C4–C7 authority; it copies natal direction/strength for traceability only.
