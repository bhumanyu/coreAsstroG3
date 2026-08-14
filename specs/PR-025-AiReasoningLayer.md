# PR-025: AI Reasoning Layer (Java Multi-Module DDD Bounded Context)

## Architecture Overview
The AI Reasoning Layer is integrated into the Java multi-module backend (`io.coreastro:coreastro-parent:0.1.0-SNAPSHOT`, Java 17). The AI layer exists as a separate bounded context that strictly consumes deterministic `ChartAnalysis` aggregate facts via a grounding DTO (`AiContext`). It never computes astrology directly, keeping existing golden-chart determinism (`GoldenChartValidationTest`, `ChartAnalysisPipelineTest`) 100% untouched.

## Modules & Dependencies
1. `modules/ai-api`: Depends ONLY on `astrology-domain` (for `ChartAnalysis`), Jackson (`compile`), and JUnit 5 (`test`).
2. `modules/ai-clients`: Depends on `ai-api` (vendor SDK imports isolated exclusively to this module).
3. `modules/ai-engine`: Depends on `ai-api` and `ai-clients`.

## Grounding DTO (AiContext)
- Includes `schemaVersion` (e.g., `"1.0.0"`).
- Standardized records: `AscendantFact`, `PlanetFactSummary`, `YogaFactSummary`, `AiContext`.
- `AiContextFactory.from(ChartAnalysis)` creates the immutable grounding snapshot.
- Crucially, raw birth details (`BirthDetails`, `RawChart`, DOB, time, lat/long) are strictly EXCLUDED from `AiContext` and `AiRequest` to eliminate hallucination risks and protect privacy.

## Verification
- `HallucinationBoundaryTest`: Asserts that `AiContext` and `AiRequest` contain no raw date-time, longitude/latitude, or `BirthDetails` references.
- `LocalVedicRulesProvider`: Always-available fallback provider executing local rule synthesis without external API dependencies.
