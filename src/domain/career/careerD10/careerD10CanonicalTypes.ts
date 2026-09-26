import type {
  CareerD10QualificationEffect,
  CareerD10QualificationDirection,
  CareerD10QualificationStrength,
  CareerD10EvidenceRole,
  CareerD10HouseRole
} from './careerD10QualificationTypes';

import type {
  CareerExpression
} from '../careerExpression';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  Planet
} from '../../../types';

/**
 * Canonical availability status for D10 data.
 */
export type CareerD10CanonicalAvailability =
  | 'AVAILABLE'
  | 'UNAVAILABLE';

/**
 * Canonical relationship type for D10 qualification.
 */
export type CareerD10CanonicalRelationship =
  | 'REINFORCES'
  | 'QUALIFIES'
  | 'MODIFIES'
  | 'CONFLICTS'
  | 'PRESERVES'
  | 'UNAVAILABLE';

/**
 * Canonical provenance for D10 evidence.
 * Tracks the source of evidence and its relationship to natal analysis.
 */
export interface CareerD10CanonicalProvenance {
  readonly source: 'C10_D10';
  readonly ruleIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly natalRootIds: readonly string[];
}

/**
 * Canonical evidence for D10 qualification.
 * Each evidence item has an identityKey (semantic identity) and id (occurrence identity).
 */
export interface CareerD10CanonicalEvidence {
  readonly identityKey: string;
  readonly id: string;
  readonly role: CareerD10EvidenceRole;
  readonly direction: CareerD10QualificationDirection;
  readonly d10Effect: CareerD10QualificationEffect;
  readonly d10Strength: CareerD10QualificationStrength;
  readonly statement: string;
  readonly sourceIds: readonly string[];
  readonly provenance: CareerD10CanonicalProvenance;
}

/**
 * Canonical conflict for D10 evidence.
 * Represents conflicts between supporting and challenging evidence for the same identity.
 */
export interface CareerD10Conflict {
  readonly identityKey: string;
  readonly supportEvidenceIds: readonly string[];
  readonly challengeEvidenceIds: readonly string[];
  readonly supportWeight: number;
  readonly challengeWeight: number;
  readonly statement: string;
}

/**
 * Canonical expression qualification.
 * D10 qualifies existing C8 expressions; it never creates new ones.
 */
export interface CareerD10ExpressionQualificationCanonical {
  readonly expressionId: string;
  readonly expression: CareerExpression;
  readonly qualified: boolean;
  readonly effect: CareerD10QualificationEffect;
  readonly direction: CareerD10QualificationDirection;
  readonly strength: CareerD10QualificationStrength;
  readonly evidence: readonly CareerD10CanonicalEvidence[];
  readonly statement: string;
}

/**
 * Canonical D10 analysis result.
 * This is the adapter-only output that wraps the existing C10 semantic engine.
 * Does NOT include dasha/timing/C11 fields (no dashaEffect, no timing, no finalConclusion).
 */
export interface CareerD10CanonicalAnalysis {
  readonly availability: CareerD10CanonicalAvailability;
  readonly natalDirection: CareerStructuralDirection;
  readonly natalStrength: CareerStructuralStrength;
  readonly d10Effect: CareerD10QualificationEffect;
  readonly d10Direction: CareerD10QualificationDirection;
  readonly d10Strength: CareerD10QualificationStrength;
  readonly qualifiedDirection: CareerD10QualificationDirection;
  readonly qualifiedStrength: CareerD10QualificationStrength;
  readonly natalPromisePreserved: boolean;
  readonly relationship: CareerD10CanonicalRelationship;
  readonly evidence: readonly CareerD10CanonicalEvidence[];
  readonly conflicts: readonly CareerD10Conflict[];
  readonly expressionQualifications: readonly CareerD10ExpressionQualificationCanonical[];
  readonly rootEvidenceIds: readonly string[];
  readonly statement: string;
}
