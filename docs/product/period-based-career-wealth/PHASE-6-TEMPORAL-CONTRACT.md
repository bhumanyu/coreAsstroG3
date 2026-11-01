# Phase 6 Temporal Contract

## Canonical instant

Analysis time is represented by `AnalysisContext.asOf`, normalized to a canonical
UTC ISO-8601 instant (`toISOString()` format). Explicit timestamps with offsets
are converted to the equivalent UTC instant. An omitted `asOf` is supplied by
the injected `Clock` at the product-analysis boundary; the resulting context is
resolved once and reused throughout that analysis run.

Invalid explicit inputs fail during context construction. `createAnalysisContext`
never returns an `AnalysisContext` containing an invalid, raw, or placeholder
timestamp. Invalid `Date` instances, empty strings, unparseable timestamps,
unsupported runtime types, and invalid injected-clock values all throw before
horoscope calculation or product pipeline execution. No fallback timestamp is
substituted.

The resulting context is frozen, its methodology is copied and frozen, and its
`asOf` is a canonical UTC ISO-8601 string. Once constructed, that instant is
the immutable temporal input reused throughout the analysis run. Historical
and future valid instants remain accepted and are not clamped.

## Display timezone

Canonical timestamps remain UTC. UI may localize dates for presentation, but
must not rewrite or use display-local values as analysis instants. Where no
display-timezone preference is supplied, presentation should identify/use UTC
rather than silently implying a different analysis instant.

## Intervals and historical/future analysis

All Dasha interval membership uses half-open `[start, end)` semantics: `start`
is included and `end` is excluded. A requested historical or future `asOf` is
evaluated at that exact instant; it is never silently clamped to the current
time or another supported range.

## Forecast horizon and reproducibility

No default forecast horizon has been approved. Forecast-window work remains
gated pending owner approval of the horizon and identification of a deterministic
production evaluator and `natalPromiseEstablished` producer. Until those
decisions are made, callers must not infer a default horizon or wire forecast
series into the product path.

Reproducible analysis metadata includes the canonical `asOf`, methodology,
engine version, rules version, and the selected-period identifiers where
applicable. The forecast gate additionally requires approved horizon and
evaluator provenance before production integration.
