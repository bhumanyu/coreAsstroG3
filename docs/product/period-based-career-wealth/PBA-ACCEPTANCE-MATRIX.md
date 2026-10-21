# PBA Acceptance Matrix

**Baseline Commit:** `3c83b80a6ca327a44da3f6d4e8cbc31f2479e96b`

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

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/core/analysis/selectedPeriodActivationContext.ts` (validateSelectedPeriodContext with temporal relation recomputation)

**Test Files:**
- `src/core/analysis/selectedPeriodActivationContext.test.ts` (context validation tests including 10 boundary tests)

**CI Evidence:**
- ✅ npm run verify: PASS (commit 3c83b80)
- ✅ npm run verify:pba10: PASS (commit 3c83b80)

**Findings:**
- ✅ Temporal relation recomputation implemented in validateSelectedPeriodContext
- ✅ All 10 boundary tests added: start−1ms FUTURE, start included (CURRENT at start), end excluded (PAST at end), end−1ms CURRENT, malformed date, inverted interval, valid-but-wrong supplied temporalRelation, and additional edge cases

**Remediation:**
- PR-B completed: Temporal relation recomputation and boundary tests added

---

## PBA-04: Selected-Period Career Activation

**Status:** ⚠️ NEEDS_PROOF (partially complete - adapter diagnostic landed in commits 42398f9/22641c1)

**Implementation Files:**
- `src/domain/career/careerDasha/selectedCareerDashaActivation.ts` (buildSelectedCareerDashaActivation)
- `src/domain/career/careerDasha/careerDashaIntegration.ts` (buildSelectedCareerDashaCanonicalAnalysis)

**Test Files:**
- `src/domain/career/careerDasha/selectedCareerDashaActivation.test.ts` (career activation tests)

**CI Evidence:**
- ✅ Adapter dropped-candidate diagnostic landed (commits 42398f9, 22641c1)

**Findings:**
- ✅ Adapter diagnostic implemented for dropped candidates (ADAPTER_DROPPED_CANDIDATES)
- ⚠️ NEEDS_PROOF: Missing tests for:
  - Ambiguous caller-expression match proof
  - Assertion that unqualified evidence does not enter exprPlanets/activations under CANONICAL_STATUS (strengthened test asserting expressionActivations.length === 0)

**Remediation:**
- Partially complete: Adapter diagnostic implemented
- Remaining: Add ambiguous caller-expression match test and unqualified-evidence regression test

---

## PBA-05: Selected-Period Wealth Activation

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/domain/wealth/selectedWealthDashaActivation.ts` (evaluateSelectedWealthPeriodActivation)
- insufficientReason discriminator (NO_PROMISE_EVIDENCE, PROMISE_NOT_LINKED, LINKED)

**Test Files:**
- `src/domain/wealth/selectedWealthDashaActivation.test.ts` (wealth activation tests)

**CI Evidence:**
- ✅ npm run verify: PASS (commit 3c83b80)
- ✅ npm run verify:pba10: PASS (commit 3c83b80)
- ✅ insufficientReason discriminator implemented and tested

**Findings:**
- ✅ insufficientReason discriminator decision recorded: NO_PROMISE_EVIDENCE, PROMISE_NOT_LINKED, LINKED
- ✅ All four dimensions independently tested
- ✅ Distinguishing diagnostics implemented
- ✅ dataStatus reflects input/evidence availability only

**Remediation:**
- PR-D completed: insufficientReason discriminator implemented and tested

---

