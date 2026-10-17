# PBA-01: Period-Based Career & Wealth Analysis - Feature Contract and Source Audit

**Baseline Commit:** `1462861c54f64215f647c2568d407796f041fb94` (verified with `git rev-parse HEAD`)

**Status:** IMPLEMENTED — VERIFICATION PENDING (awaiting remote CI at `.github/workflows/ci.yml`)

---

## Executive Summary

This document audits the codebase to prepare for period-based Career and Wealth analysis (PBA-01). It establishes the feature contract, verifies the source map, defines integration boundaries, and identifies downstream dependencies.

**Key Finding:** The engine already computes a complete nested MD → AD → PD Vimshottari timeline with exact boundary semantics. Dasha interpretation output contains sufficient evidence to select arbitrary past/future MD–AD intervals. C11 (`conclusionData`) is confirmed as the lifetime authority for Career, and Wealth preserves four independent dimensions (accumulation, gains, fortune, speculation).

---

## 1. Feature Contract

### 1.1 Selected MD–AD Period Analysis

**Scope:** Support user selection of a specific Mahadasha (MD) and Antardasha (AD) combination for analysis across three temporal contexts:

1. **Past Periods:** Historical MD–AD intervals already completed
2. **Current Period:** The active MD–AD (as of `asOf` date)
3. **Future Periods:** Upcoming MD–AD intervals not yet entered

**Invariants:**
- Single-computation invariant: The full Vimshottari timeline is computed once at birth; period selection is a projection, not recomputation
- Temporal boundary semantics are preserved from the canonical engine (exact tiling, no gaps, no overlaps)
- Period selection does not alter the underlying timeline computation

### 1.2 Domain Authority Boundaries

**Career:**
- C11 (`conclusionData`) remains the lifetime authority for Career synthesis
- Period-specific analysis projects temporal-state Dasha interpretation without altering C11
- C9 activation inputs feed from canonical Dasha interpretation, not from selected-period state

**Wealth:**
- Wealth preserves four independent dimensions:
  - **Accumulation** (2H/2L focus)
  - **Gains** (11H/11L focus)
  - **Fortune** (9H/9L + D2 focus)
  - **Speculation** (risk/uncertainty domain)
- Each dimension is computed independently and preserved across period selections
- No cross-dimension bleed or aggregation at the dimension level

### 1.3 Single-Computation Invariant

**Constraint:** The full Vimshottari timeline (120 years) is computed once at birth via `calculateVimshottari()`. Period selection is a read-only projection:

- **Birth → MD Timeline:** Computed once in `src/engine/dasha/vimshottari.ts`
- **MD → AD → PD Expansion:** Computed hierarchically in the same pass
- **Period Selection:** A resolver (PBA-02) will project from the precomputed timeline
- **No Recomputation:** Selecting a past/future period does not trigger new timeline computation

---

## 2. Verified Source Map

### 2.1 Nested Dasha Timeline Engine

**File:** `src/engine/dasha/vimshottari.ts`

**Hierarchy:**
```
VimshottariTimeline
└── mahadashas: MahadashaPeriod[]
    └── antardashas: AntardashaPeriod[]
        └── pratyantardashas: PratyantardashaPeriod[]
```

**Key Functions:**
- `calculateVimshottari(input: VimshottariInput): VimshottariTimeline` (line 246)
  - Computes full 120-year timeline from birth anchor
  - Accepts optional `until` horizon for truncation
  - Returns nested structure with all MD → AD → PD periods

- `getActiveDasha(timeline: VimshottariTimeline, at: string | Date): ActiveDashaState | null` (line 361)
  - Returns the active MD/AD/PD at a specific timestamp
  - Uses `[start, end)` interval semantics (inclusive start, exclusive end)

**Boundary Semantics:**
- Last period in each level is forced to match parent end exactly:
  - PD last end matches AD end (line 171)
  - AD last end matches MD end (line 217)
  - MD last end matches `until` horizon or 120-year default (line 328)
- 1 Vimshottari year = 365.25 days (line 18) — materially affects MD/AD/PD boundaries
- Exact tiling: No gaps or overlaps in the timeline

**Open Audit Question:** Verified ✅ — The nested timeline contains sufficient information to select arbitrary MD–AD intervals. Each period has `start` and `end` ISO timestamps, enabling range queries for past/current/future periods.

### 2.2 Career C9 Activation Inputs

