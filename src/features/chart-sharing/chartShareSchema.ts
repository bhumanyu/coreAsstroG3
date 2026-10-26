import { validateBirthDetails } from '../../core/validation/birthDetailsValidation';
import type { BirthDetails } from '../../types';
import { AyanamsaType } from '../../types';

export interface ChartSharePayloadV1 {
  readonly version: 1;
  readonly dateTimeStr: string;
  readonly timeZone: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly ayanamsa: AyanamsaType;
}

export type ChartShareValidationResult =
  | { readonly ok: true; readonly value: ChartSharePayloadV1 }
  | { readonly ok: false; readonly error: 'INVALID_INPUT' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAyanamsaType(value: unknown): value is AyanamsaType {
  return Object.values(AyanamsaType).some((entry) => entry === value);
}

export function validateChartSharePayload(value: unknown): ChartShareValidationResult {
  if (!isRecord(value)
    || Object.keys(value).some((key) => !['version', 'dateTimeStr', 'timeZone', 'latitude', 'longitude', 'ayanamsa'].includes(key))
    || value.version !== 1
    || typeof value.dateTimeStr !== 'string'
    || typeof value.timeZone !== 'string'
    || typeof value.latitude !== 'number'
    || typeof value.longitude !== 'number'
    || !isAyanamsaType(value.ayanamsa)) {
    return { ok: false, error: 'INVALID_INPUT' };
  }
  const birth: BirthDetails = {
    dateTimeStr: value.dateTimeStr,
    timeZone: value.timeZone,
    latitude: value.latitude,
    longitude: value.longitude,
    ayanamsa: value.ayanamsa
  };
  if (validateBirthDetails(birth).length > 0) return { ok: false, error: 'INVALID_INPUT' };
  return {
    ok: true,
    value: {
      version: 1,
      dateTimeStr: birth.dateTimeStr,
      timeZone: birth.timeZone,
      latitude: birth.latitude,
      longitude: birth.longitude,
      ayanamsa: birth.ayanamsa
    }
  };
}

export function chartSharePayloadToBirthDetails(payload: ChartSharePayloadV1): BirthDetails {
  return {
    dateTimeStr: payload.dateTimeStr,
    timeZone: payload.timeZone,
    latitude: payload.latitude,
    longitude: payload.longitude,
    ayanamsa: payload.ayanamsa
  };
}
