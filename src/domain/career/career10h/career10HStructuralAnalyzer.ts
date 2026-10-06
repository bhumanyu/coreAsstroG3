import type {
  Sign,
  Planet,
  HouseLordshipReport,
  HouseAnalysisReport,
  NatalGrahaDrishtiReport,
  PlanetFact,
  PlanetFacts
} from '../../../types';
import type {
  CareerReferencePoint,
  Career10HContext,
  Career10HAspect,
  Career10HProvenance
} from './career10HFoundationTypes';
import {
  SIGNS_METADATA
} from '../../../data/astroData';
import {
  House
} from '../../../engine/houseLordship/houseGroups';
import {
  createParticipantId
} from '../careerParticipantRoles/participantRoleUtils';
import {
  sortParticipantIds,
  dedupParticipantIds
} from './career10HFoundationUtils';

/**
 * P2-07F Career 10H Structural Analyzer
 *
 * This module implements the core analysis logic for extracting 10th house context
 * from Lagna and Moon reference points. It composes existing engine reports without
 * adding any new astrology logic.
 *
 * KEY CONSTRAINTS:
 * - Never recompute lordship (use resolveHouseLords/HouseLordshipReport)
 * - Never recompute aspects (use natalGrahaDrishti report)
 * - Never recompute occupancy (use analyzeHouses output)
 * - HouseAnalysisReport is keyed on Lagna-relative houses only
 * - For Moon reference, derive 10th-from-Moon house via sign arithmetic
 */

/**
 * Report bundle required for 10H analysis.
 */
export interface Career10HReportBundle {
  readonly houseLordship: HouseLordshipReport;
  readonly houseAnalysis: HouseAnalysisReport;
  readonly natalGrahaDrishti?: NatalGrahaDrishtiReport;
  readonly planetFacts: Record<Planet, PlanetFact>;
}

/**
 * Analyzes 10th house context for a given reference point.
 *
 * For LAGNA: house 10 is the 10th house from Ascendant
 * For MOON: house 10 is the 10th house from Moon's sign (derived via sign arithmetic)
 *
 * @param reports - Bundle of pre-computed engine reports
 * @param referencePoint - LAGNA or MOON
 * @returns Career10HContext or null if insufficient data
 */
export function analyzeCareer10HContext(
  reports: Career10HReportBundle,
  referencePoint: CareerReferencePoint
): Career10HContext | null {
  const { houseLordship, houseAnalysis, natalGrahaDrishti, planetFacts } = reports;

  // Validate required inputs
  if (!houseLordship || !houseAnalysis || !planetFacts) {
    return null;
  }

  const ascendantSign = houseLordship.ascendantSign;
  if (!ascendantSign) {
    return null;
  }

  let house10Number: number;
  let moonSign: Sign | undefined;

  if (referencePoint === 'LAGNA') {
    // For Lagna, 10th house is simply house 10
    house10Number = 10;
  } else if (referencePoint === 'MOON') {
    // For Moon, derive 10th-from-Moon house via sign arithmetic
    const moonFact = planetFacts[Planet.MOON];
    if (!moonFact) {
      return null;
    }

    // Moon sign can be in .sign or .position.sign
    moonSign = moonFact.sign ?? moonFact.position?.sign;
    if (!moonSign) {
      return null;
    }

    // Calculate 10th house from Moon
    // If Moon is in sign S, 10th-from-Moon is sign (S + 9) mod 12
    // We need to map this back to Lagna-relative house number
    house10Number = calculate10thFromMoonHouse(ascendantSign, moonSign);
  } else {
    return null;
  }

  // Get 10th house data from HouseAnalysisReport
  const house10Data = houseAnalysis.houses[house10Number];
  if (!house10Data) {
    return null;
  }

  // Extract 10th house lord from HouseLordshipReport
  const house10Lord = houseLordship.houseLords[house10Number as House];
  if (!house10Lord) {
    return null;
  }

  // Get lord's house placement from house10Data
  const lordHouse = house10Data.lordAnalysis?.house;
  if (typeof lordHouse !== 'number' || lordHouse < 1 || lordHouse > 12) {
    return null;
  }

  // Convert occupants to ParticipantId array
  const occupants = convertOccupantsToParticipantIds(house10Data.occupants);

  // Extract aspects on 10th house from NatalGrahaDrishtiReport
  const aspectsOn10H = extractAspectsOnHouse(
    natalGrahaDrishti,
    house10Number
  );

  // Build provenance
  const provenance = buildProvenance(
    houseLordship,
    houseAnalysis,
    natalGrahaDrishti,
    house10Number,
    aspectsOn10H
  );

  // Build context
  const context: Career10HContext = {
    referencePoint,
    house10Number,
    house10Sign: house10Data.sign,
    house10Lord,
    lordHouse,
    occupants,
    aspectsOn10H,
    provenance
  };

  return context;
}

