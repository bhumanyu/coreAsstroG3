import { Sign, Planet, Modality } from '../../types';
import { SIGNS_METADATA } from '../../data/astroData';
import { House, HouseGroups } from '../houseLordship/houseGroups';
import { HouseLordshipReport } from '../houseLordship/houseLordship';
import { FunctionalNature } from './functionalNature';
import { FunctionalRole, FUNCTIONAL_ROLE_ORDER } from './functionalRoleTypes';

export { FunctionalRole, FUNCTIONAL_ROLE_ORDER };

export interface FunctionalRoleEvidence {
  readonly ruleId: string;
  readonly planet: Planet;
  readonly role?: FunctionalRole;
  readonly houses: readonly number[];
  readonly reason: string;
}

export interface FunctionalRoleAnalysis {
  readonly planet: Planet;
  readonly ownedHouses: readonly number[];
  readonly roles: readonly FunctionalRole[];
  readonly kendraHouses: readonly number[];
  readonly trikonaHouses: readonly number[];
  readonly dusthanaHouses: readonly number[];
  readonly marakaHouses: readonly number[];
  readonly badhakaHouse?: number;
  readonly functionalNature: FunctionalNature;
  readonly isYogakaraka: boolean;
  readonly evidence: readonly FunctionalRoleEvidence[];
}

export interface FunctionalRoleAnalysisReport {
  readonly ascendantSign: Sign;
  readonly badhakaHouse: number;
  readonly badhakaLord: Planet;
  readonly planets: Readonly<Record<Planet, FunctionalRoleAnalysis>>;
}

/**
 * Calculates the Badhaka house for a given ascendant sign based on its modality.
 * MOVABLE (Chara) -> 11th house
 * FIXED (Sthira) -> 9th house
 * DUAL (Dwiswabhava) -> 7th house
 */
export function getBadhakaHouse(ascendantSign: Sign): number {
  if (!ascendantSign || !Object.values(Sign).includes(ascendantSign)) {
    throw new TypeError(`Invalid ascendantSign: received ${String(ascendantSign)}`);
  }

  const signMeta = SIGNS_METADATA[ascendantSign];
  if (!signMeta) {
    throw new TypeError(`Unknown ascendantSign: ${String(ascendantSign)}`);
  }

  switch (signMeta.modality as string) {
    case Modality.MOVABLE:
    case 'MOVABLE':
    case 'CARDINAL':
      return 11;
    case Modality.FIXED:
    case 'FIXED':
      return 9;
    case Modality.DUAL:
    case 'DUAL':
    case 'MUTABLE':
      return 7;
    default:
      throw new Error(`Unhandled modality ${signMeta.modality} for sign ${ascendantSign}`);
  }
}

/**
 * Determines the functional nature of a planet based on its functional roles and owned houses.
 *
 * Rules Priority Ordering:
 * (A) If planet is YOGAKARAKA -> BENEFIC
 * (B) Lagna ownership contributes positively but does not override (e.g. Trikona + Dusthana is MIXED)
 * (C) Trikona + Dusthana -> MIXED
 * (D) Trikona without Dusthana -> BENEFIC
 * (E) Dusthana without Trikona -> MALEFIC
 * (F) Neither -> NEUTRAL
 */
export function determineFunctionalNatureFromRoles(
  roles: readonly FunctionalRole[],
  ownedHouses: readonly number[]
): FunctionalNature {
  if (roles.includes(FunctionalRole.YOGAKARAKA)) {
    return FunctionalNature.BENEFIC;
  }

  const hasTrikona =
    roles.includes(FunctionalRole.TRIKONA_LORD) ||
    roles.includes(FunctionalRole.LAGNA_LORD) ||
    ownedHouses.some(h => [1, 5, 9].includes(h));

  const hasDusthana =
    roles.includes(FunctionalRole.DUSTHANA_LORD) ||
    ownedHouses.some(h => [6, 8, 12].includes(h));

  if (hasTrikona && hasDusthana) {
    return FunctionalNature.MIXED;
  }
  if (hasTrikona && !hasDusthana) {
    return FunctionalNature.BENEFIC;
  }
  if (hasDusthana && !hasTrikona) {
    return FunctionalNature.MALEFIC;
  }

  return FunctionalNature.NEUTRAL;
}

