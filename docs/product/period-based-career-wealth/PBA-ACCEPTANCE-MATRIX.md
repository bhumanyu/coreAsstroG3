# PBA Acceptance Matrix

**Baseline Commit:** `f8f345294a7e4d0f8598cf1756685dd7b48d337e`

**Last Updated:** 2026-10-21

**Purpose:** Maps each PBA invariant to implementation files, test files, and CI evidence. Classifies findings as CONFIRMED_DEFECT, NEEDS_PROOF, or DEFERRED.

---

## Matrix Legend

- **Status:**
  - ✅ COMPLETE: Invariant verified with passing tests
  - ⚠️ NEEDS_PROOF: Implementation exists but needs test coverage
  - ❌ CONFIRMED_DEFECT: Invariant violated (requires fix)
  - 🔄 DEFERRED: Out of scope for current PR sequence

- **Evidence:**
  - Implementation file: Source code location
  - Test file: Test coverage location
  - CI evidence: CI workflow verification status

---

## PBA-01: Feature Contract and Source Audit

**Status:** ✅ COMPLETE

**Implementation Files:**
- `docs/product/period-based-career-wealth/PBA-01-FEATURE-CONTRACT-AND-SOURCE-AUDIT.md`

**Test Files:**
- N/A (documentation-only milestone)

**CI Evidence:**
- N/A (documentation-only milestone)

**Findings:**
- None

---

