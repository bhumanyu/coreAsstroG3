# PR-025F — Remote Reliability Policy

## 1. Objective

Introduce a generic reliability policy for AI provider execution.

The policy provides:

- retry classification
- maximum attempts
- exponential backoff
- jitter
- explicit POST retry opt-in

The implementation MUST NOT modify provider-specific request/response mapping.

---

## 2. Architecture

ReliableAiProvider decorates an existing AiProvider.

Architecture:

AiRouter
  ↓
ReliableAiProvider
  ↓
RemoteAiProvider
  ↓
Concrete remote provider (e.g., OpenAiProvider)

ReliableAiProvider MUST NOT know about OpenAI, Anthropic, Gemini, or any other concrete provider.

---

## 3. Retry Safety

Automatic retry of POST requests is disabled by default.

POST retries MUST require:

allowPostRetry = true

No implicit retry of POST requests is permitted.

---

## 4. Default Policy

maxAttempts = 3

baseDelayMs = 250

maxDelayMs = 4000

jitterRatio = 0.20

allowPostRetry = false

Retryable HTTP statuses:

408
425
429
500
502
503
504

Retryable error codes:

TIMEOUT
NETWORK_ERROR
HTTP_ERROR

---

## 5. Non-Retryable Errors

The following MUST NOT be retried:

INVALID_CONFIGURATION
INVALID_ENDPOINT
INVALID_RESPONSE
MAPPING_ERROR

HTTP statuses not explicitly configured as retryable MUST NOT be retried.

---

## 6. Attempt Semantics

maxAttempts represents the total number of executions.

Examples:

maxAttempts = 1
one execution, zero retries.

maxAttempts = 3
three executions, at most two retries.

---

## 7. Backoff

Delay uses exponential backoff:

baseDelayMs * 2^(attempt - 1)

The delay MUST be capped by maxDelayMs.

---

## 8. Jitter

Jitter is symmetric around the calculated delay.

jitterRatio = 0 means deterministic delay.

jitterRatio = 0.2 allows approximately +/-20%.

The final delay MUST never be negative.

---

## 9. Timeout

The existing RemoteAiProvider timeout remains the timeout for an individual transport attempt.

PR-025F MUST NOT modify timeoutMs.

Total operation duration may exceed timeoutMs when retries are enabled.

---

## 10. Error Preservation

When retry attempts are exhausted, the final RemoteAiError MUST be returned unchanged.

No RETRY_EXHAUSTED error is introduced.

---

## 11. Provider Identity

ReliableAiProvider MUST preserve:

- provider ID
- provider name
- provider kind
- provider version
- capabilities

The decorator MUST NOT create a new provider identity.

---

## 12. Provider Status

getStatus() MUST delegate directly to the wrapped provider.

Reliability policy MUST NOT automatically change provider availability.

---

## 13. Routing

ReliableAiProvider MUST remain compatible with AiRouter.

It MUST NOT implement:

- provider fallback
- provider selection
- routing
- failover

---

## 14. Security

The reliability layer MUST NOT:

- log API keys
- log authorization headers
- expose request bodies
- expose raw transport errors
- modify error sanitization

---

## 15. Retry-After

PR-025F does not implement Retry-After.

The current RemoteAiError contract does not expose response headers.

Retry-After support is deferred to a future reliability enhancement.

---

## 16. Scope Exclusions

PR-025F does not implement:

- streaming
- SSE
- tool calling
- function calling
- provider fallback
- circuit breakers
- credential management
- polling
- provider-specific retry rules

---

## 17. Acceptance Criteria

1. ReliableAiProvider implements AiProvider.
2. Existing provider identity is preserved.
3. Existing capabilities are preserved.
4. Existing provider status is delegated.
5. POST retry is disabled by default.
6. POST retry works when explicitly enabled.
7. Network errors can be retried.
8. Timeout errors can be retried.
9. Configured retryable HTTP statuses can be retried.
10. Non-retryable statuses are not retried.
11. Mapping errors are never retried.
12. Invalid endpoint errors are never retried.
13. Invalid response errors are never retried.
14. Maximum attempts are respected.
15. Exponential backoff is applied.
16. Maximum delay is respected.
17. Jitter is bounded.
18. Final error remains the underlying RemoteAiError.
19. No provider-specific logic exists in the reliability layer.
20. PR-025D remains functionally unchanged.
21. PR-025E remains functionally unchanged.
22. Existing router behavior remains unchanged.
23. Unit tests cover all retry categories.
24. TypeScript compilation passes.
25. Full test suite passes.
26. Production build passes.
