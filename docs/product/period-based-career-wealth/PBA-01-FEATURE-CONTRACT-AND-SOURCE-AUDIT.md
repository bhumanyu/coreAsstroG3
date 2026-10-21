# PBA-01: Period-Based Career & Wealth Analysis - Feature Contract and Source Audit

**Baseline Commit:** `f8f345294a7e4d0f8598cf1756685dd7b48d337e` (verified with `git rev-parse HEAD`)

**Status:** IMPLEMENTED — ACCEPTANCE HARDENING IN PROGRESS (PR sequence PR-A through PR-G)

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

**Status:** ✅ Resolved
- `mapCanonicalCareerEvidence()` maps all C4-C10 evidence without temporal scoping (confirmed)
- Dasha evidence includes `level` field (MAHADASHA/ANTARDASHA/PRATYANTARDASHA) but not period boundaries (confirmed)
- **Resolution:** Post-mapper filtering is sufficient. The selected-period activation layer (`selectedCareerDashaActivation.ts`) uses the canonical Dasha analysis from the full timeline and filters evidence by:
  - Level (MD/AD) via `level` field
  - Planet linkage via semantic association to selected MD/AD planets
  - Qualification status via canonical qualificationStatus
- No period-filtered mapper is needed. The canonical mapper's output is a superset that can be filtered downstream without violating the single-computation invariant.

### 5.2 Dasha Interpretation for Arbitrary Periods

**Question:** Does the Dasha interpretation engine already compute evidence for arbitrary past/future periods, or does it only compute for the current period?

**Status:** ✅ Resolved
- `DashaInterpretationReport` includes `mahadashas: readonly DashaMahadashaInterpretation[]` (full timeline)
- Each `DashaMahadashaInterpretation` includes nested `antardashas` and `pratyantardashas`
- Each period includes `evidence: readonly DashaInterpretationEvidence[]`
- **Conclusion:** Sufficient evidence exists for arbitrary period selection. PBA-02 can query the full timeline by planet and level.

### 5.3 AI Context Factory Extension

**Question:** What changes are required in `aiContextFactory.ts` to consume selected-period state?

**Status:** ✅ Resolved
- `buildCareerFact()` currently prefers `conclusionData.careerDashaSynthesis` (current period)
- `aiContextFactory.ts` already imports `SynthesisEvidenceReference` and `SynthesisDiagnostic` from `selectedPeriodSynthesis.ts` (line 64-66)
- **Resolution:** The AI context factory will consume `selectedPeriodSynthesis` via the domain synthesis output. The contract is:
  - `selectedPeriodSynthesis.careerActivation` provides selected-period career activation
  - `selectedPeriodSynthesis.wealthActivation` provides selected-period wealth activation
  - Evidence IDs are projected from `selectedPeriodSynthesis.evidence` which contains `SynthesisEvidenceReference[]`
  - Traceability is preserved via `SynthesisEvidenceReference.classification` and `polarity` fields
- No conditional logic needed in `buildCareerFact()`—the synthesis layer determines whether to use canonical or selected-period activation, and the AI context factory projects whatever synthesis provides.
- Deferred to PR-F (WP-6) for explicit AI evidence semantics contract definition.

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

### 6.4 PBA-05: Selected-Period Synthesis

**Description:** Orchestrate career and wealth selected-period activations into a unified synthesis result.

**Dependencies:**
- PBA-03 implementation
- PBA-04 implementation
- PR-E (WP-4) partial synthesis orchestration

### 6.5 PBA-06: Selected-Period Product Service

**Description:** Product-layer service for selected-period analysis, coordinating context resolution, domain activations, and synthesis.

**Dependencies:**
- PBA-05 implementation
- Partial synthesis contract (PR-E)

### 6.6 PBA-07: Selected-Period Report UI

**Description:** UI component to render selected-period analysis results.

**Dependencies:**
- PBA-06 implementation
- MISSING domain rendering (PR-E)

### 6.7 PBA-08: AI Evidence Semantics

