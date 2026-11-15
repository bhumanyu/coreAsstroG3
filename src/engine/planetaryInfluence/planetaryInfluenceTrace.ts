import {
  CANONICAL_METHODOLOGY,
  SHADBALA_MINIMUM_REQUIREMENTS,
  ShadbalaAggregationStatus,
  ShadbalaComponent,
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

export type EvidenceAvailabilityStatus = 'FULL' | 'PARTIAL' | 'UNAVAILABLE';

export const PLANETARY_INFLUENCE_FACTOR_ORDER = Object.freeze([
  'dignity',
  'combustion',
  'motion',
  'shadbala',
  'ownedHouses',
  'occupiedHouse',
  'aspectSources',
  'coLocationByHouseSign',
  'angularSeparation',
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
  readonly detail?: string;
}

export interface MethodologyValue {
  readonly value?: string;
  readonly status: 'DECLARED' | 'DEFAULTED' | 'UNKNOWN';
}

export interface PlanetaryInfluenceTrace {
  readonly planet: Planet;
  readonly calculationContext: {
    readonly zodiac: 'SIDEREAL';
    readonly ayanamsa: MethodologyValue;
    readonly houseSystem: MethodologyValue;
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
  readonly evidenceAvailability: {
    readonly status: EvidenceAvailabilityStatus;
    readonly factors: Readonly<Record<PlanetaryInfluenceFactor, FactorAvailability>>;
    readonly missingFactors: readonly PlanetaryInfluenceFactor[];
  };
  readonly diagnostics: readonly PlanetaryInfluenceDiagnostic[];
}

interface ShadbalaResolution {
  readonly value?: PlanetaryInfluenceTrace['intrinsicStrength']['shadbala'];
  readonly availability: InfluenceFactorStatus;
  readonly diagnostics: readonly PlanetaryInfluenceDiagnostic[];
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
  const diagnostics: PlanetaryInfluenceDiagnostic[] = [];
  if (!isRecord(raw) ||
      typeof raw.status !== 'string' ||
      !Object.values(ShadbalaAggregationStatus).includes(
        raw.status as ShadbalaAggregationStatus
      )) {
    return {
      availability: raw === undefined ? 'UNAVAILABLE' : 'PARTIAL',
      diagnostics: raw === undefined
        ? Object.freeze([])
        : Object.freeze([Object.freeze({
            factor: 'shadbala',
            record: raw,
            reason: 'INVALID_SHADBALA_RECORD'
          })])
    };
  }

  const addDiagnostic = (detail: string) => diagnostics.push(Object.freeze({
    factor: 'shadbala',
    record: raw,
    reason: 'INVALID_SHADBALA_TOTALS',
    detail
  }));
  const totalRupa = raw.totalRupa;
  const totalShastiamsa = raw.totalShastiamsa;
  const isComplete = raw.status === ShadbalaAggregationStatus.COMPLETE;
  const validRupa = typeof totalRupa === 'number' &&
    Number.isFinite(totalRupa) && totalRupa >= 0;
  const validShastiamsa = typeof totalShastiamsa === 'number' &&
    Number.isFinite(totalShastiamsa) && totalShastiamsa >= 0;
  if (totalRupa !== undefined && !validRupa) addDiagnostic('INVALID_TOTAL_RUPA');
  if (totalShastiamsa !== undefined && !validShastiamsa) {
    addDiagnostic('INVALID_TOTAL_SHASTIAMSA');
  }
  if (isComplete && !validRupa) addDiagnostic('COMPLETE_TOTAL_RUPA_REQUIRED');
  if (isComplete && !validShastiamsa) {
    addDiagnostic('COMPLETE_TOTAL_SHASTIAMSA_REQUIRED');
  }

  if (validRupa && validShastiamsa &&
      Math.abs(totalRupa - totalShastiamsa / 60) > 0.005000001) {
    addDiagnostic('RUPA_SHASTIAMSA_RATIO_MISMATCH');
  }

  const minimumRequirement = isRecord(raw.minimumRequirement)
    ? raw.minimumRequirement.requiredRupa
    : raw.minimumRequiredRupa;
  const authoritativeMinimum = typeof minimumRequirement === 'number' &&
      Number.isFinite(minimumRequirement) &&
      minimumRequirement >= 0
    ? minimumRequirement
    : SHADBALA_MINIMUM_REQUIREMENTS[planet]?.requiredRupa;
  if (
    raw.meetsMinimum !== undefined &&
    typeof raw.meetsMinimum !== 'boolean'
  ) {
    addDiagnostic('INVALID_MEETS_MINIMUM');
  } else if (
    typeof raw.meetsMinimum === 'boolean' &&
    validRupa &&
    authoritativeMinimum !== undefined &&
    raw.meetsMinimum !== (totalRupa >= authoritativeMinimum)
  ) {
    addDiagnostic('MEETS_MINIMUM_MISMATCH');
  }

  if (isComplete && raw.components !== undefined) {
    if (!Array.isArray(raw.components)) {
      addDiagnostic('INVALID_COMPONENTS_RECORD');
    } else {
      const presentComponents = new Set(
        raw.components.flatMap((component: unknown) =>
          isRecord(component) &&
          Object.values(ShadbalaComponent).includes(component.component as ShadbalaComponent)
            ? [component.component as ShadbalaComponent]
            : []
        )
      );
      for (const component of Object.values(ShadbalaComponent)) {
        if (!presentComponents.has(component)) {
          addDiagnostic(`COMPLETE_COMPONENT_REQUIRED:${component}`);
        }
      }
    }
  }
  if (isComplete && Array.isArray(raw.missingComponents)) {
    for (const component of raw.missingComponents) {
      addDiagnostic(`COMPLETE_RECORD_HAS_MISSING_COMPONENT:${String(component)}`);
    }
  }

  if (diagnostics.length > 0) {
    return {
      availability: 'PARTIAL',
      diagnostics: Object.freeze(diagnostics)
    };
  }

  const status = raw.status as ShadbalaAggregationStatus;
  const value = Object.freeze({
    status,
    ...(validRupa ? { totalRupa } : {}),
    ...(validShastiamsa ? { totalShastiamsa } : {}),
    ...(typeof raw.meetsMinimum === 'boolean' ? { meetsMinimum: raw.meetsMinimum } : {})
  });
  return {
    value,
    diagnostics: Object.freeze([]),
    availability: status === ShadbalaAggregationStatus.COMPLETE
      ? 'AVAILABLE'
      : status === ShadbalaAggregationStatus.UNAVAILABLE
        ? 'UNAVAILABLE'
        : 'PARTIAL'
  };
}

function methodologyValue(value: unknown, fallback: unknown): MethodologyValue {
  if (typeof value === 'string' && value.length > 0) {
    return Object.freeze({ value, status: 'DECLARED' });
  }
  if (typeof fallback === 'string' && fallback.length > 0) {
    return Object.freeze({ value: fallback, status: 'DEFAULTED' });
  }
  return Object.freeze({ status: 'UNKNOWN' });
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
      source: 'natalGrahaDrishti.aspects',
      ...(aspects.producerStatus
        ? { producerStatus: aspects.producerStatus }
        : {})
    }),
    coLocationByHouseSign: relationships.availability.coLocationByHouseSign,
    angularSeparation: relationships.availability.angularSeparation,
    relationships: relationships.availability.relationships,
    yogas: relationships.availability.yogas
  };
  const missingFactors = [...new Set(PLANETARY_INFLUENCE_FACTOR_ORDER.filter(
    (factor) => factors[factor].status !== 'AVAILABLE'
  ))];
  const availableCount = PLANETARY_INFLUENCE_FACTOR_ORDER.filter(
    (factor) => factors[factor].status !== 'UNAVAILABLE'
  ).length;
  const status: EvidenceAvailabilityStatus =
    missingFactors.length === 0
      ? 'FULL'
      : availableCount === 0
        ? 'UNAVAILABLE'
        : 'PARTIAL';
  const diagnostics: PlanetaryInfluenceDiagnostic[] = [
    ...aspects.diagnostics.map((diagnostic) => Object.freeze({
      factor: 'aspectSources' as const,
      ...diagnostic
    })),
    ...relationships.diagnostics.map((diagnostic) => Object.freeze({
      factor: diagnostic.reason === 'POSITION_HOUSE_MISMATCH'
        ? 'coLocationByHouseSign' as const
        : 'relationships' as const,
      ...diagnostic
    })),
    ...shadbala.diagnostics
  ];

  const ayanamsa = methodologyValue(
    horoscope.birthDetails?.ayanamsa,
    CANONICAL_METHODOLOGY.ayanamsa
  );
  const houseSystem = methodologyValue(
    undefined,
    CANONICAL_METHODOLOGY.houseSystem
  );
  const engineVersion = horoscope.fullNatalAnalysis?.version ?? 'UNKNOWN';

  return Object.freeze({
    planet,
    calculationContext: Object.freeze({
      zodiac: 'SIDEREAL',
      ayanamsa,
      houseSystem,
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
    evidenceAvailability: Object.freeze({
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
