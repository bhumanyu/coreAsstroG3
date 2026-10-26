# PBA Acceptance Matrix

**Baseline Commit:** `491b831b2d6715760521b135365cbf4222623bec`

**Last Updated:** 2026-10-24

**Purpose:** Maps each PBA invariant to implementation files, test files, and CI evidence. Classifies findings as CONFIRMED_DEFECT, NEEDS_PROOF, or DEFERRED.

## Deterministic Future Dasha Forecasting

**Source change commit:** `0e2ae9d51b7fdc72a6e2f24fd540f204297ea3d6`

**Toolchain:** Node `20.19.4`

**Verification against the source change commit above:**
- ✅ Focused FP-01–FP-06 regression suites: PASS (11 files, 480 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (124 tests; lint and production build passed)
- ✅ `npm run verify`: PASS (298 test files; 5,600 passed, 5 skipped; lint and production build passed)

The implementation resolves MD/AD/PD with half-open boundary semantics, binds transit positions and Dasha to one validated `asOf` context, partitions forecast horizons at Dasha transitions, preserves separate Wealth dimensions and supporting/challenging evidence, and projects nested MD/AD/PD periods with explicit horizon completeness. These are deterministic internal engine outputs, not event probabilities or guarantees. A favorable SPECULATION window is not evidence that risky trading will profit.

External transit-position and independent Dasha-boundary parity remain **REFERENCE-DATA-BLOCKED** pending captured Swiss Ephemeris / JPL Horizons data. The skipped Moon-anchor `D08-A1` suite remains skipped; analytical fixtures are internal-consistency conventions only and are not independent astronomical validation.

## Forecast-foundation Hardening Follow-up

**Source change commit:** `24707dce75b729a79a25e58ceb4c57d8aa3e2c51`

**Toolchain:** Node `20.19.4`, npm `10.9.2`

**Verification for the source change commit above:**
- ✅ `npx vitest run src/core/analysis/resolveFutureDasha.test.ts src/product/dasha-timing/__tests__/dashaTimingViewModel.test.ts src/product/life-analysis/dashaHierarchyUtils.test.ts src/product/life-analysis/dashaCareerHierarchy.test.ts src/product/life-analysis/dashaWealthHierarchy.test.ts src/domain/timing/careerWealthTiming/careerTransitSynthesis.test.ts src/domain/timing/careerWealthTiming/wealthTransitSynthesis.test.ts`: PASS (7 files, 64 passed, 1 skipped)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (124 tests; lint and production build passed)
- ✅ `npm run verify`: PASS (298 test files; 5,607 passed, 5 skipped; lint and production build passed)

The follow-up validates the complete nested MD/AD/PD structure before forecasting, distinguishes malformed timelines from unresolved Dasha, guards every forecast assessment field against unsupported confidence, and provides interval-scoped transit samples with precision and ephemeris metadata. Transit snapshots in `ForecastContext` are explicitly limited to `asOf`; the existing Career and Wealth synthesis functions remain current-instant-only. Transit-aware horizon evaluation is exposed through per-window `ForecastWindow.transitData` rather than reusing the snapshot. Horizon completeness now checks actual top-level and nested interval coverage. `combineTimingHierarchy` documents and tests its deterministic MD/AD/PD precedence across all effect combinations. The production build emitted only the existing large-chunk-size warning; the Node 21 / lightningcss local-environment blocker did not recur under the supported Node 20.19.4 runtime.

## Transit Sample Validation and Confidence Heuristic Follow-up

**Source change commit:** `a99f20be3e85a2229df246b8b09f419ba2862eb4`

**Toolchain:** Node `20.19.4`, npm `10.9.2`

**Verification for the source change commit above:**
- ✅ `npx vitest run src/core/analysis/resolveFutureDasha.test.ts src/product/life-analysis/dashaHierarchyUtils.test.ts`: PASS (2 files, 24 passed, 1 skipped)
- ✅ Additional transit/hierarchy suites (`src/core/analysis/resolveFutureDasha.test.ts`, `src/product/life-analysis/dashaHierarchyUtils.test.ts`, `src/product/life-analysis/dashaCareerHierarchy.test.ts`, `src/product/life-analysis/dashaWealthHierarchy.test.ts`, `src/domain/timing/careerWealthTiming/careerTransitSynthesis.test.ts`, `src/domain/timing/careerWealthTiming/wealthTransitSynthesis.test.ts`): PASS (6 files, 51 passed, 1 skipped)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (124 tests; lint and production build passed)
- ✅ `npm run verify`: PASS (298 test files; 5,611 passed, 5 skipped; lint and production build passed)

Transit samples now require every canonical Planet key, finite and scientifically bounded position fields, and a machine-checked maximum sample gap. Empty or sparse data is represented as `INSUFFICIENT_DATA`/`PARTIAL`, not as continuous transit coverage. Ephemeris metadata equality remains provenance text only and does not establish Swiss Ephemeris/JPL Horizons parity. The hierarchy confidence tests pin exact deterministic outputs; across all supported effect combinations, realized extrema are 0.4 and 0.9 (the existing 0.2/0.95 clamps remain defensive bounds and are not reached without changing the formula). The production build emitted the existing large-chunk-size warning. **External Swiss Ephemeris / JPL Horizons transit and Dasha parity remains a separately tracked `REFERENCE-DATA-BLOCKED` gate, unchanged by this follow-up.**

## Transit Calculation Context and Angular Consistency Follow-up

**Source change commit:** `b76e618fb6a4165fce7f66e6d35a5c52fd2ed248`

**Toolchain:** Node `20.19.4`, npm `10.9.2`

**Verification for the source change commit above:**
- ✅ `npx vitest run src/core/analysis/resolveFutureDasha.test.ts`: PASS (1 file, 12 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (124 tests; lint and production build passed)
- ✅ `npm run verify`: PASS (298 test files; 5,613 passed, 5 skipped; lint and production build passed)

**Change attribution:** `c7db3f6` is the original context-binding and angular-validation source change. `b76e618` is the follow-up convention refinement; the verification results listed above apply to `b76e618` only.

Transit samples now carry provider-declared ayanamsa, coordinate convention, and engine identity; optional sample echoes are checked against that context, and any echoed calculation instant must exactly match the authoritative sample `at`. Normalization preserves each `at` verbatim. Longitude and sign-longitude consistency use circular differences with an explicit angular tolerance. Matching ephemeris metadata remains a provenance label, not scientific verification.

**Remaining gates (tracked independently):**
- **REFERENCE-DATA-BLOCKED — independent Dasha/transit parity:** Independent parity against Swiss Ephemeris / JPL Horizons remains blocked until reference datasets are captured and compared. Context labels and internal checks do not satisfy this gate.
- **SAMPLING-POLICY — event detection and interval coverage:** The configured maximum sample gap determines the reported window coverage, but it does not independently prove transit-event boundary detection or guarantee complete interval coverage relative to all relevant events. This remains open.
- **HEURISTIC — confidence calibration:** Deterministic confidence values remain engineering heuristics, not calibrated probabilities or validated reliability. Calibration awaits outcome data.

## Strict Transit Validation Follow-up

**Source change commit:** `ba834a5acea5151f297d939e5683d9e5dccc9881`

**Toolchain:** Node `20.19.4`

**Verification for the source change commit above:**
- ✅ `npx vitest run src/core/analysis/resolveFutureDasha.test.ts`: PASS (1 file, 15 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (6 test files, 124 tests; lint and production build passed)
- ✅ `npm run verify`: PASS (298 test files, 5,616 passed, 5 skipped; lint and production build passed)

The implementation documents the current producer's longitude-field semantics, makes legacy identical aliases an explicit context opt-in (strict relationship validation is the default), and provides compatibility versus required sample-context echoes. Tests cover tropical and sidereal sign-longitude selection, `longitude` fallback, circular tolerance, and context/timestamp echo requirements. The production builds emitted the existing large-chunk-size warning. The verification results above apply only to `ba834a5`.

**Remaining gates — all OPEN:**
- **OPEN — REFERENCE-DATA-BLOCKED:** Independent Dasha/transit parity against Swiss Ephemeris / JPL Horizons remains blocked pending reference data.
- **OPEN — SAMPLING-POLICY:** Transit event-boundary detection and interval-coverage guarantees remain unestablished.
- **OPEN — HEURISTIC:** Confidence calibration awaits outcome data; confidence remains an engineering heuristic.

## Canonical Transit Longitude and Provider-Binding Follow-up

**Source change commit:** `20255048a105e153af37b59cfacdc09352c1b1a6`

**Toolchain:** Node `20.19.4` (`.nvmrc`)

**Verification for the source change commit above:**
- ✅ `npx vitest run src/core/analysis/resolveFutureDasha.test.ts`: PASS (1 file, 17 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run verify:pba10`: PASS (6 test files, 124 tests; lint and production build passed)
- ✅ `npm run verify`: PASS (298 test files, 5,618 passed, 5 skipped; lint and production build passed)

`position.longitude` is now checked against the coordinate-convention field using circular angular distance; the identical-alias opt-in remains limited to all-identical aliases. Tests cover that regression, strict-provider context-echo rejection through `buildDomainForecast`, and legacy versus normalized strict output through the transit ephemeris producer. No application-level `TransitWindowProvider` is currently constructed under `src`; injected providers that omit `requireSampleContextEcho` retain documented compatibility behavior. The production builds emitted the existing large-chunk-size warning.

**Remaining gates — all OPEN:**
- **OPEN — REFERENCE-DATA-BLOCKED:** Independent Dasha/transit parity against Swiss Ephemeris / JPL Horizons remains pending reference data.
- **OPEN — SAMPLING-POLICY:** Transit event-boundary detection and interval-coverage guarantees remain unestablished.
- **OPEN — HEURISTIC:** Confidence calibration awaits outcome data; confidence remains an engineering heuristic.

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
- **Contract-diagnostic hardening commit:** `509c0af336889c8bfd1428df6b80aa458411a428`
- **Toolchain:** Node `20.19.4`
- **Verification on the exact change commit above:**
  - ✅ `npx vitest run src/domain/career/careerDasha/selectedCareerDashaDetectorResolution.integration.test.ts`: PASS (1 test)
  - ✅ `npx vitest run src/domain/career/orchestration/canonicalCareerOrchestrator.test.ts`: PASS (61 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run verify:pba10`: PASS (124 tests; lint and build passed)
  - ✅ `npm run verify`: PASS (297 test files, 5,569 passed, 5 skipped; lint and build passed)
- Builds emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

**Fail-closed resolver candidate-set contract change:**
- Duplicate candidate sets now fail closed for the affected pattern; foreign sets are excluded from resolved mechanisms. The aggregate contract diagnostic retains missing, duplicate, and foreign pattern IDs in `relatedIds`. No qualification policy or mechanism-resolution rule was added.
- **Change commit:** `1600efa662bbcaef089563c2b83fe4990bca4158`
- **Toolchain:** Node `20.19.4`
- **Verification on the exact change commit above:**
  - ✅ `npx vitest run src/domain/career/orchestration/canonicalCareerOrchestrator.test.ts`: PASS (1 test file, 63 tests)
  - ✅ `npx vitest run src/domain/career/careerDasha/selectedCareerDashaDetectorResolution.integration.test.ts`: PASS (1 test)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run verify:pba10`: PASS (6 test files, 124 tests; lint and build passed)
  - ✅ `npm run verify`: PASS (297 test files, 5,571 passed, 5 skipped; lint and build passed)
- Builds emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

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

**Diagnostic wording hardening commit:** `643fbc8b10e7d66b4a0b535da5c1739ed107d6d3`
- **Toolchain:** Node `20.19.4`
- **Changes:**
  - Part 1: Reworded ORCHESTRATION_NO_MECHANISM_RULE_MATCHED_* diagnostic to report observed state rather than asserting cause
  - Part 1: Reworded CAREER_UNAVAILABLE_NO_CANONICAL_MECHANISMS diagnostic to observed-state wording
  - Part 2: Split single branch to distinguish missing candidate-set (contract violation) from present-but-empty (coverage gap)
  - Part 2: Added two unit tests for empty candidate set and missing candidate set scenarios
  - Part 3: Added real detector→qualification→resolution integration test asserting empty-coverage end state per PBA-01 section 8.1
- **Verification on the exact change commit above:**
  - ✅ `npx vitest run src/domain/career/orchestration/canonicalCareerOrchestrator.test.ts`: PASS (62 tests; added 2 new tests for Part 2)
  - ✅ `npx vitest run src/domain/career/careerDasha`: PASS (6 files, 172 tests; added 1 integration test for Part 3)
  - ✅ `npx vitest run src/product/analysis/productAnalysisMapper.test.ts src/domain/synthesis/selectedPeriodSynthesis.test.ts`: PASS (2 files, 116 tests)
  - ✅ `npx vitest run src/components/dasha/__tests__/DashaComponents.test.tsx`: PASS (25 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run verify:pba10`: PASS (124 tests; lint and build passed)
  - ⚠️ `npm run verify`: BLOCKED after 5,225 tests passed; Node v21.7.1 produced ERR_REQUIRE_ESM worker-start failure and Vitest worker termination EPERM; build stage was not reached
- Non-dusthana mechanism mappings remain **DEFERRED** pending domain-owner sign-off (no speculative rules added)

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
3. **Independent MD/AD/PD reference parity — REFERENCE-DATA-BLOCKED:** The analytical fixtures and boundary/continuity regression tests verify only the documented internal convention; they are not independently sourced astronomical validation.
4. **Priority-3 Career non-dusthana mechanism-type mappings — OWNER-BLOCKED:** The domain owner must specify `CareerMechanismType` values for `CAREER_HOUSE_NETWORK`, `KENDRA_TRIKONA`, `UPACHAYA_PROGRESSION`, `PARIVARTANA_YOGA`, and `CAREER_YOGA_STRUCTURE`, and confirm the P2-06 evidence contract is frozen. Do not add speculative rules.
5. **Wealth Option B lord/karaka linkage — OWNER-BLOCKED:** Pending the Wealth spec; adopted Option A house-only linkage remains unchanged.

## Vimshottari Horizon-Clipping and Validation Regression

- **Change commit:** `19799883fa43ec163058979794ccc4c9c6ad9704`
- **Toolchain:** Node `20.19.4`
- **Changes:** Horizon-clipped ordinary Mahadashas retain full-period AD/PD anchors; a skipped sub-millisecond birth-lord candidate does not transfer its fractional balance to the next lord. Explicit-zone ISO-8601 input validation, external timeline structure checks, and numerical/boundary regression tests were added. The selected-period golden fixture was updated for the anchored clipped-AD boundary.
- **Verification on the exact change commit above:**
  - ✅ `npx vitest run src/engine/dasha/vimshottari.test.ts`: PASS (1 test file, 99 tests)
  - ✅ `npx vitest run src/engine/dasha/reference/dashaMahadasha.test.ts src/engine/dasha/reference/dashaSubPeriods.test.ts src/engine/dasha/reference/dashaMoonAnchor.test.ts`: PASS (3 test files, 47 passed, 3 skipped)
  - ✅ `npx vitest run src/engine/astroEngine.test.ts`: PASS (1 test file, 49 tests)
  - ✅ `npx vitest run src/engine/dasha/reference/dashaSubPeriods.test.ts src/engine/dasha/invariants/timelineContinuity.test.ts`: PASS (2 test files, 42 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run verify:pba10`: PASS (6 test files, 124 tests; lint and build passed)
  - ✅ `npm run verify`: PASS (297 test files, 5,586 passed, 5 skipped; lint and build passed)
- Both builds emitted the existing large-chunk-size warning. No Node 21 / lightningcss blocker occurred.

## Canonical Wealth Evidence Source Types

- **Source change commit:** `b8f7639b3f4c7c26003687495786a9aee5cde5c3`
- **Toolchain:** Node `20.19.4`, npm `10.5.0`
- **Verification for the exact source change commit above:**
  - ✅ Focused Wealth mapper and Why-experience suites (`src/domain/wealth/wealthEvidenceMapper.test.ts`, `src/product/life-analysis/lifeAnalysisWhy.test.ts`): PASS (2 files, 50 tests)
  - ✅ TypeScript (`npx tsc --noEmit` under Node 20.19.4): PASS
  - ✅ `npm run lint` under Node 20.19.4: PASS
  - ✅ `npm run verify` under Node 20.19.4: PASS (309 test files, 5,723 passed, 4 skipped; lint and production build passed; `verify:bundle` rebuilt and scanned client assets)

Wealth natal 2nd/5th/9th/11th house and lord evidence now maps to `STRUCTURAL`; explicit D2/varga evidence maps to `VARGA` with `source: 'D2'`. Source classification preserves the existing transit → varga → Dasha precedence and leaves planet, strength, aspect, yoga, and other mappings unchanged. A natal-only input does not produce D2 or VARGA evidence. Fixture-ID assertions verify evidence identity preservation. Wealth promise, activation, and evidence-ID behavior remain unchanged. The production build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

## Remote AI Browser/Server Boundary (PR-015 / PR-016)

**Source change commit:** `dbf814f7e1e2aef00a6e04a3b299f03c7d9ad5a1`

**Toolchain:** Node `20.19.4`

**Verification for the exact source change commit above:**
- ✅ `npx vitest run src/ai/security/remoteProviderPolicy.test.ts`: PASS (1 file, 5 tests)
- ✅ `npx vitest run src/ai/routing`: PASS (5 files, 34 tests)
- ✅ `npx vitest run src/ai`: PASS (28 files, 328 tests)
- ✅ `npx vitest run src/ai/security/browserBoundary.test.ts`: PASS (1 file, 2 tests; browser import graph and bundle/config checks)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run lint`: PASS
- ✅ `npm run build`: PASS; production JavaScript bundle scan found no provider credential names, synthetic credential marker, or remote-provider construction identifiers
- ✅ `npm run verify`: PASS (307 files, 5,686 passed, 5 skipped; lint and production build passed)

The full AI barrel remains the server/provider integration surface; React/product consumers use the browser-safe `src/ai/browser.ts` surface. Its transitive relative import graph does not reach the remote, OpenAI, or reliability modules, and Vite does not inject provider-key configuration. The fail-closed remote provider policy denies browser runtime before feature/proxy checks and reads no credentials or network state.

PR-016 is documented as a contract only; no backend, database, or account system was added. PR-017 (server proxy implementation) is **DEFERRED**. The P-026 local-only launch contract remains unchanged, and remote AI is not a launch dependency. The production build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

## Browser Bundle Verification Hardening

**Source change commit:** `550e4720d0208e6d4ec4d29094e3064501b87f61`

**Toolchain:** Node `20.19.4`

**Verification for the exact source change commit above:**
- ✅ `npx vitest run src/ai/security/browserBoundary.test.ts`: PASS (1 file, 2 tests; executed with Node 20.19.4)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run lint`: PASS
- ✅ `npm run build` followed by `npx vitest run src/ai/security/browserBoundary.test.ts`: PASS; scan ran against fresh `dist/assets`
- ✅ `npm run verify`: PASS (307 files, 5,686 passed, 5 skipped; includes `verify:bundle`, which rebuilds and then runs the required scan)

The source import walker now covers static and dynamic relative imports and `.js`/`.mjs` resolution (bare/path-aliased imports are outside the regex walk); the emitted-bundle scan checks all client JavaScript assets and fails if the assets directory or JavaScript outputs are missing. The scan covers provider credential names, the synthetic test marker, and remote/OpenAI provider construction identifiers. `productAnalysisTypes.ts` now references the browser-safe `AiExplanationResult` type. The build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

## Career Profession Status Presentation (PR-018)

**Source change commit:** `ca4a6844076f7168cfea4972bd0ee5a086246a69`

**Toolchain:** Node `20.19.4`

**Verification for the exact source change commit above:**
- ✅ `npx vitest run src/product/analysis/careerQualificationPresentation.test.ts src/product/analysis/__tests__/careerViewModel.test.ts src/components/career/CareerProfessionStatusSection.test.tsx src/pages/__tests__/CareerPage.test.tsx`: PASS (4 files, 28 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run lint`: PASS
- ✅ `npm run verify`: PASS (309 files, 5,695 passed, 5 skipped; lint and production build passed; `verify:bundle` rebuilt and scanned the client)

Profession status presentation preserves the existing `COMPLETE`, `PARTIAL`, and `INSUFFICIENT_DATA` values, displays each original machine status alongside additive explanatory copy, and explicitly avoids translating partial/insufficient profession analysis into a negative career conclusion. `PARTIAL` is not treated as `MIXED`; profession-level insufficient data is not represented as pattern-level missing evidence. The product profession-status type is constrained to its existing three-value status contract; runtime classifications are unchanged.

**Deferred by owner decision:** The four-state pattern qualification mapper (`UNAVAILABLE`, `INSUFFICIENT_DATA`, `NOT_ASSESSED`, `MIXED`) is not implemented or wired because the canonical pattern-level result is not currently exposed to a product UI surface. Selected-period `CANONICAL` / `PROVISIONAL` / `UNAVAILABLE` qualification status remains unchanged and is not equated with pattern-level qualification. Implement the four-state copy only when its actual canonical input is available at the UI boundary. No domain classifiers, qualification rules, mechanism resolvers, Dasha, or C9 code were changed.

## Career Profession Missing-Input Labels

**Source change commit:** `0a1871e8dbd40c34c644f8945c979da363b88891`

**Toolchain:** Node `20.19.4`

**Verification for the exact source change commit above:**
- ✅ `npx vitest run src/components/career/CareerProfessionStatusSection.test.tsx src/product/analysis/careerQualificationPresentation.test.ts src/pages/__tests__/CareerPage.test.tsx`: PASS (3 files, 22 tests)
- ✅ `npx tsc --noEmit`: PASS
- ✅ `npm run lint`: PASS
- ✅ `npm run verify`: PASS (309 files, 5,703 passed, 5 skipped; lint and production build passed; `verify:bundle` rebuilt and scanned the client)

The profession status panel preserves its generic status explanation and conditionally lists the known missing engine inputs with human-readable labels. Unknown keys display as their original strings. Tests cover empty and populated lists, known mappings, fallback, and the existing no-negative-prediction assertion with missing inputs present. No domain classification or status determination changed. The production build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.
- **Reference-data status remains BLOCKED:** `D08-A1` remains skipped; no external ephemeris values were added. Partial-MD and MD/AD/PD analytical fixtures remain internal-consistency checks only, not independent astronomical validation.

## Vimshottari Timeline Structural and Precision Contracts

- **Change commit:** `63073ed5493359133f5a800bc5711b3a65752a0d`
- **Toolchain:** Node `20.19.4`
- **Named precision-policy invariant — Millisecond-Representable Contiguous Timeline:** A birth-lord balance whose end is not after its start at ECMAScript `Date` millisecond precision is intentionally skipped; the timeline begins at the next representable period. An empty timeline is appropriate only when the requested horizon is the birth instant.
- **Structural validation:** `getActiveDasha` now validates timeline metadata, non-empty MD/AD child lists, interval positivity and containment, sibling contiguity/order, and canonical planetary successor chains. Order is anchored to the first observed period to allow left-clipped anchored subperiods and the no-inheritance birth-lord skip. Final horizon-clipped sequences may be partial.
- **Numerical/input conventions:** The Nakshatra `1e-12°` epsilon is an implementation tolerance for floating-point boundary representation, not an astronomical uncertainty estimate; values within epsilon immediately below an internal boundary are assigned to the next Nakshatra. Vimshottari input accepts ISO-8601 date-times with `Z` or offsets through ±23:59; fractional input precision is accepted while ECMAScript Date retains milliseconds, leap seconds are not representable, and output is canonicalized to UTC with `toISOString()`.
- **Reference-data status remains BLOCKED:** The 365.25-day Vimshottari year and current analytical fixtures remain internal engine conventions and are NOT independently astronomically validated. External Moon-anchor `D08-A1` and independent MD/AD/PD boundary parity remain reference-data-blocked pending Swiss Ephemeris / JPL Horizons capture. `D08-A1` remains skipped; no external values were fabricated.
- **Verification on the exact change commit above:**
  - ✅ `npx vitest run src/engine/dasha/vimshottari.test.ts`: PASS (1 test file, 107 tests)
  - ✅ `npx vitest run src/engine/dasha/reference/dashaSubPeriods.test.ts src/engine/dasha/reference/dashaMahadasha.test.ts src/engine/dasha/invariants/timelineContinuity.test.ts`: PASS (3 test files, 62 tests)
  - ✅ `npx vitest run src/engine/dashaInterpretation/dashaInterpretation.test.ts`: PASS (1 test file, 65 tests)
  - ✅ `npx vitest run src/engine/astroEngine.test.ts src/engine/solarTime.test.ts`: PASS (2 test files, 59 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run verify:pba10`: PASS (6 test files, 124 tests; lint and build passed)
  - ✅ `npm run verify`: PASS (297 test files, 5,594 passed, 5 skipped; lint and build passed)
- Both builds emitted the existing large-chunk-size warning. No Node 21 / lightningcss blocker occurred.

## D2 Evidence Provenance Attribution

- **Source change commit:** `1ba5ec921f239987454f8c16b67c5fde32445b25`
- **Toolchain:** Node `20.19.4`
- **Verification for the exact source change commit above:**
  - ✅ `npx vitest run src/domain/wealth/manifestation/wealthManifestationSynthesis.test.ts src/domain/wealth/WealthDomainInterpreterV2.test.ts src/product/life-analysis/lifeAnalysisWhy.test.ts`: PASS (3 files, 84 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run lint`: PASS
  - ✅ `npm run verify`: PASS (309 test files, 5,724 passed, 4 skipped; lint and production build passed; `verify:bundle` rebuilt and scanned the client)

D2 manifestation factors now attribute evidence IDs only when an evidence item's `source` is explicitly `D2`. The regression test confirms explicit D2 IDs are included and `VARGA`-classified evidence with non-D2 source provenance is excluded. D2 relationship evaluation, confirmation/conflict factors, weights, and rules are unchanged. The production build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

## Phase 6 PR-035 — Temporal Contract and Clock Injection

- **Source change commit:** `6d9b4241d92b8360e22f25e79fbf7a69f23902b3`
- **Toolchain:** Node `20.19.4`
- **Verification for the exact source change commit above:**
  - ✅ `npx vitest run src/core/analysis/analysisContext.test.ts`: PASS (1 file, 16 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run lint`: PASS
  - ✅ `npm run verify`: PASS (309 test files, 5,730 passed, 4 skipped; lint, production build, and bundle scan passed)

`normalizeAsOf` and `createAnalysisContext` now accept an injected optional clock; omitted `asOf` uses `clock.now()`, while explicit normalization and the existing invalid-input catch contract remain unchanged. The Phase 6 temporal contract documents UTC normalization, display timezone policy, half-open intervals, no clamping, reproducibility metadata, and that no default forecast horizon is yet owner-approved. Forecast production wiring remains gated.

## Phase 6 PR-036 — Clock Through Product Analysis Service

- **Source change commit:** `4a6dbd058574e5e07bd6ef3d8565cb7dc85cb6f7`
- **Toolchain:** Node `20.19.4`
- **Verification for the exact source change commit above:**
  - ✅ `npx vitest run src/product/analysis/__tests__/productAnalysisService.test.ts src/product/analysis/__tests__/productAnalysisTemporal.test.ts src/product/analysis/productAnalysisService.integration.test.ts`: PASS (3 files, 51 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run lint`: PASS
  - ✅ `npm run verify`: PASS (309 test files, 5,734 passed, 4 skipped; lint, production build, and bundle scan passed)

The service resolves one context per run using the optional injected clock and passes that same context through analysis. Explicit `asOf` bypasses the clock; caller context is passed through unchanged, and a conflicting explicit `asOf` returns an analysis `ERROR` rather than being ignored. Historical and future instants remain unclamped, and temporal-resolution failures retain the existing `ERROR` path. The production build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.

## Phase 6 PR-037 — Selected-Period View Model

- **Source change commit:** `f388e83408462689d758671bd5e8f1b91ae3d792`
- **Toolchain:** Node `20.19.4`
- **Verification for the exact source change commit above:**
  - ✅ `npx vitest run src/product/analysis/selectedPeriodViewModel.test.ts`: PASS (1 file, 6 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run lint`: PASS
  - ✅ `npm run verify`: PASS (310 test files, 5,740 passed, 4 skipped; lint, production build, and bundle scan passed)

The product view model projects LOADING/ERROR/EMPTY/READY states, validates Mahadasha and nested Antardasha IDs only against the current `ProductDashaPeriodOptions`, and returns the selected canonical interval. Unknown, invalid, mismatched, or refreshed-away IDs cannot enable submission. The API is exported from the product analysis barrel.

## Phase 6 PR-038 — Selected-Period Selector UI

- **Source change commit:** `141ca8eea4a169d4f3da4ba9460ff8296e767b41`
- **Toolchain:** Node `20.19.4`
- **Verification for the exact source change commit above:**
  - ✅ `npx vitest run src/core/analysis/analysisContext.test.ts src/product/analysis/__tests__/productAnalysisService.test.ts src/product/analysis/__tests__/productAnalysisTemporal.test.ts src/product/analysis/productAnalysisService.integration.test.ts src/product/analysis/selectedPeriodViewModel.test.ts src/components/dasha/__tests__/DashaComponents.test.tsx src/pages/__tests__/DashaPage.test.tsx`: PASS (7 files, 115 tests)
  - ✅ `npx tsc --noEmit`: PASS
  - ✅ `npm run lint`: PASS
  - ✅ `npm run verify`: PASS (310 test files, 5,744 passed, 4 skipped; lint, production build, and bundle scan passed)

The existing `SelectedPeriodSection` consumes the selected-period view model, retains accessible labels/fieldset behavior and visible diagnostics, clears AD on MD changes, formats displayed boundaries in UTC, and revalidates against current options immediately before submit. DashaPage remains the owning page; failed submissions and mismatched selections do not render stale reports. No `ProductPageRouter` expansion was made. The PR-039/PR-040 evaluator/horizon gate remains unresolved; no forecast engine was wired into production and no forecast series were added. The production build emitted the existing large-chunk-size warning; no Node 21 / lightningcss blocker occurred.
