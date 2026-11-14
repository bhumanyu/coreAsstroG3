import { AyanamsaType } from '../types';
import { NAKSHATRAS_METADATA } from '../data/astroData';
import { calculateSiderealLuminaries } from './astroEngine';
import { calculateSunriseSunsetForLocalDate, type LocalCivilDate } from './solarTime';
import { normalizeDegree } from './nakshatraUtils';

export interface PanchangLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
}

export interface Panchang {
  readonly referenceTime: Date;
  readonly sunrise: Date | null;
  readonly sunset: Date | null;
  readonly tithi: {
    readonly number: number;
    readonly name: string;
    readonly paksha: 'Shukla' | 'Krishna';
  };
  readonly nakshatra: {
    readonly name: string;
    readonly pada: number;
  };
  readonly yoga: string;
  readonly karana: string;
  readonly vaar: string;
}

export const DEFAULT_PANCHANG_LOCATION: PanchangLocation = {
  latitude: 28.6139,
  longitude: 77.209,
  timeZone: 'Asia/Kolkata'
};

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'
] as const;

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
  'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'
] as const;

const MOVING_KARANAS = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'
] as const;

const VAAR_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
] as const;

function getLocalCivilDate(date: Date, timeZone: string): LocalCivilDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((item) => item.type === type)?.value;
    if (!value) throw new Error(`Unable to resolve ${type} for timezone ${timeZone}.`);
    return Number(value);
  };
  return { year: part('year'), month: part('month'), day: part('day') };
}

function getKarana(index: number): string {
  if (index === 0) return 'Kimstughna';
  if (index >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][index - 57];
  return MOVING_KARANAS[(index - 1) % MOVING_KARANAS.length];
}

export function computePanchang(
  date: Date = new Date(),
  location: PanchangLocation = DEFAULT_PANCHANG_LOCATION
): Panchang {
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Panchang date must be a valid Date.');
  }
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90
    || !Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) {
    throw new RangeError('Panchang location must contain valid latitude and longitude coordinates.');
  }

  const localDate = getLocalCivilDate(date, location.timeZone);
  const solarTimes = calculateSunriseSunsetForLocalDate(
    location.latitude,
    location.longitude,
    localDate
  );
  const referenceTime = solarTimes?.sunrise ?? date;
  const { sunLongitude, moonLongitude } = calculateSiderealLuminaries(referenceTime, AyanamsaType.LAHIRI);
  const elongation = normalizeDegree(moonLongitude - sunLongitude);
  const tithiIndex = Math.floor(elongation / 12);
  const tithiNumber = (tithiIndex % 15) + 1;
  const tithiName = tithiNumber === 15
    ? (tithiIndex < 15 ? 'Purnima' : 'Amavasya')
    : TITHI_NAMES[tithiNumber - 1];
  const nakshatraIndex = Math.min(26, Math.floor(moonLongitude / (360 / 27)));
  const yogaIndex = Math.floor(normalizeDegree(sunLongitude + moonLongitude) / (360 / 27));
  const karanaIndex = Math.floor(elongation / 6);
  const weekdayDate = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day));
  const nakshatraName = NAKSHATRAS_METADATA[nakshatraIndex]?.englishName;
  if (!nakshatraName) {
    throw new Error(`Missing nakshatra metadata at index ${nakshatraIndex}.`);
  }

  return {
    referenceTime,
    sunrise: solarTimes?.sunrise ?? null,
    sunset: solarTimes?.sunset ?? null,
    tithi: {
      number: tithiNumber,
      name: tithiName,
      paksha: tithiIndex < 15 ? 'Shukla' : 'Krishna'
    },
    nakshatra: {
      name: nakshatraName,
      pada: Math.floor((moonLongitude % (360 / 27)) / (360 / 108)) + 1
    },
    yoga: YOGA_NAMES[yogaIndex],
    karana: getKarana(karanaIndex),
    vaar: VAAR_NAMES[weekdayDate.getUTCDay()]
  };
}
