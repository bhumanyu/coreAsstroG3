import { Planet } from '../../types';

import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES
} from './careerTypes';

export type CareerPlanetRelevance =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'SECONDARY'
  | 'CONDITIONAL'
  | 'NEUTRAL';

export type CareerPlanetRole =
  | 'CAREER_LORD'
  | 'SUPPORTING_LORD'
  | 'CHALLENGING_LORD'
  | 'HOUSE_OCCUPANT'
  | 'HOUSE_ASPECTOR'
  | 'RELATIONSHIP_PARTICIPANT'
  | 'YOGA_PARTICIPANT'
  | 'NATURAL_KARAKA';

export type CareerPlanetRelevanceReason =
  | 'PRIMARY_LORDSHIP'
  | 'SUPPORTING_LORDSHIP'
  | 'CHALLENGING_LORDSHIP'
  | 'CAREER_HOUSE_OCCUPANCY'
  | 'CAREER_HOUSE_ASPECT'
  | 'CAREER_RELATIONSHIP'
  | 'CAREER_YOGA'
  | 'NATURAL_KARAKA'
  | 'EXPLICIT_RULE';

export type CareerPlanetEffect =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL';

export type CareerExpressionHint =
  | 'LEADERSHIP'
  | 'MANAGEMENT'
  | 'TECHNICAL'
  | 'COMMUNICATION'
  | 'ENTERPRISE'
  | 'SERVICE'
  | 'AUTHORITY';

export interface CareerPlanetaryRelevance {
  readonly planet: Planet;
  readonly relevance: CareerPlanetRelevance;
  readonly roles: readonly CareerPlanetRole[];
  readonly reasons: readonly CareerPlanetRelevanceReason[];
  readonly effect: CareerPlanetEffect;
  readonly expressionHints: readonly CareerExpressionHint[];
  readonly relatedHouses: readonly number[];
  readonly relatedPlanets: readonly Planet[];
  readonly conditional: boolean;
  readonly statement: string;
}

export interface CareerPlanetaryRelevanceContext {
  readonly planet: Planet;
  readonly ruledHouses: readonly number[];
  readonly occupiedHouse?: number;
  readonly aspectsCareerHouse: readonly number[];
  readonly careerRelationshipPlanets: readonly Planet[];
  readonly careerYogaParticipation: boolean;
  // Authoritative upstream-methodology override that is OR-combined with
  // CAREER_NATURAL_KARAKAS; either source independently marks the planet as a NATURAL_KARAKA.
  readonly naturalCareerKaraka: boolean;
  readonly explicitCareerRelevant: boolean;
}

// Built-in canonical karaka set. The naturalCareerKaraka boolean is an authoritative
// upstream-methodology override that is OR-combined with this set, so either source
// independently marks the planet as a NATURAL_KARAKA.
const CAREER_NATURAL_KARAKAS: ReadonlySet<Planet> = new Set([Planet.SATURN]);

function deduplicate<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

function classifyLordship(ruledHouses: readonly number[]): CareerPlanetRole[] {
  const roles: CareerPlanetRole[] = [];

  for (const house of ruledHouses) {
    if (CAREER_PRIMARY_HOUSES.has(house)) {
      roles.push('CAREER_LORD');
    } else if (CAREER_SUPPORTING_HOUSES.has(house)) {
      roles.push('SUPPORTING_LORD');
    } else if (CAREER_CHALLENGING_HOUSES.has(house)) {
      roles.push('CHALLENGING_LORD');
    }
  }

  return roles;
}

