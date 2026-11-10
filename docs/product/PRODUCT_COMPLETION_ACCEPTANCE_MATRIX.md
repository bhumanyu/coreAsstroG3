# CoreAstroG3 Product Completion Acceptance Matrix

**Audit baseline:** `main` at `b8732883bf93df5c171cd56d35d33ca83b504200` (2026-11-10).
**Source of requirements:** Product Completion Jira Backlog E01–E08 supplied for this audit.
**Rule:** Source presence or a merged PR is not proof of completion. COMPLETE requires the story's acceptance behaviour and tests to be demonstrated on an exact revision. A blocked predictive capability remains unavailable; this matrix does not authorize changing any astrology rule.

## Status vocabulary

- **COMPLETE** — implementation and acceptance evidence satisfy the story.
- **PARTIAL** — some requirements exist; at least one acceptance criterion remains unmet or unverified.
- **UNAVAILABLE** — the product intentionally does not offer the capability.
- **INSUFFICIENT_DATA** — the implementation exists but required input/evidence is absent.
- **BLOCKED** — a validation, approval, dependency or release gate prevents safe use.
- **NOT_ASSESSED** — the domain contract is not yet approved; no conclusion is produced.
- **BROKEN** — a supported action is known to violate a requirement.

Delivery state such as an open PR is recorded separately from product status.

## P0 — release blockers

| Story | Status | Source-verified finding / remaining acceptance | Implementation evidence |
|---|---|---|---|
| E01-S01 timezone resolution | PARTIAL — PR #38 | Main previously substituted UTC for missing provider timezone and defaulted the form to UTC. PR #38 removes this, models RESOLVED/USER_SELECTED/UNRESOLVED/INVALID, preserves date/time/place, and requires a valid IANA timezone. Pending merge/review. | `src/services/geocoding.ts`, `src/components/BirthFormModal.tsx`, `src/core/time/timeZoneResolution.ts`, `src/core/validation/birthDetailsValidation.ts` |
| E01-S02 strict datetime/DST | PARTIAL — PR #38 | PR #38 resolves wall-clock times to UNIQUE/AMBIGUOUS/NONEXISTENT/INVALID, requires explicit selection for repeated times, rejects nonexistent times and impossible dates, and removes sample datetime defaults. Pending merge/review. | `src/core/time/timeZoneResolution.ts`, `src/engine/solarTime.ts`, `src/components/DateTimeSelector.tsx`; associated tests in same directories |
| E02-S01 independent astronomical fixtures | BLOCKED | `CALCULATION_REFERENCE_FIXTURES` is explicitly empty. No independently approved source values are available for release-critical planetary, motion, boundary and varga calculations. Do not populate with engine-generated values. | `src/engine/validation/calculationReferenceFixtures.ts`, `docs/release/release-policy.json`, `src/engine/validation/calculationValidation.test.ts` |
| E02-S02 Dasha/varga parity | BLOCKED | Boundary and unit tests exist, but independent reference fixtures for Dasha transitions and divisional-chart outputs are not approved/present. Deterministic unit tests are not independent parity proof. | `src/engine/`, `src/engine/validation/`, `docs/release/CALCULATION_VALIDATION_MATRIX.md` |
| E03-S01 Career event validation | BLOCKED for event-specific forecasting; containment present | Event-specific taxonomy is fail-closed; unvalidated rules must remain disabled. Generic opportunity/challenge windows are not specific promotion/job-change/entrepreneurship claims. Individual event-type independent fixtures/approvals remain absent. | `src/domain/career/careerEventTimeline/careerEventTimelineEngine.ts`, `src/domain/career/careerEventTimeline/careerEventTimelineTypes.ts`, Career event timeline UI/tests |
| E04-S01 Wealth lifecycle validation | BLOCKED for event-specific forecasting; containment merged | All 11 C04 categories remain UNVALIDATED and release-disabled. PR #36 made the release block explicit; PR #37 corrected the legacy payload fallback. No event category is authorized for activation. | `src/domain/wealth/wealthLifecycleTypes.ts`, `src/domain/wealth/wealthLifecycleEngine.ts`, `src/product/analysis/wealthViewModel.ts`, `src/components/wealth/WealthLifecycleSection.tsx`; PRs #36/#37 |
| E04-S03 D2 containment | BLOCKED for D2; UI projection correction in PR #40 | Canonical mapper emits UNAVAILABLE pending A08/C02A/C02B. The view model and component previously independently hardcoded UNAVAILABLE. PR #40 removes those duplicate decisions and projects canonical status; CI pending on latest head. D2 remains unavailable. | `src/product/analysis/productAnalysisMapper.ts`, `src/product/analysis/wealthViewModel.ts`, `src/components/wealth/WealthD2Section.tsx`, `src/domain/wealth/wealthReasoningHierarchy.ts` |
| E05-S01 selected MD–AD validation | PARTIAL — PR #41 | MD/AD membership and temporal relation checks exist. Direct `Date.parse` previously accepted normalized impossible dates; PR #41 adds strict ISO/calendar/offset validation. CI pending on latest head. | `src/core/analysis/selectedMdAdPeriod.ts`, `src/core/analysis/selectedPeriodActivationContext.ts`, `src/core/analysis/temporalInterval.ts`; PR #41 |
| E05-S04 independent Career/Wealth result handling | PARTIAL | Selected-period service independently degrades Career and Wealth activation failures into typed partial synthesis. End-to-end Career-only/Wealth-only/both/both-fail browser acceptance is not yet proven. | `src/product/analysis/selectedPeriodProductService.ts`, `src/domain/synthesis/selectedPeriodSynthesis.ts`, associated unit/integration tests |
| E06-S04 human-readable report | PARTIAL — PR #43 | Legacy 17-section FullNatalReportView did not include canonical ProductAnalysis Career/Wealth. PR #43 adds a canonical report projection, explicit loading/error/retry states and integration into Detailed Analysis. Browser print/reload acceptance remains pending. PDF generation is out of scope. | `src/components/fullNatalReport/FullNatalReportView.tsx`, `ProductAnalysisReportView.tsx`, associated tests; PR #43 |
| E08-S01 AppController async state | PARTIAL — PR #42 | Request identity/stale-response guards exist. Optional Dasha timing projection errors were silently swallowed; PR #42 stores and displays the failure without erasing canonical analysis. Broader async transition/browser acceptance remains pending. | `src/app/AppController.ts`, `src/app/AppState.ts`, `src/pages/DashaPage.tsx`, associated tests; PR #42 |
| E08-S02 birth-to-insight browser acceptance | BLOCKED | No Playwright/Cypress/browser E2E runner is installed. Component/unit tests do not satisfy the 18 end-to-end scenarios in the backlog. | `package.json` has Vitest/Testing Library but no browser E2E dependency; no browser acceptance suite found |
| E08-S03 product acceptance matrix | PARTIAL — this document | This matrix establishes the first source-verified status inventory. It still needs acceptance owners, exact passing browser evidence and per-release tested-revision sign-off before it can satisfy the full story. | This document; CI and Release Gate evidence linked in PRs |

