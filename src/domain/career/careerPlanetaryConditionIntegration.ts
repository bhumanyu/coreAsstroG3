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
  type CareerPlanetaryConditionAssessment,
  type CareerPlanetaryDignity,
  type CareerPlanetaryAffliction,
  type CareerPlanetaryMotion,
  type CareerPlanetaryCombustion,
  type CareerNonConsumedInfluence
} from './careerPlanetaryCondition';
import type {
  PlanetaryAspectConsumerId,
  PlanetaryAspectInfluence
} from '../../engine/planetaryInfluence/aspectInfluence';

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

const C6_REQUIRED_TRACE_FACTORS = Object.freeze([
  'dignity',
  'combustion',
  'motion',
  'aspectSources'
] as const);

function resolveC6Assessment(
  trace: PlanetaryInfluenceTrace | undefined,
  affliction: CareerPlanetaryAffliction
): {
  readonly status: CareerPlanetaryConditionAssessment;
  readonly missingFactors: readonly string[];
} {
  const statuses: Array<readonly [string, 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE']> =
    C6_REQUIRED_TRACE_FACTORS.map((factor) => [
      factor,
      trace?.evidenceAvailability.factors[factor].status ?? 'UNAVAILABLE'
    ] as const);
  statuses.push([
    'career.affliction',
    affliction === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
  ]);
  const missingFactors = statuses
    .filter(([, status]) => status !== 'AVAILABLE')
    .map(([factor]) => factor);
  const resolvedCount = statuses.filter(([, status]) => status !== 'UNAVAILABLE').length;
  return Object.freeze({
    status: missingFactors.length === 0
      ? 'FULL'
      : resolvedCount === 0
        ? 'UNAVAILABLE'
        : 'PARTIAL',
    missingFactors: Object.freeze(missingFactors)
  });
}

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
): {
  readonly beneficSupport: boolean;
  readonly maleficPressure: boolean;
  readonly beneficSupportSources: readonly PlanetaryAspectInfluence[];
  readonly maleficPressureSources: readonly PlanetaryAspectInfluence[];
  readonly nonConsumedInfluence: readonly CareerNonConsumedInfluence[];
} {
  const beneficSources = trace?.environmentalInfluence.beneficAspectSources ?? [];
  const maleficSources = trace?.environmentalInfluence.maleficAspectSources ?? [];
  const beneficSupportSources = beneficSources.filter(
    (source) => source.naturalNature === 'BENEFIC'
  );
  const maleficPressureSources = maleficSources.filter(
    (source) => source.naturalNature === 'MALEFIC'
  );
  const nonConsumedInfluence: CareerNonConsumedInfluence[] = [
    ...(trace?.environmentalInfluence.mixedAspectSources ?? []).map((record) => ({
      record,
      reason: 'MIXED_CLASSIFICATION' as const,
      notConsumedReason: 'NATURAL_FUNCTIONAL_CONFLICT' as const,
      futurePolicyDimension: 'NATURAL_FUNCTIONAL_RECONCILIATION' as const
    })),
    ...(trace?.environmentalInfluence.unassessedAspectSources ?? []).map((record) => ({
      record,
      reason: 'UNASSESSED_CLASSIFICATION' as const,
      notConsumedReason: 'CLASSIFICATION_UNAVAILABLE' as const,
      futurePolicyDimension: 'NONE' as const
    })),
    ...[...beneficSources, ...maleficSources]
      .filter((record) => record.naturalNature === undefined)
      .map((record) => ({
        record,
        reason: 'FUNCTIONAL_ONLY' as const,
        notConsumedReason: 'FUNCTIONAL_NATURE_PENDING_C6_POLICY' as const,
        futurePolicyDimension: 'FUNCTIONAL_NATURE' as const,
        candidateConsumer: record.functionalNature === 'BENEFIC'
          ? 'CAREER_C6_BENEFIC_SUPPORT' as const
          : 'CAREER_C6_MALEFIC_PRESSURE' as const
      }))
  ];
  return {
    beneficSupport: beneficSupportSources.length > 0,
    maleficPressure: maleficPressureSources.length > 0,
    beneficSupportSources: Object.freeze(beneficSupportSources),
    maleficPressureSources: Object.freeze(maleficPressureSources),
    nonConsumedInfluence: Object.freeze(nonConsumedInfluence)
  };
}

