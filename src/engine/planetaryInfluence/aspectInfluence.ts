import { AspectType, Planet, type Horoscope } from '../../types';
import { isNaturalBenefic } from '../planetaryStrength/drikBala';

export type PlanetaryAspectConsumerId =
  | 'CAREER_C6_BENEFIC_SUPPORT'
  | 'CAREER_C6_MALEFIC_PRESSURE';

export type CanonicalNatalAspectType =
  | AspectType.FULL_7TH
  | AspectType.SPECIAL_3RD
  | AspectType.SPECIAL_4TH
  | AspectType.SPECIAL_5TH
  | AspectType.SPECIAL_8TH
  | AspectType.SPECIAL_9TH
  | AspectType.SPECIAL_10TH;

const CANONICAL_NATAL_ASPECT_TYPES: ReadonlySet<string> = new Set([
  AspectType.FULL_7TH,
  AspectType.SPECIAL_3RD,
  AspectType.SPECIAL_4TH,
  AspectType.SPECIAL_5TH,
  AspectType.SPECIAL_8TH,
  AspectType.SPECIAL_9TH,
  AspectType.SPECIAL_10TH
]);

export type PlanetarySourceNature =
  | 'NATURAL_BENEFIC'
  | 'NATURAL_MALEFIC'
  | 'FUNCTIONAL_BENEFIC'
  | 'FUNCTIONAL_MALEFIC'
  | 'MIXED'
  | 'UNASSESSED';

export interface PlanetaryAspectInfluence {
  readonly sourcePlanet: Planet;
  readonly targetPlanet: Planet;
  readonly aspectType: CanonicalNatalAspectType;
  readonly houseOffset?: number;
  readonly geometricValidation: 'PRODUCER_ASSERTED';
  readonly sourceNature: PlanetarySourceNature;
  readonly classificationBasis: {
    readonly naturalRule: 'NATURAL_BENEFIC_TABLE' | 'MERCURY_ASSOCIATION' | 'MOON_PHASE';
    readonly functionalSource:
      | 'FUNCTIONAL_NATURE_INTEGRATION'
      | 'FUNCTIONAL_ROLES'
      | 'NONE';
    readonly consumedBy: readonly PlanetaryAspectConsumerId[];
  };
  readonly naturalNature?: 'BENEFIC' | 'MALEFIC';
  readonly functionalNature?: 'BENEFIC' | 'MALEFIC' | 'MIXED' | 'NEUTRAL';
  readonly sourceHouse?: number;
  readonly targetHouse?: number;
  readonly sourceSign?: string;
  readonly targetSign?: string;
  readonly description?: string;
  readonly reason?: string;
}

export interface AspectDiagnostic {
  readonly record: unknown;
  readonly reason: 'INVALID_SOURCE_PLANET' | 'INVALID_TARGET' | 'MISSING_FIELDS';
}

export interface PlanetaryAspectInfluenceResult {
  readonly beneficSources: readonly PlanetaryAspectInfluence[];
  readonly maleficSources: readonly PlanetaryAspectInfluence[];
  readonly mixedSources: readonly PlanetaryAspectInfluence[];
  readonly unassessedSources: readonly PlanetaryAspectInfluence[];
  readonly availability: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  readonly producerStatus?: 'ASSUMED_COMPLETE';
  readonly ignoredRecords: readonly AspectDiagnostic[];
}

interface CanonicalAspectRecord {
  readonly sourcePlanet?: Planet;
  readonly aspectingPlanet?: Planet;
  readonly targetPlanet?: Planet;
  readonly target?: Planet;
  readonly aspectType?: CanonicalNatalAspectType;
  readonly houseOffset?: number;
  readonly sourceHouse?: number;
  readonly targetHouse?: number;
  readonly sourceSign?: string;
  readonly targetSign?: string;
  readonly description?: string;
  readonly reason?: string;
}

type FunctionalClassification = 'BENEFIC' | 'MALEFIC' | 'MIXED' | 'NEUTRAL';

function isPlanet(value: unknown): value is Planet {
  return typeof value === 'string' && Object.values(Planet).includes(value as Planet);
}

function getNaturalNature(
  planet: Planet,
  horoscope: Horoscope
): 'BENEFIC' | 'MALEFIC' | undefined {
  const facts = horoscope.planetFacts;
  if (!facts) return undefined;
  if (planet === Planet.MOON) {
    const sunLongitude = facts[Planet.SUN]?.position?.eclipticLongitude;
    const moonLongitude = facts[Planet.MOON]?.position?.eclipticLongitude;
    if (!Number.isFinite(sunLongitude) || !Number.isFinite(moonLongitude)) return undefined;
  }
  if (planet === Planet.MERCURY) {
    const mercuryHouse = facts[Planet.MERCURY]?.house;
    if (typeof mercuryHouse !== 'number' || !Number.isFinite(mercuryHouse)) return undefined;
    const requiredMalefics = [Planet.SUN, Planet.MARS, Planet.SATURN, Planet.RAHU, Planet.KETU];
    if (requiredMalefics.some((malefic) =>
      typeof facts[malefic]?.house !== 'number' || !Number.isFinite(facts[malefic].house))) {
      return undefined;
    }
  }
  if (!facts[planet]) return undefined;
  return isNaturalBenefic(planet, facts) ? 'BENEFIC' : 'MALEFIC';
}

