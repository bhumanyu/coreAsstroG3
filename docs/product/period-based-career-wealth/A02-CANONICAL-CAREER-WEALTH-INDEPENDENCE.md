# A02 — Canonical Career/Wealth Independence Gate

**Status:** Implementation committed to feature branch; runtime validation pending  
**Parent baseline:** A01 merged to `main` at `47d8b7966ab12a9e758ded3ab19810f9e2034bf8`  
**Scope:** Selected-period product orchestration and regression tests  
**Canonical authorities preserved:** Career C11; Wealth CW-05; shared temporal authority `resolveAnalysisTemporalState`

## 1. Objective

A Career-only or Wealth-only selected-period analysis must remain useful when the other domain's inputs are unavailable. One domain's missing artifacts, baseline, or evidence must not suppress a valid result from the other domain.

The selected MD/AD context is shared and remains mandatory. Invalid or ambiguous period context remains a hard failure. Domain-specific activation failures degrade to partial synthesis with explicit missing-input diagnostics.

## 2. Source finding before implementation

The domain synthesis layer already accepted optional Career/Wealth activation results and emitted per-domain provenance/missing-input records. The product adapter was not fully independent:

- `BuildProductSelectedPeriodSynthesisInput.careerArtifacts`, `careerEvidence`, and `careerDashaEvidence` were required.
- The product adapter attempted Career activation unconditionally.
- `ProductAnalysisService.analyzeRun` returned `UNAVAILABLE` when Career artifacts, Career baseline, or Wealth baseline were absent.
- `ProductAnalysisService.selectPeriodForRun` threw when Career artifacts or either domain baseline was absent.
- The request-scoped selected-period AI path dereferenced `careerArtifacts!`, even when Career was absent.

This meant the lower-level partial synthesis capability could not be reached reliably from the product entry points.

## 3. Implementation

### 3.1 Optional Career activation inputs

In `src/product/analysis/selectedPeriodProductService.ts`:

- Career artifacts, Career evidence and Career Dasha evidence are now optional.
- If Career artifacts are absent, the Career activation adapter returns the existing typed `INCOMPLETE_CANONICAL_INPUT` failure.
- The existing partial-synthesis path receives that domain-specific failure and still evaluates Wealth independently.
- Wealth activation continues to use the already-computed Wealth evidence; no interpreter is re-run.

### 3.2 Independent product prerequisites

In `src/product/analysis/productAnalysisService.ts`:

- The shared selected-period temporal context remains required.
- Career artifacts and Wealth interpretation are checked independently.
- The product service returns `UNAVAILABLE` only when neither domain has selected-period activation inputs.
- Career and Wealth baselines are passed as optional projections; a missing baseline no longer blocks the other domain's activation.
- Both `analyzeRun` and `selectPeriodForRun` use the same independent-input policy.
- The selected-period AI evidence projection uses an empty Career Dasha evidence list when Career artifacts are absent, rather than dereferencing a missing artifact.

### 3.3 Canonical authority guardrails

A02 does not modify C11, CW-05, Career or Wealth calculation rules, evidence identity, Dasha resolution, or the legacy theme compatibility outputs. Existing canonical-vs-legacy isolation coverage remains in `src/domain/careerWealth/themeOutputIsolation.test.ts`.

## 4. Regression coverage added

| Test file | Scenario | Required assertion |
|---|---|---|
| `src/product/analysis/selectedPeriodProductService.test.ts` | Career artifacts absent; Wealth evidence available | Wealth provenance PRESENT; Career provenance MISSING; Career missing-input diagnostic |
| Same | Wealth evidence absent; Career artifacts available | Career provenance PRESENT; Wealth provenance MISSING; Wealth missing-input diagnostic |
| `src/product/analysis/productAnalysisService.integration.test.ts` | `analyzeRun` selected-period path with Career missing | Wealth selected-period output remains OK and present |
| Same | `analyzeRun` selected-period path with Wealth missing | Career selected-period output remains OK and present |
| Same | `selectPeriodForRun` request-scoped path with Career missing | Wealth output remains OK and present |

Existing independence tests also cover:
- Changing Career evidence does not change Wealth synthesis.
- Changing Wealth evidence does not change Career synthesis.
- Legacy Career/Wealth theme interpreters are not invoked by canonical product calculation.
- Perturbing legacy theme outputs does not change canonical conclusions, view models, or canonical AI context.

## 5. Non-goals

A02 does not:
- Redesign C11 or CW-05.
- Change the shared Dasha/temporal resolver.
- Recompute either domain interpreter during selected-period synthesis.
- Convert missing evidence into negative evidence.
- Change the canonical base Career/Wealth calculation pipeline's exception policy.
- Add a new combined score or shared Career/Wealth final-synthesis authority.

## 6. Validation record

The feature branch was compared with `main`; the source changes and regression tests were inspected through GitHub.

The following commands have **NOT_RUN** in this implementation environment:
- `npm ci`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run verify:bundle`

No test or CI success is claimed. CI evidence must be checked against the exact PR head SHA before merge.
