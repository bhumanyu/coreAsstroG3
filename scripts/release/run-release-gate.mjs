import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = resolve(root, 'artifacts/release');
const logsDirectory = resolve(outputDirectory, 'logs');
const manifestPath = resolve(outputDirectory, 'manifest.json');
const testReportPath = resolve(outputDirectory, 'test-report.json');
const acceptanceReportPath = resolve(outputDirectory, 'pr8-acceptance.json');
const fixtureResultsPath = resolve(outputDirectory, 'calculation-fixture-results.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const preflightErrors = [];
const limitations = [
  'Independent Swiss Ephemeris / JPL Horizons reference parity is BLOCKED.',
  'Owner-gated non-dusthana mechanism families are BLOCKED.',
  'PR-8 report-renderer and AppController async-state surfaces are BLOCKED.'
];
const commands = [];
const skippedTests = [];

function runGit(args, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd: root,
    encoding: encoding === 'buffer' ? null : encoding,
    maxBuffer: 512 * 1024 * 1024
  });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    preflightErrors.push(`${label} could not be read: ${error.message}`);
    return undefined;
  }
}

function getVersion(value) {
  return typeof value === 'string' ? value.trim().replace(/^v/, '') : '';
}

function expectedNpmVersion(packageJson) {
  const packageManager = packageJson?.packageManager;
  if (typeof packageManager === 'string' && packageManager.startsWith('npm@')) {
    return packageManager.slice('npm@'.length);
  }
  return typeof packageJson?.engines?.npm === 'string' ? packageJson.engines.npm : '';
}

function readGitValue(args) {
  try {
    return runGit(args).trim();
  } catch (error) {
    preflightErrors.push(`git ${args.join(' ')} failed: ${error.message}`);
    return null;
  }
}

function extractSkippedTests(value) {
  const found = new Set();
  const visited = new Set();
  const walk = (item) => {
    if (!item || typeof item !== 'object' || visited.has(item)) return;
    visited.add(item);
    if (Array.isArray(item)) {
      item.forEach(walk);
      return;
    }

    const record = item;
    const status = typeof record.status === 'string' ? record.status.toLowerCase() : '';
    if (['skip', 'skipped', 'pending'].includes(status)) {
      const name = typeof record.fullName === 'string'
        ? record.fullName
        : [
          ...(Array.isArray(record.ancestorTitles) ? record.ancestorTitles : []),
          record.title
        ].filter(part => typeof part === 'string').join(' > ');
      if (name) found.add(name);
    }
    Object.values(record).forEach(walk);
  };
  walk(value);
  return [...found].sort();
}

function recordCommand(name, args, extraEnvironment = {}) {
  const index = String(commands.length + 1).padStart(2, '0');
  const logRelativePath = `artifacts/release/logs/${index}-${name}.log`;
  const logPath = resolve(root, logRelativePath);
  mkdirSync(dirname(logPath), { recursive: true });
  const startedAt = Date.now();
  const started = process.hrtime.bigint();
  const result = spawnSync(npmCommand, args, {
    cwd: root,
    env: { ...process.env, ...extraEnvironment },
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    shell: process.platform === 'win32'
  });
  const finishedAt = Date.now();
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  writeFileSync(logPath, output, 'utf8');
  const command = {
    name,
    argv: [npmCommand, ...args],
    exitCode: result.status,
    signal: result.signal ?? null,
    durationMs: Math.round(durationMs),
    startedAt,
    finishedAt,
    logPath: logRelativePath,
    ...(result.error ? { error: result.error.message } : {})
  };
  commands.push(command);
  return { ...command, passed: result.status === 0 && result.signal === null && !result.error };
}

function resolvePr8Statuses(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((domainResult) => {
    if (!domainResult || !Array.isArray(domainResult.gates)) return [];
    return domainResult.gates.map((gate) => ({
      name: gate.name,
      status: ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(gate.status) ? gate.status : 'FAIL',
      coverageStatus: gate.status === 'PASS'
        ? 'PASSED'
        : gate.status === 'BLOCKED'
          ? 'BLOCKED'
          : 'NOT_TESTED',
      details: `PR-8 ${domainResult.domain ?? 'unknown'} production acceptance output.`
    }));
  });
}

