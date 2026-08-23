import type { CareerTimingActivation } from '../../domain/career/careerTypes';
import type { TimingActivationEffect } from '../../domain/interpretation/DomainInterpretationTypes';

export type DashaHierarchyLevel = 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';

export type DashaHierarchyRole = 'PRIMARY' | 'MODIFIER' | 'TRIGGER';

export const DASHA_HIERARCHY_ROLE: Readonly<Record<DashaHierarchyLevel, DashaHierarchyRole>> = Object.freeze({
  MAHADASHA: 'PRIMARY',
  ANTARDASHA: 'MODIFIER',
  PRATYANTARDASHA: 'TRIGGER'
});

export interface DashaHierarchyEvidenceRef {
  readonly evidenceId: string;
  readonly level: DashaHierarchyLevel;
  readonly role: DashaHierarchyRole;
}

export interface DashaCareerHierarchySynthesis {
  readonly primary: CareerTimingActivation;
  readonly modifier: CareerTimingActivation;
  readonly trigger: CareerTimingActivation;
  readonly overallEffect: TimingActivationEffect;
  readonly confidence: number;
  readonly evidence: readonly DashaHierarchyEvidenceRef[];
  readonly evidenceIds: readonly string[];
  readonly summary: string;
}

export interface DashaWealthDimensionHierarchy {
  readonly dimension: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly primary: TimingActivationEffect;
  readonly modifier: TimingActivationEffect;
  readonly trigger: TimingActivationEffect;
  readonly overallEffect: TimingActivationEffect;
  readonly confidence: number;
  readonly evidence: readonly DashaHierarchyEvidenceRef[];
  readonly evidenceIds: readonly string[];
}

export interface DashaWealthHierarchySynthesis {
  readonly dimensions: readonly DashaWealthDimensionHierarchy[];
  readonly evidence: readonly DashaHierarchyEvidenceRef[];
  readonly evidenceIds: readonly string[];
  readonly summary: string;
}
