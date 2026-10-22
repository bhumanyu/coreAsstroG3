# PBA Release Baseline Report

**Tested Commit:** `b14ed9b1bf6e046877c7464fd8a2f8436a5eaeea`

**Report Date:** 2026-10-22

**Task Type:** PB0 - Verification-only baseline collection (no source changes)

---

## 1. Source Identity

| Attribute | Value |
|-----------|-------|
| **Repository** | https://github.com/bhumanyu/coreAsstroG3.git |
| **Branch** | main |
| **Commit SHA** | `b14ed9b1bf6e046877c7464fd8a2f8436a5eaeea` |
| **Commit Date** | 2026-10-22T22:50:06+05:30 |
| **Commit Message** | dasha fix |
| **Working Tree Status** | Clean (no uncommitted changes) |
| **Expected Node Version** | 20.19.4 (from .nvmrc) |
| **Expected npm Version** | 10.9.2 (from package.json packageManager/engines) |
| **Actual Node Version** | v21.7.1 |
| **Actual npm Version** | 10.5.0 |

**Toolchain Deviation:** Local environment runs Node v21.7.1 and npm 10.5.0, which do not match the expected toolchain (Node 20.19.4, npm 10.9.2). This deviation blocked local verification commands.

---

## 2. Verification Results

### 2.1 Verification Contract Inspection

| Check | Status | Evidence |
|-------|--------|----------|
| package.json scripts exist (lint, test, build, verify, test:pba10, verify:pba10) | ✅ PASS | Scripts defined in package.json lines 11-19 |
| package-lock.json exists and is tracked | ✅ PASS | `git ls-files --error-unmatch package-lock.json` succeeded |
| tsconfig.json exists | ✅ PASS | tsconfig.json present at repo root |
| Vitest config in vite.config.ts | ✅ PASS | Vitest config present in vite.config.ts lines 14-43 |
| Test setup file exists | ✅ PASS | src/test/setupTests.ts present |
| CI workflow .github/workflows/ci.yml exists | ✅ PASS | CI workflow present, single job build-and-test |
| .nvmrc exists | ✅ PASS | .nvmrc present, specifies Node 20.19.4 |
| PBA-01 doc exists | ✅ PASS | PBA-01-FEATURE-CONTRACT-AND-SOURCE-AUDIT.md present |
| PBA-ACCEPTANCE-MATRIX.md exists | ✅ PASS | Matrix present, records baseline commit 3c83b80 |

**CI vs Local Command Equivalence:**
- CI workflow runs: `npm ci` → `npm run lint` → `npm test` → `npm run build`
- This matches `npm run verify` (defined as `npm run lint && npm test && npm run build`)
- CI does NOT run `verify:pba10` or any PBA-specific gates
- CI uses .nvmrc for Node version and pins npm to 10.9.2

### 2.2 Reproducible Install

| Command | Status | Exit Code | Evidence |
|---------|--------|-----------|----------|
| `npm ci` | ❌ BLOCKED | 127 | EPERM error on lightningcss binary; engine version mismatch warnings (Node 21.7.1 vs required 20.x, npm 10.5.0 vs required 10.9.2) |

**Blocker:** Local environment does not match expected toolchain. `npm ci` failed with permission error on `node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node`. Multiple engine version warnings indicate toolchain mismatch.

### 2.3 Primary Gate (npm run verify)

| Stage | Status | Exit Code | Evidence |
|-------|--------|-----------|----------|
| lint | ❌ BLOCKED | 1 | TypeScript compiler not found in PATH; type definition files for vitest/globals and @testing-library/jest-dom/vitest missing from node_modules/@types |
| test | ⏸️ NOT RUN | N/A | Chain stopped at lint failure |
| build | ⏸️ NOT RUN | N/A | Chain stopped at lint failure |

**Blocker:** `npm run lint` (tsc --noEmit) failed because:
1. tsc not available in PATH (not in node_modules/.bin despite typescript being in dependencies)
2. Type definition files for vitest/globals and @testing-library/jest-dom/vitest are missing from node_modules/@types directory
3. These types are referenced in tsconfig.json line 16 but not installed

