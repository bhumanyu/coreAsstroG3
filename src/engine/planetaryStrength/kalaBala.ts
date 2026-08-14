import {
  Planet,
  ShadbalaComponent,
  ShadbalaSubcomponent,
  StrengthComponentStatus,
  PlanetStrengthComponent,
  PlanetaryStrengthEvidence,
  BirthDetails,
  AyanamsaType,
  YuddhaBalaResult
} from '../../types';
import { normalizeDegree } from '../nakshatraUtils';
import {
  getSolarDayDetails,
  getAyanamsaOffset,
  calculateJulianDay,
  getObliquity,
  calculateDeclination,
  findPreviousSolarIngress,
  calculateSunriseSunsetForLocalDate,
  getTimezoneOffsetMinutes,
  type LocalCivilDate,
  type SolarDayDetails,
  parseUtcDate
} from '../solarTime';

export { getTimezoneOffsetMinutes };

export const DIURNAL_PLANETS: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.JUPITER,
  Planet.VENUS
]);

export const NOCTURNAL_PLANETS: readonly Planet[] = Object.freeze([
  Planet.MOON,
  Planet.MARS,
  Planet.SATURN
]);

export const PLANETARY_HORA_SEQUENCE: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.VENUS,
  Planet.MERCURY,
  Planet.MOON,
  Planet.SATURN,
  Planet.JUPITER,
  Planet.MARS
]);

export const WEEKDAY_LORDS: readonly Planet[] = Object.freeze([
  Planet.SUN,     // 0 = Sunday
  Planet.MOON,    // 1 = Monday
  Planet.MARS,    // 2 = Tuesday
  Planet.MERCURY, // 3 = Wednesday
  Planet.JUPITER, // 4 = Thursday
  Planet.VENUS,   // 5 = Friday
  Planet.SATURN   // 6 = Saturday
]);

export const TRIBHAGA_DAY: readonly Planet[] = Object.freeze([
  Planet.MERCURY,
  Planet.SUN,
  Planet.SATURN
]);

export const TRIBHAGA_NIGHT: readonly Planet[] = Object.freeze([
  Planet.MOON,
  Planet.VENUS,
  Planet.MARS
]);

/**
 * Gets the plain local civil weekday (0 = Sun .. 6 = Sat) for a given UTC Date and timezone offset in dateTimeStr.
 */
export function getLocalCivilWeekdayAtInstant(instant: Date, dateTimeStr: string): number {
  const offsetMinutes = getTimezoneOffsetMinutes(dateTimeStr);
  const localMs = instant.getTime() + offsetMinutes * 60 * 1000;
  const localDate = new Date(localMs);
  return localDate.getUTCDay();
}

/**
 * Backward-compatible alias for getLocalCivilWeekdayAtInstant.
 */
export function getLocalCivilWeekday(date: Date, dateTimeStr: string): number {
  return getLocalCivilWeekdayAtInstant(date, dateTimeStr);
}

/**
 * Computes the solar-day-adjusted weekday lord for an ingress instant using actual local sunrise.
 * If ingress < localSunrise on its local civil date, uses previous civil weekday ((weekday + 6) % 7).
 */
export function getSolarAdjustedWeekdayForIngress(
  ingress: Date,
  birthDetails: BirthDetails
): { weekday: number; ingressSunrise: Date } {
  const offsetMinutes = getTimezoneOffsetMinutes(birthDetails.dateTimeStr);
  const localIngressMs = ingress.getTime() + offsetMinutes * 60 * 1000;
  const localIngressDate = new Date(localIngressMs);
  const civilWeekday = localIngressDate.getUTCDay();

  const localDate: LocalCivilDate = {
    year: localIngressDate.getUTCFullYear(),
    month: localIngressDate.getUTCMonth() + 1,
    day: localIngressDate.getUTCDate()
  };

  const solarTimes = calculateSunriseSunsetForLocalDate(birthDetails.latitude, birthDetails.longitude, localDate);
  const ingressSunrise = solarTimes ? solarTimes.sunrise : ingress;

  const weekday = (solarTimes && ingress.getTime() < solarTimes.sunrise.getTime())
    ? (civilWeekday + 6) % 7
    : civilWeekday;

  return { weekday, ingressSunrise };
}

export interface KalaBalaCalculationResult {
  readonly components: readonly PlanetStrengthComponent[];
  readonly evidence: readonly PlanetaryStrengthEvidence[];
  readonly kalaBalaCoreTotal?: number;
}

