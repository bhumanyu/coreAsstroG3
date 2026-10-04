import type { CareerPattern } from '../careerPattern/careerPatternTypes';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
import type { Planet } from '../../../types';
import type {
  CareerPatternQualificationDimensions,
  QualificationEvidence,
  QualificationEvidenceSourceType
} from './careerPatternQualificationTypes';

/**
 * P2-07A Policy Utility Functions
 *
 * Common helper functions used by per-family qualification policies.
 * These utilities ensure consistent dimension evaluation and evidence
 * generation across all policies.
 */

/**
 * Generates a unique evidence ID for policy-level evidence.
 * Format: P2-07A:<POLICY_ID>:<DIMENSION>:<identityKey>:<sequence>
 */
export function generatePolicyEvidenceId(
  policyId: string,
  dimension: string,
  identityKey: string,
  sequence: number
): string {
  return `P2-07A:${policyId}:${dimension}:${identityKey}:${sequence}`;
}

/**
 * Creates a QualificationEvidence record.
 *
 * @param evidenceId - Unique evidence ID
 * @param dimension - The dimension this evidence supports
 * @param sourceType - Type of evidence source
 * @param sourceId - ID of the source (planet, relationship, etc.)
 * @param relationshipIds - Establishing relationship IDs from pattern.provenance.establishingRelationshipIds
 * @param explanation - Human-readable explanation
 * @returns Frozen QualificationEvidence record
 */
export function createQualificationEvidence(
  evidenceId: string,
  dimension: keyof CareerPatternQualificationDimensions,
  sourceType: QualificationEvidenceSourceType,
  sourceId: string,
  relationshipIds: readonly string[],
  explanation: string
): QualificationEvidence {
  return Object.freeze({
    evidenceId,
    dimension,
    sourceType,
    sourceId,
    relationshipIds: Object.freeze([...relationshipIds].sort()),
    explanation
  });
}

/**
 * Extracts establishing relationship IDs from a pattern.
 * Per spec §25: relationshipIds are sourced ONLY from pattern.provenance.establishingRelationshipIds,
 * never from network.relationships bulk copy.
 */
export function getEstablishingRelationshipIds(
  pattern: CareerPattern
): readonly string[] {
  return Object.freeze([...pattern.provenance.establishingRelationshipIds].sort());
}

/**
 * Checks if a specific relationship ID exists in the pattern's establishing relationships.
 */
export function hasEstablishingRelationship(
  pattern: CareerPattern,
  relationshipId: string
): boolean {
  return pattern.provenance.establishingRelationshipIds.includes(relationshipId);
}

/**
 * Checks if any of the specified relationship IDs exist in the pattern's establishing relationships.
 */
export function hasAnyEstablishingRelationship(
  pattern: CareerPattern,
  relationshipIds: readonly string[]
): boolean {
  return relationshipIds.some(id =>
    pattern.provenance.establishingRelationshipIds.includes(id)
  );
}

/**
 * Checks if all of the specified relationship IDs exist in the pattern's establishing relationships.
 */
export function hasAllEstablishingRelationships(
  pattern: CareerPattern,
  relationshipIds: readonly string[]
): boolean {
  return relationshipIds.every(id =>
    pattern.provenance.establishingRelationshipIds.includes(id)
  );
}

/**
 * Checks if the pattern has a directed house relationship ID from fromHouse to toHouse.
 * This is a temporary ID-string check that examines establishingRelationshipIds for the pattern.
 *
 * CONTRACT: This helper depends on identity-key format and should be removed when
 * QualificationPolicyContext gains canonical relationship access in P2-07B. At that point,
 * policies should call the real P2-06 predicates (hasDirectedHouseRelationship(network, 6, 10)
 * style) from careerPatternPredicates.ts instead of parsing identity strings.
 *
 * TODO(P2-07B): Resolve via canonical edge semantics by extending QualificationPolicyContext
 * to carry source CareerHouseNetwork[] and using the frozen P2-06A hasDirectedHouseRelationship
 * predicate from careerPatternPredicates.ts.
 *
 * Note: The ID format `REL:...` is a temporary contract. This helper should be replaced with
 * canonical relationship resolution once the context exposes networks.
 *
 * @param pattern - The career pattern to check
 * @param fromHouse - Source house number
 * @param toHouse - Target house number
 * @returns true if a directed relationship ID from fromHouse to toHouse exists
 */
export function hasDirectedHouseRelationshipId(
  pattern: CareerPattern,
  fromHouse: number,
  toHouse: number
): boolean {
  const establishingIds = pattern.provenance.establishingRelationshipIds;

  // Check for relationship IDs that represent the directed flow fromHouse → toHouse
  // Expected formats: REL:from→to, REL:from-to, from→to, from-to
  const arrowPattern = new RegExp(`(?:REL:)?${fromHouse}[→-]${toHouse}\\b`);

  return establishingIds.some(id => arrowPattern.test(id));
}

