import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerMechanismExpressionEvidence
} from './careerExpressionTypes';
import type {
  CareerExpressionAnalysis,
  CareerExpression,
  CareerExpressionEvidence
} from '../careerExpression';
import type {
  CareerManifestationMode
} from '../careerTypes';
import type {
  Planet
} from '../../../types';

/**
 * P2-08D: Mechanism Expression to Legacy Expression Adapter
 *
 * This adapter maps the mechanism-based CareerExpressionAnalysisResult (from P2-08A resolver)
 * to the legacy CareerExpressionAnalysis shape consumed by C9, C10, and C11.
 *
 * BRIDGE RESPONSIBILITIES:
 * - Preserve mechanism identities (sourceMechanismIds, expressionId as semantic identity)
 * - Preserve deterministic ordering and immutability (deep-freeze)
 * - Represent empty/insufficient mechanism results as explicit unavailable expression
 * - Never fabricate expressions when resolvedMechanisms is empty
 *
 * MAPPING STRATEGY:
 * - expressionType → mode (via expressionTypeToManifestationMode mapping)
 * - direction → default 'SUPPORTED' (mechanism-based system doesn't have legacy direction concept)
 * - strength → default 'STRONG' (mechanism-based system doesn't have legacy strength concept)
 * - evidence → synthetic evidence from mechanism sources (with planets from upstream)
 * - supportingEvidenceIds → sourceMechanismIds (semantic identity linkage)
 * - primaryExpression → first expression by deterministic ordering
 *
 * When mechanism-based result has no expressions (INSUFFICIENT_DATA or empty candidates),
 * emit an explicit empty/unavailable expression analysis rather than falling back to
 * the legacy natal-derived path.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - profession
 * - ai
 */

/**
 * Maps mechanism expression types to legacy manifestation modes.
 * This is a conservative mapping - not all expression types have a direct legacy equivalent.
 * Unmapped types are represented as 'INDEPENDENT_WORK' as a safe fallback.
 */
function expressionTypeToManifestationMode(
  expressionType: string
): CareerManifestationMode {
  const mapping: Record<string, CareerManifestationMode> = {
    'AUTHORITY_EXPRESSION': 'AUTHORITY',
    'LEADERSHIP_EXPRESSION': 'LEADERSHIP',
    'TEACHING_EXPRESSION': 'MANAGEMENT',
    'RESEARCH_WORK': 'TECHNICAL_SPECIALIZATION',
    'COMMUNICATION_WORK': 'INDEPENDENT_WORK',
    'WRITING_WORK': 'INDEPENDENT_WORK',
    'INNOVATION_WORK': 'TECHNICAL_SPECIALIZATION',
    'SERVICE_WORK': 'SERVICE_EMPLOYMENT',
    'ANALYTICAL_SPECIALIZED_WORK': 'TECHNICAL_SPECIALIZATION',
    'FINANCIAL_WORK': 'ENTREPRENEURSHIP',
    'INSURANCE_WORK': 'ENTREPRENEURSHIP',
    'TAXATION_WORK': 'ENTREPRENEURSHIP',
    'COMPLIANCE_WORK': 'SERVICE_EMPLOYMENT',
    'CRISIS_MANAGEMENT_WORK': 'SERVICE_EMPLOYMENT',
    'INSTITUTIONAL_WORK_EXPRESSION': 'PUBLIC_INSTITUTIONAL',
    'ISOLATED_WORK_EXPRESSION': 'SERVICE_EMPLOYMENT',
    'FOREIGN_WORK_EXPRESSION': 'INDEPENDENT_WORK',
    'REMOTE_WORK_EXPRESSION': 'INDEPENDENT_WORK'
  };

  return mapping[expressionType] ?? 'INDEPENDENT_WORK';
}

/**
 * Extracts planets from mechanism expression evidence.
 * Since mechanism evidence doesn't directly expose planets, we return an empty array.
 * This is a limitation of the bridge - planets are not available in the mechanism-based system.
 */
function extractPlanetsFromEvidence(
  evidence: CareerMechanismExpressionEvidence
): readonly Planet[] {
  // Mechanism evidence doesn't expose planets directly
  // This is a known limitation of the bridge adapter
  return Object.freeze([]);
}

/**
 * Creates a legacy CareerExpressionEvidence from mechanism expression evidence.
 */
function createLegacyEvidence(
  candidate: CareerExpressionCandidate,
  evidenceItem: CareerMechanismExpressionEvidence,
  index: number
): CareerExpressionEvidence {
  const planets = extractPlanetsFromEvidence(evidenceItem);

  return Object.freeze({
    id: evidenceItem.evidenceId,
    mode: expressionTypeToManifestationMode(candidate.expressionType),
    role: 'PLANETARY', // Mechanism evidence is planetary in nature
    statement: `${candidate.expressionType} expression derived from mechanism ${evidenceItem.sourceMechanismId}.`,
    weight: 2, // Default weight for mechanism-derived evidence
    planets,
    houses: Object.freeze([]) // Houses not available in mechanism evidence
  });
}

