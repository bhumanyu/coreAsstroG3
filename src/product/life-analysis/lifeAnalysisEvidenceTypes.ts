import type {
  DomainId,
  EvidenceRole,
  EvidencePolarity
} from '../../domain/interpretation/DomainInterpretationTypes';
import type { EvidenceSourceType } from '../../domain/evidence';

export type { EvidenceSourceType };

export interface EvidenceSourceViewModel {
  readonly type: EvidenceSourceType;
  readonly label: string;
  readonly calculationId?: string;
}

export type EvidenceRuleCategory =
  | 'STRUCTURAL'
  | 'PLANETARY'
  | 'YOGA'
  | 'VARGA'
  | 'TIMING'
  | 'TRANSIT'
  | 'OTHER';

export interface EvidenceRuleViewModel {
  readonly id: string;
  readonly name: string;
  readonly category: EvidenceRuleCategory;
  readonly description?: string;
}

export interface EvidenceChartFactViewModel {
  readonly label: string;
  readonly value: string;
  readonly source?: string;
}

export interface EvidenceTraceabilityViewModel {
  readonly evidenceId: string;
  readonly domain: DomainId;
  readonly ruleId?: string;
  readonly calculationId?: string;
  readonly relatedEvidenceIds: readonly string[];
  readonly valid: boolean;
}

export interface EvidenceDetailViewModel {
  readonly id: string;
  readonly domain: DomainId;
  readonly role: EvidenceRole;
  readonly polarity: EvidencePolarity;
  readonly displayPolarity: 'SUPPORTING' | 'CHALLENGING' | 'CONFLICTING' | 'NEUTRAL';
  readonly title: string;
  readonly statement: string;
  readonly source: EvidenceSourceViewModel;
  readonly rule?: EvidenceRuleViewModel;
  readonly chartFact?: EvidenceChartFactViewModel;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly relatedEvidenceIds: readonly string[];
  readonly traceability: EvidenceTraceabilityViewModel;
  readonly availability: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
}

export type EvidenceIntegrityStatus = 'VALID' | 'PARTIAL' | 'INVALID';

export interface EvidenceIntegrityViewModel {
  readonly status: EvidenceIntegrityStatus;
  readonly totalReferenced: number;
  readonly resolved: number;
  readonly unresolved: number;
  readonly unresolvedIds: readonly string[];
}

export interface GroupedEvidenceViewModel {
  readonly primary: readonly EvidenceDetailViewModel[];
  readonly supporting: readonly EvidenceDetailViewModel[];
  readonly challenging: readonly EvidenceDetailViewModel[];
  readonly conflicting: readonly EvidenceDetailViewModel[];
  readonly modifiers: readonly EvidenceDetailViewModel[];
  readonly confirmations: readonly EvidenceDetailViewModel[];
  readonly timing: readonly EvidenceDetailViewModel[];
}

export type WealthDimensionKey =
  | 'ACCUMULATION'
  | 'GAINS'
  | 'FORTUNE'
  | 'SPECULATION';

export interface GroupedWealthDimensionEvidenceViewModel {
  readonly ACCUMULATION: readonly EvidenceDetailViewModel[];
  readonly GAINS: readonly EvidenceDetailViewModel[];
  readonly FORTUNE: readonly EvidenceDetailViewModel[];
  readonly SPECULATION: readonly EvidenceDetailViewModel[];
  readonly UNCLASSIFIED: readonly EvidenceDetailViewModel[];
}

export interface WhyExperienceViewModel {
  readonly integrity: EvidenceIntegrityViewModel;
  readonly evidence: readonly EvidenceDetailViewModel[];
  readonly grouped: GroupedEvidenceViewModel;
}