/**
 * Calculates Natonnata Bala for a planet.
 */
export function calculateNatonnataBala(
  planet: Planet,
  birthInstant: Date,
  solarDay: SolarDayDetails
): { value: number; ratio: number } {
  if (planet === Planet.MERCURY) {
    return { value: 60.0, ratio: 1.0 };
  }

  const isDiurnal = DIURNAL_PLANETS.includes(planet);
  const isDaytime = birthInstant.getTime() >= solarDay.sunrise.getTime() && birthInstant.getTime() < solarDay.sunset.getTime();

  if (isDaytime) {
    const dist = Math.abs(birthInstant.getTime() - solarDay.solarNoon.getTime());
    const halfDay = birthInstant.getTime() < solarDay.solarNoon.getTime()
      ? (solarDay.solarNoon.getTime() - solarDay.sunrise.getTime())
      : (solarDay.sunset.getTime() - solarDay.solarNoon.getTime());
    const ratio = Math.min(1, Math.max(0, dist / halfDay));
    const value = isDiurnal ? (60 - 30 * ratio) : (30 * ratio);
    return { value, ratio };
  } else {
    const dist = Math.abs(birthInstant.getTime() - solarDay.solarMidnight.getTime());
    const halfNight = birthInstant.getTime() < solarDay.solarMidnight.getTime()
      ? (solarDay.solarMidnight.getTime() - solarDay.sunset.getTime())
      : (solarDay.nextSunrise.getTime() - solarDay.solarMidnight.getTime());
    const ratio = Math.min(1, Math.max(0, dist / halfNight));
    const value = !isDiurnal ? (60 - 30 * ratio) : (30 * ratio);
    return { value, ratio };
  }
}

/**
 * Calculates Paksha Bala for a planet.
 */
export function calculatePakshaBala(
  planet: Planet,
  sunSiderealLong: number,
  moonSiderealLong: number
): { value: number; separation: number; beneficBase: number; isBenefic: boolean } {
  const diff = normalizeDegree(moonSiderealLong - sunSiderealLong);
  const separation = diff > 180 ? 360 - diff : diff;
  const beneficBase = separation / 3;

  const benefics = [Planet.JUPITER, Planet.VENUS, Planet.MERCURY, Planet.MOON];
  const isBenefic = benefics.includes(planet);

  let value = isBenefic ? beneficBase : (60 - beneficBase);
  if (planet === Planet.MOON) {
    value = Math.min(60, beneficBase * 2);
  }

  return { value, separation, beneficBase, isBenefic };
}

/**
 * Calculates Tribhaga Bala for a planet.
 * Interval semantics are half-open [start, end), meaning exact boundary instants belong to the next segment.
 */
export interface TribhagaBalaResult {
  value: number;
  activeLord: Planet;
  dayOrNight: 'DAY' | 'NIGHT';
  segmentNumber: number; // 1, 2, or 3
  segmentStart: Date;
  segmentEnd: Date;
}

export function calculateTribhagaBala(
  planet: Planet,
  birthInstant: Date,
  solarDay: SolarDayDetails
): TribhagaBalaResult {
  let activeLord: Planet;
  let dayOrNight: 'DAY' | 'NIGHT';
  let segmentNumber: number;
  let segmentStart: Date;
  let segmentEnd: Date;

  const isDaytime = birthInstant.getTime() >= solarDay.sunrise.getTime() && birthInstant.getTime() < solarDay.sunset.getTime();

  if (isDaytime) {
    dayOrNight = 'DAY';
    const dayLen = solarDay.sunset.getTime() - solarDay.sunrise.getTime();
    const partLen = dayLen / 3;
    const elapsed = birthInstant.getTime() - solarDay.sunrise.getTime();
    const ratio = elapsed / partLen;
    const roundedRatio = Math.abs(ratio - Math.round(ratio)) < 1e-5 ? Math.round(ratio) : ratio;
    // [start, end) interval semantics: exact boundary belongs to the next segment
    const partIndex = Math.min(2, Math.max(0, Math.floor(roundedRatio)));
    activeLord = TRIBHAGA_DAY[partIndex];
    segmentNumber = partIndex + 1;
    segmentStart = new Date(solarDay.sunrise.getTime() + partIndex * partLen);
    segmentEnd = new Date(solarDay.sunrise.getTime() + (partIndex + 1) * partLen);
  } else {
    dayOrNight = 'NIGHT';
    const nightLen = solarDay.nextSunrise.getTime() - solarDay.sunset.getTime();
    const partLen = nightLen / 3;
    const elapsed = birthInstant.getTime() - solarDay.sunset.getTime();
    const ratio = elapsed / partLen;
    const roundedRatio = Math.abs(ratio - Math.round(ratio)) < 1e-5 ? Math.round(ratio) : ratio;
    // [start, end) interval semantics: exact boundary belongs to the next segment
    const partIndex = Math.min(2, Math.max(0, Math.floor(roundedRatio)));
    activeLord = TRIBHAGA_NIGHT[partIndex];
    segmentNumber = partIndex + 1;
    segmentStart = new Date(solarDay.sunset.getTime() + partIndex * partLen);
    segmentEnd = new Date(solarDay.sunset.getTime() + (partIndex + 1) * partLen);
  }

  const value = (planet === Planet.JUPITER) ? 60.0 : ((planet === activeLord) ? 60.0 : 0.0);
  return { value, activeLord, dayOrNight, segmentNumber, segmentStart, segmentEnd };
}

