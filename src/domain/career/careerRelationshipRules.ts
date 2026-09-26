/**
 * Canonical Career Relationship Rules
 *
 * This module is the single canonical source of truth for career house relationship
 * relevance, effect, and strength rules. Both C4 (careerHouseRelationshipSemantics) and
 * C7 (careerLordRelationshipSemantics) delegate to these functions to ensure rule
 * consistency across the Career pipeline.
 *
 * If a rule changes (e.g., "10 + 11 → SUPPORT"), it changes in exactly one place here,
 * and both C4 structural evidence and C7 output reflect the change.
 */

import type { CareerHouseRelationshipType } from './careerHouseRelationship';
import { classifyCareerHouse } from './careerTypes';

export type CareerRelationshipRelevance =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerRelationshipEffect =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerRelationshipSemanticStrength =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK';

const CAREER_RELATIONSHIP_STRENGTH: Readonly<
  Record<CareerHouseRelationshipType, CareerRelationshipSemanticStrength>
> = Object.freeze({
  EXCHANGE: 'STRONG',
  COMMON_LORD: 'STRONG',
  LORD_IN_HOUSE: 'MODERATE',
  LORD_CONJUNCTION: 'MODERATE',
  LORD_ASPECT: 'MODERATE',
  HOUSE_ASPECT: 'WEAK'
});

/**
 * Resolves the career relevance of a relationship between two houses.
 *
 * Relevance is determined by the career classification of the houses:
 * - PRIMARY: if either house is a PRIMARY career house (10)
 * - MIXED: if one house is SUPPORTING and the other is CHALLENGING
 * - CHALLENGING: if both houses are CHALLENGING
 * - SUPPORTING: if both houses are SUPPORTING
 * - NEUTRAL: otherwise
 */
export function resolveRelationshipRelevance(
  houseA: number,
  houseB: number
): CareerRelationshipRelevance {
  const relevanceA = classifyCareerHouse(houseA);
  const relevanceB = classifyCareerHouse(houseB);

  if (relevanceA === 'PRIMARY' || relevanceB === 'PRIMARY') {
    return 'PRIMARY';
  }

  if (
    (relevanceA === 'SUPPORTING' && relevanceB === 'CHALLENGING') ||
    (relevanceA === 'CHALLENGING' && relevanceB === 'SUPPORTING')
  ) {
    return 'MIXED';
  }

  if (relevanceA === 'CHALLENGING' && relevanceB === 'CHALLENGING') {
    return 'CHALLENGING';
  }

  if (relevanceA === 'SUPPORTING' && relevanceB === 'SUPPORTING') {
    return 'SUPPORTING';
  }

  return 'NEUTRAL';
}

/**
 * Resolves the effect of a relationship between two houses.
 *
 * Effect is determined by the career classification of the houses:
 * - SUPPORT: PRIMARY + SUPPORTING, or SUPPORTING + SUPPORTING
 * - CHALLENGE: PRIMARY + CHALLENGING, or CHALLENGING + CHALLENGING
 * - MIXED: SUPPORTING + CHALLENGING
 * - NEUTRAL: otherwise
 */
export function resolveRelationshipEffect(
  houseA: number,
  houseB: number
): CareerRelationshipEffect {
  const relevanceA = classifyCareerHouse(houseA);
  const relevanceB = classifyCareerHouse(houseB);

  if (
    (relevanceA === 'PRIMARY' && relevanceB === 'SUPPORTING') ||
    (relevanceB === 'PRIMARY' && relevanceA === 'SUPPORTING')
  ) {
    return 'SUPPORT';
  }

  if (
    (relevanceA === 'PRIMARY' && relevanceB === 'CHALLENGING') ||
    (relevanceB === 'PRIMARY' && relevanceA === 'CHALLENGING')
  ) {
    return 'CHALLENGE';
  }

  if (relevanceA === 'SUPPORTING' && relevanceB === 'SUPPORTING') {
    return 'SUPPORT';
  }

  if (relevanceA === 'CHALLENGING' && relevanceB === 'CHALLENGING') {
    return 'CHALLENGE';
  }

  if (
    (relevanceA === 'SUPPORTING' && relevanceB === 'CHALLENGING') ||
    (relevanceA === 'CHALLENGING' && relevanceB === 'SUPPORTING')
  ) {
    return 'MIXED';
  }

  return 'NEUTRAL';
}

/**
 * Resolves the semantic strength of a relationship based on its type.
 *
 * Strength mapping:
 * - STRONG: EXCHANGE, COMMON_LORD
 * - MODERATE: LORD_IN_HOUSE, LORD_CONJUNCTION, LORD_ASPECT
 * - WEAK: HOUSE_ASPECT
 */
export function resolveRelationshipStrength(
  relationshipType: CareerHouseRelationshipType
): CareerRelationshipSemanticStrength {
  return CAREER_RELATIONSHIP_STRENGTH[relationshipType];
}
