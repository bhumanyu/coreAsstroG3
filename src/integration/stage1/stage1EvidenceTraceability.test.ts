import { describe, expect, it, vi } from 'vitest';
import { runLifeAnalysisProduct } from '../../product/life-analysis/lifeAnalysisProductService';
import { resolveLifeAnalysisEvidence } from '../../product/life-analysis/lifeAnalysisEvidence';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import * as aiExplanationModule from '../../ai/product/aiExplanationService';
import { STAGE1_GOLDEN_HOROSCOPE } from './stage1GoldenFixture';
import type { LifeAnalysis } from '../../domain/synthesis';

describe('Stage 1 - Life Analysis Evidence Traceability & AI Consistency', () => {
  it('validates core traceability contracts for every career evidence item', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const careerEvidence = result.analysis?.careerWhy?.evidence ?? [];
    expect(careerEvidence.length).toBeGreaterThan(0);

    for (const item of careerEvidence) {
      expect(item.id).toBeTruthy();
      expect(item.domain).toBe('CAREER');
      expect(item.traceability.evidenceId).toBe(item.id);
      expect(item.traceability.valid).toBe(true);
      expect(item.source).toBeDefined();
      expect(item.statement).toBeTruthy();
    }
  });

  it('validates rule traceability for evidence items with rules', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const careerEvidence = result.analysis?.careerWhy?.evidence ?? [];
    const itemsWithRule = careerEvidence.filter((item) => item.rule !== undefined);

    expect(itemsWithRule.length).toBeGreaterThan(0);

    for (const item of itemsWithRule) {
      expect(item.rule?.id).toBeTruthy();
      expect(item.rule?.name).toBeTruthy();
      expect(item.traceability.ruleId).toBe(item.rule?.id);
    }
  });

  it('validates chart-fact traceability for evidence items with chart facts', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const careerEvidence = result.analysis?.careerWhy?.evidence ?? [];
    const itemsWithChartFact = careerEvidence.filter((item) => item.chartFact !== undefined);

    expect(itemsWithChartFact.length).toBeGreaterThan(0);

    for (const item of itemsWithChartFact) {
      expect(item.chartFact?.label).toBeTruthy();
      expect(item.chartFact?.value).toBeTruthy();
    }
  });

  it('validates related-evidence integrity within careerWhy evidence set', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const careerEvidence = result.analysis?.careerWhy?.evidence ?? [];
    const allEvidenceIds = new Set(careerEvidence.map((e) => e.id));

    for (const item of careerEvidence) {
      for (const relatedId of item.relatedEvidenceIds) {
        expect(allEvidenceIds.has(relatedId)).toBe(true);
      }
    }
  });

  it('validates unknown-ID regression in resolveLifeAnalysisEvidence by safely omitting unknown IDs', () => {
    const mockAnalysis: LifeAnalysis = {
      conclusion: {
        status: 'STRONGLY_SUPPORTED',
        statement: 'Career promise strongly supported',
        summaryPoints: []
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
          supportingEvidenceIds: ['KNOWN-EVIDENCE'],
          challengingEvidenceIds: []
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
      evidenceIds: ['KNOWN-EVIDENCE', 'UNKNOWN-EVIDENCE']
    };

    const contextEvidence = [
      {
        id: 'KNOWN-EVIDENCE',
        statement: 'Sun in 10th house possesses directional strength.',
        source: 'PLANET' as const,
        effect: 'SUPPORT' as const,
        strength: 'STRONG' as const
      }
    ];

    const resolved = resolveLifeAnalysisEvidence(mockAnalysis, contextEvidence);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe('KNOWN-EVIDENCE');
    expect(resolved.map((r) => r.id)).toEqual(['KNOWN-EVIDENCE']);
  });

  it('validates same-evidence-universe between deterministic LifeAnalysis why evidence and AiContext', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const aiContext = buildAiContext(STAGE1_GOLDEN_HOROSCOPE);
    const contextEvidenceIds = new Set(aiContext.evidence.map((e) => e.id));

    const productEvidenceIds = result.analysis?.why?.evidence.map((e) => e.id) ?? [];
    expect(productEvidenceIds.length).toBeGreaterThan(0);

    for (const id of productEvidenceIds) {
      expect(contextEvidenceIds.has(id)).toBe(true);
    }
  });

  it('validates precomputed-analysis passthrough to runAiExplanation without re-computation', async () => {
    const aiExplanationSpy = vi.spyOn(aiExplanationModule, 'runAiExplanation');

    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: true
    });

    expect(aiExplanationSpy).toHaveBeenCalledTimes(1);
    const passedOptions = aiExplanationSpy.mock.calls[0][0];

    expect(passedOptions.domainInterpretations).toBeDefined();
    expect(passedOptions.domainInterpretations?.length).toBe(2);
    expect(passedOptions.lifeAnalysis).toBeDefined();

    expect(result.status).toBe('READY');
    expect(result.aiExplanation).toBeDefined();

    aiExplanationSpy.mockRestore();
  });
});
