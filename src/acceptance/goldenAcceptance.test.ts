import { describe, expect, it } from 'vitest';
import { normalizeAcceptanceConclusion, normalizeAcceptanceSurface, projectDomainEvidenceToAcceptanceProvenance } from './goldenAcceptanceNormalizer';
import { assertConclusionInventory, assertParity, deepEqualAcceptance } from './goldenAcceptanceAssertions';
import { aggregateGateStatus, buildGoldenAcceptanceReport } from './goldenAcceptanceReport';
import type { AcceptanceConclusion } from './goldenAcceptanceTypes';
import type { DomainEvidence } from '../domain/interpretation/DomainEvidence';
import type { CareerFinalEvidenceTrace } from '../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';

const supported: AcceptanceConclusion = {
  domain: 'CAREER', scope: 'LIFETIME', subjectId: 'candidate:C1', status: 'SUPPORTED',
  evidence: [
    { id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' },
    { id: 'EV-1', owner: 'C1' }
  ],
  provenance: [{ evidenceId: 'EV-1', owner: 'C1', type: 'ESTABLISHING' }]
};

const scenarios: readonly { readonly name: string; readonly input: AcceptanceConclusion; readonly expectedStatus: string }[] = [
  { name: 'supported', input: { ...supported }, expectedStatus: 'SUPPORTED' },
  { name: 'unsupported', input: { ...supported, status: 'UNSUPPORTED', evidence: [], provenance: [] }, expectedStatus: 'UNSUPPORTED' },
  { name: 'unresolved', input: { ...supported, status: 'UNRESOLVED', evidence: [], provenance: [] }, expectedStatus: 'UNRESOLVED' },
  { name: 'conflicted', input: { ...supported, status: 'CONFLICTED' }, expectedStatus: 'CONFLICTED' },
  { name: 'neutral-only', input: { ...supported, status: 'NEUTRAL', evidence: [{ id: 'EV-NEUTRAL', owner: 'C1' }], provenance: [] }, expectedStatus: 'NEUTRAL' },
  { name: 'unlinked', input: { ...supported, status: 'UNLINKED', evidence: [{ id: 'EV-UNLINKED', owner: 'C1' }], provenance: [] }, expectedStatus: 'UNLINKED' },
  { name: 'reordered input', input: { ...supported, evidence: [{ id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] }, expectedStatus: 'SUPPORTED' },
  { name: 'exact-duplicate evidence', input: { ...supported, evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] }, expectedStatus: 'SUPPORTED' }
];

describe('PR-8 golden acceptance contract', () => {
  it('normalizes evidence and provenance deterministically without fabricating identities', () => {
    const normalized = normalizeAcceptanceConclusion(supported);
    expect(normalized.evidence.map(item => item.id)).toEqual(['EV-1', 'EV-2']);
    expect(normalized.provenance).toEqual([{ evidenceId: 'EV-1', owner: 'C1', type: 'ESTABLISHING' }]);
  });

  it('rejects duplicate IDs with different owners', () => {
    expect(() => normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-1', owner: 'C2' }]
    })).toThrow(expect.objectContaining({ code: 'SAME_ID_DIFFERENT_OWNER', conflictingId: 'EV-1' }));
  });

  it('reports missing surfaces as MISSING rather than empty parity', () => {
    const expected = normalizeAcceptanceConclusion(supported);
    const differences = assertParity(expected, [normalizeAcceptanceSurface('ui', undefined)]);
    expect(differences[0]).toEqual(expect.objectContaining({ kind: 'MISSING' }));
  });

  it('uses real deep equality and distinct conclusions inventory', () => {
    expect(deepEqualAcceptance({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
    expect(deepEqualAcceptance({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(assertConclusionInventory([
      normalizeAcceptanceConclusion(supported), normalizeAcceptanceConclusion(supported)
    ])).toEqual([expect.objectContaining({ kind: 'DUPLICATE_CONCLUSION' })]);
  });

  it('keeps lifetime and selected-period scopes temporally distinct', () => {
    const lifetime = normalizeAcceptanceConclusion({ ...supported, scope: 'LIFETIME', temporalScope: { kind: 'LIFETIME' } });
    const selected = normalizeAcceptanceConclusion({ ...supported, scope: 'SELECTED_PERIOD', temporalScope: { start: '2026-01-01', end: '2026-02-01' } });
    expect(lifetime.scope).toBe('LIFETIME');
    expect(selected.scope).toBe('SELECTED_PERIOD');
    expect(selected.temporalScope).not.toEqual(lifetime.temporalScope);
  });

  it('only preserves a supplied insufficient-data status without rewriting missing evidence domain semantics', () => {
    const normalized = normalizeAcceptanceConclusion({
      ...supported,
      status: 'INSUFFICIENT_DATA',
      evidence: [],
      provenance: []
    });
    expect(normalized.status).toBe('INSUFFICIENT_DATA');
    expect(normalized.evidence).toEqual([]);
    expect(normalized.provenance).toEqual([]);
  });

  it.skip('BLOCKED: real pipeline missing-evidence integration awaits the PR-8B production harness', () => {
    // PR-8B will feed a real C11/Career or Wealth result with native
    // INSUFFICIENT_DATA/UNAVAILABLE into this assertion. The acceptance normalizer
    // deliberately does not manufacture or substitute that status.
  });

  it.each(scenarios)('normalizes the $name scenario', ({ input, expectedStatus }) => {
    const normalized = normalizeAcceptanceConclusion(input);
    expect(normalized.status).toBe(expectedStatus);
    expect(normalized.subjectId).toBe('candidate:C1');
    if (input.status === 'UNSUPPORTED') {
      expect(normalized.evidence).toEqual([]);
    }
  });

  it('normalizes reordered evidence byte-identically and deduplicates exact duplicates', () => {
    const forward = normalizeAcceptanceConclusion({ ...supported, evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-2', owner: 'C1' }] });
    const reverse = normalizeAcceptanceConclusion({ ...supported, evidence: [{ id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] });
    const duplicate = normalizeAcceptanceConclusion({ ...supported, evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] });
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reverse));
    expect(duplicate.evidence.map(item => item.id)).toEqual(['EV-1']);
  });

  it('rejects provenance owner mismatch and dangling evidence references', () => {
    expect(() => normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }],
      provenance: [{ evidenceId: 'EV-1', owner: 'C2' }]
    })).toThrow(expect.objectContaining({ code: 'SAME_ID_DIFFERENT_OWNER', conflictingId: 'EV-1' }));
    expect(() => normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }],
      provenance: [{ evidenceId: 'EV-NOT-IN-EVIDENCE', owner: 'C1' }]
    })).toThrow(expect.objectContaining({ code: 'DANGLING_PROVENANCE', conflictingId: 'EV-NOT-IN-EVIDENCE' }));
  });

  it('preserves source-stage provenance identity instead of collapsing it', () => {
    const normalized = normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }],
      provenance: [
        { evidenceId: 'EV-1', owner: 'C1', source: 'PATTERN', ruleId: 'RULE-1' },
        { evidenceId: 'EV-1', owner: 'C1', source: 'ACTIVATION', ruleId: 'RULE-1' }
      ]
    });
    expect(normalized.provenance).toHaveLength(2);
  });

  it('preserves complete DomainEvidence and evidenceTrace provenance identity', () => {
    const evidence = {
      id: 'EV-1', sourceType: 'CANONICAL', domain: 'CAREER', role: 'PRIMARY', phase: 'NATAL',
      source: 'C4_STRUCTURAL_REASONING', statement: 'test', polarity: 'SUPPORTING', strength: 'STRONG',
      priority: 1, ruleId: 'RULE-DOMAIN', relatedEvidenceIds: [],
      provenance: {
        evidenceId: 'EV-1', ruleId: 'RULE-PROVENANCE', domain: 'CAREER', axis: 'NATAL',
        source: 'D10', effect: 'SUPPORT', strength: 'PRIMARY'
      }
    } as unknown as DomainEvidence;
    const trace: CareerFinalEvidenceTrace = {
      evidenceIds: ['EV-1'], sourceIds: ['TRACE-SOURCE'], ruleIds: ['TRACE-RULE']
    };

    expect(projectDomainEvidenceToAcceptanceProvenance(evidence, 'C1', trace)).toEqual({
      evidenceId: 'EV-1', owner: 'C1', source: 'TRACE-SOURCE', ruleId: 'TRACE-RULE',
      occurrence: 'EV-1', stage: 'NATAL', type: 'PRIMARY'
    });
  });

  it('makes any parity difference fail even when gates pass or block', () => {
    const difference = { surface: 'ui', kind: 'VALUE_MISMATCH' as const, path: '$.status', reason: 'status differs' };
    expect(buildGoldenAcceptanceReport([{ name: 'gate', status: 'PASS' }], [difference]).status).toBe('FAIL');
    expect(buildGoldenAcceptanceReport([{ name: 'gate', status: 'BLOCKED' }], [difference]).status).toBe('FAIL');
  });

  it('aggregates gates conservatively and blocks external/owner-gated gates', () => {
    expect(aggregateGateStatus([
      { name: 'required', status: 'PASS' }, { name: 'blocked-external', status: 'BLOCKED' }
    ])).toBe('BLOCKED');
    expect(aggregateGateStatus([
      { name: 'failed', status: 'FAIL' }, { name: 'not-run', status: 'NOT_RUN' }
    ])).toBe('FAIL');
    const report = buildGoldenAcceptanceReport([
      { name: 'swiss-jpl', status: 'BLOCKED' },
      { name: 'owner-gated-mechanisms', status: 'BLOCKED' }
    ]);
    expect(report.status).toBe('BLOCKED');
  });
});
