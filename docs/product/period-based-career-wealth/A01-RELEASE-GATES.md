# A01 — Career & Wealth Release Gates

**Purpose:** Define verifiable acceptance gates for the CoreAstroG3 Career and Wealth assurance programme. These gates complement, and do not replace, the repository's calculation release gates RG-01–RG-14.

## 1. Status vocabulary

| Status | Meaning |
|---|---|
| PASS | Required evidence exists for the exact candidate SHA and all pass criteria are met |
| FAIL | A required assertion or command failed |
| BLOCKED | A required dependency/evidence source is unavailable or cannot be validated |
| NOT_RUN | Validation was not executed |
| NOT_APPLICABLE | Explicitly excluded with documented rationale and owner approval |

Never translate missing evidence, unavailable data, skipped tests, or an unobserved CI run into PASS.

## 2. Non-negotiable architecture guardrails

1. **Single Career authority:** C11 remains the canonical Career final synthesis.
2. **Single Wealth authority:** CW-05 remains the canonical Wealth final synthesis.
3. **Single temporal authority:** `resolveAnalysisTemporalState` owns active temporal/Dasha resolution.
4. **Single product orchestration:** `runLifeAnalysisProduct` invokes domain reasoning once and passes precomputed outputs downstream.
5. **AI isolation:** AI is a downstream explanation/presentation consumer; it cannot feed back into deterministic domain conclusions.
6. **Evidence identity:** semantic/root identity and occurrence/provenance identity remain distinct.
7. **Missing-state preservation:** UNAVAILABLE, INSUFFICIENT_DATA, PARTIAL and BLOCKED must not be silently mapped to success, neutral, or negative evidence.
8. **No fabricated certainty:** no unvalidated probability, guaranteed event, or unsupported financial fact may be introduced.
9. **Versioned evidence:** each validation result identifies exact source SHA and relevant toolchain.
10. **Truthful reporting:** static review, local tests, integration tests, CI, and manual UI verification are reported separately.

## 3. Gate 0 — Baseline reproducibility

**Purpose:** Establish exact source and validation environment.

Required evidence:
- Repository, branch and candidate commit SHA.
- Clean checkout/worktree evidence.
- Node version from `.nvmrc` (22.20.0) and npm version (10.9.2).
- SHA-256 of `package-lock.json` computed from the candidate checkout.
- Exact commands, exit codes and timestamps.
- Vitest file/test totals including skipped/failed counts.
- Build and bundle-test result.
- CI run URL and conclusion for the same candidate SHA.

Run from a clean repository checkout:

```bash
node --version
npm --version
git rev-parse HEAD
git status --short
git ls-files --error-unmatch package-lock.json
npm ci
npm run lint
npm test
npm run verify:bundle
```

Optionally run `npm run verify` as a separate aggregate; it repeats lint and standard tests before the bundle gate. Do not report CI's `verify:bundle` as if it ran `npm run verify`.

Pass only when source/toolchain are identified, installation/typecheck/tests/build/bundle tests pass, and CI for the same SHA passes required jobs. If current-SHA execution evidence is absent, mark NOT_RUN. Historical results from another SHA do not satisfy this gate.

## 4. Gate 1 — Canonical architecture and analytical trust

**Purpose:** Verify that Career and Wealth outputs use the intended deterministic authorities.

Required PR work:
- A01 Functional Assurance Baseline.
- A02 Canonical Career/Wealth Independence Gate.
- A03 Root-Fact and Occurrence Identity.
- A04 Fail-Fast Analysis Context / immutable `asOf`.
- A05 Dasha Authority and Temporal Regression.
- A06 AI Execution Independence and Grounding.
- A07 Career C11 Confidence and Coverage Correction.
- A08 D2 Unavailability Guardrails (until D2 is separately validated).
- A09 End-to-End Reasoning Trace Validation.
- B03 D1/D10 Hierarchy Acceptance.

Required assertions:

### Career and Wealth authority
- Career final synthesis resolves through C11 only.
- Wealth final synthesis resolves through CW-05 only.
- Legacy theme perturbation/throwing does not alter canonical conclusions.
- Compatibility-only legacy use is isolated and documented.

### Temporal consistency
- One validated `AnalysisContext.asOf` is used for the analysis.
- `resolveAnalysisTemporalState` resolves the active temporal state.
- Conflicting embedded active Dasha cannot override canonical recalculation.
- Failed temporal resolution does not fall back to stale active Dasha.
- Career, Wealth, selected-period and AI consumers use canonical temporal state.

