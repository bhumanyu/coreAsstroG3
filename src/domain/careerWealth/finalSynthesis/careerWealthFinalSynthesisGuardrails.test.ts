import { describe, it, expect } from 'vitest';
import {
  enforceCareerNatalCeiling,
  enforceWealthNatalCeiling,
  enforceWealthDimensionIsolation
} from './finalSynthesisGuardrails';
import type { WealthDimensionFinalSynthesis } from './careerWealthFinalSynthesisTypes';

describe('CW-05 Guardrails', () => {
  describe('enforceCareerNatalCeiling', () => {
    it('caps WEAK and VERY_WEAK natal promise at CHALLENGED', () => {
      expect(enforceCareerNatalCeiling('WEAK', 'VERY_STRONG')).toBe('CHALLENGED');
      expect(enforceCareerNatalCeiling('WEAK', 'STRONG')).toBe('CHALLENGED');
      expect(enforceCareerNatalCeiling('VERY_WEAK', 'MODERATE')).toBe('CHALLENGED');
      expect(enforceCareerNatalCeiling('WEAK', 'MIXED')).toBe('CHALLENGED');
      expect(enforceCareerNatalCeiling('WEAK', 'CHALLENGED')).toBe('CHALLENGED');
    });

    it('caps MODERATE natal promise at MODERATE', () => {
      expect(enforceCareerNatalCeiling('MODERATE', 'VERY_STRONG')).toBe('MODERATE');
      expect(enforceCareerNatalCeiling('MODERATE', 'STRONG')).toBe('MODERATE');
      expect(enforceCareerNatalCeiling('MODERATE', 'MODERATE')).toBe('MODERATE');
      expect(enforceCareerNatalCeiling('MODERATE', 'CHALLENGED')).toBe('CHALLENGED');
    });

    it('allows strong candidates for STRONG / VERY_STRONG natal promise', () => {
      expect(enforceCareerNatalCeiling('VERY_STRONG', 'VERY_STRONG')).toBe('VERY_STRONG');
      expect(enforceCareerNatalCeiling('STRONG', 'STRONG')).toBe('STRONG');
      expect(enforceCareerNatalCeiling('STRONG', 'MODERATE')).toBe('MODERATE');
    });

    it('preserves INSUFFICIENT_DATA when natal is UNDETERMINED', () => {
      expect(enforceCareerNatalCeiling('UNDETERMINED', 'INSUFFICIENT_DATA')).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('enforceWealthNatalCeiling', () => {
    it('caps WEAK natal dimension promise at CHALLENGED', () => {
      expect(enforceWealthNatalCeiling('WEAK', 'STRONG')).toBe('CHALLENGED');
      expect(enforceWealthNatalCeiling('VERY_WEAK', 'VERY_STRONG')).toBe('CHALLENGED');
    });

    it('caps MODERATE natal dimension promise at MODERATE', () => {
      expect(enforceWealthNatalCeiling('MODERATE', 'VERY_STRONG')).toBe('MODERATE');
      expect(enforceWealthNatalCeiling('MODERATE', 'MODERATE')).toBe('MODERATE');
    });
  });

  describe('enforceWealthDimensionIsolation', () => {
    it('prevents leakage and ensures all 4 dimensions are populated and frozen', () => {
      const dimMap: Partial<Record<any, WealthDimensionFinalSynthesis>> = {
        ACCUMULATION: {
          status: 'STRONG',
          finalStatus: 'STRONG',
          promiseStatus: 'STRONG',
          activationStatus: 'SUPPORT',
          timingStatus: 'SUPPORT',
          divisionalStatus: 'CONFIRMS',
          manifestationStatus: 'STRONG',
          confidence: 'HIGH',
          primaryPromise: 'STRONG',
          dashaEffect: 'SUPPORTS',
          timingEffect: 'SUPPORTS',
          divisionalEffect: 'CONFIRMS',
          summary: 'Accumulation is strong.',
          evidenceIds: ['E1']
        },
        SPECULATION: {
          status: 'CHALLENGED',
          finalStatus: 'CHALLENGED',
          promiseStatus: 'CHALLENGED',
          activationStatus: 'SUPPORT',
          timingStatus: 'SUPPORT',
          divisionalStatus: 'CONFIRMS',
          manifestationStatus: 'CHALLENGED',
          confidence: 'MEDIUM',
          primaryPromise: 'WEAK',
          dashaEffect: 'SUPPORTS',
          timingEffect: 'SUPPORTS',
          divisionalEffect: 'CONFIRMS',
          summary: 'Speculation is challenged.',
          evidenceIds: ['E2']
        }
      };

      const result = enforceWealthDimensionIsolation(dimMap);

      expect(result.ACCUMULATION.status).toBe('STRONG');
      expect(result.SPECULATION.status).toBe('CHALLENGED');
      // Unspecified dimensions default to INSUFFICIENT_DATA
      expect(result.GAINS.status).toBe('INSUFFICIENT_DATA');
      expect(result.FORTUNE.status).toBe('INSUFFICIENT_DATA');
      expect(Object.isFrozen(result)).toBe(true);
    });
  });
});