## PBA-02: Selected-Period Resolver

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/core/analysis/selectedMdAdPeriod.ts` (MD-AD period resolution)
- `src/core/analysis/selectedPeriodActivationContext.ts` (context factory)
- `src/core/analysis/temporalInterval.ts` (temporal relation classification)

**Test Files:**
- `src/core/analysis/selectedPeriodActivationContext.test.ts` (context validation)
- `src/core/analysis/selectedMdAdPeriod.test.ts` (period resolution)

**CI Evidence:**
- ✅ npm run verify: PASS (commit f8f3452)

**Findings:**
- None

---

## PBA-03: Selected-Period Context Guardrails

**Status:** ⚠️ NEEDS_PROOF (PR-B WP-1 in progress)

**Implementation Files:**
- `src/core/analysis/selectedPeriodActivationContext.ts` (validateSelectedPeriodContext)

**Test Files:**
- `src/core/analysis/selectedPeriodActivationContext.test.ts` (context validation tests)

**CI Evidence:**
- 🔄 Pending PR-B completion

**Findings:**
- ❌ CONFIRMED_DEFECT: `validateSelectedPeriodContext` does not recompute temporal relation after enum check (lines 295-302)
- ⚠️ NEEDS_PROOF: Missing tests for:
  - start−1ms FUTURE boundary
  - start included (CURRENT at start)
  - end excluded (PAST at end)
  - end−1ms CURRENT
  - malformed date
  - inverted interval
  - valid-but-wrong supplied temporalRelation (e.g., FUTURE on CURRENT interval)

**Remediation:**
- PR-B (WP-1): Add temporal relation recomputation in validateSelectedPeriodContext
- PR-B (WP-1): Add missing context validation tests

---

## PBA-04: Selected-Period Career Activation

**Status:** ⚠️ NEEDS_PROOF (PR-C WP-2 in progress)

**Implementation Files:**
- `src/domain/career/careerDasha/selectedCareerDashaActivation.ts` (buildSelectedCareerDashaActivation)
- `src/domain/career/careerDasha/careerDashaIntegration.ts` (buildSelectedCareerDashaCanonicalAnalysis)

**Test Files:**
- `src/domain/career/careerDasha/selectedCareerDashaActivation.test.ts` (career activation tests)

**CI Evidence:**
- 🔄 Pending PR-C completion

**Findings:**
- ❌ CONFIRMED_DEFECT: Adapter fallback (lines 428-448) collapses multiple QUALIFIED candidates into firstCandidate without diagnostic
- ⚠️ NEEDS_PROOF: Missing tests for:
  - zero mechanism candidates
  - one mechanism candidate
  - multiple mechanism candidates
  - ambiguous caller-expression matches
  - unmatched mechanism candidates
  - assertion that multiple qualified candidates are not silently represented as one
  - assertion that unqualified evidence does not enter exprPlanets/activations under CANONICAL_STATUS

**Remediation:**
- PR-C (WP-2): Decide adapter fallback contract (per-candidate evidence scoping OR diagnostic emission)
- PR-C (WP-2): Add career candidate integrity tests

---

## PBA-05: Selected-Period Wealth Activation

**Status:** ⚠️ NEEDS_PROOF (PR-D WP-3 in progress)

**Implementation Files:**
- `src/domain/wealth/selectedWealthDashaActivation.ts` (evaluateSelectedWealthPeriodActivation)

**Test Files:**
- `src/domain/wealth/selectedWealthDashaActivation.test.ts` (wealth activation tests)

**CI Evidence:**
- 🔄 Pending PR-D completion

**Findings:**
- ⚠️ NEEDS_PROOF: Missing tests for:
  - All four dimensions (ACCUMULATION/GAINS/FORTUNE/SPECULATION) independently
  - Distinguishing diagnostics: no matching rule vs unavailable inputs vs unresolved evidence vs explicit non-activation
  - Dimension mismatch diagnostics
  - Missing house/relationship linkage diagnostics
  - Assertion that dataStatus reflects input/evidence availability only (never activation score)

**Remediation:**
- PR-D (WP-3): Add wealth diagnostics tests for all four dimensions
- PR-D (WP-3): Distinguish diagnostics in implementation

---

## PBA-06: Selected-Period Synthesis

**Status:** ⚠️ NEEDS_PROOF (PR-E WP-4 in progress)

**Implementation Files:**
- `src/domain/synthesis/selectedPeriodSynthesis.ts` (BuildSelectedPeriodSynthesisInput, SynthesisProvenance)
- `src/product/analysis/selectedPeriodProductService.ts` (orchestration)

**Test Files:**
- `src/domain/synthesis/selectedPeriodSynthesis.test.ts` (synthesis tests)

**CI Evidence:**
- 🔄 Pending PR-E completion

**Findings:**
- ⚠️ NEEDS_PROOF: Partial-result contract not yet defined in docs
- ⚠️ NEEDS_PROOF: Domain failure handling not yet implemented (career/wealth MISSING provenance)
- ⚠️ NEEDS_PROOF: qualificationStatus derivation does not handle MISSING domain
- ⚠️ NEEDS_PROOF: SelectedPeriodReport.tsx does not render MISSING domain
- ⚠️ NEEDS_PROOF: Missing tests for:
  - career-fails/wealth-ok produces successful synthesis with explicit provenance
  - wealth-fails/career-ok produces successful synthesis with explicit provenance
  - baselines unchanged for partial synthesis

**Remediation:**
- PR-E (WP-4): Define partial-result contract in docs
- PR-E (WP-4): Implement domain failure handling (career/wealth MISSING provenance)
- PR-E (WP-4): Extend qualificationStatus derivation for MISSING domain
- PR-E (WP-4): Update SelectedPeriodReport.tsx to render MISSING domain
- PR-E (WP-4): Add partial synthesis tests

---

## PBA-07: Selected-Period Product Service

**Status:** ⚠️ NEEDS_PROOF (PR-E WP-4 in progress)

**Implementation Files:**
- `src/product/analysis/selectedPeriodProductService.ts` (orchestration)

**Test Files:**
- `src/product/analysis/selectedPeriodProductService.test.ts` (product service tests)

**CI Evidence:**
- 🔄 Pending PR-E completion

**Findings:**
- Same as PBA-06 (shared orchestration layer)

**Remediation:**
- Same as PBA-06

---

## PBA-08: AI Evidence Semantics

**Status:** ⚠️ NEEDS_PROOF (PR-F WP-5 in progress)

**Implementation Files:**
- `src/ai/product/aiExplanationService.ts` (AI explanation generation)
- `src/ai/context/aiContextFactory.ts` (AI context projection)
- `src/domain/synthesis/selectedPeriodSynthesis.ts` (SynthesisEvidenceReference)

**Test Files:**
- Evidence projection mapper tests (location TBD)
- AI explanation service tests (location TBD)

**CI Evidence:**
- 🔄 Pending PR-F completion

**Findings:**
- ⚠️ NEEDS_PROOF: Contract not yet defined whether supporting/challenging labels must obey deterministic SynthesisEvidenceReference.classification/polarity
- ⚠️ NEEDS_PROOF: Missing tests for:
  - Exact evidence-ID parity across domain synthesis → AI context → returned explanation
  - Unresolved IDs marked, never invented
  - All-unknown evidence handling
  - Zero-classified evidence (must not be described as "balanced")
  - AI failure path leaves deterministic synthesis unchanged
  - Full-field DTO↔AI-context parity on canonical identity/temporal fields

**Remediation:**
- PR-F (WP-5): Define AI evidence label contract (supporting/challenging deterministic)
- PR-F (WP-5): Add AI evidence semantics tests

---

## PBA-09: Acceptance Hardening

**Status:** ⚠️ NEEDS_PROOF (PR-G WP-6 in progress)

**Implementation Files:**
- N/A (test-only milestone)

**Test Files:**
- `src/product/analysis/productAnalysisService.integration.test.ts` (integration tests)
- `src/product/analysis/selectedPeriodProductService.test.ts` (product service tests)
- `src/domain/synthesis/selectedPeriodSynthesis.test.ts` (synthesis tests)

**CI Evidence:**
- 🔄 Pending PR-G completion

**Findings:**
- ❌ CONFIRMED_DEFECT: Temporal past/current/future vs asOf test asserts only toBeDefined() (needs split into three tests with actual values)
- ❌ CONFIRMED_DEFECT: Unresolved-evidence integration test uses invalid selection (tests selection failure, not synthesis)
- ❌ CONFIRMED_DEFECT: Bare toBeDefined() assertions present (need discriminant assertions)
- ⚠️ NEEDS_PROOF: Missing matrix coverage tests:
  - Invalid selection
  - Malformed context
  - Temporal boundaries
  - Partial domains
  - Ambiguous/unresolved references
  - AI failure
- ⚠️ NEEDS_PROOF: npm run verify and npm run verify:pba10 not yet run against release commit

**Remediation:**
- PR-G (WP-6): Split temporal test into three tests with actual values
- PR-G (WP-6): Rewrite unresolved-evidence test to reach synthesis with genuinely unresolved references
- PR-G (WP-6): Remove bare toBeDefined() assertions or add discriminant assertions
- PR-G (WP-6): Add matrix coverage tests
- PR-G (WP-6): Run npm run verify and npm run verify:pba10, record results

---

## PBA-10: UI Period Selector

**Status:** 🔄 DEFERRED (explicitly deferred per PR sequence)

**Implementation Files:**
- N/A (not yet implemented)

**Test Files:**
- N/A (not yet implemented)

**CI Evidence:**
- N/A (not yet implemented)

**Findings:**
- 🔄 DEFERRED: Out of scope for current PR sequence (PR-A through PR-G)

**Remediation:**
- Deferred to future work (beyond PR sequence)

---

## Summary

**Total Milestones:** 10

**Status Breakdown:**
- ✅ COMPLETE: 2 (PBA-01, PBA-02)
- ⚠️ NEEDS_PROOF: 7 (PBA-03 through PBA-09)
- 🔄 DEFERRED: 1 (PBA-10)

**Confirmed Defects:** 4
- PBA-03: validateSelectedPeriodContext does not recompute temporal relation
- PBA-04: Adapter fallback collapses multiple QUALIFIED candidates without diagnostic
- PBA-09: Temporal test asserts only toBeDefined()
- PBA-09: Unresolved-evidence test uses invalid selection
- PBA-09: Bare toBeDefined() assertions present

**Needs Proof:** 20 test coverage gaps across PBA-03 through PBA-09

**PR Sequence Progress:**
- PR-A (WP-0): Contract and acceptance matrix (docs only) — IN PROGRESS
- PR-B (WP-1): Context guardrails — PENDING
- PR-C (WP-2): Career candidate integrity — PENDING
- PR-D (WP-3): Wealth diagnostics — PENDING
- PR-E (WP-4): Partial synthesis orchestration — PENDING
- PR-F (WP-5): AI evidence semantics — PENDING
- PR-G (WP-6): Acceptance hardening — PENDING

---

**Definition of Done:**
Every PBA milestone backed by acceptance evidence; validator recomputes temporal relation; candidate attribution deterministic; domain failure doesn't erase the other domain; AI can't invent or reinterpret evidence; DTO/AI context field parity; zero vacuous assertions in the acceptance suite; green npm run verify recorded against the release commit.
