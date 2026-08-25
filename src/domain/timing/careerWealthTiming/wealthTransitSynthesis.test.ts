import { describe, it, expect } from 'vitest';
import { Planet, Sign, AyanamsaType, type Horoscope } from '../../../types';
import { synthesizeWealthTiming } from './wealthTransitSynthesis';
import { resolveWealthDimensionTransitEffect } from './wealthTransitRules';

describe('CW-03 Wealth Timing Synthesis & Dimension Isolation', () => {
  const mockHoroscope: Horoscope = {
    birthDetails: {
      dateTimeStr: '1990-05-15T10:30:00Z',
      latitude: 28.6139,
      longitude: 77.2090,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI
    },
    planetFacts: {
      [Planet.SUN]: { longitude: 45.0, sign: Sign.TAURUS } as any,
      [Planet.MOON]: { longitude: 120.0, sign: Sign.LEO } as any,
      [Planet.MARS]: { longitude: 280.0, sign: Sign.CAPRICORN } as any,
      [Planet.MERCURY]: { longitude: 50.0, sign: Sign.TAURUS } as any,
      [Planet.JUPITER]: { longitude: 90.0, sign: Sign.CANCER } as any,
      [Planet.VENUS]: { longitude: 15.0, sign: Sign.ARIES } as any,
      [Planet.SATURN]: { longitude: 300.0, sign: Sign.AQUARIUS } as any,
      [Planet.RAHU]: { longitude: 180.0, sign: Sign.LIBRA } as any,
      [Planet.KETU]: { longitude: 0.0, sign: Sign.ARIES } as any
    },
    ascendant: {
      longitude: 105.0,
      signLongitude: 15.0,
      sign: Sign.CANCER
    },
    fullNatalAnalysis: {} as any
  };

  it('synthesizes wealth timing independently across 4 dimensions', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeWealthTiming(mockHoroscope, null, asOf);

    expect(result).toBeDefined();
    expect(result.dimensions.ACCUMULATION).toBeDefined();
    expect(result.dimensions.GAINS).toBeDefined();
    expect(result.dimensions.FORTUNE).toBeDefined();
    expect(result.dimensions.SPECULATION).toBeDefined();
  });

  it('keeps speculation strictly isolated from accumulation and gains', () => {
    // Accumulation: Strong promise, supportive dasha, supportive transit -> ACTIVATES
    const accumEffect = resolveWealthDimensionTransitEffect('STRONG', 'SUPPORTS', {
      transitEffect: 'SUPPORTS'
    });

    // Speculation: Weak promise, supportive dasha, supportive transit -> DOES_NOT_ACTIVATE (Natal ceiling)
    const specEffect = resolveWealthDimensionTransitEffect('WEAK', 'SUPPORTS', {
      transitEffect: 'SUPPORTS'
    });

    expect(accumEffect).toBe('ACTIVATES');
    expect(specEffect).toBe('DOES_NOT_ACTIVATE');
    expect(accumEffect).not.toEqual(specEffect);
  });
});
