export const ACCEPTANCE_MISSING = 'MISSING' as const;

/** Native domain/product statuses are carried unchanged; no synthetic status authority is introduced. */
export interface AcceptanceEvidence {
  readonly id: string;
  readonly owner: string;
}

export interface AcceptanceProvenance {
  readonly evidenceId: string;
  readonly owner: string;
  readonly source?: string;
  readonly ruleId?: string;
  readonly occurrence?: string;
  readonly stage?: string;
  readonly type?: string;
}

export interface AcceptanceConclusion {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly scope: 'LIFETIME' | 'SELECTED_PERIOD';
  readonly subjectId: string;
  readonly status: string;
  readonly evidence: readonly AcceptanceEvidence[];
  readonly provenance: readonly AcceptanceProvenance[];
  readonly temporalScope?: Readonly<Record<string, unknown>>;
}

export interface NormalizedAcceptanceConclusion {
  readonly domain: AcceptanceConclusion['domain'];
  readonly scope: AcceptanceConclusion['scope'];
  readonly subjectId: string;
  readonly status: string;
  readonly evidence: readonly AcceptanceEvidence[];
  readonly provenance: readonly AcceptanceProvenance[];
  readonly temporalScope?: Readonly<Record<string, unknown>>;
}

export interface AcceptanceSurface {
  readonly name: string;
  readonly conclusion: NormalizedAcceptanceConclusion | typeof ACCEPTANCE_MISSING;
}

export interface ParityDifference {
  readonly surface: string;
  readonly kind: 'VALUE_MISMATCH' | 'MISSING' | 'EXTRA' | 'DUPLICATE_CONCLUSION' | 'CONFLICT';
  readonly path: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly reason: string;
}

export interface AcceptanceConflictError extends Error {
  readonly code: 'SAME_ID_DIFFERENT_OWNER' | 'DANGLING_PROVENANCE' | 'DUPLICATE_CONCLUSION';
  readonly conflictingId: string;
}
