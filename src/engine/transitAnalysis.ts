import {
  Planet,
  Sign,
  AspectType,
  TransitResult,
  TransitCondition,
  TransitEvidence,
  TransitRelationshipType,
  TransitAnalysisResult,
  TransitAnalysisInput,
  TransitAnalysisReport
} from '../types';

import { calculateSign } from './astroEngine';
import {
  classifyTransitAngularRelationship,
  DEFAULT_TRANSIT_GEOMETRY_CONFIG
} from './transitGeometry';

const VALID_PLANETS = new Set<string>(Object.values(Planet));

function validateNatalPlanetLongitudes(values: Readonly<Partial<Record<Planet, number>>>): void {
  for (const [planetKey, val] of Object.entries(values)) {
    if (!VALID_PLANETS.has(planetKey)) {
      throw new Error(`Unknown natal planet: ${planetKey}`);
    }
    if (val === undefined || val === null || !Number.isFinite(val)) {
      throw new Error(`Natal longitude for ${planetKey} must be finite.`);
    }
  }
}

/**
 * Returns ordinal string for a house number (1 -> 1st, 2 -> 2nd, etc.)
 */
export function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Helper to construct a frozen TransitEvidence object.
 */
function createEvidence(
  condition: TransitCondition,
  planet: Planet,
  reason: string,
  referenceHouse?: number,
  natalPlanet?: Planet,
  aspectType?: AspectType,
  targetSign?: Sign,
  targetHouseFromMoon?: number,
  targetHouseFromAscendant?: number,
  geometry?: {
    relationshipType?: TransitRelationshipType;
    angularSeparation?: number;
    orb?: number;
    exactContact?: boolean;
  }
): TransitEvidence {
  const ev: Partial<TransitEvidence> = {
    condition,
    planet,
    reason
  };
  if (referenceHouse !== undefined) {
    (ev as { referenceHouse?: number }).referenceHouse = referenceHouse;
  }
  if (natalPlanet !== undefined) {
    (ev as { natalPlanet?: Planet }).natalPlanet = natalPlanet;
  }
  if (aspectType !== undefined) {
    (ev as { aspectType?: AspectType }).aspectType = aspectType;
  }
  if (targetSign !== undefined) {
    (ev as { targetSign?: Sign }).targetSign = targetSign;
  }
  if (targetHouseFromMoon !== undefined) {
    (ev as { targetHouseFromMoon?: number }).targetHouseFromMoon = targetHouseFromMoon;
  }
  if (targetHouseFromAscendant !== undefined) {
    (ev as { targetHouseFromAscendant?: number }).targetHouseFromAscendant = targetHouseFromAscendant;
  }
  if (geometry) {
    if (geometry.relationshipType !== undefined) {
      ev.relationshipType = geometry.relationshipType;
    }
    if (geometry.angularSeparation !== undefined) {
      ev.angularSeparation = geometry.angularSeparation;
    }
    if (geometry.orb !== undefined) {
      ev.orb = geometry.orb;
    }
    if (geometry.exactContact !== undefined) {
      ev.exactContact = geometry.exactContact;
    }
  }
  return Object.freeze(ev as TransitEvidence);
}

export function getTransitRelationshipCondition(
  relationship: TransitRelationshipType
): TransitCondition | undefined {
  switch (relationship) {
    case TransitRelationshipType.SAME_SIGN:
      return TransitCondition.TRANSIT_SAME_SIGN_NATAL_PLANET;
    case TransitRelationshipType.CONJUNCTION:
      return TransitCondition.TRANSIT_CONJUNCTION_NATAL_PLANET;
    case TransitRelationshipType.OPPOSITION:
      return TransitCondition.TRANSIT_OPPOSITION_NATAL_PLANET;
    case TransitRelationshipType.EXACT_CONTACT:
      return TransitCondition.TRANSIT_EXACT_CONTACT_NATAL_PLANET;
    case TransitRelationshipType.NONE:
    default:
      return undefined;
  }
}

function formatRelationshipLabel(relationship: TransitRelationshipType): string {
  switch (relationship) {
    case TransitRelationshipType.EXACT_CONTACT:
      return 'exact contact';
    case TransitRelationshipType.CONJUNCTION:
      return 'conjunction';
    case TransitRelationshipType.OPPOSITION:
      return 'opposition';
    case TransitRelationshipType.SAME_SIGN:
      return 'same sign';
    default:
      return relationship;
  }
}

function analyzeSaturn(result: TransitResult, evidenceList: TransitEvidence[]): void {
  if (result.planet !== Planet.SATURN) return;
  if (!result.housePosition || result.housePosition.fromMoon === undefined) return;

  const house = result.housePosition.fromMoon;
  let condition: TransitCondition | null = null;

  switch (house) {
    case 12:
      condition = TransitCondition.SADE_SATI_RISING;
      break;
    case 1:
      condition = TransitCondition.SADE_SATI_PEAK;
      break;
    case 2:
      condition = TransitCondition.SADE_SATI_SETTING;
      break;
    case 8:
      condition = TransitCondition.ASHTAMA_SHANI;
      break;
    case 4:
      condition = TransitCondition.KANTAKA_SHANI;
      break;
    case 3:
      condition = TransitCondition.SATURN_3RD_FROM_MOON;
      break;
    case 10:
      condition = TransitCondition.SATURN_10TH_FROM_MOON;
      break;
  }

  if (condition) {
    const reason = `Saturn is transiting the ${ordinal(house)} sign from the natal Moon.`;
    evidenceList.push(createEvidence(condition, Planet.SATURN, reason, house));
  }
}

