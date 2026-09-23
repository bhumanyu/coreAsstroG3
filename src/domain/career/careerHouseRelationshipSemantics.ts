import type {
  CareerHouseRelationship,
  CareerHouseRelationshipType
} from './careerHouseRelationship';

import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES
} from './careerTypes';

export type CareerHouseRelationshipEffect =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerHouseRelationshipRelevance =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerHouseRelationshipSemanticStrength =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK';

export interface CareerHouseRelationshipSemantic {
  readonly relationship: CareerHouseRelationship;
  readonly relationshipType: CareerHouseRelationshipType;
  readonly relevance: CareerHouseRelationshipRelevance;
  readonly effect: CareerHouseRelationshipEffect;
  /**
   * Structural semantic strength of the relationship itself.
   *
   * This is not Career domain strength and must not be used
   * as a final Career score or conclusion.
   */
  readonly strength: CareerHouseRelationshipSemanticStrength;
  readonly conditional: boolean;
  readonly statement: string;
}

type CareerHouseCategory =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'NEUTRAL';

function classifyCareerHouse(
  house: number
): CareerHouseCategory {
  if (CAREER_PRIMARY_HOUSES.has(house)) {
    return 'PRIMARY';
  }

  if (CAREER_SUPPORTING_HOUSES.has(house)) {
    return 'SUPPORTING';
  }

  if (CAREER_CHALLENGING_HOUSES.has(house)) {
    return 'CHALLENGING';
  }

  return 'NEUTRAL';
}

function resolveRelevance(
  houseA: number,
  houseB: number
): CareerHouseRelationshipRelevance {
  const categoryA = classifyCareerHouse(houseA);
  const categoryB = classifyCareerHouse(houseB);

  const categories = new Set([
    categoryA,
    categoryB
  ]);

  if (categories.has('PRIMARY')) {
    return 'PRIMARY';
  }

  if (
    categoryA === 'SUPPORTING' &&
    categoryB === 'CHALLENGING'
  ) {
    return 'MIXED';
  }

  if (
    categoryA === 'CHALLENGING' &&
    categoryB === 'SUPPORTING'
  ) {
    return 'MIXED';
  }

  if (
    categoryA === 'CHALLENGING' &&
    categoryB === 'CHALLENGING'
  ) {
    return 'CHALLENGING';
  }

  if (
    categoryA === 'SUPPORTING' &&
    categoryB === 'SUPPORTING'
  ) {
    return 'SUPPORTING';
  }

  return 'NEUTRAL';
}

function resolveEffect(
  houseA: number,
  houseB: number
): CareerHouseRelationshipEffect {
  const categoryA = classifyCareerHouse(houseA);
  const categoryB = classifyCareerHouse(houseB);

  const categories = new Set([
    categoryA,
    categoryB
  ]);

  if (categories.has('PRIMARY')) {
    if (categories.has('CHALLENGING')) {
      return 'CHALLENGE';
    }

    if (categories.has('SUPPORTING')) {
      return 'SUPPORT';
    }

    return 'NEUTRAL';
  }

  if (
    categoryA === 'SUPPORTING' &&
    categoryB === 'SUPPORTING'
  ) {
    return 'SUPPORT';
  }

  if (
    categoryA === 'CHALLENGING' &&
    categoryB === 'CHALLENGING'
  ) {
    return 'CHALLENGE';
  }

  if (
    categoryA === 'SUPPORTING' &&
    categoryB === 'CHALLENGING'
  ) {
    return 'MIXED';
  }

  if (
    categoryA === 'CHALLENGING' &&
    categoryB === 'SUPPORTING'
  ) {
    return 'MIXED';
  }

  return 'NEUTRAL';
}

function resolveStrength(
  relationship: CareerHouseRelationship
): CareerHouseRelationshipSemanticStrength {
  switch (relationship.type) {
    case 'EXCHANGE':
    case 'COMMON_LORD':
      return 'STRONG';

    case 'LORD_IN_HOUSE':
    case 'LORD_CONJUNCTION':
    case 'LORD_ASPECT':
      return 'MODERATE';

    case 'HOUSE_ASPECT':
      return 'WEAK';

    default:
      return 'WEAK';
  }
}

function resolveConditional(
  _relationship: CareerHouseRelationship
): boolean {
  return false;
}

function createSemanticStatement(
  relationship: CareerHouseRelationship,
  relevance: CareerHouseRelationshipRelevance,
  effect: CareerHouseRelationshipEffect
): string {
  return [
    `Career relationship between houses ${relationship.houseA} and ${relationship.houseB}.`,
    relationship.reason,
    `Career relevance: ${relevance}.`,
    `Effect: ${effect}.`
  ].join(' ');
}

export function interpretCareerHouseRelationship(
  relationship: CareerHouseRelationship
): CareerHouseRelationshipSemantic {
  const relevance = resolveRelevance(
    relationship.houseA,
    relationship.houseB
  );

  const effect = resolveEffect(
    relationship.houseA,
    relationship.houseB
  );

  const strength = resolveStrength(
    relationship
  );

  const conditional = resolveConditional(
    relationship
  );

  const statement = createSemanticStatement(
    relationship,
    relevance,
    effect
  );

  return Object.freeze({
    relationship,
    relationshipType: relationship.type,
    relevance,
    effect,
    strength,
    conditional,
    statement
  });
}

export function interpretCareerHouseRelationships(
  relationships: readonly CareerHouseRelationship[]
): readonly CareerHouseRelationshipSemantic[] {
  return Object.freeze(
    relationships.map(
      interpretCareerHouseRelationship
    )
  );
}