function getNaturalRule(
  planet: Planet
): PlanetaryAspectInfluence['classificationBasis']['naturalRule'] {
  if (planet === Planet.MOON) return 'MOON_PHASE';
  if (planet === Planet.MERCURY) return 'MERCURY_ASSOCIATION';
  return 'NATURAL_BENEFIC_TABLE';
}

function getFunctionalNature(
  planet: Planet,
  horoscope: Horoscope
): {
  readonly nature?: FunctionalClassification;
  readonly source: PlanetaryAspectInfluence['classificationBasis']['functionalSource'];
} {
  const integratedNature =
    horoscope.functionalNatureIntegration?.planets?.[planet]?.functionalNature;
  if (isFunctionalClassification(integratedNature)) {
    return { nature: integratedNature, source: 'FUNCTIONAL_NATURE_INTEGRATION' };
  }

  const roleNature = horoscope.functionalRoles?.planets?.[planet]?.functionalNature;
  if (isFunctionalClassification(roleNature)) {
    return { nature: roleNature, source: 'FUNCTIONAL_ROLES' };
  }
  return { source: 'NONE' };
}

function isFunctionalClassification(value: unknown): value is FunctionalClassification {
  return value === 'BENEFIC' || value === 'MALEFIC' ||
    value === 'MIXED' || value === 'NEUTRAL';
}

function classifySource(
  planet: Planet,
  horoscope: Horoscope
): Pick<
  PlanetaryAspectInfluence,
  'sourceNature' | 'naturalNature' | 'functionalNature' | 'classificationBasis'
> {
  const naturalNature = getNaturalNature(planet, horoscope);
  const functional = getFunctionalNature(planet, horoscope);
  const functionalNature = functional.nature;
  const classificationBasis = Object.freeze({
    naturalRule: getNaturalRule(planet),
    functionalSource: functional.source,
    consumedBy: Object.freeze([])
  });

  if (functionalNature === 'MIXED' ||
      (naturalNature !== undefined &&
        ((naturalNature === 'BENEFIC' && functionalNature === 'MALEFIC') ||
          (naturalNature === 'MALEFIC' && functionalNature === 'BENEFIC')))) {
    return { sourceNature: 'MIXED', naturalNature, functionalNature, classificationBasis };
  }
  if (naturalNature === 'BENEFIC') {
    return { sourceNature: 'NATURAL_BENEFIC', naturalNature, functionalNature, classificationBasis };
  }
  if (naturalNature === 'MALEFIC') {
    return { sourceNature: 'NATURAL_MALEFIC', naturalNature, functionalNature, classificationBasis };
  }
  if (functionalNature === 'BENEFIC') {
    return { sourceNature: 'FUNCTIONAL_BENEFIC', functionalNature, classificationBasis };
  }
  if (functionalNature === 'MALEFIC') {
    return { sourceNature: 'FUNCTIONAL_MALEFIC', functionalNature, classificationBasis };
  }
  return { sourceNature: 'UNASSESSED', naturalNature, functionalNature, classificationBasis };
}

const byAspectOrder = (a: PlanetaryAspectInfluence, b: PlanetaryAspectInfluence): number =>
  a.sourcePlanet.localeCompare(b.sourcePlanet) ||
  a.targetPlanet.localeCompare(b.targetPlanet) ||
  a.aspectType.localeCompare(b.aspectType) ||
  (a.houseOffset ?? -1) - (b.houseOffset ?? -1);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHouse(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12;
}

function isCanonicalNatalAspectType(value: unknown): value is CanonicalNatalAspectType {
  return typeof value === 'string' && CANONICAL_NATAL_ASPECT_TYPES.has(value);
}

