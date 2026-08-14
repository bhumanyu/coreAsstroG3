# PR-024A: Golden Chart Validation Suite Specification

## Purpose
This specification establishes a regression-protection "golden chart" validation suite and CI integration for the `coreastro` engine. The suite uses JSON fixtures to validate astronomical computations, house allocations, and yoga detections across known charts.

## Fixture Schema Format
JSON fixtures are stored under `modules/astrology-engine/src/test/resources/validation/charts/*.json`.

### Structure Example
```json
{
  "id": "chart001",
  "name": "Reference Epoch Chart 1 (Vaishali)",
  "birth": {
    "dateTimeUtc": "1988-05-08T04:00:00Z",
    "latitude": 25.75,
    "longitude": 85.4167,
    "zoneId": "Asia/Kolkata",
    "ayanamsa": "LAHIRI"
  },
  "positions": {
    "SUN": { "longitude": 10.0, "motion": "DIRECT" },
    "MOON": { "longitude": 40.0, "motion": "DIRECT" },
    "MARS": { "longitude": 280.0, "motion": "DIRECT" },
    "MERCURY": { "longitude": 25.0, "motion": "DIRECT" },
    "JUPITER": { "longitude": 130.0, "motion": "DIRECT" },
    "VENUS": { "longitude": 60.0, "motion": "DIRECT" },
    "SATURN": { "longitude": 260.0, "motion": "DIRECT" },
    "RAHU": { "longitude": 320.0, "motion": "RETROGRADE" },
    "KETU": { "longitude": 140.0, "motion": "RETROGRADE" }
  },
  "expected": {
    "ascendantSign": "TAURUS",
    "tropicalAscendantLongitude": 51.3783,
    "houses": {
      "SUN": 12,
      "MOON": 1,
      "MARS": 9,
      "MERCURY": 12,
      "JUPITER": 4,
      "VENUS": 2,
      "SATURN": 8,
      "RAHU": 10,
      "KETU": 4
    },
    "yogas": [
      "GAJA_KESARI"
    ]
  }
}
```

## Field Scope & Assertions

### Active Assertions (First Iteration)
1. **Ascendant Calculation**: `MeeusAscendantCalculator` calculates the tropical ascendant longitude and corresponding sign. Verified with a numeric tolerance of `1e-3` degrees for longitude and exact match for sign.
2. **Whole-Sign House Allocation**: `WholeSignHouseSystem` assigns house numbers (1–12) for input planetary positions relative to the ascendant. Asserted for all input planets.
3. **Yoga Detection**: `ChartAnalysisPipeline` evaluates active yoga rules (e.g., Gaja Kesari, Ruchaka, Hamsa, Bhadra, Malavya, Shasha). Asserted that `analysis.yogas()` matches the expected `YogaType` set.

### Deferred Assertions (Future Ephemeris & Navamsa PRs)
The following fields are explicitly deferred in this initial suite schema:
- `sunLongitude` & `moonLongitude` (and exact real ephemeris positions for all 9 bodies): The Java engine currently accepts pre-computed `positions` in `RawChart`. Automated ephemeris generation will be integrated when the full planetary ephemeris module is ported.
- `navamsha` (D9 divisional chart sign allocations): Divisional chart calculation logic is scheduled for a subsequent engine update.

## Test Harness & Execution
- **Harness**: `GoldenChartValidationTest.java` in `io.coreastro.astrology.engine.validation`.
- **JUnit 5 Runner**: Uses `@ParameterizedTest` with JSON resources loaded dynamically from `/validation/charts/*.json`.
- **CI Integration**: Executed automatically on every `push` and `pull_request` via `.github/workflows/ci.yml` (`mvn test` and `npm test`).
