import {
  ShadbalaAggregationStatus,
  Planet,
  DignityStatus,
  PlanetStateCondition,
  type Horoscope,
  type PlanetMotion
} from '../../types';
import {
  resolvePlanetaryAspects,
  type AspectDiagnostic,
  type PlanetaryAspectInfluence
} from './aspectInfluence';
import {
  resolveCanonicalPlanetPosition,
  resolvePlanetaryRelationships,
  type FactorAvailability,
  type InfluenceFactorStatus,
  type PlanetaryCoLocation,
  type PlanetaryExchangeEvidence,
  type PlanetaryRelationshipDiagnostic,
  type PlanetaryRelationshipEvidence,
  type PlanetaryYogaParticipation
} from './planetaryRelationships';
import { METHODOLOGY } from '../fullNatalAnalysis/fullNatalAnalysisMetadata';

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

export const PLANETARY_INFLUENCE_FACTOR_ORDER = Object.freeze([
  'dignity',
  'combustion',
  'motion',
  'shadbala',
  'ownedHouses',
  'occupiedHouse',
  'aspectSources',
  'coLocatedPlanets',
  'relationships',
  'yogas'
] as const);

export type PlanetaryInfluenceFactor = typeof PLANETARY_INFLUENCE_FACTOR_ORDER[number];

export interface PlanetaryInfluenceDiagnostic {
  readonly factor: PlanetaryInfluenceFactor;
  readonly record: unknown;
  readonly reason:
    | AspectDiagnostic['reason']
    | PlanetaryRelationshipDiagnostic['reason']
    | 'INVALID_SHADBALA_TOTALS'
    | 'INVALID_SHADBALA_RECORD';
}

export interface PlanetaryInfluenceTrace {
  readonly planet: Planet;
  readonly calculationContext: {
    readonly zodiac: 'SIDEREAL';
    readonly ayanamsa: string;
    readonly houseSystem: string;
    readonly engineVersion: string;
    readonly aspectSource: 'natalGrahaDrishti';
  };
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
    readonly exchangeAvailability: FactorAvailability;
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
    readonly factors: Readonly<Record<PlanetaryInfluenceFactor, FactorAvailability>>;
    readonly missingFactors: readonly PlanetaryInfluenceFactor[];
  };
  readonly diagnostics: readonly PlanetaryInfluenceDiagnostic[];
}

interface ShadbalaResolution {
  readonly value?: PlanetaryInfluenceTrace['intrinsicStrength']['shadbala'];
  readonly availability: InfluenceFactorStatus;
  readonly diagnostic?: PlanetaryInfluenceDiagnostic;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    Array.from(ownedHouses).every((house: unknown) =>
      typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12)
    ? Object.freeze([...ownedHouses])
    : undefined;
}

function getOccupiedHouse(horoscope: Horoscope, planet: Planet): number | undefined {
  const fact = horoscope.planetFacts?.[planet];
  const house = resolveCanonicalPlanetPosition(fact).house;
  return typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12
    ? house
    : undefined;
}

