# P2-09A: Career Trajectory Layer

## Overview

P2-09A implements a deterministic downstream module that converts the authoritative C11 `CareerFinalSynthesisResult` plus existing `DomainEvidence` into a long-term career trajectory classification. This is a standalone analysis layer — it must NOT recalculate any C4–C11 astrology, must NOT wire itself into `CareerDomainInterpreterV2.ts`, and must NOT consume the deferred `canonicalCareerEvidenceMapper` or legacy C4 evidence.

## Core Invariants

1. **Trajectory is a downstream classification, not a recalculation.**
   - Long-term pattern is derived from C11 `natalDirection` and `natalStrength` ONLY.
   - Dasha/D10/transit/currentPressure/timing must never influence the long-term pattern.
   - This layer does not perform any C4–C11 astrology calculations.

2. **Evidence references are resolved, not manufactured.**
   - Only evidence IDs referenced by C11 become trajectory signals.
   - Evidence supplied but NOT referenced by C11 must never become a trajectory signal.
   - Missing evidence is reported in `unresolvedEvidenceIds`, not treated as negative.

3. **Missing data is not negative evidence.**
   - UNAVAILABLE/NEUTRAL direction or UNDETERMINED strength results in INSUFFICIENT_DATA pattern.
   - Absence of D10/transit timing data does not manufacture challenge.
   - The layer preserves the C11 missing-data ≠ negative-evidence invariant.

## Output Contract

### `CareerTrajectoryAnalysis`

```typescript
{
  reasoningVersion: 'P2-09A';
  domain: 'CAREER';
  longTermPattern: CareerTrajectoryPattern;
  currentPhase: CareerTrajectoryCurrentPhase;
  currentStatus: CareerFinalSynthesisResult['finalStatus'];
  opportunities: readonly CareerTrajectoryOpportunity[];
  evidenceIds: readonly string[];
  unresolvedEvidenceIds: readonly string[];
  sourceIds: readonly string[];
  ruleIds: readonly string[];
  datedForecastAvailable: false;
  statement: string;
}
```

### `CareerTrajectoryPattern`

Long-term trajectory pattern derived from natalDirection and natalStrength ONLY:

| natalDirection | natalStrength | Pattern |
|----------------|---------------|---------|
| UNAVAILABLE | any | INSUFFICIENT_DATA |
| NEUTRAL | any | INSUFFICIENT_DATA |
| any | UNDETERMINED | INSUFFICIENT_DATA |
| CHALLENGE | any | CONSTRAINED |
| MIXED | any | NON_LINEAR |
| any | MIXED | NON_LINEAR¹ |
| CONDITIONAL | any (not MIXED) | CONDITIONAL_GROWTH |
| SUPPORT | any (not MIXED) | GROWTH_CAPABLE |

**Explicit Ordering Decisions:**
- `natalStrength === 'MIXED'` is evaluated before the `CONDITIONAL`/`SUPPORT` direction branches, so a SUPPORT+MIXED combination resolves to NON_LINEAR by design. This prevents strong natal direction from masking mixed structural strength.
- CHALLENGE direction is evaluated before MIXED strength, so CHALLENGE+MIXED resolves to CONSTRAINED (not NON_LINEAR). This is intentional: a CHALLENGE direction represents a fundamental constraint regardless of structural strength.

¹ Note: "any | MIXED → NON_LINEAR" does not apply when direction is CHALLENGE (CHALLENGE takes precedence).

### `CareerTrajectoryCurrentPhase`

Current phase mapped from C11 `timingStatus`:

| timingStatus | currentPhase |
|--------------|---------------|
| ACTIVE | ACTIVE |
| PARTIALLY_ACTIVE | PARTIALLY_ACTIVE |
| CHALLENGED | CHALLENGED |
| NOT_ACTIVE | NOT_ACTIVE |
| UNKNOWN | UNKNOWN |

### `CareerTrajectoryOpportunity`

Opportunities extracted from C11 `expressions`:

- Copies `mode`/`direction`/`strength`/`qualified` verbatim from each expression.
- No normalization, no promotion of unqualified expressions.
- Each `evidenceIds` array is sorted.
- Opportunities are sorted by deterministic code-point comparison (locale-independent).
- All nested arrays are frozen.

**Evidence Consistency Check:**
Expression-level `evidenceIds` are checked against the supplied evidence set. Any expression `evidenceIds` not present in the evidence set are added to `unresolvedEvidenceIds` to surface potential inconsistencies. This does not modify the copied verbatim IDs in the opportunity object. Note: IDs that exist in the evidence set but are not referenced at the top level (expression-only) are not surfaced as unresolved — only genuinely missing IDs are reported.

## Evidence, Identity, and Provenance Semantics

### Evidence Reference Resolution

**EVIDENCE-IDENTITY CONTRACT:**
C11 `finalSynthesis.evidenceIds` MUST be canonical identity keys (the project's established semantic identity field). For `DomainEvidence`, the canonical identity is `identityKey` when present, with `id` being the occurrence ID.

Resolution logic:
- C11 `evidenceIds` are resolved against the canonical identity field (`identityKey` when present, falling back to `id` only for evidence that has no `identityKey`).
- Occurrence IDs (`id`) are NOT matched directly unless the evidence has no `identityKey`.
- This ensures C11 references semantic identities, not specific occurrences.

- `evidenceIds`: All evidence IDs referenced by C11 (deduplicated and sorted).
- `unresolvedEvidenceIds`: Evidence IDs referenced by C11 but not present in the supplied evidence set.
- Evidence supplied but NOT referenced by C11 must never become a trajectory signal.

### Source and Rule ID Handling

- `sourceIds`: From C11 (deduplicated and sorted).
- `ruleIds`: From C11 (deduplicated and sorted).

## Missing Data Is Not Negative Rule

The layer enforces the C11 invariant that missing evidence ≠ negative evidence:

- UNAVAILABLE direction → INSUFFICIENT_DATA (not CONSTRAINED)
- NEUTRAL direction → INSUFFICIENT_DATA (not CONSTRAINED)
- UNDETERMINED strength → INSUFFICIENT_DATA (not CONSTRAINED)
- Missing D10 → does not manufacture challenge
- Missing transit → does not manufacture challenge
- Missing timing data → preserves UNKNOWN phase

## Deferred Dated Trajectory Capability

The `datedForecastAvailable` field is always `false` in this implementation. A future enhancement may add time-based trajectory events (e.g., forecast windows, activation periods), but this is explicitly deferred.

## Boundary List

This module must NOT:

1. Recalculate any C4–C11 astrology (natal, expression, dasha, D10, transit).
2. Wire itself into `CareerDomainInterpreterV2.ts`.
3. Consume the deferred `canonicalCareerEvidenceMapper`.
4. Consume legacy C4 evidence directly.
5. Modify any C4–C11 producer.
6. Access deferred career modules not yet implemented.

## Implementation Status

**IMPLEMENTED — VERIFICATION PENDING**

Files:
- `src/domain/career/careerTrajectory/careerTrajectoryTypes.ts`
- `src/domain/career/careerTrajectory/careerTrajectoryEngine.ts`
- `src/domain/career/careerTrajectory/careerTrajectoryEngine.test.ts`
- `src/domain/career/careerTrajectory/index.ts`

Verification:
- Lint: `npm run lint` (tsc --noEmit)
- Tests: `npm test -- careerTrajectoryEngine.test.ts`
- Regression: `careerFinalSynthesisIntegration` and `CareerDomainInterpreterV2` suites
