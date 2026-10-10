# P2-10B: AI Context Projection for Career Intelligence

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

P2-10B implements the AI context projection layer for canonical career intelligence, projecting authoritative C11 synthesis results and precomputed P2-10A profession analysis into AI context DTOs.

This layer is purely additive projection/plumbing — it does NOT:
- Recalculate astrology
- Treat legacy synthesis as authoritative
- Modify C4–C11 producers
- Modify DomainEvidence.ts
- Modify the public return type of interpretCareerV2

## Implementation

### Projection Layer

**File:** `src/ai/context/careerIntelligenceProjection.ts`

#### Functions

1. **`projectCanonicalCareerC11(interpretation?)`**
   - Projects the authoritative canonical C11 result from `conclusionData.canonicalCareerFinalSynthesis`
   - Returns `undefined` if canonical C11 is missing or fails type guard
   - **Never falls back to legacy `careerFinalSynthesis`**
   - Type guard `isCareerFinalSynthesisResult` enforces C11 contract:
     - `reasoningVersion === 'C11'`
     - `domain === 'CAREER'`
     - All required fields present (finalStatus, finalDirection, finalStrength, etc.)

2. **`projectCareerProfessionAnalysis(analysis?)`**
   - Projects precomputed P2-10A `CareerProfessionAnalysis` into AI context
   - Returns UNAVAILABLE/INSUFFICIENT_DATA stub when analysis is undefined
   - **Aggregate d10Status rule:** QUALIFIED > UNAVAILABLE > NOT_PROVIDED > NOT_APPLICABLE
   - Passes through evidence with linkage and mechanism IDs
   - Deterministic output

### AI Context Types

**File:** `src/ai/types/aiContextTypes.ts`

#### New DTOs

1. **`AiCareerCanonicalC11Fact`**
   - Projects C11 final synthesis result
   - Includes expressions, conflicts, and all C11 fields
   - No legacy fallback

2. **`AiCareerProfessionFact`**
   - Projects P2-10A profession analysis
   - Includes candidates, availability, status, d10Status
   - Returns UNAVAILABLE/INSUFFICIENT_DATA when analysis is missing

3. **`AiCareerProfessionCandidateFact`**
   - Projects individual profession candidates
   - Includes domain, family, expressionTypes, mechanismTypes, evidence

4. **`AiCareerProfessionEvidenceFact`**
   - Projects profession evidence records
   - Includes linkage and mechanism IDs

### CareerFact Extension

**File:** `src/ai/types/aiContextTypes.ts`

**Updated interface:**
```typescript
export interface CareerFact {
  // ... existing fields
  readonly canonicalC11?: AiCareerCanonicalC11Fact;
  readonly profession: AiCareerProfessionFact; // Now required
}
```

**Schema version bumped to 1.1.0** in `src/ai/types/aiTypes.ts`

### AI Context Factory

**File:** `src/ai/context/aiContextFactory.ts`

**Updates:**
1. Added `careerProfessionAnalysis` parameter to `BuildAiContextOptions` and `ProductAiContextOptions`
2. `buildCareerFact` now accepts `careerProfessionAnalysis` parameter
3. `buildCareerFact` calls `projectCareerProfessionAnalysis(careerProfessionAnalysis)` to set the required `profession` field
4. `buildCareerFact` calls `projectCanonicalCareerC11(careerInterpretation)` to set optional `canonicalC11` field

**Forwarding verified:**
- `buildAiContext` forwards `options?.careerProfessionAnalysis` to `buildCareerFact`
- `buildProductAiContext` delegates to `buildAiContext` with full options

## Production Integration

### Current State

**DEFERRED:** Production producer wiring requires domain interpretation changes.

The P2-10A `CareerProfessionAnalysis` requires:
- `CareerExpressionAnalysisResult` from P2-08A
- `CareerMechanismCandidate[]` from P2-07C/P2-07D
- `Career10HFoundation` from P2-07F
- `Career10LFoundation` from P2-07G
- `CareerD10CanonicalAnalysis` from P2-08D
- `DomainEvidence` from P2-08E

These inputs are not currently exposed in `DomainInterpretation.conclusionData`. To wire the production producer:

1. **Option A:** Add `careerExpressionAnalysis` to `conclusionData` in `CareerDomainInterpreterV2`
2. **Option B:** Compute `CareerProfessionAnalysis` in a separate service and pass it via `BuildAiContextOptions`

**Constraint:** Do NOT recalculate astrology or create a competing conclusion. Consume existing canonical outputs only.

### Local AI Rule Engine

**File:** `src/ai/providers/local/rules/careerRules.ts`

**New rules added:**