function analyzeJupiter(result: TransitResult, evidenceList: TransitEvidence[]): void {
  if (result.planet !== Planet.JUPITER) return;
  if (!result.housePosition || result.housePosition.fromMoon === undefined) return;

  const house = result.housePosition.fromMoon;
  let condition: TransitCondition | null = null;

  switch (house) {
    case 2:
      condition = TransitCondition.JUPITER_2ND_FROM_MOON;
      break;
    case 5:
      condition = TransitCondition.JUPITER_5TH_FROM_MOON;
      break;
    case 7:
      condition = TransitCondition.JUPITER_7TH_FROM_MOON;
      break;
    case 9:
      condition = TransitCondition.JUPITER_9TH_FROM_MOON;
      break;
    case 11:
      condition = TransitCondition.JUPITER_11TH_FROM_MOON;
      break;
  }

  if (condition) {
    const reason = `Jupiter is transiting the ${ordinal(house)} sign from the natal Moon.`;
    evidenceList.push(createEvidence(condition, Planet.JUPITER, reason, house));
  }
}

function analyzeNatalPlanetContacts(
  result: TransitResult,
  input: TransitAnalysisInput,
  evidenceList: TransitEvidence[]
): void {
  if (!input.natalPlanetLongitudes || !result.planet || !result.position) return;
  if (!Number.isFinite(result.position.longitude)) return;

  const geometryConfig = input.transitGeometry ?? DEFAULT_TRANSIT_GEOMETRY_CONFIG;

  for (const [natalPlanetKey, natalLong] of Object.entries(input.natalPlanetLongitudes)) {
    if (natalLong === undefined || natalLong === null || !Number.isFinite(natalLong)) continue;
    const natalPlanet = natalPlanetKey as Planet;
    const natalSign = calculateSign(natalLong);

    const rel = classifyTransitAngularRelationship(
      result.position.longitude,
      natalLong,
      result.position.sign,
      natalSign,
      geometryConfig
    );

    const condition = getTransitRelationshipCondition(rel.relationship);
    if (condition) {
      const label = formatRelationshipLabel(rel.relationship);
      const reason = `Transit ${result.planet} has ${label} (${rel.relationship}) with natal ${natalPlanet} in ${result.position.sign} (angular separation: ${rel.angularSeparation.toFixed(6)}°).`;
      evidenceList.push(
        createEvidence(
          condition,
          result.planet,
          reason,
          undefined,
          natalPlanet,
          undefined,
          undefined,
          undefined,
          undefined,
          {
            relationshipType: rel.relationship,
            angularSeparation: rel.angularSeparation,
            orb: rel.orb,
            exactContact: rel.exactContact
          }
        )
      );
    }

    // TRANSIT_ASPECTS_NATAL_PLANET
    if (result.aspects) {
      for (const aspect of result.aspects) {
        if (aspect.targetSign === natalSign) {
          const reason = `Transit ${result.planet} casts aspect on natal ${natalPlanet} in ${natalSign}.`;
          evidenceList.push(
            createEvidence(
              TransitCondition.TRANSIT_ASPECTS_NATAL_PLANET,
              result.planet,
              reason,
              undefined,
              natalPlanet,
              aspect.aspectType,
              aspect.targetSign,
              aspect.targetHouseFromMoon,
              aspect.targetHouseFromAscendant,
              { relationshipType: TransitRelationshipType.SPECIAL_ASPECT }
            )
          );
        }
      }
    }
  }
}

/**
 * Pure function that analyzes Gochara transits and yields deterministic evidence and conditions.
 */
export function analyzeTransits(input: TransitAnalysisInput): TransitAnalysisReport {
  if (!input || !input.transit) {
    throw new Error('TransitAnalysisInput and input.transit must not be null or undefined.');
  }

  if (input.natalPlanetLongitudes) {
    validateNatalPlanetLongitudes(input.natalPlanetLongitudes);
  }

  const rawEvidence: TransitEvidence[] = [];

  const resultsList = Object.values(input.transit.results ?? {}).filter(
    (res): res is TransitResult => Boolean(res)
  );

  for (const result of resultsList) {
    analyzeSaturn(result, rawEvidence);
    analyzeJupiter(result, rawEvidence);
    analyzeNatalPlanetContacts(result, input, rawEvidence);
  }

  // Deduplicate evidence using key
  const seenKeys = new Set<string>();
  const deduplicatedEvidence: TransitEvidence[] = [];

  for (const ev of rawEvidence) {
    const key = [
      ev.condition,
      ev.planet,
      ev.natalPlanet ?? '',
      ev.aspectType ?? '',
      ev.targetSign ?? '',
      ev.relationshipType ?? '',
      ev.angularSeparation ?? '',
      ev.orb ?? ''
    ].join('|');
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedEvidence.push(ev);
    }
  }

  // Group evidence by planet into TransitAnalysisResult
  const perPlanetResults: Partial<Record<Planet, TransitAnalysisResult>> = {};

  for (const result of resultsList) {
    const planet = result.planet;
    if (!planet) continue;
    const planetEvidence = deduplicatedEvidence.filter((ev) => ev.planet === planet);
    const conditions = Array.from(
      new Set(
        planetEvidence
          .map((ev) => ev.condition)
          .filter((c): c is TransitCondition => Boolean(c))
      )
    );

    perPlanetResults[planet] = Object.freeze({
      planet,
      conditions: Object.freeze(conditions),
      evidence: Object.freeze(planetEvidence)
    });
  }

  const frozenEvidenceArray = Object.freeze(deduplicatedEvidence);
  const frozenResultsMap = Object.freeze(perPlanetResults);

  return Object.freeze({
    at: input.transit.at,
    results: frozenResultsMap,
    evidence: frozenEvidenceArray
  });
}
