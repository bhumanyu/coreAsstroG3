import { describe, expect, it } from 'vitest';
import {
  evaluateFactor,
  evaluateFactorRelation,
  evaluatePropositionFactor
} from './counterReasoningFactorEvaluator';
import type {
  CounterReasoningClaim,
  CounterReasoningFactor,
  CounterReasoningOutcome,
  CounterReasoningPropositionAlignment
} from './counterReasoningTypes';
import type { ReasoningEdgeType } from '../reasoningTrace/reasoningEdge';

describe('counterReasoningFactorEvaluator (CW-07)', () => {
  const positiveClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Why is career strong?',
    questionType: 'WHY',
    targetSubjectKey: 'FINAL_SYNTHESIS',
    polarity: 'NEUTRAL',
    assertedPolarity: 'NEUTRAL',
    assertedOutcome: 'SUPPORT'
  };

  const manifestationClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'How will career manifest?',
    questionType: 'MANIFESTATION_CHALLENGE',
    targetSubjectKey: 'CAREER_MANIFESTATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'MANIFESTATION'
  };

  const delayClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Is my current Dasha causing delays?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'DELAY'
  };

  const lossClaim: CounterReasoningClaim = {
    domain: 'WEALTH',
    question: 'Will this period cause wealth loss?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'LOSS'
  };

  const unknownOutcomeClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'What about career?',
    questionType: 'UNKNOWN',
    targetSubjectKey: 'FINAL_SYNTHESIS',
    polarity: 'NEUTRAL',
    assertedPolarity: 'NEUTRAL',
    assertedOutcome: 'UNKNOWN'
  };

  describe('evaluateFactorRelation (Raw Domain Relation)', () => {
    it('returns ALIGNS for SUPPORT relation with positive outcome', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_1',
        edgeType: 'SUPPORTS',
        explanation: '10th lord exalted',
        relation: 'SUPPORT'
      };

      const result = evaluateFactorRelation(factor, positiveClaim);
      expect(result.alignment).toBe('ALIGNS');
      expect(result.evidenceId).toBe('EV_1');
    });

    it('deprecated evaluateFactor alias works identically to evaluateFactorRelation (Issue #4)', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_1',
        edgeType: 'SUPPORTS',
        explanation: '10th lord exalted',
        relation: 'SUPPORT'
      };

      const result = evaluateFactor(factor, positiveClaim);
      expect(result.alignment).toBe('ALIGNS');
    });

    it('returns OPPOSES for CHALLENGE relation with positive outcome', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_2',
        edgeType: 'CHALLENGES',
        explanation: 'Saturn aspect on 10th house',
        relation: 'CHALLENGE'
      };

      const result = evaluateFactorRelation(factor, positiveClaim);
      expect(result.alignment).toBe('OPPOSES');
    });

    it('returns NEUTRAL when edgeType is ACTIVATES (Spec Test 22 principle)', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_RAHU',
        edgeType: 'ACTIVATES',
        explanation: 'Rahu Dasha activates 10th house',
        relation: 'SUPPORT'
      };

      const result = evaluateFactorRelation(factor, delayClaim);
      expect(result.alignment).toBe('NEUTRAL');
      expect(result.reason).toContain('does not establish the asserted outcome');
    });

    it('returns NEUTRAL when edgeType is MODIFIES', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_MOD',
        edgeType: 'MODIFIES',
        explanation: 'Modifies career manifestation',
        relation: 'SUPPORT'
      };

      const result = evaluateFactorRelation(factor, positiveClaim);
      expect(result.alignment).toBe('NEUTRAL');
    });

    it('returns NEUTRAL for MANIFESTS with both generic and MANIFESTATION outcomes (Issue #6)', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_MAN',
        edgeType: 'MANIFESTS',
        explanation: 'Manifests industry role',
        relation: 'SUPPORT'
      };

      const genericRes = evaluateFactorRelation(factor, positiveClaim);
      expect(genericRes.alignment).toBe('NEUTRAL');

      const manifestRes = evaluateFactorRelation(factor, manifestationClaim);
      expect(manifestRes.alignment).toBe('NEUTRAL');
    });

    it('returns NEUTRAL when assertedOutcome is UNKNOWN or undefined', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_1',
        edgeType: 'SUPPORTS',
        explanation: 'Supports chart',
        relation: 'SUPPORT'
      };

      const result = evaluateFactorRelation(factor, unknownOutcomeClaim);
      expect(result.alignment).toBe('NEUTRAL');
      expect(result.reason).toContain('No specific outcome asserted');
    });
  });

  describe('evaluatePropositionFactor (Spec Sections 14-15 & Polarity-Aware Golden Rules)', () => {
    it('Spec Test 22: ACTIVATES does not prove DELAY => propositionAlignment: NEUTRAL', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_DASHA_RAHU',
        edgeType: 'ACTIVATES',
        explanation: 'Rahu dasha activates career axis',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, delayClaim);
      expect(result.edgeSemantic).toBe('ACTIVATION');
      expect(result.propositionAlignment).toBe('NEUTRAL');
      expect(result.reason).toContain('This relationship alone does not establish the asserted outcome');
    });

    it('Spec Test 23: SUPPORTS + positive proposition => propositionAlignment: SUPPORTS_PROPOSITION', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_10TH_EXALTED',
        edgeType: 'SUPPORTS',
        explanation: '10th lord exalted in Kendra',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, positiveClaim);
      expect(result.edgeSemantic).toBe('SUPPORT');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(result.relation).toBe('SUPPORT');
    });

    it('Concern #15: CONFIRMS + positive proposition => propositionAlignment: SUPPORTS_PROPOSITION (first-class positive)', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_D10_CONFIRM',
        edgeType: 'CONFIRMS',
        explanation: 'D10 confirms career leadership pattern',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, positiveClaim);
      expect(result.edgeSemantic).toBe('CONFIRMATION');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(result.relation).toBe('SUPPORT');
    });

    it('Issue #6 Contract: MANIFESTS + generic SUPPORT outcome -> NEUTRAL', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_CAREER_ROLE',
        edgeType: 'MANIFESTS',
        explanation: 'Manifests management role',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, positiveClaim);
      expect(result.edgeSemantic).toBe('NEUTRAL');
      expect(result.propositionAlignment).toBe('NEUTRAL');
      expect(result.reason).toContain('does not establish the asserted outcome');
    });

    it('Issue #6 Contract: MANIFESTS + assertedOutcome=MANIFESTATION -> NEUTRAL (outcome-specific MANIFESTS handling deferred to CW-07B)', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_CAREER_ROLE',
        edgeType: 'MANIFESTS',
        explanation: 'Manifests management role',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, manifestationClaim);
      expect(result.edgeSemantic).toBe('NEUTRAL');
      expect(result.propositionAlignment).toBe('NEUTRAL');
      expect(result.reason).toContain('does not establish the asserted outcome');
    });

    it('Spec Test 24: CHALLENGES + positive proposition => propositionAlignment: OPPOSES_PROPOSITION', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_SATURN_AFFLICTION',
        edgeType: 'CHALLENGES',
        explanation: 'Saturn creates friction',
        relation: 'CHALLENGE'
      };

      const result = evaluatePropositionFactor(factor, positiveClaim);
      expect(result.edgeSemantic).toBe('CHALLENGE');
      expect(result.propositionAlignment).toBe('OPPOSES_PROPOSITION');
      expect(result.relation).toBe('CHALLENGE');
    });

    it('Negative-polarity proposition (DELAY): CHALLENGES edge SUPPORTS the delay proposition', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_SATURN_DELAY',
        edgeType: 'CHALLENGES',
        explanation: 'Saturn transit slows career momentum',
        relation: 'CHALLENGE'
      };

      const result = evaluatePropositionFactor(factor, delayClaim);
      expect(result.edgeSemantic).toBe('CHALLENGE');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(result.reason).toContain('supports the negative proposition');
    });

    it('Negative-polarity proposition (DELAY): SUPPORTS edge OPPOSES the delay proposition', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_JUPITER_SUPPORT',
        edgeType: 'SUPPORTS',
        explanation: 'Jupiter trine promotes smooth progress',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, delayClaim);
      expect(result.edgeSemantic).toBe('SUPPORT');
      expect(result.propositionAlignment).toBe('OPPOSES_PROPOSITION');
      expect(result.reason).toContain('opposes the negative proposition');
    });

    it('Negative-polarity proposition (LOSS): ACTIVATES edge returns NEUTRAL', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_VENUS_ACTIVE',
        edgeType: 'ACTIVATES',
        explanation: 'Venus dasha activates 2nd house',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, lossClaim);
      expect(result.edgeSemantic).toBe('ACTIVATION');
      expect(result.propositionAlignment).toBe('NEUTRAL');
    });

    it('Returns NEUTRAL for UNKNOWN outcome or missing assertedOutcome', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_TEST',
        edgeType: 'SUPPORTS',
        explanation: 'Some support',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, unknownOutcomeClaim);
      expect(result.propositionAlignment).toBe('NEUTRAL');
    });

    it('CW-07A treats all NEGATIVE outcomes as one coarse class (outcome-specificity deferred to CW-07B)', () => {
      const negativeOutcomes: CounterReasoningOutcome[] = ['LOSS', 'OBSTACLE', 'DELAY', 'VOLATILITY'];

      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_GENERIC_CHALLENGE',
        edgeType: 'CHALLENGES',
        explanation: 'Generic chart friction factor',
        relation: 'CHALLENGE'
      };

      negativeOutcomes.forEach((outcome) => {
        const claim: CounterReasoningClaim = {
          domain: 'CAREER',
          question: `Will this cause ${outcome}?`,
          questionType: 'WHY',
          targetSubjectKey: 'CAREER_OUTCOME',
          polarity: 'CHALLENGE',
          assertedPolarity: 'CHALLENGE',
          assertedOutcome: outcome
        };

        const result = evaluatePropositionFactor(factor, claim);
        expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
        expect(result.edgeSemantic).toBe('CHALLENGE');
      });
    });
  });

  describe('Semantic Truth-Table Test Suite (CW-07A Issue #15)', () => {
    interface TruthTableRow {
      readonly edgeType: ReasoningEdgeType;
      readonly assertedOutcome: CounterReasoningOutcome;
      readonly relation: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
      readonly expected: CounterReasoningPropositionAlignment;
    }

    const truthTable: readonly TruthTableRow[] = [
      { edgeType: 'SUPPORTS', assertedOutcome: 'SUPPORT', relation: 'SUPPORT', expected: 'SUPPORTS_PROPOSITION' },
      { edgeType: 'CHALLENGES', assertedOutcome: 'SUPPORT', relation: 'CHALLENGE', expected: 'OPPOSES_PROPOSITION' },
      { edgeType: 'SUPPORTS', assertedOutcome: 'DELAY', relation: 'SUPPORT', expected: 'OPPOSES_PROPOSITION' },
      { edgeType: 'CHALLENGES', assertedOutcome: 'DELAY', relation: 'CHALLENGE', expected: 'SUPPORTS_PROPOSITION' },
      { edgeType: 'ACTIVATES', assertedOutcome: 'DELAY', relation: 'SUPPORT', expected: 'NEUTRAL' },
      { edgeType: 'ACTIVATES', assertedOutcome: 'LOSS', relation: 'SUPPORT', expected: 'NEUTRAL' },
      { edgeType: 'MODIFIES', assertedOutcome: 'LOSS', relation: 'SUPPORT', expected: 'NEUTRAL' },
      { edgeType: 'CONFIRMS', assertedOutcome: 'SUPPORT', relation: 'SUPPORT', expected: 'SUPPORTS_PROPOSITION' },
      { edgeType: 'MANIFESTS', assertedOutcome: 'MANIFESTATION', relation: 'SUPPORT', expected: 'NEUTRAL' }
    ];

    truthTable.forEach(({ edgeType, assertedOutcome, relation, expected }) => {
      it(`evaluates ${edgeType} + ${assertedOutcome} => ${expected}`, () => {
        const claim: CounterReasoningClaim = {
          domain: 'CAREER',
          question: `Test question for ${assertedOutcome}`,
          questionType: 'WHY',
          targetSubjectKey: 'TEST_TARGET',
          polarity: 'NEUTRAL',
          assertedPolarity: 'NEUTRAL',
          assertedOutcome
        };

        const factor: CounterReasoningFactor = {
          evidenceId: `EV_TRUTH_${edgeType}_${assertedOutcome}`,
          edgeType,
          explanation: `Truth table factor for ${edgeType}`,
          relation
        };

        const result = evaluatePropositionFactor(factor, claim);
        expect(result.propositionAlignment).toBe(expected);
      });
    });
  });
});
