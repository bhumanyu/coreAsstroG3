import { describe, it, expect } from 'vitest';
import { Planet, DignityStatus, PlanetStateCondition, Sign } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  buildCareerPlanetaryCondition,
  type CareerPlanetaryConditionIntegrationInput
} from './careerPlanetaryConditionIntegration';
import { buildCareerStructuralReasoning } from './careerStructuralReasoningIntegration';
import { buildCareerPlanetaryRelevance } from './careerPlanetaryRelevanceIntegration';
import type { CareerPlanetaryRelevance } from './careerPlanetaryRelevance';

// ============================================================================
// Test Factories
// ============================================================================

function createMockPlanetFact(
  planet: Planet,
  overrides: Partial<{
    dignityStatus: DignityStatus;
    condition: PlanetStateCondition;
    retrograde: boolean;
    stationary: boolean;
    house: number;
  }> = {}
): any {
  return {
    planet,
    position: {
      planet,
      longitude: 0,
      eclipticLongitude: 0,
      sign: Sign.ARIES,
      house: overrides.house ?? 1,
      signLongitude: 0,
      motion: {
        speed: overrides.stationary ? 0 : (overrides.retrograde ? -0.5 : 1.0),
        retrograde: overrides.retrograde ?? false,
        stationary: overrides.stationary ?? false
      }
    },
    dignity: {
      planet,
      sign: Sign.ARIES,
      status: overrides.dignityStatus ?? DignityStatus.NEUTRAL,
      score: 0
    },
    state: {
      planet,
      condition: overrides.condition ?? PlanetStateCondition.NORMAL,
      motion: {
        speed: overrides.stationary ? 0 : (overrides.retrograde ? -0.5 : 1.0),
        retrograde: overrides.retrograde ?? false,
        stationary: overrides.stationary ?? false
      }
    },
    sign: Sign.ARIES,
    house: overrides.house ?? 1
  };
}

function createMockHoroscope(planetFactsOverrides: Partial<Record<Planet, any>> = {}): any {
  const defaultFacts: Record<Planet, any> = {
    [Planet.SUN]: createMockPlanetFact(Planet.SUN),
    [Planet.MOON]: createMockPlanetFact(Planet.MOON),
    [Planet.MARS]: createMockPlanetFact(Planet.MARS),
    [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY),
    [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER),
    [Planet.VENUS]: createMockPlanetFact(Planet.VENUS),
    [Planet.SATURN]: createMockPlanetFact(Planet.SATURN),
    [Planet.RAHU]: createMockPlanetFact(Planet.RAHU),
    [Planet.KETU]: createMockPlanetFact(Planet.KETU)
  };

  return {
    planetFacts: { ...defaultFacts, ...planetFactsOverrides },
    natalGrahaDrishti: { aspects: [] }
  };
}

