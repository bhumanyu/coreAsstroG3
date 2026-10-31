import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
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
  const started = process.hrtime.bigint();
  const result = spawnSync(npmCommand, args, {
    cwd: root,
    env: { ...process.env, ...extraEnvironment },
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    shell: process.platform === 'win32'
  });
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  writeFileSync(logPath, output, 'utf8');
  const command = {
    name,
    argv: [npmCommand, ...args],
    exitCode: result.status,
    signal: result.signal ?? null,
    durationMs: Math.round(durationMs),
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

function addGate(gates, id, status, summary, evidence = []) {
  gates.push({
    id,
    status,
    summary,
    evidence
  });
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
let calculationReferenceGateStatus;
let calculationReferenceCoverageComplete;
let policy;
let requiredGateIds;
let toolchainNodeExpected = '';
let toolchainNpmExpected = '';

mkdirSync(logsDirectory, { recursive: true });
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
const mergeSha = process.env.PR9_MERGE_SHA ?? null;
for (const [label, value] of [['PR head SHA', prHeadSha], ['PR merge SHA', mergeSha]]) {
  if (value !== null && !/^[0-9a-f]{40}$/i.test(value)) {
    preflightErrors.push(`${label} must be a full 40-character commit SHA.`);
  }
}
if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
  if (!prHeadSha || !mergeSha) {
    preflightErrors.push('Pull request runs require distinct PR head and merge SHA manifest fields.');
  } else if (!candidateSha || prHeadSha.toLowerCase() !== candidateSha) {
    preflightErrors.push('The PR head SHA does not match the candidate SHA.');
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
  const fixtures = fixtureModule.CALCULATION_REFERENCE_FIXTURES;
  const calculationGate = fixtureModule.RG_09_CALCULATION_REFERENCE_GATE;
  if (!Array.isArray(fixtures)) {
    preflightErrors.push('CALCULATION_REFERENCE_FIXTURES is not an array.');
  } else {
    fixtureCount = fixtures.length;
  }
  if (!calculationGate || !['BLOCKED', 'READY'].includes(calculationGate.status)) {
    preflightErrors.push('RG_09_CALCULATION_REFERENCE_GATE has an invalid or missing status.');
  } else {
    calculationReferenceGateStatus = calculationGate.status;
    calculationReferenceCoverageComplete = calculationGate.coverageComplete === true;
    if (fixtureCount !== calculationGate.fixtureCount) {
      preflightErrors.push('Calculation gate fixture count does not match the fixture inventory.');
    }
    if (calculationGate.status === 'READY'
      && (fixtureCount === 0 || !calculationReferenceCoverageComplete)) {
      preflightErrors.push('RG-09 cannot be READY without fixtures and complete required coverage.');
    }
  }
} catch (error) {
  preflightErrors.push(`Calculation fixture inventory could not be loaded: ${error.message}`);
}
try {
  const releaseTypes = await import('../../src/release/releaseGateTypes.ts');
  requiredGateIds = releaseTypes.REQUIRED_RELEASE_GATE_IDS;
} catch (error) {
  preflightErrors.push(`Required release-gate inventory could not be loaded: ${error.message}`);
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
    skippedTests.push(...extractSkippedTests(testReport));
  } else {
    preflightErrors.push('Vitest did not produce artifacts/release/test-report.json.');
  }

  temporalCommand = recordCommand('temporal-validation', ['run', 'test:temporal-validation']);
  acceptanceCommand = recordCommand('pr8-production-acceptance', ['run', 'test:pr8-acceptance'], {
    PR9_ACCEPTANCE_REPORT_PATH: acceptanceReportPath
  });
  if (existsSync(acceptanceReportPath)) {
    pr8AcceptanceReport = readJson(acceptanceReportPath, 'PR-8 acceptance report');
    pr8AcceptanceStatuses = resolvePr8Statuses(pr8AcceptanceReport);
  } else {
    preflightErrors.push('PR-8 acceptance probe did not produce an output report.');
  }

  calculationCommand = recordCommand('calculation-validation', ['run', 'test:calculation-validation']);
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

let skippedTestsAllowed = false;
if (policy && Array.isArray(policy.allowedSkippedTests)) {
  const allowed = new Set(policy.allowedSkippedTests);
  skippedTestsAllowed = skippedTests.every(name => allowed.has(name));
}

let fixtureCountToReport = fixtureCount;
const gates = [];
const pr8ReportPresent = Array.isArray(pr8AcceptanceReport)
  && pr8AcceptanceReport.length === 2
  && pr8AcceptanceReport.every(
    result => (result.domain === 'CAREER' || result.domain === 'WEALTH')
      && Array.isArray(result.gates)
  );
const pr8BaselinesPassed = pr8ReportPresent
  && pr8AcceptanceReport.every(result => result.reportStatus === 'PASS');
const policyIsValid = policy
  && Array.isArray(policy.requiredGates)
  && Array.isArray(requiredGateIds)
  && policy.requiredGates.length === requiredGateIds.length
  && policy.requiredGates.every((gate, index) => gate.id === requiredGateIds[index])
  && Array.isArray(policy.allowedSkippedTests)
  && policy.allowedSkippedTests.length === 0;
addGate(gates, 'RG-01', policyIsValid ? 'PASS' : 'FAIL', 'Release policy and required gate inventory.');
addGate(gates, 'RG-02', cleanPreflight ? 'PASS' : 'FAIL', preflightErrors.join(' ') || 'Exact revision and toolchain verified.');
addGate(gates, 'RG-03', buildCommand && bundleCommand
  ? (buildCommand.passed && bundleCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Production build and bundle verification.');
addGate(gates, 'RG-04', typecheckCommand ? (typecheckCommand.passed ? 'PASS' : 'FAIL') : 'NOT_RUN', 'Type checking.');
addGate(gates, 'RG-05', testCommand ? (testCommand.passed ? 'PASS' : 'FAIL') : 'NOT_RUN', 'Repository test suite.');
addGate(gates, 'RG-06', !testCommand
  ? 'NOT_RUN'
  : !testReport || !skippedTestsAllowed
    ? 'FAIL'
    : 'PASS', `Actual skipped tests: ${skippedTests.length}.`, skippedTests);
addGate(gates, 'RG-07', acceptanceCommand
  ? (acceptanceCommand.passed && pr8BaselinesPassed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'PR-8 golden acceptance production baselines.');
addGate(gates, 'RG-08', temporalCommand
  ? (temporalCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Temporal calculation validation.');
const calculationGateStatus = fixtureCount === undefined
  || calculationReferenceGateStatus === undefined
  ? 'FAIL'
  : fixtureCount === 0 || calculationReferenceGateStatus === 'BLOCKED'
    ? 'BLOCKED'
    : calculationReferenceCoverageComplete
      ? calculationCommand
        ? (calculationCommand.passed ? 'PASS' : 'FAIL')
        : 'NOT_RUN'
      : 'FAIL';
addGate(gates, 'RG-09', calculationGateStatus,
  `Approved calculation reference fixtures: ${fixtureCount ?? 'unknown'}; reference gate: ${calculationReferenceGateStatus ?? 'unknown'}; required coverage: ${calculationReferenceCoverageComplete ? 'complete' : 'incomplete'}.`);
addGate(gates, 'RG-10', 'BLOCKED', 'Independent Swiss/JPL reference parity is not approved.');
addGate(gates, 'RG-11', 'BLOCKED', 'Owner-gated non-dusthana mechanism coverage is not approved.');
addGate(gates, 'RG-12', determinismCommand
  ? (determinismCommand.passed ? 'PASS' : 'FAIL')
  : 'NOT_RUN', 'Dasha determinism validation.');
addGate(gates, 'RG-13', acceptanceCommand
  ? (acceptanceCommand.passed && pr8ReportPresent ? 'BLOCKED' : 'FAIL')
  : 'NOT_RUN', 'Actual PR-8 gate output plus retained adapter blockers.');
addGate(gates, 'RG-14', policyIsValid
  && existsSync(resolve(root, 'docs/release/RELEASE_LIMITATIONS.md'))
  && existsSync(resolve(root, 'docs/release/CALCULATION_VALIDATION_MATRIX.md'))
  ? 'PASS'
  : 'FAIL', 'Release limitations and excluded capabilities documented.');

let reportModule;
let releaseReport;
let releaseReportError;
try {
  reportModule = await import('../../src/release/releaseGateReport.ts');
  releaseReport = reportModule.finalizeReleaseReport({
    gates,
    ...(fixtureCountToReport === undefined ? {} : { fixtureCount: fixtureCountToReport }),
    pr8AcceptanceStatuses,
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceRevision: testedSha ?? 'unavailable'
    }
  });
} catch (error) {
  releaseReportError = error.message;
  preflightErrors.push(`Release report aggregation failed: ${error.message}`);
}

const manifest = {
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
  ...(mergeSha === null ? {} : { prMergeSha: mergeSha }),
  commands,
  ...(pr8AcceptanceReport === undefined ? {} : { pr8AcceptanceReport }),
  limitations,
  skippedTests,
  fixtureCount: fixtureCount ?? null,
  gateResults: releaseReport?.gates ?? gates,
  preflightErrors,
  ...(releaseReportError ? { releaseReportError } : {}),
  ...(releaseReport ? { releaseReport, status: releaseReport.status } : { status: 'FAIL' })
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Release manifest: ${relative(root, manifestPath)}`);
console.log(`Release status: ${manifest.status}`);
if (releaseReport?.canRelease !== true) process.exitCode = 1;
