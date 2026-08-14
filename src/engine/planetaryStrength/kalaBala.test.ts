import { describe, it, expect } from 'vitest';
import { Planet, AyanamsaType, BirthDetails, ShadbalaComponent, ShadbalaSubcomponent, StrengthComponentStatus } from '../../types';
import {
  calculateNatonnataBala,
  calculatePakshaBala,
  calculateTribhagaBala,
  calculateVarshaBala,
  calculateMasaBala,
  calculateDinaBala,
  calculateHoraBala,
  calculateAyanaBala,
  calculatePlanetKalaBala,
  computeAyanaValue,
  getSolarAdjustedWeekdayForIngress,
  getTimezoneOffsetMinutes,
  WEEKDAY_LORDS
} from './kalaBala';
import { getSolarDayDetails, parseUtcDate, getSunSiderealLongitude, calculateSunriseSunset } from '../solarTime';

describe('kalaBala module', () => {
  const birthDetails: BirthDetails = {
    dateTimeStr: '1988-05-08T09:30:00+05:30', // Ujjain birth
    latitude: 23.1765,
    longitude: 75.7885,
    timeZone: 'Asia/Kolkata',
    ayanamsa: AyanamsaType.LAHIRI
  };

  const offsetMinutes = getTimezoneOffsetMinutes(birthDetails.dateTimeStr);
  const birthInstant = parseUtcDate(birthDetails.dateTimeStr);
  const solarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, birthInstant, offsetMinutes)!;

  it('shouldCalculateNatonnataBalaDiurnalNocturnalAndMercury', () => {
    // Mercury always gets 60
    expect(calculateNatonnataBala(Planet.MERCURY, birthInstant, solarDay).value).toBe(60.0);

    // Diurnal planet (Sun) at solar noon
    const noonResult = calculateNatonnataBala(Planet.SUN, solarDay.solarNoon, solarDay);
    expect(noonResult.value).toBeCloseTo(60.0, 1);

    // Nocturnal planet (Moon) at solar noon
    const moonNoonResult = calculateNatonnataBala(Planet.MOON, solarDay.solarNoon, solarDay);
    expect(moonNoonResult.value).toBeCloseTo(0.0, 1);

    // At sunrise, both diurnal and nocturnal get ~30
    const sunriseDiurnal = calculateNatonnataBala(Planet.SUN, solarDay.sunrise, solarDay);
    const sunriseNocturnal = calculateNatonnataBala(Planet.MOON, solarDay.sunrise, solarDay);
    expect(sunriseDiurnal.value).toBeCloseTo(30.0, 1);
    expect(sunriseNocturnal.value).toBeCloseTo(30.0, 1);

    // Midnight & Sunset test on a nighttime solarDay
    const nightInstant = new Date(solarDay.solarMidnight.getTime());
    const nightSolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, nightInstant, offsetMinutes)!;
    expect(nightSolarDay.isDaytime).toBe(false);

    // At solar midnight, Sun = 0, Moon = 60
    expect(calculateNatonnataBala(Planet.SUN, nightSolarDay.solarMidnight, nightSolarDay).value).toBeCloseTo(0.0, 1);
    expect(calculateNatonnataBala(Planet.MOON, nightSolarDay.solarMidnight, nightSolarDay).value).toBeCloseTo(60.0, 1);

    // At sunset, both diurnal and nocturnal get ~30
    expect(calculateNatonnataBala(Planet.SUN, nightSolarDay.sunset, nightSolarDay).value).toBeCloseTo(30.0, 1);
    expect(calculateNatonnataBala(Planet.MOON, nightSolarDay.sunset, nightSolarDay).value).toBeCloseTo(30.0, 1);
  });

  it('shouldCalculatePakshaBalaForBeneficsAndMalefics', () => {
    // Full Moon (Moon at 180°, Sun at 0°)
    const fullMoonBenefic = calculatePakshaBala(Planet.JUPITER, 0, 180);
    expect(fullMoonBenefic.value).toBeCloseTo(60.0, 2);

    const fullMoonMalefic = calculatePakshaBala(Planet.MARS, 0, 180);
    expect(fullMoonMalefic.value).toBeCloseTo(0.0, 2);

    const fullMoonMoon = calculatePakshaBala(Planet.MOON, 0, 180);
    expect(fullMoonMoon.value).toBeCloseTo(60.0, 2);

    // New Moon (Moon at 0°, Sun at 0°)
    const newMoonBenefic = calculatePakshaBala(Planet.JUPITER, 0, 0);
    expect(newMoonBenefic.value).toBeCloseTo(0.0, 2);

    const newMoonMalefic = calculatePakshaBala(Planet.MARS, 0, 0);
    expect(newMoonMalefic.value).toBeCloseTo(60.0, 2);
  });

  it('shouldCalculatePakshaBalaSeparationAndWrap', () => {
    // Sun 0°, Moon 90° -> separation === 90, beneficBase === 30
    const res90 = calculatePakshaBala(Planet.JUPITER, 0, 90);
    expect(res90.separation).toBe(90);
    expect(res90.beneficBase).toBe(30);
    expect(res90.value).toBeCloseTo(30.0, 2);

    const res90Malefic = calculatePakshaBala(Planet.MARS, 0, 90);
    expect(res90Malefic.value).toBeCloseTo(30.0, 2);

    // Wrap around: Sun 350°, Moon 10° -> separation === 20
    const resWrap = calculatePakshaBala(Planet.JUPITER, 350, 10);
    expect(resWrap.separation).toBe(20);
    expect(resWrap.beneficBase).toBeCloseTo(20 / 3, 2);
  });

  it('shouldCalculateTribhagaBalaWithExplicitPartBoundariesAndJupiterAlways60', () => {
    // Jupiter always gets 60
    expect(calculateTribhagaBala(Planet.JUPITER, birthInstant, solarDay).value).toBe(60.0);

    const sunriseMs = solarDay.sunrise.getTime();
    const sunsetMs = solarDay.sunset.getTime();
    const nextSunriseMs = solarDay.nextSunrise.getTime();

    const dayLen = sunsetMs - sunriseMs;
    const partLenDay = dayLen / 3;

    const nightLen = nextSunriseMs - sunsetMs;
    const partLenNight = nightLen / 3;

    // Daytime Part 1: Lord Mercury
    const day1 = new Date(sunriseMs + 1000);
    const day1SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, day1, offsetMinutes)!;
    expect(calculateTribhagaBala(Planet.MERCURY, day1, day1SolarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.SUN, day1, day1SolarDay).value).toBe(0.0);
    expect(calculateTribhagaBala(Planet.JUPITER, day1, day1SolarDay).value).toBe(60.0);

    // Daytime Part 2: Lord Sun
    const day2 = new Date(sunriseMs + partLenDay + 1000);
    const day2SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, day2, offsetMinutes)!;
    expect(calculateTribhagaBala(Planet.SUN, day2, day2SolarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.MERCURY, day2, day2SolarDay).value).toBe(0.0);
    expect(calculateTribhagaBala(Planet.JUPITER, day2, day2SolarDay).value).toBe(60.0);

    // Daytime Part 3: Lord Saturn
    const day3 = new Date(sunsetMs - 1000);
    const day3SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, day3, offsetMinutes)!;
    expect(calculateTribhagaBala(Planet.SATURN, day3, day3SolarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.SUN, day3, day3SolarDay).value).toBe(0.0);
    expect(calculateTribhagaBala(Planet.JUPITER, day3, day3SolarDay).value).toBe(60.0);

    // Nighttime Part 1: Lord Moon
    const night1 = new Date(sunsetMs + 1000);
    const night1SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, night1, offsetMinutes)!;
    expect(calculateTribhagaBala(Planet.MOON, night1, night1SolarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.VENUS, night1, night1SolarDay).value).toBe(0.0);
    expect(calculateTribhagaBala(Planet.JUPITER, night1, night1SolarDay).value).toBe(60.0);

    // Nighttime Part 2: Lord Venus
    const night2 = new Date(sunsetMs + partLenNight + 1000);
    const night2SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, night2, offsetMinutes)!;
    expect(calculateTribhagaBala(Planet.VENUS, night2, night2SolarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.MOON, night2, night2SolarDay).value).toBe(0.0);
    expect(calculateTribhagaBala(Planet.JUPITER, night2, night2SolarDay).value).toBe(60.0);

    // Nighttime Part 3: Lord Mars
    const night3 = new Date(nextSunriseMs - 1000);
    const night3SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, night3, offsetMinutes)!;
    expect(calculateTribhagaBala(Planet.MARS, night3, night3SolarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.VENUS, night3, night3SolarDay).value).toBe(0.0);
    expect(calculateTribhagaBala(Planet.JUPITER, night3, night3SolarDay).value).toBe(60.0);
  });

  it('shouldTreatTribhagaPartBoundaryAsNextSegment', () => {
    const sunriseMs = solarDay.sunrise.getTime();
    const sunsetMs = solarDay.sunset.getTime();
    const nextSunriseMs = solarDay.nextSunrise.getTime();

    const dayLen = sunsetMs - sunriseMs;
    const partLenDay = dayLen / 3;

    const nightLen = nextSunriseMs - sunsetMs;
    const partLenNight = nightLen / 3;

    // Day boundary 1 (exact end of daytime part 1 = start of daytime part 2)
    const dayBoundary1 = new Date(sunriseMs + partLenDay);
    expect(calculateTribhagaBala(Planet.SUN, dayBoundary1, solarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.MERCURY, dayBoundary1, solarDay).value).toBe(0.0);

    // Day boundary 2 (exact end of daytime part 2 = start of daytime part 3)
    const dayBoundary2 = new Date(sunriseMs + 2 * partLenDay);
    expect(calculateTribhagaBala(Planet.SATURN, dayBoundary2, solarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.SUN, dayBoundary2, solarDay).value).toBe(0.0);

    // Night boundary 1 (exact end of nighttime part 1 = start of nighttime part 2)
    const nightBoundary1 = new Date(sunsetMs + partLenNight);
    expect(calculateTribhagaBala(Planet.VENUS, nightBoundary1, solarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.MOON, nightBoundary1, solarDay).value).toBe(0.0);

    // Night boundary 2 (exact end of nighttime part 2 = start of nighttime part 3)
    const nightBoundary2 = new Date(sunsetMs + 2 * partLenNight);
    expect(calculateTribhagaBala(Planet.MARS, nightBoundary2, solarDay).value).toBe(60.0);
    expect(calculateTribhagaBala(Planet.VENUS, nightBoundary2, solarDay).value).toBe(0.0);
  });

  it('shouldFindPreviousMeshaIngressAndAward15ToVarshaLord', () => {
    const res = calculateVarshaBala(Planet.SUN, birthInstant, AyanamsaType.LAHIRI, birthDetails);
    expect(res.ingressDate.getTime()).toBeLessThanOrEqual(birthInstant.getTime());

    const sunLongAtIngress = getSunSiderealLongitude(res.ingressDate, AyanamsaType.LAHIRI);
    expect(sunLongAtIngress).toBeCloseTo(0.0, 0);

    expect(res.ingressSunrise).toBeDefined();

    const lordRes = calculateVarshaBala(res.varshaLord, birthInstant, AyanamsaType.LAHIRI, birthDetails);
    expect(lordRes.value).toBe(15.0);

    const nonLord = WEEKDAY_LORDS.find(p => p !== res.varshaLord)!;
    const nonLordRes = calculateVarshaBala(nonLord, birthInstant, AyanamsaType.LAHIRI, birthDetails);
    expect(nonLordRes.value).toBe(0.0);
  });

  it('shouldUsePreviousCivilWeekdayBeforeSunriseAndCurrentAtOrAfter', () => {
    const dateUtc = new Date(Date.UTC(2023, 4, 15)); // May 15, 2023 UTC
    const solarTimes = calculateSunriseSunset(birthDetails.latitude, birthDetails.longitude, dateUtc)!;
    expect(solarTimes).toBeDefined();

    // 1 hour before sunrise
    const beforeSunrise = new Date(solarTimes.sunrise.getTime() - 3600 * 1000);
    const resBefore = getSolarAdjustedWeekdayForIngress(beforeSunrise, birthDetails);
    const civilWeekdayBefore = (new Date(beforeSunrise.getTime() + 330 * 60 * 1000)).getUTCDay();
    expect(resBefore.weekday).toBe((civilWeekdayBefore + 6) % 7);

    // At sunrise
    const atSunrise = solarTimes.sunrise;
    const resAt = getSolarAdjustedWeekdayForIngress(atSunrise, birthDetails);
    const civilWeekdayAt = (new Date(atSunrise.getTime() + 330 * 60 * 1000)).getUTCDay();
    expect(resAt.weekday).toBe(civilWeekdayAt);

    // 1 hour after sunrise
    const afterSunrise = new Date(solarTimes.sunrise.getTime() + 3600 * 1000);
    const resAfter = getSolarAdjustedWeekdayForIngress(afterSunrise, birthDetails);
    const civilWeekdayAfter = (new Date(afterSunrise.getTime() + 330 * 60 * 1000)).getUTCDay();
    expect(resAfter.weekday).toBe(civilWeekdayAfter);
  });

  it('shouldFindPreviousSolarSignIngressAndAward30ToMasaLord', () => {
    // Sun at 45° (Taurus)
    const masaRes = calculateMasaBala(Planet.SUN, birthInstant, 45.0, AyanamsaType.LAHIRI, birthDetails);
    expect(masaRes.ingressDate.getTime()).toBeLessThanOrEqual(birthInstant.getTime());

    const sunLongAtIngress = getSunSiderealLongitude(masaRes.ingressDate, AyanamsaType.LAHIRI);
    expect(sunLongAtIngress).toBeCloseTo(30.0, 0); // Taurus start is 30°

    expect(masaRes.ingressSunrise).toBeDefined();

    const lordRes = calculateMasaBala(masaRes.masaLord, birthInstant, 45.0, AyanamsaType.LAHIRI, birthDetails);
    expect(lordRes.value).toBe(30.0);

    const nonLord = WEEKDAY_LORDS.find(p => p !== masaRes.masaLord)!;
    const nonLordRes = calculateMasaBala(nonLord, birthInstant, 45.0, AyanamsaType.LAHIRI, birthDetails);
    expect(nonLordRes.value).toBe(0.0);
  });

  it('shouldHandleEachSiderealSignBoundary', () => {
    for (let signIndex = 0; signIndex < 12; signIndex++) {
      const signStart = signIndex * 30;
      const midSignLong = signStart + 15;
      const masaRes = calculateMasaBala(Planet.SUN, birthInstant, midSignLong, AyanamsaType.LAHIRI, birthDetails);

      expect(masaRes.ingressDate.getTime()).toBeLessThanOrEqual(birthInstant.getTime());
      const sunLongAtIngress = getSunSiderealLongitude(masaRes.ingressDate, AyanamsaType.LAHIRI);
      expect(sunLongAtIngress).toBeCloseTo(signStart, 0);
    }
  });

  it('shouldCalculateVarshaMasaDinaHoraBala', () => {
    const dina = calculateDinaBala(Planet.SUN, birthInstant, birthDetails);
    // 1988-05-08 local is Sunday -> SUN gets 45, others 0
    expect(dina.dinaLord).toBe(Planet.SUN);
    expect(dina.value).toBe(45.0);

    const dinaMoon = calculateDinaBala(Planet.MOON, birthInstant, birthDetails);
    expect(dinaMoon.value).toBe(0.0);
  });

  it('shouldCalculateHoraSequenceForSunday', () => {
    const sunriseMs = solarDay.sunrise.getTime();
    const sunsetMs = solarDay.sunset.getTime();
    const nextSunriseMs = solarDay.nextSunrise.getTime();

    const dayLen = sunsetMs - sunriseMs;
    const horaLenDay = dayLen / 12;

    const nightLen = nextSunriseMs - sunsetMs;
    const horaLenNight = nightLen / 12;

    const expectedDayLords = [
      Planet.SUN,     // 0
      Planet.VENUS,   // 1
      Planet.MERCURY, // 2
      Planet.MOON,    // 3
      Planet.SATURN,  // 4
      Planet.JUPITER, // 5
      Planet.MARS,    // 6
      Planet.SUN,     // 7
      Planet.VENUS,   // 8
      Planet.MERCURY, // 9
      Planet.MOON,    // 10
      Planet.SATURN   // 11
    ];

    for (let k = 0; k < 12; k++) {
      const sampleInstant = new Date(sunriseMs + (k + 0.5) * horaLenDay);
      const sampleSolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, sampleInstant, offsetMinutes)!;
      const expectedLord = expectedDayLords[k];

      const res = calculateHoraBala(expectedLord, sampleInstant, sampleSolarDay, birthDetails);
      expect(res.horaIndex).toBe(k);
      expect(res.horaLord).toBe(expectedLord);
      expect(res.value).toBe(60.0);
      expect(res.dayOrNight).toBe('DAY');
    }

    // 1st night hora (k=0 -> horaIndex 12)
    const night0Instant = new Date(sunsetMs + 0.5 * horaLenNight);
    const night0SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, night0Instant, offsetMinutes)!;
    const night0Res = calculateHoraBala(Planet.JUPITER, night0Instant, night0SolarDay, birthDetails);
    expect(night0Res.horaIndex).toBe(12);
    expect(night0Res.horaLord).toBe(Planet.JUPITER);
    expect(night0Res.value).toBe(60.0);
    expect(night0Res.dayOrNight).toBe('NIGHT');

    // 12th night hora (k=11 -> horaIndex 23)
    const night11Instant = new Date(sunsetMs + 11.5 * horaLenNight);
    const night11SolarDay = getSolarDayDetails(birthDetails.latitude, birthDetails.longitude, night11Instant, offsetMinutes)!;
    const night11Res = calculateHoraBala(Planet.MERCURY, night11Instant, night11SolarDay, birthDetails);
    expect(night11Res.horaIndex).toBe(23);
    expect(night11Res.horaLord).toBe(Planet.MERCURY);
    expect(night11Res.value).toBe(60.0);
    expect(night11Res.dayOrNight).toBe('NIGHT');
  });

  it('shouldCalculateAyanaBalaDirectDeclinationMapping', () => {
    // δ=0 -> 30 for northern-group planet (e.g. Jupiter)
    const jupZero = computeAyanaValue(Planet.JUPITER, 0);
    expect(jupZero.rawValue).toBe(30);
    expect(jupZero.finalValue).toBe(30);
    expect(jupZero.hemisphere).toBe('EQUATOR');
    expect(jupZero.planetRule).toBe('NORTHERN_GROUP');

    // δ=+24 -> Jupiter 60, Moon/Saturn 0
    const jupPlus24 = computeAyanaValue(Planet.JUPITER, 24);
    expect(jupPlus24.finalValue).toBe(60);
    expect(jupPlus24.hemisphere).toBe('NORTH');

    const moonPlus24 = computeAyanaValue(Planet.MOON, 24);
    expect(moonPlus24.finalValue).toBe(0);
    expect(moonPlus24.planetRule).toBe('SOUTHERN_GROUP');

    const satPlus24 = computeAyanaValue(Planet.SATURN, 24);
    expect(satPlus24.finalValue).toBe(0);

    // δ=-24 -> Jupiter 0, Moon/Saturn 60
    const jupMinus24 = computeAyanaValue(Planet.JUPITER, -24);
    expect(jupMinus24.finalValue).toBe(0);
    expect(jupMinus24.hemisphere).toBe('SOUTH');

    const moonMinus24 = computeAyanaValue(Planet.MOON, -24);
    expect(moonMinus24.finalValue).toBe(60);

    const satMinus24 = computeAyanaValue(Planet.SATURN, -24);
    expect(satMinus24.finalValue).toBe(60);

    // Mercury: δ=+24 and δ=-24 give same result (absolute value)
    const mercPlus24 = computeAyanaValue(Planet.MERCURY, 24);
    const mercMinus24 = computeAyanaValue(Planet.MERCURY, -24);
    expect(mercPlus24.finalValue).toBe(60);
    expect(mercMinus24.finalValue).toBe(60);
    expect(mercPlus24.planetRule).toBe('ABSOLUTE_MERCURY');

    // Sun doubling: verify Sun's finalValue is clamped double (capped at 60)
    const sunZero = computeAyanaValue(Planet.SUN, 0);
    expect(sunZero.rawValue).toBe(30);
    expect(sunZero.finalValue).toBe(60); // 30 * 2 = 60

    const sunPlus24 = computeAyanaValue(Planet.SUN, 24);
    expect(sunPlus24.rawValue).toBe(60);
    expect(sunPlus24.finalValue).toBe(60); // capped at 60

    const sunMinus24 = computeAyanaValue(Planet.SUN, -24);
    expect(sunMinus24.rawValue).toBe(0);
    expect(sunMinus24.finalValue).toBe(0);
  });

  it('shouldCalculateAyanaBalaWithSunDoubling', () => {
    const ayanaSun = calculateAyanaBala(Planet.SUN, 45, birthInstant, AyanamsaType.LAHIRI);
    expect(ayanaSun.value).toBeGreaterThanOrEqual(0);
    expect(ayanaSun.value).toBeLessThanOrEqual(60);

    const ayanaMoon = calculateAyanaBala(Planet.MOON, 45, birthInstant, AyanamsaType.LAHIRI);
    expect(ayanaMoon.value).toBeGreaterThanOrEqual(0);
    expect(ayanaMoon.value).toBeLessThanOrEqual(60);
  });

  it('shouldCalculateCompleteKalaBalaCoreForSunAndEmitNotImplementedForRahuAndKetu', () => {
    const sunResult = calculatePlanetKalaBala(Planet.SUN, birthDetails, 23.5, 230.0, 23.5);
    expect(sunResult.kalaBalaCoreTotal).toBeGreaterThan(0);
    expect(sunResult.components.length).toBe(10); // 8 temporal + 1 Yuddha + 1 aggregate

    const yuddhaComp = sunResult.components.find(c => c.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
    expect(yuddhaComp?.status).toBe(StrengthComponentStatus.NOT_APPLICABLE);
    expect(yuddhaComp?.ruleId).toBe('YUDDHA_BALA_NOT_APPLICABLE');

    const aggComp = sunResult.components.find(c => c.subcomponent === ShadbalaSubcomponent.KALA_BALA);
    expect(aggComp?.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(aggComp?.value).toBe(sunResult.kalaBalaCoreTotal);

    const expectedSubcomponents = [
      ShadbalaSubcomponent.NATONNATA_BALA,
      ShadbalaSubcomponent.PAKSHA_BALA,
      ShadbalaSubcomponent.TRIBHAGA_BALA,
      ShadbalaSubcomponent.VARSHA_BALA,
      ShadbalaSubcomponent.MASA_BALA,
      ShadbalaSubcomponent.DINA_BALA,
      ShadbalaSubcomponent.HORA_BALA,
      ShadbalaSubcomponent.AYANA_BALA,
      ShadbalaSubcomponent.YUDDHA_BALA
    ];

    // Rahu test
    const rahuResult = calculatePlanetKalaBala(Planet.RAHU, birthDetails, 23.5, 230.0, 340.0);
    expect(rahuResult.kalaBalaCoreTotal).toBeUndefined();
    expect((rahuResult as any).completeKalaBala).toBeUndefined();
    expect(rahuResult.components.length).toBe(9);
    for (const sub of expectedSubcomponents) {
      const comp = rahuResult.components.find(c => c.subcomponent === sub);
      expect(comp).toBeDefined();
      if (sub === ShadbalaSubcomponent.YUDDHA_BALA) {
        expect(comp?.status).toBe(StrengthComponentStatus.NOT_APPLICABLE);
      } else {
        expect(comp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      }
      expect(comp?.value).toBeUndefined();
    }
    expect(rahuResult.components.some(c => c.subcomponent === ShadbalaSubcomponent.KALA_BALA && c.status === StrengthComponentStatus.CALCULATED)).toBe(false);

    // Ketu test
    const ketuResult = calculatePlanetKalaBala(Planet.KETU, birthDetails, 23.5, 230.0, 160.0);
    expect(ketuResult.kalaBalaCoreTotal).toBeUndefined();
    expect((ketuResult as any).completeKalaBala).toBeUndefined();
    expect(ketuResult.components.length).toBe(9);
    for (const sub of expectedSubcomponents) {
      const comp = ketuResult.components.find(c => c.subcomponent === sub);
      expect(comp).toBeDefined();
      if (sub === ShadbalaSubcomponent.YUDDHA_BALA) {
        expect(comp?.status).toBe(StrengthComponentStatus.NOT_APPLICABLE);
      } else {
        expect(comp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      }
      expect(comp?.value).toBeUndefined();
    }
    expect(ketuResult.components.some(c => c.subcomponent === ShadbalaSubcomponent.KALA_BALA && c.status === StrengthComponentStatus.CALCULATED)).toBe(false);
  });

  it('shouldEmitYuddhaBalaEvidenceWhenYuddhaResultIsProvided', () => {
    const yuddhaWarResult = {
      planet: Planet.MARS,
      status: StrengthComponentStatus.NOT_IMPLEMENTED,
      pairs: [
        {
          planetA: Planet.MARS,
          planetB: Planet.MERCURY,
          longitudeA: 100.0,
          longitudeB: 100.5,
          separation: 0.5,
          isYuddha: true,
          ruleId: 'YUDDHA_BALA_001',
          reason: 'Planetary war detected between MARS and MERCURY: angular separation is 0.5000° (< 1°).'
        }
      ],
      reason: 'Planetary war detected for MARS.'
    };

    const marsResult = calculatePlanetKalaBala(Planet.MARS, birthDetails, 23.5, 230.0, 100.0, yuddhaWarResult as any);
    const marsYuddhaComp = marsResult.components.find(c => c.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
    expect(marsYuddhaComp).toBeDefined();
    expect(marsYuddhaComp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
    expect(marsYuddhaComp?.ruleId).toBe('YUDDHA_BALA_001');

    const marsYuddhaEvidence = marsResult.evidence.find(e => e.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
    expect(marsYuddhaEvidence).toBeDefined();
    expect(marsYuddhaEvidence?.ruleId).toBe('YUDDHA_BALA_001');
    expect(marsYuddhaEvidence?.inputs?.opponent).toBe(Planet.MERCURY);
    expect(marsYuddhaEvidence?.inputs?.separation).toBe(0.5);

    // Sun test: should get NOT_APPLICABLE
    const sunResult = calculatePlanetKalaBala(Planet.SUN, birthDetails, 23.5, 230.0, 23.5);
    const sunYuddhaComp = sunResult.components.find(c => c.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
    expect(sunYuddhaComp?.status).toBe(StrengthComponentStatus.NOT_APPLICABLE);
    expect(sunYuddhaComp?.ruleId).toBe('YUDDHA_BALA_NOT_APPLICABLE');
  });

  it('shouldCalculateSunriseIndependentComponentsInPolarConditions', () => {
    const polarDetails: BirthDetails = {
      dateTimeStr: '2023-12-21T12:00:00+00:00',
      latitude: 80.0,
      longitude: 0.0,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI
    };

    const birthInstant = parseUtcDate(polarDetails.dateTimeStr);
    const offsetMinutes = getTimezoneOffsetMinutes(polarDetails.dateTimeStr);
    const solarDay = getSolarDayDetails(polarDetails.latitude, polarDetails.longitude, birthInstant, offsetMinutes);
    expect(solarDay).toBeNull();

    const sunLong = 245.0;
    const moonLong = 15.0;
    const planetLong = 245.0;

    const result = calculatePlanetKalaBala(Planet.SUN, polarDetails, sunLong, moonLong, planetLong);

    // Sunrise-INDEPENDENT: Paksha, Dina, Ayana -> CALCULATED with numeric value
    const pakshaComp = result.components.find(c => c.subcomponent === ShadbalaSubcomponent.PAKSHA_BALA);
    expect(pakshaComp?.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(typeof pakshaComp?.value).toBe('number');

    const dinaComp = result.components.find(c => c.subcomponent === ShadbalaSubcomponent.DINA_BALA);
    expect(dinaComp?.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(typeof dinaComp?.value).toBe('number');

    const ayanaComp = result.components.find(c => c.subcomponent === ShadbalaSubcomponent.AYANA_BALA);
    expect(ayanaComp?.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(typeof ayanaComp?.value).toBe('number');

    // Sunrise-DEPENDENT: Natonnata, Tribhaga, Hora, Varsha, Masa -> NOT_IMPLEMENTED with value === undefined
    const notImplementedSubcomponents = [
      ShadbalaSubcomponent.NATONNATA_BALA,
      ShadbalaSubcomponent.TRIBHAGA_BALA,
      ShadbalaSubcomponent.HORA_BALA,
      ShadbalaSubcomponent.VARSHA_BALA,
      ShadbalaSubcomponent.MASA_BALA
    ];

    for (const sub of notImplementedSubcomponents) {
      const comp = result.components.find(c => c.subcomponent === sub);
      expect(comp).toBeDefined();
      expect(comp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      expect(comp?.value).toBeUndefined();
    }

    const yuddhaComp = result.components.find(c => c.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
    expect(yuddhaComp?.status).toBe(StrengthComponentStatus.NOT_APPLICABLE);
    expect(yuddhaComp?.value).toBeUndefined();

    expect(result.kalaBalaCoreTotal).toBeUndefined();
    expect(result.components.some(c => c.subcomponent === ShadbalaSubcomponent.KALA_BALA && c.status === StrengthComponentStatus.CALCULATED)).toBe(false);
  });
});
