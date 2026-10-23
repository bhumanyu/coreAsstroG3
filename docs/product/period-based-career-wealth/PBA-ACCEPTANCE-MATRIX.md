# PBA Acceptance Matrix

**Baseline Commit:** `491b831b2d6715760521b135365cbf4222623bec`

**Last Updated:** 2026-10-23

**Purpose:** Maps each PBA invariant to implementation files, test files, and CI evidence. Classifies findings as CONFIRMED_DEFECT, NEEDS_PROOF, or DEFERRED.

## Vimshottari Partial-First-MD Anchoring Follow-up

**Change commit:** `d78901a110720e0ad7543217a07db2868934ef83`

**Toolchain:** Node `20.19.4`, npm `10.9.2`

**Verification for the change commit above:**
- ✅ `npx vitest run src/engine/dasha/vimshottari.test.ts`: PASS (83 tests)
- ✅ `npx vitest run src/engine/dasha/reference/dashaSubPeriods.test.ts`: PASS (17 tests)
- ✅ `npx vitest run src/engine/astroEngine.test.ts`: PASS (48 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (123 tests; lint and build passed)
- ✅ `npm run verify`: PASS (296 test files, 5,560 passed, 5 skipped; lint and build passed)

The full build emitted the existing large-chunk-size warning. The external ephemeris suite remains skipped; analytical fixtures are internal-convention checks, not independent astronomical validation. No expected active-planet values or external reference data were changed in this follow-up.

## Vimshottari Zero-Length First-MD Guard Follow-up

**Change commit:** `7120fbdcb2652006ee7d30f33bba1b4b490c5a6c`

**Toolchain:** Node `20.19.4`, npm `10.9.2`

**Verification for the change commit above:**
- ✅ `npx vitest run src/engine/dasha/vimshottari.test.ts`: PASS (84 tests)
- ✅ `npx vitest run src/engine/dasha/reference/dashaSubPeriods.test.ts`: PASS (17 tests)
- ✅ `npx vitest run src/engine/astroEngine.test.ts`: PASS (48 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (123 tests; lint and build passed)
- ✅ `npm run verify`: PASS (296 test files, 5,561 passed, 5 skipped; lint and build passed)

The production fix consumes the partial-first-MD status only after a positive-length period is emitted and stops timeline generation if a complete candidate sequence makes no progress at millisecond precision. The guard regression uses a public input that skips a zero-length Sun candidate and emits the following partial Moon MD. The near-360° case with no representable positive interval now yields no MDs rather than repeating indefinitely. The full build emitted the existing large-chunk-size warning. The external ephemeris suite remains skipped.

## Empty Vimshottari Timeline Composition Follow-up

**Change commit:** `2c81ce1843996c2548f46ca875669b7cdf4041d2`

**Toolchain:** Node `20.19.4`, npm `10.9.2`

**Scenarios:**
- **One candidate is zero-length, a later candidate is representable:** the zero-length Sun candidate is skipped; the following Moon period is emitted using the remaining-fraction duration, followed by Mars. Assertions verify the identities, partial-versus-full duration, contiguous MD boundaries, and termination at the 120-year horizon. The partial-first status is consumed only once a valid MD is emitted.
- **Every candidate in the sequence is unrepresentable:** timeline generation terminates with no MDs and does not silently consume the partial-first status. The `calculateHoroscope` acceptance test injects the near-360° Moon through `customPositions`; it verifies the empty timeline is reported as `UNAVAILABLE` with `EMPTY_VIMSHOTTARI_TIMELINE`, has no interpreted periods or active Dasha, and does not throw. Full-natal Dasha sections also report `UNAVAILABLE`.

**Verification for the change commit above:**
- ✅ `npx vitest run src/engine/astroEngine.test.ts src/engine/dasha/vimshottari.test.ts src/engine/dashaInterpretation/dashaInterpretation.test.ts src/engine/fullNatalAnalysis/fullNatalAnalysis.test.ts`: PASS (4 test files, 234 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (123 tests; lint and build passed)
- ✅ `npm run verify`: PASS (296 test files, 5,562 passed, 5 skipped; lint and build passed)

The build emitted the existing large-chunk-size warning. The external ephemeris suite remains skipped.

**Current PR verification (exact baseline SHA `491b831b2d6715760521b135365cbf4222623bec`):**
- ✅ `npx vitest run src/domain/wealth/selectedWealthDashaActivation.test.ts`: PASS (61 tests)
- ✅ `npx vitest run src/domain/synthesis/selectedPeriodSynthesis.test.ts`: PASS (87 tests)
- ✅ `npx vitest run src/product/analysis/productAnalysisService.integration.test.ts`: PASS (33 tests)
- ✅ `npx tsc --noEmit`: PASS
- ⚠️ `npm run verify:pba10`: BLOCKED after 110 tests passed; the DashaPage worker failed to start with `ERR_REQUIRE_ESM` in `html-encoding-sniffer` under Node v21.7.1. The build stage was not reached.
- ⚠️ `npm run verify`: BLOCKED; 5,225 tests passed, 5 skipped, and 28 worker errors. Node v21.7.1 produced the same `ERR_REQUIRE_ESM` worker-start failure and Vitest worker termination `EPERM`; the build stage was not reached.

Earlier CI evidence below retains the SHA and counts of its original historical runs. Current-PR results above are the evidence for this baseline.

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
- `src/core/analysis/selectedMdAdPeriod.test.ts` (period resolution with PBA-02A/C/D/E hardening)

**CI Evidence:**
- ✅ npx vitest run src/core/analysis/selectedMdAdPeriod.test.ts: PASS (55 tests, commit 40d4423)
- ✅ npx vitest run src/core/analysis/selectedPeriodActivationContext.test.ts: PASS (66 tests, commit 40d4423)
- ✅ npx tsc --noEmit: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)
- ✅ npm run verify: PASS (5475 tests passed, 5 skipped, commit 40d4423)

**Findings:**
- ✅ PBA-02A (malformed selection IDs): 11 tests added (empty MD/AD, whitespace-only MD/AD, wrong version/system/level, truncated, malformed percent-encoding, nonexistent IDs)
- ✅ PBA-02C (parentage/containment): 4 tests added (AD from other MD, encoded parent not in report, AD outside MD listing+resolution, duplicate AD in selected MD)
- ✅ PBA-02D (non-mutation): 1 test added (structuredClone snapshot)
- ✅ PBA-02E (determinism): 1 test added (deep-equal assertion)

**Remediation:**
- Test-only hardening completed: PBA-02A/C/D/E tests added (commit 55bbf3a)
- PBA-02A extended: whitespace-only AD ID test added (commit e6360ee)

---

## PBA-03: Selected-Period Context Guardrails

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/core/analysis/selectedPeriodActivationContext.ts` (validateSelectedPeriodContext with temporal relation recomputation)

**Test Files:**
- `src/core/analysis/selectedPeriodActivationContext.test.ts` (context validation tests including PBA-03A/B/C/D/E hardening)

**CI Evidence:**
- ✅ npx vitest run src/core/analysis/selectedPeriodActivationContext.test.ts: PASS (66 tests, commit 40d4423)
- ✅ npx tsc --noEmit: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)
- ✅ npm run verify: PASS (5475 tests passed, 5 skipped, commit 40d4423)

**Findings:**
- ✅ Temporal relation recomputation implemented in validateSelectedPeriodContext
- ✅ All 10 boundary tests added: start−1ms FUTURE, start included (CURRENT at start), end excluded (PAST at end), end−1ms CURRENT, malformed date, inverted interval, valid-but-wrong supplied temporalRelation, and additional edge cases
- ✅ PBA-03B (temporal mismatch): 5 tests added (false temporalRelation, malformed analysisAsOf, inverted interval, valid context, no rewrite)
- ✅ PBA-03C (cross-field consistency): 9 tests added (mahadashaId mismatch, selectedPeriodId mismatch, interval mismatch, summary mismatches, AD not contained)
- ✅ PBA-03D (non-mutation): 1 test added (structuredClone snapshot)
- ✅ PBA-03E (createSelectedPeriodId compatibility): 2 tests added (hard-coded literal format assertion, version guard)

**Remediation:**
- PR-B completed: Temporal relation recomputation and boundary tests added
- Test-only hardening completed: PBA-03B/C/D/E tests added (commit 55bbf3a)
- PBA-03E hardened: replaced self-referential expected value with hard-coded literal, added version guard (commit e6360ee)

---

## PBA-04: Selected-Period Career Activation

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/domain/career/careerDasha/selectedCareerDashaActivation.ts` (buildSelectedCareerDashaActivation)
- `src/domain/career/careerDasha/careerDashaIntegration.ts` (buildSelectedCareerDashaCanonicalAnalysis)
- `src/domain/career/careerMechanism/resolver/careerMechanismResolverRules.ts` (three dusthana rules only)

**Test Files:**
- `src/domain/career/careerDasha/selectedCareerDashaActivation.test.ts` (career activation tests)
- `src/domain/career/careerMechanism/resolver/careerMechanismResolver.test.ts` (dusthana rule tests)

**CI Evidence:**
- ✅ Adapter dropped-candidate diagnostic landed (commits 42398f9, 22641c1)
- ✅ Dead loop in unqualified-only test fixed (commit 8ba1bd6)
- ✅ Regression A fallback-row assertion de-conditionalized (commit 8ba1bd6)
- ✅ npx vitest run src/domain/career/careerDasha/selectedCareerDashaActivation.test.ts: PASS (57 tests, commit 40d4423)
- ✅ npx tsc --noEmit: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)
- ✅ npm run verify: PASS (5475 tests passed, 5 skipped, commit 40d4423)

**Findings:**
- ✅ Adapter diagnostic implemented for dropped candidates (ADAPTER_DROPPED_CANDIDATES)
- ✅ Ambiguous caller-expression match test present (Regression A test, line 348)
- ✅ Unqualified-evidence regression test strengthened (dead loop removed, line 1674)
- ✅ Unmatched-candidate fallback scenario covered (line 4379)
- ✅ Zero-QUALIFIED-candidates scenario covered (line 2578)
- ✅ UNAVAILABLE-unchanged scenario covered (lines 333, 2904, 3893, 3932)
- ✅ PROXY_DIRECTION-unchanged scenario covered (lines 2723, 3946)
- ✅ Regression A fallback-row assertion de-conditionalized (unconditional assertion that candidateA deterministically emits ADAPTER_FALLBACK)
- ✅ KENDRA_TRIKONA placeholder rule removed (commit 40d4423)
  - Applying-but-empty placeholder removed to match acceptance matrix constraint
  - Registry now contains only three dusthana rules (8↔10, 12↔10, composite 8-12-10)
  - KENDRA_TRIKONA rule definition and tests removed from careerMechanismResolverRules.ts and careerMechanismResolver.test.ts

**Deferred Families (Priority 3 - pending frozen evidence contracts and domain sign-off):**
- CAREER_HOUSE_NETWORK generic: needs mechanism-resolution rule (evidence contract not frozen)
- KENDRA_TRIKONA: needs mechanism-resolution rule (owner mapping and evidence contract sign-off pending)
- UPACHAYA_PROGRESSION: needs mechanism-resolution rule (evidence contract not frozen)
- PARIVARTANA_YOGA: needs mechanism-resolution rule (evidence contract not frozen)
- CAREER_YOGA_STRUCTURE: needs mechanism-resolution rule (evidence contract not frozen)
- Qualification policies for null-mapped families remain **DEFERRED** pending the frozen P2-06 methodology; this change adds no qualification policy.
- Non-dusthana mechanism-resolver rules remain **DEFERRED** pending domain-owner `CareerMechanismType` mappings; this change adds no resolver rule.

**🔄 DEFERRED (owner-blocked): Career non-dusthana mechanism-resolution coverage**
- **Issue:** On `main`, `CAREER_MECHANISM_RESOLUTION_RULES` contains only the three dusthana rules (8↔10, 12↔10, composite 8-12-10)
- **Impact:** Pattern classifications for `KENDRA_TRIKONA`, `CAREER_HOUSE_NETWORK`, `UPACHAYA_PROGRESSION`, `PARIVARTANA_YOGA`, and `CAREER_YOGA_STRUCTURE` resolve to `qualificationBasis: UNAVAILABLE` (no matching rule)
- **Blocker:** Domain owner must confirm which `CareerMechanismType` values each pattern classification emits before any rule can be added
- **Constraint:** Do NOT ship an applying-but-empty placeholder rule (this would misleadingly imply coverage while still producing `UNAVAILABLE`)
- **Remediation (commit 40d4423):** KENDRA_TRIKONA placeholder rule removed from registry and tests to eliminate the applying-but-empty contradiction
- **Gating artifact:** [P2-07D non-dusthana mechanism decision request](../../career/phase2/P2-07D-NON-DUSTHANA-MECHANISM-DECISION-REQUEST.md) collects owner mappings, evidence requirements, rejection conditions, incomplete-evidence behavior, and P2-06 freeze decisions for all five families.
- **Change scope:** No resolver registry rule was added in this documentation change; the registry remains limited to its three dusthana rules.
- **Cross-reference:** See `PBA-INVESTIGATION-FINDINGS.md` section "Career Findings" and "Required Fix (Priority 3)"

**Remediation:**
- COMPLETE: All test coverage gaps addressed, CI verification green
- Non-dusthana mechanism coverage remains deferred pending the decision-request sign-off and frozen P2-06 evidence contracts
- Coverage-gap diagnostics are additive: eligible patterns with no matching mechanism candidate and selected-career `UNAVAILABLE` results now include an explicit reason. `qualificationBasis` and `ProductQualificationStatus` semantics are unchanged.
- **Diagnostic change commit:** `c8dbc24eaa4640bf3fab06fc017dfd33d6088c2d`
- **Toolchain:** Node `20.19.4`
- **Verification on the exact change commit above:**
  - ✅ `npx vitest run src/domain/career/orchestration/canonicalCareerOrchestrator.test.ts`: PASS (58 tests)
  - ✅ `npx vitest run src/domain/career/careerDasha`: PASS (5 files, 170 tests)
  - ✅ `npx vitest run src/product/analysis/productAnalysisMapper.test.ts src/domain/synthesis/selectedPeriodSynthesis.test.ts`: PASS (2 files, 116 tests)
  - ✅ `npx vitest run src/components/dasha/__tests__/DashaComponents.test.tsx`: PASS (25 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run verify:pba10`: PASS (124 tests; lint and build passed)
  - ✅ `npm run verify`: PASS (296 test files, 5,565 passed, 5 skipped; lint and build passed)
- Both builds emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.
- Decision-request documentation commit: `3ba0f9cc65e4f9669a2788dc47dc71fa268414bf` (documentation only; no registry rule added)
- Validation on that exact commit, Node `20.19.4`: `npx tsc --noEmit` PASS; `npm run verify` PASS (296 test files, 5,562 passed, 5 skipped; build completed with the existing large-chunk-size warning)

---

## PBA-05: Selected-Period Wealth Activation

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/domain/wealth/selectedWealthDashaActivation.ts` (evaluateSelectedWealthPeriodActivation)
- insufficientReason discriminator (NO_PROMISE_EVIDENCE, PROMISE_NOT_LINKED, LINKED)
- Conservative house-only linkage contract preserved (Option A)

**Test Files:**
- `src/domain/wealth/selectedWealthDashaActivation.test.ts` (wealth activation tests)
- Moon MD→Moon AD FORTUNE (house 9) test: PROMISE_NOT_LINKED
- Moon MD→Moon AD SPECULATION (house 5) test: PROMISE_NOT_LINKED
- NO_PROMISE_EVIDENCE vs PROMISE_NOT_LINKED discrimination test

**CI Evidence:**
- ✅ npx vitest run src/domain/wealth/selectedWealthDashaActivation.test.ts: PASS (61 tests, commit 491b831b2d6715760521b135365cbf4222623bec)
- ✅ npx tsc --noEmit: PASS (commit 491b831b2d6715760521b135365cbf4222623bec)
- ⚠️ npm run verify:pba10: BLOCKED (110 tests passed before DashaPage worker ERR_REQUIRE_ESM under Node v21.7.1; commit 491b831b2d6715760521b135365cbf4222623bec)
- ⚠️ npm run verify: BLOCKED (5,225 tests passed, 5 skipped, 28 worker errors; Node v21.7.1 ERR_REQUIRE_ESM/EPERM; commit 491b831b2d6715760521b135365cbf4222623bec)
- insufficientReason discriminator implemented and tested

**Findings:**
- ✅ insufficientReason discriminator decision recorded: NO_PROMISE_EVIDENCE, PROMISE_NOT_LINKED, LINKED
- ✅ All four dimensions independently tested
- ✅ Distinguishing diagnostics implemented (promise present but dasha lord does not touch dimension's house vs true insufficiency)
- ✅ dataStatus reflects input/evidence availability only
- ✅ Conservative house-only linkage contract preserved (Option A)
- ✅ Moon MD→Moon AD cases tested: FORTUNE and SPECULATION return PROMISE_NOT_LINKED
- ✅ NO_PROMISE_EVIDENCE vs PROMISE_NOT_LINKED discrimination verified

**Remediation:**
- PR-D completed: insufficientReason discriminator implemented and tested
- Conservative linkage confirmed (Option A): explicit house match required, planet overlap alone insufficient
- Moon MD→Moon AD diagnostic tests added (commit abb00008)

**Contract decision:** Wealth Option A is adopted as the documented contract. Explicit house linkage is required; planet/lord/karaka overlap alone is insufficient. `PROMISE_NOT_LINKED` now carries a distinguishing diagnostic when promise exists but the selected-period dasha lord does not touch the dimension's canonical house.

**🔄 DEFERRED (owner-blocked): Wealth Option B lord/karaka linkage**
- **Blocker:** Option B remains OWNER-BLOCKED pending the Wealth spec.
- Do not extend `isLinkedToDimension` with speculative lord/karaka mappings.
- **Investigation finding:** For MOON MD → MOON AD period (Bhu chart), FORTUNE (house 9) and SPECULATION (house 5) have promise evidence but fail linkage because Moon's dasha evidence does not reference houses 9 or 5
- **GAINS effect assignment clarification:** `resolveEffect` returns `UNKNOWN` for LINKED dimensions with only-NEUTRAL dasha evidence; this is intended behavior, not a defect
- **Cross-reference:** See `PBA-INVESTIGATION-FINDINGS.md` section "Wealth Linkage Rule Analysis" and "Resolution: GAINS Effect Assignment"

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
- Per-domain MISSING projection tests (career-only and wealth-only) already present at lines 700-732
- Error-code propagation tests for PARTIAL_CAREER_ACTIVATION_FAILED and PARTIAL_WEALTH_ACTIVATION_FAILED added (lines 734-774)

**Findings:**
- ✅ Partial-result contract defined: domain failures degrade, context failures hard-fail
- ✅ Domain failure handling implemented (career/wealth MISSING provenance)
- ✅ PARTIAL_* diagnostics emitted when one domain fails and the other succeeds
- ✅ SYNTHESIS_PARTIAL_NO_DOMAINS diagnostic emitted when both domains fail
- ✅ errorCode propagated from activation failures to diagnostic messages
- ✅ Baselines unchanged for partial synthesis
- ✅ Tests for career-fails/wealth-ok and wealth-fails/career-ok scenarios (lines 700-732)
- ✅ Both-fail synthesis test added (comprehensive assertions for 81512bf merge gate)
- ✅ Error-code propagation tests added for PARTIAL_CAREER_ACTIVATION_FAILED and PARTIAL_WEALTH_ACTIVATION_FAILED (lines 734-774)

**Remediation:**
- PR-E completed: Partial synthesis orchestration implemented
- 81512bf merge gate: Both-fail synthesis test added
- e12f513: Error-code propagation tests added for PARTIAL_* diagnostics

**CI Evidence:**
- ✅ npx vitest run src/domain/synthesis/selectedPeriodSynthesis.test.ts: PASS (87 tests, commit 491b831b2d6715760521b135365cbf4222623bec)
- ✅ npx vitest run src/product/analysis/productAnalysisService.integration.test.ts: PASS (33 tests, commit 491b831b2d6715760521b135365cbf4222623bec)
- ✅ npx tsc --noEmit: PASS (commit 491b831b2d6715760521b135365cbf4222623bec)
- ⚠️ npm run verify:pba10: BLOCKED (110 tests passed before DashaPage worker ERR_REQUIRE_ESM under Node v21.7.1; commit 491b831b2d6715760521b135365cbf4222623bec)
- ⚠️ npm run verify: BLOCKED (5,225 tests passed, 5 skipped, 28 worker errors; Node v21.7.1 ERR_REQUIRE_ESM/EPERM; commit 491b831b2d6715760521b135365cbf4222623bec)

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
- ✅ npx vitest run src/product/analysis/selectedPeriodProductService.test.ts: PASS (19 tests, commit 40d4423)
- ✅ npm run verify: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)

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
- ✅ npx vitest run src/ai/product/aiExplanationService.test.ts: PASS (21 tests, commit 40d4423)
- ✅ npm run verify: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)

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
- ✅ npx vitest run src/product/analysis/productAnalysisService.integration.test.ts: PASS (33 tests, commit 40d4423)
- ✅ npm run verify: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)

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

