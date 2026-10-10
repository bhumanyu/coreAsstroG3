import type {
  CareerTrajectoryInput,
  CareerTrajectoryAnalysis,
  CareerTrajectoryPattern,
  CareerTrajectoryCurrentPhase,
  CareerTrajectoryOpportunity
} from './careerTrajectoryTypes';

import type {
  DomainEvidence
} from '../../interpretation/DomainEvidence';

/**
 * P2-09A Career Trajectory Engine
 *
 * Deterministic downstream module that converts the authoritative C11 CareerFinalSynthesisResult
 * plus existing DomainEvidence into a long-term career trajectory classification.
 *
 * This is a standalone analysis layer — it must NOT recalculate any C4–C11 astrology,
 * must NOT wire itself into CareerDomainInterpreterV2.ts, and must NOT consume the deferred
 * canonicalCareerEvidenceMapper or legacy C4 evidence.
 */

/**
 * Derives long-term trajectory pattern from natalDirection and natalStrength ONLY.
 *
 * Reads ONLY natalDirection/natalStrength from C11 — Dasha/D10/transit/currentPressure/timing
 * must never influence this classification.
 *
 * Verified C11 union members:
 * - natalDirection ∈ {SUPPORT, CHALLENGE, CONDITIONAL, MIXED, NEUTRAL, UNAVAILABLE}
 * - natalStrength ∈ {VERY_STRONG, STRONG, MODERATE, MIXED, WEAK, VERY_WEAK, UNDETERMINED}
 *
 * Branch ordering (from spec):
 * 1. UNAVAILABLE/NEUTRAL/UNDETERMINED → INSUFFICIENT_DATA
 * 2. CHALLENGE → CONSTRAINED
 * 3. MIXED-direction-or-strength → NON_LINEAR
 * 4. CONDITIONAL → CONDITIONAL_GROWTH
 * 5. SUPPORT → GROWTH_CAPABLE
 *
 * NOTE: natalStrength === 'MIXED' is evaluated before the CONDITIONAL/SUPPORT direction branches,
 * so a SUPPORT+MIXED combination resolves to NON_LINEAR by design.
 */
function deriveLongTermPattern(
  natalDirection: string,
  natalStrength: string
): CareerTrajectoryPattern {
  // 1. INSUFFICIENT_DATA for unavailable/neutral/undetermined inputs
  if (
    natalDirection === 'UNAVAILABLE' ||
    natalDirection === 'NEUTRAL' ||
    natalStrength === 'UNDETERMINED'
  ) {
    return 'INSUFFICIENT_DATA';
  }

  // 2. CONSTRAINED for challenge direction
  if (natalDirection === 'CHALLENGE') {
    return 'CONSTRAINED';
  }

  // 3. NON_LINEAR for mixed direction OR mixed strength
  // NOTE: This evaluates before CONDITIONAL/SUPPORT, so SUPPORT+MIXED → NON_LINEAR
  if (natalDirection === 'MIXED' || natalStrength === 'MIXED') {
    return 'NON_LINEAR';
  }

  // 4. CONDITIONAL_GROWTH for conditional direction
  if (natalDirection === 'CONDITIONAL') {
    return 'CONDITIONAL_GROWTH';
  }

  // 5. GROWTH_CAPABLE for support direction
  if (natalDirection === 'SUPPORT') {
    return 'GROWTH_CAPABLE';
  }

  // Runtime guard for unvalidated external data
  throw new Error(
    `Invalid natalDirection or natalStrength combination: direction=${natalDirection}, strength=${natalStrength}`
  );
}

/**
 * Maps C11 timingStatus to trajectory current phase.
 *
 * Exhaustive switch over the 5 CareerFinalTimingStatus members:
 * - ACTIVE → ACTIVE
 * - PARTIALLY_ACTIVE → PARTIALLY_ACTIVE
 * - CHALLENGED → CHALLENGED
 * - NOT_ACTIVE → NOT_ACTIVE
 * - UNKNOWN → UNKNOWN
 */
function mapCurrentPhase(timingStatus: string): CareerTrajectoryCurrentPhase {
  switch (timingStatus as any) {
    case 'ACTIVE':
      return 'ACTIVE';
    case 'PARTIALLY_ACTIVE':
      return 'PARTIALLY_ACTIVE';
    case 'CHALLENGED':
      return 'CHALLENGED';
    case 'NOT_ACTIVE':
      return 'NOT_ACTIVE';
    case 'UNKNOWN':
      return 'UNKNOWN';
    default:
      const _exhaustiveCheck: never = timingStatus as never;
      throw new Error(`Invalid timingStatus: ${_exhaustiveCheck}`);
  }
}

/**
 * Maps C11 expressions to trajectory opportunities.
 *
 * Copies mode/direction/strength/qualified verbatim from each finalSynthesis.expressions entry.
 * No normalization, no promotion of unqualified expressions.
 *
 * Sorts each evidenceIds array and sorts opportunities by mode.localeCompare.
 * Freezes all nested arrays and the returned array.
 */