function isPr8AcceptanceReport(value) {
  const allowedStatuses = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);
  return Array.isArray(value)
    && value.length === 2
    && new Set(value.map(result => result?.domain)).size === 2
    && value.some(result => result?.domain === 'CAREER')
    && value.some(result => result?.domain === 'WEALTH')
    && value.every(result =>
      (result.domain === 'CAREER' || result.domain === 'WEALTH')
      && (result.reportStatus === 'PASS' || result.reportStatus === 'FAIL')
      && Array.isArray(result.gates)
      && result.gates.every(gate =>
        gate
        && typeof gate === 'object'
        && typeof gate.name === 'string'
        && allowedStatuses.has(gate.status)
      )
    );
}

function recomputeMissingCalculationCoverage(fixtures, coveragePolicy) {
  const missing = coveragePolicy.requiredKinds.filter(
    kind => !fixtures.some(fixture => fixture.kind === kind)
  );
  for (const planet of coveragePolicy.requiredPlanets) {
    if (!fixtures.some(fixture =>
      fixture.kind === 'PLANETARY_LONGITUDE' && String(fixture.input?.planet) === planet
    )) missing.push(`PLANETARY_LONGITUDE:${planet}`);
  }

  for (const scenario of coveragePolicy.requiredMotionScenarios) {
    if (!fixtures.some(fixture =>
      fixture.kind === 'PLANETARY_MOTION' && fixture.scenario === scenario
    )) missing.push(`PLANETARY_MOTION:${scenario}`);
  }

  const groups = new Map();
  const seenBoundaryTuples = new Set();
  for (const fixture of fixtures.filter(item =>
    item.kind === 'SIGN_BOUNDARY' || item.kind === 'NAKSHATRA_BOUNDARY'
  )) {
    const boundaryKind = fixture.kind === 'SIGN_BOUNDARY' ? 'SIGN' : fixture.boundaryKind;
    const boundaryId = fixture.boundaryId;
    const position = fixture.boundaryPosition;
    const tuple = `${boundaryKind}:${boundaryId}:${position}`;
    if (seenBoundaryTuples.has(tuple)) missing.push(`DUPLICATE_BOUNDARY_POSITION:${tuple}`);
    seenBoundaryTuples.add(tuple);
    const key = `${boundaryKind}:${boundaryId}`;
    groups.set(key, [...(groups.get(key) ?? []), fixture]);
  }
  for (const boundaryKind of coveragePolicy.requiredBoundaryKinds) {
    const groupsOfKind = [...groups.entries()].filter(([key]) => key.startsWith(`${boundaryKind}:`));
    if (groupsOfKind.length === 0) {
      missing.push(`BOUNDARY_TRIPLET:${boundaryKind}:EPSILON_BEFORE/EXACT/EPSILON_AFTER`);
      continue;
    }
    for (const [key, items] of groupsOfKind) {
      const byPosition = new Map(items.map(item => [item.boundaryPosition, item]));
      if (coveragePolicy.requiredBoundaryPositions.some(position => !byPosition.has(position))) {
        missing.push(`BOUNDARY_TRIPLET:${key}:EPSILON_BEFORE/EXACT/EPSILON_AFTER`);
        continue;
      }
      const before = byPosition.get('EPSILON_BEFORE');
      const exact = byPosition.get('EXACT');
      const after = byPosition.get('EPSILON_AFTER');
      const boundary = exact?.boundaryLongitude;
      if (!Number.isFinite(boundary)
        || before?.input?.longitude === undefined
        || exact?.input?.longitude !== boundary
        || after?.input?.longitude === undefined
        || !(before.input.longitude < exact.input.longitude
          && exact.input.longitude < after.input.longitude)
        || items.some(item => item.boundaryLongitude !== boundary)) {
        missing.push(`BOUNDARY_ORDER:${key}:input longitudes must be strictly ordered around boundaryLongitude`);
      }
    }
  }

  for (const chartType of coveragePolicy.requiredVargaTypes) {
    if (!fixtures.some(fixture =>
      fixture.kind === 'VARGA_LONGITUDE' && String(fixture.input?.chartType) === chartType
    )) missing.push(`VARGA_LONGITUDE:${chartType}`);
  }
  return missing;
}

