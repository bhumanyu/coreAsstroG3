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
  qualifyNatalCareerWithD10
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

    it('returns true for CHALLENGE natal direction (CHALLENGE is an established state)', () => {
      expect(hasNatalCareerPromise('CHALLENGE', 'WEAK')).toBe(true);
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
        d10Planets: []
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: []
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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

    it('returns CHALLENGE for AFFLICTED condition in PRIMARY house', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'AFFLICTED',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('CHALLENGE');
    });

    it('returns CHALLENGE for WEAK condition in PRIMARY house', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'WEAK',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('CHALLENGE');
    });

    it('returns SUPPORT for STRONG condition in PRIMARY house', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'STRONG',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('SUPPORT');
    });

    it('returns NEUTRAL for MODERATE condition in PRIMARY house', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'MODERATE',
        d10House: 10,
        natalHouse: 1,
        relatedHouses: [10]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('NEUTRAL');
    });

    it('CHALLENGE in SUPPORTING house becomes NEUTRAL (house moderates)', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'WEAK',
        d10House: 6,
        natalHouse: 1,
        relatedHouses: [6]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('NEUTRAL');
    });

    it('SUPPORT in SUPPORTING house remains SUPPORT', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'STRONG',
        d10House: 6,
        natalHouse: 1,
        relatedHouses: [6]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('SUPPORT');
    });

    it('MODERATE in SUPPORTING house becomes SUPPORT (house amplifies)', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'MODERATE',
        d10House: 6,
        natalHouse: 1,
        relatedHouses: [6]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('SUPPORT');
    });

    it('SUPPORT in CHALLENGING house becomes NEUTRAL (house moderates)', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'STRONG',
        d10House: 8,
        natalHouse: 1,
        relatedHouses: [8]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('NEUTRAL');
    });

    it('CHALLENGE in CHALLENGING house remains CHALLENGE', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'WEAK',
        d10House: 8,
        natalHouse: 1,
        relatedHouses: [8]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('CHALLENGE');
    });

    it('MODERATE in CHALLENGING house becomes CHALLENGE (house amplifies)', () => {
      const planetContext: CareerD10PlanetContext = {
        planet: Planet.SUN,
        condition: 'MODERATE',
        d10House: 8,
        natalHouse: 1,
        relatedHouses: [8]
      };
      expect(resolveD10PlanetDirection(planetContext)).toBe('CHALLENGE');
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
        d10Planets: []
      };
      expect(resolveD10Direction(context)).toBe('UNAVAILABLE');
    });

    it('PRIMARY evidence overrides SECONDARY/MODIFIER (hierarchical)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          // Multiple SECONDARY/MODIFIER challenges should not override PRIMARY support
          { planet: Planet.MOON, condition: 'WEAK', d10House: 8, natalHouse: 4, relatedHouses: [8] },
          { planet: Planet.MARS, condition: 'WEAK', d10House: 12, natalHouse: 1, relatedHouses: [12] },
          { planet: Planet.JUPITER, condition: 'WEAK', d10House: 5, natalHouse: 9, relatedHouses: [5] }
        ]
      };
      expect(resolveD10Direction(context)).toBe('SUPPORT');
    });

    it('PRIMARY CHALLENGE overrides SECONDARY/MODIFIER support (hierarchical)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          // Multiple SECONDARY/MODIFIER supports should not override PRIMARY challenge
          { planet: Planet.MOON, condition: 'STRONG', d10House: 6, natalHouse: 4, relatedHouses: [6] },
          { planet: Planet.MARS, condition: 'STRONG', d10House: 2, natalHouse: 1, relatedHouses: [2] },
          { planet: Planet.JUPITER, condition: 'STRONG', d10House: 5, natalHouse: 9, relatedHouses: [5] }
        ]
      };
      expect(resolveD10Direction(context)).toBe('CHALLENGE');
    });

    it('SECONDARY evidence used when PRIMARY is NEUTRAL (hierarchical)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'MODERATE', tenants: [], tenantConditions: [] },
          { house: 6, role: 'SUPPORTING', occupied: true, lord: Planet.MOON, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'MODERATE', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'STRONG', d10House: 6, natalHouse: 4, relatedHouses: [6] }
        ]
      };
      expect(resolveD10Direction(context)).toBe('SUPPORT');
    });

    it('MODIFIER evidence used when PRIMARY and SECONDARY are NEUTRAL (hierarchical)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'MODERATE', tenants: [], tenantConditions: [] },
          { house: 5, role: 'NEUTRAL', occupied: true, lord: Planet.JUPITER, lordCondition: 'MODERATE', tenants: [Planet.MARS], tenantConditions: ['STRONG'] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'MODERATE', d10House: 10, natalHouse: 1, relatedHouses: [10] }
        ]
      };
      expect(resolveD10Direction(context)).toBe('SUPPORT');
    });

    it('returns NEUTRAL when all levels are NEUTRAL', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'MODERATE', tenants: [], tenantConditions: [] },
          { house: 5, role: 'NEUTRAL', occupied: true, lord: Planet.JUPITER, lordCondition: 'MODERATE', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'MODERATE', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.JUPITER, condition: 'MODERATE', d10House: 5, natalHouse: 9, relatedHouses: [5] }
        ]
      };
      expect(resolveD10Direction(context)).toBe('NEUTRAL');
    });

    it('PRIMARY returns MIXED when equal support and challenge evidence', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.MOON, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'WEAK', d10House: 10, natalHouse: 4, relatedHouses: [10] }
        ]
      };
      expect(resolveD10Direction(context)).toBe('MIXED');
    });

    it('no double counting: 10th lord in d10Planets at same house counts once', () => {
      // Context where SUN is both the 10th lord AND appears in d10Planets at d10House: 10
      const contextWithDuplicate: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }
        ]
      };

      // Context expressing the same fact once (only as lord, plus a different planet to satisfy d10Planets requirement)
      const contextWithoutDuplicate: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.MOON, condition: 'MODERATE', d10House: 6, natalHouse: 4, relatedHouses: [6] }
        ]
      };

      const directionWithDuplicate = resolveD10Direction(contextWithDuplicate);
      const directionWithoutDuplicate = resolveD10Direction(contextWithoutDuplicate);
      const strengthWithDuplicate = resolveD10Strength('STRONG', directionWithDuplicate, contextWithDuplicate);
      const strengthWithoutDuplicate = resolveD10Strength('STRONG', directionWithoutDuplicate, contextWithoutDuplicate);

      // Both should produce the same result since the duplicate is deduped
      expect(directionWithDuplicate).toBe('SUPPORT');
      expect(directionWithoutDuplicate).toBe('SUPPORT');
      expect(strengthWithDuplicate).toBe(strengthWithoutDuplicate);
    });

    it('adversarial duplicate test: duplicate counting would change MIXED → SUPPORT', () => {
      // Test where duplicate Sun facts would flip the result from MIXED to SUPPORT
      // With deduplication: Sun STRONG + Moon WEAK → MIXED
      // Without deduplication (if Sun counted twice): Sun STRONG + Sun STRONG + Moon WEAK → SUPPORT

      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.MOON, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'WEAK', d10House: 10, natalHouse: 4, relatedHouses: [10] }
        ]
      };

      const direction = resolveD10Direction(context);

      // With proper deduplication, this should be MIXED (1 STRONG, 1 WEAK)
      // If Sun were counted twice (lord + planet), it would be SUPPORT (2 STRONG, 1 WEAK)
      expect(direction).toBe('MIXED');
    });

    it('tenant and planet position are distinct evidence types', () => {
      // Test that tenant (MODIFIER) and planet position (PRIMARY) are not deduplicated
      // Moon as tenant of house 10 (MODIFIER) should be separate from Moon as planet in house 10 (PRIMARY)

      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [Planet.MOON], tenantConditions: ['STRONG'] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MOON, condition: 'STRONG', d10House: 10, natalHouse: 4, relatedHouses: [10] }
        ]
      };

      const direction = resolveD10Direction(context);

      // Moon appears twice: once as tenant (MODIFIER), once as planet (PRIMARY)
      // Since they have different roles, they should both count
      // Primary: Sun STRONG, Moon STRONG → SUPPORT
      // The tenant Moon is MODIFIER and should not override PRIMARY
      expect(direction).toBe('SUPPORT');
    });

    it('modifier tenants cannot flip decisive PRIMARY direction', () => {
      // PRIMARY 10L STRONG + several WEAK tenants stays SUPPORT-directed
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [Planet.MOON, Planet.MARS], tenantConditions: ['WEAK', 'WEAK'] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }
        ]
      };
      // Tenants are MODIFIER evidence, should not override PRIMARY support
      expect(resolveD10Direction(context)).toBe('SUPPORT');
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
        d10Planets: []
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };
      expect(resolveD10Effect('SUPPORT', 'CHALLENGE', context)).toBe('WEAKENS');
    });

    it('returns QUALIFIES when natal CHALLENGE and D10 SUPPORT (preserves natal)', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };
      expect(resolveD10Effect('CHALLENGE', 'SUPPORT', context)).toBe('QUALIFIES');
    });

    it('returns CONFLICTS when natal CHALLENGE and D10 CHALLENGE', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: []
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('UNDETERMINED');
    });

    it('returns VERY_STRONG when PRIMARY house lord is STRONG and outweighs weak', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }
        ]
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('VERY_STRONG');
    });

    it('returns VERY_STRONG when PRIMARY house lord is STRONG with some weak present', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 8, role: 'CHALLENGING', occupied: true, lord: Planet.MARS, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MARS, condition: 'WEAK', d10House: 8, natalHouse: 1, relatedHouses: [8] }
        ]
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('VERY_STRONG');
    });

    it('returns STRONG when multiple SUPPORTING houses are STRONG', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 6, role: 'SUPPORTING', occupied: true, lord: Planet.MOON, lordCondition: 'STRONG', tenants: [], tenantConditions: [] },
          { house: 2, role: 'SUPPORTING', occupied: true, lord: Planet.MARS, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.MOON, condition: 'STRONG', d10House: 6, natalHouse: 4, relatedHouses: [6] },
          { planet: Planet.MARS, condition: 'STRONG', d10House: 2, natalHouse: 1, relatedHouses: [2] }
        ]
      };
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('STRONG');
    });

    it('returns MODERATE when single SUPPORTING house is STRONG (deduped lord+planet)', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 6, role: 'SUPPORTING', occupied: true, lord: Planet.MOON, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.MOON, condition: 'STRONG', d10House: 6, natalHouse: 4, relatedHouses: [6] }
        ]
      };
      // With deduplication, this counts as one STRONG secondary evidence, which yields MODERATE
      expect(resolveD10Strength('STRONG', 'SUPPORT', context)).toBe('MODERATE');
    });

    it('returns VERY_WEAK when PRIMARY house lord is WEAK and outweighs strong', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }
        ]
      };
      expect(resolveD10Strength('STRONG', 'CHALLENGE', context)).toBe('VERY_WEAK');
    });

    it('returns VERY_WEAK when PRIMARY house lord is WEAK with some strong present', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [
          { house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'WEAK', tenants: [], tenantConditions: [] },
          { house: 6, role: 'SUPPORTING', occupied: true, lord: Planet.MARS, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }
        ],
        d10Planets: [
          { planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] },
          { planet: Planet.MARS, condition: 'STRONG', d10House: 6, natalHouse: 1, relatedHouses: [6] }
        ]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: []
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };
      const result = qualifyNatalCareerWithD10('SUPPORT', 'STRONG', 'CHALLENGE', 'WEAK', context);
      expect(result.qualifiedDirection).toBe('MIXED');
      // qualifiedStrength is derived via weakenCareerStrength(STRONG, WEAK) = WEAK
      expect(result.qualifiedStrength).toBe('WEAK');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('does not assign raw d10Strength for CHALLENGE (uses qualifiedStrength derivation)', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };
      const result = qualifyNatalCareerWithD10('CHALLENGE', 'WEAK', 'SUPPORT', 'VERY_STRONG', context);
      // qualifiedStrength should not be VERY_STRONG (the raw d10Strength)
      // It should be derived via weakenCareerStrength from natal WEAK + D10 VERY_STRONG
      expect(result.qualifiedStrength).not.toBe('VERY_STRONG');
      expect(result.qualifiedDirection).toBe('CHALLENGE');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('qualifiedStrength integration test: CHALLENGE/WEAK + strong D10 does not become VERY_STRONG', () => {
      const context: CareerD10Context = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK',
        natalPrimarySupport: 2,
        natalPrimaryChallenge: 5,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };

      const result = resolveCareerD10Qualification(context);

      // natal is CHALLENGE/WEAK, D10 is VERY_STRONG
      // qualifiedStrength should reflect the qualified CHALLENGE state, not the raw D10 strength
      expect(result.natalStrength).toBe('WEAK');
      expect(result.d10Strength).toBe('VERY_STRONG');
      expect(result.d10Effect).toBe('QUALIFIES');
      expect(result.qualifiedDirection).toBe('CHALLENGE');
      expect(result.qualifiedStrength).not.toBe('VERY_STRONG');
      expect(result.natalPromisePreserved).toBe(true);
    });

    it('qualifiedStrength integration test: SUPPORT/STRONG + D10 STRONG promotes to STRONG', () => {
      const context: CareerD10Context = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        natalPrimarySupport: 5,
        natalPrimaryChallenge: 2,
        d10Available: true,
        d10Houses: [{ house: 10, role: 'PRIMARY', occupied: true, lord: Planet.SUN, lordCondition: 'STRONG', tenants: [], tenantConditions: [] }],
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };

      const result = resolveCareerD10Qualification(context);

      // natal is SUPPORT/STRONG, D10 is VERY_STRONG
      // qualifiedStrength should be promoted via promoteCareerStrength
      expect(result.natalStrength).toBe('STRONG');
      expect(result.d10Strength).toBe('VERY_STRONG');
      expect(result.d10Effect).toBe('REINFORCES');
      expect(result.qualifiedDirection).toBe('SUPPORT');
      expect(result.qualifiedStrength).toBe('VERY_STRONG');
      expect(result.natalPromisePreserved).toBe(true);
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'WEAK', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
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
        d10Planets: []
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
        d10Planets: [{ planet: Planet.SUN, condition: 'STRONG', d10House: 10, natalHouse: 1, relatedHouses: [10] }]
      };

      const result = resolveCareerD10Qualification(context);

      expect(result.d10Effect).toBe('QUALIFIES');
      expect(result.qualifiedDirection).toBe('SUPPORT');
      expect(result.natalPromisePreserved).toBe(true);
    });
  });
});
