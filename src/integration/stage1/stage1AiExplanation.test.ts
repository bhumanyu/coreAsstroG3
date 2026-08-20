import { describe, expect, it } from 'vitest';
import { runAiExplanation } from '../../ai/product/aiExplanationService';
import { STAGE1_GOLDEN_HOROSCOPE } from './stage1GoldenFixture';
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
      expect(explanation.providerKind).toBe('LOCAL_RULES');
      expect(explanation.providerId).toBe('local-vedic-rules');
      expect(explanation.fallbackUsed).toBe(false);
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
});
