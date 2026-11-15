import { Planet, type Horoscope, type PlanetFact } from '../../types';
import type { YogaEvidence } from '../yoga/yogaTypes';

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
  /** Geometric angular distance between longitudes; it does not classify conjunction effects. */
  readonly angularSeparation?: number;
}

export type InfluenceFactorStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export interface FactorAvailability {
  readonly status: InfluenceFactorStatus;
  readonly source?: string;
}

export interface PlanetaryRelationshipDiagnostic {
  readonly record: unknown;
  readonly reason:
    | 'POSITION_HOUSE_MISMATCH'
    | 'INVALID_YOGA_RECORD'
    | 'INVALID_YOGA_FIELDS'
    | 'INVALID_EVIDENCE_RECORD'
    | 'INVALID_EVIDENCE_FIELDS'
    | 'INVALID_PLANETS';
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
  readonly validationStatus: 'OBSERVED' | 'VALIDATED';
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
  readonly availability: {
    readonly coLocatedPlanets: FactorAvailability;
    readonly exchanges: FactorAvailability;
    readonly relationships: FactorAvailability;
    readonly yogas: FactorAvailability;
  };
  readonly diagnostics: readonly PlanetaryRelationshipDiagnostic[];
}

export interface CanonicalPlanetPosition {
  readonly house?: number;
  readonly sign?: string;
  readonly longitude?: number;
  readonly source: 'planetFacts.position' | 'planetFacts';
  readonly houseMismatch?: {
    readonly factHouse: unknown;
    readonly positionHouse: unknown;
  };
}

function isHouse(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12;
}

export function resolveCanonicalPlanetPosition(
  fact: PlanetFact | undefined
): CanonicalPlanetPosition {
  const position = fact?.position;
  const hasPosition = typeof position === 'object' && position !== null;
  const selectedHouse = hasPosition ? position.house : fact?.house;
  const selectedSign = hasPosition ? position.sign : fact?.sign;
  const factHouse = fact?.house;
  const positionHouse = position?.house;
  const longitude = position?.eclipticLongitude ?? position?.longitude;
  return Object.freeze({
    ...(isHouse(selectedHouse) ? { house: selectedHouse } : {}),
    ...(typeof selectedSign === 'string' && selectedSign.length > 0
      ? { sign: selectedSign }
      : {}),
    ...(typeof longitude === 'number' && Number.isFinite(longitude) ? { longitude } : {}),
    source: hasPosition ? 'planetFacts.position' : 'planetFacts',
    ...(factHouse !== undefined && factHouse !== positionHouse
      ? { houseMismatch: Object.freeze({ factHouse, positionHouse }) }
      : {})
  });
}

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(difference, 360 - difference);
}

