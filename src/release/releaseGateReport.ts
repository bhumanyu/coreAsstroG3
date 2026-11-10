import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { REQUIRED_CALCULATION_COVERAGE } from '../engine/validation/calculationReferenceTypes.ts';
import {
  EXCLUDED_RELEASE_CAPABILITIES,
  RELEASE_POLICY_VERSION,
  RELEASE_POLICY_VERSION_WITH_DEPENDENCY_WAIVERS,
  RETAINED_RELEASE_BLOCKERS,
  REQUIRED_RELEASE_GATES,
  RELEASE_GATE_EVIDENCE_KIND,
  type Pr8AcceptanceStatus,
  type ReleaseCoverageStatus,
  type ReleaseGate,
  type ReleaseGateEvidence,
  type ReleaseGateId,
  type ReleaseGateResult,
  type ReleaseGateStatus,
  type EvidenceManifestIntegrity,
  type ReleaseReport,
  type ReleaseReportInput,
  type RunnerEvidenceManifest
} from './releaseGateTypes.ts';

export const ALLOWED_SKIPPED_TESTS: readonly string[] = Object.freeze([]);
export const EVIDENCE_MANIFEST_SCHEMA_VERSION = 1 as const;
export const EVIDENCE_MANIFEST_HASH_ALGORITHM = 'SHA-256' as const;

const REQUIRED_PR8_ACCEPTANCE_SURFACES = Object.freeze([
  'report-renderer',
  'AppController async-state'
] as const);
const VALIDATED_RUNNER_RESULT = Symbol('ValidatedRunnerResult');
function fileMatchesReference(path: string, expectedSha256: string): boolean {
  const absolutePath = resolve(process.cwd(), path);
  if (!existsSync(absolutePath)) return false;
  const actual = createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
  return actual === expectedSha256;
}

function evidenceExistsInManifest(
  evidence: ReleaseGateEvidence,
  manifest: RunnerEvidenceManifest
): boolean {
  if (evidence.kind === 'COMMAND_LOG') {
    const command = manifest.commands.find(item =>
      item.name === evidence.commandName && item.logPath === evidence.logPath
    );
    return Boolean(command && command.exitCode === 0 && existsSync(resolve(process.cwd(), command.logPath)));
  }
  if (evidence.kind === 'FILE_SHA256') {
    return manifest.files.some(item =>
      item.path === evidence.path
      && item.sha256 === evidence.sha256
      && fileMatchesReference(item.path, item.sha256)
    );
  }
  if (evidence.kind === 'POLICY_DOCUMENT') {
    return manifest.policyDocuments.some(item =>
      item.path === evidence.path
      && item.sha256 === evidence.sha256
      && fileMatchesReference(item.path, item.sha256)
    );
  }
  const fixtureRun = manifest.fixtureComparisons.find(item =>
    item.path === evidence.path
    && item.sha256 === evidence.sha256
    && item.invocationId === evidence.invocationId
    && item.commandPassed
    && fileMatchesReference(item.path, item.sha256)
  );
  return Boolean(fixtureRun
    && evidence.fixtureIds.length === fixtureRun.fixtureIds.length
    && evidence.fixtureIds.every(id => fixtureRun.fixtureIds.includes(id)));
}

export type ValidatedRunnerResult = ReleaseReportInput & {
  readonly evidenceManifestIntegrity: EvidenceManifestIntegrity;
  readonly [VALIDATED_RUNNER_RESULT]: true;
};

