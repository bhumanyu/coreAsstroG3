import { describe, it, expect } from 'vitest';
import { Planet, Sign, AyanamsaType, type Horoscope } from '../../../types';
import { synthesizeCareerTransit } from './careerTransitSynthesis';
import { mapTransitEffect } from './careerTransitRules';

describe('CW-03 Career Transit Synthesis', () => {
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

  it('runs deterministically given an explicit asOf date', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeCareerTransit(mockHoroscope, null, asOf);

    expect(result).toBeDefined();
    expect(result.transitEffect).toBeDefined();
    expect(Array.isArray(result.factors)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('mapTransitEffect handles factor dominance thresholds correctly', () => {
    const factors = [
      {
        id: '1',
        planet: Planet.JUPITER,
        category: 'CAREER_HOUSE_TRANSIT' as const,
        direction: 'SUPPORT' as const,
        weight: 2.5,
        statement: 'Jupiter in 10H'
      },
      {
        id: '2',
        planet: Planet.SATURN,
        category: 'CAREER_HOUSE_TRANSIT' as const,
        direction: 'CHALLENGE' as const,
        weight: 1.0,
        statement: 'Saturn challenge'
      }
    ];

    const { transitEffect, confidence } = mapTransitEffect(factors);
    expect(transitEffect).toBe('SUPPORTS');
    expect(confidence).toBeGreaterThan(0.5);
  });
});
