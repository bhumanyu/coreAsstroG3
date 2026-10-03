# P2-04 — Pattern Qualification

> **STATUS: IMPLEMENTED — VERIFICATION PENDING**

> Pattern qualification layer is implemented with unit tests using synthetic fixtures and a real-engine golden test. Pending CI verification before moving to VERIFIED.

## Purpose

P2-04 implements the pattern qualification layer that sits ABOVE the pattern classification layer (P2-03) and consumes planetary relevance (C5) and condition (C6) results. This layer evaluates structural dimensions of Career patterns based on planetary relevance and condition, but does NOT calculate Dasha, D10, transit, timing, or prediction anywhere in the output.

## Qualification Equation

```
Pattern + Planetary Condition + Career Relevance + Pattern Coherence + Divisional Confirmation = Qualified Pattern
```

## Qualification Dimensions (Semantic, Not Numeric)

Qualification uses semantic dimensions rather than numeric scores:

- **Structural Strength** (how strong is the structural foundation?)
  - Per §16: Returns `NOT_ASSESSED` for all patterns until the canonical topology→strength mapping is frozen in the methodology
  - The §5 LOOP→STRONG table is NOT used here

- **Planetary Condition** (how well-conditioned are the participants?)
  - Maps C6 CareerPlanetaryCondition to qualification-level assessment
  - Aggregates per-participant conditions conservatively (weakest wins)

- **Career Relevance** (how relevant is this pattern to Career?)
  - Maps C5 CareerPlanetRelevance to qualification-level assessment
  - Aggregates per-participant relevance conservatively (lowest wins)
  - MIXED downgrades both PRIMARY and SUPPORTING (any MIXED yields MIXED)

- **Pattern Coherence** (how coherent are the relationships?)
  - Minimal structural assessment: `INSUFFICIENT_DATA` if houses or relationshipIds are empty, `MODERATE` otherwise
  - **PROVISIONAL**: The `MODERATE` mapping is a provisional structural-completeness check, not canonical coherence
  - Topology ranking is deferred until methodology is frozen

- **Activation Potential** (how likely is Dasha activation?)
  - Per §16: Returns `UNKNOWN` for all patterns
  - Current activation remains C9's responsibility (timing-aware)
  - The §5 PARIVARTANA→HIGH table is NOT used here

- **Divisional Confirmation** (how confirmed by D9/D10?)
  - Per §16: Returns `NOT_ASSESSED` for all patterns
  - D10 qualification is handled by C10 (careerD10), not this module

## Qualification Status Classification

Uses semantic combinatorial logic (no arithmetic scoring):

- **INSUFFICIENT_DATA**: If any dimension is `NOT_ASSESSED`, `UNKNOWN`, `UNAVAILABLE`, or `INSUFFICIENT_DATA`
- **QUALIFIED**: If structuralStrength is `STRONG` and all dimensions are positive
- **UNQUALIFIED**: If structuralStrength is `WEAK` or any dimension is negative
- **UNQUALIFIED**: Conservative default

Since structuralStrength will be `NOT_ASSESSED`, the insufficient-data guard ensures all patterns route to `INSUFFICIENT_DATA` rather than silently falling to `UNQUALIFIED` or fake `QUALIFIED`.

## C5/C6 Consumption

- **Planetary Condition Mapping** (C6 → qualification):
  - `STRONG` → `STRONG`
  - `MODERATE` → `MODERATE`
  - `NEUTRAL` → `MODERATE` (**PROVISIONAL**: conservative mapping pending methodology freeze)
  - `WEAK` → `WEAK`
  - `AFFLICTED` → `WEAK` (**PROVISIONAL**: mapping pending methodology freeze)
  - `UNAVAILABLE` or missing → `UNAVAILABLE`
  - Switches on `result.condition` (the C6-resolved condition), not `result.dignity`

- **Career Relevance Mapping** (C5 → qualification):
  - `PRIMARY` → `PRIMARY`
  - `SUPPORTING` → `SUPPORTING`
  - `SECONDARY` → `SUPPORTING` (**PROVISIONAL**: mapping pending methodology freeze)
  - `CONDITIONAL` → `MIXED` (**PROVISIONAL**: conflates conditional with conflicting; may become `UNKNOWN` after methodology review)
  - `NEUTRAL` → `NEUTRAL`
  - missing → `UNAVAILABLE`

## Aggregation Logic

Multi-participant patterns aggregate conditions and relevance conservatively:

- **Planetary Condition**: Weakest participant condition wins
  - `UNAVAILABLE` or `WEAK` in any participant yields that result
  - Ordering: `UNAVAILABLE` < `WEAK` < `MODERATE` < `STRONG`

- **Career Relevance**: Lowest participant relevance wins
  - `MIXED` downgrades both `PRIMARY` and `SUPPORTING` (any `MIXED` yields `MIXED`)
  - `NEUTRAL` or `UNAVAILABLE` in any participant yields that result
  - Ordering: `UNAVAILABLE` < `NEUTRAL` < `MIXED` < `SUPPORTING` < `PRIMARY`

## Identity Preservation

Identity is inherited from the source pattern — this module never mints new identity:

- `patternId` and `identityKey` are inherited verbatim from source pattern
- `sourcePattern` is retained for traceability
- No new identity is minted at P2-04

## QualifiedCareerPattern Shape

The qualified output includes flat fields (`family`, `level`, `classification`, `name`, `topology`, `direction`, `houses`, `houseRoles`, `planets`, `networkIds`, `relationshipIds`) populated verbatim from the source pattern for convenience. The `sourcePattern` is retained for full provenance and access to all source data.

