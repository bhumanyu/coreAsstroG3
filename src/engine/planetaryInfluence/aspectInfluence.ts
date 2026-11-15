import { Planet, type Horoscope } from '../../types';
import { isNaturalBenefic } from '../planetaryStrength/drikBala';

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
  readonly aspectType: string;
  readonly houseOffset?: number;
  readonly sourceNature: PlanetarySourceNature;
  readonly naturalNature?: 'BENEFIC' | 'MALEFIC';
  readonly functionalNature?: 'BENEFIC' | 'MALEFIC' | 'MIXED' | 'NEUTRAL';
  readonly sourceHouse?: number;
  readonly targetHouse?: number;
  readonly sourceSign?: string;
  readonly targetSign?: string;
  readonly description?: string;
  readonly reason?: string;
}

export interface PlanetaryAspectInfluenceResult {
  readonly beneficSources: readonly PlanetaryAspectInfluence[];
  readonly maleficSources: readonly PlanetaryAspectInfluence[];
  readonly mixedSources: readonly PlanetaryAspectInfluence[];
  readonly unassessedSources: readonly PlanetaryAspectInfluence[];
  readonly availability: 'AVAILABLE' | 'UNAVAILABLE';
}

interface CanonicalAspectRecord {
  readonly sourcePlanet?: Planet;
  readonly aspectingPlanet?: Planet;
  readonly targetPlanet?: Planet;
  readonly target?: Planet;
  readonly aspectType?: string;
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

function getFunctionalNature(
  planet: Planet,
  horoscope: Horoscope
): FunctionalClassification | undefined {
  const nature =
    horoscope.functionalNatureIntegration?.planets?.[planet]?.functionalNature ??
    horoscope.functionalRoles?.planets?.[planet]?.functionalNature;
  return nature === 'BENEFIC' || nature === 'MALEFIC' || nature === 'MIXED' || nature === 'NEUTRAL'
    ? nature
    : undefined;
}

function classifySource(
  planet: Planet,
  horoscope: Horoscope
): Pick<PlanetaryAspectInfluence, 'sourceNature' | 'naturalNature' | 'functionalNature'> {
  const naturalNature = getNaturalNature(planet, horoscope);
  const functionalNature = getFunctionalNature(planet, horoscope);

  if (functionalNature === 'MIXED' ||
      (naturalNature !== undefined &&
        ((naturalNature === 'BENEFIC' && functionalNature === 'MALEFIC') ||
          (naturalNature === 'MALEFIC' && functionalNature === 'BENEFIC')))) {
    return { sourceNature: 'MIXED', naturalNature, functionalNature };
  }
  if (naturalNature === 'BENEFIC') {
    return { sourceNature: 'NATURAL_BENEFIC', naturalNature, functionalNature };
  }
  if (naturalNature === 'MALEFIC') {
    return { sourceNature: 'NATURAL_MALEFIC', naturalNature, functionalNature };
  }
  if (functionalNature === 'BENEFIC') {
    return { sourceNature: 'FUNCTIONAL_BENEFIC', functionalNature };
  }
  if (functionalNature === 'MALEFIC') {
    return { sourceNature: 'FUNCTIONAL_MALEFIC', functionalNature };
  }
  return { sourceNature: 'UNASSESSED', naturalNature, functionalNature };
}

const byAspectOrder = (a: PlanetaryAspectInfluence, b: PlanetaryAspectInfluence): number =>
  a.sourcePlanet.localeCompare(b.sourcePlanet) ||
  a.targetPlanet.localeCompare(b.targetPlanet) ||
  a.aspectType.localeCompare(b.aspectType) ||
  (a.houseOffset ?? -1) - (b.houseOffset ?? -1);

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
      availability: 'UNAVAILABLE'
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
  for (const rawAspect of aspects as readonly CanonicalAspectRecord[]) {
    const sourcePlanet = rawAspect.sourcePlanet ?? rawAspect.aspectingPlanet;
    const targetPlanet = rawAspect.targetPlanet ?? rawAspect.target;
    if (!isPlanet(sourcePlanet) || targetPlanet !== planet) continue;

    const aspect: PlanetaryAspectInfluence = Object.freeze({
      sourcePlanet,
      targetPlanet: planet,
      aspectType: rawAspect.aspectType ?? 'UNSPECIFIED',
      ...(rawAspect.houseOffset !== undefined ? { houseOffset: rawAspect.houseOffset } : {}),
      ...classifySource(sourcePlanet, horoscope),
      ...(rawAspect.sourceHouse !== undefined ? { sourceHouse: rawAspect.sourceHouse } : {}),
      ...(rawAspect.targetHouse !== undefined ? { targetHouse: rawAspect.targetHouse } : {}),
      ...(rawAspect.sourceSign !== undefined ? { sourceSign: rawAspect.sourceSign } : {}),
      ...(rawAspect.targetSign !== undefined ? { targetSign: rawAspect.targetSign } : {}),
      ...(rawAspect.description !== undefined ? { description: rawAspect.description } : {}),
      ...(rawAspect.reason !== undefined ? { reason: rawAspect.reason } : {})
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
    availability: 'AVAILABLE'
  });
}