**Description:** Define and enforce AI evidence parity and labeling contract. Ensure AI cannot invent or reinterpret evidence IDs from domain synthesis.

**Dependencies:**
- PBA-05 implementation
- PR-F (WP-6) AI evidence semantics

**Status:** ✅ Contract defined in PR-F (WP-6)

### 6.8 PBA-09: Acceptance Hardening

**Description:** Strengthen acceptance test suite with discriminant assertions, matrix coverage, and CI verification.

**Dependencies:**
- PBA-01 through PBA-08 implementation
- PR-G (WP-6) acceptance hardening

**Status:** ✅ Acceptance hardening defined in PR-G (WP-6)

### 6.9 PBA-10: UI Period Selector

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

## 8. Appendices

### 8.1 Part 1 Investigation: Canonical C11 Qualification Input Trace

This investigation traces why `resolvedMechanisms` is empty for the Jupiter-Ketu chart (CANONICAL_BIRTH_DETAILS), which reproduces `CAREER_QUALIFICATION_UNAVAILABLE` in the selected-period builder.

#### Investigation Methodology

Instrumented the canonical career foundation build to collect intermediate metrics:
- Number of patterns produced
- Number of patternQualifications by status (QUALIFIED/INSUFFICIENT_DATA/UNQUALIFIED)
- Final resolvedMechanisms.length
- Diagnostics for ORCHESTRATION_UNQUALIFIED_PATTERN_MECHANISM_*
- Diagnostics for ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE

Compared outcomes with `enableDispositorContexts: false` (production default) vs `true` (two-pass orchestration).

#### Findings

**1. Pattern Production**

**Status**: Patterns ARE produced for this chart.

- **Patterns count**: 1
- **Pattern qualification status**: INSUFFICIENT_DATA (not UNQUALIFIED)
- **Pattern details**:
  - Pattern ID: `CAREER_PATTERN:CAREER_HOUSE_NETWORK:CAREER_HOUSE_NETWORK:HOUSES:6,8,11:TOPOLOGY:STAR:RELATIONSHIPS:LORD_OF:PLANET:MARS→HOUSE:11|LORD_OF:PLANET:MARS→HOUSE:6`
  - Family: CAREER_HOUSE_NETWORK
  - Level: HOUSE_NETWORK
  - Classification: CAREER_HOUSE_NETWORK
  - Houses: [6, 8, 11]
  - Establishing relationships: LORD_OF:PLANET:MARS→HOUSE:11, LORD_OF:PLANET:MARS→HOUSE:6

**2. Pattern Qualification**

**Status**: Pattern is INSUFFICIENT_DATA, not UNQUALIFIED.

- Total pattern qualifications: 1
- QUALIFIED: 0
- INSUFFICIENT_DATA: 1
- UNQUALIFIED: 0

**Conclusion**: The pattern passed the gating policy in the orchestrator (UNQUALIFIED patterns are skipped, INSUFFICIENT_DATA patterns proceed to mechanism resolution).

**3. Mechanism Resolution**

**Status**: Resolved mechanisms is genuinely empty due to rule coverage gap.

- Resolved mechanisms count: 0
- Unqualified pattern mechanism diagnostics: 0 (no patterns were gated as UNQUALIFIED)

**Root cause**: The pattern does not match any mechanism resolver rules. The resolver currently only supports dusthana transformation patterns:
- RULE_MECHANISM_PATTERN_DUSTHANA_8_10 (requires houses 8 and 10)
- RULE_MECHANISM_PATTERN_DUSTHANA_12_10 (requires houses 12 and 10)
- RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10 (requires houses 8, 12, and 10)

The pattern has houses [6, 8, 11] but lacks house 10, so it does not match any dusthana transformation rules. Consequently, the resolver returns an empty candidate set for this pattern.

**This is a genuine limitation, not a bug**: The pattern is structurally valid (INSUFFICIENT_DATA qualification) but falls outside the current rule coverage (only dusthana transformation patterns are implemented per spec §25).

**4. enableDispositorContexts Flag Impact**

