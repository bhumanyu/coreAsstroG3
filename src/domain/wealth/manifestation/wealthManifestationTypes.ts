import type { WealthDimension } from '../wealthTypes';

export type WealthManifestationDimension = WealthDimension;

export const CANONICAL_WEALTH_MANIFESTATION_DIMENSIONS: readonly WealthManifestationDimension[] = Object.freeze([
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
]);

export type WealthManifestationStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_DATA';

export type WealthManifestationDirection = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
export type WealthManifestationSource = 'NATAL' | 'DASHA' | 'TRANSIT' | 'D2';

export interface WealthManifestationFactor {
  readonly id: string;
  readonly dimension: WealthManifestationDimension;
  readonly direction: WealthManifestationDirection;
  readonly weight: number;
  readonly source: WealthManifestationSource;
  readonly statement: string;
  readonly evidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
  readonly transitEvidenceIds?: readonly string[];
}

export interface WealthDimensionManifestationSynthesis {
  readonly reasoningVersion: 'CW-04';
  readonly dimension: WealthManifestationDimension;
  readonly status: WealthManifestationStatus;
  readonly confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly natalSupport: WealthManifestationDirection;
  readonly dashaSupport: WealthManifestationDirection;
  readonly transitSupport: WealthManifestationDirection;
  readonly d2Support: WealthManifestationDirection;
  readonly factors: readonly WealthManifestationFactor[];
  readonly summary: string;
}

export interface WealthManifestationSynthesis {
  readonly reasoningVersion: 'CW-04';
  readonly dimensions: Readonly<Record<WealthManifestationDimension, WealthDimensionManifestationSynthesis>>;
  readonly summary: string;
}
