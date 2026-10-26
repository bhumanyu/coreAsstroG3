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

The selected-period report contains a field-by-field deterministic synthesis
projection: career qualification basis and per-expression activation status,
linked levels, diagnostics and evidence IDs; wealth dimension effects,
availability/data status, linked levels, diagnostics, promise evidence IDs and
Dasha rule references; plus synthesis evidence references, missing-input
diagnostics, provenance, and qualification status. `PARTIAL`,
`INSUFFICIENT_DATA`, and `UNAVAILABLE` values remain explicit and are never
reinterpreted from missing fields. Selected-period AI explanation status and
content are deliberately excluded from this deterministic report projection.
Strict runtime validation whitelists every projected field so additional
internal or hidden state is rejected.

The browser schedules Blob URL revocation after the download click returns, so
the browser has an opportunity to begin consuming the object URL. The UI says
the download was **initiated**; it does not guarantee that the browser saved a
file successfully. If download initiation throws, the error is surfaced and
cleanup is still scheduled.

The selected-period `analysisAsOf` is preserved unchanged from the canonical
selected-period service output and must equal the export's `provenance.asOf`.
The builder and runtime validator reject a mismatch rather than rewriting
either timestamp. This establishes that the selected report belongs to the
same analysis snapshot represented by the export.

This is a portable copy of inputs and deterministic report projections, not a
backup or a signed/authenticated record. Anyone receiving the file can read
the included birth coordinates and time data. Handle it accordingly.

## Offline behavior

Building and downloading the export is client-side and requires no network
service. A browser download failure is surfaced to the user; it does not alter
the in-memory analysis.
