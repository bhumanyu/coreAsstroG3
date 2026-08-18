# PR-025E — First Concrete Remote Provider Adapter

## 1. Objective

Implement the first concrete remote AI provider adapter for CoreAstro
using the OpenAI Responses API.

The provider integrates with the generic PR-025D RemoteAiProvider
foundation without modifying PR-025D or PR-025C.

---

## 2. Provider

Provider:

OpenAI

Identity:

id = openai
name = OpenAI
kind = REMOTE_LLM

---

## 3. API

Endpoint:

https://api.openai.com/v1/responses

HTTP method:

POST

Authentication:

Authorization: Bearer <API_KEY>

The API key MUST NEVER appear in:

- URL
- query parameters
- request body
- AiResponse.metadata
- AiProviderStatus
- RemoteAiError.message
- serialized error objects

---

## 4. Model

Default model:

gpt-5.6

The model MUST remain configurable through OpenAiProviderOptions.

No model-specific logic may be introduced into the generic remote layer.

---

## 5. Supported Tasks

OpenAI supports:

- CHART_SYNTHESIS
- CAREER_ANALYSIS
- WEALTH_ANALYSIS
- DASHA_ANALYSIS
- LIFE_THEME_ANALYSIS
- GENERAL_QUERY

Capabilities exposed:

- STRUCTURED_OUTPUT
- CAREER
- WEALTH
- DASHA
- LIFE_THEMES
- CHART_SYNTHESIS

OpenAI does NOT advertise:

- STREAMING
- OFFLINE
- LOCAL_FALLBACK

---

## 6. Request Mapping

OpenAiRequestMapper converts AiRequest into the OpenAI Responses API
request format.

The mapper explicitly constructs the CoreAstro context payload.

It MUST NOT blindly serialize the complete AiRequest object.

---

## 7. Prompt Boundary

The model MUST be instructed that:

- CoreAstro deterministic calculations are authoritative.
- The model must not recalculate astrology.
- The model must not invent missing astrological facts.
- The model must not change planetary signs, planetary houses, ascendant, dasha periods, D9/D10 status, yoga status, or evidence statements.
- Evidence conflicts must be acknowledged.
- Evidence IDs must be used for provenance.
- Insufficient evidence must be reported.

---

## 8. Structured Output

Structured requests use OpenAI JSON Schema structured outputs.

Schema name:

coreastro_reasoning

The response contains:

- status
- conclusion
- supportingEvidenceIds
- challengingEvidenceIds
- unresolvedQuestions
- warnings

The model MUST NOT generate CoreAstro triggeredRuleIds.

The adapter sets triggeredRuleIds to an empty array if required by
downstream internal structures.

---

## 9. Evidence Provenance

Every supportingEvidenceId and challengingEvidenceId returned by
OpenAI MUST exist in:

request.context.evidence

Unknown evidence IDs MUST cause a mapping failure.

OpenAI MUST NOT create new evidence IDs.

---

## 10. Narrative Output

For NARRATIVE requests:

OpenAI output_text maps directly to:

AiResponse.content

No structured JSON parsing is performed.

---

## 11. Structured Output

For STRUCTURED requests:

OpenAI output_text is parsed as JSON.

The adapter validates:

- object shape
- status
- conclusion
- supportingEvidenceIds
- challengingEvidenceIds
- unresolvedQuestions
- warnings
- evidence references

---

## 12. Response Metadata

The adapter may expose:

- provider
- model
- responseId
- token usage

It MUST NOT expose:

- API key
- Authorization header
- request body
- full CoreAstro context

---

## 13. Failure Handling

Provider-specific mapper failures are delegated to PR-025D and become:

MAPPING_ERROR

OpenAI HTTP failures are delegated to PR-025D and become:

HTTP_ERROR

Network failures become:

NETWORK_ERROR

Timeouts become:

TIMEOUT

Malformed successful JSON becomes:

INVALID_RESPONSE

---

## 14. No Retries

PR-025E MUST NOT implement:

- retry
- exponential backoff
- jitter
- rate-limit retry

These belong to a future provider reliability layer.

---

## 15. No Streaming

PR-025E MUST NOT implement:

- SSE
- async iterators
- streaming callbacks

Streaming belongs to a future PR.

---

## 16. No Tool Calling

PR-025E MUST NOT implement:

- function calling
- web search
- file search
- MCP
- external tools

---

## 17. Browser Security

The current CoreAstro application is a browser/Vite application.

PR-025E MUST NOT:

- read VITE_OPENAI_API_KEY
- expose API keys through frontend code
- automatically instantiate OpenAiProvider in the browser
- add OpenAI credentials to client-side configuration

The provider implementation is designed for secure server-side
or server-proxied execution.

---

## 18. Default Router

createDefaultAiRouter MUST remain local-only.

OpenAI MUST NOT be automatically registered.

---

## 19. Testing

Tests MUST verify:

- OpenAI identity
- REMOTE_LLM kind
- OpenAI capabilities
- default model
- custom model
- endpoint
- bearer authentication
- no key in URL
- no key in request body
- structured output configuration
- narrative output
- structured output parsing
- malformed structured JSON
- failed OpenAI response
- incomplete OpenAI response
- token usage mapping
- response ID mapping
- unknown evidence ID rejection
- transport integration
- API key non-leakage
- routing compatibility

---

## 20. Acceptance Criteria

PR-025E is complete when:

1. OpenAiProvider implements AiProvider through PR-025D.
2. OpenAI Responses API requests are correctly constructed.
3. Narrative responses become AiResponse.content.
4. Structured responses become AiResponse.structuredOutput.
5. Evidence IDs are validated.
6. API credentials cannot leak into CoreAstro response objects.
7. Existing AiRouter requires no modification.
8. PR-025D requires no modification.
9. createDefaultAiRouter remains local-only.
10. All unit tests pass.
11. TypeScript compilation passes.
12. Build passes.
