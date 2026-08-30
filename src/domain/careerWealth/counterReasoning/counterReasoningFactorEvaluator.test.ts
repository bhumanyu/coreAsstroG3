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

describe('counterReasoningFactorEvaluator (CW-07 / CW-07B)', () => {
  const positiveClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Why is career strong?',
    questionType: 'WHY',
    targetSubjectKey: 'FINAL_SYNTHESIS',
    polarity: 'NEUTRAL',
    assertedPolarity: 'NEUTRAL',
    assertedOutcome: 'SUPPORT',
    assertionMode: 'QUESTION',
    assertionPolarity: 'POSITIVE'
  };

  const manifestationClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'How will career manifest?',
    questionType: 'MANIFESTATION_CHALLENGE',
    targetSubjectKey: 'CAREER_MANIFESTATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'MANIFESTATION',
    assertionMode: 'QUESTION',
    assertionPolarity: 'POSITIVE'
  };

  const delayClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Is my current Dasha causing delays?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'DELAY',
    assertionMode: 'QUESTION',
    assertionPolarity: 'POSITIVE'
  };

  const lossClaim: CounterReasoningClaim = {
    domain: 'WEALTH',
    question: 'Will this period cause wealth loss?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'LOSS',
    assertionMode: 'QUESTION',
    assertionPolarity: 'POSITIVE'
  };

  const unknownOutcomeClaim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'What about career?',
    questionType: 'UNKNOWN',
    targetSubjectKey: 'FINAL_SYNTHESIS',
    polarity: 'NEUTRAL',
    assertedPolarity: 'NEUTRAL',
    assertedOutcome: 'UNKNOWN',
    assertionMode: 'QUESTION',
    assertionPolarity: 'POSITIVE'
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

    it('deprecated evaluateFactor alias works identically to evaluateFactorRelation', () => {
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

    it('returns NEUTRAL when edgeType is ACTIVATES', () => {
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

    it('returns NEUTRAL for MANIFESTS with both generic and MANIFESTATION outcomes', () => {
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

  describe('evaluatePropositionFactor with Outcome Matching and Assertion Mode', () => {
    it('ACTIVATES does not prove DELAY => propositionAlignment: NEUTRAL', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_DASHA_RAHU',
        edgeType: 'ACTIVATES',
        explanation: 'Rahu dasha activates career axis',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, delayClaim);
      expect(result.edgeSemantic).toBe('ACTIVATION');
      expect(result.propositionAlignment).toBe('NEUTRAL');
      expect(result.outcomeMatch).toBe('UNSPECIFIED');
      expect(result.reason).toContain('does not establish the asserted outcome');
    });

    it('SUPPORTS + positive proposition => propositionAlignment: SUPPORTS_PROPOSITION', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_10TH_EXALTED',
        edgeType: 'SUPPORTS',
        explanation: '10th lord exalted in Kendra',
        relation: 'SUPPORT'
      };

      const result = evaluatePropositionFactor(factor, positiveClaim);
      expect(result.edgeSemantic).toBe('SUPPORT');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(result.outcomeMatch).toBe('UNSPECIFIED');
      expect(result.relation).toBe('SUPPORT');
    });

    it('CONFIRMS + positive proposition => propositionAlignment: SUPPORTS_PROPOSITION', () => {
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

    it('EXACT outcome match evaluates proposition directly', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_SATURN_DELAY',
        edgeType: 'CHALLENGES',
        explanation: 'Saturn delay pattern',
        relation: 'CHALLENGE',
        outcomeSemantics: ['DELAY']
      };

      const result = evaluatePropositionFactor(factor, delayClaim);
      expect(result.outcomeMatch).toBe('EXACT');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(result.reason).toBe('Factor explicitly matches the asserted outcome.');
    });

    it('ABSENT outcome match yields NEUTRAL even if relation is CHALLENGE', () => {
      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_LOSS_FACTOR',
        edgeType: 'CHALLENGES',
        explanation: 'Creates loss',
        relation: 'CHALLENGE',
        outcomeSemantics: ['LOSS']
      };

      // Claim is asking about DELAY, but factor is about LOSS
      const result = evaluatePropositionFactor(factor, delayClaim);
      expect(result.outcomeMatch).toBe('ABSENT');
      expect(result.propositionAlignment).toBe('NEUTRAL');
      expect(result.reason).toBe('Factor has explicit outcome semantics, but not the asserted outcome.');
    });

    it('DENY assertion mode inverts proposition alignment', () => {
      const denyDelayClaim: CounterReasoningClaim = {
        ...delayClaim,
        question: 'My Dasha does not cause delays.',
        assertionMode: 'DENY',
        assertionPolarity: 'NEGATED'
      };

      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_SATURN_DELAY',
        edgeType: 'CHALLENGES',
        explanation: 'Saturn delay pattern',
        relation: 'CHALLENGE',
        outcomeSemantics: ['DELAY']
      };

      // When the factor supports DELAY, but user DENIES delay ("does not cause delays"),
      // the factor OPPOSES the user's denial proposition!
      const result = evaluatePropositionFactor(factor, denyDelayClaim);
      expect(result.outcomeMatch).toBe('EXACT');
      expect(result.propositionAlignment).toBe('OPPOSES_PROPOSITION');
    });

    it('DENY + ABSENT stays NEUTRAL (never flips to SUPPORTS_PROPOSITION)', () => {
      const denyDelayClaim: CounterReasoningClaim = {
        ...delayClaim,
        question: 'My Dasha does not cause delays.',
        assertionMode: 'DENY',
        assertionPolarity: 'NEGATED'
      };

      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_LOSS_FACTOR',
        edgeType: 'CHALLENGES',
        explanation: 'Creates loss',
        relation: 'CHALLENGE',
        outcomeSemantics: ['LOSS']
      };

      const result = evaluatePropositionFactor(factor, denyDelayClaim);
      expect(result.outcomeMatch).toBe('ABSENT');
      expect(result.propositionAlignment).toBe('NEUTRAL');
      expect(result.reason).toBe('Factor has explicit outcome semantics, but not the asserted outcome.');
    });

    it('AFFIRM assertion mode preserves base alignment', () => {
      const affirmDelayClaim: CounterReasoningClaim = {
        ...delayClaim,
        question: 'My Dasha causes delays.',
        assertionMode: 'AFFIRM',
        assertionPolarity: 'POSITIVE'
      };

      const factor: CounterReasoningFactor = {
        evidenceId: 'EV_SATURN_DELAY',
        edgeType: 'CHALLENGES',
        explanation: 'Saturn delay pattern',
        relation: 'CHALLENGE',
        outcomeSemantics: ['DELAY']
      };

      const result = evaluatePropositionFactor(factor, affirmDelayClaim);
      expect(result.outcomeMatch).toBe('EXACT');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
    });

    it('Legacy CW-07A generic factors remain operational when outcome metadata is absent.', () => {
      const legacyFactor: CounterReasoningFactor = {
        evidenceId: 'EV_GENERIC_CHALLENGE',
        edgeType: 'CHALLENGES',
        explanation: 'Generic planetary challenge',
        relation: 'CHALLENGE',
        outcomeSemantics: undefined
      };

      const result = evaluatePropositionFactor(legacyFactor, delayClaim);
      expect(result.outcomeMatch).toBe('UNSPECIFIED');
      expect(result.propositionAlignment).toBe('SUPPORTS_PROPOSITION');
    });
  });

  describe('Semantic Truth-Table Test Suite', () => {
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
          assertedOutcome,
          assertionMode: 'QUESTION',
          assertionPolarity: 'POSITIVE'
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

