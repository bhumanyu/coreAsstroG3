import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  deriveCalculationReferenceGateStatus,
  evaluateFixtureApproval
} from './fixtureApproval';

const tempDirs: string[] = [];

function approvalPath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'rg09-approval-'));
  tempDirs.push(dir);
  return join(dir, 'approvals.json');
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('RG-09 approval-bound gate status', () => {
  const fixtureSetSha256 = 'a'.repeat(64);

  it('keeps a complete but unapproved fixture set pending', () => {
    const approval = evaluateFixtureApproval(approvalPath(), fixtureSetSha256);

    expect(approval.verdict).toBe('MISSING');
    expect(deriveCalculationReferenceGateStatus(true, approval.verdict)).toBe('PENDING_REVIEW');
    expect(deriveCalculationReferenceGateStatus(true, 'PENDING_REVIEW')).not.toBe('READY');
  });

  it('blocks stale and malformed approval manifests', () => {
    const stalePath = approvalPath();
    writeFileSync(stalePath, JSON.stringify({
      schemaVersion: 1,
      fixtureSetSha256: 'b'.repeat(64),
      reviewer: 'Reviewer',
      approvedAt: '2026-11-20'
    }));
    const stale = evaluateFixtureApproval(stalePath, fixtureSetSha256);

    const malformedPath = approvalPath();
    writeFileSync(malformedPath, '{invalid');
    const malformed = evaluateFixtureApproval(malformedPath, fixtureSetSha256);

    expect(stale.verdict).toBe('STALE');
    expect(deriveCalculationReferenceGateStatus(true, stale.verdict)).toBe('BLOCKED');
    expect(malformed.verdict).toBe('INVALID');
    expect(deriveCalculationReferenceGateStatus(true, malformed.verdict)).toBe('BLOCKED');
  });

  it('rejects syntactically shaped but impossible approval dates', () => {
    const path = approvalPath();
    writeFileSync(path, JSON.stringify({
      schemaVersion: 1,
      fixtureSetSha256,
      reviewer: 'Reviewer',
      approvedAt: '2026-02-31'
    }));

    expect(evaluateFixtureApproval(path, fixtureSetSha256).verdict).toBe('INVALID');
  });

  it('allows READY only for approved fixtures with complete coverage', () => {
    const path = approvalPath();
    writeFileSync(path, JSON.stringify({
      schemaVersion: 1,
      fixtureSetSha256,
      reviewer: 'Reviewer',
      approvedAt: '2026-11-20'
    }));
    const approval = evaluateFixtureApproval(path, fixtureSetSha256);

    expect(approval.verdict).toBe('APPROVED');
    expect(deriveCalculationReferenceGateStatus(true, approval.verdict)).toBe('READY');
    expect(deriveCalculationReferenceGateStatus(false, approval.verdict)).toBe('BLOCKED');
  });
});
