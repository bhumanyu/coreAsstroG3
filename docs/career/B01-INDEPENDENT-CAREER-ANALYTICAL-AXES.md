# B01 — Independent Career Analytical Axes

**Status:** Initial projection implemented; Sustainability remains explicitly unavailable pending a validated source evidence family.

## Boundary

B01 adds five independent analytical projections to the canonical `CareerFinalSynthesisResult`:

- Promise
- Activation
- Sustainability
- Risk
- Timing

The projection is composed in `CareerDomainInterpreterV2.ts` from the same canonical C4–C10 inputs passed to C11. It does not add a new astrology evaluator, score, probability, or final conclusion. `synthesizeCareerFinal` remains the only final Career conclusion authority. The axes are attached to `CareerConclusionData` as a sibling of `canonicalCareerFinalSynthesis`, not as fields inside `CareerFinalSynthesisResult`; this preserves the exact C11 output contract and golden snapshots.

## Source mapping

| Axis | Canonical source | Projection | Current coverage |
|---|---|---|---|
| Promise | C4–C7 `CareerNatalAnalysis` | Structural direction/strength plus mappable natal evidence occurrence IDs | Available when classification and occurrence provenance are present; otherwise partial/insufficient |
| Activation | C9 `CareerDashaCanonicalAnalysis` and MD/AD/PD hierarchy | Overall direction/effect/strength/dominant level plus C9 evidence occurrences | Available only when all three levels have usable activation evidence; otherwise partial/unavailable/insufficient |
| Sustainability | No validated Career sustainability evidence family currently exists | Explicit `NOT_ASSESSED` result | Unavailable; no proxy from expression, D10, promise, or a single positive event |
| Risk | Adverse C4 natal, C9 Dasha, C10 D10 evidence and C11 conflict diagnostics | Adverse occurrence IDs and counter-evidence occurrence IDs | Partial when any required source/provenance family is missing |
| Timing | C9 canonical MD/AD/PD activation hierarchy | Source-dated candidate windows with effect, direction, strength, linked natal identity references, occurrence IDs, and rule IDs | Available only when all three levels have usable evidence and source dates; otherwise partial/unavailable/insufficient |

## Contract semantics

Each axis contains:

- `status`: `AVAILABLE`, `PARTIAL`, `UNAVAILABLE`, `INSUFFICIENT`, `BLOCKED`, or `NOT_APPLICABLE`.
- `result`: typed classification or `null`.
- `supportingEvidenceOccurrenceIds` and `conflictingEvidenceOccurrenceIds`: occurrence/source IDs, not semantic identity keys.
- `ruleIds` and `methodVersion`.
- `coverage`: available/missing source families and occurrence count.
- `confidence`: `NOT_ASSESSED` until an axis-specific confidence contract exists. C11 overall confidence is deliberately not copied into each axis.
- `unavailableReason` or `diagnostic` when appropriate.

For Timing, `activatedPromiseEvidenceIds` remain semantic identity references and are kept separate from occurrence IDs. Dates are copied from canonical Dasha periods; no dates are inferred or extended. `guarantee` is always `NONE`.

## Product projection

The axes are carried through:

1. `CareerConclusionData.careerAnalyticalAxes` (sibling of `canonicalCareerFinalSynthesis`)
2. `LifeAnalysisCareerDetailViewModel.analyticalAxes`
3. `CareerProductAnalysis.analyticalAxes`
4. `CareerViewModel.analyticalAxes`

The product mapper clones nested arrays/objects and does not calculate axis semantics.

## Current limitations and dependencies

1. **Sustainability is not yet assessable.** A future upstream workstream must define canonical evidence for continuity, stability, and repeatability, with explicit provenance and validation. Until then, the axis remains unavailable.
2. **Timing windows are Dasha-period candidates only.** They are not guaranteed outcomes and do not use downstream P2-09B event candidates, because P2-09B is a C11 consumer and must not feed back into C11.
3. **Axis confidence is not calibrated.** Coverage is reported; axis-specific confidence is explicitly `NOT_ASSESSED`.
4. A fully available five-axis fixture is not currently valid because the sustainability evidence family does not exist. Tests therefore assert all currently supported axes are available while Sustainability remains unavailable.

## Tests added

- Strong Promise with challenging Activation.
- Strong Promise with elevated D10 Risk.
- Promise available while Sustainability is unavailable.
- Timing unavailable without the canonical Dasha hierarchy.
- Partial Timing when periods lack dates or usable activation evidence.
- C11 semantic conflict IDs resolve to source occurrence IDs at the Risk projection.
- All currently supported axes available while Sustainability remains unavailable.
- ProductAnalysis and CareerViewModel preserve the axes as a pure projection.

Run the focused suites and full verification in the repository:

```bash
npm test -- src/domain/career/careerFinalSynthesis/careerAnalyticalAxes.test.ts
npm test -- src/domain/career/careerFinalSynthesis/careerFinalSynthesisIntegration.test.ts
npm test -- src/product/analysis/__tests__/productAnalysisMapper.test.ts
npm run verify
```
