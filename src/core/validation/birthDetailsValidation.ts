import type { BirthDetails } from '../../types';
import { AyanamsaType } from '../../types';
import { parseUtcDate } from '../../engine/solarTime';

export interface BirthValidationError {
  readonly field: 'latitude' | 'longitude' | 'dateTimeStr' | 'timeZone' | 'ayanamsa';
  readonly code: string;
  readonly message: string;
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

  // Validate dateTimeStr using existing parseUtcDate
  try {
    parseUtcDate(birth.dateTimeStr);
  } catch (e) {
    errors.push({
      field: 'dateTimeStr',
      code: 'INVALID_DATETIME',
      message: `Invalid birth datetime: ${e instanceof Error ? e.message : 'Unknown error'}`
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
