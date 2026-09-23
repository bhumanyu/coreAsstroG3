import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength,
  CareerDashaActivationHierarchy
} from '../careerDasha';

import type {
  CareerD10QualificationDirection,
  CareerD10QualificationStrength,
  CareerD10QualificationEffect
} from '../careerD10';

import type {
  CareerExpressionStrength,
  CareerExpressionDirection
} from '../careerExpression';

import type { CareerManifestationMode } from '../careerTypes';

/**
 * C8 → C11 Direction Mapping
 *
 * Maps Career Expression Layer (C8) vocabulary to Final Synthesis Layer (C11) vocabulary.
 *
 * C8 CareerExpressionDirection → C11 CareerFinalDirection:
 * - 'SUPPORTED' → 'SUPPORT'
 * - 'CONDITIONAL' → 'CHALLENGE' (conditional support is treated as a challenge in final synthesis)
 * - 'NEUTRAL' → 'NEUTRAL'
 * - 'UNAVAILABLE' → 'UNAVAILABLE'
 *
 * This mapping ensures semantic consistency between expression-level assessment and final synthesis,
 * while respecting the C11 invariant that conditional support cannot override natal challenges.
 */

export type CareerFinalDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type CareerFinalStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type CareerFinalStatus =
  | 'SUPPORTED'
  | 'CONDITIONALLY_SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_DATA';

export type CareerFinalConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type CareerFinalTimingStatus =
  | 'ACTIVE'
  | 'PARTIALLY_ACTIVE'
  | 'CHALLENGED'
  | 'NOT_ACTIVE'
  | 'UNKNOWN';

export interface CareerFinalExpression {
  readonly mode: CareerManifestationMode;
  readonly direction: CareerFinalDirection;
  readonly strength: CareerFinalStrength;
  readonly qualified: boolean;
  readonly evidenceIds: readonly string[];
}

export interface CareerFinalConflict {
  readonly source:
  | 'NATAL'
  | 'EXPRESSION'
  | 'D10'
  | 'DASHA'
  | 'TRANSIT';

  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED';

  readonly severity:
  | 'LOW'
  | 'MODERATE'
  | 'HIGH';

  readonly evidenceIds: readonly string[];

  readonly statement: string;
}

export interface CareerFinalEvidenceTrace {
  readonly evidenceIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * C11 Final Synthesis Input Contract
 *
 * Canonical input contract for Career Final Synthesis (C11).
 * Consumes outputs from C1–C10 layers to produce the authoritative final career assessment.
 *
 * C11 Invariants Enforced at Boundary:
 * - C11-INV-01: Natal promise is authoritative; secondary layers (Dasha, D10, Expression, Transit) cannot manufacture natal promise
 * - C11-INV-02: Dasha hierarchy must come from canonical C9 CareerDashaActivationHierarchy (MD > AD > PD)
 * - C11-INV-03: Transit may only affect timingStatus/currentPressure, never finalDirection/finalStrength/natalDirection
 * - C11-INV-04: Dasha/D10/Expression/Transit cannot override strong natal support to produce negative final direction
 * - C11-INV-05: Missing evidence ≠ negative evidence; absence of data must not be treated as challenge
 * - C11-INV-06: Evidence traceability: evidenceIds (canonical identity), sourceIds (provenance occurrences), ruleIds (rule identity) are distinct
 * - C11-INV-07: Dasha challenge modifies timing status, not natal direction
 * - C11-INV-08: Transit cannot rewrite natal promise; it is a timing modifier only
 * - C11-INV-09: Dasha hierarchy MD > AD > PD is canonical and must not be re-derived from dashaEffect/dashaDirection/dashaStrength
 * - C11-INV-10: Strong natal support (VERY_STRONG/STRONG) cannot be erased by D10 challenge alone
 * - C11-INV-11: Final synthesis is deterministic and byte-identical for identical inputs
 * - C11-INV-12: Output result is frozen (Object.freeze) to ensure immutability
 *
 * Evidence Traceability Contract (from commit 7217fa5):
 * - evidenceIds: Canonical identity of evidence items (deduplicated)
 * - sourceIds: Provenance occurrences (may include duplicates for multiple factor applications)
 * - ruleIds: Rule identity (deduplicated)
 */
export interface CareerFinalSynthesisInput {
  /**
   * C4 Structural Reasoning output: natal career direction.
   * This is the authoritative foundation; all secondary layers qualify but cannot override.
   */
  readonly natalDirection: CareerStructuralDirection;

