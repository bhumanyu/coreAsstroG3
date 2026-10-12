import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerExpressionCanonicalResult,
  CareerExpressionCanonicalCandidate,
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
 * Per P2-11C Gate 2: One-way compatibility projection only.
 * - Never manufacture qualification/direction/strength/identity
 * - Preserve real sourceEvidenceIds/ruleIds/participant-derived planets
 * - Keep existing throw-on-unknown-expression-type behavior
 * - Report lossy fields rather than forcing canonical identity into a legacy mode field
 *
 * BRIDGE RESPONSIBILITIES:
 * - Preserve mechanism identities (sourceMechanismIds in statement, expressionId as semantic identity)
 * - Preserve deterministic ordering and immutability (deep-freeze)
 * - Represent empty/insufficient mechanism results as explicit unavailable expression
 * - Never fabricate expressions when resolvedMechanisms is empty
 * - Ensure C11 evidenceIds resolve against canonical expression evidence (no dangling references)
 *
 * MAPPING STRATEGY:
 * - expressionType → mode (via expressionTypeToManifestationMode mapping)
 * - direction → 'UNAVAILABLE' (conservative: CANDIDATE status does NOT establish positive direction)
 * - strength → 'UNAVAILABLE' (conservative: CANDIDATE status does NOT establish strong expression)
 * - evidence → synthetic evidence from mechanism sources (with planets from participantIds)
 * - supportingEvidenceIds → synthetic legacy evidence record IDs (evidenceItem.evidenceId)
 *   This ensures C11 evidenceIds resolve against canonical expression evidence emitted by mapExpressionEvidence
 *   which keys evidence by evidence.id = evidenceItem.evidenceId
 * - mechanism provenance → preserved in statement (sourceMechanismIds)
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
 *
 * Unmapped types throw an explicit error to prevent silent conversion to a different manifestation mode.
 * This ensures that newly introduced expression types are handled intentionally rather than silently
 * mapped to an incorrect default.
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

  const mapped = mapping[expressionType];
  if (mapped === undefined) {
    throw new Error(
      `Unknown expression type "${expressionType}" cannot be mapped to a legacy manifestation mode. ` +
      `Add the mapping to expressionTypeToManifestationMode or update the CareerExpressionType union.`
    );
  }
  return mapped;
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
 *
 * Note: The mechanism evidence contract (CareerMechanismExpressionEvidence) supplies sourceMechanismId,
 * sourceEvidenceIds, ruleId, and an ESTABLISHING | REFINING role. It does NOT establish:
 * - planetary role (no field in contract)
 * - weight (no field in contract)
 * - conditional semantics (no field in contract)
 *
 * These fields are set to explicit unavailable sentinel values to distinguish from authoritative values:
 * - role: 'PLANETARY' (placeholder - ignored by canonical mapper which hardcodes role: 'MODIFIER')
 * - weight: 0 (unavailable sentinel - canonical mapper uses this as priority; 0 indicates no authoritative priority)
 * - conditional: false (placeholder - mechanism-based expressions are not conditional by contract)
 *
 * The canonical mapper (canonicalCareerEvidenceMapper.ts) ignores the legacy evidence role
 * (hardcodes role: 'MODIFIER') and uses weight as priority. Using weight: 0 ensures the mapper
 * treats this as having no authoritative priority, distinct from legitimate priority values (typically 1-5).
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
    role: 'PLANETARY', // Placeholder: mechanism evidence does not establish role; ignored by canonical mapper (hardcodes 'MODIFIER')
    statement: `${candidate.expressionType} expression derived from mechanism ${evidenceItem.sourceMechanismId}. Mechanism role: ${evidenceItem.role}. Rule: ${evidenceItem.ruleId}.`,
    weight: 0, // Unavailable sentinel: mechanism evidence does not establish weight; canonical mapper uses this as priority; 0 indicates no authoritative priority
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

  // Use synthetic legacy evidence record IDs (evidenceItem.evidenceId) as supportingEvidenceIds
  // This ensures C11 evidenceIds resolve against the canonical expression evidence emitted by mapExpressionEvidence
  // which keys evidence by evidence.id = evidenceItem.evidenceId
  const supportingEvidenceIds = Object.freeze(
    candidate.evidence.map(e => e.evidenceId)
  );

  const statement = [
    `${mode} expression derived from mechanism-based resolution.`,
    `Expression type: ${candidate.expressionType}.`,
    `Source mechanisms: ${candidate.sourceMechanismIds.join(', ')}.`,
    `Mechanism types: ${candidate.mechanismTypes.join(', ')}.`,
    `Status: ${candidate.status}.`,
    `Pathway: ${candidate.pathway}.`,
    `Mechanism provenance: ${candidate.sourceMechanismIds.join(', ')}.`
  ].join(' ');

  return Object.freeze({
    mode,
    direction: 'UNAVAILABLE', // Conservative: CANDIDATE status does NOT establish positive direction
    strength: 'UNAVAILABLE', // Conservative: CANDIDATE status does NOT establish strong expression
    evidence: Object.freeze(legacyEvidence),
    supportingEvidenceIds,
    statement,
    conditional: false // Mechanism-based expressions are not conditional by contract
  });
}

