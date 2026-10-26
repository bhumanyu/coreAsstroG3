# Career/Wealth Contract Inventory

**Source snapshot:** `45c41269462c7a382c11896f384aa47865a43b26`
**Documentation scope:** source tracing and observability only. No calculation, enum, contract, test expectation, or assertion was changed.

Source-derived status names and flow below are recorded as implemented; a UI label or older report is not treated as proof of a producer or consumer.

## 1. Career mechanism model and resolver

- **Contract:** `CareerMechanismStatus` in `src/domain/career/careerMechanism/careerMechanismTypes.ts` is the mechanism lifecycle union `CANDIDATE | QUALIFIED | REFINED | INSUFFICIENT_DATA`. The contract says not to reuse P2-07A pattern qualification status; the model documentation describes it as lifecycle status and does not define additional per-member threshold semantics.
- **Producer:** `DefaultCareerMechanismResolver` in `src/domain/career/careerMechanism/resolver/defaultCareerMechanismResolver.ts` builds mechanism candidate sets; `careerMechanismTypes.ts` defines the record and evidence shapes.
- **Consumer:** `CanonicalCareerOrchestrator` composes resolver outputs into `CanonicalCareerFoundation.resolvedMechanisms`. At this source snapshot `CareerDomainInterpreterV2.ts` calls `buildCanonicalCareerFoundation` and then uses its resolved mechanisms in production C8; the profession analyzer also consumes the mechanism candidates later in the same interpreter path.
- **Resolver gating policy (source JSDoc):** `UNQUALIFIED` skips resolution and returns an empty candidate set; `QUALIFIED` resolves normally; `INSUFFICIENT_DATA` resolves structurally using pattern-level facts.
- **Tests:** `careerMechanismTypes.test.ts` (40 passed) and `resolver/careerMechanismResolver.test.ts` (26 passed); exact commands and run metadata are in [the baseline record](./CAREER-WEALTH-BASELINE-2026-10.md).

## 2. Canonical Career orchestration

- **Contract:** `CanonicalCareerFoundation` is exported by `src/domain/career/orchestration/canonicalCareerContracts.ts`. It carries pattern candidates/qualifications, participant roles, resolved mechanisms/refinements, supplements, identity and relationship mappings, stage references, diagnostics, and metadata.
- **Producer:** `buildCanonicalCareerFoundation` in `canonicalCareerFoundationBuilder.ts` composes `CanonicalCareerOrchestrator`; the orchestrator invokes the configured stage ports and builds the immutable foundation.
- **Production consumer:** `src/domain/career/CareerDomainInterpreterV2.ts` calls the builder before production C8 and takes `resolvedMechanisms` and supplements from its result.
- **Identity-mapping finding (verified checklist difference):** `identityMappings` is **not generally empty**. Non-empty orchestrations emit explicit `PATTERN -> QUALIFICATION` mappings when matching identity keys exist. The implementation deliberately does not emit `QUALIFICATION -> MECHANISM` or `MECHANISM -> REFINEMENT` identity mappings; structural derivation is represented in `relationshipMappings`. Participant-role stage linkage is also not mapped. `ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL` records this coverage limitation. Empty-input tests naturally return an empty array, but do not establish that the production contract is globally empty.
- **Tests:** `canonicalCareerOrchestrator.test.ts` (63 passed) and `canonicalCareerFoundationBuilder.test.ts` (27 passed). The tests assert the populated pattern-to-qualification mapping and the partial-coverage diagnostic.

## 3. Career profession analysis and missing inputs

