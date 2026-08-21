import type {
  DomainId,
  DomainInterpretation,
  ConfidenceLevel
} from '../interpretation';

export type LifeAnalysisStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED'
  | 'INSUFFICIENT_DATA';

export type SynthesisDomainStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'INSUFFICIENT_DATA';

export type CrossDomainConflictType =
  | 'DOMAIN_VS_TIMING'
  | 'DOMAIN_VS_TRANSIT'
  | 'DOMAIN_POLARITY';

export type CrossDomainSeverity = 'HIGH' | 'MODERATE' | 'LOW';

export interface DomainSummary {
  readonly domain: DomainId;
  readonly status: LifeAnalysisStatus | string;
  readonly strength: SynthesisDomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly primaryConclusion: string;
}

export interface SharedTimingActivation {
  readonly source: 'DASHA' | 'TRANSIT';
  readonly timingType: 'DASHA' | 'TRANSIT';
  readonly active: boolean;
  readonly participatingDomains: readonly DomainId[];
  readonly effects: Readonly<Record<string, string>>;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly level?: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly periodKey?: string;
  /**
   * Stage-1 specific: indicates whether this timing contains conflicting effects
   * across participating domains (e.g., ACTIVATES in Career but CHALLENGES in Wealth).
   * This field is populated during synthesis and used for UI conflict presentation.
   */
  readonly isConflict?: boolean;
}

export interface CrossDomainConflict {
  readonly id: string;
  readonly type: CrossDomainConflictType;
  readonly severity: CrossDomainSeverity;
  readonly participatingDomains: readonly DomainId[];
  readonly description: string;
  readonly evidenceIds: readonly string[];
}

export interface LifeAnalysisConclusion {
  readonly status: LifeAnalysisStatus;
  readonly statement: string;
  readonly summaryPoints: readonly string[];
  readonly primaryDomain?: DomainId;
  readonly challengedDomain?: DomainId;
}

export interface LifeAnalysisDataCompleteness {
  readonly career: 'AVAILABLE' | 'UNAVAILABLE';
  readonly wealth: 'AVAILABLE' | 'UNAVAILABLE';
  readonly timing: 'AVAILABLE' | 'UNAVAILABLE';
  readonly overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
}

export type LifeAnalysisConfidence = ConfidenceLevel;

export interface LifeAnalysis {
  readonly domains: readonly DomainSummary[];
  readonly strongestDomains: readonly DomainId[];
  readonly challengedDomains: readonly DomainId[];
  readonly sharedTiming: readonly SharedTimingActivation[];
  readonly conflicts: readonly CrossDomainConflict[];
  readonly conclusion: LifeAnalysisConclusion;
  readonly dataCompleteness: LifeAnalysisDataCompleteness;
  readonly confidence: LifeAnalysisConfidence;
  readonly evidenceIds: readonly string[];
}

export interface SynthesizeLifeAnalysisOptions {
  readonly includeUnavailableDomains?: boolean;
}

export interface LifeAnalysisAiProjection {
  readonly status: LifeAnalysisStatus;
  readonly overallStatement: string;
  readonly strongestDomains: readonly DomainId[];
  readonly challengedDomains: readonly DomainId[];
  readonly confidence: LifeAnalysisConfidence;
  readonly completeness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly sharedTimingCount: number;
  readonly conflictCount: number;
  readonly domainSummaries: readonly {
    readonly domain: DomainId;
    readonly strength: SynthesisDomainStrength;
    readonly status: string;
    readonly confidence: ConfidenceLevel;
    readonly primaryConclusion: string;
  }[];
  readonly evidenceIds: readonly string[];
}
