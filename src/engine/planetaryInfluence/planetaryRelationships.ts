import { Planet, type Horoscope, type PlanetFact } from '../../types';
import type { YogaEvidence, YogaResult } from '../yoga/yogaTypes';

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

export interface PlanetaryCoLocation {
  readonly planet: Planet;
  readonly house: number;
  readonly sign: string;
  readonly angularSeparation?: number;
}

export interface PlanetaryRelationshipEvidence {
  readonly relationship: NonNullable<YogaEvidence['relationship']>;
  readonly planets: readonly Planet[];
  readonly ruleId: string;
  readonly yogaType: string;
  readonly reason: string;
}

export interface PlanetaryExchangeEvidence extends PlanetaryRelationshipEvidence {
  readonly relationship: 'EXCHANGE';
}

export interface PlanetaryYogaParticipation {
  readonly type: string;
  readonly category: string;
  readonly finalStatus?: string;
  readonly participantPlanets: readonly Planet[];
  readonly ruleIds: readonly string[];
}

export interface PlanetaryRelationshipResult {
  readonly coLocatedPlanets: readonly PlanetaryCoLocation[];
  readonly exchanges: readonly PlanetaryExchangeEvidence[];
  readonly relationshipEvidence: readonly PlanetaryRelationshipEvidence[];
  readonly yogas: readonly PlanetaryYogaParticipation[];
}

function getHouse(fact: PlanetFact | undefined): number | undefined {
  const house = fact?.house ?? fact?.position?.house;
  return typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12
    ? house
    : undefined;
}

function getSign(fact: PlanetFact | undefined): string | undefined {
  const sign = fact?.sign ?? fact?.position?.sign;
  return typeof sign === 'string' ? sign : undefined;
}

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(difference, 360 - difference);
}

function getRelationshipRecords(
  horoscope: Horoscope
): readonly { readonly yoga: YogaResult; readonly evidence: YogaEvidence }[] | undefined {
  const yogas = horoscope.yogas?.yogas;
  if (!Array.isArray(yogas)) return undefined;
  return (yogas as readonly YogaResult[]).flatMap((yoga: YogaResult) =>
    (yoga.evidence ?? [])
      .filter((evidence: YogaEvidence) => evidence.relationship !== undefined)
      .map((evidence: YogaEvidence) => ({ yoga, evidence }))
  );
}

/**
 * Returns observed co-location and existing relationship evidence for one planet.
 * No conjunction effect or new exchange relationship is inferred here.
 */
export function resolvePlanetaryRelationships(
  horoscope: Horoscope,
  planet: Planet
): PlanetaryRelationshipResult {
  const facts = horoscope.planetFacts;
  const targetFact = facts?.[planet];
  const targetHouse = getHouse(targetFact);
  const targetSign = getSign(targetFact);
  const coLocatedPlanets: PlanetaryCoLocation[] = [];

  if (targetHouse !== undefined && targetSign !== undefined) {
    for (const otherPlanet of PLANET_ORDER) {
      if (otherPlanet === planet) continue;
      const otherFact = facts?.[otherPlanet];
      const otherHouse = getHouse(otherFact);
      const otherSign = getSign(otherFact);
      if (otherHouse !== targetHouse || otherSign !== targetSign) continue;

      const targetLongitude = targetFact?.position?.eclipticLongitude ?? targetFact?.position?.longitude;
      const otherLongitude = otherFact?.position?.eclipticLongitude ?? otherFact?.position?.longitude;
      coLocatedPlanets.push(Object.freeze({
        planet: otherPlanet,
        house: otherHouse,
        sign: otherSign,
        ...(typeof targetLongitude === 'number' && Number.isFinite(targetLongitude) &&
          typeof otherLongitude === 'number' && Number.isFinite(otherLongitude)
          ? { angularSeparation: angularDistance(targetLongitude, otherLongitude) }
          : {})
      }));
    }
  }

  const records = getRelationshipRecords(horoscope);
  const relationshipEvidence: PlanetaryRelationshipEvidence[] = [];
  const exchanges: PlanetaryExchangeEvidence[] = [];
  const yogas: PlanetaryYogaParticipation[] = [];
  if (records) {
    for (const { yoga, evidence } of records) {
      if (!evidence.planets.includes(planet)) continue;
      const planets = Object.freeze(
        PLANET_ORDER.filter((candidate) => evidence.planets.includes(candidate))
      );
      const item: PlanetaryRelationshipEvidence = Object.freeze({
        relationship: evidence.relationship!,
        planets,
        ruleId: evidence.ruleId,
        yogaType: String(yoga.type),
        reason: evidence.reason
      });
      relationshipEvidence.push(item);
      if (item.relationship === 'EXCHANGE') {
        exchanges.push(item as PlanetaryExchangeEvidence);
      }
    }
    for (const yoga of horoscope.yogas!.yogas) {
      if (!yoga.planets.includes(planet)) continue;
      const participantPlanets = Object.freeze(
        PLANET_ORDER.filter((candidate) => yoga.planets.includes(candidate))
      );
      const ruleIds = (yoga.evidence ?? [])
        .map((evidence) => evidence.ruleId)
        .sort((a, b) => a.localeCompare(b));
      yogas.push(Object.freeze({
        type: String(yoga.type),
        category: String(yoga.category),
        ...(yoga.finalStatus ? { finalStatus: yoga.finalStatus } : {}),
        participantPlanets,
        ruleIds: Object.freeze(ruleIds)
      }));
    }
  }

  relationshipEvidence.sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId) || a.relationship.localeCompare(b.relationship)
  );
  exchanges.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  yogas.sort((a, b) => a.type.localeCompare(b.type));

  return Object.freeze({
    coLocatedPlanets: Object.freeze(coLocatedPlanets),
    exchanges: Object.freeze(exchanges),
    relationshipEvidence: Object.freeze(relationshipEvidence),
    yogas: Object.freeze(yogas)
  });
}

