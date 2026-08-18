# PR-025D: Remote AI Provider Adapter Foundation Specification

## 1. Objective

Introduce a provider-agnostic remote AI adapter foundation implementing the existing `AiProvider` contract without introducing provider-specific LLM integrations (such as OpenAI, Claude, Gemini, DeepSeek, or Ollama).

The foundation provides:
- Remote provider configuration
- HTTP transport abstraction
- Fetch-based HTTP transport with AbortController timeout
- Request mapping abstraction
- Response mapping abstraction
- Normalized remote error domain
- Safe provider status without synchronous network IO
- Fake transport for deterministic unit testing

---

## 2. Architectural Boundary & Invariants

- **AiProvider Compliance**: Implements the canonical `AiProvider` interface (`identity`, `capabilities`, `getStatus()`, `generate()`).
- **Normalized Data Flow**: Operates exclusively on `AiRequest` and `AiResponse`.
- **Astrological Independence**: Contains zero astrological logic, ephemeris calculations, or chart interpretations.
- **Vendor Agnosticism**: Contains zero vendor-specific API formats (no hardcoded OpenAI, Anthropic, Google, or DeepSeek logic).
- **Credential Protection**: API keys, bearer tokens, and sensitive headers MUST NEVER appear in `AiResponse.metadata`, `AiProviderStatus`, `RemoteAiError.message`, logs, or serialized payloads.
- **Zero Raw Context Leakage**: `AiRequest.context` MUST NOT be blindly serialized to HTTP payloads; request mapping is explicitly delegated to `RemoteAiRequestMapper`.
- **Offline / Test Determinism**: Transports are pluggable via `RemoteAiTransport`, enabling complete, deterministic unit testing without live network calls.

---

## 3. RemoteAiProvider

`RemoteAiProvider` implements `AiProvider`.

- `identity.kind` MUST be `'REMOTE_LLM'`.
- Constructor receives:
  1. `RemoteAiProviderConfig`
  2. `RemoteAiRequestMapper`
  3. `RemoteAiResponseMapper`
  4. `RemoteAiTransport` (defaults to `FetchRemoteAiTransport`)
- Config, identity, and capabilities are deeply frozen on construction.

---

## 4. Configuration (`RemoteAiProviderConfig`)

Contains:
- `identity: AiProviderIdentity`
- `capabilities: readonly AiCapability[]`
- `endpoint: string`
- `apiKey?: string`
- `timeoutMs?: number` (defaults to 30,000ms)
- `defaultHeaders?: Readonly<Record<string, string>>`

Validation rules enforced at construction:
- Non-empty `identity.id` (throws `INVALID_CONFIGURATION`)
- `identity.kind === 'REMOTE_LLM'` (throws `INVALID_CONFIGURATION`)
- Non-empty `endpoint` (throws `INVALID_ENDPOINT`)
- Valid URL format (throws `INVALID_ENDPOINT`)
- HTTPS protocol required, unless hostname is `localhost` or `127.0.0.1` (throws `INVALID_ENDPOINT`)
- `timeoutMs > 0` when provided (throws `INVALID_CONFIGURATION`)

---

## 5. Endpoint Security

Remote endpoints MUST use HTTPS for remote network traffic.
Insecure HTTP is permitted exclusively for `localhost` and `127.0.0.1` to enable local mock servers and development runners.

Additionally, upon request mapping, `RemoteAiProvider` validates that the mapped `httpRequest.url` is a valid URL, uses HTTPS (or local dev hostnames), and contains no embedded credentials in the URL authority (throwing `INVALID_ENDPOINT` if violated).

---

## 6. Request Mapping

`RemoteAiProvider` does not serialize requests directly.
Request construction is delegated to `RemoteAiRequestMapper.map(request, config)`.
Any mapper failure (regardless of what the mapper throws) is caught and wrapped in `RemoteAiError('MAPPING_ERROR', 'Failed to map AiRequest to remote provider request.', { requestId: request.requestId })`.

**Credential Safety Invariant**: A request mapper may use `config.apiKey` only to construct authentication headers and MUST NOT place credentials in the URL, request body, response metadata, or error messages.

---

## 7. Response Mapping