/**
 * Calculates Varsha Bala for a planet.
 */
export function calculateVarshaBala(
  planet: Planet,
  birthInstant: Date,
  ayanamsa: AyanamsaType,
  birthDetails: BirthDetails
): { value: number; varshaLord: Planet; ingressDate: Date; ingressSunrise: Date } {
  const ingress = findPreviousSolarIngress(0, birthInstant, ayanamsa);
  const { weekday, ingressSunrise } = getSolarAdjustedWeekdayForIngress(ingress, birthDetails);
  const varshaLord = WEEKDAY_LORDS[weekday];
  const value = (planet === varshaLord) ? 15.0 : 0.0;
  return { value, varshaLord, ingressDate: ingress, ingressSunrise };
}

/**
 * Calculates Masa Bala for a planet.
 */
export function calculateMasaBala(
  planet: Planet,
  birthInstant: Date,
  sunSiderealLong: number,
  ayanamsa: AyanamsaType,
  birthDetails: BirthDetails
): { value: number; masaLord: Planet; ingressDate: Date; ingressSunrise: Date } {
  const currentSignIndex = Math.floor(normalizeDegree(sunSiderealLong) / 30);
  const currentSignStart = currentSignIndex * 30;
  const ingress = findPreviousSolarIngress(currentSignStart, birthInstant, ayanamsa);
  const { weekday, ingressSunrise } = getSolarAdjustedWeekdayForIngress(ingress, birthDetails);
  const masaLord = WEEKDAY_LORDS[weekday];
  const value = (planet === masaLord) ? 30.0 : 0.0;
  return { value, masaLord, ingressDate: ingress, ingressSunrise };
}

/**
 * Calculates Dina Bala for a planet.
 */
export function calculateDinaBala(
  planet: Planet,
  birthInstant: Date,
  birthDetails: BirthDetails
): { value: number; dinaLord: Planet } {
  const weekday = getLocalCivilWeekdayAtInstant(birthInstant, birthDetails.dateTimeStr);
  const dinaLord = WEEKDAY_LORDS[weekday];
  const value = (planet === dinaLord) ? 45.0 : 0.0;
  return { value, dinaLord };
}

/**
 * Calculates Hora Bala for a planet.
 */
export interface HoraBalaResult {
  value: number;
  horaLord: Planet;
  horaIndex: number;
  dayOrNight: 'DAY' | 'NIGHT';
  horaStart: Date;
  horaEnd: Date;
}

