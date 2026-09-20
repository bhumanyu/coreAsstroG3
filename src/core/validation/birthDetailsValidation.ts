import type { BirthDetails } from '../../types';
import { AyanamsaType } from '../../types';
import { parseUtcDate } from '../../engine/solarTime';

export interface BirthValidationError {
  readonly field: 'latitude' | 'longitude' | 'dateTimeStr' | 'timeZone' | 'ayanamsa';
  readonly code: string;
  readonly message: string;
}

/**
 * Validates ISO datetime components strictly (calendar correctness and time ranges).
 * Returns a BirthValidationError if any component is invalid, null otherwise.
 * This helper can be used for both UTC-suffixed strings and local wall-clock strings.
 */
export function validateIsoDateTimeComponents(dateTimeStr: string): BirthValidationError | null {
  // Accept both full ISO with offset (Z or ±HH:MM) and local wall-clock format (no offset)
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/;
  const match = dateTimeStr.match(isoRegex);

  if (!match) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: 'Invalid ISO datetime format'
    };
  }

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr, offset] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const second = secondStr ? parseInt(secondStr, 10) : 0;

  // Validate month: 1-12
  if (month < 1 || month > 12) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid month: ${month}. Must be between 1 and 12`
    };
  }

  // Validate day within correct number of days for that month and year
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Leap year logic: divisible by 4 and (not by 100 or by 400)
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeapYear && month === 2) {
    daysInMonth[1] = 29;
  }

  if (day < 1 || day > daysInMonth[month - 1]) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid day: ${day}. Must be between 1 and ${daysInMonth[month - 1]} for month ${month} and year ${year}`
    };
  }

  // Validate hour: 0-23
  if (hour < 0 || hour > 23) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid hour: ${hour}. Must be between 0 and 23`
    };
  }

  // Validate minute: 0-59
  if (minute < 0 || minute > 59) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid minute: ${minute}. Must be between 0 and 59`
    };
  }

  // Validate second: 0-59
  if (second < 0 || second > 59) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid second: ${second}. Must be between 0 and 59`
    };
  }

  // Validate offset format (already validated by regex, but ensure it's not malformed)
  // Offset is optional for local wall-clock strings, but if present must be valid
  if (offset && offset !== 'Z' && !/^[+-]\d{2}:\d{2}$/.test(offset)) {
    return {
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid timezone offset: ${offset}`
    };
  }

  return null;
}

/**
 * Validates birth details according to P0-09 specification.
 * Returns an array of validation errors (empty if valid).
 */
export function validateBirthDetails(birth: BirthDetails): readonly BirthValidationError[] {
  const errors: BirthValidationError[] = [];

  // Validate latitude: must be finite and -90 <= lat <= 90
  if (!Number.isFinite(birth.latitude)) {
    errors.push({
      field: 'latitude',
      code: 'INVALID_LATITUDE',
      message: 'Latitude must be a finite number'
    });
  } else if (birth.latitude < -90 || birth.latitude > 90) {
    errors.push({
      field: 'latitude',
      code: 'LATITUDE_OUT_OF_RANGE',
      message: `Latitude must be between -90 and 90, got ${birth.latitude}`
    });
  }

  // Validate longitude: must be finite and -180 <= lon <= 180
  if (!Number.isFinite(birth.longitude)) {
    errors.push({
      field: 'longitude',
      code: 'INVALID_LONGITUDE',
      message: 'Longitude must be a finite number'
    });
  } else if (birth.longitude < -180 || birth.longitude > 180) {
    errors.push({
      field: 'longitude',
      code: 'LONGITUDE_OUT_OF_RANGE',
      message: `Longitude must be between -180 and 180, got ${birth.longitude}`
    });
  }

  // Validate dateTimeStr: first strict component validation, then parseUtcDate
  const componentError = validateIsoDateTimeComponents(birth.dateTimeStr);
  if (componentError) {
    errors.push(componentError);
  } else {
    try {
      parseUtcDate(birth.dateTimeStr);
    } catch (e) {
      errors.push({
        field: 'dateTimeStr',
        code: 'INVALID_DATETIME',
        message: `Invalid birth datetime: ${e instanceof Error ? e.message : 'Unknown error'}`
      });
    }
  }

  // Validate timeZone: must be non-empty string and valid IANA identifier
  if (!birth.timeZone || typeof birth.timeZone !== 'string' || birth.timeZone.trim() === '') {
    errors.push({
      field: 'timeZone',
      code: 'INVALID_TIMEZONE',
      message: 'Timezone must be a non-empty string'
    });
  } else {
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: birth.timeZone });
    } catch (e) {
      errors.push({
        field: 'timeZone',
        code: 'INVALID_TIMEZONE',
        message: `Invalid IANA timezone identifier: ${birth.timeZone}`
      });
    }
  }

  // Validate ayanamsa: must be one of the AyanamsaType enum values
  const ayanamsaValues = Object.values(AyanamsaType);
  const isValidAyanamsa = ayanamsaValues.includes(birth.ayanamsa as any);
  if (!isValidAyanamsa) {
    errors.push({
      field: 'ayanamsa',
      code: 'INVALID_AYANAMSA',
      message: `Invalid ayanamsa value: ${birth.ayanamsa}. Must be one of: ${ayanamsaValues.join(', ')}`
    });
  }

  return errors;
}

/**
 * Asserts that birth details are valid. Throws an Error with aggregated messages if invalid.
 */
export function assertValidBirthDetails(birth: BirthDetails): void {
  const errors = validateBirthDetails(birth);
  if (errors.length > 0) {
    const messages = errors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Invalid birth details: ${messages}`);
  }
}
