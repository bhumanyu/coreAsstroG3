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
 *
 * CHALLENGE+MIXED PRECEDENCE: CHALLENGE direction is evaluated before MIXED strength,
 * so CHALLENGE+MIXED resolves to CONSTRAINED (not NON_LINEAR). This is intentional:
 * a CHALLENGE direction represents a fundamental constraint regardless of structural strength.
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
 * EVIDENCE CONSISTENCY CHECK:
 * Expression-level evidenceIds are checked against the supplied evidence set.
 * Any expression evidenceIds not present in the evidence set are added to
 * unresolvedEvidenceIds to surface potential inconsistencies. This does not
 * modify the copied verbatim IDs in the opportunity object.
 * Note: IDs that exist in the evidence set but are not referenced at the top
 * level (expression-only) are not surfaced as unresolved — only genuinely
 * missing IDs are reported.
 *
 * Sorts each evidenceIds array and sorts opportunities by deterministic
 * code-point comparison (locale-independent).
 * Freezes all nested arrays and the returned array.
 *
 * Returns the opportunities array plus any additional unresolved evidence IDs
 * found at the expression level.
 */
function mapOpportunities(
  expressions: readonly { readonly mode: string; readonly direction: string; readonly strength: string; readonly qualified: boolean; readonly evidenceIds: readonly string[] }[],
  evidenceIdentitySet: ReadonlySet<string>
): {
  readonly opportunities: readonly CareerTrajectoryOpportunity[];
  readonly additionalUnresolvedIds: readonly string[];
} {
  if (!expressions || expressions.length === 0) {
    return {
      opportunities: Object.freeze([]),
      additionalUnresolvedIds: Object.freeze([])
    };
  }

  const additionalUnresolvedIds = new Set<string>();

  const opportunities = expressions.map((expr) => {
    const sortedEvidenceIds = [...expr.evidenceIds].sort();

    // Check expression evidenceIds against evidence set
    for (const id of sortedEvidenceIds) {
      if (!evidenceIdentitySet.has(id)) {
        additionalUnresolvedIds.add(id);
      }
    }

    return Object.freeze({
      mode: expr.mode,
      direction: expr.direction,
      strength: expr.strength,
      qualified: expr.qualified,
      evidenceIds: Object.freeze(sortedEvidenceIds)
    });
  });

  // Sort by deterministic code-point comparison (locale-independent)
  const sortedOpportunities = opportunities.sort((a, b) =>
    a.mode < b.mode ? -1 : a.mode > b.mode ? 1 : 0
  );

  return {
    opportunities: Object.freeze(sortedOpportunities),
    additionalUnresolvedIds: Object.freeze([...additionalUnresolvedIds].sort())
  };
}

/**
 * Resolves evidence references from C11 against the supplied evidence set.
 *
 * EVIDENCE-IDENTITY CONTRACT:
 * C11 finalSynthesis.evidenceIds MUST be canonical identity keys (the project's
 * established semantic identity field). For DomainEvidence, the canonical identity
 * is identityKey when present, with id being the occurrence ID.
 *
 * Resolution logic:
 * - C11 evidenceIds are resolved against the canonical identity field (identityKey
 *   when present, falling back to id only for evidence that has no identityKey).
 * - Occurrence IDs (id) are NOT matched directly unless the evidence has no identityKey.
 * - This ensures C11 references semantic identities, not specific occurrences.
 *
 * Dedupes and sorts finalSynthesis.evidenceIds.
 * unresolvedEvidenceIds = those IDs not present in the supplied evidence set.
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

  // Build evidence identity set for opportunity consistency check
  const evidenceIdentitySet = new Set<string>();
  for (const ev of evidence) {
    const identity = ev.identityKey ?? ev.id;
    evidenceIdentitySet.add(identity);
  }

  // Map opportunities from expressions (with consistency check)
  const { opportunities, additionalUnresolvedIds } = mapOpportunities(
    finalSynthesis.expressions,
    evidenceIdentitySet
  );

  // Resolve evidence references
  const { resolvedIds, unresolvedIds } = resolveEvidenceReferences(
    finalSynthesis.evidenceIds,
    evidence
  );

  // Merge unresolved IDs from top-level and expression-level
  const allUnresolvedIds = new Set([...unresolvedIds, ...additionalUnresolvedIds]);
  const finalUnresolvedIds = Object.freeze([...allUnresolvedIds].sort());

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
    unresolvedEvidenceIds: finalUnresolvedIds,
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