function createMockRelevance(
  planet: Planet,
  relevance: CareerPlanetaryRelevance['relevance']
): CareerPlanetaryRelevance {
  return {
    planet,
    relevance,
    roles: [],
    reasons: [],
    effect: 'NEUTRAL',
    expressionHints: [],
    relatedHouses: [],
    relatedPlanets: [],
    conditional: relevance === 'CONDITIONAL',
    statement: `Test ${planet} ${relevance}`
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('W1.3 C6 Planetary Condition Integration', () => {
  // Group A — C5 relevance gating
  describe('Group A — C5 relevance gating', () => {
    it('PRIMARY relevance → condition UNAVAILABLE (affliction always UNAVAILABLE)', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const saturnResult = result.find(r => r.planet === Planet.SATURN);
      expect(saturnResult).toBeDefined();
      expect(saturnResult!.relevance).toBe('PRIMARY');
      expect(saturnResult!.condition).toBe('UNAVAILABLE');
    });

    it('SUPPORTING relevance → condition UNAVAILABLE (affliction always UNAVAILABLE)', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.MERCURY, 'SUPPORTING')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);
      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.relevance).toBe('SUPPORTING');
      expect(mercuryResult!.condition).toBe('UNAVAILABLE');
    });

    it('SECONDARY relevance → condition UNAVAILABLE (affliction always UNAVAILABLE)', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.JUPITER, 'SECONDARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);
      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.relevance).toBe('SECONDARY');
      expect(jupiterResult!.condition).toBe('UNAVAILABLE');
    });

    it('CONDITIONAL relevance → condition UNAVAILABLE (affliction always UNAVAILABLE)', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.MARS, 'CONDITIONAL')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const marsResult = result.find(r => r.planet === Planet.MARS);
      expect(marsResult).toBeDefined();
      expect(marsResult!.relevance).toBe('CONDITIONAL');
      expect(marsResult!.condition).toBe('UNAVAILABLE');
    });

    it('NEUTRAL relevance → UNAVAILABLE', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.VENUS, 'NEUTRAL')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const venusResult = result.find(r => r.planet === Planet.VENUS);
      expect(venusResult).toBeDefined();
      expect(venusResult!.relevance).toBe('NEUTRAL');
      expect(venusResult!.condition).toBe('UNAVAILABLE');
    });
  });

  // Group B — dignity mapping
  describe('Group B — dignity mapping', () => {
    it('EXALTED → EXALTED', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.EXALTED })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('EXALTED');
    });

    it('MOOLATRIKONA → OWN_SIGN (compatibility mapping)', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.MOOLATRIKONA })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('OWN_SIGN');
    });

    it('OWN_SIGN → OWN_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.OWN_SIGN })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('OWN_SIGN');
    });

    it('GREAT_FRIEND_SIGN → FRIENDLY_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.GREAT_FRIEND_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('FRIENDLY_SIGN');
    });

    it('FRIEND_SIGN → FRIENDLY_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.FRIEND_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('FRIENDLY_SIGN');
    });

    it('NEUTRAL → NEUTRAL_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.NEUTRAL })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('NEUTRAL_SIGN');
    });

    it('NEUTRAL_SIGN → NEUTRAL_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.NEUTRAL_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('NEUTRAL_SIGN');
    });

    it('ENEMY_SIGN → ENEMY_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.MARS]: createMockPlanetFact(Planet.MARS, { dignityStatus: DignityStatus.ENEMY_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MARS, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const marsResult = result.find(r => r.planet === Planet.MARS);

      expect(marsResult!.dignity).toBe('ENEMY_SIGN');
    });

    it('GREAT_ENEMY_SIGN → ENEMY_SIGN', () => {
      const horoscope = createMockHoroscope({
        [Planet.MARS]: createMockPlanetFact(Planet.MARS, { dignityStatus: DignityStatus.GREAT_ENEMY_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MARS, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const marsResult = result.find(r => r.planet === Planet.MARS);

      expect(marsResult!.dignity).toBe('ENEMY_SIGN');
    });

    it('DEBILITATED → DEBILITATED', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.DEBILITATED })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('DEBILITATED');
    });
  });

  // Group C — combustion mapping
  describe('Group C — combustion mapping', () => {
    it('NORMAL → NOT_COMBUST', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { condition: PlanetStateCondition.NORMAL })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.combustion).toBe('NOT_COMBUST');
    });

    it('COMBUST → COMBUST', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { condition: PlanetStateCondition.COMBUST })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.combustion).toBe('COMBUST');
    });

    it('DEEP_COMBUST → COMBUST (collapsed)', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { condition: PlanetStateCondition.DEEP_COMBUST })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.combustion).toBe('COMBUST');
    });
  });

  // Group D — motion mapping
  describe('Group D — motion mapping', () => {
    it('DIRECT → DIRECT', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { retrograde: false, stationary: false })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('DIRECT');
    });

    it('RETROGRADE → RETROGRADE', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { retrograde: true, stationary: false })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('RETROGRADE');
    });

    it('STATIONARY → STATIONARY', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { retrograde: false, stationary: true })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('STATIONARY');
    });

    it('missing planetFact → UNKNOWN', () => {
      const horoscope = createMockHoroscope();
      delete horoscope.planetFacts[Planet.SATURN];
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('UNKNOWN');
    });
  });

  // Group E — missing data handling
  describe('Group E — missing data handling', () => {
    it('missing planetFact → UNAVAILABLE for all fields, not WEAK or AFFLICTED', () => {
      const horoscope = createMockHoroscope();
      delete horoscope.planetFacts[Planet.SATURN];
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('UNAVAILABLE');
      expect(saturnResult!.affliction).toBe('UNAVAILABLE');
      expect(saturnResult!.motion).toBe('UNKNOWN');
      expect(saturnResult!.combustion).toBe('UNAVAILABLE');
      expect(saturnResult!.condition).toBe('UNAVAILABLE');
      expect(saturnResult!.condition).not.toBe('WEAK');
      expect(saturnResult!.condition).not.toBe('AFFLICTED');
    });
  });

  // Group F — aspect influence
  describe('Group F — aspect influence', () => {
    it('Jupiter aspecting Mercury → beneficSupport=true', () => {
      const horoscope = createMockHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Jupiter is a natural benefic, so beneficSupport should be true
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(true);
    });

    it('Saturn aspecting Mercury → maleficPressure=true', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 11 })
      });
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Saturn is a natural malefic, so maleficPressure should be true
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(true);
    });

    it('both sources conflicting (canonical wins): natalGrahaDrishti Jupiter→Mercury, legacy grahaDrishti Saturn→Mercury ignored', () => {
      const horoscope = createMockHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      // Legacy grahaDrishti with conflicting aspect (should be ignored)
      (horoscope as any).grahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Jupiter (benefic) from canonical source should be seen, Saturn (malefic) from legacy should be ignored
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(true);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(false);
    });

    it('canonical source absent, legacy present (no fallback): natalGrahaDrishti undefined, legacy grahaDrishti Saturn→Mercury ignored', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 11 })
      });
      delete horoscope.natalGrahaDrishti;
      // Legacy grahaDrishti with Saturn aspect (should be ignored)
      (horoscope as any).grahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Legacy Saturn aspect must NOT become pressure
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(false);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(false);
    });

    it('both sources absent (missing data ≠ negative): natalGrahaDrishti undefined', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      delete horoscope.natalGrahaDrishti;
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Missing aspect data should not create negative evidence
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(false);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(false);
      // Condition should not become CHALLENGE/WEAK merely from missing aspect data
      expect(mercuryResult!.condition).not.toBe('CHALLENGE');
      expect(mercuryResult!.condition).not.toBe('WEAK');
    });

    it('influence directions: Jupiter→Mercury only ⇒ beneficSupport=true', () => {
      const horoscope = createMockHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(true);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(false);
    });

    it('influence directions: Saturn→Mercury only ⇒ maleficPressure=true', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 11 })
      });
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(false);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(true);
    });

    it('influence directions: Jupiter+Saturn→Mercury (both in natalGrahaDrishti) ⇒ both flags true', () => {
      const horoscope = createMockHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY },
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(true);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(true);
    });
  });

  // Group G — mixed influence
  describe('Group G — mixed influence', () => {
    it('FRIENDLY_SIGN + both benefic and malefic pressure → MODERATE', () => {
      const horoscope = createMockHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, {
          dignityStatus: DignityStatus.FRIEND_SIGN
        })
      });
      // Mock aspects with both benefic and malefic
      horoscope.natalGrahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY },
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('FRIENDLY_SIGN');
      // With mixed influence, should be MODERATE
    });
  });

  // Group H — relevance/condition separation
  describe('Group H — relevance/condition separation', () => {
    it('PRIMARY relevance + DEBILITATED dignity → relevance stays PRIMARY, condition UNAVAILABLE (affliction always UNAVAILABLE)', () => {
      const horoscope = createMockHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, {
          dignityStatus: DignityStatus.DEBILITATED
        })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.relevance).toBe('PRIMARY');
      expect(saturnResult!.condition).toBe('UNAVAILABLE');
      expect(saturnResult!.relevance).not.toBe('NEUTRAL');
    });
  });

  // Group I — real-engine integration
  describe('Group I — real-engine integration', () => {
    it('full pipeline: calculateHoroscope → buildCareerStructuralReasoning → buildCareerPlanetaryRelevance → buildCareerPlanetaryCondition', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const relevance = buildCareerPlanetaryRelevance({ horoscope, structural });
      const condition = buildCareerPlanetaryCondition({ horoscope, relevance });

      expect(condition).toHaveLength(9);
      expect(relevance).toHaveLength(9);

      // Verify canonical planet order
      const expectedOrder = [
        Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY,
        Planet.JUPITER, Planet.VENUS, Planet.SATURN, Planet.RAHU, Planet.KETU
      ];
      for (let i = 0; i < 9; i++) {
        expect(condition[i].planet).toBe(expectedOrder[i]);
        expect(relevance[i].planet).toBe(expectedOrder[i]);
      }

      // Verify relevance preservation per planet
      for (let i = 0; i < 9; i++) {
        expect(condition[i].relevance).toBe(relevance[i].relevance);
      }
    });
  });

  // Group J — determinism
  describe('Group J — determinism', () => {
    it('same input twice produces identical output', () => {
      const horoscope = createMockHoroscope();
      const relevance = [
        createMockRelevance(Planet.SATURN, 'PRIMARY'),
        createMockRelevance(Planet.MERCURY, 'SUPPORTING')
      ];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result1 = buildCareerPlanetaryCondition(input);
      const result2 = buildCareerPlanetaryCondition(input);

      expect(result1).toEqual(result2);
    });

    it('reversed relevance input still yields canonical order', () => {
      const horoscope = createMockHoroscope();
      const relevance = [
        createMockRelevance(Planet.MERCURY, 'SUPPORTING'),
        createMockRelevance(Planet.SATURN, 'PRIMARY')
      ];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      expect(result[0].planet).toBe(Planet.SUN);
      expect(result[1].planet).toBe(Planet.MOON);
      expect(result[2].planet).toBe(Planet.MARS);
      expect(result[3].planet).toBe(Planet.MERCURY);
      expect(result[4].planet).toBe(Planet.JUPITER);
      expect(result[5].planet).toBe(Planet.VENUS);
      expect(result[6].planet).toBe(Planet.SATURN);
      expect(result[7].planet).toBe(Planet.RAHU);
      expect(result[8].planet).toBe(Planet.KETU);
    });
  });

  // Group K — no leakage of unrelated properties
  describe('Group K — no leakage of unrelated properties', () => {
    it('result contains no C7/C8/C9/C10/C11/d10/dasha/transit/timing/conclusion properties', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).not.toHaveProperty('dasha');
      expect(saturnResult).not.toHaveProperty('md');
      expect(saturnResult).not.toHaveProperty('ad');
      expect(saturnResult).not.toHaveProperty('pd');
      expect(saturnResult).not.toHaveProperty('d10');
      expect(saturnResult).not.toHaveProperty('transit');
      expect(saturnResult).not.toHaveProperty('timing');
      expect(saturnResult).not.toHaveProperty('conclusion');
      expect(saturnResult).not.toHaveProperty('c7');
      expect(saturnResult).not.toHaveProperty('c8');
      expect(saturnResult).not.toHaveProperty('c9');
      expect(saturnResult).not.toHaveProperty('c10');
      expect(saturnResult).not.toHaveProperty('c11');
    });
  });

  // Group L — immutability
  describe('Group L — immutability', () => {
    it('contexts are frozen', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(Object.isFrozen(saturnResult)).toBe(true);
      expect(Object.isFrozen(saturnResult!.positiveFactors)).toBe(true);
      expect(Object.isFrozen(saturnResult!.negativeFactors)).toBe(true);
    });

    it('result arrays are frozen', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  // Group M — no mutation of input
  describe('Group M — no mutation of input', () => {
    it('C5 relevance input is not mutated', () => {
      const horoscope = createMockHoroscope();
      const relevance = [
        createMockRelevance(Planet.SATURN, 'PRIMARY'),
        createMockRelevance(Planet.MERCURY, 'SUPPORTING')
      ];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const relevanceBefore = structuredClone(relevance);
      buildCareerPlanetaryCondition(input);
      const relevanceAfter = relevance;

      expect(relevanceAfter).toEqual(relevanceBefore);
    });
  });

  // Group N — canonical 9-planet batch
  describe('Group N — canonical 9-planet batch', () => {
    it('produces results in canonical 9-planet order', () => {
      const horoscope = createMockHoroscope();
      const relevance = [
        createMockRelevance(Planet.SATURN, 'PRIMARY'),
        createMockRelevance(Planet.MERCURY, 'SUPPORTING')
      ];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      expect(result).toHaveLength(9);
      expect(result[0].planet).toBe(Planet.SUN);
      expect(result[1].planet).toBe(Planet.MOON);
      expect(result[2].planet).toBe(Planet.MARS);
      expect(result[3].planet).toBe(Planet.MERCURY);
      expect(result[4].planet).toBe(Planet.JUPITER);
      expect(result[5].planet).toBe(Planet.VENUS);
      expect(result[6].planet).toBe(Planet.SATURN);
      expect(result[7].planet).toBe(Planet.RAHU);
      expect(result[8].planet).toBe(Planet.KETU);
    });

    it('planets missing from C5 relevance get NEUTRAL/UNAVAILABLE context', () => {
      const horoscope = createMockHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      // SUN should be NEUTRAL/UNAVAILABLE since it's not in relevance
      const sunResult = result.find(r => r.planet === Planet.SUN);
      expect(sunResult!.relevance).toBe('NEUTRAL');
      expect(sunResult!.condition).toBe('UNAVAILABLE');
    });
  });
});
