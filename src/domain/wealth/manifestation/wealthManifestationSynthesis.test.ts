import { describe, it, expect } from 'vitest';
import {
  resolveWealthDimensionManifestation,
  synthesizeWealthManifestations
} from './wealthManifestationSynthesis';
import { createDomainEvidence, type DomainEvidence } from '../../interpretation';
import type {
  WealthTimingSynthesis,
  WealthTransitDimensionSynthesis,
  WealthTransitFactor
} from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';
import { Planet } from '../../../types';

describe('wealthManifestationSynthesis (CW-04B)', () => {
  const createMockNatalEvidence = (
    rules: string[],
    dimension?: WealthDimension,
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

  const createMockWealthDimensionTiming = (
    dimension: WealthDimension,
    overrides?: Partial<WealthTransitDimensionSynthesis>
  ): WealthTransitDimensionSynthesis => ({
    dimension,
    natalPromise: 'STRONG',
    dashaEffect: 'NEUTRAL',
    transitEffect: 'NEUTRAL',
    overallEffect: 'ACTIVATES',
    confidence: 0.8,
    factors: [],
    summary: `${dimension} timing summary`,
    ...overrides
  });

  const createMockWealthTiming = (
    dimMap?: Partial<Record<WealthDimension, Partial<WealthTransitDimensionSynthesis>>>
  ): WealthTimingSynthesis => ({
    dimensions: {
      ACCUMULATION: createMockWealthDimensionTiming('ACCUMULATION', dimMap?.ACCUMULATION),
      GAINS: createMockWealthDimensionTiming('GAINS', dimMap?.GAINS),
      FORTUNE: createMockWealthDimensionTiming('FORTUNE', dimMap?.FORTUNE),
      SPECULATION: createMockWealthDimensionTiming('SPECULATION', dimMap?.SPECULATION)
    },
    overallSummary: 'Wealth timing summary'
  });

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

    expect(accumulationResult.status).toBe('SUPPORTED');
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

  it('keeps D2 unavailable despite absent, malformed, single, or conflicting declarations', () => {
    const evidence = createMockNatalEvidence(['WR_JUP_2H_DHANA'], 'ACCUMULATION');
    const absent = resolveWealthDimensionManifestation('ACCUMULATION', evidence);
    const single = resolveWealthDimensionManifestation('ACCUMULATION', evidence, undefined, 'CONFIRMS');
    const malformed = resolveWealthDimensionManifestation('ACCUMULATION', evidence, undefined, 'MALFORMED');
    const conflicting = resolveWealthDimensionManifestation('ACCUMULATION', evidence, undefined, 'CONFLICTS');

    for (const result of [absent, single, malformed, conflicting]) {
      expect(result.d2Support).toBe('UNAVAILABLE');
      expect(result.factors.some((factor) => factor.source === 'D2')).toBe(false);
    }
  });

  it('does not emit a D2 factor even when raw D2 evidence is present', () => {
    const evidence = [
      createDomainEvidence({
        id: 'WEALTH_EXPLICIT_D2_EVIDENCE',
        sourceType: 'VARGA',
        domain: 'WEALTH',
        phase: 'VARGA_CONFIRMATION',
        source: 'D2',
        statement: 'Unvalidated D2 evidence',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        ruleId: 'WEALTH_D2_CONFIRMATION'
      })
    ];
    const result = resolveWealthDimensionManifestation('ACCUMULATION', evidence, undefined, 'CONFIRMS');
    expect(result.d2Support).toBe('UNAVAILABLE');
    expect(result.factors.some(factor => factor.source === 'D2')).toBe(false);
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

  it('Test C: resolves to MIXED when natal SUPPORT encounters any secondary CHALLENGE (dasha challenge)', () => {
    const natalEvidence = createMockNatalEvidence(['WR_JUP_2H_DHANA'], 'ACCUMULATION');

    const mockWealthTiming = createMockWealthTiming({
      ACCUMULATION: {
        dimension: 'ACCUMULATION',
        natalPromise: 'STRONG',
        dashaEffect: 'CHALLENGES',
        transitEffect: 'SUPPORTS',
        overallEffect: 'MODIFIES',
        confidence: 0.8,
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
        summary: 'Dasha challenges while transit supports.'
      }
    });

    const result = resolveWealthDimensionManifestation('ACCUMULATION', natalEvidence, mockWealthTiming, 'CONFIRMS');

    expect(result.dimension).toBe('ACCUMULATION');
    expect(result.natalSupport).toBe('SUPPORT');
    expect(result.dashaSupport).toBe('CHALLENGE');
    expect(result.transitSupport).toBe('SUPPORT');
    expect(result.d2Support).toBe('UNAVAILABLE');
    expect(result.status).toBe('MIXED');
    expect(result.confidence).toBe('MEDIUM');
  });

  it('Test D: resolves to STRONGLY_SUPPORTED from natal and Dasha support without validated D2', () => {
    const natalEvidence = createMockNatalEvidence(['WR_JUP_2H_DHANA'], 'ACCUMULATION');

    const mockWealthTiming = createMockWealthTiming({
      ACCUMULATION: {
        dimension: 'ACCUMULATION',
        natalPromise: 'STRONG',
        dashaEffect: 'SUPPORTS',
        transitEffect: 'NEUTRAL',
        overallEffect: 'ACTIVATES',
        confidence: 0.8,
        factors: [],
        summary: 'Dasha supports accumulation, transit is neutral.'
      }
    });

    const result = resolveWealthDimensionManifestation('ACCUMULATION', natalEvidence, mockWealthTiming, 'CONFIRMS');

    expect(result.dimension).toBe('ACCUMULATION');
    expect(result.natalSupport).toBe('SUPPORT');
    expect(result.dashaSupport).toBe('SUPPORT');
    expect(result.d2Support).toBe('UNAVAILABLE');
    expect(result.transitSupport).toBe('NEUTRAL');
    expect(result.status).toBe('STRONGLY_SUPPORTED');
    expect(result.confidence).toBe('HIGH');
  });

  it('Test 5: resolves to INSUFFICIENT_DATA when natal evidence is missing despite Dasha and transit support', () => {
    const emptyNatalEvidence: DomainEvidence[] = [];

    const mockWealthTiming = createMockWealthTiming({
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
            weight: 2.0,
            statement: 'Jupiter transit supports 2nd house.'
          }
        ],
        summary: 'Timing supports accumulation.'
      }
    });

    const result = resolveWealthDimensionManifestation('ACCUMULATION', emptyNatalEvidence, mockWealthTiming, 'CONFIRMS');

    // Guardrail: secondary evidence cannot manufacture a manifestation without natal support
    expect(result.dimension).toBe('ACCUMULATION');
    expect(result.natalSupport).toBe('NEUTRAL');
    expect(result.dashaSupport).toBe('SUPPORT');
    expect(result.transitSupport).toBe('SUPPORT');
    expect(result.d2Support).toBe('UNAVAILABLE');
    expect(result.status).toBe('INSUFFICIENT_DATA');
    expect(result.confidence).toBe('LOW');
  });

  it('enforces natal ceiling per-dimension: secondary support cannot overturn a natal challenge on an isolated dimension in the same synthesis run', () => {
    const natalEvidence = [
      ...createMockNatalEvidence(['WR_JUP_2H_DHANA', 'WR_L2_EXALTED_DHANA'], 'ACCUMULATION', 'SUPPORTING'),
      ...createMockNatalEvidence(['WR_L5_COMBUST', 'WR_RAHU_5H_VOLATILE'], 'SPECULATION', 'CHALLENGING')
    ];

    const mockWealthTiming = createMockWealthTiming({
      ACCUMULATION: {
        dimension: 'ACCUMULATION',
        natalPromise: 'STRONG',
        dashaEffect: 'SUPPORTS',
        transitEffect: 'SUPPORTS',
        overallEffect: 'ACTIVATES',
        confidence: 0.9,
        factors: [],
        summary: 'Timing supports accumulation.'
      },
      SPECULATION: {
        dimension: 'SPECULATION',
        natalPromise: 'WEAK',
        dashaEffect: 'SUPPORTS',
        transitEffect: 'SUPPORTS',
        overallEffect: 'ACTIVATES',
        confidence: 0.9,
        factors: [],
        summary: 'Timing supports speculation.'
      }
    });

    const synthesis = synthesizeWealthManifestations(natalEvidence, mockWealthTiming, 'CONFIRMS');

    // ACCUMULATION has natal SUPPORT + secondary SUPPORT -> STRONGLY_SUPPORTED
    expect(synthesis.dimensions.ACCUMULATION.status).toBe('STRONGLY_SUPPORTED');
    expect(synthesis.dimensions.ACCUMULATION.natalSupport).toBe('SUPPORT');
    expect(synthesis.dimensions.ACCUMULATION.dashaSupport).toBe('SUPPORT');
    expect(synthesis.dimensions.ACCUMULATION.transitSupport).toBe('SUPPORT');
    expect(synthesis.dimensions.ACCUMULATION.d2Support).toBe('UNAVAILABLE');

    // SPECULATION has natal CHALLENGE + secondary SUPPORT everywhere -> strictly CHALLENGED (natal ceiling)
    expect(synthesis.dimensions.SPECULATION.status).toBe('CHALLENGED');
    expect(synthesis.dimensions.SPECULATION.natalSupport).toBe('CHALLENGE');
    expect(synthesis.dimensions.SPECULATION.dashaSupport).toBe('SUPPORT');
    expect(synthesis.dimensions.SPECULATION.transitSupport).toBe('SUPPORT');
    expect(synthesis.dimensions.SPECULATION.d2Support).toBe('UNAVAILABLE');
  });
});
