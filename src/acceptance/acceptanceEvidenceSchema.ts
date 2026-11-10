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
  readonly productStatusReason?: string;
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

// Re-export runtime functions from .mjs implementation with type wrappers
import * as schema from '../../scripts/acceptance/acceptanceEvidenceSchema.mjs';

export const hasAssignedOwner = schema.hasAssignedOwner as (value: string) => boolean;

export const deriveAcceptanceProductStatus = schema.deriveAcceptanceProductStatus as (
  record: Omit<AcceptanceEvidenceRecord, 'productStatus'>,
  reportSha: string
) => AcceptanceProductStatus;

export const validateAcceptanceEvidenceReport = schema.validateAcceptanceEvidenceReport as (
  value: unknown,
  expectedSha?: string
) => readonly string[];