function addGate(gates, id, status, summary, evidence = []) {
  gates.push({
    id,
    status,
    summary,
    evidence
  });
}

const evidenceManifest = {
  commands: [],
  files: [],
  fixtureComparisons: [],
  policyDocuments: []
};

function commandLogEvidence(command) {
  if (!command) return [];
  const record = {
    name: command.name,
    logPath: command.logPath,
    exitCode: command.exitCode
  };
  if (!evidenceManifest.commands.some(item => item.name === record.name)) {
    evidenceManifest.commands.push(record);
  }
  return [{
    kind: 'COMMAND_LOG',
    commandName: command.name,
    logPath: command.logPath
  }];
}

function fileSha256Evidence(path, kind = 'FILE_SHA256') {
  const absolutePath = resolve(root, path);
  if (!existsSync(absolutePath)) return [];
  const reference = { path, sha256: sha256(readFileSync(absolutePath)) };
  if (kind === 'POLICY_DOCUMENT') {
    evidenceManifest.policyDocuments.push(reference);
    return [{ kind, ...reference }];
  }
  evidenceManifest.files.push(reference);
  return [{ kind, ...reference }];
}

function fixtureComparisonEvidence(path, invocationId, fixtureIds, commandPassed) {
  const absolutePath = resolve(root, path);
  if (!existsSync(absolutePath)) return [];
  const reference = {
    path,
    sha256: sha256(readFileSync(absolutePath)),
    invocationId,
    fixtureIds,
    commandPassed
  };
  evidenceManifest.fixtureComparisons.push(reference);
  return commandPassed
    ? [{
      kind: 'FIXTURE_COMPARISON',
      path,
      sha256: reference.sha256,
      invocationId,
      fixtureIds
    }]
    : [];
}

let candidateSha = process.env.PR9_EXPECTED_SHA ?? null;
let testedSha = null;
let treeSha = null;
let candidateTreeSha = null;
let testedTreeSha = null;
let sourceArchiveSha256 = null;
let packageLockSha256 = null;
let packageJsonSha256 = null;
let workingTreeClean = false;
let nodeVersionMatches = false;
let npmVersionMatches = false;
let fixtureCount;
let calculationFixtures;
let missingCalculationCoverage = [];
let calculationFixtureResults;
let calculationFixtureResultsAvailable = false;
let policy;
let requiredGateIds;
let releaseReportModule;
let releaseTypesModule;
let testReportStartTime;
let testReportValid = false;
let pr8ReportSha256 = null;
let acceptanceFilesChangedSince = [];
let pr8EvaluatedOnCandidate = false;
let pr8ImplementationSha = null;
let pr8RevisionComparisonPaths = [];
let fixtureInvocationId = null;
let toolchainNodeExpected = '';
let toolchainNpmExpected = '';

mkdirSync(logsDirectory, { recursive: true });
for (const stalePath of [testReportPath, acceptanceReportPath, fixtureResultsPath]) {
  if (existsSync(stalePath)) unlinkSync(stalePath);
}
const packageJsonPath = resolve(root, 'package.json');
const packageLockPath = resolve(root, 'package-lock.json');
const nvmrcPath = resolve(root, '.nvmrc');
const packageJson = readJson(packageJsonPath, 'package.json');
policy = readJson(resolve(root, 'docs/release/release-policy.json'), 'release policy');

try {
  packageJsonSha256 = sha256(readFileSync(packageJsonPath));
} catch (error) {
  preflightErrors.push(`package.json hash failed: ${error.message}`);
}
try {
  packageLockSha256 = sha256(readFileSync(packageLockPath));
} catch (error) {
  preflightErrors.push(`package-lock.json hash failed: ${error.message}`);
}
try {
  toolchainNodeExpected = getVersion(readFileSync(nvmrcPath, 'utf8'));
} catch (error) {
  preflightErrors.push(`.nvmrc could not be read: ${error.message}`);
}
toolchainNpmExpected = expectedNpmVersion(packageJson);
if (typeof policy?.pr8?.acceptedImplementationRevision === 'string') {
  pr8ImplementationSha = policy.pr8.acceptedImplementationRevision;
} else {
  preflightErrors.push('Release policy must declare pr8.acceptedImplementationRevision.');
}
if (Array.isArray(policy?.pr8?.revisionComparisonPaths)
  && policy.pr8.revisionComparisonPaths.length > 0
  && policy.pr8.revisionComparisonPaths.every(path => typeof path === 'string')) {
  pr8RevisionComparisonPaths = policy.pr8.revisionComparisonPaths;
} else {
  preflightErrors.push('Release policy must declare PR-8 revisionComparisonPaths.');
}

