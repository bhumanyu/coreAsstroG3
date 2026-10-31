import {
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

/** Finalizes the report and is the sole location where release eligibility is decided. */
export function finalizeReleaseReport(input: ReleaseReportInput): ReleaseReport {
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