`RemoteAiProvider` delegates response translation to `RemoteAiResponseMapper.map(request, response)`.
The resulting `AiResponse` is decorated with:
```ts
metadata: {
  ...response.metadata,
  provider: this.identity.id,
  remote: true
}
```
Any mapper failure (regardless of what the mapper throws) is caught and wrapped in `RemoteAiError('MAPPING_ERROR', 'Failed to map remote provider response to AiResponse.', { requestId: request.requestId })`. To guarantee credential non-leakage, mapper-thrown error instances are not exposed as public `cause` objects.

---

## 8. Transport & Fetch Implementation

`RemoteAiTransport` abstracts network execution:
```ts
export interface RemoteAiTransport {
  send(
    request: RemoteAiHttpRequest,
    timeoutMs: number
  ): Promise<RemoteAiHttpResponse>;
}
```

`FetchRemoteAiTransport` implements `RemoteAiTransport` using standard `fetch`:
- Pre-serializes body via `JSON.stringify(request.body)` (throws `RemoteAiError('MAPPING_ERROR', ...)` if serialization fails)
- Enforces timeout via `AbortController` and `setTimeout`
- Clears timeout in `finally` block
- Automatically parses `application/json` responses (throws `INVALID_RESPONSE` on JSON syntax error)
- Reads non-JSON responses as plain text
- Maps `AbortError` to `RemoteAiError('TIMEOUT', ...)`
- Maps general fetch rejections to `RemoteAiError('NETWORK_ERROR', ...)`

---

## 9. Error Model (`RemoteAiError`)

Error codes (`RemoteAiErrorCode`):
- `INVALID_CONFIGURATION`: Invalid provider identity, timeout, or config parameters
- `INVALID_ENDPOINT`: Malformed URL or non-HTTPS remote endpoint
- `TIMEOUT`: Request exceeded configured `timeoutMs`
- `NETWORK_ERROR`: Connection refused, DNS failure, or socket error
- `HTTP_ERROR`: Remote server returned non-2xx status code (e.g. 400, 401, 429, 500)
- `INVALID_RESPONSE`: Malformed JSON or unparseable payload
- `MAPPING_ERROR`: Request or response mapper raised an error

`RemoteAiError` preserves `statusCode` and `requestId` where applicable.
Error messages MUST NOT embed credentials or full raw payloads.

---

## 10. Provider Status Semantics

`getStatus()` is synchronous and MUST NOT initiate network IO.
A configured remote provider returns:
- `availability: 'AVAILABLE'`
- `message: 'Remote AI provider configured and ready.'`
- `endpoint: this.config.endpoint`

This indicates the provider adapter is configured and ready to attempt execution. Live availability and errors are discovered at `generate()` time and handled by PR-025C routing fallbacks.

---

## 11. Acceptance Matrix

| Requirement | Implementation | Status |
| :--- | :--- | :--- |
| Implements `AiProvider` | `RemoteAiProvider` implements `AiProvider` interface | Verified |
| `REMOTE_LLM` Identity | Verified at config validation and constructor | Verified |
| Immutable Configuration | Deeply frozen config, identity, and capabilities | Verified |
| HTTPS Validation | Validated with localhost/127.0.0.1 exception | Verified |
| Transport Abstraction | Pluggable `RemoteAiTransport` interface | Verified |
| Fetch Implementation | `FetchRemoteAiTransport` with `AbortController` | Verified |
| Timeout Handling | Configurable timeout with 30s default | Verified |
| Network Error Normalization | Clean `TIMEOUT` and `NETWORK_ERROR` mapping | Verified |
| HTTP Error Normalization | Status >= 300 or < 200 mapped to `HTTP_ERROR` | Verified |
| Request/Response Delegation | Delegated to modular mapper interfaces | Verified |
| API Key Protection | Verified zero credentials leaked into responses/errors | Verified |
| Status without Network IO | Synchronous `getStatus()` returning `AVAILABLE` | Verified |
| Test Fixtures | `FakeRemoteAiTransport`, `FakeRemoteAiRequestMapper`, etc. | Verified |
| PR-025C Frozen | No modifications to PR-025C routing files | Verified |

---

## 12. Non-Goals

The following features are intentionally out of scope for PR-025D and belong to subsequent PRs:
- Specific vendor adapters (OpenAI, Claude, Gemini, DeepSeek, Ollama)
- Provider-specific prompt construction and JSON schemas
- API key storage or key-rotation services
- Automatic HTTP retry with exponential backoff and jitter
- Rate-limit (HTTP 429) backoff handling
- Streaming responses (SSE / async iterators)
- Tool / function calling mechanics
