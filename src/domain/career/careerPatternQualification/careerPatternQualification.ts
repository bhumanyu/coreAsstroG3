import type { CareerPattern } from '../careerPattern/careerPatternTypes';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
import type { Planet } from '../../../types';
import type {
  CareerPatternQualificationInput,
  CareerPatternQualificationResult,
  QualifiedCareerPattern,
  CareerPatternParticipantQualification,
  CareerPatternQualificationEvidence,
  CareerPatternQualificationProvenance,
  CareerPatternQualificationDimensions
} from './careerPatternQualificationTypes';
import {
  mapPlanetaryCondition,
  mapCareerRelevance,
  computeQualificationDimensions,
  classifyQualificationStatus
} from './careerPatternQualificationRules';
import { CANONICAL_PLANET_ORDER } from '../careerExpressionIntegration';

/**
 * P2-04 Career Pattern Qualification Orchestration
 *
 * This module implements the main qualification logic that evaluates Career patterns
 * based on planetary relevance (C5) and condition (C6) results.
 *
 * This layer evaluates structural dimensions of Career patterns but does NOT calculate
 * Dasha, D10, transit, timing, or prediction anywhere in the output.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

// Re-export types for convenience
export type { CareerPatternQualificationInput, CareerPatternQualificationResult };

/**
 * Generates a unique evidence ID for a qualification dimension.
 * Format: P2-04:<DIMENSION>:<identityKey>
 */
function generateEvidenceId(
  dimension: string,
  identityKey: string
): string {
  return `P2-04:${dimension}:${identityKey}`;
}

/**
 * Builds per-participant qualification for a pattern.
 *
 * This function:
 * - Iterates over pattern.planets in canonical SUN→KETU order
 * - Maps C5 relevance and C6 condition to qualification-level assessments
 * - Preserves frozen source relevance/condition objects for traceability
 * - Returns frozen participant qualification objects
 */
function buildParticipantQualifications(
  pattern: CareerPattern,
  relevanceByPlanet: Map<Planet, CareerPlanetaryRelevance>,
  conditionByPlanet: Map<Planet, CareerPlanetaryConditionResult>
): readonly CareerPatternParticipantQualification[] {
  const participants: CareerPatternParticipantQualification[] = [];

  // Iterate in canonical planet order for determinism
  for (const planet of CANONICAL_PLANET_ORDER) {
    if (!pattern.planets.includes(planet)) {
      continue;
    }

    const relevanceSource = relevanceByPlanet.get(planet);
    const conditionSource = conditionByPlanet.get(planet);

    const relevance = mapCareerRelevance(relevanceSource);
    const condition = mapPlanetaryCondition(conditionSource);

    const participant: CareerPatternParticipantQualification = Object.freeze({
      planet,
      relevance,
      condition,
      relevanceSource: relevanceSource ? Object.freeze(relevanceSource) : undefined,
      conditionSource: conditionSource ? Object.freeze(conditionSource) : undefined
    });

    participants.push(participant);
  }

  return Object.freeze(participants);
}

/**
 * Builds per-dimension evidence records for a pattern.
 *
 * This function:
 * - Generates evidence IDs in format P2-04:<DIMENSION>:<identityKey>
 * - Creates evidence records for each dimension
 * - Returns frozen evidence array
 */
function buildDimensionEvidence(
  pattern: CareerPattern,
  dimensions: CareerPatternQualificationDimensions
): readonly CareerPatternQualificationEvidence[] {
  const evidence: CareerPatternQualificationEvidence[] = [];
  const dimensionKeys: (keyof CareerPatternQualificationDimensions)[] = [
    'structuralStrength',
    'planetaryCondition',
    'careerRelevance',
    'coherence',
    'activationPotential',
    'divisionalConfirmation'
  ];

  for (const dimension of dimensionKeys) {
    const value = dimensions[dimension];
    const evidenceId = generateEvidenceId(String(dimension), pattern.identityKey);

    const evidenceRecord: CareerPatternQualificationEvidence = Object.freeze({
      evidenceId,
      dimension,
      identityKey: pattern.identityKey,
      statement: `Pattern ${pattern.identityKey} has ${String(value).toLowerCase()} ${String(dimension)}.`
    });

    evidence.push(evidenceRecord);
  }

  return Object.freeze(evidence);
}

/**
 * Builds provenance for a qualification result.
 *
 * This function:
 * - Extracts sourcePatternIds from the input pattern
 * - Extracts sourceEvidenceIds from pattern.evidence[].evidenceId
 * - Extracts ruleIds from pattern.evidence[].ruleId (deduped and sorted)
 * - Returns frozen provenance object
 *
 * Note: ruleIds are now extracted from source pattern evidence rather than
 * being hardcoded as empty array, preserving rule traceability through P2-04.
 */
