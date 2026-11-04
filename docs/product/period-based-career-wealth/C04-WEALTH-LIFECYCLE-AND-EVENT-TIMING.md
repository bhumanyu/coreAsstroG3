# C04 — Wealth Lifecycle and Event Timing

## Authority and scope

C04 is a deterministic downstream candidate-analysis layer. It consumes existing Wealth `DomainEvidence`, dimension-specific MD/AD/PD activations, optional validated C01 financial facts, and canonical CW-05 output. It does not recalculate Jyotish, Dasha or CW-05. CW-05 remains the final Wealth authority.

C04 candidates are astrological lifecycle indications only. They are not actual financial events, guarantees, numeric probability, expected return, cash-flow projections, or financial advice.

## Taxonomy and release state

The C04 catalogue registers all requested categories:

| Category | State | Natal basis / evidence contract | Limitation |
|---|---|---|---|
| Accumulation | Enabled as an indication candidate | D1 `SECOND_HOUSE` / `SECOND_LORD`, dimension `ACCUMULATION` | Not verified ownership, acquisition or account balance |
| Gains | Enabled as an indication candidate | D1 `ELEVENTH_HOUSE` / `ELEVENTH_LORD`, dimension `GAINS` | Not actual income, realized gains or cash receipt |
| Asset-building indication | Disabled / unvalidated | No event-specific acquisition rule or approved golden fixtures | Does not assert asset ownership/acquisition |
| Preservation | Disabled / unvalidated | No dedicated preservation rule/evidence family | No preservation event asserted |
| Erosion/challenge | Disabled / unvalidated | Challenge evidence is not actual erosion or loss | No loss asserted |
| Debt exposure indication | Disabled / unvalidated | No canonical Debt dimension/event rule | Does not assert debt exists |
| Debt repayment/reduction indication | Disabled / unvalidated | No validated debt-balance lifecycle rule | Does not assert debt repayment or reduction |
| Liquidity pressure | Disabled / unvalidated | No dedicated liquidity-pressure evidence family/rule | Does not infer bank balance or cash pressure |
| Liquidity relief | Disabled / unvalidated | No dedicated liquidity-relief evidence family/rule | Does not infer liquid funds |
| Recovery | Disabled / unvalidated | No validated ordered challenge-to-support recovery rule | Does not assert financial recovery |
| Inheritance indication | Disabled / unvalidated | No dedicated inheritance rule or independent golden fixtures | Does not assert receipt/legal transfer |

Only Accumulation and Gains are enabled in this increment because the canonical Wealth engine already has their D1 structural families and dimension-mapped Dasha linkages. Every other category remains disabled until its own rule owner, evidence-family mapping, provenance contract, conflict policy and independent positive/negative fixtures are approved.

## Qualification gates for enabled indications

A candidate requires all of the following:
1. A D1 `NATAL_PROMISE` occurrence in the correct Wealth dimension and allowed evidence family.
2. Non-empty occurrence ID, semantic identity and canonical rule ID.
3. Exact occurrence and rule ID agreement with both the top-level CW-05 natal set and that dimension's CW-05 `natalEvidenceIds` / `natalRuleIds`.
4. CW-05 dimension promise/status that is not challenged or insufficient, with dimension-level `activationStatus` and `timingStatus` of SUPPORT or MIXED.
5. No unresolved supporting-vs-challenging natal conflict for the same dimension.
6. An MD, AD or PD activation evidence occurrence present in that period activation's `evidenceIds`, with its own `relatedEvidenceIds` directly linking to the accepted natal occurrence.
7. The same dimension's period activation effect is `ACTIVATES` or `PARTIALLY_ACTIVATES`.

Dasha alone cannot create an event. Unlinked timing evidence, absent natal promise, missing period activation, CW-05 reference mismatch, or unresolved conflicts suppress the candidate and surface a diagnostic.

## Candidate windows

- Every candidate retains exact source period ID/level, natal and activation occurrence IDs, rule IDs, semantic identities and root identity keys.
- Start/end are copied verbatim from canonical active MD/AD/PD nodes; no dates are recalculated, expanded, shifted, interpolated or merged.
- Source date-only intervals have `PERIOD_ONLY` precision; no intraday precision is implied.
- An otherwise qualified indication with an invalid/missing source interval is conditional and untimed; it does not receive an invented date.
- Overlapping MD/AD/PD intervals remain distinct. No synthetic wider period is created.
- `PARTIALLY_ACTIVATES` or a mixed CW-05 dimension produces a conditional candidate.
- No guarantee or numeric probability is emitted.

## Financial fact separation

C01 user-reported or connected-provider records are validated and retained only as observed financial facts in the C01 namespace. Their IDs may be reported separately for traceability; they are never converted into astrology evidence or proof of an event.

Astrological indications cannot populate actual financial facts. Actual assets, debt, inheritance receipt, liquidity, repayment and realized gains require explicit user-reported or connected-source data and remain separate from C04 candidates.

## Missing data and diagnostics

C04 reports explicit conditions for missing CW-05 authority, unvalidated event rules, absent natal promise, Dasha-only timing, missing/unlinked activation, conflicting natal evidence, invalid C01 data, invalid period interval and overlapping source windows. Absence of a candidate is not a factual negative verdict.

## Tests

Coverage includes taxonomy/release state, Accumulation and Gains positive candidates, Dasha-only suppression, no natal promise, missing Dasha, conflicts, CW-05 reference mismatch/absence, user-reported financial fact separation, invalid C01 datasets, conditional activation, invalid intervals, overlapping MD/AD windows, view-model/UI disclosures, and interpreter integration with CW-05 preserved.

No Debt, Liquidity, Preservation, Erosion, Recovery, Asset-building or Inheritance rule is activated by this increment.
