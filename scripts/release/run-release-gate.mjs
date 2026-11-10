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
import { calculateMissingCalculationCoverage } from './calculationCoverage.mjs';
import { computeHarnessImportGraph as computeRevisionImportGraph } from './harnessImportGraph.mjs';

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

function computeHarnessImportGraph(revision, entryPoint) {
  return computeRevisionImportGraph(root, revision, entryPoint);
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
  const commandEnvironment = { ...extraEnvironment };
  if (name === 'calculation-validation') {
    commandEnvironment.PR9_FIXTURE_COMMAND_STARTED_AT = String(startedAt);
  }
  const result = spawnSync(npmCommand, args, {
    cwd: root,
    env: { ...process.env, ...commandEnvironment },
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
let declaredPr8RevisionComparisonPaths = [];
let pr8RevisionComparisonPaths = [];
let harnessDependencyPaths = [];
let harnessDependencyIssues = [];
let acceptedHarnessGraph = null;
let candidateHarnessGraph = null;
let harnessGraphRevisionDifferences = [];
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
  declaredPr8RevisionComparisonPaths = policy.pr8.revisionComparisonPaths;
  pr8RevisionComparisonPaths = declaredPr8RevisionComparisonPaths;
} else {
  preflightErrors.push('Release policy must declare PR-8 revisionComparisonPaths.');
}
if (typeof policy?.pr8?.harnessEntryPoint === 'string') {
  try {
    if (!candidateSha) throw new Error('Candidate SHA is required to compute its import graph.');
    candidateHarnessGraph = computeHarnessImportGraph(candidateSha, policy.pr8.harnessEntryPoint);
    if (!pr8ImplementationSha) throw new Error('Accepted PR-8 revision is not configured.');
    acceptedHarnessGraph = computeHarnessImportGraph(
      pr8ImplementationSha,
      policy.pr8.harnessEntryPoint
    );
    harnessDependencyPaths = candidateHarnessGraph.dependencies;
  } catch (error) {
    preflightErrors.push(`PR-8 harness import graph could not be computed: ${error.message}`);
  }
} else {
  preflightErrors.push('Release policy must declare pr8.harnessEntryPoint.');
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
      if (JSON.stringify(policy.calculationCoverage)
        !== JSON.stringify(fixtureModule.CALCULATION_COVERAGE_POLICY)) {
        preflightErrors.push('Runner policy differs from the fixture module coverage policy.');
      }
      missingCalculationCoverage = calculateMissingCalculationCoverage(
        calculationFixtures,
        fixtureModule.CALCULATION_COVERAGE_POLICY,
        fixtureModule.inspectBoundaryCoverage
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
if (releaseReportModule && acceptedHarnessGraph && candidateHarnessGraph) {
  harnessGraphRevisionDifferences = releaseReportModule.harnessDependencyGraphDifferences(
    acceptedHarnessGraph,
    candidateHarnessGraph
  );
  if (harnessGraphRevisionDifferences.length > 0) {
    preflightErrors.push(
      `PR-8 harness dependency graph differs between accepted and candidate revisions: ${harnessGraphRevisionDifferences.join('; ')}`
    );
  }
  harnessDependencyIssues = releaseReportModule.harnessDependencyInventoryIssues(
    root,
    declaredPr8RevisionComparisonPaths,
    harnessDependencyPaths,
    policy?.pr8?.harnessDependencyWaivers ?? []
  );
  const acceptedInventoryIssues = releaseReportModule.harnessDependencyInventoryIssues(
    root,
    declaredPr8RevisionComparisonPaths,
    acceptedHarnessGraph?.dependencies ?? [],
    policy?.pr8?.harnessDependencyWaivers ?? []
  );
  harnessDependencyIssues = [...harnessDependencyIssues, ...acceptedInventoryIssues];
  if (harnessDependencyIssues.length > 0) {
    preflightErrors.push(
      `PR-8 revision-comparison inventory does not cover harness dependencies: ${harnessDependencyIssues.join(', ')}`
    );
  }
  const runtimeLoadLimitations = [
    ...(acceptedHarnessGraph?.runtimeLoadLimitations ?? []),
    ...(candidateHarnessGraph?.runtimeLoadLimitations ?? [])
  ];
  const dependencyWaivers = policy?.pr8?.harnessDependencyWaivers ?? [];
  for (const limitation of runtimeLoadLimitations) {
    const filePath = limitation.split(':')[0];
    if (!dependencyWaivers.some(waiver => waiver?.path === filePath)) {
      preflightErrors.push(
        `Runtime-loaded dependency ${limitation} requires an approved structured path waiver.`
      );
    }
  }
}

const cleanPreflight = preflightErrors.length === 0;
let typecheckCommand;
let testCommand;
let temporalCommand;
let acceptanceCommand;
let controllerAcceptanceCommand;
let reportAcceptanceCommand;
let browserAcceptanceCommand;
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

  controllerAcceptanceCommand = recordCommand('app-controller-acceptance', [
    'exec', '--', 'vitest', 'run', 'src/acceptance/appControllerAcceptanceAdapter.test.ts'
  ]);
  reportAcceptanceCommand = recordCommand('report-renderer-acceptance', [
    'exec', '--', 'vitest', 'run', 'src/acceptance/productAnalysisReportAcceptanceAdapter.test.tsx'
  ]);
  browserAcceptanceCommand = recordCommand('browser-acceptance', ['run', 'test:e2e:critical']);

  const workflowRunId = process.env.GITHUB_RUN_ID ?? null;
  const workflowRunUrl = workflowRunId && process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${workflowRunId}`
    : null;

  const createSurfaceStatus = (name, adapterCommand) => {
    if (adapterCommand) commandLogEvidence(adapterCommand);
    if (browserAcceptanceCommand) commandLogEvidence(browserAcceptanceCommand);
    const browserReportEvidence = fileSha256Evidence('test-results/e2e-results.json');
    const evidenceReferences = [
      adapterCommand?.logPath,
      browserAcceptanceCommand?.logPath,
      ...(browserReportEvidence.length > 0 ? ['test-results/e2e-results.json'] : [])
    ].filter(Boolean);
    const commandFailed = Boolean(
      (adapterCommand && !adapterCommand.passed)
      || (browserAcceptanceCommand && !browserAcceptanceCommand.passed)
    );
    const evidenceComplete = Boolean(
      adapterCommand?.passed
      && browserAcceptanceCommand?.passed
      && browserReportEvidence.length > 0
      && candidateSha
      && testedSha === candidateSha
      && workflowRunId
      && workflowRunUrl
    );
    const status = commandFailed ? 'FAIL' : evidenceComplete ? 'PASS' : 'BLOCKED';
    return {
      name,
      status,
      coverageStatus: status === 'PASS' ? 'PASSED' : status === 'FAIL' ? 'BLOCKED' : 'NOT_TESTED',
      details: evidenceComplete
        ? 'Adapter and all required Chromium journeys passed on the exact candidate revision.'
        : 'BLOCKED until adapter, Chromium journey, exact revision, CI identity and report evidence are all present.',
      ...(candidateSha ? { testedSha: candidateSha } : {}),
      ...(workflowRunId ? { ciRunId: workflowRunId } : {}),
      ...(workflowRunUrl ? { ciRunUrl: workflowRunUrl } : {}),
      evidenceReferences
    };
  };

  pr8AcceptanceStatuses = [
    ...pr8AcceptanceStatuses,
    createSurfaceStatus('AppController async-state', controllerAcceptanceCommand),
    createSurfaceStatus('report-renderer', reportAcceptanceCommand)
  ];

  pr8EvaluatedOnCandidate = releaseReportModule?.pr8WasEvaluatedOnCandidate(
    pr8ImplementationSha,
    candidateSha,
    testedSha,
    acceptanceFilesChangedSince,
    acceptanceCommand?.passed === true
      && controllerAcceptanceCommand?.passed === true
      && reportAcceptanceCommand?.passed === true
      && browserAcceptanceCommand?.passed === true
      && isPr8AcceptanceReport(pr8AcceptanceReport),
    pr8ReportSha256
  ) === true;

  fixtureInvocationId = randomUUID();
  calculationCommand = recordCommand(
    'calculation-validation',
    ['run', 'test:calculation-validation'],
    {
      PR9_FIXTURE_RESULTS_PATH: fixtureResultsPath,
      PR9_FIXTURE_INVOCATION_ID: fixtureInvocationId,
      PR9_EXPECTED_SHA: candidateSha
    }
  );
  if (existsSync(fixtureResultsPath)) {
    const resultFileStat = statSync(fixtureResultsPath);
    const fixtureReport = readJson(fixtureResultsPath, 'Calculation fixture results');
    calculationFixtureResultsAvailable = releaseReportModule?.fixtureResultsCorrelateToCommand(
      fixtureReport,
      calculationFixtures ?? [],
      fixtureInvocationId,
      candidateSha,
      calculationCommand.passed,
      resultFileStat.mtimeMs,
      calculationCommand.startedAt,
      calculationCommand.finishedAt
    ) === true;
    if (!calculationFixtureResultsAvailable) {
      preflightErrors.push('Calculation fixture results do not correlate to this successful command invocation.');
    }
    calculationFixtureResults = fixtureReport;
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
      calculationCommand?.passed === true,
      fixtureInvocationId ?? '',
      candidateSha
    ) ?? 'FAIL';
addGate(gates, 'RG-09', calculationGateStatus,
  `Approved calculation reference fixtures: ${fixtureCount ?? 'unknown'}; independently recomputed missing coverage: ${missingCalculationCoverage.length}.`,
calculationFixtureResultsAvailable && fixtureInvocationId
  ? fixtureComparisonEvidence(
    relative(root, fixtureResultsPath),
    fixtureInvocationId,
    calculationFixtureResults.results.map(result => result.fixtureId),
    calculationCommand?.passed === true
  )
  : []);
addGate(gates, 'RG-10', 'BLOCKED', 'Independent Swiss/JPL reference parity is not approved.');
addGate(gates, 'RG-11', 'BLOCKED', 'Owner-gated non-dusthana mechanism coverage is not approved.');
addGate(gates, 'RG-12', determinismCommand
  ? (determinismCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Dasha determinism validation.', commandLogEvidence(determinismCommand));
const requiredPr8SurfaceNames = ['report-renderer', 'AppController async-state'];
const requiredPr8SurfacesPassed = requiredPr8SurfaceNames.every(name => {
  const surface = pr8AcceptanceStatuses.find(item => item.name === name);
  return surface?.status === 'PASS' && surface.coverageStatus === 'PASSED';
});
const allPr8AcceptanceStatusesPassed = pr8AcceptanceStatuses.length > 0
  && pr8AcceptanceStatuses.every(item => item.status === 'PASS' && item.coverageStatus === 'PASSED');
const pr8GateStatus = !pr8EvaluatedOnCandidate
  ? 'BLOCKED'
  : [controllerAcceptanceCommand, reportAcceptanceCommand, browserAcceptanceCommand].some(command => command && !command.passed)
    || (acceptanceCommand && !acceptanceCommand.passed)
    || (pr8ReportPresent && !pr8BaselinesPassed)
      ? 'FAIL'
      : pr8ReportPresent && pr8BaselinesPassed && requiredPr8SurfacesPassed && allPr8AcceptanceStatusesPassed
        ? 'PASS'
        : 'BLOCKED';
const pr8GateEvidence = pr8EvaluatedOnCandidate && pr8ReportSha256
  ? [
    ...fileSha256Evidence(relative(root, acceptanceReportPath)),
    ...fileSha256Evidence('test-results/e2e-results.json')
  ]
  : [];
addGate(
  gates,
  'RG-13',
  pr8GateStatus,
  pr8GateStatus === 'PASS'
    ? 'All PR-8 domain and product surfaces passed candidate-linked adapter and Chromium acceptance.'
    : !pr8EvaluatedOnCandidate
      ? 'BLOCKED: accepted PR-8 implementation baseline has not been explicitly reconciled with this candidate.'
      : 'BLOCKED: required PR-8 surfaces lack complete exact-revision adapter, browser, CI or artifact evidence.',
  pr8GateEvidence
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
  if (!releaseReportModule.verifyEvidenceManifestDigest(releaseReport, evidenceManifest)) {
    throw new Error('Evidence manifest digest verification failed during final report assembly.');
  }
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
    declaredRevisionComparisonPaths: declaredPr8RevisionComparisonPaths,
    harnessEntryPoint: policy?.pr8?.harnessEntryPoint ?? null,
    harnessDependencyPaths,
    harnessDependencyIssues,
    harnessGraphRevisionDifferences,
    acceptedHarnessGraph: acceptedHarnessGraph
      ? {
        dependencyCount: acceptedHarnessGraph.dependencies.length,
        edgeCount: acceptedHarnessGraph.edges.length,
        runtimeLoadLimitations: acceptedHarnessGraph.runtimeLoadLimitations
      }
      : null,
    candidateHarnessGraph: candidateHarnessGraph
      ? {
        dependencyCount: candidateHarnessGraph.dependencies.length,
        edgeCount: candidateHarnessGraph.edges.length,
        runtimeLoadLimitations: candidateHarnessGraph.runtimeLoadLimitations
      }
      : null,
    reportSha256: pr8ReportSha256,
    evaluatedOnCandidate: pr8EvaluatedOnCandidate,
    acceptanceSurfaceStatuses: pr8AcceptanceStatuses,
    ...(acceptanceFilesChangedSince.length > 0 ? { acceptanceFilesChangedSince } : {})
  },
  commands,
  evidenceManifest,
  evidenceManifestSchemaVersion: releaseReport?.evidenceManifestSchemaVersion ?? 1,
  evidenceManifestSha256: releaseReport?.evidenceManifestSha256 ?? null,
  evidenceManifestIntegrity: releaseReport?.evidenceManifestIntegrity ?? null,
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
