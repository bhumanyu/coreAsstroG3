# C10 Architecture and Integration

## Overview

C10 (Career D10 Qualification) is the designated authoritative D10 qualification layer for the future Career Synthesis architecture; the current implementation is in the foundation/migration phase. It provides a semantic interpretation of how D10 (Dasamsa) chart evidence qualifies, modifies, or preserves natal career direction and strength.

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
Existing D10 Interpretation (d10CareerManifestation)
        ↓
D10 Deterministic Facts
        ↓
C10 Qualification (careerD10Qualification)
        ↓
Conflict Resolution
        ↓
Final Career Synthesis
```

### Integration Strategy

During the current migration phase:

1. **C10 Foundation**: C10 implements the core qualification semantics (direction, effect, strength) using raw D10 chart data (houses, planets, conditions)

2. **Future Integration**: Before C10 is frozen for final Career Synthesis, the architecture will establish:
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

4. **Dasha Independence**: C10 preserves but does not override C9 (Dasha) effects

## Implementation Notes

### What C10 Currently Does

- Consumes raw D10 chart data (houses, planets, conditions)
- Applies semantic hierarchy: PRIMARY > SECONDARY > MODIFIER evidence
- Resolves D10 direction using house-based semantics
- Resolves D10 strength using evidence hierarchy (not arbitrary ratios)
- Qualifies natal career states without overwriting them
- Generates deterministic evidence IDs based on source evidence

### What C10 Does Not Yet Do

- Consume existing `d10CareerManifestation` results
- Consume `VargaRelationship` evidence
- Qualify C8 expressions (currently returns empty array)
- Integrate with legacy career conclusion D10 logic

### Future Work

Before C10 freeze:
1. Establish data flow from `d10CareerManifestation` → C10 context
2. Migrate `VargaRelationship` semantics to C10's model
3. Remove legacy D10 logic from `careerConclusion.ts`
4. Implement C8 expression qualification
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
- Format: `CAREER_D10_QUAL:{SOURCE}:{DIRECTION}:{ROLE}`
- Example: `CAREER_D10_QUAL:D10_DIRECTION_RESOLUTION:SUPPORT:PRIMARY`

This ensures stable IDs for evidence linking across resolver invocations.

### Natal State Preservation

C10 distinguishes between:
- **UNAVAILABLE**: No data, cannot qualify
- **NEUTRAL/UNDETERMINED**: No established promise to qualify
- **SUPPORT/MIXED/CHALLENGE**: Established states that can be qualified

CHALLENGE states are preserved as authoritative; D10 cannot manufacture SUPPORT where natal shows CHALLENGE.
