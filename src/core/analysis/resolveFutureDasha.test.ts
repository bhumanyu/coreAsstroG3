import { describe, expect, it } from 'vitest';
import { calculateVimshottari } from '../../engine/dasha/vimshottari';
import { calculateCurrentTransitPositions } from '../../engine/transitEphemeris';
import { Planet, AyanamsaType, ZodiacType } from '../../types';
import { getAyanamsaOffset, normalizeDegree } from '../../engine/astroEngine';
import type { TransitCalculationContext, TransitSample } from './forecastWindows';
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

const transitCalculationContext = {
  ayanamsa: AyanamsaType.LAHIRI,
  coordinateConvention: ZodiacType.SIDEREAL,
  engineVersion: 'test-engine-v1',
  allowIdenticalLongitudeAliases: true
} as const;
const strictTransitCalculationContext = {
  ayanamsa: AyanamsaType.LAHIRI,
  coordinateConvention: ZodiacType.SIDEREAL,
  engineVersion: 'test-engine-v1'
} as const;

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

  it('requires context echoes for a strict provider passed through the domain-forecast boundary', () => {
    const firstMd = timeline.mahadashas[0];
    const calculationContext = strictTransitCalculationContext;
    const provider = {
      precision: 'strict context echo test',
      ephemerisVersion: 'test-ephemeris-v1',
      maxSampleGapMs: Number.MAX_SAFE_INTEGER,
      calculationContext,
      requireSampleContextEcho: true,
      getBoundaryInstants: () => [],
      sampleWindow: (window: { readonly start: string; readonly end: string }) => {
        const start = Date.parse(window.start);
        const end = Date.parse(window.end);
        const sampleInstants = [
          window.start,
          new Date(Math.floor((start + end) / 2)).toISOString(),
          new Date(end - 1).toISOString()
        ];
        return {
          precision: 'strict context echo test',
          ephemerisVersion: 'test-ephemeris-v1',
          samples: sampleInstants.map((at) => ({
            at,
            positions: createPositionsForContext(at, calculationContext)
          }))
        };
      }
    };
    const result = buildDomainForecast(
      timeline,
      firstMd.start,
      firstMd.antardashas[0].end,
      { CAREER: true, ACCUMULATION: true, GAINS: true, FORTUNE: true, SPECULATION: true },
      () => ({
        direction: 'NEUTRAL',
        effect: 'NEUTRAL',
        strength: 'LOW',
        evidenceCoverage: 'PARTIAL',
        confidence: 0.5,
        supportingEvidence: [],
        challengingEvidence: [],
        confidenceLimitations: []
      }),
      provider
    );
    expect(result).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
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
      maxSampleGapMs: 1,
      calculationContext: transitCalculationContext,
      getBoundaryInstants: () => [transitBoundary],
      sampleWindow: (window, calculationContext) => ({
        precision: 'samples at each window start',
        ephemerisVersion: 'test-ephemeris-v1',
        samples: [{
          at: window.start,
          positions: calculateCurrentTransitPositions(new Date(window.start), AyanamsaType.LAHIRI),
          calculationContext
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
    expect(result.windows.every((window) => window.transitData?.coverage === 'PARTIAL')).toBe(true);
  });

  it('rejects transit samples missing a required planet or containing implausible numeric fields', () => {
    const md = timeline.mahadashas[0];
    const pd = md.antardashas[0].pratyantardashas[0];
    const startMs = Date.parse(pd.start);
    const endMs = Date.parse(pd.end);
    const sampleTimes = [startMs, Math.floor((startMs + endMs) / 2), endMs - 1];
    const validPositions = calculateCurrentTransitPositions(new Date(pd.start), AyanamsaType.LAHIRI);
    const missingPlanetPositions = { ...validPositions };
    delete (missingPlanetPositions as Partial<Record<Planet, (typeof validPositions)[Planet]>>)[Planet.SUN];
    const nonFiniteLongitudePositions = {
      ...validPositions,
      [Planet.SUN]: { ...validPositions[Planet.SUN], longitude: Number.POSITIVE_INFINITY }
    };
    const outOfRangeLongitudePositions = {
      ...validPositions,
      [Planet.SUN]: { ...validPositions[Planet.SUN], longitude: 360 }
    };

    const forecastWithPositions = (positions: typeof validPositions) => buildForecastWindows(
      timeline,
      pd.start,
      pd.end,
      {
        precision: 'samples spaced no more than one day apart',
        ephemerisVersion: 'test-ephemeris-v1',
        maxSampleGapMs: Math.max(sampleTimes[1] - sampleTimes[0], sampleTimes[2] - sampleTimes[1]),
        calculationContext: transitCalculationContext,
        getBoundaryInstants: () => [],
        sampleWindow: (window, calculationContext) => ({
          precision: 'samples spaced no more than one day apart',
          ephemerisVersion: 'test-ephemeris-v1',
          samples: sampleTimes.map((time) => ({
            at: new Date(time).toISOString(),
            positions,
            calculationContext
          }))
        })
      }
    );

    expect(forecastWithPositions(missingPlanetPositions)).toEqual({
      ok: false,
      error: 'INVALID_TRANSIT_WINDOW'
    });
    expect(forecastWithPositions(nonFiniteLongitudePositions)).toEqual({
      ok: false,
      error: 'INVALID_TRANSIT_WINDOW'
    });
    expect(forecastWithPositions(outOfRangeLongitudePositions)).toEqual({
      ok: false,
      error: 'INVALID_TRANSIT_WINDOW'
    });
    const valid = forecastWithPositions(validPositions);
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(valid.windows[0].transitData?.coverage).toBe('COMPLETE');
  });

  it('marks sparse transit samples partial and dense samples complete under the sampling policy', () => {
    const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
    const startMs = Date.parse(pd.start);
    const endMs = Date.parse(pd.end);
    const midpoint = Math.floor((startMs + endMs) / 2);
    const positions = calculateCurrentTransitPositions(new Date(pd.start), AyanamsaType.LAHIRI);
    const buildWithTimes = (times: readonly number[], maxSampleGapMs: number) => buildForecastWindows(
      timeline,
      pd.start,
      pd.end,
      {
        precision: 'sampling policy checks',
        ephemerisVersion: 'test-ephemeris-v1',
        maxSampleGapMs,
        calculationContext: transitCalculationContext,
        getBoundaryInstants: () => [],
        sampleWindow: (_window, calculationContext) => ({
          precision: 'sampling policy checks',
          ephemerisVersion: 'test-ephemeris-v1',
          samples: times.map((time) => ({
            at: new Date(time).toISOString(),
            positions,
            calculationContext
          }))
        })
      }
    );
    const oneSample = buildWithTimes([startMs], endMs - startMs);
    expect(oneSample.ok).toBe(true);
    if (oneSample.ok) expect(oneSample.windows[0].transitData?.coverage).toBe('PARTIAL');

    const maxGap = midpoint - startMs + 1;
    const dense = buildWithTimes([startMs, midpoint, endMs - 1], maxGap);
    expect(dense.ok).toBe(true);
    if (dense.ok) expect(dense.windows[0].transitData?.coverage).toBe('COMPLETE');

    const tooSparse = buildWithTimes([startMs, endMs - 1], Math.floor((endMs - startMs) / 2));
    expect(tooSparse.ok).toBe(true);
    if (tooSparse.ok) expect(tooSparse.windows[0].transitData?.coverage).toBe('PARTIAL');
  });

  it('validates declared context and preserves each authoritative sample instant', () => {
    const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
    const instants = transitSampleTimes(pd.start, pd.end).map((time) => new Date(time).toISOString());
    const positions = createPositionsForContext(instants[0], strictTransitCalculationContext);
    const strictSamples = () => instants.map((at) => ({
      at,
      calculatedAt: at,
      positions,
      calculationContext: strictTransitCalculationContext
    }));
    const strict = (samples: readonly TransitSample[]) =>
      buildTransitValidationWindow(samples, strictTransitCalculationContext, true);

    const valid = strict(strictSamples());
    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.windows[0].transitData?.samples.map((sample) => sample.at)).toEqual(instants);
      expect(valid.windows[0].transitData?.samples[0].calculatedAt).toBe(instants[0]);
    }

    const missingCalculatedAt = strict(strictSamples().map(({ calculatedAt: _calculatedAt, ...sample }, index) =>
      index === 0 ? sample : { ...sample, calculatedAt: instants[index] }
    ));
    expect(missingCalculatedAt).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

    const missingCalculationContext = strict(strictSamples().map(({ calculationContext: _context, ...sample }, index) =>
      index === 0 ? sample : { ...sample, calculationContext: strictTransitCalculationContext }
    ));
    expect(missingCalculationContext).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

    const wrongTimestamp = strict(strictSamples().map((sample, index) => index === 0
      ? { ...sample, calculatedAt: new Date(Date.parse(sample.at) + 1).toISOString() }
      : sample));
    expect(wrongTimestamp).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

    const mismatchedContexts = [
      { ...strictTransitCalculationContext, engineVersion: 'different-engine' },
      { ...strictTransitCalculationContext, ayanamsa: AyanamsaType.RAMAN },
      { ...strictTransitCalculationContext, coordinateConvention: ZodiacType.TROPICAL }
    ];
    for (const mismatchedContext of mismatchedContexts) {
      const mismatch = strict(strictSamples().map((sample, index) => index === 0
        ? { ...sample, calculationContext: mismatchedContext }
        : sample));
      expect(mismatch).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
    }

    const compatibilitySamples = strictSamples().map(({ calculatedAt: _calculatedAt, calculationContext: _context, ...sample }) => sample);
    const compatibility = buildTransitValidationWindow(compatibilitySamples, strictTransitCalculationContext);
    expect(compatibility.ok).toBe(true);
    const compatibilityMismatch = buildTransitValidationWindow([
      { ...compatibilitySamples[0], calculatedAt: new Date(Date.parse(instants[0]) + 1).toISOString() },
      ...compatibilitySamples.slice(1)
    ], strictTransitCalculationContext);
    expect(compatibilityMismatch).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
  });

  it('validates the strict sidereal/ecliptic relationship and explicitly gates legacy aliases', () => {
    const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
    const times = transitSampleTimes(pd.start, pd.end);
    const instants = times.map((time) => new Date(time).toISOString());
    const consistent = buildTransitValidationWindow(instants.map((at) => ({
      at,
      positions: createPositionsForContext(at, strictTransitCalculationContext),
      calculationContext: strictTransitCalculationContext
    })), strictTransitCalculationContext);
    expect(consistent.ok).toBe(true);
    const normalizedSun = createPositionsForContext(instants[0], strictTransitCalculationContext)[Planet.SUN];
    expect(normalizedSun.eclipticLongitude).not.toBe(normalizedSun.siderealLongitude);
    expect(normalizedSun.longitude).toBe(normalizedSun.siderealLongitude);

    const inconsistent = buildTransitValidationWindow(instants.map((at) => ({
      at,
      positions: createPositionsForContext(at, strictTransitCalculationContext, (planet, position) =>
        planet === Planet.SUN ? (() => {
          const siderealLongitude = normalizeDegree(
            (position.siderealLongitude ?? position.longitude) + 0.02
          );
          return {
            ...position,
            longitude: siderealLongitude,
            siderealLongitude,
            signLongitude: siderealLongitude % 30
          };
        })() : position
      ),
      calculationContext: strictTransitCalculationContext
    })), strictTransitCalculationContext);
    expect(inconsistent).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

    const legacyPositions = calculateCurrentTransitPositions(new Date(instants[0]), AyanamsaType.LAHIRI);
    const strictLegacy = buildTransitValidationWindow(instants.map((at) => ({
      at,
      positions: legacyPositions,
      calculationContext: strictTransitCalculationContext
    })), strictTransitCalculationContext);
    expect(strictLegacy).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
    const explicitlyAllowedLegacy = buildTransitValidationWindow(instants.map((at) => ({
      at,
      positions: legacyPositions,
      calculationContext: transitCalculationContext
    })), transitCalculationContext);
    expect(explicitlyAllowedLegacy.ok).toBe(true);

    const normalizedStrict = buildTransitValidationWindow(instants.map((at) => ({
      at,
      positions: createPositionsForContext(at, strictTransitCalculationContext),
      calculationContext: strictTransitCalculationContext
    })), strictTransitCalculationContext);
    expect(normalizedStrict.ok).toBe(true);
  });

  it('rejects a longitude alias that disagrees with the selected canonical coordinate field', () => {
    const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
    const instants = transitSampleTimes(pd.start, pd.end).map((time) => new Date(time).toISOString());
    const validPairWithMutatedAlias = buildTransitValidationWindow(instants.map((at) => ({
      at,
      positions: createPositionsForContext(at, strictTransitCalculationContext, (planet, position) =>
        planet === Planet.SUN
          ? { ...position, longitude: normalizeDegree(position.longitude + 1) }
          : position
      ),
      calculationContext: strictTransitCalculationContext
    })), strictTransitCalculationContext);
    expect(validPairWithMutatedAlias).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
  });

  it('checks coordinate-specific sign longitude and documents the longitude fallback', () => {
    for (const coordinateConvention of [ZodiacType.TROPICAL, ZodiacType.SIDEREAL]) {
      const context = { ...strictTransitCalculationContext, coordinateConvention };
      const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
      const instants = transitSampleTimes(pd.start, pd.end).map((time) => new Date(time).toISOString());
      const buildWithSun = (alter: (position: ReturnType<typeof createPositionsForContext>[Planet.SUN]) =>
        ReturnType<typeof createPositionsForContext>[Planet.SUN]) =>
        buildTransitValidationWindow(instants.map((at) => ({
          at,
          positions: createPositionsForContext(at, context, (planet, position) =>
            planet === Planet.SUN ? alter(position) : position
          ),
          calculationContext: context
        })), context);

      expect(buildWithSun((position) => position).ok).toBe(true);
      expect(buildWithSun((position) => ({
        ...position,
        signLongitude: normalizeDegree(position.signLongitude + 0.02) % 30
      }))).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

      const fieldName = coordinateConvention === ZodiacType.TROPICAL
        ? 'eclipticLongitude'
        : 'siderealLongitude';
      const absentField = buildWithSun((position) => {
        const { [fieldName]: _conventionField, ...withoutConventionField } = position;
        return withoutConventionField;
      });
      expect(absentField.ok).toBe(true);

      const wrongFallback = buildWithSun((position) => {
        const { [fieldName]: _conventionField, ...withoutConventionField } = position;
        return {
          ...withoutConventionField,
          longitude: normalizeDegree(position.longitude + 1),
          signLongitude: position.signLongitude
        };
      });
      expect(wrongFallback).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
    }
  });

  it('uses circular tolerance at the zero-degree and 30-degree boundaries in both conventions', () => {
    for (const coordinateConvention of [ZodiacType.TROPICAL, ZodiacType.SIDEREAL]) {
      const context = { ...strictTransitCalculationContext, coordinateConvention };
      const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
      const instants = transitSampleTimes(pd.start, pd.end).map((time) => new Date(time).toISOString());
      const buildWithSun = (
        selectedLongitude: number,
        signLongitude: number
      ) => buildTransitValidationWindow(instants.map((at) => ({
        at,
        positions: createPositionsForContext(at, context, (planet, position) => {
          if (planet !== Planet.SUN) return position;
          const offset = getAyanamsaOffset(context.ayanamsa, new Date(at));
          const tropicalLongitude = coordinateConvention === ZodiacType.TROPICAL
            ? selectedLongitude
            : normalizeDegree(selectedLongitude + offset);
          const siderealLongitude = coordinateConvention === ZodiacType.SIDEREAL
            ? selectedLongitude
            : normalizeDegree(tropicalLongitude - offset);
          return {
            ...position,
            longitude: selectedLongitude,
            eclipticLongitude: tropicalLongitude,
            siderealLongitude,
            signLongitude
          };
        }),
        calculationContext: context
      })), context);

      expect(buildWithSun(359.999, 0.001).ok).toBe(true);
      expect(buildWithSun(359.999, 0.02)).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
      expect(buildWithSun(29.999, 0.001).ok).toBe(true);
      expect(buildWithSun(29.999, 0.02)).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
    }
  });

  it('validates ayanamsa relationships and sign longitude using circular angular distance', () => {
    const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
    const times = transitSampleTimes(pd.start, pd.end);
    const basePositions = calculateCurrentTransitPositions(new Date(pd.start), AyanamsaType.LAHIRI);
    const offsetForAt = (at: string) => getAyanamsaOffset(AyanamsaType.LAHIRI, new Date(at));
    const positionsAt = (
      siderealLongitude: number,
      tropicalLongitude: number,
      signLongitude = siderealLongitude % 30
    ) => ({
      ...basePositions,
      [Planet.SUN]: {
        ...basePositions[Planet.SUN],
        longitude: siderealLongitude,
        siderealLongitude,
        eclipticLongitude: tropicalLongitude,
        signLongitude
      }
    });
    const makePositionSamples = (
      createPositions: (at: string, index: number) => typeof basePositions
    ) => times.map((time, index) => {
      const at = new Date(time).toISOString();
      return {
        at,
        positions: createPositions(at, index),
        calculationContext: transitCalculationContext
      };
    });

    const consistentNearZero = buildTransitValidationWindow(makePositionSamples((at) => {
      const siderealLongitude = 0.003;
      return positionsAt(
        siderealLongitude,
        normalizeDegree(siderealLongitude + offsetForAt(at))
      );
    }));
    expect(consistentNearZero.ok).toBe(true);

    const inconsistentAyanamsa = buildTransitValidationWindow(makePositionSamples((at) => {
      const siderealLongitude = 0.003;
      return positionsAt(
        siderealLongitude,
        normalizeDegree(siderealLongitude + offsetForAt(at) + 0.02)
      );
    }));
    expect(inconsistentAyanamsa).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

    const signBoundaryInsideTolerance = buildTransitValidationWindow(makePositionSamples((at) =>
      positionsAt(29.999, normalizeDegree(29.999 + offsetForAt(at)), 0.001)
    ));
    expect(signBoundaryInsideTolerance.ok).toBe(true);

    const signBoundaryOutsideTolerance = buildTransitValidationWindow(makePositionSamples((at) =>
      positionsAt(29.999, normalizeDegree(29.999 + offsetForAt(at)), 0.02)
    ));
    expect(signBoundaryOutsideTolerance).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });

    const ayanamsaToleranceInsideAcrossZero = buildTransitValidationWindow(makePositionSamples((at) => {
      const expectedSidereal = 359.998;
      const tropical = normalizeDegree(expectedSidereal + offsetForAt(at));
      return positionsAt(normalizeDegree(expectedSidereal + 0.005), tropical);
    }));
    expect(ayanamsaToleranceInsideAcrossZero.ok).toBe(true);

    const ayanamsaToleranceOutsideAcrossZero = buildTransitValidationWindow(makePositionSamples((at) => {
      const expectedSidereal = 359.998;
      const tropical = normalizeDegree(expectedSidereal + offsetForAt(at));
      return positionsAt(normalizeDegree(expectedSidereal + 0.02), tropical);
    }));
    expect(ayanamsaToleranceOutsideAcrossZero).toEqual({ ok: false, error: 'INVALID_TRANSIT_WINDOW' });
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

function transitSampleTimes(start: string, end: string): number[] {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  return [startMs, Math.floor((startMs + endMs) / 2), endMs - 1];
}

function buildTransitValidationWindow(
  samples: readonly TransitSample[],
  calculationContext: TransitCalculationContext = transitCalculationContext,
  requireSampleContextEcho = false
) {
  const pd = timeline.mahadashas[0].antardashas[0].pratyantardashas[0];
  const times = transitSampleTimes(pd.start, pd.end);
  return buildForecastWindows(timeline, pd.start, pd.end, {
    precision: 'context and angular consistency validation',
    ephemerisVersion: 'test-ephemeris-v1',
    maxSampleGapMs: Math.max(times[1] - times[0], times[2] - times[1]),
    calculationContext,
    requireSampleContextEcho,
    getBoundaryInstants: () => [],
    sampleWindow: (_window, calculationContext) => ({
      precision: 'context and angular consistency validation',
      ephemerisVersion: 'test-ephemeris-v1',
      samples
    })
  });
}

function createPositionsForContext(
  at: string,
  context: typeof strictTransitCalculationContext | {
    readonly ayanamsa: AyanamsaType;
    readonly coordinateConvention: ZodiacType;
    readonly engineVersion: string;
    readonly allowIdenticalLongitudeAliases?: boolean;
  },
  alter: (
    planet: Planet,
    position: ReturnType<typeof calculateCurrentTransitPositions>[Planet]
  ) => ReturnType<typeof calculateCurrentTransitPositions>[Planet] = (_planet, position) => position
): ReturnType<typeof calculateCurrentTransitPositions> {
  const positions = calculateCurrentTransitPositions(new Date(at), context.ayanamsa);
  const offset = getAyanamsaOffset(context.ayanamsa, new Date(at));
  return Object.fromEntries(Object.values(Planet).map((planet) => {
    const siderealLongitude = positions[planet].siderealLongitude ?? positions[planet].longitude;
    const eclipticLongitude = normalizeDegree(siderealLongitude + offset);
    const coordinateLongitude = context.coordinateConvention === ZodiacType.TROPICAL
      ? eclipticLongitude
      : siderealLongitude;
    return [planet, alter(planet, {
      ...positions[planet],
      longitude: coordinateLongitude,
      eclipticLongitude,
      siderealLongitude,
      signLongitude: coordinateLongitude % 30
    })];
  })) as ReturnType<typeof calculateCurrentTransitPositions>;
}
