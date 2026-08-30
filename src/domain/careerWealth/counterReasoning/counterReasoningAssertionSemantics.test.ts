import { describe, expect, it } from 'vitest';
import {
  applyAssertionMode,
  invertPropositionAlignment
} from './counterReasoningAssertionSemantics';
import type {
  CounterReasoningAssertionMode,
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

  describe('applyAssertionMode', () => {
    it('AFFIRM preserves the base alignment', () => {
      expect(applyAssertionMode('SUPPORTS_PROPOSITION', 'AFFIRM')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertionMode('OPPOSES_PROPOSITION', 'AFFIRM')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertionMode('NEUTRAL', 'AFFIRM')).toBe('NEUTRAL');
    });

    it('DENY inverts the base alignment', () => {
      expect(applyAssertionMode('SUPPORTS_PROPOSITION', 'DENY')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertionMode('OPPOSES_PROPOSITION', 'DENY')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertionMode('NEUTRAL', 'DENY')).toBe('NEUTRAL');
    });

    it('QUESTION preserves base alignment (evidence may still answer the question, does not force NEUTRAL)', () => {
      expect(applyAssertionMode('SUPPORTS_PROPOSITION', 'QUESTION')).toBe('SUPPORTS_PROPOSITION');
      expect(applyAssertionMode('OPPOSES_PROPOSITION', 'QUESTION')).toBe('OPPOSES_PROPOSITION');
      expect(applyAssertionMode('NEUTRAL', 'QUESTION')).toBe('NEUTRAL');
    });

    it('defaults unknown modes to NEUTRAL', () => {
      expect(
        applyAssertionMode('SUPPORTS_PROPOSITION', 'INVALID_MODE' as CounterReasoningAssertionMode)
      ).toBe('NEUTRAL');
    });
  });
});
