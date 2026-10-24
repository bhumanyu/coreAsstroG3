import { describe, expect, it } from 'vitest';
import { calculateVimshottari } from '../../engine/dasha/vimshottari';
import { calculateCurrentTransitPositions } from '../../engine/transitEphemeris';
import { Planet, AyanamsaType } from '../../types';
import { DEFAULT_METHODOLOGY } from './analysisContextFactory';
import { createForecastContext, resolveFutureDasha, validateForecastContext } from './resolveFutureDasha';
import { buildForecastWindows, mergeAdjacentForecastWindows } from './forecastWindows';
import type { ForecastWindow } from './forecastWindows';
import { buildDomainForecast } from './domainForecast';

const timeline = calculateVimshottari({
  birthDateTime: '1990-01-01T00:00:00.000Z',
  moonSiderealLongitude: 20
});
const mockHoroscope = {
  birthDetails: { dateTimeStr: timeline.birthDateTime, latitude: 0, longitude: 0, timeZone: 'UTC', ayanamsa: AyanamsaType.LAHIRI }
} as any;

describe('future Dasha resolution', () => {
  it('resolves MD, AD, and PD with half-open boundary ownership', () => {
    const md = timeline.mahadashas[0];
    const ad = md.antardashas[0];
    const pd = ad.pratyantardashas[0];

    expect(resolveFutureDasha(timeline, new Date(Date.parse(md.end) - 1)).ok).toBe(true);
    expect(resolveFutureDasha(timeline, md.end)?.ok).toBe(true);
    const nextMd = resolveFutureDasha(timeline, md.end);
    expect(nextMd.ok && nextMd.value.activeDasha.mahadasha.planet).not.toBe(md.planet);

    const nextAd = resolveFutureDasha(timeline, ad.end);
    expect(nextAd.ok && nextAd.value.activeDasha.antardasha.planet).not.toBe(ad.planet);
    const nextPd = resolveFutureDasha(timeline, pd.end);
    expect(nextPd.ok && nextPd.value.activeDasha.pratyantardasha.planet).not.toBe(pd.planet);
  });

  it('builds deterministic, tiled horizon windows at MD/AD/PD transitions', () => {
    const firstMd = timeline.mahadashas[0];
    const end = firstMd.end;
    const result = buildForecastWindows(timeline, firstMd.start, end);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.windows[0].start).toBe(firstMd.start);
    expect(result.windows[result.windows.length - 1].end).toBe(end);
    for (let i = 1; i < result.windows.length; i++) {
      expect(result.windows[i - 1].end).toBe(result.windows[i].start);
    }
    expect(buildForecastWindows(timeline, firstMd.start, end)).toEqual(result);
    const shorter = buildForecastWindows(timeline, firstMd.start, result.windows[2].end);
    expect(shorter.ok).toBe(true);
    if (shorter.ok) {
      expect(shorter.windows.slice(0, 2)).toEqual(result.windows.slice(0, 2));
      expect(shorter.windows[shorter.windows.length - 1].end).toBe(result.windows[2].end);
    }
  });

  it('binds transit positions to the same target and rejects a mismatched active period', () => {
    const md = timeline.mahadashas[0];
    const asOf = new Date(Date.parse(md.start) + 1000);
    const context = createForecastContext({
      timeline,
      horoscope: mockHoroscope,
      asOf,
      forecastUntil: md.end,
      methodology: DEFAULT_METHODOLOGY,
      engineVersion: 'test-engine',
      rulesVersion: 'test-rules'
    });
    expect(context.ok).toBe(true);
    if (!context.ok) return;
    validateForecastContext(context.value);
    expect(Object.keys(context.value.transitPositionsAsOfInstant)).toContain(Planet.MOON);
    expect(context.value.forecastMode).toBe('DASHA_ONLY');

    const future = createForecastContext({
      timeline,
      horoscope: mockHoroscope,
      asOf: new Date(Date.parse(md.end) + 1000),
      forecastUntil: timeline.mahadashas[1].end,
      methodology: DEFAULT_METHODOLOGY,
      engineVersion: 'test-engine',
      rulesVersion: 'test-rules'
    });
    expect(future.ok).toBe(true);
    if (!future.ok) return;
    expect(() => validateForecastContext({
      ...future.value,
      dasha: context.value.dasha
    })).toThrow(/active Dasha intervals must contain the target instant/);
  });

  it('keeps Wealth dimensions separate and does not create a natal promise', () => {
    const md = timeline.mahadashas[0];
    const result = buildDomainForecast(
      timeline,
      md.start,
      md.antardashas[1].end,
      {
        CAREER: false,
        ACCUMULATION: true,
        GAINS: false,
        FORTUNE: true,
        SPECULATION: false
      },
      ({ domain }) => ({
        direction: 'SUPPORTING',
        effect: 'SUPPORTING',
        strength: 'HIGH',
        evidenceCoverage: 'COMPLETE',
        confidence: 0.7,
        supportingEvidence: [`${domain}-support`],
        challengingEvidence: [],
        confidenceLimitations: ['Internal convention only']
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const assessments = result.windows[0].forecasts;
    expect(assessments.map((item) => item.domain)).toEqual([
      'CAREER', 'ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'
    ]);
    expect(assessments.find((item) => item.domain === 'GAINS')?.direction).toBe('UNDETERMINED');
    expect(assessments.find((item) => item.domain === 'SPECULATION')?.direction).toBe('UNDETERMINED');
    expect(assessments.find((item) => item.domain === 'ACCUMULATION')?.direction).toBe('SUPPORTING');
    expect(assessments.find((item) => item.domain === 'SPECULATION')?.supportingEvidence).toEqual(['SPECULATION-support']);
    for (const item of assessments.filter((assessment) => !{
      CAREER: false,
      ACCUMULATION: true,
      GAINS: false,
      FORTUNE: true,
      SPECULATION: false
    }[assessment.domain])) {
      expect(item.effect).toBe('UNDETERMINED');
      expect(item.strength).toBe('NEUTRAL');
      expect(item.confidence).toBe(0);
    }
  });

  it('normalizes invalid assessment enums and rejects invalid confidence values', () => {
    const md = timeline.mahadashas[0];
    const invalidEnums = buildDomainForecast(
      timeline,
      md.start,
      md.antardashas[0].end,
      { CAREER: true, ACCUMULATION: true, GAINS: true, FORTUNE: true, SPECULATION: true },
      () => ({
        direction: 'UNRECOGNIZED' as never,
        effect: 'ACTIVATES' as never,
        strength: 'EXTREME' as never,
        evidenceCoverage: 'CERTAIN' as never,
        confidence: 0.5,
        supportingEvidence: [],
        challengingEvidence: [],
        confidenceLimitations: []
      })
    );
    expect(invalidEnums.ok).toBe(true);
    if (invalidEnums.ok) {
      expect(invalidEnums.windows[0].forecasts[0]).toMatchObject({
        direction: 'UNDETERMINED',
        effect: 'UNDETERMINED',
        strength: 'UNDETERMINED',
        evidenceCoverage: 'NONE'
      });
    }

    expect(() => buildDomainForecast(
      timeline,
      md.start,
      md.antardashas[0].end,
      { CAREER: true, ACCUMULATION: true, GAINS: true, FORTUNE: true, SPECULATION: true },
      () => ({
        direction: 'SUPPORTING',
        effect: 'SUPPORTING',
        strength: 'HIGH',
        evidenceCoverage: 'COMPLETE',
        confidence: Number.NaN,
        supportingEvidence: [],
        challengingEvidence: [],
        confidenceLimitations: []
      })
    )).toThrow(/finite value in \[0, 1\]/);
  });

  it('rejects malformed or incomplete nested timelines before collecting windows', () => {
    const firstMd = timeline.mahadashas[0];
    const firstAd = firstMd.antardashas[0];
    const malformedTimeline = {
      ...timeline,
      mahadashas: timeline.mahadashas.map((md, mdIndex) => mdIndex === 0
        ? {
            ...md,
            antardashas: md.antardashas.map((ad, adIndex) => adIndex === 0
              ? {
                  ...ad,
                  pratyantardashas: ad.pratyantardashas.map((pd, pdIndex) => pdIndex === 0
                    ? { ...pd, end: pd.start }
                    : pd)
                }
              : ad)
          }
        : md)
    };
    expect(buildForecastWindows(malformedTimeline, firstMd.start, firstAd.end)).toEqual({
      ok: false,
      error: 'INVALID_TIMELINE'
    });
    expect(buildForecastWindows({ ...timeline, mahadashas: [] }, firstMd.start, firstAd.end)).toEqual({
      ok: false,
      error: 'INVALID_TIMELINE'
    });
  });

  it('attaches interval-scoped transit samples and marks their event boundaries', () => {
    const md = timeline.mahadashas[0];
    const startMs = Date.parse(md.start);
    const endMs = Date.parse(md.end);
    const transitBoundary = new Date(startMs + 12_345).toISOString();
    const result = buildForecastWindows(timeline, md.start, md.end, {
      precision: 'samples at each window start',
      ephemerisVersion: 'test-ephemeris-v1',
      getBoundaryInstants: () => [transitBoundary],
      sampleWindow: (window) => ({
        precision: 'samples at each window start',
        ephemerisVersion: 'test-ephemeris-v1',
        samples: [{
          at: window.start,
          positions: calculateCurrentTransitPositions(new Date(window.start), AyanamsaType.LAHIRI)
        }]
      })
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const boundaryIndex = result.windows.findIndex((window) => window.start === transitBoundary);
    expect(boundaryIndex).toBeGreaterThan(0);
    expect(result.windows[boundaryIndex - 1].end).toBe(transitBoundary);
    expect(result.windows[boundaryIndex - 1].boundaryReasons).toContain('TRANSIT_BOUNDARY');
    expect(result.windows[boundaryIndex].boundaryReasons).toContain('TRANSIT_BOUNDARY');
    expect(result.windows.every((window) => window.transitData?.samples[0].at === window.start)).toBe(true);
    expect(result.windows.every((window) => window.transitData?.ephemerisVersion === 'test-ephemeris-v1')).toBe(true);
  });

  it('retains only outer-edge boundary reasons when adjacent identical windows merge', () => {
    const first: ForecastWindow = {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-02-01T00:00:00.000Z',
      mahadashaId: 'md',
      antardashaId: 'ad',
      pratyantardashaId: 'pd',
      boundaryReasons: ['REQUEST_START', 'PRATYANTARDASHA_CHANGE']
    };
    const second: ForecastWindow = {
      ...first,
      start: first.end,
      end: '2024-03-01T00:00:00.000Z',
      boundaryReasons: ['PRATYANTARDASHA_CHANGE', 'REQUEST_END']
    };
    expect(mergeAdjacentForecastWindows(first, second)?.boundaryReasons)
      .toEqual(['REQUEST_START', 'REQUEST_END']);
  });
});
