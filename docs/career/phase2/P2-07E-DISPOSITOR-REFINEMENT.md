# P2-07E: Career Mechanism Dispositor Refinement

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

This module implements dispositor-based refinement of career mechanism candidates. It consumes the existing careerDispositor engine to refine mechanism types based on terminal planet analysis.

## Key Design Decisions

### 1. Outcome Mapping Table

The engine's `CareerDispositorTermination` enum is mapped to the normalized `CareerDispositorChain.outcome` as follows:

| Engine Termination | Normalized Outcome | Notes |
|-------------------|-------------------|-------|
| `CAREER_TERMINAL` | `TERMINAL` | Terminal planet is career-relevant |
| `NON_CAREER_TERMINAL` | `TERMINAL` | Terminal planet exists (not career-relevant) |
| `SELF_DISPOSITOR` | `SELF_DISPOSITOR` | Planet is its own dispositor |
| `CYCLE` | `CYCLE` | Cycle detected (no terminal) |
| `MUTUAL_RECEPTION` | `MUTUAL_RECEPTION` | Mutual reception detected |
| `UNAVAILABLE` | `INSUFFICIENT_DATA` | No terminal planet (missing data) |
| Depth limit | `DEPTH_LIMIT` | Chain exhausted at MAX_DISPOSITOR_DEPTH |

The mapping is implemented in `mapTerminationToOutcome` in `careerMechanismDispositorAdapter.ts`.

### 2. Cycle → UNCHANGED Invariant

Per spec §13, cycles (CYCLE or MUTUAL_RECEPTION) must never be treated as terminal. The refiner's Step 3 filters contexts with:

```typescript
const terminalContexts = usableContexts.filter(context => {
  return context.outcome !== 'CYCLE' && context.outcome !== 'MUTUAL_RECEPTION';
});
```

This ensures that:
- CYCLE contexts → UNCHANGED status, zero mechanisms
- MUTUAL_RECEPTION contexts → UNCHANGED status, zero mechanisms
- No terminal is invented for cycles

### 3. Evidence vs Relationship Field Separation

Evidence IDs are NOT placed in `relationshipIds`. Instead:

- `sourceEvidenceIds` are carried in the `explanation` field of DISPOSITOR evidence
- `relationshipIds` is left empty for DISPOSITOR evidence (only contains actual relationship edge IDs)
- The invariant is enforced by a regression test in the test suite

This separation ensures that:
- `relationshipIds` only contains edge IDs (e.g., from the CareerAstroGraph)
- Evidence IDs are tracked in `evidenceIds` in provenance
- Source evidence provenance is preserved in the explanation for traceability

### 4. Boundary Enforcement

The module enforces strict boundary rules (per spec §18) via `assertValidDispositorRefinementSource`:

**Forbidden sources:**
- `D10`
- `DASHA`
- `TRANSIT`
- `TIMING`
- `FINAL_SYNTHESIS`
- `AI`

**Allowed sources:**
- `PATTERN`
- `DISPOSITOR`

The firewall is enforced in the refiner's `refine()` method by validating all evidence sources before processing.

### 5. Participant Role Preservation

The `CareerMechanismDispositorRefinementInput` includes optional fields for participant roles:

```typescript
readonly coreParticipants?: readonly string[];
readonly supportingParticipants?: readonly string[];
readonly challengingParticipants?: readonly string[];
```

When provided, these override the default "all-as-core" behavior. When not provided, the refiner defaults to:
- `coreParticipants`: all participant IDs from the candidate
- `supportingParticipants`: empty array
- `challengingParticipants`: empty array

### 6. Participant ID Normalization

All participant IDs use the canonical `PLANET:{Planet}` format (matching `createParticipantId` in `careerParticipantRoles`). This is enforced in:
- `extractParticipantPlanets` in the adapter
- `extractSourceEvidenceIds` in the adapter

## Context Structure

The `CareerDispositorContext` now includes:

```typescript
export interface CareerDispositorContext {
  readonly startPlanetId: Planet;
  readonly chain: readonly Planet[];
  readonly terminalPlanetId?: Planet;
  readonly outcome:
    | 'TERMINAL'
    | 'SELF_DISPOSITOR'
    | 'CYCLE'
    | 'MUTUAL_RECEPTION'
    | 'DEPTH_LIMIT'
    | 'INSUFFICIENT_DATA';
  readonly chainId: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly relevantHouseIds: readonly number[];
  readonly sufficientData: boolean;
}
```

The `outcome`, `terminalPlanetId`, and `chainId` are populated from the resolved `CareerDispositorChain` in `DefaultCareerDispositorContextFactory.create`.

## Test Coverage

The test suite (`careerMechanismDispositorRefiner.test.ts`) includes:

1. **Terminal refinement**: Verifies REFINED status with DISPOSITOR-role evidence
2. **Cycle handling**: Tests that CYCLE and MUTUAL_RECEPTION contexts return UNCHANGED with zero mechanisms
3. **SELF_DISPOSITOR handling**: Preserves SELF_DISPOSITOR in context
4. **sourceEvidenceIds propagation**: Verifies source evidence IDs are carried through
5. **Source firewall**: Tests rejection of D10, DASHA, TRANSIT, TIMING, FINAL_SYNTHESIS, AI sources
6. **Order determinism**: Ensures permuted contexts produce identical results
7. **Type safety**: Validates that no-candidate path is impossible by type
8. **Original candidate preservation**: Verifies original candidate mechanism and evidence are preserved
9. **INSUFFICIENT_DATA handling**: Tests behavior when no usable context exists
10. **Evidence vs relationship separation**: Regression test asserting no evidence ID appears in any `relationshipIds` array
11. **D10-sourced evidence rejection**: Tests that D10-sourced evidence through `refine()` is rejected

## Implementation Notes

- The adapter uses the real `traverseDispositorChain` from `careerDispositor` engine
- `chainId` is built using `buildCareerDispositorChainId` from the engine's identity module
- The termination mapping uses `resolveTermination` from `careerDispositorRules` for consistency
- `DISPOSITOR` is a valid `CareerMechanismPathway` (defined in `careerMechanismTypes.ts`)
