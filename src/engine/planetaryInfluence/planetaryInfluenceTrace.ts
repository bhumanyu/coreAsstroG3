import {
  Planet,
  DignityStatus,
  PlanetStateCondition,
  type Horoscope,
  type PlanetMotion,
  type ShadbalaAggregationStatus
} from '../../types';
import {
  resolvePlanetaryAspects,
  type PlanetaryAspectInfluence
} from './aspectInfluence';
import {
  resolvePlanetaryRelationships,
  type PlanetaryCoLocation,
  type PlanetaryExchangeEvidence,
  type PlanetaryRelationshipEvidence,
  type PlanetaryYogaParticipation
} from './planetaryRelationships';

const PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
]);

export type PlanetaryInfluenceAssessmentStatus = 'FULL' | 'PARTIAL' | 'UNAVAILABLE';

export interface PlanetaryInfluenceTrace {
  readonly planet: Planet;
  readonly intrinsicStrength: {
    readonly dignity?: DignityStatus;
    readonly combustion?: PlanetStateCondition;
    readonly motion?: PlanetMotion;
    readonly shadbala?: {
      readonly status: ShadbalaAggregationStatus;
      readonly totalRupa?: number;
      readonly totalShastiamsa?: number;
      readonly meetsMinimum?: boolean;
    };
  };
  readonly structuralRelationships: {
    readonly ownedHouses?: readonly number[];
    readonly occupiedHouse?: number;
    readonly exchanges: readonly PlanetaryExchangeEvidence[];
    readonly relationshipEvidence: readonly PlanetaryRelationshipEvidence[];
    readonly yogas?: readonly PlanetaryYogaParticipation[];
  };
  readonly environmentalInfluence: {
    readonly beneficAspectSources: readonly PlanetaryAspectInfluence[];
    readonly maleficAspectSources: readonly PlanetaryAspectInfluence[];
    readonly mixedAspectSources: readonly PlanetaryAspectInfluence[];
    readonly unassessedAspectSources: readonly PlanetaryAspectInfluence[];
    readonly coLocatedPlanets: readonly PlanetaryCoLocation[];
  };
  readonly assessment: {
    readonly status: PlanetaryInfluenceAssessmentStatus;
    readonly missingFactors: readonly string[];
  };
}

function isDignityStatus(value: unknown): value is DignityStatus {
  return typeof value === 'string' && Object.values(DignityStatus).includes(value as DignityStatus);
}

function isMotion(value: unknown): value is PlanetMotion {
  return Boolean(value && typeof value === 'object' &&
    typeof (value as PlanetMotion).retrograde === 'boolean' &&
    typeof (value as PlanetMotion).stationary === 'boolean');
}

function isCondition(value: unknown): value is PlanetStateCondition {
  return typeof value === 'string' &&
    Object.values(PlanetStateCondition).includes(value as PlanetStateCondition);
}

function getOwnedHouses(horoscope: Horoscope, planet: Planet): readonly number[] | undefined {
  const ownedHouses =
    horoscope.functionalNatureIntegration?.planets?.[planet]?.ownedHouses ??
    horoscope.functionalRoles?.planets?.[planet]?.ownedHouses ??
    horoscope.houseLordship?.planetLordships?.[planet]?.ownedHouses;
  return Array.isArray(ownedHouses) &&
    ownedHouses.every((house: unknown) =>
      typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12)
    ? Object.freeze([...ownedHouses])
    : undefined;
}

function getOccupiedHouse(horoscope: Horoscope, planet: Planet): number | undefined {
  const fact = horoscope.planetFacts?.[planet];
  const house = fact?.house ?? fact?.position?.house;
  return typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12
    ? house
    : undefined;
}

function getShadbala(horoscope: Horoscope, planet: Planet): PlanetaryInfluenceTrace['intrinsicStrength']['shadbala'] | undefined {
  const shadbala = horoscope.planetaryStrength?.planets?.[planet]?.shadbala;
  if (!shadbala || typeof shadbala.status !== 'string') return undefined;
  return Object.freeze({
    status: shadbala.status,
    ...(typeof shadbala.totalRupa === 'number' ? { totalRupa: shadbala.totalRupa } : {}),
    ...(typeof shadbala.totalShastiamsa === 'number'
      ? { totalShastiamsa: shadbala.totalShastiamsa }
      : {}),
    ...(typeof shadbala.meetsMinimum === 'boolean'
      ? { meetsMinimum: shadbala.meetsMinimum }
      : {})
  });
}

