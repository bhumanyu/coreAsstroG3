# B02 — Career Outcome and Success Qualification

## Purpose

B02 is a deterministic downstream qualification layer. It distinguishes natal promise, Dasha activation, existing candidate windows, execution/qualification conditions, counter-indications, and explicitly observed career outcomes.

It does **not** predict a guaranteed promotion, job change, leadership appointment, salary increase, business launch, or business success. It does not introduce a success score or probability.

## Existing authorities consumed

- **B01:** `CareerAnalyticalAxes` supplies independent Promise, Activation, Risk and Timing projections. Sustainability remains unavailable until its upstream evidence family is validated.
- **C11:** `CareerFinalSynthesisResult` remains the sole final Career conclusion authority and supplies its existing conflict diagnostics.
- **P2-09A:** `CareerTrajectoryAnalysis` supplies qualified expression-derived opportunities.
- **P2-09B:** `CareerEventsAnalysis` supplies candidate opportunity/conditional windows. B02 consumes these candidates and does not modify or replace the event engine.
- **C10 / P2-10A:** Existing profession/D10 qualification is used only as an execution-related astrological condition. It is not evidence of real-world skills, employer demand, or user action.

B02 is composed after these outputs in `interpretCareerV2`. It never feeds back into C11.

## Outcome vocabulary

Candidate outcome categories are broad and manifestation-mode aligned:

| Candidate category | Existing Career modes |
|---|---|
| `ROLE_OR_AUTHORITY_EXPANSION` | LEADERSHIP, MANAGEMENT, AUTHORITY |
| `EMPLOYMENT_OR_SERVICE_OPPORTUNITY` | EMPLOYMENT, SERVICE_EMPLOYMENT |
| `TECHNICAL_SPECIALIZATION_OR_SKILL_DEVELOPMENT` | SPECIALIZATION, TECHNICAL_SPECIALIZATION |
| `INDEPENDENT_OR_BUSINESS_ACTIVITY` | INDEPENDENT_WORK, ENTREPRENEURSHIP, BUSINESS_ENTREPRENEURSHIP |
| `PUBLIC_OR_INSTITUTIONAL_CAREER` | PUBLIC_INSTITUTIONAL |
| `GENERAL_CAREER_OPPORTUNITY` | Unmapped existing manifestation modes |

These categories describe the direction of a candidate opportunity. They are not event-specific predictions. Specific events such as PROMOTION, JOB_CHANGE, BUSINESS_LAUNCH, LAYOFF_OR_JOB_LOSS, and COMPENSATION_CHANGE exist only in the observed-fact vocabulary.

## Qualification rules

1. Natal Promise must be `AVAILABLE`, have supportive/conditional direction, and carry supporting occurrence provenance. C11 natal direction must also remain supportive/conditional and natal strength must not be undetermined.
2. Activation must be `AVAILABLE`, have SUPPORT direction, an `ACTIVATES` or `PARTIALLY_ACTIVATES` effect, and supporting occurrence provenance.
3. An existing P2-09B event must be `CANDIDATE`, be an opportunity or conditional window, reference a qualified P2-09A opportunity, carry a non-null activation identity, and retain evidence overlap with its source opportunity.
4. If either Promise or Activation is absent, partial, unavailable, non-supportive, or unlinked, B02 does not emit a candidate outcome.
5. C11 challenge/mixed conflicts and B01 Risk occurrences are carried as counter-indications. HIGH C11 conflicts make a candidate conditional; they do not get silently discarded.
6. D10/profession qualification is shown separately. If D10 qualification is absent or profession analysis is incomplete, the candidate remains conditional.
7. Practical execution is always `NOT_ASSESSED`. Skills/experience fit, a real-world opening, user action, employer/market context and resource constraints are explicit checks outside the horoscope engine.

## Status vocabulary

- `CANDIDATES_AVAILABLE` — at least one existing opportunity window passed Promise + Activation gates and has no qualification caveat under the implemented checks.
- `CONDITIONAL` — one or more candidates remain, but conditional timing, counter-indications, or incomplete D10/profession qualification apply.
- `UNRESOLVED` — some evidence exists, but required Promise/Activation linkage or a P2-09B candidate is missing.
- `INSUFFICIENT` — no usable Promise or Activation evidence is available.

Missing Dasha is not treated as negative evidence; it yields UNRESOLVED/INSUFFICIENT and no candidate.

## Observed outcomes — separate source

`CareerObservedOutcomeInput` is a separate caller-supplied input. Each record must carry a stable caller-provided report ID, a concrete observed outcome type, a statement, and the literal source `USER_REPORTED`. Optional dates are validated but never inferred.

The `observedOutcomes` output is a verbatim-normalized projection of that input. B02 never creates observed records from:
- natal promise,
- Dasha activation,
- trajectory opportunities,
- event candidate windows,
- C11 conclusion/conflicts,
- D10/profession qualification.

The product service accepts these facts through `RunLifeAnalysisProductOptions.observedCareerOutcomes`. If omitted, the observed collection is empty. Observed facts are not automatically added to AI context.

## Probability and guarantee policy

The output explicitly exposes:
- `guaranteedOutcomeAvailable: false`
- `numericProbabilityAvailable: false`

There is no probability, percentage, confidence score, or success-rate field. No statistical calibration dataset has been established.

## Versioning and provenance

- Reasoning version: `B02`
- Method version: `B02-OUTCOME-QUALIFICATION-v1`
- Candidate IDs are deterministic and derived from existing P2-09B event IDs.
- Natal/activation occurrence IDs, P2-09B semantic evidence IDs, rule IDs, C11 semantic conflict identities, and user report IDs remain separate namespaces.

## Tests

The B02 suite covers:
- Promise without Activation.
- Activation without Promise.
- Promise + linked Activation.
- Promise + Activation + HIGH counter-indication.
- Missing Dasha.
- User-reported fact versus chart-derived candidate separation.
- No numeric probability or guaranteed success.
- Product projection and explicit user-reported input forwarding.
- Production interpreter emits B02 while default observed outcomes remain empty.

## Non-goals

- Guaranteeing promotion, job change, leadership appointment, salary increase, or business success.
- Inferring a real-world outcome from a chart.
- Building a statistical career-outcome model without a suitable labelled dataset.
- Replacing or modifying P2-09A trajectory or P2-09B candidate-window generation.
