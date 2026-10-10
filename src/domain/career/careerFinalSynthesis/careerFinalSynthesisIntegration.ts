import type {
  CareerFinalSynthesisIntegrationInput
} from './careerFinalSynthesisCanonicalTypes';

import type {
  CareerFinalSynthesisResult,
  CareerFinalDirection,
  CareerFinalStrength,
  CareerFinalExpression,
  CareerFinalConflict
} from './careerFinalSynthesisTypes';

import type {
  CareerExpressionDirection,
  CareerExpressionStrength,
  CareerExpression,
  CareerExpressionAnalysis
} from '../careerExpression';

import type {
  CareerDashaActivationHierarchy
} from '../careerDasha';

import type {
  CareerD10QualificationStrength
} from '../careerD10';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerDashaCanonicalAnalysis
} from '../careerDasha';

import type {
  CareerD10CanonicalAnalysis
} from '../careerD10';

import type {
  DomainStrength
} from '../../reasoning/reasoningTypes';

import {
  synthesizeCareerFinal
} from './careerFinalSynthesis';

/**
 * Maps C8 CareerExpressionDirection to C11 CareerFinalDirection.
 * SUPPORTED → SUPPORT, CONDITIONAL → CONDITIONAL, NEUTRAL → NEUTRAL, UNAVAILABLE → UNAVAILABLE.
 */