function resolveRelevance(
  roles: readonly CareerPlanetRole[],
  reasons: readonly CareerPlanetRelevanceReason[]
): CareerPlanetRelevance {
  if (roles.includes('CAREER_LORD')) {
    return 'PRIMARY';
  }

  if (
    roles.includes('SUPPORTING_LORD') ||
    roles.includes('CHALLENGING_LORD') ||
    roles.includes('HOUSE_OCCUPANT') ||
    roles.includes('HOUSE_ASPECTOR') ||
    roles.includes('RELATIONSHIP_PARTICIPANT')
  ) {
    return 'SUPPORTING';
  }

  if (reasons.includes('CAREER_YOGA') || reasons.includes('EXPLICIT_RULE')) {
    return 'CONDITIONAL';
  }

  if (roles.includes('NATURAL_KARAKA')) {
    return 'SECONDARY';
  }

  return 'NEUTRAL';
}

function resolveEffect(
  ruledHouses: readonly number[],
  occupiedHouse?: number
): CareerPlanetEffect {
  const allHouses = [...ruledHouses];
  if (occupiedHouse !== undefined) {
    allHouses.push(occupiedHouse);
  }

  const hasPrimary = allHouses.some(h => CAREER_PRIMARY_HOUSES.has(h));
  const hasSupporting = allHouses.some(h => CAREER_SUPPORTING_HOUSES.has(h));
  const hasChallenging = allHouses.some(h => CAREER_CHALLENGING_HOUSES.has(h));

  if (hasPrimary && hasSupporting && !hasChallenging) {
    return 'SUPPORT';
  }

  if (hasPrimary && hasChallenging && !hasSupporting) {
    return 'CHALLENGE';
  }

  if (hasSupporting && hasChallenging && !hasPrimary) {
    return 'MIXED';
  }

  if (hasSupporting && !hasPrimary && !hasChallenging) {
    return 'SUPPORT';
  }

  if (hasChallenging && !hasPrimary && !hasSupporting) {
    return 'CHALLENGE';
  }

  if (hasPrimary && !hasSupporting && !hasChallenging) {
    return 'SUPPORT';
  }

  return 'NEUTRAL';
}

function resolveExpressionHints(planet: Planet): readonly CareerExpressionHint[] {
  switch (planet) {
    case Planet.SATURN:
      return Object.freeze(['MANAGEMENT', 'SERVICE', 'AUTHORITY']);
    case Planet.MERCURY:
      return Object.freeze(['TECHNICAL', 'COMMUNICATION']);
    case Planet.MARS:
      return Object.freeze(['LEADERSHIP', 'ENTERPRISE']);
    case Planet.SUN:
      return Object.freeze(['LEADERSHIP', 'AUTHORITY']);
    case Planet.JUPITER:
      return Object.freeze(['MANAGEMENT', 'ENTERPRISE']);
    default:
      return Object.freeze([]);
  }
}

function createStatement(
  planet: Planet,
  relevance: CareerPlanetRelevance,
  roles: readonly CareerPlanetRole[],
  reasons: readonly CareerPlanetRelevanceReason[],
  effect: CareerPlanetEffect,
  expressionHints: readonly CareerExpressionHint[],
  relatedHouses: readonly number[],
  relatedPlanets: readonly Planet[]
): string {
  const parts: string[] = [
    `Planet ${planet} has ${relevance.toLowerCase()} career relevance.`,
    `Roles: ${roles.join(', ')}.`,
    `Reasons: ${reasons.join(', ')}.`,
    `Effect: ${effect.toLowerCase()}.`
  ];

  if (expressionHints.length > 0) {
    parts.push(`Expression hints: ${expressionHints.join(', ')}.`);
  }

  if (relatedHouses.length > 0) {
    parts.push(`Related houses: ${relatedHouses.join(', ')}.`);
  }

  if (relatedPlanets.length > 0) {
    parts.push(`Related planets: ${relatedPlanets.join(', ')}.`);
  }

  return parts.join(' ');
}