## UI Accessibility + Test Hardening (Dasha Period Selection)

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/components/dasha/SelectedPeriodReport.tsx` (visible diagnostic explanations in compact mode)
- `src/components/dasha/SelectedPeriodSection.tsx` (visible invalid-period diagnostics, accessible submission state)
- `src/pages/DashaPage.tsx` (READY-gated report, accessible error banners)

**Test Files:**
- `src/components/dasha/__tests__/DashaComponents.test.tsx` (component interaction tests, diagnostics visibility tests, SelectedPeriodReport partial-result rendering)
- `src/pages/__tests__/DashaPage.test.tsx` (page-level tests for READY gate, selection flow)
- `src/app/__tests__/AppController.test.ts` (race condition tests for selectPeriod)

**CI Evidence:**
- ✅ npx vitest run src/components/dasha/__tests__/DashaComponents.test.tsx: PASS (20 tests, commit 40d4423)
- ✅ npx vitest run src/pages/__tests__/DashaPage.test.tsx: PASS (17 tests, commit 40d4423)
- ✅ npx vitest run src/app/__tests__/AppController.test.ts: PASS (12 tests, commit 40d4423)
- ✅ npx tsc --noEmit: PASS (commit 40d4423)
- ✅ npm run verify:pba10: PASS (127 tests, commit 40d4423)
- ✅ npm run verify: PASS (5475 tests passed, 5 skipped, commit 40d4423)

**Findings:**
- ✅ DiagnosticsList compact mode now renders both diag.code and diag.message as visible text in semantic list with aria-label
- ✅ Invalid-period diagnostics region added to SelectedPeriodSection (section with aria-label, lists invalid MD/AD options)
- ✅ Accessible submission state: live region with aria-live="polite", aria-busy on button, stable button label
- ✅ Fieldset with disabled={isSubmitting} wraps selects with sr-only legend
- ✅ READY gate added to selected-period report render condition (prevents stale same-ID synthesis during SUBMITTING)
- ✅ Error banners wrapped with role="alert" and aria-live="assertive"
- ✅ Component tests added: MD change clears AD, valid submit calls onSelect with exact IDs, isSubmitting disables selects/button
- ✅ Diagnostics test added: asserts visible message and list role (not just title)
- ✅ Page tests added: READY gate prevents stale report on failed submission
- ✅ Race tests added: AppController.selectPeriod race guard verified with deferred promises (different MD/AD IDs, same MD/AD IDs)
- ✅ Partial-result component tests restored (commit 40d4423):
  - SelectedPeriodReport Career-only partial test: asserts career heading, activated expression, Missing Inputs section with wealth missing input code/description, and "Wealth activation unavailable" banner
  - SelectedPeriodReport Wealth-only partial test: asserts wealth heading, activated dimension, Missing Inputs section with career missing input code/description, and "Career activation unavailable" banner
  - Page-level partial-result tests: verify selection flow and onSelectPeriod invocation (component-level rendering coverage in DashaComponents.test.tsx)

**Remediation:**
- Current session: All UI accessibility and test-hardening changes implemented and verified
- Vacuous tests fixed in commit b5dbae8:
  - change-AD-after-report hides report+AI immediately: Now drives real submission flow and asserts report clears on AD change
- Partial-result test restoration (commit 40d4423):
  - Career-only and Wealth-only partial-result rendering tests restored in DashaComponents.test.tsx
  - Page-level partial-result tests simplified to selection flow verification (referencing component-level coverage)
- SelectedPeriodSection typo fixed: stray '</div >' corrected to '</div>'
- All contracts preserved: createSelectedPeriodId, interval semantics, qualification contracts unchanged
- Non-duplication logic in deriveSelectionErrorBanner preserved
- CI verification completed on commit 40d4423: all tests passing

---

## P2: Boundary and Interval Regression Tests

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/engine/dasha/vimshottari.ts` (buildAntardashas, buildPratyantardashas - already guards against zero/negative-length intervals)
- `src/engine/dashaInterpretation/dashaInterpretation.ts` (validateDashaInterpretationInput - already validates positive-length intervals)