function mapOpportunities(
  expressions: readonly { readonly mode: string; readonly direction: string; readonly strength: string; readonly qualified: boolean; readonly evidenceIds: readonly string[] }[]
): readonly CareerTrajectoryOpportunity[] {
  if (!expressions || expressions.length === 0) {
    return Object.freeze([]);
  }

  const opportunities = expressions.map((expr) => {
    const sortedEvidenceIds = [...expr.evidenceIds].sort();
    return Object.freeze({
      mode: expr.mode,
      direction: expr.direction,
      strength: expr.strength,
      qualified: expr.qualified,
      evidenceIds: Object.freeze(sortedEvidenceIds)
    });
  });

  // Sort by mode.localeCompare for deterministic output
  const sortedOpportunities = opportunities.sort((a, b) =>
    a.mode.localeCompare(b.mode)
  );

  return Object.freeze(sortedOpportunities);
}

/**
 * Resolves evidence references from C11 against the supplied evidence set.
 *
 * Dedupes and sorts finalSynthesis.evidenceIds.
 * unresolvedEvidenceIds = those IDs not present in the supplied evidence set.
 *
 * An evidence item's identity is identityKey ?? id (lookup only — must not turn
 * an occurrence id into a new semantic identity).
 *
 * Evidence supplied but NOT referenced by C11 must never become a trajectory signal.
 */
function resolveEvidenceReferences(
  evidenceIds: readonly string[],
  evidenceSet: ReadonlySet<DomainEvidence>
): {
  readonly resolvedIds: readonly string[];
  readonly unresolvedIds: readonly string[];
} {
  const uniqueIds = new Set(evidenceIds);
  const sortedIds = [...uniqueIds].sort();

  const evidenceIdentitySet = new Set<string>();
  for (const ev of evidenceSet) {
    const identity = ev.identityKey ?? ev.id;
    evidenceIdentitySet.add(identity);
  }

  const unresolvedIds: string[] = [];
  for (const id of sortedIds) {
    if (!evidenceIdentitySet.has(id)) {
      unresolvedIds.push(id);
    }
  }

  return {
    resolvedIds: Object.freeze(sortedIds),
    unresolvedIds: Object.freeze(unresolvedIds.sort())
  };
}

/**
 * Builds career trajectory analysis from C11 final synthesis and domain evidence.
 *
 * Validates reasoningVersion === 'C11' and domain === 'CAREER', throwing descriptive errors otherwise.
 * Dedupes and sorts sourceIds and ruleIds from C11.
 * Returns an Object.freeze result with all nested arrays frozen.
 * datedForecastAvailable is always false.
 */
export function buildCareerTrajectory(
  input: CareerTrajectoryInput
): CareerTrajectoryAnalysis {
  const { finalSynthesis, evidence } = input;

  // Validate C11 contract
  if (finalSynthesis.reasoningVersion !== 'C11') {
    throw new Error(
      `Invalid reasoningVersion: expected 'C11', got '${finalSynthesis.reasoningVersion}'`
    );
  }

  if (finalSynthesis.domain !== 'CAREER') {
    throw new Error(
      `Invalid domain: expected 'CAREER', got '${finalSynthesis.domain}'`
    );
  }

  // Derive long-term pattern from natal fields ONLY
  const longTermPattern = deriveLongTermPattern(
    finalSynthesis.natalDirection,
    finalSynthesis.natalStrength
  );

  // Map current phase from timing status
  const currentPhase = mapCurrentPhase(finalSynthesis.timingStatus);

  // Map opportunities from expressions
  const opportunities = mapOpportunities(finalSynthesis.expressions);

  // Resolve evidence references
  const { resolvedIds, unresolvedIds } = resolveEvidenceReferences(
    finalSynthesis.evidenceIds,
    evidence
  );

  // Dedupe and sort sourceIds and ruleIds
  const sourceIds = Object.freeze(
    [...new Set(finalSynthesis.sourceIds)].sort()
  );
  const ruleIds = Object.freeze([...new Set(finalSynthesis.ruleIds)].sort());

  // Build statement
  const statement = buildStatement(
    longTermPattern,
    currentPhase,
    finalSynthesis.finalStatus
  );

  // Return frozen result
  return Object.freeze({
    reasoningVersion: 'P2-09A',
    domain: 'CAREER',
    longTermPattern,
    currentPhase,
    currentStatus: finalSynthesis.finalStatus,
    opportunities,
    evidenceIds: resolvedIds,
    unresolvedEvidenceIds: unresolvedIds,
    sourceIds,
    ruleIds,
    datedForecastAvailable: false,
    statement
  });
}

/**
 * Builds human-readable summary statement.
 */
function buildStatement(
  pattern: CareerTrajectoryPattern,
  phase: CareerTrajectoryCurrentPhase,
  status: string
): string {
  const patternText = {
    GROWTH_CAPABLE: 'Growth-capable trajectory',
    CONDITIONAL_GROWTH: 'Conditional growth trajectory',
    NON_LINEAR: 'Non-linear trajectory',
    CONSTRAINED: 'Constrained trajectory',
    INSUFFICIENT_DATA: 'Insufficient data for trajectory assessment'
  }[pattern];

  const phaseText = {
    ACTIVE: 'currently active',
    PARTIALLY_ACTIVE: 'partially active',
    CHALLENGED: 'currently challenged',
    NOT_ACTIVE: 'not active',
    UNKNOWN: 'unknown phase'
  }[phase];

  return `${patternText}; ${phaseText}; status: ${status}`;
}