function buildTrace(horoscope: Horoscope, planet: Planet): PlanetaryInfluenceTrace {
  const planetFact = horoscope.planetFacts?.[planet];
  const dignity = planetFact?.dignity?.status;
  const combustion = planetFact?.state?.condition;
  const motion = planetFact?.state?.motion;
  const resolvedDignity = isDignityStatus(dignity) ? dignity : undefined;
  const resolvedCombustion = isCondition(combustion) ? combustion : undefined;
  const resolvedMotion = isMotion(motion) ? motion : undefined;
  const shadbala = getShadbala(horoscope, planet);
  const ownedHouses = getOwnedHouses(horoscope, planet);
  const occupiedHouse = getOccupiedHouse(horoscope, planet);
  const relationships = resolvePlanetaryRelationships(horoscope, planet);
  const aspects = resolvePlanetaryAspects(horoscope, planet);
  const missingFactors: string[] = [];

  if (!resolvedDignity) missingFactors.push('intrinsicStrength.dignity');
  if (!resolvedCombustion) missingFactors.push('intrinsicStrength.combustion');
  if (!resolvedMotion) missingFactors.push('intrinsicStrength.motion');
  if (!shadbala || shadbala.status !== 'COMPLETE') {
    missingFactors.push('intrinsicStrength.shadbala');
  }
  if (!ownedHouses) missingFactors.push('structuralRelationships.ownedHouses');
  if (occupiedHouse === undefined) missingFactors.push('structuralRelationships.occupiedHouse');
  if (!horoscope.yogas || !Array.isArray(horoscope.yogas.yogas)) {
    missingFactors.push('structuralRelationships.exchanges');
    missingFactors.push('structuralRelationships.yogas');
  }
  if (aspects.availability !== 'AVAILABLE') {
    missingFactors.push('environmentalInfluence.aspectSources');
  }
  if (aspects.unassessedSources.length > 0) {
    missingFactors.push('environmentalInfluence.aspectSourceNature');
  }
  const allPlacementsAvailable = PLANET_ORDER.every((candidate) => {
    const fact = horoscope.planetFacts?.[candidate];
    const house = fact?.house ?? fact?.position?.house;
    const sign = fact?.sign ?? fact?.position?.sign;
    return typeof house === 'number' && Number.isInteger(house) &&
      typeof sign === 'string';
  });
  if (!allPlacementsAvailable) missingFactors.push('environmentalInfluence.coLocatedPlanets');

  const intrinsicResolved = Boolean(
    resolvedDignity || resolvedCombustion || resolvedMotion || shadbala
  );
  const availableCount =
    Number(intrinsicResolved) +
    Number(ownedHouses !== undefined || occupiedHouse !== undefined) +
    Number(aspects.availability === 'AVAILABLE' || allPlacementsAvailable);
  const status: PlanetaryInfluenceAssessmentStatus = missingFactors.length === 0
    ? 'FULL'
    : availableCount === 0
      ? 'UNAVAILABLE'
      : 'PARTIAL';

  return Object.freeze({
    planet,
    intrinsicStrength: Object.freeze({
      ...(resolvedDignity ? { dignity: resolvedDignity } : {}),
      ...(resolvedCombustion ? { combustion: resolvedCombustion } : {}),
      ...(resolvedMotion ? { motion: Object.freeze({ ...resolvedMotion }) } : {}),
      ...(shadbala ? { shadbala } : {})
    }),
    structuralRelationships: Object.freeze({
      ...(ownedHouses ? { ownedHouses } : {}),
      ...(occupiedHouse !== undefined ? { occupiedHouse } : {}),
      exchanges: relationships.exchanges,
      relationshipEvidence: relationships.relationshipEvidence,
      ...(horoscope.yogas && Array.isArray(horoscope.yogas.yogas)
        ? { yogas: relationships.yogas }
        : {})
    }),
    environmentalInfluence: Object.freeze({
      beneficAspectSources: aspects.beneficSources,
      maleficAspectSources: aspects.maleficSources,
      mixedAspectSources: aspects.mixedSources,
      unassessedAspectSources: aspects.unassessedSources,
      coLocatedPlanets: relationships.coLocatedPlanets
    }),
    assessment: Object.freeze({
      status,
      missingFactors: Object.freeze(missingFactors)
    })
  });
}

/** Builds deterministic D1 planetary influence provenance for all nine planets. */
export function buildPlanetaryInfluenceTrace(
  horoscope: Horoscope
): readonly PlanetaryInfluenceTrace[] {
  return Object.freeze(PLANET_ORDER.map((planet) => buildTrace(horoscope, planet)));
}
