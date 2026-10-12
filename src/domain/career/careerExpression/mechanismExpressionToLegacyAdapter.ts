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
import type {
  CareerMechanismCandidate
} from '../careerMechanism/careerMechanismTypes';
import { extractPlanetFromParticipantId } from '../careerParticipantRoles/participantRoleUtils';
import { CANONICAL_PLANET_ORDER } from '../careerPlanetOrder';

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
 * - direction → 'UNAVAILABLE' (conservative: CANDIDATE status does NOT establish positive direction)
 * - strength → 'UNAVAILABLE' (conservative: CANDIDATE status does NOT establish strong expression)
 * - evidence → synthetic evidence from mechanism sources (with planets from participantIds)
 * - supportingEvidenceIds → sourceMechanismIds (semantic identity linkage)
 * - primaryExpression → first expression by deterministic ordering
 *
 * CONSERVATIVE MAPPING RATIONALE:
 * The mechanism resolver's CANDIDATE status does NOT establish positive direction or strong expression.
 * Without an upstream signal with documented semantics and a tested mapping, we conservatively map every
 * mechanism-derived expression to direction: 'UNAVAILABLE' and strength: 'UNAVAILABLE'. This prevents
 * fabricating positive signals. The candidate itself is preserved (mode, supportingEvidenceIds, evidence,
 * statement) — uncertainty about strength must not erase the candidate.
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
 * Extracts planets from mechanism expression evidence using the source mechanism's participant planets.
 * Looks up planets by sourceMechanismId in the provided map, then sorts by CANONICAL_PLANET_ORDER and dedupes.
 * If a mechanism has no participant planets, returns an empty array (no fabrication).
 */
function extractPlanetsFromEvidence(
  evidence: CareerMechanismExpressionEvidence,
  mechanismPlanetsMap: ReadonlyMap<string, readonly Planet[]>
): readonly Planet[] {
  const planets = mechanismPlanetsMap.get(evidence.sourceMechanismId) ?? [];
  // Already sorted and deduped in the map construction
  return planets;
}

/**
 * Creates a legacy CareerExpressionEvidence from mechanism expression evidence.
 */
function createLegacyEvidence(
  candidate: CareerExpressionCandidate,
  evidenceItem: CareerMechanismExpressionEvidence,
  index: number,
  mechanismPlanetsMap: ReadonlyMap<string, readonly Planet[]>
): CareerExpressionEvidence {
  const planets = extractPlanetsFromEvidence(evidenceItem, mechanismPlanetsMap);

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
  candidate: CareerExpressionCandidate,
  mechanismPlanetsMap: ReadonlyMap<string, readonly Planet[]>
): CareerExpression {
  const mode = expressionTypeToManifestationMode(candidate.expressionType);

  // Create legacy evidence from mechanism evidence
  const legacyEvidence = candidate.evidence.map((evidenceItem, index) =>
    createLegacyEvidence(candidate, evidenceItem, index, mechanismPlanetsMap)
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
    direction: 'UNAVAILABLE', // Conservative: CANDIDATE status does NOT establish positive direction
    strength: 'UNAVAILABLE', // Conservative: CANDIDATE status does NOT establish strong expression
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
 * Builds a map from mechanism candidate ID to its participant planets.
 * Extracts planets from provenance.participantIds using extractPlanetFromParticipantId,
 * sorts by CANONICAL_PLANET_ORDER, and dedupes. If a mechanism has no participant planets,
 * the map entry will be an empty array (no fabrication).
 */
function buildMechanismPlanetsMap(
  mechanismCandidates: readonly CareerMechanismCandidate[]
): ReadonlyMap<string, readonly Planet[]> {
  const map = new Map<string, readonly Planet[]>();

  for (const candidate of mechanismCandidates) {
    const planets: Planet[] = [];
    for (const participantId of candidate.provenance.participantIds) {
      const planet = extractPlanetFromParticipantId(participantId);
      if (!planets.includes(planet)) {
        planets.push(planet);
      }
    }
    // Sort by canonical planet order for deterministic output
    planets.sort((a, b) => {
      const indexA = CANONICAL_PLANET_ORDER.indexOf(a);
      const indexB = CANONICAL_PLANET_ORDER.indexOf(b);
      return indexA - indexB;
    });
    map.set(candidate.candidateId, Object.freeze(planets));
  }

  return Object.freeze(map);
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
 * - Populates planets from mechanism participantIds (authoritative structural associations)
 * - Emits explicit unavailable analysis when mechanism result is INSUFFICIENT_DATA or empty
 * - Deep-freezes all output for immutability
 *
 * @param mechanismResult - The mechanism-based expression analysis result
 * @param mechanismCandidates - The mechanism candidates (for planet extraction from participantIds)
 * @returns A frozen legacy CareerExpressionAnalysis
 */
export function adaptMechanismExpressionToLegacy(
  mechanismResult: CareerExpressionAnalysisResult,
  mechanismCandidates: readonly CareerMechanismCandidate[]
): CareerExpressionAnalysis {
  // If mechanism result is INSUFFICIENT_DATA or has no expressions, emit explicit unavailable
  if (mechanismResult.status === 'INSUFFICIENT_DATA' || mechanismResult.expressions.length === 0) {
    return createUnavailableLegacyAnalysis();
  }

  // Build planet map from mechanism candidates
  const mechanismPlanetsMap = buildMechanismPlanetsMap(mechanismCandidates);

  // Map mechanism candidates to legacy expressions
  const legacyExpressions = mechanismResult.expressions.map(candidate =>
    createLegacyExpression(candidate, mechanismPlanetsMap)
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