## PBA-06: Selected-Period Synthesis

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/domain/synthesis/selectedPeriodSynthesis.ts` (BuildSelectedPeriodSynthesisInput, SynthesisProvenance)
- Partial synthesis contract: domain failures degrade (career/wealth MISSING provenance)
- PARTIAL_CAREER_ACTIVATION_FAILED and PARTIAL_WEALTH_ACTIVATION_FAILED diagnostics
- SYNTHESIS_PARTIAL_NO_DOMAINS diagnostic for both-fail case
- errorCode propagation from activation failures to diagnostic messages

**Test Files:**
- `src/domain/synthesis/selectedPeriodSynthesis.test.ts` (synthesis tests including partial synthesis)
- Both-fail synthesis test added (asserts success/partial discriminant, both provenance entries MISSING, SYNTHESIS_PARTIAL_NO_DOMAINS present, both error codes in diagnostics, natal baselines unchanged)
- Both-fail baseline assertion strengthened (frozen baseline objects passed, asserts same references with unchanged flag)

**CI Evidence:**
- ✅ npm run verify: PASS (commit 3c83b80)
- ✅ npm run verify:pba10: PASS (commit 3c83b80)

**Findings:**
- ✅ Partial-result contract defined: domain failures degrade, context failures hard-fail
- ✅ Domain failure handling implemented (career/wealth MISSING provenance)
- ✅ PARTIAL_* diagnostics emitted when one domain fails and the other succeeds
- ✅ SYNTHESIS_PARTIAL_NO_DOMAINS diagnostic emitted when both domains fail
- ✅ errorCode propagated from activation failures to diagnostic messages
- ✅ Baselines unchanged for partial synthesis
- ✅ Tests for career-fails/wealth-ok and wealth-fails/career-ok scenarios
- ✅ Both-fail synthesis test added (comprehensive assertions for 81512bf merge gate)

**Remediation:**
- PR-E completed: Partial synthesis orchestration implemented
- 81512bf merge gate: Both-fail synthesis test added

---

## PBA-07: Selected-Period Product Service

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/product/analysis/selectedPeriodProductService.ts` (orchestration with partial synthesis support)
- Result type: no longer includes INCOMPLETE_CANONICAL_INPUT (domain failures degrade)
- errorCode propagation from activation functions to synthesis
- Error-union exhaustiveness guard: type wrapper params use Extract<SelectedCareerDashaActivationResult, { ok: false }>['error'] and Extract<EvaluateSelectedWealthPeriodActivationResult, { ok: false }>['error']

**Test Files:**
- `src/product/analysis/selectedPeriodProductService.test.ts` (product service tests including partial synthesis)
- Vacuous test removed (unresolved-evidence test deleted - domain layer has proper coverage)

**CI Evidence:**
- ✅ npm run verify: PASS (commit 3c83b80)
- ✅ npm run verify:pba10: PASS (commit 3c83b80)

**Findings:**
- ✅ Domain activation failures degrade to partial synthesis (do not hard-fail)
- ✅ Context resolution failures still hard-fail (invariant violation)
- ✅ productAnalysisMapper propagates MISSING provenance to qualificationStatus
- ✅ Partial synthesis tests added (service layer)
- ✅ errorCode propagated from activation functions to synthesis
- ✅ Vacuous test removed (unresolved-evidence test deleted - domain layer has proper coverage)
- ✅ Error-union exhaustiveness guard added for both career and wealth (compile-time guard for new error codes)
- ✅ Wealth errorCode uses Extract<EvaluateSelectedWealthPeriodActivationResult, { ok: false }>['error']

**Remediation:**
- PR-E completed: Partial synthesis orchestration at product service layer
- 81512bf merge gate: Error-union exhaustiveness guard added for both career and wealth, vacuous test removed

---

