# OV-01 — User-facing interpretation audit

**Baseline:** `main` at `94dfdeea735810dfa3340bfdc668e0f9d3d36305`  
**Scope:** Overview, Career, Wealth, Dasha & Timing, Why This Result?, Detailed Analysis  
**Invariant:** Presentation only. Canonical enum values, calculations, domain rules, evidence IDs, provenance and result ownership remain unchanged.

## Findings from source inspection

The application already has separate presentation formatters in:

- `src/components/overview/overviewFormat.ts`
- `src/components/career/careerFormat.ts`
- `src/components/wealth/wealthFormat.ts`
- `src/components/dasha/dashaFormat.ts`
- `src/components/reasoning/reasoningFormat.ts`
- `src/product/life-analysis/domainPresentationUtils.ts`

These formatters are not yet one shared contract. For example, Career and Wealth format conclusion values as title-cased labels such as “Mixed” or “Strongly Supported”; those labels do not explain the meaning. Dasha formatters return short technical labels for activation and transit states. The Overview selector forwards `career.synthesis.statement` / `wealth.synthesis.statement` directly when present, so a synthesis statement that embeds enum combinations can reach the Overview card unchanged.

The canonical product classifications inspected in `src/product/analysis/productAnalysisTypes.ts` include:

| Family | Canonical values observed |
|---|---|
| Analysis status | `READY`, `PARTIAL`, `ERROR` |
| Confidence | `LOW`, `MEDIUM`, `HIGH` |
| Temporal relation | `PAST`, `CURRENT`, `FUTURE`, `UNKNOWN` |
| Availability | `AVAILABLE`, `UNAVAILABLE`, `CONDITIONAL`, `PARTIAL` |
| Evidence direction | `SUPPORT`, `CHALLENGE`, `NEUTRAL`, `MIXED`, `UNAVAILABLE` |
| Evidence role | `PRIMARY`, `SUPPORTING`, `CHALLENGING`, `MODIFIER`, `REFINEMENT`, `CONFLICTING`, `NEUTRAL` |
| Promise strength | `VERY_STRONG`, `STRONG`, `MODERATE`, `WEAK`, `VERY_WEAK`, `UNAVAILABLE` |
| Conclusion status | `STRONGLY_SUPPORTED`, `SUPPORTED`, `MIXED`, `CHALLENGED`, `LIMITED`, `UNAVAILABLE` |
| Activation effect | `ACTIVATES`, `PARTIALLY_ACTIVATES`, `DOES_NOT_ACTIVATE`, `CHALLENGES`, `STRONGLY_SUPPORTS`, `SUPPORTS`, `CONTRADICTS`, `UNKNOWN`, `INSUFFICIENT_DATA`, `UNAVAILABLE` |
| Transit effect | `TRIGGER`, `MODIFIER`, `CHALLENGE`, `NO_MATERIAL_TRIGGER`, `UNKNOWN`, `INSUFFICIENT_DATA`, `UNAVAILABLE` |
| Career analytical-axis status | `AVAILABLE`, `PARTIAL`, `UNAVAILABLE`, `INSUFFICIENT`, `BLOCKED`, `NOT_APPLICABLE` |

Other product types define workflow- and feature-specific states such as profession candidate qualification, pathway verdicts, event-window statuses, evidence coverage and confidence assessment. They must be audited at their rendering points rather than treated as synonyms for analysis availability.

## Changes in this branch

- Added `src/product/life-analysis/userFacingInterpretation.ts` as a shared presentation-only terminology contract.
- Added `userFacingInterpretation.test.ts` to cover core classification families, non-negative neutral timing, inactive timing versus natal foundation, missing-evidence handling, separation of strength/confidence, and unknown future values.
- Updated Overview formatting adapters to delegate common values to the shared interpreter.

## Interpretation safeguards

- Outcome, strength and evidence confidence are separate dimensions; do not concatenate them into opaque nested labels.
- `NEUTRAL` means no clear supportive or challenging influence is identified. It is not a negative prediction.
- `NOT_ACTIVE` is a timing statement. It does not weaken or negate natal promise.
- `UNAVAILABLE`, `INSUFFICIENT_DATA`, `BLOCKED` and `PARTIAL` must not be converted into adverse indications.
- Unknown future enum values are humanized for display, but must not be given invented domain explanations.
- Technical values may be available in an explicitly labelled advanced-details area; they must not be the primary explanation shown to ordinary users.

## Remaining work before OV-01 can be marked complete

This draft is deliberately not marked complete. The following integrations still require implementation and tests:

1. Wire the shared contract into Career, Wealth, Dasha & Timing, Why This Result? and Detailed Analysis component formatters.
2. Audit component-level and inline interpolation paths for raw enum exposure, including diagnostics, status badges, warnings and qualification titles.
3. Replace Overview raw synthesis fallback text with a structured explanation assembled from the canonical fields and evidence-backed statement; never parse or rewrite arbitrary prose with string substitutions.
4. Add an advanced technical-details disclosure that preserves canonical values without placing them in the primary narrative.
5. Add rendering tests for all six screens across every applicable status value and important combinations.
6. Run lint, unit tests, build and browser-level acceptance under the repository-supported Node/npm versions; attach the exact commit and CI evidence.

No domain calculations or canonical domain meanings were changed by this branch.
