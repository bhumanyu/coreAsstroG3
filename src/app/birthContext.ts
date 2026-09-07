import type { BirthDetails } from '../types';

export interface BirthContext {
  name?: string;
  placeOfBirth?: string;
  formattedDate?: string;
  zoneLabel?: string;
  ayanamsa?: string;
}

export function buildBirthContext(birthDetails: BirthDetails): BirthContext;
export function buildBirthContext(birthDetails?: BirthDetails): BirthContext | undefined;
export function buildBirthContext(birthDetails?: BirthDetails): BirthContext | undefined {
  if (!birthDetails) return undefined;

  const tz = birthDetails.timeZone || 'UTC';
  const isoClean =
    birthDetails.dateTimeStr &&
    (birthDetails.dateTimeStr.includes('Z') ||
      birthDetails.dateTimeStr.includes('+') ||
      (birthDetails.dateTimeStr.length > 10 && birthDetails.dateTimeStr.slice(10).includes('-')))
      ? birthDetails.dateTimeStr
      : birthDetails.dateTimeStr
        ? birthDetails.dateTimeStr + 'Z'
        : new Date().toISOString();

  let formattedDate = '';
  try {
    formattedDate = new Date(isoClean).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz
    });
  } catch {
    formattedDate = new Date(isoClean).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  const zoneLabel =
    {
      UTC: 'UTC',
      'Asia/Kolkata': 'IST',
      'America/New_York': 'EST',
      'Europe/London': 'GMT',
      'Asia/Tokyo': 'JST'
    }[tz] || tz;

  return {
    name: birthDetails.name || 'Birth Chart',
    placeOfBirth: birthDetails.placeOfBirth,
    formattedDate,
    zoneLabel,
    ayanamsa: birthDetails.ayanamsa
  };
}