### Evidence identity and traceability
- Root-fact identity and occurrence identity are distinct.
- Duplicate root facts do not inflate evidence weight.
- Distinct occurrences remain traceable.
- Duplicate occurrence IDs fail closed.
- Provenance links resolve to valid source evidence.
- Conclusions trace to domain evidence and source rules.

### Confidence and unavailable states
- Promise strength is separate from confidence.
- Missing material layers affect confidence according to explicit policy.
- Unavailable data does not become PASS or negative evidence.
- D2 remains unavailable in canonical Wealth synthesis until calculation and interpretation gates are approved.

### AI boundary
- Actual `runAiExplanation` execution path is tested.
- AI receives canonical evidence and temporal state.
- AI failure does not invalidate deterministic Career/Wealth results.
- AI output cannot mutate C11 or CW-05.

### D1/D10 hierarchy
- D1 establishes natal promise.
- D10 qualifies Career expression.
- D10 cannot create natal Career promise unsupported by D1.
- Missing D10 remains explicit and does not become PASS.

Pass only when required PRs have focused tests plus integration/contract tests and the candidate SHA passes typecheck, relevant unit/integration/golden tests, standard suite and CI. Deferred surfaces remain explicitly BLOCKED or NOT_APPLICABLE.

## 5. Gate 2 — Career and Wealth capability completeness

**Purpose:** Ensure expanded analytical capabilities have typed evidence contracts, missing-state behavior and representative golden tests.

### Career workstream
- B01 Independent Career Analytical Axes.
- B02 Career Outcome and Success Qualification.
- B03 D1/D10 Hierarchy Acceptance.
- B04 Profession Recommendation Ranking.
- B05 Corporate/Entrepreneurship Dual Potential.
- B06 Event-Specific Career Timeline.

Test categories:
- Positive, negative, mixed/conflicting evidence.
- Missing required and partial optional evidence.
- D1 strong with D10 weak/missing.
- Promise without activation and activation without promise.
- Deterministic tie-breaking/ranking.
- Corporate dominant, entrepreneurial dominant, dual, sequential, conditional and unresolved outcomes.
- Event-specific candidate window and no-promise negative case.
- No guarantee or unsupported probability.

### Wealth workstream
- C01 Wealth Financial Concepts and Data Contract.
- C02A D2 Calculation Contract.
- C02B D2 Interpretation and Wealth Integration.
- C03 Speculative Propensity/Risk Exposure/Suitability Separation.
- C04 Wealth Lifecycle and Event Timing.
- C05 Wealth Risk and Confidence Qualification.

Test categories:
- Accumulation, Gains, Fortune and Speculation dimensions.
- Astrological indication vs user-reported fact vs calculated metric.
- No income/assets/debt/liquidity/net-worth inference from horoscope.
- D2 boundary and golden calculation cases.
- D2 interpretation only after C02A approval.
- Speculative propensity separate from exposure and suitability.
- No buy/sell/hold/options/leverage/expected-return recommendation.
- Lifecycle event requires natal indication and activation.
- Dasha-only event must not pass.
- Risk categories and INSUFFICIENT_DATA.
- No unvalidated numeric probability.

## 6. Gate 3 — Product and user-facing acceptance

**Purpose:** Ensure product/UI outputs faithfully represent deterministic domain state.

Required assertions:
- Product view model is derived from canonical product/domain outputs.
- UI does not independently invoke domain interpreters or calculate active Dasha.
- Career and Wealth status, confidence, evidence and limitations are visible and consistent.
- Unavailable/partial/blocked states remain explicit in UI and API.
- AI explanation is optional and cannot overwrite deterministic results.
- Period labels and dates are consistent with canonical temporal state.
- Golden product fixtures cover representative Career/Wealth cases.
- Manual acceptance records browser/build version, fixture, steps, expected/actual result and evidence.

Pass only when automated product integration tests and agreed manual acceptance cases pass on the candidate SHA.

## 7. Gate ownership and sequencing

| Gate / work | Primary owner | Dependency / note |
|---|---|---|
| A01 baseline | Product + architecture | Source inventory; no runtime code changes |
| A02–A09 trust and authority | Domain + platform | Preserve C11, CW-05 and temporal authority |
| B01–B06 Career capability | Career domain | D1/D10 hierarchy and confidence contract |
| C01–C05 Wealth capability | Wealth domain | D2 calculation must precede interpretation |
| Product acceptance | Product + QA | Requires canonical outputs and explicit missing states |

A01 is a baseline record, not a release approval. Gate results must be updated only with evidence from the exact candidate commit.