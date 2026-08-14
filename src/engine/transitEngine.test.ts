import { describe, it, expect } from 'vitest';
import {
  calculateTransit,
  calculateWholeSignHouse,
  calculateTransitAspects,
  getGrahaDrishtiOffsets
} from './transitEngine';
import { calculateCurrentTransitLongitudes } from './transitEphemeris';
import { calculateSign } from './astroEngine';
import { Planet, Sign, AspectType, TransitInput } from '../types';

describe('PR-037 Gochara Transit Engine', () => {

  it('should determine transit sign correctly from longitude', () => {
    const input: TransitInput = {
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 45.0, // Taurus
      natalAscendantLongitude: 270.0, // Capricorn
      transitLongitudes: {
        [Planet.SATURN]: 345.0 // Pisces
      }
    };

    const analysis = calculateTransit(input);
    const saturnResult = analysis.results![Planet.SATURN]!;

    expect(saturnResult).toBeDefined();
    expect(saturnResult.position!.sign).toBe(Sign.PISCES);
    expect(saturnResult.position!.signNumber).toBe(12);
  });

  it('should calculate house position from natal Moon (Taurus Moon, Pisces Saturn)', () => {
    const input: TransitInput = {
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 45.0, // Taurus (Sign 2)
      natalAscendantLongitude: 270.0, // Capricorn (Sign 10)
      transitLongitudes: {
        [Planet.SATURN]: 345.0 // Pisces (Sign 12)
      }
    };

    const analysis = calculateTransit(input);
    const result = analysis.results![Planet.SATURN]!;

    // Pisces (12) from Taurus (2): 12 - 2 = 10, offset + 1 = 11th House
    expect(result.housePosition!.fromMoon).toBe(11);
  });

  it('should calculate house position from natal Ascendant (Capricorn Asc, Pisces Saturn)', () => {
    const input: TransitInput = {
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 45.0, // Taurus
      natalAscendantLongitude: 270.0, // Capricorn (Sign 10)
      transitLongitudes: {
        [Planet.SATURN]: 345.0 // Pisces (Sign 12)
      }
    };

    const analysis = calculateTransit(input);
    const result = analysis.results![Planet.SATURN]!;

    // Pisces (12) from Capricorn (10): 12 - 10 = 2, offset + 1 = 3rd House
    expect(result.housePosition!.fromAscendant).toBe(3);
  });

  it('should handle zodiac wrap-around correctly (Sagittarius Moon -> Aries Mars)', () => {
    const input: TransitInput = {
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 240.0, // Sagittarius (Sign 9)
      natalAscendantLongitude: 0.0, // Aries (Sign 1)
      transitLongitudes: {
        [Planet.MARS]: 10.0 // Aries (Sign 1)
      }
    };

    const analysis = calculateTransit(input);
    const result = analysis.results![Planet.MARS]!;

    // Aries (1) from Sagittarius (9): (1 - 9 + 12) % 12 = 4, + 1 = 5th House
    expect(result.housePosition!.fromMoon).toBe(5);
    expect(result.housePosition!.fromAscendant).toBe(1);
  });

  it('should calculate Graha Drishti aspects for Mars (4th, 7th, 8th special aspects)', () => {
    const aspects = calculateTransitAspects(Planet.MARS, Sign.ARIES, 1, 1);
    
    expect(aspects.length).toBe(3);
    const types = aspects.map(a => a.aspectType);
    expect(types).toContain(AspectType.FULL_7TH);
    expect(types).toContain(AspectType.SPECIAL_4TH);
    expect(types).toContain(AspectType.SPECIAL_8TH);

    // From Aries (1st house): 4th = Cancer, 7th = Libra, 8th = Scorpio
    const targetSigns = aspects.map(a => a.targetSign);
    expect(targetSigns).toContain(Sign.CANCER);
    expect(targetSigns).toContain(Sign.LIBRA);
    expect(targetSigns).toContain(Sign.SCORPIO);
  });

  it('should calculate Graha Drishti aspects for Jupiter (5th, 7th, 9th) and Saturn (3rd, 7th, 10th)', () => {
    const jupAspects = calculateTransitAspects(Planet.JUPITER, Sign.TAURUS, 2, 2);
    expect(jupAspects.map(a => a.aspectType)).toEqual([
      AspectType.SPECIAL_5TH,
      AspectType.FULL_7TH,
      AspectType.SPECIAL_9TH
    ]);

    const satAspects = calculateTransitAspects(Planet.SATURN, Sign.PISCES, 11, 3);
    expect(satAspects.map(a => a.aspectType)).toEqual([
      AspectType.SPECIAL_3RD,
      AspectType.FULL_7TH,
      AspectType.SPECIAL_10TH
    ]);
  });

  it('Sun, Rahu, and Ketu return exactly one aspect of type AspectType.FULL_7TH', () => {
    const sunAspects = calculateTransitAspects(Planet.SUN, Sign.ARIES, 1, 1);
    expect(sunAspects.length).toBe(1);
    expect(sunAspects[0].aspectType).toBe(AspectType.FULL_7TH);

    const rahuAspects = calculateTransitAspects(Planet.RAHU, Sign.TAURUS, 2, 2);
    expect(rahuAspects.length).toBe(1);
    expect(rahuAspects[0].aspectType).toBe(AspectType.FULL_7TH);

    const ketuAspects = calculateTransitAspects(Planet.KETU, Sign.SCORPIO, 8, 8);
    expect(ketuAspects.length).toBe(1);
    expect(ketuAspects[0].aspectType).toBe(AspectType.FULL_7TH);
  });

  it('should enforce defensive immutability on outputs including aspects array and aspect elements', () => {
    const input: TransitInput = {
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 45.0,
      natalAscendantLongitude: 270.0,
      transitLongitudes: {
        [Planet.SATURN]: 345.0
      }
    };

    const analysis = calculateTransit(input);
    const saturnResult = analysis.results![Planet.SATURN]!;

    expect(Object.isFrozen(analysis)).toBe(true);
    expect(Object.isFrozen(analysis.results)).toBe(true);
    expect(Object.isFrozen(saturnResult)).toBe(true);
    expect(Object.isFrozen(saturnResult.aspects)).toBe(true);
    expect(Object.isFrozen(saturnResult.aspects![0])).toBe(true);
  });

  it('should test calculateSign zodiac boundary conditions', () => {
    expect(calculateSign(0)).toBe(Sign.ARIES);
    expect(calculateSign(29.99)).toBe(Sign.ARIES);
    expect(calculateSign(30)).toBe(Sign.TAURUS);
    expect(calculateSign(359.99)).toBe(Sign.PISCES);
    expect(calculateSign(360)).toBe(Sign.ARIES);
  });

  it('should throw for an invalid at string or date', () => {
    expect(() => calculateTransit({
      at: 'garbage',
      natalMoonLongitude: 45.0,
      natalAscendantLongitude: 270.0,
      transitLongitudes: { [Planet.SATURN]: 345.0 }
    })).toThrow('at must be a valid date/time.');

    expect(() => calculateTransit({
      at: null as unknown as string,
      natalMoonLongitude: 45.0,
      natalAscendantLongitude: 270.0,
      transitLongitudes: { [Planet.SATURN]: 345.0 }
    })).toThrow('at must be a valid date/time.');
  });

  it('should reject invalid or missing inputs, including non-finite longitudes and unknown planets', () => {
    expect(() => calculateTransit(null as unknown as TransitInput)).toThrow();
    expect(() => calculateTransit({
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: NaN,
      natalAscendantLongitude: 10,
      transitLongitudes: { [Planet.SUN]: 10 }
    })).toThrow('natalMoonLongitude is required and must be a finite number.');

    expect(() => calculateTransit({
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 10,
      natalAscendantLongitude: NaN,
      transitLongitudes: { [Planet.SUN]: 10 }
    })).toThrow('natalAscendantLongitude is required and must be a finite number.');

    expect(() => calculateTransit({
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 10,
      natalAscendantLongitude: 20,
      transitLongitudes: {}
    })).toThrow('transitLongitudes must not be empty.');

    expect(() => calculateTransit({
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 10,
      natalAscendantLongitude: 20,
      transitLongitudes: { [Planet.SUN]: Infinity }
    })).toThrow('Transit longitude for planet SUN must be a finite number.');

    expect(() => calculateTransit({
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 10,
      natalAscendantLongitude: 20,
      transitLongitudes: { ['PLUTO' as Planet]: 100 }
    })).toThrow('Unknown transit planet: PLUTO');
  });

  it('should correctly sweep through all 12 whole-sign houses (0° to 330° transit longitudes)', () => {
    for (let i = 0; i < 12; i++) {
      const transitLong = i * 30;
      const expectedHouse = i + 1;
      const analysis = calculateTransit({
        at: '2026-08-08T12:00:00Z',
        natalMoonLongitude: 0.0, // Aries
        natalAscendantLongitude: 0.0, // Aries
        transitLongitudes: {
          [Planet.SATURN]: transitLong
        }
      });

      const res = analysis.results![Planet.SATURN];
      expect(res).toBeDefined();
      expect(res!.housePosition!.fromMoon).toBe(expectedHouse);
    }
  });

  it('validates against PR-037 golden validation vector (Saturn Gochara in Pisces)', () => {
    const analysis = calculateTransit({
      at: '2026-08-08T12:00:00Z',
      natalMoonLongitude: 45.0,
      natalAscendantLongitude: 270.0,
      transitLongitudes: {
        [Planet.SATURN]: 345.0
      }
    });

    const saturn = analysis.results![Planet.SATURN]!;
    expect(saturn.position!.sign).toBe(Sign.PISCES);
    expect(saturn.housePosition!.fromMoon).toBe(11);
    expect(saturn.housePosition!.fromAscendant).toBe(3);
  });

  it('calculates current real-time transit longitudes for all 9 planets via transitEphemeris', () => {
    const now = new Date('2026-08-08T12:00:00Z');
    const transits = calculateCurrentTransitLongitudes(now);
    expect(Object.keys(transits).length).toBe(9);
    expect(transits[Planet.SUN]).toBeGreaterThanOrEqual(0);
    expect(transits[Planet.SUN]).toBeLessThan(360);
  });
});
