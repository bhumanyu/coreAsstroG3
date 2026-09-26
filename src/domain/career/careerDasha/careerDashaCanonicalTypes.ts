import type {
  ReasoningDirection,
  DomainStrength
} from '../../reasoning/reasoningTypes';

import type {
  CareerDashaActivationHierarchy,
  CareerDashaActivationEvidence,
  CareerDashaTiming
} from './careerDashaActivationTypes';

import {
  Planet
} from '../../../types';

/**
 * Canonical effect type for C9 Dasha activation.
 * Maps to the reasoning domain effect types.
 */
export type CareerDashaCanonicalEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

/**
 * Canonical period level for Dasha activation.
 */
export type CareerDashaCanonicalLevel =
  | 'MD'
  | 'AD'
  | 'PD';

/**
 * Canonical role for Dasha period in the activation hierarchy.
 */
export type CareerDashaCanonicalRole =
  | 'PRIMARY_DRIVER'
  | 'MODIFIER'
  | 'REFINEMENT'
  | 'TRIGGER';

/**
 * Canonical evidence for C9 Dasha activation.
 * Provides provenance traceability with identityKey, sourceIds, and rootEvidenceIds.
 */
export interface CareerDashaCanonicalEvidence {
  readonly identityKey: string;
  readonly id: string;
  readonly level: CareerDashaCanonicalLevel;
  readonly planet?: Planet;
  readonly role: CareerDashaCanonicalRole;
  readonly effect: CareerDashaCanonicalEffect;
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;
  readonly statement: string;
  readonly sourceIds: readonly string[];
  readonly provenance: CareerDashaCanonicalProvenance;
}

/**
 * Provenance information for canonical Dasha evidence.
 */
export interface CareerDashaCanonicalProvenance {
  readonly source: 'C9_DASHA';
  readonly activationLevel: CareerDashaCanonicalLevel;
  readonly natalRootIds: readonly string[];
}

/**
 * Canonical period representation for a Dasha level (MD/AD/PD).
 */
export interface CareerDashaCanonicalPeriod {
  readonly level: CareerDashaCanonicalLevel;
  readonly planet?: Planet; // Optional to represent unavailable periods
  readonly role: CareerDashaCanonicalRole;
  readonly effect: CareerDashaCanonicalEffect;
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;
  readonly start?: string;
  readonly end?: string;
  readonly statement: string;
}

/**
 * Canonical analysis result for C9 Dasha activation.
 * Aggregates MD/AD/PD periods and evidence into a frozen immutable result.
 */
export interface CareerDashaCanonicalAnalysis {
  readonly overallEffect: CareerDashaCanonicalEffect;
  readonly overallDirection: ReasoningDirection;
  readonly overallStrength: DomainStrength;
  readonly dominantLevel: 'MD' | 'AD' | 'PD' | 'NONE';
  readonly md: CareerDashaCanonicalPeriod;
  readonly ad: CareerDashaCanonicalPeriod;
  readonly pd: CareerDashaCanonicalPeriod;
  readonly evidence: readonly CareerDashaCanonicalEvidence[];
  readonly rootEvidenceIds: readonly string[];
  readonly statement: string;
  readonly hierarchy?: CareerDashaActivationHierarchy;
}
