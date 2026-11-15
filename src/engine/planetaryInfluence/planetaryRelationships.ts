import { Planet, Sign, type Horoscope, type PlanetFact } from '../../types';
import { SIGNS_METADATA } from '../../data/astroData';

export type PlanetaryRelationshipKind = 'CONJUNCTION' | 'MUTUAL_ASPECT' | 'EXCHANGE';

export interface PlanetaryRelationshipEvidenceInput {
  readonly records: readonly unknown[];
}

export interface PlanetaryYogaParticipationInput {
  readonly records: readonly unknown[];
}

export interface PlanetaryRelationshipInputs {
  readonly relationshipEvidence?: PlanetaryRelationshipEvidenceInput;
  readonly yogaParticipation?: PlanetaryYogaParticipationInput;
}

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
  readonly sign: Sign;
  /** Geometric angular distance between longitudes; it does not classify conjunction effects. */
  readonly angularSeparation?: number;
}

export type InfluenceFactorStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export interface FactorAvailability {
  readonly status: InfluenceFactorStatus;
  readonly source?: string;
  readonly producerStatus?: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' | 'UNKNOWN';
}

export interface PlanetaryRelationshipDiagnostic {
  readonly record: unknown;
  readonly reason:
    | 'POSITION_HOUSE_MISMATCH'
    | 'EXCHANGE_SIGN_LORDSHIP_UNAVAILABLE'
    | 'INVALID_YOGA_RECORD'
    | 'INVALID_YOGA_FIELDS'
    | 'INVALID_EVIDENCE_RECORD'
    | 'INVALID_EVIDENCE_FIELDS'
    | 'INVALID_PLANETS';
}

export interface PlanetaryRelationshipEvidence {
  readonly relationship: PlanetaryRelationshipKind;
  readonly planets: readonly Planet[];
  readonly ruleId: string;
  readonly yogaType: string;
  readonly reason: string;
  readonly producerEvidenceId?: string;
}

export interface PlanetaryExchangeEvidence extends PlanetaryRelationshipEvidence {
  readonly relationship: 'EXCHANGE';
  readonly validationStatus: 'OBSERVED' | 'VALIDATED_SIGN_EXCHANGE';
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
    readonly coLocationByHouseSign: FactorAvailability;
    readonly angularSeparation: FactorAvailability;
    readonly exchanges: FactorAvailability;
    readonly relationships: FactorAvailability;
    readonly yogas: FactorAvailability;
  };
  readonly diagnostics: readonly PlanetaryRelationshipDiagnostic[];
}