- **Contract:** `CareerProfessionAnalysis` and `CareerProfessionAnalysisStatus` in `careerProfession/careerProfessionTypes.ts`. Status members: `COMPLETE`, `PARTIAL`, `INSUFFICIENT_DATA`. The source documents `PARTIAL` as candidates present with optional inputs missing and `INSUFFICIENT_DATA` as required inputs missing.
- **Producer:** `buildCareerProfessionAnalysis` in `careerProfession/careerProfessionEngine.ts`. `missingInputs` lists each absent optional context key from `career10HFoundation`, `career10LFoundation`, `careerD10CanonicalAnalysis`, and `domainEvidence`; it does not itself provide a per-input diagnostic object. No candidates yields `INSUFFICIENT_DATA`; candidates plus one or more missing-input keys yields `PARTIAL`; candidates with none missing yields `COMPLETE`.
- **Production consumer:** `CareerDomainInterpreterV2.ts` calls `buildCareerProfessionAnalysis` with the C8 mechanism-based expression result, mechanism candidates, 10H/10L context when present, canonical D10, and canonical evidence. The call is wrapped to expose a typed `professionAnalysisFailure` while leaving the core C11 conclusion intact; the result is projected into `conclusionData.careerProfessionAnalysis`.
- **Verified checklist difference:** the `goldenCareerAcceptance.test.ts` header still says that the profession engine has no production caller. At this source snapshot that statement is stale: the interpreter contains a direct production call. The golden test remains an actual production-entry-point acceptance test for `interpretCareerV2`, but its header is not current call-graph evidence.
- **Tests:** `careerProfessionEngine.test.ts` (32 passed), `careerProfessionBoundary.test.ts` (25 passed), and `goldenCareerAcceptance.test.ts` (30 passed).

## 4. Career pattern qualification, evidence, and provenance

- **Qualification status:** `CareerPatternQualificationStatus` in `careerPatternQualificationTypes.ts` is `QUALIFIED | UNQUALIFIED | INSUFFICIENT_DATA`.
- **Decision semantics (source JSDoc):** an explicitly absent mandatory structural prerequisite and a known disqualifier produce `UNQUALIFIED`; a mandatory prerequisite that cannot be evaluated produces `INSUFFICIENT_DATA`; confirmed prerequisites and satisfied conditions produce `QUALIFIED`. Activation potential and divisional confirmation are deferred dimensions and do not create natal qualification.
- **Evidence source types:** `src/domain/evidence/evidenceSourceTypes.ts` exports `HOUSE | PLANET | LORDSHIP | ASPECT | YOGA | VARGA | STRENGTH | DASHA | TRANSIT | STRUCTURAL | OTHER`, with `isEvidenceSourceType` as the runtime guard. Qualification evidence has its separate `QualificationEvidenceSourceType`: `PLANETARY_RELEVANCE | PLANETARY_CONDITION | STRUCTURAL_RELATIONSHIP | PATTERN_TOPOLOGY | POLICY_RULE`.
- **Career evidence flow:** qualification code records source pattern/evidence/rule provenance. `careerDashaIntegration.ts` builds dasha activation provenance/evidence, while `productAnalysisMapper.ts` maps evidence, directions, and selected-period synthesis into product DTOs. `mapDirection` is a consumer mapping, not a qualification producer.
- **Tests:** `careerPatternQualification.test.ts` (78 passed), `evidenceSourceTypes.test.ts` (29 passed), and `careerDashaIntegration.test.ts` (37 passed); product projection coverage is listed below.

## 5. Wealth promise evidence and selected-period activation

- **Contract/producer:** `evaluateSelectedWealthPeriodActivation` in `src/domain/wealth/selectedWealthDashaActivation.ts` evaluates each `WealthDimension` (`ACCUMULATION`, `GAINS`, `FORTUNE`, `SPECULATION`) using natal promise evidence and selected MD/AD/PD evidence.
- **Linkage:** `isLinkedToDimension` requires selected-period evidence to share an actual house with promise evidence. Planet overlap alone is not sufficient; evidence with no house cannot link under this contract.
- **Truth table from `evaluateDimension` / `resolveEffect` (verbatim outcomes):**

| Input condition | Result |
|---|---|
| No promise evidence | `INSUFFICIENT_DATA` (`NO_PROMISE_EVIDENCE`) |
| Promise evidence exists but no house linkage | `INSUFFICIENT_DATA` (`PROMISE_NOT_LINKED`) |
| Linked neutral-only evidence | `UNKNOWN` (`LINKED`) |
| Linked support plus challenge, or explicit `MIXED` | `PARTIALLY_ACTIVATES` |
| Linked support-only evidence | `ACTIVATES` |
| Linked challenge-only evidence | `CHALLENGES` |

