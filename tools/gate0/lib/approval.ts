import { existsSync, readFileSync } from 'node:fs';

export interface FixtureApprovalManifest {
  readonly schemaVersion: 1;
  readonly fixtureSetSha256: string;
  readonly reviewer: string;
  readonly approvedAt: string;
}

export type ApprovalVerdict = 'PENDING_REVIEW' | 'APPROVED' | 'STALE' | 'INVALID';

export interface ApprovalResult {
  readonly verdict: ApprovalVerdict;
  readonly fixtureSetSha256: string;
  readonly detail: string;
}

export function evaluateFixtureApproval(
  approvalPath: string,
  fixtureSetSha256: string
): ApprovalResult {
  if (!existsSync(approvalPath)) {
    return {
      verdict: 'PENDING_REVIEW',
      fixtureSetSha256,
      detail: 'No human approval manifest found; human review is pending.'
    };
  }

  let approval: FixtureApprovalManifest;
  try {
    approval = JSON.parse(readFileSync(approvalPath, 'utf8')) as FixtureApprovalManifest;
  } catch (error) {
    return {
      verdict: 'INVALID',
      fixtureSetSha256,
      detail: `Approval manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    };
  }

  if (approval.schemaVersion !== 1
    || typeof approval.fixtureSetSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(approval.fixtureSetSha256)
    || typeof approval.reviewer !== 'string'
    || approval.reviewer.trim().length === 0
    || typeof approval.approvedAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(approval.approvedAt)
    || !Number.isFinite(Date.parse(approval.approvedAt))) {
    return {
      verdict: 'INVALID',
      fixtureSetSha256,
      detail: 'Approval manifest requires schemaVersion 1, a fixture SHA-256, reviewer, and valid approval date.'
    };
  }
  if (approval.fixtureSetSha256 !== fixtureSetSha256) {
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
