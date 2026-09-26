import type {
  CareerNatalAnalysis
} from './careerNatalAnalysis';

import type {
  CareerPlanetaryRelevance
} from './careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from './careerPlanetaryCondition';

import type {
  CareerExpressionContext,
  CareerExpressionPlanetContext
} from './careerExpression';

import {
  resolveCareerExpression
} from './careerExpression';

import {
  Planet
} from '../../types';

/**
 * Input interface for C8 Career Expression integration.
 * Consumes the C4-C7 natal boundary aggregate.
 */
export interface CareerExpressionIntegrationInput {
  readonly natal: CareerNatalAnalysis;
}

/**
 * Canonical planet order for Career expression processing.
 * Matches the 9-planet Vedic system: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
 */
export const CANONICAL_PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
] as const);

/**
 * Builds the CareerExpressionContext from the natal analysis aggregate.
 * 
 * This function:
 * - Builds relevanceByPlanet and conditionByPlanet maps from natal.relevance / natal.condition
 * - Iterates CANONICAL_PLANET_ORDER
 * - Skips planets with no C5 relevance (missing evidence is not negative evidence)
 * - Maps condition?.condition ?? 'UNAVAILABLE' (preserves C6 UNAVAILABLE — does NOT default to WEAK/MODERATE)
 * - Merges relevance.relatedPlanets with condition?.relatedPlanets deduped and sorted by canonical order
 * - Sorts relatedHouses numerically
 * - Returns a frozen CareerExpressionContext mapping natal.structural fields
 * - Freezes all nested arrays and each planet context
 * 
 * @param input - The integration input containing the natal analysis
 * @returns A frozen CareerExpressionContext for expression resolution
 */
export function buildCareerExpressionContext(
  input: CareerExpressionIntegrationInput
): CareerExpressionContext {
  const { natal } = input;

  // Build maps for efficient lookup
  const relevanceByPlanet = new Map<Planet, CareerPlanetaryRelevance>();
  for (const relevance of natal.relevance) {
    relevanceByPlanet.set(relevance.planet, relevance);
  }

  const conditionByPlanet = new Map<Planet, CareerPlanetaryConditionResult>();
  for (const condition of natal.condition) {
    conditionByPlanet.set(condition.planet, condition);
  }

  // Build planet contexts in canonical order
  const relevantPlanets: CareerExpressionPlanetContext[] = [];

  for (const planet of CANONICAL_PLANET_ORDER) {
    const relevance = relevanceByPlanet.get(planet);

    // Skip planets with no C5 relevance (missing evidence is not negative evidence)
    if (!relevance || relevance.relevance === 'NEUTRAL') {
      continue;
    }

    const condition = conditionByPlanet.get(planet);

    // Preserve C6 UNAVAILABLE — do NOT default to WEAK/MODERATE
    const planetCondition = condition?.condition ?? 'UNAVAILABLE';

    // Merge relatedPlanets from relevance and condition, deduped and sorted by canonical order
    const relevanceRelatedPlanets = relevance.relatedPlanets;
    const conditionRelatedPlanets = condition?.relatedPlanets ?? [];
    const mergedRelatedPlanets = Array.from(new Set([...relevanceRelatedPlanets, ...conditionRelatedPlanets]));

    // Sort by canonical order
    const canonicalOrderMap = new Map<Planet, number>();
    CANONICAL_PLANET_ORDER.forEach((p, index) => canonicalOrderMap.set(p, index));
    mergedRelatedPlanets.sort((a, b) => {
      const orderA = canonicalOrderMap.get(a) ?? 999;
      const orderB = canonicalOrderMap.get(b) ?? 999;
      return orderA - orderB;
    });

    // Sort relatedHouses numerically
    const sortedRelatedHouses = Array.from(relevance.relatedHouses).sort((a, b) => a - b);

    // Build planet context
    const planetContext: CareerExpressionPlanetContext = Object.freeze({
      planet,
      relevance: relevance.relevance,
      roles: Object.freeze([...relevance.roles]),
      effect: relevance.effect,
      condition: planetCondition,
      relatedHouses: Object.freeze(sortedRelatedHouses),
      relatedPlanets: Object.freeze(mergedRelatedPlanets)
    });

    relevantPlanets.push(planetContext);
  }

  // Build the expression context with structural fields
  const context: CareerExpressionContext = Object.freeze({
    structuralDirection: natal.structural.direction,
    structuralStrength: natal.structural.strength,
    structuralPrimarySupport: natal.structural.primarySupport,
    structuralPrimaryChallenge: natal.structural.primaryChallenge,
    relevantPlanets: Object.freeze(relevantPlanets)
  });

  return context;
}

/**
 * Builds a Career expression analysis from the natal analysis aggregate.
 * This is a pure adapter that delegates to resolveCareerExpression with the built context.
 * 
 * @param input - The integration input containing the natal analysis
 * @returns A Career expression analysis
 */
export function buildCareerExpression(
  input: CareerExpressionIntegrationInput
) {
  const context = buildCareerExpressionContext(input);
  return resolveCareerExpression(context);
}

/**
 * Builds Career expression analyses for multiple natal analysis inputs.
 * Preserves input order and returns frozen results.
 * 
 * @param inputs - Array of integration inputs
 * @returns Array of Career expression analyses
 */
export function buildCareerExpressions(
  inputs: readonly CareerExpressionIntegrationInput[]
) {
  return Object.freeze(
    inputs.map(buildCareerExpression)
  );
}

/**
 * Returns the canonical planet order used for Career expression processing.
 * 
 * @returns The canonical planet order array
 */
export function getCareerExpressionPlanetOrder(): readonly Planet[] {
  return CANONICAL_PLANET_ORDER;
}
