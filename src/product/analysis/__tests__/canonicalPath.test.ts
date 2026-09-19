import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProductAnalysisService,
  createProductAnalysisService
} from '../productAnalysisService';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import * as careerModule from '../../../domain/career/CareerDomainInterpreterV2';
import * as wealthModule from '../../../domain/wealth/WealthDomainInterpreterV2';
import * as temporalModule from '../../../core/analysis/resolveAnalysisTemporalState';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import { calculateHoroscope } from '../../../engine/astroEngine';
import * as contextFactoryModule from '../../../core/analysis/analysisContextFactory';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import * as domainServiceModule from '../../../domain/interpretation/DomainInterpretationService';
import { interpretDomain } from '../../../domain/interpretation/DomainInterpretationService';
import { buildAiContext } from '../../../ai/context/aiContextFactory';
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

  beforeEach(() => {
    careerSpy = vi.spyOn(careerModule, 'interpretCareerV2');
    wealthSpy = vi.spyOn(wealthModule, 'interpretWealthV2');
    temporalSpy = vi.spyOn(temporalModule, 'resolveAnalysisTemporalState');
  });

  afterEach(() => {
    careerSpy.mockRestore();
    wealthSpy.mockRestore();
    temporalSpy.mockRestore();
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
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);

    contextSpy.mockRestore();
  });

  it('Test B: Temporal state object identity across pipeline, domain interpreters, timing VM, and AI context', async () => {
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF });

    const lifeAnalysisState = await runLifeAnalysisProduct({
      horoscope: baseHoroscope,
      context,
      includeAiExplanation: true
    });

    const pipelineTemporalState = lifeAnalysisState.temporalState;
    expect(pipelineTemporalState).toBeDefined();

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
    const context = createAnalysisContext({ asOf: FIXED_AS_OF });
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
    const context = createAnalysisContext({ asOf: FIXED_AS_OF });
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
});