**Files:**
- `src/domain/career/CareerDomainInterpreterV2.ts`
- `src/domain/career/evidenceContinuity.ts`
- `src/domain/career/canonicalCareerEvidenceMapper.ts`

**Input Flow:**
```
temporalState.dashaInterpretation
  ↓
buildCareerDashaAnalysis() (line 310)
  ↓
canonicalDashaAnalysis
  ↓
C9 Dasha Activation Evidence
```

**Mechanism Candidates:**
- `careerMechanismCandidates` extracted from `canonicalCareerFoundation.resolvedMechanisms` (lines 272-274)
- Used by mechanism-based expression resolver (P2-08A) via `defaultCareerExpressionResolver.resolve()` (line 293)
- Results adapted to legacy format for C9/C10/C11 consumption (line 301)

**C11 Authority:**
- `conclusionData` (CareerFinalSynthesisResult) is the lifetime authority
- Preliminary C11 built without timing for canonical evidence mapper validation (line 360)
- Final C11 recomputed with timing synthesis (after `careerTimingSynthesis`)
- Evidence continuity validator (`evidenceContinuity.ts`) validates canonical evidence against C11 references
- Canonical mapper (`canonicalCareerEvidenceMapper.ts`) uses C11 only for reference validation, never as evidence source

**Evidence Continuity (Gate D):**
- `validateEvidenceContinuity()` enforces identity/provenance/reference/counting continuity
- 12 issue codes including `CONTRADICTORY_DASHA_EVIDENCE` (C9 contract violation)
- C11 references must be present in canonical evidence (MISSING_REQUIRED_REFERENCE)
- Namespace mismatch detection (colon vs underscore delimiters)

### 2.3 Wealth Activation Inputs

**File:** `src/domain/wealth/WealthDomainInterpreterV2.ts`

**Input Flow:**
```
temporalState.dashaInterpretation
  ↓
activeDashaReport (line 249)
  ↓
mdPlanet / adPlanet / pdPlanet (lines 252-254)
  ↓
evaluateWealthPeriodTimingActivation() for MD/AD/PD (lines 256-276)
  ↓
periodTimingActivations (line 278)
  ↓
CW-01 Reasoning Hierarchy (line 285)
  ↓
conclusionData (line 348)
```

**Dimension Preservation:**
Four independent dimensions computed at lines 311-314:
- `accumulationStatus` (ACCUMULATION)
- `gainsStatus` (GAINS)
- `fortuneStatus` (FORTUNE)
- `speculationStatus` (SPECULATION)

Each dimension has:
- Independent status (STRONGLY_SUPPORTED / SUPPORTED / CHALLENGED)
- Independent supporting/challenging evidence IDs
- Independent dasha effect (ACTIVATES / CHALLENGES / PARTIALLY_ACTIVATES)
- Preserved in `conclusionData.dimensions` (line 350)

**Counter-Reasoning Entry Points:**
- `src/domain/careerWealth/counterReasoning/counterReasoningEngine.ts`
- Validates claims against final synthesis (C11 authority)
- Dasha challenge questions target `DASHA_ACTIVATION` subject key
- Evidence resolver references reasoning trace graph

### 2.4 ProductDashaState.current Consumers

**File:** `src/product/analysis/productAnalysisTypes.ts`

**Type Definition (lines 254-262):**
```typescript
export interface ProductDashaState {
  readonly current: {
    readonly mahadasha?: ProductDashaPeriod;
    readonly antardasha?: ProductDashaPeriod;
    readonly pratyantardasha?: ProductDashaPeriod;
  };
  readonly asOf?: string;
  readonly summary?: string;
}
```

**Consumers:**

1. **`src/product/analysis/productAnalysisMapper.ts`**
   - `mapDashaState()` (lines 570-600)
   - Reads from `analysis.dasha.current` to build ProductDashaState
   - Falls back to career/wealth activation periods if `analysis.dasha.current` is empty

2. **`src/product/analysis/productAnalysisSelectors.ts`**
   - `selectDashaHierarchy()` (lines 183-206)
   - Returns `analysis.dasha.current` periods when no domain is specified
   - Falls back to domain-specific periods from `analysis.career/wealth.activation.dasha.periods`

3. **`src/product/analysis/careerViewModel.ts`**
   - Line 242: `currentActivation: career.activation.dasha.currentActivation`
   - This is a different field (activation string), not the nested `ProductDashaState.current`