function isPlanet(value: unknown): value is Planet {
  return typeof value === 'string' && Object.values(Planet).includes(value as Planet);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlanetArray(value: unknown): value is readonly Planet[] {
  return Array.isArray(value) && Array.from(value).every(isPlanet);
}

function getOwnedHouses(horoscope: Horoscope, planet: Planet): readonly number[] | undefined {
  const houses =
    horoscope.functionalNatureIntegration?.planets?.[planet]?.ownedHouses ??
    horoscope.functionalRoles?.planets?.[planet]?.ownedHouses ??
    horoscope.houseLordship?.planetLordships?.[planet]?.ownedHouses;
  return Array.isArray(houses) && Array.from(houses).every(isHouse) ? houses : undefined;
}

function confirmsExchange(horoscope: Horoscope, planets: readonly Planet[]): boolean {
  if (planets.length !== 2) return false;
  const [first, second] = planets;
  const firstPosition = resolveCanonicalPlanetPosition(horoscope.planetFacts?.[first]);
  const secondPosition = resolveCanonicalPlanetPosition(horoscope.planetFacts?.[second]);
  const firstOwnedHouses = getOwnedHouses(horoscope, first);
  const secondOwnedHouses = getOwnedHouses(horoscope, second);
  return firstPosition.house !== undefined &&
    secondPosition.house !== undefined &&
    firstOwnedHouses !== undefined &&
    secondOwnedHouses !== undefined &&
    firstOwnedHouses.includes(secondPosition.house) &&
    secondOwnedHouses.includes(firstPosition.house);
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
  const targetPosition = resolveCanonicalPlanetPosition(targetFact);
  const targetHouse = targetPosition.house;
  const targetSign = targetPosition.sign;
  const coLocatedPlanets: PlanetaryCoLocation[] = [];
  const diagnostics: PlanetaryRelationshipDiagnostic[] = [];
  const positions = new Map(
    PLANET_ORDER.map((candidate) => [
      candidate,
      resolveCanonicalPlanetPosition(facts?.[candidate])
    ] as const)
  );
  for (const [candidate, position] of positions) {
    if (!position.houseMismatch) continue;
    diagnostics.push(Object.freeze({
      record: Object.freeze({ planet: candidate, ...position.houseMismatch }),
      reason: 'POSITION_HOUSE_MISMATCH'
    }));
  }

  if (targetHouse !== undefined && targetSign !== undefined) {
    for (const otherPlanet of PLANET_ORDER) {
      if (otherPlanet === planet) continue;
      const otherPosition = positions.get(otherPlanet)!;
      const otherHouse = otherPosition.house;
      const otherSign = otherPosition.sign;
      if (otherHouse !== targetHouse || otherSign !== targetSign) continue;
      coLocatedPlanets.push(Object.freeze({
        planet: otherPlanet,
        house: otherHouse,
        sign: otherSign,
        ...(targetPosition.longitude !== undefined && otherPosition.longitude !== undefined
          ? { angularSeparation: angularDistance(targetPosition.longitude, otherPosition.longitude) }
          : {})
      }));
    }
  }

  const relationshipEvidence: PlanetaryRelationshipEvidence[] = [];
  const exchanges: PlanetaryExchangeEvidence[] = [];
  const yogas: PlanetaryYogaParticipation[] = [];
  const rawYogas: unknown = horoscope.yogas?.yogas;
  let yogaErrors = false;
  let relationshipErrors = false;

  if (Array.isArray(rawYogas)) {
    for (const rawYoga of rawYogas as readonly unknown[]) {
      if (!isRecord(rawYoga)) {
        diagnostics.push(Object.freeze({ record: rawYoga, reason: 'INVALID_YOGA_RECORD' }));
        yogaErrors = true;
        relationshipErrors = true;
        continue;
      }

      const yogaPlanets = rawYoga.planets;
      if (!isPlanetArray(yogaPlanets)) {
        diagnostics.push(Object.freeze({ record: rawYoga, reason: 'INVALID_PLANETS' }));
        yogaErrors = true;
        relationshipErrors = true;
        continue;
      }
      if (typeof rawYoga.type !== 'string' || typeof rawYoga.category !== 'string') {
        diagnostics.push(Object.freeze({ record: rawYoga, reason: 'INVALID_YOGA_FIELDS' }));
        yogaErrors = true;
        relationshipErrors = true;
      } else {
        const participantPlanets = Object.freeze(
          PLANET_ORDER.filter((candidate) => yogaPlanets.includes(candidate))
        );
        if (participantPlanets.includes(planet)) {
          const evidenceRecords = Array.isArray(rawYoga.evidence) ? rawYoga.evidence : [];
          const ruleIds = evidenceRecords.flatMap((item: unknown) =>
            isRecord(item) &&
            isPlanetArray(item.planets) &&
            typeof item.ruleId === 'string'
              ? [item.ruleId]
              : []
          ).sort((a, b) => a.localeCompare(b));
          yogas.push(Object.freeze({
            type: rawYoga.type,
            category: rawYoga.category,
            ...(typeof rawYoga.finalStatus === 'string'
              ? { finalStatus: rawYoga.finalStatus }
              : {}),
            participantPlanets,
            ruleIds: Object.freeze(ruleIds)
          }));
        }
      }

      if (!Array.isArray(rawYoga.evidence)) {
        diagnostics.push(Object.freeze({ record: rawYoga, reason: 'INVALID_EVIDENCE_RECORD' }));
        relationshipErrors = true;
        continue;
      }

      for (const rawEvidence of rawYoga.evidence as readonly unknown[]) {
        if (!isRecord(rawEvidence)) {
          diagnostics.push(Object.freeze({
            record: rawEvidence,
            reason: 'INVALID_EVIDENCE_RECORD'
          }));
          relationshipErrors = true;
          continue;
        }
        if (!isPlanetArray(rawEvidence.planets)) {
          diagnostics.push(Object.freeze({ record: rawEvidence, reason: 'INVALID_PLANETS' }));
          relationshipErrors = true;
          continue;
        }
        if (rawEvidence.relationship === undefined) continue;
        if (
          rawEvidence.relationship !== 'CONJUNCTION' &&
          rawEvidence.relationship !== 'MUTUAL_ASPECT' &&
          rawEvidence.relationship !== 'EXCHANGE'
        ) {
          diagnostics.push(Object.freeze({
            record: rawEvidence,
            reason: 'INVALID_EVIDENCE_FIELDS'
          }));
          relationshipErrors = true;
          continue;
        }
        if (
          typeof rawEvidence.ruleId !== 'string' ||
          rawEvidence.ruleId.length === 0 ||
          typeof rawEvidence.reason !== 'string'
        ) {
          diagnostics.push(Object.freeze({
            record: rawEvidence,
            reason: 'INVALID_EVIDENCE_FIELDS'
          }));
          relationshipErrors = true;
          continue;
        }
        const evidencePlanets = rawEvidence.planets as readonly Planet[];
        if (!evidencePlanets.includes(planet) || typeof rawYoga.type !== 'string') continue;
        relationshipEvidence.push(Object.freeze({
          relationship: rawEvidence.relationship,
          planets: Object.freeze(
            PLANET_ORDER.filter((candidate) => evidencePlanets.includes(candidate))
          ),
          ruleId: rawEvidence.ruleId,
          yogaType: rawYoga.type,
          reason: rawEvidence.reason
        }));
      }
    }
  }

  const participantKey = (participants: readonly Planet[]) =>
    [...participants].sort((a, b) => a.localeCompare(b)).join(',');
  relationshipEvidence.sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId) ||
    participantKey(a.planets).localeCompare(participantKey(b.planets)) ||
    a.relationship.localeCompare(b.relationship) ||
    a.yogaType.localeCompare(b.yogaType)
  );
  const seenRelationships = new Set<string>();
  const deduplicatedRelationships = relationshipEvidence.filter((item) => {
    const identity = `${item.ruleId}|${participantKey(item.planets)}`;
    if (seenRelationships.has(identity)) return false;
    seenRelationships.add(identity);
    return true;
  });
  for (const item of deduplicatedRelationships) {
    if (item.relationship !== 'EXCHANGE') continue;
    exchanges.push(Object.freeze({
      ...item,
      relationship: 'EXCHANGE',
      validationStatus: confirmsExchange(horoscope, item.planets) ? 'VALIDATED' : 'OBSERVED'
    }));
  }
  exchanges.sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId) || participantKey(a.planets).localeCompare(participantKey(b.planets))
  );
  yogas.sort((a, b) => a.type.localeCompare(b.type));

  const targetPlacementAvailable = targetHouse !== undefined && targetSign !== undefined;
  const allPlacementsAvailable = PLANET_ORDER.every((candidate) => {
    const position = resolveCanonicalPlanetPosition(facts?.[candidate]);
    return position.house !== undefined && position.sign !== undefined;
  });
  const coLocationStatus: InfluenceFactorStatus = !targetPlacementAvailable
    ? 'UNAVAILABLE'
    : allPlacementsAvailable && diagnostics.every((item) => item.reason !== 'POSITION_HOUSE_MISMATCH')
      ? 'AVAILABLE'
      : 'PARTIAL';
  const yogaInputAvailable = Array.isArray(rawYogas);
  const relationshipsStatus: InfluenceFactorStatus = !yogaInputAvailable
    ? 'UNAVAILABLE'
    : relationshipErrors ? 'PARTIAL' : 'AVAILABLE';
  const yogasStatus: InfluenceFactorStatus = !yogaInputAvailable
    ? 'UNAVAILABLE'
    : yogaErrors ? 'PARTIAL' : 'AVAILABLE';

  return Object.freeze({
    coLocatedPlanets: Object.freeze(coLocatedPlanets),
    exchanges: Object.freeze(exchanges),
    relationshipEvidence: Object.freeze(deduplicatedRelationships),
    yogas: Object.freeze(yogas),
    availability: Object.freeze({
      coLocatedPlanets: Object.freeze({
        status: coLocationStatus,
        source: targetPosition.source
      }),
      exchanges: Object.freeze({
        status: relationshipsStatus,
        source: 'yogas.yogas[].evidence'
      }),
      relationships: Object.freeze({
        status: relationshipsStatus,
        source: 'yogas.yogas[].evidence'
      }),
      yogas: Object.freeze({
        status: yogasStatus,
        source: 'yogas.yogas'
      })
    }),
    diagnostics: Object.freeze(diagnostics)
  });
}

