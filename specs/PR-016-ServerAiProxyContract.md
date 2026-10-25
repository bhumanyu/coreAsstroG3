# PR-016 — Server AI Proxy Contract

## Status and scope

This document is a design contract only. It does not add a server, database, account system, endpoint implementation, provider credentials, or remote-AI launch dependency.

The proposed endpoint is `POST /v1/ai/explanations`. It accepts only the minimized, deterministic `AiContext` projection produced by `buildProductAiContext()` and returns normalized explanation data. The client must not contact OpenAI or another remote provider directly.

The local-only P-026 contract remains unchanged: product explanations use `LOCAL_ONLY` routing and `NO_FALLBACK`. **PR-017 (server proxy implementation) is DEFERRED** until the decisions in this document have explicit approval. Remote AI is not a launch dependency.

## Versioned DTOs

The schema version below versions the HTTP envelope independently of `AiContext.schemaVersion` (`1.1.0`). The latter remains the version of the existing product context and is passed through unchanged.

```ts
interface AiProxyRequestDtoV1 {
  readonly schemaVersion: '1';
  readonly requestId: string;
  readonly task:
    | 'CHART_SYNTHESIS'
    | 'CAREER_ANALYSIS'
    | 'WEALTH_ANALYSIS'
    | 'DASHA_ANALYSIS'
    | 'LIFE_THEME_ANALYSIS'
    | 'LIFE_ANALYSIS_EXPLANATION'
    | 'SELECTED_PERIOD_ANALYSIS';
  readonly context: AiContext;
  readonly responseFormat: 'STRUCTURED' | 'NARRATIVE';
  readonly traceabilityIds?: readonly string[];
}

interface AiProxyResponseDtoV1 {
  readonly schemaVersion: '1';
  readonly requestId: string;
  readonly status: 'SUCCESS' | 'PARTIAL';
  readonly explanation: {
    readonly conclusion: string;
    readonly supportingEvidenceIds: readonly string[];
    readonly challengingEvidenceIds: readonly string[];
    readonly unresolvedQuestions: readonly string[];
    readonly warnings: readonly string[];
    readonly triggeredRuleIds?: readonly string[];
  };
  readonly provider: {
    readonly id: string;
    readonly name: string;
    readonly model?: string;
  };
}

interface AiProxyErrorDtoV1 {
  readonly schemaVersion: '1';
  readonly requestId?: string;
  readonly error: {
    readonly code:
      | 'INVALID_REQUEST'
      | 'UNAUTHENTICATED'
      | 'FORBIDDEN'
      | 'PAYLOAD_TOO_LARGE'
      | 'UNSUPPORTED_TASK'
      | 'INVALID_EVIDENCE_REFERENCE'
      | 'RATE_LIMITED'
      | 'BUDGET_EXHAUSTED'
      | 'REMOTE_AI_DISABLED'
      | 'PROVIDER_UNAVAILABLE'
      | 'PROVIDER_TIMEOUT'
      | 'PROVIDER_FAILURE'
      | 'INTERNAL_ERROR';
    readonly message: string;
    readonly retryable: boolean;
  };
}
```

`AiContext` is the current schema from `src/ai/types/aiContextTypes.ts`: deterministic source/methodology, ascendant/planet/house/yoga facts, Dasha facts, divisional facts, optional career/wealth/life-theme projections, and evidence. Each `AiEvidence` record contains an ID, source, effect, strength, statement, and optional planets, houses, rule ID, identity key, priority, dimension, and provenance/timing fields.

For selected-period analysis, `buildProductAiContext()` may additionally populate `context.selectedPeriod`. That projection carries selected-period identity/interval and synthesis facts. Its `availableEvidence` contains the AiEvidence-shaped records projected from canonical Career/Wealth evidence collections; those IDs can be outside `context.evidence`. The proxy must validate references against both namespaces, consistent with the client resolver, without treating unknown references as valid.

The response evidence lists contain IDs, not client-supplied evidence statements. The client resolves each returned ID against the submitted context and renders only known records, preserving the existing P-026 evidence semantics.

## Payload minimization and validation

- Construct `context` only with `buildProductAiContext()`; never serialize `Horoscope`, raw birth details, engine objects, or unrelated product state.
- Do not send credentials, proxy configuration, runtime-boundary flags, provider secrets, account data, or arbitrary user-supplied prompt text.
- Keep the existing bounded task set. Do not accept `GENERAL_QUERY` or tasks outside the approved server allowlist.
- Treat `requestId`, `traceabilityIds`, and every evidence reference as untrusted input; validate type, length, count, and membership.
- Reject unknown context/envelope versions and malformed/non-finite values before provider invocation.
- Apply request/response byte limits before parsing or forwarding; specific values require approval.
- Do not trust client-selected provider ID, model, provider endpoint, runtime, or routing mode. Select the configured provider and route on the server.
- Do not persist the request context by default. Any approved telemetry must redact evidence statements and identifiers unless explicitly required.

