import { describe, it, expect } from 'vitest';
import { Sign } from '../../types';
import { getVargaSign } from './varga';

describe('Varga Sign Generator (varga.ts)', () => {
  it('shouldCalculateD1SignCorrectly', () => {
    expect(getVargaSign(15, 'D1')).toBe(Sign.ARIES);
    expect(getVargaSign(45, 'D1')).toBe(Sign.TAURUS);
    expect(getVargaSign(355, 'D1')).toBe(Sign.PISCES);
  });

  it('shouldCalculateD2HoraSignCorrectly', () => {
    // Aries (odd sign): 0-15 Leo, 15-30 Cancer
    expect(getVargaSign(10, 'D2')).toBe(Sign.LEO);
    expect(getVargaSign(20, 'D2')).toBe(Sign.CANCER);

    // Taurus (even sign): 0-15 Cancer, 15-30 Leo
    expect(getVargaSign(40, 'D2')).toBe(Sign.CANCER);
    expect(getVargaSign(50, 'D2')).toBe(Sign.LEO);
  });

  it('shouldCalculateD3DrekkanaSignCorrectly', () => {
    // Aries: 0-10 Aries (1st), 10-20 Leo (5th), 20-30 Sagittarius (9th)
    expect(getVargaSign(5, 'D3')).toBe(Sign.ARIES);
    expect(getVargaSign(15, 'D3')).toBe(Sign.LEO);
    expect(getVargaSign(25, 'D3')).toBe(Sign.SAGITTARIUS);
  });

  it('shouldCalculateD7SaptamsaSignCorrectly', () => {
    // Aries (odd): part 0 -> Aries
    expect(getVargaSign(1, 'D7')).toBe(Sign.ARIES);
    // Taurus (even): part 0 -> 7th from Taurus = Scorpio
    expect(getVargaSign(31, 'D7')).toBe(Sign.SCORPIO);
  });

  it('shouldCalculateD9NavamsaBoundariesCorrectly', () => {
    const NAVAMSA_SPAN = 10 / 3; // 3°20'

    // 1. Full 9-navamsa sequence for Aries (Movable sign, base longitude 0°, starts at Aries)
    const ariesExpected = [
      Sign.ARIES,
      Sign.TAURUS,
      Sign.GEMINI,
      Sign.CANCER,
      Sign.LEO,
      Sign.VIRGO,
      Sign.LIBRA,
      Sign.SCORPIO,
      Sign.SAGITTARIUS
    ];

    for (let i = 0; i < 9; i++) {
      const midPoint = (i + 0.5) * NAVAMSA_SPAN;
      expect(getVargaSign(midPoint, 'D9')).toBe(ariesExpected[i]);
    }

    // Boundary precision tests for Aries
    for (let i = 1; i < 9; i++) {
      const boundary = i * NAVAMSA_SPAN;
      expect(getVargaSign(boundary - 1e-6, 'D9')).toBe(ariesExpected[i - 1]);
      expect(getVargaSign(boundary + 1e-6, 'D9')).toBe(ariesExpected[i]);
    }

    // 2. Fixed sign coverage: Taurus (base longitude 30°, starts at 9th sign from Taurus = Capricorn)
    const taurusBase = 30;
    expect(getVargaSign(taurusBase + 1e-6, 'D9')).toBe(Sign.CAPRICORN);
    expect(getVargaSign(taurusBase + NAVAMSA_SPAN - 1e-6, 'D9')).toBe(Sign.CAPRICORN);
    expect(getVargaSign(taurusBase + NAVAMSA_SPAN + 1e-6, 'D9')).toBe(Sign.AQUARIUS);
    expect(getVargaSign(taurusBase + 2 * NAVAMSA_SPAN - 1e-6, 'D9')).toBe(Sign.AQUARIUS);
    expect(getVargaSign(taurusBase + 2 * NAVAMSA_SPAN + 1e-6, 'D9')).toBe(Sign.PISCES);

    // 3. Dual sign coverage: Gemini (base longitude 60°, starts at 5th sign from Gemini = Libra)
    const geminiBase = 60;
    expect(getVargaSign(geminiBase + 1e-6, 'D9')).toBe(Sign.LIBRA);
    expect(getVargaSign(geminiBase + NAVAMSA_SPAN - 1e-6, 'D9')).toBe(Sign.LIBRA);
    expect(getVargaSign(geminiBase + NAVAMSA_SPAN + 1e-6, 'D9')).toBe(Sign.SCORPIO);
    expect(getVargaSign(geminiBase + 2 * NAVAMSA_SPAN - 1e-6, 'D9')).toBe(Sign.SCORPIO);
    expect(getVargaSign(geminiBase + 2 * NAVAMSA_SPAN + 1e-6, 'D9')).toBe(Sign.SAGITTARIUS);
  });

  it('shouldCalculateD12DwadasamsaSignCorrectly', () => {
    // Aries 0..2.5 -> Aries, 2.5..5 -> Taurus
    expect(getVargaSign(1, 'D12')).toBe(Sign.ARIES);
    expect(getVargaSign(4, 'D12')).toBe(Sign.TAURUS);
  });

  it('shouldCalculateD30TrimsamsaSignCorrectly', () => {
    // Aries (odd): <5 Aries, <10 Aquarius, <18 Sagittarius, <25 Gemini, <30 Libra
    expect(getVargaSign(3, 'D30')).toBe(Sign.ARIES);
    expect(getVargaSign(7, 'D30')).toBe(Sign.AQUARIUS);
    expect(getVargaSign(12, 'D30')).toBe(Sign.SAGITTARIUS);
    expect(getVargaSign(20, 'D30')).toBe(Sign.GEMINI);
    expect(getVargaSign(27, 'D30')).toBe(Sign.LIBRA);

    // Taurus (even): <5 Taurus, <12 Virgo, <20 Pisces, <25 Capricorn, <30 Scorpio
    expect(getVargaSign(33, 'D30')).toBe(Sign.TAURUS);
    expect(getVargaSign(37, 'D30')).toBe(Sign.VIRGO);
    expect(getVargaSign(45, 'D30')).toBe(Sign.PISCES);
    expect(getVargaSign(52, 'D30')).toBe(Sign.CAPRICORN);
    expect(getVargaSign(57, 'D30')).toBe(Sign.SCORPIO);
  });
});