## P1 — product completion gaps

| Story | Status | Source-verified finding / remaining acceptance | Implementation evidence |
|---|---|---|---|
| E01-S03 birth-time certainty | UNAVAILABLE | BirthDetails does not preserve EXACT/APPROXIMATE/UNKNOWN plus an uncertainty interval. Approximate time must not be treated as exact. | `src/types.ts`, `src/core/validation/birthDetailsValidation.ts`, `src/components/BirthFormModal.tsx` |
| E01-S04 confirmation and recovery | PARTIAL | Birth form currently submits without a dedicated confirmation snapshot. Calculation request identity/stale response handling exists, but a full confirmed-input snapshot/retry UX is not proven. | `src/components/BirthFormModal.tsx`, `src/app/AppController.ts`, `src/app/AppState.ts` |
| E03-S02 Career sustainability | NOT_ASSESSED | No approved independent sustainability contract/evidence definition was found. Do not infer continuity from Career promise. | `src/domain/career/careerFinalSynthesis/careerAnalyticalAxes.ts`, `src/product/analysis/careerViewModel.ts` |
| E03-S03 profession/pathway comparison | PARTIAL — B05 implementation in PR #48 | B05 now compares only explicit B02 employment/service and independent/business candidates, preserves per-mode evidence and counter-evidence, and emits DUAL_POTENTIAL / CONDITIONAL_DUAL_POTENTIAL / single-mode-identified / unresolved / insufficient states. Missing modes remain NOT_IDENTIFIED, not unsuitable. Practical execution, financial readiness and personal preference remain NOT_ASSESSED; this is not a suitability verdict. Exact-SHA CI and acceptance are pending. | `src/domain/career/careerPathway/`, `src/product/analysis/productAnalysisMapper.ts`, `src/product/analysis/careerViewModel.ts`, `src/components/career/CareerPathwayComparisonSection.tsx`; [PR #48](https://github.com/bhumanyu/coreAsstroG3/pull/48) |
| E04-S02 financial facts management | PARTIAL | C01 source/provenance contract and read-only financial facts projection exist. Create/edit/delete, validated amount/currency/reference date and persistent fact lifecycle are not exposed as a complete manager. | `src/domain/wealth/wealthFinancialData.ts`, `src/product/analysis/wealthViewModel.ts`, `src/components/wealth/WealthFinancialFactsSection.tsx` |
| E05-S02 Career activation coverage | PARTIAL | Canonical candidate coverage and ambiguity/unmatched diagnostics exist. End-to-end coverage completeness and absence of first-candidate fallback/drop behaviour still need explicit acceptance proof. | `src/domain/career/careerDasha/selectedCareerDashaActivation.ts`, associated tests |
| E05-S03 Wealth activation linkage | PARTIAL | Per-dimension linkage traces, rule references and insufficient reasons exist. User-visible unresolved-linkage coverage and browser acceptance remain to be proven. | `src/domain/wealth/selectedWealthDashaActivation.ts`, associated tests |
| E05-S05 selected-period state/retry | PARTIAL | IDLE/SUBMITTING/READY/ERROR and request identity guards exist; full STALE semantics, retry and cross-chart async browser scenarios remain unproven. | `src/app/AppController.ts`, `src/pages/DashaPage.tsx`, selected-period UI/tests |
| E06-S01 profile lifecycle | PARTIAL | Browser-local save/read/rename/restore/delete, schema migration, corruption and quota errors exist. Rename/delete still use browser prompt/confirm; collection import/export, duplicate-name resolution, search/sort and reload acceptance are incomplete. | `src/features/chart-profiles/ChartProfileManager.tsx`, `chartProfileService.ts`, `chartProfileStorage.ts` |
| E06-S02 chart sharing | PARTIAL | Local Base64URL share, preview-before-load, privacy warning and local fragment removal exist. Base64URL is not encryption; no hosted expiry/revocation lifecycle exists. | `src/features/chart-sharing/ChartShareControls.tsx`, `chartShareCodec.ts`, `chartShareService.ts` |
| E06-S03 JSON export | PARTIAL | Versioned V1/V2 JSON export includes analysis provenance, selected period and deterministic interpretation. Full import/round-trip and every partial/unavailable diagnostic field need acceptance verification. | `src/features/chart-export/chartExportMapper.ts`, `chartExportSchema.ts`, export service/tests |
| E07-S01 evidence navigation | PARTIAL | D03 evidence/confidence panels and evidence IDs are present. Full navigable conclusion-to-evidence graph with unresolved links and polarity verification is not proven across all pages. | `src/product/analysis/evidenceExperienceViewModel.ts`, `src/components/evidence/EvidenceConfidencePanel.tsx`, Career/Wealth pages |
| E07-S02 AI retry/failure | PARTIAL | AI service returns typed errors and timeout handling; AiExplanationPage has retry and AiExplanationPanel supports regeneration. Timeout-specific UI and all deterministic-result-preservation journeys need browser acceptance. | `src/ai/product/aiExplanationService.ts`, `src/pages/AiExplanationPage.tsx`, `src/components/ai/AiExplanationPanel.tsx` |

