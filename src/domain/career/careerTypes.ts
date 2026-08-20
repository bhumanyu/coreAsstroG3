import type {
  ConfidenceLevel,
  TimingActivationEffect,
  ManifestationMode,
  DomainStrength,
  VargaRelationship
} from '../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';

export type CareerManifestationMode =
  | 'LEADERSHIP'
  | 'MANAGEMENT'
  | 'TECHNICAL_SPECIALIZATION'
  | 'SERVICE_EMPLOYMENT'
  | 'AUTHORITY'
  | 'INDEPENDENT_WORK'
  | 'BUSINESS_ENTREPRENEURSHIP'
  | 'PUBLIC_INSTITUTIONAL'
  | 'SPECIALIZATION'
  | 'EMPLOYMENT'
  | 'ENTREPRENEURSHIP';

export const CAREER_PRIMARY_HOUSES: ReadonlySet<number> = new Set([10]);
export const CAREER_SUPPORTING_HOUSES: ReadonlySet<number> = new Set([6, 2, 11]);
export const CAREER_PRIMARY_LORDS: ReadonlySet<string> = new Set(['10L']);
export const CAREER_SUPPORTING_LORDS: ReadonlySet<string> = new Set(['6L', '2L', '11L']);

export interface CareerManifestation {
  readonly mode: ManifestationMode;
  readonly confidence: ConfidenceLevel;
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface CareerTimingActivation {
  readonly period: 'MD' | 'AD' | 'PD';
  readonly effect: TimingActivationEffect;
  readonly activatedPromiseEvidenceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface CareerDataCompleteness {
  readonly primaryFactors: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  readonly d10: 'AVAILABLE' | 'UNAVAILABLE';
  readonly dasha: 'AVAILABLE' | 'UNAVAILABLE';
  readonly transit: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface CareerEvidenceClassification {
  readonly primary: readonly DomainEvidence[];
  readonly supporting: readonly DomainEvidence[];
  readonly challenging: readonly DomainEvidence[];
  readonly modifiers: readonly DomainEvidence[];
}

export interface CareerConclusionData {
  readonly natalStatus: DomainStrength;
  readonly currentActivation: 'ACTIVE' | 'PARTIALLY_ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  readonly currentPressure: 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
  readonly d10Relationship: VargaRelationship;
  readonly dominantManifestations: readonly ManifestationMode[];
  readonly headline: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
}
