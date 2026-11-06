# D06 — Guided Wealth Journey

## Objective

Present canonical Wealth intelligence as a guided UI journey while keeping CW-05 as the only Wealth conclusion authority and separating chart-derived indications from optional real-world financial information.

## Journey mapping

1. Wealth overview — CW-05 overall conclusion and canonical D01 confidence.
2. Accumulation — canonical Accumulation dimension.
3. Gains — canonical Gains dimension.
4. Fortune — canonical Fortune dimension.
5. Speculation — canonical Speculation dimension and C03 limitations.
6. Financial concepts — C01 Income, Savings, Assets, Asset Ownership, Inheritance, Debt/Liabilities, Cash Flow, Liquidity, Net Worth and Consumption/Luxury. Trading Exposure and Trading History remain C01 source concepts used in C03 risk status.
7. D2 — canonical Wealth D2 status. It remains UNAVAILABLE while C02A independent parity and C02B approval are blocked.
8. Timing — existing Dasha, transit and C04 lifecycle candidates; no dates or events derived in the UI.
9. Risk and confidence — qualitative risk/suitability status separated from CW-05 confidence.
10. Evidence and provenance — existing Wealth evidence and D03 diagnostics.

## Financial data projection

The page consumes `WealthProductAnalysis.financialData` through the existing C01 validation boundary in `selectWealthViewModel`. It does not collect, calculate, or connect financial data.

- `USER_REPORTED_FINANCIAL_FACT`, `CALCULATED_FINANCIAL_METRIC`, and `CONNECTED_FINANCIAL_SOURCE` appear in the financial fact section only after C01 validation.
- `ASTROLOGICAL_INDICATOR` appears in a separate chart-indication group.
- `UNAVAILABLE` values are not rendered as facts and retain their unavailable reason.
- Invalid source classification fails closed to the unavailable C01 dataset.
- Formula/input/provider/user report provenance is shown in an expandable disclosure.
- D06 adds no form, storage, transmission, connector, ledger, or financial calculation behavior. The privacy note explicitly states that this screen displays already supplied values only.

## Authority and safety

- CW-05 remains sole Wealth synthesis/confidence owner.
- Four dimensions remain intact and independent.
- D2 is not upgraded by the UI. The existing `WealthD2Section` independently hardcodes UNAVAILABLE while C02B remains blocked.
- Lifecycle/Dasha windows are candidate indications, never actual financial events.
- No actual income, savings, debt, assets, liquidity, net worth, investment behavior or suitability is inferred from the horoscope.
- No numeric risk score, expected return, probability, or financial recommendation is computed.

## Tests

D06 tests cover:
- Ten-step guided journey and real anchor destinations.
- Four dimensions rendered separately.
- D2 remains unavailable even if an incoming persisted ProductAnalysis declares CONFIRMS.
- Default C01 records remain unavailable when no financial data is supplied.
- User-reported financial data displays only with C01 provenance.
- Astrology-only C01 indicators remain separate from financial facts.
- Invalid financial data classification fails closed.
- Speculation limitations and qualitative risk/confidence separation.

Responsive layout uses single-column small-screen cards, multi-column wide-screen layouts, semantic navigation/regions/headings, keyboard-visible focus, and disclosure elements for provenance details.
