import type { Planet } from '../../types';

export type CareerHouseRelationshipType =
  | 'COMMON_LORD'
  | 'LORD_IN_HOUSE'
  | 'EXCHANGE'
  | 'LORD_CONJUNCTION'
  | 'LORD_ASPECT'
  | 'HOUSE_ASPECT';

export interface CareerHouseRelationship {
  readonly type: CareerHouseRelationshipType;

  /**
   * First house participating in the relationship.
   */
  readonly houseA: number;

  /**
   * Second house participating in the relationship.
   */
  readonly houseB: number;

  /**
   * Lord of houseA.
   */
  readonly lordA?: Planet;

  /**
   * Lord of houseB.
   */
  readonly lordB?: Planet;

  /**
   * House occupied by lordA when the relationship requires it.
   */
  readonly lordAHouse?: number;

  /**
   * House occupied by lordB when the relationship requires it.
   */
  readonly lordBHouse?: number;

  /**
   * Human-readable explanation of the already-detected relationship.
   *
   * This is explanatory output only. It must never be parsed to determine
   * semantic relationship type.
   */
  readonly reason: string;
}

export const CAREER_HOUSE_RELATIONSHIP_PRIORITY: Readonly<
  Record<CareerHouseRelationshipType, number>
> = Object.freeze({
  EXCHANGE: 100,
  COMMON_LORD: 90,
  LORD_IN_HOUSE: 70,
  LORD_CONJUNCTION: 60,
  LORD_ASPECT: 50,
  HOUSE_ASPECT: 40
});

function canonicalPlanetPair(
  lordA?: Planet,
  lordB?: Planet
): readonly [string, string] {
  const planets = [
    lordA ? String(lordA) : '',
    lordB ? String(lordB) : ''
  ].sort();

  return [planets[0], planets[1]];
}

export function careerHouseRelationshipKey(
  relationship: CareerHouseRelationship
): string {
  const [houseA, houseB] = [
    relationship.houseA,
    relationship.houseB
  ].sort((a, b) => a - b);

  const [lordA, lordB] = canonicalPlanetPair(
    relationship.lordA,
    relationship.lordB
  );

  return [
    relationship.type,
    houseA,
    houseB,
    lordA,
    lordB,
    relationship.lordAHouse ?? '',
    relationship.lordBHouse ?? ''
  ].join(':');
}

export interface CareerHouseRelationshipContext {
  readonly getHouseLord: (house: number) => Planet | undefined;

  readonly getHouseOccupants: (
    house: number
  ) => readonly Planet[];

  readonly getPlanetHouse: (
    planet: Planet
  ) => number | undefined;

  readonly lordAspectsLord: (
    source: Planet,
    target: Planet
  ) => boolean;

  readonly lordAspectsHouse: (
    source: Planet,
    targetHouse: number
  ) => boolean;
}

export function detectCareerHouseRelationships(
  context: CareerHouseRelationshipContext,
  houseA: number,
  houseB: number
): readonly CareerHouseRelationship[] {
  const lordA = context.getHouseLord(houseA);
  const lordB = context.getHouseLord(houseB);

  if (!lordA || !lordB) {
    return Object.freeze([]);
  }

  const relationships: CareerHouseRelationship[] = [];

  /*
   * 1. Common lord
   */
  if (lordA === lordB) {
    relationships.push({
      type: 'COMMON_LORD',
      houseA,
      houseB,
      lordA,
      lordB,
      reason:
        `Single planet (${lordA}) rules both house ${houseA} and house ${houseB}.`
    });
  }

  const lordAHouse = context.getPlanetHouse(lordA);
  const lordBHouse = context.getPlanetHouse(lordB);

  const lordAInB = lordAHouse === houseB;
  const lordBInA = lordBHouse === houseA;

  /*
   * 2. Mutual placement / exchange
   */
  if (lordAInB && lordBInA) {
    relationships.push({
      type: 'EXCHANGE',
      houseA,
      houseB,
      lordA,
      lordB,
      lordAHouse,
      lordBHouse,
      reason:
        `Sign exchange (Parivartana) between lord of house ${houseA} (${lordA}) and lord of house ${houseB} (${lordB}).`
    });
  } else {
    /*
     * 3. One lord placed in the other house
     */
    if (lordAInB) {
      relationships.push({
        type: 'LORD_IN_HOUSE',
        houseA,
        houseB,
        lordA,
        lordB,
        lordAHouse,
        lordBHouse,
        reason:
          `Lord of house ${houseA} (${lordA}) placed in house ${houseB}.`
      });
    }

    if (lordBInA) {
      relationships.push({
        type: 'LORD_IN_HOUSE',
        houseA,
        houseB,
        lordA,
        lordB,
        lordAHouse,
        lordBHouse,
        reason:
          `Lord of house ${houseB} (${lordB}) placed in house ${houseA}.`
      });
    }
  }

  /*
   * 4. Lords conjunct
   */
  if (
    lordA !== lordB &&
    lordAHouse !== undefined &&
    lordBHouse !== undefined &&
    lordAHouse === lordBHouse
  ) {
    relationships.push({
      type: 'LORD_CONJUNCTION',
      houseA,
      houseB,
      lordA,
      lordB,
      lordAHouse,
      lordBHouse,
      reason:
        `Lords of house ${houseA} (${lordA}) and house ${houseB} (${lordB}) are conjunct in house ${lordAHouse}.`
    });
  }

  /*
   * 5. Lord-to-lord aspect
   */
  if (
    lordA !== lordB &&
    (
      context.lordAspectsLord(lordA, lordB) ||
      context.lordAspectsLord(lordB, lordA)
    )
  ) {
    relationships.push({
      type: 'LORD_ASPECT',
      houseA,
      houseB,
      lordA,
      lordB,
      lordAHouse,
      lordBHouse,
      reason:
        `Aspectual relationship between lord of house ${houseA} (${lordA}) and lord of house ${houseB} (${lordB}).`
    });
  }

  /*
   * 6. Lord-to-house aspect
   */
  if (
    context.lordAspectsHouse(lordA, houseB) ||
    context.lordAspectsHouse(lordB, houseA)
  ) {
    relationships.push({
      type: 'HOUSE_ASPECT',
      houseA,
      houseB,
      lordA,
      lordB,
      lordAHouse,
      lordBHouse,
      reason:
        `Aspectual connection between house ${houseA} lord and house ${houseB}.`
    });
  }

  /*
   * Deterministic order + duplicate protection.
   */
  const unique = new Map<
    string,
    CareerHouseRelationship
  >();

  for (const relationship of relationships) {
    unique.set(
      careerHouseRelationshipKey(relationship),
      relationship
    );
  }

  return Object.freeze(
    [...unique.values()].sort(
      (a, b) =>
        CAREER_HOUSE_RELATIONSHIP_PRIORITY[b.type] -
        CAREER_HOUSE_RELATIONSHIP_PRIORITY[a.type]
    )
  );
}