export function calculateHoraBala(
  planet: Planet,
  birthInstant: Date,
  solarDay: SolarDayDetails,
  birthDetails: BirthDetails
): HoraBalaResult {
  const weekday = getLocalCivilWeekdayAtInstant(solarDay.sunrise, birthDetails.dateTimeStr);
  const firstHoraLord = WEEKDAY_LORDS[weekday];
  const startIndex = PLANETARY_HORA_SEQUENCE.indexOf(firstHoraLord);

  let horaIndex = 0;
  let dayOrNight: 'DAY' | 'NIGHT';
  let horaStart: Date;
  let horaEnd: Date;

  const isDaytime = birthInstant.getTime() >= solarDay.sunrise.getTime() && birthInstant.getTime() < solarDay.sunset.getTime();

  if (isDaytime) {
    dayOrNight = 'DAY';
    const dayLen = solarDay.sunset.getTime() - solarDay.sunrise.getTime();
    const horaLen = dayLen / 12;
    const elapsed = birthInstant.getTime() - solarDay.sunrise.getTime();
    const k = Math.min(11, Math.max(0, Math.floor(elapsed / horaLen)));
    horaIndex = k;
    horaStart = new Date(solarDay.sunrise.getTime() + k * horaLen);
    horaEnd = new Date(solarDay.sunrise.getTime() + (k + 1) * horaLen);
  } else {
    dayOrNight = 'NIGHT';
    const nightLen = solarDay.nextSunrise.getTime() - solarDay.sunset.getTime();
    const horaLen = nightLen / 12;
    const elapsed = birthInstant.getTime() - solarDay.sunset.getTime();
    const k = Math.min(11, Math.max(0, Math.floor(elapsed / horaLen)));
    horaIndex = 12 + k;
    horaStart = new Date(solarDay.sunset.getTime() + k * horaLen);
    horaEnd = new Date(solarDay.sunset.getTime() + (k + 1) * horaLen);
  }

  const horaLord = PLANETARY_HORA_SEQUENCE[(startIndex + horaIndex) % 7];
  const value = (planet === horaLord) ? 60.0 : 0.0;
  return { value, horaLord, horaIndex, dayOrNight, horaStart, horaEnd };
}

export interface AyanaValueResult {
  rawValue: number;
  finalValue: number;
  signedDeclination: number;
  hemisphere: 'NORTH' | 'SOUTH' | 'EQUATOR';
  planetRule: 'NORTHERN_GROUP' | 'SOUTHERN_GROUP' | 'ABSOLUTE_MERCURY' | 'DOUBLED_SUN';
}

/**
 * Pure helper for Ayana Bala declination mapping.
 */
export function computeAyanaValue(planet: Planet, declination: number): AyanaValueResult {
  let hemisphere: 'NORTH' | 'SOUTH' | 'EQUATOR';
  if (declination > 0) {
    hemisphere = 'NORTH';
  } else if (declination < 0) {
    hemisphere = 'SOUTH';
  } else {
    hemisphere = 'EQUATOR';
  }

  let signedDeclination = declination;
  let planetRule: 'NORTHERN_GROUP' | 'SOUTHERN_GROUP' | 'ABSOLUTE_MERCURY' | 'DOUBLED_SUN';

  if (planet === Planet.MOON || planet === Planet.SATURN) {
    signedDeclination = -declination;
    planetRule = 'SOUTHERN_GROUP';
  } else if (planet === Planet.MERCURY) {
    signedDeclination = Math.abs(declination);
    planetRule = 'ABSOLUTE_MERCURY';
  } else if (planet === Planet.SUN) {
    signedDeclination = declination;
    planetRule = 'DOUBLED_SUN';
  } else {
    signedDeclination = declination;
    planetRule = 'NORTHERN_GROUP';
  }

  const rawValue = ((24 + signedDeclination) / 48) * 60;
  const clamped = Math.min(60, Math.max(0, rawValue));
  const finalValue = (planet === Planet.SUN) ? Math.min(60, Math.max(0, clamped * 2)) : clamped;

  return {
    rawValue,
    finalValue,
    signedDeclination,
    hemisphere,
    planetRule
  };
}

export interface AyanaBalaResult {
  value: number;
  declination: number;
  signedDeclination: number;
  siderealLongitude: number;
  tropicalLongitude: number;
  declinationHemisphere: 'NORTH' | 'SOUTH' | 'EQUATOR';
  planetRule: 'NORTHERN_GROUP' | 'SOUTHERN_GROUP' | 'ABSOLUTE_MERCURY' | 'DOUBLED_SUN';
  rawValue: number;
  finalValue: number;
}

/**
 * Calculates Ayana Bala for a planet.
 */
