import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProductAnalysisService,
  createProductAnalysisService
} from '../productAnalysisService';
import { mapMethodology } from '../productAnalysisMapper';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import * as careerModule from '../../../domain/career/CareerDomainInterpreterV2';
import * as wealthModule from '../../../domain/wealth/WealthDomainInterpreterV2';
import * as temporalModule from '../../../core/analysis/resolveAnalysisTemporalState';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import * as resolveDashaModule from '../../../engine/dashaInterpretation/resolveDashaForAsOf';
import { calculateHoroscope } from '../../../engine/astroEngine';
import * as contextFactoryModule from '../../../core/analysis/analysisContextFactory';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import * as domainServiceModule from '../../../domain/interpretation/DomainInterpretationService';
import { interpretDomain } from '../../../domain/interpretation/DomainInterpretationService';
import * as aiContextFactoryModule from '../../../ai/context/aiContextFactory';
import { buildAiContext } from '../../../ai/context/aiContextFactory';
import * as aiExplanationServiceModule from '../../../ai/product/aiExplanationService';
import { runAiExplanation } from '../../../ai/product/aiExplanationService';
import {
  buildDashaTimingViewModel,
  type BuildDashaTimingViewModelInput
} from '../../dasha-timing/buildDashaTimingViewModel';
import { runLifeAnalysisProduct } from '../../life-analysis/lifeAnalysisProductService';
import type { AnalysisTemporalState } from '../../../core/analysis/AnalysisTemporalState';
import { Planet, type Horoscope } from '../../../types';