testedSha = readGitValue(['rev-parse', 'HEAD']);
if (!candidateSha) {
  preflightErrors.push('PR9_EXPECTED_SHA is required; candidate revision is never inferred.');
} else if (!/^[0-9a-f]{40}$/i.test(candidateSha)) {
  preflightErrors.push('PR9_EXPECTED_SHA must be a full 40-character commit SHA.');
} else {
  candidateSha = candidateSha.toLowerCase();
}
if (testedSha && candidateSha && testedSha.toLowerCase() !== candidateSha) {
  preflightErrors.push(`Candidate SHA ${candidateSha} does not match tested SHA ${testedSha}.`);
}

if (candidateSha) candidateTreeSha = readGitValue(['rev-parse', `${candidateSha}^{tree}`]);
if (testedSha) testedTreeSha = readGitValue(['rev-parse', `${testedSha}^{tree}`]);
treeSha = testedTreeSha;
if (candidateTreeSha && testedTreeSha && candidateTreeSha !== testedTreeSha) {
  preflightErrors.push(`Candidate tree ${candidateTreeSha} does not match tested tree ${testedTreeSha}.`);
}

try {
  const archive = runGit(['archive', '--format=tar', testedSha], 'buffer');
  sourceArchiveSha256 = sha256(archive);
} catch (error) {
  preflightErrors.push(`Source archive hashing failed: ${error.message}`);
}

try {
  workingTreeClean = runGit(['status', '--porcelain=v1', '--untracked-files=all']).trim().length === 0;
  if (!workingTreeClean) preflightErrors.push('Working tree is not clean.');
} catch (error) {
  preflightErrors.push(`Working tree status check failed: ${error.message}`);
}

nodeVersionMatches = getVersion(process.version) === toolchainNodeExpected;
const installedNpmVersion = (() => {
  try {
    return execFileSync(npmCommand, ['--version'], {
      cwd: root,
      encoding: 'utf8',
      shell: process.platform === 'win32'
    }).trim();
  } catch (error) {
    preflightErrors.push(`npm version check failed: ${error.message}`);
    return '';
  }
})();
npmVersionMatches = installedNpmVersion === toolchainNpmExpected;
if (!nodeVersionMatches) {
  preflightErrors.push(`Node ${process.version} does not match required ${toolchainNodeExpected}.`);
}
if (!npmVersionMatches) {
  preflightErrors.push(`npm ${installedNpmVersion} does not match required ${toolchainNpmExpected}.`);
}

const prHeadSha = process.env.PR9_PR_HEAD_SHA ?? null;
const prMergeSha = process.env.PR9_PR_MERGE_SHA ?? null;
for (const [label, value] of [['PR head SHA', prHeadSha], ['PR merge SHA', prMergeSha]]) {
  if (value !== null && !/^[0-9a-f]{40}$/i.test(value)) {
    preflightErrors.push(`${label} must be a full 40-character commit SHA.`);
  }
}
if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
  if (!prHeadSha || !prMergeSha) {
    preflightErrors.push('Pull request runs require distinct PR head and merge SHA manifest fields.');
  } else if (!candidateSha || prHeadSha.toLowerCase() !== candidateSha) {
    preflightErrors.push('The PR head SHA does not match the candidate SHA.');
  }
}

