import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
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
  type ReleaseGateEvidence,
  type RunnerEvidenceManifest,
  type CoverageStatus,
  type ReleaseGateResult,
  type ReleaseGateStatus
} from './releaseGateTypes';
import {
  CALCULATION_COVERAGE_POLICY,
  inspectBoundaryCoverage
} from '../engine/validation/calculationReferenceFixtures';

const evidencePath = 'src/release/releaseGateReport.test.ts';
const evidenceSha = createHash('sha256')
  .update(readFileSync(resolve(process.cwd(), evidencePath)))
  .digest('hex');
const expectedKinds: Record<string, ReleaseGateEvidence['kind']> = {
  'RG-01': 'POLICY_DOCUMENT',
  'RG-02': 'FILE_SHA256',
  'RG-03': 'COMMAND_LOG',
  'RG-04': 'COMMAND_LOG',
  'RG-05': 'COMMAND_LOG',
  'RG-06': 'FILE_SHA256',
  'RG-07': 'FILE_SHA256',
  'RG-08': 'COMMAND_LOG',
  'RG-09': 'FIXTURE_COMPARISON',
  'RG-10': 'COMMAND_LOG',
  'RG-11': 'COMMAND_LOG',
  'RG-12': 'COMMAND_LOG',
  'RG-13': 'FILE_SHA256',
  'RG-14': 'POLICY_DOCUMENT'
};
const testEvidenceManifest: RunnerEvidenceManifest = {
  commands: REQUIRED_RELEASE_GATE_IDS.map(id => ({
    name: id,
    logPath: evidencePath,
    exitCode: 0
  })),
  files: [{ path: evidencePath, sha256: evidenceSha }],
  fixtureComparisons: [{
    path: evidencePath,
    sha256: evidenceSha,
    invocationId: 'invocation-1',
    fixtureIds: ['fixture-1'],
    commandPassed: true
  }],
  policyDocuments: [{ path: evidencePath, sha256: evidenceSha }]
};
const evidenceFor = (id: string): ReleaseGateEvidence => {
  switch (expectedKinds[id]) {
    case 'COMMAND_LOG':
      return { kind: 'COMMAND_LOG', commandName: id, logPath: evidencePath };
    case 'FILE_SHA256':
      return { kind: 'FILE_SHA256', path: evidencePath, sha256: evidenceSha };
    case 'FIXTURE_COMPARISON':
      return {
        kind: 'FIXTURE_COMPARISON',
        path: evidencePath,
        sha256: evidenceSha,
        invocationId: 'invocation-1',
        fixtureIds: ['fixture-1']
      };
    case 'POLICY_DOCUMENT':
      return { kind: 'POLICY_DOCUMENT', path: evidencePath, sha256: evidenceSha };
    default:
      throw new Error(`Unknown release gate ${id}.`);
  }
};
const allPassingGates = (): ReleaseGateResult[] =>
  REQUIRED_RELEASE_GATE_IDS.map(id => ({ id, status: 'PASS', evidence: [evidenceFor(id)] }));
