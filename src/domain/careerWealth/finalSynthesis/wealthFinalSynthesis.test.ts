import { describe, it, expect } from 'vitest';
import { synthesizeWealthFinal } from './wealthFinalSynthesis';
import type {
  WealthFinalSynthesisInput,
  CareerWealthFinalSynthesis
} from './careerWealthFinalSynthesisTypes';
import type { WealthManifestationSynthesis } from '../../wealth/manifestation/wealthManifestationTypes';
import type { WealthTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';

describe('synthesizeWealthFinal (CW-05)', () => {
  it('enforces dimension isolation: accumulation supported while speculation challenged', () => {
    const mockManifestations: WealthManifestationSynthesis = {
      reasoningVersion: 'CW-04',
      dimensions: {
        ACCUMULATION: {
          reasoningVersion: 'CW-04',
          dimension: 'ACCUMULATION',
          status: 'STRONGLY_SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'SUPPORT',
          d2Support: 'SUPPORT',
          factors: [
            {
              id: 'WM-ACC-1',
              dimension: 'ACCUMULATION',
              direction: 'SUPPORT',
              weight: 2.0,
              source: 'NATAL',
              statement: 'Accumulation supported',
              evidenceIds: ['E-2H']
            }
          ],
          summary: 'Accumulation strongly supported'
        },
        GAINS: {
          reasoningVersion: 'CW-04',
          dimension: 'GAINS',
          status: 'SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'NEUTRAL',
          d2Support: 'SUPPORT',
          factors: [],
          summary: 'Gains supported'
        },
        FORTUNE: {
          reasoningVersion: 'CW-04',
          dimension: 'FORTUNE',
          status: 'SUPPORTED',
          confidence: 'HIGH',
          natalSupport: 'SUPPORT',
          dashaSupport: 'SUPPORT',
          transitSupport: 'NEUTRAL',
          d2Support: 'SUPPORT',
          factors: [],
          summary: 'Fortune supported'
        },
        SPECULATION: {
          reasoningVersion: 'CW-04',
          dimension: 'SPECULATION',
          status: 'CHALLENGED',
          confidence: 'HIGH',
          natalSupport: 'CHALLENGE',
          dashaSupport: 'SUPPORT',
          transitSupport: 'SUPPORT',
          d2Support: 'SUPPORT',
          factors: [
            {
              id: 'WM-SPEC-1',
              dimension: 'SPECULATION',
              direction: 'CHALLENGE',
              weight: 2.0,
              source: 'NATAL',
              statement: 'Speculation afflicted natally',
              evidenceIds: ['E-5H-AFFLICTED']
            }
          ],
          summary: 'Speculation challenged natally'
        }
      },
      summary: 'Mixed wealth manifestation'
    };

    const mockTiming: WealthTimingSynthesis = {
      dimensions: {
        ACCUMULATION: {
          dimension: 'ACCUMULATION',
          natalPromise: 'STRONG',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [
            {
              id: 'WT-ACC-1',
              planet: 'JUPITER' as any,
              category: 'WEALTH_HOUSE_TRANSIT',
              direction: 'SUPPORT',
              weight: 1.5,
              statement: 'Jupiter transit 2nd house',
              dimension: 'ACCUMULATION',
              natalEvidenceIds: ['E-2H-TR']
            }
          ],
          summary: 'Accumulation timing supported'
        },
        GAINS: {
          dimension: 'GAINS',
          natalPromise: 'STRONG',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [],
          summary: 'Gains timing supported'
        },
        FORTUNE: {
          dimension: 'FORTUNE',
          natalPromise: 'STRONG',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [],
          summary: 'Fortune timing supported'
        },
        SPECULATION: {
          dimension: 'SPECULATION',
          natalPromise: 'WEAK',
          overallEffect: 'ACTIVATES',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          confidence: 0.85,
          factors: [
            {
              id: 'WT-SPEC-1',
              planet: 'VENUS' as any,
              category: 'WEALTH_HOUSE_TRANSIT',
              direction: 'SUPPORT',
              weight: 1.0,
              statement: 'Venus transits 5th house',
              dimension: 'SPECULATION',
              natalEvidenceIds: ['E-5H-TR']
            }
          ],
          summary: 'Speculation timing supported'
        }
      },
      overallSummary: 'Timing active across wealth'
    };

    const input: WealthFinalSynthesisInput = {
      natalPromise: {
        ACCUMULATION: 'STRONG',
        GAINS: 'STRONG',
        FORTUNE: 'STRONG',
        SPECULATION: 'WEAK'
      },
      timingSynthesis: mockTiming,
      manifestationSynthesis: mockManifestations,
      d2Relationship: 'CONFIRMS'
    };

    const result: CareerWealthFinalSynthesis = synthesizeWealthFinal(input);

    expect(result.domain).toBe('WEALTH');
    expect(result.reasoningVersion).toBe('CW-05');
    expect(result.dimensions).toBeDefined();

    // Invariant: ACCUMULATION is STRONG
    expect(result.dimensions!.ACCUMULATION.status).toBe('STRONG');
    // Invariant: SPECULATION is CHALLENGED due to natal ceiling and dimension isolation
    expect(result.dimensions!.SPECULATION.status).toBe('CHALLENGED');
    // Invariant: Risk profile is ELEVATED / HIGH because speculation is challenged despite strong accumulation
    expect(result.riskProfile).toBe('ELEVATED');

    expect(result.strongestAreas).toContain('ACCUMULATION');
    expect(result.challengedAreas).toContain('SPECULATION');

    expect(result.ruleIds).toContain('CW-05-WEALTH-SYNTHESIS');
    expect(result.ruleIds).toContain('WM-ACC-1');
    expect(result.ruleIds).toContain('WM-SPEC-1');
    expect(result.ruleIds).toContain('WT-ACC-1');
    expect(result.ruleIds).toContain('WT-SPEC-1');

    expect(result.evidenceIds).toContain('E-2H');
    expect(result.evidenceIds).toContain('E-5H-AFFLICTED');
    expect(result.evidenceIds).toContain('E-2H-TR');
    expect(result.evidenceIds).toContain('E-5H-TR');
  });

  it('correctly handles INSUFFICIENT_DATA across dimensions without defaulting to challenged', () => {
    const input: WealthFinalSynthesisInput = {
      natalPromise: {},
      d2Relationship: 'UNAVAILABLE'
    };

    const result = synthesizeWealthFinal(input);

    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.riskProfile).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions!.ACCUMULATION.status).toBe('INSUFFICIENT_DATA');
    expect(result.dimensions!.SPECULATION.status).toBe('INSUFFICIENT_DATA');
  });

  it('produces frozen immutable output', () => {
    const input: WealthFinalSynthesisInput = {
      natalPromise: { ACCUMULATION: 'STRONG' },
      d2Relationship: 'CONFIRMS'
    };

    const result = synthesizeWealthFinal(input);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dimensions)).toBe(true);
    expect(Object.isFrozen(result.manifestationSummary)).toBe(true);
    expect(Object.isFrozen(result.strongestAreas)).toBe(true);
    expect(Object.isFrozen(result.ruleIds)).toBe(true);
    expect(Object.isFrozen(result.evidenceIds)).toBe(true);
  });
});
