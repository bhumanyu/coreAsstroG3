import { describe, it, expect, vi } from 'vitest';
import type { BirthDetails, Horoscope } from '../../../types';
import { AyanamsaType } from '../../../types';
import {
  ProductAnalysisService,
  createProductAnalysisService,
  type ProductAnalysisDependencies
} from '../productAnalysisService';
import { mapProductAnalysis, createAnalysisId, mapMethodology } from '../productAnalysisMapper';
import type { AnalysisContext } from '../../../core/analysis/AnalysisContext';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { runLifeAnalysisProduct } from '../../life-analysis/lifeAnalysisProductService';

describe('ProductAnalysis Temporal Determinism Regression (Invariants 3, 4, 5, 7, 8)', () => {
  const sampleBirth: BirthDetails = {
    name: 'Temporal Test Subject',
    placeOfBirth: 'New Delhi, India',
    dateTimeStr: '1990-01-15T08:30:00.000Z',
    timeZone: 'Asia/Kolkata',
    latitude: 28.6139,
    longitude: 77.209,
    ayanamsa: AyanamsaType.LAHIRI
  };

  it('1. Same birth, same asOf, different wall clock: asserts deep equality of ProductAnalysis', async () => {
    const explicitAsOf = '2026-06-01T12:00:00.000Z';
    const service = createProductAnalysisService();

    vi.useFakeTimers();
    try {
      // Wall clock 1: Set to 2021
      vi.setSystemTime(new Date('2021-03-15T08:00:00.000Z'));
      const run1 = await service.analyze(sampleBirth, {
        asOf: explicitAsOf,
        includeAiExplanation: true
      });
      const ai1 = service.lastPipelineState?.aiExplanation;
      const genAt1 = ai1 && ai1.kind === 'SUCCESS' ? ai1.generatedAt : undefined;

      // Wall clock 2: Set to 2030
      vi.setSystemTime(new Date('2030-11-20T17:30:00.000Z'));
      const run2 = await service.analyze(sampleBirth, {
        asOf: explicitAsOf,
        includeAiExplanation: true
      });
      const ai2 = service.lastPipelineState?.aiExplanation;
      const genAt2 = ai2 && ai2.kind === 'SUCCESS' ? ai2.generatedAt : undefined;

      // Invariant 5: Explicit asOf independent of machine wall clock
      expect(run1.asOf).toBe(explicitAsOf);
      expect(run2.asOf).toBe(explicitAsOf);

      // Invariant 7: ProductAnalysis.asOf === context.asOf
      expect(run1.asOf).toBe(explicitAsOf);
      expect(run2.asOf).toBe(explicitAsOf);

      // Invariant 8: generatedAt is a distinct concept/timestamp from analysis asOf and tracks wall clock
      if (genAt1 && genAt2) {
        expect(genAt1).not.toBe(genAt2);
        expect(genAt1).not.toBe(run1.asOf);
        expect(genAt2).not.toBe(run2.asOf);
      }
      expect((run1 as any).generatedAt).toBeUndefined();

      // Deep equality across runs with different wall clocks
      expect(run1).toEqual(run2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('2. Same birth, different asOf: natal invariants are identical, timing fields differ', async () => {
    const baseHoroscope = calculateHoroscope(sampleBirth);
    const mahadashas = baseHoroscope.vimshottari?.mahadashas ?? [];
    expect(mahadashas.length).toBeGreaterThan(0);

    const firstMd = mahadashas[0];
    const antardashas = firstMd.antardashas ?? [];
    expect(antardashas.length).toBeGreaterThan(1);

    // Pick the boundary between first and second Antardasha
    const firstAd = antardashas[0];
    const boundaryTime = new Date(firstAd.end).getTime();

    // 1 hour before and 1 hour after boundary
    const asOf1 = new Date(boundaryTime - 3600 * 1000).toISOString();
    const asOf2 = new Date(boundaryTime + 3600 * 1000).toISOString();
    const service = new ProductAnalysisService();

    const result1 = await service.analyze(sampleBirth, { asOf: asOf1, includeAiExplanation: false });
    const result2 = await service.analyze(sampleBirth, { asOf: asOf2, includeAiExplanation: false });

    // Invariant 7: ProductAnalysis.asOf strictly matches respective context.asOf
    expect(result1.asOf).toBe(asOf1);
    expect(result2.asOf).toBe(asOf2);

    // Temporal timing fields differ across known period boundary
    expect(result1.asOf).not.toBe(result2.asOf);
    expect(result1.analysisId).not.toBe(result2.analysisId);

    // Deterministic temporal-variation: active Dasha differs across known Antardasha boundary
    const dasha1Sig = `${result1.dasha.current.mahadasha?.planet}-${result1.dasha.current.antardasha?.planet}-${result1.dasha.current.pratyantardasha?.planet}`;
    const dasha2Sig = `${result2.dasha.current.mahadasha?.planet}-${result2.dasha.current.antardasha?.planet}-${result2.dasha.current.pratyantardasha?.planet}`;
    expect(dasha1Sig).not.toEqual(dasha2Sig);
    expect(result1.dasha.current.antardasha?.planet).not.toBe(result2.dasha.current.antardasha?.planet);

    // Invariants 3 & 4: Natal promise & chart structure remain strictly identical
    expect(result1.birth).toEqual(result2.birth);
    expect(result1.chart).toEqual(result2.chart);
    expect(result1.career.promise.strength).toBe(result2.career.promise.strength);
    expect(result1.career.promise.status).toBe(result2.career.promise.status);
    expect(result1.career.promise.confidence).toBe(result2.career.promise.confidence);
    expect(result1.career.promise.dominantManifestations).toEqual(result2.career.promise.dominantManifestations);
    expect(result1.career.d10).toEqual(result2.career.d10);
    expect(result1.wealth.overall.status).toBe(result2.wealth.overall.status);
    expect(result1.wealth.overall.confidence).toBe(result2.wealth.overall.confidence);
    expect(result1.wealth.dimensions).toEqual(result2.wealth.dimensions);
    expect(result1.wealth.d2).toEqual(result2.wealth.d2);
    expect(result1.methodology).toEqual(result2.methodology);
    expect(result1.engineVersion).toBe(result2.engineVersion);
    expect(result1.rulesVersion).toBe(result2.rulesVersion);
  });

  it('3. Mapper boundary: context is the single authoritative source for asOf and methodology', async () => {
    const customAsOf = '2028-09-22T04:15:00.000Z';
    const customMethodology = {
      zodiacSystem: 'SIDEREAL' as const,
      houseSystem: 'WHOLE_SIGN' as const,
      ayanamsa: 'KRISHNAMURTI',
      calculationEngine: 'CUSTOM_TEST_ENGINE_V1',
      rulesEngine: 'CUSTOM_TEST_RULES_V1',
      vargaRules: 'PARASHARA_D10_D2',
      dashaSystem: 'VIMSHOTTARI'
    };

    const context = createAnalysisContext({
      asOf: customAsOf,
      methodology: customMethodology,
      engineVersion: 'CUSTOM_TEST_ENGINE_V1',
      rulesVersion: 'CUSTOM_TEST_RULES_V1'
    });

    const horoscope = calculateHoroscope(sampleBirth, undefined, context.asOf);
    const pipelineState = await runLifeAnalysisProduct({
      horoscope,
      context,
      includeAiExplanation: false
    });

    expect(pipelineState.status).toMatch(/READY|PARTIAL/);
    expect(pipelineState.analysis).toBeDefined();

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope,
      lifeAnalysisViewModel: pipelineState.analysis!,
      context
    });

    // Invariant 7: asOf comes strictly from context.asOf
    expect(analysis.asOf).toBe(context.asOf);
    expect(analysis.analysisId).toBe(createAnalysisId(sampleBirth, context.asOf));

    // Methodology matches context.methodology authority
    expect(analysis.methodology).toEqual(context.methodology);
    expect(analysis.engineVersion).toBe('CUSTOM_TEST_ENGINE_V1');
    expect(analysis.rulesVersion).toBe('CUSTOM_TEST_RULES_V1');
  });

  it('4. Context object identity: passes the exact caller-provided AnalysisContext reference into runPipeline', async () => {
    const contextPassedIntoAnalyze = createAnalysisContext({
      asOf: '2027-04-10T10:00:00.000Z',
      methodology: mapMethodology(sampleBirth),
      engineVersion: 'IDENTITY_TEST_ENGINE_V1',
      rulesVersion: 'IDENTITY_TEST_RULES_V1'
    });

    let capturedInput: {
      readonly horoscope: Horoscope;
      readonly context: AnalysisContext;
      readonly includeAiExplanation?: boolean;
    } | undefined;

    const mockRunPipeline = vi.fn().mockImplementation(async (options: {
      readonly horoscope: Horoscope;
      readonly context: AnalysisContext;
      readonly includeAiExplanation?: boolean;
    }) => {
      capturedInput = options;
      return runLifeAnalysisProduct(options);
    });

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope,
      runPipeline: mockRunPipeline
    };

    const service = new ProductAnalysisService(deps);
    const result = await service.analyze(sampleBirth, { context: contextPassedIntoAnalyze });

    expect(mockRunPipeline).toHaveBeenCalledTimes(1);
    expect(capturedInput).toBeDefined();

    // Exact reference identity (.toBe): proves the canonical immutable context flows by reference
    expect(capturedInput!.context).toBe(contextPassedIntoAnalyze);
    expect(result.asOf).toBe(contextPassedIntoAnalyze.asOf);
    expect(result.engineVersion).toBe('IDENTITY_TEST_ENGINE_V1');
    expect(result.rulesVersion).toBe('IDENTITY_TEST_RULES_V1');
  });
});
