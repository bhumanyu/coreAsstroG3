# D02 — Analysis and Rule Version Reproducibility

**Status:** Implemented on feature branch; validation pending  
**Branch:** `feat/d02-analysis-version-reproducibility`

## Purpose

Every new canonical ProductAnalysis records the deterministic implementation identities that are available at execution time. AI explanation metadata is recorded separately and must not affect deterministic calculation identity.

## Manifest contract

`ProductAnalysis.versionManifest.deterministic` contains:

- Calculation engine and rule catalogue version.
- Reference dataset versions, independently keyed by dataset.
- Career logic, Wealth logic, C11 Career synthesis and CW-05 Wealth synthesis versions.
- Product output schema version.
- Deterministic methodology dimensions (zodiac system, house system, ayanamsa, varga rules and Dasha system).
- Non-personal configuration identifiers.
- Input-retention declaration and a conservative replay assessment.

Each version component is one of:

- `RECORDED`: a concrete identifier was provided by the runtime.
- `NOT_RECORDED`: the runtime did not expose an identifier; a reason is required.
- `NOT_APPLICABLE`: component is explicitly irrelevant.

No absent component is populated from a guessed version. The engine/rules values in the legacy aggregate fields and context remain the existing runtime authorities. Logic/synthesis/dataset versions remain explicitly not recorded until their owners expose independent identifiers.

## AI separation

Every successful AI explanation gets a separate `D02-AI-v1` record containing provider ID/version, returned model, prompt version, output-schema version, routing mode, task and generation time. Missing provider/model/prompt/schema fields are not inferred. AI version changes do not alter the deterministic manifest.

AI explanations are attached as execution records, not as part of the deterministic version key. The same deterministic result can therefore be accompanied by different AI provider/model/prompt runs.

## Reproducibility and replay policy

A historical analysis can be identified by `analysisId`, `asOf`, calculation engine, rule catalogue, independent logic/synthesis versions, methodology, configuration identifiers and output schema.

A manifest alone does not make an analysis replayable. Replay is only classified as `REPLAYABLE_WITH_RETAINED_INPUTS` when all of these are explicitly confirmed:
1. Required inputs are retained by the caller and an opaque retained-input snapshot reference is present.
2. Required code is available.
3. Required reference datasets are available.
4. The manifest contains all required independent version dimensions.

Unknown or false prerequisites produce `NOT_REPLAYABLE` with reason codes. The repository currently creates an in-memory run snapshot; it does not supply durable historical input retention or immutable code/dataset archives. Therefore the default runtime assessment remains non-replayable. Callers are responsible for approved, privacy-aware retention and can later provide these capability confirmations.

The manifest stores methodology, non-personal configuration identifiers and an optional opaque caller-owned snapshot reference only. It does not copy raw birth details, personal facts, or source payloads into the version manifest.

## Compatibility and migration

- New ProductAnalysis objects include optional `versionManifest`.
- Existing ProductAnalysis records without it remain valid and are interpreted as pre-D02/unmigrated.
- `migrateLegacyProductAnalysis` adds explicit `NOT_RECORDED` values for dimensions that historical records did not capture. It never fabricates old C11/CW-05 or dataset versions and does not alter analysis conclusions.
- Chart export V1 is still accepted by the validator.
- New exports with a version manifest use Chart Export V2. Exports without one remain V1.
- Unknown export schema versions are rejected.

## Non-goals

- No change to astrological calculation, C11/CW-05 synthesis, or domain rules.
- No automatic archival of inputs, binaries, rules or reference datasets.
- No promise that unavailable historical code/data can be reconstructed.
- No storage of unnecessary personal data.