**Test Files:**
- `src/engine/dasha/vimshottari.test.ts` (half-open boundary tests, end-to-end active-period resolution tests, zero/negative-length interval tests)
- `src/engine/dashaInterpretation/dashaInterpretation.test.ts` (interpretation layer positive-length validation tests)

**CI Evidence:**
- ✅ npx vitest run src/engine/dasha/vimshottari.test.ts: PASS (28 tests, commit 0afcb39)
- ✅ npx vitest run src/engine/dashaInterpretation/dashaInterpretation.test.ts: PASS (65 tests, commit 0afcb39)
- ✅ npx vitest run src/components/dashaTiming/__tests__/DashaTimeline.test.tsx: PASS (6 tests, commit 0afcb39)
- ✅ npx tsc --noEmit: PASS (commit 0afcb39)
- ✅ npm run verify:pba10: PASS (123 tests, commit 0afcb39)
- ✅ npm run verify: PASS (5501 tests passed, 5 skipped, commit 0afcb39)

**Findings:**
- ✅ Half-open active-period boundary tests added for MD/AD/PD (just-before start, exact start, just-after start, exact end, just-after end, ±1ms epsilon offset)
- ✅ End-to-end active-period resolution tests added (correct MD/AD/PD selection at period boundaries)
- ✅ Zero/negative-length interval tests added (buildAntardashas returns empty frozen array for parentDurationMs <= 0, timeline never emits zero/negative-length intervals)
- ✅ Interpretation layer validation tests added (rejects zero/negative-length MD/AD/PD intervals, never emits such periods in output)
- ✅ Half-open boundary semantics preserved through interpretation layer (exact end falls into next period)
- ✅ All guardrails preserved (fail-closed behavior for missing/non-finite Moon longitude, positive-duration guards for MD/AD/PD, interval-based active-Mahadasha identification)
- ✅ No changes to calculateVimshottari's partial-MD scaling formula (PR-B remains reference-data blocked)
- ✅ D08-A1 external-ephemeris suite remains skipped (PR-A remains reference-data blocked)

