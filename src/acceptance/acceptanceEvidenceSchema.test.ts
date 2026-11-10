import { describe, expect, it } from 'vitest';
import {
  deriveAcceptanceProductStatus,
  hasAssignedOwner,
  validateAcceptanceEvidenceReport,
  type AcceptanceEvidenceRecord,
  type AcceptanceEvidenceReport
} from './acceptanceEvidenceSchema';

const SHA = 'a'.repeat(40);
const completeRecord = (): AcceptanceEvidenceRecord => ({
  storyId: 'E08-S01',
  title: 'AppController async-state acceptance',
  productOwner: 'Product Owner',
  qaOwner: 'QA Owner',
  acceptanceCriteria: ['Stale responses cannot overwrite newer analysis.', 'Retry is tied to canonical analysis identity.'],
  implementationReferences: ['src/app/AppController.ts'],
  requiredTestCommands: ['npm run test:app-controller-acceptance'],
  expectedTestIds: ['stale-analysis-response', 'retry-analysis-identity'],
  execution: {
    status: 'PASS',
    testedSha: SHA,
    ciRunId: '42760000000',
    ciRunUrl: 'https://github.com/example/repo/actions/runs/42760000000',
    commands: [{ command: 'npm run test:app-controller-acceptance', exitCode: 0, status: 'PASS' }],
    evidenceReferences: ['artifacts/release/logs/12-app-controller-acceptance.log'],
    skippedCount: 0
  },
  productStatus: 'COMPLETE'
});
const reportWith = (record: AcceptanceEvidenceRecord): AcceptanceEvidenceReport => ({
  schemaVersion: 1,
  repository: 'bhumanyu/coreAsstroG3',
  sourceSha: SHA,
  workflowRun: {
    id: '42760000000',
    url: 'https://github.com/example/repo/actions/runs/42760000000',
    name: 'Release Gate',
    conclusion: 'success'
  },
  records: [record]
});

describe('acceptance evidence schema', () => {
  it('accepts complete evidence only when revision, owners, CI, commands, artifacts and zero skips align', () => {
    const report = reportWith(completeRecord());
    expect(deriveAcceptanceProductStatus(report.records[0], SHA)).toBe('COMPLETE');
    expect(validateAcceptanceEvidenceReport(report, SHA)).toEqual([]);
  });

  it('keeps a passing test suite PARTIAL when product or QA ownership is unassigned', () => {
    const record = { ...completeRecord(), productOwner: 'UNASSIGNED', productStatus: 'PARTIAL' as const };
    expect(deriveAcceptanceProductStatus(record, SHA)).toBe('PARTIAL');
    expect(validateAcceptanceEvidenceReport(reportWith(record), SHA)).toEqual([]);
    expect(hasAssignedOwner('UNASSIGNED')).toBe(false);
  });

  it('does not accept evidence produced for a different revision', () => {
    const record = completeRecord();
    const mismatched = { ...record, execution: { ...record.execution, testedSha: 'b'.repeat(40) }, productStatus: 'PARTIAL' as const };
    expect(deriveAcceptanceProductStatus(mismatched, SHA)).toBe('PARTIAL');
    expect(validateAcceptanceEvidenceReport(reportWith(mismatched), SHA)).toEqual([]);
  });

  it('does not complete stories with skipped tests, missing artifacts or missing required commands', () => {
    for (const record of [
      { ...completeRecord(), execution: { ...completeRecord().execution, skippedCount: 1 }, productStatus: 'PARTIAL' as const },
      { ...completeRecord(), execution: { ...completeRecord().execution, evidenceReferences: [] }, productStatus: 'PARTIAL' as const },
      { ...completeRecord(), execution: { ...completeRecord().execution, commands: [] }, productStatus: 'PARTIAL' as const }
    ]) {
      expect(deriveAcceptanceProductStatus(record, SHA)).toBe('PARTIAL');
      expect(validateAcceptanceEvidenceReport(reportWith(record), SHA)).toEqual([]);
    }
  });

  it('maps blocked and failed execution to BLOCKED and BROKEN', () => {
    const base = completeRecord();
    const blocked = { ...base, execution: { ...base.execution, status: 'BLOCKED' as const }, productStatus: 'BLOCKED' as const };
    const failed = { ...base, execution: { ...base.execution, status: 'FAIL' as const }, productStatus: 'BROKEN' as const };
    expect(deriveAcceptanceProductStatus(blocked, SHA)).toBe('BLOCKED');
    expect(deriveAcceptanceProductStatus(failed, SHA)).toBe('BROKEN');
    expect(validateAcceptanceEvidenceReport(reportWith(blocked), SHA)).toEqual([]);
    expect(validateAcceptanceEvidenceReport(reportWith(failed), SHA)).toEqual([]);
  });

  it('does not allow UNAVAILABLE to suppress a failed test execution', () => {
    const base = completeRecord();
    const forged = {
      ...base,
      execution: { ...base.execution, status: 'FAIL' as const },
      productStatus: 'UNAVAILABLE' as const,
      productStatusReason: 'Claimed unavailable'
    };
    expect(validateAcceptanceEvidenceReport(reportWith(forged), SHA))
      .toContain('records[0] cannot suppress failed execution as UNAVAILABLE.');
  });

  it('requires a reason for explicitly unavailable or unassessed product capabilities', () => {
    const base = completeRecord();
    const unavailable = { ...base, productStatus: 'UNAVAILABLE' as const };
    expect(validateAcceptanceEvidenceReport(reportWith(unavailable), SHA))
      .toContain('records[0].productStatusReason is required for UNAVAILABLE.');
  });

  it('rejects malformed, duplicate and wrong-revision reports', () => {
    const base = completeRecord();
    const duplicate = reportWith(base);
    const duplicated = { ...duplicate, records: [base, base] };
    expect(validateAcceptanceEvidenceReport(duplicated, SHA))
      .toContain('records[1].storyId must be unique.');

    expect(validateAcceptanceEvidenceReport(reportWith(base), 'c'.repeat(40)))
      .toContain('sourceSha does not match the expected tested revision.');

    const malformed = reportWith({ ...base, execution: { ...base.execution, commands: [null] } as never });
    expect(validateAcceptanceEvidenceReport(malformed, SHA))
      .toContain('records[0].execution.commands must contain valid command evidence records.');
  });
});