/**
 * Calculates the Lagna-relative house number for the 10th house from Moon.
 *
 * Logic:
 * 1. Get Moon's sign number (1-12)
 * 2. 10th-from-Moon sign = (MoonSignNumber + 9) mod 12 + 1
 * 3. Map that sign back to Lagna-relative house number
 *
 * Example: Lagna = Aries (1), Moon = Cancer (4)
 * 10th-from-Moon = (4 + 9) mod 12 + 1 = 13 mod 12 + 1 = 1 + 1 = 2 (Taurus)
 * Taurus is Lagna house 2, so house10Number = 2
 */
function calculate10thFromMoonHouse(
  ascendantSign: Sign,
  moonSign: Sign
): number {
  const ascMeta = SIGNS_METADATA[ascendantSign];
  const moonMeta = SIGNS_METADATA[moonSign];

  if (!ascMeta || !moonMeta) {
    throw new Error(`Invalid sign metadata for ascendant=${ascendantSign} or moon=${moonSign}`);
  }

  const ascNumber = ascMeta.number ?? 1;
  const moonNumber = moonMeta.number ?? 1;

  // 10th-from-Moon sign number (1-12)
  const tenthFromMoonSignNumber = ((moonNumber + 9) % 12) + 1;

  // Convert to Lagna-relative house number
  // If 10th-from-Moon is sign S, and Lagna is sign A,
  // then house number = (S - A + 12) % 12 + 1
  const houseNumber = ((tenthFromMoonSignNumber - ascNumber + 12) % 12) + 1;

  return houseNumber;
}

/**
 * Converts planet occupants to ParticipantId array.
 */
function convertOccupantsToParticipantIds(
  occupants: readonly Planet[] | Planet[]
): readonly string[] {
  const participantIds = occupants.map(planet =>
    createParticipantId(planet)
  );
  return dedupParticipantIds(sortParticipantIds(participantIds));
}

/**
 * Extracts aspects targeting a specific house from NatalGrahaDrishtiReport.
 */
function extractAspectsOnHouse(
  natalGrahaDrishti: NatalGrahaDrishtiReport | undefined,
  targetHouse: number
): readonly Career10HAspect[] {
  if (!natalGrahaDrishti || !natalGrahaDrishti.aspects) {
    return Object.freeze([]);
  }

  const aspects: Career10HAspect[] = [];

  for (const aspect of natalGrahaDrishti.aspects) {
    // Check if this aspect targets our house
    if (aspect.targetHouse === targetHouse) {
      aspects.push({
        sourcePlanet: aspect.sourcePlanet,
        sourceHouse: aspect.sourceHouse,
        targetHouse: aspect.targetHouse,
        aspectType: aspect.aspectType,
        houseOffset: aspect.houseOffset,
        reason: aspect.reason || `${aspect.sourcePlanet} casts aspect on House ${targetHouse}`
      });
    }
  }

  return Object.freeze(aspects);
}

/**
 * Builds provenance tracking for the 10H context.
 */
function buildProvenance(
  houseLordship: HouseLordshipReport,
  houseAnalysis: HouseAnalysisReport,
  natalGrahaDrishti: NatalGrahaDrishtiReport | undefined,
  house10Number: number,
  aspectsOn10H: readonly Career10HAspect[]
): Career10HProvenance {
  // Find house lordship evidence for this house
  const houseLordshipEvidence = houseLordship.evidence.find(
    e => e.house === house10Number
  );

  // Get drishti aspect IDs
  const drishtiAspectIds = aspectsOn10H.map((aspect, index) =>
    `DRISHTI:${aspect.sourcePlanet}:${aspect.targetHouse}:${index}`
  );

  return Object.freeze({
    houseLordshipEvidenceId: houseLordshipEvidence?.ruleId,
    houseAnalysisHouseId: `HOUSE_ANALYSIS:${house10Number}`,
    drishtiAspectIds: Object.freeze(drishtiAspectIds)
  });
}
