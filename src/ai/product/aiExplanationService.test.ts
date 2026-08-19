import { describe, expect, it } from 'vitest';
import { runAiExplanation } from './aiExplanationService';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import type { Horoscope } from '../../types';

function createHoroscope(): Horoscope {
  return calculateHoroscope(CANONICAL_BIRTH_DETAILS);
}

describe('runAiExplanation', () => {
  it('builds a local chart synthesis explanation', async () => {
    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS'
    });

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
    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS'
    });

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
    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'WEALTH_ANALYSIS'
    });

    expect(result.status === 'SUCCESS' || result.status === 'PARTIAL').toBe(true);

    if (result.kind === 'SUCCESS') {
      expect(result.providerKind).toBe('LOCAL_RULES');
      expect(result.routingMode).toBe('LOCAL_ONLY');
      expect(result.fallbackUsed).toBe(false);
    }
  });

  it('returns an error result when the context cannot be built', async () => {
    const brokenHoroscope = {} as Horoscope;

    const result = await runAiExplanation({
      horoscope: brokenHoroscope,
      task: 'CHART_SYNTHESIS'
    });

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

    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

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

    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

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

    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

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

    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

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

    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

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

    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS',
      router: mockRouter
    });

    expect(result.kind).toBe('ERROR');
    expect(result.status).toBe('ERROR');
    if (result.kind === 'ERROR') {
      expect(result.message).toBe(
        'AI explanation returned no usable content.'
      );
    }
  });
});