## PBA-08: AI Evidence Semantics

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/ai/product/aiExplanationService.ts` (AI explanation generation with evidence semantics contract)
- `src/ai/context/aiContextFactory.ts` (AI context projection)
- `src/domain/synthesis/selectedPeriodSynthesis.ts` (SynthesisEvidenceReference)

**Test Files:**
- `src/ai/product/aiExplanationService.test.ts` (AI evidence semantics tests)
- Evidence ID resolution test improved to actually resolve against AI-context evidence index
- All-unknown-evidence and zero-classified-evidence test cases added
- Parity test: contextEvidenceIds and allReturnedIds resolved from same projection runAiExplanation consumes
- Failure-isolation test: inject deterministically failing router, assert ERROR result and deep equality of synthesis input before/after
- Classification parity test: construct input with known classification/polarity values, assert returned role matches source classification per ID
- Controlled unresolved ID test: inject router returning invented ID, assert it appears in unresolvedQuestions and not in supporting/challenging evidence
- Vacuous edge-case test deleted (expect(SUCCESS || ERROR).toBe(true) removed)

**CI Evidence:**
- ✅ npm run verify: PASS (commit 3c83b80)
- ✅ npm run verify:pba10: PASS (commit 3c83b80)

**Findings:**
- ✅ Contract codified: AI evidence semantics contract documented in aiExplanationService.ts
- ✅ Evidence-ID parity: unresolved IDs marked in unresolvedQuestions, never invented
- ✅ Classification determinism: AI restates engine classification, never reinterprets
- ✅ AI failure isolation: leaves deterministic synthesis unchanged
- ✅ DTO↔AI context parity: canonical identity/temporal fields preserved verbatim
- ✅ Tests added: evidence-ID parity, classification determinism, AI failure isolation, real local rules engine test
- ✅ Evidence ID resolution test improved to actually resolve against AI-context evidence index
- ✅ All-unknown-evidence test case added
- ✅ Zero-classified-evidence test case added
- ✅ Parity test improved: resolves authoritative evidence index from same projection runAiExplanation consumes
- ✅ Failure-isolation test added: injects failing router, asserts ERROR and deep equality
- ✅ Classification parity test added: asserts role matches source classification per ID
- ✅ Controlled unresolved ID test added: injects router with invented ID, asserts it appears in unresolvedQuestions
- ✅ Vacuous test deleted: removed always-true assertion

**Remediation:**
- PR-F completed: AI evidence semantics contract codified and tested
- 81512bf merge gate: Parity, failure-isolation, classification parity, and controlled unresolved ID tests improved/added

---

## PBA-09: Acceptance Hardening

**Status:** ✅ COMPLETE

**Implementation Files:**
- N/A (test-only milestone)

**Test Files:**
- `src/product/analysis/productAnalysisService.integration.test.ts` (integration tests)
- `src/product/analysis/selectedPeriodProductService.test.ts` (product service tests)
- `src/domain/synthesis/selectedPeriodSynthesis.test.ts` (synthesis tests)

**CI Evidence:**
- ✅ npm run verify: PASS (commit 3c83b80)
- ✅ npm run verify:pba10: PASS (commit 3c83b80)

**Findings:**
- ✅ Temporal past/current/future vs asOf test split into three distinct tests with actual values
- ✅ Temporal boundary tests assert selectedPeriod.status === 'OK' unconditionally before asserting temporalRelation
- ✅ Unresolved-evidence integration test rewritten to document domain-layer coverage
- ✅ Bare toBeDefined() assertions replaced with discriminant assertions (not.toBeNull(), toMatch)
- ✅ Matrix coverage tests present (invalid selection, malformed context, temporal boundaries, partial domains)
- ✅ expect(x).not.toBeNull() on find() results replaced with truthy checks (expect(x).toBeTruthy())

**Remediation:**
- PR-G completed: Acceptance hardening tests improved

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
- ✅ COMPLETE: 8 (PBA-01, PBA-02, PBA-03, PBA-05, PBA-06, PBA-07, PBA-08, PBA-09)
- ⚠️ NEEDS_PROOF: 1 (PBA-04 - partially complete, adapter diagnostic landed)
- 🔄 DEFERRED: 1 (PBA-10)

**Confirmed Defects:** 0
- PBA-03: Resolved (temporal relation recomputation implemented in commit ed30213)
- PBA-04: Partially resolved (adapter diagnostic implemented in commits 42398f9/22641c1)

**Needs Proof:** 2 test coverage gaps in PBA-04
- Ambiguous caller-expression match proof
- Unqualified-evidence regression test (assert expressionActivations.length === 0)

**PR Sequence Progress:**
- PR-A (WP-0): Contract and acceptance matrix (docs only) — COMPLETE
- PR-B (WP-1): Context guardrails — COMPLETE (commit ed30213)
- PR-C (WP-2): Career candidate integrity — PARTIALLY COMPLETE (adapter diagnostic landed in 42398f9/22641c1)
- PR-D (WP-3): Wealth diagnostics — COMPLETE
- PR-E (WP-4): Partial synthesis orchestration — COMPLETE
- PR-F (WP-5): AI evidence semantics — COMPLETE
- PR-G (WP-6): Acceptance hardening — COMPLETE
- 81512bf merge gate items (post-PR-G): COMPLETE (commit 3c83b80)
  - Vacuous unresolved-evidence test removed (domain layer has proper coverage)
  - Extract guard applied to wealthErrorCode (matching career pattern)
  - Unresolved-ID assertions strengthened with controlled case
  - Both-fail baseline assertion strengthened (frozen objects, reference equality)
  - Verify and verify:pba10 green (baseline SHA updated)

---

**Definition of Done:**
Every PBA milestone backed by acceptance evidence; validator recomputes temporal relation; candidate attribution deterministic; domain failure doesn't erase the other domain; AI can't invent or reinterpret evidence; DTO/AI context field parity; zero vacuous assertions in the acceptance suite; green npm run verify and npm run verify:pba10 recorded against the release commit.
