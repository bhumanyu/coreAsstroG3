import { describe, expect, it } from 'vitest';
import { Sign } from '../../types';
import { getVargaSign } from './varga';

const HALF_HORA = 15;
const FLOAT_EPSILON = 1e-9;
const SIGN_SPAN = 30;

const oddSignSequence = [Sign.ARIES, Sign.GEMINI, Sign.LEO, Sign.LIBRA, Sign.SAGITTARIUS, Sign.AQUARIUS] as const;
const evenSignSequence = [Sign.TAURUS, Sign.CANCER, Sign.VIRGO, Sign.SCORPIO, Sign.CAPRICORN, Sign.PISCES] as const;

function sourceSignStart(sign: Sign): number {
  const allSigns = Object.values(Sign);
  const index = allSigns.indexOf(sign);
  if (index < 0) throw new Error(`Unknown sign: ${sign}`);
  return index * SIGN_SPAN;
}

describe('D2 Hora deterministic calculation contract', () => {
  it('assigns the first and second 15-degree halves for all twelve signs', () => {
    for (const sign of oddSignSequence) {
      const start = sourceSignStart(sign);
      expect(getVargaSign(start + 7.5, 'D2')).toBe(Sign.LEO);
      expect(getVargaSign(start + 22.5, 'D2')).toBe(Sign.CANCER);
    }

    for (const sign of evenSignSequence) {
      const start = sourceSignStart(sign);
      expect(getVargaSign(start + 7.5, 'D2')).toBe(Sign.CANCER);
      expect(getVargaSign(start + 22.5, 'D2')).toBe(Sign.LEO);
    }
  });

  it('uses half-open intervals: the exact 15-degree boundary belongs to the second half', () => {
    for (let signIndex = 0; signIndex < 12; signIndex += 1) {
      const start = signIndex * SIGN_SPAN;
      const first = signIndex % 2 === 0 ? Sign.LEO : Sign.CANCER;
      const second = signIndex % 2 === 0 ? Sign.CANCER : Sign.LEO;

      expect(getVargaSign(start + HALF_HORA - FLOAT_EPSILON, 'D2')).toBe(first);
      expect(getVargaSign(start + HALF_HORA, 'D2')).toBe(second);
      expect(getVargaSign(start + HALF_HORA + FLOAT_EPSILON, 'D2')).toBe(second);
    }
  });

  it('assigns each exact sign ingress to the first half of the entering sign', () => {
    for (let signIndex = 0; signIndex < 12; signIndex += 1) {
      const ingress = signIndex * SIGN_SPAN;
      const isOdd = signIndex % 2 === 0;
      expect(getVargaSign(ingress, 'D2')).toBe(isOdd ? Sign.LEO : Sign.CANCER);
      expect(getVargaSign(ingress + FLOAT_EPSILON, 'D2')).toBe(isOdd ? Sign.LEO : Sign.CANCER);
    }
  });

  it('normalizes circular longitudes below zero and at or above 360 degrees', () => {
    expect(getVargaSign(-FLOAT_EPSILON, 'D2')).toBe(Sign.LEO);
    expect(getVargaSign(0, 'D2')).toBe(Sign.LEO);
    expect(getVargaSign(360, 'D2')).toBe(Sign.LEO);
    expect(getVargaSign(360 + 15, 'D2')).toBe(Sign.CANCER);
    expect(getVargaSign(720 + 15, 'D2')).toBe(Sign.CANCER);
  });

  it('is deterministic for repeated evaluations of identical inputs', () => {
    const longitudes = [-720.25, -0.000001, 0, 14.999999, 15, 29.999999, 30, 44.999999, 45, 359.999999, 360, 720.5];
    for (const longitude of longitudes) {
      const first = getVargaSign(longitude, 'D2');
      const second = getVargaSign(longitude, 'D2');
      expect(second).toBe(first);
    }
  });

  it('does not leak D2 behavior into other varga mappings', () => {
    expect(getVargaSign(10, 'D3')).toBe(Sign.LEO);
    expect(getVargaSign(10, 'D7')).toBe(Sign.GEMINI);
    expect(getVargaSign(10, 'D9')).toBe(Sign.GEMINI);
  });
});
