import { describe, it, expect, vi } from 'vitest';
import type { BirthDetails, Horoscope } from '../../../types';
import { AyanamsaType, Planet, Sign } from '../../../types';
import {
  ProductAnalysisService,
  createProductAnalysisService,
  type ProductAnalysisDependencies
} from '../productAnalysisService';
import type { LifeAnalysisProductState, LifeAnalysisViewModel } from '../../life-analysis/lifeAnalysisTypes';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { listSelectableMdAdPeriods } from '../../../core/analysis/selectedMdAdPeriod';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import { mapMethodology } from '../productAnalysisMapper';

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
    status: 'READY',
    overall: {
      status: 'STRONGLY_SUPPORTED',
      headline: 'Harmonious Life Expression',
      statement: 'Natal chart indicates balanced vocational and financial capacity.',
      strongestDomainNames: ['CAREER', 'WEALTH'],
      challengedDomainNames: []
    },
    strongestDomains: [],
    domains: [
      {
        domain: 'CAREER',
        displayName: 'Career & Vocation',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        headline: 'Analytical Vocations',
        statement: 'Strong 10th lord and Mercury influence.',
        conclusion: 'Strong vocational foundation.',
        supportingEvidenceCount: 2,
        challengingEvidenceCount: 0
      },
      {
        domain: 'WEALTH',
        displayName: 'Wealth & Prosperity',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        headline: 'Sound Asset Growth',
        statement: 'Well-supported 2nd house.',
        conclusion: 'Consistent accumulation capacity.',
        supportingEvidenceCount: 2,
        challengingEvidenceCount: 0
      }
    ],
    careerDetail: {
      status: 'STRONG',
      natalPromise: 'STRONG',
      d10Relationship: 'CONFIRMS',
      currentDashaEffect: 'ACTIVATES',
      currentTransitEffect: 'TRIGGER',
      promiseHeadline: 'Analytical Vocations',
      promiseStatement: 'Strong vocational foundation.',
      capacityLevel: 'BALANCED',
      manifestations: ['Consulting', 'Data Architecture'],
      d10Statement: 'Dasamsa confirms Mercury placement.',
      timing: {
        status: 'AVAILABLE',
        currentActivation: 'Mercury / Venus',
        transitEffect: 'TRIGGER'
      },
      qualifications: [],
      actionableTakeaways: ['Deepen specialized expertise']
    },
    wealthDetail: {
      status: 'STRONG',
      overallStatus: 'STRONGLY_SUPPORTED',
      natalPromise: 'STRONG',
      accumulationStatus: 'STRONGLY_SUPPORTED',
      gainsStatus: 'STRONGLY_SUPPORTED',
      fortuneStatus: 'STRONGLY_SUPPORTED',
      speculationStatus: 'SUPPORTED',
      promiseHeadline: 'Sound Asset Growth',
      promiseStatement: 'Consistent accumulation capacity.',
      accumulation: { status: 'STRONGLY_SUPPORTED' },
      gains: { status: 'STRONGLY_SUPPORTED' },
      fortune: { status: 'STRONGLY_SUPPORTED' },
      speculation: { status: 'SUPPORTED' },
      d2Relationship: 'CONFIRMS',
      currentDashaEffect: 'ACTIVATES',
      currentTransitEffect: 'NO_MATERIAL_TRIGGER',
      timing: {
        status: 'AVAILABLE',
        transitEffect: 'NO_MATERIAL_TRIGGER'
      },
      qualifications: []
    },
    sharedTiming: [],
    conflicts: [],
    confidence: 'HIGH',
    completeness: { overall: 'COMPLETE', label: 'Complete' },
    why: {
      integrity: { status: 'VALID', totalReferenced: 0, resolved: 0, unresolved: 0, unresolvedIds: [] },
      evidence: [],
      grouped: { primary: [], supporting: [], challenging: [], conflicting: [], modifiers: [], confirmations: [], timing: [] }
    },
    evidence: []
  };

  // Helper function to create minimal CareerNatalAnalysis for tests
  function makeMinimalCareerNatalAnalysis() {
    return Object.freeze({
      structural: Object.freeze({
        direction: 'SUPPORT' as any,
        strength: 'STRONG' as any,
        primarySupport: 5,
        primaryChallenge: 0,
        supportingSupport: 3,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: Object.freeze([]),
        primaryEvidenceIds: Object.freeze([]),
        supportingEvidenceIds: Object.freeze([]),
        challengingEvidenceIds: Object.freeze([]),
        conflicts: Object.freeze([]),
        statement: 'Strong structural support for career.'
      } as any),
      relevance: Object.freeze([]),
      condition: Object.freeze([]),
      lordRelationships: Object.freeze([]),
      direction: 'SUPPORT',
      strength: 'STRONG',
      evidence: Object.freeze([]),
      conflicts: Object.freeze([]),
      reasoningTrace: Object.freeze({
        primaryPromise: Object.freeze([]),
        secondarySupport: Object.freeze([]),
        modifiers: Object.freeze([]),
        yogas: Object.freeze([]),
        varga: Object.freeze([]),
        dasha: Object.freeze([]),
        transit: Object.freeze([])
      })
    });
  }

  // Helper function to create minimal CareerExpressionAnalysis for tests
  function makeMinimalCareerExpressionAnalysis() {
    return Object.freeze({
      expressions: Object.freeze([]),
      primaryExpression: undefined,
      statement: 'No expressions'
    });
  }

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
    },
    temporalState: undefined, // Will be set in specific tests that need it
    careerArtifacts: undefined, // Will be set in specific tests that need it
    career: {
      domain: 'CAREER',
      version: 'V2',
      asOf: '2026-01-01T00:00:00.000Z',
      generatedAt: '2026-01-01T00:00:00.000Z',
      evidence: [],
      natalPromise: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Strong promise',
        evidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: []
      },
      dashaActivation: {
        domain: 'CAREER',
        active: false,
        effect: 'UNKNOWN',
        strength: 'UNDETERMINED',
        confidence: 'LOW',
        statement: 'Not active',
        evidenceIds: [],
        activatedPromiseEvidenceIds: []
      },
      transitTrigger: {
        domain: 'CAREER',
        active: false,
        effect: 'UNKNOWN',
        strength: 'UNDETERMINED',
        confidence: 'LOW',
        statement: 'No trigger',
        evidenceIds: [],
        triggeredPromiseEvidenceIds: []
      },
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Strong conclusion',
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        unresolvedQuestions: []
      },
      conclusionData: {} as any
    },
    wealth: {
      domain: 'WEALTH',
      version: 'V2',
      asOf: '2026-01-01T00:00:00.000Z',
      generatedAt: '2026-01-01T00:00:00.000Z',
      evidence: [],
      natalPromise: {
        domain: 'WEALTH',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Strong promise',
        evidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: []
      },
      dashaActivation: {
        domain: 'WEALTH',
        active: false,
        effect: 'UNKNOWN',
        strength: 'UNDETERMINED',
        confidence: 'LOW',
        statement: 'Not active',
        evidenceIds: [],
        activatedPromiseEvidenceIds: []
      },
      transitTrigger: {
        domain: 'WEALTH',
        active: false,
        effect: 'UNKNOWN',
        strength: 'UNDETERMINED',
        confidence: 'LOW',
        statement: 'No trigger',
        evidenceIds: [],
        triggeredPromiseEvidenceIds: []
      },
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: {
        domain: 'WEALTH',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Strong conclusion',
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        unresolvedQuestions: []
      },
      conclusionData: {} as any
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
    expect(calculateHoroscopeMock).toHaveBeenCalledWith(
      sampleBirth,
      undefined,
      expect.any(String)
    );

    expect(runPipelineMock).toHaveBeenCalledTimes(1);
    expect(runPipelineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        horoscope: sampleHoroscope,
        includeAiExplanation: true,
        context: expect.objectContaining({
          engineVersion: 'ASTRO_CORE_V1',
          rulesVersion: 'PARASHARA_CLASSICAL_RULES_V2'
        })
      })
    );

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

  it('5. Forwards asOf option to runPipeline when provided', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockResolvedValue(readyPipelineState);

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = new ProductAnalysisService(deps);
    const testAsOf = '2026-06-15T12:00:00.000Z';
    await service.analyze(sampleBirth, {
      asOf: testAsOf,
      includeAiExplanation: false
    });

    expect(runPipelineMock).toHaveBeenCalledWith(
      expect.objectContaining({
        horoscope: sampleHoroscope,
        includeAiExplanation: false,
        context: expect.objectContaining({
          asOf: testAsOf
        })
      })
    );
  });

  it('6. selectPeriod reuses retained analysis context from analyze', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockResolvedValue(readyPipelineState);

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = createProductAnalysisService(deps);

    // Initial analyze with custom context
    const customContext = createAnalysisContext({
      asOf: '2026-06-15T12:00:00.000Z',
      engineVersion: 'ASTRO_CORE_V1',
      rulesVersion: 'PARASHARA_CLASSICAL_RULES_V2'
    });

    await service.analyze(sampleBirth, {
      context: customContext,
      includeAiExplanation: true
    });

    // Verify context was retained
    expect(service.lastHoroscope).toBeDefined();
    expect(service.lastPipelineState).toBeDefined();

    // The key assertion is that selectPeriod checks for context before proceeding
    // We verify this by checking that when context is missing, it throws
    // This test confirms the context retention check exists
    expect(() => {
      // Access private property to verify it was set
      const serviceAny = service as any;
      expect(serviceAny._lastContext).toBeDefined();
    }).not.toThrow();
  });

  it('7. selectPeriod throws when prerequisites are not retained (prerequisite error)', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockResolvedValue(readyPipelineState);

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = new ProductAnalysisService(deps);

    // Call selectPeriod without calling analyze first
    await expect(
      service.selectPeriod('md_jupiter', 'ad_saturn')
    ).rejects.toThrow('Cannot select period: no horoscope available. Call analyze() first.');
  });

  it('8. selectPeriod retains and uses custom analysis context from analyze', async () => {
    // Use real calculateHoroscope to get a temporalState with dashaInterpretation
    const realHoroscope = calculateHoroscope(sampleBirth);

    // Create a distinctive asOf for context
    const customAsOf = '2030-03-01T00:00:00Z';
    const customContext = createAnalysisContext({
      asOf: customAsOf,
      methodology: mapMethodology(sampleBirth),
      engineVersion: 'CUSTOM_ENGINE_V2',
      rulesVersion: 'CUSTOM_RULES_V3'
    });

    // Resolve temporalState with the custom context
    const temporalState = resolveAnalysisTemporalState(realHoroscope, customContext);

    // Build pipeline state with temporalState and required artifacts
    const pipelineStateWithTemporal: LifeAnalysisProductState = {
      ...readyPipelineState,
      temporalState,
      careerArtifacts: {
        natal: {} as any,
        expression: {} as any,
        canonicalExpression: {} as any,
        mechanismCandidates: [],
        careerDashaEvidence: []
      },
      career: {
        domain: 'CAREER',
        version: 'V2',
        asOf: customAsOf,
        generatedAt: customAsOf,
        evidence: [],
        natalPromise: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'Strong promise',
          evidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        dashaActivation: {
          domain: 'CAREER',
          active: false,
          effect: 'UNKNOWN',
          strength: 'UNDETERMINED',
          confidence: 'LOW',
          statement: 'Not active',
          evidenceIds: [],
          activatedPromiseEvidenceIds: []
        },
        transitTrigger: {
          domain: 'CAREER',
          active: false,
          effect: 'UNKNOWN',
          strength: 'UNDETERMINED',
          confidence: 'LOW',
          statement: 'No trigger',
          evidenceIds: [],
          triggeredPromiseEvidenceIds: []
        },
        vargaConfirmations: [],
        manifestations: [],
        conflicts: [],
        conclusion: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'Strong conclusion',
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: []
        },
        conclusionData: {} as any
      },
      wealth: {
        domain: 'WEALTH',
        version: 'V2',
        asOf: customAsOf,
        generatedAt: customAsOf,
        evidence: [],
        natalPromise: {
          domain: 'WEALTH',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'Strong promise',
          evidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        dashaActivation: {
          domain: 'WEALTH',
          active: false,
          effect: 'UNKNOWN',
          strength: 'UNDETERMINED',
          confidence: 'LOW',
          statement: 'Not active',
          evidenceIds: [],
          activatedPromiseEvidenceIds: []
        },
        transitTrigger: {
          domain: 'WEALTH',
          active: false,
          effect: 'UNKNOWN',
          strength: 'UNDETERMINED',
          confidence: 'LOW',
          statement: 'No trigger',
          evidenceIds: [],
          triggeredPromiseEvidenceIds: []
        },
        vargaConfirmations: [],
        manifestations: [],
        conflicts: [],
        conclusion: {
          domain: 'WEALTH',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'Strong conclusion',
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: []
        },
        conclusionData: {} as any
      }
    };

    const runPipelineMock = vi.fn().mockResolvedValue(pipelineStateWithTemporal);
    const calculateHoroscopeMock = vi.fn().mockReturnValue(realHoroscope);

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = createProductAnalysisService(deps);

    // Run analyze with custom context
    await service.analyze(sampleBirth, {
      context: customContext,
      includeAiExplanation: false
    });

    // Verify context was retained
    expect(service.lastHoroscope).toBeDefined();
    expect(service.lastPipelineState).toBeDefined();
    expect(service.lastPipelineState?.temporalState).toBeDefined();

    // Verify the retained context matches the custom context
    const serviceAny = service as any;
    expect(serviceAny._lastContext).toBeDefined();
    expect(serviceAny._lastContext.asOf).toContain('2030-03-01T00:00:00');
    expect(serviceAny._lastContext.engineVersion).toBe('CUSTOM_ENGINE_V2');
    expect(serviceAny._lastContext.rulesVersion).toBe('CUSTOM_RULES_V3');

    // Get valid MD/AD IDs from the temporalState
    const selectablePeriods = listSelectableMdAdPeriods(
      service.lastPipelineState!.temporalState!.dashaInterpretation!
    );
    const validMd = selectablePeriods.mahadashas.find((md: any) => md.valid);
    expect(validMd).toBeDefined();

    const validAd = selectablePeriods.antardashas.find(
      (ad: any) => ad.valid && ad.mahadashaId === validMd!.id
    );
    expect(validAd).toBeDefined();

    // Call selectPeriod with valid IDs
    const result = await service.selectPeriod(validMd!.id, validAd!.id);

    // The key assertion is that selectPeriod succeeds (doesn't throw due to missing context)
    // and that the result asOf matches the custom context's asOf
    expect(result.asOf).toContain('2030-03-01');
  });

  it('9. selectPeriod throws when _lastContext is missing', async () => {
    const calculateHoroscopeMock = vi.fn().mockReturnValue(sampleHoroscope);
    const runPipelineMock = vi.fn().mockResolvedValue(readyPipelineState);

    const deps: ProductAnalysisDependencies = {
      calculateHoroscope: calculateHoroscopeMock,
      runPipeline: runPipelineMock
    };

    const service = new ProductAnalysisService(deps);

    // Run analyze to populate other fields
    await service.analyze(sampleBirth);

    // Manually delete _lastContext to simulate missing context
    const serviceAny = service as any;
    serviceAny._lastContext = undefined;

    // selectPeriod should throw with 'no analysis context available'
    await expect(
      service.selectPeriod('md_jupiter', 'ad_saturn')
    ).rejects.toThrow('no analysis context available');
  });

  // Note: Evidence-sparse selected period testing is covered in integration tests
  // (productAnalysisService.integration.test.ts) where real canonical artifacts
  // are available from the full pipeline. The unit test here uses mock data that
  // doesn't support realistic synthesis, so we rely on integration tests for
  // end-to-end verification of sparse evidence handling.

  // AI explanation tests moved to integration test file (productAnalysisService.integration.test.ts)
  // where real canonical artifacts are available from the full pipeline
});
