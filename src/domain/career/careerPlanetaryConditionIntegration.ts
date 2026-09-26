import type { Horoscope, PlanetFact, DignityStatus, PlanetMotion, PlanetStateCondition } from '../../types';
import { Planet } from '../../types';

import { isNaturalBenefic } from '../../engine/planetaryStrength/drikBala';

import type {
  CareerPlanetaryRelevance
} from './careerPlanetaryRelevance';

import {
  interpretCareerPlanetaryConditionBatch,
  type CareerPlanetaryConditionContext,
  type CareerPlanetaryConditionResult,
  type CareerPlanetaryDignity,
  type CareerPlanetaryAffliction,
  type CareerPlanetaryMotion,
  type CareerPlanetaryCombustion
} from './careerPlanetaryCondition';

export interface CareerPlanetaryConditionIntegrationInput {
  readonly horoscope: Horoscope;
  readonly relevance: readonly CareerPlanetaryRelevance[];
}

const CANONICAL_PLANET_ORDER: readonly Planet[] = Object.freeze([
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
 * Maps engine DignityStatus to C6 CareerPlanetaryDignity.
 * IMPORTANT: MOOLATRIKONA maps to OWN_SIGN for compatibility — C6 has no MOOLATRIKONA vocabulary.
 * This must not introduce a parallel enum; it's a compatibility mapping only.
 */
function mapCareerDignity(status: DignityStatus): CareerPlanetaryDignity {
  switch (status) {
    case 'EXALTED':
      return 'EXALTED';
    case 'MOOLATRIKONA':
      return 'OWN_SIGN'; // Compatibility mapping — C6 has no MOOLATRIKONA vocabulary
    case 'OWN_SIGN':
      return 'OWN_SIGN';
    case 'GREAT_FRIEND_SIGN':
    case 'FRIEND_SIGN':
      return 'FRIENDLY_SIGN';
    case 'NEUTRAL':
    case 'NEUTRAL_SIGN':
      return 'NEUTRAL_SIGN';
    case 'ENEMY_SIGN':
    case 'GREAT_ENEMY_SIGN':
      return 'ENEMY_SIGN';
    case 'DEBILITATED':
      return 'DEBILITATED';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Maps engine PlanetMotion to C6 CareerPlanetaryMotion.
 * PlanetMotion is stored as an object with retrograde/stationary booleans on both
 * planetFact.state.motion and planetFact.position.motion.
 */
function mapCareerMotion(motion: PlanetMotion): CareerPlanetaryMotion {
  if (motion.stationary) {
    return 'STATIONARY';
  }
  if (motion.retrograde) {
    return 'RETROGRADE';
  }
  return 'DIRECT';
}

/**
 * Maps engine PlanetStateCondition to C6 CareerPlanetaryCombustion.
 * Combustion is stored on state.condition (PlanetStateCondition.COMBUST/DEEP_COMBUST/NORMAL).
 * DEEP_COMBUST collapses to COMBUST since C6 has no deep-combust category.
 */
function mapCareerCombustion(condition: PlanetStateCondition): CareerPlanetaryCombustion {
  switch (condition) {
    case 'COMBUST':
    case 'DEEP_COMBUST':
    case 'DEEPLY_COMBUST':
      return 'COMBUST';
    case 'NORMAL':
      return 'NOT_COMBUST';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * Maps planetFact to C6 CareerPlanetaryAffliction.
 * The engine exposes no canonical standalone affliction fact.
 * Missing evidence is not negative evidence — do NOT synthesize affliction from dignity/combustion.
 */
function mapCareerAffliction(planetFact: PlanetFact | undefined): CareerPlanetaryAffliction {
  if (!planetFact) {
    return 'UNAVAILABLE';
  }
  return 'NONE';
}

/**
 * Narrow local type for aspect data at the engine boundary.
 * Keeps the `any` contamination localized; do not use bare `any[]`.
 */
interface CareerConditionAspect {
  readonly sourcePlanet?: Planet;
  readonly aspectingPlanet?: Planet;
  readonly targetPlanet?: Planet;
  readonly target?: Planet;
}

/**
 * Reads natal aspects from the horoscope.
 * Uses natalGrahaDrishti.aspects with grahaDrishti.aspects as fallback.
 */
function getNatalAspects(horoscope: Horoscope): readonly CareerConditionAspect[] {
  const aspects = horoscope.natalGrahaDrishti?.aspects ?? horoscope.grahaDrishti?.aspects ?? [];
  return aspects as CareerConditionAspect[];
}

/**
 * Resolves aspect influence for a target planet.
 * For each aspect where targetPlanet === planet, checks if the source is a natural benefic.
 */
function resolveAspectInfluence(
  horoscope: Horoscope,
  planet: Planet
): { beneficSupport: boolean; maleficPressure: boolean } {
  const aspects = getNatalAspects(horoscope);
  let beneficSupport = false;
  let maleficPressure = false;

  for (const aspect of aspects) {
    const target = aspect.targetPlanet ?? aspect.target;
    if (target !== planet) {
      continue;
    }

    const source = aspect.sourcePlanet ?? aspect.aspectingPlanet;
    if (!source) {
      continue;
    }

    if (isNaturalBenefic(source, horoscope.planetFacts)) {
      beneficSupport = true;
    } else {
      maleficPressure = true;
    }
  }

  return { beneficSupport, maleficPressure };
}

/**
 * Builds a CareerPlanetaryConditionContext for a single planet.
 * If planetFact is missing, returns a frozen context with all UNAVAILABLE/UNKNOWN and dataAvailable=false.
 */
function buildCareerPlanetaryConditionContext(
  horoscope: Horoscope,
  relevanceItem: CareerPlanetaryRelevance
): CareerPlanetaryConditionContext {
  const planet = relevanceItem.planet;
  const planetFact = horoscope.planetFacts[planet];

  if (!planetFact) {
    return Object.freeze({
      planet,
      relevance: relevanceItem.relevance,
      dignity: 'UNAVAILABLE',
      affliction: 'UNAVAILABLE',
      motion: 'UNKNOWN',
      combustion: 'UNAVAILABLE',
      beneficSupport: false,
      maleficPressure: false,
      dataAvailable: false
    });
  }

  const dignity = mapCareerDignity(planetFact.dignity.status);
  const affliction = mapCareerAffliction(planetFact);
  const motion = mapCareerMotion(planetFact.state.motion);
  const combustion = mapCareerCombustion(planetFact.state.condition);
  const { beneficSupport, maleficPressure } = resolveAspectInfluence(horoscope, planet);

  const dataAvailable =
    dignity !== 'UNAVAILABLE' &&
    affliction !== 'UNAVAILABLE' &&
    motion !== 'UNKNOWN' &&
    combustion !== 'UNAVAILABLE';

  return Object.freeze({
    planet,
    relevance: relevanceItem.relevance,
    dignity,
    affliction,
    motion,
    combustion,
    beneficSupport,
    maleficPressure,
    dataAvailable
  });
}

/**
 * Builds CareerPlanetaryConditionContexts for all 9 planets in canonical order.
 * For planets missing from C5 relevance, emits a NEUTRAL/UNAVAILABLE frozen context.
 * This guarantees deterministic canonical ordering regardless of input order.
 */
function buildCareerPlanetaryConditionContexts(
  input: CareerPlanetaryConditionIntegrationInput
): readonly CareerPlanetaryConditionContext[] {
  const { horoscope, relevance } = input;
  const relevanceByPlanet = new Map<Planet, CareerPlanetaryRelevance>();

  for (const item of relevance) {
    relevanceByPlanet.set(item.planet, item);
  }

  const contexts: CareerPlanetaryConditionContext[] = [];

  for (const planet of CANONICAL_PLANET_ORDER) {
    const relevanceItem = relevanceByPlanet.get(planet);

    if (!relevanceItem) {
      // Planet missing from C5 relevance → emit NEUTRAL/UNAVAILABLE context
      contexts.push(
        Object.freeze({
          planet,
          relevance: 'NEUTRAL',
          dignity: 'UNAVAILABLE',
          affliction: 'UNAVAILABLE',
          motion: 'UNKNOWN',
          combustion: 'UNAVAILABLE',
          beneficSupport: false,
          maleficPressure: false,
          dataAvailable: false
        })
      );
    } else {
      contexts.push(buildCareerPlanetaryConditionContext(horoscope, relevanceItem));
    }
  }

  return Object.freeze(contexts);
}

/**
 * Main integration function: builds condition contexts and delegates to C6 semantic engine.
 */
export function buildCareerPlanetaryCondition(
  input: CareerPlanetaryConditionIntegrationInput
): readonly CareerPlanetaryConditionResult[] {
  const contexts = buildCareerPlanetaryConditionContexts(input);
  return interpretCareerPlanetaryConditionBatch(contexts);
}