/**
 * Creates a legacy CareerExpression from a canonical expression candidate.
 *
 * Per P2-11C Gate 2: Handles canonical result with qualification tracking.
 * - CANDIDATE expressions map to direction/strength UNAVAILABLE
 * - QUALIFIED expressions preserve their direction/strength
 * - Trace is preserved in the statement for observability
 * - Never manufacture qualification/direction/strength/identity
 */
function createLegacyExpressionFromCanonical(
  candidate: CareerExpressionCanonicalCandidate,
  mechanismPlanetsMap: ReadonlyMap<string, readonly Planet[]>
): CareerExpression {
  const mode = expressionTypeToManifestationMode(candidate.expressionType);

  // Create legacy evidence from mechanism evidence
  const legacyEvidence = candidate.evidence.map((evidenceItem, index) =>
    createLegacyEvidence(candidate, evidenceItem, index, mechanismPlanetsMap)
  );

  // Use synthetic legacy evidence record IDs (evidenceItem.evidenceId) as supportingEvidenceIds
  const supportingEvidenceIds = Object.freeze(
    candidate.evidence.map(e => e.evidenceId)
  );

  // Per P2-11C Gate 2: Map qualificationStatus to direction/strength
  // CANDIDATE → UNAVAILABLE (no upstream rule signal)
  // QUALIFIED → preserve direction/strength from canonical result
  const direction = candidate.qualificationStatus === 'CANDIDATE'
    ? 'UNAVAILABLE'
    : mapCanonicalDirectionToLegacy(candidate.direction);

  const strength = candidate.qualificationStatus === 'CANDIDATE'
    ? 'UNAVAILABLE'
    : mapCanonicalStrengthToLegacy(candidate.strength);

  // Build statement with trace for observability
  const traceStatement = candidate.trace.length > 0
    ? ` Trace: ${candidate.trace.join('; ')}.`
    : '';

  const statement = [
    `${mode} expression derived from canonical C8 resolution.`,
    `Expression type: ${candidate.expressionType}.`,
    `Qualification status: ${candidate.qualificationStatus}.`,
    `Source mechanisms: ${candidate.sourceMechanismIds.join(', ')}.`,
    `Mechanism types: ${candidate.mechanismTypes.join(', ')}.`,
    `Status: ${candidate.status}.`,
    `Pathway: ${candidate.pathway}.`,
    `Mechanism provenance: ${candidate.sourceMechanismIds.join(', ')}.`,
    traceStatement
  ].join(' ').trim();

  return Object.freeze({
    mode,
    direction,
    strength,
    evidence: Object.freeze(legacyEvidence),
    supportingEvidenceIds,
    statement,
    conditional: false // Canonical expressions are not conditional by contract
  });
}