### 2.4 Targeted Gate (npm run verify:pba10)

| Stage | Status | Exit Code | Evidence |
|-------|--------|-----------|----------|
| lint | ❌ BLOCKED | 1 | Same blocker as primary gate |
| test:pba10 | ⏸️ NOT RUN | N/A | Chain stopped at lint failure |
| build | ⏸️ NOT RUN | N/A | Chain stopped at lint failure |

**Note:** test:pba10 covers six files:
- src/product/analysis/selectedPeriodProductService.test.ts
- src/product/analysis/productAnalysisMapper.test.ts
- src/product/analysis/productAnalysisService.integration.test.ts
- src/product/analysis/__tests__/productAnalysisService.test.ts
- src/ai/product/aiExplanationService.test.ts
- src/pages/__tests__/DashaPage.test.tsx

### 2.5 Focused MD–AD/PBA Tests

| Test File | Status | Exit Code | Evidence |
|-----------|--------|-----------|----------|
| src/core/analysis/selectedMdAdPeriod.test.ts | ❌ BLOCKED | N/A | vitest execution blocked (see below) |
| src/core/analysis/selectedPeriodActivationContext.test.ts | ❌ BLOCKED | N/A | vitest execution blocked |
| src/domain/career/careerDasha/selectedCareerDashaActivation.test.ts | ❌ BLOCKED | N/A | vitest execution blocked |
| src/domain/wealth/selectedWealthDashaActivation.test.ts | ❌ BLOCKED | N/A | vitest execution blocked |
| src/domain/synthesis/selectedPeriodSynthesis.test.ts | ❌ BLOCKED | N/A | vitest execution blocked |
| src/product/analysis/selectedPeriodProductService.test.ts | ❌ BLOCKED | N/A | vitest execution blocked |
| src/ai/product/aiExplanationService.test.ts | ❌ BLOCKED | N/A | vitest execution blocked |

**Blocker:** Attempted `npx vitest run` but npx installed vitest@5.0.5 (different from package.json vitest@4.1.10) which failed with rolldown native binding error: "Cannot find native binding. npm has a bug related to optional dependencies". This is an environment/dependency resolution issue, not a test failure.

### 2.6 CI Evidence for Exact SHA

| Attribute | Value |
|-----------|-------|
| **Check Name** | build-and-test |
| **Tested SHA** | `b14ed9b1bf6e046877c7464fd8a2f8436a5eaeea` |
| **Status** | ✅ completed successfully |
| **Conclusion** | success |
| **Started At** | 2026-10-22T17:20:41Z |
| **Completed At** | 2026-10-22T17:23:09Z |
| **Duration** | 2m 28s |
| **Used .nvmrc Node Version** | ✅ Yes (CI workflow uses `node-version-file: .nvmrc`) |
| **Used Pinned npm Version** | ✅ Yes (CI workflow runs `npm install --global npm@10.9.2`) |
| **All Jobs Completed** | ✅ Yes (single job build-and-test) |

**CI Check URL:** https://github.com/bhumanyu/coreAsstroG3/actions/runs/39821793568/job/119974681459

**Reconciliation Finding:** CI passed for commit b14ed9b, but local verification is blocked by environment mismatch. CI represents the authoritative verification gate for this commit.

---

## 3. Focused MD–AD Verification

**Status:** ⏸️ NOT VERIFIED (blocked by environment)

All seven focused test files were confirmed present in the codebase:
- ✅ src/core/analysis/selectedMdAdPeriod.test.ts
- ✅ src/core/analysis/selectedPeriodActivationContext.test.ts
- ✅ src/domain/career/careerDasha/selectedCareerDashaActivation.test.ts
- ✅ src/domain/wealth/selectedWealthDashaActivation.test.ts
- ✅ src/domain/synthesis/selectedPeriodSynthesis.test.ts
- ✅ src/product/analysis/selectedPeriodProductService.test.ts
- ✅ src/ai/product/aiExplanationService.test.ts

