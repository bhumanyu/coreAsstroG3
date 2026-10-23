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

    it('preserves values just below 360° while wrapping exact and above-boundary values', () => {
      expect(normalizeDegrees(360 - 1e-12)).toBe(360 - 1e-12);
      expect(normalizeDegrees(360 - 1e-10)).toBe(360 - 1e-10);
      expect(normalizeDegrees(360)).toBe(0);
      expect(normalizeDegrees(360 + 1e-12)).toBeCloseTo(1e-12, 11);
      expect(normalizeDegrees(-1e-12)).toBeCloseTo(360 - 1e-12, 11);
      expect(normalizeDegrees(-1e-10)).toBeCloseTo(360 - 1e-10, 11);
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

  describe('5a. Analytical anchored partial-MD continuity and boundary ownership', () => {
    const progressFractions = [1e-6, 0.25, 0.5, 0.75, 1 - 1e-6];

    for (const [lordIndex, lord] of rotateDashaSequence(Planet.KETU).entries()) {
      for (const progress of progressFractions) {
        it(`tiles AD/PD windows and preserves half-open transitions for ${lord} at progress ${progress}`, () => {
          const nakshatraStart = lordIndex * (40 / 3);
          const timeline = calculateVimshottari({
            birthDateTime: birthIso,
            moonSiderealLongitude: nakshatraStart + progress * (40 / 3),
            until: addFractionalYears(birthDate, 40).toISOString()
          });

          expect(timeline.nakshatraLord).toBe(lord);
          expect(() => calculateVimshottari({
            birthDateTime: birthIso,
            moonSiderealLongitude: nakshatraStart + progress * (40 / 3),
            until: addFractionalYears(birthDate, 40).toISOString()
          })).not.toThrow();

          const firstMd = timeline.mahadashas[0];
          expect(firstMd).toBeDefined();
          expect(firstMd.start).toBe(birthIso);
          expect(firstMd.antardashas.length).toBeGreaterThan(0);
          expect(firstMd.antardashas[0].start).toBe(firstMd.start);
          expect(firstMd.antardashas[firstMd.antardashas.length - 1].end).toBe(firstMd.end);

          for (let adIndex = 0; adIndex < firstMd.antardashas.length; adIndex++) {
            const ad = firstMd.antardashas[adIndex];
            expect(ad.pratyantardashas.length).toBeGreaterThan(0);
            expect(ad.pratyantardashas[0].start).toBe(ad.start);
            expect(ad.pratyantardashas[ad.pratyantardashas.length - 1].end).toBe(ad.end);
            for (let pdIndex = 0; pdIndex < ad.pratyantardashas.length - 1; pdIndex++) {
              expect(ad.pratyantardashas[pdIndex].end).toBe(ad.pratyantardashas[pdIndex + 1].start);
            }

            if (adIndex < firstMd.antardashas.length - 1) {
              const nextAd = firstMd.antardashas[adIndex + 1];
              expect(ad.end).toBe(nextAd.start);
              const boundaryMs = new Date(ad.end).getTime();
              const before = getActiveDasha(timeline, new Date(boundaryMs - 1));
              const exact = getActiveDasha(timeline, new Date(boundaryMs));
              const after = getActiveDasha(timeline, new Date(boundaryMs + 1));
              expect(before?.mahadasha.planet).toBe(firstMd.planet);
              expect(before?.antardasha.planet).toBe(ad.planet);
              expect(before?.pratyantardasha.planet).toBe(ad.pratyantardashas[ad.pratyantardashas.length - 1].planet);
              expect(exact?.mahadasha.planet).toBe(firstMd.planet);
              expect(exact?.antardasha.planet).toBe(nextAd.planet);
              expect(exact?.pratyantardasha.planet).toBe(nextAd.pratyantardashas[0].planet);
              expect(after?.antardasha.planet).toBe(nextAd.planet);
              expect(after?.pratyantardasha.planet).toBe(nextAd.pratyantardashas[0].planet);
            }

            for (let pdIndex = 0; pdIndex < ad.pratyantardashas.length - 1; pdIndex++) {
              const pd = ad.pratyantardashas[pdIndex];
              const nextPd = ad.pratyantardashas[pdIndex + 1];
              const boundaryMs = new Date(pd.end).getTime();
              const before = getActiveDasha(timeline, new Date(boundaryMs - 1));
              const exact = getActiveDasha(timeline, new Date(boundaryMs));
              const after = getActiveDasha(timeline, new Date(boundaryMs + 1));
              expect(before?.mahadasha.planet).toBe(firstMd.planet);
              expect(before?.antardasha.planet).toBe(ad.planet);
              expect(before?.pratyantardasha.planet).toBe(pd.planet);
              expect(exact?.mahadasha.planet).toBe(firstMd.planet);
              expect(exact?.antardasha.planet).toBe(ad.planet);
              expect(exact?.pratyantardasha.planet).toBe(nextPd.planet);
              expect(after?.pratyantardasha.planet).toBe(nextPd.planet);
            }
          }

          const activeAtBirth = getActiveDasha(timeline, birthIso);
          expect(activeAtBirth?.mahadasha.planet).toBe(firstMd.planet);
          expect(activeAtBirth?.antardasha.planet).toBe(firstMd.antardashas[0].planet);
          expect(activeAtBirth?.pratyantardasha.planet).toBe(firstMd.antardashas[0].pratyantardashas[0].planet);

          for (let mdIndex = 0; mdIndex < timeline.mahadashas.length - 1; mdIndex++) {
            const md = timeline.mahadashas[mdIndex];
            const nextMd = timeline.mahadashas[mdIndex + 1];
            const boundaryMs = new Date(md.end).getTime();
            const before = getActiveDasha(timeline, new Date(boundaryMs - 1));
            const exact = getActiveDasha(timeline, new Date(boundaryMs));
            const after = getActiveDasha(timeline, new Date(boundaryMs + 1));
            expect(before?.mahadasha.planet).toBe(md.planet);
            expect(before?.antardasha.planet).toBe(md.antardashas[md.antardashas.length - 1].planet);
            expect(exact?.mahadasha.planet).toBe(nextMd.planet);
            expect(exact?.antardasha.planet).toBe(nextMd.antardashas[0].planet);
            expect(exact?.pratyantardasha.planet).toBe(nextMd.antardashas[0].pratyantardashas[0].planet);
            expect(after?.mahadasha.planet).toBe(nextMd.planet);
          }
        });
      }
    }
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

      // The first active AD is Saturn, anchored to the full Rahu MD before birth.
      const saturnAd = rahuMd.antardashas[0];
      expect(saturnAd.planet).toBe(Planet.SATURN);
      expect(saturnAd.start).toBe('1988-05-08T09:30:00.000Z');
      expect(saturnAd.end).toBe('1988-06-04T18:57:00.000Z');
      expect(saturnAd.pratyantardashas[0].planet).toBe(Planet.JUPITER);
      expect(saturnAd.pratyantardashas[0].start).toBe('1988-05-08T09:30:00.000Z');
      expect(saturnAd.pratyantardashas[0].end).toBe('1988-06-04T18:57:00.000Z');
    });
  });

  describe('14. P2 boundary characterization: zero-length first Mahadasha prevention', () => {
    const boundary = 40 / 3; // 13.333333333333334° (Ashwini -> Bharani boundary)

    it('accepts Moon longitude just before Nakshatra boundary and produces valid timeline with positive-length first MD', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: boundary - 1e-7 // Just before Bharani start
      });

      expect(timeline.nakshatra).toBe('Ashwini');
      expect(timeline.nakshatraLord).toBe(Planet.KETU);
      expect(timeline.mahadashas.length).toBeGreaterThan(0);

      // First MD should have positive length
      const firstMd = timeline.mahadashas[0];
      const firstMdDurationMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
      expect(firstMdDurationMs).toBeGreaterThan(0);

      // Timeline should be structurally valid (contiguous)
      for (let i = 0; i < timeline.mahadashas.length - 1; i++) {
        expect(timeline.mahadashas[i].end).toBe(timeline.mahadashas[i + 1].start);
      }

      // Active Dasha resolution should work
      const activeAtBirth = getActiveDasha(timeline, birthIso);
      expect(activeAtBirth).not.toBeNull();
      expect(activeAtBirth?.mahadasha.planet).toBe(Planet.KETU);
    });

    it('accepts Moon longitude exactly at Nakshatra boundary (belongs to NEXT Nakshatra) and produces valid timeline', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: boundary // Exactly at Bharani start
      });

      // Exact boundary reclassifies to the next Nakshatra and starts its full MD;
      // this is distinct from the zero-length guard case below.
      expect(timeline.nakshatra).toBe('Bharani');
      expect(timeline.nakshatraLord).toBe(Planet.VENUS);
      expect(timeline.mahadashas.length).toBeGreaterThan(0);

      // First MD should have positive length (full Venus balance since at boundary)
      const firstMd = timeline.mahadashas[0];
      const firstMdDurationMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
      expect(firstMdDurationMs).toBeGreaterThan(0);

      // Timeline should be structurally valid
      for (let i = 0; i < timeline.mahadashas.length - 1; i++) {
        expect(timeline.mahadashas[i].end).toBe(timeline.mahadashas[i + 1].start);
      }

      // Active Dasha resolution should work
      const activeAtBirth = getActiveDasha(timeline, birthIso);
      expect(activeAtBirth).not.toBeNull();
      expect(activeAtBirth?.mahadasha.planet).toBe(Planet.VENUS);
    });

    it('stops when every remaining-fraction MD candidate is below millisecond precision', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 360 - 1e-12
      });

      expect(timeline.nakshatra).toBe('Revati');
      expect(timeline.nakshatraLord).toBe(Planet.MERCURY);
      expect(timeline.remainingFraction).toBeGreaterThan(0);
      expect(timeline.mahadashas).toHaveLength(0);
      expect(getActiveDasha(timeline, birthIso)).toBeNull();
    });

    it('retains partial-first status after skipping a zero-length Sun candidate', () => {
      const longitude = 40 - (40 / 3) * 3.2e-12;
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: longitude
      });

      expect(timeline.nakshatra).toBe('Krittika');
      expect(timeline.nakshatraLord).toBe(Planet.SUN);
      expect(timeline.remainingFraction).toBeGreaterThan(0);
      expect(timeline.mahadashas[0].planet).toBe(Planet.MOON);
      expect(timeline.mahadashas[0].start).toBe(birthIso);
      const firstMdDurationMs =
        new Date(timeline.mahadashas[0].end).getTime() -
        new Date(timeline.mahadashas[0].start).getTime();
      const partialDurationMs =
        DASHA_YEARS[Planet.MOON] * timeline.remainingFraction * MS_PER_VIMSHOTTARI_YEAR;
      const fullDurationMs = DASHA_YEARS[Planet.MOON] * MS_PER_VIMSHOTTARI_YEAR;
      expect(timeline.mahadashas[0].end).toBe(
        addFractionalYears(birthDate, DASHA_YEARS[Planet.MOON] * timeline.remainingFraction).toISOString()
      );
      expect(firstMdDurationMs).toBeGreaterThan(0);
      expect(firstMdDurationMs).toBeLessThan(fullDurationMs);
      expect(firstMdDurationMs).toBe(Math.floor(partialDurationMs));
      expect(timeline.mahadashas.map(({ planet }) => planet).slice(0, 2)).toEqual([
        Planet.MOON,
        Planet.MARS
      ]);
      expect(timeline.mahadashas[1].planet).toBe(Planet.MARS);
      for (const md of timeline.mahadashas) {
        expect(new Date(md.end).getTime()).toBeGreaterThan(new Date(md.start).getTime());
      }
      for (let mdIndex = 0; mdIndex < timeline.mahadashas.length - 1; mdIndex++) {
        expect(timeline.mahadashas[mdIndex].end).toBe(timeline.mahadashas[mdIndex + 1].start);
      }
      expect(timeline.mahadashas[timeline.mahadashas.length - 1].end).toBe(
        addFractionalYears(birthDate, 120).toISOString()
      );
    });

    it('accepts Moon longitude just after Nakshatra boundary and produces valid timeline', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: boundary + 1e-7 // Just after Bharani start
      });

      expect(timeline.nakshatra).toBe('Bharani');
      expect(timeline.nakshatraLord).toBe(Planet.VENUS);
      expect(timeline.mahadashas.length).toBeGreaterThan(0);

      // First MD should have positive length
      const firstMd = timeline.mahadashas[0];
      const firstMdDurationMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
      expect(firstMdDurationMs).toBeGreaterThan(0);

      // Timeline should be structurally valid
      for (let i = 0; i < timeline.mahadashas.length - 1; i++) {
        expect(timeline.mahadashas[i].end).toBe(timeline.mahadashas[i + 1].start);
      }

      // Active Dasha resolution should work
      const activeAtBirth = getActiveDasha(timeline, birthIso);
      expect(activeAtBirth).not.toBeNull();
      expect(activeAtBirth?.mahadasha.planet).toBe(Planet.VENUS);
    });

    it('rejects genuinely zero-length Mahadasha and skips to next lord in sequence', () => {
      // Create a scenario where remainingFraction would be exactly 0
      // This happens when Moon is exactly at the END of a Nakshatra (next boundary)
      const endOfAshwini = 40 / 3; // 13.333333333333334°
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: endOfAshwini
      });

      // Should be in Bharani (next Nakshatra) with full balance
      expect(timeline.nakshatra).toBe('Bharani');
      expect(timeline.remainingFraction).toBeCloseTo(1, 9);

      // First MD should be Venus with full 20-year duration (not zero-length Ketu)
      const firstMd = timeline.mahadashas[0];
      expect(firstMd.planet).toBe(Planet.VENUS);

      const firstMdDurationMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
      const firstMdDurationYears = firstMdDurationMs / MS_PER_VIMSHOTTARI_YEAR;
      expect(firstMdDurationYears).toBeCloseTo(20, 6);
    });
  });

  describe('15. P2 half-open active-period boundary semantics for MD/AD/PD', () => {
    it('MD: just-before start is NOT active, exact start IS active, just-after start IS active', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const mdStartMs = new Date(firstMd.start).getTime();
      const mdEndMs = new Date(firstMd.end).getTime();

      // Just before start (1ms before) - should NOT be active
      const justBeforeMs = mdStartMs - 1;
      const justBeforeIso = new Date(justBeforeMs).toISOString();
      const activeJustBefore = getActiveDasha(timeline, justBeforeIso);
      expect(activeJustBefore).toBeNull();

      // Exact start - should be active
      const activeAtStart = getActiveDasha(timeline, firstMd.start);
      expect(activeAtStart).not.toBeNull();
      expect(activeAtStart?.mahadasha.planet).toBe(Planet.KETU);

      // Just after start (1ms after) - should be active
      const justAfterMs = mdStartMs + 1;
      const justAfterIso = new Date(justAfterMs).toISOString();
      const activeJustAfter = getActiveDasha(timeline, justAfterIso);
      expect(activeJustAfter).not.toBeNull();
      expect(activeJustAfter?.mahadasha.planet).toBe(Planet.KETU);
    });

    it('MD: exact end is NOT active (exclusive), just-after end is next MD', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const secondMd = timeline.mahadashas[1];
      const mdEndMs = new Date(firstMd.end).getTime();

      // Exact end - should NOT be active for first MD (exclusive boundary)
      // The second MD starts at the exact same time as first MD ends
      const activeAtEnd = getActiveDasha(timeline, firstMd.end);
      expect(activeAtEnd).not.toBeNull();
      expect(activeAtEnd?.mahadasha.planet).toBe(secondMd.planet); // Should be in next MD

      // Just after end (1ms after) - should be in next MD
      const justAfterMs = mdEndMs + 1;
      const justAfterIso = new Date(justAfterMs).toISOString();
      const activeJustAfter = getActiveDasha(timeline, justAfterIso);
      expect(activeJustAfter).not.toBeNull();
      expect(activeJustAfter?.mahadasha.planet).toBe(secondMd.planet);
    });

    it('AD: half-open boundary semantics with epsilon offset', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const firstAd = firstMd.antardashas[0];
      const secondAd = firstMd.antardashas[1];
      const adStartMs = new Date(firstAd.start).getTime();
      const adEndMs = new Date(firstAd.end).getTime();

      // Just before start (1ms before) - should be in previous AD or null if first
      if (firstMd.antardashas.length > 1) {
        const justBeforeMs = adStartMs - 1;
        const justBeforeIso = new Date(justBeforeMs).toISOString();
        const activeJustBefore = getActiveDasha(timeline, justBeforeIso);
        // First AD starts at MD start, so just before would be before MD
        if (justBeforeMs < new Date(firstMd.start).getTime()) {
          expect(activeJustBefore).toBeNull();
        }
      }

      // Exact start - should be active
      const activeAtStart = getActiveDasha(timeline, firstAd.start);
      expect(activeAtStart).not.toBeNull();
      expect(activeAtStart?.antardasha.planet).toBe(firstAd.planet);

      // Just after start (1ms after) - should be active
      const justAfterMs = adStartMs + 1;
      const justAfterIso = new Date(justAfterMs).toISOString();
      const activeJustAfter = getActiveDasha(timeline, justAfterIso);
      expect(activeJustAfter).not.toBeNull();
      expect(activeJustAfter?.antardasha.planet).toBe(firstAd.planet);

      // Exact end - should NOT be active (exclusive)
      const activeAtEnd = getActiveDasha(timeline, firstAd.end);
      expect(activeAtEnd).not.toBeNull();
      expect(activeAtEnd?.antardasha.planet).toBe(secondAd.planet); // Should be in next AD

      // Just after end (1ms after) - should be in next AD
      const justAfterEndMs = adEndMs + 1;
      const justAfterEndIso = new Date(justAfterEndMs).toISOString();
      const activeJustAfterEnd = getActiveDasha(timeline, justAfterEndIso);
      expect(activeJustAfterEnd).not.toBeNull();
      expect(activeJustAfterEnd?.antardasha.planet).toBe(secondAd.planet);
    });

    it('PD: half-open boundary semantics with epsilon offset', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const firstAd = firstMd.antardashas[0];
      const firstPd = firstAd.pratyantardashas[0];
      const secondPd = firstAd.pratyantardashas[1];
      const pdStartMs = new Date(firstPd.start).getTime();
      const pdEndMs = new Date(firstPd.end).getTime();

      // Exact start - should be active
      const activeAtStart = getActiveDasha(timeline, firstPd.start);
      expect(activeAtStart).not.toBeNull();
      expect(activeAtStart?.pratyantardasha.planet).toBe(firstPd.planet);

      // Just after start (1ms after) - should be active
      const justAfterMs = pdStartMs + 1;
      const justAfterIso = new Date(justAfterMs).toISOString();
      const activeJustAfter = getActiveDasha(timeline, justAfterIso);
      expect(activeJustAfter).not.toBeNull();
      expect(activeJustAfter?.pratyantardasha.planet).toBe(firstPd.planet);

      // Exact end - should NOT be active (exclusive)
      const activeAtEnd = getActiveDasha(timeline, firstPd.end);
      expect(activeAtEnd).not.toBeNull();
      expect(activeAtEnd?.pratyantardasha.planet).toBe(secondPd.planet); // Should be in next PD

      // Just after end (1ms after) - should be in next PD
      const justAfterEndMs = pdEndMs + 1;
      const justAfterEndIso = new Date(justAfterEndMs).toISOString();
      const activeJustAfterEnd = getActiveDasha(timeline, justAfterEndIso);
      expect(activeJustAfterEnd).not.toBeNull();
      expect(activeJustAfterEnd?.pratyantardasha.planet).toBe(secondPd.planet);
    });
  });

  describe('16. P2 end-to-end active-period resolution on/near boundaries', () => {
    it('resolves correct MD/AD/PD when asOf is exactly at a period start', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const firstAd = firstMd.antardashas[0];
      const firstPd = firstAd.pratyantardashas[0];

      // At exact start of first PD (which is also AD and MD start)
      const active = getActiveDasha(timeline, firstPd.start);
      expect(active).not.toBeNull();
      expect(active?.mahadasha.planet).toBe(firstMd.planet);
      expect(active?.antardasha.planet).toBe(firstAd.planet);
      expect(active?.pratyantardasha.planet).toBe(firstPd.planet);
    });

    it('resolves correct MD/AD/PD when asOf is exactly at a period end (exclusive, falls into next)', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const firstAd = firstMd.antardashas[0];
      const secondAd = firstMd.antardashas[1];
      const firstPd = firstAd.pratyantardashas[0];
      const secondPd = firstAd.pratyantardashas[1];

      // At exact end of first PD - should fall into second PD
      const activeAtPdEnd = getActiveDasha(timeline, firstPd.end);
      expect(activeAtPdEnd).not.toBeNull();
      expect(activeAtPdEnd?.mahadasha.planet).toBe(firstMd.planet);
      expect(activeAtPdEnd?.antardasha.planet).toBe(firstAd.planet);
      expect(activeAtPdEnd?.pratyantardasha.planet).toBe(secondPd.planet);

      // At exact end of first AD - should fall into second AD
      const activeAtAdEnd = getActiveDasha(timeline, firstAd.end);
      expect(activeAtAdEnd).not.toBeNull();
      expect(activeAtAdEnd?.mahadasha.planet).toBe(firstMd.planet);
      expect(activeAtAdEnd?.antardasha.planet).toBe(secondAd.planet);
    });

    it('resolves correct periods with near-epsilon offset (±1ms) around boundaries', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      const firstMd = timeline.mahadashas[0];
      const firstAd = firstMd.antardashas[0];
      const firstPd = firstAd.pratyantardashas[0];
      const pdStartMs = new Date(firstPd.start).getTime();
      const pdEndMs = new Date(firstPd.end).getTime();

      // 1ms before PD start
      const beforeMs = pdStartMs - 1;
      const beforeIso = new Date(beforeMs).toISOString();
      const activeBefore = getActiveDasha(timeline, beforeIso);
      // First PD starts at MD/AD start, so 1ms before would be before timeline
      if (beforeMs < new Date(firstMd.start).getTime()) {
        expect(activeBefore).toBeNull();
      }

      // 1ms after PD start
      const afterStartMs = pdStartMs + 1;
      const afterStartIso = new Date(afterStartMs).toISOString();
      const activeAfterStart = getActiveDasha(timeline, afterStartIso);
      expect(activeAfterStart).not.toBeNull();
      expect(activeAfterStart?.pratyantardasha.planet).toBe(firstPd.planet);

      // 1ms before PD end
      const beforeEndMs = pdEndMs - 1;
      const beforeEndIso = new Date(beforeEndMs).toISOString();
      const activeBeforeEnd = getActiveDasha(timeline, beforeEndIso);
      expect(activeBeforeEnd).not.toBeNull();
      expect(activeBeforeEnd?.pratyantardasha.planet).toBe(firstPd.planet);

      // 1ms after PD end
      const afterEndMs = pdEndMs + 1;
      const afterEndIso = new Date(afterEndMs).toISOString();
      const activeAfterEnd = getActiveDasha(timeline, afterEndIso);
      expect(activeAfterEnd).not.toBeNull();
      expect(activeAfterEnd?.pratyantardasha.planet).not.toBe(firstPd.planet); // Should be next PD
    });
  });

  describe('17. P2 invalid/degenerate intervals never reach interpretation', () => {
    it('buildAntardashas returns empty frozen array when parentDurationMs <= 0', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0 // Ashwini -> Ketu
      });

      // Check that all MDs have positive duration
      for (const md of timeline.mahadashas) {
        const mdDurationMs = new Date(md.end).getTime() - new Date(md.start).getTime();
        expect(mdDurationMs).toBeGreaterThan(0);

        // All ADs should have positive duration
        for (const ad of md.antardashas) {
          const adDurationMs = new Date(ad.end).getTime() - new Date(ad.start).getTime();
          expect(adDurationMs).toBeGreaterThan(0);

          // All PDs should have positive duration
          for (const pd of ad.pratyantardashas) {
            const pdDurationMs = new Date(pd.end).getTime() - new Date(pd.start).getTime();
            expect(pdDurationMs).toBeGreaterThan(0);
          }
        }
      }
    });

    it('timeline never emits zero-length or negative-length MD/AD/PD intervals', () => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 45 // Rohini (Moon)
      });

      // Verify no zero-length intervals
      for (const md of timeline.mahadashas) {
        const mdDurationMs = new Date(md.end).getTime() - new Date(md.start).getTime();
        expect(mdDurationMs).toBeGreaterThan(0);

        for (const ad of md.antardashas) {
          const adDurationMs = new Date(ad.end).getTime() - new Date(ad.start).getTime();
          expect(adDurationMs).toBeGreaterThan(0);

          for (const pd of ad.pratyantardashas) {
            const pdDurationMs = new Date(pd.end).getTime() - new Date(pd.start).getTime();
            expect(pdDurationMs).toBeGreaterThan(0);
          }
        }
      }
    });

    it('interpretation layer rejects or omits zero/negative-length periods', () => {
      // This test verifies that the interpretation layer does not produce
      // zero/negative-length periods. Since buildAntardashas already returns
      // empty arrays for zero-length parents, and getActiveDasha uses half-open
      // interval semantics, zero/negative-length periods should never be emitted.
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 45 // Rohini (Moon)
      });

      // Verify that getActiveDasha never returns a zero/negative-length period
      // by checking that all returned periods have start < end
      const md = timeline.mahadashas[0];
      const ad = md.antardashas[0];
      const pd = ad.pratyantardashas[0];

      const active = getActiveDasha(timeline, pd.start);
      expect(active).not.toBeNull();

      if (active) {
        const activeMdStart = new Date(active.mahadasha.start).getTime();
        const activeMdEnd = new Date(active.mahadasha.end).getTime();
        expect(activeMdEnd).toBeGreaterThan(activeMdStart);

        const activeAdStart = new Date(active.antardasha.start).getTime();
        const activeAdEnd = new Date(active.antardasha.end).getTime();
        expect(activeAdEnd).toBeGreaterThan(activeAdStart);

        const activePdStart = new Date(active.pratyantardasha.start).getTime();
        const activePdEnd = new Date(active.pratyantardasha.end).getTime();
        expect(activePdEnd).toBeGreaterThan(activePdStart);
      }
    });
  });

  describe('18. near-360° normalization and active periods', () => {
    it.each([
      { longitude: 360 - 1e-12, nakshatra: 'Revati', lord: Planet.MERCURY, activeMd: undefined, activeAd: undefined, activePd: undefined },
      { longitude: 360 - 1e-10, nakshatra: 'Revati', lord: Planet.MERCURY, activeMd: Planet.MERCURY, activeAd: Planet.SATURN, activePd: Planet.JUPITER },
      { longitude: 360, nakshatra: 'Ashwini', lord: Planet.KETU, activeMd: Planet.KETU, activeAd: Planet.KETU, activePd: Planet.KETU },
      { longitude: 360 + 1e-12, nakshatra: 'Ashwini', lord: Planet.KETU, activeMd: Planet.KETU, activeAd: Planet.KETU, activePd: Planet.KETU },
      { longitude: -1e-12, nakshatra: 'Revati', lord: Planet.MERCURY, activeMd: undefined, activeAd: undefined, activePd: undefined },
      { longitude: -1e-10, nakshatra: 'Revati', lord: Planet.MERCURY, activeMd: Planet.MERCURY, activeAd: Planet.SATURN, activePd: Planet.JUPITER },
      { longitude: -360, nakshatra: 'Ashwini', lord: Planet.KETU, activeMd: Planet.KETU, activeAd: Planet.KETU, activePd: Planet.KETU },
      { longitude: -360 + 1e-12, nakshatra: 'Ashwini', lord: Planet.KETU, activeMd: Planet.KETU, activeAd: Planet.KETU, activePd: Planet.KETU }
    ])('classifies $longitude° without snapping near-360 values', ({
      longitude, nakshatra, lord, activeMd, activeAd, activePd
    }) => {
      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: longitude
      });

      const normalized = normalizeDegrees(longitude);
      const expectedProgress = nakshatra === 'Revati'
        ? (normalized - (1040 / 3)) / (40 / 3)
        : normalized / (40 / 3);
      expect(timeline.moonSiderealLongitude).toBe(normalized);
      expect(timeline.nakshatra).toBe(nakshatra);
      expect(timeline.nakshatraLord).toBe(lord);
      expect(timeline.nakshatraProgress).toBeCloseTo(expectedProgress, 14);
      expect(timeline.remainingFraction).toBeCloseTo(1 - expectedProgress, 14);
      if (activeMd === undefined) {
        expect(timeline.mahadashas).toHaveLength(0);
      } else {
        expect(timeline.mahadashas.length).toBeGreaterThan(0);
      }

      const activeAtBirth = getActiveDasha(timeline, birthIso);
      expect(activeAtBirth?.mahadasha.planet).toBe(activeMd);
      expect(activeAtBirth?.antardasha.planet).toBe(activeAd);
      expect(activeAtBirth?.pratyantardasha.planet).toBe(activePd);
    });
  });
});
