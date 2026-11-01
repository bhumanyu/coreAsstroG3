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
