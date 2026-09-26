import {
  buildCareerDashaAnalysis
} from './careerDashaIntegration';

import type {
  CareerDashaIntegrationInput
} from './careerDashaIntegration';

import {
  Planet
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis
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

// Simplified test using real engine data and minimal focused mocks
// This tests the integration layer specifically, not recreating the full C5/C6/C8 test suite

function makeHoroscopeWithDasha(): Horoscope {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  // Add mock Dasha timing for testing
  return Object.freeze({
    ...horoscope,
    dashaInterpretation: Object.freeze({
      current: Object.freeze({
        mahadasha: Object.freeze({
          planet: Planet.SATURN,
          start: '2020-01-01',
          end: '2025-01-01'
        }),
        antardasha: Object.freeze({
          planet: Planet.JUPITER,
          start: '2020-01-01',
          end: '2022-01-01'
        }),
        pratyantardasha: Object.freeze({
          planet: Planet.MERCURY,
          start: '2020-01-01',
          end: '2021-01-01'
        })
      })
    })
  } as Horoscope);
}

function makeMinimalNatal(): CareerNatalAnalysis {
  // Use a minimal natal that satisfies the type requirements
  // The actual C5/C6/C8 test suites should cover detailed semantics
  return Object.freeze({
    structural: Object.freeze({
      direction: 'SUPPORT' as CareerStructuralDirection,
      strength: 'STRONG' as CareerStructuralStrength,
      primarySupport: 5,
      primaryChallenge: 0,
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
      statement: 'Strong structural support for career.'
    } as unknown as CareerStructuralReasoning),
    relevance: Object.freeze([]) as readonly CareerPlanetaryRelevance[],
    condition: Object.freeze([]) as readonly CareerPlanetaryConditionResult[],
    lordRelationships: Object.freeze([]),
    direction: 'SUPPORT',
    strength: 'STRONG',
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

function makeMinimalExpression(): CareerExpressionAnalysis {
  return Object.freeze({
    expressions: Object.freeze([]),
    statement: 'No expressions available.'
  });
}

function makeInput(overrides: Partial<CareerDashaIntegrationInput> = {}): CareerDashaIntegrationInput {
  return Object.freeze({
    horoscope: makeHoroscopeWithDasha(),
    natal: makeMinimalNatal(),
    expression: makeMinimalExpression(),
    ...overrides
  });
}

describe('C9 Dasha Integration', () => {
  describe('Test 1: MD primary / AD modifier / PD refinement roles', () => {
    it('assigns correct roles to MD/AD/PD', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      expect(result.md.role).toBe('PRIMARY_DRIVER');
      expect(result.ad.role).toBe('MODIFIER');
      expect(result.pd.role).toBe('REFINEMENT');
    });
  });

  describe('Test 2: Unavailable case', () => {
    it('returns planet: undefined and overallDirection: UNAVAILABLE when no Dasha', () => {
      const input = makeInput({
        horoscope: Object.freeze({
          dashaInterpretation: undefined
        } as Horoscope)
      });

      const result = buildCareerDashaAnalysis(input);

      expect(result.overallEffect).toBe('INSUFFICIENT_DATA');
      expect(result.overallDirection).toBe('UNAVAILABLE');
      expect(result.md.planet).toBeUndefined();
      expect(result.ad.planet).toBeUndefined();
      expect(result.pd.planet).toBeUndefined();
    });
  });

  describe('Test 3: Determinism (two runs toEqual)', () => {
    it('produces identical results on repeated calls', () => {
      const input = makeInput();

      const result1 = buildCareerDashaAnalysis(input);
      const result2 = buildCareerDashaAnalysis(input);

      expect(result1).toEqual(result2);
    });
  });

  describe('Test 4: Immutability', () => {
    it('frozen result + arrays, horoscope not mutated', () => {
      const input = makeInput();
      const horoscopeBefore = JSON.stringify(input.horoscope);

      const result = buildCareerDashaAnalysis(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.md)).toBe(true);
      expect(Object.isFrozen(result.ad)).toBe(true);
      expect(Object.isFrozen(result.pd)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);

      const horoscopeAfter = JSON.stringify(input.horoscope);
      expect(horoscopeBefore).toBe(horoscopeAfter);
    });
  });

  describe('Test 5: No D10/transit fields present', () => {
    it('does not include D10 or transit-specific fields', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      // Should not have D10-specific fields
      expect(result).not.toHaveProperty('d10Qualification');
      expect(result).not.toHaveProperty('d10Evidence');

      // Should not have transit-specific fields
      expect(result).not.toHaveProperty('transit');
      expect(result).not.toHaveProperty('transitEvidence');
    });
  });

  describe('Test 6: Real-engine integration', () => {
    it('produces a coherent hierarchy with real horoscope calculation', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      const input = makeInput({
        horoscope
      });

      const result = buildCareerDashaAnalysis(input);

      // Should produce a valid hierarchy
      expect(result).toHaveProperty('md');
      expect(result).toHaveProperty('ad');
      expect(result).toHaveProperty('pd');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('overallEffect');
      expect(result).toHaveProperty('overallDirection');

      // With our mock Dasha data added, should have actual planets
      // If the real horoscope doesn't have Dasha, it will return unavailable
      if (horoscope.dashaInterpretation?.current) {
        expect(result.md.planet).toBeDefined();
        expect(result.ad.planet).toBeDefined();
        expect(result.pd.planet).toBeDefined();
      } else {
        // Real horoscope may not have Dasha data, so it should be unavailable
        expect(result.overallEffect).toBe('INSUFFICIENT_DATA');
        expect(result.overallDirection).toBe('UNAVAILABLE');
      }
    });
  });

  describe('Test 7: SourceIds are activation evidence ids (not circular)', () => {
    it('sourceIds point to activation evidence ids, not the C9 occurrence id', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      // Check that sourceIds are not just the C9-generated id
      result.evidence.forEach(evidence => {
        // sourceIds should be the actual activation evidence ids
        expect(evidence.sourceIds.length).toBeGreaterThanOrEqual(0);
        // The C9-generated id should not be in sourceIds (no circular reference)
        expect(evidence.sourceIds).not.toContain(evidence.id);
      });
    });
  });

  describe('Test 8: Conservative root evidence (empty array)', () => {
    it('natalRootIds are empty due to conservative approach', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      // All evidence should have empty natalRootIds due to conservative approach
      result.evidence.forEach(evidence => {
        expect(evidence.provenance.natalRootIds).toEqual([]);
      });
    });
  });

  describe('Test 9: INSUFFICIENT_DATA maps to UNAVAILABLE at adapter', () => {
    it('missing data maps to UNAVAILABLE, not NEUTRAL', () => {
      const input = makeInput({
        horoscope: Object.freeze({
          dashaInterpretation: undefined
        } as Horoscope)
      });

      const result = buildCareerDashaAnalysis(input);

      expect(result.overallEffect).toBe('INSUFFICIENT_DATA');
      expect(result.overallDirection).toBe('UNAVAILABLE');
      // Should NOT be NEUTRAL (missing evidence ≠ negative evidence)
      expect(result.overallDirection).not.toBe('NEUTRAL');
    });
  });
});
