export const ACCEPTANCE_MISSING = 'MISSING' as const;

/** Evidence resolution states for discriminated evidence resolution. */
export type EvidenceResolution =
  | 'RESOLVED'
  | 'DANGLING'
  | 'AMBIGUOUS'
  | 'OWNER_MISMATCH'
  | 'EXTERNAL';

/** Native domain/product statuses are carried unchanged; no synthetic status authority is introduced. */
export interface AcceptanceEvidence {
  readonly id: string;
  readonly owner: string;
  readonly resolution?: EvidenceResolution;
}

/** Unresolved evidence entry for IDs that could not be resolved to a domain record. */
export interface UnresolvedEvidence {
  readonly id: string;
  readonly resolution: EvidenceResolution;
  readonly expectedOwner?: string;
  readonly actualOwner?: string;
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
  readonly conclusionKind?: 'SYNTHESIS_FINAL' | 'PROFESSION_COMPLETENESS' | 'PRESENTATION';
}

/** Typed selected-period acceptance projection with structured state. */
export interface SelectedPeriodAcceptanceProjection {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly scope: 'SELECTED_PERIOD';
  readonly subjectId: string;
  readonly resultState: 'OK' | 'INVALID_SELECTION' | 'SYNTHESIS_FAILED' | 'UNAVAILABLE';
  readonly careerQualificationStatus?: string;
  readonly wealthDimensions?: readonly {
    readonly dimension: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
    readonly effect: string;
    readonly dataStatus: string;
  }[];
  readonly evidence: readonly AcceptanceEvidence[];
  readonly provenance: readonly AcceptanceProvenance[];
  readonly interval?: {
    readonly start: string;
    readonly end: string;
  };
  readonly temporalRelation?: string;
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
  readonly kind: 'VALUE_MISMATCH' | 'MISSING' | 'EXTRA' | 'DUPLICATE_CONCLUSION' | 'CONFLICT' | 'DANGLING_REFERENCE' | 'AMBIGUOUS_EVIDENCE' | 'OWNER_MISMATCH';
  readonly path: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly reason: string;
}

export interface AcceptanceConflictError extends Error {
  readonly code: 'SAME_ID_DIFFERENT_OWNER' | 'DANGLING_PROVENANCE' | 'DUPLICATE_CONCLUSION';
  readonly conflictingId: string;
}
