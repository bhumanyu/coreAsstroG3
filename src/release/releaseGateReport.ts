import {
  EXCLUDED_RELEASE_CAPABILITIES,
  RELEASE_POLICY_VERSION,
  RETAINED_RELEASE_BLOCKERS,
  REQUIRED_RELEASE_GATES,
  type Pr8AcceptanceStatus,
  type ReleaseCoverageStatus,
  type ReleaseGate,
  type ReleaseGateId,
  type ReleaseGateResult,
  type ReleaseGateStatus,
  type ReleaseReport,
  type ReleaseReportInput
} from './releaseGateTypes.ts';

export const ALLOWED_SKIPPED_TESTS: readonly string[] = Object.freeze([]);

const RETAINED_PR8_BLOCKERS = Object.freeze([
  'report-renderer',
  'AppController async-state'
] as const);
const VALIDATED_RUNNER_RESULT = Symbol('ValidatedRunnerResult');

export type ValidatedRunnerResult = ReleaseReportInput & {
  readonly [VALIDATED_RUNNER_RESULT]: true;
};

export function createValidatedRunnerResult(
  input: ReleaseReportInput
): ValidatedRunnerResult {
  const allowedStatuses = new Set<ReleaseGateStatus>(['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN']);
  for (const gate of input.gates) {
    if (!allowedStatuses.has(gate.status)) {
      throw new Error(`Gate ${gate.id} has an invalid release status.`);
    }
    if (gate.status === 'PASS' && (!Array.isArray(gate.evidence) || gate.evidence.length === 0
      || gate.evidence.some(item => typeof item !== 'string' || item.trim().length === 0))) {
      throw new Error(`PASS gate ${gate.id} must include non-empty evidence.`);
    }
  }
  return Object.freeze({ ...input, [VALIDATED_RUNNER_RESULT]: true as const });
}

export interface VitestJsonReport {
  readonly numTotalTests: number;
  readonly numPassedTests: number;
  readonly testResults: readonly { readonly assertionResults: readonly unknown[] }[];
  readonly startTime: number;
}

export function isVitestJsonReport(value: unknown): value is VitestJsonReport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  return Number.isInteger(report.numTotalTests)
    && Number.isInteger(report.numPassedTests)
    && (report.numPassedTests as number) >= 0
    && (report.numTotalTests as number) >= (report.numPassedTests as number)
    && Number.isFinite(report.startTime)
    && Array.isArray(report.testResults)
    && report.testResults.every((result) =>
      Boolean(result)
      && typeof result === 'object'
      && !Array.isArray(result)
      && Array.isArray((result as Record<string, unknown>).assertionResults)
    );
}

export function skippedTestsGateStatus(
  commandRan: boolean,
  report: unknown,
  skippedTests: readonly string[],
  allowedSkippedTests: readonly string[]
): ReleaseGateStatus {
  if (!commandRan) return 'NOT_RUN';
  if (!isVitestJsonReport(report)) return 'FAIL';
  const allowed = new Set(allowedSkippedTests);
  return skippedTests.every(name => allowed.has(name)) ? 'PASS' : 'FAIL';
}

export interface CalculationFixtureResult {
  readonly fixtureId: string;
  readonly kind: string;
  readonly compared: boolean;
  readonly passed: boolean;
}

export interface CalculationFixtureInventoryItem {
  readonly id: string;
  readonly kind: string;
  readonly provenance: {
    readonly sourceType?: string;
    readonly sourceName?: string;
    readonly citation?: string;
    readonly sourceVersion?: string;
    readonly methodology?: string;
    readonly independentlyProduced?: boolean;
    readonly retrievedAt?: string;
    readonly approvedBy?: string;
    readonly approvedAt?: string;
  };
}

