import { describe, it, expect } from 'vitest';
import {
  resolveWealthDimensionManifestation,
  synthesizeWealthManifestations
} from './wealthManifestationSynthesis';
import { createDomainEvidence, type DomainEvidence } from '../../interpretation';
import type { WealthTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import { Planet } from '../../../types';

describe('wealthManifestationSynthesis (CW-04B)', () => {
  const createMockNatalEvidence = (
    rules: string[],
    dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION',
    polarity: 'SUPPORTING' | 'CHALLENGING' = 'SUPPORTING'
  ): DomainEvidence[] => {
    return rules.map((ruleId, idx) =>
      createDomainEvidence({
        id: `EV_W_${ruleId}_${idx}`,
        sourceType: 'HOUSE',
        ruleId,
        domain: 'WEALTH',
        dimension,
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: `Rule ${ruleId} statement`,
        strength: 'STRONG',
        polarity
      })
    );
  };

  it('returns INSUFFICIENT_DATA when natal evidence for dimension is missing', () => {
    const result = resolveWealthDimensionManifestation('SPECULATION', []);
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.confidence).toBe('LOW');
    expect(result.factors).toEqual([]);
  });

  it('strictly isolates SPECULATION from ACCUMULATION and GAINS', () => {
    // Chart has strong 2nd house accumulation evidence and 11th house gains evidence, but NO 5th house speculation evidence
    const accumulationEvidence = createMockNatalEvidence(['WR_JUP_2H_DHANA', 'WR_L2_EXALTED_DHANA'], 'ACCUMULATION');
    const gainsEvidence = createMockNatalEvidence(['WR_L11_11H_SELF_GAINS'], 'GAINS');
    const mixedNatal = [...accumulationEvidence, ...gainsEvidence];

    const accumulationResult = resolveWealthDimensionManifestation('ACCUMULATION', mixedNatal, undefined, 'CONFIRMS');
    const speculationResult = resolveWealthDimensionManifestation('SPECULATION', mixedNatal, undefined, 'CONFIRMS');

    expect(accumulationResult.status).toBe('STRONGLY_SUPPORTED');
    expect(accumulationResult.natalSupport).toBe('SUPPORT');

    // Speculation must NOT inherit accumulation's status - it must be isolated!
    expect(speculationResult.status).not.toBe('STRONGLY_SUPPORTED');
    expect(speculationResult.status).toBe('INSUFFICIENT_DATA');
  });

  it('evaluates SPECULATION independently with 5th house challenges', () => {
    const speculationChallengedEvidence = createMockNatalEvidence(
      ['WR_L5_COMBUST', 'WR_RAHU_5H_VOLATILE'],
      'SPECULATION',
      'CHALLENGING'
    );

    const speculationResult = resolveWealthDimensionManifestation(
      'SPECULATION',
      speculationChallengedEvidence,
      undefined,
      'UNAVAILABLE'
    );

    expect(speculationResult.dimension).toBe('SPECULATION');
    expect(speculationResult.status).toBe('CHALLENGED');
    expect(speculationResult.natalSupport).toBe('CHALLENGE');
  });

  it('incorporates D2 Hora confirmation and conflict into accumulation and gains synthesis', () => {
    const accumulationEvidence = createMockNatalEvidence(['WR_JUP_2H_DHANA'], 'ACCUMULATION');

    const resultWithConfirm = resolveWealthDimensionManifestation(
      'ACCUMULATION',
      accumulationEvidence,
      undefined,
      'CONFIRMS'
    );

    expect(resultWithConfirm.d2Support).toBe('SUPPORT');
    const d2Factor = resultWithConfirm.factors.find((f) => f.source === 'D2');
    expect(d2Factor).toBeDefined();
    expect(d2Factor?.direction).toBe('SUPPORT');
    expect(d2Factor?.weight).toBe(1.0);

    const resultWithPartial = resolveWealthDimensionManifestation(
      'ACCUMULATION',
      accumulationEvidence,
      undefined,
      'PARTIALLY_CONFIRMS'
    );
    expect(resultWithPartial.d2Support).toBe('SUPPORT');
    const d2PartialFactor = resultWithPartial.factors.find((f) => f.source === 'D2');
    expect(d2PartialFactor?.weight).toBe(0.5);

    const resultWithConflict = resolveWealthDimensionManifestation(
      'ACCUMULATION',
      accumulationEvidence,
      undefined,
      'CONFLICTS'
    );
    expect(resultWithConflict.d2Support).toBe('CHALLENGE');
    const d2ConflictFactor = resultWithConflict.factors.find((f) => f.source === 'D2');
    expect(d2ConflictFactor?.direction).toBe('CHALLENGE');
  });

  it('synthesizes all 4 classical wealth dimensions via synthesizeWealthManifestations', () => {
    const natalEvidence = [
      ...createMockNatalEvidence(['WR_JUP_2H_DHANA'], 'ACCUMULATION'),
      ...createMockNatalEvidence(['WR_L11_11H_SELF_GAINS'], 'GAINS'),
      ...createMockNatalEvidence(['WR_L9_EXALTED_BHAGYA'], 'FORTUNE')
    ];

    const mockWealthTiming: WealthTimingSynthesis = {
      dimensions: {
        ACCUMULATION: {
          dimension: 'ACCUMULATION',
          natalPromise: 'STRONG',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'SUPPORTS',
          overallEffect: 'ACTIVATES',
          confidence: 0.9,
          factors: [
            {
              id: 'W_TR_2',
              planet: Planet.JUPITER,
              dimension: 'ACCUMULATION',
              category: 'WEALTH_HOUSE_TRANSIT',
              direction: 'SUPPORT',
              weight: 1.5,
              statement: 'Jupiter transit supports 2nd house.'
            }
          ],
          summary: 'Timing supports accumulation.'
        },
        GAINS: {
          dimension: 'GAINS',
          natalPromise: 'STRONG',
          dashaEffect: 'SUPPORTS',
          transitEffect: 'NEUTRAL',
          overallEffect: 'ACTIVATES',
          confidence: 0.7,
          factors: [],
          summary: 'Timing supports gains.'
        },
        FORTUNE: {
          dimension: 'FORTUNE',
          natalPromise: 'MODERATE',
          dashaEffect: 'NEUTRAL',
          transitEffect: 'NEUTRAL',
          overallEffect: 'MODIFIES',
          confidence: 0.6,
          factors: [],
          summary: 'Fortune timing is neutral.'
        },
        SPECULATION: {
          dimension: 'SPECULATION',
          natalPromise: 'WEAK',
          dashaEffect: 'CHALLENGES',
          transitEffect: 'CHALLENGES',
          overallEffect: 'CHALLENGES',
          confidence: 0.8,
          factors: [],
          summary: 'Speculative timing is challenged.'
        }
      },
      overallSummary: 'Wealth timing overall summary'
    };

    const synthesis = synthesizeWealthManifestations(natalEvidence, mockWealthTiming, 'CONFIRMS');

    expect(synthesis.reasoningVersion).toBe('CW-04');
    expect(synthesis.dimensions).toHaveProperty('ACCUMULATION');
    expect(synthesis.dimensions).toHaveProperty('GAINS');
    expect(synthesis.dimensions).toHaveProperty('FORTUNE');
    expect(synthesis.dimensions).toHaveProperty('SPECULATION');

    expect(synthesis.dimensions.ACCUMULATION.status).toBe('STRONGLY_SUPPORTED');
    expect(synthesis.dimensions.GAINS.status).toBe('STRONGLY_SUPPORTED');
    expect(synthesis.dimensions.SPECULATION.status).toBe('INSUFFICIENT_DATA');
    expect(synthesis.summary).toBeTruthy();
  });
});