/**
 * Maps canonical direction to legacy direction.
 */
function mapCanonicalDirectionToLegacy(
  direction: string
): 'SUPPORTED' | 'CONDITIONAL' | 'NEUTRAL' | 'UNAVAILABLE' {
  switch (direction) {
    case 'SUPPORTED':
      return 'SUPPORTED';
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
 * Maps canonical strength to legacy strength.
 */
function mapCanonicalStrengthToLegacy(
  strength: string
): 'STRONG' | 'MODERATE' | 'WEAK' | 'UNAVAILABLE' {
  switch (strength) {
    case 'STRONG':
      return 'STRONG';
    case 'MODERATE':
      return 'MODERATE';
    case 'WEAK':
      return 'WEAK';
    case 'UNAVAILABLE':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
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
 * Per P2-11C Gate 2: One-way compatibility projection only.
 * - Never manufacture qualification/direction/strength/identity
 * - Preserve real sourceEvidenceIds/ruleIds/participant-derived planets
 * - Keep existing throw-on-unknown-expression-type behavior
 * - Report lossy fields rather than forcing canonical identity into a legacy mode field
 *
 * @param mechanismResult - The mechanism-based expression analysis result
 * @param mechanismCandidates - The mechanism candidates (for planet extraction from participantIds)
 * @returns A frozen legacy CareerExpressionAnalysis
 */
export function adaptMechanismExpressionToLegacy(
  mechanismResult: CareerExpressionAnalysisResult,
  mechanismCandidates: readonly CareerMechanismCandidate[]
): CareerExpressionAnalysis;

/**
 * Adapts canonical C8 expression result to legacy expression analysis.
 *
 * Per P2-11C Gate 2: Handles canonical result with qualification tracking.
 * - Maps qualificationStatus to direction/strength (CANDIDATE → UNAVAILABLE, QUALIFIED → preserved)
 * - Preserves trace separately from directional evidence
 * - Unqualified candidates stay CANDIDATE with UNAVAILABLE direction/strength and empty ruleIds
 * - Candidate trace remains visible even when no directional evidence is emitted
 *
 * @param canonicalResult - The canonical C8 expression result
 * @param mechanismCandidates - The mechanism candidates (for planet extraction from participantIds)
 * @returns A frozen legacy CareerExpressionAnalysis
 */
export function adaptMechanismExpressionToLegacy(
  canonicalResult: CareerExpressionCanonicalResult,
  mechanismCandidates: readonly CareerMechanismCandidate[]
): CareerExpressionAnalysis;

/**
 * Implementation of the adapter (handles both legacy and canonical result types).
 */
export function adaptMechanismExpressionToLegacy(
  mechanismResult: CareerExpressionAnalysisResult | CareerExpressionCanonicalResult,
  mechanismCandidates: readonly CareerMechanismCandidate[]
): CareerExpressionAnalysis {
  // Check if this is a canonical result (has qualificationStatus on expressions)
  const isCanonical = mechanismResult.expressions.length > 0 &&
    'qualificationStatus' in mechanismResult.expressions[0];

  // If mechanism result is INSUFFICIENT_DATA or has no expressions, emit explicit unavailable
  if (mechanismResult.status === 'INSUFFICIENT_DATA' || mechanismResult.expressions.length === 0) {
    return createUnavailableLegacyAnalysis();
  }

  // Build planet map from mechanism candidates
  const mechanismPlanetsMap = buildMechanismPlanetsMap(mechanismCandidates);

  // Map mechanism candidates to legacy expressions
  const legacyExpressions = mechanismResult.expressions.map(candidate =>
    isCanonical
      ? createLegacyExpressionFromCanonical(candidate as CareerExpressionCanonicalCandidate, mechanismPlanetsMap)
      : createLegacyExpression(candidate as CareerExpressionCandidate, mechanismPlanetsMap)
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
