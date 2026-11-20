import { existsSync, readFileSync } from 'node:fs';

export interface FixtureApprovalManifest {
  readonly schemaVersion: 1;
  readonly fixtureSetSha256: string;
  readonly reviewer: string;
  readonly approvedAt: string;
}

export type FixtureApprovalStatus =
  | 'APPROVED'
  | 'PENDING_REVIEW'
  | 'INVALID'
  | 'STALE'
  | 'MISSING';

export interface FixtureApprovalResult {
  readonly verdict: FixtureApprovalStatus;
  readonly fixtureSetSha256: string;
  readonly detail: string;
}

export function evaluateFixtureApproval(
  approvalPath: string,
  fixtureSetSha256: string
): FixtureApprovalResult {
  if (!existsSync(approvalPath)) {
    return {
      verdict: 'MISSING',
      fixtureSetSha256,
      detail: 'No human approval manifest found; human approval is outstanding.'
    };
  }

  let approval: unknown;
  try {
    approval = JSON.parse(readFileSync(approvalPath, 'utf8')) as unknown;
  } catch (error) {
    return {
      verdict: 'INVALID',
      fixtureSetSha256,
      detail: `Approval manifest could not be read as valid JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  if (!isFixtureApprovalManifest(approval)) {
    return {
      verdict: 'INVALID',
      fixtureSetSha256,
      detail: 'Approval manifest requires schemaVersion 1, a fixture SHA-256, reviewer, and valid approval date.'
    };
  }
  if (!/^[a-f0-9]{64}$/.test(fixtureSetSha256)
    || approval.fixtureSetSha256 !== fixtureSetSha256) {
    return {
      verdict: 'STALE',
      fixtureSetSha256,
      detail: `Approval is for fixture SHA ${approval.fixtureSetSha256}, not current SHA ${fixtureSetSha256}.`
    };
  }
  return {
    verdict: 'APPROVED',
    fixtureSetSha256,
    detail: `Approved by ${approval.reviewer} on ${approval.approvedAt}.`
  };
}

export function deriveCalculationReferenceGateStatus(
  coverageComplete: boolean,
  approvalStatus: FixtureApprovalStatus
): 'READY' | 'PENDING_REVIEW' | 'BLOCKED' {
  if (!coverageComplete || approvalStatus === 'INVALID' || approvalStatus === 'STALE') {
    return 'BLOCKED';
  }
  return approvalStatus === 'APPROVED' ? 'READY' : 'PENDING_REVIEW';
}

function isFixtureApprovalManifest(value: unknown): value is FixtureApprovalManifest {
  if (value === null || typeof value !== 'object') return false;
  const approval = value as Record<string, unknown>;
  return approval.schemaVersion === 1
    && typeof approval.fixtureSetSha256 === 'string'
    && /^[a-f0-9]{64}$/.test(approval.fixtureSetSha256)
    && typeof approval.reviewer === 'string'
    && approval.reviewer.trim().length > 0
    && typeof approval.approvedAt === 'string'
    && isValidApprovalDate(approval.approvedAt);
}

function isValidApprovalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(value)) {
    return false;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    && new Date(parsed).toISOString().slice(0, 10) === value.slice(0, 10);
}