## HTTP status to error-code mapping

Use one primary mapping; budget exhaustion is consistently HTTP `429` with code `BUDGET_EXHAUSTED` (not `402`).

| HTTP status | Error code(s) | Meaning |
|---|---|---|
| 400 | `INVALID_REQUEST`, `INVALID_EVIDENCE_REFERENCE` | Invalid DTO/version/shape or evidence reference |
| 401 | `UNAUTHENTICATED` | Required authentication is absent or invalid |
| 403 | `FORBIDDEN`, `REMOTE_AI_DISABLED` | Principal is not authorized or server feature flag denies remote AI |
| 413 | `PAYLOAD_TOO_LARGE` | Request exceeds approved byte/field limits |
| 422 | `UNSUPPORTED_TASK` | Task is not in the approved allowlist |
| 429 | `RATE_LIMITED`, `BUDGET_EXHAUSTED` | Caller rate limit or configured usage budget reached |
| 502 | `PROVIDER_FAILURE`, `PROVIDER_UNAVAILABLE` | Upstream provider returned an invalid/failing response |
| 503 | `PROVIDER_UNAVAILABLE` | Proxy/provider is not configured or temporarily unavailable |
| 504 | `PROVIDER_TIMEOUT` | Upstream provider exceeded the approved deadline |
| 500 | `INTERNAL_ERROR` | Unexpected proxy failure; do not expose stack traces or secrets |

Errors must use the versioned `AiProxyErrorDtoV1` shape. `retryable` must reflect the specific failure and retry policy; clients must not automatically retry without an explicitly approved policy.

## Threat model

| Threat | Boundary/control |
|---|---|
| Provider credential extracted from browser bundles or source maps | Keep provider construction and credentials server-only; never use `VITE_*` provider secrets; bundle-check client artifacts |
| Client spoofs a trusted server runtime or enables remote AI | Runtime and enablement come only from trusted server configuration; never accept them in the DTO |
| Prompt/context overcollection or accidental raw chart disclosure | Send only `buildProductAiContext()` output; exclude raw horoscope/birth details and unrelated state |
| Prompt injection through evidence text or user-controlled fields | Treat context as untrusted data, not instructions; use a fixed server-owned system prompt and task-specific templates |
| Evidence ID fabrication or cross-request reference substitution | Validate IDs against the submitted context and selected-period `availableEvidence`; resolve/render only known IDs |
| Abuse, cost exhaustion, or denial of service | Authenticate as approved, enforce size/rate/time/budget limits, and stop work at the configured budget |
| Sensitive data leakage in logs, traces, or error messages | Redact request bodies, evidence statements, auth headers, provider responses, and secrets; expose only stable error DTOs |
| Upstream outage or malformed provider response | Validate/normalize upstream responses, use bounded timeouts, and return stable mapped errors without success-shaped fallbacks |
| Unauthorized cross-origin or cross-tenant proxy use | Approve an auth/authorization and origin/CSRF model before implementation; enforce server-side access boundaries |

## Decisions required before PR-017

The following are pre-approval gates, not defaults silently selected by this document:

1. **Authentication and authorization:** caller identity, session/token model, CSRF/origin policy, authorization scope, and whether anonymous access is prohibited.
2. **Task allowlist:** exact enabled tasks and whether `LIFE_ANALYSIS_EXPLANATION` and `SELECTED_PERIOD_ANALYSIS` are permitted.
3. **Size caps:** maximum request/response bytes, context evidence count, string lengths, and nested collection limits.
4. **Rate limits:** per-principal and global request/concurrency limits, including burst behavior.
5. **Timeouts:** connect, total upstream deadline, and cancellation behavior.
6. **Budgets:** per-request/token/cost ceilings, accounting period, exhaustion behavior, and the `429 BUDGET_EXHAUSTED` response.
7. **Secret storage and rotation:** approved secret manager, access policy, rotation cadence, revocation process, and environment separation.
8. **Logging and redaction:** permitted metadata, retention, audit ownership, redaction requirements, and incident-access controls.
9. **Evidence-ID validation:** canonical namespaces, selected-period `availableEvidence` handling, uniqueness, and rejection behavior for missing/unknown IDs.

No backend implementation should begin until these decisions are approved and the P-026 local-only launch contract is explicitly preserved.
