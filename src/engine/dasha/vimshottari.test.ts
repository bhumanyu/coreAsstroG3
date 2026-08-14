import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  getActiveDasha,
  normalizeDegrees,
  rotateDashaSequence,
  addFractionalYears,
  DASHA_YEARS,
  VIMSHOTTARI_YEAR_DAYS,
  MS_PER_VIMSHOTTARI_YEAR
} from './vimshottari';
import { Planet, Sign } from '../../types';
import { correlateDashaAndTransit, DashaState } from '../dashaTransitCorrelation';
import { calculateTransit } from '../transitEngine';
import { analyzeTransits } from '../transitAnalysis';

describe('Vimshottari Dasha Engine (PR-041)', () => {
  const birthIso = '1990-01-01T00:00:00.000Z';
  const birthDate = new Date(birthIso);

  describe('1. normalizeDegrees', () => {
    it('normalizes negative and >360 values correctly', () => {
      expect(normalizeDegrees(0)).toBe(0);
      expect(normalizeDegrees(360)).toBe(0);
      expect(normalizeDegrees(720)).toBe(0);
      expect(normalizeDegrees(400)).toBe(40);
      expect(normalizeDegrees(-30)).toBe(330);
      expect(normalizeDegrees(-390)).toBe(330);
    });

    it('returns normalized moonSiderealLongitude in the timeline when given >360 longitude', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 312.5 + 360
      });
      expect(timeline.moonSiderealLongitude).toBe(312.5);
    });
  });

  describe('2. nakshatra boundaries', () => {
    it('determines correct nakshatra and progress at 0°, 13°20\', 26°40\' and boundary ± epsilon', () => {
      // 0° = Ashwini start
      const t0 = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0
      });
      expect(t0.nakshatra).toBe('Ashwini');
      expect(t0.nakshatraLord).toBe(Planet.KETU);
      expect(t0.nakshatraProgress).toBe(0);
      expect(t0.remainingFraction).toBe(1);

      // 13°20' (13.333333333333334°) = Bharani start
      const t13_20 = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 40 / 3
      });
      expect(t13_20.nakshatra).toBe('Bharani');
      expect(t13_20.nakshatraLord).toBe(Planet.VENUS);
      expect(t13_20.nakshatraProgress).toBe(0);
      expect(t13_20.remainingFraction).toBe(1);

      // Just before 13°20' = Ashwini near end
      const tEpsBefore = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 40 / 3 - 1e-8
      });
      expect(tEpsBefore.nakshatra).toBe('Ashwini');
      expect(tEpsBefore.nakshatraProgress).toBeCloseTo(1, 6);
      expect(tEpsBefore.remainingFraction).toBeCloseTo(0, 6);

      // 26°40' (26.666666666666668°) = Krittika start
      const t26_40 = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 80 / 3
      });
      expect(t26_40.nakshatra).toBe('Krittika');
      expect(t26_40.nakshatraLord).toBe(Planet.SUN);
      expect(t26_40.nakshatraProgress).toBe(0);
    });
  });

  describe('3. starting balance', () => {
    it('computes expected nakshatra, lord, progress, remainingFraction, and balance for Bharani midpoint (20°)', () => {
      // Bharani is from 13.333333° to 26.666666°. Midpoint is 20°.
      const t20 = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 20
      });

      expect(t20.nakshatra).toBe('Bharani');
      expect(t20.nakshatraLord).toBe(Planet.VENUS);
      expect(t20.nakshatraProgress).toBeCloseTo(0.5, 6);
      expect(t20.remainingFraction).toBeCloseTo(0.5, 6);

      // Venus total years = 20. Balance = 20 * 0.5 = 10 years.
      const firstMd = t20.mahadashas[0];
      expect(firstMd.planet).toBe(Planet.VENUS);

      const firstMdDurationMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
      const firstMdDurationYears = firstMdDurationMs / MS_PER_VIMSHOTTARI_YEAR;
      expect(firstMdDurationYears).toBeCloseTo(10.0, 6);
    });
  });

  describe('4. Mahadasha tiling', () => {
    it('tiles Mahadashas continuously over 120 years with zero gap', () => {
      const untilIso = addFractionalYears(birthDate, 120).toISOString();
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 20,
        until: untilIso
      });

      let totalDurationMs = 0;
      for (let i = 0; i < timeline.mahadashas.length; i++) {
        const md = timeline.mahadashas[i];
        const mdStart = new Date(md.start).getTime();
        const mdEnd = new Date(md.end).getTime();
        totalDurationMs += (mdEnd - mdStart);

        if (i < timeline.mahadashas.length - 1) {
          const nextMd = timeline.mahadashas[i + 1];
          expect(md.end).toBe(nextMd.start);
        }
      }

      const totalYears = totalDurationMs / MS_PER_VIMSHOTTARI_YEAR;
      expect(totalYears).toBeCloseTo(120, 6);
      expect(timeline.mahadashas[0].start).toBe(birthIso);
      expect(timeline.mahadashas[timeline.mahadashas.length - 1].end).toBe(untilIso);
    });
  });

  describe('5. Antardasha tiling', () => {
    it('ensures for each Mahadasha that AD[0].start === MD.start, AD[last].end === MD.end, AD[i].end === AD[i+1].start', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 45 // Rohini (Moon)
      });

      for (const md of timeline.mahadashas) {
        expect(md.antardashas.length).toBeGreaterThan(0);
        expect(md.antardashas[0].start).toBe(md.start);
        expect(md.antardashas[md.antardashas.length - 1].end).toBe(md.end);

        for (let i = 0; i < md.antardashas.length - 1; i++) {
          expect(md.antardashas[i].end).toBe(md.antardashas[i + 1].start);
        }
      }
    });
  });

  describe('6. Pratyantardasha tiling', () => {
    it('ensures for each Antardasha that PD[0].start === AD.start, PD[last].end === AD.end, PD[i].end === PD[i+1].start', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 100 // Pushya (Saturn)
      });

      for (const md of timeline.mahadashas) {
        for (const ad of md.antardashas) {
          expect(ad.pratyantardashas.length).toBeGreaterThan(0);
          expect(ad.pratyantardashas[0].start).toBe(ad.start);
          expect(ad.pratyantardashas[ad.pratyantardashas.length - 1].end).toBe(ad.end);

          for (let i = 0; i < ad.pratyantardashas.length - 1; i++) {
            expect(ad.pratyantardashas[i].end).toBe(ad.pratyantardashas[i + 1].start);
          }
        }
      }
    });
  });

  describe('7. sequence rotation', () => {
    it('rotates sequence correctly for various starting lords', () => {
      expect(rotateDashaSequence(Planet.KETU)).toEqual([
        Planet.KETU, Planet.VENUS, Planet.SUN, Planet.MOON, Planet.MARS, Planet.RAHU, Planet.JUPITER, Planet.SATURN, Planet.MERCURY
      ]);

      expect(rotateDashaSequence(Planet.VENUS)).toEqual([
        Planet.VENUS, Planet.SUN, Planet.MOON, Planet.MARS, Planet.RAHU, Planet.JUPITER, Planet.SATURN, Planet.MERCURY, Planet.KETU
      ]);

      expect(rotateDashaSequence(Planet.SATURN)).toEqual([
        Planet.SATURN, Planet.MERCURY, Planet.KETU, Planet.VENUS, Planet.SUN, Planet.MOON, Planet.MARS, Planet.RAHU, Planet.JUPITER
      ]);
    });
  });

  describe('8. getActiveDasha', () => {
    it('returns expected active planets and periods inside MD/AD/PD and tests boundary semantics', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      // At exact birth date (start of timeline)
      const atBirth = getActiveDasha(timeline, birthIso);
      expect(atBirth).not.toBeNull();
      expect(atBirth?.mahadasha.planet).toBe(Planet.KETU);
      expect(atBirth?.antardasha.planet).toBe(Planet.KETU);
      expect(atBirth?.pratyantardasha.planet).toBe(Planet.KETU);

      // Midpoint of Ketu-Ketu-Ketu
      const pd0 = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
      const pd0StartMs = new Date(pd0.start).getTime();
      const pd0EndMs = new Date(pd0.end).getTime();
      const midPointIso = new Date((pd0StartMs + pd0EndMs) / 2).toISOString();

      const atMid = getActiveDasha(timeline, midPointIso);
      expect(atMid?.mahadasha.planet).toBe(Planet.KETU);
      expect(atMid?.antardasha.planet).toBe(Planet.KETU);
      expect(atMid?.pratyantardasha.planet).toBe(Planet.KETU);

      // Boundary test: at exact end of first PD
      const atPdEnd = getActiveDasha(timeline, pd0.end);
      expect(atPdEnd).not.toBeNull();
      // Should fall into second PD (Ketu-Ketu-Venus)
      expect(atPdEnd?.pratyantardasha.planet).toBe(Planet.VENUS);

      // Outside timeline (before birth)
      const beforeBirth = getActiveDasha(timeline, '1989-12-31T23:59:59.000Z');
      expect(beforeBirth).toBeNull();

      // Outside timeline (after end)
      const lastMd = timeline.mahadashas[timeline.mahadashas.length - 1];
      const afterEnd = getActiveDasha(timeline, addFractionalYears(new Date(lastMd.end), 1).toISOString());
      expect(afterEnd).toBeNull();
    });
  });

  describe('9. precision', () => {
    it('preserves fractional balance without integer truncation', () => {
      // 10° in Ashwini (span 13.333333°). Progress = 10 / 13.333333 = 0.75.
      // Remaining = 0.25. Ketu total = 7 years. Balance = 1.75 years.
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 10
      });

      expect(timeline.nakshatraProgress).toBeCloseTo(0.75, 5);
      expect(timeline.remainingFraction).toBeCloseTo(0.25, 5);

      const firstMd = timeline.mahadashas[0];
      const durMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
      const durYears = durMs / MS_PER_VIMSHOTTARI_YEAR;
      expect(durYears).toBeCloseTo(1.75, 5);
    });
  });

  describe('10. invalid input', () => {
    it('throws TypeError for invalid date or NaN longitude or missing parameters', () => {
      expect(() => calculateVimshottari(null as any)).toThrow(TypeError);
      expect(() => calculateVimshottari({ birthDateTime: 'invalid', moonSiderealLongitude: 10 })).toThrow(TypeError);
      expect(() => calculateVimshottari({ birthDateTime: birthIso, moonSiderealLongitude: NaN })).toThrow(TypeError);
      expect(() => calculateVimshottari({ birthDateTime: birthIso, moonSiderealLongitude: Infinity })).toThrow(TypeError);
      expect(() => calculateVimshottari({ birthDateTime: birthIso, moonSiderealLongitude: 10, until: 'invalid' })).toThrow(TypeError);
      expect(() => calculateVimshottari({ birthDateTime: birthIso, moonSiderealLongitude: 10, until: '1980-01-01T00:00:00Z' })).toThrow(TypeError);
    });
  });

  describe('11. immutability', () => {
    it('freezes returned timeline and nested arrays/objects', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 50
      });

      expect(Object.isFrozen(timeline)).toBe(true);
      expect(Object.isFrozen(timeline.mahadashas)).toBe(true);

      const md0 = timeline.mahadashas[0];
      expect(Object.isFrozen(md0)).toBe(true);
      expect(Object.isFrozen(md0.antardashas)).toBe(true);

      const ad0 = md0.antardashas[0];
      expect(Object.isFrozen(ad0)).toBe(true);
      expect(Object.isFrozen(ad0.pratyantardashas)).toBe(true);

      const pd0 = ad0.pratyantardashas[0];
      expect(Object.isFrozen(pd0)).toBe(true);
    });
  });

  describe('12. integration smoke', () => {
    it('converts getActiveDasha result to PR-039 DashaState shape and calls correlateDashaAndTransit without exceptions', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const activeState = getActiveDasha(timeline, birthIso);
      expect(activeState).not.toBeNull();

      if (activeState) {
        const dashaState: DashaState = {
          mahadashaPlanet: activeState.mahadasha.planet,
          antardashaPlanet: activeState.antardasha.planet,
          pratyantardashaPlanet: activeState.pratyantardasha.planet
        };

        const rawTransit = calculateTransit({
          at: birthIso,
          natalMoonLongitude: 0,
          natalAscendantLongitude: 0,
          transitLongitudes: { [Planet.KETU]: 10 }
        });

        const transitReport = analyzeTransits({ transit: rawTransit });

        expect(() => {
          correlateDashaAndTransit({
            dasha: dashaState,
            transit: transitReport
          });
        }).not.toThrow();
      }
    });
  });

  describe('13. Golden Reference Validation Chart', () => {
    it('verifies a known benchmark chart against reference Jyotish Vimshottari calculations (365.25 day/yr standard)', () => {
      // Benchmark Chart:
      // Birth: 1988-05-08T09:30:00.000Z
      // Sidereal Moon Longitude: 312.5° (24th Nakshatra: Shatabhisha, 306°40' to 320°00')
      // Reference source: Standard 365.25-day Lahiri Vimshottari Dasha calculation (B.V. Raman / Jagannatha Hora reference)
      // Nakshatra: Shatabhisha
      // Nakshatra Lord: Rahu (18 years full duration)
      // Progress: 5.833333333° / 13.333333333° = 0.4375 (43.75%)
      // Remaining Fraction: 1 - 0.4375 = 0.5625 (56.25%)
      // Remaining Rahu MD balance: 18 * 0.5625 = 10.125 years (3698.15625 days)

      const timeline = calculateVimshottari({
        birthDateTime: '1988-05-08T09:30:00.000Z',
        moonSiderealLongitude: 312.5
      });

      expect(timeline.nakshatra).toBe('Shatabhisha');
      expect(timeline.nakshatraLord).toBe(Planet.RAHU);
      expect(timeline.nakshatraProgress).toBeCloseTo(0.4375, 4);
      expect(timeline.remainingFraction).toBeCloseTo(0.5625, 4);

      // First Mahadasha (Rahu)
      const rahuMd = timeline.mahadashas[0];
      expect(rahuMd.planet).toBe(Planet.RAHU);
      expect(rahuMd.start).toBe('1988-05-08T09:30:00.000Z');
      expect(rahuMd.end.startsWith('1998-06-23T13:15:00')).toBe(true);

      // Second Mahadasha (Jupiter)
      const jupiterMd = timeline.mahadashas[1];
      expect(jupiterMd.planet).toBe(Planet.JUPITER);
      expect(jupiterMd.start).toBe(rahuMd.end);
      expect(jupiterMd.end.startsWith('2014-06-23T13:15:00')).toBe(true);

      // First Antardasha (Rahu - Rahu)
      const rahuRahuAd = rahuMd.antardashas[0];
      expect(rahuRahuAd.planet).toBe(Planet.RAHU);
      expect(rahuRahuAd.start).toBe('1988-05-08T09:30:00.000Z');
      expect(rahuRahuAd.end).toBe('1989-11-14T02:51:45.000Z');
    });
  });
});
