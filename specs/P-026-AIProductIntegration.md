# P-026 — AI Product Integration / UI Explanation Layer

## 1. Objective

Create the first product-facing AI explanation path.

The feature connects:

```text
User
  ↓
CoreAstro Horoscope
  ↓
AiContext
  ↓
AiRequest
  ↓
AiRouter
  ↓
LocalVedicRulesProvider
  ↓
AiResponse
  ↓
Product ViewModel
  ↓
React UI
```

The first implementation is local-only and performs no network calls.

---

## 2. Scope

P-026 includes:

- AI application/service layer (`src/ai/product/`)
- AI explanation task selection
- local-only routing (`LOCAL_ONLY`, `NO_FALLBACK`)
- structured AI response normalization
- evidence resolution against `AiContext.evidence`
- explanation UI panel (`AiExplanationPanel`)
- loading state
- success state
- partial state
- error state
- unresolved-question display
- warning display
- comprehensive unit and component tests

---

## 3. Supported Tasks

P-026 exposes:

- `CHART_SYNTHESIS`
- `CAREER_ANALYSIS`
- `WEALTH_ANALYSIS`
- `DASHA_ANALYSIS`
- `LIFE_THEME_ANALYSIS`

`GENERAL_QUERY` is not exposed by the initial UI.

Marriage and other domains are not exposed until corresponding deterministic domain interpretation exists.

---

## 4. Provider

P-026 MUST use:

- `mode = 'LOCAL_ONLY'`
- `fallbackPolicy = 'NO_FALLBACK'`

The initial product UI MUST NOT invoke remote providers.

---

## 5. Architecture

```text
React UI
  ↓
AiExplanationPanel
  ↓
runAiExplanation()
  ↓
buildAiContext()
  ↓
createAiRequest()
  ↓
AiRouter
  ↓
LocalVedicRulesProvider
  ↓
AiResponse
  ↓
AiExplanationViewModel
  ↓
React UI
```

---

## 6. Privacy

The UI/application layer MUST NOT construct `AiRequest` directly from raw `Horoscope` data.

It MUST use `buildAiContext()`.

No new personal-data fields may be added to `AiContext`.

---

## 7. Product View Model

The UI consumes `AiExplanationViewModel` (or `AiExplanationErrorViewModel` on error).

The UI MUST NOT consume `AiRoutingResult` directly.

The UI MUST NOT depend directly on:

- `AiProviderRegistry`
- `AiProviderSelector`
- `LocalVedicRulesProvider`
- `OpenAiProvider`
- `RemoteAiProvider`

---

## 8. Evidence

Evidence IDs from AI reasoning MUST be resolved against the `AiContext` evidence collection.

Unknown evidence IDs MUST NOT be rendered as valid evidence.

Evidence must display:

- ID
- statement
- source
- effect
- strength
- priority when available
- varga when available

---

## 9. Explanation

The UI MUST display:

- conclusion
- supporting evidence
- challenging evidence
- unresolved questions
- warnings

Provider metadata is displayed in a compact transparency indicator.

---

## 10. Loading

While reasoning is executing:

- the action button is disabled
- a loading indicator is displayed
- previous explanation is cleared

---

## 11. Error Handling

AI execution failures MUST be represented as an error state.

The UI MUST NOT crash.

Raw provider credentials, authorization headers, request bodies, or transport internals MUST NOT be rendered.

---

## 12. Chart Changes

When birth details change and a new Horoscope is produced:

- existing AI explanation state MUST be invalidated
- previous result MUST NOT remain visible for the new chart

---

## 13. No Caching

P-026 does not implement persistent or application-wide AI result caching.

---

## 14. No Remote UI

P-026 does not implement:

- OpenAI UI
- Gemini UI
- Claude UI
- Ollama UI
- streaming
- SSE
- chat history
- conversational memory

---

## 15. No Domain Expansion

P-026 does not implement:

- Marriage
- Children
- Property
- Health
- new astrology rules
- Domain Interpretation Framework v2

---

## 16. Acceptance Criteria

1. AI Explanation appears as a product navigation option in Header.
2. User can select Chart Synthesis.
3. User can select Career.
4. User can select Wealth.
5. User can select Current Dasha.
6. User can select Life Themes.
7. User can generate an explanation.
8. The request is constructed through `buildAiContext()`.
9. The request is constructed through `createAiRequest()`.
10. Routing uses `LOCAL_ONLY`.
11. Routing uses `NO_FALLBACK`.
12. `LocalVedicRulesProvider` produces the response.
13. Conclusion is displayed.
14. Supporting evidence is displayed.
15. Challenging evidence is displayed.
16. Unresolved questions are displayed.
17. Warnings are displayed.
18. Loading state is displayed.
19. Errors do not crash the UI.
20. Evidence IDs are resolved through `AiContext` evidence.
21. Unknown evidence IDs are not displayed as valid evidence.
22. Changing the chart invalidates the previous explanation.
23. No remote API call is made.
24. Existing PR-025A–025F tests remain green.
25. New P-026 unit and component tests pass.
26. TypeScript compilation passes.
27. Production build passes.
