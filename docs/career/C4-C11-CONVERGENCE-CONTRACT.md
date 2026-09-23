# C4–C11 Pipeline Convergence Contract

## Executive Summary

This document defines the architectural decision for integrating the C4–C11 career pipeline into the production `CareerDomainInterpreterV2.ts`. The convergence contract establishes how the new structural reasoning pipeline (C4: careerStructuralReasoning, C5: careerPlanetaryRelevance, C8: careerExpression, C9: careerDasha activation, C10: careerD10 qualification) interacts with the legacy Product-A chain (interpretCareerTheme → buildCareerEvidence → linkCareerEvidence).

## Decision: Evidence-Driven Convergence (Option B)

**Selected Approach**: Feed C4–C11 outputs as additional DomainEvidence into the existing reasoning hierarchy.

### Rationale

1. **Preserves Existing Behavior**: The legacy Product-A chain has been validated in production and serves as the foundation for career interpretation. Adding new evidence sources rather than replacing the chain minimizes regression risk.

2. **Traceability**: By converting C4–C11 outputs into DomainEvidence objects, we maintain full provenance tracking through the existing evidence linking infrastructure.

3. **Gradual Migration**: This approach allows for incremental adoption of the new pipeline components without requiring a wholesale replacement of the current interpretation logic.

4. **Conflict Resolution**: The existing conflict detection and resolution mechanisms in the reasoning hierarchy can naturally handle potential conflicts between legacy and new evidence sources.

## Integration Architecture

### Current State (Pre-Integration)

```
CareerDomainInterpreterV2
├── interpretCareerTheme (Product-A)
│   └── ThemeInterpretationEvidence
├── buildCareerEvidence
│   └── DomainEvidence[]
├── linkCareerEvidence
│   └── DomainEvidence[] (with relatedEvidenceIds)
└── evaluateCareerReasoningHierarchy (CW-01)
    └── Final career conclusions
```

### Target State (Post-Integration)

```
CareerDomainInterpreterV2
├── interpretCareerTheme (Product-A)
│   └── ThemeInterpretationEvidence
├── buildCareerEvidence
│   └── DomainEvidence[] (legacy)
├── resolveCareerStructuralReasoning (C4)
│   └── CareerStructuralReasoning → DomainEvidence[]
├── interpretCareerPlanetaryRelevance (C5)
│   └── CareerPlanetaryRelevance[] → DomainEvidence[]
├── resolveCareerExpression (C8)
│   └── CareerExpressionAnalysis → DomainEvidence[]
├── buildCareerDashaSynthesis (C9)
│   └── CareerDashaSynthesis → DomainEvidence[] (already integrated)
├── mergeAllEvidence
│   └── DomainEvidence[] (legacy + C4-C11)
├── linkCareerEvidence
│   └── DomainEvidence[] (with cross-source linking)
└── evaluateCareerReasoningHierarchy (CW-01)
    └── Final career conclusions (enhanced)
```

## Evidence Transformation Contracts

### C4: Structural Reasoning → DomainEvidence

**Source**: `CareerStructuralReasoning` from `careerStructuralReasoning.ts`

**Transformation**:
- `CareerStructuralEvidence` → `DomainEvidence` with:
  - `sourceType`: 'STRUCTURAL_REASONING'
  - `domain`: 'CAREER'
  - `role`: Based on `CareerStructuralEvidence.role` → EvidenceRole mapping
  - `phase`: 'NATAL_PROMISE'
  - `source`: 'C4_STRUCTURAL'
  - `polarity`: Based on `CareerStructuralEvidence.direction`
  - `strength`: Based on `CareerStructuralEvidence.weight`
  - `ruleId`: `CareerStructuralEvidence.id`
  - `provenance`: Include structural direction and strength

### C5: Planetary Relevance → DomainEvidence

**Source**: `CareerPlanetaryRelevance[]` from `careerPlanetaryRelevance.ts`

**Transformation**:
- Each `CareerPlanetaryRelevance` → `DomainEvidence` with:
  - `sourceType`: 'PLANETARY_RELEVANCE'
  - `domain`: 'CAREER'
  - `role`: Based on `CareerPlanetRelevance` → EvidenceRole mapping
  - `phase`: 'NATAL_PROMISE'
  - `source`: 'C5_PLANETARY'
  - `polarity`: Based on `CareerPlanetEffect`
  - `strength`: Based on relevance level (PRIMARY > SUPPORTING > SECONDARY)
  - `ruleId`: Planet-specific identifier
  - `provenance`: Include planet, roles, and expression hints

### C8: Expression Analysis → DomainEvidence

**Source**: `CareerExpressionAnalysis` from `careerExpression.ts`

**Transformation**:
- Each `CareerExpression` → `DomainEvidence` with:
  - `sourceType`: 'EXPRESSION_ANALYSIS'
  - `domain`: 'CAREER'
  - `role`: 'MANIFESTATION'
  - `phase`: 'NATAL_PROMISE'
  - `source`: 'C8_EXPRESSION'
  - `polarity`: Based on `CareerExpressionDirection` (SUPPORTED → SUPPORTING)
  - `strength`: Based on `CareerExpressionStrength`
  - `ruleId`: `CAREER_EXPRESSION_RULE_IDS[mode]`
  - `provenance`: Include mode, direction, and evidence count

