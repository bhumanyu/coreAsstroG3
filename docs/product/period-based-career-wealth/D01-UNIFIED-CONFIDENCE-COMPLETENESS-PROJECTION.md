# D01 — Unified Confidence and Completeness Projection

## Purpose

D01 defines a product-level, presentation-only projection of Career and Wealth confidence, evidence coverage, diagnostics, and unavailable layers.

It does not compute a new confidence value. Domain confidence remains owned by:
- Career: C11
- Wealth: CW-05

## Projection contract

The shared product contract is `ProductUnifiedConfidenceProjection` (`D01-v1`).

Each domain projection contains:
- `confidence`: the exact domain-owned HIGH / MEDIUM / LOW value
- `coverage`: COMPLETE / PARTIAL / INSUFFICIENT / UNAVAILABLE / BLOCKED / NOT_APPLICABLE
- `layers`: stable layer IDs, availability state, required/optional designation and optional reason/evidence IDs
- `reasons`: source-owned or clearly identified presentation fallback explanations
- `diagnostics`: INFO / WARNING / ERROR diagnostics, including evidence/rule references when supplied
- `evidenceIds` and `ruleIds`: traceability references
- `owner`: C11 or CW-05
- `metadataSource`: DOMAIN_CANONICAL or LEGACY_PRODUCT_FALLBACK

## Ownership and compatibility

The projection selector is pure. It reads ProductAnalysis and does not invoke C11, CW-05, confidence engines, astrology engines, or evidence producers.

If canonical domain metadata is supplied through `ProductAnalysis.confidenceMetadata`, its confidence, coverage, reasons, diagnostics, and traceability are retained. The mapper supports pass-through of already-derived metadata; it does not derive that metadata.

For older persisted analyses where this metadata is absent, the view-model projection uses only existing product fields to describe visible layer availability. It marks this as `LEGACY_PRODUCT_FALLBACK`. That fallback is not represented as a full C11/CW-05 confidence breakdown and does not claim domain-owned reasons that the source record does not contain.

## State mapping

- AVAILABLE layers remain AVAILABLE.
- PARTIAL layers remain PARTIAL.
- UNAVAILABLE layers remain UNAVAILABLE.
- BLOCKED producer/required layers remain BLOCKED.
- NOT_APPLICABLE optional layers retain NOT_APPLICABLE when supplied.
- Missing required layers qualify coverage as INSUFFICIENT or UNAVAILABLE, not as negative conclusions.
- ERROR diagnostics qualify coverage as BLOCKED. WARNING and INFO diagnostics remain visible without altering domain confidence.

D2 remains explicitly UNAVAILABLE in the Wealth projection under the current A08/C02A/C02B validation gate. Its absence is not adverse evidence and it is not counted as a required layer.

## Product integration

The same projection is exposed by:
- OverviewViewModel
- CareerViewModel
- WealthViewModel

The existing overview-level completeness label is not reused as Career or Wealth domain confidence. No percentages, probabilities, or global astrology score are added.

## Tests

The D01 contract tests cover full/partial/unavailable/blocked states, D2 unavailable, diagnostic severity, conflict diagnostics supplied by domain metadata, confidence/status separation, canonical metadata pass-through, legacy fallback, and equality across overview/Career/Wealth projections.