if (candidateSha && pr8ImplementationSha && pr8RevisionComparisonPaths.length > 0) {
  try {
    if (!/^[0-9a-f]{40}$/i.test(pr8ImplementationSha)) {
      throw new Error('acceptedImplementationRevision must be a full commit SHA.');
    }
    runGit(['cat-file', '-e', `${pr8ImplementationSha}^{commit}`]);
    acceptanceFilesChangedSince = runGit([
      'diff',
      '--name-only',
      pr8ImplementationSha,
      candidateSha,
      '--',
      ...pr8RevisionComparisonPaths
    ]).split(/\r?\n/).filter(Boolean);
    const worktreeChanges = runGit([
      'diff',
      '--name-only',
      pr8ImplementationSha,
      '--',
      ...pr8RevisionComparisonPaths
    ]).split(/\r?\n/).filter(Boolean);
    const untrackedChanges = runGit([
      'ls-files',
      '--others',
      '--exclude-standard',
      '--',
      ...pr8RevisionComparisonPaths
    ]).split(/\r?\n/).filter(Boolean);
    acceptanceFilesChangedSince = [...new Set([
      ...acceptanceFilesChangedSince,
      ...worktreeChanges,
      ...untrackedChanges
    ])].sort();
  } catch (error) {
    preflightErrors.push(`PR-8 accepted revision comparison failed: ${error.message}`);
    acceptanceFilesChangedSince = ['<comparison-failed>'];
  }
}

const tagName = process.env.PR9_TAG_NAME;
if (process.env.GITHUB_REF_TYPE === 'tag' && !tagName) {
  preflightErrors.push('Tag runs require PR9_TAG_NAME for the tag-to-candidate check.');
}
if (tagName) {
  try {
    const tagCommit = runGit(['rev-parse', `refs/tags/${tagName}^{commit}`]).trim();
    const pointingTags = runGit(['tag', '--points-at', candidateSha ?? '']).split(/\r?\n/);
    const describedTag = runGit(['describe', '--exact-match', '--tags', candidateSha ?? '']).trim();
    if (!candidateSha || tagCommit.toLowerCase() !== candidateSha.toLowerCase()
      || !pointingTags.includes(tagName)
      || describedTag !== tagName) {
      preflightErrors.push(`Tag ${tagName} does not resolve to candidate SHA ${candidateSha ?? '(missing)'}.`);
    }
  } catch (error) {
    preflightErrors.push(`Tag verification failed for ${tagName}: ${error.message}`);
  }
}

try {
  const fixtureModule = await import('../../src/engine/validation/calculationReferenceFixtures.ts');
  calculationFixtures = fixtureModule.CALCULATION_REFERENCE_FIXTURES;
  if (!Array.isArray(calculationFixtures)) {
    preflightErrors.push('CALCULATION_REFERENCE_FIXTURES is not an array.');
  } else {
    fixtureCount = calculationFixtures.length;
    if (!policy?.calculationCoverage) {
      preflightErrors.push('Release policy must declare calculationCoverage.');
    } else {
      missingCalculationCoverage = recomputeMissingCalculationCoverage(
        calculationFixtures,
        policy.calculationCoverage
      );
    }
  }
} catch (error) {
  preflightErrors.push(`Calculation fixture inventory could not be loaded: ${error.message}`);
}
try {
  releaseTypesModule = await import('../../src/release/releaseGateTypes.ts');
  requiredGateIds = releaseTypesModule.REQUIRED_RELEASE_GATE_IDS;
} catch (error) {
  preflightErrors.push(`Required release-gate inventory could not be loaded: ${error.message}`);
}
try {
  releaseReportModule = await import('../../src/release/releaseGateReport.ts');
} catch (error) {
  preflightErrors.push(`Release report validation could not be loaded: ${error.message}`);
}

const cleanPreflight = preflightErrors.length === 0;
let typecheckCommand;
let testCommand;
let temporalCommand;
let acceptanceCommand;
let calculationCommand;
let buildCommand;
let bundleCommand;
let determinismCommand;
let testReport;
let pr8AcceptanceReport;
let pr8AcceptanceStatuses = [];

