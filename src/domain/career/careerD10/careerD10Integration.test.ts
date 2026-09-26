import { describe, expect, it } from 'vitest';

import {
  buildCareerD10Analysis
} from './careerD10Integration';

import type {
  CareerD10IntegrationInput
} from './careerD10Integration';

import {
  Planet,
  DignityStatus
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpression
} from '../careerExpression';

import type {
  CareerPlanetaryRelevance
} from '../careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from '../careerPlanetaryCondition';

import type {
  CareerStructuralReasoning
} from '../careerStructuralReasoning';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  Horoscope
} from '../../../types';

import type {
  WeightedReasoningEvidence
} from '../../reasoning/reasoningTypes';

import {
  calculateHoroscope
} from '../../../engine/astroEngine';

import {
  CANONICAL_BIRTH_DETAILS
} from '../../../test/fixtures/canonicalChart';

import {
  buildCareerNatalAnalysis
} from '../careerNatalConvergence';

import {
  buildCareerExpression
} from '../careerExpressionIntegration';

// Test helpers

function makeMinimalNatal(
  direction: CareerStructuralDirection = 'SUPPORT',
  strength: CareerStructuralStrength = 'STRONG'
): CareerNatalAnalysis {
  return Object.freeze({
    structural: Object.freeze({
      direction,
      strength,
      primarySupport: direction === 'SUPPORT' ? 5 : 0,
      primaryChallenge: direction === 'CHALLENGE' ? 5 : 0,
      supportingSupport: 3,
      supportingChallenge: 1,
      challengingSupport: 1,
      challengingChallenge: 3,
      mixedWeight: 0,
      evidence: Object.freeze([]),
      primaryEvidenceIds: Object.freeze([]),
      supportingEvidenceIds: Object.freeze([]),
      challengingEvidenceIds: Object.freeze([]),
      conflicts: Object.freeze([]),
      statement: 'Structural reasoning.'
    } as unknown as CareerStructuralReasoning),
    relevance: Object.freeze([]) as readonly CareerPlanetaryRelevance[],
    condition: Object.freeze([]) as readonly CareerPlanetaryConditionResult[],
    lordRelationships: Object.freeze([]),
    direction: direction as any,
    strength: strength as any,
    evidence: Object.freeze([]) as readonly WeightedReasoningEvidence[],
    conflicts: Object.freeze([]),
    reasoningTrace: Object.freeze({
      primaryPromise: Object.freeze([]),
      secondarySupport: Object.freeze([]),
      modifiers: Object.freeze([]),
      yogas: Object.freeze([]),
      varga: Object.freeze([]),
      dasha: Object.freeze([]),
      transit: Object.freeze([])
    })
  });
}

function makeMinimalExpression(
  expressions: readonly CareerExpression[] = []
): CareerExpressionAnalysis {
  return Object.freeze({
    expressions,
    statement: 'Expression analysis.'
  });
}

function makeHoroscopeWithD10(
  planets: Partial<Record<Planet, { house: number; dignity?: DignityStatus }>>,
  houses: Array<{ house: number; lord: Planet; occupants: Planet[] }>
): Horoscope {
  const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  return Object.freeze({
    ...baseHoroscope,
    divisionalInterpretation: Object.freeze({
      ...baseHoroscope.divisionalInterpretation,
      d10: Object.freeze({
        varga: 'D10',
        chartType: baseHoroscope.rasiChart.chartType,
        ascendant: Object.freeze({
          sign: baseHoroscope.rasiChart.ascendantSign,
          eclipticLongitude: baseHoroscope.rasiChart.ascendantLongitude
        }),
        houseLords: Object.freeze(
          Object.fromEntries(houses.map(h => [h.house, h.lord]))
        ),
        planets: Object.freeze(
          Object.fromEntries(
            Object.entries(planets).map(([planet, data]) => [
              planet,
              Object.freeze({
                planet: planet as Planet,
                sign: baseHoroscope.planetFacts[planet as Planet].sign,
                house: data.house,
                eclipticLongitude: baseHoroscope.rasiChart.positions[planet as Planet].eclipticLongitude,
                dignity: data.dignity,
                retrograde: false,
                d1Anchor: Object.freeze({
                  sign: baseHoroscope.planetFacts[planet as Planet].sign,
                  house: baseHoroscope.planetFacts[planet as Planet].house,
                  dignity: data.dignity || DignityStatus.NEUTRAL,
                  functionalRoles: Object.freeze([]),
                  strengthAvailability: 'AVAILABLE'
                }),
                evidence: Object.freeze([])
              })
            ])
          )
        ),
        houses: Object.freeze(
          houses.map(h => Object.freeze({
            house: h.house,
            sign: baseHoroscope.rasiChart.ascendantSign,
            lord: h.lord,
            occupants: Object.freeze(h.occupants),
            evidence: Object.freeze([])
          }))
        ) as any,
        domainMetadata: Object.freeze({}),
        yogasAvailability: 'NOT_CALCULATED',
        evidence: Object.freeze([]),
        confidence: 'HIGH'
      })
    })
  } as Horoscope);
}

