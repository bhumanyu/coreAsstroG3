import { describe, expect, it } from 'vitest';
import { evaluateCounterArgument } from './counterArgumentEvaluator';
import type { CounterReasoningClaim, CounterReasoningFactor } from './counterReasoningTypes';

describe('counterArgumentEvaluator (CW-07)', () => {
  const neutralClaim: CounterReasoningClaim = {
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

  describe('Spec Section 25 Matrix Evaluation', () => {
    it('SUPPORTS-only => CONFIRMED for positive claim', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_1',
          edgeType: 'SUPPORTS',
          explanation: '10th lord strong',
          relation: 'SUPPORT'
        },
        {
          evidenceId: 'EV_2',
          edgeType: 'SUPPORTS',
          explanation: 'Jupiter aspect',
          relation: 'SUPPORT'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: ['EV_1', 'EV_2'],
        challengingEvidenceIds: [],
        factors,
        claim: neutralClaim
      });

      expect(res.disposition).toBe('CONFIRMED');
      expect(res.evaluatedFactors.length).toBe(2);
      expect(res.rebuttal).toContain('confirm FINAL_SYNTHESIS');
    });

    it('CHALLENGES-only => REJECTED for positive claim', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_2',
          edgeType: 'CHALLENGES',
          explanation: 'Saturn debility',
          relation: 'CHALLENGE'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: [],
        challengingEvidenceIds: ['EV_2'],
        factors,
        claim: neutralClaim
      });

      expect(res.disposition).toBe('REJECTED');
      expect(res.evaluatedFactors[0].propositionAlignment).toBe('OPPOSES_PROPOSITION');
      expect(res.rebuttal).toContain('No supportive astrological evidence was found');
    });

    it('both SUPPORTS and CHALLENGES => PARTIALLY_CONFIRMED for positive claim', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_1',
          edgeType: 'SUPPORTS',
          explanation: '10th lord exalted',
          relation: 'SUPPORT'
        },
        {
          evidenceId: 'EV_2',
          edgeType: 'CHALLENGES',
          explanation: 'Rahu affliction',
          relation: 'CHALLENGE'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: ['EV_1'],
        challengingEvidenceIds: ['EV_2'],
        factors,
        claim: neutralClaim
      });

      expect(res.disposition).toBe('PARTIALLY_CONFIRMED');
      expect(res.rebuttal).toContain('present active qualification or friction');
    });

    it('ACTIVATES-only => INSUFFICIENT_EVIDENCE for positive claim', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_DASHA_1',
          edgeType: 'ACTIVATES',
          explanation: 'Dasha activation',
          relation: 'SUPPORT'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: ['EV_DASHA_1'],
        challengingEvidenceIds: [],
        factors,
        claim: neutralClaim
      });

      expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
      expect(res.evaluatedFactors[0].propositionAlignment).toBe('NEUTRAL');
      expect(res.rebuttal).toContain('No direct confirming or opposing astrological factors were identified');
    });

    it('evaluates to INSUFFICIENT_EVIDENCE when neither supporting nor challenging evidence exists (empty factors)', () => {
      const res = evaluateCounterArgument({
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        factors: [],
        claim: neutralClaim
      });

      expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
      expect(res.evaluatedFactors).toEqual([]);
      expect(res.rebuttal).toContain('No direct astrological evidence was identified');
    });
  });

  describe('Negative-polarity (DELAY) claim evaluation', () => {
    it('ACTIVATES-only on DELAY assertion => INSUFFICIENT_EVIDENCE (ACTIVATES does not prove delays)', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_DASHA_1',
          edgeType: 'ACTIVATES',
          explanation: 'Dasha is active',
          relation: 'SUPPORT'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: ['EV_DASHA_1'],
        challengingEvidenceIds: [],
        factors,
        claim: delayClaim
      });

      expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
      expect(res.evaluatedFactors[0].propositionAlignment).toBe('NEUTRAL');
      expect(res.rebuttal).toContain('No direct confirming or opposing astrological factors');
    });

    it('CHALLENGES edges on DELAY assertion => CONFIRMED', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_DASHA_CHALLENGE_1',
          edgeType: 'CHALLENGES',
          explanation: 'Saturn transit retards career progress',
          relation: 'CHALLENGE'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: [],
        challengingEvidenceIds: ['EV_DASHA_CHALLENGE_1'],
        factors,
        claim: delayClaim
      });

      expect(res.disposition).toBe('CONFIRMED');
      expect(res.evaluatedFactors[0].propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(res.rebuttal).toContain('confirm DASHA_ACTIVATION');
    });

    it('mixed SUPPORTS and CHALLENGES on DELAY assertion => PARTIALLY_CONFIRMED', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_DASHA_1',
          edgeType: 'SUPPORTS',
          explanation: 'Benefic aspect',
          relation: 'SUPPORT'
        },
        {
          evidenceId: 'EV_DASHA_CHALLENGE_1',
          edgeType: 'CHALLENGES',
          explanation: 'Malefic aspect',
          relation: 'CHALLENGE'
        }
      ];

      const res = evaluateCounterArgument({
        supportingEvidenceIds: ['EV_DASHA_1'],
        challengingEvidenceIds: ['EV_DASHA_CHALLENGE_1'],
        factors,
        claim: delayClaim
      });

      expect(res.disposition).toBe('PARTIALLY_CONFIRMED');
      expect(res.rebuttal).toContain('present active qualification or friction');
    });

    it('works with only { claim, factors } without deprecated evidence arrays (Issue #3)', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_1',
          edgeType: 'SUPPORTS',
          explanation: '10th lord strong',
          relation: 'SUPPORT'
        }
      ];

      const res = evaluateCounterArgument({
        claim: neutralClaim,
        factors
      });

      expect(res.disposition).toBe('CONFIRMED');
      expect(res.evaluatedFactors.length).toBe(1);
      expect(res.rebuttal).toContain('confirm FINAL_SYNTHESIS');
    });

    it('ignores deprecated supportingEvidenceIds and challengingEvidenceIds when factors is empty', () => {
      const res = evaluateCounterArgument({
        claim: neutralClaim,
        factors: [],
        supportingEvidenceIds: ['EV_1'],
        challengingEvidenceIds: []
      });

      expect(res.disposition).toBe('INSUFFICIENT_EVIDENCE');
      expect(res.evaluatedFactors).toEqual([]);
    });

    it('handles CONTRADICTS edge against positive claim: OPPOSES_PROPOSITION and REJECTED disposition', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_CONTRADICT_1',
          edgeType: 'CONTRADICTS',
          explanation: 'Chart feature contradicts positive manifestation',
          relation: 'CHALLENGE'
        }
      ];

      const res = evaluateCounterArgument({
        claim: neutralClaim,
        factors
      });

      expect(res.disposition).toBe('REJECTED');
      expect(res.evaluatedFactors[0].propositionAlignment).toBe('OPPOSES_PROPOSITION');
      expect(res.evaluatedFactors[0].edgeSemantic).toBe('CHALLENGE');
    });

    it('handles CONTRADICTS edge against DELAY claim: SUPPORTS_PROPOSITION and CONFIRMED disposition', () => {
      const factors: CounterReasoningFactor[] = [
        {
          evidenceId: 'EV_CONTRADICT_1',
          edgeType: 'CONTRADICTS',
          explanation: 'Chart feature contradicts smooth timing, creating friction',
          relation: 'CHALLENGE'
        }
      ];

      const res = evaluateCounterArgument({
        claim: delayClaim,
        factors
      });

      expect(res.disposition).toBe('CONFIRMED');
      expect(res.evaluatedFactors[0].propositionAlignment).toBe('SUPPORTS_PROPOSITION');
      expect(res.evaluatedFactors[0].edgeSemantic).toBe('CHALLENGE');
    });
  });
});
