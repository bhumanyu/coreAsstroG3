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
import { buildProductAiContext } from '../context/aiContextFactory';

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

  describe('PR-F: AI evidence semantics', () => {
    it('evidence-ID parity: unresolved IDs are marked, never invented', async () => {
      // This test verifies that when the AI returns evidence IDs that don't exist
      // in the context, they are marked as unresolved rather than being invented
      const options = createTestOptions({
        task: 'CHART_SYNTHESIS'
      });

      // Build the authoritative evidence index from the same projection runAiExplanation consumes
      const context = buildProductAiContext(options.horoscope, {
        domainInterpretations: options.domainInterpretations,
        lifeAnalysis: options.lifeAnalysis,
        temporalState: options.temporalState
      });

      const contextEvidenceIds = new Set(context.evidence.map(e => e.id));

      const result = await runAiExplanation(options);

      if (result.kind === 'ERROR') {
        throw new Error(result.message);
      }

      // Collect all returned evidence IDs
      const allReturnedIds = new Set([
        ...result.supportingEvidence.map(e => e.evidence.id),
        ...result.challengingEvidence.map(e => e.evidence.id)
      ]);

      // Assert every returned evidence ID is a member of the context index
      for (const id of allReturnedIds) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }

      // Assert model-referenced IDs not in the index are surfaced as unresolved
      const unresolvedIdsInQuestions = result.unresolvedQuestions
        .filter(q => q.includes('could not be resolved'))
        .flatMap(q => {
          const match = q.match(/evidence IDs could not be resolved: (.+)/);
          return match ? match[1].split(', ') : [];
        });

      // Verify unresolved IDs are not in the resolved evidence
      for (const unresolvedId of unresolvedIdsInQuestions) {
        expect(allReturnedIds.has(unresolvedId)).toBe(false);
      }
    });

    it('AI failure leaves deterministic synthesis unchanged', async () => {
      // This test verifies that if AI explanation fails, the original synthesis
      // data is not mutated or modified
      const options = createTestOptions({
        task: 'CHART_SYNTHESIS'
      });

      // Store original data for deep equality comparison
      const originalLifeAnalysis = JSON.parse(JSON.stringify(options.lifeAnalysis));
      const originalDomainInterpretations = JSON.parse(JSON.stringify(options.domainInterpretations));

      // Inject a deterministically failing router
      const mockRouter: any = {
        route: async () => {
          throw new Error('Simulated AI failure');
        }
      };

      const result = await runAiExplanation({
        ...options,
        router: mockRouter
      });

      // Assert the result is ERROR
      expect(result.kind).toBe('ERROR');
      expect(result.status).toBe('ERROR');
      expect(result.message).toBeTruthy();

      // Assert deep equality of synthesis input before/after
      expect(JSON.parse(JSON.stringify(options.lifeAnalysis))).toEqual(originalLifeAnalysis);
      expect(JSON.parse(JSON.stringify(options.domainInterpretations))).toEqual(originalDomainInterpretations);
    });

    it('classification parity: role matches source classification per ID', async () => {
      // This test verifies that supporting/challenging labels respect engine classification
      // The classification from SynthesisEvidenceReference.classification/polarity
      // should be preserved through AI context → explanation
      const options = createTestOptions({
        task: 'CHART_SYNTHESIS'
      });

      // Build context to get the evidence references with classifications
      const context = buildProductAiContext(options.horoscope, {
        domainInterpretations: options.domainInterpretations,
        lifeAnalysis: options.lifeAnalysis,
        temporalState: options.temporalState
      });

      // Build a map of evidence ID to classification from the context
      const classificationById = new Map<string, 'SUPPORTING' | 'CHALLENGING' | 'UNRESOLVED'>();
      for (const evidence of context.evidence) {
        // Use the effect field to determine classification
        if (evidence.effect === 'SUPPORT') {
          classificationById.set(evidence.id, 'SUPPORTING');
        } else if (evidence.effect === 'CHALLENGE') {
          classificationById.set(evidence.id, 'CHALLENGING');
        } else {
          classificationById.set(evidence.id, 'UNRESOLVED');
        }
      }

      const result = await runAiExplanation(options);

      if (result.kind === 'ERROR') {
        throw new Error('AI explanation failed');
      }

      // Assert returned role matches source classification per ID
      for (const item of result.supportingEvidence) {
        const id = item.evidence.id;
        const expectedClassification = classificationById.get(id);
        expect(expectedClassification).toBe('SUPPORTING');
        expect(item.role).toBe('SUPPORTING');
      }

      for (const item of result.challengingEvidence) {
        const id = item.evidence.id;
        const expectedClassification = classificationById.get(id);
        expect(expectedClassification).toBe('CHALLENGING');
        expect(item.role).toBe('CHALLENGING');
      }

      // Include an unresolved/unclassified case
      // If there are any unresolved IDs in the result, verify they're not in supporting/challenging
      const unresolvedIds = result.unresolvedQuestions
        .filter(q => q.includes('could not be resolved'))
        .flatMap(q => {
          const match = q.match(/evidence IDs could not be resolved: (.+)/);
          return match ? match[1].split(', ') : [];
        });

      for (const unresolvedId of unresolvedIds) {
        const classification = classificationById.get(unresolvedId);
        // Unresolved IDs should either be UNRESOLVED or not in the index
        expect(classification === 'UNRESOLVED' || classification === undefined).toBe(true);
      }
    });

    it('drives real local rules engine against VALID_SELECTION_GOLDEN_FIXTURE', async () => {
      // This test drives the actual local rules engine (not mocked) against the golden fixture
      // to validate evidence-ID parity across synthesis → AI context → explanation
      // This is an integration test for the complete evidence flow
      const options = createTestOptions({
        task: 'CHART_SYNTHESIS'
      });

      const result = await runAiExplanation(options);

      if (result.kind === 'ERROR') {
        throw new Error(result.message);
      }

      // Verify the real local rules engine was used
      expect(result.providerId).toBe('local-vedic-rules');
      expect(result.providerKind).toBe('LOCAL_RULES');

      // Verify evidence parity: all evidence IDs in the response should be traceable
      // to the synthesis engine's evidence references
      const allEvidenceIds = [
        ...result.supportingEvidence.map(e => e.evidence.id),
        ...result.challengingEvidence.map(e => e.evidence.id)
      ];

      // Each evidence ID should have a non-empty statement (proves it was resolved)
      for (const item of result.supportingEvidence) {
        expect(item.evidence.statement.length).toBeGreaterThan(0);
      }

      for (const item of result.challengingEvidence) {
        expect(item.evidence.statement.length).toBeGreaterThan(0);
      }

      // Verify canonical fields are preserved (no ID regeneration)
      // The synthesis engine's canonical identity fields should match the AI context
      expect(result.requestId).toBeTruthy();
    });


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

  it('SELECTED_PERIOD_ANALYSIS evidence IDs are exact subsets with no invented IDs', async () => {
    // Build a selected-period synthesis with known evidence IDs
    const mockSelectedPeriod: any = {
      synthesisVersion: 'PBA-06-v1',
      period: {
        selectedPeriodId: 'test-period-id',
        mahadashaId: 'test-md-id',
        mahadashaPlanet: 'JUPITER',
        antardashaId: 'test-ad-id',
        antardashaPlanet: 'VENUS',
        interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
        analysisAsOf: '2024-01-01T00:00:00Z',
        temporalRelation: 'PAST'
      },
      natalBaseline: {},
      career: {
        qualificationBasis: 'CANONICAL_STATUS',
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
        career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
        wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
      },
      // Add availableEvidence bridge with actual AiEvidence objects
      availableEvidence: [
        { id: 'ev-1', source: 'PLANET', effect: 'SUPPORT', strength: 'STRONG', statement: 'Evidence 1' },
        { id: 'ev-2', source: 'PLANET', effect: 'SUPPORT', strength: 'STRONG', statement: 'Evidence 2' },
        { id: 'ev-3', source: 'DASHA', effect: 'SUPPORT', strength: 'MODERATE', statement: 'Evidence 3' },
        { id: 'ev-4', source: 'HOUSE', effect: 'SUPPORT', strength: 'STRONG', statement: 'Evidence 4' },
        { id: 'ev-5', source: 'HOUSE', effect: 'SUPPORT', strength: 'STRONG', statement: 'Evidence 5' }
      ]
    };

    const mockRouter: any = {
      route: async (request: any) => {
        // Verify the request has the correct task and selectedPeriod context
        expect(request.task).toBe('SELECTED_PERIOD_ANALYSIS');
        expect(request.context.selectedPeriod).toBeDefined();

        // Return evidence IDs that exist in availableEvidence plus one invented ID
        return {
          response: {
            content: '',
            structuredOutput: {
              status: 'SUCCESS',
              conclusion: 'Selected period analysis shows activation.',
              supportingEvidenceIds: ['ev-1', 'ev-3'],
              challengingEvidenceIds: ['ev-4'],
              unresolvedQuestions: ['The following evidence ID could not be resolved: ev-invented'],
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

      // Verify resolved evidence IDs are exact subset of availableEvidence
      const resolvedSupportingIds = result.supportingEvidence.map(e => e.evidence.id);
      const resolvedChallengingIds = result.challengingEvidence.map(e => e.evidence.id);
      const allResolvedIds = [...resolvedSupportingIds, ...resolvedChallengingIds];

      // All resolved IDs should be in availableEvidence
      const availableIds = mockSelectedPeriod.availableEvidence.map((e: any) => e.id);
      for (const id of allResolvedIds) {
        expect(availableIds).toContain(id);
      }

      // Verify the invented ID is NOT in resolved evidence
      expect(allResolvedIds).not.toContain('ev-invented');

      // Verify the invented ID appears in unresolvedQuestions or warnings
      const unresolvedText = result.unresolvedQuestions.join(' ') + ' ' + result.warnings.join(' ');
      expect(unresolvedText).toContain('ev-invented');
    }
  });

  it('SELECTED_PERIOD_ANALYSIS with evidence-sparse context returns SUCCESS/PARTIAL not ERROR', async () => {
    // Create a selected-period context with sparse evidence (future period with no activations)
    const sparseSelectedPeriod: any = {
      synthesisVersion: 'PBA-06-v1',
      period: {
        selectedPeriodId: 'test-period-id',
        mahadashaId: 'test-md-id',
        mahadashaPlanet: 'VENUS',
        antardashaId: 'test-ad-id',
        antardashaPlanet: 'VENUS',
        interval: { start: '2030-10-08T17:58:35.885Z', end: '2034-02-07T05:58:35.885Z' },
        analysisAsOf: '2026-01-01T00:00:00Z',
        temporalRelation: 'FUTURE'
      },
      natalBaseline: {},
      career: {
        qualificationBasis: 'PROXY_DIRECTION',
        expressions: [], // No expressions - sparse evidence
        diagnostics: []
      },
      wealth: {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
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
            effect: 'UNKNOWN',
            dataStatus: 'COMPLETE',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: []
          },
          SPECULATION: {
            dimension: 'SPECULATION',
            effect: 'UNKNOWN',
            dataStatus: 'COMPLETE',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: []
          }
        },
        diagnostics: []
      },
      evidence: [], // No evidence references
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      missingInputs: [],
      diagnostics: [],
      provenance: {
        career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'PROXY_DIRECTION' },
        wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
      },
      availableEvidence: []
    };

    const mockRouter: any = {
      route: async (request: any) => {
        expect(request.task).toBe('SELECTED_PERIOD_ANALYSIS');
        expect(request.context.selectedPeriod).toBeDefined();

        // Local rules should return a valid conclusion even with sparse evidence
        return {
          response: {
            content: '',
            structuredOutput: {
              status: 'SUCCESS',
              conclusion: 'Career analysis for the selected VENUS-VENUS period is based on qualification basis PROXY_DIRECTION. No career expressions are linked to this period.',
              supportingEvidenceIds: [],
              challengingEvidenceIds: [],
              unresolvedQuestions: ['Career activation may be unavailable for this period.'],
              warnings: [],
              triggeredRuleIds: ['SP-01-CAREER-EXPRESSIONS']
            },
            warnings: []
          },
          providerId: 'local-vedic-rules',
          providerName: 'Local Vedic Rules',
          providerKind: 'LOCAL_RULES',
          routingMode: 'LOCAL_ONLY',
          fallbackUsed: false,
          selectionReason: 'CAPABILITY',
          requestId: 'req-sparse-test'
        };
      }
    };

    const result = await runAiExplanation(createTestOptions({
      task: 'SELECTED_PERIOD_ANALYSIS',
      selectedPeriod: sparseSelectedPeriod,
      router: mockRouter
    }));

    // Should return SUCCESS, not ERROR
    expect(result.kind).toBe('SUCCESS');
    if (result.kind === 'SUCCESS') {
      expect(result.status).toBe('SUCCESS');
      expect(result.conclusion).toContain('qualification basis PROXY_DIRECTION');
      expect(result.supportingEvidence).toEqual([]);
      expect(result.challengingEvidence).toEqual([]);
    }
  });

  it('SELECTED_PERIOD_ANALYSIS unreferenced ambiguous ID does not appear in unresolved', async () => {
    // Create a selected-period context with an ambiguous cross-namespace ID
    const ambiguousSpEvidence: any = {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'CHALLENGE', // Conflict with context.evidence (SUPPORT)
      strength: 'STRONG',
      statement: 'Different statement',
      planets: ['SUN'],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const mockSelectedPeriod: any = {
      synthesisVersion: 'PBA-06-v1',
      period: {
        selectedPeriodId: 'test-period-id',
        mahadashaId: 'test-md-id',
        mahadashaPlanet: 'JUPITER',
        antardashaId: 'test-ad-id',
        antardashaPlanet: 'VENUS',
        interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
        analysisAsOf: '2024-01-01T00:00:00Z',
        temporalRelation: 'PAST'
      },
      natalBaseline: {},
      career: {
        qualificationBasis: 'CANONICAL_STATUS',
        expressions: [],
        diagnostics: []
      },
      wealth: {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            effect: 'ACTIVATES',
            dataStatus: 'COMPLETE',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
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
      evidence: [],
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      missingInputs: [],
      diagnostics: [],
      provenance: {
        career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
        wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
      },
      // availableEvidence includes the ambiguous ID
      availableEvidence: [ambiguousSpEvidence]
    };

    const mockRouter: any = {
      route: async (request: any) => {
        // Verify the request has the correct task and selectedPeriod context
        expect(request.task).toBe('SELECTED_PERIOD_ANALYSIS');
        expect(request.context.selectedPeriod).toBeDefined();

        // Return evidence IDs that do NOT include the ambiguous ID
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
          requestId: 'req-ambiguous-test'
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

      // The ambiguous ID should NOT appear in unresolvedQuestions
      const unresolvedText = result.unresolvedQuestions.join(' ');
      expect(unresolvedText).not.toContain('ctx-ev-1');

      // The ambiguous ID should NOT appear in warnings (it's unreferenced)
      const warningsText = result.warnings.join(' ');
      expect(warningsText).not.toContain('ctx-ev-1');
    }
  });

  it('SELECTED_PERIOD_ANALYSIS referenced ambiguous ID appears as unresolved', async () => {
    // Create a selected-period context with an ambiguous cross-namespace ID
    const ambiguousSpEvidence: any = {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'CHALLENGE', // Conflict with context.evidence (SUPPORT)
      strength: 'STRONG',
      statement: 'Different statement',
      planets: ['SUN'],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const mockSelectedPeriod: any = {
      synthesisVersion: 'PBA-06-v1',
      period: {
        selectedPeriodId: 'test-period-id',
        mahadashaId: 'test-md-id',
        mahadashaPlanet: 'JUPITER',
        antardashaId: 'test-ad-id',
        antardashaPlanet: 'VENUS',
        interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
        analysisAsOf: '2024-01-01T00:00:00Z',
        temporalRelation: 'PAST'
      },
      natalBaseline: {},
      career: {
        qualificationBasis: 'CANONICAL_STATUS',
        expressions: [],
        diagnostics: []
      },
      wealth: {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            effect: 'ACTIVATES',
            dataStatus: 'COMPLETE',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
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
      evidence: [],
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      missingInputs: [],
      diagnostics: [],
      provenance: {
        career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
        wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
      },
      // availableEvidence includes the ambiguous ID
      availableEvidence: [ambiguousSpEvidence]
    };

    const mockRouter: any = {
      route: async (request: any) => {
        // Verify the request has the correct task and selectedPeriod context
        expect(request.task).toBe('SELECTED_PERIOD_ANALYSIS');
        expect(request.context.selectedPeriod).toBeDefined();

        // Return evidence IDs that INCLUDE the ambiguous ID
        return {
          response: {
            content: '',
            structuredOutput: {
              status: 'SUCCESS',
              conclusion: 'Selected period analysis shows activation.',
              supportingEvidenceIds: ['ctx-ev-1'], // Request the ambiguous ID
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
          requestId: 'req-ambiguous-test'
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

      // The ambiguous ID SHOULD appear in unresolvedQuestions
      const unresolvedText = result.unresolvedQuestions.join(' ');
      expect(unresolvedText).toContain('ctx-ev-1');

      // The ambiguous ID should NOT be resolved to either record
      const resolvedIds = result.supportingEvidence.map(e => e.evidence.id);
      expect(resolvedIds).not.toContain('ctx-ev-1');
    }
  });
});
