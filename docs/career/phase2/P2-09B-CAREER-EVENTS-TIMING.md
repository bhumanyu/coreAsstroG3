# P2-09B: Career Events & Timing Layer

## Overview

P2-09B implements a deterministic downstream module that consumes canonical C11 (`CareerFinalSynthesisResult` via P2-09A `CareerTrajectoryAnalysis`) and C9 (`CareerDashaCanonicalAnalysis`) to produce evidence-traceable career event candidates and source-backed timing windows.

This is a standalone analysis layer — it must NOT recalculate any C4–C11 astrology, must NOT wire itself into `CareerDomainInterpreterV2.ts`, and must NOT call AI.

## Core Invariants

1. **Events are downstream classifications, not predictions.**
   - Event candidates are derived from existing trajectory opportunities and Dasha activations.
   - This layer does not perform any C4–C11 astrology calculations.
   - It does not invent dates or outcomes.

2. **Dasha cannot manufacture opportunities (EVT-01).**
   - Opportunity-window candidates require an existing qualified trajectory opportunity (`qualified === true` and direction `SUPPORT`/`CONDITIONAL`) AND an activating period (`ACTIVATES`/`PARTIALLY_ACTIVATES`) with `SUPPORT` direction.
   - Never emit an event with zero supporting evidence.

3. **Missing evidence is not negative evidence (EVT-02).**
   - Periods with `UNKNOWN`/`INSUFFICIENT_DATA`/`UNAVAILABLE`/`NEUTRAL` effect/direction produce NO event (not a challenge).
   - Missing evidence is not negative evidence.

4. **Use source dates as-is (EVT-03).**
   - Never infer, interpolate, or extend dates.
   - Missing or partial dates → `UNTIMED` candidate.
   - Malformed or start>end dates → throw.

5. **Evidence IDs are semantic identities, not occurrence IDs.**
   - `evidenceIds` must stay semantic identity IDs (the Dasha evidence `identityKey` and trajectory opportunity `evidenceIds`).
   - Never mix in occurrence IDs, source IDs, rule IDs, or event IDs.

6. **Deterministic output.**
   - Stable `eventId` derived from domain inputs (no UUID/timestamp).
   - Sorted-unique evidence.
   - Dedupe by event identity.
   - Throw on same-identity conflicting payloads.
   - Sort final events by `eventId` with a code-point comparator (not `localeCompare`).
   - Freeze result and all nested arrays.

## Output Contract

### `CareerEventsAnalysis`

```typescript
{
  reasoningVersion: 'P2-09B';
  domain: 'CAREER';
  guaranteedEventsAvailable: false;
  events: readonly CareerEvent[];
  evidenceIds: readonly string[];
  statement: string;
}
```

### `CareerEvent`

```typescript
{
  eventId: string;  // Format: 'CAREER_EVENT:{eventType}:{sourceKey}'
  eventType: CareerEventType;
  status: 'CANDIDATE';
  timing: CareerEventTiming;
  evidenceIds: readonly string[];
  statement: string;
}
```

### `CareerEventType`

Restricted vocabulary (no outcome-asserting names like PROMOTION/JOB_LOSS/SALARY_INCREASE):

- `CAREER_OPPORTUNITY_WINDOW`
- `CAREER_CHALLENGE_WINDOW`
- `CAREER_CONDITIONAL_WINDOW`

### `CareerEventTiming`

- `DASHA_PERIOD_WINDOW`: Has `start` and `end` dates from source
- `UNTIMED`: No timing information available

## Event Generation Rules

### EVT-01: Opportunity Window Requirements

Opportunity-window candidates require:

1. An existing qualified trajectory opportunity:
   - `qualified === true`
   - `direction === 'SUPPORT'` or `direction === 'CONDITIONAL'`

2. An activating Dasha period:
   - `effect === 'ACTIVATES'` or `effect === 'PARTIALLY_ACTIVATES'`
   - `direction === 'SUPPORT'`

Dasha cannot manufacture an opportunity. Never emit an event with zero supporting evidence.

### EVT-02: Missing Evidence Is Not Negative Evidence

Periods with the following effect/direction values produce NO event:

- `effect`: `UNKNOWN`, `INSUFFICIENT_DATA`, `DOES_NOT_ACTIVATE`
- `direction`: `UNKNOWN`, `UNAVAILABLE`, `NEUTRAL`