export function createValidatedRunnerResult(
  input: ReleaseReportInput,
  evidenceManifest: RunnerEvidenceManifest
): ValidatedRunnerResult {
  const expectedRevision = input.metadata?.sourceRevision;
  for (const surface of input.pr8AcceptanceStatuses ?? []) {
    if (surface.status !== 'PASS') continue;
    const references = surface.evidenceReferences ?? [];
    const hasExactRevision = typeof expectedRevision === 'string'
      && /^[0-9a-f]{40}$/i.test(expectedRevision)
      && surface.testedSha?.toLowerCase() === expectedRevision.toLowerCase();
    const hasCiIdentity = Boolean(surface.ciRunId && surface.ciRunUrl);
    const hasDistinctEvidence = new Set(references).size >= 2;
    const hasCommandLog = references.some(reference => evidenceManifest.commands.some(command =>
      command.logPath === reference && command.exitCode === 0
      && existsSync(resolve(process.cwd(), command.logPath))
    ));
    const hasFileEvidence = references.some(reference => evidenceManifest.files.some(file =>
      file.path === reference && fileMatchesReference(file.path, file.sha256)
    ));
    if (!hasExactRevision || !hasCiIdentity || !hasDistinctEvidence || !hasCommandLog || !hasFileEvidence) {
      throw new Error(`PR-8 surface ${surface.name} cannot claim PASS without exact-revision CI, command-log and file evidence.`);
    }
  }

  const allowedStatuses = new Set<ReleaseGateStatus>(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);
  for (const gate of input.gates) {
    if (!allowedStatuses.has(gate.status)) {
      throw new Error(`Gate ${gate.id} has an invalid release status.`);
    }
    if (gate.status === 'PASS') {
      if (!Array.isArray(gate.evidence) || gate.evidence.length === 0) {
        throw new Error(`PASS gate ${gate.id} must include typed evidence.`);
      }
      for (const evidence of gate.evidence) {
        if (!evidence || typeof evidence !== 'object' || !('kind' in evidence)) {
          throw new Error(`PASS gate ${gate.id} contains malformed evidence.`);
        }
        const requirement = RELEASE_GATE_EVIDENCE_KIND[gate.id];
        if (evidence.kind !== requirement.kind) {
          throw new Error(`PASS gate ${gate.id} requires ${requirement.kind} evidence.`);
        }
        if (evidence.kind === 'COMMAND_LOG'
          && !requirement.commandNames?.includes(evidence.commandName)) {
          throw new Error(`PASS gate ${gate.id} does not accept command ${evidence.commandName}.`);
        }
        if (!evidenceExistsInManifest(evidence, evidenceManifest)) {
          throw new Error(`PASS gate ${gate.id} references evidence missing from the runner manifest.`);
        }
      }
      const commandNames = RELEASE_GATE_EVIDENCE_KIND[gate.id].commandNames;
      if (commandNames) {
        const suppliedNames = gate.evidence
          .filter((evidence): evidence is Extract<ReleaseGateEvidence, { kind: 'COMMAND_LOG' }> =>
            evidence.kind === 'COMMAND_LOG')
          .map(evidence => evidence.commandName)
          .sort();
        if (JSON.stringify(suppliedNames) !== JSON.stringify([...commandNames].sort())) {
          throw new Error(`PASS gate ${gate.id} must reference exactly its designated command records.`);
        }
      }
    }
  }
  const evidenceManifestIntegrity = digestRunnerEvidenceManifest(evidenceManifest);
  return Object.freeze({
    ...input,
    evidenceManifestIntegrity,
    [VALIDATED_RUNNER_RESULT]: true as const
  });
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) => [key, canonicalValue(item)])
  );
}

export function canonicalizeRunnerEvidenceManifest(
  manifest: RunnerEvidenceManifest
): string {
  const recordKey = (value: object): string => canonicalJson(value);
  const compareRecords = (left: object, right: object): number => {
    const leftKey = recordKey(left);
    const rightKey = recordKey(right);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  };
  const canonicalManifest = {
    commands: [...manifest.commands].sort(compareRecords),
    files: [...manifest.files].sort(compareRecords),
    fixtureComparisons: [...manifest.fixtureComparisons]
      .map(item => ({ ...item, fixtureIds: [...item.fixtureIds].sort() }))
      .sort(compareRecords),
    policyDocuments: [...manifest.policyDocuments].sort(compareRecords)
  };
  return canonicalJson(canonicalManifest);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

export function digestRunnerEvidenceManifest(
  manifest: RunnerEvidenceManifest
): EvidenceManifestIntegrity {
  return Object.freeze({
    manifestSchemaVersion: EVIDENCE_MANIFEST_SCHEMA_VERSION,
    algorithm: EVIDENCE_MANIFEST_HASH_ALGORITHM,
    digest: createHash('sha256').update(canonicalizeRunnerEvidenceManifest(manifest)).digest('hex')
  });
}

export function verifyRunnerEvidenceManifestDigest(
  manifest: RunnerEvidenceManifest,
  integrity: EvidenceManifestIntegrity
): boolean {
  return integrity.manifestSchemaVersion === EVIDENCE_MANIFEST_SCHEMA_VERSION
    && integrity.algorithm === EVIDENCE_MANIFEST_HASH_ALGORITHM
    && /^[0-9a-f]{64}$/i.test(integrity.digest)
    && digestRunnerEvidenceManifest(manifest).digest === integrity.digest;
}

export function verifyReleaseReportEvidenceManifest(
  report: Pick<ReleaseReport, 'evidenceManifestSchemaVersion' | 'evidenceManifestSha256'>,
  manifest: RunnerEvidenceManifest
): boolean {
  return verifyEvidenceManifestDigest(report, manifest);
}

export interface EvidenceManifestDigestReport {
  readonly evidenceManifestSchemaVersion: 1;
  readonly evidenceManifestSha256: string;
}

export function verifyEvidenceManifestDigest(
  report: EvidenceManifestDigestReport,
  manifest: RunnerEvidenceManifest
): boolean {
  return report.evidenceManifestSchemaVersion === EVIDENCE_MANIFEST_SCHEMA_VERSION
    && /^[0-9a-f]{64}$/i.test(report.evidenceManifestSha256)
    && digestRunnerEvidenceManifest(manifest).digest === report.evidenceManifestSha256;
}

export interface VitestJsonReport {
  readonly numTotalTests: number;
  readonly numPassedTests: number;
  readonly numFailedTests: number;
  readonly testResults: readonly {
    readonly name: string;
    readonly assertionResults: readonly {
      readonly fullName: string;
      readonly status: string;
    }[];
  }[];
  readonly startTime: number;
}

export interface CommandExecutionWindow {
  readonly startedAt: number;
  readonly finishedAt: number;
}

export function isVitestJsonReport(
  value: unknown,
  commandWindow?: CommandExecutionWindow
): value is VitestJsonReport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  if (!(Number.isInteger(report.numTotalTests)
    && Number.isInteger(report.numPassedTests)
    && Number.isInteger(report.numFailedTests)
    && (report.numPassedTests as number) >= 0
    && (report.numFailedTests as number) >= 0
    && Number.isFinite(report.startTime)
    && Array.isArray(report.testResults)
    && report.testResults.every((result) => Boolean(result)
      && typeof result === 'object'
      && !Array.isArray(result)
      && typeof (result as Record<string, unknown>).name === 'string'
      && ((result as Record<string, unknown>).name as string).trim().length > 0
      && Array.isArray((result as Record<string, unknown>).assertionResults)))) return false;

  const assertions = (report.testResults as Array<Record<string, unknown>>)
    .flatMap((result): Array<Record<string, unknown>> =>
      (result.assertionResults as Array<Record<string, unknown>>)
        .map(assertion => ({ ...assertion, testFile: result.name as string }))
    );
  if (assertions.some(assertion =>
    typeof assertion.fullName !== 'string'
    || assertion.fullName.trim().length === 0
    || !['passed', 'failed', 'skipped', 'pending', 'todo'].includes(String(assertion.status))
  )) return false;
  const names = assertions.map(assertion => `${assertion.testFile}::${assertion.fullName as string}`);
  if (new Set(names).size !== names.length) return false;
  const passed = assertions.filter(assertion => assertion.status === 'passed').length;
  const failed = assertions.filter(assertion => assertion.status === 'failed').length;
  const reportStartTime = report.startTime as number;
  if (report.numTotalTests !== assertions.length
    || report.numPassedTests !== passed
    || report.numFailedTests !== failed) return false;
  if (commandWindow && (
    reportStartTime < commandWindow.startedAt
    || reportStartTime > commandWindow.finishedAt
    || commandWindow.finishedAt < commandWindow.startedAt
  )) return false;
  return true;
}