`NO_PROMISE_EVIDENCE` and `PROMISE_NOT_LINKED` are distinct states: the first has no promise evidence IDs; the second preserves promise IDs but has no linked levels. The no-evidence effect is not inferred as a challenge.

- **Evidence producer:** `wealthEvidenceMapper.ts` maps theme evidence into `DomainEvidence`, maps evidence family to source type/dimension/period, and connects selected evidence to promise references. The `WEALTH_VENUS_KARAKA_001` branch uses `createCareerWealthEvidence`; the source comment says remaining provenance producers are deferred to CW-06B.
- **Consumer:** `selectedPeriodProductService.ts` invokes `evaluateSelectedWealthPeriodActivation`, then builds the selected-period synthesis. Product mapper and chart export receive the resulting selected-period DTO; they do not recalculate the activation truth table.
- **Tests:** `wealthEvidenceMapper.test.ts` (27 passed), `selectedWealthDashaActivation.test.ts` (61 passed), and `selectedPeriodProductService.test.ts` (19 passed).

## 6. Domain synthesis and product/UI/export projection

- **Domain producer:** `buildSelectedPeriodSynthesis` in `src/domain/synthesis/selectedPeriodSynthesis.ts` combines selected-period career and wealth activation with evidence references, missing-input diagnostics, and provenance. Its wealth rows preserve `effect`, `linkedLevels`, `promiseEvidenceIds`, `dashaRuleReferences`, and `insufficientReason`.
- **Wealth `dataStatus`:** the source contract says this is input availability, not a composite score. Resolved promise references produce `COMPLETE` only when the effect is determinate; linked, complete inputs with `UNKNOWN` or `INSUFFICIENT_DATA` effect are `PARTIAL` and emit `WEALTH_DIMENSION_COMPLETE_BUT_INDETERMINATE`. Missing/unresolved evidence does not become a negative conclusion.
- **Product projection:** `mapSelectedPeriodSynthesis` in `productAnalysisMapper.ts` field-maps career expressions, all four wealth dimensions, evidence, missing inputs, and provenance. `qualificationStatus` is derived from career provenance/qualification basis only: `CANONICAL`, `PROVISIONAL`, or `UNAVAILABLE`; the type explicitly notes that Wealth has no equivalent qualification-basis signal. AI explanation fields remain separate product fields; they do not rewrite deterministic synthesis.
- **Service path:** `productAnalysisService.ts` calls `mapSelectedPeriodSynthesis` when selected-period analysis succeeds. `selectedPeriodProductService.ts` produces the activation and synthesis consumed by that mapper.
- **UI consumer:** `src/components/dasha/SelectedPeriodReport.tsx` renders the typed `ProductSelectedPeriodSynthesis`, including `qualificationStatus`; Dasha page/component tests cover the selected-period report presentation.
- **Export path:** `chartExportMapper.ts` projects the selected-period DTO into `deterministicSynthesis` explicitly and preserves selected-period availability as an `AVAILABLE`/`UNAVAILABLE` wrapper. `chartExportSchema.ts` supplies typed shape and validation. The deterministic projection is separate from AI explanation content; unavailable or partial statuses remain represented instead of becoming inferred positive conclusions.
- **Tests:** `selectedPeriodSynthesis.test.ts` (87 passed), `productAnalysisMapper.test.ts` (29 passed), `productAnalysisService.integration.test.ts` (33 passed), `chartExportMapper.test.ts` (5 passed), `chartExportSchema.test.ts` (5 passed), `components/dasha/__tests__/DashaComponents.test.tsx` (30 passed), and `pages/__tests__/DashaPage.test.tsx` (13 passed).

## 7. Golden and canonical fixture acceptance

- `src/domain/career/__tests__/goldenCareerAcceptance.test.ts` runs deterministic scenarios through the actual `interpretCareerV2` entry point and checks canonical C11 output (30 passed). Older header text about absent orchestration/profession production call sites is stale at the inventoried source SHA, as noted above.
- `src/test/fixtures/canonicalChart.test.ts` checks the canonical chart golden longitudes, equivalent UTC/offset representations, canonical Vimshottari fixture values, and methodology configuration (11 passed).

