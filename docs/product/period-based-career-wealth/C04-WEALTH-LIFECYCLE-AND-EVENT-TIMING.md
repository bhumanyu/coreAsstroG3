# C04 — Wealth Lifecycle and Event Timing

## 1. Authority and scope

C04 is a deterministic downstream candidate-analysis layer. It consumes the existing Wealth `DomainEvidence`, the canonical MD/AD/PD activation records, C01 financial facts (only when explicitly provided), and the Wealth CW-05 final synthesis.

C04 does not:
- recalculate astrology, Vimshottari periods, or CW-05;
- change CW-05's four Wealth dimensions;
- assert that the user owns an asset, receives income/gains, has debt, has liquid funds, repays debt, experiences erosion/recovery, or receives inheritance;
- produce financial advice, numeric probabilities, guarantees, expected returns or cash-flow forecasts.

CW-05 remains the final Wealth authority. C04 candidates are subordinate interpretation indications, not real-world events.

## 2. Taxonomy and release state

All requested categories are registered in `WEALTH_LIFECYCLE_RULE_CATALOGUE`.

| Category | State | Existing canonical evidence basis | Restriction |
|---|---|---|---|
| Accumulation | Validated indication | D1 `SECOND_HOUSE` / `SECOND_LORD`, dimension `ACCUMULATION` | Indicates an astrological accumulation theme only, not asset ownership or a balance |
| Gains | Validated indication | D1 `ELEVENTH_HOUSE` / `ELEVENTH_LORD`, dimension `GAINS` | Indicates an astrological gains theme only, not realized gain, salary, income or cash receipt |
| Asset-building indication | Unvalidated | No event-specific rule | Not emitted |
| Preservation | Unvalidated | No dedicated preservation rule/evidence family | Not emitted |
| Erosion/challenge | Unvalidated | Challenge evidence alone is not actual loss or asset erosion | Not emitted |
| Debt exposure indication | Unvalidated | No canonical Debt dimension/rule family | Not emitted |
| Debt repayment/reduction indication | Unvalidated | No debt-balance lifecycle rule | Not emitted |
| Liquidity pressure | Unvalidated | No dedicated liquidity rule/evidence family | Not emitted |
| Liquidity relief | Unvalidated | No dedicated liquidity rule/evidence family | Not emitted |
| Recovery | Unvalidated | No validated prior-challenge-to-later-support sequence rule | Not emitted |
| Inheritance indication | Unvalidated | No dedicated inheritance rule or golden fixtures | Not emitted |

The initial supported set is deliberately limited to the two categories whose D1 structural evidence is already represented in the current Wealth engine. Future category activation requires its own rule owner, evidence-family contract, provenance mapping, counter-evidence policy and independently reviewed positive/negative golden fixtures.

## 3. Accumulation and Gains qualification

For each event category enabled by a validated contract, the engine requires all of the following:

1. A D1 `NATAL_PROMISE` occurrence in the category's expected Wealth dimension and allowed evidence family.
2. A non-empty occurrence ID, semantic identity and rule ID.
3. Exact membership in the CW-05 top-level and corresponding dimension natal-evidence occurrence references.
4. Exact rule ID membership in the corresponding CW-05 dimension's natal-rule references.
5. A CW-05 dimension promise/status that is not challenged or insufficient, and an activation state supporting or mixed.
6. No unresolved supporting-versus-challenging natal evidence conflict for that dimension.
7. An MD, AD or PD timing activation occurrence included in that period activation's evidence IDs, whose own `relatedEvidenceIds` directly references the accepted natal occurrence ID.
8. A dimension-specific period effect of `ACTIVATES` or `PARTIALLY_ACTIVATES`.

A Dasha occurrence alone can never create an event. An activation with an unrelated or missing natal link is suppressed. Missing natal promise, missing activation, unlinked timing, CW-05 mismatch and conflicts are returned as explicit diagnostics.

## 4. Candidate window semantics

- Each candidate retains its original source period ID, period level, natal occurrence IDs, activation occurrence IDs, rule IDs, semantic identities and root identity keys.
- Dates are copied only from the canonical active MD/AD/PD nodes. C04 does not calculate, shift, interpolate, expand or extend a Dasha period.
- Date-only intervals have `PERIOD_ONLY` precision; they do not imply intraday precision.
- Invalid or missing dates produce an untimed/conditional candidate only if the natal, CW-05 and linked activation gates otherwise pass.
- Overlapping MD/AD/PD source intervals remain distinct candidate windows. They are never merged into a larger synthetic period.
- `PARTIALLY_ACTIVATES` or a mixed CW-05 dimension produces `CONDITIONAL`, not an unconditional candidate.
- No numeric probability or guarantee is emitted.

## 5. C01 financial fact separation

C01 user-reported or connected-provider facts remain in their financial-data namespace. C04 validates the supplied C01 dataset before reporting source fact IDs. It does not convert those IDs into astrological evidence and does not use actual balances/holdings as evidence of a horoscope-derived lifecycle event.

The reverse direction is also prohibited: chart-derived indications cannot populate actual financial facts. Actual assets, debt, inheritance receipt, liquidity, repayment and realized gains require user-supplied or connected-source records and remain facts, not C04 predicted events.

## 6. Diagnostics and missing data

C04 returns explicit diagnostics for:
- missing CW-05 authority;
- unsupported/unvalidated event rules;
- absence of a supported D1 natal promise;
- Dasha-only evidence or Dasha that does not link to a natal promise;
- missing MD/AD/PD activation;
- conflicting natal evidence;
- invalid financial-data source records;
- invalid source-period intervals;
- overlapping source periods that must be preserved separately;
- absence of any qualified candidate.

Missing data is not treated as a negative astrological verdict or a factual event. A lack of a candidate means the qualification contract was not met or the event rule remains disabled.

## 7. Tests

The C04 test suite covers:
- all 11 taxonomy entries and enabled/disabled state;
- positive Accumulation and Gains indication candidates;
- Dasha-only suppression;
- no natal promise;
- missing Dasha activation;
- conflicting natal evidence;
- CW-05 occurrence/rule reference mismatch;
- missing CW-05 authority;
- user-reported financial fact separation;
- invalid/forged C01 source dataset;
- conditional activation;
- invalid period intervals;
- overlapping windows preserved as separate source windows;
- view-model legacy defaults and UI disclaimer/status output;
- interpreter integration preserving CW-05 authority.

No debt, liquidity, preservation, erosion, recovery, asset ownership, or inheritance event rule is activated by this release.
