import { describe, expect, it } from 'vitest';
import {
  applyAssertion,
  applyAssertionMode,
  invertPropositionAlignment
} from './counterReasoningAssertionSemantics';
import type {
  CounterReasoningAssertionMode,
  CounterReasoningAssertionPolarity,
  CounterReasoningPropositionAlignment
} from './counterReasoningTypes';

describe('counterReasoningAssertionSemantics', () => {
  describe('invertPropositionAlignment', () => {
    it('inverts SUPPORTS_PROPOSITION to OPPOSES_PROPOSITION', () => {
      expect(invertPropositionAlignment('SUPPORTS_PROPOSITION')).toBe('OPPOSES_PROPOSITION');
    });

    it('inverts OPPOSES_PROPOSITION to SUPPORTS_PROPOSITION', () => {
      expect(invertPropositionAlignment('OPPOSES_PROPOSITION')).toBe('SUPPORTS_PROPOSITION');
    });

    it('keeps NEUTRAL as NEUTRAL', () => {
      expect(invertPropositionAlignment('NEUTRAL')).toBe('NEUTRAL');
    });
  });

  describe('applyAssertion', () => {
    it('POSITIVE polarity preserves alignment regardless of mode', () => {
      const modes: CounterReasoningAssertionMode[] = ['AFFIRM', 'QUESTION'];
      for (const mode of modes) {
        expect(applyAssertion('SUPPORTS_PROPOSITION', mode, 'POSITIVE')).toBe('SUPPORTS_PROPOSITION');
        expect(applyAssertion('OPPOSES_PROPOSITION', mode, 'POSITIVE')).toBe('OPPOSES_PROPOSITION');
        expect(applyAssertion('NEUTRAL', mode, 'POSITIVE')).toBe('NEUTRAL');
      }
    });

    it('NEGATED polarity inverts alignment across modes', () => {
      expect(applyAssertion('SUPPORTS_PROPOSITION', 'AFFIRM', 'NEGATED')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertion('OPPOSES_PROPOSITION', 'AFFIRM', 'NEGATED')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertion('NEUTRAL', 'AFFIRM', 'NEGATED')).toBe('NEUTRAL');

      // Negated interrogative (e.g. "Isn't my Dasha causing delays?")
      expect(applyAssertion('SUPPORTS_PROPOSITION', 'QUESTION', 'NEGATED')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertion('OPPOSES_PROPOSITION', 'QUESTION', 'NEGATED')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertion('NEUTRAL', 'QUESTION', 'NEGATED')).toBe('NEUTRAL');
    });

    it('QUESTION preserves base alignment (evidence answers the question, does not force NEUTRAL)', () => {
      expect(applyAssertion('SUPPORTS_PROPOSITION', 'QUESTION', 'POSITIVE')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertion('OPPOSES_PROPOSITION', 'QUESTION', 'POSITIVE')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertion('NEUTRAL', 'QUESTION', 'POSITIVE')).toBe('NEUTRAL');
    });
  });

  describe('applyAssertionMode (backward compatibility)', () => {
    it('AFFIRM preserves the base alignment', () => {
      expect(applyAssertionMode('SUPPORTS_PROPOSITION', 'AFFIRM')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertionMode('OPPOSES_PROPOSITION', 'AFFIRM')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertionMode('NEUTRAL', 'AFFIRM')).toBe('NEUTRAL');
    });

    it('DENY inverts the base alignment (legacy equivalent to NEGATED)', () => {
      expect(applyAssertionMode('SUPPORTS_PROPOSITION', 'DENY')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertionMode('OPPOSES_PROPOSITION', 'DENY')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertionMode('NEUTRAL', 'DENY')).toBe('NEUTRAL');
    });

    it('QUESTION preserves base alignment', () => {
      expect(applyAssertionMode('SUPPORTS_PROPOSITION', 'QUESTION')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertionMode('OPPOSES_PROPOSITION', 'QUESTION')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertionMode('NEUTRAL', 'QUESTION')).toBe('NEUTRAL');
    });
  });
});

