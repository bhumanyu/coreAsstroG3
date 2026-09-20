import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { BirthDetails, AyanamsaType } from '../../types';
import { createProductAnalysisService } from '../../product/analysis/productAnalysisService';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

describe('P0-09 Birth Validation Regression Tests', () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  describe('Test A: invalid coordinates never reach the engine', () => {
    it('invalid latitude (NaN) throws validation error before calculation', () => {
      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        latitude: NaN
      };

      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('Invalid birth details');
      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('latitude');
    });

    it('invalid longitude (out of range) throws validation error before calculation', () => {
      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        longitude: 500
      };

      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('Invalid birth details');
      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('longitude');
    });

    it('invalid coordinates in product analysis result in ERROR status', async () => {
      const service = createProductAnalysisService();
      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        latitude: NaN
      };

      const result = await service.analyze(invalidBirthDetails, {
        asOf: '2024-01-01T00:00:00.000Z',
        includeAiExplanation: false
      });

      expect(result.status).toBe('ERROR');
    });
  });

  describe('Test B: invalid/missing birth date never becomes current time', () => {
    it('empty dateTimeStr throws validation error instead of using current time', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        dateTimeStr: ''
      };

      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('Invalid birth details');
      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('dateTimeStr');
    });

    it('invalid calendar date throws validation error instead of using current time', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        dateTimeStr: '2024-13-01T12:00:00Z'
      };

      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('Invalid birth details');
      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('dateTimeStr');
    });
  });

  describe('Test C: invalid timezone never becomes UTC', () => {
    it('invalid IANA timezone throws validation error instead of silent UTC substitution', () => {
      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        timeZone: 'Asia/DoesNotExist'
      };

      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('Invalid birth details');
      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('timeZone');
    });

    it('empty timezone throws validation error instead of silent UTC substitution', () => {
      const invalidBirthDetails: BirthDetails = {
        ...CANONICAL_BIRTH_DETAILS,
        timeZone: ''
      };

      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('Invalid birth details');
      expect(() => calculateHoroscope(invalidBirthDetails)).toThrow('timeZone');
    });
  });

  describe('Test D: valid input remains semantically equivalent', () => {
    it('CANONICAL_BIRTH_DETAILS produces unchanged horoscope output', () => {
      const result = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      expect(result).toBeDefined();
      expect(result.birthDetails).toEqual(CANONICAL_BIRTH_DETAILS);
      expect(result.rasiChart).toBeDefined();
      expect(result.planetFacts).toBeDefined();
      expect(result.vimshottari).toBeDefined();
    });

    it('valid input with all fields produces successful product analysis', async () => {
      const service = createProductAnalysisService();
      const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
        asOf: '2024-01-01T00:00:00.000Z',
        includeAiExplanation: false
      });

      expect(result.status).toBe('READY');
      expect(result.career).toBeDefined();
      expect(result.wealth).toBeDefined();
    });
  });
});