## Current corrective PRs

| PR | Scope | Latest known implementation CI |
|---|---|---|
| [#38](https://github.com/bhumanyu/coreAsstroG3/pull/38) | E01-S01/S02 timezone and strict DST resolution; browser-boundary test ordering | PASS: lint, 6,000+ test suite, production build/bundle scan |
| [#39](https://github.com/bhumanyu/coreAsstroG3/pull/39) | A01 fixture inventory Node strip-only loader | CI in progress after shared browser-boundary test fix |
| [#40](https://github.com/bhumanyu/coreAsstroG3/pull/40) | E04-S03 canonical D2 availability projection | CI in progress after canonical fixture/test correction |
| [#41](https://github.com/bhumanyu/coreAsstroG3/pull/41) | E05-S01 strict selected-period instants | CI in progress after shared browser-boundary test fix |
| [#42](https://github.com/bhumanyu/coreAsstroG3/pull/42) | E08-S01 Dasha timing projection diagnostics | PASS: lint, full test suite, production build/bundle scan |
| [#43](https://github.com/bhumanyu/coreAsstroG3/pull/43) | E06-S04 canonical Career/Wealth report | Earlier head passed; latest loading/error-state additions require fresh CI |

The Release Gate remains failed on these PR heads because independent calculation references are absent and the PR-8 accepted-versus-current harness dependency graph requires explicit review/approval. Passing CI does not override those blockers.

## Release decision

**Do not declare the product release-ready.** The following remain hard release blockers:

1. Independent planetary, motion, boundary, divisional-chart and Dasha reference fixtures with provenance and owner approval.
2. Approved parity tolerances and passing comparison runs.
3. Browser E2E acceptance for birth-to-insight, selected MD–AD, failure/retry, profile/share/export and report journeys.
4. Exact-revision release-gate approval.

D2 and all unvalidated Career/Wealth event categories remain unavailable/blocked. Missing evidence is not adverse evidence. No synthetic fixture, UI setting or AI explanation may upgrade a canonical status.

## Update rule

Update this matrix only after inspecting the exact code and tests on the target revision. Record the tested SHA and CI run. A merged PR alone does not change a story to COMPLETE.