export function skippedTestsGateStatus(
  commandRan: boolean,
  report: unknown,
  skippedTests: readonly string[],
  allowedSkippedTests: readonly string[],
  commandWindow?: CommandExecutionWindow
): ReleaseGateStatus {
  if (!commandRan) return 'NOT_RUN';
  if (!isVitestJsonReport(report, commandWindow)) return 'FAIL';
  const allowed = new Set(allowedSkippedTests);
  return skippedTests.every(name => allowed.has(name)) ? 'PASS' : 'FAIL';
}

export interface CalculationFixtureResult {
  readonly fixtureId: string;
  readonly kind: string;
  readonly invocationId: string;
  readonly operationId: string;
  readonly compared: boolean;
  readonly passed: boolean;
}

export interface CalculationFixtureResultsEnvelope {
  readonly schemaVersion: 1;
  readonly invocationId: string;
  readonly candidateSha: string | null;
  readonly fixtureInventoryHash: string;
  readonly expectedFixtureCount: number;
  readonly completedFixtureCount: number;
  readonly suiteCompleted: boolean;
  readonly command: {
    readonly startedAt: number;
    readonly finishedAt: number;
  };
  readonly results: readonly CalculationFixtureResult[];
}

export interface CalculationFixtureInventoryItem {
  readonly id: string;
  readonly kind: string;
  readonly entryPoint: string;
  readonly provenance: {
    readonly sourceType?: string;
    readonly sourceName?: string;
    readonly citation?: string;
    readonly sourceVersion?: string;
    readonly methodology?: string;
    readonly coordinateConvention?: string;
    readonly timeStandard?: string;
    readonly ayanamsa?: string;
    readonly nodeConvention?: string;
    readonly tolerance?: string;
    readonly toleranceRationale?: string;
    readonly independenceStatement?: string;
    readonly independentlyProduced?: boolean;
    readonly retrievedAt?: string;
    readonly approvedBy?: string;
    readonly approvedAt?: string;
  };
}