export interface CanonicalPlanetPosition {
  readonly house?: number;
  readonly sign?: Sign;
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

function isSign(value: unknown): value is Sign {
  return typeof value === 'string' && Object.values(Sign).includes(value as Sign);
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
    ...(isSign(selectedSign) ? { sign: selectedSign } : {}),
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

function validateSignExchange(
  horoscope: Horoscope,
  planets: readonly Planet[]
): {
  readonly validationStatus: PlanetaryExchangeEvidence['validationStatus'];
  readonly unavailable: boolean;
} {
  if (planets.length !== 2) {
    return { validationStatus: 'OBSERVED', unavailable: true };
  }
  const [first, second] = planets;
  const firstPosition = resolveCanonicalPlanetPosition(horoscope.planetFacts?.[first]);
  const secondPosition = resolveCanonicalPlanetPosition(horoscope.planetFacts?.[second]);
  const firstRuler = firstPosition.sign
    ? SIGNS_METADATA[firstPosition.sign]?.ruler
    : undefined;
  const secondRuler = secondPosition.sign
    ? SIGNS_METADATA[secondPosition.sign]?.ruler
    : undefined;
  if (!firstRuler || !secondRuler) {
    return { validationStatus: 'OBSERVED', unavailable: true };
  }
  return {
    validationStatus: firstRuler === second && secondRuler === first
      ? 'VALIDATED_SIGN_EXCHANGE'
      : 'OBSERVED',
    unavailable: false
  };
}

function getProducerEvidenceId(record: Record<string, unknown>): string | undefined {
  for (const key of [
    'sourceOccurrenceId',
    'occurrenceId',
    'evidenceId',
    'relationshipEvidenceId',
    'id'
  ]) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return `${key}:${value}`;
  }
  return undefined;
}

function hasValidProducerEvidenceId(record: Record<string, unknown>): boolean {
  return [
    'sourceOccurrenceId',
    'occurrenceId',
    'evidenceId',
    'relationshipEvidenceId',
    'id'
  ].every((key) => record[key] === undefined ||
    (typeof record[key] === 'string' && record[key].length > 0));
}

/**
 * Returns observed co-location and existing relationship evidence for one planet.
 * No conjunction effect or new exchange relationship is inferred here.
 */
export function resolvePlanetaryRelationships(
  horoscope: Horoscope,
  planet: Planet,
  inputs?: PlanetaryRelationshipInputs
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
  const rawYogas: unknown =
    inputs?.yogaParticipation?.records ?? horoscope.yogas?.yogas;
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
      if (
        typeof rawYoga.type !== 'string' ||
        rawYoga.type.length === 0 ||
        typeof rawYoga.category !== 'string' ||
        rawYoga.category.length === 0 ||
        (rawYoga.finalStatus !== undefined &&
          (typeof rawYoga.finalStatus !== 'string' || rawYoga.finalStatus.length === 0))
      ) {
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
            typeof item.ruleId === 'string' &&
            item.ruleId.length > 0 &&
            typeof item.reason === 'string' &&
            item.reason.length > 0 &&
            hasValidProducerEvidenceId(item)
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
        if (
          typeof rawEvidence.ruleId !== 'string' ||
          rawEvidence.ruleId.length === 0 ||
          typeof rawEvidence.reason !== 'string' ||
          rawEvidence.reason.length === 0 ||
          !hasValidProducerEvidenceId(rawEvidence)
        ) {
          diagnostics.push(Object.freeze({
            record: rawEvidence,
            reason: 'INVALID_EVIDENCE_FIELDS'
          }));
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
        const evidencePlanets = rawEvidence.planets as readonly Planet[];
        if (!evidencePlanets.includes(planet) || typeof rawYoga.type !== 'string') continue;
        const producerEvidenceId = getProducerEvidenceId(rawEvidence);
        relationshipEvidence.push(Object.freeze({
          relationship: rawEvidence.relationship,
          planets: Object.freeze(
            PLANET_ORDER.filter((candidate) => evidencePlanets.includes(candidate))
          ),
          ruleId: rawEvidence.ruleId,
          yogaType: rawYoga.type,
          reason: rawEvidence.reason,
          ...(producerEvidenceId ? { producerEvidenceId } : {})
        }));
      }
    }
  }

  for (const rawEvidence of inputs?.relationshipEvidence?.records ?? []) {
    if (!isRecord(rawEvidence)) {
      diagnostics.push(Object.freeze({ record: rawEvidence, reason: 'INVALID_EVIDENCE_RECORD' }));
      relationshipErrors = true;
      continue;
    }
    if (!isPlanetArray(rawEvidence.planets)) {
      diagnostics.push(Object.freeze({ record: rawEvidence, reason: 'INVALID_PLANETS' }));
      relationshipErrors = true;
      continue;
    }
    if (
      rawEvidence.relationship !== 'CONJUNCTION' &&
      rawEvidence.relationship !== 'MUTUAL_ASPECT' &&
      rawEvidence.relationship !== 'EXCHANGE'
    ) {
      diagnostics.push(Object.freeze({ record: rawEvidence, reason: 'INVALID_EVIDENCE_FIELDS' }));
      relationshipErrors = true;
      continue;
    }
    if (
      typeof rawEvidence.ruleId !== 'string' ||
      rawEvidence.ruleId.length === 0 ||
      typeof rawEvidence.reason !== 'string' ||
      rawEvidence.reason.length === 0 ||
      (rawEvidence.yogaType !== undefined &&
        (typeof rawEvidence.yogaType !== 'string' || rawEvidence.yogaType.length === 0)) ||
      !hasValidProducerEvidenceId(rawEvidence)
    ) {
      diagnostics.push(Object.freeze({ record: rawEvidence, reason: 'INVALID_EVIDENCE_FIELDS' }));
      relationshipErrors = true;
      continue;
    }
    const evidencePlanets = rawEvidence.planets as readonly Planet[];
    if (!evidencePlanets.includes(planet)) continue;
    const producerEvidenceId = getProducerEvidenceId(rawEvidence);
    relationshipEvidence.push(Object.freeze({
      relationship: rawEvidence.relationship,
      planets: Object.freeze(
        PLANET_ORDER.filter((candidate) => evidencePlanets.includes(candidate))
      ),
      ruleId: rawEvidence.ruleId,
      yogaType: typeof rawEvidence.yogaType === 'string' ? rawEvidence.yogaType : 'UNSPECIFIED',
      reason: rawEvidence.reason,
      ...(producerEvidenceId ? { producerEvidenceId } : {})
    }));
  }