const finalize = (input: Parameters<typeof createValidatedRunnerResult>[0]) =>
  finalizeReleaseReport(createValidatedRunnerResult(input, testEvidenceManifest));

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
        gate.id === 'RG-09' ? { ...gate, evidence: [] } : gate
      )
    };
    expect(() => createValidatedRunnerResult(rawInput as never, testEvidenceManifest))
      .toThrow('PASS gate RG-09 must include typed evidence.');
    expect(() => finalizeReleaseReport(rawInput as never))
      .toThrow('Release report finalization requires a validated runner result.');
  });

  it('rejects PASS evidence with the wrong per-gate discriminant', () => {
    const gates = allPassingGates().map(gate =>
      gate.id === 'RG-09'
        ? { ...gate, evidence: [{ kind: 'COMMAND_LOG', commandName: 'RG-09', logPath: evidencePath }] }
        : gate
    );
    expect(() => createValidatedRunnerResult({ gates } as never, testEvidenceManifest))
      .toThrow('PASS gate RG-09 requires FIXTURE_COMPARISON evidence.');
  });

  it('rejects a typed evidence reference with an artifact hash mismatch', () => {
    const gates = allPassingGates().map(gate =>
      gate.id === 'RG-01'
        ? {
          ...gate,
          evidence: [{
            kind: 'POLICY_DOCUMENT',
            path: evidencePath,
            sha256: '0'.repeat(64)
          }]
        }
        : gate
    );
    expect(() => createValidatedRunnerResult({ gates } as never, testEvidenceManifest))
      .toThrow('PASS gate RG-01 references evidence missing from the runner manifest.');
  });

  it('rejects malformed or stale-shaped Vitest reports for RG-06', () => {
    const validReport = {
      numTotalTests: 2,
      numPassedTests: 2,
      numFailedTests: 0,
      testResults: [{
        name: 'suite.test.ts',
        assertionResults: [
          { fullName: 'suite test one', status: 'passed' },
          { fullName: 'suite test two', status: 'passed' }
        ]
      }],
      startTime: 150
    };
    const commandWindow = { startedAt: 100, finishedAt: 200 };
    expect(isVitestJsonReport(validReport, commandWindow)).toBe(true);
    expect(skippedTestsGateStatus(true, validReport, [], [], commandWindow)).toBe('PASS');
    expect(skippedTestsGateStatus(true, {}, [], [])).toBe('FAIL');
    expect(skippedTestsGateStatus(true, undefined, [], [])).toBe('FAIL');
    expect(skippedTestsGateStatus(true, { ...validReport, startTime: undefined }, [], [], commandWindow))
      .toBe('FAIL');
    expect(skippedTestsGateStatus(true, { ...validReport, numPassedTests: 1 }, [], [], commandWindow))
      .toBe('FAIL');
    expect(skippedTestsGateStatus(true, {
      ...validReport,
      testResults: [{
        name: 'suite.test.ts',
        assertionResults: [
          { fullName: 'duplicate', status: 'passed' },
          { fullName: 'duplicate', status: 'passed' }
        ]
      }]
    }, [], [], commandWindow)).toBe('FAIL');
    expect(skippedTestsGateStatus(true, validReport, [], [], { startedAt: 151, finishedAt: 200 }))
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
        coordinateConvention: 'sidereal longitude',
        timeStandard: 'UTC',
        ayanamsa: 'LAHIRI',
        nodeConvention: 'mean node',
        tolerance: '0.1 degrees',
        toleranceRationale: 'Published source precision',
        independenceStatement: 'Expected value was not derived from engine output.',
        retrievedAt: '2026-01-01',
        approvedBy: 'Reviewer',
        approvedAt: '2026-01-02'
      }
    };
    expect(calculationFixtureGateStatus([fixture], [], [], true)).toBe('BLOCKED');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], true)).toBe('PASS');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], false)).toBe('BLOCKED');
    expect(calculationFixtureGateStatus([{
      ...fixture,
      provenance: {
        ...fixture.provenance,
        independenceStatement: 'Expected value derived from engine output.'
      }
    }], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], true)).toBe('FAIL');
  });

  it('flags duplicate boundary-position tuples and unordered boundary triplets', () => {
    const records = [
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EPSILON_BEFORE',
        boundaryLongitude: 10,
        input: { longitude: 9.9 }
      },
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EPSILON_BEFORE',
        boundaryLongitude: 10,
        input: { longitude: 9.95 }
      },
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EXACT',
        boundaryLongitude: 10,
        input: { longitude: 10 }
      },
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EPSILON_AFTER',
        boundaryLongitude: 10,
        input: { longitude: 10.1 }
      }
    ];
    const issues = inspectBoundaryCoverage(records, CALCULATION_COVERAGE_POLICY);
    expect(issues).toContain('DUPLICATE_BOUNDARY_POSITION:SIGN:SIGN-10:EPSILON_BEFORE');
    expect(inspectBoundaryCoverage([
      ...records.filter(item => item.boundaryPosition !== 'EPSILON_BEFORE'),
      { ...records[0], input: { longitude: 10.01 } }
    ], CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_ORDER:SIGN:SIGN-10:input longitudes must be strictly ordered around boundaryLongitude'
    );
  });

  it('blocks PR-8 linkage when Git detects a modified acceptance file', () => {
    const repository = mkdtempSync(join(tmpdir(), 'pr8-rg13-'));
    try {
      const git = (...args: string[]) => execFileSync('git', args, {
        cwd: repository,
        encoding: 'utf8'
      }).trim();
      git('init', '-q');
      git('config', 'user.name', 'Release test');
      git('config', 'user.email', 'release-test@example.invalid');
      const acceptancePath = join(repository, 'src', 'acceptance');
      mkdirSync(acceptancePath, { recursive: true });
      writeFileSync(join(acceptancePath, 'fixture.ts'), 'export const value = 1;\n');
      git('add', '.');
      git('-c', 'user.name=Release test', '-c', 'user.email=release-test@example.invalid', 'commit', '-qm', 'accepted');
      const acceptedSha = git('rev-parse', 'HEAD');
      writeFileSync(join(acceptancePath, 'fixture.ts'), 'export const value = 2;\n');
      git('add', '.');
      git('-c', 'user.name=Release test', '-c', 'user.email=release-test@example.invalid', 'commit', '-qm', 'changed');
      const candidateSha = git('rev-parse', 'HEAD');
      const changedFiles = git(
        'diff',
        '--name-only',
        acceptedSha,
        candidateSha,
        '--',
        'src/acceptance/'
      ).split(/\r?\n/).filter(Boolean);

      expect(changedFiles).toEqual(['src/acceptance/fixture.ts']);
      const evaluatedOnCandidate = pr8WasEvaluatedOnCandidate(
        acceptedSha,
        candidateSha,
        candidateSha,
        changedFiles,
        true,
        'b'.repeat(64)
      );
      expect(evaluatedOnCandidate).toBe(false);
      const report = finalize({
        gates: allPassingGates().map(gate =>
          gate.id === 'RG-13'
            ? { ...gate, status: evaluatedOnCandidate ? 'PASS' : 'BLOCKED' }
            : gate
        )
      });
      expect(report.gates.find(gate => gate.id === 'RG-13')?.status).toBe('BLOCKED');
    } finally {
      rmSync(repository, { recursive: true, force: true });
    }
  });

  it('rejects PR-8 linkage when a supplied candidate does not match the Git-tested SHA', () => {
    const sha = 'a'.repeat(40);
    expect(pr8WasEvaluatedOnCandidate(
      sha,
      sha,
      'c'.repeat(40),
      [],
      true,
      'b'.repeat(64)
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
    expect(releasePolicyIsValid({
      ...policy,
      pr8: {
        ...policy.pr8,
        revisionComparisonPaths: ['src/acceptance/']
      }
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
