# PR-8 production surface mapping

Native domain/status vocabularies are preserved. The acceptance layer performs comparison only and does not introduce a second conclusion authority.

| Surface | Real entry point / type | Evidence IDs | Owner/provenance | Status | Temporal scope |
|---|---|---|---|---|---|
| Career C11 | `buildCareerFinalAnalysis` / `CareerFinalSynthesisResult`; orchestrated by `interpretCareerV2` | `evidenceIds` | `evidenceTrace`, source/rule fields | native `finalStatus` and timing statuses | timing fields where available |
| Wealth canonical conclusion | `WealthConclusionData` / `buildWealthConclusionData` | wealth evidence collections | provenance-bearing evidence records | native wealth conclusion statuses | lifetime vs selected-period synthesis must remain explicit |
| Career UI | `selectCareerViewModel` / `CareerViewModel` | career evidence view entries, some conclusion counts | limited derived evidence fields | `hero/status`, `Dasha.status`, native conclusion projection | selected-period fields only in separate period view |
| Wealth UI | `selectWealthViewModel` / `WealthViewModel` | wealth evidence view entries | limited derived evidence fields | native dimension/overall statuses | selected-period separate |
| Selected-period UI | `buildSelectedPeriodViewModel` / `SelectedPeriodViewModel` | period evidence and evidence ID sets | period synthesis provenance | native selected-period result status | selected-period dates are in period view/result |
| AI context | `buildAiContext` / `buildProductAiContext` / `AiContext` | available evidence IDs; canonical C11 evidence | selected-period provenance and source/rule references | native C11/domain statuses | selected-period interval and temporal relation |
| Reasoning trace | `ReasoningTraceBuilder`, domain `buildReasoningTrace` | evidence nodes by `evidenceId` | provenance-bearing evidence nodes | trace has nodes/edges rather than a final authority status | no selected-period scope on the generic graph |
| JSON export | `buildChartExport`, `ChartExportService`, `chartExportMapper.ts` | exported career/wealth/selected-period evidence | selected-period provenance and export evidence fields | exported native statuses | exported selected-period fields |
| Report renderer | `FullNatalReportView`, `SelectedPeriodReport`, Career/Wealth conclusion sections | presentation-dependent; not every report exposes all IDs | presentation-dependent | native conclusions presented by components | report context determines temporal scope |
| Async state commit | `createAppController(...).analyze/selectPeriod`; `currentRequestId` stale-request guard in `src/app/AppController.ts` | committed through `ProductAnalysis` aggregate | committed through the aggregate | committed native aggregate status | run snapshot drives profile/calculation identity |

External Swiss/JPL parity and owner-gated non-dusthana mechanism families are `BLOCKED`. They are never inferred PASS.

## Report projection contract (PR-8B adapter boundary)

A report is parity-preserving only when it retains the canonical conclusion status, temporal scope, subject/candidate identity, cited evidence grounding, and evidence/provenance ownership. The report may vary presentation wording and omit non-cited presentation detail, but it must not strengthen an unavailable, unresolved, or challenged conclusion, substitute lifetime evidence for selected-period evidence, or cite evidence that is not grounded in the canonical result. Native status vocabularies remain authoritative; report wording is presentation only.

The stale dispositor production audit header is reconciled: the production context is wired by `canonicalCareerFoundationBuilder` and invoked from `interpretCareerV2`; dispositor production reachability is no longer described as test-only.

## Production acceptance adapter

`goldenAcceptanceProductionHarness.ts` runs `interpretCareerV2` and `interpretWealthV2` once for a chart fixture, then passes those same domain results through the product selectors, selected-period builder, AI context builders, reasoning trace output, and JSON exporter. It derives parity expectations from the real C11 and CW-05 canonical results. The canonical-vs-approved-baseline check and canonical-vs-surface parity check are separate gates; the latter extracts each surface's emitted status, evidence IDs, and provenance.

C11 `evidenceIds`, `sourceIds`, and `ruleIds` are not parallel arrays: source occurrences may repeat and the arrays can have different lengths. Acceptance provenance therefore joins by the evidence object's own provenance fields and leaves unavailable fields absent; it does not use positional trace lookup.

### Trace-only provenance gaps

The acceptance layer intentionally does not represent C11 trace-only provenance (the `evidenceTrace.sourceIds` and `evidenceTrace.ruleIds` arrays). These arrays are index-paired at the trace graph level but are not joinable to individual evidence records via a stable key. Instead, acceptance provenance is derived from the `DomainEvidence.provenance` field on each evidence record, which provides source/rule attribution directly on the evidence object. This means:

- Trace array sourceIds (e.g., `AD:SATURN:MODIFIER:UNAVAILABLE:ACTIVATION:DOES_NOT_ACTIVATE`) are not represented in acceptance contracts
- Trace array ruleIds that exist only in the trace and not on individual evidence records are not represented
- Evidence-level provenance (via `DomainEvidence.provenance.source` and `DomainEvidence.provenance.ruleId`) is fully represented
- The `_trace` parameter was removed from `projectDomainEvidenceToAcceptanceProvenance` to eliminate the dead join attempt

### Known surface gaps

The following surfaces have known parity gaps documented:

- **reasoning-trace**: Uses trace graph evidence which may include evidence not in canonical synthesis; parses status from node label as fallback (typed status field preferred). This surface is documented as a trace-view parity surface, not a canonical synthesis surface.
- **json-export**: Includes additional evidence beyond canonical synthesis (e.g., Dasha evidence, yoga confirmation evidence, aspect evidence). The export contract is explicitly broader than the canonical synthesis contract.
- **report-renderer**: BLOCKED until PR-8D adapters exist.
- **AppController async-state**: BLOCKED until PR-8D adapters exist.
