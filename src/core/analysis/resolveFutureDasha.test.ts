import { describe, expect, it } from 'vitest';
import { calculateVimshottari } from '../../engine/dasha/vimshottari';
import { Planet, AyanamsaType } from '../../types';
import { DEFAULT_METHODOLOGY } from './analysisContextFactory';
import { createForecastContext, resolveFutureDasha, validateForecastContext } from './resolveFutureDasha';
import { buildForecastWindows } from './forecastWindows';
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
    expect(Object.keys(context.value.transitPositions)).toContain(Planet.MOON);

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
        effect: 'ACTIVATES',
        strength: 'STRONG',
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
  });
});
