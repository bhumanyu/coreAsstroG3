import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import type { AnalysisTemporalState } from '../../core/analysis/AnalysisTemporalState';

export type ReasoningLayer =
  | 'PRIMARY_PROMISE'
  | 'SECONDARY_SUPPORT'
  | 'MODIFIER'
  | 'YOGA'
  | 'VARGA'
  | 'DASHA'
  | 'TRANSIT';

export type ReasoningDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type TimingLevel = 'MD' | 'AD' | 'PD';

export type DomainStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type NatalGuardrail =
  | 'NONE'
  | 'PRIMARY_SUPPORT_CAP'
  | 'PRIMARY_MIXED_CAP'
  | 'PRIMARY_CHALLENGE_CAP'
  | 'SECONDARY_CONTRADICTION'
  | 'MODIFIER_CAP'
  | 'NO_PRIMARY_PROMISE';

export interface NatalContradictionSummary {
  readonly hasContradiction: boolean;
  readonly primaryContradictionRatio: number;
  readonly secondaryContradictionRatio: number;
  readonly modifierContradictionRatio: number;
}

export type TimingActivationEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

export type EvidenceStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK';

export interface WeightedReasoningEvidence {
  readonly identityKey: string;
  readonly evidenceId: string;
  readonly ruleId?: string;
  readonly layer: ReasoningLayer;
  readonly direction: ReasoningDirection;
  readonly strength: EvidenceStrength;
  readonly priority: number;
  readonly weight: number;
  readonly statement: string;
  readonly relatedEvidenceIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly occurrenceCount?: number;
}

export interface LayerSummary {
  readonly layer: ReasoningLayer;
  readonly direction: ReasoningDirection;
  readonly weightedSupport: number;
  readonly weightedChallenge: number;
  readonly evidenceIds: readonly string[];
}

export interface DirectionalTimingResult {
  readonly level: TimingLevel;
  readonly effect: TimingActivationEffect;
  readonly confidence: number;
  readonly evidenceIds: readonly string[];
}

export interface TimingHierarchyResult {
  readonly md: DirectionalTimingResult;
  readonly ad: DirectionalTimingResult;
  readonly pd: DirectionalTimingResult;
  readonly finalEffect: TimingActivationEffect;
  readonly dominantLevel: TimingLevel | 'NONE';
  readonly rationale: string;
}

/**
 * Top-level domain reasoning result with canonical evidence IDs and occurrence-level source IDs.
 *
 * Canonical evidence IDs (*EvidenceIds) represent semantic identity (evidenceId, which equals identityKey after P0-08).
 * These are deduplicated - the same semantic fact appears once regardless of how many representations reference it.
 *
 * Occurrence-level source IDs (*SourceIds) provide provenance traceability to the original input evidence items.
 * These map to the sourceIds array in WeightedReasoningEvidence, which contains all occurrence IDs that were
 * merged into the canonical fact.
 */
export interface HierarchicalDomainResult {
  readonly natalDirection: ReasoningDirection;
  readonly natalStrength: DomainStrength;
  readonly layerSummaries: readonly LayerSummary[];
  readonly dasha: TimingHierarchyResult;
  readonly vargaDirection: ReasoningDirection;
  readonly transitDirection: ReasoningDirection;
  readonly finalStrength: DomainStrength;
  readonly finalStatement: string;
  readonly primaryEvidenceIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly unresolvedEvidenceIds: readonly string[];
  readonly primarySourceIds: readonly string[];
  readonly supportingSourceIds: readonly string[];
  readonly challengingSourceIds: readonly string[];
  readonly unresolvedSourceIds: readonly string[];
}

export interface ReasoningTrace {
  readonly primaryPromise: readonly WeightedReasoningEvidence[];
  readonly secondarySupport: readonly WeightedReasoningEvidence[];
  readonly modifiers: readonly WeightedReasoningEvidence[];
  readonly yogas: readonly WeightedReasoningEvidence[];
  readonly varga: readonly WeightedReasoningEvidence[];
  readonly dasha: readonly WeightedReasoningEvidence[];
  readonly transit: readonly WeightedReasoningEvidence[];
}

export interface DomainReasoningOptions {
  readonly context: AnalysisContext;
  readonly temporalState: AnalysisTemporalState;
}