function mapExpressionDirection(
  direction: CareerExpressionDirection
): CareerFinalDirection {
  switch (direction) {
    case 'SUPPORTED':
      return 'SUPPORT';
    case 'CONDITIONAL':
      return 'CONDITIONAL';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Maps C8 CareerExpressionStrength to C11 CareerFinalStrength.
 * VERY_STRONG → VERY_STRONG, STRONG → STRONG, MODERATE → MODERATE, WEAK → WEAK, UNAVAILABLE → UNDETERMINED.
 */
function mapExpressionStrength(
  strength: CareerExpressionStrength
): CareerFinalStrength {
  switch (strength) {
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'UNAVAILABLE':
      return 'UNDETERMINED';
    default:
      return 'UNDETERMINED';
  }
}

/**
 * Determines if an expression is qualified based on its direction.
 * SUPPORTED → true, CONDITIONAL → true, NEUTRAL → false, UNAVAILABLE → false.
 */
function isExpressionQualified(
  direction: CareerExpressionDirection
): boolean {
  return direction === 'SUPPORTED' || direction === 'CONDITIONAL';
}

/**
 * Maps C8 expressions to C11 final expressions.
 * For each C8 CareerExpression, produces a CareerFinalExpression with mapped direction/strength.
 * Expressions are sorted by mode to ensure deterministic output regardless of input order.
 */
function mapExpressions(
  expressionAnalysis: CareerExpressionAnalysis
): readonly CareerFinalExpression[] {
  return Object.freeze(
    expressionAnalysis.expressions
      .map((expr: CareerExpression) =>
        Object.freeze({
          mode: expr.mode,
          direction: mapExpressionDirection(expr.direction),
          strength: mapExpressionStrength(expr.strength),
          qualified: isExpressionQualified(expr.direction),
          evidenceIds: Object.freeze([...expr.supportingEvidenceIds].sort((a, b) => a.localeCompare(b)))
        })
      )
      .sort((a, b) => a.mode.localeCompare(b.mode))
  );
}

/**
 * Maps transit effect to final direction.
 * SUPPORTS → SUPPORT, CHALLENGES → CHALLENGE, MIXED → MIXED, NEUTRAL → NEUTRAL, INSUFFICIENT_DATA/default → UNAVAILABLE.
 */
function mapTransitEffectToFinalDirection(
  transitEffect: string | undefined
): CareerFinalDirection {
  if (!transitEffect) {
    return 'UNAVAILABLE';
  }

  switch (transitEffect) {
    case 'SUPPORTS':
      return 'SUPPORT';
    case 'CHALLENGES':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    case 'INSUFFICIENT_DATA':
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Collects evidence IDs from natal analysis.
 * From natal.evidence (WeightedReasoningEvidence.evidenceId).
 * These are semantic identity IDs (one per evidence item).
 */
function collectNatalEvidenceIds(
  natal: CareerNatalAnalysis
): readonly string[] {
  return Object.freeze(
    natal.evidence.map(e => e.evidenceId).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects source IDs from natal analysis.
 * From natal.evidence (WeightedReasoningEvidence.sourceIds).
 * These are occurrence-level source IDs (multiple per evidence item, representing provenance).
 * Distinct from evidenceIds - sourceIds trace back to original input evidence items.
 */
function collectNatalSourceIds(
  natal: CareerNatalAnalysis
): readonly string[] {
  const allSourceIds: string[] = [];
  for (const e of natal.evidence) {
    allSourceIds.push(...e.sourceIds);
  }
  return Object.freeze(
    Array.from(new Set(allSourceIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects rule IDs from natal analysis.
 * From natal.evidence (WeightedReasoningEvidence.ruleId).
 */
function collectNatalRuleIds(
  natal: CareerNatalAnalysis
): readonly string[] {
  const allRuleIds = natal.evidence
    .map(e => e.ruleId)
    .filter((ruleId): ruleId is string => ruleId !== undefined);
  return Object.freeze(
    Array.from(new Set(allRuleIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects evidence IDs from Dasha analysis.
 * From dasha.evidence (CareerDashaCanonicalEvidence.id).
 */
function collectDashaEvidenceIds(
  dasha: CareerDashaCanonicalAnalysis
): readonly string[] {
  const allIds: string[] = [];
  for (const e of dasha.evidence) {
    allIds.push(e.id);
  }
  return Object.freeze(
    allIds.sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects source IDs from Dasha analysis.
 * From dasha.evidence (CareerDashaCanonicalEvidence.sourceIds).
 */
function collectDashaSourceIds(
  dasha: CareerDashaCanonicalAnalysis
): readonly string[] {
  const allSourceIds: string[] = [];
  for (const e of dasha.evidence) {
    allSourceIds.push(...e.sourceIds);
  }
  return Object.freeze(
    Array.from(new Set(allSourceIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects rule IDs from Dasha analysis.
 * From dasha.evidence (CareerDashaCanonicalEvidence does not expose ruleIds in provenance — return empty array).
 *
 * P2-08D-03: This is genuinely-unavailable, not fabricated. The canonical Dasha provenance
 * does not expose ruleIds in its current contract. We return an empty array rather than
 * inventing rule IDs, which would violate traceability invariants.
 */
function collectDashaRuleIds(
  _dasha: CareerDashaCanonicalAnalysis
): readonly string[] {
  // CareerDashaCanonicalProvenance does not expose ruleIds in current contract
  // This is genuinely-unavailable, not fabricated (P2-08D-03)
  return Object.freeze([]);
}

/**
 * Collects evidence IDs from D10 analysis.
 * From d10.evidence (CareerD10CanonicalEvidence.id).
 */
function collectD10EvidenceIds(
  d10: CareerD10CanonicalAnalysis
): readonly string[] {
  const allIds: string[] = [];
  for (const e of d10.evidence) {
    allIds.push(e.id);
  }
  return Object.freeze(
    allIds.sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects source IDs from D10 analysis.
 * From d10.evidence (CareerD10CanonicalEvidence.sourceIds).
 */
function collectD10SourceIds(
  d10: CareerD10CanonicalAnalysis
): readonly string[] {
  const allSourceIds: string[] = [];
  for (const e of d10.evidence) {
    allSourceIds.push(...e.sourceIds);
  }
  return Object.freeze(
    Array.from(new Set(allSourceIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects rule IDs from D10 analysis.
 * From d10.evidence (CareerD10CanonicalEvidence.provenance.ruleIds).
 */
function collectD10RuleIds(
  d10: CareerD10CanonicalAnalysis
): readonly string[] {
  const allRuleIds: string[] = [];
  for (const e of d10.evidence) {
    allRuleIds.push(...e.provenance.ruleIds);
  }
  return Object.freeze(
    Array.from(new Set(allRuleIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Collects evidence IDs from expression analysis.
 * From expression.expressions[].supportingEvidenceIds.
 */
function collectExpressionEvidenceIds(
  expression: CareerExpressionAnalysis
): readonly string[] {
  const allEvidenceIds: string[] = [];
  for (const e of expression.expressions) {
    allEvidenceIds.push(...e.supportingEvidenceIds);
  }
  return Object.freeze(
    Array.from(new Set(allEvidenceIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Merges evidence IDs from all sources, deduplicated and sorted.
 */
function mergeEvidenceIds(
  ...arrays: (readonly string[])[]
): readonly string[] {
  const allIds: string[] = [];
  for (const arr of arrays) {
    for (const id of arr) {
      allIds.push(id);
    }
  }
  return Object.freeze(
    Array.from(new Set(allIds)).sort((a, b) => a.localeCompare(b))
  );
}

/**
 * Builds final conflicts diagnostically.
 * Emits conflicts when secondary layers challenge natal support or support natal challenge.
 * Conflicts never set finalDirection — that stays with the engine.
 * Missing layers (UNAVAILABLE) do not generate conflicts.
 */
function buildFinalConflicts(
  natalDirection: string,
  d10Direction: string | undefined,
  d10Strength: CareerD10QualificationStrength | undefined,
  dashaDirection: string | undefined,
  d10EvidenceIds: readonly string[],
  dashaEvidenceIds: readonly string[]
): readonly CareerFinalConflict[] {
  const conflicts: CareerFinalConflict[] = [];

  // D10 conflict: natal SUPPORT with D10 CHALLENGE
  if (natalDirection === 'SUPPORT' && d10Direction === 'CHALLENGE') {
    const severity = d10Strength === 'VERY_STRONG' || d10Strength === 'STRONG' ? 'HIGH' :
      d10Strength === 'MODERATE' ? 'MODERATE' : 'LOW';

    conflicts.push(Object.freeze({
      source: 'D10' as const,
      direction: 'CHALLENGE' as const,
      severity,
      evidenceIds: d10EvidenceIds,
      statement: `D10 qualification challenges natal support with ${severity} severity.`
    }));
  }

  // Dasha conflict: natal SUPPORT with Dasha CHALLENGE (timing pressure)
  if (natalDirection === 'SUPPORT' && dashaDirection === 'CHALLENGE') {
    conflicts.push(Object.freeze({
      source: 'DASHA' as const,
      direction: 'CHALLENGE' as const,
      severity: 'MODERATE',
      evidenceIds: dashaEvidenceIds,
      statement: 'Dasha activation challenges natal support, creating timing pressure.'
    }));
  }

  // D10 diagnostic: natal CHALLENGE with D10 SUPPORT (qualifies execution despite natal challenge)
  if (natalDirection === 'CHALLENGE' && d10Direction === 'SUPPORT') {
    const severity = d10Strength === 'VERY_STRONG' || d10Strength === 'STRONG' ? 'HIGH' :
      d10Strength === 'MODERATE' ? 'MODERATE' : 'LOW';

    conflicts.push(Object.freeze({
      source: 'D10' as const,
      direction: 'SUPPORT' as const,
      severity,
      evidenceIds: d10EvidenceIds,
      statement: `D10 qualification supports career execution despite natal challenge with ${severity} severity.`
    }));
  }

  // Dasha diagnostic: natal CHALLENGE with Dasha SUPPORT (timing support despite natal challenge)
  if (natalDirection === 'CHALLENGE' && dashaDirection === 'SUPPORT') {
    conflicts.push(Object.freeze({
      source: 'DASHA' as const,
      direction: 'SUPPORT' as const,
      severity: 'MODERATE',
      evidenceIds: dashaEvidenceIds,
      statement: 'Dasha activation provides timing support despite natal challenge.'
    }));
  }

  return Object.freeze(conflicts);
}

/**
 * Canonical C11 Final Career Synthesis Integration Adapter
 *
 * This adapter:
 * - Consumes canonical C4–C10 outputs plus optional Timing
 * - Maps each layer to the CareerFinalSynthesisInput contract
 * - Collects evidence trace arrays from upstream canonical evidence
 * - Builds conflicts diagnostically (never sets finalDirection)
 * - Calls synthesizeCareerFinal from the canonical engine
 * - Returns the existing CareerFinalSynthesisResult (no new wrapper)
 *
 * The adapter does NOT:
 * - Accept or reference Horoscope
 * - Mutate any input aggregate
 * - Reconstruct MD/AD/PD hierarchy (consumes dasha.hierarchy directly)
 * - Invent new evidence IDs (collects from upstream)
 * - Re-run any dedup engine
 *
 * @param input - Canonical integration input with C4–C10 outputs
 * @returns Frozen CareerFinalSynthesisResult from the canonical engine
 */
export function buildCareerFinalAnalysis(
  input: CareerFinalSynthesisIntegrationInput
): CareerFinalSynthesisResult {
  const { natal, expression, dasha, d10, timing } = input;

  // Map natal: natalDirection and natalStrength from natal.structural
  const natalDirection = natal.structural.direction;
  const natalStrength = natal.structural.strength;

  // Map expression: derive expressionStrength and expressionDirection from expressions array
  // For minimal inputs without primaryExpression, select the primary/strongest expression deterministically
  const expressions = mapExpressions(expression);
  let expressionStrength: CareerExpressionStrength | undefined;
  let expressionDirection: CareerExpressionDirection | undefined;

  if (expression.primaryExpression) {
    // Use primaryExpression if available (real-engine path)
    expressionStrength = expression.primaryExpression.strength;
    expressionDirection = expression.primaryExpression.direction;
  } else if (expression.expressions.length > 0) {
    // For minimal inputs, derive from expressions array
    // Select the strongest expression by strength (STRONG > MODERATE > WEAK > UNAVAILABLE)
    // If strength ties, prefer SUPPORTED over CONDITIONAL over NEUTRAL
    const sortedExprs = [...expression.expressions].sort((a, b) => {
      const strengthOrder = { 'STRONG': 3, 'MODERATE': 2, 'WEAK': 1, 'UNAVAILABLE': 0 };
      const aStrength = strengthOrder[a.strength] ?? 0;
      const bStrength = strengthOrder[b.strength] ?? 0;
      if (aStrength !== bStrength) return bStrength - aStrength;
      const directionOrder = { 'SUPPORTED': 2, 'CONDITIONAL': 1, 'NEUTRAL': 0, 'UNAVAILABLE': 0 };
      const aDirection = directionOrder[a.direction] ?? 0;
      const bDirection = directionOrder[b.direction] ?? 0;
      return bDirection - aDirection;
    });
    const primary = sortedExprs[0];
    expressionStrength = primary.strength;
    expressionDirection = primary.direction;
  }

  // Map dasha: use top-level overallDirection from CareerDashaCanonicalAnalysis, fall back to hierarchy
  const dashaDirection = dasha.overallDirection ?? dasha.hierarchy?.overallDirection;
  const dashaEffect = dasha.overallEffect ?? dasha.hierarchy?.overallEffect;
  const dashaStrength: DomainStrength | undefined = dasha.overallStrength ?? dasha.hierarchy?.overallStrength;
  const dashaHierarchy: CareerDashaActivationHierarchy | undefined = dasha.hierarchy;

  // Map d10: pass d10Effect, d10Direction, d10Strength unchanged
  const d10Effect = d10.d10Effect;
  const d10Direction = d10.d10Direction;
  const d10Strength = d10.d10Strength;

  // Map timing: transitDirection from timing.transitEffect
  const transitDirection = timing ? mapTransitEffectToFinalDirection(timing.transitEffect) : 'UNAVAILABLE';

  // Collect evidence trace arrays from upstream canonical evidence
  const natalEvidenceIds = collectNatalEvidenceIds(natal);
  const natalSourceIds = collectNatalSourceIds(natal);
  const natalRuleIds = collectNatalRuleIds(natal);

  const dashaEvidenceIds = collectDashaEvidenceIds(dasha);
  const dashaSourceIds = collectDashaSourceIds(dasha);
  const dashaRuleIds = collectDashaRuleIds(dasha);

  const d10EvidenceIds = collectD10EvidenceIds(d10);
  const d10SourceIds = collectD10SourceIds(d10);
  const d10RuleIds = collectD10RuleIds(d10);

  const expressionEvidenceIds = collectExpressionEvidenceIds(expression);

  // Merge all evidence IDs, source IDs, and rule IDs deterministically
  const evidenceIds = mergeEvidenceIds(natalEvidenceIds, dashaEvidenceIds, d10EvidenceIds, expressionEvidenceIds);
  const sourceIds = mergeEvidenceIds(natalSourceIds, dashaSourceIds, d10SourceIds);
  const ruleIds = mergeEvidenceIds(natalRuleIds, dashaRuleIds, d10RuleIds);

  // Build conflicts diagnostically
  const conflicts = buildFinalConflicts(
    natalDirection,
    d10Direction,
    d10Strength,
    dashaDirection,
    d10EvidenceIds,
    dashaEvidenceIds
  );

  // Assemble frozen CareerFinalSynthesisInput
  const finalInput = Object.freeze({
    natalDirection,
    natalStrength,
    expressionStrength,
    expressionDirection,
    dashaHierarchy,
    dashaEffect,
    dashaDirection,
    dashaStrength,
    d10Effect,
    d10Direction,
    d10Strength,
    transitDirection,
    expressions,
    conflicts,
    evidenceIds,
    sourceIds,
    ruleIds
  });

  // Return result from canonical engine
  return synthesizeCareerFinal(finalInput);
}