## Evidence + Provenance

- **Evidence IDs**: Format `P2-04:<DIMENSION>:<identityKey>`
- **sourceEvidenceIds**: Extracted from `pattern.evidence[].evidenceId`
- **ruleIds**: Extracted from `pattern.evidence[].ruleId` (deduped and sorted)
  - Previously hardcoded as empty array — now preserved for rule traceability
- **sourcePatternIds**: Extracted from `pattern.patternId`

## Determinism

Output is deterministic regardless of input order:

- Input patterns are sorted by `identityKey` before processing
- Participants are emitted in canonical SUN→KETU order via `CANONICAL_PLANET_ORDER`
- Permutation tests verify determinism for both pattern order and participant order

## Deterministic Duplicate Normalization

The qualification layer includes deterministic normalization for malformed input where multiple relevance or condition records exist for the same planet. This ensures output is input-order independent for duplicates.

**Relevance Normalization** (highest precedence wins):
- Precedence order: `PRIMARY` > `SUPPORTING` > `SECONDARY` > `CONDITIONAL` > `NEUTRAL`
- On ties (same precedence), first-wins (preserves input order for equal values)
- Applied when building `relevanceByPlanet` map from input relevance array

**Condition Normalization** (most severe wins):
- Precedence order: `AFFLICTED` > `WEAK` > `MODERATE` > `STRONG` > `NEUTRAL` > `UNAVAILABLE`
- On ties (same precedence), first-wins (preserves input order for equal values)
- Applied when building `conditionByPlanet` map from input condition array

**Note**: Canonical upstream output (C5 relevance and C6 condition) is already unique per planet, so this normalization only applies to malformed/edge-case input. Unit tests verify that different input orders for duplicates produce identical qualified output.

## Boundary Enforcement

This layer must NOT import from:
- `careerDasha`
- `careerD10`
- `careerFinalSynthesis`
- `careerExpression*`
- `domain/timing`

The input interface (`CareerPatternQualificationInput`) contains only patterns, relevance, and condition — NO horoscope, dasha, d10, or timing fields. Tests assert their absence in both input and output.

## Deep Immutability

All output objects are deeply frozen:

- Top-level result is frozen
- All nested objects and arrays are frozen
- Mutation attempts throw errors
- `relevanceSource` and `conditionSource` are frozen before embedding (prevents caller mutation corrupting result)

## Test Coverage

Current test coverage uses synthetic `makePattern`/`makeRelevance`/`makeCondition` fixtures plus a real-engine golden test:

- Unit tests for all classification rules
- Identity preservation tests
- Qualification semantics tests (conservative framework model)
- MIXED condition preservation tests
- Missing relevance/condition → UNAVAILABLE tests
- Divisional NOT_ASSESSED tests
- Boundary enforcement tests (no forbidden properties)
- Determinism tests (pattern permutation, participant order)
- Conflict non-removal tests
- Deep immutability tests (freeze verification, mutation throws)
- Planetary condition mapping tests
- Career relevance mapping tests
- Structural strength classification tests
- Activation potential classification tests
- Pattern coherence classification tests
- Evidence ID generation tests
- Provenance tracking tests
- Deterministic duplicate normalization tests (relevance and condition precedence rules)
- Real-engine golden test (full chain: calculateHoroscope → C4 → graph → networks → patterns → C5 → C6 → qualification)

The real-engine golden test builds the full chain from `CANONICAL_BIRTH_DETAILS` through the entire Career pipeline and validates that qualification preserves pattern identity, produces expected dimension values (`NOT_ASSESSED` for structuralStrength, `UNKNOWN` for activationPotential, `NOT_ASSESSED` for divisionalConfirmation), and maintains deep immutability. The test also verifies determinism by running the pipeline twice and asserting identical output.

## Recent Changes (S1 Fix Iteration)

- Fixed `ruleIds` provenance: now extracts from `pattern.evidence[].ruleId` (deduped and sorted) instead of hardcoding empty array
- Fixed unfrozen sources: `relevanceSource` and `conditionSource` are now frozen before embedding in participant qualifications
- Fixed relevance aggregation asymmetry: MIXED now downgrades both PRIMARY and SUPPORTING consistently (any MIXED yields MIXED)
- Documented aggregation logic with clear comments in `computeQualificationDimensions`
- Documented QualifiedCareerPattern shape deviation from spec (sourcePattern nesting vs flat fields)
- Updated JSDoc comments to reflect provenance and source freezing changes
- Added deterministic duplicate normalization for relevance and condition records:
  - Relevance precedence: PRIMARY > SUPPORTING > SECONDARY > CONDITIONAL > NEUTRAL
  - Condition precedence: AFFLICTED > WEAK > MODERATE > STRONG > NEUTRAL > UNAVAILABLE
  - First-wins on ties to maintain input-order independence for equal precedence values
- Added unit tests for duplicate record order independence
- Added real-engine golden test (full chain closure test) to verify end-to-end integration

## Dependency Note

P2-04 imports `CANONICAL_PLANET_ORDER` from the neutral `careerPlanetOrder` module, which provides the canonical SUN→KETU order used across Career domain modules.

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority, §28 No Generic Career Score
- [`P2-03-PATTERN-QUALIFICATION.md`](./P2-03-PATTERN-QUALIFICATION.md) — Pattern identity/classification layer (upstream)
- [`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`](../CW-R1-C1-CAREER-SEMANTIC-FREEZE.md) — C1 invariants (MISSING ≠ NEGATIVE)