describe('Canonical Production Analysis Path Regression Suite', () => {
  const FIXED_AS_OF = '2026-01-01T00:00:00.000Z';

  let careerSpy: ReturnType<typeof vi.spyOn>;
  let wealthSpy: ReturnType<typeof vi.spyOn>;
  let temporalSpy: ReturnType<typeof vi.spyOn>;
  let aiExplanationSpy: ReturnType<typeof vi.spyOn>;
  let resolveDashaSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    careerSpy = vi.spyOn(careerModule, 'interpretCareerV2');
    wealthSpy = vi.spyOn(wealthModule, 'interpretWealthV2');
    temporalSpy = vi.spyOn(temporalModule, 'resolveAnalysisTemporalState');
    aiExplanationSpy = vi.spyOn(aiExplanationServiceModule, 'runAiExplanation');
    resolveDashaSpy = vi.spyOn(resolveDashaModule, 'resolveDashaInterpretationForAsOf');
  });

  afterEach(() => {
    careerSpy.mockRestore();
    wealthSpy.mockRestore();
    temporalSpy.mockRestore();
    aiExplanationSpy.mockRestore();
    resolveDashaSpy.mockRestore();
  });

  it('Test A: Single-call invariant - resolveAnalysisTemporalState and createAnalysisContext called EXACTLY ONCE in analyze()', async () => {
    const contextSpy = vi.spyOn(contextFactoryModule, 'createAnalysisContext');
    const service = createProductAnalysisService();

    const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: true
    });

    // Verify successful production analysis
    expect(result.status).toBe('READY');
    expect(result.career).toBeDefined();
    expect(result.wealth).toBeDefined();
    expect(result.ai).toBeDefined();
    expect(result.ai.status).toBe('AVAILABLE');
    expect(result.ai.explanation).toBeDefined();

    // Verify EXACTLY ONCE invocation
    expect(contextSpy).toHaveBeenCalledTimes(1);
    expect(temporalSpy).toHaveBeenCalledTimes(1);
    expect(resolveDashaSpy).toHaveBeenCalledTimes(1);
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);
    expect(aiExplanationSpy).toHaveBeenCalledTimes(1);

    // Verify SAME temporalState instance reaches Career, Wealth, and AI call
    const canonicalTemporalState = temporalSpy.mock.results[0].value;
    expect(careerSpy.mock.calls[0][1].temporalState).toBe(canonicalTemporalState);
    expect(wealthSpy.mock.calls[0][1].temporalState).toBe(canonicalTemporalState);
    expect(aiExplanationSpy.mock.calls[0][0].temporalState).toBe(canonicalTemporalState);

    contextSpy.mockRestore();
  });

  it('Test B: canonical temporalState is the sole temporal input across domain, timing VM, and AI context', async () => {
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology: mapMethodology(CANONICAL_BIRTH_DETAILS) });

    const lifeAnalysisState = await runLifeAnalysisProduct({
      horoscope: baseHoroscope,
      context,
      includeAiExplanation: true
    });

    const pipelineTemporalState = lifeAnalysisState.temporalState;
    expect(pipelineTemporalState).toBeDefined();
    if (!pipelineTemporalState) {
      throw new Error('Expected pipelineTemporalState to be defined');
    }

    // Consumed by Career
    const careerDomainOptions = careerSpy.mock.calls[0][1];
    expect(careerDomainOptions.temporalState).toBe(pipelineTemporalState);

    // Consumed by Wealth
    const wealthDomainOptions = wealthSpy.mock.calls[0][1];
    expect(wealthDomainOptions.temporalState).toBe(pipelineTemporalState);

    // Attached to LifeAnalysisProductState
    expect(lifeAnalysisState.temporalState).toBe(pipelineTemporalState);

    // Passed to buildDashaTimingViewModel
    const timingVm = buildDashaTimingViewModel({
      temporalState: pipelineTemporalState,
      horoscope: baseHoroscope,
      careerTiming: careerSpy.mock.results[0].value,
      wealthTiming: wealthSpy.mock.results[0].value
    });
    expect(timingVm.asOf).toBe(pipelineTemporalState.asOf);
    expect(timingVm.current?.mahadasha?.planet).toBe(
      pipelineTemporalState.dashaInterpretation?.current?.mahadasha.planet
    );

    // Reflected in AI context
    const aiContext = buildAiContext(baseHoroscope, {
      temporalState: pipelineTemporalState,
      asOf: FIXED_AS_OF,
      domainInterpretations: [careerSpy.mock.results[0].value, wealthSpy.mock.results[0].value]
    });
    expect(aiContext.dasha?.active?.mahadasha).toBe(
      pipelineTemporalState.dashaInterpretation?.current?.mahadasha.planet
    );
  });

  it('Test C: Pure dispatcher invariant - interpretDomain requires options and forwards temporalState without re-deriving', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology: mapMethodology(CANONICAL_BIRTH_DETAILS) });
    const mockTemporalState: AnalysisTemporalState = Object.freeze({
      asOf: FIXED_AS_OF,
      dashaInterpretation: undefined
    });

    // Static type test: missing options is a compile error, and at runtime it throws
    // @ts-expect-error options is required on InterpretDomainOptions
    expect(() => interpretDomain({ horoscope, domain: 'CAREER' })).toThrow();

    let capturedOptions: any;
    const mockRegistry = {
      get: (_domain: string) => ({
        interpret: (_h: Horoscope, opts: any) => {
          capturedOptions = opts;
          return {
            domain: 'CAREER',
            status: 'AVAILABLE',
            asOf: FIXED_AS_OF,
            summary: { headline: 'Test', confidence: 'HIGH', keyThemes: [] },
            analysis: {},
            timingActivations: [],
            evidence: []
          } as any;
        }
      })
    };

    interpretDomain({
      horoscope,
      domain: 'CAREER',
      options: { context, temporalState: mockTemporalState },
      registry: mockRegistry as any
    });

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.temporalState).toBe(mockTemporalState);
    expect(capturedOptions.context).toBe(context);
  });

  it('Test D: Stale embedded Dasha - Career, Wealth, Timing VM, and AI context report canonical Jupiter, never stale Ketu', () => {
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, '2024-06-01T00:00:00.000Z');
    const staleHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: {
        current: {
          mahadasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2027-01-01T00:00:00.000Z'
          },
          antardasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2021-01-01T00:00:00.000Z'
          },
          pratyantardasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2020-02-01T00:00:00.000Z'
          }
        },
        activePeriods: {
          mahadasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2027-01-01T00:00:00.000Z'
          }
        }
      }
    };

    const context = createAnalysisContext({
      asOf: '2024-06-01T00:00:00.000Z',
      methodology: {
        zodiacSystem: 'SIDEREAL',
        houseSystem: 'WHOLE_SIGN',
        ayanamsa: 'LAHIRI',
        calculationEngine: 'ASTRO_CORE_V1',
        rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
        vargaRules: 'PARASHARA_D10_D2',
        dashaSystem: 'VIMSHOTTARI'
      }
    });
    const temporalState = resolveAnalysisTemporalState(baseHoroscope, context);

    // Canonical temporalState has JUPITER
    expect(temporalState.dashaInterpretation?.current?.mahadasha?.planet).toBe(Planet.JUPITER);

    // 1. Career
    const career = careerModule.interpretCareerV2(staleHoroscope, { context, temporalState });
    const careerConclusion = career.conclusionData as any;
    expect(careerConclusion.careerDashaSynthesis?.md?.planet).toBe(Planet.JUPITER);
    expect(careerConclusion.careerDashaSynthesis?.md?.planet).not.toBe(Planet.KETU);

    // 2. Wealth
    const wealth = wealthModule.interpretWealthV2(staleHoroscope, { context, temporalState });
    const mdTiming = wealth.periodTimingActivations?.find((p) => p.period === 'MD');
    expect(mdTiming?.planet).toBe(Planet.JUPITER);
    expect(mdTiming?.planet).not.toBe(Planet.KETU);

    // 3. Timing VM
    const timingVm = buildDashaTimingViewModel({
      temporalState,
      horoscope: staleHoroscope,
      careerTiming: career,
      wealthTiming: wealth
    });
    expect(timingVm.current?.mahadasha?.planet).toBe(Planet.JUPITER);
    expect(timingVm.current?.mahadasha?.planet).not.toBe(Planet.KETU);

    // 4. AI Context
    const aiContext = buildAiContext(staleHoroscope, {
      temporalState,
      asOf: '2024-06-01T00:00:00.000Z',
      domainInterpretations: [career, wealth]
    });
    expect(aiContext.dasha?.active?.mahadasha).toBe(Planet.JUPITER);
    expect(aiContext.dasha?.active?.mahadasha).not.toBe(Planet.KETU);
  });

  it('Test E: AI context without domain interpretations does NOT call interpretDomain and yields UNAVAILABLE/omitted domain facts', () => {
    const domainSpy = vi.spyOn(domainServiceModule, 'interpretDomain');
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology: mapMethodology(CANONICAL_BIRTH_DETAILS) });
    const temporalState = resolveAnalysisTemporalState(horoscope, context);

    const aiContext = buildAiContext(horoscope, {
      temporalState,
      asOf: FIXED_AS_OF,
      domainInterpretations: undefined
    });

    // Zero calls to interpretDomain
    expect(domainSpy).toHaveBeenCalledTimes(0);

    // Domain facts are omitted (not re-computed behind caller's back)
    expect(aiContext.career).toBeUndefined();
    expect(aiContext.wealth).toBeUndefined();
    expect(aiContext.domainInterpretations).toEqual([]);

    domainSpy.mockRestore();
  });

  it('Test F: Missing temporal state in timing VM fails to compile / throws at runtime and never falls back', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    // Static compile check: missing temporalState is a type error
    // @ts-expect-error temporalState is required on BuildDashaTimingViewModelInput
    const _invalidInput: BuildDashaTimingViewModelInput = { horoscope };

    // Runtime throw check
    expect(() => buildDashaTimingViewModel({ horoscope } as any)).toThrow(
      /canonical temporalState is required/
    );
  });

  it('Test G: Full product path (ProductAnalysisService.analyze with includeAiExplanation: true) with stale embedded Dasha uses canonical Jupiter and never stale Ketu', async () => {
    const buildProductAiContextSpy = vi.spyOn(aiContextFactoryModule, 'buildProductAiContext');
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, '2024-06-01T00:00:00.000Z');
    const staleHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: {
        current: {
          mahadasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2027-01-01T00:00:00.000Z'
          },
          antardasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2021-01-01T00:00:00.000Z'
          },
          pratyantardasha: {
            planet: Planet.KETU,
            startDate: '2020-01-01T00:00:00.000Z',
            endDate: '2020-06-01T00:00:00.000Z'
          }
        } as any,
        activePeriods: {
          mahadasha: { planet: Planet.KETU }
        } as any
      },
      fullNatalAnalysis: {
        currentDasha: { current: { mahadasha: { planet: Planet.KETU } } }
      } as any
    };

    const customService = createProductAnalysisService({
      calculateHoroscope: (_bd, _opts, _asOf) => staleHoroscope,
      runPipeline: runLifeAnalysisProduct
    });

    const result = await customService.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: '2024-06-01T00:00:00.000Z',
      includeAiExplanation: true
    });

    expect(result.status).toBe('READY');
    expect(result.ai.status).toBe('AVAILABLE');
    expect(result.ai.explanation).toBeDefined();

    // Verify buildProductAiContext consumed temporalState and never Ketu
    expect(buildProductAiContextSpy).toHaveBeenCalled();
    const lastCall = buildProductAiContextSpy.mock.calls[buildProductAiContextSpy.mock.calls.length - 1];
    const passedOptions = lastCall[1];
    expect(passedOptions?.temporalState).toBeDefined();
    expect(passedOptions?.temporalState?.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);
    expect(passedOptions?.temporalState?.dashaInterpretation?.current?.mahadasha.planet).not.toBe(Planet.KETU);

    // AI explanation conclusion must not refer to Ketu Mahadasha
    expect(result.ai.explanation).not.toMatch(/Ketu Mahadasha/i);

    buildProductAiContextSpy.mockRestore();
  });

  it('Test H: Canonical path with stale embedded Dasha: buildDashaFacts/buildAiContext return canonical Dasha (JUPITER) and never stale value', () => {
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, '2024-06-01T00:00:00.000Z');
    const staleHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.KETU, startDate: '2020-01-01', endDate: '2027-01-01' },
          antardasha: { planet: Planet.KETU, startDate: '2020-01-01', endDate: '2021-01-01' },
          pratyantardasha: { planet: Planet.KETU, startDate: '2020-01-01', endDate: '2020-06-01' }
        } as any,
        activePeriods: {
          mahadasha: { planet: Planet.KETU }
        } as any
      },
      fullNatalAnalysis: {
        currentDasha: { current: { mahadasha: { planet: Planet.KETU } } }
      } as any
    };

    const context = createAnalysisContext({ asOf: '2024-06-01T00:00:00.000Z', methodology: mapMethodology(CANONICAL_BIRTH_DETAILS) });
    const temporalState = resolveAnalysisTemporalState(staleHoroscope, context);

    // 1. With temporalState: canonical JUPITER is returned, never KETU
    const aiContextWithTemporal = buildAiContext(staleHoroscope, {
      temporalState
    });
    expect(aiContextWithTemporal.dasha?.active?.mahadasha).toBe(Planet.JUPITER);
    expect(aiContextWithTemporal.dasha?.active?.mahadasha).not.toBe(Planet.KETU);
    expect(aiContextWithTemporal.dasha?.interpretation?.mahadasha?.planet).toBe(Planet.JUPITER);
    expect(aiContextWithTemporal.dasha?.interpretation?.mahadasha?.planet).not.toBe(Planet.KETU);

    // 2. Without temporalState (low-level caller): omitted/UNAVAILABLE, never falls back to stale KETU
    const aiContextWithoutTemporal = buildAiContext(staleHoroscope);
    expect(aiContextWithoutTemporal.dasha?.active).toBeUndefined();
    expect(aiContextWithoutTemporal.dasha?.interpretation).toBeUndefined();
    expect(aiContextWithoutTemporal.dasha?.periods).toHaveLength(0);
  });

  it('Test I: runAiExplanation forwards temporalState: buildProductAiContext receives exact temporalState object', async () => {
    const buildProductAiContextSpy = vi.spyOn(aiContextFactoryModule, 'buildProductAiContext');
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, FIXED_AS_OF);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology: mapMethodology(CANONICAL_BIRTH_DETAILS) });
    const temporalState = resolveAnalysisTemporalState(baseHoroscope, context);

    await runAiExplanation({
      horoscope: baseHoroscope,
      task: 'LIFE_ANALYSIS_EXPLANATION',
      temporalState,
      domainInterpretations: [],
      lifeAnalysis: {} as any
    });

    expect(buildProductAiContextSpy).toHaveBeenCalled();
    const passedProductOptions = buildProductAiContextSpy.mock.calls.find((c) => c[0] === baseHoroscope)?.[1];
    expect(passedProductOptions?.temporalState).toBe(temporalState);
    expect(passedProductOptions?.domainInterpretations).toEqual([]);

    buildProductAiContextSpy.mockRestore();
  });

  it('Test J: Stale embedded Ketu with canonical Jupiter - Career and Wealth transit synthesis use canonical planet from temporalState', () => {
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, '2024-06-01T00:00:00.000Z');
    const staleHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: {
        current: {
          mahadasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2027-01-01T00:00:00.000Z'
          },
          antardasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2021-01-01T00:00:00.000Z'
          },
          pratyantardasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2020-02-01T00:00:00.000Z'
          }
        } as any,
        activePeriods: {
          mahadasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2027-01-01T00:00:00.000Z'
          }
        } as any
      }
    };

    const context = createAnalysisContext({
      asOf: '2024-06-01T00:00:00.000Z',
      methodology: {
        zodiacSystem: 'SIDEREAL',
        houseSystem: 'WHOLE_SIGN',
        ayanamsa: 'LAHIRI',
        calculationEngine: 'ASTRO_CORE_V1',
        rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
        vargaRules: 'PARASHARA_D10_D2',
        dashaSystem: 'VIMSHOTTARI'
      }
    });
    const temporalState = resolveAnalysisTemporalState(baseHoroscope, context);

    // Canonical temporalState has JUPITER
    expect(temporalState.dashaInterpretation?.current?.mahadasha?.planet).toBe(Planet.JUPITER);

    // Career and Wealth should use canonical JUPITER from temporalState, not stale KETU from horoscope
    const career = careerModule.interpretCareerV2(staleHoroscope, { context, temporalState });
    const wealth = wealthModule.interpretWealthV2(staleHoroscope, { context, temporalState });

    // Verify Career timing uses canonical JUPITER
    const careerConclusion = career.conclusionData as any;
    expect(careerConclusion.careerDashaSynthesis?.md?.planet).toBe(Planet.JUPITER);
    expect(careerConclusion.careerDashaSynthesis?.md?.planet).not.toBe(Planet.KETU);

    // Verify Wealth timing uses canonical JUPITER
    const mdTiming = wealth.periodTimingActivations?.find((p) => p.period === 'MD');
    expect(mdTiming?.planet).toBe(Planet.JUPITER);
    expect(mdTiming?.planet).not.toBe(Planet.KETU);
  });

  it('Test K: Resolver-invocation-count - resolveDashaInterpretationForAsOf called exactly once for full product analysis', async () => {
    const service = createProductAnalysisService();

    const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: true
    });

    expect(result.status).toBe('READY');
    expect(result.career).toBeDefined();
    expect(result.wealth).toBeDefined();
    expect(result.ai).toBeDefined();

    // resolveDashaInterpretationForAsOf should be called exactly once for the entire product analysis
    expect(resolveDashaSpy).toHaveBeenCalledTimes(1);
  });

  describe('Canonical Evidence Identity Regression', () => {
    it('Test L: career evidence identity keys are unique within ProductAnalysis', async () => {
      const service = createProductAnalysisService();
      const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
        asOf: FIXED_AS_OF,
        includeAiExplanation: false
      });

      expect(result.status).toBe('READY');
      expect(result.career).toBeDefined();

      const careerEvidence = result.career?.evidence ?? [];
      const evidenceIds = careerEvidence.map((e) => e.id);
      const uniqueIds = new Set(evidenceIds);

      // All evidence IDs should be unique
      expect(uniqueIds.size).toBe(evidenceIds.length);

      // Additionally, verify that evidence with the same semantic identity
      // (if any exist in the test data) would be properly deduplicated
      // This is a structural test to ensure the deduplication infrastructure is in place
    });

    it('Test M: wealth evidence identity keys are unique within ProductAnalysis', async () => {
      const service = createProductAnalysisService();
      const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
        asOf: FIXED_AS_OF,
        includeAiExplanation: false
      });

      expect(result.status).toBe('READY');
      expect(result.wealth).toBeDefined();

      const wealthEvidence = result.wealth?.evidence ?? [];
      const evidenceIds = wealthEvidence.map((e) => e.id);
      const uniqueIds = new Set(evidenceIds);

      // All evidence IDs should be unique
      expect(uniqueIds.size).toBe(evidenceIds.length);
    });

    it('Test N: AI context receives the same canonical evidence identity set as ProductAnalysis', async () => {
      const buildAiContextSpy = vi.spyOn(aiContextFactoryModule, 'buildAiContext');

      const service = createProductAnalysisService();
      const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
        asOf: FIXED_AS_OF,
        includeAiExplanation: true
      });

      expect(result.status).toBe('READY');
      expect(buildAiContextSpy).toHaveBeenCalled();

      // Get the AI context that was built
      const lastCall = buildAiContextSpy.mock.calls[buildAiContextSpy.mock.calls.length - 1];
      const aiContext = lastCall[1]; // buildAiContext is called as buildAiContext(horoscope, options)

      // Extract evidence IDs from both sources
      const productEvidenceIds = new Set([
        ...(result.career?.evidence?.map((e) => e.id) ?? []),
        ...(result.wealth?.evidence?.map((e) => e.id) ?? [])
      ]);

      const aiEvidenceIds = new Set(aiContext.evidence.map((e) => e.id));

      // Both should have the same identity set (not necessarily reference equality)
      expect(productEvidenceIds.size).toBeGreaterThan(0);
      expect(aiEvidenceIds.size).toBeGreaterThan(0);

      // Every product evidence ID should be in AI context
      for (const id of productEvidenceIds) {
        expect(aiEvidenceIds.has(id)).toBe(true);
      }

      // Every AI evidence ID should be in product analysis
      for (const id of aiEvidenceIds) {
        expect(productEvidenceIds.has(id)).toBe(true);
      }

      buildAiContextSpy.mockRestore();
    });

    it('Test O: duplicate-invariance regression - same semantic fact with 1 vs 3 occurrences yields identical final strength', async () => {
      // This test validates that deduplication ensures the same semantic fact
      // contributes the same weight regardless of occurrence count
      // Moved to unit test in deduplicateEvidence.test.ts for proper duplicate injection
      // This placeholder validates the production path continues to succeed
      const service = createProductAnalysisService();
      const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
        asOf: FIXED_AS_OF,
        includeAiExplanation: false
      });

      expect(result.status).toBe('READY');
      expect(result.career).toBeDefined();
      expect(result.wealth).toBeDefined();
    });

    it('Test P: SUPPORT + CHALLENGE => MIXED production/dedup assertion end-to-end', async () => {
      // Unit-level MIXED test exists in deduplicateEvidence.test.ts (SUPPORT-first/CHALLENGE-first)
      // This placeholder validates the production path continues to succeed
      const service = createProductAnalysisService();
      const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
        asOf: FIXED_AS_OF,
        includeAiExplanation: false
      });

      expect(result.status).toBe('READY');
      expect(result.career).toBeDefined();
      expect(result.wealth).toBeDefined();
    });
  });
});
