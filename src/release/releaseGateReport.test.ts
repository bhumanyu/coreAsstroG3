import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  aggregateReleaseStatus,
  calculationFixtureGateStatus,
  calculationFixtureInventoryHash,
  canonicalJson,
  canonicalizeRunnerEvidenceManifest,
  createValidatedRunnerResult,
  digestRunnerEvidenceManifest,
  finalizeReleaseReport,
  isVitestJsonReport,
  pr8WasEvaluatedOnCandidate,
  releasePolicyIsValid,
  verifyReleaseReportEvidenceManifest,
  verifyEvidenceManifestDigest,
  fixtureResultsCorrelateToCommand,
  harnessDependencyInventoryIssues,
  harnessDependencyGraphDifferences,
  type CalculationFixtureInventoryItem,
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
  CALCULATION_REFERENCE_FIXTURES,
  CALCULATION_COVERAGE_POLICY,
  inspectBoundaryCoverage
} from '../engine/validation/calculationReferenceFixtures';

const evidencePath = 'src/release/releaseGateReport.test.ts';
const evidenceSha = createHash('sha256')
  .update(readFileSync(resolve(process.cwd(), evidencePath)))
  .digest('hex');
const packageSha = createHash('sha256')
  .update(readFileSync(resolve(process.cwd(), 'package.json')))
  .digest('hex');
