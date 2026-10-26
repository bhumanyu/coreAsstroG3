# Chart and report JSON export format

## Versioning

Exports use the strict runtime-validated `ChartExportV1` JSON DTO with
`schemaVersion: 1`. A future version is rejected rather than interpreted as
version 1. The export service validates before formatting and downloading the
JSON as a Blob, then revokes the temporary object URL.

## Contents and provenance

The export is a typed projection of the exact `ProductAnalysis` and selected
period supplied by the current rendered caller. It records `analysisId`,
`asOf`, export time, the aggregate's real `engineVersion`, `rulesVersion`, and
`methodology`. Birth fields come only from `ProductAnalysis.birth`: date/time,
timezone, coordinates, and ayanamsa. Name and place of birth are excluded.

Chart facts, interpretation, and selected period use explicit
`AVAILABLE`/`PARTIAL`/`UNAVAILABLE` wrappers. An absent or failed result is not
converted into a negative conclusion. Evidence is projected field by field;
the internal aggregate, AI/provider state, warnings, and unrelated application
state are not serialized. When selected-period output is included, its
`analysisAsOf` must match export provenance `asOf`.

This is a portable copy of inputs and deterministic report projections, not a
backup or a signed/authenticated record. Anyone receiving the file can read
the included birth coordinates and time data. Handle it accordingly.

## Offline behavior

Building and downloading the export is client-side and requires no network
service. A browser download failure is surfaced to the user; it does not alter
the in-memory analysis.
