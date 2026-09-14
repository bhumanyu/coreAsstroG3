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
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
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

  it('invokes interpretCareerV2 and interpretWealthV2 EXACTLY ONCE per chart analysis with AI explanation enabled', async () => {
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

    // Verify EXACTLY ONCE invocation (zero double/triple calculation along canonical path)
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);
    expect(temporalSpy).toHaveBeenCalledTimes(1);

    // Verify context and temporalState were properly passed to the domain interpreters and reference equality holds
    const careerDomainOptions = careerSpy.mock.calls[0][1];
    const wealthDomainOptions = wealthSpy.mock.calls[0][1];
    expect(careerDomainOptions?.context).toBeDefined();
    expect(careerDomainOptions?.context?.asOf).toBe(FIXED_AS_OF);
    expect(wealthDomainOptions?.context).toBeDefined();
    expect(wealthDomainOptions?.context?.asOf).toBe(FIXED_AS_OF);
    expect(careerDomainOptions?.context).toBe(wealthDomainOptions?.context);
    expect(careerDomainOptions?.temporalState).toBeDefined();
    expect(wealthDomainOptions?.temporalState).toBeDefined();
    expect(careerDomainOptions?.temporalState).toBe(wealthDomainOptions?.temporalState);
    expect(Object.isFrozen(careerDomainOptions?.temporalState)).toBe(true);
  });

  it('invokes interpretCareerV2 and interpretWealthV2 EXACTLY ONCE per chart analysis when AI explanation is disabled', async () => {
    const service = new ProductAnalysisService();

    const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: false
    });

    expect(result.status).toBe('READY');
    expect(result.career).toBeDefined();
    expect(result.wealth).toBeDefined();
    expect(result.ai.status).toBe('UNAVAILABLE');
    expect(result.ai.explanation).toBeUndefined();

    // Single invocation guarantee holds regardless of AI explanation flag
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);
    expect(temporalSpy).toHaveBeenCalledTimes(1);

    const careerDomainOptions = careerSpy.mock.calls[0][1];
    const wealthDomainOptions = wealthSpy.mock.calls[0][1];
    expect(careerDomainOptions?.context).toBeDefined();
    expect(wealthDomainOptions?.context).toBeDefined();
    expect(careerDomainOptions?.context).toBe(wealthDomainOptions?.context);
    expect(careerDomainOptions?.temporalState).toBeDefined();
    expect(wealthDomainOptions?.temporalState).toBeDefined();
    expect(careerDomainOptions?.temporalState).toBe(wealthDomainOptions?.temporalState);
  });

  it('proves shared frozen temporalState object-identity between Career and Wealth interpreters', async () => {
    const service = new ProductAnalysisService();

    await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: false
    });

    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);
    expect(temporalSpy).toHaveBeenCalledTimes(1);

    const careerOptions = careerSpy.mock.calls[0][1];
    const wealthOptions = wealthSpy.mock.calls[0][1];

    expect(careerOptions.context === wealthOptions.context).toBe(true);
    expect(careerOptions.temporalState === wealthOptions.temporalState).toBe(true);
    expect(careerOptions.temporalState.asOf).toBe(FIXED_AS_OF);
    expect(Object.isFrozen(careerOptions.temporalState)).toBe(true);
  });

  it('resolves resolveAnalysisTemporalState EXACTLY ONCE per ProductAnalysis.analyze(...) run', async () => {
    const service = createProductAnalysisService();

    await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: true
    });

    expect(temporalSpy).toHaveBeenCalledTimes(1);
    const careerDomainOptions = careerSpy.mock.calls[0][1];
    const wealthDomainOptions = wealthSpy.mock.calls[0][1];
    expect(careerDomainOptions.temporalState).toBe(wealthDomainOptions.temporalState);
  });

  it('stale-Dasha golden test: interpreter uses canonical Dasha from temporalState, ignoring embedded stale horoscope Dasha', () => {
    // 1. Calculate a base horoscope with canonical birth details
    const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, '2024-06-01T00:00:00.000Z');

    // 2. Deliberately corrupt horoscope.dashaInterpretation with an obviously wrong/stale Dasha (KETU)
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

    // 3. Resolve context and temporalState for 2024-06-01 (when Saturn MD is canonically running)
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

    // Verify that the canonical temporalState has JUPITER, NOT KETU
    expect(temporalState.dashaInterpretation?.current?.mahadasha?.planet).toBe(Planet.JUPITER);

    // 4. Call Career and Wealth interpreters with the stale horoscope and canonical temporalState
    const domainOptions = { context, temporalState };
    const career = careerModule.interpretCareerV2(staleHoroscope, domainOptions);
    const wealth = wealthModule.interpretWealthV2(staleHoroscope, domainOptions);

    // 5. Assert career uses JUPITER from temporalState and never KETU from stale horoscope
    const careerConclusion = career.conclusionData as any;
    expect(careerConclusion.dashaInterpretation?.current?.mahadasha?.planet).toBe(Planet.JUPITER);
    expect(careerConclusion.dashaInterpretation?.current?.mahadasha?.planet).not.toBe(Planet.KETU);
    expect(careerConclusion.dashaTimings?.mahadasha).toBeDefined();

    // If career dashaSynthesis factors exist, verify they reference JUPITER, not KETU
    if (career.dashaSynthesis?.factors) {
      const factorPlanets = career.dashaSynthesis.factors.map((f: any) => f.planet);
      expect(factorPlanets).toContain(Planet.JUPITER);
      expect(factorPlanets).not.toContain(Planet.KETU);
    }

    // 6. Assert wealth uses JUPITER from temporalState and never KETU from stale horoscope
    const wealthConclusion = wealth.conclusionData as any;
    expect(wealthConclusion.dashaInterpretation?.current?.mahadasha?.planet).toBe(Planet.JUPITER);
    expect(wealthConclusion.dashaInterpretation?.current?.mahadasha?.planet).not.toBe(Planet.KETU);
    const mdTiming = wealthConclusion.periodTimingActivations?.find((p: any) => p.period === 'MD');
    expect(mdTiming?.planet).toBe(Planet.JUPITER);
    expect(mdTiming?.planet).not.toBe(Planet.KETU);
  });
});
