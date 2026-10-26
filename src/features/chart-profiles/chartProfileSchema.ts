import type { BirthDetails } from '../../types';
import { AyanamsaType } from '../../types';
import { validateBirthDetails } from '../../core/validation/birthDetailsValidation';

export const CHART_PROFILE_SCHEMA_VERSION = 1;
export const MAX_SAVED_PROFILES = 50;
export const MAX_PROFILE_LABEL_LENGTH = 80;

export interface ChartProfile {
  readonly id: string;
  readonly label: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly birthDetails: BirthDetails;
}

export interface ChartProfileStoreV1 {
  readonly schemaVersion: 1;
  readonly profiles: readonly ChartProfile[];
}

export interface ChartProfileStoreV0 {
  readonly schemaVersion: 0;
  readonly profiles: readonly {
    readonly id: string;
    readonly label: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly birth: BirthDetails;
  }[];
}

export type RecognizedChartProfileStore = ChartProfileStoreV0 | ChartProfileStoreV1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

export function isBirthDetails(value: unknown): value is BirthDetails {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'name', 'placeOfBirth', 'latitude', 'longitude', 'timeZone', 'ayanamsa', 'dateTimeStr'
  ])) return false;
  return typeof value.latitude === 'number'
    && typeof value.longitude === 'number'
    && typeof value.timeZone === 'string'
    && typeof value.dateTimeStr === 'string'
    && (value.name === undefined || typeof value.name === 'string')
    && (value.placeOfBirth === undefined || typeof value.placeOfBirth === 'string')
    && Object.values(AyanamsaType).some((entry) => entry === value.ayanamsa);
}

export function isValidProfileLabel(value: unknown): value is string {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.trim().length <= MAX_PROFILE_LABEL_LENGTH;
}

export function validateProfileBirthDetails(value: unknown): value is BirthDetails {
  return isBirthDetails(value) && validateBirthDetails(value).length === 0;
}

export function isChartProfileStoreV1(value: unknown): value is ChartProfileStoreV1 {
  if (!isRecord(value) || !hasOnlyKeys(value, ['schemaVersion', 'profiles'])
    || value.schemaVersion !== CHART_PROFILE_SCHEMA_VERSION || !Array.isArray(value.profiles)) {
    return false;
  }
  if (value.profiles.length > MAX_SAVED_PROFILES) return false;
  const ids = new Set<string>();
  return value.profiles.every((candidate) => {
    if (!isRecord(candidate) || !hasOnlyKeys(candidate, ['id', 'label', 'createdAt', 'updatedAt', 'birthDetails'])) return false;
    const valid = typeof candidate.id === 'string'
      && candidate.id.trim().length > 0
      && isValidProfileLabel(candidate.label)
      && candidate.label === candidate.label.trim()
      && typeof candidate.createdAt === 'string'
      && Number.isFinite(Date.parse(candidate.createdAt))
      && typeof candidate.updatedAt === 'string'
      && Number.isFinite(Date.parse(candidate.updatedAt))
      && validateProfileBirthDetails(candidate.birthDetails);
    if (!valid || typeof candidate.id !== 'string' || ids.has(candidate.id)) return false;
    ids.add(candidate.id);
    return true;
  });
}

export function isChartProfileStoreV0(value: unknown): value is ChartProfileStoreV0 {
  if (!isRecord(value) || !hasOnlyKeys(value, ['schemaVersion', 'profiles'])
    || value.schemaVersion !== 0 || !Array.isArray(value.profiles)) return false;
  if (value.profiles.length > MAX_SAVED_PROFILES) return false;
  const ids = new Set<string>();
  return value.profiles.every((candidate) => {
    if (!isRecord(candidate) || !hasOnlyKeys(candidate, ['id', 'label', 'createdAt', 'updatedAt', 'birth'])) return false;
    const valid = typeof candidate.id === 'string'
      && candidate.id.trim().length > 0
      && isValidProfileLabel(candidate.label)
      && candidate.label === candidate.label.trim()
      && typeof candidate.createdAt === 'string'
      && Number.isFinite(Date.parse(candidate.createdAt))
      && typeof candidate.updatedAt === 'string'
      && Number.isFinite(Date.parse(candidate.updatedAt))
      && validateProfileBirthDetails(candidate.birth);
    if (!valid || typeof candidate.id !== 'string' || ids.has(candidate.id)) return false;
    ids.add(candidate.id);
    return true;
  });
}

export function copyBirthDetails(birth: BirthDetails): BirthDetails {
  return {
    ...(birth.name === undefined ? {} : { name: birth.name }),
    ...(birth.placeOfBirth === undefined ? {} : { placeOfBirth: birth.placeOfBirth }),
    latitude: birth.latitude,
    longitude: birth.longitude,
    timeZone: birth.timeZone,
    ayanamsa: birth.ayanamsa,
    dateTimeStr: birth.dateTimeStr
  };
}
