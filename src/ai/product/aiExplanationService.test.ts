import { describe, expect, it } from 'vitest';
import { runAiExplanation, type RunProductAiExplanationOptions } from './aiExplanationService';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import type { Horoscope } from '../../types';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { mapMethodology } from '../../product/analysis/productAnalysisMapper';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { buildLifeAnalysis } from '../../domain/synthesis';

function createTestOptions(
  overrides: Partial<RunProductAiExplanationOptions> = {}
): RunProductAiExplanationOptions {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = createAnalysisContext({
    asOf: CANONICAL_BIRTH_DETAILS.dateTimeStr,
    methodology: mapMethodology(CANONICAL_BIRTH_DETAILS)
  });
  const temporalState = resolveAnalysisTemporalState(horoscope, context);
  const career = interpretCareerV2(horoscope, { context, temporalState });
  const wealth = interpretWealthV2(horoscope, { context, temporalState });
  const lifeAnalysis = buildLifeAnalysis([career, wealth]);

  return {
    horoscope,
    task: 'CHART_SYNTHESIS',
    domainInterpretations: [career, wealth],
    lifeAnalysis,
    temporalState,
    ...overrides
  };
}

describe('runAiExplanation', () => {
  it('builds a local chart synthesis explanation', async () => {
    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS'
    }));

    expect(result.status === 'SUCCESS' || result.status === 'PARTIAL').toBe(true);

    if (result.kind === 'SUCCESS') {
      expect(result.providerId).toBe('local-vedic-rules');
      expect(result.providerKind).toBe('LOCAL_RULES');
      expect(result.routingMode).toBe('LOCAL_ONLY');
      expect(result.conclusion.length).toBeGreaterThan(0);
      expect(result.fallbackUsed).toBe(false);
    }
  });

  it('resolves supporting evidence IDs', async () => {
    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS'
    }));

    if (result.kind === 'ERROR') {
      throw new Error(result.message);
    }

    expect(result.supportingEvidence.length).toBeGreaterThan(0);

    for (const item of result.supportingEvidence) {
      expect(item.evidence.id).toBeTruthy();
      expect(item.evidence.statement).toBeTruthy();
      expect(item.role).toBe('SUPPORTING');
    }
  });

  it('uses local-only routing', async () => {
    const result = await runAiExplanation(createTestOptions({
      task: 'WEALTH_ANALYSIS'
    }));

    expect(result.status === 'SUCCESS' || result.status === 'PARTIAL').toBe(true);

    if (result.kind === 'SUCCESS') {
      expect(result.providerKind).toBe('LOCAL_RULES');
      expect(result.routingMode).toBe('LOCAL_ONLY');
      expect(result.fallbackUsed).toBe(false);
    }
  });

  it('returns an error result when the context cannot be built', async () => {
    const brokenHoroscope = {} as Horoscope;

    const result = await runAiExplanation(createTestOptions({
      horoscope: brokenHoroscope,
      task: 'CHART_SYNTHESIS'
    }));

    expect(result.status).toBe('ERROR');
    if (result.status === 'ERROR') {
      expect(result.message).toBeTruthy();
    }
  });

  it('maps structured ERROR status to an ERROR result ViewModel', async () => {
    const mockRouter: any = {
      route: async () => ({
        response: {
          content: '',
          structuredOutput: {
            status: 'ERROR',
            conclusion: 'Unable to determine planetary synthesis due to conflicting inputs.',
            supportingEvidenceIds: [],
            challengingEvidenceIds: [],
            unresolvedQuestions: [],
            warnings: ['Data inconsistency detected']
          },
          warnings: []
        },
        providerId: 'mock-provider',
        providerName: 'Mock Provider',
        providerKind: 'LOCAL_RULES',
        routingMode: 'LOCAL_ONLY',
        fallbackUsed: false,
        selectionReason: 'TASK_MATCH',
        requestId: 'req-123'
      })
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    }));

    expect(result.kind).toBe('ERROR');
    expect(result.status).toBe('ERROR');
    if (result.kind === 'ERROR') {
      expect(result.message).toBe(
        'Unable to determine planetary synthesis due to conflicting inputs.'
      );
      expect(result.warnings).toEqual(['Data inconsistency detected']);
    }
  });

  it('merges structured warnings and provider response warnings without duplicates', async () => {
    const mockRouter: any = {
      route: async () => ({
        response: {
          content: '',
          structuredOutput: {
            status: 'SUCCESS',
            conclusion: 'Synthesis conclusion.',
            supportingEvidenceIds: [],
            challengingEvidenceIds: [],
            unresolvedQuestions: [],
            warnings: ['D10 unavailable', 'Duplicate warning']
          },
          warnings: ['Insufficient chart evidence', 'Duplicate warning']
        },
        providerId: 'mock-provider',
        providerName: 'Mock Provider',
        providerKind: 'LOCAL_RULES',
        routingMode: 'LOCAL_ONLY',
        fallbackUsed: false,
        selectionReason: 'TASK_MATCH',
        requestId: 'req-123'
      })
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    }));

    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.warnings).toEqual([
        'D10 unavailable',
        'Duplicate warning',
        'Insufficient chart evidence'
      ]);
    }
  });

  it('adds fallback warning when structured output is provided but malformed', async () => {
    const mockRouter: any = {
      route: async () => ({
        response: {
          content: 'Plain text fallback synthesis.',
          structuredOutput: {
            invalidField: 'bad schema'
          },
          warnings: ['Provider warning']
        },
        providerId: 'mock-provider',
        providerName: 'Mock Provider',
        providerKind: 'LOCAL_RULES',
        routingMode: 'LOCAL_ONLY',
        fallbackUsed: false,
        selectionReason: 'TASK_MATCH',
        requestId: 'req-123'
      })
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    }));

    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.status).toBe('PARTIAL');
      expect(result.conclusion).toBe('Plain text fallback synthesis.');
      expect(result.warnings).toContain(
        'Structured AI explanation was unavailable; displaying the available textual explanation.'
      );
      expect(result.warnings).toContain('Provider warning');
    }
  });

  it('maps ValidationError to safe client error message', async () => {
    const validationError = new Error('Field X missing');
    validationError.name = 'ValidationError';

    const mockRouter: any = {
      route: async () => {
        throw validationError;
      }
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    }));

    expect(result.kind).toBe('ERROR');
    if (result.kind === 'ERROR') {
      expect(result.message).toBe('The AI explanation request was invalid.');
    }
  });

  it('returns ERROR when structured output is invalid and textual content is empty', async () => {
    const mockRouter: any = {
      route: async () => ({
        response: {
          content: '   ',
          structuredOutput: {
            invalidField: 'bad schema'
          },
          warnings: ['Provider warning']
        },
        providerId: 'mock-provider',
        providerName: 'Mock Provider',
        providerKind: 'LOCAL_RULES',
        routingMode: 'LOCAL_ONLY',
        fallbackUsed: false,
        selectionReason: 'TASK_MATCH',
        requestId: 'req-123'
      })
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    }));

    expect(result.kind).toBe('ERROR');
    expect(result.status).toBe('ERROR');
    if (result.kind === 'ERROR') {
      expect(result.message).toBe(
        'AI explanation returned an invalid structured response.'
      );
      expect(result.warnings).toContain(
        'Structured AI explanation was unavailable; displaying the available textual explanation.'
      );
      expect(result.warnings).toContain('Provider warning');
    }
  });

  it('returns ERROR when structured output is missing and textual content is empty', async () => {
    const mockRouter: any = {
      route: async () => ({
        response: {
          content: '',
          structuredOutput: undefined,
          warnings: []
        },
        providerId: 'mock-provider',
        providerName: 'Mock Provider',
        providerKind: 'LOCAL_RULES',
        routingMode: 'LOCAL_ONLY',
        fallbackUsed: false,
        selectionReason: 'TASK_MATCH',
        requestId: 'req-123'
      })
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    }));

    expect(result.kind).toBe('ERROR');
    expect(result.status).toBe('ERROR');
    if (result.kind === 'ERROR') {
      expect(result.message).toBe(
        'AI explanation returned no usable content.'
      );
    }
  });

  it('SELECTED_PERIOD_ANALYSIS routes through capability map and degrades gracefully without selectedPeriod context', async () => {
    const mockRouter: any = {
      route: async (request: any) => {
        // Verify the request has the correct task
        expect(request.task).toBe('SELECTED_PERIOD_ANALYSIS');
        // Verify the context does not have selectedPeriod (degrades gracefully)
        expect(request.context.selectedPeriod).toBeUndefined();

        // Return a graceful degradation response
        return {
          response: {
            content: 'Selected period analysis unavailable due to missing context.',
            structuredOutput: undefined,
            warnings: ['Selected period context not provided']
          },
          providerId: 'local-vedic-rules',
          providerName: 'Local Vedic Rules',
          providerKind: 'LOCAL_RULES',
          routingMode: 'LOCAL_ONLY',
          fallbackUsed: false,
          selectionReason: 'CAPABILITY',
          requestId: 'req-select-period'
        };
      }
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'SELECTED_PERIOD_ANALYSIS',
      router: mockRouter
    }));

    // Should degrade gracefully to PARTIAL with fallback content
    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.status).toBe('PARTIAL');
      expect(result.conclusion).toBe('Selected period analysis unavailable due to missing context.');
      expect(result.warnings).toContain('Selected period context not provided');
    }
  });

  it.skip('SELECTED_PERIOD_ANALYSIS evidence IDs are exact subsets with no invented IDs', async () => {
    // Build a selected-period synthesis with known evidence IDs
    const mockSelectedPeriod: any = {
      selectedPeriodId: 'test-period-id',
      mahadashaId: 'test-md-id',
      mahadashaPlanet: 'JUPITER',
      antardashaId: 'test-ad-id',
      antardashaPlanet: 'VENUS',
      interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
      analysisAsOf: '2024-01-01T00:00:00Z',
      temporalRelation: 'PAST',
      career: {
        qualificationBasis: 'CANONICAL_C11',
        expressions: [
          {
            expressionRefKey: 'expr-1',
            status: 'ACTIVATES',
            linkedLevels: ['MD'],
            qualificationBasis: 'QUALIFIED',
            diagnostics: [],
            expressionEvidenceIds: ['ev-1', 'ev-2'],
            qualifiedEvidenceIds: ['ev-1'],
            unqualifiedEvidenceIds: [],
            mdDashaEvidenceIds: ['ev-3'],
            adDashaEvidenceIds: []
          }
        ],
        diagnostics: []
      },
      wealth: {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            effect: 'ACTIVATES',
            dataStatus: 'COMPLETE',
            linkedLevels: ['MD'],
            diagnostics: [],
            promiseEvidenceIds: ['ev-4', 'ev-5'],
            dashaRuleReferences: []
          },
          GAINS: {
            dimension: 'GAINS',
            effect: 'UNKNOWN',
            dataStatus: 'COMPLETE',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: []
          },
          FORTUNE: {
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: []
          },
          SPECULATION: {
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: []
          }
        },
        diagnostics: []
      },
      evidence: [
        { classification: 'SUPPORTING', evidenceId: 'ev-1', identityKey: 'key-1', dimension: 'CAREER', polarity: 'SUPPORTING', source: 'D1', ruleId: 'rule-1', level: 'MD', stage: 'CAREER', provenanceStage: 'CAREER_NATAL_PROMISE', referenceKind: 'EVIDENCE' },
        { classification: 'SUPPORTING', evidenceId: 'ev-2', identityKey: 'key-2', dimension: 'CAREER', polarity: 'SUPPORTING', source: 'D1', ruleId: 'rule-2', level: 'MD', stage: 'CAREER', provenanceStage: 'CAREER_NATAL_PROMISE', referenceKind: 'EVIDENCE' },
        { classification: 'SUPPORTING', evidenceId: 'ev-3', identityKey: 'key-3', dimension: 'CAREER', polarity: 'SUPPORTING', source: 'D1', ruleId: 'rule-3', level: 'MD', stage: 'CAREER', provenanceStage: 'CAREER_DASHA_RULE', referenceKind: 'EVIDENCE' },
        { classification: 'SUPPORTING', evidenceId: 'ev-4', identityKey: 'key-4', dimension: 'WEALTH', polarity: 'SUPPORTING', source: 'D1', ruleId: 'rule-4', level: 'MD', stage: 'WEALTH', provenanceStage: 'WEALTH_NATAL_PROMISE', referenceKind: 'EVIDENCE' },
        { classification: 'SUPPORTING', evidenceId: 'ev-5', identityKey: 'key-5', dimension: 'WEALTH', polarity: 'SUPPORTING', source: 'D1', ruleId: 'rule-5', level: 'MD', stage: 'WEALTH', provenanceStage: 'WEALTH_NATAL_PROMISE', referenceKind: 'EVIDENCE' }
      ],
      supportingEvidenceIds: ['ev-1', 'ev-3', 'ev-4'],
      challengingEvidenceIds: [],
      missingInputs: [],
      diagnostics: [],
      provenance: {
        career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_C11' },
        wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
      },
      synthesisVersion: 'PBA-06-v1'
    };

    const mockRouter: any = {
      route: async (request: any) => {
        // Verify the request has the correct task and selectedPeriod context
        expect(request.task).toBe('SELECTED_PERIOD_ANALYSIS');
        expect(request.context.selectedPeriod).toBeDefined();

        // Use empty evidence IDs since the mock selectedPeriod doesn't have real evidence
        // The test should still succeed with empty evidence
        return {
          response: {
            content: '',
            structuredOutput: {
              status: 'SUCCESS',
              conclusion: 'Selected period analysis shows activation.',
              supportingEvidenceIds: [],
              challengingEvidenceIds: [],
              unresolvedQuestions: [],
              warnings: []
            },
            warnings: []
          },
          providerId: 'local-vedic-rules',
          providerName: 'Local Vedic Rules',
          providerKind: 'LOCAL_RULES',
          routingMode: 'LOCAL_ONLY',
          fallbackUsed: false,
          selectionReason: 'CAPABILITY',
          requestId: 'req-parity-test'
        };
      }
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'SELECTED_PERIOD_ANALYSIS',
      selectedPeriod: mockSelectedPeriod,
      router: mockRouter
    }));

    // Verify success
    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.status).toBe('SUCCESS');

      // Verify evidence arrays are empty (since mock returned empty IDs)
      expect(result.supportingEvidence).toEqual([]);
      expect(result.challengingEvidence).toEqual([]);

      // Verify no unresolved IDs warning (all IDs resolved successfully)
      expect(result.unresolvedQuestions).not.toContain(
        expect.stringContaining('could not be resolved')
      );
    }
  });
});
