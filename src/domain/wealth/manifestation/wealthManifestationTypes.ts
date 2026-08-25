import type { WealthDimension } from '../wealthTypes';

export type WealthManifestationDimension = WealthDimension;

export const CANONICAL_WEALTH_MANIFESTATION_DIMENSIONS: readonly WealthManifestationDimension[] = Object.freeze([
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
]);

/**
 * Wealth Manifestation Status (CW-04).
 *
 * Represents the resolved operational manifestation potential for a specific wealth dimension.
 *
 * Hierarchical Resolution Contract:
 * 1. Natal CHALLENGE => `CHALLENGED` (Natal ceiling: challenging natal promise cannot be overturned by secondary support).
 * 2. Natal NEUTRAL => `INSUFFICIENT_DATA` (Guardrail: secondary evidence cannot manufacture a manifestation without natal support).
 * 3. Natal SUPPORT:
 *    - With ANY secondary CHALLENGE (dasha, d2, or transit) => `MIXED`.
 *    - Else with structural secondary SUPPORT (dasha or d2) => `STRONGLY_SUPPORTED`.
 *    - Else with transit-only SUPPORT => `SUPPORTED`.
 *    - Else (all secondary neutral) => `SUPPORTED` (with low confidence).
 *
 * Note on `INSUFFICIENT_DATA`:
 * Indicates that the system lacks enough primary/natal evidence to establish a manifestation promise,
 * even when secondary timing/varga factors indicate support or pressure.
 */
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
