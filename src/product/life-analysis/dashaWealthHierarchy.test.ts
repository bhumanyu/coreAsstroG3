import { describe, it, expect } from 'vitest';
import { synthesizeWealthDashaHierarchy } from './dashaWealthHierarchy';
import type { WealthPeriodTimingActivation } from '../../domain/wealth/wealthTypes';
import { Planet } from '../../types';

describe('D07-C: Wealth Dasha Hierarchy Synthesis', () => {
  it('evaluates all 4 wealth dimensions independently without collapsing them', () => {
    const md: WealthPeriodTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'ACTIVATES',
        fortune: 'ACTIVATES',
        speculation: 'CHALLENGES'
      },
      evidenceIds: ['WEALTH-MD-1', 'WEALTH-MD-2'],
      statement: 'Jupiter strong 2H, 11H, 9H; 5H challenged'
    };

    const ad: WealthPeriodTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      dimensions: {
        accumulation: 'CHALLENGES',
        gains: 'ACTIVATES',
        fortune: 'ACTIVATES',
        speculation: 'CHALLENGES'
      },
      evidenceIds: ['WEALTH-AD-1'],
      statement: 'Saturn delays 2H'
    };

    const pd: WealthPeriodTimingActivation = {
      period: 'PD',
      planet: Planet.VENUS,
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'ACTIVATES',
        fortune: 'CHALLENGES',
        speculation: 'ACTIVATES'
      },
      evidenceIds: ['WEALTH-PD-1'],
      statement: 'Venus short-term gain'
    };

    const result = synthesizeWealthDashaHierarchy(md, ad, pd);

    expect(result.dimensions).toHaveLength(4);

    const accum = result.dimensions.find((d) => d.dimension === 'ACCUMULATION')!;
    const gains = result.dimensions.find((d) => d.dimension === 'GAINS')!;
    const fortune = result.dimensions.find((d) => d.dimension === 'FORTUNE')!;
    const spec = result.dimensions.find((d) => d.dimension === 'SPECULATION')!;

    // Accumulation: MD=ACTIVATES, AD=CHALLENGES, PD=ACTIVATES -> PARTIALLY_ACTIVATES
    expect(accum.primary).toBe('ACTIVATES');
    expect(accum.modifier).toBe('CHALLENGES');
    expect(accum.trigger).toBe('ACTIVATES');
    expect(accum.overallEffect).toBe('PARTIALLY_ACTIVATES');

    // Gains: MD=ACTIVATES, AD=ACTIVATES, PD=ACTIVATES -> ACTIVATES
    expect(gains.primary).toBe('ACTIVATES');
    expect(gains.modifier).toBe('ACTIVATES');
    expect(gains.trigger).toBe('ACTIVATES');
    expect(gains.overallEffect).toBe('ACTIVATES');

    // Fortune: MD=ACTIVATES, AD=ACTIVATES, PD=CHALLENGES -> ACTIVATES (PD cannot flip MD+AD)
    expect(fortune.primary).toBe('ACTIVATES');
    expect(fortune.modifier).toBe('ACTIVATES');
    expect(fortune.trigger).toBe('CHALLENGES');
    expect(fortune.overallEffect).toBe('ACTIVATES');

    // Speculation: MD=CHALLENGES, AD=CHALLENGES, PD=ACTIVATES -> CHALLENGES (PD cannot flip MD+AD)
    expect(spec.primary).toBe('CHALLENGES');
    expect(spec.modifier).toBe('CHALLENGES');
    expect(spec.trigger).toBe('ACTIVATES');
    expect(spec.overallEffect).toBe('CHALLENGES');

    expect(result.evidenceIds).toEqual([
      'WEALTH-MD-1',
      'WEALTH-MD-2',
      'WEALTH-AD-1',
      'WEALTH-PD-1'
    ]);
    expect(result.evidence).toHaveLength(4);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dimensions)).toBe(true);
  });

  it('handles missing dimensions gracefully with INSUFFICIENT_DATA fallback', () => {
    const md: WealthPeriodTimingActivation = {
      period: 'MD',
      planet: Planet.SUN,
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'ACTIVATES',
        fortune: 'ACTIVATES',
        speculation: 'ACTIVATES'
      },
      evidenceIds: []
    };
    const ad: WealthPeriodTimingActivation = {
      period: 'AD',
      planet: Planet.MOON,
      dimensions: {} as any,
      evidenceIds: []
    };
    const pd: WealthPeriodTimingActivation = {
      period: 'PD',
      planet: Planet.MARS,
      dimensions: {} as any,
      evidenceIds: []
    };

    const result = synthesizeWealthDashaHierarchy(md, ad, pd);

    expect(result.dimensions).toHaveLength(4);
    for (const dim of result.dimensions) {
      expect(dim.primary).toBe('ACTIVATES');
      expect(dim.modifier).toBe('INSUFFICIENT_DATA');
      expect(dim.trigger).toBe('INSUFFICIENT_DATA');
      expect(dim.overallEffect).toBe('ACTIVATES');
    }
  });

  it('generates summary describing 4 dimensions with planet lords', () => {
    const md: WealthPeriodTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'ACTIVATES',
        fortune: 'ACTIVATES',
        speculation: 'ACTIVATES'
      },
      evidenceIds: []
    };
    const ad: WealthPeriodTimingActivation = {
      period: 'AD',
      planet: Planet.VENUS,
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'ACTIVATES',
        fortune: 'ACTIVATES',
        speculation: 'ACTIVATES'
      },
      evidenceIds: []
    };
    const pd: WealthPeriodTimingActivation = {
      period: 'PD',
      planet: Planet.MERCURY,
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'ACTIVATES',
        fortune: 'ACTIVATES',
        speculation: 'ACTIVATES'
      },
      evidenceIds: []
    };

    const result = synthesizeWealthDashaHierarchy(md, ad, pd);

    expect(result.summary).toContain('JUPITER');
    expect(result.summary).toContain('VENUS');
    expect(result.summary).toContain('MERCURY');
    expect(result.summary).toContain('Accumulation: Activates');
    expect(result.summary).toContain('Gains: Activates');
  });
});
