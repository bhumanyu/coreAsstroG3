# A01 — Functional Assurance Baseline

**Programme:** CoreAstroG3 Career & Wealth Intelligence Assurance  
**Status:** Source inventory completed; runtime baseline execution not performed  
**Inspected repository:** `bhumanyu/coreAsstroG3`  
**Inspected branch:** `main`  
**Inspected source SHA:** `6868b84ba321b226f8a7d607e958318c70f790fa`  
**Inspection date:** 2026-11-01

> This is a source-inspection baseline, not a claim that tests or CI passed. Source paths and contracts were inspected through GitHub at the recorded SHA. No local checkout, local working-tree status, test execution, build, or manual UI run was available. Unobserved validation is marked NOT_RUN.

## 1. A01 outcome and scope

A01 records the Career and Wealth product pipeline, canonical ownership boundaries, requirement-to-source/test mapping, toolchain and CI contract, known gaps, and acceptance gates for subsequent work.

A01 is documentation-only. It must not change production code, astrology calculations, domain rules, enums, runtime contracts, or test assertions. It must not implement A02–A09. In particular, do not fix the `createAnalysisContext` fallback, change C11 confidence, alter evidence identity, or rewrite Dasha resolution in A01.

## 2. Repository and toolchain snapshot

| Item | Inspected value |
|---|---|
| Repository / default branch | `bhumanyu/coreAsstroG3` / `main` |
| Source SHA | `6868b84ba321b226f8a7d607e958318c70f790fa` |
| Node | `22.20.0` from `.nvmrc`; package engine `^22.20.0` |
| npm | `10.9.2` |
| Package manager | npm; lockfile present |
| Test framework | Vitest |
| Type check | `npm run lint` → `tsc --noEmit` |
| Build | `npm run build` → Vite |
| Standard tests | `npm test` → `vitest run --config vitest.standard.config.ts` |
| Bundle tests | `npm run test:bundle` → `vitest run --config vite.bundle.config.ts` |

Use Node 22.20.0 and npm 10.9.2; use `npm ci` for clean lockfile-respecting installation. Do not update the toolchain or dependencies as part of A01. The remote source revision was inspected; no claim is made that a local working tree is clean.

## 3. Canonical production flow

The production path in `src/product/life-analysis/lifeAnalysisProductService.ts` is:

```text
Horoscope + AnalysisContext
  -> resolveAnalysisTemporalState(horoscope, context)
  -> DomainReasoningOptions(context, temporalState)
  -> interpretCareerV2 + interpretWealthV2
  -> buildLifeAnalysis
  -> buildAiContextEvidence (evidence-only projection)
  -> resolveLifeAnalysisEvidence
  -> buildLifeAnalysisViewModel
  -> optional runAiExplanation -> buildProductAiContext
  -> LifeAnalysisProductState
```

`LifeAnalysisProductState` carries the precomputed domain/life-analysis artifacts and optional `aiExplanation`; it does not expose an intermediate `AiContext`. The deterministic view-model path uses `buildAiContextEvidence()` only. `runAiExplanation()` constructs the product AI context through `buildProductAiContext()` when an explanation is requested.

| Layer | Canonical source | Responsibility |
|---|---|---|
| Product orchestration | `src/product/life-analysis/lifeAnalysisProductService.ts` | Resolve temporal state; invoke Career and Wealth V2; project evidence for the view model; optionally explain |
| Product entry | `src/product/analysis/productAnalysisService.ts` | Calls `runLifeAnalysisProduct` |
| Career interpreter | `src/domain/career/CareerDomainInterpreterV2.ts` | Exports `interpretCareerV2` |
| Wealth interpreter | `src/domain/wealth/WealthDomainInterpreterV2.ts` | Exports `interpretWealthV2` |
| Temporal authority | `src/core/analysis/resolveAnalysisTemporalState.ts` | Resolves active temporal/Dasha state for `AnalysisContext.asOf` |
| Evidence-only projection | `src/ai/context/aiContextFactory.ts` | Supplies conflict-checked evidence for deterministic evidence resolution without building an AI DTO |
| AI context | `src/ai/context/aiContextFactory.ts` | `buildProductAiContext` consumes precomputed domain results and temporal state for requested explanations |
| AI explanation | `src/ai/product/aiExplanationService.ts` | Optionally builds product AI context and invokes the explanation/presentation layer |

