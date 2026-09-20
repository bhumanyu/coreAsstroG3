import { Planet } from '../../types';

import {
  interpretCareerPlanetaryCondition,
  interpretCareerPlanetaryConditionBatch,
  type CareerPlanetaryConditionContext
} from './careerPlanetaryCondition';

import type {
  CareerPlanetRelevance
} from './careerPlanetaryRelevance';

describe('Career Planetary Condition (C7)', () => {
  // Group A — relevance boundary
  describe('Group A — relevance boundary', () => {
    it('A1: PRIMARY + valid condition → condition evaluated', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('STRONG');
      expect(result.relevance).toBe('PRIMARY');
    });

    it('A2: SUPPORTING + valid condition → condition evaluated', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'SUPPORTING' as CareerPlanetRelevance,
        dignity: 'FRIENDLY_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('MODERATE');
      expect(result.relevance).toBe('SUPPORTING');
    });

    it('A3: SECONDARY + valid condition → condition evaluated', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.JUPITER,
        relevance: 'SECONDARY' as CareerPlanetRelevance,
        dignity: 'NEUTRAL_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('NEUTRAL');
      expect(result.relevance).toBe('SECONDARY');
    });

    it('A4: CONDITIONAL + valid condition → condition evaluated', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MARS,
        relevance: 'CONDITIONAL' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('STRONG');
      expect(result.relevance).toBe('CONDITIONAL');
    });

    it('A5: NEUTRAL → UNAVAILABLE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.VENUS,
        relevance: 'NEUTRAL' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('UNAVAILABLE');
      expect(result.relevance).toBe('NEUTRAL');
      expect(result.statement).toContain('no established Career relevance');
    });
  });

  // Group B — missing data
  describe('Group B — missing data', () => {
    it('PRIMARY + dataAvailable=false → UNAVAILABLE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'UNAVAILABLE',
        affliction: 'UNAVAILABLE',
        motion: 'UNKNOWN',
        combustion: 'UNAVAILABLE',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: false
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('UNAVAILABLE');
      expect(result.condition).not.toBe('WEAK');
      expect(result.condition).not.toBe('AFFLICTED');
      expect(result.condition).not.toBe('NEUTRAL');
    });
  });

  // Group C — dignity
  describe('Group C — dignity', () => {
    it('EXALTED → STRONG', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'EXALTED',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('STRONG');
      expect(result.positiveFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is exalted.'
      });
    });

    it('OWN_SIGN → STRONG', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('STRONG');
      expect(result.positiveFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is in its own sign.'
      });
    });

    it('FRIENDLY_SIGN → MODERATE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'FRIENDLY_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('MODERATE');
      expect(result.positiveFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is in a friendly sign.'
      });
    });

    it('NEUTRAL_SIGN → NEUTRAL', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'NEUTRAL_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('NEUTRAL');
    });

    it('ENEMY_SIGN → WEAK', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MARS,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'ENEMY_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('WEAK');
      expect(result.negativeFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'CHALLENGE',
        statement: 'Planet is in an enemy sign.'
      });
    });

    it('DEBILITATED → WEAK', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'DEBILITATED',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('WEAK');
      expect(result.negativeFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'CHALLENGE',
        statement: 'Planet is debilitated.'
      });
    });
  });

  // Group D — affliction
  describe('Group D — affliction', () => {
    it('NONE → no negative affliction factor', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors.some(f => f.type === 'AFFLICTION')).toBe(false);
    });

    it('MILD → challenge factor', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'MILD',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors).toContainEqual({
        type: 'AFFLICTION',
        effect: 'CHALLENGE',
        statement: 'Planet has mild affliction.'
      });
    });

    it('MODERATE → challenge factor', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'MODERATE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors).toContainEqual({
        type: 'AFFLICTION',
        effect: 'CHALLENGE',
        statement: 'Planet has moderate affliction.'
      });
    });

    it('SEVERE → AFFLICTED', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'EXALTED',
        affliction: 'SEVERE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('AFFLICTED');
      expect(result.negativeFactors).toContainEqual({
        type: 'AFFLICTION',
        effect: 'CHALLENGE',
        statement: 'Planet has severe affliction.'
      });
    });
  });

  // Group E — combustion
  describe('Group E — combustion', () => {
    it('NOT_COMBUST → no combustion challenge', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors.some(f => f.type === 'COMBUSTION')).toBe(false);
    });

    it('COMBUST → challenge factor', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors).toContainEqual({
        type: 'COMBUSTION',
        effect: 'CHALLENGE',
        statement: 'Planet is combust.'
      });
    });
  });

  // Group F — motion
  describe('Group F — motion', () => {
    it('RETROGRADE must not automatically become WEAK or AFFLICTED', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'RETROGRADE',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('STRONG');
      expect(result.neutralFactors).toContainEqual({
        type: 'MOTION',
        effect: 'NEUTRAL',
        statement: 'Planet is retrograde.'
      });
    });
  });

  // Group G — mixed condition
  describe('Group G — mixed condition', () => {
    it('OWN_SIGN + COMBUST → MODERATE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('MODERATE');
    });

    it('FRIENDLY_SIGN + malefic pressure → MODERATE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'FRIENDLY_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: true,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('MODERATE');
    });
  });

  // Group H — severe affliction precedence
  describe('Group H — severe affliction precedence', () => {
    it('EXALTED + SEVERE affliction → AFFLICTED', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'EXALTED',
        affliction: 'SEVERE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('AFFLICTED');
    });
  });

  // Group I — condition/relevance separation
  describe('Group I — condition/relevance separation', () => {
    it('relevance = PRIMARY, dignity = DEBILITATED → relevance = PRIMARY, condition = WEAK', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'DEBILITATED',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.relevance).toBe('PRIMARY');
      expect(result.condition).toBe('WEAK');
      expect(result.relevance).not.toBe('NEUTRAL');
    });
  });

  // Group J — natural Karaka does not affect condition by itself
  describe('Group J — natural Karaka does not affect condition by itself', () => {
    it('Saturn = natural Career Karaka with NEUTRAL dignity → NEUTRAL condition', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'NEUTRAL_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.condition).toBe('NEUTRAL');
    });
  });

  // Group K — no Dasha leakage
  describe('Group K — no Dasha leakage', () => {
    it('result contains no Dasha-related fields', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result).not.toHaveProperty('dasha');
      expect(result).not.toHaveProperty('md');
      expect(result).not.toHaveProperty('ad');
      expect(result).not.toHaveProperty('pd');
      expect(result).not.toHaveProperty('activation');
      expect(result.statement).not.toMatch(/dasha/i);
    });
  });

  // Group L — no D10 leakage
  describe('Group L — no D10 leakage', () => {
    it('result contains no D10-related fields', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result).not.toHaveProperty('d10');
      expect(result).not.toHaveProperty('varga');
      expect(result).not.toHaveProperty('careerExpression');
      expect(result.statement).not.toMatch(/d10|varga/i);
    });
  });

  // Group M — no transit leakage
  describe('Group M — no transit leakage', () => {
    it('result contains no transit-related fields', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result).not.toHaveProperty('transit');
      expect(result).not.toHaveProperty('asOf');
      expect(result).not.toHaveProperty('timing');
      expect(result.statement).not.toMatch(/transit|timing/i);
    });
  });

  // Group N — immutability
  describe('Group N — immutability', () => {
    it('result is frozen', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.positiveFactors)).toBe(true);
      expect(Object.isFrozen(result.negativeFactors)).toBe(true);
    });
  });

  // Group O — deterministic behavior
  describe('Group O — deterministic behavior', () => {
    it('same context twice produces identical results', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result1 = interpretCareerPlanetaryCondition(context);
      const result2 = interpretCareerPlanetaryCondition(context);

      expect(result1).toEqual(result2);
    });
  });

  // Group P — no scoring
  describe('Group P — no scoring', () => {
    it('result does not contain scoring fields', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result).not.toHaveProperty('score');
      expect(result).not.toHaveProperty('weight');
      expect(result).not.toHaveProperty('percentage');
      expect(result).not.toHaveProperty('rank');
    });
  });

  // Group Q — no final conclusion
  describe('Group Q — no final conclusion', () => {
    it('result does not contain final conclusion fields', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result).not.toHaveProperty('careerStrength');
      expect(result).not.toHaveProperty('careerConclusion');
      expect(result).not.toHaveProperty('manifestationMode');
      expect(result.statement).not.toMatch(/promotion|employment|business|success|failure/i);
    });
  });

  // Group R — factor provenance
  describe('Group R — factor provenance', () => {
    it('EXALTED → DIGNITY/SUPPORT', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'EXALTED',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.positiveFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is exalted.'
      });
    });

    it('DEBILITATED → DIGNITY/CHALLENGE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'DEBILITATED',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors).toContainEqual({
        type: 'DIGNITY',
        effect: 'CHALLENGE',
        statement: 'Planet is debilitated.'
      });
    });

    it('COMBUST → COMBUSTION/CHALLENGE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors).toContainEqual({
        type: 'COMBUSTION',
        effect: 'CHALLENGE',
        statement: 'Planet is combust.'
      });
    });

    it('malefic pressure → MALEFIC_PRESSURE/CHALLENGE', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: true,
        dataAvailable: true
      });

      const result = interpretCareerPlanetaryCondition(context);

      expect(result.negativeFactors).toContainEqual({
        type: 'MALEFIC_PRESSURE',
        effect: 'CHALLENGE',
        statement: 'Planet receives deterministic malefic pressure.'
      });
    });
  });

  // Group S — batch
  describe('Group S — batch', () => {
    it('interpretCareerPlanetaryConditionBatch produces 3 results for 3 planets', () => {
      const contexts: readonly CareerPlanetaryConditionContext[] = Object.freeze([
        {
          planet: Planet.SATURN,
          relevance: 'PRIMARY' as CareerPlanetRelevance,
          dignity: 'OWN_SIGN',
          affliction: 'NONE',
          motion: 'DIRECT',
          combustion: 'NOT_COMBUST',
          beneficSupport: false,
          maleficPressure: false,
          dataAvailable: true
        },
        {
          planet: Planet.MERCURY,
          relevance: 'SUPPORTING' as CareerPlanetRelevance,
          dignity: 'FRIENDLY_SIGN',
          affliction: 'NONE',
          motion: 'DIRECT',
          combustion: 'NOT_COMBUST',
          beneficSupport: false,
          maleficPressure: false,
          dataAvailable: true
        },
        {
          planet: Planet.MARS,
          relevance: 'SECONDARY' as CareerPlanetRelevance,
          dignity: 'NEUTRAL_SIGN',
          affliction: 'NONE',
          motion: 'DIRECT',
          combustion: 'NOT_COMBUST',
          beneficSupport: false,
          maleficPressure: false,
          dataAvailable: true
        }
      ]);

      const results = interpretCareerPlanetaryConditionBatch(contexts);

      expect(results).toHaveLength(3);
      expect(Object.isFrozen(results)).toBe(true);
    });
  });

  // Group T — no mutation of input
  describe('Group T — no mutation of input', () => {
    it('frozen context is not mutated', () => {
      const context: CareerPlanetaryConditionContext = Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true
      });

      const originalContext = JSON.parse(JSON.stringify(context));

      interpretCareerPlanetaryCondition(context);

      expect(context).toEqual(originalContext);
    });
  });
});
