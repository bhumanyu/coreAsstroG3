# B05 — Career Dual-Potential Pathway Analysis

## Purpose

B05 compares the two pathway types that B02 explicitly qualifies:

- Employment or service opportunity
- Independent or business activity

It is a candidate-evidence comparison, not a personal suitability verdict, career recommendation, employment forecast or business-success prediction.

## Authority and dependencies

- **C11** remains the sole final Career synthesis and confidence authority.
- **B02** remains the source of qualified outcome candidates. B05 does not recreate or reinterpret natal promise, Dasha activation, D10 qualification or observed outcomes.
- **B04** remains the profession-family candidate/ranking layer. Its profession taxonomy is not treated as a corporate-versus-entrepreneurial taxonomy.
- **Dasha** remains the sole temporal authority. B05 copies candidate timing fields from B02; it does not derive new dates.
- User-reported career outcomes remain separate from candidate pathways.

## Verdicts

| Verdict | Meaning |
|---|---|
| `DUAL_POTENTIAL` | Both explicit pathway types are present and each has at least one supported B02 candidate. |
| `CONDITIONAL_DUAL_POTENTIAL` | Both pathway types are present, but one or both are only conditionally qualified. |
| `EMPLOYMENT_POTENTIAL_IDENTIFIED` | At least one employment/service candidate is present; independent/business is not identified in this B02 output. |
| `INDEPENDENT_POTENTIAL_IDENTIFIED` | At least one independent/business candidate is present; employment/service is not identified in this B02 output. |
| `NO_MODE_CANDIDATE` | B02 is present but does not identify either explicit pathway type. |
| `UNRESOLVED` | B02 itself is unresolved. |
| `INSUFFICIENT_DATA` | B02 reports insufficient evidence or is absent. |

A missing side is always `NOT_IDENTIFIED`; it is never classified as unsuitable, adverse, or rejected.

## Per-mode output

For each mode B05 preserves:
- candidate IDs and qualification;
- source event, opportunity and activation IDs;
- B02 timing fields without modification;
- supporting evidence occurrence IDs;
- rule IDs;
- counter-evidence occurrence IDs and severity.

B05 uses no numeric score, probability or independent confidence scale. Confidence and suitability are `NOT_ASSESSED`.

## Explicitly outside scope

B05 does not assess:
- practical execution, skills or experience fit;
- financial readiness, capital, debt, liquidity or risk capacity;
- personal preference or willingness;
- market conditions, employer demand, customer acquisition or business viability;
- specific job changes, promotions, business launches or guaranteed outcomes.

These remain real-world inputs or separately validated product capabilities.

## Release safety

B05 must not change C11 or B02 outputs, promote D2, enable unvalidated event categories, or treat missing evidence as adverse evidence. The UI must display the B05 verdict and evidence trace from canonical ProductAnalysis only.
