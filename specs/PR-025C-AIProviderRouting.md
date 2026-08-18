# PR-025C: AI Provider Routing Layer Specification

## 1. Objective
The AI Provider Routing Layer establishes a deterministic, provider-agnostic framework for registering AI providers, matching provider capabilities against incoming `AiRequest` tasks, scoring candidate availability, and routing synthesis requests to the best eligible engine with transparent fallback capabilities.

## 2. Architectural Boundary & Invariants
- **Agnostic Dispatching**: The routing layer operates exclusively on normalized `AiRequest` and `AiResponse` objects.
- **Astrological Independence**: The routing layer MUST NOT calculate or interpret astrology, modify `AiContext`, access raw `Horoscope` or birth details, construct prompts, or communicate with external LLM APIs.
- **Zero Privacy Leakage**: No birth coordinates, timestamps, or raw astronomical positions are inspected or stored within routing structures.
- **Auditable Provenance**: All routing decisions append immutable routing metadata (`mode`, `fallbackUsed`, `selectionReason`, `candidateCount` [total evaluated], `eligibleCandidateCount` [eligible matching]) onto `AiResponse.metadata.routing`.

## 3. Core Components

### 3.1 `AiProviderRegistry`
- In-memory registry holding registered `AiProvider` instances.
- Rejects empty identifiers and duplicate provider registrations.
- Provides immutable snapshot inspection via `list()`.

### 3.2 `providerCapabilityMap`
- Strict mapping between `AiTask` and required `AiCapability` values:
  - `CHART_SYNTHESIS` -> `['CHART_SYNTHESIS']`
  - `CAREER_ANALYSIS` -> `['CAREER']`
  - `WEALTH_ANALYSIS` -> `['WEALTH']`
  - `DASHA_ANALYSIS` -> `['DASHA']`
  - `LIFE_THEME_ANALYSIS` -> `['LIFE_THEMES']`
  - `GENERAL_QUERY` -> `[]`
- Requests requiring `responseFormat === 'STRUCTURED'` automatically demand the `'STRUCTURED_OUTPUT'` capability.

### 3.3 `AiProviderSelector`
- Filters candidate providers by eligibility:
  1. Exclusion check (`options.excludedProviderIds`, normalized by trimming and filtering empty strings).
  2. Routing mode compatibility (`LOCAL_ONLY` accepts only `LOCAL_RULES`, `REMOTE_ONLY` accepts only `REMOTE_LLM`).
  3. Status availability (rejects `UNAVAILABLE`). Throws `PREFERRED_PROVIDER_UNAVAILABLE` when a preferred provider exists and is `UNAVAILABLE` under `NO_FALLBACK`. (Violations of other eligibility criteria such as mode mismatch or missing capabilities produce `NO_ELIGIBLE_PROVIDER` if no other eligible candidate remains).
  4. Capability completeness (must possess all required task and format capabilities).
- Scores eligible candidates using discrete `AiCandidateScoringFactor` values:
  - `AVAILABLE`: +100
  - `DEGRADED`: +25
  - `PREFERRED_PROVIDER`: +1000
  - `LOCAL_RULES` Priority: +10 (AUTO mode is intentionally local-first by giving deterministic preference to local rules)
  - Base Capability Match: +10
- Deterministic Tie-Breaking: When scores are identical, candidates are sorted alphabetically by `providerId`.
- Returns `orderedCandidates`: an immutable array of eligible candidates pre-sorted in ranked execution order.
- Derives high-level `selectionReason` (`PREFERRED_PROVIDER`, `ONLY_ELIGIBLE_PROVIDER`, `PRIORITY`).

### 3.4 `AiRouter`
- Executes request dispatching directly across `selection.orderedCandidates` without redundant re-sorting.
- Gracefully handles registry mutations between selection and execution by recording missing providers into execution errors.
- Supports fallback execution when `fallbackPolicy !== 'NO_FALLBACK'`.
- Accurately tracks `fallbackUsed` (true if secondary candidates executed) without overwriting `selectionReason`.
- Decorates the successful `AiResponse` with routing provenance via `decorateAiResponse` (`mode`, `fallbackUsed`, `selectionReason`, `candidateCount`, `eligibleCandidateCount`).
- Surfaces clear domain errors (`AiRoutingError`) without corrupting astrological diagnostics.

### 3.5 `createDefaultAiRouter`
- Instantiates an `AiProviderRegistry` pre-populated with `LocalVedicRulesProvider`.
- Serves as the standard entry point for offline, zero-network Vedic AI synthesis.

## 4. Availability & Fallback Semantics
- `AVAILABLE`: Provider operates normally with full confidence (+100 score).
- `DEGRADED`: Provider has transient issues (e.g. rate-limit proximity) but remains eligible (+25 score).
- `UNAVAILABLE`: Provider is skipped entirely during candidate selection.
- `ALLOW_FALLBACK` (default): If the top-ranked provider fails during `generate()`, the router proceeds sequentially down the ordered list of eligible candidates.
- `NO_FALLBACK`: The router fails immediately if the primary provider raises an error.

## 5. Acceptance Matrix

| Requirement | Implementation | Status |
| :--- | :--- | :--- |
| Zero Astrological Calculation | Routing layer contains no ephemeris or chart logic | Verified |
| Strict Capability Mapping | Exhaustive map for all 6 `AiTask` entries | Verified |
| Degraded Provider Handling | Degraded remains eligible with lowered score | Verified |
| Deterministic Tie-Breaking | Id alphabetical sort on score equality | Verified |
| Explicit Fallback Control | Configurable `ALLOW_FALLBACK` vs `NO_FALLBACK` | Verified |
| Provenance Decoration | Appends `metadata.routing` and `metadata.provider` | Verified |
| Local Provider Decoupling | Only `createDefaultAiRouter` binds concrete local provider | Verified |