export function calculateAyanaBala(
  planet: Planet,
  planetSiderealLong: number,
  birthInstant: Date,
  ayanamsa: AyanamsaType
): AyanaBalaResult {
  const planetTrop = normalizeDegree(planetSiderealLong + getAyanamsaOffset(ayanamsa, birthInstant));
  const jd = calculateJulianDay(birthInstant);
  const t = (jd - 2451545.0) / 36525.0;
  const obliq = getObliquity(t);
  const decl = calculateDeclination(planetTrop, 0, obliq);

  const ayanaRes = computeAyanaValue(planet, decl);

  return {
    value: ayanaRes.finalValue,
    declination: decl,
    signedDeclination: ayanaRes.signedDeclination,
    siderealLongitude: planetSiderealLong,
    tropicalLongitude: planetTrop,
    declinationHemisphere: ayanaRes.hemisphere,
    planetRule: ayanaRes.planetRule,
    rawValue: ayanaRes.rawValue,
    finalValue: ayanaRes.finalValue
  };
}

function buildYuddhaBalaComponent(
  planet: Planet,
  yuddhaResult?: YuddhaBalaResult
): PlanetStrengthComponent {
  const isApplicable = (
    planet === Planet.MARS ||
    planet === Planet.MERCURY ||
    planet === Planet.JUPITER ||
    planet === Planet.VENUS ||
    planet === Planet.SATURN
  );
  if (!isApplicable) {
    return {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
      status: StrengthComponentStatus.NOT_APPLICABLE,
      unit: 'SHASTIAMSA',
      ruleId: 'YUDDHA_BALA_NOT_APPLICABLE',
      reason: yuddhaResult?.reason ?? `${planet} is outside classical planetary war (Yuddha Bala applies only to Mars, Mercury, Jupiter, Venus, Saturn).`
    };
  }

  if (!yuddhaResult) {
    return {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
      status: StrengthComponentStatus.NOT_IMPLEMENTED,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_YUDDHA_BALA_NOT_IMPLEMENTED',
      reason: 'Yuddha Bala (planetary war) deferral: no validated planetary war winner rule or Bimba Parimana disc-diameter data.'
    };
  }

  const hasWar = (yuddhaResult.pairs ?? []).some(p => p.isYuddha);
  const ruleId = hasWar ? 'YUDDHA_BALA_001' : 'YUDDHA_BALA_NO_WAR';

  return {
    component: ShadbalaComponent.KALA_BALA,
    subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
    status: StrengthComponentStatus.NOT_IMPLEMENTED,
    unit: 'SHASTIAMSA',
    ruleId,
    reason: yuddhaResult.reason
  };
}

function buildYuddhaBalaEvidence(
  planet: Planet,
  yuddhaResult?: YuddhaBalaResult
): PlanetaryStrengthEvidence[] {
  const isApplicable = (
    planet === Planet.MARS ||
    planet === Planet.MERCURY ||
    planet === Planet.JUPITER ||
    planet === Planet.VENUS ||
    planet === Planet.SATURN
  );
  if (!isApplicable) {
    return [{
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
      ruleId: 'YUDDHA_BALA_NOT_APPLICABLE',
      planet,
      reason: yuddhaResult?.reason ?? `${planet} is outside classical planetary war.`
    }];
  }

  if (!yuddhaResult) {
    return [{
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
      ruleId: 'SHADBALA_YUDDHA_BALA_NOT_IMPLEMENTED',
      planet,
      reason: 'Yuddha Bala (planetary war) deferral: no validated planetary war winner rule or Bimba Parimana disc-diameter data.'
    }];
  }

  const warPairs = (yuddhaResult.pairs ?? []).filter(p => p.isYuddha);
  if (warPairs.length > 0) {
    return warPairs.map(p => {
      const opponent = p.planetA === planet ? p.planetB : p.planetA;
      const longitude = p.planetA === planet ? p.longitudeA : p.longitudeB;
      const opponentLongitude = p.planetA === planet ? p.longitudeB : p.longitudeA;
      const sep = p.separation ?? 0;
      const longVal = longitude ?? 0;
      const oppLongVal = opponentLongitude ?? 0;
      return {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
        ruleId: 'YUDDHA_BALA_001',
        planet,
        reason: `Planetary war detected between ${planet} and ${opponent}: separation ${sep.toFixed(4)}°.`,
        inputs: {
          opponent,
          separation: Number(sep.toFixed(4)),
          longitude: Number(longVal.toFixed(4)),
          opponentLongitude: Number(oppLongVal.toFixed(4))
        }
      };
    });
  }

  return [{
    component: ShadbalaComponent.KALA_BALA,
    subcomponent: ShadbalaSubcomponent.YUDDHA_BALA,
    ruleId: 'YUDDHA_BALA_NO_WAR',
    planet,
    reason: yuddhaResult.reason
  }];
}

