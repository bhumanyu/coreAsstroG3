import {
  AspectType,
  Planet,
  type Horoscope,
  type NatalGrahaDrishtiComputationStatus
} from '../../types';
import {
  isNaturalBenefic,
  NATURAL_CLASSIFICATION_RULE_VERSION
} from '../planetaryStrength/drikBala';
import { normalizeDegree } from '../nakshatraUtils';

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
  readonly naturalClassificationProvenance: {
    readonly ruleVersion: typeof NATURAL_CLASSIFICATION_RULE_VERSION;
    readonly inputs:
      | {
          readonly rule: 'NATURAL_BENEFIC_TABLE';
          readonly planet: Planet;
        }
      | {
          readonly rule: 'MERCURY_ASSOCIATION';
          readonly mercuryHouse?: number;
          readonly maleficHouses: readonly {
            readonly planet: Planet;
            readonly house?: number;
          }[];
        }
      | {
          readonly rule: 'MOON_PHASE';
          readonly sunLongitude?: number;
          readonly moonLongitude?: number;
          readonly phaseAngle?: number;
        };
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
  readonly reason:
    | 'INVALID_SOURCE_PLANET'
    | 'INVALID_TARGET'
    | 'MISSING_FIELDS'
    | 'ASPECT_COMPUTATION_STATUS_UNKNOWN'
    | 'ASPECT_COMPUTATION_PARTIAL'
    | 'ASPECT_COMPUTATION_UNAVAILABLE'
    | 'ASPECT_PRODUCER_DIAGNOSTIC'
    | 'ASPECT_RECORDS_MISSING';
  readonly detail?: string;
}

