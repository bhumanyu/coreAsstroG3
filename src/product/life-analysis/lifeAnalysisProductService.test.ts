import { describe, it, expect, vi } from 'vitest';
import { runLifeAnalysisProduct } from './lifeAnalysisProductService';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { resolveLifeAnalysisEvidence } from './lifeAnalysisEvidence';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from '../../integration/stage1/stage1GoldenFixture';
import * as careerModule from '../../domain/career/CareerDomainInterpreterV2';
import * as wealthModule from '../../domain/wealth/WealthDomainInterpreterV2';
import * as synthesisModule from '../../domain/synthesis';
import * as aiExplanationModule from '../../ai/product/aiExplanationService';
import * as registryModule from '../../domain/interpretation/createDefaultDomainInterpreterRegistry';
import type { LifeAnalysis, SharedTimingActivation } from '../../domain/synthesis';
import type { AiRouter } from '../../ai/routing/AiRouter';
import type { AiRequest } from '../../ai/types/aiRequestTypes';

describe('P-029 LifeAnalysisProductService & AI Integration Contract', () => {
  it('Test 1: guarantees no duplicate calculation across Career, Wealth, and LifeAnalysis in the full P-029 path', async () => {
    const careerSpy = vi.spyOn(careerModule, 'interpretCareerV2');
    const wealthSpy = vi.spyOn(wealthModule, 'interpretWealthV2');
    const synthesisSpy = vi.spyOn(synthesisModule, 'buildLifeAnalysis');
    const aiExplanationSpy = vi.spyOn(aiExplanationModule, 'runAiExplanation');

    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: true
    });

    // Assert each calculation is executed exactly once
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);
    expect(synthesisSpy).toHaveBeenCalledTimes(1);
    expect(aiExplanationSpy).toHaveBeenCalledTimes(1);

    // Assert AI explanation received the exact pre-computed domain interpretations and life analysis
    const careerResult = careerSpy.mock.results[0].value;
    const wealthResult = wealthSpy.mock.results[0].value;
    const analysisResult = synthesisSpy.mock.results[0].value;

    expect(aiExplanationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        horoscope: STAGE1_GOLDEN_HOROSCOPE,
        domainInterpretations: [careerResult, wealthResult],
        lifeAnalysis: analysisResult
      })
    );

    expect(result.status).toBe('READY');
    expect(result.analysis).toBeDefined();
    expect(result.aiExplanation).toBeDefined();

    careerSpy.mockRestore();
    wealthSpy.mockRestore();
    synthesisSpy.mockRestore();
    aiExplanationSpy.mockRestore();
  });

  it('Test 2: respects supplied AI context options without invoking interpreter registry', () => {
    const registrySpy = vi.spyOn(
      registryModule,
      'createDefaultDomainInterpreterRegistry'
    );

    const sampleAnalysis = synthesisModule.buildLifeAnalysis([
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH
    ]);

    const context = buildAiContext(STAGE1_GOLDEN_HOROSCOPE, {
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH],
      lifeAnalysis: sampleAnalysis
    });

    // The interpreter registry should NOT be instantiated when pre-computed interpretations are supplied
    expect(registrySpy).not.toHaveBeenCalled();
    expect(context.domainInterpretations).toBeDefined();
    expect(context.domainInterpretations?.length).toBe(2);

    registrySpy.mockRestore();
  });

  it('Test 3: resolves conflicting evidence role as CONFLICTING when ID appears in both supporting and challenging sets', () => {
    const mockAnalysis: LifeAnalysis = {
      conclusion: {
        status: 'MIXED',
        statement: 'Mixed outlook',
        summaryPoints: ['Point 1', 'Point 2']
      },
      strongestDomains: ['CAREER'],
      challengedDomains: ['WEALTH'],
      domains: [
        {
          domain: 'CAREER',
          status: 'STRONGLY_SUPPORTED',
          strength: 'STRONG',
          confidence: 'HIGH',
          primaryConclusion: 'Career supported',
          supportingEvidenceIds: ['EVIDENCE-CONFLICT-1'],
          challengingEvidenceIds: []
        },
        {
          domain: 'WEALTH',
          status: 'MIXED',
          strength: 'MODERATE',
          confidence: 'HIGH',
          primaryConclusion: 'Wealth mixed',
          supportingEvidenceIds: [],
          challengingEvidenceIds: ['EVIDENCE-CONFLICT-1']
        }
      ],
      sharedTiming: [],
      conflicts: [],
      dataCompleteness: {
        career: 'AVAILABLE',
        wealth: 'AVAILABLE',
        timing: 'AVAILABLE',
        overall: 'COMPLETE'
      },
      confidence: 'HIGH',
      evidenceIds: ['EVIDENCE-CONFLICT-1']
    };

    const mockAiEvidence = [
      {
        id: 'EVIDENCE-CONFLICT-1',
        statement: 'Dual-effect planet placement in 10th and 12th houses.',
        source: 'PLANET' as const,
        effect: 'SUPPORT' as const,
        strength: 'STRONG' as const
      }
    ];

    const resolved = resolveLifeAnalysisEvidence(mockAnalysis, mockAiEvidence);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe('EVIDENCE-CONFLICT-1');
    expect(resolved[0].role).toBe('CONFLICTING');
    expect(resolved[0].statement).toBe(
      'Dual-effect planet placement in 10th and 12th houses.'
    );
  });

  it('Test 4: strictly propagates explicit isConflict flag in SharedTimingActivation to LifeAnalysisTimingViewModel', () => {
    const mockTimingConflict: SharedTimingActivation = {
      source: 'DASHA',
      timingType: 'DASHA',
      active: true,
      participatingDomains: ['CAREER', 'WEALTH'],
      effects: {
        CAREER: 'ACTIVATES',
        WEALTH: 'CHALLENGES'
      },
      statement: 'Dasha lord activates career while challenging wealth accumulation.',
      evidenceIds: ['EV-1'],
      isConflict: true,
      periodKey: 'MARS-JUPITER'
    };

    const mockTimingHarmonious: SharedTimingActivation = {
      source: 'TRANSIT',
      timingType: 'TRANSIT',
      active: true,
      participatingDomains: ['CAREER', 'WEALTH'],
      effects: {
        CAREER: 'TRIGGER',
        WEALTH: 'TRIGGER'
      },
      statement: 'Jupiter transit triggers growth across both career and wealth.',
      evidenceIds: ['EV-2'],
      isConflict: false,
      periodKey: 'JUPITER-10'
    };

    const mockAnalysis: LifeAnalysis = {
      conclusion: {
        status: 'MIXED',
        statement: 'Mixed synthesis',
        summaryPoints: ['Summary 1']
      },
      strongestDomains: ['CAREER'],
      challengedDomains: [],
      domains: [
        {
          domain: 'CAREER',
          status: 'STRONGLY_SUPPORTED',
          strength: 'STRONG',
          confidence: 'HIGH',
          primaryConclusion: 'Career strong',
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        {
          domain: 'WEALTH',
          status: 'STRONGLY_SUPPORTED',
          strength: 'STRONG',
          confidence: 'HIGH',
          primaryConclusion: 'Wealth strong',
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        }
      ],
      sharedTiming: [mockTimingConflict, mockTimingHarmonious],
      conflicts: [],
      dataCompleteness: {
        career: 'AVAILABLE',
        wealth: 'AVAILABLE',
        timing: 'AVAILABLE',
        overall: 'COMPLETE'
      },
      confidence: 'HIGH',
      evidenceIds: []
    };

    const viewModel = buildLifeAnalysisViewModel(
      mockAnalysis,
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH,
      []
    );

    expect(viewModel.sharedTiming).toHaveLength(2);
    expect(viewModel.sharedTiming[0].isConflict).toBe(true);
    expect(viewModel.sharedTiming[1].isConflict).toBe(false);
  });

  it('Test 5: handles AI explanation failure gracefully without failing deterministic product state into top-level ERROR', async () => {
    // Construct a failing AI router that throws during route execution
    const failingRouter: AiRouter = {
      route: async (_request: AiRequest) => {
        throw new Error('Remote AI provider connection timeout or network outage');
      }
    } as unknown as AiRouter;

    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      router: failingRouter,
      includeAiExplanation: true
    });

    // The product status remains READY / PARTIAL (deterministic computation succeeded)
    expect(result.status).toBe('READY');
    expect(result.analysis).toBeDefined();
    expect(result.analysis?.overall.statement.length).toBeGreaterThan(0);

    // The AI explanation captures the ERROR kind isolatedly
    expect(result.aiExplanation).toBeDefined();
    expect(result.aiExplanation?.kind).toBe('ERROR');
    expect(result.aiExplanation?.status).toBe('ERROR');
    if (result.aiExplanation?.kind === 'ERROR') {
      expect(result.aiExplanation.message).toBeDefined();
    }
  });
});
