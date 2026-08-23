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

export type NatalStrengthBand = DomainStrength;

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
  readonly evidenceId: string;
  readonly ruleId?: string;
  readonly layer: ReasoningLayer;
  readonly direction: ReasoningDirection;
  readonly strength: EvidenceStrength;
  readonly priority: number;
  readonly weight: number;
  readonly statement: string;
  readonly relatedEvidenceIds: readonly string[];
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
  readonly strategy?: 'LEGACY' | 'CW01';
}
