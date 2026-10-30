import { describe, expect, it } from 'vitest';
import { normalizeAcceptanceConclusion, normalizeAcceptanceSurface } from './goldenAcceptanceNormalizer';
import { assertConclusionInventory, assertParity, deepEqualAcceptance } from './goldenAcceptanceAssertions';
import { aggregateGateStatus, buildGoldenAcceptanceReport } from './goldenAcceptanceReport';
import type { AcceptanceConclusion } from './goldenAcceptanceTypes';

const supported: AcceptanceConclusion = {
  domain: 'CAREER', scope: 'LIFETIME', subjectId: 'candidate:C1', status: 'SUPPORTED',
  evidence: [
    { id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' },
    { id: 'EV-1', owner: 'C1' }
  ],
  provenance: [{ evidenceId: 'EV-1', owner: 'C1', type: 'ESTABLISHING' }]
};

const scenarios: readonly [string, string][] = [
  ['supported', 'SUPPORTED'], ['missing evidence', 'SUPPORTED'], ['unsupported', 'UNSUPPORTED'],
  ['unresolved', 'UNRESOLVED'], ['conflicted', 'CONFLICTED'], ['neutral-only', 'NEUTRAL'],
  ['unlinked', 'UNLINKED'], ['reordered input', 'SUPPORTED'], ['exact-duplicate evidence', 'SUPPORTED']
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

  it.each(scenarios)('has a defined acceptance scenario: %s', (_name, _status) => {
    expect(normalizeAcceptanceConclusion(supported).subjectId).toBe('candidate:C1');
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
