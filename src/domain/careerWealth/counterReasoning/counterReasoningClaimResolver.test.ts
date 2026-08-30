import { describe, expect, it } from 'vitest';
import {
  resolveAssertionMode,
  resolveAssertionPolarity,
  resolveAssertionModeAndPolarity,
  resolveClaim
} from './counterReasoningClaimResolver';

describe('counterReasoningClaimResolver (CW-07B)', () => {
  describe('resolveAssertionModeAndPolarity', () => {
    it('negated-question cases resolve to QUESTION + NEGATED', () => {
      const questions = [
        "Isn't my Dasha causing delays?",
        "Doesn't Saturn cause obstacles?",
        "Won't this period cause loss?",
        "Can't this Dasha produce promotion?"
      ];

      for (const q of questions) {
        const { assertionMode, assertionPolarity } = resolveAssertionModeAndPolarity(q);
        expect(assertionMode).toBe('QUESTION');
        expect(assertionPolarity).toBe('NEGATED');
      }
    });

    it('positive-question control resolves to QUESTION + POSITIVE', () => {
      const q1 = resolveAssertionModeAndPolarity('Is my Dasha causing delays?');
      expect(q1.assertionMode).toBe('QUESTION');
      expect(q1.assertionPolarity).toBe('POSITIVE');

      const q2 = resolveAssertionModeAndPolarity('Does Jupiter support my wealth');
      expect(q2.assertionMode).toBe('QUESTION');
      expect(q2.assertionPolarity).toBe('POSITIVE');
    });

    it('declarative assertions resolve to AFFIRM with appropriate polarity', () => {
      const affirmPos = resolveAssertionModeAndPolarity('My Dasha causes delays.');
      expect(affirmPos.assertionMode).toBe('AFFIRM');
      expect(affirmPos.assertionPolarity).toBe('POSITIVE');

      const affirmNeg = resolveAssertionModeAndPolarity('My Dasha does not cause delays.');
      expect(affirmNeg.assertionMode).toBe('AFFIRM');
      expect(affirmNeg.assertionPolarity).toBe('NEGATED');
    });

    it('interrogative-with-not stays QUESTION with NEGATED polarity', () => {
      const res = resolveAssertionModeAndPolarity('Why is my career not stable?');
      expect(res.assertionMode).toBe('QUESTION');
      expect(res.assertionPolarity).toBe('NEGATED');
    });

    it('handles whitespace and case normalization properly', () => {
      const wsNeg = resolveAssertionModeAndPolarity('  My Dasha does not cause delays.  ');
      expect(wsNeg.assertionMode).toBe('AFFIRM');
      expect(wsNeg.assertionPolarity).toBe('NEGATED');

      const wsQ = resolveAssertionModeAndPolarity('  IS MY DASHA CAUSING DELAYS? ');
      expect(wsQ.assertionMode).toBe('QUESTION');
      expect(wsQ.assertionPolarity).toBe('POSITIVE');
    });

    it('handles punctuation without question mark properly', () => {
      const exclNeg = resolveAssertionModeAndPolarity('My Dasha does not cause delays!');
      expect(exclNeg.assertionMode).toBe('AFFIRM');
      expect(exclNeg.assertionPolarity).toBe('NEGATED');

      const exclPos = resolveAssertionModeAndPolarity('My Dasha causes delays!');
      expect(exclPos.assertionMode).toBe('AFFIRM');
      expect(exclPos.assertionPolarity).toBe('POSITIVE');
    });

    it('asserts documented deterministic lexical boundaries (known limitations pinned)', () => {
      // Known lexical boundary 1: compound proposition contains "not" in one clause
      // Pure regex classifies the entire string as NEGATED
      const compound = resolveAssertionModeAndPolarity('My career is not stable but I am getting promotion.');
      expect(compound.assertionMode).toBe('AFFIRM');
      expect(compound.assertionPolarity).toBe('NEGATED');

      // Known lexical boundary 2: embedded belief negation "don't think"
      // Pure regex sees "don't" and classifies as NEGATED
      const embedded = resolveAssertionModeAndPolarity("I don't think my career is weak.");
      expect(embedded.assertionMode).toBe('AFFIRM');
      expect(embedded.assertionPolarity).toBe('NEGATED');
    });
  });

  describe('resolveClaim', () => {
    it('populates assertionPolarity and assertionMode on claim', () => {
      const claim = resolveClaim({
        domain: 'CAREER',
        question: "Isn't my Dasha causing delays?"
      });

      expect(claim.assertionMode).toBe('QUESTION');
      expect(claim.assertionPolarity).toBe('NEGATED');
      expect(claim.assertedOutcome).toBe('DELAY');
      expect(claim.targetSubjectKey).toBe('DASHA_ACTIVATION');
    });
  });
});
