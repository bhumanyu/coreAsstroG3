import type { CareerManifestationMode } from '../careerTypes';

export type { CareerManifestationMode };

export const CANONICAL_CAREER_MANIFESTATION_MODES: readonly CareerManifestationMode[] = Object.freeze([
  'LEADERSHIP',
  'MANAGEMENT',
  'TECHNICAL_SPECIALIZATION',
  'SERVICE_EMPLOYMENT',
  'AUTHORITY',
  'INDEPENDENT_WORK',
  'BUSINESS_ENTREPRENEURSHIP'
]);

export type ManifestationStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_DATA';

export type ManifestationDirection = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
export type ManifestationSource = 'NATAL' | 'DASHA' | 'TRANSIT' | 'D10';

export interface CareerManifestationFactor {
  readonly id: string;
  readonly mode: CareerManifestationMode;
  readonly direction: ManifestationDirection;
  readonly weight: number;
  readonly source: ManifestationSource;
  readonly statement: string;
  readonly evidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
  readonly transitEvidenceIds?: readonly string[];
}

export interface CareerManifestationSynthesis {
  readonly reasoningVersion: 'CW-04';
  readonly mode: CareerManifestationMode;
  readonly status: ManifestationStatus;
  readonly confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly natalSupport: ManifestationDirection;
  readonly dashaSupport: ManifestationDirection;
  readonly transitSupport: ManifestationDirection;
  readonly d10Support: ManifestationDirection;
  readonly factors: readonly CareerManifestationFactor[];
  readonly summary: string;
}
