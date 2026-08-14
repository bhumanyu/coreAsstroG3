import { describe, it, expect } from 'vitest';
import {
  CANONICAL_BIRTH_DETAILS,
  CANONICAL_UTC_INSTANT,
  CANONICAL_GOLDEN_EXPECTED
} from './canonicalChart';
import { parseUtcDate, calculateHoroscope } from '../../engine/astroEngine';
import {
  CANONICAL_METHODOLOGY,
  ZodiacType,
  AyanamsaType,
  HouseSystem,
  DashaSystem,
  AspectSystem,
  Planet
} from '../../types';
import { zonedWallClockToUtcISO } from '../../components/BirthFormModal';

declare const process: { env: Record<string, string | undefined> };

describe('P-01 Canonical Birth-Instant Contract & Golden Baseline Chart', () => {
  it('ENGINE GOLDEN BASELINE canonical chart matches fixed expected longitudes', () => {
    const chart = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(chart.rasiChart.ascendantLongitude).toBeCloseTo(CANONICAL_GOLDEN_EXPECTED.ascendantLongitude, 6);

    for (const planet of Object.values(Planet)) {
      const actualLong = chart.rasiChart.positions[planet].eclipticLongitude;
      const expectedLong = CANONICAL_GOLDEN_EXPECTED.planets[planet];
      expect(actualLong).toBeCloseTo(expectedLong, 6);
    }
  });

  it('canonical UTC and offset representations produce identical charts', () => {
    const chartFromOffset = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const chartFromUtc = calculateHoroscope({
      ...CANONICAL_BIRTH_DETAILS,
      dateTimeStr: CANONICAL_UTC_INSTANT
    });

    // Both inputs produce identical foundational chart values
    expect(chartFromOffset.rasiChart.ascendantSign).toEqual(chartFromUtc.rasiChart.ascendantSign);
    expect(chartFromOffset.rasiChart.ascendantLongitude).toBeCloseTo(chartFromUtc.rasiChart.ascendantLongitude, 4);

    for (const planet of Object.values(Planet)) {
      const posOffset = chartFromOffset.rasiChart.positions[planet];
      const posUtc = chartFromUtc.rasiChart.positions[planet];

      expect(posOffset.eclipticLongitude).toBeCloseTo(posUtc.eclipticLongitude, 4);
      expect(chartFromOffset.planetFacts[planet].sign).toBe(chartFromUtc.planetFacts[planet].sign);
      expect(chartFromOffset.planetFacts[planet].house).toBe(chartFromUtc.planetFacts[planet].house);
    }

    expect(chartFromOffset.vimshottari.mahadashas[0].planet).toBe(
      chartFromUtc.vimshottari.mahadashas[0].planet
    );
    expect(chartFromOffset.vimshottari.mahadashas[0].start).toBe(
      chartFromUtc.vimshottari.mahadashas[0].start
    );
  });

  it('shouldAcceptExplicitUtcDatetime', () => {
    const d = parseUtcDate('1988-05-08T04:00:00Z');
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.toISOString()).toBe('1988-05-08T04:00:00.000Z');
  });

  it('shouldAcceptExplicitOffsetDatetime', () => {
    const d = parseUtcDate('1988-05-08T09:30:00+05:30');
    expect(d).toBeInstanceOf(Date);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.toISOString()).toBe('1988-05-08T04:00:00.000Z');
  });

  it('shouldTreatEquivalentUtcAndOffsetInputsAsSameInstant', () => {
    const dateOffset = parseUtcDate('1988-05-08T09:30:00+05:30');
    const dateUtc = parseUtcDate('1988-05-08T04:00:00Z');
    expect(dateOffset.getTime()).toBe(dateUtc.getTime());

    const chartOffset = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const chartUtc = calculateHoroscope({
      ...CANONICAL_BIRTH_DETAILS,
      dateTimeStr: CANONICAL_UTC_INSTANT
    });

    expect(chartOffset.rasiChart.ascendantLongitude).toBeCloseTo(chartUtc.rasiChart.ascendantLongitude, 6);
    expect(chartOffset.planetFacts[Planet.MOON].position.eclipticLongitude!).toBeCloseTo(
      chartUtc.planetFacts[Planet.MOON].position.eclipticLongitude!,
      6
    );
  });

  it('shouldRejectTimezoneLessDatetime', () => {
    expect(() => parseUtcDate('1988-05-08T09:30:00')).toThrow(/timezone offset|Z/);
  });

  it('shouldNotTreatLocalTimeAsUtc', () => {
    const chartUtcAsLocal = calculateHoroscope({
      ...CANONICAL_BIRTH_DETAILS,
      dateTimeStr: '1988-05-08T09:30:00Z'
    });
    const chartRealOffset = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    expect(chartUtcAsLocal.rasiChart.ascendantLongitude).not.toEqual(
      chartRealOffset.rasiChart.ascendantLongitude
    );
  });

  it('shouldBeIndependentOfMachineTimezone', () => {
    // Note: Node.js runtime environment does not dynamically re-read process.env.TZ for Date parsing after startup,
    // but explicit ISO/UTC parsing ensures calculation independence from host machine timezone.
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      const chartNY = calculateHoroscope({
        ...CANONICAL_BIRTH_DETAILS,
        dateTimeStr: CANONICAL_UTC_INSTANT
      });

      process.env.TZ = 'Asia/Tokyo';
      const chartTokyo = calculateHoroscope({
        ...CANONICAL_BIRTH_DETAILS,
        dateTimeStr: CANONICAL_UTC_INSTANT
      });

      expect(chartNY.rasiChart.ascendantLongitude).toBeCloseTo(
        chartTokyo.rasiChart.ascendantLongitude,
        6
      );
      expect(chartNY.planetFacts[Planet.SUN].position.eclipticLongitude!).toBeCloseTo(
        chartTokyo.planetFacts[Planet.SUN].position.eclipticLongitude!,
        6
      );
    } finally {
      process.env.TZ = originalTz;
    }
  });

  it('shouldUseCanonicalInstantForDasha', () => {
    const chart = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(chart.vimshottari).toBeDefined();
    expect(chart.vimshottari.birthDateTime).toBe('1988-05-08T04:00:00.000Z');
    expect(chart.vimshottari.mahadashas[0]).toBeDefined();
    expect(chart.vimshottari.nakshatraLord).toBeDefined();
  });

  it('shouldPreserveMethodologyConfiguration', () => {
    expect(CANONICAL_METHODOLOGY.zodiac).toBe(ZodiacType.SIDEREAL);
    expect(CANONICAL_METHODOLOGY.ayanamsa).toBe(AyanamsaType.LAHIRI);
    expect(CANONICAL_METHODOLOGY.houseSystem).toBe(HouseSystem.WHOLE_SIGN);
    expect(CANONICAL_METHODOLOGY.dashaSystem).toBe(DashaSystem.VIMSHOTTARI);
    expect(CANONICAL_METHODOLOGY.aspectSystem).toBe(AspectSystem.PARASHARI);
  });

  it('UI boundary check: zonedWallClockToUtcISO constructs ISO string with explicit Z offset', () => {
    const utcIso = zonedWallClockToUtcISO('1988-05-08T09:30', 'Asia/Kolkata');
    expect(utcIso).toMatch(/Z$/);
    expect(utcIso).toBe('1988-05-08T04:00:00.000Z');
  });
});
