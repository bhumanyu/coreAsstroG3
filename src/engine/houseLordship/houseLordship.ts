import { Sign, Planet } from '../../types';
import { SIGNS_METADATA, SIGNS_ORDER } from '../../data/astroData';
import { House, HouseGroups, PlanetRole, ownsAny } from './houseGroups';

export interface HouseLordEvidence {
  readonly house: House; // 1..12
  readonly lord: Planet;
  readonly sign: Sign;
  readonly ruleId: string;
  readonly reason: string;
  readonly meta?: Record<string, unknown>;
}

export interface PlanetLordship {
  readonly planet: Planet;
  readonly ownedHouses: readonly House[];
  readonly roles: readonly PlanetRole[];
  readonly isYogakaraka: boolean;
  readonly roleReasons?: readonly string[];
}

export interface HouseLordshipReport {
  readonly ascendantSign: Sign;
  readonly houseLords: Record<House, Planet>;
  readonly planetLordships: Record<Planet, PlanetLordship>;
  readonly evidence: readonly HouseLordEvidence[];
}

/**
 * Resolves house lords for an ascendant sign.
 * House h (1..12) -> ruler of SIGNS_ORDER[(ascNumber - 1 + h - 1) % 12]
 */
export function resolveHouseLords(ascendantSign: Sign): Record<House, Planet> {
  if (!ascendantSign || !Object.values(Sign).includes(ascendantSign)) {
    throw new TypeError(`Invalid ascendantSign: ${ascendantSign}`);
  }

  const ascMeta = SIGNS_METADATA[ascendantSign];
  if (!ascMeta) {
    throw new TypeError(`Unknown ascendantSign: ${ascendantSign}`);
  }

  const ascNumber = ascMeta.number ?? 1;
  const houseLords: Partial<Record<House, Planet>> = {};

  for (let h = 1; h <= 12; h++) {
    const signIndex = (ascNumber - 1 + h - 1) % 12;
    const houseSign = SIGNS_ORDER[signIndex];
    houseLords[h as House] = SIGNS_METADATA[houseSign].ruler;
  }

  return Object.freeze(houseLords as Record<House, Planet>);
}

/**
 * Analyzes house lordship for a given ascendant sign.
 */
export function analyzeHouseLordship(ascendantSign: Sign): HouseLordshipReport {
  const houseLords = resolveHouseLords(ascendantSign);
  const ascMeta = SIGNS_METADATA[ascendantSign];
  const ascNumber = ascMeta.number ?? 1;

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

  const planetLordshipsPartial: Record<string, PlanetLordship> = {};

  for (const planet of allPlanets) {
    if (planet === Planet.RAHU || planet === Planet.KETU) {
      planetLordshipsPartial[planet] = Object.freeze({
        planet,
        ownedHouses: Object.freeze([]),
        roles: Object.freeze([PlanetRole.NONE]),
        isYogakaraka: false,
        roleReasons: Object.freeze([`${planet} is a shadow planet with no house ownership.`])
      });
      continue;
    }

    const ownedHouses: House[] = [];
    for (let h = 1; h <= 12; h++) {
      if (houseLords[h as House] === planet) {
        ownedHouses.push(h as House);
      }
    }

    const roles: PlanetRole[] = [];
    const roleReasons: string[] = [];

    if (ownedHouses.includes(House.FIRST)) {
      roles.push(PlanetRole.LAGNA_LORD);
      roleReasons.push(`${planet} is Lagna Lord because it owns House 1.`);
    }
    if (ownsAny(ownedHouses, HouseGroups.KENDRA)) {
      roles.push(PlanetRole.KENDRA_LORD);
      roleReasons.push(`${planet} is Kendra Lord because it owns Kendra house(s).`);
    }
    if (ownsAny(ownedHouses, HouseGroups.TRIKONA)) {
      roles.push(PlanetRole.TRIKONA_LORD);
      roleReasons.push(`${planet} is Trikona Lord because it owns Trikona house(s).`);
    }
    if (ownsAny(ownedHouses, HouseGroups.DUSTHANA)) {
      roles.push(PlanetRole.DUSTHANA_LORD);
      roleReasons.push(`${planet} is Dusthana Lord because it owns Dusthana house(s).`);
    }
    if (ownsAny(ownedHouses, HouseGroups.MARAKA)) {
      roles.push(PlanetRole.MARAKA);
      roleReasons.push(`${planet} is Maraka because it owns Maraka house(s) [2, 7].`);
    }

    const isYogakaraka = ownsAny(ownedHouses, HouseGroups.KENDRA_NON_LAGNA) && ownsAny(ownedHouses, HouseGroups.TRIKONA_NON_LAGNA);
    if (isYogakaraka) {
      roles.push(PlanetRole.YOGAKARAKA);
      roleReasons.push(`${planet} is Yogakaraka because it owns both non-Lagna Kendra and non-Lagna Trikona houses.`);
    }

    if (roles.length === 0) {
      roles.push(PlanetRole.NONE);
      roleReasons.push(`${planet} holds no special house lordship roles for ${ascendantSign}.`);
    }

    planetLordshipsPartial[planet] = Object.freeze({
      planet,
      ownedHouses: Object.freeze(ownedHouses),
      roles: Object.freeze(roles),
      isYogakaraka,
      roleReasons: Object.freeze(roleReasons)
    });
  }

  const evidenceList: HouseLordEvidence[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIndex = (ascNumber - 1 + h - 1) % 12;
    const houseSign = SIGNS_ORDER[signIndex];
    const lord = houseLords[h as House];

    evidenceList.push(Object.freeze({
      house: h as House,
      lord,
      sign: houseSign,
      ruleId: `HOUSE_${h}_LORDSHIP_${lord}`,
      reason: `House ${h} (${houseSign}) is ruled by ${lord}`
    }));
  }

  const planetLordships = Object.freeze(planetLordshipsPartial as Record<Planet, PlanetLordship>);

  return Object.freeze({
    ascendantSign,
    houseLords,
    planetLordships,
    evidence: Object.freeze(evidenceList)
  });
}