**Constraint:** Any future selected-period resolver (PBA-02) must not overwrite `ProductDashaState.current`. Selected period state should be a separate field (e.g., `ProductDashaState.selected`).

### 2.5 Product → AI Handoff

**Files:**
- `src/ai/context/aiContextFactory.ts`
- `src/product/analysis/productAnalysisMapper.ts`
- `src/product/analysis/productAnalysisTypes.ts`
- `src/product/analysis/careerViewModel.ts`

**AI Context Factory (`aiContextFactory.ts`):**
- `buildCareerFact()` (line 573) prefers `conclusionData.*`:
  - `careerDashaSynthesis` from `conclusionData.careerDashaSynthesis` (line 584)
  - `careerTimingSynthesis` from `conclusionData.careerTimingSynthesis` (line 727)
  - Falls back to legacy timing activations if conclusionData is unavailable (line 685)
- Evidence IDs mapped to canonical C9 evidence via `mapPeriodToCanonicalEvidenceIds()` (lines 667-671, 706-710)
- Traceability field validates RESOLVED/DEGRADED status per period (lines 676-682, 715-721)

**Product Analysis Mapper (`productAnalysisMapper.ts`):**
- `mapCareer()` (function, exact line not shown in snippet)
- Maps domain interpretation to CareerProductAnalysis
- Currently **does not populate `profession` field** (known gap)
- New DTO fields for period-based analysis must follow the same seam

**Product Analysis Types (`productAnalysisTypes.ts`):**
- `CareerProductAnalysis` interface defines projection contract
- `WealthProductAnalysis` interface defines projection contract
- `ProductDashaState` interface defines Dasha state contract

**Career ViewModel (`careerViewModel.ts`):**
- Projects CareerProductAnalysis to UI-friendly shape
- Reads `career.activation.dasha.currentActivation` (line 242)
- Should be extended to support selected-period projection (PBA-02)

---

## 3. Integration Boundaries

### 3.1 Temporal-State Dasha Interpretation Consumption

**Current Flow:**
```
AnalysisTemporalState
  └── dashaInterpretation: DashaInterpretationReport
      └── current: ActiveDashaInterpretation
          ├── mahadasha: DashaMahadashaInterpretation
          ├── antardasha: DashaAntardashaInterpretation
          └── pratyantardasha: DashaPratyantardashaInterpretation
```

**Where It's Consumed Today:**
1. **Career C9:** `buildCareerDashaAnalysis()` receives `dashaInterpretation` from `options.temporalState` (CareerDomainInterpreterV2.ts:314)
2. **Wealth Timing:** `activeDashaReport` from `options.temporalState.dashaInterpretation` (WealthDomainInterpreterV2.ts:249)
3. **AI Context:** `temporalState.dashaInterpretation` used in `buildCareerFact()` and `buildWealthFact()` (aiContextFactory.ts)

**Where PBA-02 Will Plug In:**
- PBA-02 (selected-period resolver) will:
  1. Accept MD/AD selection parameters (e.g., `{ mdPlanet: Planet, adPlanet: Planet, targetDate?: string }`)
  2. Query the precomputed `VimshottariTimeline` for the selected MD–AD interval
  3. Construct a `SelectedPeriodInterpretation` with:
     - Period boundaries (start/end)
     - Relevant Dasha interpretation evidence for that period
     - Domain-specific timing activation for that period
  4. Return selected-period state to the product layer

**Boundary Constraint:**
- PBA-02 must **not** modify `temporalState.dashaInterpretation.current`
- PBA-02 must **not** recompute the Vimshottari timeline
- PBA-02 must project from the existing timeline as a read-only operation

### 3.2 Canonical Evidence Mapping

**Current Mapper:**
- `mapCanonicalCareerEvidence()` (canonicalCareerEvidenceMapper.ts:177)
- Maps C4-C10 outputs to DomainEvidence
- Validates against C11 for reference integrity
- Returns deduplicated evidence with provenance trace

**PBA-02 Extension:**
- Selected-period resolver may need to:
  1. Filter canonical evidence to the selected period's timeframe
  2. Preserve evidence provenance (identityKey, ruleId, sourceIds)
  3. Maintain C11 reference validation (selected period must not contradict C11)
  4. Emit period-specific evidence IDs scoped to the selected MD–AD