if (cleanPreflight) {
  typecheckCommand = recordCommand('typecheck', ['run', 'lint']);
  testCommand = recordCommand('unit-tests', [
    'test',
    '--',
    '--reporter=json',
    `--outputFile=${relative(root, testReportPath)}`
  ]);
  if (existsSync(testReportPath)) {
    testReport = readJson(testReportPath, 'Vitest test report');
    testReportValid = releaseReportModule?.isVitestJsonReport(testReport, {
      startedAt: testCommand.startedAt,
      finishedAt: testCommand.finishedAt
    }) === true;
    if (!testReportValid) {
      preflightErrors.push('Vitest test report has an unrecognized or malformed JSON shape.');
    } else {
      testReportStartTime = testReport.startTime;
      skippedTests.push(...extractSkippedTests(testReport));
    }
  } else {
    preflightErrors.push('Vitest did not produce artifacts/release/test-report.json.');
  }

  temporalCommand = recordCommand('temporal-validation', ['run', 'test:temporal-validation']);
  acceptanceCommand = recordCommand('pr8-production-acceptance', ['run', 'test:pr8-acceptance'], {
    PR9_ACCEPTANCE_REPORT_PATH: acceptanceReportPath
  });
  if (existsSync(acceptanceReportPath)) {
    pr8AcceptanceReport = readJson(acceptanceReportPath, 'PR-8 acceptance report');
    if (isPr8AcceptanceReport(pr8AcceptanceReport)) {
      pr8AcceptanceStatuses = resolvePr8Statuses(pr8AcceptanceReport);
    } else {
      preflightErrors.push('PR-8 acceptance report has an unrecognized or incomplete shape.');
    }
    try {
      pr8ReportSha256 = sha256(readFileSync(acceptanceReportPath));
    } catch (error) {
      preflightErrors.push(`PR-8 acceptance report hash failed: ${error.message}`);
    }
    pr8EvaluatedOnCandidate = releaseReportModule?.pr8WasEvaluatedOnCandidate(
      pr8ImplementationSha,
      candidateSha,
      testedSha,
      acceptanceFilesChangedSince,
      acceptanceCommand.passed && isPr8AcceptanceReport(pr8AcceptanceReport),
      pr8ReportSha256
    ) === true;
  } else {
    preflightErrors.push('PR-8 acceptance probe did not produce an output report.');
  }

  fixtureInvocationId = randomUUID();
  calculationCommand = recordCommand(
    'calculation-validation',
    ['run', 'test:calculation-validation'],
    {
      PR9_FIXTURE_RESULTS_PATH: fixtureResultsPath,
      PR9_FIXTURE_INVOCATION_ID: fixtureInvocationId
    }
  );
  if (calculationCommand.passed && existsSync(fixtureResultsPath)) {
    const resultFileStat = statSync(fixtureResultsPath);
    const fixtureReport = readJson(fixtureResultsPath, 'Calculation fixture results');
    calculationFixtureResultsAvailable = fixtureReport?.invocationId === fixtureInvocationId
      && Array.isArray(fixtureReport.results)
      && resultFileStat.mtimeMs >= calculationCommand.startedAt
      && resultFileStat.mtimeMs <= calculationCommand.finishedAt;
    if (calculationFixtureResultsAvailable) {
      calculationFixtureResults = fixtureReport.results;
    } else {
      preflightErrors.push('Calculation fixture results do not correlate to this successful command invocation.');
    }
  }
  buildCommand = recordCommand('production-build', ['run', 'build']);
  bundleCommand = recordCommand('bundle-tests', ['run', 'test:bundle']);
  determinismCommand = recordCommand('dasha-determinism', [
    'exec',
    '--',
    'vitest',
    'run',
    'src/engine/dasha/invariants/dashaDeterminism.test.ts'
  ]);
}

let fixtureCountToReport = fixtureCount;
const gates = [];
const pr8ReportPresent = isPr8AcceptanceReport(pr8AcceptanceReport);
const pr8BaselinesPassed = pr8ReportPresent
  && pr8AcceptanceReport.every(result => result.reportStatus === 'PASS');
