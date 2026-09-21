import {
  resolveCareerDashaActivation
} from './careerDashaActivation';

import type {
  CareerDashaActivationContext,
  CareerDashaPlanetContext,
  CareerDashaTiming
} from './careerDashaActivationTypes';

import {
  Planet
} from '../../../types';

import type {
  CareerPlanetRelevance,
  CareerPlanetRole
} from '../careerPlanetaryRelevance';

import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type {
  CareerExpression,
  CareerExpressionDirection
} from '../careerExpression';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  CareerManifestationMode
} from '../careerTypes';

function makeContext(
  overrides: Partial<CareerDashaActivationContext> = {}
): CareerDashaActivationContext {
  return Object.freeze({
    structuralDirection: 'SUPPORT',
    structuralStrength: 'STRONG',
    structuralPrimarySupport: 5,
    structuralPrimaryChallenge: 0,
    planetContexts: Object.freeze([]),
    mdTiming: makeTiming(Planet.SATURN, '2020-01-01', '2025-01-01'),
    adTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2022-01-01'),
    pdTiming: makeTiming(Planet.MERCURY, '2020-01-01', '2021-01-01'),
    ...overrides
  });
}

function makeTiming(
  planet: Planet,
  start: string,
  end: string
): CareerDashaTiming {
  return Object.freeze({
    planet,
    start,
    end
  });
}

function makePlanet(
  planet: Planet,
  relevance: CareerPlanetRelevance = 'PRIMARY',
  roles: readonly CareerPlanetRole[] = Object.freeze(['CAREER_LORD']),
  condition: CareerPlanetaryCondition = 'STRONG',
  expressions: readonly CareerExpression[] = Object.freeze([])
): CareerDashaPlanetContext {
  return Object.freeze({
    planet,
    relevance,
    roles,
    condition,
    expressions,
    relatedHouses: Object.freeze([10]),
    relatedPlanets: Object.freeze([])
  });
}

function makeExpression(
  mode: CareerManifestationMode,
  direction: CareerExpressionDirection = 'SUPPORTED'
): CareerExpression {
  return Object.freeze({
    mode,
    direction,
    strength: 'STRONG',
    evidence: Object.freeze([]),
    supportingEvidenceIds: Object.freeze([]),
    statement: `${mode} expression.`,
    conditional: direction === 'CONDITIONAL'
  });
}

function makeActivation(
  level: string,
  planet: Planet,
  effect: string,
  direction: string,
  strength: string
) {
  return {
    level,
    planet,
    role: expect.any(String),
    effect,
    direction,
    strength,
    evidence: expect.any(Array),
    statement: expect.any(String),
    start: expect.any(String),
    end: expect.any(String)
  };
}

