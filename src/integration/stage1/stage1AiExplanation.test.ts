import { describe, expect, it } from 'vitest';
import { runAiExplanation } from '../../ai/product/aiExplanationService';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from './stage1GoldenFixture';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { AiRouter } from '../../ai/routing/AiRouter';
import { AiProviderRegistry } from '../../ai/routing/AiProviderRegistry';
import type { AiProvider } from '../../ai/types/aiProviderTypes';
import type { AiRequest } from '../../ai/types/aiRequestTypes';
import type { AiResponse } from '../../ai/types/aiResponseTypes';

describe('Stage-1 AI Explanation Service Integration', () => {
  it('successfully generates AI explanation through local provider and routing pipeline', async () => {
    const explanation = await runAiExplanation({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      task: 'CHART_SYNTHESIS'
    });

    expect(explanation.kind).toBe('SUCCESS');
    if (explanation.kind === 'SUCCESS') {
      expect(explanation.requestId).toBeDefined();
      expect(explanation.requestId.length).toBeGreaterThan(0);
      expect(explanation.task).toBe('CHART_SYNTHESIS');
      expect(explanation.routingMode).toBe('LOCAL_ONLY');
      expect(explanation.fallbackUsed).toBe(false);
      expect(explanation.providerKind).toBe('LOCAL_RULES');
      expect(explanation.providerId).toBeDefined();
      expect(typeof explanation.providerId).toBe('string');
      expect(explanation.providerId.length).toBeGreaterThan(0);
      expect(['SUCCESS', 'PARTIAL']).toContain(explanation.status);
      expect(explanation.conclusion.length).toBeGreaterThan(0);

      // Supporting & challenging evidence lists are defined
      expect(explanation.supportingEvidence).toBeDefined();
      expect(Array.isArray(explanation.supportingEvidence)).toBe(true);
      expect(explanation.challengingEvidence).toBeDefined();
      expect(Array.isArray(explanation.challengingEvidence)).toBe(true);

      // Verify each resolved evidence item has a valid ID and matching role
      for (const item of explanation.supportingEvidence) {
        expect(item.evidence).toBeDefined();
        expect(item.evidence.id).toBeDefined();
        expect(item.evidence.id.length).toBeGreaterThan(0);
        expect(item.role).toBe('SUPPORTING');
      }

      for (const item of explanation.challengingEvidence) {
        expect(item.evidence).toBeDefined();
        expect(item.evidence.id).toBeDefined();
        expect(item.evidence.id.length).toBeGreaterThan(0);
        expect(item.role).toBe('CHALLENGING');
      }
    }
  });

  it('negative test (§26): drops fabricated/unrecognized evidence IDs without crashing', async () => {
    // Inject a mock router that simulates an AI model returning fake evidence IDs
    const mockRogueProvider: AiProvider = {
      identity: {
        id: 'mock-rogue-provider',
        name: 'Mock Rogue Provider',
        kind: 'LOCAL_RULES'
      },
      capabilities: ['STRUCTURED_OUTPUT', 'OFFLINE', 'CHART_SYNTHESIS'],
      getStatus: () => ({ availability: 'AVAILABLE' }),
      generate: async (request: AiRequest): Promise<AiResponse> => {
        return Object.freeze({
          requestId: request.requestId,
          format: 'STRUCTURED',
          content: 'Simulated explanation with fabricated evidence references.',
          structuredOutput: Object.freeze({
            status: 'SUCCESS',
            conclusion: 'Synthesized interpretation with hallucinated evidence IDs.',
            supportingEvidenceIds: Object.freeze(['FAKE-AI-EVIDENCE-ID-999', 'FABRICATED-RULE-ID-404']),
            challengingEvidenceIds: Object.freeze(['HALLUCINATED-CHALLENGE-ID-000']),
            unresolvedQuestions: Object.freeze([]),
            warnings: Object.freeze([])
          }),
          warnings: Object.freeze([])
        });
      }
    };

    const registry = new AiProviderRegistry();
    registry.register(mockRogueProvider);
    const mockRouter = new AiRouter(registry);

    const explanation = await runAiExplanation({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

    expect(explanation.kind).toBe('SUCCESS');
    if (explanation.kind === 'SUCCESS') {
      // Fabricated IDs must be filtered out by resolveEvidence and NOT propagated
      expect(explanation.supportingEvidence.length).toBe(0);
      expect(explanation.challengingEvidence.length).toBe(0);
      expect(
        explanation.supportingEvidence.some((e) =>
          e.evidence.id.includes('FAKE') || e.evidence.id.includes('FABRICATED')
        )
      ).toBe(false);
    }
  });

  it('resolves real domain evidence ID without dropping it (canonical evidence resolution)', async () => {
    const domainInterpretations = [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH];
    const lifeAnalysis = buildLifeAnalysis(domainInterpretations);

    // Pick a real domain evidence ID from the career domain interpretation
    const targetCareerEvidenceId = STAGE1_GOLDEN_CAREER.evidence[0].id;

    const mockAiProvider: AiProvider = {
      identity: {
        id: 'mock-canonical-provider',
        name: 'Mock Canonical Provider',
        kind: 'LOCAL_RULES'
      },
      capabilities: ['STRUCTURED_OUTPUT', 'OFFLINE', 'LIFE_ANALYSIS'],
      getStatus: () => ({ availability: 'AVAILABLE' }),
      generate: async (request: AiRequest): Promise<AiResponse> => {
        return Object.freeze({
          requestId: request.requestId,
          format: 'STRUCTURED',
          content: 'Simulated explanation referencing real domain evidence.',
          structuredOutput: Object.freeze({
            status: 'SUCCESS',
            conclusion: 'Synthesized domain explanation with valid evidence ID.',
            supportingEvidenceIds: Object.freeze([targetCareerEvidenceId]),
            challengingEvidenceIds: Object.freeze([]),
            unresolvedQuestions: Object.freeze([]),
            warnings: Object.freeze([])
          }),
          warnings: Object.freeze([])
        });
      }
    };

    const registry = new AiProviderRegistry();
    registry.register(mockAiProvider);
    const mockRouter = new AiRouter(registry);

    const result = await runAiExplanation({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      task: 'LIFE_ANALYSIS_EXPLANATION',
      domainInterpretations,
      lifeAnalysis,
      router: mockRouter
    });

    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.supportingEvidence.length).toBe(1);
      expect(result.supportingEvidence[0].evidence.id).toBe(targetCareerEvidenceId);
    }
  });

  it('guarantees deterministic LifeAnalysis state survives AI run untouched', async () => {
    const domainInterpretations = [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH];
    const lifeAnalysis = buildLifeAnalysis(domainInterpretations);

    // Capture state before AI run
    const beforeStatus = lifeAnalysis.conclusion.status;
    const beforeStatement = lifeAnalysis.conclusion.statement;
    const beforeStrongest = [...lifeAnalysis.strongestDomains];
    const beforeChallenged = [...lifeAnalysis.challengedDomains];
    const beforeEvidenceIds = [...lifeAnalysis.evidenceIds];
    const beforeConflicts = JSON.stringify(lifeAnalysis.conflicts);
    const beforeSharedTiming = JSON.stringify(lifeAnalysis.sharedTiming);

    const result = await runAiExplanation({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      task: 'LIFE_ANALYSIS_EXPLANATION',
      domainInterpretations,
      lifeAnalysis
    });

    expect(result.kind).toBe('SUCCESS');

    // Assert lifeAnalysis is completely untouched
    expect(lifeAnalysis.conclusion.status).toBe(beforeStatus);
    expect(lifeAnalysis.conclusion.statement).toBe(beforeStatement);
    expect(lifeAnalysis.strongestDomains).toEqual(beforeStrongest);
    expect(lifeAnalysis.challengedDomains).toEqual(beforeChallenged);
    expect(lifeAnalysis.evidenceIds).toEqual(beforeEvidenceIds);
    expect(JSON.stringify(lifeAnalysis.conflicts)).toBe(beforeConflicts);
    expect(JSON.stringify(lifeAnalysis.sharedTiming)).toBe(beforeSharedTiming);
  });

  it('executes real local reasoning engine for LIFE_ANALYSIS_EXPLANATION without mock provider', async () => {
    const domainInterpretations = [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH];
    const lifeAnalysis = buildLifeAnalysis(domainInterpretations);

    const result = await runAiExplanation({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      task: 'LIFE_ANALYSIS_EXPLANATION',
      domainInterpretations,
      lifeAnalysis
    });

    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.task).toBe('LIFE_ANALYSIS_EXPLANATION');
      expect(result.providerKind).toBe('LOCAL_RULES');
      expect(result.fallbackUsed).toBe(false);
      expect(result.routingMode).toBe('LOCAL_ONLY');

      // The new LIFE_ANALYSIS rules produced grounded evidence, not an empty list
      expect(result.supportingEvidence.length).toBeGreaterThan(0);

      // Rebuild the same context to get the canonical evidence universe
      const canonicalContext = buildAiContext(STAGE1_GOLDEN_HOROSCOPE, {
        domainInterpretations,
        lifeAnalysis
      });
      const canonicalEvidenceMap = new Map(canonicalContext.evidence.map((e) => [e.id, e]));

      for (const item of result.supportingEvidence) {
        expect(item.evidence).toBeDefined();
        expect(item.evidence.id).toBeDefined();
        expect(canonicalEvidenceMap.has(item.evidence.id)).toBe(true);
        expect(item.role).toBe('SUPPORTING');
      }

      for (const item of result.challengingEvidence) {
        expect(item.evidence).toBeDefined();
        expect(item.evidence.id).toBeDefined();
        expect(canonicalEvidenceMap.has(item.evidence.id)).toBe(true);
        expect(item.role).toBe('CHALLENGING');
      }
    }
  });
});
