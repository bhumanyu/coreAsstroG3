import type { CareerPattern } from '../careerPattern/careerPatternTypes';
import type { CareerPlanetaryRelevance, CareerPlanetRelevance } from '../careerPlanetaryRelevance';
import type { CareerPlanetaryConditionResult, CareerPlanetaryCondition } from '../careerPlanetaryCondition';
import type { Planet } from '../../../types';
import type {
  CareerPatternQualificationInput,
  CareerPatternQualificationResult,
  QualifiedCareerPattern,
  CareerPatternParticipantQualification,
  CareerPatternQualificationEvidence,
  CareerPatternQualificationProvenance,
  CareerPatternQualificationDimensions,
  CareerPatternQualificationStatus
} from './careerPatternQualificationTypes';
import {
  mapPlanetaryCondition,
  mapCareerRelevance,
  computeQualificationDimensions,
  classifyQualificationStatus
} from './careerPatternQualificationRules';
import { CANONICAL_PLANET_ORDER } from '../careerPlanetOrder';
import { getQualificationPolicy } from './qualificationRegistry';

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

/**
 * Precedence order for CareerPlanetRelevance (highest to lowest).
 * Used for deterministic duplicate normalization when multiple relevance records
 * exist for the same planet. The highest precedence value is kept.
 */
const RELEVANCE_PRECEDENCE: ReadonlyMap<CareerPlanetRelevance, number> = new Map([
  ['PRIMARY', 5],
  ['SUPPORTING', 4],
  ['SECONDARY', 3],
  ['CONDITIONAL', 2],
  ['NEUTRAL', 1]
]);

/**
 * Precedence order for CareerPlanetaryCondition (most severe to least severe).
 * Used for deterministic duplicate normalization when multiple condition records
 * exist for the same planet. The most severe (highest precedence) value is kept.
 */
const CONDITION_PRECEDENCE: ReadonlyMap<CareerPlanetaryCondition, number> = new Map([
  ['AFFLICTED', 6],
  ['WEAK', 5],
  ['MODERATE', 4],
  ['STRONG', 3],
  ['NEUTRAL', 2],
  ['UNAVAILABLE', 1]
]);

/**
 * Returns the relevance record with highest precedence from duplicates.
 * If only one record exists, returns it. If multiple exist, selects the one
 * with highest precedence per RELEVANCE_PRECEDENCE. On ties, selects the
 * canonical representative by sorting on a stable ordering (relevance, then
 * statement, then full-record JSON as fallback) and taking the lexicographically smallest.
 */
function normalizeRelevanceDuplicates(
  records: CareerPlanetaryRelevance[]
): CareerPlanetaryRelevance {
  if (records.length === 1) {
    return records[0];
  }

  // Find highest precedence score
  let highestScore = RELEVANCE_PRECEDENCE.get(records[0].relevance) ?? 0;
  for (let i = 1; i < records.length; i++) {
    const currentScore = RELEVANCE_PRECEDENCE.get(records[i].relevance) ?? 0;
    if (currentScore > highestScore) {
      highestScore = currentScore;
    }
  }

  // Collect all records with highest precedence
  const highestPrecedenceRecords = records.filter(
    r => (RELEVANCE_PRECEDENCE.get(r.relevance) ?? 0) === highestScore
  );

  // If only one, return it
  if (highestPrecedenceRecords.length === 1) {
    return highestPrecedenceRecords[0];
  }

  // Canonical tie-break: sort by relevance, then statement, then full-record JSON
  const sorted = [...highestPrecedenceRecords].sort((a, b) => {
    // Compare by relevance first (should be equal, but for stability)
    if (a.relevance !== b.relevance) {
      return a.relevance.localeCompare(b.relevance);
    }
    // Compare by statement
    if (a.statement !== b.statement) {
      return a.statement.localeCompare(b.statement);
    }
    // Fallback to full-record JSON for total order
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
  });

  return sorted[0];
}

/**
 * Returns the condition record with highest precedence (most severe) from duplicates.
 * If only one record exists, returns it. If multiple exist, selects the one
 * with highest precedence per CONDITION_PRECEDENCE. On ties, selects the
 * canonical representative by sorting on a stable ordering (condition, then
 * statement, then full-record JSON as fallback) and taking the lexicographically smallest.
 */
