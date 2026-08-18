# PR-025C: AI Provider Routing Layer Specification

## 1. Objective
The AI Provider Routing Layer establishes a deterministic, provider-agnostic framework for registering AI providers, matching provider capabilities against incoming `AiRequest` tasks, scoring candidate availability, and routing synthesis requests to the best eligible engine with transparent fallback capabilities.

## 2. Architectural Boundary & Invariants
- **Agnostic Dispatching**: The routing layer operates exclusively on normalized `AiRequest` and `AiResponse` objects.
- **Astrological Independence**: The routing layer MUST NOT calculate or interpret astrology, modify `AiContext`, access raw `Horoscope` or birth details, construct prompts, or communicate with external LLM APIs.
- **Zero Privacy Leakage**: No birth coordinates, timestamps, or raw astronomical positions are inspected or stored within routing structures.
- **Auditable Provenance**: All routing decisions append immutable routing metadata (`mode`, `fallbackUsed`, `selectionReason`, `candidateCount`) onto `AiResponse.metadata.routing`.

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
  1. Exclusion check (`options.excludedProviderIds`).
  2. Routing mode compatibility (`LOCAL_ONLY` accepts only `LOCAL_RULES`, `REMOTE_ONLY` accepts only `REMOTE_LLM`).
  3. Status availability (rejects `UNAVAILABLE`).
  4. Capability completeness (must possess all required task and format capabilities).
- Scores eligible candidates:
  - `AVAILABLE`: +100
  - `DEGRADED`: +25
  - `PREFERRED_PROVIDER`: +1000
  - `LOCAL_RULES` Priority: +10
  - Base Capability Match: +10
- Deterministic Tie-Breaking: When scores are identical, candidates are sorted alphabetically by `providerId`.

### 3.4 `AiRouter`
- Executes request dispatching against registered providers.
- Supports fallback execution when `fallbackPolicy !== 'NO_FALLBACK'`.
- Decorates the successful `AiResponse` with routing provenance via `decorateAiResponse`.
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
