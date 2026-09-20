import { describe, it, expect } from 'vitest';
import { validateBirthDetails, assertValidBirthDetails } from './birthDetailsValidation';
import { BirthDetails, AyanamsaType } from '../../types';

describe('validateBirthDetails', () => {
  describe('latitude validation', () => {
    it('accepts valid latitude: 90, -90, 0', () => {
      const validLatitudes = [90, -90, 0, 45.5, -45.5];
      for (const lat of validLatitudes) {
        const birth: BirthDetails = {
          latitude: lat,
          longitude: 0,
          timeZone: 'UTC',
          ayanamsa: AyanamsaType.LAHIRI,
          dateTimeStr: '2024-01-01T12:00:00Z'
        };
        const errors = validateBirthDetails(birth);
        expect(errors.filter(e => e.field === 'latitude')).toHaveLength(0);
      }
    });

    it('rejects invalid latitude: 90.0001, -90.0001, NaN, Infinity', () => {
      const invalidLatitudes = [90.0001, -90.0001, NaN, Infinity, -Infinity];
      for (const lat of invalidLatitudes) {
        const birth: BirthDetails = {
          latitude: lat,
          longitude: 0,
          timeZone: 'UTC',
          ayanamsa: AyanamsaType.LAHIRI,
          dateTimeStr: '2024-01-01T12:00:00Z'
        };
        const errors = validateBirthDetails(birth);
        expect(errors.filter(e => e.field === 'latitude')).toHaveLength(1);
      }
    });
  });

  describe('longitude validation', () => {
    it('accepts valid longitude: 180, -180, 0', () => {
      const validLongitudes = [180, -180, 0, 45.5, -45.5];
      for (const lon of validLongitudes) {
        const birth: BirthDetails = {
          latitude: 0,
          longitude: lon,
          timeZone: 'UTC',
          ayanamsa: AyanamsaType.LAHIRI,
          dateTimeStr: '2024-01-01T12:00:00Z'
        };
        const errors = validateBirthDetails(birth);
        expect(errors.filter(e => e.field === 'longitude')).toHaveLength(0);
      }
    });

    it('rejects invalid longitude: 180.0001, -180.0001, NaN, Infinity', () => {
      const invalidLongitudes = [180.0001, -180.0001, NaN, Infinity, -Infinity];
      for (const lon of invalidLongitudes) {
        const birth: BirthDetails = {
          latitude: 0,
          longitude: lon,
          timeZone: 'UTC',
          ayanamsa: AyanamsaType.LAHIRI,
          dateTimeStr: '2024-01-01T12:00:00Z'
        };
        const errors = validateBirthDetails(birth);
        expect(errors.filter(e => e.field === 'longitude')).toHaveLength(1);
      }
    });
  });

  describe('dateTimeStr validation', () => {
    it('accepts valid datetime: 2024-01-01T12:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(0);
    });

    it('rejects invalid string', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: 'invalid-date'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects empty string', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: ''
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects invalid calendar date', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-13-01T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects timezone-less datetime', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:00:00'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('accepts valid leap year date: 2024-02-29T12:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-02-29T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(0);
    });

    it('rejects invalid leap year date: 2023-02-29T12:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2023-02-29T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects February 30: 2024-02-30T12:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-02-30T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects February 31: 2024-02-31T12:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-02-31T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects April 31: 2024-04-31T12:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-04-31T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects hour 24: 2024-01-01T24:00:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T24:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects minute 60: 2024-01-01T12:60:00Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:60:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });

    it('rejects second 60: 2024-01-01T12:00:60Z', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:00:60Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'dateTimeStr')).toHaveLength(1);
    });
  });

  describe('timeZone validation', () => {
    it('accepts valid timezones: UTC, Asia/Kolkata, America/New_York, Europe/London', () => {
      const validTimezones = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London'];
      for (const tz of validTimezones) {
        const birth: BirthDetails = {
          latitude: 0,
          longitude: 0,
          timeZone: tz,
          ayanamsa: AyanamsaType.LAHIRI,
          dateTimeStr: '2024-01-01T12:00:00Z'
        };
        const errors = validateBirthDetails(birth);
        expect(errors.filter(e => e.field === 'timeZone')).toHaveLength(0);
      }
    });

    it('rejects empty string', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: '',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'timeZone')).toHaveLength(1);
    });

    it('rejects INVALID_ZONE', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'INVALID_ZONE',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'timeZone')).toHaveLength(1);
    });

    it('rejects Asia/DoesNotExist', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'Asia/DoesNotExist',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '2024-01-01T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'timeZone')).toHaveLength(1);
    });
  });

  describe('ayanamsa validation', () => {
    it('accepts every AyanamsaType value', () => {
      const ayanamsaTypes = Object.values(AyanamsaType);
      for (const ayanamsa of ayanamsaTypes) {
        const birth: BirthDetails = {
          latitude: 0,
          longitude: 0,
          timeZone: 'UTC',
          ayanamsa,
          dateTimeStr: '2024-01-01T12:00:00Z'
        };
        const errors = validateBirthDetails(birth);
        expect(errors.filter(e => e.field === 'ayanamsa')).toHaveLength(0);
      }
    });

    it('rejects unknown runtime value', () => {
      const birth: BirthDetails = {
        latitude: 0,
        longitude: 0,
        timeZone: 'UTC',
        ayanamsa: 'UNKNOWN_AYANAMSA' as unknown as BirthDetails['ayanamsa'],
        dateTimeStr: '2024-01-01T12:00:00Z'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.filter(e => e.field === 'ayanamsa')).toHaveLength(1);
    });
  });

  describe('comprehensive validation', () => {
    it('returns no errors for valid birth details', () => {
      const birth: BirthDetails = {
        latitude: 28.6139,
        longitude: 77.2090,
        timeZone: 'Asia/Kolkata',
        ayanamsa: AyanamsaType.LAHIRI,
        dateTimeStr: '1988-05-08T09:30:00+05:30'
      };
      const errors = validateBirthDetails(birth);
      expect(errors).toHaveLength(0);
    });

    it('returns multiple errors for invalid birth details', () => {
      const birth: BirthDetails = {
        latitude: NaN,
        longitude: 500,
        timeZone: 'INVALID_ZONE',
        ayanamsa: 'UNKNOWN' as unknown as BirthDetails['ayanamsa'],
        dateTimeStr: 'invalid-date'
      };
      const errors = validateBirthDetails(birth);
      expect(errors.length).toBeGreaterThan(1);
      expect(errors.some(e => e.field === 'latitude')).toBe(true);
      expect(errors.some(e => e.field === 'longitude')).toBe(true);
      expect(errors.some(e => e.field === 'timeZone')).toBe(true);
      expect(errors.some(e => e.field === 'ayanamsa')).toBe(true);
      expect(errors.some(e => e.field === 'dateTimeStr')).toBe(true);
    });
  });
});

describe('assertValidBirthDetails', () => {
  it('does not throw for valid birth details', () => {
    const birth: BirthDetails = {
      latitude: 28.6139,
      longitude: 77.2090,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1988-05-08T09:30:00+05:30'
    };
    expect(() => assertValidBirthDetails(birth)).not.toThrow();
  });

  it('throws for invalid birth details', () => {
    const birth: BirthDetails = {
      latitude: NaN,
      longitude: 500,
      timeZone: 'INVALID_ZONE',
      ayanamsa: 'UNKNOWN' as unknown as BirthDetails['ayanamsa'],
      dateTimeStr: 'invalid-date'
    };
    expect(() => assertValidBirthDetails(birth)).toThrow('Invalid birth details');
  });

  it('aggregates multiple error messages', () => {
    const birth: BirthDetails = {
      latitude: NaN,
      longitude: 500,
      timeZone: 'INVALID_ZONE',
      ayanamsa: 'UNKNOWN' as unknown as BirthDetails['ayanamsa'],
      dateTimeStr: 'invalid-date'
    };
    expect(() => assertValidBirthDetails(birth)).toThrow(/latitude.*longitude.*timeZone.*ayanamsa.*dateTimeStr/);
  });
});
