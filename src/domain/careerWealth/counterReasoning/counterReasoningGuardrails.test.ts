import { describe, expect, it } from 'vitest';
import { applyHierarchyGuardrails } from './counterReasoningGuardrails';
import type { CounterReasoningClaim } from './counterReasoningTypes';

describe('counterReasoningGuardrails (CW-07)', () => {
  const claim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Is Dasha blocking career?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE',
    assertedPolarity: 'CHALLENGE',
    assertedOutcome: 'CHALLENGE',
    assertionMode: 'QUESTION',
    assertionPolarity: 'POSITIVE'
  };

  it('applies strong primary protection guardrails when natal is STRONG', () => {
    const res = applyHierarchyGuardrails({
      disposition: 'PARTIALLY_CONFIRMED',
      claim,
      supportingEvidenceIds: ['EV_PRIMARY_1'],
      challengingEvidenceIds: ['EV_DASHA_CHALLENGE'],
      context: {
        domain: 'CAREER',
        graph: { traceId: 'T1', nodes: [], edges: [] },
        natalPromiseStatus: 'STRONG',
        primaryEvidenceIds: ['EV_PRIMARY_1']
      }
    });

    expect(res.allowed).toBe(true);
    expect(res.guardrailApplied).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('cannot automatically reverse the primary natal direction'))).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('protected against categorical reversal'))).toBe(true);
  });

  it('emits qualified direction message and NOT strong-protection message for MODERATE tier', () => {
    const res = applyHierarchyGuardrails({
      disposition: 'PARTIALLY_CONFIRMED',
      claim,
      supportingEvidenceIds: [],
      challengingEvidenceIds: ['EV_DASHA_CHALLENGE'],
      context: {
        domain: 'CAREER',
        graph: { traceId: 'T1', nodes: [], edges: [] },
        natalPromiseStatus: 'MODERATE',
        primaryEvidenceIds: []
      }
    });

    expect(res.allowed).toBe(true);
    expect(res.guardrailApplied).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('Primary direction exists but is qualified'))).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('protected against categorical reversal'))).toBe(false);
  });

  it('notes secondary axis modulation when secondary challenges exist for CHALLENGED status', () => {
    const res = applyHierarchyGuardrails({
      disposition: 'PARTIALLY_CONFIRMED',
      claim,
      supportingEvidenceIds: [],
      challengingEvidenceIds: ['EV_DASHA_CHALLENGE'],
      context: {
        domain: 'CAREER',
        graph: { traceId: 'T1', nodes: [], edges: [] },
        natalPromiseStatus: 'CHALLENGED',
        primaryEvidenceIds: []
      }
    });

    expect(res.allowed).toBe(true);
    expect(res.guardrailApplied).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('modulate manifestation timing'))).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('protected against categorical reversal'))).toBe(false);
  });
});

