# A07 — Career C11 Confidence and Coverage Correction

## Authority and separation
C11 remains the sole final Career synthesis authority. `finalStrength` and `finalStatus` continue to express Career promise/status; `confidence` expresses how complete and trustworthy the available analytical evidence is. The confidence policy never rewrites promise strength.

## Evidence-layer classification
| Layer | Classification | Availability rule |
|---|---|---|
| Natal (C4–C7) | Required | Natal direction is not `UNAVAILABLE` and natal strength is not `UNDETERMINED` |
| Dasha (C9) | Supporting | Canonical Dasha effect and direction are both usable; `INSUFFICIENT_DATA`/`UNAVAILABLE` are absent |
| D10 (C10) | Supporting | D10 direction is not `UNAVAILABLE` |
| Expression (C8) | Supporting | Mapped expression direction is not `UNAVAILABLE` |
| Transit | Optional | Transit direction is not `UNAVAILABLE` |

## Deterministic confidence policy
- Base confidence is derived from an independent evidence-quality assessment when supplied. If none is supplied, complete provenance defaults to HIGH and partial/unknown provenance defaults to MEDIUM. Natal promise strength is not used as confidence quality.
- Missing required natal evidence caps confidence at LOW.
- One missing supporting layer caps confidence at MEDIUM. Two or more missing supporting layers cap it at LOW.
- Missing optional transit evidence is reported but does not cap confidence.
- Any HIGH-severity conflict caps confidence at LOW. Otherwise any MODERATE-severity conflict caps it at MEDIUM. LOW-severity conflicts do not apply a cap.
- If any provenance arrays are supplied but evidence/source/rule IDs are not all present, provenance is PARTIAL and confidence is capped at MEDIUM.
- An explicit LOW or MEDIUM evidence-quality assessment applies the matching confidence cap/reason; this is independent of `finalStrength`.
- If no provenance arrays are supplied, provenance is NOT_PROVIDED and is explicitly reported without assuming it is complete or silently applying a cap.

Every cap is represented in `confidenceReasons`; each layer's requirement and availability, missing-layer lists, independent evidence quality, and provenance state are exposed in `confidenceCoverage`.

## Product projection
The canonical C11 confidence coverage and reasons are included in `AiCareerCanonicalC11Fact` through `projectCanonicalCareerC11`. The projection type guard rejects C11 values that omit the new metadata.

## Validation
Regression cases cover full evidence, missing Dasha, missing D10, missing expression, optional missing transit, high-severity conflict, partial provenance, and deterministic repeat execution. Run:
```bash
npm run lint
npm test -- --run src/domain/career/careerFinalSynthesis/careerFinalSynthesis.test.ts
npm test -- --run src/ai/context/careerIntelligenceProjection.test.ts
npm run build
```

Execution status is recorded separately; the presence of fixtures does not imply tests passed.
