# CW-R1 — Career Convergence Contract

## Status

Design document for target architecture. No code changes in this PR. Astronomy/Dasha/Varga/transit calculations unchanged.

## 1. Purpose

This contract defines the migration path from the current dual-product/legacy Career reasoning state to a single canonical Career pipeline (C4–C11). It establishes:

- The current transitional state with two parallel production paths
- The target canonical architecture with clear authority boundaries
- Migration invariants that preserve correctness during transition
- Convergence steps to integrate Product B components into the authoritative production path
- Validation criteria for cutover to the target architecture

## 2. Current Dual-Product / Transitional State

### 2.1 Current Production Authority

The current production Career result is produced by `interpretCareerV2` in `src/domain/career/CareerDomainInterpreterV2.ts`. This interpreter executes a hybrid transitional path that consumes components from both Product A (legacy) and Product B (canonical) at different integration levels.

### 2.2 Product A

Product A is the legacy production Career reasoning path. It provides the foundational Career semantic source that currently drives production results.

```
Legacy Career semantic source
        ↓
ThemeInterpretation
        ↓
CareerEvidenceMapper
        ↓
CW-01 structural/domain hierarchy
        │
        ├───────────────┐
        ▼               ▼
   Career Dasha     Career Timing
        │
        ▼
  Career Manifestation
        │
        ▼
 Legacy CW-05 Final Synthesis
```

Product A components are documented in the C1 freeze document (`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`).

### 2.3 Product B

Product B is the canonical Career reasoning pipeline comprising modules C4–C11. It produces the canonical Career structural interpretation and evidence used to derive the natal Career promise.

Product B modules:
- C4: `careerStructuralReasoning` — canonical Career structure
- C5: `careerPlanetaryRelevance` — planetary relevance scoring
- C6: `careerPlanetaryCondition` — planetary condition evaluation
- C7: `interpretCareerLordRelationship` — lord relationship interpretation
- C8: `careerExpression` — Career expression modes
- C9: `careerDashaActivation` — Dasha activation synthesis
- C10: `careerD10Qualification` — D10 qualification synthesis
- C11: `careerFinalSynthesis` — final Career synthesis

Note: C9 (Dasha) and C10 (D10) are NOT themselves natal Career promise. They operate as activation and qualification layers on top of the natal Career foundation produced by C4–C8. The layering is: Natal foundation → Career promise → Expression/qualification → Activation → Timing → Final synthesis.

### 2.4 Current Integration Boundary

Product B components exist at different levels of integration. The Career Dasha synthesis, Career timing synthesis, Career manifestation synthesis, and the legacy CW-05 final synthesis are already consumed by `interpretCareerV2`. However, the complete C4–C11 canonical reasoning pipeline does not currently control the production Career result.

Specifically:
- `interpretCareerV2` calls `buildCareerDashaSynthesis(...)` (line ~300)
- `interpretCareerV2` calls `synthesizeCareerTransit(...)` (line ~308)
- `interpretCareerV2` calls `synthesizeCareerTiming(...)` (line ~309)
- `interpretCareerV2` calls manifestation synthesis
- `interpretCareerV2` calls legacy CW-05 final synthesis (`synthesizeCareerFinal`)

The pure C4–C11 canonical semantic modules (`careerStructuralReasoning`, `careerPlanetaryRelevance`/`interpretCareerPlanetaryRelevance`, `careerPlanetaryCondition`, `interpretCareerLordRelationship`, `careerExpression`, C9 `careerDashaActivation`, C10 `careerD10Qualification`, C11 `careerFinalSynthesis`) are NOT imported/called by the interpreter.

## 3. Target Architecture

### 3.1 Canonical Career Pipeline

The target architecture uses a single canonical pipeline from C4 through C11:

```
Canonical Career Structural Evidence
             ↓
        C4 Structure
             ↓
    C5/C6 Planetary Semantics
             ↓
        C8 Expression
             ↓
    ┌────────┴────────┐
    ▼                 ▼
   C10               C9
   D10              Dasha
    │                 │
    └────────┬────────┘
             ▼
          Timing
             ↓
       C11 Final
             ↓
       DomainEvidence
             ↓
     Career Interpretation
```

### 3.2 Authority Boundaries

The canonical pipeline establishes clear authority boundaries:
- C4–C8: Authoritative producer of natal Career structural evidence and promise
- C9: Authoritative producer of Dasha activation insights
- C10: Authoritative producer of D10 qualification insights
- C11: Authoritative producer of final Career synthesis
- DomainEvidence: Canonical evidence envelope for all Career evidence

### 3.3 DomainEvidence Boundary

DomainEvidence remains the canonical Career evidence envelope. All Career evidence from C4–C11 must flow through DomainEvidence with proper identityKey and sourceIds deduplication per the canonical evidence dedup contract.

### 3.4 Dasha Boundary

Dasha (C9) is an activation layer, not a natal Career promise engine. Dasha identifies WHEN and HOW the natal Career promise activates, but does not independently establish Career promise. The target architecture must preserve this boundary to prevent Dasha from being treated as a parallel Career-promise source.

### 3.5 D10 Boundary

D10 (C10) is a qualification/confirmation layer, not a natal Career promise engine. D10 qualifies and confirms Career potential from the natal foundation, but does not independently establish Career promise. The target architecture must preserve this boundary to prevent D10 from being treated as a parallel Career-promise source.

### 3.6 Timing Boundary

