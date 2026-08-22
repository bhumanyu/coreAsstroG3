import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../../domain/wealth/WealthDomainInterpreterV2';
import { buildDashaTimingViewModel } from '../buildDashaTimingViewModel';
import { mapActiveDasha } from '../../life-analysis/dasha/activeDashaMapper';
import {
  selectCurrentMahadasha,
  selectCurrentAntardasha,
  selectCurrentPratyantardasha,
  selectDashaTimelinePeriods,
  selectDashaBirthAnchor,
  selectDashaInterpretation,
  selectCareerTiming,
  selectWealthTiming
} from '../dashaTimingSelectors';
import type { Horoscope } from '../../../types';

describe('Dasha & Timing Product View Model & Selectors', () => {
  const fixedAsOf = '2024-06-01T00:00:00.000Z';
  const outOfRangeAsOf = '2500-01-01T00:00:00.000Z';

  it('Test 1: returns UNAVAILABLE when horoscope has no dasha/vimshottari calculations', () => {
    const emptyHoroscope: Horoscope = {
      birthDetails: CANONICAL_BIRTH_DETAILS,
      rasiChart: {} as any,
      charts: {} as any,
      planetFacts: {} as any,
      functionalRoles: {} as any,
      planetaryStrength: {} as any,
      dashaInterpretation: undefined,
      vimshottari: undefined,
      fullNatalAnalysis: {} as any
    };

    const viewModel = buildDashaTimingViewModel(emptyHoroscope);

    expect(viewModel.availability).toBe('UNAVAILABLE');
    expect(viewModel.timeline.availability).toBe('UNAVAILABLE');
    expect(viewModel.timeline.periods).toEqual([]);
    expect(viewModel.timeline.birthAnchor).toBeUndefined();
    expect(viewModel.current).toBeUndefined();
    expect(viewModel.interpretation).toBeUndefined();
    expect(viewModel.career).toBeUndefined();
    expect(viewModel.wealth).toBeUndefined();
    expect(viewModel.generatedAt).toBeDefined();
  });

  it('Test 2: maps current MD/AD/PD planets and explicit levels correctly', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const viewModel = buildDashaTimingViewModel(horoscope, undefined, undefined, { asOf: fixedAsOf });

    expect(viewModel.availability).toBe('AVAILABLE');
    expect(viewModel.current).toBeDefined();

    const md = viewModel.current?.mahadasha;
    const ad = viewModel.current?.antardasha;
    const pd = viewModel.current?.pratyantardasha;

    expect(md).toBeDefined();
    expect(md?.level).toBe('MD');
    expect(md?.planet).toBe(horoscope.dashaInterpretation?.current?.mahadasha.planet);
    expect(md?.start).toBe(horoscope.dashaInterpretation?.current?.mahadasha.start);
    expect(md?.end).toBe(horoscope.dashaInterpretation?.current?.mahadasha.end);

    expect(ad).toBeDefined();
    expect(ad?.level).toBe('AD');
    expect(ad?.planet).toBe(horoscope.dashaInterpretation?.current?.antardasha.planet);
    expect(ad?.start).toBe(horoscope.dashaInterpretation?.current?.antardasha.start);
    expect(ad?.end).toBe(horoscope.dashaInterpretation?.current?.antardasha.end);

    expect(pd).toBeDefined();
    expect(pd?.level).toBe('PD');
    expect(pd?.planet).toBe(horoscope.dashaInterpretation?.current?.pratyantardasha.planet);
    expect(pd?.start).toBe(horoscope.dashaInterpretation?.current?.pratyantardasha.start);
    expect(pd?.end).toBe(horoscope.dashaInterpretation?.current?.pratyantardasha.end);
  });

  it('Test 3: accurately wires D03 interpretation into the view model', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const expectedInterpretation = mapActiveDasha(horoscope.dashaInterpretation?.current);
    const viewModel = buildDashaTimingViewModel(horoscope, undefined, undefined, { asOf: fixedAsOf });

    expect(viewModel.interpretation).toBeDefined();
    expect(viewModel.interpretation?.status).toBe('AVAILABLE');
    expect(viewModel.interpretation?.mahadasha?.planet).toBe(expectedInterpretation?.mahadasha?.planet);
    expect(viewModel.interpretation?.antardasha?.planet).toBe(expectedInterpretation?.antardasha?.planet);
    expect(viewModel.interpretation?.pratyantardasha?.planet).toBe(expectedInterpretation?.pratyantardasha?.planet);
    expect(viewModel.interpretation?.evidence.length).toBeGreaterThan(0);
    expect(viewModel.interpretation?.confidence).toBeDefined();
  });

  it('Test 4: preserves planet-consistency between career/wealth timing and active dasha', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const careerInterp = interpretCareerV2(horoscope);
    const wealthInterp = interpretWealthV2(horoscope);

    const viewModel = buildDashaTimingViewModel(
      horoscope,
      careerInterp,
      wealthInterp,
      { asOf: fixedAsOf }
    );

    expect(viewModel.career).toBeDefined();
    expect(viewModel.wealth).toBeDefined();

    // Career timing planets match current MD & AD
    expect(viewModel.career?.mahadasha?.planet).toBe(viewModel.current?.mahadasha?.planet);
    expect(viewModel.career?.antardasha?.planet).toBe(viewModel.current?.antardasha?.planet);

    // Wealth timing planets match current MD & AD
    expect(viewModel.wealth?.mahadasha?.planet).toBe(viewModel.current?.mahadasha?.planet);
    expect(viewModel.wealth?.antardasha?.planet).toBe(viewModel.current?.antardasha?.planet);
  });

  it('Test 5: preserves all four wealth dimensions (accumulation, gains, fortune, speculation) across periods', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const careerInterp = interpretCareerV2(horoscope);
    const wealthInterp = interpretWealthV2(horoscope);

    const viewModel = buildDashaTimingViewModel(
      horoscope,
      careerInterp,
      wealthInterp,
      { asOf: fixedAsOf }
    );

    const mdDims = viewModel.wealth?.mahadasha?.dimensions;
    const adDims = viewModel.wealth?.antardasha?.dimensions;
    const pdDims = viewModel.wealth?.pratyantardasha?.dimensions;

    expect(mdDims).toBeDefined();
    expect(mdDims?.accumulation).toBeDefined();
    expect(mdDims?.gains).toBeDefined();
    expect(mdDims?.fortune).toBeDefined();
    expect(mdDims?.speculation).toBeDefined();

    expect(adDims).toBeDefined();
    expect(adDims?.accumulation).toBeDefined();
    expect(adDims?.gains).toBeDefined();
    expect(adDims?.fortune).toBeDefined();
    expect(adDims?.speculation).toBeDefined();

    expect(pdDims).toBeDefined();
    expect(pdDims?.accumulation).toBeDefined();
    expect(pdDims?.gains).toBeDefined();
    expect(pdDims?.fortune).toBeDefined();
    expect(pdDims?.speculation).toBeDefined();
  });

  it('Test 6: propagates asOf cleanly and deterministically', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const careerInterp = interpretCareerV2(horoscope);
    const wealthInterp = interpretWealthV2(horoscope);

    const viewModel = buildDashaTimingViewModel(
      horoscope,
      careerInterp,
      wealthInterp,
      { asOf: fixedAsOf }
    );

    expect(viewModel.asOf).toBe(fixedAsOf);
    expect(viewModel.career?.asOf).toBe(fixedAsOf);
    expect(viewModel.wealth?.asOf).toBe(fixedAsOf);
  });

  it('Test 7: handles partial availability when timeline is present but active dasha is out of range', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: outOfRangeAsOf });
    const viewModel = buildDashaTimingViewModel(horoscope, undefined, undefined, { asOf: outOfRangeAsOf });

    expect(viewModel.timeline.availability).toBe('AVAILABLE');
    expect(viewModel.timeline.periods.length).toBeGreaterThan(0);
    expect(viewModel.current).toBeUndefined();
    expect(viewModel.availability).toBe('PARTIAL');
  });

  it('Test 8: selectors extract correct sub-structures from DashaTimingViewModel', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const careerInterp = interpretCareerV2(horoscope);
    const wealthInterp = interpretWealthV2(horoscope);

    const viewModel = buildDashaTimingViewModel(
      horoscope,
      careerInterp,
      wealthInterp,
      { asOf: fixedAsOf }
    );

    expect(selectCurrentMahadasha(viewModel)).toEqual(viewModel.current?.mahadasha);
    expect(selectCurrentAntardasha(viewModel)).toEqual(viewModel.current?.antardasha);
    expect(selectCurrentPratyantardasha(viewModel)).toEqual(viewModel.current?.pratyantardasha);
    expect(selectDashaTimelinePeriods(viewModel)).toEqual(viewModel.timeline.periods);
    expect(selectDashaBirthAnchor(viewModel)).toEqual(viewModel.timeline.birthAnchor);
    expect(selectDashaInterpretation(viewModel)).toEqual(viewModel.interpretation);
    expect(selectCareerTiming(viewModel)).toEqual(viewModel.career);
    expect(selectWealthTiming(viewModel)).toEqual(viewModel.wealth);
  });
});

