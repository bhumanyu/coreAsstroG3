# C01 — Wealth Financial Concepts and Data Contract

**Implementation branch:** `feat/wealth-c01-financial-data-contract`  
**Astrological authority:** CW-05 remains the sole Wealth synthesis authority.

## Separation

The four existing astrological dimensions remain Accumulation, Gains, Fortune, and Speculation. They remain chart-derived indications and are not factual financial records.

The separate financial concept vocabulary is Income, Savings, Assets, Asset Ownership, Inheritance, Debt/Liabilities, Cash Flow, Liquidity, Net Worth, and Consumption/Luxury.

## Source classification and provenance

- `ASTROLOGICAL_INDICATOR`: indication only; no user report or calculation provenance.
- `USER_REPORTED_FINANCIAL_FACT`: explicit user-supplied value with `reportId`, `reportedBy: USER`, and offset-aware `reportedAt`.
- `CALCULATED_FINANCIAL_METRIC`: explicit value, formula ID/version/description, calculation timestamp, and one or more explicit datum input references.
- `UNAVAILABLE`: no value and no provenance; a reason is mandatory.

Financial datum/report IDs belong to a separate namespace. They are not DomainEvidence occurrence IDs, identityKeys, or A03 root links.

C01 defines the formula provenance contract, not a financial ledger or calculation service. A metric such as net worth must be supplied by a calculation owner with its explicit inputs and documented formula; no missing input is imputed.

## Product projection and compatibility

`WealthProductAnalysis.financialData` is optional to keep older persisted payloads compatible. When omitted, the view-model exposes all ten financial concepts as `UNAVAILABLE`. The four astrological dimension labels now explicitly indicate that they are astrological indications.

## Non-goals

No account integration, personal finance ledger, investment suitability model, financial advice, or CW-05 rule changes.
