import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildDashaInterpretationProduct } from './buildDashaInterpretationProduct';
import { mapActiveDasha } from './activeDashaMapper';
import { buildLifeAnalysisViewModel } from '../lifeAnalysisMapper';
import { runLifeAnalysisProduct } from '../lifeAnalysisProductService';
import { STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH } from '../../../integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from '../../../domain/synthesis';
import type { ActiveDashaInterpretation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';

describe('D03 — Life Analysis Active Dasha Product Layer', () => {
  const fixedAsOf = '2024-06-01T00:00:00.000Z';
  const outOfRangeAsOf = '2500-01-01T00:00:00.000Z';

  it('Test 1: returns status UNAVAILABLE and empty evidence when current is undefined/absent', () => {
    const product = buildDashaInterpretationProduct(undefined);

    expect(product.status).toBe('UNAVAILABLE');
    expect(product.evidence).toEqual([]);
    expect(product.mahadasha).toBeUndefined();
    expect(product.antardasha).toBeUndefined();
    expect(product.pratyantardasha).toBeUndefined();
    expect(product.pair).toBeUndefined();
  });

  it('Test 2: returns status AVAILABLE when active dasha interpretation is present', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current;

    expect(current).toBeDefined();
    const product = buildDashaInterpretationProduct(current);

    expect(product.status).toBe('AVAILABLE');
    expect(product.mahadasha).toBeDefined();
    expect(product.antardasha).toBeDefined();
    expect(product.pratyantardasha).toBeDefined();
  });

  it('Test 3: maps mahadasha planet, level, start, end, placement, ownedHouses, functionalRoles, and confidence accurately', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current!;
    const product = buildDashaInterpretationProduct(current);

    const md = product.mahadasha!;
    expect(md.planet).toBe(current.mahadasha.planet);
    expect(md.level).toBe('MAHADASHA');
    expect(md.start).toBe(current.mahadasha.start);
    expect(md.end).toBe(current.mahadasha.end);
    expect(md.placement.house).toBe(current.mahadasha.natal.house);
    expect(md.placement.sign).toBe(current.mahadasha.natal.sign);
    expect(md.ownedHouses).toEqual(current.mahadasha.natal.ownedHouses);
    expect(md.functionalRoles).toEqual(current.mahadasha.natal.functionalRoles);
    expect(md.confidence).toBe(current.mahadasha.confidence);
  });

  it('Test 4: maps antardasha planet, level, start, end, placement, ownedHouses, functionalRoles, and confidence accurately', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current!;
    const product = buildDashaInterpretationProduct(current);

    const ad = product.antardasha!;
    expect(ad.planet).toBe(current.antardasha.planet);
    expect(ad.level).toBe('ANTARDASHA');
    expect(ad.start).toBe(current.antardasha.start);
    expect(ad.end).toBe(current.antardasha.end);
    expect(ad.placement.house).toBe(current.antardasha.natal.house);
    expect(ad.placement.sign).toBe(current.antardasha.natal.sign);
    expect(ad.ownedHouses).toEqual(current.antardasha.natal.ownedHouses);
    expect(ad.functionalRoles).toEqual(current.antardasha.natal.functionalRoles);
    expect(ad.confidence).toBe(current.antardasha.confidence);
  });

  it('Test 5: maps pratyantardasha planet, level, start, end, placement, ownedHouses, functionalRoles, and confidence accurately', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current!;
    const product = buildDashaInterpretationProduct(current);

    const pd = product.pratyantardasha!;
    expect(pd.planet).toBe(current.pratyantardasha.planet);
    expect(pd.level).toBe('PRATYANTARDASHA');
    expect(pd.start).toBe(current.pratyantardasha.start);
    expect(pd.end).toBe(current.pratyantardasha.end);
    expect(pd.placement.house).toBe(current.pratyantardasha.natal.house);
    expect(pd.placement.sign).toBe(current.pratyantardasha.natal.sign);
    expect(pd.ownedHouses).toEqual(current.pratyantardasha.natal.ownedHouses);
    expect(pd.functionalRoles).toEqual(current.pratyantardasha.natal.functionalRoles);
    expect(pd.confidence).toBe(current.pratyantardasha.confidence);
  });

  it('Test 6: maps antardasha pair interpretation (mahadashaLord, antardashaLord, sharedHouses, combinedHouseSet, relationshipEvidence) when present', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current!;
    const pair = current.antardasha.pairInterpretation;

    expect(pair).toBeDefined();
    const product = buildDashaInterpretationProduct(current);

    expect(product.pair).toBeDefined();
    expect(product.pair?.mahadashaLord).toBe(pair!.mahadashaLord);
    expect(product.pair?.antardashaLord).toBe(pair!.antardashaLord);
    expect(product.pair?.sharedHouses).toEqual(pair!.sharedHouses);
    expect(product.pair?.combinedHouseSet).toEqual(pair!.combinedHouseSet);
    expect(product.pair?.relationshipEvidence).toEqual(pair!.relationshipEvidence);
  });

  it('Test 7: handles missing pair interpretation cleanly without errors', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current!;

    const currentWithoutPair: ActiveDashaInterpretation = {
      ...current,
      antardasha: {
        ...current.antardasha,
        pairInterpretation: undefined
      }
    };

    const product = buildDashaInterpretationProduct(currentWithoutPair);
    expect(product.status).toBe('AVAILABLE');
    expect(product.pair).toBeUndefined();
  });

  it('Test 8: preserves top-level evidence, confidence, and timestamp at from engine ActiveDashaInterpretation', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const current = horoscope.dashaInterpretation?.current!;
    const product = buildDashaInterpretationProduct(current);

    expect(product.evidence).toEqual(current.evidence);
    expect(product.confidence).toBe(current.confidence);
    expect(product.at).toBe(current.at);
  });

  it('Test 9: wires activeDasha into buildLifeAnalysisViewModel with status AVAILABLE when current dasha is present', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const analysis = buildLifeAnalysis([STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]);

    const viewModel = buildLifeAnalysisViewModel(
      analysis,
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH,
      [],
      horoscope
    );

    expect(viewModel.activeDasha).toBeDefined();
    expect(viewModel.activeDasha?.status).toBe('AVAILABLE');
    expect(viewModel.activeDasha?.mahadasha?.planet).toBe(horoscope.dashaInterpretation?.current?.mahadasha.planet);
    expect(viewModel.activeDasha?.antardasha?.planet).toBe(horoscope.dashaInterpretation?.current?.antardasha.planet);
    expect(viewModel.activeDasha?.pratyantardasha?.planet).toBe(horoscope.dashaInterpretation?.current?.pratyantardasha.planet);
    expect(viewModel.dasha).toEqual(viewModel.activeDasha);
  });

  it('Test 10: leaves activeDasha undefined in buildLifeAnalysisViewModel when current dasha is absent / out of range', () => {
    const horoscopeOutOfRange = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: outOfRangeAsOf });
    const analysis = buildLifeAnalysis([STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]);

    const viewModel = buildLifeAnalysisViewModel(
      analysis,
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH,
      [],
      horoscopeOutOfRange
    );

    expect(viewModel.activeDasha).toBeUndefined();
    expect(viewModel.dasha).toBeUndefined();
    expect(mapActiveDasha(horoscopeOutOfRange.dashaInterpretation?.current)).toBeUndefined();
  });

  it('Test 11: surfaces deterministic activeDasha across full runLifeAnalysisProduct pipeline matching horoscope.dashaInterpretation.current', async () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
    const productState = await runLifeAnalysisProduct({
      horoscope,
      includeAiExplanation: false
    });

    expect(productState.status).toBe('READY');
    expect(productState.analysis?.activeDasha).toBeDefined();
    expect(productState.analysis?.activeDasha?.status).toBe('AVAILABLE');

    const expectedCurrent = horoscope.dashaInterpretation?.current!;
    const activeDashaVM = productState.analysis!.activeDasha!;

    expect(activeDashaVM.mahadasha?.planet).toBe(expectedCurrent.mahadasha.planet);
    expect(activeDashaVM.mahadasha?.start).toBe(expectedCurrent.mahadasha.start);
    expect(activeDashaVM.mahadasha?.end).toBe(expectedCurrent.mahadasha.end);

    expect(activeDashaVM.antardasha?.planet).toBe(expectedCurrent.antardasha.planet);
    expect(activeDashaVM.antardasha?.start).toBe(expectedCurrent.antardasha.start);
    expect(activeDashaVM.antardasha?.end).toBe(expectedCurrent.antardasha.end);

    expect(activeDashaVM.pratyantardasha?.planet).toBe(expectedCurrent.pratyantardasha.planet);
    expect(activeDashaVM.pratyantardasha?.start).toBe(expectedCurrent.pratyantardasha.start);
    expect(activeDashaVM.pratyantardasha?.end).toBe(expectedCurrent.pratyantardasha.end);

    expect(activeDashaVM.pair?.mahadashaLord).toBe(expectedCurrent.antardasha.pairInterpretation?.mahadashaLord);
    expect(activeDashaVM.pair?.antardashaLord).toBe(expectedCurrent.antardasha.pairInterpretation?.antardashaLord);
  });
});
