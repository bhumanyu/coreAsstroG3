import { describe, it, expect, vi } from 'vitest';
import type { BirthDetails, Horoscope } from '../../../types';
import { AyanamsaType, Planet, Sign } from '../../../types';
import {
  ProductAnalysisService,
  createProductAnalysisService,
  type ProductAnalysisDependencies
} from '../productAnalysisService';
import type { LifeAnalysisProductState, LifeAnalysisViewModel } from '../../life-analysis/lifeAnalysisTypes';

describe('ProductAnalysisService (P-UI-02)', () => {
  const sampleBirth: BirthDetails = {
    name: 'Service Test Chart',
    placeOfBirth: 'Mumbai, India',
    dateTimeStr: '1992-06-10T12:00:00.000Z',
    timeZone: 'Asia/Kolkata',
    latitude: 19.076,
    longitude: 72.8777,
    ayanamsa: AyanamsaType.LAHIRI
  };

  const sampleHoroscope = {
    birthDetails: sampleBirth,
    rasiChart: {
      ascendantSign: Sign.VIRGO,
      ascendantLongitude: 165.2
    },
    planetFacts: {
      [Planet.SUN]: { sign: Sign.TAURUS, position: { sign: Sign.TAURUS } },
      [Planet.MOON]: {
        sign: Sign.VIRGO,
        position: { sign: Sign.VIRGO },
        nakshatraResult: { nakshatra: 'Hasta' }
      }
    }
  } as unknown as Horoscope;

  const sampleViewModel: LifeAnalysisViewModel = {
    overall: {
      status: 'STRONG',
      headline: 'Harmonious Life Expression',
      statement: 'Natal chart indicates balanced vocational and financial capacity.'
    },
    domains: [
      {
        domain: 'CAREER',
        status: 'STRONG',
        confidence: 'HIGH',
        headline: 'Analytical Vocations',
        statement: 'Strong 10th lord and Mercury influence.'
      },
      {
        domain: 'WEALTH',
        status: 'STRONG',
        confidence: 'HIGH',
        headline: 'Sound Asset Growth',
        statement: 'Well-supported 2nd house.'
      }
    ],
    careerDetail: {
      status: 'STRONG',
      promiseHeadline: 'Analytical Vocations',
      promiseStatement: 'Strong vocational foundation.',
      capacityLevel: 'BALANCED',
      manifestations: ['Consulting', 'Data Architecture'],
      d10Relationship: 'CONFIRMS' as any,
      d10Statement: 'Dasamsa confirms Mercury placement.',
      timing: {
        currentActivation: 'Mercury / Venus',
        transitEffect: 'FAVORABLE' as any
      },
      qualifications: [],
      actionableTakeaways: ['Deepen specialized expertise']
    },
    wealthDetail: {
      status: 'STRONG',
      promiseHeadline: 'Sound Asset Growth',
      promiseStatement: 'Consistent accumulation capacity.',
      accumulation: { status: 'STRONG' },
      gains: { status: 'STRONG' },
      fortune: { status: 'STRONG' },
      speculation: { status: 'MODERATE' },
      d2Relationship: 'CONFIRMS' as any,
      timing: {
        transitEffect: 'NEUTRAL' as any
      },
      qualifications: []
    },
    evidence: []
  } as unknown as LifeAnalysisViewModel;

  const readyPipelineState: LifeAnalysisProductState = {
    status: 'READY',
    analysis: sampleViewModel,
    aiExplanation: {
      kind: 'SUCCESS',
      requestId: 'test-req-1',
      task: 'LIFE_ANALYSIS_EXPLANATION',
      status: 'SUCCESS',
      conclusion: 'Analytical vocation strongly indicated.',
      supportingEvidence: [],
      challengingEvidence: [],
      unresolvedQuestions: [],
      warnings: [],
      triggeredRuleIds: [],
      providerId: 'local-rules',
      providerName: 'Local Rules Engine',
      providerKind: 'LOCAL_RULES',
      routingMode: 'LOCAL_ONLY',
      fallbackUsed: false,
      selectionReason: 'DEFAULT',
      generatedAt: '2026-01-01T00:00:00.000Z'
    }
  };

  it('1. Orchestrates successfully: computes horoscope once and delegates to pipeline', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockResolvedValue(readyPipelineState);

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = createProductAnalysisService(deps);
    const result = await service.analyze(sampleBirth);

    expect(calculateHoroscopeMock).toHaveBeenCalledTimes(1);
    expect(calculateHoroscopeMock).toHaveBeenCalledWith(sampleBirth);

    expect(runPipelineMock).toHaveBeenCalledTimes(1);
    expect(runPipelineMock).toHaveBeenCalledWith({
      horoscope: sampleHoroscope,
      includeAiExplanation: true
    });

    expect(result.status).toBe('READY');
    expect(result.career.promise.strength).toBe('STRONG');
    expect(result.wealth.overall.status).toBe('STRONG');
    expect(result.ai.status).toBe('AVAILABLE');
    expect(result.ai.conclusion).toBe('Analytical vocation strongly indicated.');
  });

  it('2. Handles pipeline error result gracefully without throwing', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockResolvedValue({
      status: 'ERROR',
      errorMessage: 'Computation engine encountered a timeout'
    });

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = new ProductAnalysisService(deps);
    const result = await service.analyze(sampleBirth);

    expect(result.status).toBe('ERROR');
    expect(result.warnings.some((w) => w.message.includes('Computation engine encountered a timeout'))).toBe(true);
    expect(result.career.promise.strength).toBe('UNAVAILABLE');
    expect(result.wealth.overall.status).toBe('UNAVAILABLE');
  });

  it('3. Handles pipeline rejection gracefully without throwing', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockRejectedValue(new Error('Network or worker crash'));

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = new ProductAnalysisService(deps);
    const result = await service.analyze(sampleBirth);

    expect(result.status).toBe('ERROR');
    expect(result.warnings.some((w) => w.message.includes('Network or worker crash'))).toBe(true);
  });

  it('4. Handles calculation exception gracefully without throwing', async () => {
    const calculateHoroscopeMock = vi.fn().mockImplementation(() => {
      throw new Error('Invalid ephemeris parameters');
    });
    const runPipelineMock = vi.fn();

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = new ProductAnalysisService(deps);
    const result = await service.analyze(sampleBirth);

    expect(result.status).toBe('ERROR');
    expect(result.warnings.some((w) => w.message.includes('Invalid ephemeris parameters'))).toBe(true);
    expect(runPipelineMock).not.toHaveBeenCalled();
  });
});
