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
   - Compatibility check: The period must have matching Dasha evidence (same level, planet, effect, direction, role).
   - Never emit an event with zero supporting evidence.

3. **Missing evidence is not negative evidence (EVT-02).**
   - Periods with `UNKNOWN`/`INSUFFICIENT_DATA`/`UNAVAILABLE`/`NEUTRAL` effect/direction produce NO event (not a challenge).
   - Missing evidence is not negative evidence.

4. **Use source dates as-is (EVT-03).**
   - Never infer, interpolate, or extend dates.
   - Missing or partial dates → `UNTIMED` candidate.
   - Impossible calendar dates (e.g., '2020-02-31') → `UNTIMED` candidate (strict validation).
   - Malformed or start>end dates → throw.

5. **Evidence IDs are semantic identities, not occurrence IDs.**
   - `evidenceIds` must stay semantic identity IDs (the Dasha evidence `identityKey` and trajectory opportunity `evidenceIds`).
   - Never mix in occurrence IDs, source IDs, or event IDs.
   - Rule IDs are kept separate in the `ruleIds` field.

6. **Deterministic output.**
   - Stable `eventId` derived from domain inputs (no UUID/timestamp).
   - Sorted-unique evidence.
   - Dedupe by event identity.
   - Throw on same-identity conflicting payloads.
   - Sort final events by `eventId` with a code-point comparator (not `localeCompare`).
   - Freeze result and all nested arrays.

7. **Input validation.**
   - Validate Dasha analysis structure (periods present and well-formed) before generation.
   - Require matching canonical Dasha evidence for events (evidence must match period by level, planet, effect, direction, role).

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
  ruleIds: readonly string[];  // Rule IDs that generated this event (e.g., 'P2-09B-EVT-01')
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

3. Period-evidence consistency check: The period must have matching Dasha evidence (same level, planet, effect, direction, role).
   This verifies period-evidence consistency only — it does NOT verify any relationship between the opportunity and the activation.

Dasha cannot manufacture an opportunity. Never emit an event with zero supporting evidence.

### EVT-02: Missing Evidence Is Not Negative Evidence

Periods with the following effect/direction values produce NO event:

- `effect`: `UNKNOWN`, `INSUFFICIENT_DATA`, `DOES_NOT_ACTIVATE`
- `direction`: `UNKNOWN`, `UNAVAILABLE`, `NEUTRAL`

These are not treated as challenges — missing evidence is not negative evidence.

### Challenge Semantics

Challenge events are independent of qualified opportunities. They are generated whenever a period has matching canonical CHALLENGE evidence (matched by level, planet, effect, direction, role), regardless of whether any qualified opportunity exists. Challenge events use ONLY the period's canonical CHALLENGE evidence. They do NOT include any opportunity evidenceIds. This preserves separate supporting/challenging evidence roles.

The challenge event's eventId is derived from the period identity alone (no dependency on opportunity.mode or opportunity.evidenceIds).

If no matching CHALLENGE evidence exists for a challenging period, the event is suppressed rather than attaching unrelated evidence.

### EVT-03: Date Handling

- Use source dates as-is; never infer, interpolate, or extend.
- Missing or partial dates (start only, end only) → `UNTIMED` candidate.
- Strict date validation for both ISO format (from vimshottari engine) and YYYY-MM-DD format (from test fixtures).
- Impossible calendar dates (e.g., '2020-02-31') are rejected via round-trip validation → `UNTIMED` candidate.
- Start > end dates → throw error (reversed range).

## Evidence, Identity, and Provenance Semantics

### Evidence ID Namespaces

**Separate ID namespaces are maintained:**

- `evidenceIds`: Semantic identity IDs (Dasha evidence `identityKey` and trajectory opportunity `evidenceIds`)
- `occurrenceIds`: NOT used in events (these are the `id` field from canonical evidence)
- `sourceIds`: NOT used in events (these are provenance occurrence IDs)
- `ruleIds`: Used in events for rule provenance (these are rule identity IDs like 'P2-09B-EVT-01')
- `eventIds`: Generated event identifiers (format: `CAREER_EVENT:{eventType}:{sourceKey}`)

**Never mix namespaces in `evidenceIds`. Rule IDs are kept separate in the `ruleIds` field.**

### Dasha Evidence Identity

- Use `identityKey` from `CareerDashaCanonicalEvidence` for semantic identity.
- Do NOT use the `id` field (occurrence identity).
- Do NOT use `sourceIds` (provenance occurrences).
- Match evidence to the exact period by filtering on level, planet, effect, direction, and role.
- This ensures a SUPPORT event cannot inherit a CHALLENGE evidence identity.

