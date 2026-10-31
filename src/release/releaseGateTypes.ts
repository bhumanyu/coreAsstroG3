export const REQUIRED_RELEASE_GATE_IDS = Object.freeze([
  'RG-01',
  'RG-02',
  'RG-03',
  'RG-04',
  'RG-05',
  'RG-06',
  'RG-07',
  'RG-08',
  'RG-09',
  'RG-10',
  'RG-11',
  'RG-12',
  'RG-13',
  'RG-14'
] as const);

export type ReleaseGateId = typeof REQUIRED_RELEASE_GATE_IDS[number];

export const REQUIRED_RELEASE_GATES = Object.freeze([
  { id: REQUIRED_RELEASE_GATE_IDS[0], name: 'Release scope and policy' },
  { id: REQUIRED_RELEASE_GATE_IDS[1], name: 'Release inputs and configuration' },
  { id: REQUIRED_RELEASE_GATE_IDS[2], name: 'Production build' },
  { id: REQUIRED_RELEASE_GATE_IDS[3], name: 'Type checking' },
  { id: REQUIRED_RELEASE_GATE_IDS[4], name: 'Unit test suite' },
  { id: REQUIRED_RELEASE_GATE_IDS[5], name: 'Skipped-test policy' },
  { id: REQUIRED_RELEASE_GATE_IDS[6], name: 'Golden acceptance baselines' },
  { id: REQUIRED_RELEASE_GATE_IDS[7], name: 'Integration test suite' },
  { id: REQUIRED_RELEASE_GATE_IDS[8], name: 'Required fixtures' },
  { id: REQUIRED_RELEASE_GATE_IDS[9], name: 'Independent external reference parity' },
  { id: REQUIRED_RELEASE_GATE_IDS[10], name: 'Owner-gated mechanism coverage' },
  { id: REQUIRED_RELEASE_GATE_IDS[11], name: 'Determinism and reproducibility' },
  { id: REQUIRED_RELEASE_GATE_IDS[12], name: 'PR-8 production acceptance surfaces' },
  { id: REQUIRED_RELEASE_GATE_IDS[13], name: 'Limitations and excluded capabilities' }
] as const);

export const RELEASE_POLICY_VERSION = 1;

export const RETAINED_RELEASE_BLOCKERS = Object.freeze([
  { id: 'external-reference-parity', status: 'BLOCKED' },
  { id: 'owner-gated-non-dusthana-mechanisms', status: 'BLOCKED' },
  { id: 'report-renderer', status: 'BLOCKED' },
  { id: 'AppController async-state', status: 'BLOCKED' }
] as const);

export const EXCLUDED_RELEASE_CAPABILITIES = Object.freeze([
  'Accounts',
  'Sync',
  'Snapshots',
  'Notifications',
  'PDF',
  'Share-link security'
] as const);

export type ReleaseGateStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN';
export type CoverageStatus = 'PASSED' | 'BLOCKED' | 'NOT_TESTED' | 'SCOPE_EXCLUDED';
export type ReleaseCoverageStatus = CoverageStatus;

export interface CommandLogEvidence {
  readonly kind: 'COMMAND_LOG';
  readonly commandName: string;
  readonly logPath: string;
}

export interface FileSha256Evidence {
  readonly kind: 'FILE_SHA256';
  readonly path: string;
  readonly sha256: string;
}

export interface FixtureComparisonEvidence {
  readonly kind: 'FIXTURE_COMPARISON';
  readonly path: string;
  readonly sha256: string;
  readonly invocationId: string;
  readonly fixtureIds: readonly string[];
}

export interface PolicyDocumentEvidence {
  readonly kind: 'POLICY_DOCUMENT';
  readonly path: string;
  readonly sha256: string;
}

export type ReleaseGateEvidence =
  | CommandLogEvidence
  | FileSha256Evidence
  | FixtureComparisonEvidence
  | PolicyDocumentEvidence;

export const RELEASE_GATE_EVIDENCE_KIND = Object.freeze({
  'RG-01': 'POLICY_DOCUMENT',
  'RG-02': 'FILE_SHA256',
  'RG-03': 'COMMAND_LOG',
  'RG-04': 'COMMAND_LOG',
  'RG-05': 'COMMAND_LOG',
  'RG-06': 'FILE_SHA256',
  'RG-07': 'FILE_SHA256',
  'RG-08': 'COMMAND_LOG',
  'RG-09': 'FIXTURE_COMPARISON',
  'RG-10': 'COMMAND_LOG',
  'RG-11': 'COMMAND_LOG',
  'RG-12': 'COMMAND_LOG',
  'RG-13': 'FILE_SHA256',
  'RG-14': 'POLICY_DOCUMENT'
} as const satisfies Readonly<Record<ReleaseGateId, ReleaseGateEvidence['kind']>>);

export interface ReleaseGateResult {
  readonly id: ReleaseGateId;
  readonly status: ReleaseGateStatus;
  readonly coverageStatus?: ReleaseCoverageStatus;
  readonly summary?: string;
  readonly evidence?: readonly ReleaseGateEvidence[];
}

export interface RunnerEvidenceManifest {
  readonly commands: readonly {
    readonly name: string;
    readonly logPath: string;
    readonly exitCode: number | null;
  }[];
  readonly files: readonly {
    readonly path: string;
    readonly sha256: string;
  }[];
  readonly fixtureComparisons: readonly {
    readonly path: string;
    readonly sha256: string;
    readonly invocationId: string;
    readonly fixtureIds: readonly string[];
    readonly commandPassed: boolean;
  }[];
  readonly policyDocuments: readonly {
    readonly path: string;
    readonly sha256: string;
  }[];
}

export interface ReleaseMetadata {
  readonly generatedAt?: string;
  readonly sourceRevision?: string;
}

export interface Pr8AcceptanceStatus {
  readonly name: string;
  readonly status: ReleaseGateStatus;
  readonly coverageStatus?: ReleaseCoverageStatus;
  readonly details?: string;
}

export interface ReleaseGate extends ReleaseGateResult {
  readonly coverageStatus: ReleaseCoverageStatus;
}

export interface ReleaseReportInput {
  readonly gates: readonly ReleaseGateResult[];
  /** Zero fixtures is an explicit blocker; an omitted count leaves RG-09 NOT_RUN. */
  readonly fixtureCount?: number;
  readonly pr8AcceptanceStatuses?: readonly Pr8AcceptanceStatus[];
  readonly metadata?: ReleaseMetadata;
}

export interface ReleaseReport {
  readonly requiredGateIds: readonly ReleaseGateId[];
  readonly gates: readonly ReleaseGate[];
  readonly status: ReleaseGateStatus;
  readonly coverageStatus: ReleaseCoverageStatus;
  readonly canRelease: boolean;
  readonly allowedSkippedTests: readonly string[];
  readonly pr8AcceptanceStatuses: readonly Pr8AcceptanceStatus[];
  readonly metadata?: ReleaseMetadata;
}
