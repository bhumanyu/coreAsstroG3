import type { Planet } from '../../types';

import {
  CAREER_CHALLENGING_HOUSES,
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES
} from './careerTypes';

import type {
  CareerHouseRelationship,
  CareerHouseRelationshipType
} from './careerHouseRelationship';

import {
  careerHouseRelationshipKey
} from './careerHouseRelationship';

export type CareerLordRelationshipEffect =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerLordRelationshipRelevance =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerLordRelationshipSemanticStrength =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK';

export interface CareerLordRelationshipSemantic {
  readonly relationship: CareerHouseRelationship;
  readonly relationshipType: CareerHouseRelationshipType;
  readonly lordA?: Planet;
  readonly lordB?: Planet;
  readonly relevance: CareerLordRelationshipRelevance;
  readonly effect: CareerLordRelationshipEffect;
  readonly strength: CareerLordRelationshipSemanticStrength;
  readonly conditional: boolean;
  readonly statement: string;
}

const CAREER_LORD_RELATIONSHIP_STRENGTH: Readonly<
  Record<
    CareerHouseRelationshipType,
    CareerLordRelationshipSemanticStrength
  >
> = Object.freeze({
  EXCHANGE: 'STRONG',
  COMMON_LORD: 'STRONG',
  LORD_IN_HOUSE: 'MODERATE',
  LORD_CONJUNCTION: 'MODERATE',
  LORD_ASPECT: 'MODERATE',
  HOUSE_ASPECT: 'WEAK'
});

function classifyCareerHouse(
  house: number
): CareerLordRelationshipRelevance {
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
): CareerLordRelationshipRelevance {
  const relevanceA = classifyCareerHouse(houseA);
  const relevanceB = classifyCareerHouse(houseB);

  if (
    relevanceA === 'PRIMARY' ||
    relevanceB === 'PRIMARY'
  ) {
    return 'PRIMARY';
  }

  if (
    (relevanceA === 'SUPPORTING' &&
      relevanceB === 'CHALLENGING') ||
    (relevanceA === 'CHALLENGING' &&
      relevanceB === 'SUPPORTING')
  ) {
    return 'MIXED';
  }

  if (
    relevanceA === 'CHALLENGING' &&
    relevanceB === 'CHALLENGING'
  ) {
    return 'CHALLENGING';
  }

  if (
    relevanceA === 'SUPPORTING' &&
    relevanceB === 'SUPPORTING'
  ) {
    return 'SUPPORTING';
  }

  return 'NEUTRAL';
}

function resolveEffect(
  houseA: number,
  houseB: number
): CareerLordRelationshipEffect {
  const relevanceA = classifyCareerHouse(houseA);
  const relevanceB = classifyCareerHouse(houseB);

  if (
    (relevanceA === 'PRIMARY' &&
      relevanceB === 'SUPPORTING') ||
    (relevanceB === 'PRIMARY' &&
      relevanceA === 'SUPPORTING')
  ) {
    return 'SUPPORT';
  }

  if (
    (relevanceA === 'PRIMARY' &&
      relevanceB === 'CHALLENGING') ||
    (relevanceB === 'PRIMARY' &&
      relevanceA === 'CHALLENGING')
  ) {
    return 'CHALLENGE';
  }

  if (
    relevanceA === 'SUPPORTING' &&
    relevanceB === 'SUPPORTING'
  ) {
    return 'SUPPORT';
  }

  if (
    relevanceA === 'CHALLENGING' &&
    relevanceB === 'CHALLENGING'
  ) {
    return 'CHALLENGE';
  }

  if (
    (relevanceA === 'SUPPORTING' &&
      relevanceB === 'CHALLENGING') ||
    (relevanceA === 'CHALLENGING' &&
      relevanceB === 'SUPPORTING')
  ) {
    return 'MIXED';
  }

  return 'NEUTRAL';
}

function resolveStrength(
  relationshipType: CareerHouseRelationshipType
): CareerLordRelationshipSemanticStrength {
  return CAREER_LORD_RELATIONSHIP_STRENGTH[
    relationshipType
  ];
}

function createStatement(
  relationship: CareerHouseRelationship,
  relevance: CareerLordRelationshipRelevance,
  effect: CareerLordRelationshipEffect
): string {
  return [
    `Career lord relationship between houses ${relationship.houseA} and ${relationship.houseB}.`,
    relationship.reason,
    `Career relevance: ${relevance}.`,
    `Effect: ${effect}.`
  ].join(' ');
}

function deduplicateRelationships(
  relationships: readonly CareerHouseRelationship[]
): readonly CareerHouseRelationship[] {
  const unique = new Map<
    string,
    CareerHouseRelationship
  >();

  for (const relationship of relationships) {
    const key =
      careerHouseRelationshipKey(relationship);

    if (!unique.has(key)) {
      unique.set(key, relationship);
    }
  }

  return Object.freeze(
    Array.from(unique.values())
  );
}

export function interpretCareerLordRelationship(
  relationship: CareerHouseRelationship
): CareerLordRelationshipSemantic {
  const relevance = resolveRelevance(
    relationship.houseA,
    relationship.houseB
  );

  const effect = resolveEffect(
    relationship.houseA,
    relationship.houseB
  );

  const strength = resolveStrength(
    relationship.type
  );

  return Object.freeze({
    relationship,
    relationshipType: relationship.type,
    lordA: relationship.lordA,
    lordB: relationship.lordB,
    relevance,
    effect,
    strength,
    conditional: false,
    statement: createStatement(
      relationship,
      relevance,
      effect
    )
  });
}

export function interpretCareerLordRelationships(
  relationships: readonly CareerHouseRelationship[]
): readonly CareerLordRelationshipSemantic[] {
  const uniqueRelationships =
    deduplicateRelationships(relationships);

  return Object.freeze(
    uniqueRelationships.map(
      interpretCareerLordRelationship
    )
  );
}