## 4. Single-authority register

| Authority | Canonical source | Rule |
|---|---|---|
| Career final synthesis (C11) | `src/domain/career/careerFinalSynthesis/careerFinalSynthesis.ts` | No parallel Career final-synthesis authority |
| Wealth final synthesis (CW-05) | `src/domain/careerWealth/finalSynthesis/wealthFinalSynthesis.ts` | No parallel Wealth final-synthesis authority |
| Temporal/Dasha | `src/core/analysis/resolveAnalysisTemporalState.ts` | Consumers must not independently select active MD/AD/PD |
| Product orchestration | `runLifeAnalysisProduct` in `src/product/life-analysis/lifeAnalysisProductService.ts` | Domain computation is orchestrated once |
| AI boundary | `src/ai/product/aiExplanationService.ts` | AI cannot replace or mutate deterministic conclusions |
| Evidence identity | `src/domain/reasoning/` shared evidence identity contract | Root/semantic identity and occurrence/provenance identity remain distinct |

Repository `PLAYBOOK.md` invariants recorded during inspection: AI is presentation-only; domain interpreters compute once; one AnalysisContext and one AnalysisTemporalState are shared; UI consumes product view models; missing evidence is not negative evidence; D10 qualifies Career but does not replace D1; D2 is a qualifier, not a replacement for D1. A01 records these invariants but does not prove every caller obeys them.

## 5. Requirement → source → test inventory

The following are source/test mapping targets. File presence is not evidence that tests were executed in this A01 run.

| Requirement / contract | Production source | Test evidence to inspect/run | Follow-up |
|---|---|---|---|
| Product invokes domain interpreters once | `src/product/life-analysis/lifeAnalysisProductService.ts` | Product/life-analysis orchestration tests | A02, A09 |
| Career final synthesis has one authority | C11 source above; Career V2 interpreter | C11 and Career V2 tests | A02, A07 |
| Wealth final synthesis has one authority | CW-05 source above; Wealth V2 interpreter | CW-05 and Wealth V2 tests | A02, A08 |
| One as-of temporal state | `resolveAnalysisTemporalState.ts` | Temporal resolver and product integration tests | A05 |
| Invalid asOf fails closed | `src/core/analysis/analysisContextFactory.ts` | AnalysisContext factory and temporal validation tests | A04 |
| AI is downstream-only | AI context and explanation sources above | AI isolation, grounding and failure-path tests | A06 |
| Evidence identity/provenance | `src/domain/reasoning/` | `canonicalEvidenceIdentity.contract.test.ts` and trace tests | A03, A09 |
| D1/D10 hierarchy | Career domain and divisional-chart evidence | D1/D10 acceptance tests | B03 |
| D2 unavailable state is preserved | Wealth interpreter, hierarchy and CW-05 input contracts | D2 availability and Wealth synthesis tests | A08, C02A/C02B |
| Calculation release system remains separate | `docs/release/CALCULATION_VALIDATION_MATRIX.md`, `release-policy.json`, `scripts/release/run-release-gate.mjs` | Release-gate tests and RG-01–RG-14 fixtures | Existing release programme |

Status meanings: SOURCE_CONFIRMED = source inspected; TEST_FILE_CONFIRMED = test file located; HISTORICAL_EVIDENCE = older SHA only; NEEDS_EXECUTION = not run on inspected SHA; NEEDS_COVERAGE_REVIEW = source/test relationship still requires audit. No status here implies a test passed.

## 6. Known observations (not fixed by A01)

### OBS-01 — AnalysisContext accepts invalid asOf fallback

Inspected source: `src/core/analysis/analysisContextFactory.ts`. `normalizeAsOf` rejects invalid dates, empty strings, invalid timestamps and unsupported types. However, `createAnalysisContext` catches the error and substitutes the original string or an empty string. The temporal resolver later rejects invalid/empty values, but an invalid context may already have been created.