Transit timing is a timing layer, not a natal Career promise engine. Transit identifies WHEN Career themes manifest, but does not independently establish Career promise. The target architecture must preserve this boundary to prevent transit from being treated as a parallel Career-promise source.

## 4. Migration Invariants

### 4.1 Preserved C1 Invariants

The following C1 invariants remain in force during migration:
- DomainEvidence remains the canonical Career evidence envelope
- Career evidence mapping remains the boundary between engine evidence and domain reasoning
- Career reasoning must not recalculate natal astrology
- D10 cannot establish Career promise independently
- Dasha cannot establish natal Career promise independently
- Transit cannot establish natal Career promise independently
- Missing evidence is not negative evidence
- Existing Career rule IDs must not silently change
- Existing manifestation modes must not silently change

### 4.2 Superseded C1 Invariant #2

C1 Invariant #2 ("ThemeInterpretation remains the authoritative producer of existing Career evidence") is superseded by this convergence contract for the target architecture. It remains the accurate description of the current legacy production producer, but the canonical C4–C11 pipeline will become the authoritative producer for the target architecture.

### 4.3 No Hybrid Authority

During migration, Product A and Product B may be executed side-by-side for comparison/parity, but their conclusions must not be silently combined into a third undocumented hybrid Career conclusion.

Permitted shape:
```
Product A ────────┐
                  ├──→ Comparison / parity
Product B ────────┘
```

Forbidden shape:
```
Product A ────────┐
                  ├──→ Undocumented hybrid conclusion
Product B ────────┘
```

All authoritative Career conclusions must come from a single, documented source at any point in time.

### 4.4 No Double Counting

Migration must respect the existing canonical evidence dedup contract (identityKey vs sourceIds). The same Career evidence must not be counted multiple times across Product A and Product B components. When C4–C11 become authoritative, legacy Product A evidence must be properly deduplicated or excluded to prevent double-counting.

## 5. Convergence Steps

### 5.1 Structural integration

Integrate C4 `careerStructuralReasoning` as the authoritative producer of Career structural evidence. Establish the flow from C4 to DomainEvidence, replacing the legacy CW-01 structural hierarchy source.

### 5.2 Planetary integration

Integrate C5 `careerPlanetaryRelevance` and C6 `careerPlanetaryCondition` as the authoritative producers of planetary semantics. Establish the flow from C5/C6 to DomainEvidence, replacing legacy planetary relevance sources.

### 5.3 Expression integration

Integrate C8 `careerExpression` as the authoritative producer of Career expression modes. Establish the flow from C8 to DomainEvidence, replacing legacy manifestation mappings.

### 5.4 Dasha integration

Elevate C9 `careerDashaActivation` to authoritative status for Dasha activation insights. The Career Dasha synthesis is already consumed by `interpretCareerV2`; this step ensures C9 controls the production result rather than being a secondary input.

### 5.5 D10 integration

Elevate C10 `careerD10Qualification` to authoritative status for D10 qualification insights. Ensure C10 controls the production result rather than being a secondary confirmation layer.

### 5.6 C11 integration

Integrate C11 `careerFinalSynthesis` as the authoritative final Career synthesis. Replace the legacy CW-05 final synthesis with C11 as the final decision point.

### 5.7 Legacy demotion

Demote the legacy CW-05 final synthesis to an internal compatibility layer. It may be retained temporarily for parity comparison or fallback, but must not remain as a second authoritative engine. The authoritative production result must come from C11.

Note: The conceptual sequence above (C4→C5→C6→…→C11) is presented for clarity, but the migration contract must not prescribe a false implementation order. The real dependencies form a graph:

```
                 Career Structure
                 /      |       \
                ↓       ↓        ↓
           Relevance  Expression D10
                ↓        ↑        ↑
             Condition ──┘        │
                                  │
               Dasha ─────────────┘
                  │
                  ▼
               Timing
                  │
                  ▼
                 C11
```

Migration must respect these actual dependencies rather than imposing a strict linear chain.

## 6. Validation / Cutover Criteria

Cutover to the target architecture is validated when:
- C4–C11 are all imported and called by `interpretCareerV2`
- The canonical C4–C11 pipeline controls the production Career result
- Legacy Product A components are demoted to non-authoritative status or removed
- DomainEvidence contains only canonical evidence from C4–C11 with proper deduplication
- All migration invariants are satisfied (no hybrid authority, no double-counting)
- Boundary conditions are preserved (Dasha/D10/Timing as layers, not promise engines)
- Test coverage validates parity with legacy results where appropriate
- Production Career behavior matches the target architecture specification

## 7. Explicit Non-Goals

This PR is documentation-only. No code changes are introduced. The following are explicitly out of scope:
- Implementation of the target architecture
- Modification of `interpretCareerV2` or any source code
- Changes to astronomy, Dasha, Varga, or transit calculations
- Changes to test suites or build configuration
- Package dependency changes or `package-lock.json` modifications

The convergence contract is a forward-looking design document. Implementation will occur in subsequent PRs following this contract.

## 8. Final Target State

The final target state is a single canonical Career pipeline (C4–C11) that:
- Produces authoritative Career structural evidence from C4–C8
- Applies Dasha activation insights from C9
- Applies D10 qualification insights from C10
- Synthesizes the final Career result from C11
- Flows all evidence through DomainEvidence with proper deduplication
- Preserves clear boundaries between natal promise, activation, qualification, and timing layers
- Eliminates hybrid authority and double-counting
- Demotes legacy Product A components to non-authoritative status or removes them

This target state provides a clean, maintainable architecture for Career reasoning with single sources of truth for each semantic layer.
