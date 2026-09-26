import type { Planet } from '../../types';

import {
  classifyCareerHouse
} from './careerTypes';

import type {
  CareerHouseRelationship,
  CareerHouseRelationshipType
} from './careerHouseRelationship';

import {
  careerHouseRelationshipKey
} from './careerHouseRelationship';

import {
  resolveRelationshipRelevance,
  resolveRelationshipEffect,
  resolveRelationshipStrength
} from './careerRelationshipRules';

export type CareerLordRole =
  | 'PRIMARY_LORD'
  | 'SUPPORTING_LORD'
  | 'CHALLENGING_LORD'
  | 'NEUTRAL_LORD'
  | 'SHARED_LORD';

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
  readonly lordARole: CareerLordRole;
  readonly lordBRole: CareerLordRole;
  readonly relevance: CareerLordRelationshipRelevance;
  readonly effect: CareerLordRelationshipEffect;
  readonly strength: CareerLordRelationshipSemanticStrength;
  readonly conditional: boolean;
  readonly statement: string;
}



function mapHouseDirectionToLordRole(
  direction: 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL'
): CareerLordRole {
  switch (direction) {
    case 'PRIMARY':
      return 'PRIMARY_LORD';
    case 'SUPPORTING':
      return 'SUPPORTING_LORD';
    case 'CHALLENGING':
      return 'CHALLENGING_LORD';
    case 'NEUTRAL':
      return 'NEUTRAL_LORD';
  }
}

function resolveLordRole(
  relationship: CareerHouseRelationship,
  isLordA: boolean
): CareerLordRole {
  if (relationship.type === 'COMMON_LORD') {
    return 'SHARED_LORD';
  }

  const house = isLordA ? relationship.houseA : relationship.houseB;
  const houseDirection = classifyCareerHouse(house);
  return mapHouseDirectionToLordRole(houseDirection);
}

function resolveRelevance(
  houseA: number,
  houseB: number
): CareerLordRelationshipRelevance {
  return resolveRelationshipRelevance(houseA, houseB) as CareerLordRelationshipRelevance;
}

function resolveEffect(
  houseA: number,
  houseB: number
): CareerLordRelationshipEffect {
  return resolveRelationshipEffect(houseA, houseB) as CareerLordRelationshipEffect;
}

function resolveStrength(
  relationshipType: CareerHouseRelationshipType
): CareerLordRelationshipSemanticStrength {
  return resolveRelationshipStrength(relationshipType) as CareerLordRelationshipSemanticStrength;
}

function createStatement(
  relationship: CareerHouseRelationship,
  relevance: CareerLordRelationshipRelevance,
  effect: CareerLordRelationshipEffect,
  lordARole: CareerLordRole,
  lordBRole: CareerLordRole
): string {
  return [
    `Career lord relationship between houses ${relationship.houseA} and ${relationship.houseB}.`,
    relationship.reason,
    `Lord A role: ${lordARole}.`,
    `Lord B role: ${lordBRole}.`,
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
    [...unique.values()].sort((a, b) =>
      careerHouseRelationshipKey(a).localeCompare(careerHouseRelationshipKey(b))
    )
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

  const lordARole = resolveLordRole(relationship, true);
  const lordBRole = resolveLordRole(relationship, false);

  return Object.freeze({
    relationship,
    relationshipType: relationship.type,
    lordA: relationship.lordA,
    lordB: relationship.lordB,
    lordARole,
    lordBRole,
    relevance,
    effect,
    strength,
    conditional: false,
    statement: createStatement(
      relationship,
      relevance,
      effect,
      lordARole,
      lordBRole
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