**Status**: Flag does NOT materially change resolvedMechanisms count for this chart.

- Resolved mechanisms (enableDispositorContexts=false): 0
- Resolved mechanisms (enableDispositorContexts=true): 0
- Difference: 0

**Conclusion**: The hard-coded `enableDispositorContexts: false` in CareerDomainInterpreterV2.ts (line 258) does not affect the outcome for this chart. Even with dispositor contexts enabled, the pattern still produces 0 mechanisms because it doesn't match any resolver rules.

**5. Diagnostics**

- ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE: WARNING (expected when flag is false)
- ORCHESTRATION_UNQUALIFIED_PATTERN_MECHANISM_*: 0 (no patterns were gated as UNQUALIFIED)

#### Conclusion

**resolvedMechanisms is genuinely empty for this chart due to a genuine limitation, not an upstream bug.**

The investigation confirms:
1. Patterns are produced (1 pattern with houses [6, 8, 11])
2. Pattern qualification is INSUFFICIENT_DATA (proceeds to mechanism resolution per gating policy)
3. Mechanism resolution produces 0 candidates because the pattern does not match any resolver rules (only dusthana transformation patterns with house 10 are currently implemented)
4. The `enableDispositorContexts: false` flag does not materially change the outcome
5. No upstream dropped-input bug exists - the emptiness is due to rule coverage gap

The `UNAVAILABLE` qualification basis in the selected-period builder is therefore justified for this chart, as canonical candidates are genuinely empty (not a silent proxy fallback).

#### Recommendation

The `UNAVAILABLE` path implemented in commit 746d386 is correct for this chart. The root cause of empty mechanisms is rule coverage (only dusthana transformation patterns implemented), not a data pipeline bug. Future work to expand mechanism rule coverage (e.g., Kendra-Trikona, Parivartana patterns) would address this limitation at the source.

---

## 9. Verification Record

**Baseline Commit:** `f8f345294a7e4d0f8598cf1756685dd7b48d337e` (verified 2026-10-21)

**Verification Steps:**
1. ✅ Confirmed engine computes nested MD → AD → PD timeline with exact boundary semantics
2. ✅ Traced Career C9 activation inputs from temporalState.dashaInterpretation
3. ✅ Verified C11 as lifetime authority for Career (evidenceContinuity.ts, canonicalCareerEvidenceMapper.ts)
4. ✅ Traced Wealth activation inputs and confirmed four independent dimensions
5. ✅ Enumerated ProductDashaState.current consumers (mapper, selectors, viewModel)
6. ✅ Verified product → AI handoff prefers conclusionData.*
7. ✅ Confirmed Dasha interpretation output contains sufficient evidence for arbitrary period selection
8. ✅ Resolved open audit question §5.1 (evidence period filtering → post-mapper filtering sufficient)
9. ✅ Resolved open audit question §5.3 (AI context factory extension → selectedPeriodSynthesis contract)

**Contract Stabilization (PR-A through PR-G):**
- PR-A (WP-0): Contract and acceptance matrix (docs only)
- PR-B (WP-1): Context guardrails (temporal relation recomputation)
- PR-C (WP-2): Career candidate integrity (adapter fallback diagnostic)
- PR-D (WP-3): Wealth diagnostics (dimension-specific diagnostics)
- PR-E (WP-4): Partial synthesis orchestration (MISSING domain handling)
- PR-F (WP-5): AI evidence semantics (evidence-ID parity, deterministic labeling)
- PR-G (WP-6): Acceptance hardening (discriminant assertions, matrix coverage, CI verification)

**Build Verification:**
- Run `npm run lint` after each PR
- Run `npm run build` after each PR
- Run `npm run verify` after PR-G completion
- Run `npm run verify:pba10` after PR-G completion

**Remote CI:**
- CI run at `.github/workflows/ci.yml` will verify each PR
- Update acceptance matrix with CI results after PR-G completion

---

**Document Version:** 1.0
**Last Updated:** 2026-10-17
**Author:** Devin (automated audit)
