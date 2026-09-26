import type {
  CareerHouseRelationship,
  CareerHouseRelationshipType
} from './careerHouseRelationship';

import {
  resolveRelationshipRelevance,
  resolveRelationshipEffect,
  resolveRelationshipStrength
} from './careerRelationshipRules';

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

function resolveRelevance(
  houseA: number,
  houseB: number
): CareerHouseRelationshipRelevance {
  return resolveRelationshipRelevance(houseA, houseB) as CareerHouseRelationshipRelevance;
}

function resolveEffect(
  houseA: number,
  houseB: number
): CareerHouseRelationshipEffect {
  return resolveRelationshipEffect(houseA, houseB) as CareerHouseRelationshipEffect;
}

function resolveStrength(
  relationship: CareerHouseRelationship
): CareerHouseRelationshipSemanticStrength {
  return resolveRelationshipStrength(relationship.type) as CareerHouseRelationshipSemanticStrength;
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