function readAspectRecord(
  value: unknown
):
  | {
      readonly sourcePlanet: Planet;
      readonly targetPlanet: Planet;
      readonly aspectType: CanonicalNatalAspectType;
    }
  | AspectDiagnostic['reason'] {
  if (!isRecord(value)) return 'MISSING_FIELDS';
  const sourcePlanet = value.sourcePlanet ?? value.aspectingPlanet;
  const targetPlanet = value.targetPlanet ?? value.target;
  if (sourcePlanet === undefined || sourcePlanet === null) return 'MISSING_FIELDS';
  if (!isPlanet(sourcePlanet)) return 'INVALID_SOURCE_PLANET';
  if (targetPlanet === undefined || targetPlanet === null) return 'MISSING_FIELDS';
  if (!isPlanet(targetPlanet)) return 'INVALID_TARGET';
  if (!isCanonicalNatalAspectType(value.aspectType)) {
    return 'MISSING_FIELDS';
  }
  if (value.houseOffset !== undefined &&
      (typeof value.houseOffset !== 'number' || !Number.isFinite(value.houseOffset))) {
    return 'MISSING_FIELDS';
  }
  if (
    (value.sourceHouse !== undefined && !isHouse(value.sourceHouse)) ||
    (value.targetHouse !== undefined && !isHouse(value.targetHouse)) ||
    (value.sourceSign !== undefined &&
      (typeof value.sourceSign !== 'string' || value.sourceSign.length === 0)) ||
    (value.targetSign !== undefined &&
      (typeof value.targetSign !== 'string' || value.targetSign.length === 0)) ||
    (value.description !== undefined && typeof value.description !== 'string') ||
    (value.reason !== undefined && typeof value.reason !== 'string')
  ) {
    return 'MISSING_FIELDS';
  }
  return { sourcePlanet, targetPlanet, aspectType: value.aspectType };
}

/**
 * Resolves aspect provenance from the canonical D1 natalGrahaDrishti source.
 * The legacy grahaDrishti field is deliberately never consulted.
 */
export function resolvePlanetaryAspects(
  horoscope: Horoscope,
  planet: Planet
): PlanetaryAspectInfluenceResult {
  const aspects = horoscope.natalGrahaDrishti?.aspects;
  if (!Array.isArray(aspects)) {
    return Object.freeze({
      beneficSources: Object.freeze([]),
      maleficSources: Object.freeze([]),
      mixedSources: Object.freeze([]),
      unassessedSources: Object.freeze([]),
      availability: 'UNAVAILABLE',
      ignoredRecords: Object.freeze([])
    });
  }

  const result: Record<
    'beneficSources' | 'maleficSources' | 'mixedSources' | 'unassessedSources',
    PlanetaryAspectInfluence[]
  > = {
    beneficSources: [],
    maleficSources: [],
    mixedSources: [],
    unassessedSources: []
  };
  const ignoredRecords: AspectDiagnostic[] = [];
  for (const rawAspect of aspects as readonly unknown[]) {
    const parsed = readAspectRecord(rawAspect);
    if (typeof parsed === 'string') {
      ignoredRecords.push(Object.freeze({ record: rawAspect, reason: parsed }));
      continue;
    }
    if (parsed.targetPlanet !== planet) continue;
    const record = rawAspect as CanonicalAspectRecord;

    const aspect: PlanetaryAspectInfluence = Object.freeze({
      sourcePlanet: parsed.sourcePlanet,
      targetPlanet: parsed.targetPlanet,
      aspectType: parsed.aspectType,
      geometricValidation: 'PRODUCER_ASSERTED',
      ...(record.houseOffset !== undefined ? { houseOffset: record.houseOffset } : {}),
      ...classifySource(parsed.sourcePlanet, horoscope),
      ...(record.sourceHouse !== undefined ? { sourceHouse: record.sourceHouse } : {}),
      ...(record.targetHouse !== undefined ? { targetHouse: record.targetHouse } : {}),
      ...(record.sourceSign !== undefined ? { sourceSign: record.sourceSign } : {}),
      ...(record.targetSign !== undefined ? { targetSign: record.targetSign } : {}),
      ...(record.description !== undefined ? { description: record.description } : {}),
      ...(record.reason !== undefined ? { reason: record.reason } : {})
    });

    switch (aspect.sourceNature) {
      case 'NATURAL_BENEFIC':
      case 'FUNCTIONAL_BENEFIC':
        result.beneficSources.push(aspect);
        break;
      case 'NATURAL_MALEFIC':
      case 'FUNCTIONAL_MALEFIC':
        result.maleficSources.push(aspect);
        break;
      case 'MIXED':
        result.mixedSources.push(aspect);
        break;
      case 'UNASSESSED':
        result.unassessedSources.push(aspect);
        break;
    }
  }

  for (const sources of Object.values(result)) sources.sort(byAspectOrder);
  return Object.freeze({
    beneficSources: Object.freeze(result.beneficSources),
    maleficSources: Object.freeze(result.maleficSources),
    mixedSources: Object.freeze(result.mixedSources),
    unassessedSources: Object.freeze(result.unassessedSources),
    availability: ignoredRecords.length === 0 ? 'AVAILABLE' : 'PARTIAL',
    producerStatus: 'ASSUMED_COMPLETE',
    ignoredRecords: Object.freeze(ignoredRecords)
  });
}