**Open Audit Question:** ⚠️ It is not yet determinable whether the canonical evidence mapping infrastructure already supports period-specific filtering. The mapper currently maps all C4-C10 evidence without temporal scoping. PBA-02 may need to extend the mapper with a `periodFilter` parameter.

### 3.3 Product Projection Layer

**Current Projection:**
- `ProductAnalysisMapper.mapCareer()` projects domain interpretation to CareerProductAnalysis
- `ProductAnalysisMapper.mapWealth()` projects domain interpretation to WealthProductAnalysis
- `ProductDashaState.current` is populated from domain activation periods

**PBA-02 Extension:**
- Add `ProductDashaState.selected` field:
  ```typescript
  export interface ProductDashaState {
    readonly current: { /* existing */ };
    readonly selected?: {
      readonly mahadasha?: ProductDashaPeriod;
      readonly antardasha?: ProductDashaPeriod;
      readonly asOf?: string;
      readonly selectionContext?: {
        readonly mdPlanet: Planet;
        readonly adPlanet: Planet;
        readonly isPast: boolean;
        readonly isFuture: boolean;
      };
    };
  }
  ```
- Extend `ProductAnalysisMapper` to populate `selected` when period selection is active
- Add `selectSelectedDasha()` selector in `productAnalysisSelectors.ts`

---

## 4. Acceptance Criteria

### 4.1 Period Selection ACs

- [ ] AC1: User can select a past MD–AD period (e.g., "Saturn MD, Venus AD, 2010-2015")
- [ ] AC2: User can select the current MD–AD period (default view)
- [ ] AC3: User can select a future MD–AD period (e.g., "Jupiter MD, Mars AD, 2030-2032")
- [ ] AC4: Selected period boundaries match canonical Vimshottari timeline exactly
- [ ] AC5: Selecting a period does not trigger timeline recomputation

### 4.2 Domain Authority ACs

- [ ] AC6: Career C11 (`conclusionData`) remains unchanged when period is selected
- [ ] AC7: Career C9 activation for selected period is a projection, not a replacement
- [ ] AC8: Wealth four dimensions (accumulation, gains, fortune, speculation) are preserved independently for selected period
- [ ] AC9: Wealth dimension statuses for selected period do not bleed into other dimensions

### 4.3 Product State ACs

- [ ] AC10: `ProductDashaState.current` is never overwritten by selected period
- [ ] AC11: `ProductDashaState.selected` is populated when period selection is active
- [ ] AC12: `ProductDashaState.selected` includes selection context (isPast/isFuture flags)
- [ ] AC13: AI context factory can consume selected-period state when available

### 4.4 Evidence ACs

- [ ] AC14: Selected-period evidence preserves identityKey, ruleId, sourceIds
- [ ] AC15: Selected-period evidence does not contradict C11 references
- [ ] AC16: Period-specific evidence IDs are scoped to selected MD–AD (e.g., `CAREER_DASHA_MD_SATURN_AD_VENUS`)

---

## 5. Open Audit Questions

### 5.1 Evidence Period Filtering

**Question:** Does the canonical evidence mapping infrastructure already support period-specific filtering, or must PBA-02 extend it?

**Status:** ⚠️ Not determinable from current audit
- `mapCanonicalCareerEvidence()` currently maps all C4-C10 evidence without temporal scoping
- Dasha evidence includes `level` field (MAHADASHA/ANTARDASHA/PRATYANTARDASHA) but not period boundaries
- PBA-02 may need to add a `periodFilter` parameter to the mapper
- Alternatively, PBA-02 may need to implement a separate period-specific evidence mapper

**Resolution Required:** Before PBA-02 implementation, investigate whether:
- Existing Dasha evidence types include sufficient temporal metadata for filtering
- A period-filtered mapper is needed, or post-mapper filtering is sufficient

### 5.2 Dasha Interpretation for Arbitrary Periods

**Question:** Does the Dasha interpretation engine already compute evidence for arbitrary past/future periods, or does it only compute for the current period?

**Status:** ✅ Resolved
- `DashaInterpretationReport` includes `mahadashas: readonly DashaMahadashaInterpretation[]` (full timeline)
- Each `DashaMahadashaInterpretation` includes nested `antardashas` and `pratyantardashas`
- Each period includes `evidence: readonly DashaInterpretationEvidence[]`
- **Conclusion:** Sufficient evidence exists for arbitrary period selection. PBA-02 can query the full timeline by planet and level.