export function calculationFixtureGateStatus(
  fixtures: readonly CalculationFixtureInventoryItem[],
  envelope: unknown,
  missingCoverage: readonly string[],
  commandPassed: boolean,
  expectedInvocationId: string,
  expectedCandidateSha: string | null
): ReleaseGateStatus {
  if (!commandPassed) return 'BLOCKED';
  if (fixtures.length === 0 || missingCoverage.length > 0) return 'BLOCKED';
  if (new Set(fixtures.map(fixture => fixture.id)).size !== fixtures.length) return 'FAIL';
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return 'BLOCKED';
  const report = envelope as Record<string, unknown>;
  if (Array.isArray(report.results)) {
    const rawResultIds = new Set<string>();
    for (const result of report.results) {
      if (!result || typeof result !== 'object') continue;
      const fixtureId = (result as Record<string, unknown>).fixtureId;
      if (typeof fixtureId === 'string' && rawResultIds.has(fixtureId)) return 'FAIL';
      if (typeof fixtureId === 'string') rawResultIds.add(fixtureId);
    }
  }
  if (report.invocationId !== expectedInvocationId
    || report.candidateSha !== expectedCandidateSha
    || report.schemaVersion !== 1
    || report.fixtureInventoryHash !== calculationFixtureInventoryHash(fixtures)
    || report.expectedFixtureCount !== fixtures.length
    || report.completedFixtureCount !== fixtures.length
    || report.suiteCompleted !== true
    || !Array.isArray(report.results)
    || report.results.length !== report.completedFixtureCount
    || !report.command || typeof report.command !== 'object'
    || Array.isArray(report.command)
    || !Number.isFinite((report.command as Record<string, unknown>).startedAt)
    || !Number.isFinite((report.command as Record<string, unknown>).finishedAt)
    || (report.command as Record<string, number>).finishedAt
      < (report.command as Record<string, number>).startedAt) return 'BLOCKED';

  const expectedIds = new Set(fixtures.map(fixture => fixture.id));
  const observedIds = new Set<string>();
  const operationIds = new Set<string>();
  for (const result of report.results) {
    if (!result || typeof result !== 'object') return 'FAIL';
    const item = result as Record<string, unknown>;
    if (typeof item.fixtureId !== 'string' || !expectedIds.has(item.fixtureId)
      || observedIds.has(item.fixtureId)) return 'FAIL';
    observedIds.add(item.fixtureId);
    if (typeof item.kind !== 'string'
      || item.kind !== fixtures.find(fixture => fixture.id === item.fixtureId)?.kind) return 'FAIL';
    if (item.invocationId !== expectedInvocationId) return 'FAIL';
    if (typeof item.operationId !== 'string' || item.operationId.trim().length === 0
      || typeof item.compared !== 'boolean' || typeof item.passed !== 'boolean') return 'FAIL';
    const fixture = fixtures.find(candidate => candidate.id === item.fixtureId);
    if (!fixture || item.operationId !== `${fixture.entryPoint}:${fixture.kind}:${fixture.id}`
      || operationIds.has(item.operationId)) return 'FAIL';
    operationIds.add(item.operationId);
    if (item.passed === false) return 'FAIL';
    if (item.compared === false) return 'BLOCKED';
  }
  if (observedIds.size !== fixtures.length) return 'BLOCKED';

  const provenanceIsPresent = fixtures.every(({ provenance }) =>
    provenance.independentlyProduced === true
    && [
      provenance.sourceType,
      provenance.sourceName,
      provenance.citation,
      provenance.sourceVersion,
      provenance.methodology,
      provenance.coordinateConvention,
      provenance.timeStandard,
      provenance.ayanamsa,
      provenance.nodeConvention,
      provenance.tolerance,
      provenance.toleranceRationale,
      provenance.independenceStatement,
      provenance.retrievedAt,
      provenance.approvedBy,
      provenance.approvedAt
    ].every(value => typeof value === 'string' && value.trim().length > 0)
    && provenance.independenceStatement?.toLowerCase().includes('not derived from engine output')
  );
  if (!provenanceIsPresent) return 'FAIL';
  return commandPassed ? 'PASS' : 'FAIL';
}

export function calculationFixtureInventoryHash(fixtures: readonly unknown[]): string {
  return createHash('sha256').update(JSON.stringify(fixtures)).digest('hex');
}

export function fixtureResultsCorrelateToCommand(
  report: unknown,
  fixtures: readonly CalculationFixtureInventoryItem[],
  expectedInvocationId: string,
  expectedCandidateSha: string | null,
  commandPassed: boolean,
  modifiedAt: number,
  startedAt: number,
  finishedAt: number
): boolean {
  if (!commandPassed || !report || typeof report !== 'object' || Array.isArray(report)) return false;
  const value = report as Record<string, unknown>;
  const command = value.command;
  if (!command || typeof command !== 'object' || Array.isArray(command)) return false;
  const commandTimes = command as Record<string, unknown>;
  return value.invocationId === expectedInvocationId
    && value.schemaVersion === 1
    && value.candidateSha === expectedCandidateSha
    && value.fixtureInventoryHash === calculationFixtureInventoryHash(fixtures)
    && value.expectedFixtureCount === fixtures.length
    && value.completedFixtureCount === fixtures.length
    && value.suiteCompleted === true
    && Array.isArray(value.results)
    && value.results.length === value.completedFixtureCount
    && commandTimes.startedAt === startedAt
    && typeof commandTimes.finishedAt === 'number'
    && commandTimes.finishedAt >= startedAt
    && commandTimes.finishedAt <= finishedAt
    && Array.isArray(value.results)
    && Number.isFinite(modifiedAt)
    && Number.isFinite(startedAt)
    && Number.isFinite(finishedAt)
    && finishedAt >= startedAt
    && modifiedAt >= startedAt
    && modifiedAt <= finishedAt;
}