/**
 * Gets planetary relevance for a planet, returning UNAVAILABLE if missing.
 */
export function getPlanetaryRelevance(
  relevanceByPlanet: ReadonlyMap<Planet, CareerPlanetaryRelevance>,
  planet: Planet
): CareerPlanetaryRelevance | undefined {
  return relevanceByPlanet.get(planet);
}

/**
 * Gets planetary condition for a planet, returning UNAVAILABLE if missing.
 */
export function getPlanetaryCondition(
  conditionByPlanet: ReadonlyMap<Planet, CareerPlanetaryConditionResult>,
  planet: Planet
): CareerPlanetaryConditionResult | undefined {
  return conditionByPlanet.get(planet);
}

/**
 * Checks if a planet has career relevance data available.
 */
export function hasRelevanceData(
  relevanceByPlanet: ReadonlyMap<Planet, CareerPlanetaryRelevance>,
  planet: Planet
): boolean {
  const relevance = relevanceByPlanet.get(planet);
  return relevance !== undefined;
}

/**
 * Checks if a planet has condition data available.
 */
export function hasConditionData(
  conditionByPlanet: ReadonlyMap<Planet, CareerPlanetaryConditionResult>,
  planet: Planet
): boolean {
  const condition = conditionByPlanet.get(planet);
  return condition !== undefined && condition.condition !== 'UNAVAILABLE';
}

/**
 * Aggregates planetary condition across multiple planets conservatively.
 * Returns the weakest condition found, or UNAVAILABLE if any is missing.
 */
export function aggregateWeakestCondition(
  conditionByPlanet: ReadonlyMap<Planet, CareerPlanetaryConditionResult>,
  planets: readonly Planet[]
): string {
  if (planets.length === 0) {
    return 'UNAVAILABLE';
  }

  let weakest: string = 'STRONG';
  let hasUnavailable = false;
  let hasData = false;

  for (const planet of planets) {
    const condition = conditionByPlanet.get(planet);
    if (!condition || condition.condition === 'UNAVAILABLE') {
      hasUnavailable = true;
      continue; // Don't break, check all planets first
    }

    hasData = true;

    // Order: UNAVAILABLE < WEAK < MODERATE < STRONG
    if (condition.condition === 'WEAK') {
      return 'WEAK';
    }
    if (condition.condition === 'MODERATE' && weakest === 'STRONG') {
      weakest = 'MODERATE';
    }
  }

  if (!hasData) {
    return 'UNAVAILABLE';
  }

  if (hasUnavailable) {
    return 'UNAVAILABLE';
  }

  return weakest;
}

/**
 * Aggregates career relevance across multiple planets conservatively.
 * Returns the lowest relevance found, or UNAVAILABLE if any is missing.
 *
 * Note: This operates on C5 CareerPlanetRelevance (PRIMARY, SUPPORTING, SECONDARY, CONDITIONAL, NEUTRAL)
 * and maps to qualification-level values (PRIMARY, SUPPORTING, MIXED, NEUTRAL, UNAVAILABLE).
 */
export function aggregateLowestRelevance(
  relevanceByPlanet: ReadonlyMap<Planet, CareerPlanetaryRelevance>,
  planets: readonly Planet[]
): string {
  if (planets.length === 0) {
    return 'UNAVAILABLE';
  }

  let lowest: string = 'PRIMARY';
  let hasUnavailable = false;
  let hasMixed = false;
  let hasData = false;

  for (const planet of planets) {
    const relevance = relevanceByPlanet.get(planet);
    if (!relevance) {
      hasUnavailable = true;
      continue; // Don't break, check all planets first
    }

    hasData = true;

    // Map C5 relevance to qualification-level values
    // PRIMARY → PRIMARY, SUPPORTING → SUPPORTING, SECONDARY → SUPPORTING
    // CONDITIONAL → MIXED, NEUTRAL → NEUTRAL
    const mappedRelevance: string = (() => {
      switch (relevance.relevance) {
        case 'PRIMARY':
          return 'PRIMARY';
        case 'SUPPORTING':
        case 'SECONDARY':
          return 'SUPPORTING';
        case 'CONDITIONAL':
          return 'MIXED';
        case 'NEUTRAL':
          return 'NEUTRAL';
        default:
          return 'UNAVAILABLE';
      }
    })();

    // Order: UNAVAILABLE < NEUTRAL < MIXED < SUPPORTING < PRIMARY
    if (mappedRelevance === 'NEUTRAL') {
      return 'NEUTRAL';
    }
    if (mappedRelevance === 'MIXED') {
      hasMixed = true;
    }
    if (mappedRelevance === 'SUPPORTING' && lowest === 'PRIMARY') {
      lowest = 'SUPPORTING';
    }
  }

  if (!hasData) {
    return 'UNAVAILABLE';
  }

  if (hasUnavailable) {
    return 'UNAVAILABLE';
  }

  if (hasMixed) {
    return 'MIXED';
  }

  return lowest;
}