  /**
   * C4 Structural Reasoning output: natal career strength.
   * This is the authoritative foundation; all secondary layers qualify but cannot override.
   */
  readonly natalStrength: CareerStructuralStrength;

  /**
   * C8 Career Expression output: overall expression strength.
   * Used to qualify natal promise but cannot manufacture natal promise where none exists.
   */
  readonly expressionStrength?: CareerExpressionStrength;

  /**
   * C9 Career Dasha output: combined activation effect.
   * Must be derived from canonical CareerDashaActivationHierarchy (MD > AD > PD).
   */
  readonly dashaEffect?: CareerDashaActivationEffect;

  /**
   * C9 Career Dasha output: combined activation direction.
   * Must be derived from canonical CareerDashaActivationHierarchy (MD > AD > PD).
   */
  readonly dashaDirection?: CareerDashaActivationDirection;

  /**
   * C9 Career Dasha output: combined activation strength.
   * Must be derived from canonical CareerDashaActivationHierarchy (MD > AD > PD).
   */
  readonly dashaStrength?: CareerDashaActivationStrength;

  /**
   * C9 Career Dasha output: canonical activation hierarchy (MD > AD > PD).
   * REQUIRED for C11-INV-02 and C11-INV-09 compliance.
   * C11 must not independently re-derive hierarchy from dashaEffect/dashaDirection/dashaStrength.
   */
  readonly dashaHierarchy?: CareerDashaActivationHierarchy;

  /**
   * C10 Career D10 output: qualification effect.
   * Used to qualify natal promise but cannot override strong natal support (C11-INV-10).
   */
  readonly d10Effect?: CareerD10QualificationEffect;

  /**
   * C10 Career D10 output: qualification direction.
   * Used to qualify natal promise but cannot override strong natal support (C11-INV-10).
   */
  readonly d10Direction?: CareerD10QualificationDirection;

  /**
   * C10 Career D10 output: qualification strength.
   * Used to qualify natal promise but cannot override strong natal support (C11-INV-10).
   */
  readonly d10Strength?: CareerD10QualificationStrength;

  /**
   * Transit layer output: transit direction.
   * C11-INV-03: Transit may only affect timingStatus/currentPressure, never finalDirection/finalStrength/natalDirection.
   * C11-INV-08: Transit cannot rewrite natal promise; it is a timing modifier only.
   */
  readonly transitDirection?: CareerFinalDirection;

  /**
   * C8 Career Expression output: per-mode expression assessments.
   * Each expression uses CareerManifestationMode (canonical manifestation identifier).
   */
  readonly expressions?: readonly CareerFinalExpression[];

  /**
   * Conflict detection output: layer conflicts.
   * Used to surface contradictions between layers for diagnostic purposes.
   */
  readonly conflicts?: readonly CareerFinalConflict[];

  /**
   * Evidence traceability: canonical identity of evidence items (deduplicated).
   * See C11-INV-06 for traceability contract.
   */
  readonly evidenceIds?: readonly string[];

  /**
   * Evidence traceability: provenance occurrences (may include duplicates).
   * See C11-INV-06 for traceability contract.
   */
  readonly sourceIds?: readonly string[];