describe('Career Dasha Activation', () => {
  describe('Test 1: No career promise → INSUFFICIENT_DATA', () => {
    it('returns INSUFFICIENT_DATA when structural direction is UNAVAILABLE', () => {
      const context = makeContext({
        structuralDirection: 'UNAVAILABLE',
        structuralPrimarySupport: 0,
        planetContexts: Object.freeze([
          makePlanet(Planet.SATURN, 'PRIMARY', Object.freeze(['CAREER_LORD']), 'STRONG')
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('INSUFFICIENT_DATA');
      expect(result.ad.effect).toBe('INSUFFICIENT_DATA');
      expect(result.pd.effect).toBe('INSUFFICIENT_DATA');
    });

    it('returns INSUFFICIENT_DATA when structural direction is CHALLENGE-only', () => {
      const context = makeContext({
        structuralDirection: 'CHALLENGE',
        structuralPrimarySupport: 0,
        structuralPrimaryChallenge: 5,
        planetContexts: Object.freeze([
          makePlanet(Planet.SATURN, 'PRIMARY', Object.freeze(['CAREER_LORD']), 'STRONG')
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('Test 2: Primary lord activates', () => {
    it('ACTIVATES when PRIMARY lord with STRONG condition and SUPPORTED expressions', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.md.direction).toBe('SUPPORT');
      expect(result.md.strength).toBe('VERY_STRONG');
    });
  });

  describe('Test 3: Natural Karaka alone does NOT activate (golden C6 guardrail)', () => {
    it('does NOT activate when planet has only NATURAL_KARAKA role', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'SECONDARY',
            Object.freeze(['NATURAL_KARAKA']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('DOES_NOT_ACTIVATE');
      expect(result.md.direction).toBe('UNAVAILABLE');
      expect(result.md.strength).toBe('UNDETERMINED');
    });

    it('INSUFFICIENT_DATA when only NATURAL_KARAKA with no career promise', () => {
      const context = makeContext({
        structuralDirection: 'NEUTRAL',
        structuralPrimarySupport: 0,
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'SECONDARY',
            Object.freeze(['NATURAL_KARAKA']),
            'STRONG'
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('Test 4: Challenging relevant planet → CHALLENGES', () => {
    it('CHALLENGES when PRIMARY lord with WEAK/AFFLICTED condition', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('CHALLENGES');
      expect(result.md.direction).toBe('CHALLENGE');
      expect(result.md.strength).toBe('VERY_WEAK');
    });
  });

  describe('Test 5: MD-support + AD-challenge → PARTIALLY_ACTIVATES', () => {
    it('PARTIALLY_ACTIVATES when MD supports and AD challenges', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.MARS,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ]),
        adTiming: makeTiming(Planet.MARS, '2020-01-01', '2022-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.ad.effect).toBe('CHALLENGES');
      expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.overallDirection).toBe('MIXED');
      expect(result.dominantLevel).toBe('MD');
    });
  });

  describe('Test 6: MD-challenge + AD-support → PARTIALLY_ACTIVATES', () => {
    it('PARTIALLY_ACTIVATES when MD challenges and AD supports', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ]),
        mdTiming: makeTiming(Planet.SATURN, '2020-01-01', '2025-01-01'),
        adTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2022-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('CHALLENGES');
      expect(result.ad.effect).toBe('ACTIVATES');
      expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.overallDirection).toBe('MIXED');
      expect(result.dominantLevel).toBe('MD');
    });
  });

  describe('Test 7: MD+AD support → ACTIVATES', () => {
    it('ACTIVATES when both MD and AD support', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ]),
        adTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2022-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.ad.effect).toBe('ACTIVATES');
      expect(result.overallEffect).toBe('ACTIVATES');
      expect(result.overallDirection).toBe('SUPPORT');
      expect(result.overallStrength).toBe('VERY_STRONG');
      expect(result.dominantLevel).toBe('MD');
    });
  });

  describe('Test 8: PD challenge refines (dominantLevel AD, PARTIALLY_ACTIVATES)', () => {
    it('PD challenge refines when AD is dominant', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.MARS,
            'SUPPORTING',
            Object.freeze(['SUPPORTING_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ]),
        adTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2022-01-01'),
        pdTiming: makeTiming(Planet.MARS, '2020-01-01', '2021-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.ad.effect).toBe('ACTIVATES');
      expect(result.pd.effect).toBe('CHALLENGES');
      expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.overallDirection).toBe('MIXED');
      expect(result.dominantLevel).toBe('AD');
    });
  });

  describe('Test 9: Missing planet context → INSUFFICIENT_DATA/UNAVAILABLE', () => {
    it('returns INSUFFICIENT_DATA when planet context is missing', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(Planet.JUPITER, 'PRIMARY', Object.freeze(['CAREER_LORD']), 'STRONG')
        ]),
        mdTiming: makeTiming(Planet.SATURN, '2020-01-01', '2025-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('INSUFFICIENT_DATA');
      expect(result.md.direction).toBe('UNAVAILABLE');
      expect(result.md.strength).toBe('UNDETERMINED');
    });
  });

  describe('Test 10: Only C8 expressions activate', () => {
    it('only activates based on C8-established expressions', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.md.evidence.some(e => e.role === 'EXPRESSION')).toBe(true);
    });
  });

  describe('Test 11: CONDITIONAL stays conditional', () => {
    it('CONDITIONAL expression does not upgrade to full support', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'MODERATE',
            Object.freeze([makeExpression('MANAGEMENT', 'CONDITIONAL')])
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('PARTIALLY_ACTIVATES');
      expect(result.md.direction).toBe('SUPPORT');
    });
  });

  describe('Test 12: Deterministic ordering (toEqual on repeat)', () => {
    it('produces identical results on repeated calls', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ])
      });

      const result1 = resolveCareerDashaActivation(context);
      const result2 = resolveCareerDashaActivation(context);

      expect(result1).toEqual(result2);
    });
  });

  describe('Test 13: Frozen outputs', () => {
    it('returns frozen objects', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.md)).toBe(true);
      expect(Object.isFrozen(result.ad)).toBe(true);
      expect(Object.isFrozen(result.pd)).toBe(true);
      expect(Object.isFrozen(result.md.evidence)).toBe(true);
    });
  });

  describe('Test 14: Canonical Dasha dates preserved', () => {
    it('preserves canonical Dasha start/end dates verbatim', () => {
      const startDate = '2020-01-01';
      const endDate = '2025-01-01';

      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ]),
        mdTiming: makeTiming(Planet.SATURN, startDate, endDate)
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.start).toBe(startDate);
      expect(result.md.end).toBe(endDate);
    });
  });

  describe('Test 15: Changing MD planet changes result', () => {
    it('different MD planet produces different activation', () => {
      const context1 = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ]),
        mdTiming: makeTiming(Planet.SATURN, '2020-01-01', '2025-01-01')
      });

      const context2 = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ]),
        mdTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2025-01-01')
      });

      const result1 = resolveCareerDashaActivation(context1);
      const result2 = resolveCareerDashaActivation(context2);

      expect(result1.md.planet).toBe(Planet.SATURN);
      expect(result2.md.planet).toBe(Planet.JUPITER);
      expect(result1.md.effect).not.toBe(result2.md.effect);
    });
  });

  describe('Test 16: Canonical hierarchy invariants', () => {
    it('MD ACTIVATES + AD CHALLENGES → PARTIALLY_ACTIVATES (canonical invariant)', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.MARS,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ]),
        adTiming: makeTiming(Planet.MARS, '2020-01-01', '2022-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.ad.effect).toBe('CHALLENGES');
      expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.dominantLevel).toBe('MD');
    });

    it('MD CHALLENGES + AD ACTIVATES → PARTIALLY_ACTIVATES (canonical invariant)', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'AFFLICTED',
            Object.freeze([])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          )
        ]),
        mdTiming: makeTiming(Planet.SATURN, '2020-01-01', '2025-01-01'),
        adTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2022-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('CHALLENGES');
      expect(result.ad.effect).toBe('ACTIVATES');
      expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.dominantLevel).toBe('MD');
    });

    it('MD ACTIVATES + AD ACTIVATES + PD CHALLENGES → PARTIALLY_ACTIVATES with dominantLevel AD (canonical invariant)', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.JUPITER,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([makeExpression('MANAGEMENT', 'SUPPORTED')])
          ),
          makePlanet(
            Planet.MARS,
            'SUPPORTING',
            Object.freeze(['SUPPORTING_LORD']),
            'AFFLICTED',
            Object.freeze([])
          )
        ]),
        adTiming: makeTiming(Planet.JUPITER, '2020-01-01', '2022-01-01'),
        pdTiming: makeTiming(Planet.MARS, '2020-01-01', '2021-01-01')
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.ad.effect).toBe('ACTIVATES');
      expect(result.pd.effect).toBe('CHALLENGES');
      expect(result.overallEffect).toBe('PARTIALLY_ACTIVATES');
      expect(result.dominantLevel).toBe('AD');
    });
  });

  describe('Test 17: PRIMARY-relevant STRONG-condition planet activates without C8 expression', () => {
    it('activates established structural promise even with no C8 expression', () => {
      const context = makeContext({
        planetContexts: Object.freeze([
          makePlanet(
            Planet.SATURN,
            'PRIMARY',
            Object.freeze(['CAREER_LORD']),
            'STRONG',
            Object.freeze([]) // No C8 expressions
          )
        ])
      });

      const result = resolveCareerDashaActivation(context);

      expect(result.md.effect).toBe('ACTIVATES');
      expect(result.md.direction).toBe('SUPPORT');
      expect(result.overallEffect).toBe('ACTIVATES');
    });
  });
});