const testEvidenceManifest: RunnerEvidenceManifest = {
  commands: [...new Set([
    ...Object.values(RELEASE_GATE_EVIDENCE_KIND).flatMap(requirement => requirement.commandNames ?? []),
    'report-adapter', 'controller-adapter'
  ])].map(name => ({
    name,
    logPath: evidencePath,
    exitCode: 0
  })),
  files: [{ path: evidencePath, sha256: evidenceSha }, { path: 'package.json', sha256: packageSha }],
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
const fixtureEnvelope = (
  fixtures: readonly unknown[],
  results: readonly Record<string, unknown>[],
  overrides: Record<string, unknown> = {}
) => ({
  schemaVersion: 1,
  invocationId: 'invocation-1',
  candidateSha: null,
  fixtureInventoryHash: calculationFixtureInventoryHash(fixtures),
  expectedFixtureCount: fixtures.length,
  completedFixtureCount: fixtures.length,
  suiteCompleted: true,
  command: { startedAt: 100, finishedAt: 190 },
  results,
  ...overrides
});

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
    const reorderedManifest: RunnerEvidenceManifest = {
      fixtureComparisons: testEvidenceManifest.fixtureComparisons.map(item => ({
        commandPassed: item.commandPassed,
        fixtureIds: [...item.fixtureIds].reverse(),
        invocationId: item.invocationId,
        sha256: item.sha256,
        path: item.path
      })).reverse(),
      files: [...testEvidenceManifest.files].reverse().map(item => ({
        sha256: item.sha256,
        path: item.path
      })),
      commands: [...testEvidenceManifest.commands].reverse().map(item => ({
        exitCode: item.exitCode,
        logPath: item.logPath,
        name: item.name
      })),
      policyDocuments: [...testEvidenceManifest.policyDocuments].reverse().map(item => ({
        sha256: item.sha256,
        path: item.path
      }))
    };
    const digest = digestRunnerEvidenceManifest(testEvidenceManifest);
    expect(digest).toEqual(digestRunnerEvidenceManifest(reorderedManifest));
    expect(canonicalizeRunnerEvidenceManifest(testEvidenceManifest))
      .toBe(canonicalizeRunnerEvidenceManifest(reorderedManifest));
    const manifestWithMultipleFixtureIds: RunnerEvidenceManifest = {
      ...testEvidenceManifest,
      commands: [
        ...testEvidenceManifest.commands,
        { name: 'another-command', logPath: evidencePath, exitCode: 0 }
      ],
      files: [
        ...testEvidenceManifest.files,
        { path: 'package.json', sha256: evidenceSha }
      ],
      fixtureComparisons: testEvidenceManifest.fixtureComparisons.map(item => ({
        ...item,
        fixtureIds: ['fixture-2', 'fixture-1']
      })).concat([{
        path: 'another-fixture-results.json',
        sha256: evidenceSha,
        invocationId: 'invocation-2',
        fixtureIds: ['fixture-4', 'fixture-3'],
        commandPassed: true
      }]),
      policyDocuments: [
        ...testEvidenceManifest.policyDocuments,
        { path: 'docs/other-policy.json', sha256: evidenceSha }
      ]
    };
    const reversedManifest: RunnerEvidenceManifest = {
      commands: [...manifestWithMultipleFixtureIds.commands].reverse(),
      files: [...manifestWithMultipleFixtureIds.files].reverse(),
      fixtureComparisons: [...manifestWithMultipleFixtureIds.fixtureComparisons]
        .reverse()
        .map(item => ({ ...item, fixtureIds: [...item.fixtureIds].reverse() })),
      policyDocuments: [...manifestWithMultipleFixtureIds.policyDocuments].reverse()
    };
    expect(digestRunnerEvidenceManifest(manifestWithMultipleFixtureIds))
      .toEqual(digestRunnerEvidenceManifest(reversedManifest));
    expect(report.evidenceManifestIntegrity).toEqual(digest);
    expect(report.evidenceManifestSchemaVersion).toBe(1);
    expect(report.evidenceManifestSha256).toBe(digest.digest);
    expect(canonicalJson({ b: 2, a: { y: 1, x: 0 } }))
      .toBe(canonicalJson({ a: { x: 0, y: 1 }, b: 2 }));
    expect(verifyReleaseReportEvidenceManifest(report, reorderedManifest)).toBe(true);
    expect(verifyEvidenceManifestDigest(report, reorderedManifest)).toBe(true);
    expect(verifyReleaseReportEvidenceManifest(report, {
      ...reorderedManifest,
      files: [{ ...reorderedManifest.files[0], sha256: '0'.repeat(64) }]
    })).toBe(false);
    expect(verifyEvidenceManifestDigest(report, {
      ...reorderedManifest,
      files: [{ ...reorderedManifest.files[0], sha256: '0'.repeat(64) }]
    })).toBe(false);
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
    const result = {
      fixtureId: fixture.id,
      kind: fixture.kind,
      invocationId: 'invocation-1',
      operationId: 'generatePlanetaryPositions:PLANETARY_LONGITUDE:independent-1',
      compared: true,
      passed: true
    };
    const envelope = fixtureEnvelope([fixture], [result]);
    expect(calculationFixtureGateStatus([fixture], undefined, [], true, 'invocation-1', null))
      .toBe('BLOCKED');
    expect(calculationFixtureGateStatus([fixture], envelope, [], true, 'invocation-1', null)).toBe('PASS');
    expect(calculationFixtureGateStatus([fixture], envelope, [], false, 'invocation-1', null))
      .toBe('BLOCKED');
    expect(calculationFixtureGateStatus([{
      ...fixture,
      provenance: {
        ...fixture.provenance,
        independenceStatement: 'Expected value derived from engine output.'
      }
    }], fixtureEnvelope([{
      ...fixture,
      provenance: {
        ...fixture.provenance,
        independenceStatement: 'Expected value derived from engine output.'
      }
    }], [result]), [], true, 'invocation-1', null)).toBe('FAIL');
    expect(calculationFixtureGateStatus([fixture], fixtureEnvelope([fixture], [{
      ...result,
      invocationId: 'stale-invocation'
    }]), [], true, 'invocation-1', null)).toBe('FAIL');
    expect(calculationFixtureGateStatus([fixture], fixtureEnvelope([fixture], [{
      ...result,
      operationId: 'wrong-operation'
    }]), [], true, 'invocation-1', null)).toBe('FAIL');
    expect(calculationFixtureGateStatus(
      [fixture],
      fixtureEnvelope([fixture], [result], { suiteCompleted: undefined }),
      [],
      true,
      'invocation-1',
      null
    )).toBe('BLOCKED');
    expect(calculationFixtureGateStatus(
      [fixture],
      fixtureEnvelope([fixture], [result], { completedFixtureCount: 0 }),
      [],
      true,
      'invocation-1',
      null
    )).toBe('BLOCKED');
    expect(calculationFixtureGateStatus(
      [fixture],
      fixtureEnvelope([fixture], [result], { invocationId: 'stale-envelope-invocation' }),
      [],
      true,
      'invocation-1',
      null
    )).toBe('BLOCKED');
    expect(calculationFixtureGateStatus(
      [fixture],
      fixtureEnvelope([fixture], [result, result]),
      [],
      true,
      'invocation-1',
      null
    )).toBe('FAIL');
    const staleResultsCorrelate = fixtureResultsCorrelateToCommand(
      envelope,
      [fixture],
      'invocation-1',
      null,
      true,
      250,
      100,
      200
    );
    expect(staleResultsCorrelate).toBe(false);
    expect(calculationFixtureGateStatus(
      [fixture],
      staleResultsCorrelate ? envelope : undefined,
      [],
      true,
      'invocation-1',
      null
    )).toBe('BLOCKED');
  });

  it('requires boundary expectations to carry independently approved, non-engine provenance', () => {
    const boundaryFixture = {
      id: 'approved-boundary',
      kind: 'SIGN_BOUNDARY',
      entryPoint: 'calculateSign',
      expectedSign: 'ARIES',
      boundaryLongitude: 30,
      boundaryId: 'SIGN-30',
      boundaryPosition: 'EPSILON_BEFORE',
      input: { longitude: 29.99999 },
      provenance: {
        sourceType: 'PUBLISHED_REFERENCE',
        independentlyProduced: true,
        sourceName: 'Independent published reference',
        citation: 'Boundary table',
        sourceVersion: '1',
        methodology: 'Published sign boundary convention',
        coordinateConvention: 'sidereal longitude',
        timeStandard: 'not applicable',
        ayanamsa: 'not applicable',
        nodeConvention: 'not applicable',
        tolerance: '0.00001 degrees',
        toleranceRationale: 'Approved boundary fixture',
        independenceStatement: 'Expected value was not derived from engine output.',
        retrievedAt: '2026-10-01',
        approvedBy: 'Reviewer',
        approvedAt: '2026-10-02'
      }
    };
    const result = {
      fixtureId: boundaryFixture.id,
      kind: boundaryFixture.kind,
      invocationId: 'invocation-1',
      operationId: 'calculateSign:SIGN_BOUNDARY:approved-boundary',
      compared: true,
      passed: true
    };
    const currentBoundaryFixtures = CALCULATION_REFERENCE_FIXTURES.filter(fixture =>
      fixture.kind === 'SIGN_BOUNDARY' || fixture.kind === 'NAKSHATRA_BOUNDARY'
    );
    expect(currentBoundaryFixtures.every(fixture =>
      fixture.provenance.independentlyProduced === true
      && fixture.provenance.independenceStatement.toLowerCase().includes('not derived from engine output')
    )).toBe(true);
    expect(calculationFixtureGateStatus(
      [boundaryFixture],
      fixtureEnvelope([boundaryFixture], [result]),
      [],
      true,
      'invocation-1',
      null
    )).toBe('PASS');
    const engineDerivedBoundary = {
      ...boundaryFixture,
      provenance: {
        ...boundaryFixture.provenance,
        independenceStatement: 'Expected value was generated from engine output.'
      }
    };
    expect(calculationFixtureGateStatus(
      [engineDerivedBoundary],
      fixtureEnvelope([engineDerivedBoundary], [result]),
      [],
      true,
      'invocation-1',
      null
    )).toBe('FAIL');
  });

  it('blocks stale or failed fixture-result files outside the command window', () => {
    const fixtures: CalculationFixtureInventoryItem[] = [];
    const report = fixtureEnvelope(fixtures, []);
    expect(fixtureResultsCorrelateToCommand(report, fixtures, 'invocation-1', null, true, 250, 100, 200))
      .toBe(false);
    expect(fixtureResultsCorrelateToCommand(report, fixtures, 'invocation-1', null, false, 150, 100, 200))
      .toBe(false);
    expect(fixtureResultsCorrelateToCommand(report, fixtures, 'invocation-1', null, true, 150, 100, 200))
      .toBe(true);
    expect(fixtureResultsCorrelateToCommand(
      { ...report, suiteCompleted: undefined },
      fixtures,
      'invocation-1',
      null,
      true,
      150,
      100,
      200
    )).toBe(false);
    expect(fixtureResultsCorrelateToCommand(
      { ...report, completedFixtureCount: 1 },
      fixtures,
      'invocation-1',
      null,
      true,
      150,
      100,
      200
    )).toBe(false);
    expect(fixtureResultsCorrelateToCommand(
      { ...report, invocationId: 'stale-invocation' },
      fixtures,
      'invocation-1',
      null,
      true,
      150,
      100,
      200
    )).toBe(false);
  });

  it('rejects missing or uncovered declared harness dependency paths', () => {
    const repository = mkdtempSync(join(tmpdir(), 'harness-dependencies-'));
    try {
      mkdirSync(join(repository, 'src', 'acceptance'), { recursive: true });
      mkdirSync(join(repository, 'src', 'aliased'), { recursive: true });
      writeFileSync(join(repository, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          baseUrl: '.',
          paths: { '@core/*': ['src/aliased/*'] }
        }
      }));
      writeFileSync(
        join(repository, 'src', 'acceptance', 'entry.ts'),
        "import type { Payload } from '@core/dependency'; export type Entry = Payload;\n"
      );
      writeFileSync(join(repository, 'src', 'aliased', 'dependency.ts'), 'export interface Payload {}\n');
      const tsconfig = ts.readConfigFile(join(repository, 'tsconfig.json'), ts.sys.readFile);
      const compilerOptions = ts.parseJsonConfigFileContent(
        tsconfig.config,
        ts.sys,
        repository
      ).options;
      const resolved = ts.resolveModuleName(
        '@core/dependency',
        join(repository, 'src', 'acceptance', 'entry.ts'),
        compilerOptions,
        ts.sys
      ).resolvedModule;
      expect(resolved).toBeDefined();
      const aliasedDependency = relative(repository, resolved!.resolvedFileName).replace(/\\/g, '/');
      expect(harnessDependencyInventoryIssues(
        repository,
        ['src/acceptance/'],
        ['src/acceptance/entry.ts', aliasedDependency]
      )).toContain(`UNDECLARED_HARNESS_DEPENDENCY:${aliasedDependency}`);
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
      expect(harnessDependencyInventoryIssues(
        repository,
        ['src/acceptance/'],
        ['src/aliased/dependency.ts']
      )).toContain('UNDECLARED_HARNESS_DEPENDENCY:src/aliased/dependency.ts');
      expect(harnessDependencyGraphDifferences(
        { dependencies: ['src/acceptance/entry.ts'], edges: [] },
        { dependencies: ['src/acceptance/entry.ts', 'src/aliased/dependency.ts'], edges: [] }
      )).toEqual(['ADDED_DEPENDENCY:src/aliased/dependency.ts']);
      expect(harnessDependencyGraphDifferences(
        {
          dependencies: ['src/acceptance/entry.ts', 'src/aliased/dependency.ts'],
          edges: ['src/acceptance/entry.ts -> src/aliased/dependency.ts (type)']
        },
        {
          dependencies: ['src/acceptance/entry.ts'],
          edges: []
        }
      )).toEqual([
        'REMOVED_DEPENDENCY:src/aliased/dependency.ts',
        'REMOVED_EDGE:src/acceptance/entry.ts -> src/aliased/dependency.ts (type)'
      ]);
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
      boundaryLongitude: number,
      expectedBefore: Record<string, string | number>,
      expectedAfter: Record<string, string | number>
    ) => {
      const base = {
        kind,
        ...(boundaryKind === undefined ? {} : { boundaryKind }),
        boundaryId,
        boundaryLongitude,
        boundaryDefinition: {
          name: boundaryId,
          longitude: boundaryLongitude,
          convention: { coordinateFrame: 'SIDEREAL', ayanamsa: 'LAHIRI' }
        },
        conventions: { coordinateFrame: 'SIDEREAL', ayanamsa: 'LAHIRI' },
        provenance: { expectedValuesProducedIndependently: true }
      };
      const epsilon = 0.00001;
      return [
        {
          ...base,
          ...expectedBefore,
          boundaryPosition: 'EPSILON_BEFORE',
          input: { longitude: boundaryLongitude - epsilon }
        },
        {
          ...base,
          ...expectedAfter,
          boundaryPosition: 'EXACT',
          input: { longitude: boundaryLongitude }
        },
        {
          ...base,
          ...expectedAfter,
          boundaryPosition: 'EPSILON_AFTER',
          input: { longitude: boundaryLongitude + epsilon }
        }
      ];
    };
    const fixtures = [
      ...makeTriplet(
        'SIGN_BOUNDARY',
        undefined,
        'SIGN-30',
        30,
        { expectedSign: 'ARIES' },
        { expectedSign: 'TAURUS' }
      ),
      ...makeTriplet(
        'NAKSHATRA_BOUNDARY',
        'NAKSHATRA',
        'NAKSHATRA-13.3333333333',
        360 / 27,
        { expectedNakshatra: 'ASHWINI', expectedPada: 4 },
        { expectedNakshatra: 'BHARANI', expectedPada: 1 }
      ),
      ...makeTriplet(
        'NAKSHATRA_BOUNDARY',
        'PADA',
        'PADA-3.3333333333',
        360 / 108,
        { expectedPada: 1, expectedNakshatra: 'ASHWINI' },
        { expectedPada: 2, expectedNakshatra: 'ASHWINI' }
      )
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
      'BOUNDARY_DIRECTION:NAKSHATRA:NAKSHATRA-13.3333333333:nakshatra values must transition in increasing-longitude order'
    );
    expect(inspectBoundaryCoverage(fixtures.map(item =>
      item.kind === 'SIGN_BOUNDARY'
        ? {
          ...item,
          expectedSign: item.boundaryPosition === 'EPSILON_BEFORE' ? 'TAURUS' : 'ARIES'
        }
        : item
    ), CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_DIRECTION:SIGN:SIGN-30:sign values must transition in increasing-longitude order'
    );
    expect(inspectBoundaryCoverage(fixtures.map(item =>
      item.kind === 'SIGN_BOUNDARY'
        ? {
          ...item,
          provenance: { expectedValuesProducedIndependently: false }
        }
        : item
    ), CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_PROVENANCE:SIGN:SIGN-30:expectedValuesProducedIndependently must be true'
    );
    expect(inspectBoundaryCoverage(fixtures.map(item =>
      item.kind === 'SIGN_BOUNDARY'
        ? { ...item, boundaryDefinition: { ...item.boundaryDefinition, longitude: 60 } }
        : item
    ), CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_IDENTITY:SIGN:SIGN-30:definition must match the declared longitude and coordinate convention'
    );
    expect(inspectBoundaryCoverage(fixtures.map(item =>
      item.kind === 'SIGN_BOUNDARY'
        ? { ...item, expectedSign: 'ARIES' }
        : item
    ), CALCULATION_COVERAGE_POLICY)).toContain(
      'BOUNDARY_TRANSITION:SIGN:SIGN-30:expectedSign must differ before and after'
    );
    const nakshatraFixtures = fixtures.filter(item =>
      item.kind === 'NAKSHATRA_BOUNDARY' && item.boundaryKind === 'NAKSHATRA'
    );
    const expectNakshatraDirectionIssue = (items: readonly Record<string, unknown>[]) => {
      expect(inspectBoundaryCoverage(items as never, CALCULATION_COVERAGE_POLICY))
        .toContain(
          'BOUNDARY_DIRECTION:NAKSHATRA:NAKSHATRA-13.3333333333:nakshatra values must transition in increasing-longitude order'
        );
    };
    expectNakshatraDirectionIssue(nakshatraFixtures.map(item =>
      item.boundaryPosition === 'EXACT' ? { ...item, expectedPada: 2 } : item
    ));
    expectNakshatraDirectionIssue(nakshatraFixtures.map(item =>
      item.boundaryPosition === 'EXACT' ? { ...item, expectedPada: undefined } : item
    ));
    expectNakshatraDirectionIssue(nakshatraFixtures.map(item =>
      item.boundaryPosition === 'EPSILON_BEFORE' ? { ...item, expectedPada: 3 } : item
    ));
  });

  it('validates boundary classifications across the zero-degree wraparound', () => {
    const makeWrapTriplet = (
      kind: string,
      boundaryKind: string | undefined,
      boundaryId: string,
      expectedBefore: Record<string, string | number>,
      expectedAtAndAfter: Record<string, string | number>
    ) => {
      const base = {
        kind,
        ...(boundaryKind === undefined ? {} : { boundaryKind }),
        boundaryId,
        boundaryLongitude: 0,
        boundaryDefinition: {
          name: boundaryId,
          longitude: 0,
          convention: { coordinateFrame: 'SIDEREAL', ayanamsa: 'LAHIRI' }
        },
        conventions: { coordinateFrame: 'SIDEREAL', ayanamsa: 'LAHIRI' },
        provenance: { expectedValuesProducedIndependently: true }
      };
      return [
        {
          ...base,
          ...expectedBefore,
          boundaryPosition: 'EPSILON_BEFORE',
          input: { longitude: 359.99999 }
        },
        {
          ...base,
          ...expectedAtAndAfter,
          boundaryPosition: 'EXACT',
          input: { longitude: 0 }
        },
        {
          ...base,
          ...expectedAtAndAfter,
          boundaryPosition: 'EPSILON_AFTER',
          input: { longitude: 0.00001 }
        }
      ];
    };
    const wrapFixtures = [
      ...makeWrapTriplet(
        'SIGN_BOUNDARY',
        undefined,
        'SIGN-0',
        { expectedSign: 'PISCES' },
        { expectedSign: 'ARIES' }
      ),
      ...makeWrapTriplet(
        'NAKSHATRA_BOUNDARY',
        'NAKSHATRA',
        'NAKSHATRA-0',
        { expectedNakshatra: 'REVATI', expectedPada: 4 },
        { expectedNakshatra: 'ASHWINI', expectedPada: 1 }
      ),
      ...makeWrapTriplet(
        'NAKSHATRA_BOUNDARY',
        'PADA',
        'PADA-0',
        { expectedNakshatra: 'REVATI', expectedPada: 4 },
        { expectedNakshatra: 'ASHWINI', expectedPada: 1 }
      )
    ];
    expect(inspectBoundaryCoverage(wrapFixtures, CALCULATION_COVERAGE_POLICY)).toEqual([]);
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
        harnessDependencyWaivers: [{
          path: 'src/aliased/dependency.ts',
          reason: 'Reviewed exception',
          approver: 'Reviewer',
          approvedAt: '2026-10-01T00:00:00Z',
          expiresAt: '2027-01-01T00:00:00Z'
        }]
      }
    }, REQUIRED_RELEASE_GATE_IDS)).toBe(false);
    expect(releasePolicyIsValid({
      ...policy,
      pr8: {
        ...policy.pr8,
        harnessDependencyWaivers: [{
          path: 'src/aliased/dependency.ts',
          reason: 'Reviewed exception',
          approver: 'Reviewer',
          approvedAt: '2026-10-01T00:00:00Z',
          expiresAt: '2027-01-01T00:00:00Z'
        }]
      },
      policyVersion: RELEASE_POLICY_VERSION + 1
    }, REQUIRED_RELEASE_GATE_IDS)).toBe(true);
    expect(releasePolicyIsValid({
      ...policy,
      pr8: {
        ...policy.pr8,
        harnessDependencyWaivers: [{
          path: 'src/aliased/dependency.ts',
          reason: '',
          approver: 'Reviewer',
          approvedAt: 'not-a-date',
          reviewCondition: ''
        }]
      },
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

  it('blocks RG-13 when required PR-8 surfaces lack exact-revision evidence', () => {
    const report = finalize({
      gates: allPassingGates(),
      fixtureCount: 1,
      metadata: { sourceRevision: 'a'.repeat(40) },
      pr8AcceptanceStatuses: [
        { name: 'report-renderer', status: 'BLOCKED', coverageStatus: 'NOT_TESTED', details: 'No exact-revision evidence supplied.' },
        { name: 'AppController async-state', status: 'BLOCKED', coverageStatus: 'NOT_TESTED', details: 'No exact-revision evidence supplied.' }
      ]
    });

    expect(report.gates.find(gate => gate.id === 'RG-13')?.status).toBe('BLOCKED');
    expect(report.pr8AcceptanceStatuses.every(status => status.status === 'BLOCKED')).toBe(true);
    expect(report.canRelease).toBe(false);
  });

  it('passes RG-13 only when both required surfaces have exact-SHA adapter, browser, CI and artifact evidence', () => {
    const sha = 'a'.repeat(40);
    const evidence = [
      {
        name: 'report-renderer',
        status: 'PASS' as const,
        coverageStatus: 'PASSED' as const,
        testedSha: sha,
        ciRunId: '42760000000',
        ciRunUrl: 'https://github.com/example/repo/actions/runs/42760000000',
        evidenceReferences: [evidencePath, 'package.json']
      },
      {
        name: 'AppController async-state',
        status: 'PASS' as const,
        coverageStatus: 'PASSED' as const,
        testedSha: sha,
        ciRunId: '42760000000',
        ciRunUrl: 'https://github.com/example/repo/actions/runs/42760000000',
        evidenceReferences: [evidencePath, 'package.json']
      }
    ];
    const report = finalize({
      gates: allPassingGates(),
      fixtureCount: 1,
      metadata: { sourceRevision: sha },
      pr8AcceptanceStatuses: evidence
    });

    expect(report.gates.find(gate => gate.id === 'RG-13')?.status).toBe('PASS');
    expect(report.pr8AcceptanceStatuses.every(status => status.status === 'PASS')).toBe(true);
  });

  it('does not pass RG-13 when acceptance evidence belongs to a different SHA', () => {
    const sha = 'a'.repeat(40);
    const evidence = ['report-renderer', 'AppController async-state'].map(name => ({
      name,
      status: 'PASS' as const,
      coverageStatus: 'PASSED' as const,
      testedSha: 'b'.repeat(40),
      ciRunId: '42760000000',
      ciRunUrl: 'https://github.com/example/repo/actions/runs/42760000000',
      evidenceReferences: ['adapter.log', 'browser-report.json']
    }));
    expect(() => finalize({
      gates: allPassingGates(),
      fixtureCount: 1,
      metadata: { sourceRevision: sha },
      pr8AcceptanceStatuses: evidence
    })).toThrow(/cannot claim PASS without exact-revision CI, command-log and file evidence/);
  });

  it('fails closed when the same required PR-8 surface is reported more than once', () => {
    const sha = 'a'.repeat(40);
    const passing = {
      name: 'report-renderer',
      status: 'PASS' as const,
      coverageStatus: 'PASSED' as const,
      testedSha: sha,
      ciRunId: '42760000000',
      ciRunUrl: 'https://github.com/example/repo/actions/runs/42760000000',
      evidenceReferences: [evidencePath, 'package.json']
    };
    const report = finalize({
      gates: allPassingGates(),
      fixtureCount: 1,
      metadata: { sourceRevision: sha },
      pr8AcceptanceStatuses: [
        passing,
        { ...passing, status: 'BLOCKED' as const, coverageStatus: 'BLOCKED' as const },
        { ...passing, name: 'AppController async-state' }
      ]
    });

    expect(report.gates.find(gate => gate.id === 'RG-13')?.status).toBe('BLOCKED');
    expect(report.pr8AcceptanceStatuses.find(status => status.name === 'report-renderer')?.status).toBe('BLOCKED');
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
