import { describe, expect, it } from 'vitest';

import {
  detectCareerHouseRelationships,
  careerHouseRelationshipKey,
  type CareerHouseRelationshipContext
} from './careerHouseRelationship';

import type { Planet } from '../../types';

function createContext(
  overrides: Partial<CareerHouseRelationshipContext> = {}
): CareerHouseRelationshipContext {
  const houseLords: Record<number, Planet> = {
    6: 'SATURN' as Planet,
    10: 'MARS' as Planet,
    11: 'JUPITER' as Planet,
    2: 'VENUS' as Planet
  };

  const planetHouses: Record<string, number> = {
    SATURN: 6,
    MARS: 10,
    JUPITER: 11,
    VENUS: 2
  };

  return {
    getHouseLord: (house) =>
      houseLords[house],

    getHouseOccupants: () => [],

    getPlanetHouse: (planet) =>
      planetHouses[String(planet)],

    lordAspectsLord: () => false,

    lordAspectsHouse: () => false,

    ...overrides
  };
}

describe('Career house relationship semantics', () => {
  it('detects a common lord', () => {
    const context = createContext({
      getHouseLord: () => 'SATURN' as Planet
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(relationships).toHaveLength(1);

    expect(relationships[0]).toMatchObject({
      type: 'COMMON_LORD',
      houseA: 6,
      houseB: 10,
      lordA: 'SATURN',
      lordB: 'SATURN'
    });
  });

  it('detects lord of house A placed in house B', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      getPlanetHouse: (planet) => {
        if (planet === 'SATURN') {
          return 10;
        }

        if (planet === 'MARS') {
          return 5;
        }

        return undefined;
      }
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'LORD_IN_HOUSE'
      )
    ).toBe(true);
  });

  it('detects the reverse lord placement', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      getPlanetHouse: (planet) => {
        if (planet === 'SATURN') {
          return 2;
        }

        if (planet === 'MARS') {
          return 6;
        }

        return undefined;
      }
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'LORD_IN_HOUSE'
      )
    ).toBe(true);
  });

  it('detects exchange', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      getPlanetHouse: (planet) => {
        if (planet === 'SATURN') {
          return 10;
        }

        if (planet === 'MARS') {
          return 6;
        }

        return undefined;
      }
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'EXCHANGE'
      )
    ).toBe(true);

    expect(
      relationships.filter(
        (item) => item.type === 'LORD_IN_HOUSE'
      )
    ).toHaveLength(0);
  });

  it('detects lord conjunction', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      getPlanetHouse: (planet) => {
        if (
          planet === 'SATURN' ||
          planet === 'MARS'
        ) {
          return 7;
        }

        return undefined;
      }
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'LORD_CONJUNCTION'
      )
    ).toBe(true);
  });

  it('detects lord-to-lord aspect', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      lordAspectsLord: (source, target) =>
        source === ('SATURN' as Planet) &&
        target === ('MARS' as Planet)
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'LORD_ASPECT'
      )
    ).toBe(true);
  });

  it('detects lord-to-house aspect', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      lordAspectsHouse: (source, targetHouse) =>
        source === ('SATURN' as Planet) &&
        targetHouse === 10
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'HOUSE_ASPECT'
      )
    ).toBe(true);
  });

  it('returns no relationships when neither lord exists', () => {
    const context = createContext({
      getHouseLord: () => undefined
    });

    expect(
      detectCareerHouseRelationships(
        context,
        6,
        10
      )
    ).toEqual([]);
  });

  it('does not treat identical lords as lord conjunction', () => {
    const context = createContext({
      getHouseLord: () => 'SATURN' as Planet,
      getPlanetHouse: () => 7
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'COMMON_LORD'
      )
    ).toBe(true);

    expect(
      relationships.some(
        (item) => item.type === 'LORD_CONJUNCTION'
      )
    ).toBe(false);
  });

  it('keeps multiple independently detected relationships', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      getPlanetHouse: (planet) => {
        if (
          planet === 'SATURN' ||
          planet === 'MARS'
        ) {
          return 7;
        }

        return undefined;
      },

      lordAspectsLord: () => true
    });

    const relationships =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(
      relationships.some(
        (item) => item.type === 'LORD_CONJUNCTION'
      )
    ).toBe(true);

    expect(
      relationships.some(
        (item) => item.type === 'LORD_ASPECT'
      )
    ).toBe(true);
  });

  it('returns relationships in deterministic order', () => {
    const context = createContext({
      getHouseLord: (house) => {
        if (house === 6) {
          return 'SATURN' as Planet;
        }

        if (house === 10) {
          return 'MARS' as Planet;
        }

        return undefined;
      },

      getPlanetHouse: () => 7,

      lordAspectsLord: () => true,

      lordAspectsHouse: () => true
    });

    const first =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    const second =
      detectCareerHouseRelationships(
        context,
        6,
        10
      );

    expect(first).toEqual(second);

    expect(
      first.map((item) => item.type)
    ).toEqual([
      'LORD_CONJUNCTION',
      'LORD_ASPECT',
      'HOUSE_ASPECT'
    ]);
  });

  it('creates order-independent relationship identity for house pairs', () => {
    const a = {
      type: 'LORD_ASPECT' as const,
      houseA: 6,
      houseB: 10,
      lordA: 'SATURN' as Planet,
      lordB: 'MARS' as Planet,
      reason: 'test'
    };

    const b = {
      type: 'LORD_ASPECT' as const,
      houseA: 10,
      houseB: 6,
      lordA: 'MARS' as Planet,
      lordB: 'SATURN' as Planet,
      reason: 'test'
    };

    expect(
      careerHouseRelationshipKey(a)
    ).toBe(
      careerHouseRelationshipKey(b)
    );
  });

  it('freezes returned relationship arrays', () => {
    const relationships =
      detectCareerHouseRelationships(
        createContext({
          getHouseLord: () =>
            'SATURN' as Planet
        }),
        6,
        10
      );

    expect(
      Object.isFrozen(relationships)
    ).toBe(true);
  });
});
