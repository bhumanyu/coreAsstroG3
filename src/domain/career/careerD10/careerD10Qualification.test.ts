import {
  describe,
  expect,
  it
} from 'vitest';

import {
  resolveCareerD10Qualification
} from './careerD10Qualification';

import {
  hasNatalCareerPromise,
  isD10DataAvailable,
  resolveD10PlanetDirection,
  resolveD10Direction,
  resolveD10Effect,
  resolveD10Strength,
  qualifyNatalCareerWithD10,
  promoteCareerStrength,
  weakenCareerStrength
} from './careerD10QualificationRules';

import type {
  CareerD10Context,
  CareerD10PlanetContext,
  CareerD10HouseContext
} from './careerD10QualificationTypes';

import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength
} from '../careerDasha';

import { Planet } from '../../../types';

describe('careerD10QualificationRules', () => {
  describe('hasNatalCareerPromise', () => {
    it('returns false for UNAVAILABLE natal direction', () => {
      expect(hasNatalCareerPromise('UNAVAILABLE', 'STRONG')).toBe(false);
    });

    it('returns false for NEUTRAL natal direction', () => {
      expect(hasNatalCareerPromise('NEUTRAL', 'STRONG')).toBe(false);
    });

    it('returns false for UNDETERMINED natal strength', () => {
      expect(hasNatalCareerPromise('SUPPORT', 'UNDETERMINED')).toBe(false);
    });

    it('returns true for SUPPORT natal direction', () => {
      expect(hasNatalCareerPromise('SUPPORT', 'STRONG')).toBe(true);
    });

    it('returns true for MIXED natal direction', () => {
      expect(hasNatalCareerPromise('MIXED', 'MODERATE')).toBe(true);
    });

    it('returns false for CHALLENGE natal direction', () => {
      expect(hasNatalCareerPromise('CHALLENGE', 'WEAK')).toBe(false);
    });
  });

  describe('isD10DataAvailable', () => {
    it('returns false when d10Available is false', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: false,
        d10Houses: [],
        d10Planets: [],
        d10Relationships: []
      };
      expect(isD10DataAvailable(context)).toBe(false);
    });

    it('returns false when d10Houses is empty', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(isD10DataAvailable(context)).toBe(false);
    });

    it('returns false when d10Planets is empty', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [],
        d10Relationships: []
      };
      expect(isD10DataAvailable(context)).toBe(false);
    });

    it('returns true when all D10 data is present', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(isD10DataAvailable(context)).toBe(true);
    });
  });

  describe('resolveD10PlanetDirection', () => {
    it('returns UNAVAILABLE for UNAVAILABLE condition', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'UNAVAILABLE',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('UNAVAILABLE');
    });

    it('returns CHALLENGE for AFFLICTED condition', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'AFFLICTED',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('CHALLENGE');
    });

    it('returns CHALLENGE for WEAK condition', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'WEAK',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('CHALLENGE');
    });

    it('returns SUPPORT for STRONG condition', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'STRONG',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('SUPPORT');
    });

    it('returns NEUTRAL for MODERATE condition', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'MODERATE',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('NEUTRAL');
    });
  });

  describe('resolveD10Direction', () => {
    it('returns UNAVAILABLE when D10 data is unavailable', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: false,
        d10Houses: [],
        d10Planets: [],
        d10Relationships: []
      };
      expect(resolveD10Direction(context)).toBe('UNAVAILABLE');
    });

    it('returns SUPPORT when support planets outweigh challenge', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'STRONG', d10House: 6, natalHouse: 4, relatedHouses: [6] },
          { planet: Planet.MARS, condition: 'WEAK', d10House: 8, natalHouse: 1, relatedHouses: [8] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Direction(context)).toBe('SUPPORT');
    });

    it('returns CHALLENGE when challenge planets outweigh support', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [
          { planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'AFFLICTED', d10House: 8, natalHouse: 4, relatedHouses: [8] },
          { planet: Planet.MARS, condition: 'STRONG', d10House: 6, natalHouse: 1, relatedHouses: [6] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Direction(context)).toBe('CHALLENGE');
    });

    it('returns MIXED when support and challenge are equal', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'WEAK', d10House: 8, natalHouse: 4, relatedHouses: [8] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Direction(context)).toBe('MIXED');
    });

    it('returns NEUTRAL when no support or challenge planets', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'MODERATE', tenants: [], tenantConditions: [] }],
        d10Planets: [
          { planet: Planet.SUN, condition: 'MODERATE', d10House: 10, natalHouse: 1, relatedHouses: [10] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Direction(context)).toBe('NEUTRAL');
    });
  });

  describe('resolveD10Effect', () => {
    it('returns UNAVAILABLE when D10 data is unavailable', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: false,
        d10Houses: [],
        d10Planets: [],
        d10Relationships: []
      };
      expect(resolveD10Effect('SUPPORT', 'SUPPORT', context)).toBe('UNAVAILABLE');
    });

    it('returns INSUFFICIENT_DATA when natal direction is UNAVAILABLE', () => {
      const context: CareerD10Context = {
        natalDirection: 'UNAVAILABLE',
        natalStrength: 'UNDETERMINED',
        natalPrimarySupport: 0,
        natalPrimaryChallenge: 0,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(resolveD10Effect('UNAVAILABLE', 'SUPPORT', context)).toBe('INSUFFICIENT_DATA');
    });

    it('returns REINFORCES when natal SUPPORT and D10 SUPPORT', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(resolveD10Effect('SUPPORT', 'SUPPORT', context)).toBe('REINFORCES');
    });

    it('returns WEAKENS when natal SUPPORT and D10 CHALLENGE', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(resolveD10Effect('SUPPORT', 'CHALLENGE', context)).toBe('WEAKENS');
    });

    it('returns REINFORCES when natal CHALLENGE and D10 SUPPORT (preserves natal)', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(resolveD10Effect('CHALLENGE', 'SUPPORT', context)).toBe('REINFORCES');
    });

    it('returns CONFLICTS when natal CHALLENGE and D10 CHALLENGE', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(resolveD10Effect('CHALLENGE', 'CHALLENGE', context)).toBe('CONFLICTS');
    });

    it('returns QUALIFIES when natal NEUTRAL and D10 SUPPORT', () => {
      const context: CareerD10Context = {
        natalDirection: 'NEUTRAL',
        natalStrength: 'MODERATE',
        natalPrimarySupport: 3,
        natalPrimaryChallenge: 3,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      expect(resolveD10Effect('NEUTRAL', 'SUPPORT', context)).toBe('QUALIFIES');
    });
  });

  describe('resolveD10Strength', () => {
    it('returns UNDETERMINED when D10 data is unavailable', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: false,
        d10Houses: [],
        d10Planets: [],
        d10Relationships: []
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('UNDETERMINED');
    });

    it('returns VERY_STRONG when D10 SUPPORT with high strong ratio', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 6, role: 'SUPPORTING', occupied: true, lord: Planet.MOON, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 2, role: 'SUPPORTING', occupied: true, lord: Planet.MARS, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'STRONG', d10House: 6, natalHouse: 4, relatedHouses: [6] },
          { planet: Planet.MARS, condition: 'STRONG', d10House: 2, natalHouse: 1, relatedHouses: [2] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('VERY_STRONG');
    });

    it('returns STRONG when D10 SUPPORT with moderate strong ratio', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 6, role: 'SUPPORTING', occupied: true, lord: Planet.MOON, lordCondition: 'MODERATE', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'MODERATE', d10House: 6, natalHouse: 4, relatedHouses: [6] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('STRONG');
    });

    it('returns VERY_WEAK when D10 CHALLENGE with high weak ratio', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] },
          { house: 8, role: 'CHALLENGING', occupied: true, lord: Planet.MOON, lordCondition: 'AFFLICTED', tenants: [], tenantConditions: [] },
          { house: 12, role: 'CHALLENGING', occupied: true, lord: Planet.MARS, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'AFFLICTED', d10House: 8, natalHouse: 4, relatedHouses: [8] },
          { planet: Planet.MARS, condition: 'WEAK', d10House: 12, natalHouse: 1, relatedHouses: [12] }
        ],
        d10Relationships: []
      };
      expect(resolveD10Strength('STRONG', 'CHALLENGE', context)).toBe('VERY_WEAK');
    });
  });

  describe('qualifyNatalCareerWithD10', () => {
    it('returns UNAVAILABLE when natal direction is UNAVAILABLE', () => {
      const context: CareerD10Context = {
        natalDirection: 'UNAVAILABLE',
        natalStrength: 'UNDETERMINED',
        natalPrimarySupport: 0,
        natalPrimaryChallenge: 0,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      const result = qualifyNatalCareerWithD10('UNAVAILABLE', 'UNDETERMINED', 'SUPPORT', 'STRONG', context);
      expect(result.qualifiedDirection).toBe('UNAVAILABLE');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('preserves natal when D10 data is unavailable', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: false,
        d10Houses: [],
        d10Planets: [],
        d10Relationships: []
      };
      const result = qualifyNatalCareerWithD10('SUPPORT', 'STRONG', 'UNAVAILABLE', 'UNDETERMINED', context);
      expect(result.qualifiedDirection).toBe('SUPPORT');
      expect(result.qualifiedStrength).toBe('STRONG');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('preserves CHALLENGE when natal is CHALLENGE regardless of D10 SUPPORT', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      const result = qualifyNatalCareerWithD10('CHALLENGE', 'WEAK', 'SUPPORT', 'STRONG', context);
      expect(result.qualifiedDirection).toBe('CHALLENGE');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('returns SUPPORT when natal SUPPORT and D10 SUPPORT', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      const result = qualifyNatalCareerWithD10('SUPPORT', 'STRONG', 'SUPPORT', 'STRONG', context);
      expect(result.qualifiedDirection).toBe('SUPPORT');
      expect(result.qualifiedStrength).toBe('STRONG');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('returns MIXED when natal SUPPORT and D10 CHALLENGE', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };
      const result = qualifyNatalCareerWithD10('SUPPORT', 'STRONG', 'CHALLENGE', 'WEAK', context);
      expect(result.qualifiedDirection).toBe('MIXED');
      expect(result.qualifiedStrength).toBe('MODERATE');
      expect(result.natalPromisePreserved).toBe(true);
    });
  });

  describe('promoteCareerStrength', () => {
    it('returns VERY_STRONG when D10 strength is VERY_STRONG', () => {
      expect(promoteCareerStrength('STRONG', 'VERY_STRONG')).toBe('VERY_STRONG');
    });

    it('returns VERY_STRONG when natal is VERY_STRONG and D10 is STRONG', () => {
      expect(promoteCareerStrength('VERY_STRONG', 'STRONG')).toBe('VERY_STRONG');
    });

    it('returns STRONG when natal is STRONG and D10 is STRONG', () => {
      expect(promoteCareerStrength('STRONG', 'STRONG')).toBe('STRONG');
    });

    it('returns STRONG when natal is VERY_STRONG and D10 is MODERATE', () => {
      expect(promoteCareerStrength('VERY_STRONG', 'MODERATE')).toBe('STRONG');
    });

    it('returns MODERATE when natal is STRONG and D10 is MODERATE', () => {
      expect(promoteCareerStrength('STRONG', 'MODERATE')).toBe('MODERATE');
    });
  });

  describe('weakenCareerStrength', () => {
    it('returns VERY_WEAK when D10 strength is VERY_WEAK', () => {
      expect(weakenCareerStrength('STRONG', 'VERY_WEAK')).toBe('VERY_WEAK');
    });

    it('returns VERY_WEAK when natal is VERY_WEAK and D10 is WEAK', () => {
      expect(weakenCareerStrength('VERY_WEAK', 'WEAK')).toBe('VERY_WEAK');
    });

    it('returns WEAK when natal is WEAK and D10 is WEAK', () => {
      expect(weakenCareerStrength('WEAK', 'WEAK')).toBe('WEAK');
    });

    it('returns WEAK when natal is VERY_WEAK and D10 is MODERATE', () => {
      expect(weakenCareerStrength('VERY_WEAK', 'MODERATE')).toBe('WEAK');
    });

    it('returns MODERATE when natal is WEAK and D10 is MODERATE', () => {
      expect(weakenCareerStrength('WEAK', 'MODERATE')).toBe('MODERATE');
    });
  });
});

describe('resolveCareerD10Qualification', () => {
  describe('golden scenarios', () => {
    it('scenario 1: no natal promise returns INSUFFICIENT_DATA/UNAVAILABLE', () => {
      const context: CareerD10Context = {
        natalDirection: 'NEUTRAL',
        natalStrength: 'MODERATE',
        natalPrimarySupport: 3,
        natalPrimaryChallenge: 3,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.d10Effect).toBe('INSUFFICIENT_DATA');
      expect(result.qualifiedDirection).toBe('UNDETERMINED');
      expect(result.qualifiedStrength).toBe('UNDETERMINED');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('scenario 2: natal CHALLENGE + D10 SUPPORT preserves CHALLENGE', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.natalDirection).toBe('CHALLENGE');
      expect(result.qualifiedDirection).toBe('CHALLENGE');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('scenario 3: D10 cannot rewrite C9 (dashaEffect retained while d10Effect differs)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        dashaEffect: 'ACTIVATES' as CareerDashaActivationEffect,
        dashaDirection: 'SUPPORT' as CareerDashaActivationDirection,
        dashaStrength: 'STRONG' as CareerDashaActivationStrength,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.dashaEffect).toBe('ACTIVATES');
      expect(result.dashaDirection).toBe('SUPPORT');
      expect(result.d10Effect).toBe('WEAKENS');
      expect(result.d10Direction).toBe('CHALLENGE');
      expect(result.dashaPreserved).toBe(true);
    });

    it('scenario 4: D10 cannot create a C8 expression (expressionQualifications is empty)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.expressionQualifications).toEqual([]);
      expect(result.expressionQualifications.length).toBe(0);
    });

    it('scenario 5: deterministic output (same input produces same output)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result1 = resolveCareerD10Qualification(context);
      const result2 = resolveCareerD10Qualification(context);

      expect(result1).toEqual(result2);
    });

    it('scenario 6: frozen output (Object.isFrozen returns true)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);
      expect(Object.isFrozen(result.expressionQualifications)).toBe(true);
    });
  });

  describe('invariant assertions', () => {
    it('C10-INV-03: natalDirection is preserved unchanged from context', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.natalDirection).toBe(context.natalDirection);
    });

    it('C10-INV-03: natalStrength is preserved unchanged from context', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.natalStrength).toBe(context.natalStrength);
    });

    it('C10-INV-10: dashaEffect is preserved when provided', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        dashaEffect: 'ACTIVATES' as CareerDashaActivationEffect,
        dashaDirection: 'SUPPORT' as CareerDashaActivationDirection,
        dashaStrength: 'STRONG' as CareerDashaActivationStrength,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.dashaEffect).toBe(context.dashaEffect);
      expect(result.dashaDirection).toBe(context.dashaDirection);
      expect(result.dashaPreserved).toBe(true);
    });

    it('C10-INV-10: dashaEffect is UNAVAILABLE when not provided', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.dashaEffect).toBe('UNAVAILABLE');
      expect(result.dashaDirection).toBe('UNAVAILABLE');
      expect(result.dashaPreserved).toBe(false);
    });

    it('C10-INV-03: qualifiedDirection is a VIEW, not a replacement of natalDirection', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.qualifiedDirection).toBe('MIXED');
      expect(result.natalDirection).not.toBe(result.qualifiedDirection);
    });

    it('C10-INV-03: D10 cannot create promise where none exists', () => {
      const context: CareerD10Context = {
        natalDirection: 'NEUTRAL',
        natalStrength: 'MODERATE',
        natalPrimarySupport: 3,
        natalPrimaryChallenge: 3,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.d10Effect).toBe('INSUFFICIENT_DATA');
      expect(result.qualifiedDirection).toBe('UNDETERMINED');
    });
  });

  describe('edge cases', () => {
    it('handles UNAVAILABLE natal direction', () => {
      const context: CareerD10Context = {
        natalDirection: 'UNAVAILABLE',
        natalStrength: 'UNDETERMINED',
        natalPrimarySupport: 0,
        natalPrimaryChallenge: 0,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.d10Effect).toBe('UNAVAILABLE');
      expect(result.qualifiedDirection).toBe('UNAVAILABLE');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('handles missing D10 data gracefully', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: false,
        d10Houses: [],
        d10Planets: [],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.d10Effect).toBe('UNAVAILABLE');
      expect(result.qualifiedDirection).toBe('SUPPORT');
      expect(result.qualifiedStrength).toBe('STRONG');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('handles MIXED natal direction with D10 SUPPORT', () => {
      const context: CareerD10Context = {
        natalDirection: 'MIXED',
        natalStrength: 'MODERATE',
        natalPrimarySupport: 4,
        natalPrimaryChallenge: 4,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }],
        d10Relationships: []
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.d10Effect).toBe('REINFORCES');
      expect(result.qualifiedDirection).toBe('SUPPORT');
      expect(result.natalPromisePreserved).toBe(true);
    });
  });
});
