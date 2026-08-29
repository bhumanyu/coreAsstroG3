import { describe, expect, it } from 'vitest';
import { applyHierarchyGuardrails } from './counterReasoningGuardrails';
import type { CounterReasoningClaim } from './counterReasoningTypes';

describe('counterReasoningGuardrails (CW-07)', () => {
  const claim: CounterReasoningClaim = {
    domain: 'CAREER',
    question: 'Is Dasha blocking career?',
    questionType: 'DASHA_CHALLENGE',
    targetSubjectKey: 'DASHA_ACTIVATION',
    polarity: 'CHALLENGE'
  };

  it('applies primary protection guardrails when primary evidence supports foundational potential', () => {
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
    expect(res.guardrailReasons.some((r) => r.includes('cannot be negated by secondary timing'))).toBe(true);
    expect(res.guardrailReasons.some((r) => r.includes('protected against categorical reversal'))).toBe(true);
  });

  it('notes secondary axis modulation when secondary challenges exist without primary violation', () => {
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
  });
});
