export type AcceptanceExecutionStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';
export type AcceptanceProductStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'BLOCKED'
  | 'UNAVAILABLE'
  | 'INSUFFICIENT_DATA'
  | 'NOT_ASSESSED'
  | 'BROKEN';

export interface AcceptanceCommandEvidence {
  readonly command: string;
  readonly exitCode: number | null;
  readonly status: AcceptanceExecutionStatus;
}

export interface AcceptanceEvidenceRecord {
  readonly storyId: string;
  readonly title: string;
  readonly productOwner: string;
  readonly qaOwner: string;
  readonly acceptanceCriteria: readonly string[];
  readonly implementationReferences: readonly string[];
  readonly requiredTestCommands: readonly string[];
  readonly expectedTestIds: readonly string[];
  readonly execution: {
    readonly status: AcceptanceExecutionStatus;
    readonly testedSha: string | null;
    readonly ciRunId: string | null;
    readonly ciRunUrl: string | null;
    readonly commands: readonly AcceptanceCommandEvidence[];
    readonly evidenceReferences: readonly string[];
    readonly skippedCount: number;
    readonly failureSummary?: string;
  };
  readonly productStatus: AcceptanceProductStatus;
}

export interface AcceptanceEvidenceReport {
  readonly schemaVersion: 1;
  readonly repository: string;
  readonly sourceSha: string;
  readonly workflowRun: {
    readonly id: string | null;
    readonly url: string | null;
    readonly name: string | null;
    readonly conclusion: string | null;
  };
  readonly records: readonly AcceptanceEvidenceRecord[];
}

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const UNASSIGNED_OWNER_VALUES = new Set(['', 'unassigned', 'tbd', 'unknown', 'n/a']);

export function hasAssignedOwner(value: string): boolean {
  return !UNASSIGNED_OWNER_VALUES.has(value.trim().toLowerCase());
}

export function deriveAcceptanceProductStatus(
  record: Omit<AcceptanceEvidenceRecord, 'productStatus'>,
  reportSha: string
): AcceptanceProductStatus {
  if (record.execution.status === 'BLOCKED') return 'BLOCKED';
  if (record.execution.status === 'FAIL') return 'BROKEN';
  if (record.execution.status !== 'PASS') return 'PARTIAL';

  const exactRevision = record.execution.testedSha === reportSha && SHA_PATTERN.test(reportSha);
  const owned = hasAssignedOwner(record.productOwner) && hasAssignedOwner(record.qaOwner);
  const ciEvidence = Boolean(record.execution.ciRunId && record.execution.ciRunUrl);
  const commandEvidence = record.requiredTestCommands.length > 0
    && record.requiredTestCommands.every(required => record.execution.commands.some(command =>
      command.command === required && command.status === 'PASS' && command.exitCode === 0
    ));
  const artifactEvidence = record.execution.evidenceReferences.length > 0;
  const noSkippedTests = record.execution.skippedCount === 0;

  return exactRevision && owned && ciEvidence && commandEvidence && artifactEvidence && noSkippedTests
    ? 'COMPLETE'
    : 'PARTIAL';
}

export function validateAcceptanceEvidenceReport(
  value: unknown,
  expectedSha?: string
): readonly string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return ['Report must be an object.'];
  const report = value as Partial<AcceptanceEvidenceReport>;
  if (report.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (typeof report.repository !== 'string' || !report.repository.trim()) errors.push('repository is required.');
  if (typeof report.sourceSha !== 'string' || !SHA_PATTERN.test(report.sourceSha)) errors.push('sourceSha must be a full 40-character SHA.');
  if (expectedSha && report.sourceSha !== expectedSha) errors.push('sourceSha does not match the expected tested revision.');
  if (!Array.isArray(report.records) || report.records.length === 0) {
    errors.push('At least one acceptance record is required.');
    return errors;
  }

  const ids = new Set<string>();
  for (const [index, candidate] of report.records.entries()) {
    const record = candidate as AcceptanceEvidenceRecord;
    const prefix = `records[${index}]`;
    if (!record || typeof record !== 'object') {
      errors.push(`${prefix} must be an object.`);
      continue;
    }
    if (!record.storyId?.trim()) errors.push(`${prefix}.storyId is required.`);
    else if (ids.has(record.storyId)) errors.push(`${prefix}.storyId must be unique.`);
    else ids.add(record.storyId);
    if (!record.title?.trim()) errors.push(`${prefix}.title is required.`);
    if (typeof record.productOwner !== 'string' || !record.productOwner.trim()) errors.push(`${prefix}.productOwner is required.`);
    if (typeof record.qaOwner !== 'string' || !record.qaOwner.trim()) errors.push(`${prefix}.qaOwner is required.`);
    if (!Array.isArray(record.acceptanceCriteria) || record.acceptanceCriteria.length === 0) errors.push(`${prefix}.acceptanceCriteria must not be empty.`);
    if (!Array.isArray(record.implementationReferences)) errors.push(`${prefix}.implementationReferences must be an array.`);
    if (!Array.isArray(record.requiredTestCommands)) errors.push(`${prefix}.requiredTestCommands must be an array.`);
    if (!record.execution || !['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'].includes(record.execution.status)) {
      errors.push(`${prefix}.execution.status is invalid.`);
      continue;
    }
    if (!Number.isInteger(record.execution.skippedCount) || record.execution.skippedCount < 0) {
      errors.push(`${prefix}.execution.skippedCount must be a non-negative integer.`);
    }
    if (record.execution.testedSha !== null && !SHA_PATTERN.test(record.execution.testedSha)) {
      errors.push(`${prefix}.execution.testedSha must be null or a full SHA.`);
    }
    if (record.execution.status === 'PASS') {
      const derived = deriveAcceptanceProductStatus({
        ...record,
        productStatus: undefined
      } as unknown as Omit<AcceptanceEvidenceRecord, 'productStatus'>, report.sourceSha ?? '');
      if (derived !== 'COMPLETE') {
        errors.push(`${prefix} claims PASS without exact-SHA, owner, CI, command, evidence and zero-skip proof.`);
      }
    }
    const derivedStatus = deriveAcceptanceProductStatus({
      ...record,
      productStatus: undefined
    } as unknown as Omit<AcceptanceEvidenceRecord, 'productStatus'>, report.sourceSha ?? '');
    if (record.productStatus !== derivedStatus && record.productStatus !== 'UNAVAILABLE'
      && record.productStatus !== 'INSUFFICIENT_DATA' && record.productStatus !== 'NOT_ASSESSED') {
      errors.push(`${prefix}.productStatus does not match its execution evidence.`);
    }
  }
  return errors;
}