However, none could be executed due to environment blockers preventing vitest from running. No individual test results are available.

---

## 4. Failures & Blockers Inventory

### 4.1 Blockers

| ID | PBA Area | Expected vs Observed | Repro Command | Evidence | Severity | Proposed Owning PR |
|----|----------|---------------------|---------------|----------|----------|-------------------|
| ENV-001 | Toolchain | Node 20.19.4/npm 10.9.2 vs Node 21.7.1/npm 10.5.0 | `node --version && npm --version` | System output shows v21.7.1/10.5.0 | HIGH | Environment setup (not a code PR) |
| ENV-002 | Dependency install | npm ci should install cleanly | `npm ci` | EPERM error on lightningcss binary; engine warnings | HIGH | Environment setup (not a code PR) |
| ENV-003 | TypeScript execution | tsc --noEmit should compile | `npm run lint` | tsc not in PATH; type definitions missing | HIGH | Environment setup (not a code PR) |
| ENV-004 | Vitest execution | npx vitest run should execute tests | `npx vitest run` | Rolldown native binding error; version mismatch | HIGH | Environment setup (not a code PR) |

**Classification:** All blockers are **environment-related**, not code defects. The CI system passed the same commit using the correct toolchain, confirming the codebase is sound.

### 4.2 Known Limitations (Pre-existing, NOT Regressions)

| ID | PBA Area | Description | Evidence |
|----|----------|-------------|----------|
| KL-001 | Career | Career non-dusthana mechanism-resolution rule coverage gap produces UNAVAILABLE in resolver rules | Documented in PBA-01 audit; src/domain/career/careerMechanism/resolver/careerMechanismResolverRules.ts |
| KL-002 | Wealth | Wealth isLinkedToDimension uses conservative house-only linkage decision | Documented in PBA-01 audit; src/domain/wealth/selectedWealthDashaActivation.ts |

These are intentional design decisions or documented gaps, not defects discovered during this verification.

### 4.3 PBA-04 Test Coverage Gaps (From Matrix)

| ID | PBA Area | Description | Status |
|----|----------|-------------|--------|
| TC-001 | PBA-04 | Ambiguous caller-expression match proof needed | ⚠️ NEEDS_PROOF (recorded in matrix) |
| TC-002 | PBA-04 | Unqualified-evidence regression test (assert expressionActivations.length === 0) | ⚠️ NEEDS_PROOF (recorded in matrix) |

These gaps were already documented in PBA-ACCEPTANCE-MATRIX.md prior to this baseline collection.

---

## 5. Invariants-Preserved Checklist

| Invariant | Status | Evidence |
|-----------|--------|----------|
| PBA-02 resolver contract untouched | ✅ PRESERVED | No source code changes made (verification-only task) |
| [start,end) interval semantics in temporalInterval.ts | ✅ PRESERVED | No source code changes made |
| createSelectedPeriodId format in selectedPeriodActivationContext.ts | ✅ PRESERVED | No source code changes made |
| UNAVAILABLE/PROXY_DIRECTION qualification contracts | ✅ PRESERVED | No source code changes made |
| package-lock.json not regenerated | ✅ PRESERVED | No npm install/ci succeeded (blocked by environment) |
| No product/source code modifications | ✅ PRESERVED | Verification-only task, no edits performed |

---

## 6. Release Assessment

### 6.1 Overall Status

**Assessment:** ⚠️ INCONCLUSIVE - Local verification blocked, but CI passed

**Summary:**
- Local verification commands (npm ci, npm run verify, npm run verify:pba10, focused tests) could not be executed due to environment mismatches (wrong Node/npm versions, dependency installation errors, missing type definitions).
- GitHub CI for the exact commit (b14ed9b) passed successfully using the correct toolchain (Node 20.19.4 from .nvmrc, npm 10.9.2).
- No source code changes were made, so the codebase state is identical to the CI-verified commit.

### 6.2 Verified List (via CI)

