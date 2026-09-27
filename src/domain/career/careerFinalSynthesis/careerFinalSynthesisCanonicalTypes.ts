import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis
} from '../careerExpression';

import type {
  CareerDashaCanonicalAnalysis
} from '../careerDasha';

import type {
  CareerD10CanonicalAnalysis
} from '../careerD10';

import type {
  CareerTimingSynthesis
} from '../../timing/careerWealthTiming';

import type {
  CareerFinalSynthesisResult
} from './careerFinalSynthesisTypes';

/**
 * C11 Final Career Synthesis Integration Input
 *
 * Canonical input contract for the C11 integration adapter.
 * Consumes canonical outputs from C4–C10 layers plus optional Timing.
 *
 * This is an adapter-only wave over the existing semantic engine — it does NOT
 * rewrite the engine or introduce new semantic logic.
 *
 * C11 Invariants:
 * - Adapter consumes canonical C4–C10 outputs plus optional Timing
 * - Adapter does NOT receive Horoscope
 * - Dasha hierarchy is consumed directly (no re-resolution)
 * - Missing evidence ≠ negative evidence
 * - Natal ceiling is preserved
 * - Evidence identity (evidenceIds/sourceIds/ruleIds) kept distinct with no new global dedup mechanism
 */
export interface CareerFinalSynthesisIntegrationInput {
  /**
   * C4–C7 natal analysis aggregate.
   * Provides natalDirection from natal.structural.direction and natalStrength from natal.structural.strength.
   */
  readonly natal: CareerNatalAnalysis;

  /**
   * C8 expression analysis.
   * Provides expressionStrength from expression.primaryExpression?.strength and per-mode expressions.
   */
  readonly expression: CareerExpressionAnalysis;

  /**
   * C9 Dasha canonical analysis.
   * Provides dashaHierarchy from dasha.hierarchy (optional — undefined if unavailable).
   */
  readonly dasha: CareerDashaCanonicalAnalysis;

  /**
   * C10 D10 canonical analysis.
   * Provides d10Effect, d10Direction, d10Strength from the analysis.
   */
  readonly d10: CareerD10CanonicalAnalysis;

  /**
   * Optional timing synthesis from transit layer.
   * Provides transitEffect for transitDirection mapping.
   * C4 natalPromise is NOT consumed — C4 remains authoritative.
   */
  readonly timing?: CareerTimingSynthesis;
}

/**
 * C11 Canonical Evidence Trace Envelope
 *
 * This is NOT a new semantic evidence engine — it only records identity/provenance
 * from already-canonical upstream evidence.
 *
 * The adapter collects evidence identity from:
 * - natal.evidence (WeightedReasoningEvidence with id)
 * - dasha.evidence (CareerDashaCanonicalEvidence with identityKey/id/sourceIds)
 * - d10.evidence (CareerD10CanonicalEvidence with identityKey/id/sourceIds)
 * - expression.supportingEvidenceIds (string array)
 *
 * This envelope preserves source identity without inventing new C11-specific IDs
 * and without re-running any dedup engine.
 */
export interface CareerFinalCanonicalEvidence {
  /**
   * Canonical identity key of the evidence item.
   * From upstream canonical evidence (e.g., CareerDashaCanonicalEvidence.identityKey).
   */
  readonly identityKey: string;

  /**
   * Source occurrence IDs from upstream evidence.
   * From upstream canonical evidence (e.g., CareerDashaCanonicalEvidence.sourceIds).
   */
  readonly sourceIds: readonly string[];

  /**
   * Rule IDs from upstream evidence.
   * From upstream canonical evidence (e.g., CareerDashaCanonicalEvidence.provenance.ruleIds).
   */
  readonly ruleIds: readonly string[];

  /**
   * Layer that produced this evidence.
   */
  readonly layer: 'NATAL' | 'EXPRESSION' | 'DASHA' | 'D10' | 'TIMING';
}
