import type { Horoscope, PlanetFact, DignityStatus, PlanetMotion, PlanetStateCondition } from '../../types';
import { Planet } from '../../types';

import {
  buildPlanetaryInfluenceTrace,
  type PlanetaryInfluenceTrace
} from '../../engine/planetaryInfluence/planetaryInfluenceTrace';

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
function mapCareerDignity(status: DignityStatus | undefined): CareerPlanetaryDignity {
  if (status === undefined) return 'UNAVAILABLE';
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
function mapCareerMotion(motion: PlanetMotion | undefined): CareerPlanetaryMotion {
  if (!motion) return 'UNKNOWN';
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
function mapCareerCombustion(condition: PlanetStateCondition | undefined): CareerPlanetaryCombustion {
  if (condition === undefined) return 'UNAVAILABLE';
  switch (condition) {
    case 'COMBUST':
    case 'DEEP_COMBUST':
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
 * Always returns 'UNAVAILABLE' until a canonical affliction fact source exists.
 */
function mapCareerAffliction(_planetFact: PlanetFact | undefined): CareerPlanetaryAffliction {
  return 'UNAVAILABLE';
}

/**
 * Preserves C6's natural-nature boolean inputs while deriving them from generic
 * aspect provenance. Mixed natural/functional classifications are not collapsed
 * into a new C6 classification.
 */
function resolveAspectInfluence(
  trace: PlanetaryInfluenceTrace | undefined
): { beneficSupport: boolean; maleficPressure: boolean } {
  const sources = [
    ...(trace?.environmentalInfluence.beneficAspectSources ?? []),
    ...(trace?.environmentalInfluence.maleficAspectSources ?? []),
    ...(trace?.environmentalInfluence.mixedAspectSources ?? []),
    ...(trace?.environmentalInfluence.unassessedAspectSources ?? [])
  ];
  return {
    beneficSupport: sources.some((source) => source.naturalNature === 'BENEFIC'),
    maleficPressure: sources.some((source) => source.naturalNature === 'MALEFIC')
  };
}

/**
 * Builds a CareerPlanetaryConditionContext for a single planet.
 * dataAvailable covers engine-sourced dignity, motion, and combustion; affliction is optional.
 * If planetFact is missing, returns a frozen context with all UNAVAILABLE/UNKNOWN and dataAvailable=false.
 */
function buildCareerPlanetaryConditionContext(
  horoscope: Horoscope,
  relevanceItem: CareerPlanetaryRelevance,
  trace: PlanetaryInfluenceTrace | undefined
): CareerPlanetaryConditionContext {
  const planet = relevanceItem.planet;
  const planetFact = horoscope.planetFacts[planet];

  if (!planetFact) {
    const { beneficSupport, maleficPressure } = resolveAspectInfluence(trace);
    return Object.freeze({
      planet,
      relevance: relevanceItem.relevance,
      dignity: 'UNAVAILABLE',
      affliction: 'UNAVAILABLE',
      motion: 'UNKNOWN',
      combustion: 'UNAVAILABLE',
      beneficSupport,
      maleficPressure,
      dataAvailable: false,
      ...(trace ? { planetaryInfluenceTrace: trace } : {}),
      assessmentMissingFactors: Object.freeze([
        ...(trace?.assessment.missingFactors ?? []),
        'career.affliction'
      ])
    });
  }

  const dignity = mapCareerDignity(trace?.intrinsicStrength.dignity);
  const affliction = mapCareerAffliction(planetFact);
  const motion = mapCareerMotion(trace?.intrinsicStrength.motion);
  const combustion = mapCareerCombustion(trace?.intrinsicStrength.combustion);
  const { beneficSupport, maleficPressure } = resolveAspectInfluence(trace);

  const dataAvailable =
    dignity !== 'UNAVAILABLE' &&
    motion !== 'UNKNOWN' &&
    combustion !== 'UNAVAILABLE';

  const missingFactors = [
    ...(trace?.assessment.missingFactors ?? []),
    ...(affliction === 'UNAVAILABLE' ? ['career.affliction'] : [])
  ];
  return Object.freeze({
    planet,
    relevance: relevanceItem.relevance,
    dignity,
    affliction,
    motion,
    combustion,
    beneficSupport,
    maleficPressure,
    dataAvailable,
    ...(trace ? { planetaryInfluenceTrace: trace } : {}),
    assessmentMissingFactors: Object.freeze(missingFactors)
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
  const traceByPlanet = new Map(
    buildPlanetaryInfluenceTrace(horoscope).map((trace) => [trace.planet, trace] as const)
  );

  for (const item of relevance) {
    relevanceByPlanet.set(item.planet, item);
  }

  const contexts: CareerPlanetaryConditionContext[] = [];

  for (const planet of CANONICAL_PLANET_ORDER) {
    const relevanceItem = relevanceByPlanet.get(planet);

    if (!relevanceItem) {
      // Planet missing from C5 relevance → emit NEUTRAL/UNAVAILABLE context
      const trace = traceByPlanet.get(planet);
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
          dataAvailable: false,
          ...(trace ? { planetaryInfluenceTrace: trace } : {}),
          assessmentMissingFactors: Object.freeze([
            ...(trace?.assessment.missingFactors ?? []),
            'career.affliction'
          ])
        })
      );
    } else {
      contexts.push(buildCareerPlanetaryConditionContext(
        horoscope,
        relevanceItem,
        traceByPlanet.get(planet)
      ));
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