export function calculationFixtureGateStatus(
  fixtures: readonly CalculationFixtureInventoryItem[],
  results: unknown,
  missingCoverage: readonly string[],
  commandPassed: boolean
): ReleaseGateStatus {
  if (fixtures.length === 0 || missingCoverage.length > 0) return 'BLOCKED';
  if (new Set(fixtures.map(fixture => fixture.id)).size !== fixtures.length) return 'FAIL';
  if (!Array.isArray(results)) return 'BLOCKED';

  const expectedIds = new Set(fixtures.map(fixture => fixture.id));
  const observedIds = new Set<string>();
  for (const result of results) {
    if (!result || typeof result !== 'object') return 'FAIL';
    const item = result as Record<string, unknown>;
    if (typeof item.fixtureId !== 'string' || !expectedIds.has(item.fixtureId)
      || observedIds.has(item.fixtureId)) return 'FAIL';
    observedIds.add(item.fixtureId);
    if (typeof item.kind !== 'string'
      || item.kind !== fixtures.find(fixture => fixture.id === item.fixtureId)?.kind) return 'FAIL';
    if (typeof item.compared !== 'boolean' || typeof item.passed !== 'boolean') return 'FAIL';
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
      provenance.retrievedAt,
      provenance.approvedBy,
      provenance.approvedAt
    ].every(value => typeof value === 'string' && value.trim().length > 0)
  );
  if (!provenanceIsPresent) return 'FAIL';
  return commandPassed ? 'PASS' : 'FAIL';
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
  return value.policyVersion === RELEASE_POLICY_VERSION
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
  reportImplementationSha: unknown,
  reportEvaluatedOnSha: unknown,
  acceptanceFilesChangedSince: readonly string[]
): boolean {
  const isSha = (value: unknown): value is string =>
    typeof value === 'string' && /^[0-9a-f]{40}$/i.test(value);
  return isSha(acceptedImplementationSha)
    && isSha(candidateSha)
    && reportImplementationSha === acceptedImplementationSha
    && reportEvaluatedOnSha === candidateSha
    && acceptanceFilesChangedSince.length === 0;
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
  statuses: readonly Pr8AcceptanceStatus[] = []
): readonly Pr8AcceptanceStatus[] {
  const normalized = new Map<string, Pr8AcceptanceStatus>();
  for (const item of statuses) {
    const isRetainedBlocker = RETAINED_PR8_BLOCKERS.includes(
      item.name as typeof RETAINED_PR8_BLOCKERS[number]
    );
    normalized.set(item.name, isRetainedBlocker
      ? {
        ...item,
        status: 'BLOCKED',
        coverageStatus: item.coverageStatus ?? 'NOT_TESTED',
        details: item.details ?? 'Retained as BLOCKED pending its PR-8 implementation.'
      }
      : item);
  }

  for (const name of RETAINED_PR8_BLOCKERS) {
    if (!normalized.has(name)) {
      normalized.set(name, {
        name,
        status: 'BLOCKED',
        coverageStatus: 'NOT_TESTED',
        details: 'Retained as BLOCKED pending its PR-8 implementation.'
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

  return releaseGate('RG-13', suppliedGate, {
    status: hasFailure || suppliedGate?.status === 'FAIL' || duplicateGate
      ? 'FAIL'
      : suppliedGate?.status === 'NOT_RUN'
        ? 'NOT_RUN'
        : 'BLOCKED',
    coverageStatus,
    summary: 'Consumes PR-8 surface statuses; report-renderer and AppController async-state remain BLOCKED.'
  });
}

function normalizeRequiredGates(input: ReleaseReportInput): readonly ReleaseGate[] {
  return Object.freeze(REQUIRED_RELEASE_GATES.map(({ id }) => {
    const matches = input.gates.filter(gate => gate.id === id);
    const supplied = matches[0];
    if (id === 'RG-13') {
      const pr8Statuses = normalizePr8AcceptanceStatuses(input.pr8AcceptanceStatuses);
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
  for (const gate of input.gates) {
    if (gate.status === 'PASS' && (!Array.isArray(gate.evidence) || gate.evidence.length === 0
      || gate.evidence.some(item => typeof item !== 'string' || item.trim().length === 0))) {
      throw new Error(`PASS gate ${gate.id} must include non-empty evidence.`);
    }
  }

  const gates = normalizeRequiredGates(input);
  const status = aggregateReleaseStatus(gates);
  const canRelease = status === 'PASS';
  const pr8AcceptanceStatuses = normalizePr8AcceptanceStatuses(input.pr8AcceptanceStatuses);

  return Object.freeze({
    requiredGateIds: Object.freeze(REQUIRED_RELEASE_GATES.map(gate => gate.id)),
    gates,
    status,
    coverageStatus: aggregateCoverageStatus(gates),
    canRelease,
    allowedSkippedTests: ALLOWED_SKIPPED_TESTS,
    pr8AcceptanceStatuses,
    ...(input.metadata === undefined ? {} : { metadata: Object.freeze({ ...input.metadata }) })
  });
}