/**
 * Calculates Kala Bala components and evidence for a single planet given birth details.
 */
export function calculatePlanetKalaBala(
  planet: Planet,
  birthDetails: BirthDetails,
  sunSiderealLong: number,
  moonSiderealLong: number,
  planetSiderealLong: number,
  yuddhaResult?: YuddhaBalaResult
): KalaBalaCalculationResult {
  const birthInstant = parseUtcDate(birthDetails.dateTimeStr);

  if (planet === Planet.RAHU || planet === Planet.KETU) {
    const nodeSubcomponents = [
      ShadbalaSubcomponent.NATONNATA_BALA,
      ShadbalaSubcomponent.PAKSHA_BALA,
      ShadbalaSubcomponent.TRIBHAGA_BALA,
      ShadbalaSubcomponent.VARSHA_BALA,
      ShadbalaSubcomponent.MASA_BALA,
      ShadbalaSubcomponent.DINA_BALA,
      ShadbalaSubcomponent.HORA_BALA,
      ShadbalaSubcomponent.AYANA_BALA
    ];

    const components: PlanetStrengthComponent[] = [
      ...nodeSubcomponents.map(sub => ({
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: sub,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA' as const,
        ruleId: `SHADBALA_${sub}_NOT_IMPLEMENTED`,
        reason: `Rahu/Ketu policy: temporal strength components are not implemented for lunar nodes.`
      })),
      buildYuddhaBalaComponent(planet, yuddhaResult)
    ];

    const evidence: PlanetaryStrengthEvidence[] = [
      ...nodeSubcomponents.map(sub => ({
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: sub,
        ruleId: `SHADBALA_${sub}_NOT_IMPLEMENTED`,
        planet,
        reason: `Rahu/Ketu policy: temporal strength components are not implemented for lunar nodes.`
      })),
      ...buildYuddhaBalaEvidence(planet, yuddhaResult)
    ];

    return { components, evidence };
  }

  const solarDay = getSolarDayDetails(
    birthDetails.latitude,
    birthDetails.longitude,
    birthInstant,
    getTimezoneOffsetMinutes(birthDetails.dateTimeStr)
  );

  // Sunrise-INDEPENDENT components (calculated regardless of polar conditions)
  const paksha = calculatePakshaBala(planet, sunSiderealLong, moonSiderealLong);
  const pakshaValue = Number(paksha.value.toFixed(2));

  const dina = calculateDinaBala(planet, birthInstant, birthDetails);
  const dinaValue = Number(dina.value.toFixed(2));

  const ayana = calculateAyanaBala(planet, planetSiderealLong, birthInstant, birthDetails.ayanamsa);
  const ayanaValue = Number(ayana.value.toFixed(2));

  if (!solarDay) {
    // Polar region where Sun never rises/sets:
    // Sunrise-dependent subcomponents are NOT_IMPLEMENTED, while Paksha, Dina, and Ayana are CALCULATED.
    const components: PlanetStrengthComponent[] = [
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.NATONNATA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_NATONNATA_BALA_NOT_IMPLEMENTED',
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.PAKSHA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: pakshaValue,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_PAKSHA_BALA_001'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.TRIBHAGA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_TRIBHAGA_BALA_NOT_IMPLEMENTED',
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.VARSHA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_VARSHA_BALA_NOT_IMPLEMENTED',
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.MASA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_MASA_BALA_NOT_IMPLEMENTED',
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.DINA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: dinaValue,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_DINA_BALA_001'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.HORA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_HORA_BALA_NOT_IMPLEMENTED',
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.AYANA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: ayanaValue,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_AYANA_BALA_001'
      },
      buildYuddhaBalaComponent(planet, yuddhaResult),
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.KALA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_KALA_BALA_NOT_IMPLEMENTED',
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude; incomplete temporal strength.'
      }
    ];

    const evidence: PlanetaryStrengthEvidence[] = [
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.NATONNATA_BALA,
        ruleId: 'SHADBALA_NATONNATA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.PAKSHA_BALA,
        ruleId: 'SHADBALA_PAKSHA_BALA_001',
        planet,
        reason: `Paksha Bala for ${planet}.`,
        inputs: {
          sunLongitude: sunSiderealLong,
          moonLongitude: moonSiderealLong,
          angularSeparation: Number(paksha.separation.toFixed(2)),
          beneficBase: Number(paksha.beneficBase.toFixed(2)),
          classification: paksha.isBenefic ? 'BENEFIC' : 'MALEFIC',
          moonDoubled: planet === Planet.MOON ? 1 : 0,
          finalValue: pakshaValue
        }
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.TRIBHAGA_BALA,
        ruleId: 'SHADBALA_TRIBHAGA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.VARSHA_BALA,
        ruleId: 'SHADBALA_VARSHA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.MASA_BALA,
        ruleId: 'SHADBALA_MASA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.DINA_BALA,
        ruleId: 'SHADBALA_DINA_BALA_001',
        planet,
        reason: `Dina Bala for ${planet}.`,
        inputs: {
          dinaLord: dina.dinaLord,
          value: dinaValue
        }
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.HORA_BALA,
        ruleId: 'SHADBALA_HORA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Polar condition: Sun does not rise or set at specified latitude/longitude.'
      },
      {
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.AYANA_BALA,
        ruleId: 'SHADBALA_AYANA_BALA_001',
        planet,
        reason: `Ayana Bala for ${planet}.`,
        inputs: {
          siderealLongitude: Number(ayana.siderealLongitude.toFixed(2)),
          tropicalLongitude: Number(ayana.tropicalLongitude.toFixed(2)),
          declination: Number(ayana.declination.toFixed(2)),
          declinationHemisphere: ayana.declinationHemisphere,
          planetRule: ayana.planetRule,
          signedDeclination: Number(ayana.signedDeclination.toFixed(2)),
          rawValue: Number(ayana.rawValue.toFixed(2)),
          finalValue: ayanaValue
        }
      },
      ...buildYuddhaBalaEvidence(planet, yuddhaResult)
    ];

    return { components, evidence };
  }

  // Sunrise-DEPENDENT components (calculated when solarDay is present)
  // 1. Natonnata Bala
  const natonnata = calculateNatonnataBala(planet, birthInstant, solarDay);
  const natonnataValue = Number(natonnata.value.toFixed(2));

  // 3. Tribhaga Bala
  const tribhaga = calculateTribhagaBala(planet, birthInstant, solarDay);
  const tribhagaValue = Number(tribhaga.value.toFixed(2));

  // 4. Varsha Bala
  const varsha = calculateVarshaBala(planet, birthInstant, birthDetails.ayanamsa, birthDetails);
  const varshaValue = Number(varsha.value.toFixed(2));

  // 5. Masa Bala
  const masa = calculateMasaBala(planet, birthInstant, sunSiderealLong, birthDetails.ayanamsa, birthDetails);
  const masaValue = Number(masa.value.toFixed(2));

  // 7. Hora Bala
  const hora = calculateHoraBala(planet, birthInstant, solarDay, birthDetails);
  const horaValue = Number(hora.value.toFixed(2));

  // Sum raw values before rounding for public total
  const rawSum = natonnata.value + paksha.value + tribhaga.value + varsha.value + masa.value + dina.value + hora.value + ayana.value;
  const kalaBalaCoreTotal = Number(rawSum.toFixed(2));

  const components: PlanetStrengthComponent[] = [
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.NATONNATA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: natonnataValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_NATONNATA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.PAKSHA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: pakshaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_PAKSHA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.TRIBHAGA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: tribhagaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_TRIBHAGA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.VARSHA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: varshaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_VARSHA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.MASA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: masaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_MASA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.DINA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: dinaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_DINA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.HORA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: horaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_HORA_BALA_001'
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.AYANA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: ayanaValue,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_AYANA_BALA_001'
    },
    buildYuddhaBalaComponent(planet, yuddhaResult),
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.KALA_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: kalaBalaCoreTotal,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_KALA_BALA_001'
    }
  ];

  const evidence: PlanetaryStrengthEvidence[] = [
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.NATONNATA_BALA,
      ruleId: 'SHADBALA_NATONNATA_BALA_001',
      planet,
      reason: `Natonnata Bala for ${planet}.`,
      inputs: {
        birthInstant: birthInstant.toISOString(),
        isDaytime: solarDay.isDaytime ? 1 : 0,
        sunrise: solarDay.sunrise.toISOString(),
        sunset: solarDay.sunset.toISOString(),
        solarNoon: solarDay.solarNoon.toISOString(),
        solarMidnight: solarDay.solarMidnight.toISOString(),
        nextSunrise: solarDay.nextSunrise.toISOString(),
        ratio: Number(natonnata.ratio.toFixed(4)),
        value: natonnataValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.PAKSHA_BALA,
      ruleId: 'SHADBALA_PAKSHA_BALA_001',
      planet,
      reason: `Paksha Bala for ${planet}.`,
      inputs: {
        sunLongitude: sunSiderealLong,
        moonLongitude: moonSiderealLong,
        angularSeparation: Number(paksha.separation.toFixed(2)),
        beneficBase: Number(paksha.beneficBase.toFixed(2)),
        classification: paksha.isBenefic ? 'BENEFIC' : 'MALEFIC',
        moonDoubled: planet === Planet.MOON ? 1 : 0,
        finalValue: pakshaValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.TRIBHAGA_BALA,
      ruleId: 'SHADBALA_TRIBHAGA_BALA_001',
      planet,
      reason: `Tribhaga Bala for ${planet}.`,
      inputs: {
        dayOrNight: tribhaga.dayOrNight,
        segmentNumber: tribhaga.segmentNumber,
        segmentStart: tribhaga.segmentStart.toISOString(),
        segmentEnd: tribhaga.segmentEnd.toISOString(),
        activeLord: tribhaga.activeLord,
        value: tribhagaValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.VARSHA_BALA,
      ruleId: 'SHADBALA_VARSHA_BALA_001',
      planet,
      reason: `Varsha Bala for ${planet}.`,
      inputs: {
        ingressDate: varsha.ingressDate.toISOString(),
        ingressSunrise: varsha.ingressSunrise.toISOString(),
        varshaLord: varsha.varshaLord,
        value: varshaValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.MASA_BALA,
      ruleId: 'SHADBALA_MASA_BALA_001',
      planet,
      reason: `Masa Bala for ${planet}.`,
      inputs: {
        ingressDate: masa.ingressDate.toISOString(),
        ingressSunrise: masa.ingressSunrise.toISOString(),
        masaLord: masa.masaLord,
        value: masaValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.DINA_BALA,
      ruleId: 'SHADBALA_DINA_BALA_001',
      planet,
      reason: `Dina Bala for ${planet}.`,
      inputs: {
        dinaLord: dina.dinaLord,
        value: dinaValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.HORA_BALA,
      ruleId: 'SHADBALA_HORA_BALA_001',
      planet,
      reason: `Hora Bala for ${planet}.`,
      inputs: {
        dayOrNight: hora.dayOrNight,
        horaLord: hora.horaLord,
        horaIndex: hora.horaIndex,
        horaStart: hora.horaStart.toISOString(),
        horaEnd: hora.horaEnd.toISOString(),
        value: horaValue
      }
    },
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.AYANA_BALA,
      ruleId: 'SHADBALA_AYANA_BALA_001',
      planet,
      reason: `Ayana Bala for ${planet}.`,
      inputs: {
        siderealLongitude: Number(ayana.siderealLongitude.toFixed(2)),
        tropicalLongitude: Number(ayana.tropicalLongitude.toFixed(2)),
        declination: Number(ayana.declination.toFixed(2)),
        declinationHemisphere: ayana.declinationHemisphere,
        planetRule: ayana.planetRule,
        signedDeclination: Number(ayana.signedDeclination.toFixed(2)),
        rawValue: Number(ayana.rawValue.toFixed(2)),
        finalValue: ayanaValue
      }
    },
    ...buildYuddhaBalaEvidence(planet, yuddhaResult),
    {
      component: ShadbalaComponent.KALA_BALA,
      subcomponent: ShadbalaSubcomponent.KALA_BALA,
      ruleId: 'SHADBALA_KALA_BALA_001',
      planet,
      reason: `Kala Bala Core total for ${planet}.`,
      inputs: {
        natonnataBala: natonnataValue,
        pakshaBala: pakshaValue,
        tribhagaBala: tribhagaValue,
        varshaBala: varshaValue,
        masaBala: masaValue,
        dinaBala: dinaValue,
        horaBala: horaValue,
        ayanaBala: ayanaValue,
        kalaBalaCoreTotal
      }
    }
  ];

  return { components, evidence, kalaBalaCoreTotal };
}