function buildProvenance(
  pattern: CareerPattern
): CareerPatternQualificationProvenance {
  const sourcePatternIds = Object.freeze([pattern.patternId]);
  const sourceEvidenceIds = Object.freeze(
    pattern.evidence.map(e => e.evidenceId)
  );
  const ruleIds = Object.freeze(
    Array.from(new Set(pattern.evidence.map(e => e.ruleId))).sort()
  );

  return Object.freeze({
    sourcePatternIds,
    sourceEvidenceIds,
    ruleIds
  });
}

/**
 * Builds a statement summarizing the qualification result.
 */
function buildQualificationStatement(
  pattern: CareerPattern,
  status: string,
  dimensions: CareerPatternQualificationDimensions
): string {
  const parts = [
    `Pattern ${pattern.identityKey} (${pattern.name})`,
    `has qualification status ${status}.`,
    `Structural strength: ${dimensions.structuralStrength}.`,
    `Planetary condition: ${dimensions.planetaryCondition}.`,
    `Career relevance: ${dimensions.careerRelevance}.`,
    `Coherence: ${dimensions.coherence}.`,
    `Activation potential: ${dimensions.activationPotential}.`,
    `Divisional confirmation: ${dimensions.divisionalConfirmation}.`
  ];

  return parts.join(' ');
}

/**
 * Qualifies a single Career pattern.
 *
 * This function:
 * - Builds participant qualifications in canonical planet order
 * - Computes qualification dimensions from participant data
 * - Builds dimension evidence records
 * - Builds provenance from source pattern
 * - Classifies qualification status
 * - Generates summary statement
 * - Returns frozen QualifiedCareerPattern
 */
function qualifyPattern(
  pattern: CareerPattern,
  relevanceByPlanet: Map<Planet, CareerPlanetaryRelevance>,
  conditionByPlanet: Map<Planet, CareerPlanetaryConditionResult>
): QualifiedCareerPattern {
  const participants = buildParticipantQualifications(
    pattern,
    relevanceByPlanet,
    conditionByPlanet
  );

  const participantConditions = participants.map(p => p.condition);
  const participantRelevance = participants.map(p => p.relevance);

  const dimensions = computeQualificationDimensions(
    pattern,
    participantConditions,
    participantRelevance
  );

  const evidence = buildDimensionEvidence(pattern, dimensions);
  const provenance = buildProvenance(pattern);
  const status = classifyQualificationStatus(dimensions);
  const statement = buildQualificationStatement(pattern, status, dimensions);

  return Object.freeze({
    patternId: pattern.patternId,
    identityKey: pattern.identityKey,
    sourcePattern: pattern,
    dimensions,
    participants,
    evidence,
    provenance,
    status,
    statement
  });
}

/**
 * Qualifies Career patterns based on planetary relevance and condition.
 *
 * This function:
 * - Builds relevanceByPlanet and conditionByPlanet Maps from input
 * - Sorts patterns by identityKey for input-order determinism
 * - Qualifies each pattern with participant data in canonical planet order
 * - Generates per-dimension evidence records with P2-04:<DIMENSION>:<identityKey> IDs
 * - Builds provenance with sourcePatternIds and sourceEvidenceIds from pattern.evidence
 * - Performs deep Object.freeze on all output
 * - Preserves patternId and identityKey verbatim from source pattern
 *
 * Per §14: Input contains only patterns, relevance, and condition — NO horoscope,
 * dasha, d10, or timing fields.
 *
 * @param input - The qualification input containing patterns, relevance, and condition
 * @returns A frozen qualification result with qualified patterns
 */
export function qualifyCareerPatterns(
  input: CareerPatternQualificationInput
): CareerPatternQualificationResult {
  const { patterns, relevance, condition } = input;

  // Build maps for efficient lookup
  const relevanceByPlanet = new Map<Planet, CareerPlanetaryRelevance>();
  for (const item of relevance) {
    relevanceByPlanet.set(item.planet, item);
  }

  const conditionByPlanet = new Map<Planet, CareerPlanetaryConditionResult>();
  for (const item of condition) {
    conditionByPlanet.set(item.planet, item);
  }

  // Sort patterns by identityKey for determinism
  const sortedPatterns = [...patterns].sort((a, b) =>
    a.identityKey.localeCompare(b.identityKey)
  );

  // Qualify each pattern
  const qualifiedPatterns = sortedPatterns.map(pattern =>
    qualifyPattern(pattern, relevanceByPlanet, conditionByPlanet)
  );

  return Object.freeze({
    qualifiedPatterns: Object.freeze(qualifiedPatterns)
  });
}