### C9: Dasha Activation → DomainEvidence

**Status**: Already integrated in production interpreter

**Current Implementation**: Dasha factors are converted to DomainEvidence with `sourceType: 'DASHA'` and injected into the merged evidence stream for traceability.

### C10: D10 Qualification → DomainEvidence

**Source**: D10 relationship evaluation from existing D10 processing

**Transformation**:
- D10 confirmation → `DomainEvidence` with:
  - `sourceType`: 'VARGA_QUALIFICATION'
  - `domain`: 'CAREER'
  - `role`: 'VARGA_CONFIRMATION'
  - `phase`: 'NATAL_PROMISE'
  - `source`: 'C10_D10'
  - `polarity`: Based on `VargaRelationship` (CONFIRMS → SUPPORTING)
  - `strength`: Based on D10 strength calculation
  - `ruleId`: D10-specific identifier
  - `provenance`: Include D10 relationship type

## Evidence Priority and Weighting

### Priority Hierarchy (Existing CW-01)

1. **PRIMARY**: Primary career houses (10H) and lords (10L)
2. **SUPPORTING**: Supporting houses (6H, 2H, 11H) and lords
3. **CHALLENGING**: Challenging houses (8H, 12H) and lords
4. **MODIFIER**: Timing, transit, and conditional factors

### New Evidence Source Priorities

- **C4 Structural**: Mapped to existing priority based on role (PRIMARY/SUPPORTING/CHALLENGING)
- **C5 Planetary**: Based on planet relevance (PRIMARY > SUPPORTING > SECONDARY)
- **C8 Expression**: Mapped to MANIFESTATION role (treated as MODIFIER in current hierarchy)
- **C10 D10**: Treated as VARGA_CONFIRMATION (existing role in hierarchy)

## Conflict Resolution Strategy

### Cross-Source Conflict Detection

The existing `detectDomainConflicts` function will be extended to:

1. **Structural vs. Theme Conflicts**: Detect when C4 structural direction conflicts with Product-A theme interpretation
2. **Expression vs. Manifestation Conflicts**: Detect when C8 expression modes conflict with existing manifestation conclusions
3. **Planetary vs. Lord Conflicts**: Detect when C5 planetary relevance conflicts with existing lord-based evidence

### Conflict Resolution Rules

1. **Structural Supremacy**: C4 structural reasoning takes precedence over Product-A theme interpretation for natal promise direction
2. **Evidence Weighting**: When conflicts occur, evidence with higher weight (sum of individual evidence weights) prevails
3. **Temporal Override**: Dasha activation (C9) can temporarily override natal conflicts during active periods
4. **Varga Confirmation**: C10 D10 qualification can confirm or reject natal evidence (existing behavior preserved)

## Migration Phases

### Phase 1: Structural Integration (C4)
- Add `resolveCareerStructuralReasoning` call
- Transform structural evidence to DomainEvidence
- Merge with existing evidence stream
- Validate against existing test suite

### Phase 2: Planetary Integration (C5)
- Add `interpretCareerPlanetaryRelevance` call
- Transform planetary relevance to DomainEvidence
- Establish cross-linking with structural evidence
- Validate planetary relevance calculations

### Phase 3: Expression Integration (C8)
- Add `resolveCareerExpression` call
- Transform expression analysis to DomainEvidence
- Integrate with manifestation synthesis
- Validate expression selection logic

### Phase 4: D10 Qualification Enhancement (C10)
- Enhance existing D10 processing with explicit C10 labeling
- Improve D10 evidence provenance
- Validate D10 conflict resolution

## Backward Compatibility Guarantees

1. **Legacy Evidence Preservation**: All existing Product-A evidence remains in the evidence stream
2. **Existing Behavior**: In the absence of new C4–C11 evidence, the interpreter behaves identically to current production
3. **Gradual Rollout**: New evidence sources can be toggled via feature flags if needed
4. **Test Compatibility**: All existing tests continue to pass without modification

## Performance Considerations

1. **Evidence Merging**: The merged evidence stream will be larger (legacy + C4–C11). Performance impact estimated at <10% increase in processing time.
2. **Linking Complexity**: Cross-source evidence linking adds computational overhead. Optimized through efficient Map-based lookups.
3. **Memory Usage**: Additional evidence objects increase memory footprint. Estimated increase: ~5-10MB for typical charts.

## Success Criteria

1. **Functional**: All existing tests pass with new evidence integrated
2. **Performance**: No significant performance degradation (>20% increase in interpretation time)
3. **Quality**: New evidence sources provide meaningful differentiation in ambiguous cases
4. **Traceability**: Full provenance chain from raw input to final conclusion includes C4–C11 sources
5. **Maintainability**: Clear separation between legacy and new evidence processing pipelines

## References

- `src/domain/career/careerStructuralReasoning.ts` (C4)
- `src/domain/career/careerPlanetaryRelevance.ts` (C5)
- `src/domain/career/careExpression.ts` (C8)
- `src/domain/career/careerDasha/` (C9)
- `src/domain/career/CareerDomainInterpreterV2.ts` (Production interpreter)
- `docs/career/CW-R1-C1-CAREER-SEMANTIC-FREEZE.md` (C1 semantic definitions)