### 5.3 AI Context Factory Extension

**Question:** What changes are required in `aiContextFactory.ts` to consume selected-period state?

**Status:** ⚠️ Not fully specified
- `buildCareerFact()` currently prefers `conclusionData.careerDashaSynthesis` (current period)
- May need to add `selectedPeriodSynthesis` parameter to `buildCareerFact()`
- May need to add conditional logic to use selected-period evidence when available
- Traceability field validation logic may need extension for selected periods

**Resolution Required:** Define AI context contract for selected periods before PBA-02 implementation.

---

## 6. Downstream PR Dependencies

### 6.1 PBA-02: Selected-Period Resolver

**Description:** Implement the resolver that:
- Accepts MD/AD selection parameters
- Queries the precomputed Vimshottari timeline
- Constructs `SelectedPeriodInterpretation`
- Returns selected-period state to product layer

**Dependencies:**
- This audit (PBA-01) must be approved
- `ProductDashaState.selected` type must be added to `productAnalysisTypes.ts`
- `productAnalysisMapper.ts` must be extended to populate `selected`
- `productAnalysisSelectors.ts` must be extended with `selectSelectedDasha()`

### 6.2 PBA-03: Period-Specific Evidence Mapper

**Description:** (If required per Open Audit Question 5.1) Extend canonical evidence mapper with period filtering.

**Dependencies:**
- PBA-02 implementation
- Resolution of Open Audit Question 5.1

### 6.3 PBA-04: AI Context Factory Extension

**Description:** Extend `aiContextFactory.ts` to consume selected-period state and project it to AI context.

**Dependencies:**
- PBA-02 implementation
- Resolution of Open Audit Question 5.3

### 6.4 PBA-05: UI Period Selector

**Description:** Add UI component for period selection (past/current/future MD–AD dropdowns).

**Dependencies:**
- PBA-02 implementation
- Product projection layer changes (PBA-02)

---

## 7. Suggested PR Description

```
docs: PBA-01 feature contract and source audit for period-based Career & Wealth analysis

This PR adds documentation for the upcoming period-based Career & Wealth analysis feature (PBA-01).

Changes:
- Add `docs/product/period-based-career-wealth/PBA-01-FEATURE-CONTRACT-AND-SOURCE-AUDIT.md`
- Document feature contract for selected MD–AD period analysis (past/current/future)
- Verify source map:
  - Nested Dasha timeline engine (MD → AD → PD hierarchy with exact boundary semantics)
  - Career C9 activation inputs (canonicalDashaAnalysis, careerMechanismCandidates, C11 authority)
  - Wealth activation inputs (period timing for four independent dimensions)
  - ProductDashaState.current consumers (mapper, selectors, viewModel)
  - Product → AI handoff (aiContextFactory prefers conclusionData.*)
- Define integration boundaries for PBA-02 (selected-period resolver)
- Specify acceptance criteria for period selection, domain authority, product state, and evidence
- Identify open audit questions (evidence period filtering, AI context extension)
- List downstream PR dependencies (PBA-02 through PBA-05)

No code changes. Documentation-only PR.

Verification:
- npm run lint: PASS
- npm run build: PASS
- No test changes expected
```

---

## 8. Verification Record

**Baseline Commit:** `1462861c54f64215f647c2568d407796f041fb94` (verified 2026-10-17)

**Verification Steps:**
1. ✅ Confirmed engine computes nested MD → AD → PD timeline with exact boundary semantics
2. ✅ Traced Career C9 activation inputs from temporalState.dashaInterpretation
3. ✅ Verified C11 as lifetime authority for Career (evidenceContinuity.ts, canonicalCareerEvidenceMapper.ts)
4. ✅ Traced Wealth activation inputs and confirmed four independent dimensions
5. ✅ Enumerated ProductDashaState.current consumers (mapper, selectors, viewModel)
6. ✅ Verified product → AI handoff prefers conclusionData.*
7. ✅ Confirmed Dasha interpretation output contains sufficient evidence for arbitrary period selection

**Build Verification:**
- Run `npm run lint` after commit
- Run `npm run build` after commit
- No test changes expected

**Remote CI:**
- Await CI run at `.github/workflows/ci.yml`
- Update status from "VERIFICATION PENDING" to "VERIFIED" upon CI success

---

**Document Version:** 1.0
**Last Updated:** 2026-10-17
**Author:** Devin (automated audit)