These are not treated as challenges — missing evidence is not negative evidence.

### EVT-03: Date Handling

- Use source dates as-is; never infer, interpolate, or extend.
- Missing or partial dates (start only, end only) → `UNTIMED` candidate.
- Malformed dates → `UNTIMED` candidate (validator accepts both ISO format from vimshottari engine and YYYY-MM-DD format from test fixtures).
- Start > end dates → throw error.

## Evidence, Identity, and Provenance Semantics

### Evidence ID Namespaces

**Separate ID namespaces are maintained:**

- `evidenceIds`: Semantic identity IDs (Dasha evidence `identityKey` and trajectory opportunity `evidenceIds`)
- `occurrenceIds`: NOT used in events (these are the `id` field from canonical evidence)
- `sourceIds`: NOT used in events (these are provenance occurrence IDs)
- `ruleIds`: NOT used in events (these are rule identity IDs)
- `eventIds`: Generated event identifiers (format: `CAREER_EVENT:{eventType}:{sourceKey}`)

**Never mix namespaces in `evidenceIds`.**

### Dasha Evidence Identity

- Use `identityKey` from `CareerDashaCanonicalEvidence` for semantic identity.
- Do NOT use the `id` field (occurrence identity).
- Do NOT use `sourceIds` (provenance occurrences).

### Trajectory Evidence Identity

- Use `evidenceIds` from `CareerTrajectoryOpportunity` (these are already semantic identity IDs from C11).

## Deterministic Output Requirements

### Event ID Generation

Event IDs are stable and derived from domain inputs:

```
CAREER_EVENT:{eventType}:{opportunityMode}:{periodLevel}:{periodPlanet}
```

Example: `CAREER_EVENT:CAREER_OPPORTUNITY_WINDOW:MANAGEMENT:MD:SUN`

No UUIDs or timestamps are used.

### Evidence ID Handling

- Collect evidence IDs from trajectory opportunities and Dasha evidence.
- Deduplicate and sort evidence IDs.
- Never include occurrence IDs, source IDs, or rule IDs.

### Event Deduplication

- Dedupe events by `eventId`.
- Throw if same `eventId` has conflicting payloads (different `eventType`, `timing`, or `evidenceIds`).
- Sort final events by `eventId` with deterministic code-point comparison (not `localeCompare`).

### Freezing

- Return frozen result (`Object.freeze`).
- Freeze all nested arrays and objects.

## Date Format Handling

The validator accepts two date formats:

1. **ISO format** (from vimshottari engine): `2020-01-01T00:00:00.000Z`
2. **YYYY-MM-DD format** (from test fixtures): `2020-01-01`

Both formats are considered valid. Malformed dates produce `UNTIMED` events.

## Boundary List

This module must NOT:

1. Recalculate any C4–C11 astrology (natal, expression, dasha, D10, transit).
2. Wire itself into `CareerDomainInterpreterV2.ts`.
3. Call AI or any non-deterministic services.
4. Invent dates or outcomes.
5. Mix occurrence IDs, source IDs, or rule IDs into `evidenceIds`.
6. Treat missing evidence as negative evidence.
7. Manufacture opportunities from Dasha alone (EVT-01).
8. Emit events for periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL effect/direction (EVT-02).
9. Infer, interpolate, or extend dates (EVT-03).
10. Use UUIDs or timestamps for event IDs.

## Implementation Status

**IMPLEMENTED — VERIFICATION PENDING**

Files:
- `src/domain/career/careerEvents/careerEventTypes.ts`
- `src/domain/career/careerEvents/careerEventEngine.ts`
- `src/domain/career/careerEvents/careerEventEngine.test.ts`
- `src/domain/career/careerEvents/index.ts`

## Verification

- Lint: `npm run lint` (tsc --noEmit)
- Tests: `npm test -- careerEventEngine.test.ts`
- Regression tests:
  - `npm test -- careerTrajectoryEngine.test.ts`
  - `npm test -- careerFinalSynthesisIntegration.test.ts`
  - `npm test -- canonicalCareerEvidenceMapper.test.ts`
  - `npm test -- CareerDomainInterpreterV2.test.ts`

All tests must pass without regression.