/**
 * Creates a legacy CareerExpression from a mechanism expression candidate.
 */
function createLegacyExpression(
  candidate: CareerExpressionCandidate
): CareerExpression {
  const mode = expressionTypeToManifestationMode(candidate.expressionType);

  // Create legacy evidence from mechanism evidence
  const legacyEvidence = candidate.evidence.map((evidenceItem, index) =>
    createLegacyEvidence(candidate, evidenceItem, index)
  );

  // Use sourceMechanismIds as supportingEvidenceIds (semantic identity linkage)
  const supportingEvidenceIds = Object.freeze([...candidate.sourceMechanismIds]);

  const statement = [
    `${mode} expression derived from mechanism-based resolution.`,
    `Expression type: ${candidate.expressionType}.`,
    `Source mechanisms: ${candidate.sourceMechanismIds.join(', ')}.`,
    `Mechanism types: ${candidate.mechanismTypes.join(', ')}.`,
    `Status: ${candidate.status}.`,
    `Pathway: ${candidate.pathway}.`
  ].join(' ');

  return Object.freeze({
    mode,
    direction: 'SUPPORTED', // Default direction for mechanism-based expressions
    strength: 'STRONG', // Default strength for mechanism-based expressions
    evidence: Object.freeze(legacyEvidence),
    supportingEvidenceIds,
    statement,
    conditional: false // Mechanism-based expressions are not conditional by default
  });
}

/**
 * Creates an explicit unavailable legacy expression analysis.
 * Used when mechanism-based result has no expressions (INSUFFICIENT_DATA or empty candidates).
 */
function createUnavailableLegacyAnalysis(): CareerExpressionAnalysis {
  return Object.freeze({
    expressions: Object.freeze([]),
    primaryExpression: undefined,
    statement: 'Career expression is unavailable because no mechanism candidates were resolved from the canonical career foundation.'
  });
}

/**
 * Resolves the primary expression from legacy expressions using deterministic ordering.
 * Selects the first expression in the array (deterministic ordering from resolver).
 */
function resolvePrimaryExpression(
  expressions: readonly CareerExpression[]
): CareerExpression | undefined {
  if (expressions.length === 0) {
    return undefined;
  }

  // Use first expression as primary (deterministic ordering from resolver)
  return expressions[0];
}

/**
 * Adapts mechanism-based expression analysis result to legacy expression analysis.
 *
 * This function:
 * - Maps CareerExpressionCandidate[] to CareerExpression[]
 * - Preserves mechanism identities via sourceMechanismIds → supportingEvidenceIds
 * - Creates synthetic evidence with planets=[] (known limitation)
 * - Emits explicit unavailable analysis when mechanism result is INSUFFICIENT_DATA or empty
 * - Deep-freezes all output for immutability
 *
 * @param mechanismResult - The mechanism-based expression analysis result
 * @returns A frozen legacy CareerExpressionAnalysis
 */
export function adaptMechanismExpressionToLegacy(
  mechanismResult: CareerExpressionAnalysisResult
): CareerExpressionAnalysis {
  // If mechanism result is INSUFFICIENT_DATA or has no expressions, emit explicit unavailable
  if (mechanismResult.status === 'INSUFFICIENT_DATA' || mechanismResult.expressions.length === 0) {
    return createUnavailableLegacyAnalysis();
  }

  // Map mechanism candidates to legacy expressions
  const legacyExpressions = mechanismResult.expressions.map(candidate =>
    createLegacyExpression(candidate)
  );

  // Sort by expressionId for deterministic ordering
  const sortedExpressions = Object.freeze(
    [...legacyExpressions].sort((a, b) =>
      a.mode.localeCompare(b.mode)
    )
  );

  // Resolve primary expression
  const primaryExpression = resolvePrimaryExpression(sortedExpressions);

  const statement = [
    `Career expression analysis derived from mechanism-based resolution.`,
    `Total expressions: ${sortedExpressions.length}.`,
    `Source mechanism count: ${mechanismResult.sourceMechanismIds.length}.`,
    `Status: ${mechanismResult.status}.`,
    primaryExpression
      ? `Primary expression: ${primaryExpression.mode} (${primaryExpression.direction}).`
      : 'No primary expression identified.'
  ].join(' ');

  return Object.freeze({
    expressions: sortedExpressions,
    primaryExpression,
    statement
  });
}