1. **`LOCAL-CAREER-004`**
   - Reads `context.career.canonicalC11`
   - Reports C11 final status, direction, strength, confidence
   - Reports natal direction/strength, expression status, D10 direction
   - Reports conflicts count and strongest expressions
   - Does NOT invent astrology

2. **`LOCAL-CAREER-005`**
   - Reads `context.career.profession`
   - Reports availability, status, d10Status
   - Reports candidate count, missing inputs, unresolved/mapped expression types
   - Does NOT invent astrology

## Boundary Contracts

### Authoritative-C11-Only Boundary

- **Rule:** `projectCanonicalCareerC11` reads ONLY `conclusionData.canonicalCareerFinalSynthesis`
- **Never falls back to legacy** `careerFinalSynthesis`
- **Type guard enforcement:** Returns `undefined` if C11 is missing or invalid
- **Test coverage:** Legacy-only synthesis present → returns `undefined`

### Profession Availability Semantics

- **Undefined input:** Returns UNAVAILABLE/INSUFFICIENT_DATA stub
- **d10Status aggregation:** QUALIFIED > UNAVAILABLE > NOT_PROVIDED > NOT_APPLICABLE
- **Evidence pass-through:** Linkage and mechanism IDs preserved
- **Deterministic output:** Same input produces byte-identical output

### No-Astrology-Recalculation Boundary

- **Projection layer only:** Maps already-computed canonical outputs
- **No planet→job mapping:** Uses expression/mechanism types only
- **No D10 creation:** D10 only qualifies existing candidates
- **No timing creation:** Timing from canonical dasha hierarchy only

## Test Coverage

**File:** `src/ai/context/careerIntelligenceProjection.test.ts`

**Test cases:**

### `projectCanonicalCareerC11`
- ✓ Valid canonical C11 result → projection
- ✓ Missing canonicalCareerFinalSynthesis → undefined
- ✓ Undefined interpretation → undefined
- ✓ Invalid C11 (wrong version) → undefined
- ✓ Legacy-only synthesis present → undefined (never reads legacy)

### `projectCareerProfessionAnalysis`
- ✓ Undefined analysis → UNAVAILABLE/INSUFFICIENT_DATA stub
- ✓ Valid analysis with candidates → full projection
- ✓ d10Status aggregation: QUALIFIED > UNAVAILABLE > NOT_PROVIDED > NOT_APPLICABLE
- ✓ Evidence with linkage and mechanism IDs → pass-through
- ✓ All analysis fields preserved
- ✓ Deterministic output

### Type Guard `isCareerFinalSynthesisResult`
- ✓ Valid C11 → true
- ✓ Missing reasoningVersion → false
- ✓ Wrong reasoningVersion → false
- ✓ Null/undefined → false
- ✓ Missing required fields → false

## Schema Version

**Bumped to 1.1.0** in `src/ai/types/aiTypes.ts`

All test fixtures updated to use `1.1.0`:
- `src/ai/context/aiContextFactory.test.ts`
- `src/ai/providers/openai/*.test.ts`
- `src/ai/providers/remote/RemoteAiProvider.test.ts`
- `src/ai/reliability/ReliableAiProvider.test.ts`
- `src/ai/routing/*.test.ts`

## Fixture Updates

All `CareerFact` constructors updated to include the now-required `profession` field:
- `src/ai/providers/local/localVedicRulesEngine.test.ts`
- Stubs use `projectCareerProfessionAnalysis(undefined)` for unavailable case

## Sanitization Coverage

**NOT APPLICABLE:** The new fields (`canonicalC11`, `profession`) contain no PII:
- No birth details, timestamps, or geographic identifiers
- No raw horoscope references
- Only computed career intelligence data

Existing sanitization tests in `src/ai/context/aiContextSanitization.test.ts` remain valid.

## Verification

**Pending:** Run full test suite after CI is observable.

**Planned verification:**
1. `tsc --noEmit` → should pass
2. `npm test` for:
   - `src/ai/context/careerIntelligenceProjection.test.ts`
   - `src/ai/context/aiContextFactory.test.ts`
   - `src/ai/providers/local`
   - `src/domain/career/CareerDomainInterpreterV2.test.ts`
   - `src/product/life-analysis`

## Deferred Work

1. **Production producer wiring:** Requires domain interpretation changes to expose P2-10A inputs
2. **D10 per-expression qualification:** Deferred due to identity namespace mismatch between P2-08A expressionId and D10 canonical expressionId (documented in P2-10A)

## References

- P2-10A: Career Domain/Profession Model
- P2-08D: Career D10 Canonical Analysis
- P2-08A: Career Expression Layer
- Commit 1b5e4e294431f0ff6899141bf279aefa6b790c0f: Initial projection layer implementation