**Classification:** CONFIRMED_SOURCE_GAP. **Owner:** A04. **A01 action:** record only; do not change implementation.

### OBS-02 — Historical baselines are not current-SHA proof

Existing documents such as `CAREER-WEALTH-BASELINE-2026-10.md`, `PBA-ACCEPTANCE-MATRIX.md`, `CAREER-WEALTH-CONTRACT-INVENTORY.md` and `P2-11A-REPRODUCIBLE-BUILD.md` describe earlier source snapshots. Their results must not be represented as validation of `6868b84ba321b226f8a7d607e958318c70f790fa`.

### OBS-03 — Existing calculation release gates are separate

The repository's RG-01–RG-14 calculation release system remains distinct from the Career/Wealth programme gates in A01-RELEASE-GATES.md. Do not mark external ephemeris or owner-gated calculation blockers as passed because a product gate passes.

### OBS-04 — Current CI result not established

The combined status lookup returned no status entries for the inspected commit. The available workflow-run lookup is limited to PR-triggered runs and returned no runs for the merge commit. This does not prove CI never ran; it means no current result was established by those endpoints.

### OBS-05 — Runtime validation not executed

No local checkout/shell was available. `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npm run verify`, `npm run verify:release` and manual UI checks are all NOT_RUN.

## 7. Package scripts and CI contract

Inspected package scripts include: `dev`, `build`, `lint`, `test`, `test:calculation-validation`, `test:temporal-validation`, `test:pr8-acceptance`, `test:bundle`, `verify`, `verify:release`, `verify:bundle`, `test:pba10`, and `verify:pba10`.

The inspected `.github/workflows/ci.yml` workflow is named **CI Workflows**, triggers on pushes to main/master and pull requests targeting main/master, and runs on ubuntu-latest. Its observed sequence is checkout exact SHA; setup Node from `.nvmrc`; install npm 10.9.2; record SHA/versions/lockfile SHA-256; assert the lockfile is tracked; `npm ci`; `npm run lint`; `npm test`; and `npm run verify:bundle` (which builds and runs bundle tests).

Important distinction: CI invokes `npm run verify:bundle`, not the aggregate `npm run verify`. The latter repeats lint/tests before the bundle gate. Report the command actually executed.

## 8. Baseline execution record

| Validation | Result |
|---|---|
| Source inspection at recorded SHA | PASS — inspected |
| Branch/HEAD identification | PASS — main / recorded SHA |
| Toolchain inspection | PASS — Node 22.20.0 / npm 10.9.2 |
| CI workflow definition | PASS — inspected |
| Combined status lookup | No status entries returned; not a pass/fail |
| PR workflow lookup | No PR-triggered runs returned; endpoint limitation |
| `npm ci` | NOT_RUN |
| `npm run lint` | NOT_RUN |
| `npm test` | NOT_RUN |
| `npm run build` | NOT_RUN |
| `npm run verify` | NOT_RUN |
| `npm run verify:release` | NOT_RUN |
| Manual UI checks | NOT_RUN |

## 9. A01 acceptance checklist

- [x] Repository/default branch and source SHA identified.
- [x] Runtime and package-manager pins inspected.
- [x] Package scripts and CI workflow inspected.
- [x] Product pipeline traced.
- [x] C11, CW-05 and temporal authorities recorded.
- [x] Career/Wealth/AI/integration/trace test targets inventoried.
- [x] Calculation release gates separated from product assurance gates.
- [x] Historical evidence distinguished from current-SHA evidence.
- [x] Invalid-asOf source gap recorded without changing production code.
- [ ] Clean dependency installation on current candidate SHA.
- [ ] Typecheck and standard tests on current candidate SHA.
- [ ] Production build and bundle tests on current candidate SHA.
- [ ] Current-SHA GitHub Actions run observed.
- [ ] Matrix reconciled with actual execution output.

A01 documentation/source inventory is complete. Runtime baseline remains incomplete until the unchecked execution items are completed. A01 does not authorize release.
