import { Sign, Planet } from '../../types';
import { analyzeHouseLordship, HouseLordshipReport } from '../houseLordship/houseLordship';
import { HouseGroups, ownsAny } from '../houseLordship/houseGroups';

export enum FunctionalNature {
  BENEFIC = 'BENEFIC',
  MALEFIC = 'MALEFIC',
  MIXED = 'MIXED',
  NEUTRAL = 'NEUTRAL'
}

export interface PlanetFunctionalEvidence {
  readonly planet: Planet;
  readonly functionalNature: FunctionalNature;
  readonly ruleId: string;
  readonly reason: string;
  readonly meta?: Record<string, unknown>;
}

export interface FunctionalNatureReport {
  readonly ascendantSign?: Sign;
  readonly evidence: readonly PlanetFunctionalEvidence[];
}

/**
 * Determine functional nature for planets using ascendant sign or house lordship report.
 *
 * - owns Trikona [1,5,9] AND Dusthana [6,8,12] => MIXED
 * - owns Trikona [1,5,9] => BENEFIC
 * - owns Dusthana [6,8,12] => MALEFIC
 * - owns neither => NEUTRAL
 */
export function determineFunctionalNature(input: Sign | HouseLordshipReport): FunctionalNatureReport {
  if (!input) {
    throw new TypeError(`Invalid input to determineFunctionalNature: received ${String(input)}`);
  }

  let report: HouseLordshipReport;

  if (typeof input === 'string' && Object.values(Sign).includes(input as Sign)) {
    report = analyzeHouseLordship(input as Sign);
  } else if (typeof input === 'object' && 'houseLords' in input && 'planetLordships' in input) {
    report = input as HouseLordshipReport;
  } else {
    throw new TypeError(`Invalid input to determineFunctionalNature: expected Sign or HouseLordshipReport`);
  }

  const evidenceList: PlanetFunctionalEvidence[] = [];

  const allPlanets: readonly Planet[] = [
    Planet.SUN,
    Planet.MOON,
    Planet.MARS,
    Planet.MERCURY,
    Planet.JUPITER,
    Planet.VENUS,
    Planet.SATURN,
    Planet.RAHU,
    Planet.KETU
  ];

  for (const planet of allPlanets) {
    const lordship = report.planetLordships[planet];
    const owned = lordship ? lordship.ownedHouses : [];

    const hasTrikona = ownsAny(owned, HouseGroups.TRIKONA);
    const hasDusthana = ownsAny(owned, HouseGroups.DUSTHANA);

    let nature: FunctionalNature;
    if (hasTrikona && hasDusthana) {
      nature = FunctionalNature.MIXED;
    } else if (hasTrikona) {
      nature = FunctionalNature.BENEFIC;
    } else if (hasDusthana) {
      nature = FunctionalNature.MALEFIC;
    } else {
      nature = FunctionalNature.NEUTRAL;
    }

    const ruleId = `FN_NATURE_${planet}_${nature}`;
    const reason = `${planet} owns houses [${owned.join(', ')}]. Trikona: ${hasTrikona}, Dusthana: ${hasDusthana} => ${nature}`;

    evidenceList.push(Object.freeze({
      planet,
      functionalNature: nature,
      ruleId,
      reason
    }));
  }

  return Object.freeze({
    ...(report.ascendantSign ? { ascendantSign: report.ascendantSign } : {}),
    evidence: Object.freeze(evidenceList)
  });
}
