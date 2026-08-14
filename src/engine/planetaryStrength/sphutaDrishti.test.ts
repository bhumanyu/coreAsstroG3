import { describe, it, expect } from 'vitest';
import { Planet } from '../../types';
import { calculateSphutaDrishti, calculateGeneralSaravaliDrishti } from './sphutaDrishti';

describe('Sphuta Drishti Engine (P-10 Aspectual Strength Geometry)', () => {
  describe('1. Default General Saravali Curve', () => {
    it('should calculate correct values across all 30-degree intervals for Sun', () => {
      // [0, 30) -> 0
      expect(calculateSphutaDrishti(Planet.SUN, 0, 0).value).toBeCloseTo(0, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 15).value).toBeCloseTo(0, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 29.99).value).toBeCloseTo(0, 6);

      // [30, 60) -> (a - 30) / 2
      expect(calculateSphutaDrishti(Planet.SUN, 0, 30).value).toBeCloseTo(0, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 45).value).toBeCloseTo(7.5, 6);

      // [60, 90) -> a - 45
      expect(calculateSphutaDrishti(Planet.SUN, 0, 60).value).toBeCloseTo(15, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 75).value).toBeCloseTo(30, 6);

      // [90, 120) -> 30 + (120 - a) / 2
      expect(calculateSphutaDrishti(Planet.SUN, 0, 90).value).toBeCloseTo(45, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 105).value).toBeCloseTo(37.5, 6);

      // [120, 150) -> 150 - a
      expect(calculateSphutaDrishti(Planet.SUN, 0, 120).value).toBeCloseTo(30, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 135).value).toBeCloseTo(15, 6);

      // [150, 180) -> 2 * (a - 150)
      expect(calculateSphutaDrishti(Planet.SUN, 0, 150).value).toBeCloseTo(0, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 165).value).toBeCloseTo(30, 6);

      // [180, 300) -> (300 - a) / 2
      expect(calculateSphutaDrishti(Planet.SUN, 0, 180).value).toBeCloseTo(60, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 210).value).toBeCloseTo(45, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 240).value).toBeCloseTo(30, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 270).value).toBeCloseTo(15, 6);

      // [300, 360) -> 0
      expect(calculateSphutaDrishti(Planet.SUN, 0, 300).value).toBeCloseTo(0, 6);
      expect(calculateSphutaDrishti(Planet.SUN, 0, 330).value).toBeCloseTo(0, 6);
    });

    it('should produce identical general curves for Moon, Mercury, and Venus', () => {
      const defaultPlanets = [Planet.MOON, Planet.MERCURY, Planet.VENUS];
      for (const p of defaultPlanets) {
        expect(calculateSphutaDrishti(p, 100, 280).value).toBeCloseTo(60, 6); // 180° aspect
        expect(calculateSphutaDrishti(p, 50, 140).value).toBeCloseTo(45, 6);  // 90° aspect
        expect(calculateSphutaDrishti(p, 0, 60).value).toBeCloseTo(15, 6);    // 60° aspect
        expect(calculateSphutaDrishti(p, 0, 150).value).toBeCloseTo(0, 6);    // 150° aspect
        expect(calculateSphutaDrishti(p, 0, 320).value).toBeCloseTo(0, 6);    // 320° aspect
      }
    });
  });

  describe('2. Mars Special Aspect Overrides (4th & 8th Houses)', () => {
    it('should calculate Mars 4th house curve in [90, 120) and [120, 150)', () => {
      // [90, 120) -> 45 + (a - 90)/2
      expect(calculateSphutaDrishti(Planet.MARS, 0, 90).value).toBeCloseTo(45, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 100).value).toBeCloseTo(50, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 110).value).toBeCloseTo(55, 6);

      // Exact 120° boundary -> 60
      expect(calculateSphutaDrishti(Planet.MARS, 0, 120).value).toBeCloseTo(60, 6);

      // [120, 150) -> 2 * (150 - a)
      expect(calculateSphutaDrishti(Planet.MARS, 0, 135).value).toBeCloseTo(30, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 150).value).toBeCloseTo(0, 6);
    });

    it('should calculate Mars 8th house curve in [180, 210) and [210, 240)', () => {
      // [180, 210) -> full aspect of 60
      expect(calculateSphutaDrishti(Planet.MARS, 0, 180).value).toBeCloseTo(60, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 195).value).toBeCloseTo(60, 6);

      // Exact 210° boundary -> 60
      expect(calculateSphutaDrishti(Planet.MARS, 0, 210).value).toBeCloseTo(60, 6);

      // [210, 240) -> 270 - a
      expect(calculateSphutaDrishti(Planet.MARS, 0, 220).value).toBeCloseTo(50, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 230).value).toBeCloseTo(40, 6);

      // At 240° -> (300 - 240) / 2 = 30
      expect(calculateSphutaDrishti(Planet.MARS, 0, 240).value).toBeCloseTo(30, 6);
    });

    it('should use general curve for Mars in non-override intervals', () => {
      expect(calculateSphutaDrishti(Planet.MARS, 0, 45).value).toBeCloseTo(7.5, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 60).value).toBeCloseTo(15, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 270).value).toBeCloseTo(15, 6);
      expect(calculateSphutaDrishti(Planet.MARS, 0, 315).value).toBeCloseTo(0, 6);
    });
  });

  describe('3. Jupiter Special Aspect Overrides (5th & 9th Houses)', () => {
    it('should calculate Jupiter 5th house curve in [90, 120) and [120, 150)', () => {
      // [90, 120) -> 45 + (a - 90)/2
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 90).value).toBeCloseTo(45, 6);
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 105).value).toBeCloseTo(52.5, 6);

      // Peak at 120° -> 60
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 120).value).toBeCloseTo(60, 6);

      // [120, 150) -> 2 * (150 - a)
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 135).value).toBeCloseTo(30, 6);
      // Exact boundary 150° -> 0
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 150).value).toBeCloseTo(0, 6);
    });

    it('should calculate Jupiter 9th house curve in [210, 240) and [240, 270)', () => {
      // [210, 240) -> 45 + (a - 210)/2
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 210).value).toBeCloseTo(45, 6);
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 225).value).toBeCloseTo(52.5, 6);

      // Peak at 240° -> 60
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 240).value).toBeCloseTo(60, 6);

      // (240, 270) -> 15 + 2 * (270 - a) / 3
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 255).value).toBeCloseTo(25, 6);
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 270).value).toBeCloseTo(15, 6);
    });

    it('should use general curve for Jupiter at 180 degrees', () => {
      expect(calculateSphutaDrishti(Planet.JUPITER, 0, 180).value).toBeCloseTo(60, 6);
    });
  });

  describe('4. Saturn Special Aspect Overrides (3rd & 10th Houses)', () => {
    it('should calculate Saturn 3rd house curve in [30, 60) and [60, 90)', () => {
      // [30, 60) -> (a - 30) * 2
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 30).value).toBeCloseTo(0, 6);
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 45).value).toBeCloseTo(30, 6);

      // Exact 60° boundary -> 60
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 60).value).toBeCloseTo(60, 6);

      // [60, 90) -> 45 + (90 - a)/2
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 75).value).toBeCloseTo(52.5, 6);
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 90).value).toBeCloseTo(45, 6);
    });

    it('should calculate Saturn 10th house curve in [210, 240), [240, 270), and [270, 300)', () => {
      // [210, 240) -> 45 + (a - 210)/2
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 210).value).toBeCloseTo(45, 6);
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 225).value).toBeCloseTo(52.5, 6);

      // [240, 270) -> a - 210
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 240).value).toBeCloseTo(30, 6);
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 255).value).toBeCloseTo(45, 6);

      // Exact 270° boundary -> 60
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 270).value).toBeCloseTo(60, 6);

      // [270, 300) -> 2 * (300 - a)
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 285).value).toBeCloseTo(30, 6);
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 300).value).toBeCloseTo(0, 6);

      // [300, 330) -> 0
      expect(calculateSphutaDrishti(Planet.SATURN, 0, 315).value).toBeCloseTo(0, 6);
    });
  });

  describe('5. Directional Longitude & Circular Wrap-Around', () => {
    it('should correctly resolve circular wrap-around angles across 0/360 boundary', () => {
      // Source at 350°, target at 170° -> (170 - 350 + 360) = 180° -> 60
      const res1 = calculateSphutaDrishti(Planet.SUN, 350, 170);
      expect(res1.angle).toBeCloseTo(180, 6);
      expect(res1.value).toBeCloseTo(60, 6);

      // Source at 170°, target at 350° -> (350 - 170) = 180° -> 60
      const res2 = calculateSphutaDrishti(Planet.SUN, 170, 350);
      expect(res2.angle).toBeCloseTo(180, 6);
      expect(res2.value).toBeCloseTo(60, 6);

      // Source at 359°, target at 1° -> 2° -> 0
      const res3 = calculateSphutaDrishti(Planet.SUN, 359, 1);
      expect(res3.angle).toBeCloseTo(2, 6);
      expect(res3.value).toBeCloseTo(0, 6);

      // Source at 1°, target at 359° -> 358° -> 0
      const res4 = calculateSphutaDrishti(Planet.SUN, 1, 359);
      expect(res4.angle).toBeCloseTo(358, 6);
      expect(res4.value).toBeCloseTo(0, 6);
    });
  });

  describe('6. Immutability & Validation', () => {
    it('should return frozen results', () => {
      const res = calculateSphutaDrishti(Planet.JUPITER, 45, 165);
      expect(Object.isFrozen(res)).toBe(true);
      expect(res.ruleId).toBe('SPHUTA_DRISHTI_JUPITER');
      expect(typeof res.reason).toBe('string');
    });

    it('should throw on invalid longitude inputs', () => {
      expect(() => calculateSphutaDrishti(Planet.SUN, NaN, 100)).toThrow(TypeError);
      expect(() => calculateSphutaDrishti(Planet.SUN, 100, Infinity)).toThrow(TypeError);
      expect(() => calculateSphutaDrishti(Planet.SUN, '100' as unknown as number, 50)).toThrow(TypeError);
    });
  });
});
