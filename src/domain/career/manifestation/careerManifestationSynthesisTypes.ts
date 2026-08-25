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

/**
 * Career Manifestation Status (CW-04).
 *
 * Represents the resolved operational manifestation potential for a specific career mode.
 *
 * Hierarchical Resolution Contract:
 * 1. Natal CHALLENGE => `CHALLENGED` (Natal ceiling: challenging natal promise cannot be overturned by secondary support).
 * 2. Natal NEUTRAL => `INSUFFICIENT_DATA` (Guardrail: secondary evidence cannot manufacture a manifestation without natal support).
 * 3. Natal SUPPORT:
 *    - With ANY secondary CHALLENGE (dasha, d10, or transit) => `MIXED`.
 *    - Else with structural secondary SUPPORT (dasha or d10) => `STRONGLY_SUPPORTED`.
 *    - Else with transit-only SUPPORT => `SUPPORTED`.
 *    - Else (all secondary neutral) => `SUPPORTED` (with low confidence).
 *
 * Note on `INSUFFICIENT_DATA`:
 * Indicates that the system lacks enough primary/natal evidence to establish a manifestation promise,
 * even when secondary timing/varga factors indicate support or pressure.
 */
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
