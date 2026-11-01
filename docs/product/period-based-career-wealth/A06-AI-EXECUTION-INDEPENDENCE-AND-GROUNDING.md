# A06 — AI Execution Independence and Grounding

## Objective

Prove the actual `runAiExplanation()` execution boundary consumes canonical deterministic outputs and evidence, while remaining a downstream explanation-only consumer. AI output must never become a source of C11/CW-05 conclusions.

## Authority contract

- C11 remains the sole canonical Career final synthesis.
- CW-05 remains the sole canonical Wealth final synthesis.
- The product pipeline computes Career, Wealth and LifeAnalysis before invoking AI.
- `runAiExplanation()` receives those precomputed domain interpretations, LifeAnalysis and the canonical temporal state.
- AI context projection must not read `horoscope.themeInterpretationV2` as an input. Legacy theme output is compatibility data, not an AI authority.
- AI-generated conclusions/evidence references are mapped into `AiExplanationResult` only. The service does not write to domain interpretations, C11, CW-05 or LifeAnalysis.
- Evidence IDs returned by a provider are resolved only against the canonical context evidence index; unknown IDs remain unresolved.

## Execution path

```text
runLifeAnalysisProduct
  -> resolveAnalysisTemporalState
  -> interpretCareerV2 / interpretWealthV2
  -> buildLifeAnalysis
  -> runAiExplanation
       -> buildProductAiContext
       -> extract canonical evidence IDs
       -> createAiRequest (schema + prompt version + traceability IDs)
       -> AiRouter.route (LOCAL_ONLY / NO_FALLBACK)
       -> AiProvider.generate
       -> structured-output validation
       -> evidence-ID resolution
       -> AiExplanationResult
```

## Implementation

### Legacy theme isolation

The AI Career and Wealth projections now derive from the supplied canonical `DomainInterpretation` values and their canonical conclusion data. The projection no longer reads `horoscope.themeInterpretationV2`, and no longer uses legacy theme Career/Wealth status or subtheme summaries to populate the AI context.

Canonical C11 is projected through `projectCanonicalCareerC11`. Canonical CW-05 is projected through the existing Wealth final-synthesis mapper. Domain evidence and evidence traceability IDs are derived from the supplied domain interpretations and context projection.

### Provider execution controls and provenance

- `runAiExplanation()` continues to accept an injected `AiRouter`, enabling a deterministic fake provider to exercise the real routing and provider boundary.
- Provider execution is bounded by `providerTimeoutMs` (default 15 seconds); timeout and provider errors return an AI explanation error result.
- The request carries `promptVersion: A06-GROUNDING-1`.
- The routing result preserves the provider identity version when supplied.
- The explanation result records provider version, response model metadata and prompt version when available.
- Existing provider/model metadata remains optional where the provider does not supply it.

### Schema and evidence boundary

Structured output is accepted only through `isAiExplanationStructuredOutput`. Provider-supplied evidence IDs are resolved against the canonical AI context evidence index. IDs not present in that index are not materialized as evidence and are surfaced as unresolved questions.

## Regression coverage added

The A06 tests call `runAiExplanation()` with a real `AiRouter`, `AiProviderRegistry` and deterministic fake `AiProvider`. They cover:

1. Canonical C11/CW-05 projection and evidence-ID parity at the provider boundary.
2. A throwing legacy `themeInterpretationV2` getter.
3. Perturbed legacy theme values producing identical provider context.
4. No mutation of supplied Career, Wealth and LifeAnalysis inputs.
5. Provider exception and provider timeout isolation.
6. Unavailable provider behavior.
7. Malformed structured output rejection.
8. Provider version, model and prompt-version traceability.

## Non-goals

- No provider selection redesign.
- No LLM-based replacement of deterministic astrology rules.
- No changes to C11, CW-05 or Dasha calculation semantics.
- No treatment of generated prose as verified evidence.

## Validation status

Repository writes and static source inspection are not equivalent to test execution. Run the following on the exact A06 candidate SHA and record CI evidence before merging:

```bash
npm run lint
npm test -- --run src/ai/product/aiExplanationService.test.ts
npm test -- --run src/ai/context/aiContextFactory.test.ts
npm run build
```

Do not mark A06 PASS until these commands and the required CI checks pass on the candidate SHA.