export function harnessDependencyInventoryIssues(
  repositoryRoot: string,
  declaredPaths: readonly string[],
  computedDependencies: readonly string[],
  waivedDependencies: readonly { readonly path: string }[] = []
): readonly string[] {
  const root = resolve(repositoryRoot);
  const normalize = (value: string): string => value.replace(/\\/g, '/').replace(/^\.\//, '');
  const issues: string[] = [];
  for (const declared of declaredPaths) {
    const normalized = normalize(declared);
    const absolutePath = resolve(root, normalized);
    const relativePath = relative(root, absolutePath);
    if (isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
      issues.push(`UNREADABLE_DECLARED_PATH:${declared}`);
      continue;
    }
    try {
      const stat = statSync(absolutePath);
      if (stat.isFile()) readFileSync(absolutePath);
      else if (stat.isDirectory()) readdirSync(absolutePath);
      else issues.push(`UNREADABLE_DECLARED_PATH:${declared}`);
    } catch {
      issues.push(`UNREADABLE_DECLARED_PATH:${declared}`);
    }
  }
  const waived = new Set(waivedDependencies.flatMap(waiver =>
    typeof waiver?.path === 'string' ? [normalize(waiver.path)] : []
  ));
  for (const dependency of computedDependencies) {
    const normalized = normalize(dependency);
    const covered = declaredPaths.some(declared => {
      const entry = normalize(declared);
      return entry.endsWith('/')
        ? normalized.startsWith(entry)
        : normalized === entry;
    });
    if (!covered && !waived.has(normalized)) {
      issues.push(`UNDECLARED_HARNESS_DEPENDENCY:${normalized}`);
    }
  }
  return issues;
}

export interface HarnessImportGraph {
  readonly dependencies: readonly string[];
  readonly edges: readonly string[];
}

export function harnessDependencyGraphDifferences(
  accepted: HarnessImportGraph,
  candidate: HarnessImportGraph
): readonly string[] {
  const acceptedDependencies = new Set(accepted.dependencies);
  const candidateDependencies = new Set(candidate.dependencies);
  const acceptedEdges = new Set(accepted.edges);
  const candidateEdges = new Set(candidate.edges);
  return [
    ...[...acceptedDependencies]
      .filter(path => !candidateDependencies.has(path))
      .map(path => `REMOVED_DEPENDENCY:${path}`),
    ...[...candidateDependencies]
      .filter(path => !acceptedDependencies.has(path))
      .map(path => `ADDED_DEPENDENCY:${path}`),
    ...[...acceptedEdges]
      .filter(edge => !candidateEdges.has(edge))
      .map(edge => `REMOVED_EDGE:${edge}`),
    ...[...candidateEdges]
      .filter(edge => !acceptedEdges.has(edge))
      .map(edge => `ADDED_EDGE:${edge}`)
  ].sort();
}

export function releasePolicyIsValid(
  policy: unknown,
  requiredGateIds: readonly string[]
): boolean {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return false;
  const value = policy as Record<string, unknown>;
  const requiredGates = value.requiredGates;
  const retainedBlockers = value.retainedBlockers;
  const excludedCapabilities = value.excludedCapabilities;
  const pr8 = value.pr8;
  const calculationCoverage = value.calculationCoverage;
  const isStringArray = (candidate: unknown): candidate is string[] =>
    Array.isArray(candidate)
    && candidate.every(item => typeof item === 'string' && item.length > 0)
    && new Set(candidate).size === candidate.length;
  const matchesContract = (candidate: unknown, required: readonly string[]): boolean =>
    isStringArray(candidate)
    && candidate.length === required.length
    && required.every((item, index) => candidate[index] === item);
  const requiredPr8Paths = [
    'src/acceptance/',
    'src/ai/',
    'src/core/analysis/',
    'src/core/validation/',
    'src/data/',
    'src/domain/',
    'src/product/',
    'src/features/chart-export/',
    'src/engine/',
    'src/engine/astroEngine.ts',
    'src/types.ts',
    'src/test/fixtures/canonicalChart.ts',
    'src/test/fixtures/careerGoldenBaseline.ts',
    'src/test/fixtures/wealthGoldenBaseline.ts',
    'src/test/fixtures/selectedPeriodGoldenFixtures.ts'
  ];
  const pr8Paths = (pr8 as Record<string, unknown> | undefined)?.revisionComparisonPaths;
  const dependencyWaivers = (pr8 as Record<string, unknown> | undefined)?.harnessDependencyWaivers;
  const dependencyLimitations = (pr8 as Record<string, unknown> | undefined)?.dependencyAnalysisLimitations;
  const coverage = calculationCoverage as Record<string, unknown> | undefined;
  const epsilon = coverage?.boundaryEpsilonDegrees as Record<string, unknown> | undefined;
  return value.policyVersion === (Array.isArray(dependencyWaivers) && dependencyWaivers.length > 0
    ? RELEASE_POLICY_VERSION_WITH_DEPENDENCY_WAIVERS
    : RELEASE_POLICY_VERSION)
    && Boolean(pr8)
    && typeof pr8 === 'object'
    && /^[0-9a-f]{40}$/i.test((pr8 as Record<string, unknown>).acceptedImplementationRevision as string)
    && (pr8 as Record<string, unknown>).harnessEntryPoint
      === 'src/acceptance/goldenAcceptanceProductionHarness.ts'
    && Array.isArray(dependencyWaivers)
    && dependencyWaivers.every(waiver => {
      if (!waiver || typeof waiver !== 'object' || Array.isArray(waiver)) return false;
      const item = waiver as Record<string, unknown>;
      const expiryFields = Number(typeof item.expiresAt === 'string')
        + Number(typeof item.reviewCondition === 'string');
      const waiverPath = typeof item.path === 'string' ? item.path.replace(/\\/g, '/') : '';
      return typeof item.path === 'string'
        && item.path.trim().length > 0
        && !waiverPath.startsWith('/')
        && !waiverPath.split('/').includes('..')
        && typeof item.reason === 'string'
        && item.reason.trim().length > 0
        && typeof item.approver === 'string'
        && item.approver.trim().length > 0
        && typeof item.approvedAt === 'string'
        && !Number.isNaN(Date.parse(item.approvedAt))
        && expiryFields === 1
        && (item.expiresAt === undefined
          || (!Number.isNaN(Date.parse(item.expiresAt as string))
            && Date.parse(item.expiresAt as string) > Date.now()))
        && (item.reviewCondition === undefined || (item.reviewCondition as string).trim().length > 0);
    })
    && Array.isArray(dependencyLimitations)
    && dependencyLimitations.every(limitation =>
      Boolean(limitation)
      && typeof limitation === 'object'
      && typeof (limitation as Record<string, unknown>).id === 'string'
      && typeof (limitation as Record<string, unknown>).description === 'string'
      && ((limitation as Record<string, unknown>).id as string).trim().length > 0
      && ((limitation as Record<string, unknown>).description as string).trim().length > 0)
    && dependencyLimitations.some(limitation =>
      (limitation as Record<string, unknown>).id === 'nonliteral-runtime-loads')
    && isStringArray(pr8Paths)
    && requiredPr8Paths.every(path => pr8Paths.includes(path))
    && Boolean(calculationCoverage)
    && typeof calculationCoverage === 'object'
    && matchesContract(coverage?.requiredKinds, REQUIRED_CALCULATION_COVERAGE.requiredKinds)
    && matchesContract(coverage?.requiredPlanets, REQUIRED_CALCULATION_COVERAGE.requiredPlanets)
    && matchesContract(coverage?.requiredMotionScenarios, REQUIRED_CALCULATION_COVERAGE.requiredMotionScenarios)
    && matchesContract(coverage?.requiredBoundaryKinds, REQUIRED_CALCULATION_COVERAGE.requiredBoundaryKinds)
    && matchesContract(coverage?.requiredBoundaryPositions, REQUIRED_CALCULATION_COVERAGE.requiredBoundaryPositions)
    && matchesContract(coverage?.requiredVargaTypes, REQUIRED_CALCULATION_COVERAGE.requiredVargaTypes)
    && epsilon?.min === REQUIRED_CALCULATION_COVERAGE.boundaryEpsilonDegrees.min
    && epsilon.max === REQUIRED_CALCULATION_COVERAGE.boundaryEpsilonDegrees.max
    && Array.isArray(requiredGates)
    && requiredGateIds.length === REQUIRED_RELEASE_GATES.length
    && requiredGates.length === REQUIRED_RELEASE_GATES.length
    && requiredGates.every((gate, index) => {
      if (!gate || typeof gate !== 'object') return false;
      const item = gate as Record<string, unknown>;
      return item.id === REQUIRED_RELEASE_GATES[index].id
        && item.name === REQUIRED_RELEASE_GATES[index].name
        && item.id === requiredGateIds[index];
    })
    && Array.isArray(value.allowedSkippedTests)
    && value.allowedSkippedTests.length === 0
    && Array.isArray(retainedBlockers)
    && retainedBlockers.length === RETAINED_RELEASE_BLOCKERS.length
    && retainedBlockers.every((blocker, index) => {
      if (!blocker || typeof blocker !== 'object') return false;
      const item = blocker as Record<string, unknown>;
      return item.id === RETAINED_RELEASE_BLOCKERS[index].id
        && item.status === RETAINED_RELEASE_BLOCKERS[index].status;
    })
    && Array.isArray(excludedCapabilities)
    && excludedCapabilities.length === EXCLUDED_RELEASE_CAPABILITIES.length
    && excludedCapabilities.every(
      (capability, index) => capability === EXCLUDED_RELEASE_CAPABILITIES[index]
    );
}

export function pr8WasEvaluatedOnCandidate(
  acceptedImplementationSha: string | null,
  candidateSha: string | null,
  testedSha: string | null,
  acceptanceFilesChangedSince: readonly string[],
  acceptanceRunPassed: boolean,
  reportSha256: string | null
): boolean {
  const isSha = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
  return isSha(acceptedImplementationSha)
    && isSha(candidateSha)
    && isSha(testedSha)
    && testedSha.toLowerCase() === candidateSha.toLowerCase()
    && acceptanceFilesChangedSince.length === 0
    && acceptanceRunPassed
    && typeof reportSha256 === 'string'
    && /^[0-9a-f]{64}$/i.test(reportSha256);
}

/** Aggregates only the fixed required gate inventory; optional/unknown gates cannot change it. */
export function aggregateReleaseStatus(gates: readonly ReleaseGateResult[]): ReleaseGateStatus {
  const requiredStatuses: ReleaseGateStatus[] = [];

  for (const requiredGate of REQUIRED_RELEASE_GATES) {
    const matches = gates.filter(gate => gate.id === requiredGate.id);
    if (matches.length > 1) return 'FAIL';
    const status = matches[0]?.status;
    if (status === undefined) {
      requiredStatuses.push('NOT_RUN');
    } else if (status === 'PASS' || status === 'FAIL' || status === 'BLOCKED' || status === 'NOT_RUN') {
      requiredStatuses.push(status);
    } else {
      return 'FAIL';
    }
  }

  if (requiredStatuses.some(status => status === 'FAIL')) return 'FAIL';
  if (requiredStatuses.some(status => status === 'BLOCKED')) return 'BLOCKED';
  if (requiredStatuses.some(status => status === 'NOT_RUN')) return 'NOT_RUN';
  return 'PASS';
}

function aggregateCoverageStatus(gates: readonly ReleaseGate[]): ReleaseCoverageStatus {
  if (gates.some(gate => gate.coverageStatus === 'BLOCKED')) return 'BLOCKED';
  if (gates.some(gate => gate.coverageStatus === 'NOT_TESTED')) return 'NOT_TESTED';
  if (gates.some(gate => gate.coverageStatus === 'SCOPE_EXCLUDED')) return 'SCOPE_EXCLUDED';
  return 'PASSED';
}

function normalizePr8AcceptanceStatuses(
  statuses: readonly Pr8AcceptanceStatus[] = [],
  expectedSha?: string
): readonly Pr8AcceptanceStatus[] {
  const normalized = new Map<string, Pr8AcceptanceStatus>();
  for (const item of statuses) {
    if (!REQUIRED_PR8_ACCEPTANCE_SURFACES.includes(item.name as typeof REQUIRED_PR8_ACCEPTANCE_SURFACES[number])) {
      normalized.set(item.name, item);
      continue;
    }

    if (normalized.has(item.name)) {
      const previous = normalized.get(item.name)!;
      normalized.set(item.name, {
        ...item,
        status: previous.status === 'FAIL' || item.status === 'FAIL' ? 'FAIL' : 'BLOCKED',
        coverageStatus: 'BLOCKED',
        details: `Duplicate PR-8 status entries for ${item.name}; conflicting evidence is not merged.`
      });
      continue;
    }

    if (item.status === 'FAIL') {
      normalized.set(item.name, item);
      continue;
    }

    const hasExactRevision = typeof expectedSha === 'string'
      && /^[0-9a-f]{40}$/i.test(expectedSha)
      && item.testedSha?.toLowerCase() === expectedSha.toLowerCase();
    const hasCiRun = Boolean(item.ciRunId && item.ciRunUrl);
    const hasAdapterAndBrowserEvidence = Array.isArray(item.evidenceReferences)
      && item.evidenceReferences.length >= 2
      && item.evidenceReferences.every(reference => typeof reference === 'string' && reference.trim().length > 0);
    const independentlyExecuted = item.status === 'PASS' && item.coverageStatus === 'PASSED'
      && hasExactRevision && hasCiRun && hasAdapterAndBrowserEvidence;

    normalized.set(item.name, independentlyExecuted
      ? { ...item, status: 'PASS', coverageStatus: 'PASSED' }
      : {
        ...item,
        status: 'BLOCKED',
        coverageStatus: item.coverageStatus === 'BLOCKED' ? 'BLOCKED' : 'NOT_TESTED',
        details: item.details ?? 'BLOCKED: exact-revision adapter, browser, CI and evidence references are incomplete.'
      });
  }

  for (const name of REQUIRED_PR8_ACCEPTANCE_SURFACES) {
    if (!normalized.has(name)) {
      normalized.set(name, {
        name,
        status: 'BLOCKED',
        coverageStatus: 'NOT_TESTED',
        details: 'BLOCKED: required PR-8 acceptance surface has no execution evidence.'
      });
    }
  }

  return Object.freeze([...normalized.values()]);
}

function releaseGate(
  id: ReleaseGateId,
  gate: ReleaseGateResult | undefined,
  overrides: Partial<ReleaseGateResult> = {}
): ReleaseGate {
  return Object.freeze({
    id,
    status: gate?.status ?? 'NOT_RUN',
    coverageStatus: gate?.coverageStatus ?? 'NOT_TESTED',
    ...(gate?.summary === undefined ? {} : { summary: gate.summary }),
    ...(gate?.evidence === undefined ? {} : { evidence: Object.freeze([...gate.evidence]) }),
    ...overrides
  });
}

function pr8Gate(
  statuses: readonly Pr8AcceptanceStatus[],
  suppliedGate: ReleaseGateResult | undefined,
  duplicateGate = false
): ReleaseGate {
  const hasFailure = statuses.some(status => status.status === 'FAIL');
  const coverageStatuses = statuses.map(status => status.coverageStatus ?? 'NOT_TESTED');
  const coverageStatus: ReleaseCoverageStatus = coverageStatuses.some(status => status === 'BLOCKED')
    ? 'BLOCKED'
    : coverageStatuses.some(status => status === 'NOT_TESTED')
      ? 'NOT_TESTED'
      : coverageStatuses.some(status => status === 'SCOPE_EXCLUDED')
        ? 'SCOPE_EXCLUDED'
        : 'PASSED';
  const requiredSurfacesPass = REQUIRED_PR8_ACCEPTANCE_SURFACES.every(name => {
    const surface = statuses.find(status => status.name === name);
    return surface?.status === 'PASS' && surface.coverageStatus === 'PASSED';
  });
  const everySurfacePass = statuses.length > 0 && statuses.every(status =>
    status.status === 'PASS' && (status.coverageStatus ?? 'NOT_TESTED') === 'PASSED'
  );
  const status: ReleaseGateStatus = hasFailure || suppliedGate?.status === 'FAIL' || duplicateGate
    ? 'FAIL'
    : requiredSurfacesPass && everySurfacePass && suppliedGate?.status === 'PASS' && coverageStatus === 'PASSED'
      ? 'PASS'
      : 'BLOCKED';
  const missing = REQUIRED_PR8_ACCEPTANCE_SURFACES.filter(name => {
    const surface = statuses.find(status => status.name === name);
    return surface?.status !== 'PASS' || surface.coverageStatus !== 'PASSED';
  });

  return releaseGate('RG-13', suppliedGate, {
    status,
    coverageStatus,
    summary: status === 'PASS'
      ? 'All required PR-8 surfaces passed exact-revision adapter and browser acceptance with typed evidence.'
      : `PR-8 acceptance remains blocked. Unproven surfaces: ${missing.join(', ') || 'domain parity or supplied gate evidence'}.`
  });
}

function normalizeRequiredGates(input: ReleaseReportInput): readonly ReleaseGate[] {
  return Object.freeze(REQUIRED_RELEASE_GATES.map(({ id }) => {
    const matches = input.gates.filter(gate => gate.id === id);
    const supplied = matches[0];
    if (id === 'RG-13') {
      const pr8Statuses = normalizePr8AcceptanceStatuses(input.pr8AcceptanceStatuses, input.metadata?.sourceRevision);
      return pr8Gate(pr8Statuses, supplied, matches.length > 1);
    }
    if (matches.length > 1) {
      return releaseGate(id, supplied, {
        status: 'FAIL',
        summary: 'Duplicate results were supplied for this required gate.'
      });
    }
    if (id === 'RG-09' && input.fixtureCount !== undefined) {
      if (!Number.isInteger(input.fixtureCount) || input.fixtureCount < 0) {
        return releaseGate(id, supplied, {
          status: 'FAIL',
          summary: 'Fixture count must be a non-negative integer.'
        });
      }
      if (input.fixtureCount === 0) {
        return releaseGate(id, supplied, {
          status: 'BLOCKED',
          coverageStatus: 'NOT_TESTED',
          summary: 'RG-09 is BLOCKED because the fixture set is empty.'
        });
      }
    }
    return releaseGate(id, supplied);
  }));
}

/** Finalizes only a validated runner result; this is the sole release decision point. */
export function finalizeReleaseReport(input: ValidatedRunnerResult): ReleaseReport {
  if (input[VALIDATED_RUNNER_RESULT] !== true) {
    throw new Error('Release report finalization requires a validated runner result.');
  }
  if (!input.evidenceManifestIntegrity
    || !/^[0-9a-f]{64}$/i.test(input.evidenceManifestIntegrity.digest)
    || input.evidenceManifestIntegrity.manifestSchemaVersion !== EVIDENCE_MANIFEST_SCHEMA_VERSION
    || input.evidenceManifestIntegrity.algorithm !== EVIDENCE_MANIFEST_HASH_ALGORITHM) {
    throw new Error('Validated runner result is missing its evidence-manifest digest.');
  }

  const gates = normalizeRequiredGates(input);
  const status = aggregateReleaseStatus(gates);
  const canRelease = status === 'PASS';
  const pr8AcceptanceStatuses = normalizePr8AcceptanceStatuses(input.pr8AcceptanceStatuses, input.metadata?.sourceRevision);

  return Object.freeze({
    requiredGateIds: Object.freeze(REQUIRED_RELEASE_GATES.map(gate => gate.id)),
    gates,
    status,
    coverageStatus: aggregateCoverageStatus(gates),
    canRelease,
    allowedSkippedTests: ALLOWED_SKIPPED_TESTS,
    pr8AcceptanceStatuses,
    evidenceManifestSchemaVersion: input.evidenceManifestIntegrity.manifestSchemaVersion,
    evidenceManifestSha256: input.evidenceManifestIntegrity.digest,
    evidenceManifestIntegrity: Object.freeze({ ...input.evidenceManifestIntegrity }),
    ...(input.metadata === undefined ? {} : { metadata: Object.freeze({ ...input.metadata }) })
  });
}
