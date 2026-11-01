# A08 — D2 Unavailability Guardrails

## Canonical policy
D2 remains `UNAVAILABLE` in canonical Wealth reasoning until both the D2 calculation and its interpretation have passed independent validation. Evidence plumbing, a single relationship declaration, polarity, or a legacy status string is not an approval signal.

## Containment boundaries
- `resolveD2ProducerRelationship` always returns `UNAVAILABLE` while the validation gate is closed.
- `evaluateD2Relationship` is a fail-closed compatibility boundary and cannot infer a relationship from declarations or polarity.
- Wealth data completeness reports D2 as `UNAVAILABLE` regardless of mapped D2 records.
- Wealth manifestation synthesis ignores incoming D2 declarations, emits `d2Support: UNAVAILABLE`, and creates no D2 support/challenge factor.
- CW-05 ignores `d2Relationship`, D2 synthesis evidence and manifestation D2 hints for relationship, confidence, status, and canonical evidence-ID aggregation. Raw mapped D2 occurrences may remain in the diagnostic `d2Evidence` field, explicitly marked as unvalidated.
- CW-05 and Wealth conclusion projections expose `divisionalStatus: UNAVAILABLE` and an explicit `d2AvailabilityReason`.
- Varga confirmation DTOs carry explicit unavailable availability/reason metadata when D2 is present only as diagnostic evidence; their relationship, strength and confidence are forced to UNAVAILABLE/UNDETERMINED rather than retaining incoming claims.
- AI context, life-analysis, product-analysis, reasoning-view-model, chart-export and UI adapters all force D2 to UNAVAILABLE; incoming declarations and stale statements cannot upgrade or contradict the gate.
- AI Wealth manifestation and final-synthesis projections preserve the unavailable state and reason.

## Confidence and completeness
Unvalidated D2 evidence is not counted as an evidence source and cannot increase coverage or confidence. CW-05 final-confidence quality classifies the gated D2 axis as `NOT_APPLICABLE` and excludes it from confidence-axis counts. The product-level overall confidence calculation also excludes gated D2 rather than treating it as a missing required layer. D2 is not interpreted as negative evidence; its absence is represented as unavailable, not as a challenge.

## Gates required before D2 can become available
1. D2 chart construction and planetary/house mapping are independently verified against approved reference fixtures.
2. Calculation outputs are deterministic and reproducible across the supported calculation path.
3. Interpretation rules and relationship semantics are reviewed independently of the producer's declaration fields.
4. Evidence occurrence, identity, rule and source provenance are validated end-to-end.
5. Golden fixtures cover absent, malformed, single and conflicting relationship declarations, plus representative chart cases.
6. The validation suite passes on the release candidate and an explicit domain approval changes this containment policy.

No partial mapper, adapter, producer declaration or UI flag can bypass these gates.


## Gate required before D2 can become available

D2 may be promoted only in a separate approved change after all of the following are satisfied:

1. **Calculation validation:** D2 chart construction is independently cross-checked against trusted reference calculations over representative golden birth details, including timezone, ayanamsa and boundary cases.
2. **Mapping validation:** planetary placements, signs, houses and D2-to-source-chart links are verified, including malformed and incomplete chart inputs.
3. **Interpretation validation:** the D2 relationship policy is independently reviewed and has deterministic semantics for support, challenge, neutral, partial and conflicting evidence.
4. **Evidence validation:** every D2 evidence occurrence has stable occurrence identity, producer/source rule provenance, and valid links to its original chart inputs.
5. **Regression validation:** absent, malformed, single-declaration, multi-conflict, confidence/completeness, AI projection, product UI and export fixtures all pass.
6. **Explicit approval:** the domain/product owner approves the validation report and a dedicated change updates the canonical availability policy and every downstream adapter together.

Until all gates pass, the only valid canonical and projected D2 state is `UNAVAILABLE`. Raw D2 data may be retained for diagnostics but cannot contribute a relationship, strength, confidence, evidence coverage or wealth conclusion.