function markAspectConsumer(
  source: PlanetaryAspectInfluence,
  consumer: PlanetaryAspectConsumerId
): PlanetaryAspectInfluence {
  return Object.freeze({
    ...source,
    classificationBasis: Object.freeze({
      ...source.classificationBasis,
      consumedBy: Object.freeze([...new Set([
        ...source.classificationBasis.consumedBy,
        consumer
      ])])
    })
  });
}

function traceWithC6Consumption(
  trace: PlanetaryInfluenceTrace | undefined,
  resolved: ReturnType<typeof resolveAspectInfluence>
): PlanetaryInfluenceTrace | undefined {
  if (!trace) return undefined;
  const beneficSupport = new Set(resolved.beneficSupportSources);
  const maleficPressure = new Set(resolved.maleficPressureSources);
  return Object.freeze({
    ...trace,
    environmentalInfluence: Object.freeze({
      ...trace.environmentalInfluence,
      beneficAspectSources: Object.freeze(
        trace.environmentalInfluence.beneficAspectSources.map((source) =>
          beneficSupport.has(source)
            ? markAspectConsumer(source, 'CAREER_C6_BENEFIC_SUPPORT')
            : source
        )
      ),
      maleficAspectSources: Object.freeze(
        trace.environmentalInfluence.maleficAspectSources.map((source) =>
          maleficPressure.has(source)
            ? markAspectConsumer(source, 'CAREER_C6_MALEFIC_PRESSURE')
            : source
        )
      )
    })
  });
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
    const aspectInfluence = resolveAspectInfluence(trace);
    const careerTrace = traceWithC6Consumption(trace, aspectInfluence);
    const c6Assessment = resolveC6Assessment(trace, 'UNAVAILABLE');
    return Object.freeze({
      planet,
      relevance: relevanceItem.relevance,
      dignity: 'UNAVAILABLE',
      affliction: 'UNAVAILABLE',
      motion: 'UNKNOWN',
      combustion: 'UNAVAILABLE',
      beneficSupport: aspectInfluence.beneficSupport,
      maleficPressure: aspectInfluence.maleficPressure,
      dataAvailable: false,
      ...(careerTrace ? { planetaryInfluenceTrace: careerTrace } : {}),
      nonConsumedInfluence: aspectInfluence.nonConsumedInfluence,
      assessmentStatus: c6Assessment.status,
      assessmentMissingFactors: c6Assessment.missingFactors
    });
  }

  const dignity = mapCareerDignity(trace?.intrinsicStrength.dignity);
  const affliction = mapCareerAffliction(planetFact);
  const motion = mapCareerMotion(trace?.intrinsicStrength.motion);
  const combustion = mapCareerCombustion(trace?.intrinsicStrength.combustion);
  const aspectInfluence = resolveAspectInfluence(trace);
  const c6Assessment = resolveC6Assessment(trace, affliction);

  const dataAvailable =
    dignity !== 'UNAVAILABLE' &&
    motion !== 'UNKNOWN' &&
    combustion !== 'UNAVAILABLE';

  const careerTrace = traceWithC6Consumption(trace, aspectInfluence);
  return Object.freeze({
    planet,
    relevance: relevanceItem.relevance,
    dignity,
    affliction,
    motion,
    combustion,
    beneficSupport: aspectInfluence.beneficSupport,
    maleficPressure: aspectInfluence.maleficPressure,
    dataAvailable,
    ...(careerTrace ? { planetaryInfluenceTrace: careerTrace } : {}),
    nonConsumedInfluence: aspectInfluence.nonConsumedInfluence,
    assessmentStatus: c6Assessment.status,
    assessmentMissingFactors: c6Assessment.missingFactors
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
      const aspectInfluence = resolveAspectInfluence(trace);
      const c6Assessment = resolveC6Assessment(trace, 'UNAVAILABLE');
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
          nonConsumedInfluence: aspectInfluence.nonConsumedInfluence,
          assessmentStatus: c6Assessment.status,
          assessmentMissingFactors: c6Assessment.missingFactors
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
