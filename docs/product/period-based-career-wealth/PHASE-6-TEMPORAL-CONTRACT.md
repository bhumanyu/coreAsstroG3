# Phase 6 Temporal Contract

## Canonical instant

Analysis time is represented by `AnalysisContext.asOf`, normalized to a canonical
UTC ISO-8601 instant (`toISOString()` format). Explicit timestamps with offsets
are converted to the equivalent UTC instant. An omitted `asOf` is supplied by
the injected `Clock` at the product-analysis boundary; the resulting context is
resolved once and reused throughout that analysis run.

Invalid explicit inputs preserve the existing error path: context construction
retains the invalid raw string (or empty string for a non-string invalid value),
and temporal-state resolution rejects it. This is intentional compatibility
behavior, not acceptance of an invalid instant.

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
