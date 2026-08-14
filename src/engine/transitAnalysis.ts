import {
  Planet,
  Sign,
  AspectType,
  TransitResult,
  TransitCondition,
  TransitEvidence,
  TransitAnalysisResult,
  TransitAnalysisInput,
  TransitAnalysisReport
} from '../types';

import { calculateSign } from './astroEngine';

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
  targetHouseFromAscendant?: number
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
  return Object.freeze(ev as TransitEvidence);
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
  if (!input.natalPlanetLongitudes || !result.planet) return;

  for (const [natalPlanetKey, natalLong] of Object.entries(input.natalPlanetLongitudes)) {
    if (natalLong === undefined || natalLong === null) continue;
    const natalPlanet = natalPlanetKey as Planet;
    const natalSign = calculateSign(natalLong);

    // TRANSIT_OVER_NATAL_PLANET
    if (result.position && natalSign === result.position.sign) {
      const reason = `Transit ${result.planet} occupies the same sign (${result.position.sign}) as natal ${natalPlanet}.`;
      evidenceList.push(
        createEvidence(
          TransitCondition.TRANSIT_OVER_NATAL_PLANET,
          result.planet,
          reason,
          undefined,
          natalPlanet
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
              aspect.targetHouseFromAscendant
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

  // Deduplicate evidence using key: [condition, planet, natalPlanet ?? '', aspectType ?? '', targetSign ?? ''].join('|')
  const seenKeys = new Set<string>();
  const deduplicatedEvidence: TransitEvidence[] = [];

  for (const ev of rawEvidence) {
    const key = [
      ev.condition,
      ev.planet,
      ev.natalPlanet ?? '',
      ev.aspectType ?? '',
      ev.targetSign ?? ''
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
    const conditions = Array.from(new Set(planetEvidence.map((ev) => ev.condition)));

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