export function interpretCareerPlanetaryRelevance(
  context: CareerPlanetaryRelevanceContext
): CareerPlanetaryRelevance {
  const { planet, ruledHouses, occupiedHouse, aspectsCareerHouse, careerRelationshipPlanets, careerYogaParticipation, naturalCareerKaraka, explicitCareerRelevant } = context;

  const roles: CareerPlanetRole[] = [];
  const reasons: CareerPlanetRelevanceReason[] = [];
  const relatedHouses: number[] = [];

  const lordshipRoles = classifyLordship(ruledHouses);
  roles.push(...lordshipRoles);
  relatedHouses.push(...ruledHouses);

  if (lordshipRoles.includes('CAREER_LORD')) {
    reasons.push('PRIMARY_LORDSHIP');
  }
  if (lordshipRoles.includes('SUPPORTING_LORD')) {
    reasons.push('SUPPORTING_LORDSHIP');
  }
  if (lordshipRoles.includes('CHALLENGING_LORD')) {
    reasons.push('CHALLENGING_LORDSHIP');
  }

  if (occupiedHouse !== undefined) {
    if (
      CAREER_PRIMARY_HOUSES.has(occupiedHouse) ||
      CAREER_SUPPORTING_HOUSES.has(occupiedHouse) ||
      CAREER_CHALLENGING_HOUSES.has(occupiedHouse)
    ) {
      roles.push('HOUSE_OCCUPANT');
      reasons.push('CAREER_HOUSE_OCCUPANCY');
      relatedHouses.push(occupiedHouse);
    }
  }

  const careerAspectHouses = aspectsCareerHouse.filter(
    (house) =>
      CAREER_PRIMARY_HOUSES.has(house) ||
      CAREER_SUPPORTING_HOUSES.has(house) ||
      CAREER_CHALLENGING_HOUSES.has(house)
  );
  if (careerAspectHouses.length > 0) {
    roles.push('HOUSE_ASPECTOR');
    reasons.push('CAREER_HOUSE_ASPECT');
    relatedHouses.push(...careerAspectHouses);
  }

  if (careerRelationshipPlanets.length > 0) {
    roles.push('RELATIONSHIP_PARTICIPANT');
    reasons.push('CAREER_RELATIONSHIP');
  }

  if (careerYogaParticipation) {
    roles.push('YOGA_PARTICIPANT');
    reasons.push('CAREER_YOGA');
  }

  if (naturalCareerKaraka || CAREER_NATURAL_KARAKAS.has(planet)) {
    roles.push('NATURAL_KARAKA');
    reasons.push('NATURAL_KARAKA');
  }

  // TODO: A later evidence/provenance layer should carry the originating rule id
  // so EXPLICIT_RULE evidence is traceable.
  if (explicitCareerRelevant) {
    reasons.push('EXPLICIT_RULE');
  }

  const deduplicatedRoles = deduplicate(roles);
  const deduplicatedReasons = deduplicate(reasons);
  const deduplicatedRelatedHouses = deduplicate(relatedHouses);
  const deduplicatedRelatedPlanets = deduplicate(careerRelationshipPlanets);

  const relevance = resolveRelevance(deduplicatedRoles, deduplicatedReasons);
  const effect = resolveEffect(ruledHouses, occupiedHouse);
  const expressionHints = resolveExpressionHints(planet);

  const statement = createStatement(
    planet,
    relevance,
    deduplicatedRoles,
    deduplicatedReasons,
    effect,
    expressionHints,
    deduplicatedRelatedHouses,
    deduplicatedRelatedPlanets
  );

  return Object.freeze({
    planet,
    relevance,
    roles: Object.freeze(deduplicatedRoles),
    reasons: Object.freeze(deduplicatedReasons),
    effect,
    expressionHints,
    relatedHouses: Object.freeze(deduplicatedRelatedHouses),
    relatedPlanets: Object.freeze(deduplicatedRelatedPlanets),
    conditional: relevance === 'CONDITIONAL',
    statement
  });
}

export function interpretCareerPlanetaryRelevanceBatch(
  contexts: readonly CareerPlanetaryRelevanceContext[]
): readonly CareerPlanetaryRelevance[] {
  return Object.freeze(
    contexts.map(interpretCareerPlanetaryRelevance)
  );
}