const policyIsValid = releaseReportModule?.releasePolicyIsValid(policy, requiredGateIds ?? []) === true;
const policyFileEvidence = fileSha256Evidence(
  'docs/release/release-policy.json',
  'POLICY_DOCUMENT'
);
addGate(
  gates,
  'RG-01',
  policyIsValid ? 'PASS' : 'FAIL',
  'Release policy and required gate inventory.',
  policyIsValid ? policyFileEvidence : []
);
const releaseInputEvidence = [
  ...fileSha256Evidence('.nvmrc'),
  ...fileSha256Evidence('package.json'),
  ...fileSha256Evidence('package-lock.json')
];
addGate(
  gates,
  'RG-02',
  cleanPreflight ? 'PASS' : 'FAIL',
  preflightErrors.join(' ') || 'Exact revision and toolchain verified.',
  cleanPreflight ? releaseInputEvidence : []
);
addGate(gates, 'RG-03', buildCommand && bundleCommand
  ? (buildCommand.passed && bundleCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Production build and bundle verification.', [
  ...commandLogEvidence(buildCommand),
  ...commandLogEvidence(bundleCommand)
]);
addGate(
  gates,
  'RG-04',
  typecheckCommand ? (typecheckCommand.passed ? 'PASS' : 'FAIL') : 'NOT_RUN',
  'Type checking.',
  commandLogEvidence(typecheckCommand)
);
addGate(
  gates,
  'RG-05',
  testCommand ? (testCommand.passed ? 'PASS' : 'FAIL') : 'NOT_RUN',
  'Repository test suite.',
  commandLogEvidence(testCommand)
);
const skippedTestStatus = releaseReportModule?.skippedTestsGateStatus(
  Boolean(testCommand),
  testReportValid ? testReport : undefined,
  skippedTests,
  Array.isArray(policy?.allowedSkippedTests) ? policy.allowedSkippedTests : [],
  testCommand ? { startedAt: testCommand.startedAt, finishedAt: testCommand.finishedAt } : undefined
) ?? 'FAIL';
addGate(
  gates,
  'RG-06',
  skippedTestStatus,
  `Actual skipped tests: ${skippedTests.length}; test report startTime: ${testReportStartTime ?? 'unavailable'}.`,
  testReportValid ? fileSha256Evidence(relative(root, testReportPath)) : []
);
addGate(gates, 'RG-07', acceptanceCommand
  ? (acceptanceCommand.passed && pr8BaselinesPassed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'PR-8 golden acceptance production baselines.',
acceptanceCommand?.passed && pr8BaselinesPassed && pr8ReportSha256
  ? fileSha256Evidence(relative(root, acceptanceReportPath))
  : []);
addGate(gates, 'RG-08', temporalCommand
  ? (temporalCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Temporal calculation validation.', commandLogEvidence(temporalCommand));
const calculationGateStatus = !Array.isArray(calculationFixtures)
  ? 'FAIL'
  : releaseReportModule?.calculationFixtureGateStatus(
      calculationFixtures,
      calculationFixtureResultsAvailable ? calculationFixtureResults : undefined,
      missingCalculationCoverage,
      calculationCommand?.passed === true
    ) ?? 'FAIL';
addGate(gates, 'RG-09', calculationGateStatus,
  `Approved calculation reference fixtures: ${fixtureCount ?? 'unknown'}; independently recomputed missing coverage: ${missingCalculationCoverage.length}.`,
calculationFixtureResultsAvailable && fixtureInvocationId
  ? fixtureComparisonEvidence(
    relative(root, fixtureResultsPath),
    fixtureInvocationId,
    calculationFixtureResults.map(result => result.fixtureId),
    calculationCommand?.passed === true
  )
  : []);
addGate(gates, 'RG-10', 'BLOCKED', 'Independent Swiss/JPL reference parity is not approved.');
addGate(gates, 'RG-11', 'BLOCKED', 'Owner-gated non-dusthana mechanism coverage is not approved.');
addGate(gates, 'RG-12', determinismCommand
  ? (determinismCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Dasha determinism validation.', commandLogEvidence(determinismCommand));
const pr8GateStatus = !pr8EvaluatedOnCandidate
  ? 'BLOCKED'
  : acceptanceCommand && !acceptanceCommand.passed
    ? 'FAIL'
    : pr8ReportPresent
      ? pr8BaselinesPassed ? 'BLOCKED' : 'FAIL'
      : 'BLOCKED';
addGate(
  gates,
  'RG-13',
  pr8GateStatus,
  pr8EvaluatedOnCandidate
    ? 'Consumes candidate-linked PR-8 output; retained adapter blockers remain.'
    : 'BLOCKED: PR-8 implementation/report linkage is missing or acceptance files changed since the approved implementation.',
  pr8EvaluatedOnCandidate && pr8ReportSha256
    ? fileSha256Evidence(relative(root, acceptanceReportPath))
    : []
);
const limitationDocumentEvidence = [
  ...fileSha256Evidence('docs/release/RELEASE_LIMITATIONS.md', 'POLICY_DOCUMENT'),
  ...fileSha256Evidence('docs/release/CALCULATION_VALIDATION_MATRIX.md', 'POLICY_DOCUMENT')
];
addGate(gates, 'RG-14', policyIsValid
  && existsSync(resolve(root, 'docs/release/RELEASE_LIMITATIONS.md'))
  && existsSync(resolve(root, 'docs/release/CALCULATION_VALIDATION_MATRIX.md'))
  ? 'PASS'
  : 'FAIL', 'Release limitations and excluded capabilities documented.',
policyIsValid
  && existsSync(resolve(root, 'docs/release/RELEASE_LIMITATIONS.md'))
  && existsSync(resolve(root, 'docs/release/CALCULATION_VALIDATION_MATRIX.md'))
  ? limitationDocumentEvidence
  : []);

let releaseReport;
let releaseReportError;
try {
  const validatedRunnerResult = releaseReportModule.createValidatedRunnerResult({
    gates,
    ...(fixtureCountToReport === undefined ? {} : { fixtureCount: fixtureCountToReport }),
    pr8AcceptanceStatuses: pr8EvaluatedOnCandidate ? pr8AcceptanceStatuses : [],
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceRevision: testedSha ?? 'unavailable'
    }
  }, evidenceManifest);
  releaseReport = releaseReportModule.finalizeReleaseReport(validatedRunnerResult);
} catch (error) {
  releaseReportError = error.message;
  preflightErrors.push(`Release report aggregation failed: ${error.message}`);
}

const manifest = {
  testedRevisionKind: process.env.GITHUB_EVENT_NAME === 'pull_request'
    ? 'PR_HEAD'
    : process.env.GITHUB_EVENT_NAME === 'workflow_dispatch'
      ? 'WORKFLOW_DISPATCH_SHA'
      : tagName
        ? 'TAG_COMMIT'
        : 'EXPLICIT_SHA',
  candidateSha,
  testedSha,
  treeSha,
  candidateTreeSha,
  testedTreeSha,
  sourceArchiveSha256,
  packageLockSha256,
  packageJsonSha256,
  workingTreeClean,
  nodeVersion: process.version,
  expectedNodeVersion: toolchainNodeExpected,
  nodeVersionMatches,
  npmVersion: installedNpmVersion,
  expectedNpmVersion: toolchainNpmExpected,
  npmVersionMatches,
  platform: process.platform,
  arch: process.arch,
  ...(prHeadSha === null ? {} : { prHeadSha }),
  ...(prMergeSha === null ? {} : { prMergeSha }),
  pr8: {
    implementationSha: pr8ImplementationSha,
    revisionComparisonPaths: pr8RevisionComparisonPaths,
    reportSha256: pr8ReportSha256,
    evaluatedOnCandidate: pr8EvaluatedOnCandidate,
    ...(acceptanceFilesChangedSince.length > 0 ? { acceptanceFilesChangedSince } : {})
  },
  commands,
  evidenceManifest,
  ...(pr8AcceptanceReport === undefined ? {} : { pr8AcceptanceReport }),
  limitations,
  skippedTests,
  testReportStartTime: testReportStartTime ?? null,
  fixtureCount: fixtureCount ?? null,
  missingCalculationCoverage,
  gateResults: releaseReport?.gates ?? gates,
  preflightErrors,
  ...(releaseReportError ? { releaseReportError } : {}),
  ...(releaseReport ? { releaseReport, status: releaseReport.status } : { status: 'FAIL' })
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Release manifest: ${relative(root, manifestPath)}`);
console.log(`Release status: ${manifest.status}`);
if (releaseReport?.canRelease !== true) process.exitCode = 1;