  /**
   * Evidence traceability: rule identity (deduplicated).
   * See C11-INV-06 for traceability contract.
   */
  readonly ruleIds?: readonly string[];
}

/**
 * C11 Final Synthesis Result Contract
 *
 * Canonical output contract for Career Final Synthesis (C11).
 * Produces the authoritative final career assessment from C1–C10 layer outputs.
 *
 * C11 Invariants Enforced in Output:
 * - C11-INV-01: Natal promise is authoritative; finalDirection/finalStrength respect natal ceiling
 * - C11-INV-02: Dasha hierarchy is canonical (MD > AD > PD) as reflected in dashaEffect/dashaDirection
 * - C11-INV-03: Transit only affects timingStatus/currentPressure, not finalDirection/finalStrength/natalDirection
 * - C11-INV-04: Strong natal support not erased by D10 challenge (enforced in finalStatus derivation)
 * - C11-INV-05: Missing evidence ≠ negative evidence (reflected in confidence and status)
 * - C11-INV-06: Evidence traceability: evidenceIds, sourceIds, ruleIds are distinct and populated
 * - C11-INV-07: Dasha challenge modifies timingStatus, not natalDirection (natalDirection is preserved)
 * - C11-INV-08: Transit cannot rewrite natal promise (transitDirection is separate from finalDirection)
 * - C11-INV-09: Dasha hierarchy MD > AD > PD is canonical (reflected in dashaEffect/dashaDirection)
 * - C11-INV-10: Strong natal support preserved in finalStatus (natal ceiling enforcement)
 * - C11-INV-11: Deterministic output (implementation must be pure and deterministic)
 * - C11-INV-12: Frozen result (implementation must use Object.freeze)
 *
 * Output Fields:
 * - finalStatus: Overall career status (SUPPORTED/CONDITIONALLY_SUPPORTED/MIXED/CHALLENGED/INSUFFICIENT_DATA)
 * - finalDirection: Final direction (SUPPORT/CHALLENGE/MIXED/NEUTRAL/UNAVAILABLE)
 * - finalStrength: Final strength (VERY_STRONG/STRONG/MODERATE/MIXED/WEAK/VERY_WEAK/UNDETERMINED)
 * - confidence: Overall confidence (HIGH/MEDIUM/LOW)
 * - natalDirection/natalStrength: Preserved natal foundation (authoritative)
 * - expressionStatus/d10Direction/dashaDirection/timingStatus/transitDirection: Layer-specific directions
 * - timingStatus: Timing activation status (ACTIVE/PARTIALLY_ACTIVE/CHALLENGED/NOT_ACTIVE/UNKNOWN)
 * - currentPressure: Current pressure level (NONE/LOW/MODERATE/HIGH/STRONG/UNKNOWN)
 * - expressions: Per-mode expression assessments
 * - strongestExpressions/challengedExpressions: Mode names for quick reference
 * - conflicts: Detected layer conflicts
 * - evidenceIds/sourceIds/ruleIds/evidenceTrace: Evidence traceability
 * - statement: Human-readable summary
 */
export interface CareerFinalSynthesisResult {
  readonly reasoningVersion: 'C11';

  readonly domain: 'CAREER';

  readonly finalStatus: CareerFinalStatus;

  readonly finalDirection: CareerFinalDirection;

  readonly finalStrength: CareerFinalStrength;

  readonly confidence: CareerFinalConfidence;

  readonly natalDirection: CareerFinalDirection;

  readonly natalStrength: CareerFinalStrength;

  readonly expressionStatus: CareerFinalDirection;

  readonly d10Direction: CareerFinalDirection;

  readonly d10Effect: CareerD10QualificationEffect | 'UNKNOWN';

  readonly dashaEffect: CareerDashaActivationEffect;

  readonly dashaDirection: CareerFinalDirection;

  readonly timingStatus: CareerFinalTimingStatus;

  readonly transitDirection: CareerFinalDirection;

  readonly currentPressure:
  | 'NONE'
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'STRONG'
  | 'UNKNOWN';

  readonly expressions: readonly CareerFinalExpression[];

  readonly strongestExpressions: readonly string[];

  readonly challengedExpressions: readonly string[];

  readonly conflicts: readonly CareerFinalConflict[];

  readonly evidenceIds: readonly string[];

  readonly sourceIds: readonly string[];

  readonly ruleIds: readonly string[];

  readonly evidenceTrace: CareerFinalEvidenceTrace;

  readonly statement: string;
}