## 8. Known gaps vs. suspected gaps

### Verified gaps

| Gap | Source evidence and affected contract | Relevant test evidence | Proposed follow-up (not implemented) |
|---|---|---|---|
| Canonical identity coverage is partial, not empty. Pattern-to-qualification identity mappings exist; qualification-to-mechanism and mechanism-to-refinement semantic identity mappings and participant-role stage linkage are not emitted. | `canonicalCareerOrchestrator.ts` emits `ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL`; its message describes missing semantic identity linkage. Affected contract: `CanonicalCareerFoundation.identityMappings`. | `canonicalCareerOrchestrator.test.ts` asserts the partial diagnostic, positive pattern-to-qualification mappings, and absent later-stage identity mappings; `canonicalCareerFoundationBuilder.test.ts` expects populated mappings for its canonical fixture. | P1-B+ follow-up to define/implement only real identity-bearing mappings and update these tests; do not fabricate identity keys. |
| Dispositor contexts/refinement are disabled in the production Career interpreter. | `CareerDomainInterpreterV2.ts` passes `enableDispositorContexts: false`; the builder documents the default false path and emits `ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE`. Affected contract: production `mechanismRefinements` availability. | `canonicalCareerFoundationBuilder.test.ts` verifies the unavailable diagnostic and unresolved/unavailable refinement records; `goldenCareerAcceptance.test.ts` exercises production `interpretCareerV2`. | P1-B+ follow-up only if product scope approves enabling/providing those contexts; retain explicit unavailable semantics until then. |
| Wealth canonical provenance migration is incomplete for mapper producers other than `WEALTH_VENUS_KARAKA_001`. | `wealthEvidenceMapper.ts` marks that one producer for `createCareerWealthEvidence` migration and explicitly comments that remaining producers are deferred to CW-06B. Affected contract: evidence provenance creation for the remaining Wealth source rules, not the activation truth table. | `wealthEvidenceMapper.test.ts` (27 passed) covers the current mapper; extend only with the approved migration. | CW-06B / P1-B+ follow-up for remaining producer migration. |

### Suspected or stale-record gaps (not verified functional defects)

| Item | Evidence and affected contract | Relevant test | Proposed follow-up |
|---|---|---|---|
| Golden acceptance header may understate current production integration coverage. | Its header says the canonical foundation and profession engine have no production caller, but `CareerDomainInterpreterV2.ts` calls both `buildCanonicalCareerFoundation` and `buildCareerProfessionAnalysis` at this source SHA. The mismatch is verified; an untested behavior defect is not established. | `goldenCareerAcceptance.test.ts` (30 passed); direct imports/call sites are in the interpreter source. | Documentation-only P1-B+ reconciliation of the header and gate description, then add targeted assertions only if a specific coverage gap is confirmed. |
| Pinned Node 20 has a dependency engine warning. | Clean isolated `npm ci` succeeded but warned that `@testing-library/jest-dom@7.0.1` declares Node `>=22`, while `.nvmrc` pins Node `20.19.4`; the full suite passed on Node 20. | Full baseline `npm run verify` passed after `dist/assets` was built; install warning is captured in the baseline record. | Track as a compatibility investigation; do not upgrade dependencies or alter the pin in this documentation-only change. |
| In a pristine checkout, the browser-boundary test assumes a previous build has created `dist/assets`. | The first full `npm run verify` failed inside `npm test` before the script's later build step; prebuilding and rerunning the unchanged command passed. | `src/ai/security/browserBoundary.test.ts`: initial suite failure; then 2/2 passed in bundle phase. | Separate follow-up to assess test setup/order ownership. No assertion or script was modified here. |

## Scope exclusions

This inventory implements none of the P1-B–P1-G work: it adds no Career pattern/rule families, does not change relationship validation or dispositor refinement, does not add or remove profession/wealth producers, does not change the Wealth activation truth table, and does not alter AI/UI/export conclusions.
