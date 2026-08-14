import {
  Planet,
  Sign,
  PlanetFacts,
  PlanetAnalysisReport,
  HouseAnalysisReport,
  HouseAnalysis,
  HouseAnalysisEvidence,
  HouseAnalysisEvidenceType,
  HouseAspectEvidence
} from '../types';
import { House } from './houseLordship/houseGroups';
import { HouseLordshipReport } from './houseLordship/houseLordship';
import { getGrahaDrishtiOffsets } from './transitEngine';

export interface HouseAnalysisInput {
  readonly planetFacts: Readonly<Record<Planet, PlanetFacts>>;
  readonly planetAnalysis: PlanetAnalysisReport;
  readonly houseLordship: HouseLordshipReport;
}

function formatTitleCase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getOrdinal(n: number): string {
  switch (n) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    case 4: return '4th';
    case 5: return '5th';
    case 6: return '6th';
    case 7: return '7th';
    case 8: return '8th';
    case 9: return '9th';
    case 10: return '10th';
    case 11: return '11th';
    case 12: return '12th';
    default: return `${n}th`;
  }
}

/**
 * Performs a deterministic, evidence-only House Analysis aggregation for D1/Rasi chart.
 * P-04 is structural/evidence-only and does not interpret or predict.
 */
export function analyzeHouses(input: HouseAnalysisInput): HouseAnalysisReport {
  if (!input) {
    throw new Error('input must not be null or undefined.');
  }
  if (!input.planetFacts) {
    throw new Error('planetFacts must not be null or undefined.');
  }
  if (!input.planetAnalysis) {
    throw new Error('planetAnalysis must not be null or undefined.');
  }
  if (!input.houseLordship) {
    throw new Error('houseLordship must not be null or undefined.');
  }

  const allPlanets = Object.values(Planet);

  for (const planet of allPlanets) {
    if (!input.planetFacts[planet]) {
      throw new Error(`planetFacts is missing required planet: ${planet}.`);
    }
    if (!input.planetAnalysis.planets?.[planet]) {
      throw new Error(`planetAnalysis is missing required planet: ${planet}.`);
    }
  }

  for (let h = 1; h <= 12; h++) {
    if (!input.houseLordship.houseLords?.[h as House]) {
      throw new Error(`houseLordship is missing lord for house ${h}.`);
    }
  }

  const housesMap: Partial<Record<number, HouseAnalysis>> = {};

  for (let h = 1; h <= 12; h++) {
    const houseEv = input.houseLordship.evidence.find((e) => e.house === h);
    if (!houseEv || !houseEv.sign) {
      throw new Error(`houseLordship evidence is missing sign for house ${h}.`);
    }
    const sign = houseEv.sign;
    const lord = input.houseLordship.houseLords[h as House];
    if (!Object.values(Planet).includes(lord)) {
      throw new Error(`houseLordship contains invalid lord for house ${h}.`);
    }

    const occupants = Object.freeze(
      allPlanets.filter((p) => input.planetAnalysis.planets[p].house === h)
    );

    const lordAnalysis = input.planetAnalysis.planets[lord];

    const receivedAspects: HouseAspectEvidence[] = [];

    for (const s of allPlanets) {
      const sourceHouse = input.planetAnalysis.planets[s]?.house;
      if (sourceHouse === undefined) continue;
      const offset = ((h - sourceHouse) + 12) % 12;
      if (offset === 0) continue;

      const rule = getGrahaDrishtiOffsets(s).find((r) => r.offset === offset);
      if (rule) {
        const ordinal = getOrdinal(offset + 1);
        const srcName = formatTitleCase(s);
        receivedAspects.push(
          Object.freeze({
            sourcePlanet: s,
            targetHouse: h,
            sourceHouse,
            aspectType: rule.type,
            houseOffset: offset,
            reason: `${srcName} in House ${sourceHouse} casts its ${ordinal} Graha Drishti on House ${h}.`
          })
        );
      }
    }

    const frozenReceivedAspects = Object.freeze(receivedAspects);

    const evidenceList: HouseAnalysisEvidence[] = [];
    const signName = formatTitleCase(sign);
    const lordName = formatTitleCase(lord);

    // 1. HOUSE_SIGN_PLACEMENT
    evidenceList.push(
      Object.freeze({
        type: HouseAnalysisEvidenceType.HOUSE_SIGN_PLACEMENT,
        ruleId: 'HOUSE_SIGN_PLACEMENT',
        reason: `House ${h} is occupied by ${signName}.`
      })
    );

    // 2. HOUSE_OCCUPANT (one per occupant)
    for (const occ of occupants) {
      evidenceList.push(
        Object.freeze({
          type: HouseAnalysisEvidenceType.HOUSE_OCCUPANT,
          ruleId: 'HOUSE_OCCUPANT',
          planet: occ,
          reason: `${formatTitleCase(occ)} occupies House ${h}.`
        })
      );
    }

    // 3. HOUSE_LORD
    evidenceList.push(
      Object.freeze({
        type: HouseAnalysisEvidenceType.HOUSE_LORD,
        ruleId: 'HOUSE_LORD',
        planet: lord,
        reason: `${lordName} is the lord of House ${h}.`
      })
    );

    // 4. HOUSE_LORD_PLACEMENT
    evidenceList.push(
      Object.freeze({
        type: HouseAnalysisEvidenceType.HOUSE_LORD_PLACEMENT,
        ruleId: 'HOUSE_LORD_PLACEMENT',
        planet: lord,
        reason: `The lord of House ${h}, ${lordName}, occupies House ${lordAnalysis.house}.`
      })
    );

    // 5. HOUSE_RECEIVED_ASPECT (one per received aspect)
    for (const aspect of frozenReceivedAspects) {
      evidenceList.push(
        Object.freeze({
          type: HouseAnalysisEvidenceType.HOUSE_RECEIVED_ASPECT,
          ruleId: 'HOUSE_RECEIVED_ASPECT',
          planet: aspect.sourcePlanet,
          reason: aspect.reason
        })
      );
    }

    const houseAnalysis: HouseAnalysis = Object.freeze({
      house: h,
      sign,
      occupants,
      lord,
      lordAnalysis,
      receivedAspects: frozenReceivedAspects,
      evidence: Object.freeze(evidenceList)
    });

    housesMap[h] = houseAnalysis;
  }

  const frozenHouses = Object.freeze(housesMap as Record<number, HouseAnalysis>);

  return Object.freeze({
    houses: frozenHouses
  });
}
