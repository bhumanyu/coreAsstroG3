import { describe, it, expect } from 'vitest';
import { Planet, DignityStatus, PlanetStateCondition, Sign } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { calculateDignity } from '../../engine/planetaryDignity';
import { calculateSign } from '../../engine/chartMath';
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

// Default longitudes place every planet in a sign where its canonical dignity
// is NEUTRAL, so recorded NEUTRAL dignity stays positionally consistent.
const NEUTRAL_LONGITUDES: Record<Planet, number> = {
  [Planet.SUN]: 60,     // Gemini
  [Planet.MOON]: 0,     // Aries
  [Planet.MARS]: 120,   // Leo
  [Planet.MERCURY]: 0,  // Aries
  [Planet.JUPITER]: 0,  // Aries
  [Planet.VENUS]: 0,    // Aries
  [Planet.SATURN]: 150, // Virgo
  [Planet.RAHU]: 0,     // Aries
  [Planet.KETU]: 0      // Aries
};

function createMockPlanetFact(
  planet: Planet,
  overrides: Partial<{
    dignityStatus: DignityStatus;
    condition: PlanetStateCondition;
    retrograde: boolean;
    stationary: boolean;
    house: number;
    longitude: number;
  }> = {}
): any {
  const longitude = overrides.longitude ?? NEUTRAL_LONGITUDES[planet];
  const sign = calculateSign(longitude);
  const signLongitude = ((longitude % 30) + 30) % 30;
  return {
    planet,
    position: {
      planet,
      longitude,
      eclipticLongitude: longitude,
      sign,
      house: overrides.house ?? 1,
      signLongitude,
      motion: {
        speed: overrides.stationary ? 0 : (overrides.retrograde ? -0.5 : 1.0),
        retrograde: overrides.retrograde ?? false,
        stationary: overrides.stationary ?? false
      }
    },
    dignity: {
      planet,
      sign,
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
    sign,
    house: overrides.house ?? 1
  };
}

const ALL_PLANETS: readonly Planet[] = [
  Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER,
  Planet.VENUS, Planet.SATURN, Planet.RAHU, Planet.KETU
];

function createPlanetFacts(
  planetFactsOverrides: Partial<Record<Planet, any>> = {}
): Record<Planet, any> {
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
  return { ...defaultFacts, ...planetFactsOverrides };
}

function createFunctionalNatureIntegration(
  functionalNature: Partial<Record<Planet, string>> = {}
): any {
  return {
    planets: Object.fromEntries(ALL_PLANETS.map((planet) => [
      planet,
      {
        planet,
        functionalNature: functionalNature[planet] ?? 'NEUTRAL',
        ownedHouses: [1]
      }
    ]))
  };
}

/**
 * Baseline horoscope: complete planet facts (neutral dignity, direct motion,
 * not combust) and a COMPLETE aspect producer that emitted zero aspect
 * records — empty directional aspect influence. Missing aspect evidence is
 * never negative evidence, so this is the baseline for NEUTRAL expectations.
 */
function createNeutralConditionHoroscope(
  planetFactsOverrides: Partial<Record<Planet, any>> = {}
): any {
  return {
    planetFacts: createPlanetFacts(planetFactsOverrides),
    natalGrahaDrishti: {
      aspects: [],
      computationStatus: 'COMPLETE',
      diagnostics: []
    },
    functionalNatureIntegration: createFunctionalNatureIntegration()
  };
}

// One structurally valid, fully consumed benefic aspect record per planet:
// Jupiter (natural benefic) aspects every planet, so aspectSources resolves
// as AVAILABLE under validated-record counting and each planet receives
// BENEFIC_SUPPORT.
const RESOLVED_ASPECTS: readonly Record<string, unknown>[] = ALL_PLANETS.map(
  (targetPlanet) => ({
    sourcePlanet: Planet.JUPITER,
    targetPlanet,
    aspectType: 'FULL_7TH'
  })
);

/**
 * Horoscope whose aspect feed is fully resolved: validated, consumed aspect
 * records under a COMPLETE producer. Defaults to a Jupiter benefic aspect on
 * every planet; pass custom records to shape directional influence.
 */
function createFullyResolvedAspectHoroscope(
  planetFactsOverrides: Partial<Record<Planet, any>> = {},
  aspects: readonly Record<string, unknown>[] = RESOLVED_ASPECTS
): any {
  const horoscope = createNeutralConditionHoroscope(planetFactsOverrides);
  horoscope.natalGrahaDrishti = {
    ...horoscope.natalGrahaDrishti,
    aspects: [...aspects]
  };
  return horoscope;
}

// Jupiter carries a conflicting functional classification, so every
// Jupiter-sourced record resolves as MIXED — validated but unconsumed aspect
// evidence, leaving aspectSources partially resolved rather than missing.
const PARTIAL_ASPECTS: readonly Record<string, unknown>[] = ALL_PLANETS.map(
  (targetPlanet) => ({
    sourcePlanet: Planet.JUPITER,
    targetPlanet,
    aspectType: 'FULL_7TH'
  })
);

/**
 * Horoscope whose aspect feed is partially resolved: structurally valid
 * records whose classification is indeterminate (MIXED) under a COMPLETE
 * producer. Missing directional influence is never treated as negative.
 */
function createPartialAspectHoroscope(
  planetFactsOverrides: Partial<Record<Planet, any>> = {},
  aspects: readonly Record<string, unknown>[] = PARTIAL_ASPECTS
): any {
  const horoscope = createNeutralConditionHoroscope(planetFactsOverrides);
  horoscope.natalGrahaDrishti = {
    ...horoscope.natalGrahaDrishti,
    aspects: [...aspects]
  };
  horoscope.functionalNatureIntegration =
    createFunctionalNatureIntegration({ [Planet.JUPITER]: 'MALEFIC' });
  return horoscope;
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
    it('PRIMARY relevance → condition resolves from required factors with affliction unassessed', () => {
      const horoscope = createFullyResolvedAspectHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const saturnResult = result.find(r => r.planet === Planet.SATURN);
      expect(saturnResult).toBeDefined();
      expect(saturnResult!.relevance).toBe('PRIMARY');
      expect(saturnResult!.condition).toBe('MODERATE');
      expect(saturnResult!.assessment).toBe('FULL');
      expect(saturnResult!.afflictionAssessed).toBe(false);
      expect(saturnResult!.negativeFactors).toEqual([]);
      // MODERATE is driven solely by the consumed Jupiter benefic aspect.
      expect(saturnResult!.positiveFactors).toEqual([
        expect.objectContaining({ type: 'BENEFIC_SUPPORT', effect: 'SUPPORT' })
      ]);
    });

    it('SUPPORTING relevance → condition resolves from required factors with affliction unassessed', () => {
      const horoscope = createFullyResolvedAspectHoroscope();
      const relevance = [createMockRelevance(Planet.MERCURY, 'SUPPORTING')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);
      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.relevance).toBe('SUPPORTING');
      expect(mercuryResult!.condition).toBe('MODERATE');
      expect(mercuryResult!.assessment).toBe('FULL');
      expect(mercuryResult!.afflictionAssessed).toBe(false);
      // MODERATE is driven solely by the consumed Jupiter benefic aspect.
      expect(mercuryResult!.positiveFactors).toEqual([
        expect.objectContaining({ type: 'BENEFIC_SUPPORT', effect: 'SUPPORT' })
      ]);
    });

    it('SECONDARY relevance → C6 condition can resolve without changing C9 relevance gates', () => {
      const horoscope = createFullyResolvedAspectHoroscope();
      const relevance = [createMockRelevance(Planet.JUPITER, 'SECONDARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);
      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.relevance).toBe('SECONDARY');
      expect(jupiterResult!.condition).toBe('MODERATE');
      expect(jupiterResult!.assessment).toBe('FULL');
      // MODERATE is driven solely by the consumed Jupiter benefic aspect.
      expect(jupiterResult!.positiveFactors).toEqual([
        expect.objectContaining({ type: 'BENEFIC_SUPPORT', effect: 'SUPPORT' })
      ]);
    });

    it('CONDITIONAL relevance → C6 condition can resolve without changing C9 relevance gates', () => {
      const horoscope = createFullyResolvedAspectHoroscope();
      const relevance = [createMockRelevance(Planet.MARS, 'CONDITIONAL')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const marsResult = result.find(r => r.planet === Planet.MARS);
      expect(marsResult).toBeDefined();
      expect(marsResult!.relevance).toBe('CONDITIONAL');
      expect(marsResult!.condition).toBe('MODERATE');
      expect(marsResult!.assessment).toBe('FULL');
      // MODERATE is driven solely by the consumed Jupiter benefic aspect.
      expect(marsResult!.positiveFactors).toEqual([
        expect.objectContaining({ type: 'BENEFIC_SUPPORT', effect: 'SUPPORT' })
      ]);
    });

    it('NEUTRAL relevance → UNAVAILABLE', () => {
      const horoscope = createNeutralConditionHoroscope();
      const relevance = [createMockRelevance(Planet.VENUS, 'NEUTRAL')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      const venusResult = result.find(r => r.planet === Planet.VENUS);
      expect(venusResult).toBeDefined();
      expect(venusResult!.relevance).toBe('NEUTRAL');
      expect(venusResult!.condition).toBe('UNAVAILABLE');
    });

    it('neutral baseline: zero directional evidence produces no condition factors and is never negative', () => {
      const horoscope = createNeutralConditionHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN)!;

      expect(saturnResult.dignity).toBe('NEUTRAL_SIGN');
      expect(saturnResult.positiveFactors).toEqual([]);
      expect(saturnResult.negativeFactors).toEqual([]);
      // With no directional evidence and aspectSources missing, the honest
      // outcome is INSUFFICIENT_DATA — missing evidence is never negative.
      expect(saturnResult.condition).toBe('INSUFFICIENT_DATA');
      expect(saturnResult.condition).not.toBe('WEAK');
      expect(saturnResult.condition).not.toBe('AFFLICTED');
      expect(saturnResult.assessmentDetails?.missingFactors)
        .toContain('aspectSources');
    });
  });

  // Group B — dignity mapping
  describe('Group B — dignity mapping', () => {
    it('EXALTED → EXALTED', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.EXALTED, longitude: 200 }) // Libra: Saturn exalted
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('EXALTED');
    });

    it('MOOLATRIKONA → OWN_SIGN (compatibility mapping)', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.MOOLATRIKONA, longitude: 300 }) // Aquarius 0-20: Saturn moolatrikona
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('OWN_SIGN');
    });

    it('OWN_SIGN → OWN_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.OWN_SIGN, longitude: 280 }) // Capricorn: Saturn own sign
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('OWN_SIGN');
    });

    it('GREAT_FRIEND_SIGN → FRIENDLY_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.GREAT_FRIEND_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('FRIENDLY_SIGN');
    });

    it('FRIEND_SIGN → FRIENDLY_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.FRIEND_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('FRIENDLY_SIGN');
    });

    it('NEUTRAL → NEUTRAL_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.NEUTRAL })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('NEUTRAL_SIGN');
    });

    it('NEUTRAL_SIGN → NEUTRAL_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { dignityStatus: DignityStatus.NEUTRAL_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('NEUTRAL_SIGN');
    });

    it('ENEMY_SIGN → ENEMY_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MARS]: createMockPlanetFact(Planet.MARS, { dignityStatus: DignityStatus.ENEMY_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MARS, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const marsResult = result.find(r => r.planet === Planet.MARS);

      expect(marsResult!.dignity).toBe('ENEMY_SIGN');
    });

    it('GREAT_ENEMY_SIGN → ENEMY_SIGN', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MARS]: createMockPlanetFact(Planet.MARS, { dignityStatus: DignityStatus.GREAT_ENEMY_SIGN })
      });
      const relevance = [createMockRelevance(Planet.MARS, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const marsResult = result.find(r => r.planet === Planet.MARS);

      expect(marsResult!.dignity).toBe('ENEMY_SIGN');
    });

    it('DEBILITATED → DEBILITATED', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { dignityStatus: DignityStatus.DEBILITATED, longitude: 10 }) // Aries: Saturn debilitated
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
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { condition: PlanetStateCondition.NORMAL })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.combustion).toBe('NOT_COMBUST');
    });

    it('COMBUST → COMBUST', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { condition: PlanetStateCondition.COMBUST })
      });
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.combustion).toBe('COMBUST');
    });

    it('DEEP_COMBUST → COMBUST (collapsed)', () => {
      const horoscope = createNeutralConditionHoroscope({
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
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { retrograde: false, stationary: false })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('DIRECT');
    });

    it('RETROGRADE → RETROGRADE', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { retrograde: true, stationary: false })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('RETROGRADE');
    });

    it('STATIONARY → STATIONARY', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { retrograde: false, stationary: true })
      });
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.motion).toBe('STATIONARY');
    });

    it('missing planetFact → UNKNOWN', () => {
      const horoscope = createNeutralConditionHoroscope();
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
      const horoscope = createNeutralConditionHoroscope();
      delete horoscope.planetFacts[Planet.SATURN];
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.dignity).toBe('UNAVAILABLE');
      expect(saturnResult!.affliction).toBe('UNAVAILABLE');
      expect(saturnResult!.motion).toBe('UNKNOWN');
      expect(saturnResult!.combustion).toBe('UNAVAILABLE');
      expect(saturnResult!.condition).toBe('INSUFFICIENT_DATA');
      expect(saturnResult!.condition).not.toBe('WEAK');
      expect(saturnResult!.condition).not.toBe('AFFLICTED');
    });
  });

  // Group F — aspect influence
  describe('Group F — aspect influence', () => {
    it('attaches generic aspect provenance and keeps C6 natural-nature flags compatible', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [{
          sourcePlanet: Planet.JUPITER,
          targetPlanet: Planet.MERCURY,
          aspectType: 'SPECIAL_5TH',
          houseOffset: 4
        }] as any[]
      };
      // No functional classification source → functionalSource 'NONE' → PARTIAL.
      horoscope.functionalNatureIntegration = undefined;

      const result = buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      });
      const mercury = result.find((item) => item.planet === Planet.MERCURY)!;

      expect(mercury.planetaryInfluenceTrace?.environmentalInfluence.beneficAspectSources)
        .toEqual([expect.objectContaining({
          sourcePlanet: Planet.JUPITER,
          targetPlanet: Planet.MERCURY,
          aspectType: 'SPECIAL_5TH',
          naturalNature: 'BENEFIC',
          classificationBasis: {
            naturalRule: 'NATURAL_BENEFIC_TABLE',
            functionalSource: 'NONE',
            consumedBy: ['CAREER_C6_BENEFIC_SUPPORT']
          }
        })]);
      expect(mercury.positiveFactors.some((factor) => factor.type === 'BENEFIC_SUPPORT')).toBe(true);
      expect(mercury.assessmentDetails).toMatchObject({
        status: 'PARTIAL',
        missingFactors: [],
        partiallyResolvedFactors: ['aspectSources']
      });
    });

    it('does not make optional Shadbala or yoga evidence required for C6 completeness', () => {
      const horoscope = createFullyResolvedAspectHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.planetaryStrength = undefined as never;
      horoscope.yogas = undefined as never;

      const result = buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      });
      const mercury = result.find((item) => item.planet === Planet.MERCURY)!;

      expect(mercury.assessmentDetails).toEqual({
        status: 'FULL',
        missingFactors: []
      });
    });

    it('Jupiter aspecting Mercury → beneficSupport=true', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Jupiter is a natural benefic, so beneficSupport should be true
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(true);
      // The consumed benefic aspect is the sole directional factor → MODERATE.
      expect(mercuryResult!.condition).toBe('MODERATE');
      expect(mercuryResult!.negativeFactors).toEqual([]);
    });

    it('does not consume MIXED natural-benefic/functional-malefic sources for C6', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [{
          sourcePlanet: Planet.JUPITER,
          targetPlanet: Planet.MERCURY,
          aspectType: 'FULL_7TH'
        }]
      };
      horoscope.functionalNatureIntegration = {
        planets: { [Planet.JUPITER]: { functionalNature: 'MALEFIC' } }
      };

      const result = buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      });
      const mercury = result.find((item) => item.planet === Planet.MERCURY)!;

      expect(mercury.planetaryInfluenceTrace?.environmentalInfluence.mixedAspectSources)
        .toEqual([expect.objectContaining({ sourcePlanet: Planet.JUPITER, sourceNature: 'MIXED' })]);
      expect(mercury.positiveFactors.some((factor) => factor.type === 'BENEFIC_SUPPORT')).toBe(false);
      expect(mercury.negativeFactors.some((factor) => factor.type === 'MALEFIC_PRESSURE')).toBe(false);
      expect(mercury.nonConsumedInfluence).toEqual([
        expect.objectContaining({
          reason: 'MIXED_CLASSIFICATION',
          notConsumedReason: 'NATURAL_FUNCTIONAL_CONFLICT',
          futurePolicyDimension: 'NATURAL_FUNCTIONAL_RECONCILIATION'
        })
      ]);
    });

    it('does not consume functional-only or unassessed aspect sources for C6', () => {
      const functionalOnly = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      functionalOnly.natalGrahaDrishti = {
        ...functionalOnly.natalGrahaDrishti,
        aspects: [{
          sourcePlanet: Planet.MOON,
          targetPlanet: Planet.MERCURY,
          aspectType: 'FULL_7TH'
        }]
      };
      functionalOnly.planetFacts[Planet.SUN].position.eclipticLongitude = undefined;
      functionalOnly.planetFacts[Planet.MOON].position.eclipticLongitude = undefined;
      functionalOnly.functionalNatureIntegration = {
        planets: { [Planet.MOON]: { functionalNature: 'BENEFIC' } }
      };

      const functionalResult = buildCareerPlanetaryCondition({
        horoscope: functionalOnly,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      });
      const functionalMercury = functionalResult.find((item) => item.planet === Planet.MERCURY)!;
      expect(functionalMercury.positiveFactors.some((factor) => factor.type === 'BENEFIC_SUPPORT'))
        .toBe(false);
      expect(functionalMercury.nonConsumedInfluence).toEqual([
        expect.objectContaining({
          reason: 'FUNCTIONAL_ONLY',
          notConsumedReason: 'FUNCTIONAL_NATURE_PENDING_C6_POLICY',
          futurePolicyDimension: 'FUNCTIONAL_NATURE',
          candidateConsumer: 'CAREER_C6_BENEFIC_SUPPORT'
        })
      ]);

      functionalOnly.functionalNatureIntegration = undefined;
      const unassessedResult = buildCareerPlanetaryCondition({
        horoscope: functionalOnly,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      });
      const unassessedMercury = unassessedResult.find((item) => item.planet === Planet.MERCURY)!;
      expect(unassessedMercury.condition).not.toBe('WEAK');
      expect(unassessedMercury.negativeFactors).toEqual([]);
      expect(unassessedMercury.nonConsumedInfluence).toEqual([
        expect.objectContaining({
          reason: 'UNASSESSED_CLASSIFICATION',
          notConsumedReason: 'CLASSIFICATION_UNAVAILABLE',
          futurePolicyDimension: 'NONE'
        })
      ]);
    });

    it('Saturn aspecting Mercury → maleficPressure=true', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 11 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      // Saturn is a natural malefic, so maleficPressure should be true
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(true);
      expect(mercuryResult!.condition).toBe('WEAK');
    });

    it('both sources conflicting (canonical wins): natalGrahaDrishti Jupiter→Mercury, legacy grahaDrishti Saturn→Mercury ignored', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
        ] as any[]
      };
      // Legacy grahaDrishti with conflicting aspect (should be ignored)
      (horoscope as any).grahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
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
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 11 })
      });
      delete horoscope.natalGrahaDrishti;
      // Legacy grahaDrishti with Saturn aspect (should be ignored)
      (horoscope as any).grahaDrishti = {
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
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
      const horoscope = createNeutralConditionHoroscope({
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

    it('records conjunction provenance without adding a C6 conjunction condition factor', () => {
      const horoscope = createFullyResolvedAspectHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 1 }),
        // Same sign (Aries) and house as Jupiter so house-sign co-location holds.
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 1, longitude: 0 })
      });

      const result = buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.JUPITER, 'PRIMARY')]
      });
      const jupiter = result.find((item) => item.planet === Planet.JUPITER)!;

      expect(jupiter.planetaryInfluenceTrace?.environmentalInfluence.coLocatedPlanets)
        .toEqual(expect.arrayContaining([
          expect.objectContaining({ planet: Planet.SATURN })
        ]));
      // Consumed benefic aspect support resolves the condition as MODERATE;
      // conjunction itself adds no condition factor.
      expect(jupiter.condition).toBe('MODERATE');
      expect(jupiter.positiveFactors).toContainEqual(
        expect.objectContaining({ type: 'BENEFIC_SUPPORT', effect: 'SUPPORT' })
      );
      expect(jupiter.negativeFactors.some((factor) => factor.type === 'MALEFIC_PRESSURE'))
        .toBe(false);
    });

    it('influence directions: Jupiter→Mercury only ⇒ beneficSupport=true', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
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
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 11 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
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
      const horoscope = createNeutralConditionHoroscope({
        [Planet.JUPITER]: createMockPlanetFact(Planet.JUPITER, { house: 5 }),
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, { house: 7 }),
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' },
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.positiveFactors.some(f => f.type === 'BENEFIC_SUPPORT')).toBe(true);
      expect(mercuryResult!.negativeFactors.some(f => f.type === 'MALEFIC_PRESSURE')).toBe(true);
      // Opposing directional factors resolve to MODERATE, not a collapse.
      expect(mercuryResult!.condition).toBe('MODERATE');
    });
  });

  // Group G — mixed influence
  describe('Group G — mixed influence', () => {
    it('FRIENDLY_SIGN + both benefic and malefic pressure → MODERATE', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, {
          dignityStatus: DignityStatus.FRIEND_SIGN
        })
      });
      // Mock aspects with both benefic and malefic
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' },
          { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
        ] as any[]
      };
      const relevance = [createMockRelevance(Planet.MERCURY, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(mercuryResult!.dignity).toBe('FRIENDLY_SIGN');
      // With mixed influence, should be MODERATE — driven by the friendly-sign
      // dignity support, the Jupiter benefic aspect, and the Saturn malefic aspect.
      expect(mercuryResult!.condition).toBe('MODERATE');
      expect(mercuryResult!.positiveFactors).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'DIGNITY', effect: 'SUPPORT' }),
        expect.objectContaining({ type: 'BENEFIC_SUPPORT', effect: 'SUPPORT' })
      ]));
      expect(mercuryResult!.negativeFactors).toEqual([
        expect.objectContaining({ type: 'MALEFIC_PRESSURE', effect: 'CHALLENGE' })
      ]);
    });
  });

  // Group H — relevance/condition separation
  describe('Group H — relevance/condition separation', () => {
    it('PRIMARY relevance + DEBILITATED dignity → weak condition with affliction unassessed', () => {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.SATURN]: createMockPlanetFact(Planet.SATURN, {
          dignityStatus: DignityStatus.DEBILITATED,
          longitude: 10 // Aries: Saturn debilitated
        })
      });
      // Malefic aspect pressure keeps the condition WEAK (benefic support would moderate it).
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        aspects: [{
          sourcePlanet: Planet.SATURN,
          targetPlanet: Planet.SATURN,
          aspectType: 'FULL_7TH'
        }]
      };
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.relevance).toBe('PRIMARY');
      expect(saturnResult!.condition).toBe('WEAK');
      expect(saturnResult!.assessment).toBe('FULL');
      expect(saturnResult!.negativeFactors).toContainEqual(
        expect.objectContaining({ type: 'DIGNITY', effect: 'CHALLENGE' })
      );
      expect(saturnResult!.negativeFactors).not.toContainEqual(
        expect.objectContaining({ type: 'AFFLICTION' })
      );
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
      const horoscope = createNeutralConditionHoroscope();
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
      const horoscope = createNeutralConditionHoroscope();
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
      const horoscope = createNeutralConditionHoroscope();
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
      const horoscope = createNeutralConditionHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(Object.isFrozen(saturnResult)).toBe(true);
      expect(Object.isFrozen(saturnResult!.positiveFactors)).toBe(true);
      expect(Object.isFrozen(saturnResult!.negativeFactors)).toBe(true);
    });

    it('result arrays are frozen', () => {
      const horoscope = createNeutralConditionHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  // Group M — no mutation of input
  describe('Group M — no mutation of input', () => {
    it('C5 relevance input is not mutated', () => {
      const horoscope = createNeutralConditionHoroscope();
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
      const horoscope = createNeutralConditionHoroscope();
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
      const horoscope = createNeutralConditionHoroscope();
      const relevance = [createMockRelevance(Planet.SATURN, 'PRIMARY')];
      const input: CareerPlanetaryConditionIntegrationInput = { horoscope, relevance };

      const result = buildCareerPlanetaryCondition(input);

      // SUN should be NEUTRAL/UNAVAILABLE since it's not in relevance
      const sunResult = result.find(r => r.planet === Planet.SUN);
      expect(sunResult!.relevance).toBe('NEUTRAL');
      expect(sunResult!.condition).toBe('UNAVAILABLE');
    });
  });

  // Group O — canonical dignity resolver parity
  describe('Group O — canonical dignity resolver parity', () => {
    function jupiterAtCancerPoint25(horoscope: any): void {
      const jupiter = horoscope.planetFacts[Planet.JUPITER];
      jupiter.sign = Sign.CANCER;
      jupiter.position = {
        ...jupiter.position,
        sign: Sign.CANCER,
        eclipticLongitude: 90.25,
        longitude: 90.25,
        signLongitude: 0.25
      };
      jupiter.state = {
        ...jupiter.state,
        condition: PlanetStateCondition.COMBUST
      };
    }

    it.each([
      ['absent dignity record', undefined],
      ['unrecognized dignity status', { planet: Planet.JUPITER, sign: Sign.CANCER, status: 'LEGACY_UNKNOWN' }],
      ['bare-string dignity record', 'STRONG' as any]
    ] as const)(
      'Jupiter at 0.25° Cancer resolves EXALTED via the canonical resolver (%s) and keeps COMBUST as a separate factor',
      (_label, dignityRecord) => {
        const horoscope = createNeutralConditionHoroscope();
        jupiterAtCancerPoint25(horoscope);
        horoscope.planetFacts[Planet.JUPITER].dignity = dignityRecord;

        // The resolver the Planetary Analysis UI uses must agree with C6.
        const uiDignity = calculateDignity(Planet.JUPITER, Sign.CANCER, 0.25).status;
        expect(uiDignity).toBe(DignityStatus.EXALTED);

        const result = buildCareerPlanetaryCondition({
          horoscope,
          relevance: [createMockRelevance(Planet.JUPITER, 'PRIMARY')]
        });
        const jupiter = result.find(r => r.planet === Planet.JUPITER)!;

        expect(jupiter.planetaryInfluenceTrace?.intrinsicStrength.dignity)
          .toBe(DignityStatus.EXALTED);
        expect(jupiter.dignity).toBe('EXALTED');
        // COMBUST is preserved as its own factor and does not overwrite dignity.
        expect(jupiter.combustion).toBe('COMBUST');
        expect(jupiter.positiveFactors).toContainEqual(
          expect.objectContaining({ type: 'DIGNITY', effect: 'SUPPORT' })
        );
        expect(jupiter.negativeFactors).toContainEqual(
          expect.objectContaining({ type: 'COMBUSTION', effect: 'CHALLENGE' })
        );
        // EXALTED support + COMBUST challenge → MODERATE, neither factor erased.
        expect(jupiter.condition).toBe('MODERATE');
      }
    );

    it('recorded dignity contradicting the canonical position is recomputed with a diagnostic', () => {
      const horoscope = createNeutralConditionHoroscope();
      jupiterAtCancerPoint25(horoscope);
      // NEUTRAL is positionally inconsistent at 0.25° Cancer (exaltation sign).
      horoscope.planetFacts[Planet.JUPITER].dignity = {
        planet: Planet.JUPITER,
        sign: Sign.CANCER,
        status: DignityStatus.NEUTRAL
      };

      const result = buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.JUPITER, 'PRIMARY')]
      });
      const jupiter = result.find(r => r.planet === Planet.JUPITER)!;

      expect(jupiter.planetaryInfluenceTrace?.intrinsicStrength.dignity)
        .toBe(DignityStatus.EXALTED);
      expect(jupiter.dignity).toBe('EXALTED');
      expect(jupiter.combustion).toBe('COMBUST');
      expect(jupiter.planetaryInfluenceTrace?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reason: 'DIGNITY_POSITION_MISMATCH' })
        ])
      );
      // EXALTED support + COMBUST challenge → MODERATE.
      expect(jupiter.condition).toBe('MODERATE');
    });
  });

  // Group P — aspect coverage semantics (validated-record counting)
  describe('Group P — aspect coverage semantics', () => {
    function mercuryWithAspects(
      aspects: readonly unknown[],
      computationStatus: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' = 'COMPLETE'
    ) {
      const horoscope = createNeutralConditionHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });
      horoscope.natalGrahaDrishti = {
        computationStatus,
        diagnostics: [],
        aspects: [...aspects]
      };
      return buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      }).find((item) => item.planet === Planet.MERCURY)!;
    }

    it('mixed valid+invalid records: validated record is consumed, rejected record is diagnostic-only → PARTIAL', () => {
      const mercury = mercuryWithAspects([
        { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' },
        { sourcePlanet: 'NOT_A_PLANET', targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' },
        { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'NOT_AN_ASPECT' }
      ]);

      expect(mercury.positiveFactors.some((f) => f.type === 'BENEFIC_SUPPORT')).toBe(true);
      expect(mercury.assessmentDetails).toMatchObject({
        status: 'PARTIAL',
        missingFactors: [],
        partiallyResolvedFactors: ['aspectSources']
      });
      expect(mercury.planetaryInfluenceTrace?.diagnostics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ reason: 'INVALID_SOURCE_PLANET' }),
          expect.objectContaining({ reason: 'MISSING_FIELDS' })
        ])
      );
    });

    it('single valid record with producer PARTIAL → PARTIAL (partially resolved, not missing)', () => {
      const mercury = mercuryWithAspects([
        { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
      ], 'PARTIAL');

      expect(mercury.assessmentDetails).toMatchObject({
        status: 'PARTIAL',
        missingFactors: [],
        partiallyResolvedFactors: ['aspectSources']
      });
    });

    it('all-invalid records → aspectSources UNAVAILABLE (missing), not PARTIAL', () => {
      const mercury = mercuryWithAspects([
        { sourcePlanet: 'NOT_A_PLANET', targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' },
        { sourcePlanet: Planet.SATURN, aspectType: 'FULL_7TH' } // missing target
      ]);

      expect(mercury.positiveFactors).toEqual([]);
      expect(mercury.negativeFactors).toEqual([]);
      expect(mercury.assessmentDetails).toMatchObject({
        status: 'PARTIAL',
        missingFactors: ['aspectSources']
      });
      expect(mercury.assessmentDetails?.partiallyResolvedFactors).toBeUndefined();
      expect(mercury.condition).toBe('INSUFFICIENT_DATA');
    });

    it('producer UNAVAILABLE with otherwise valid records → UNAVAILABLE', () => {
      const mercury = mercuryWithAspects([
        { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH' }
      ], 'UNAVAILABLE');

      expect(mercury.assessmentDetails).toMatchObject({
        missingFactors: expect.arrayContaining(['aspectSources'])
      });
    });

    it('partial fixture: mixed/unconsumed aspect evidence → PARTIAL assessment, never negative', () => {
      const horoscope = createPartialAspectHoroscope({
        [Planet.MERCURY]: createMockPlanetFact(Planet.MERCURY, { house: 9 })
      });

      const mercury = buildCareerPlanetaryCondition({
        horoscope,
        relevance: [createMockRelevance(Planet.MERCURY, 'PRIMARY')]
      }).find((item) => item.planet === Planet.MERCURY)!;

      expect(mercury.planetaryInfluenceTrace?.environmentalInfluence.mixedAspectSources)
        .toEqual([expect.objectContaining({
          sourcePlanet: Planet.JUPITER,
          sourceNature: 'MIXED'
        })]);
      expect(mercury.positiveFactors).toEqual([]);
      expect(mercury.negativeFactors).toEqual([]);
      expect(mercury.nonConsumedInfluence).toEqual([
        expect.objectContaining({ reason: 'MIXED_CLASSIFICATION' })
      ]);
      expect(mercury.assessmentDetails).toMatchObject({
        status: 'PARTIAL',
        missingFactors: [],
        partiallyResolvedFactors: ['aspectSources']
      });
      expect(mercury.condition).toBe('INSUFFICIENT_DATA');
      expect(mercury.condition).not.toBe('WEAK');
    });
  });
});