  const participantKey = (participants: readonly Planet[]) =>
    [...participants].sort((a, b) => a.localeCompare(b)).join(',');
  relationshipEvidence.sort((a, b) =>
    a.ruleId.localeCompare(b.ruleId) ||
    participantKey(a.planets).localeCompare(participantKey(b.planets)) ||
    a.relationship.localeCompare(b.relationship) ||
    a.yogaType.localeCompare(b.yogaType) ||
    (a.producerEvidenceId ?? '').localeCompare(b.producerEvidenceId ?? '')
  );
  const seenRelationships = new Set<string>();
  const deduplicatedRelationships = relationshipEvidence.filter((item) => {
    const identity = item.producerEvidenceId
      ? `producer:${item.producerEvidenceId}|${item.relationship}|${item.yogaType}`
      : `fallback:${item.ruleId}|${participantKey(item.planets)}|${item.relationship}|` +
        `${item.yogaType}|${item.reason}`;
    if (seenRelationships.has(identity)) return false;
    seenRelationships.add(identity);
    return true;
  });
  let exchangeValidationErrors = false;
  for (const item of deduplicatedRelationships) {
    if (item.relationship !== 'EXCHANGE') continue;
    const validation = validateSignExchange(horoscope, item.planets);
    if (validation.unavailable) {
      exchangeValidationErrors = true;
      diagnostics.push(Object.freeze({
        record: item,
        reason: 'EXCHANGE_SIGN_LORDSHIP_UNAVAILABLE'
      }));
    }
    exchanges.push(Object.freeze({
      ...item,
      relationship: 'EXCHANGE',
      validationStatus: validation.validationStatus
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
  const angularSeparationCount = coLocatedPlanets.filter(
    (item) => item.angularSeparation !== undefined
  ).length;
  const angularSeparationStatus: InfluenceFactorStatus =
    coLocationStatus === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : coLocatedPlanets.length === 0
        ? coLocationStatus
        : angularSeparationCount === coLocatedPlanets.length && coLocationStatus === 'AVAILABLE'
          ? 'AVAILABLE'
          : angularSeparationCount > 0
            ? 'PARTIAL'
            : 'UNAVAILABLE';
  const yogaInputAvailable = Array.isArray(rawYogas);
  const relationshipInputAvailable =
    yogaInputAvailable || inputs?.relationshipEvidence !== undefined;
  const relationshipsStatus: InfluenceFactorStatus = !relationshipInputAvailable
    ? 'UNAVAILABLE'
    : relationshipErrors ? 'PARTIAL' : 'AVAILABLE';
  const exchangesStatus: InfluenceFactorStatus = !relationshipInputAvailable
    ? 'UNAVAILABLE'
    : relationshipErrors || exchangeValidationErrors ? 'PARTIAL' : 'AVAILABLE';
  const yogasStatus: InfluenceFactorStatus = !yogaInputAvailable
    ? 'UNAVAILABLE'
    : yogaErrors ? 'PARTIAL' : 'AVAILABLE';

  return Object.freeze({
    coLocatedPlanets: Object.freeze(coLocatedPlanets),
    exchanges: Object.freeze(exchanges),
    relationshipEvidence: Object.freeze(deduplicatedRelationships),
    yogas: Object.freeze(yogas),
    availability: Object.freeze({
      coLocationByHouseSign: Object.freeze({
        status: coLocationStatus,
        source: targetPosition.source
      }),
      angularSeparation: Object.freeze({
        status: angularSeparationStatus,
        source: 'planetFacts.position.eclipticLongitude|longitude'
      }),
      exchanges: Object.freeze({
        status: exchangesStatus,
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