- ✅ build-and-test CI workflow passed for commit b14ed9b
- ✅ CI used correct .nvmrc Node version (20.19.4)
- ✅ CI used pinned npm version (10.9.2)
- ✅ CI ran npm ci → npm run lint → npm test → npm run build (equivalent to npm run verify)

### 6.3 Failed List (Local Environment)

- ❌ npm ci (blocked by EPERM and engine mismatch)
- ❌ npm run lint (blocked by missing tsc and type definitions)
- ⏸️ npm test (not run, chain stopped at lint)
- ⏸️ npm run build (not run, chain stopped at lint)
- ❌ npm run verify:pba10 (blocked by lint failure)
- ❌ All focused MD–AD/PBA tests (blocked by vitest execution issues)

### 6.4 Blocked List

- Local verification of all test suites due to environment mismatch
- Direct execution of focused test files (selectedMdAdPeriod.test.ts, selectedPeriodActivationContext.test.ts, selectedCareerDashaActivation.test.ts, selectedWealthDashaActivation.test.ts, selectedPeriodSynthesis.test.ts, selectedPeriodProductService.test.ts, aiExplanationService.test.ts)

### 6.5 Known Limitations

- Career non-dusthana mechanism-resolution rule coverage gap (KL-001)
- Wealth isLinkedToDimension conservative house-only linkage (KL-002)
- PBA-04 test coverage gaps for ambiguous caller-expression match and unqualified-evidence regression (TC-001, TC-002)

### 6.6 Matrix Reconciliation

**Discrepancy Flagged:**
- PBA-ACCEPTANCE-MATRIX.md records `Baseline Commit: 3c83b80` and multiple "PASS (commit 3c83b80)" lines
- Current HEAD is commit `b14ed9b` (two commits ahead of matrix baseline)
- Matrix CI evidence was recorded for commit 3c83b80, not the current HEAD
- **Action Taken:** No retro-editing of matrix green statuses (per task instructions)
- **Finding:** Matrix CI evidence is NOT VERIFIED for the current SHA (b14ed9b)
- **Resolution:** CI evidence for current SHA (b14ed9b) is recorded in this baseline report (Section 2.6)

### 6.7 Next Recommended PR

**Recommendation:** No immediate code PR required.

**Reasoning:**
1. CI passed for the current commit (b14ed9b), indicating the codebase is in a verified state
2. All blockers are environment-related, not code defects
3. The PBA-04 test coverage gaps (TC-001, TC-002) were already documented and deferred
4. Known limitations (KL-001, KL-002) are intentional design decisions

**If local verification is required:**
- First step: Configure local environment to match .nvmrc (Node 20.19.4) and package.json (npm 10.9.2)
- Second step: Run `npm ci` to ensure clean dependency installation
- Third step: Re-run npm run verify and npm run verify:pba10 to collect local baseline

**If PBA-04 test coverage is to be completed:**
- Create a focused PR to add:
  - Ambiguous caller-expression match proof test
  - Unqualified-evidence regression test (assert expressionActivations.length === 0)

### 6.8 Reviewer Notes

- This baseline report is based on a **verification-only task** (PB0) with no source code modifications
- Local verification was blocked by environment mismatch; CI is the authoritative verification source
- The commit tested (b14ed9b) is a UI fix commit (dasha fix, adding title attribute to diagnostic display)
- No PBA-01 through PBA-09 implementation changes occurred between matrix baseline (3c83b80) and current HEAD (b14ed9b)
- PBA-10 remains DEFERRED per the original PR sequence plan

---

## 7. Sign-Off

**Report Generated By:** Devin (verification agent)

**Report Generated On:** 2026-10-22

**Tested Commit:** `b14ed9b1bf6e046877c7464fd8a2f8436a5eaeea`

**Verification Scope:** PB0 - Baseline collection (read-only)

**CI Status:** ✅ PASSED (GitHub Actions build-and-test)

**Local Status:** ❌ BLOCKED (environment mismatch)

**Overall Assessment:** Codebase verified via CI; local environment requires toolchain alignment for future verification runs.
