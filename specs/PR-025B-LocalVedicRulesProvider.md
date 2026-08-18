# PR-025B: Local Vedic Rules Provider Specification

## 1. Objective

PR-025B implements a deterministic, offline `LocalVedicRulesProvider` that consumes ONLY the immutable `AiContext` produced by PR-025A (`src/ai/context/aiContextFactory.ts`) and generates structured, auditable `AiReasoningResult` and `AiResponse` objects.

The provider acts as the first deterministic, zero-network, local AI inference layer for the CoreAstro system.

## 2. Architectural Boundaries & Guarantees

1. **Strict Context Isolation**:
   - The provider and rules engine consume only `AiRequest` and `AiContext`.
   - Never imports `Horoscope`, `calculateHoroscope`, or raw birth information (`dateOfBirth`, `timeOfBirth`, `latitude`, `longitude`).
   - Never imports or executes any underlying astronomical / astrological calculation modules from `src/engine/`.
   - CoreAstro calculation engines remain solely authoritative for astrological truth.

2. **Zero LLM Dependency / Complete Offline Execution**:
   - Pure TypeScript heuristic Vedic rules engine.
   - Operates 100% offline with zero external network requests and zero latency unpredictability.

3. **Immutability & Safety**:
   - Operates strictly over deep-frozen `AiContext` structures.
   - Never mutates context or input parameters.
   - Outputs deep-frozen `AiReasoningResult` and `AiResponse` structures.

4. **Deterministic Reasoning & Auditability**:
   - Given the identical `AiContext` and `AiTask`, execution produces identical outputs (`toEqual`).
   - All triggered rules are explicitly recorded via `triggeredRuleIds`.
   - All supporting and challenging evidence IDs are cross-referenced directly with `context.evidence`.

5. **Privacy by Design**:
   - Because `AiContext` sanitizes PII and coordinates, serialized outputs from `LocalVedicRulesProvider` contain zero raw birth coordinates or timestamp strings.

## 3. Supported Tasks & Domain Mapping

`LocalVedicRulesProvider` supports all 6 canonical `AiTask` variants through the exhaustive `TASK_DOMAIN` mapping:

| `AiTask` | `LocalRuleDomain` | Core Rule Evaluation |
|---|---|---|
| `CHART_SYNTHESIS` | `CHART` | Aggregates ascendant lord facts, planetary house placements, and varga harmony / conflict factors across all evidence. |
| `CAREER_ANALYSIS` | `CAREER` | Evaluates career status, natal promise, D10 Dashamsha confirmation/conflicts, and Dasha period activations. |
| `WEALTH_ANALYSIS` | `WEALTH` | Evaluates overall wealth status, subthemes (Accumulation, Gains, Fortune, Speculation), and Dhana/Lakshmi yogas. |
| `DASHA_ANALYSIS` | `DASHA` | Evaluates active Vimshottari Mahadasha, Antardasha, and period timing evidence. |
| `LIFE_THEME_ANALYSIS` | `LIFE_THEME` | Synthesizes multidimensional life theme projections and evidence effects. |
| `GENERAL_QUERY` | `GENERAL` | Synthesizes baseline Vedic reasoning across the full set of projected facts. |

## 4. Evidence Prioritization and Scoring

Evidence items within the local provider are scored and ranked via `scoreEvidence()`:
- `STRENGTH_WEIGHT`: STRONG (3), MODERATE (2), WEAK (1), UNKNOWN (0)
- `PRIORITY_WEIGHT`: PRIMARY (4), SECONDARY (2), CONFIRMATORY (2), TIMING (1)
- `DIMENSION BONUS`: NATAL_STRUCTURE (+2), CONFIRMATION (+1)
- `TIE-BREAKER`: Deterministic lexicographical comparison of evidence IDs (`a.id.localeCompare(b.id)`)

*Note: Evidence scoring is an internal AI prioritization heuristic to structure narratives and conclusions, not an astrological calculation.*

## 5. Verification & Compliance

- **Unit & Integration Tests**: `src/ai/providers/local/localVedicRulesEngine.test.ts` and `src/ai/providers/local/LocalVedicRulesProvider.test.ts`.
- **Regression Suite**: Fully integrated with the existing AI context factory test suite (`src/ai/context/aiContextFactory.test.ts`).