function normalizeConditionDuplicates(
  records: CareerPlanetaryConditionResult[]
): CareerPlanetaryConditionResult {
  if (records.length === 1) {
    return records[0];
  }

  // Find highest precedence score
  let highestScore = CONDITION_PRECEDENCE.get(records[0].condition) ?? 0;
  for (let i = 1; i < records.length; i++) {
    const currentScore = CONDITION_PRECEDENCE.get(records[i].condition) ?? 0;
    if (currentScore > highestScore) {
      highestScore = currentScore;
    }
  }

  // Collect all records with highest precedence
  const highestPrecedenceRecords = records.filter(
    r => (CONDITION_PRECEDENCE.get(r.condition) ?? 0) === highestScore
  );

  // If only one, return it
  if (highestPrecedenceRecords.length === 1) {
    return highestPrecedenceRecords[0];
  }

  // Canonical tie-break: sort by condition, then statement, then full-record JSON
  const sorted = [...highestPrecedenceRecords].sort((a, b) => {
    // Compare by condition first (should be equal, but for stability)
    if (a.condition !== b.condition) {
      return a.condition.localeCompare(b.condition);
    }
    // Compare by statement
    if (a.statement !== b.statement) {
      return a.statement.localeCompare(b.statement);
    }
    // Fallback to full-record JSON for total order
    return JSON.stringify(a).localeCompare(JSON.stringify(b));
  });

  return sorted[0];
}

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
 * - Populates sourcePatternId, sourceEvidenceIds, and ruleIds from pattern
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

  // Extract provenance from pattern
  const sourcePatternId = pattern.patternId;
  const sourceEvidenceIds = Object.freeze(
    [...new Set(pattern.evidence.map(e => e.evidenceId))].sort()
  );
  const ruleIds = Object.freeze(
    [...new Set(pattern.evidence.map(e => e.ruleId))].sort()
  );

  for (const dimension of dimensionKeys) {
    const value = dimensions[dimension];
    const evidenceId = generateEvidenceId(String(dimension), pattern.identityKey);

    const evidenceRecord: CareerPatternQualificationEvidence = Object.freeze({
      evidenceId,
      dimension,
      identityKey: pattern.identityKey,
      statement: `Pattern ${pattern.identityKey} has ${String(value).toLowerCase()} ${String(dimension)}.`,
      sourcePatternId,
      sourceEvidenceIds,
      ruleIds
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
 * - Extracts sourceEvidenceIds from pattern.evidence[].evidenceId (deduped and sorted)
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
    [...new Set(pattern.evidence.map(e => e.evidenceId))].sort()
  );
  const ruleIds = Object.freeze(
    [...new Set(pattern.evidence.map(e => e.ruleId))].sort()
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
 * - Computes qualification dimensions from participant data (legacy rules)
 * - Looks up the qualification policy for the pattern's classification
 * - If a policy exists, uses it to evaluate status with status precedence logic
 * - If no policy exists, falls back to legacy status classification
 * - Merges policy evidence with legacy dimension evidence
 * - Builds provenance from source pattern
 * - Generates summary statement
 * - Returns frozen QualifiedCareerPattern
 *
 * Status precedence (per spec §24):
 * - Mandatory structural prerequisite explicitly absent → UNQUALIFIED
 * - Mandatory prerequisite unevaluable → INSUFFICIENT_DATA (missing ≠ negative)
 * - Prerequisites confirmed + conditions met → QUALIFIED
 * - Known disqualifier → UNQUALIFIED
 * - ACTIVATION/D10 dimensions never raise natal status (spec §9-10)
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

  // Always compute dimensions using legacy rules (for consistency)
  const dimensions = computeQualificationDimensions(
    pattern,
    participantConditions,
    participantRelevance
  );

  // Look up qualification policy for this classification
  const policy = getQualificationPolicy(pattern.classification);

  let policyEvidence: any[] = [];
  let insufficientDataReasons: string[] = [];
  let ruleId: string;
  let explanation: string;
  let status: CareerPatternQualificationStatus;

  if (policy) {
    // Use policy-based evaluation with status precedence
    const policyContext = Object.freeze({
      pattern,
      relevanceByPlanet: Object.freeze(new Map(relevanceByPlanet)),
      conditionByPlanet: Object.freeze(new Map(conditionByPlanet))
    });

    const policyResult = policy.evaluate(policyContext);

    // Use policy status and evidence, but keep legacy dimensions
    policyEvidence = [...policyResult.evidence];
    insufficientDataReasons = [...policyResult.insufficientDataReasons];
    ruleId = policyResult.ruleId;
    explanation = policyResult.explanation;
    status = policyResult.status;
  } else {
    // Fallback to legacy status classification
    status = classifyQualificationStatus(dimensions);
    policyEvidence = [];
    insufficientDataReasons = [];
    ruleId = 'LEGACY';
    explanation = buildQualificationStatement(pattern, status, dimensions);
  }

  // Build legacy dimension evidence for backward compatibility
  const legacyEvidence = buildDimensionEvidence(pattern, dimensions);
  const evidence = Object.freeze([...legacyEvidence, ...policyEvidence]);

  const provenance = buildProvenance(pattern);
  const statement = explanation || buildQualificationStatement(pattern, status, dimensions);

  return Object.freeze({
    patternId: pattern.patternId,
    identityKey: pattern.identityKey,
    family: pattern.family,
    level: pattern.level,
    classification: pattern.classification,
    name: pattern.name,
    topology: pattern.topology,
    direction: pattern.direction,
    houses: pattern.houses,
    houseRoles: pattern.houseRoles,
    planets: pattern.planets,
    networkIds: pattern.networkIds,
    relationshipIds: pattern.relationshipIds,
    sourcePattern: pattern,
    dimensions,
    participants,
    evidence,
    policyEvidence: Object.freeze(policyEvidence),
    insufficientDataReasons: Object.freeze(insufficientDataReasons),
    ruleId,
    explanation,
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

  // Build maps with deterministic duplicate normalization
  // Collect all records per planet first
  const relevanceRecordsByPlanet = new Map<Planet, CareerPlanetaryRelevance[]>();
  for (const item of relevance) {
    const existing = relevanceRecordsByPlanet.get(item.planet) ?? [];
    relevanceRecordsByPlanet.set(item.planet, [...existing, item]);
  }

  const conditionRecordsByPlanet = new Map<Planet, CareerPlanetaryConditionResult[]>();
  for (const item of condition) {
    const existing = conditionRecordsByPlanet.get(item.planet) ?? [];
    conditionRecordsByPlanet.set(item.planet, [...existing, item]);
  }

  // Normalize duplicates using precedence rules
  const relevanceByPlanet = new Map<Planet, CareerPlanetaryRelevance>();
  for (const [planet, records] of relevanceRecordsByPlanet) {
    relevanceByPlanet.set(planet, normalizeRelevanceDuplicates(records));
  }

  const conditionByPlanet = new Map<Planet, CareerPlanetaryConditionResult>();
  for (const [planet, records] of conditionRecordsByPlanet) {
    conditionByPlanet.set(planet, normalizeConditionDuplicates(records));
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
