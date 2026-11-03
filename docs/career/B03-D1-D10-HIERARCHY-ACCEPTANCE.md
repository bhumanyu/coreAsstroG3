# B03 — D1/D10 Hierarchy Acceptance

## Purpose

B03 validates the existing C4–C11 Career authority boundary. D1 establishes natal Career promise. D10 qualifies the expression of that promise and may refine or constrain execution; it is not an independent source of natal promise.

## Canonical path

- D1 promise: `CareerNatalAnalysis` from C4–C7.
- D1-derived expression: C8 `CareerExpressionAnalysis`.
- D10 qualification: C10 `CareerD10CanonicalAnalysis`, produced by `buildCareerD10Analysis`.
- Final conclusion: C11 `CareerFinalSynthesisResult`, produced by `buildCareerFinalAnalysis`.

C10 copies the D1 direction and strength into its result and exposes D10 direction/effect/strength separately. When D1 has no promise, the semantic resolver returns `INSUFFICIENT_DATA` and does not qualify expressions. When D10 data is missing, it returns `UNAVAILABLE` while preserving the D1 direction and strength. C11 remains the only final conclusion authority.

## Expression mapping

C10 maps legacy C8 `CareerManifestationMode` values through an explicit C8-to-C10 mapping. One-to-one mappings are marked `EXPRESSION_TYPE`; many-to-one mappings are marked `MODE`. Unsupported legacy-only modes return `UNMAPPED` with a diagnostic rather than receiving a fabricated canonical type.

Per-expression qualification retains the original expression reference and expression ID. D10 evidence is attached only to the corresponding qualification; conflicts and evidence source IDs remain traceable.

## Evidence identity and compatibility

The evidence mapper keeps these namespaces distinct:

- `identityKey`: semantic identity.
- `id` / `sourceIds`: occurrence and source provenance.
- `ruleId` / `provenance.ruleId`: structural rule identity.
- `manifestationRuleIds`: only emitted when the adapter can prove the full legacy manifestation proposition.

A `CAREER_STRUCTURAL_*` rule ID does not establish the full semantic proposition required by a legacy manifestation rule. The compatibility adapter therefore preserves it as `ruleId` and leaves `manifestationRuleIds` undefined. This is intentional unavailable mapping, not a failed fallback.

## B03 invariants

1. D1 direction and strength are preserved as the natal source on C10 output.
2. Strong D10 cannot create a D1 promise when D1 is neutral, unavailable, or undetermined.
3. Weak D10 may constrain manifestation but cannot erase a valid D1 promise.
4. Strong D10 may refine a weak valid D1 promise but cannot promote the C11 natal strength beyond D1.
5. Missing D10 remains explicitly unavailable and contributes partial confidence coverage; it is never interpreted as neutral PASS.
6. Mixed D1 remains mixed when D10 is supportive.
7. Expression-specific D10 evidence is attached to the matching C8 expression and remains traceable.
8. Structural rule IDs are not converted into manifestation IDs without semantic proof.
9. C11 remains the only final Career synthesis authority.
10. Identical inputs produce deterministic, deep-equal outputs.

## Implementation scope

B03 does not recalculate chart geometry, replace C10 qualification rules, create an independent D10 promise, or change C11 ownership. The only production behavior adjustment is a narrow C11 completion for weak-but-valid D1 SUPPORT: the final status now remains SUPPORTED unless a manifestation-axis condition requires CONDITIONAL support. The final strength remains the D1 strength; D10 does not promote it.

## Verification

Regression coverage is added to:

- `careerD10Integration.test.ts`: strong/weak/missing/mixed D1/D10 cases, expression-specific mixed evidence, deterministic output.
- `careerFinalSynthesisIntegration.test.ts`: D1 authority, weak D1 support preservation, no D10-created promise, missing D10 partial coverage, mixed D1 preservation, deterministic output.
- `canonicalCareerEvidenceMapper.test.ts`: existing structural-rule compatibility assertions verify that `CAREER_STRUCTURAL_*` remains a structural `ruleId` and does not populate `manifestationRuleIds`.

