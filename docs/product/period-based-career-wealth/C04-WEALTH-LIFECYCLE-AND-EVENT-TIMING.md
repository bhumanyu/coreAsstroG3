# C04 — Wealth Lifecycle and Event Timing

## Current implementation and release state (reconciled 2026-11-09)

C04 is a deterministic downstream evaluator. It consumes existing Wealth evidence, MD/AD/PD period activations, CW-05 output and optional C01 financial facts. It does not recalculate Jyotish, Dasha or CW-05. CW-05 remains the sole final Wealth synthesis authority.

**Current release state: BLOCKED.** The implementation registers all 11 taxonomy categories as `UNVALIDATED` and `releaseEnabled: false`. Therefore no lifecycle candidate windows are emitted, even when natal evidence and Dasha activation exist. The product must describe this as a release-validation block, not imply that an individual chart failed qualification.

## Taxonomy

The registered categories are Accumulation, Gains, Asset-building indication, Preservation, Erosion/challenge, Debt exposure indication, Debt repayment/reduction indication, Liquidity pressure, Liquidity relief, Recovery and Inheritance indication.

All 11 categories currently remain disabled pending event-specific rule ownership, approved evidence contracts, conflict policy, independent positive/negative golden fixtures and release approval. A natal Wealth dimension is not itself a lifecycle event rule. In particular, Accumulation and Gains are not enabled merely because their natal structural evidence families exist.

## Qualification principles retained

When event categories are approved in a future increment, qualification must preserve these constraints:
1. D1 natal promise must be present in the corresponding Wealth dimension and event-approved evidence family.
2. Occurrence identity, semantic identity and canonical rule identity must remain traceable.
3. CW-05 must remain the final authority; C04 cannot revise Wealth conclusion, dimension status or confidence.
4. Dimension activation and timing must be supported by canonical MD/AD/PD evidence directly linked to the natal occurrence.
5. Dasha-only evidence cannot create a candidate.
6. Unresolved natal conflicts suppress candidate qualification.
7. Windows may copy only validated source-period intervals; no interpolation, expansion or merging of periods.
8. Invalid or absent source intervals remain untimed/conditional; no dates are invented.
9. C01 observed financial facts remain a separate namespace and are never converted into astrological events.

## Financial facts and limitations

C01 facts may be reported as observed user-reported or connected-source records when validated. They are not astrology evidence. Astrological indications cannot assert actual asset ownership, debt, inheritance receipt, repayment, liquidity, realized gains, financial loss or recovery.

C04 does not provide guarantees, numeric probabilities, return forecasts, actual cash-flow forecasts or investment advice.

## Status contract

- `BLOCKED`: no event rule has passed validation/release approval; candidate generation is disabled.
- `INSUFFICIENT`: lifecycle source inputs/evidence are absent.
- `PARTIAL` / `UNRESOLVED`: reserved for future evaluation once release-enabled event rules exist and the available evidence is incomplete or not conclusive.
- Candidate-bearing statuses must not be produced from the current catalogue.

## Next validation work

Do not change a category to `VALIDATED` or `releaseEnabled: true` without:
- an event-specific owner and rule definition;
- canonical evidence-family and occurrence-linkage contract;
- negative, positive, missing-evidence and conflict fixtures independently reviewed;
- source-period boundary and overlapping-period tests;
- separation tests against C01 actual financial facts;
- CW-05 authority-preservation tests;
- a documented approval receipt and successful required CI/release validation.

D2 remains unavailable under A08/C02A/C02B. This C04 contract does not approve D2 or use it as evidence.