### Trajectory Evidence Identity

- Use `evidenceIds` from `CareerTrajectoryOpportunity` (these are already semantic identity IDs from C11).

## Deterministic Output Requirements

### Event ID Generation

Event IDs are stable and derived from domain inputs using a collision-free JSON encoding:

```
CAREER_EVENT:JSON.stringify([eventType, opportunityMode, sortedEvidenceIds, periodLevel, periodPlanet, periodStart, periodEnd])
```

Example: `CAREER_EVENT:["CAREER_OPPORTUNITY_WINDOW","MANAGEMENT",["evidence-1","evidence-2"],"MD","SUN","2020-01-01","2030-01-01"]`

Discriminator components (all stable semantic inputs, no UUIDs/timestamps):
- Event type (e.g., 'CAREER_OPPORTUNITY_WINDOW')
- Opportunity mode (e.g., 'MANAGEMENT')
- Opportunity evidence IDs (sorted array, nested for structural boundaries)
- Period level (e.g., 'MD')
- Period planet (e.g., 'SUN') - null if missing
- Period start date (if available, from source) - null if missing
- Period end date (if available, from source) - null if missing

The JSON encoding with nested arrays provides structural delimiters, making the ID unambiguous even if evidence IDs contain literal ':' or '|' characters. Evidence IDs are sorted inside `generateEventId` to ensure deterministic output.

This ensures distinct semantic opportunities and distinct period windows cannot collapse.

**Event ID vs Timing Identity Contract:**

Event ID identity reflects the SOURCE period (raw periodStart/periodEnd strings), NOT the normalized timing. Two periods with different invalid/partial date strings will produce distinct eventIds even though `buildTiming` collapses both to `UNTIMED` timing. This is intentional: identity captures the source period specification, while timing represents the normalized result. A period with 'invalid-date' and a period with 'partial-date' are distinct source inputs even if both become `UNTIMED` after normalization.

Missing period fields (planet, start, end) are encoded as `null` in the identity tuple, not as the string `'none'`. This distinguishes a genuinely missing value from a literal source value of `'none'`.

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
5. Mix occurrence IDs, source IDs, or event IDs into `evidenceIds`.
6. Treat missing evidence as negative evidence.
7. Manufacture opportunities from Dasha alone (EVT-01).
8. Emit events for periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL effect/direction (EVT-02).
9. Infer, interpolate, or extend dates (EVT-03).
10. Use UUIDs or timestamps for event IDs.
11. Attach unrelated Dasha evidence to events (evidence must match period by level, planet, effect, direction, role).
12. Include opportunity SUPPORT evidence in challenge events (challenge events use only period-specific CHALLENGE evidence).

## Implementation Status

**IMPLEMENTED — VERIFICATION PENDING**

P1 fixes implemented:
1. Event identity generation now uses collision-free JSON encoding with nested arrays (unambiguous even with literal ':' or '|' in evidenceIds).
2. Evidence IDs are sorted inside generateEventId for deterministic output.
3. Dasha evidence matching now filters by level, planet, effect, direction, and role.
4. Challenge semantics finalized: challenge events are independent of qualified opportunities (generated from challenging periods directly).
5. Challenge event eventId derived from period identity only (no opportunity dependency).
6. Date validation standardized with strict parsing for ISO and YYYY-MM-DD formats, rejecting impossible calendar dates.

P2 features implemented:
7. Period-evidence consistency check added (period must have matching Dasha evidence; renamed from isOpportunityCompatibleWithPeriod to periodHasMatchingEvidence).
8. RuleIds field added to CareerEvent type, populated with stable rule identifiers (P2-09B-EVT-01, P2-09B-EVT-02).
9. dedupeEvents exported for direct unit testing.

Input validation implemented:
10. Dasha input contract validation extended with semantic checks:
    - Period level must match slot (MD/AD/PD).
    - Effect, direction, and role must be valid union members.
    - Evidence items must have non-empty identityKey and valid level.
11. Events require matching canonical Dasha evidence for their period.

Test strengthening implemented:
12. Deep immutability assertions added (nested freeze).
13. Input non-mutation test added.
14. Conflict detection test improved to use exported dedupeEvents function directly.
15. Regression tests added for all P1 fixes including collision-free encoding (evidence IDs with ':' or '|').
16. Regression test added for independent challenge model (challenging period with no qualified opportunity).

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