function getShadbala(horoscope: Horoscope, planet: Planet): ShadbalaResolution {
  const raw: unknown = horoscope.planetaryStrength?.planets?.[planet]?.shadbala;
  if (!isRecord(raw) ||
      typeof raw.status !== 'string' ||
      !Object.values(ShadbalaAggregationStatus).includes(
        raw.status as ShadbalaAggregationStatus
      )) {
    return {
      availability: raw === undefined ? 'UNAVAILABLE' : 'PARTIAL',
      ...(raw !== undefined
        ? {
            diagnostic: Object.freeze({
              factor: 'shadbala',
              record: raw,
              reason: 'INVALID_SHADBALA_RECORD'
            })
          }
        : {})
    };
  }

  const totalRupa = raw.totalRupa;
  const totalShastiamsa = raw.totalShastiamsa;
  const hasInvalidTotal =
    (totalRupa !== undefined &&
      (typeof totalRupa !== 'number' || !Number.isFinite(totalRupa) || totalRupa < 0)) ||
    (totalShastiamsa !== undefined &&
      (typeof totalShastiamsa !== 'number' ||
        !Number.isFinite(totalShastiamsa) ||
        totalShastiamsa < 0));
  const isComplete = raw.status === ShadbalaAggregationStatus.COMPLETE;
  const completeTotalsPresent =
    typeof totalRupa === 'number' &&
    Number.isFinite(totalRupa) &&
    totalRupa >= 0 &&
    typeof totalShastiamsa === 'number' &&
    Number.isFinite(totalShastiamsa) &&
    totalShastiamsa >= 0;

  if (hasInvalidTotal || (isComplete && !completeTotalsPresent)) {
    return {
      availability: 'PARTIAL',
      diagnostic: Object.freeze({
        factor: 'shadbala',
        record: raw,
        reason: 'INVALID_SHADBALA_TOTALS'
      })
    };
  }

  const status = raw.status as ShadbalaAggregationStatus;
  const value = Object.freeze({
    status,
    ...(typeof totalRupa === 'number' ? { totalRupa } : {}),
    ...(typeof totalShastiamsa === 'number' ? { totalShastiamsa } : {}),
    ...(typeof raw.meetsMinimum === 'boolean' ? { meetsMinimum: raw.meetsMinimum } : {})
  });
  return {
    value,
    availability: status === ShadbalaAggregationStatus.COMPLETE
      ? 'AVAILABLE'
      : status === ShadbalaAggregationStatus.UNAVAILABLE
        ? 'UNAVAILABLE'
        : 'PARTIAL'
  };
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
  const aspectRecords = [
    ...aspects.beneficSources,
    ...aspects.maleficSources,
    ...aspects.mixedSources,
    ...aspects.unassessedSources
  ];
  const incompleteAspectClassification = aspectRecords.some((source) =>
    source.naturalNature === undefined ||
    source.classificationBasis.functionalSource === 'NONE'
  );
  const shadbalaValue = shadbala.value;
  const factors: Record<PlanetaryInfluenceFactor, FactorAvailability> = {
    dignity: Object.freeze({
      status: resolvedDignity ? 'AVAILABLE' : 'UNAVAILABLE',
      source: 'planetFacts.dignity.status'
    }),
    combustion: Object.freeze({
      status: resolvedCombustion ? 'AVAILABLE' : 'UNAVAILABLE',
      source: 'planetFacts.state.condition'
    }),
    motion: Object.freeze({
      status: resolvedMotion ? 'AVAILABLE' : 'UNAVAILABLE',
      source: 'planetFacts.state.motion'
    }),
    shadbala: Object.freeze({
      status: shadbala.availability,
      source: 'planetaryStrength.planets[planet].shadbala'
    }),
    ownedHouses: Object.freeze({
      status: ownedHouses === undefined ? 'UNAVAILABLE' : 'AVAILABLE',
      source: 'functionalNatureIntegration|functionalRoles|houseLordship'
    }),
    occupiedHouse: Object.freeze({
      status: occupiedHouse === undefined ? 'UNAVAILABLE' : 'AVAILABLE',
      source: 'planetFacts.position.house|planetFacts.house'
    }),
    aspectSources: Object.freeze({
      status: aspects.availability === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : aspects.availability === 'PARTIAL' || incompleteAspectClassification
          ? 'PARTIAL'
          : 'AVAILABLE',
      source: 'natalGrahaDrishti.aspects'
    }),
    coLocatedPlanets: relationships.availability.coLocatedPlanets,
    relationships: relationships.availability.relationships,
    yogas: relationships.availability.yogas
  };
  const missingFactors = [...new Set(PLANETARY_INFLUENCE_FACTOR_ORDER.filter(
    (factor) => factors[factor].status !== 'AVAILABLE'
  ))];
  const availableCount = PLANETARY_INFLUENCE_FACTOR_ORDER.filter(
    (factor) => factors[factor].status !== 'UNAVAILABLE'
  ).length;
  const status: PlanetaryInfluenceAssessmentStatus =
    missingFactors.length === 0
      ? 'FULL'
      : availableCount === 0
        ? 'UNAVAILABLE'
        : 'PARTIAL';
  const diagnostics: PlanetaryInfluenceDiagnostic[] = [
    ...aspects.ignoredRecords.map((diagnostic) => Object.freeze({
      factor: 'aspectSources' as const,
      ...diagnostic
    })),
    ...relationships.diagnostics.map((diagnostic) => Object.freeze({
      factor: diagnostic.reason === 'POSITION_HOUSE_MISMATCH'
        ? 'coLocatedPlanets' as const
        : 'relationships' as const,
      ...diagnostic
    })),
    ...(shadbala.diagnostic ? [shadbala.diagnostic] : [])
  ];

  const methodology = horoscope.fullNatalAnalysis?.methodology;
  const ayanamsa = horoscope.birthDetails?.ayanamsa ?? methodology?.ayanamsa ?? METHODOLOGY.ayanamsa;
  const houseSystem = methodology?.houseSystem ?? METHODOLOGY.houseSystem;
  const engineVersion = horoscope.fullNatalAnalysis?.version ?? 'UNKNOWN';

  return Object.freeze({
    planet,
    calculationContext: Object.freeze({
      zodiac: 'SIDEREAL',
      ayanamsa: String(ayanamsa),
      houseSystem: String(houseSystem),
      engineVersion,
      aspectSource: 'natalGrahaDrishti'
    }),
    intrinsicStrength: Object.freeze({
      ...(resolvedDignity ? { dignity: resolvedDignity } : {}),
      ...(resolvedCombustion ? { combustion: resolvedCombustion } : {}),
      ...(resolvedMotion ? { motion: Object.freeze({ ...resolvedMotion }) } : {}),
      ...(shadbalaValue ? { shadbala: shadbalaValue } : {})
    }),
    structuralRelationships: Object.freeze({
      ...(ownedHouses ? { ownedHouses } : {}),
      ...(occupiedHouse !== undefined ? { occupiedHouse } : {}),
      exchanges: relationships.exchanges,
      exchangeAvailability: relationships.availability.exchanges,
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
      factors: Object.freeze(factors),
      missingFactors: Object.freeze(missingFactors)
    }),
    diagnostics: Object.freeze(diagnostics)
  });
}

/** Builds deterministic D1 planetary influence provenance for all nine planets. */
export function buildPlanetaryInfluenceTrace(
  horoscope: Horoscope
): readonly PlanetaryInfluenceTrace[] {
  return Object.freeze(PLANET_ORDER.map((planet) => buildTrace(horoscope, planet)));
}