export interface PlanetaryAspectInfluenceResult {
  readonly beneficSources: readonly PlanetaryAspectInfluence[];
  readonly maleficSources: readonly PlanetaryAspectInfluence[];
  readonly mixedSources: readonly PlanetaryAspectInfluence[];
  readonly unassessedSources: readonly PlanetaryAspectInfluence[];
  readonly availability: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  readonly producerStatus?: NatalGrahaDrishtiComputationStatus | 'UNKNOWN';
  readonly ignoredRecords: readonly AspectDiagnostic[];
  readonly diagnostics: readonly AspectDiagnostic[];
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

function getNaturalClassification(
  planet: Planet,
  horoscope: Horoscope
): {
  readonly nature?: 'BENEFIC' | 'MALEFIC';
  readonly provenance: PlanetaryAspectInfluence['naturalClassificationProvenance'];
} {
  const facts = horoscope.planetFacts;
  const rule = getNaturalRule(planet);
  if (planet === Planet.MOON) {
    const sunLongitude = facts?.[Planet.SUN]?.position?.eclipticLongitude;
    const moonLongitude = facts?.[Planet.MOON]?.position?.eclipticLongitude;
    const hasPhaseInputs = Number.isFinite(sunLongitude) && Number.isFinite(moonLongitude);
    return {
      ...(facts?.[planet] && hasPhaseInputs
        ? { nature: isNaturalBenefic(planet, facts) ? 'BENEFIC' as const : 'MALEFIC' as const }
        : {}),
      provenance: Object.freeze({
        ruleVersion: NATURAL_CLASSIFICATION_RULE_VERSION,
        inputs: Object.freeze({
          rule: 'MOON_PHASE',
          ...(typeof sunLongitude === 'number' && Number.isFinite(sunLongitude)
            ? { sunLongitude }
            : {}),
          ...(typeof moonLongitude === 'number' && Number.isFinite(moonLongitude)
            ? { moonLongitude }
            : {}),
          ...(typeof sunLongitude === 'number' && Number.isFinite(sunLongitude) &&
              typeof moonLongitude === 'number' && Number.isFinite(moonLongitude)
            ? { phaseAngle: normalizeDegree(moonLongitude - sunLongitude) }
            : {})
        })
      })
    };
  }

  if (planet === Planet.MERCURY) {
    const mercuryHouse = facts?.[Planet.MERCURY]?.house;
    const maleficPlanets = [
      Planet.SUN,
      Planet.MARS,
      Planet.SATURN,
      Planet.RAHU,
      Planet.KETU
    ] as const;
    const maleficHouses = maleficPlanets.map((malefic) => {
      const house = facts?.[malefic]?.house;
      return Object.freeze({
        planet: malefic,
        ...(typeof house === 'number' && Number.isFinite(house) ? { house } : {})
      });
    });
    const hasAssociationInputs =
      typeof mercuryHouse === 'number' &&
      Number.isFinite(mercuryHouse) &&
      maleficHouses.every((item) => item.house !== undefined);
    return {
      ...(facts?.[planet] && facts && hasAssociationInputs
        ? { nature: isNaturalBenefic(planet, facts) ? 'BENEFIC' as const : 'MALEFIC' as const }
        : {}),
      provenance: Object.freeze({
        ruleVersion: NATURAL_CLASSIFICATION_RULE_VERSION,
        inputs: Object.freeze({
          rule: 'MERCURY_ASSOCIATION',
          ...(typeof mercuryHouse === 'number' && Number.isFinite(mercuryHouse)
            ? { mercuryHouse }
            : {}),
          maleficHouses: Object.freeze(maleficHouses)
        })
      })
    };
  }

  if (!facts) {
    return {
      provenance: Object.freeze({
        ruleVersion: NATURAL_CLASSIFICATION_RULE_VERSION,
        inputs: Object.freeze({ rule: 'NATURAL_BENEFIC_TABLE', planet } as const)
      })
    };
  }

  const nature = facts[planet]
    ? isNaturalBenefic(planet, facts) ? 'BENEFIC' as const : 'MALEFIC' as const
    : undefined;
  return {
    ...(nature ? { nature } : {}),
    provenance: Object.freeze({
      ruleVersion: NATURAL_CLASSIFICATION_RULE_VERSION,
      inputs: Object.freeze({ rule: 'NATURAL_BENEFIC_TABLE', planet } as const)
    })
  };
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
  | 'sourceNature'
  | 'naturalNature'
  | 'functionalNature'
  | 'classificationBasis'
  | 'naturalClassificationProvenance'
> {
  const naturalClassification = getNaturalClassification(planet, horoscope);
  const naturalNature = naturalClassification.nature;
  const functional = getFunctionalNature(planet, horoscope);
  const functionalNature = functional.nature;
  const classificationBasis = Object.freeze({
    naturalRule: getNaturalRule(planet),
    functionalSource: functional.source,
    consumedBy: Object.freeze([])
  });
  const provenance = naturalClassification.provenance;

  if (functionalNature === 'MIXED' ||
      (naturalNature !== undefined &&
        ((naturalNature === 'BENEFIC' && functionalNature === 'MALEFIC') ||
          (naturalNature === 'MALEFIC' && functionalNature === 'BENEFIC')))) {
    return {
      sourceNature: 'MIXED',
      naturalNature,
      functionalNature,
      classificationBasis,
      naturalClassificationProvenance: provenance
    };
  }
  if (naturalNature === 'BENEFIC') {
    return {
      sourceNature: 'NATURAL_BENEFIC',
      naturalNature,
      functionalNature,
      classificationBasis,
      naturalClassificationProvenance: provenance
    };
  }
  if (naturalNature === 'MALEFIC') {
    return {
      sourceNature: 'NATURAL_MALEFIC',
      naturalNature,
      functionalNature,
      classificationBasis,
      naturalClassificationProvenance: provenance
    };
  }
  if (functionalNature === 'BENEFIC') {
    return {
      sourceNature: 'FUNCTIONAL_BENEFIC',
      functionalNature,
      classificationBasis,
      naturalClassificationProvenance: provenance
    };
  }
  if (functionalNature === 'MALEFIC') {
    return {
      sourceNature: 'FUNCTIONAL_MALEFIC',
      functionalNature,
      classificationBasis,
      naturalClassificationProvenance: provenance
    };
  }
  return {
    sourceNature: 'UNASSESSED',
    naturalNature,
    functionalNature,
    classificationBasis,
    naturalClassificationProvenance: provenance
  };
}

const byAspectOrder = (a: PlanetaryAspectInfluence, b: PlanetaryAspectInfluence): number =>
  a.sourcePlanet.localeCompare(b.sourcePlanet) ||
  a.targetPlanet.localeCompare(b.targetPlanet) ||
  a.aspectType.localeCompare(b.aspectType) ||
  (a.houseOffset ?? -1) - (b.houseOffset ?? -1);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isComputationStatus(
  value: unknown
): value is NatalGrahaDrishtiComputationStatus {
  return value === 'COMPLETE' || value === 'PARTIAL' || value === 'UNAVAILABLE';
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
  const report = horoscope.natalGrahaDrishti;
  const aspects = report?.aspects;
  const producerStatus: NatalGrahaDrishtiComputationStatus | 'UNKNOWN' | undefined =
    !report
      ? undefined
      : isComputationStatus(report.computationStatus)
        ? report.computationStatus
        : 'UNKNOWN';
  const diagnostics: AspectDiagnostic[] = [];
  if (producerStatus === 'UNKNOWN') {
    diagnostics.push(Object.freeze({
      record: report,
      reason: 'ASPECT_COMPUTATION_STATUS_UNKNOWN'
    }));
  } else if (producerStatus === 'PARTIAL') {
    diagnostics.push(Object.freeze({
      record: report,
      reason: 'ASPECT_COMPUTATION_PARTIAL'
    }));
  } else if (producerStatus === 'UNAVAILABLE') {
    diagnostics.push(Object.freeze({
      record: report,
      reason: 'ASPECT_COMPUTATION_UNAVAILABLE'
    }));
  }
  const rawProducerDiagnostics: unknown = report?.diagnostics;
  if (rawProducerDiagnostics !== undefined && !Array.isArray(rawProducerDiagnostics)) {
    diagnostics.push(Object.freeze({
      record: rawProducerDiagnostics,
      reason: 'ASPECT_PRODUCER_DIAGNOSTIC',
      detail: 'INVALID_PRODUCER_DIAGNOSTICS'
    }));
  } else {
    for (const rawDiagnostic of (rawProducerDiagnostics ?? []) as readonly unknown[]) {
      diagnostics.push(Object.freeze({
        record: rawDiagnostic,
        reason: 'ASPECT_PRODUCER_DIAGNOSTIC',
        detail: isRecord(rawDiagnostic) && typeof rawDiagnostic.code === 'string'
          ? rawDiagnostic.code
          : 'INVALID_PRODUCER_DIAGNOSTIC'
      }));
    }
  }
  if (!Array.isArray(aspects)) {
    return Object.freeze({
      beneficSources: Object.freeze([]),
      maleficSources: Object.freeze([]),
      mixedSources: Object.freeze([]),
      unassessedSources: Object.freeze([]),
      availability: 'UNAVAILABLE',
      ...(producerStatus ? { producerStatus } : {}),
      ignoredRecords: Object.freeze([]),
      diagnostics: Object.freeze([
        ...diagnostics,
        ...(report
          ? [Object.freeze({
              record: report,
              reason: 'ASPECT_RECORDS_MISSING' as const
            })]
          : [])
      ])
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
      const diagnostic = Object.freeze({ record: rawAspect, reason: parsed });
      ignoredRecords.push(diagnostic);
      diagnostics.push(diagnostic);
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
    availability: producerStatus === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : producerStatus !== 'COMPLETE' ||
          ignoredRecords.length > 0 ||
          diagnostics.some((diagnostic) => diagnostic.reason === 'ASPECT_PRODUCER_DIAGNOSTIC')
        ? 'PARTIAL'
        : 'AVAILABLE',
    ...(producerStatus ? { producerStatus } : {}),
    ignoredRecords: Object.freeze(ignoredRecords),
    diagnostics: Object.freeze(diagnostics)
  });
}