**Remediation:**
- Current session: All P2 regression tests implemented and verified
- Guardrails verified: Moon longitude finite-number validation (vimshottari.ts lines 262-268), positive-duration guards (vimshottari.ts lines 159, 205, 338-340), interval-based active-Mahadasha identification
- TypeScript errors fixed in commit 7c466ea: DashaTimeline.test.tsx now uses Planet enum instead of string literals, astroEngine.test.ts type assertion fixed
- npm run verify:pba10 now passes; npm run verify blocked by 3 pre-existing test failures in astroEngine.test.ts (Moon longitude validation - unrelated to P2 or current fixes)

---

## P3: De-brittle the Timeline Active-Card Test

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/components/dashaTiming/DashaTimeline.tsx` (added data-testid="active-mahadasha-card" to active card)

**Test Files:**
- `src/components/dashaTiming/__tests__/DashaTimeline.test.tsx` (replaced brittle closest('.rounded-2xl') + toHaveClass('bg-gradient-to-b') assertions with stable getByTestId('active-mahadasha-card') query)

**CI Evidence:**
- ✅ npx vitest run src/components/dashaTiming/__tests__/DashaTimeline.test.tsx: PASS (6 tests, commit 0afcb39)
- ✅ npx vitest run src/components/dasha/__tests__/DashaComponents.test.tsx: PASS (22 tests, commit 0afcb39)
- ✅ npx tsc --noEmit: PASS (commit 0afcb39)
- ✅ npm run verify:pba10: PASS (123 tests, commit 0afcb39)
- ✅ npm run verify: PASS (5501 tests passed, 5 skipped, commit 0afcb39)

**Findings:**
- ✅ Stable accessible hook added: data-testid="active-mahadasha-card" on active Mahadasha card
- ✅ Active-identification logic unchanged (interval-based match on activeMahadashaStart/activeMahadashaEnd)
- ✅ Test de-brittled: replaced closest('.rounded-2xl') + toHaveClass('bg-gradient-to-b') with getByTestId('active-mahadasha-card')
- ✅ Exactly one active card test added (asserts exactly one card with data-testid="active-mahadasha-card" when active Mahadasha is specified)
- ✅ No-active-specified test enhanced (asserts no card with data-testid="active-mahadasha-card" when no active Mahadasha is specified)
- ✅ Existing "exactly one Active label" and repeated-Jupiter-lord tests preserved

**Remediation:**
- Current session: Stable accessible hook added and test de-brittled
- TypeScript errors fixed in commit 7c466ea: DashaTimeline.test.tsx now uses Planet enum instead of string literals
- npm run verify:pba10 now passes; npm run verify blocked by 3 pre-existing test failures in astroEngine.test.ts (Moon longitude validation - unrelated to P3 or current fixes)

---

## TypeScript and Diagnostic Coverage Fixes (commit 7c466ea)

**Status:** ✅ COMPLETE

**Implementation Files:**
- `src/components/dashaTiming/__tests__/DashaTimeline.test.tsx` (fixed string literals to Planet enum)
- `src/engine/astroEngine.test.ts` (fixed type assertion for Moon position test)
- `src/components/dasha/SelectedPeriodSection.tsx` (verified diagnostic coverage, added fallback for unknown codes)

**Test Files:**
- N/A (test fixes only)

**CI Evidence:**
- ✅ npx tsc --noEmit: PASS (commit 7c466ea)
- ✅ npx vitest run src/components/dashaTiming/__tests__/DashaTimeline.test.tsx: PASS (6 tests, commit 7c466ea)
- ✅ npm run verify:pba10: PASS (123 tests, commit 7c466ea)

**Findings:**
- ✅ DashaTimeline.test.tsx: Replaced all string literal planet values ('JUPITER', 'SATURN', 'MERCURY') with Planet enum members (Planet.JUPITER, Planet.SATURN, Planet.MERCURY)
- ✅ astroEngine.test.ts: Fixed type assertion error by adding `as unknown as PlanetPosition` for Moon position test with undefined longitude
- ✅ SelectedPeriodSection.tsx: Verified that DASHA_DIAGNOSTIC_EXPLANATIONS covers all PeriodDiagnostic codes emitted by selectedMdAdPeriod.ts
  - All 6 codes covered: INVALID_MAHADASHA_INTERVAL, INVALID_ANTARDASHA_INTERVAL, ANTARDASHA_OUTSIDE_MAHADASHA, DUPLICATE_MAHADASHA_ID, DUPLICATE_ANTARDASHA_ID, NON_CANONICAL_DATE_FORMAT
  - Removed keys NON_CONTIGUOUS_BOUNDARIES, OUTSIDE_PARENT_WINDOW, MISSING_DATES, MALFORMED_TIMELINE (not emitted by selectedMdAdPeriod.ts)
  - Added fallback to show raw code in parentheses when no explanation is available

**Remediation:**
- TypeScript errors fixed in commit 7c466ea
- npx tsc --noEmit now passes cleanly
- Diagnostic coverage verified and fallback mechanism added for unknown codes

---

## Summary

**Total Milestones:** 13

**Status Breakdown:**
- ✅ COMPLETE: 12 (PBA-01, PBA-02, PBA-03, PBA-04, PBA-05, PBA-06, PBA-07, PBA-08, PBA-09, P2, P3, TypeScript and Diagnostic Coverage Fixes)
- 🔄 DEFERRED: 1 (PBA-10)

**P2 and P3 (Current Session):**
- ✅ P2: Boundary and interval regression tests — COMPLETE (commit 6727c8d)
- ✅ P3: De-brittle the timeline active-card test — COMPLETE (commit 6727c8d)
- ✅ TypeScript and Diagnostic Coverage Fixes — COMPLETE (commit 7c466ea)

**Confirmed Defects:** 0
- PBA-03: Resolved (temporal relation recomputation implemented in commit ed30213)
- PBA-04: Resolved (adapter diagnostic implemented in commits 42398f9/22641c1, test coverage completed in commit 8ba1bd6)
- PBA-04 Priority 3 Gap: non-dusthana mechanism mappings are owner-blocked; an earlier KENDRA_TRIKONA placeholder was removed in commit 40d4423, and the registry currently contains only the three dusthana rules
- PBA-05 Priority 3 Gap: GAINS UNKNOWN effect resolved (not a defect — defined intermediate state, recorded in PBA-INVESTIGATION-FINDINGS.md)
- PBA-05 Priority 3 Gap: Conservative linkage confirmed (Option A), Moon MD→Moon AD tests added (commit abb00008)

**PR Sequence Progress:**
- PR-A (WP-0): Contract and acceptance matrix (docs only) — COMPLETE
- 🔄 PR-A (external Moon-anchor capture): BLOCKED (external reference data required)
- PR-B (WP-1): Context guardrails — COMPLETE (commit ed30213)
- 🔄 PR-B (partial-MD algorithm change): BLOCKED (external reference data required)
- Priority 3 Gap Closure (commit abb00008):
  - Career: an earlier KENDRA_TRIKONA placeholder attempt was subsequently removed (commit 40d4423); mechanism mapping awaits the owner decision request
  - Wealth: GAINS UNKNOWN effect resolved (defined intermediate state, not a defect)
  - Wealth: Conservative linkage confirmed with Moon MD→Moon AD diagnostic tests
  - Deferred families: CAREER_HOUSE_NETWORK, KENDRA_TRIKONA, UPACHAYA_PROGRESSION, PARIVARTANA_YOGA, CAREER_YOGA_STRUCTURE (pending owner sign-off and frozen evidence contracts)
- PR-C (WP-2): Career candidate integrity — COMPLETE (adapter diagnostic landed in 42398f9/22641c1, test coverage completed in 8ba1bd6)
- PR-D (WP-3): Wealth diagnostics — COMPLETE
- PR-E (WP-4): Partial synthesis orchestration — COMPLETE
- PR-F (WP-5): AI evidence semantics — COMPLETE
- PR-G (WP-6): Acceptance hardening — COMPLETE
- 81512bf merge gate items (post-PR-G): COMPLETE (commit 3c83b80, superseded by e12f513)
  - Vacuous unresolved-evidence test removed (domain layer has proper coverage)
  - Extract guard applied to wealthErrorCode (matching career pattern)
  - Unresolved-ID assertions strengthened with controlled case
  - Both-fail baseline assertion strengthened (frozen objects, reference equality)
  - Verify and verify:pba10 green (baseline SHA updated)
- PBA-04 test coverage completion (commit 8ba1bd6):
  - Dead loop in unqualified-only test fixed
  - Regression A fallback-row assertion de-conditionalized
  - All required PBA-04 scenarios verified as already covered in existing tests
- PBA-02/PBA-03 test-only hardening (commit 55bbf3a):
  - PBA-02A/C/D/E: 16 resolver tests added (malformed IDs, parentage/containment, non-mutation, determinism)
  - PBA-03B/C/D/E: 16 context tests added (temporal mismatch, cross-field consistency, non-mutation, createSelectedPeriodId compatibility)
  - vitest for both test files: PASS (54 tests, 65 tests)
  - tsc --noEmit: PASS
  - npm run verify:pba10: PASS
- PBA-02A/PBA-03E hardening extensions (commit e6360ee):
  - PBA-02A: whitespace-only AD ID test added (symmetric to existing MD test)
  - PBA-03E: hard-coded literal format assertion added (locks current contract), version guard added
  - vitest for both test files: PASS (55 tests, 66 tests)
  - tsc --noEmit: PASS
  - npm run verify:pba10: PASS (122 tests)
  - npm run verify: PASS (5456 tests passed, 5 skipped)
- PBA-06 error-code propagation tests (commit e12f513):
  - Error-code propagation tests added for PARTIAL_CAREER_ACTIVATION_FAILED (careerErrorCode in diagnostic message)
  - Error-code propagation tests added for PARTIAL_WEALTH_ACTIVATION_FAILED (wealthErrorCode in diagnostic message)
  - Per-domain MISSING projection tests verified as already present (lines 700-732)
- TypeScript error fix (commit 4b7bc7b):
  - Fixed type error in productAnalysisService.integration.test.ts lines 791-794
  - Replaced invalid career.direction/strength and wealth.direction/strength assertions with correct fields:
    - career.promise.strength and career.promise.status
    - wealth.overall.promise and wealth.overall.status
  - Verification results at 4b7bc7b:
    - npx tsc --noEmit: PASS
    - npx vitest run src/domain/synthesis/selectedPeriodSynthesis.test.ts: PASS (86 tests)
    - npx vitest run src/product/analysis/productAnalysisService.integration.test.ts: PASS (33 tests)
    - npm run verify:pba10: PASS (123 tests)
    - npm run verify: PASS (5459 tests passed, 5 skipped)
  - Baseline commit updated to 4b7bc7b

---

**Definition of Done:**
Every PBA milestone is backed by acceptance evidence; validator recomputes temporal relation; candidate attribution is deterministic; domain failure doesn't erase the other domain; AI can't invent or reinterpret evidence; DTO/AI context field parity; zero vacuous assertions in the acceptance suite; `npm run verify:pba10` and `npm run verify` outcomes are recorded against the release commit, with environment blockers reported rather than claimed as PASS.

---

## Remaining Owner-Blocked / Reference-Data-Blocked Items

These items are blocked inputs, not open implementation gaps. Do not invent reference values or mechanism mappings.

1. **P1 partial-Mahadasha timing validation — REFERENCE-DATA-BLOCKED:** Requires an independent Vimshottari reference chart.
2. **P1 external Moon-anchor capture — REFERENCE-DATA-BLOCKED:** The `describe.skip`'d `D08-A1` suite in `src/engine/dasha/reference/dashaMoonAnchor.test.ts` requires Swiss Ephemeris/JPL Horizons values with version and flags recorded.
3. **Priority-3 Career non-dusthana mechanism-type mappings — OWNER-BLOCKED:** The domain owner must specify `CareerMechanismType` values for `CAREER_HOUSE_NETWORK`, `KENDRA_TRIKONA`, `UPACHAYA_PROGRESSION`, `PARIVARTANA_YOGA`, and `CAREER_YOGA_STRUCTURE`, and confirm the P2-06 evidence contract is frozen. Do not add speculative rules.
4. **Wealth Option B lord/karaka linkage — OWNER-BLOCKED:** Pending the Wealth spec; adopted Option A house-only linkage remains unchanged.
