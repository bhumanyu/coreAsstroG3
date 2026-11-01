# A04 — Fail-Fast Analysis Context and Immutable `asOf`

**Status:** Implementation committed to feature branch; runtime validation pending  
**Branch:** `feat/a04-fail-fast-asof`  
**Scope:** Reject invalid analysis instants at context construction; preserve a single immutable UTC `asOf`  
**Canonical authorities preserved:** `resolveAnalysisTemporalState`; Career C11; Wealth CW-05; `runLifeAnalysisProduct`

## 1. Problem

The previous `createAnalysisContext` implementation caught exceptions from
`normalizeAsOf` and substituted the raw invalid string or an empty string.
That allowed construction of an `AnalysisContext` that violated its own
canonical UTC instant contract. The temporal resolver rejected the invalid
value later, after an invalid context had already escaped its factory.

The injected `Clock` path also returned `clock.now()` without validating or
canonicalizing the returned value.

## 2. Required contract

1. Explicit valid `Date` and string inputs normalize to canonical UTC ISO-8601.
2. Explicit invalid `Date`, empty/whitespace string, unparseable timestamp, or
   unsupported runtime type throws during `createAnalysisContext`.
3. Omitted/null `asOf` uses the injected clock exactly once and validates its
   result through the same normalization path as explicit strings.
4. Invalid clock output throws; it is never propagated as an analysis instant.
5. No invalid raw value, empty placeholder, or fallback instant is returned.
6. The created context and copied methodology remain frozen. `asOf` is a
   primitive canonical UTC string and cannot be reassigned on the context.
7. Historical and future valid instants remain accepted without clamping.
8. The product entry point rejects malformed explicit `asOf` before horoscope
   calculation or pipeline execution.
9. The same canonical context reference continues through the pipeline when a
   caller supplies a context created by the canonical factory.

## 3. Implementation

### `src/core/analysis/analysisContextFactory.ts`

- Removed the catch-and-substitute fallback from `createAnalysisContext`.
- Context creation now directly uses `normalizeAsOf`; validation errors
  propagate immediately.
- Injected clock values are checked for string type and passed through
  `normalizeAsOf` again, so clock output receives the same parseability check
  and UTC canonicalization as explicit timestamps.

### Tests

- `src/core/analysis/analysisContext.test.ts` now expects invalid explicit
  values to throw during context construction.
- Added invalid `Date`, invalid injected-clock timestamp, and runtime
  non-string clock-output coverage.
- `src/core/analysis/resolveAnalysisTemporalState.test.ts` now asserts that
  invalid values fail before temporal-state resolution.
- `src/product/analysis/productAnalysisService.integration.test.ts` now
  asserts that invalid `asOf` rejects before horoscope calculation and
  `runPipeline` invocation.

### Temporal contract

`docs/product/period-based-career-wealth/PHASE-6-TEMPORAL-CONTRACT.md` now
states that context construction is fail-fast and that no invalid or
placeholder timestamp may escape the factory.

## 4. Preserved behavior and non-goals

A04 does not:
- Add or replace a Dasha resolver.
- Change `resolveAnalysisTemporalState` as the canonical temporal authority.
- Change Dasha interval membership, half-open interval semantics, or
  historical/future handling.
- Clamp valid historical/future instants.
- Change Career C11, Wealth CW-05, evidence identity, or domain reasoning.
- Recompute or replace caller-supplied canonical contexts.
- Introduce a default forecast horizon or forecast evaluator.

## 5. Validation record

Source changes and regression assertions have been committed to the feature
branch. The following remain **NOT_RUN** in this implementation environment:

- `npm ci`
- `npm run lint`
- Targeted Vitest suites
- `npm test`
- `npm run build`
- `npm run verify:bundle`
- GitHub Actions CI for the final A04 branch head

A04 must not be marked validated or ready to merge until these commands and
current-SHA CI are observed. No runtime success is claimed by this document.
