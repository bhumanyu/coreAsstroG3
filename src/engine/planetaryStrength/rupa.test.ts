import { describe, it, expect } from 'vitest';
import { shastiamsaToRupa, rupaToShastiamsa } from './rupa';

describe('Rupa Conversion Helpers (P-11)', () => {
  describe('shastiamsaToRupa', () => {
    it('converts 60 Shastiamsas to 1.00 Rupa', () => {
      expect(shastiamsaToRupa(60)).toBe(1.0);
    });

    it('converts 390 Shastiamsas to 6.50 Rupa', () => {
      expect(shastiamsaToRupa(390)).toBe(6.5);
    });

    it('converts 360 Shastiamsas to 6.00 Rupa', () => {
      expect(shastiamsaToRupa(360)).toBe(6.0);
    });

    it('converts 420 Shastiamsas to 7.00 Rupa', () => {
      expect(shastiamsaToRupa(420)).toBe(7.0);
    });

    it('converts 0 Shastiamsas to 0.00 Rupa', () => {
      expect(shastiamsaToRupa(0)).toBe(0.0);
    });

    it('supports negative values correctly', () => {
      expect(shastiamsaToRupa(-60)).toBe(-1.0);
      expect(shastiamsaToRupa(-15)).toBe(-0.25);
    });

    it('throws TypeError for non-finite or invalid inputs', () => {
      expect(() => shastiamsaToRupa(NaN)).toThrow(TypeError);
      expect(() => shastiamsaToRupa(Infinity)).toThrow(TypeError);
      expect(() => shastiamsaToRupa(-Infinity)).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => shastiamsaToRupa('60')).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => shastiamsaToRupa(null)).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => shastiamsaToRupa(undefined)).toThrow(TypeError);
    });
  });

  describe('rupaToShastiamsa', () => {
    it('converts 1.00 Rupa to 60.00 Shastiamsas', () => {
      expect(rupaToShastiamsa(1.0)).toBe(60.0);
    });

    it('converts 6.50 Rupa to 390.00 Shastiamsas', () => {
      expect(rupaToShastiamsa(6.5)).toBe(390.0);
    });

    it('converts 0.00 Rupa to 0.00 Shastiamsas', () => {
      expect(rupaToShastiamsa(0.0)).toBe(0.0);
    });

    it('supports negative values correctly', () => {
      expect(rupaToShastiamsa(-1.0)).toBe(-60.0);
      expect(rupaToShastiamsa(-0.25)).toBe(-15.0);
    });

    it('throws TypeError for non-finite or invalid inputs', () => {
      expect(() => rupaToShastiamsa(NaN)).toThrow(TypeError);
      expect(() => rupaToShastiamsa(Infinity)).toThrow(TypeError);
      expect(() => rupaToShastiamsa(-Infinity)).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => rupaToShastiamsa('6.5')).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => rupaToShastiamsa(null)).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => rupaToShastiamsa(undefined)).toThrow(TypeError);
    });
  });
});
