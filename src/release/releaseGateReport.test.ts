import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  aggregateReleaseStatus,
  calculationFixtureGateStatus,
  createValidatedRunnerResult,
  finalizeReleaseReport,
  isVitestJsonReport,
  pr8WasEvaluatedOnCandidate,
  releasePolicyIsValid,
  skippedTestsGateStatus
} from './releaseGateReport';
import {
  EXCLUDED_RELEASE_CAPABILITIES,
  RELEASE_POLICY_VERSION,
  RETAINED_RELEASE_BLOCKERS,
  REQUIRED_RELEASE_GATES,
  REQUIRED_RELEASE_GATE_IDS,
  type CoverageStatus,
  type ReleaseGateResult,
  type ReleaseGateStatus
} from './releaseGateTypes';

const allPassingGates = (): ReleaseGateResult[] =>
  REQUIRED_RELEASE_GATE_IDS.map(id => ({ id, status: 'PASS', evidence: [`verified ${id}`] }));
const finalize = (input: Parameters<typeof createValidatedRunnerResult>[0]) =>
  finalizeReleaseReport(createValidatedRunnerResult(input));

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

  it('rejects a manufactured PASS without evidence', () => {
    const rawInput = {
      gates: allPassingGates().map(gate =>
        gate.id === 'RG-09' ? { id: gate.id, status: 'PASS' } : gate
      )
    };
    expect(() => createValidatedRunnerResult(rawInput as never))
      .toThrow('PASS gate RG-09 must include non-empty evidence.');
    expect(() => finalizeReleaseReport(rawInput as never))
      .toThrow('Release report finalization requires a validated runner result.');
  });

  it('rejects malformed or stale-shaped Vitest reports for RG-06', () => {
    const validReport = {
      numTotalTests: 2,
      numPassedTests: 2,
      testResults: [{ assertionResults: [] }],
      startTime: 123
    };
    expect(isVitestJsonReport(validReport)).toBe(true);
    expect(skippedTestsGateStatus(true, validReport, [], [])).toBe('PASS');
    expect(skippedTestsGateStatus(true, {}, [], [])).toBe('FAIL');
    expect(skippedTestsGateStatus(true, undefined, [], [])).toBe('FAIL');
    expect(skippedTestsGateStatus(true, { ...validReport, startTime: undefined }, [], []))
      .toBe('FAIL');
  });

  it('blocks RG-09 when a READY inventory has missing per-fixture execution results', () => {
    const fixture = {
      id: 'independent-1',
      kind: 'PLANETARY_LONGITUDE',
      provenance: {
        sourceType: 'EXTERNAL_EPHEMERIS',
        independentlyProduced: true,
        sourceName: 'Independent source',
        citation: 'Source citation',
        sourceVersion: '1',
        methodology: 'Independent method',
        retrievedAt: '2026-01-01',
        approvedBy: 'Reviewer',
        approvedAt: '2026-01-02'
      }
    };
    expect(calculationFixtureGateStatus([fixture], [], [], true)).toBe('BLOCKED');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      compared: true,
      passed: true
    }], [], true)).toBe('PASS');
  });

  it('blocks PR-8 linkage when acceptance files changed since the approved implementation', () => {
    const sha = 'a'.repeat(40);
    expect(pr8WasEvaluatedOnCandidate(
      sha,
      sha,
      sha,
      sha,
      ['src/acceptance/goldenAcceptance.test.ts']
    )).toBe(false);
  });

  it('requires the release policy to match the typed policy contract', () => {
    const policy = JSON.parse(readFileSync(
      resolve(process.cwd(), 'docs/release/release-policy.json'),
      'utf8'
    ));
    expect(policy.policyVersion).toBe(RELEASE_POLICY_VERSION);
    expect(releasePolicyIsValid(policy, REQUIRED_RELEASE_GATE_IDS)).toBe(true);
    expect(releasePolicyIsValid({
      ...policy,
      retainedBlockers: [{ id: 'external-reference-parity', status: 'PASS' }]
    }, REQUIRED_RELEASE_GATE_IDS)).toBe(false);
    expect(releasePolicyIsValid({
      ...policy,
      excludedCapabilities: EXCLUDED_RELEASE_CAPABILITIES.slice(1)
    }, REQUIRED_RELEASE_GATE_IDS)).toBe(false);
    expect(releasePolicyIsValid({
      ...policy,
      requiredGates: REQUIRED_RELEASE_GATES
    }, REQUIRED_RELEASE_GATE_IDS)).toBe(true);
    expect(releasePolicyIsValid({
      ...policy,
      policyVersion: RELEASE_POLICY_VERSION + 1
    }, REQUIRED_RELEASE_GATE_IDS)).toBe(false);
  });

  it('keeps gate and coverage vocabularies distinct', () => {
    const excluded: CoverageStatus = 'SCOPE_EXCLUDED';
    expect(excluded).toBe('SCOPE_EXCLUDED');
    // @ts-expect-error SCOPE_EXCLUDED is coverage only, never a gate status.
    const invalidGateStatus: ReleaseGateStatus = 'SCOPE_EXCLUDED';
    expect(invalidGateStatus).toBe('SCOPE_EXCLUDED');
  });

  it('blocks RG-09 when the approved reference fixture set is empty', () => {
    const report = finalize({
      gates: allPassingGates(),
      fixtureCount: 0
    });

    expect(report.gates.find(gate => gate.id === 'RG-09')?.status).toBe('BLOCKED');
    expect(report.canRelease).toBe(report.status === 'PASS');
    expect(report.canRelease).toBe(false);
  });

  it('retains the two PR-8 blockers in RG-13', () => {
    const report = finalize({
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
    const report = finalize({
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