function makeInput(overrides: Partial<CareerD10IntegrationInput> = {}): CareerD10IntegrationInput {
  return Object.freeze({
    horoscope: calculateHoroscope(CANONICAL_BIRTH_DETAILS),
    natal: makeMinimalNatal(),
    expression: makeMinimalExpression(),
    ...overrides
  });
}

describe('C10 D10 Integration', () => {
  describe('Test Group A: Natal direction/strength preservation (§26-30)', () => {
    it('preserves natal SUPPORT direction when D10 is strong', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.natalStrength).toBe('STRONG');
      // D10 should reinforce natal
      expect(result.d10Effect).toBe('REINFORCES');
    });

    it('preserves natal CHALLENGE direction when D10 is weak', () => {
      const input = makeInput({
        natal: makeMinimalNatal('CHALLENGE', 'WEAK'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.DEBILITATED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.natalDirection).toBe('CHALLENGE');
      expect(result.natalStrength).toBe('WEAK');
    });

    it('never overwrites natal direction with D10 direction', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 8, dignity: DignityStatus.DEBILITATED } },
          [{ house: 8, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      // Natal remains SUPPORT even though D10 in challenging house
      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.d10Direction).not.toBe(result.natalDirection);
    });
  });

  describe('Test Group B: natalPromisePreserved true when natal is NEUTRAL and D10 is strong (§27)', () => {
    it('sets natalPromisePreserved true when natal NEUTRAL + D10 strong', () => {
      const input = makeInput({
        natal: makeMinimalNatal('NEUTRAL', 'UNDETERMINED'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.natalPromisePreserved).toBe(true);
    });
  });

  describe('Test Group C: REINFORCES/MODIFIES relationships (§28-29)', () => {
    it('produces REINFORCES relationship when natal SUPPORT + D10 SUPPORT', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.relationship).toBe('REINFORCES');
    });

    it('produces MODIFIES relationship when natal SUPPORT + D10 CHALLENGE', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 8, dignity: DignityStatus.DEBILITATED } },
          [{ house: 8, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.relationship).toBe('MODIFIES');
    });
  });

  describe('Test Group D: Expression qualification of existing C8 expression (§31-32)', () => {
    it('qualifies an existing C8 SUPPORTED expression with D10 SUPPORT', () => {
      const expression: CareerExpression = Object.freeze({
        mode: 'LEADERSHIP',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        evidence: Object.freeze([]),
        supportingEvidenceIds: Object.freeze(['evidence-1', 'evidence-2']),
        statement: 'Leadership expression.',
        conditional: false
      });

      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        expression: makeMinimalExpression([expression]),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.expressionQualifications).toHaveLength(1);
      const qualification = result.expressionQualifications[0];
      expect(qualification.qualified).toBe(true);
      expect(qualification.expressionId).toBe('evidence-1|evidence-2');
      expect(qualification.effect).toBe('REINFORCES');
    });
  });

  describe('Test Group E: NO expression created from D10 alone (§31-32)', () => {
    it('does not create new expressions from D10 when natal has no expressions', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        expression: makeMinimalExpression([]),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.expressionQualifications).toHaveLength(0);
    });
  });

  describe('Test Group F: Missing D10 → UNAVAILABLE with natal preserved (§33)', () => {
    it('returns UNAVAILABLE d10Effect when D10 data is missing, preserves natal', () => {
      const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const horoscopeWithoutD10 = Object.freeze({
        ...baseHoroscope,
        divisionalInterpretation: Object.freeze({
          ...baseHoroscope.divisionalInterpretation,
          d10: undefined
        }) as any
      });

      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: horoscopeWithoutD10
      });

      const result = buildCareerD10Analysis(input);

      // The adapter's availability is based on d10Effect from the semantic engine
      // When D10 data is missing, the engine returns d10Effect: 'UNAVAILABLE'
      expect(result.d10Effect).toBe('UNAVAILABLE');
      expect(result.d10Direction).toBe('UNAVAILABLE');
      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.natalStrength).toBe('STRONG');
    });
  });

  describe('Test Group G: Determinism and input-order independence (§34-35)', () => {
    it('produces identical results on repeated calls with same input', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          {
            [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED },
            [Planet.MOON]: { house: 6, dignity: DignityStatus.OWN_SIGN }
          },
          [
            { house: 10, lord: Planet.SUN, occupants: [] },
            { house: 6, lord: Planet.MOON, occupants: [] }
          ]
        )
      });

      const result1 = buildCareerD10Analysis(input);
      const result2 = buildCareerD10Analysis(input);

      expect(result1).toEqual(result2);
    });

    it('produces identical results regardless of D10 planet input order', () => {
      const planets1 = {
        [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED },
        [Planet.MOON]: { house: 6, dignity: DignityStatus.OWN_SIGN }
      };

      const planets2 = {
        [Planet.MOON]: { house: 6, dignity: DignityStatus.OWN_SIGN },
        [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED }
      };

      const input1 = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(planets1, [
          { house: 10, lord: Planet.SUN, occupants: [] },
          { house: 6, lord: Planet.MOON, occupants: [] }
        ])
      });

      const input2 = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(planets2, [
          { house: 10, lord: Planet.SUN, occupants: [] },
          { house: 6, lord: Planet.MOON, occupants: [] }
        ])
      });

      const result1 = buildCareerD10Analysis(input1);
      const result2 = buildCareerD10Analysis(input2);

      expect(result1).toEqual(result2);
    });
  });

  describe('Test Group H: Evidence identityKey ≠ id and non-empty sourceIds (§36)', () => {
    it('evidence identityKey differs from occurrence id', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      result.evidence.forEach(evidence => {
        expect(evidence.identityKey).not.toBe(evidence.id);
        expect(evidence.id).toContain(evidence.identityKey);
      });
    });

    it('evidence has non-empty sourceIds', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      result.evidence.forEach(evidence => {
        expect(evidence.sourceIds.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Test Group I: rootEvidenceIds deduped+sorted (§37)', () => {
    it('rootEvidenceIds are deduplicated and sorted', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      // Should be empty (conservative approach)
      expect(result.rootEvidenceIds).toEqual([]);

      // If not empty, should be sorted and deduplicated
      if (result.rootEvidenceIds.length > 0) {
        const sorted = [...result.rootEvidenceIds].sort();
        expect(result.rootEvidenceIds).toEqual(sorted);
        expect(result.rootEvidenceIds.length).toBe(new Set(result.rootEvidenceIds).size);
      }
    });
  });

  describe('Test Group J: Deep immutability (§38)', () => {
    it('frozen result and all nested arrays/objects', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);
      expect(Object.isFrozen(result.conflicts)).toBe(true);
      expect(Object.isFrozen(result.expressionQualifications)).toBe(true);
      expect(Object.isFrozen(result.rootEvidenceIds)).toBe(true);

      result.evidence.forEach(evidence => {
        expect(Object.isFrozen(evidence)).toBe(true);
        expect(Object.isFrozen(evidence.sourceIds)).toBe(true);
        expect(Object.isFrozen(evidence.provenance)).toBe(true);
        expect(Object.isFrozen(evidence.provenance.ruleIds)).toBe(true);
        expect(Object.isFrozen(evidence.provenance.sourceIds)).toBe(true);
        expect(Object.isFrozen(evidence.provenance.natalRootIds)).toBe(true);
      });
    });
  });

  describe('Test Group K: D10 does not mutate horoscope.dashaInterpretation (§39)', () => {
    it('horoscope.dashaInterpretation unchanged after analysis', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const dashaBefore = structuredClone(horoscope.dashaInterpretation);

      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      buildCareerD10Analysis(input);

      const dashaAfter = input.horoscope.dashaInterpretation;
      expect(dashaAfter).toEqual(dashaBefore);
    });
  });

  describe('Test Group L: No timing/transit/finalConclusion properties (§40)', () => {
    it('does not include dasha, timing, transit, or finalConclusion fields', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result).not.toHaveProperty('dashaEffect');
      expect(result).not.toHaveProperty('dashaDirection');
      expect(result).not.toHaveProperty('dashaStrength');
      expect(result).not.toHaveProperty('timing');
      expect(result).not.toHaveProperty('transit');
      expect(result).not.toHaveProperty('finalConclusion');
    });
  });

  describe('Test Group M: Real-engine chain test (§41)', () => {
    it('real-engine chain produces defined result', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const natal = buildCareerNatalAnalysis({ horoscope });
      const expression = buildCareerExpression({ natal });

      const input: CareerD10IntegrationInput = Object.freeze({
        horoscope,
        natal,
        expression
      });

      const result = buildCareerD10Analysis(input);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('availability');
      expect(result).toHaveProperty('natalDirection');
      expect(result).toHaveProperty('natalStrength');
      expect(result).toHaveProperty('d10Effect');
      expect(result).toHaveProperty('d10Direction');
      expect(result).toHaveProperty('d10Strength');
      expect(result).toHaveProperty('qualifiedDirection');
      expect(result).toHaveProperty('qualifiedStrength');
      expect(result).toHaveProperty('natalPromisePreserved');
      expect(result).toHaveProperty('relationship');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('expressionQualifications');
      expect(result).toHaveProperty('rootEvidenceIds');
      expect(result).toHaveProperty('statement');
    });
  });

  describe('Test Group N: mapD10Condition neutral-dignity→UNAVAILABLE decision', () => {
    it('maps NEUTRAL dignity to UNAVAILABLE condition in planet context', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.NEUTRAL } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      // NEUTRAL dignity maps to UNAVAILABLE condition in planet context
      // The semantic engine returns INSUFFICIENT_DATA when planets have UNAVAILABLE condition
      expect(result.d10Effect).toBe('INSUFFICIENT_DATA');
    });

    it('maps NEUTRAL_SIGN dignity to UNAVAILABLE condition in planet context', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.NEUTRAL_SIGN } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.d10Effect).toBe('INSUFFICIENT_DATA');
    });

    it('maps undefined dignity to UNAVAILABLE condition in planet context', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: undefined } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.d10Effect).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('Test Group O: Various D10 qualification scenarios', () => {
    it('EXALTED dignity in PRIMARY house produces STRONG condition', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.d10Direction).toBe('SUPPORT');
      expect(result.d10Effect).toBe('REINFORCES');
    });

    it('DEBILITATED dignity in PRIMARY house produces AFFLICTED condition', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.DEBILITATED } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.d10Direction).toBe('CHALLENGE');
    });

    it('FRIEND_SIGN dignity produces MODERATE condition', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.FRIEND_SIGN } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.d10Direction).toBe('NEUTRAL');
    });

    it('ENEMY_SIGN dignity produces WEAK condition', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          { [Planet.SUN]: { house: 10, dignity: DignityStatus.ENEMY_SIGN } },
          [{ house: 10, lord: Planet.SUN, occupants: [] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.d10Direction).toBe('CHALLENGE');
    });

    it('house with tenants populates tenantConditions correctly', () => {
      const input = makeInput({
        natal: makeMinimalNatal('SUPPORT', 'STRONG'),
        horoscope: makeHoroscopeWithD10(
          {
            [Planet.SUN]: { house: 10, dignity: DignityStatus.EXALTED },
            [Planet.MOON]: { house: 10, dignity: DignityStatus.OWN_SIGN }
          },
          [{ house: 10, lord: Planet.SUN, occupants: [Planet.MOON] }]
        )
      });

      const result = buildCareerD10Analysis(input);

      expect(result.evidence.length).toBeGreaterThan(0);
    });
  });
});
