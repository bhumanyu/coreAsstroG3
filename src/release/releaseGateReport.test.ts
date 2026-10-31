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
  fixtureResultsCorrelateToCommand,
  harnessDependencyInventoryIssues,
  skippedTestsGateStatus
} from './releaseGateReport';
import {
  EXCLUDED_RELEASE_CAPABILITIES,
  RELEASE_POLICY_VERSION,
  RETAINED_RELEASE_BLOCKERS,
  REQUIRED_RELEASE_GATES,
  REQUIRED_RELEASE_GATE_IDS,
  RELEASE_GATE_EVIDENCE_KIND,
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
const testEvidenceManifest: RunnerEvidenceManifest = {
  commands: [...new Set(Object.values(RELEASE_GATE_EVIDENCE_KIND)
    .flatMap(requirement => requirement.commandNames ?? []))].map(name => ({
    name,
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
const evidenceFor = (id: keyof typeof RELEASE_GATE_EVIDENCE_KIND): ReleaseGateEvidence[] => {
  const requirement = RELEASE_GATE_EVIDENCE_KIND[id];
  switch (requirement.kind) {
    case 'COMMAND_LOG':
      return (requirement.commandNames ?? []).map(commandName => ({
        kind: 'COMMAND_LOG',
        commandName,
        logPath: evidencePath
      }));
    case 'FILE_SHA256':
      return [{ kind: 'FILE_SHA256', path: evidencePath, sha256: evidenceSha }];
    case 'FIXTURE_COMPARISON':
      return [{
        kind: 'FIXTURE_COMPARISON',
        path: evidencePath,
        sha256: evidenceSha,
        invocationId: 'invocation-1',
        fixtureIds: ['fixture-1']
      }];
    case 'POLICY_DOCUMENT':
      return [{ kind: 'POLICY_DOCUMENT', path: evidencePath, sha256: evidenceSha }];
    default:
      throw new Error(`Unknown release gate ${id}.`);
  }
};
const allPassingGates = (): ReleaseGateResult[] =>
  REQUIRED_RELEASE_GATE_IDS.map(id => ({ id, status: 'PASS', evidence: evidenceFor(id) }));
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

  it('rejects COMMAND_LOG evidence assigned to a different gate command', () => {
    const gates = allPassingGates().map(gate =>
      gate.id === 'RG-04'
        ? {
          ...gate,
          evidence: [{
            kind: 'COMMAND_LOG',
            commandName: 'bundle-tests',
            logPath: evidencePath
          }]
        }
        : gate
    );
    expect(() => createValidatedRunnerResult({ gates } as never, testEvidenceManifest))
      .toThrow('PASS gate RG-04 does not accept command bundle-tests.');
  });

  it('rejects a designated command missing from the evidence manifest', () => {
    const gates = allPassingGates();
    const manifest = {
      ...testEvidenceManifest,
      commands: testEvidenceManifest.commands.filter(command => command.name !== 'typecheck')
    };
    expect(() => createValidatedRunnerResult({ gates } as never, manifest))
      .toThrow('PASS gate RG-04 references evidence missing from the runner manifest.');
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

  it('records a digest of the evidence manifest in the finalized report', () => {
    const report = finalize({ gates: allPassingGates() });
    const expectedDigest = createHash('sha256')
      .update(JSON.stringify(testEvidenceManifest))
      .digest('hex');
    expect(report.evidenceManifestSha256).toBe(expectedDigest);
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
      entryPoint: 'generatePlanetaryPositions',
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
    expect(calculationFixtureGateStatus([fixture], [], [], true, 'invocation-1')).toBe('BLOCKED');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      invocationId: 'invocation-1',
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], true, 'invocation-1')).toBe('PASS');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      invocationId: 'invocation-1',
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], false, 'invocation-1')).toBe('BLOCKED');
    expect(calculationFixtureGateStatus([{
      ...fixture,
      provenance: {
        ...fixture.provenance,
        independenceStatement: 'Expected value derived from engine output.'
      }
    }], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      invocationId: 'invocation-1',
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], true, 'invocation-1')).toBe('FAIL');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      invocationId: 'stale-invocation',
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    }], [], true, 'invocation-1')).toBe('FAIL');
    expect(calculationFixtureGateStatus([fixture], [{
      fixtureId: fixture.id,
      kind: fixture.kind,
      invocationId: 'invocation-1',
      operationId: 'wrong-operation',
      compared: true,
      passed: true
    }], [], true, 'invocation-1')).toBe('FAIL');
    const staleResultsCorrelate = fixtureResultsCorrelateToCommand(
      { invocationId: 'invocation-1', results: [] },
      'invocation-1',
      true,
      250,
      100,
      200
    );
    expect(staleResultsCorrelate).toBe(false);
    expect(calculationFixtureGateStatus(
      [fixture],
      staleResultsCorrelate ? [] : undefined,
      [],
      true,
      'invocation-1'
    )).toBe('BLOCKED');
  });

  it('blocks stale or failed fixture-result files outside the command window', () => {
    const report = { invocationId: 'invocation-1', results: [] };
    expect(fixtureResultsCorrelateToCommand(report, 'invocation-1', true, 250, 100, 200))
      .toBe(false);
    expect(fixtureResultsCorrelateToCommand(report, 'invocation-1', false, 150, 100, 200))
      .toBe(false);
    expect(fixtureResultsCorrelateToCommand(report, 'invocation-1', true, 150, 100, 200))
      .toBe(true);
  });

  it('rejects missing or uncovered declared harness dependency paths', () => {
    const repository = mkdtempSync(join(tmpdir(), 'harness-dependencies-'));
    try {
      mkdirSync(join(repository, 'src', 'acceptance'), { recursive: true });
      writeFileSync(join(repository, 'src', 'acceptance', 'entry.ts'), 'export {};\n');
      expect(harnessDependencyInventoryIssues(
        repository,
        ['src/acceptance/'],
        ['src/acceptance/entry.ts']
      )).toEqual([]);
      expect(harnessDependencyInventoryIssues(
        repository,
        ['src/missing.ts'],
        ['src/acceptance/entry.ts']
      )).toContain('UNREADABLE_DECLARED_PATH:src/missing.ts');
      expect(harnessDependencyInventoryIssues(
        repository,
        ['src/acceptance/'],
        ['src/unlisted/dependency.ts']
      )).toContain('UNDECLARED_HARNESS_DEPENDENCY:src/unlisted/dependency.ts');
    } finally {
      rmSync(repository, { recursive: true, force: true });
    }
  });

  it('flags duplicate positions, out-of-range epsilon, and missing transitions', () => {
    const records = [
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EPSILON_BEFORE',
        boundaryLongitude: 10,
        expectedSign: 'ARIES',
        input: { longitude: 9.99999 }
      },
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EPSILON_BEFORE',
        boundaryLongitude: 10,
        expectedSign: 'ARIES',
        input: { longitude: 9.99998 }
      },
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EXACT',
        boundaryLongitude: 10,
        expectedSign: 'TAURUS',
        input: { longitude: 10 }
      },
      {
        kind: 'SIGN_BOUNDARY',
        boundaryId: 'SIGN-10',
        boundaryPosition: 'EPSILON_AFTER',
        boundaryLongitude: 10,
        expectedSign: 'TAURUS',
        input: { longitude: 10.00001 }
      }
    ];
    const issues = inspectBoundaryCoverage(records, CALCULATION_COVERAGE_POLICY);
    expect(issues).toContain('DUPLICATE_BOUNDARY_POSITION:SIGN:SIGN-10:EPSILON_BEFORE');
    expect(inspectBoundaryCoverage([
      records[0],
      records[2],
      { ...records[3], input: { longitude: 10.001 } }
    ], CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_EPSILON:SIGN:SIGN-10:before/after distances must be within 0.000001-0.0001 degrees'
    );
    expect(inspectBoundaryCoverage([
      records[0],
      records[2],
      { ...records[3], expectedSign: 'ARIES' }
    ], CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_TRANSITION:SIGN:SIGN-10:expectedSign must differ before and after'
    );
  });

  it('validates sign, nakshatra, and pada transition fields by boundary convention', () => {
    const makeTriplet = (
      kind: string,
      boundaryKind: string | undefined,
      boundaryId: string,
      expectedBefore: Record<string, string | number>,
      expectedAfter: Record<string, string | number>
    ) => {
      const base = {
        kind,
        ...(boundaryKind === undefined ? {} : { boundaryKind }),
        boundaryId,
        boundaryLongitude: 10
      };
      return [
        { ...base, ...expectedBefore, boundaryPosition: 'EPSILON_BEFORE', input: { longitude: 9.99999 } },
        { ...base, ...expectedAfter, boundaryPosition: 'EXACT', input: { longitude: 10 } },
        { ...base, ...expectedAfter, boundaryPosition: 'EPSILON_AFTER', input: { longitude: 10.00001 } }
      ];
    };
    const fixtures = [
      ...makeTriplet('SIGN_BOUNDARY', undefined, 'S-10', { expectedSign: 'ARIES' }, { expectedSign: 'TAURUS' }),
      ...makeTriplet('NAKSHATRA_BOUNDARY', 'NAKSHATRA', 'N-10', { expectedNakshatra: 'A' }, { expectedNakshatra: 'B' }),
      ...makeTriplet('NAKSHATRA_BOUNDARY', 'PADA', 'P-10', { expectedPada: 1 }, { expectedPada: 2 })
    ];
    expect(inspectBoundaryCoverage(fixtures, CALCULATION_COVERAGE_POLICY)).toEqual([]);
    expect(inspectBoundaryCoverage([
      ...fixtures.slice(0, 3),
      ...fixtures.slice(3, 6).map(item =>
        item.boundaryPosition === 'EPSILON_AFTER'
          ? { ...item, expectedNakshatra: 'A' }
          : item
      ),
      ...fixtures.slice(6)
    ], CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_TRANSITION:NAKSHATRA:N-10:expectedNakshatra must differ before and after'
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
      calculationCoverage: {
        ...policy.calculationCoverage,
        requiredMotionScenarios: ['PROGRADE', 'NEAR_STATIONARY']
      }
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
