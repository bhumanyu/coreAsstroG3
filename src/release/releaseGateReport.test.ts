import { describe, expect, it } from 'vitest';
import {
  aggregateReleaseStatus,
  finalizeReleaseReport
} from './releaseGateReport';
import {
  REQUIRED_RELEASE_GATE_IDS,
  type CoverageStatus,
  type ReleaseGateResult,
  type ReleaseGateStatus
} from './releaseGateTypes';

const allPassingGates = (): ReleaseGateResult[] =>
  REQUIRED_RELEASE_GATE_IDS.map(id => ({ id, status: 'PASS' }));

describe('release gate report', () => {
  it('aggregates only the required gate inventory', () => {
    const gates = [...allPassingGates(), { id: 'RG-EXTRA' as never, status: 'FAIL' as const }];
    expect(aggregateReleaseStatus(gates)).toBe('PASS');
    expect(aggregateReleaseStatus(gates.slice(1))).toBe('NOT_RUN');
    expect(aggregateReleaseStatus([
      ...allPassingGates(),
      { id: 'RG-09', status: 'PASS' }
    ])).toBe('FAIL');
  });

  it('keeps gate and coverage vocabularies distinct', () => {
    const excluded: CoverageStatus = 'SCOPE_EXCLUDED';
    expect(excluded).toBe('SCOPE_EXCLUDED');
    // @ts-expect-error SCOPE_EXCLUDED is coverage only, never a gate status.
    const invalidGateStatus: ReleaseGateStatus = 'SCOPE_EXCLUDED';
    expect(invalidGateStatus).toBe('SCOPE_EXCLUDED');
  });

  it('blocks RG-09 when the approved reference fixture set is empty', () => {
    const report = finalizeReleaseReport({
      gates: allPassingGates(),
      fixtureCount: 0
    });

    expect(report.gates.find(gate => gate.id === 'RG-09')?.status).toBe('BLOCKED');
    expect(report.canRelease).toBe(report.status === 'PASS');
    expect(report.canRelease).toBe(false);
  });

  it('retains the two PR-8 blockers in RG-13', () => {
    const report = finalizeReleaseReport({
      gates: allPassingGates(),
      fixtureCount: 1,
      pr8AcceptanceStatuses: [
        { name: 'report-renderer', status: 'PASS' },
        { name: 'AppController async-state', status: 'PASS' }
      ]
    });

    expect(report.gates.find(gate => gate.id === 'RG-13')?.status).toBe('BLOCKED');
    expect(report.pr8AcceptanceStatuses.every(status => status.status === 'BLOCKED')).toBe(true);
    expect(report.canRelease).toBe(report.status === 'PASS');
  });

  it('fails RG-13 when a consumed PR-8 surface fails', () => {
    const report = finalizeReleaseReport({
      gates: allPassingGates(),
      fixtureCount: 1,
      pr8AcceptanceStatuses: [
        { name: 'CAREER:reasoning-trace', status: 'FAIL' }
      ]
    });

    expect(report.gates.find(gate => gate.id === 'RG-13')?.status).toBe('FAIL');
    expect(report.status).toBe('FAIL');
    expect(report.canRelease).toBe(false);
  });
});