/**
 * Analyzes functional roles for all planets given an ascendant sign and house lordship report.
 */
export function analyzeFunctionalRoles(
  ascendantSign: Sign,
  houseLordship: HouseLordshipReport
): FunctionalRoleAnalysisReport {
  if (!ascendantSign || !Object.values(Sign).includes(ascendantSign)) {
    throw new TypeError(`Invalid ascendantSign: received ${String(ascendantSign)}`);
  }
  if (!houseLordship || typeof houseLordship !== 'object') {
    throw new TypeError('houseLordship must be a non-null object');
  }
  if (!houseLordship.houseLords || !houseLordship.planetLordships) {
    throw new Error('houseLordship is missing houseLords or planetLordships');
  }

  for (let house = 1; house <= 12; house++) {
    if (!houseLordship.houseLords[house as unknown as House]) {
      throw new Error(`houseLordship is missing house lord for house ${house}.`);
    }
  }

  const allPlanets: readonly Planet[] = Object.values(Planet);
  for (const planet of allPlanets) {
    if (!houseLordship.planetLordships[planet]) {
      throw new Error(`houseLordship is missing planetLordships entry for planet: ${planet}`);
    }
    const lordship = houseLordship.planetLordships[planet];
    for (const h of lordship.ownedHouses) {
      if (typeof h !== 'number' || !Number.isInteger(h) || h < 1 || h > 12) {
        throw new Error(`invalid ownedHouse ${h} for planet ${planet}.`);
      }
    }
  }

  const badhakaHouse = getBadhakaHouse(ascendantSign);
  const badhakaLord = houseLordship.houseLords[badhakaHouse as unknown as House];
  if (!badhakaLord) {
    throw new Error(`Could not resolve badhaka Lord for house ${badhakaHouse}`);
  }

  const planetsResult: Partial<Record<Planet, FunctionalRoleAnalysis>> = {};

  for (const planet of allPlanets) {
    const lordship = houseLordship.planetLordships[planet];
    const ownedHouses = Object.freeze([...lordship.ownedHouses]);

    const kendraHouses = Object.freeze(ownedHouses.filter(h => HouseGroups.KENDRA.includes(h as any)));
    const trikonaHouses = Object.freeze(ownedHouses.filter(h => HouseGroups.TRIKONA.includes(h as any)));
    const dusthanaHouses = Object.freeze(ownedHouses.filter(h => HouseGroups.DUSTHANA.includes(h as any)));
    const marakaHouses = Object.freeze(ownedHouses.filter(h => HouseGroups.MARAKA.includes(h as any)));

    const ownsBadhaka = ownedHouses.includes(badhakaHouse);
    const planetBadhakaHouse = ownsBadhaka ? badhakaHouse : undefined;
    const isYogakaraka = lordship.isYogakaraka;

    const rolesList: FunctionalRole[] = [];
    if (ownedHouses.includes(1)) {
      rolesList.push(FunctionalRole.LAGNA_LORD);
    }
    if (kendraHouses.length > 0) {
      rolesList.push(FunctionalRole.KENDRA_LORD);
    }
    if (trikonaHouses.length > 0) {
      rolesList.push(FunctionalRole.TRIKONA_LORD);
    }
    if (dusthanaHouses.length > 0) {
      rolesList.push(FunctionalRole.DUSTHANA_LORD);
    }
    if (marakaHouses.length > 0) {
      rolesList.push(FunctionalRole.MARAKA_LORD);
    }
    if (ownsBadhaka) {
      rolesList.push(FunctionalRole.BADHAKA_LORD);
    }
    if (isYogakaraka) {
      rolesList.push(FunctionalRole.YOGAKARAKA);
    }
    if (ownedHouses.includes(2)) {
      rolesList.push(FunctionalRole.SECOND_LORD);
    }
    if (ownedHouses.includes(3)) {
      rolesList.push(FunctionalRole.THIRD_LORD);
    }
    if (ownedHouses.includes(11)) {
      rolesList.push(FunctionalRole.ELEVENTH_LORD);
    }

    rolesList.sort((a, b) => FUNCTIONAL_ROLE_ORDER.indexOf(a) - FUNCTIONAL_ROLE_ORDER.indexOf(b));
    const roles = Object.freeze(rolesList);

    const fnNature = determineFunctionalNatureFromRoles(roles, ownedHouses);

    const evidenceList: FunctionalRoleEvidence[] = [];

    for (const role of roles) {
      switch (role) {
        case FunctionalRole.LAGNA_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_LAGNA_001',
            planet,
            role,
            houses: Object.freeze([1]),
            reason: `${planet} owns the 1st Lagna house.`
          }));
          break;
        case FunctionalRole.KENDRA_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_KENDRA_001',
            planet,
            role,
            houses: kendraHouses,
            reason: `${planet} owns Kendra house(s) [${kendraHouses.join(', ')}].`
          }));
          break;
        case FunctionalRole.TRIKONA_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_TRIKONA_001',
            planet,
            role,
            houses: trikonaHouses,
            reason: `${planet} owns Trikona house(s) [${trikonaHouses.join(', ')}].`
          }));
          break;
        case FunctionalRole.DUSTHANA_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_DUSTHANA_001',
            planet,
            role,
            houses: dusthanaHouses,
            reason: `${planet} owns Dusthana house(s) [${dusthanaHouses.join(', ')}].`
          }));
          break;
        case FunctionalRole.MARAKA_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_MARAKA_001',
            planet,
            role,
            houses: marakaHouses,
            reason: `${planet} owns Maraka house(s) [${marakaHouses.join(', ')}].`
          }));
          break;
        case FunctionalRole.BADHAKA_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_BADHAKA_001',
            planet,
            role,
            houses: Object.freeze([badhakaHouse]),
            reason: `${planet} owns the ${badhakaHouse}th Badhaka house for ${ascendantSign} Ascendant.`
          }));
          break;
        case FunctionalRole.YOGAKARAKA:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_YOGAKARAKA_001',
            planet,
            role,
            houses: ownedHouses,
            reason: `${planet} is Yogakaraka, owning both a non-Lagna Kendra and a non-Lagna Trikona house.`
          }));
          break;
        case FunctionalRole.SECOND_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_SECOND_001',
            planet,
            role,
            houses: Object.freeze([2]),
            reason: `${planet} owns the 2nd house.`
          }));
          break;
        case FunctionalRole.THIRD_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_THIRD_001',
            planet,
            role,
            houses: Object.freeze([3]),
            reason: `${planet} owns the 3rd house.`
          }));
          break;
        case FunctionalRole.ELEVENTH_LORD:
          evidenceList.push(Object.freeze({
            ruleId: 'FUNCTIONAL_ROLE_ELEVENTH_001',
            planet,
            role,
            houses: Object.freeze([11]),
            reason: `${planet} owns the 11th house.`
          }));
          break;
      }
    }

    evidenceList.push(Object.freeze({
      ruleId: 'FUNCTIONAL_NATURE_001',
      planet,
      role: undefined,
      houses: ownedHouses,
      reason: `${planet} is classified as ${fnNature} for ${ascendantSign} Ascendant.`
    }));

    const evidence = Object.freeze(evidenceList);

    const item: FunctionalRoleAnalysis = Object.freeze({
      planet,
      ownedHouses,
      roles,
      kendraHouses,
      trikonaHouses,
      dusthanaHouses,
      marakaHouses,
      ...(planetBadhakaHouse !== undefined ? { badhakaHouse: planetBadhakaHouse } : {}),
      functionalNature: fnNature,
      isYogakaraka,
      evidence
    });

    planetsResult[planet] = item;
  }

  const planets = Object.freeze(planetsResult as Record<Planet, FunctionalRoleAnalysis>);

  return Object.freeze({
    ascendantSign,
    badhakaHouse,
    badhakaLord,
    planets
  });
}

