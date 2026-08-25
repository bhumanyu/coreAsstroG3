import { describe, it, expect } from 'vitest';
import { getD10ManifestationFactors, getAllD10ManifestationFactors } from './d10CareerManifestation';
import type { Horoscope } from '../../../types';
import { Planet, Sign } from '../../../types';

describe('d10CareerManifestation', () => {
  const createMockHoroscope = (overrides: Partial<Horoscope> = {}): Horoscope => {
    return {
      ascendant: { sign: Sign.ARIES, longitude: 10 },
      planets: {
        [Planet.SUN]: { sign: Sign.ARIES, house: 1, longitude: 10 },
        [Planet.MOON]: { sign: Sign.TAURUS, house: 2, longitude: 15 },
        [Planet.MARS]: { sign: Sign.CAPRICORN, house: 10, longitude: 20 },
        [Planet.MERCURY]: { sign: Sign.GEMINI, house: 3, longitude: 5 },
        [Planet.JUPITER]: { sign: Sign.CANCER, house: 4, longitude: 12 },
        [Planet.VENUS]: { sign: Sign.PISCES, house: 12, longitude: 8 },
        [Planet.SATURN]: { sign: Sign.LIBRA, house: 7, longitude: 22 },
        [Planet.RAHU]: { sign: Sign.TAURUS, house: 2, longitude: 18 },
        [Planet.KETU]: { sign: Sign.SCORPIO, house: 8, longitude: 18 }
      },
      houses: [],
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          planets: {
            [Planet.SUN]: { house: 10, dignity: 'EXALTED', sign: Sign.ARIES },
            [Planet.MARS]: { house: 1, dignity: 'OWN_SIGN', sign: Sign.ARIES },
            [Planet.SATURN]: { house: 6, dignity: 'EXALTED', sign: Sign.LIBRA },
            [Planet.MERCURY]: { house: 3, dignity: 'OWN_SIGN', sign: Sign.GEMINI },
            [Planet.JUPITER]: { house: 9, dignity: 'EXALTED', sign: Sign.CANCER },
            [Planet.RAHU]: { house: 11, dignity: 'NEUTRAL', sign: Sign.AQUARIUS }
          },
          houses: [
            { house: 10, lord: Planet.SUN }
          ],
          houseLords: {
            10: Planet.SUN
          }
        },
        d1Comparisons: {
          [Planet.SUN]: { isD10Vargottama: true }
        }
      },
      ...overrides
    } as unknown as Horoscope;
  };

  it('returns empty array when D10 data is missing', () => {
    const horoscopeWithoutD10 = {
      ...createMockHoroscope(),
      divisionalInterpretation: undefined
    } as unknown as Horoscope;

    const factors = getD10ManifestationFactors('LEADERSHIP', horoscopeWithoutD10);
    expect(factors).toEqual([]);
  });

  it('evaluates D10 factors for LEADERSHIP mode with exalted Sun and 10th lord', () => {
    const horoscope = createMockHoroscope();
    const factors = getD10ManifestationFactors('LEADERSHIP', horoscope);

    expect(factors.length).toBeGreaterThan(0);
    const supportingFactors = factors.filter((f) => f.direction === 'SUPPORT');
    expect(supportingFactors.length).toBeGreaterThan(0);

    const lordFactor = factors.find((f) => f.id === 'D10_LEADERSHIP_10L_STRONG');
    expect(lordFactor).toBeDefined();
    expect(lordFactor?.direction).toBe('SUPPORT');

    const sunFactor = factors.find((f) => f.id === 'D10_LEADERSHIP_SUN_SUPPORT');
    expect(sunFactor).toBeDefined();
    expect(sunFactor?.direction).toBe('SUPPORT');
    expect(sunFactor?.statement).toContain('D10 Vargottama');
  });

  it('evaluates D10 factors for SERVICE_EMPLOYMENT with Saturn in 6th house', () => {
    const horoscope = createMockHoroscope();
    const factors = getD10ManifestationFactors('SERVICE_EMPLOYMENT', horoscope);

    const saturnFactor = factors.find((f) => f.planet === Planet.SATURN);
    expect(saturnFactor).toBeDefined();
    expect(saturnFactor?.direction).toBe('SUPPORT');
    expect(saturnFactor?.house).toBe(6);
  });

  it('evaluates D10 factors for TECHNICAL_SPECIALIZATION with Mercury and Mars', () => {
    const horoscope = createMockHoroscope();
    const factors = getD10ManifestationFactors('TECHNICAL_SPECIALIZATION', horoscope);

    expect(factors.length).toBeGreaterThan(0);
    const hasMercury = factors.some((f) => f.planet === Planet.MERCURY);
    expect(hasMercury).toBe(true);
  });

  it('identifies challenging D10 factors when planets are debilitated', () => {
    const challengedHoroscope = createMockHoroscope({
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          planets: {
            [Planet.SUN]: { house: 8, dignity: 'DEBILITATED', sign: Sign.LIBRA },
            [Planet.SATURN]: { house: 8, dignity: 'DEBILITATED', sign: Sign.ARIES }
          },
          houses: [{ house: 10, lord: Planet.SUN }],
          houseLords: { 10: Planet.SUN }
        }
      }
    } as unknown as Partial<Horoscope>);

    const factors = getD10ManifestationFactors('LEADERSHIP', challengedHoroscope as Horoscope);
    const challengeFactors = factors.filter((f) => f.direction === 'CHALLENGE');
    expect(challengeFactors.length).toBeGreaterThan(0);
  });

  it('getAllD10ManifestationFactors returns factors for canonical modes', () => {
    const horoscope = createMockHoroscope();
    const allFactors = getAllD10ManifestationFactors(horoscope);

    expect(allFactors.length).toBeGreaterThan(0);
    const modes = new Set(allFactors.map((f) => f.mode));
    expect(modes.has('LEADERSHIP')).toBe(true);
    expect(modes.has('MANAGEMENT')).toBe(true);
    expect(modes.has('TECHNICAL_SPECIALIZATION')).toBe(true);
    expect(modes.has('SERVICE_EMPLOYMENT')).toBe(true);
    expect(modes.has('AUTHORITY')).toBe(true);
    expect(modes.has('INDEPENDENT_WORK')).toBe(true);
    expect(modes.has('BUSINESS_ENTREPRENEURSHIP')).toBe(true);
  });
});
