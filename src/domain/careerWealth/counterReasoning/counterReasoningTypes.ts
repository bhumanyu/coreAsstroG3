import type { ReasoningNodeDomain, ReasoningNode } from '../reasoningTrace/reasoningNode';
import type { ReasoningEdgeType } from '../reasoningTrace/reasoningEdge';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';
import type { CareerWealthFinalSynthesis } from '../finalSynthesis/careerWealthFinalSynthesisTypes';

export type CounterReasoningQuestionType =
  | 'WHY'
  | 'WHY_NOT'
  | 'DASHA_CHALLENGE'
  | 'DIVISIONAL_CHALLENGE'
  | 'TIMING_CHALLENGE'
  | 'MANIFESTATION_CHALLENGE'
  | 'WHAT_IF'
  | 'GENERAL_CHALLENGE'
  | 'UNKNOWN';

export type CounterReasoningDisposition =
  | 'CONFIRMED'
  | 'PARTIALLY_CONFIRMED'
  | 'REJECTED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNSUPPORTED_CLAIM';

export type CounterReasoningOutcome =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'DELAY'
  | 'OBSTACLE'
  | 'PROMOTION'
  | 'GROWTH'
  | 'LOSS'
  | 'STABILITY'
  | 'VOLATILITY'
  | 'MANIFESTATION'
  | 'EMPLOYMENT'
  | 'LEADERSHIP'
  | 'BUSINESS'
  | 'TECHNICAL_SPECIALIZATION'
  | 'UNKNOWN';

export interface CounterReasoningClaim {
  readonly domain: ReasoningNodeDomain;
  readonly question: string;
  readonly questionType: CounterReasoningQuestionType;
  readonly targetSubjectKey: string;
  readonly polarity?: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly assertedPolarity: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly assertedOutcome?: CounterReasoningOutcome;
  readonly subjectQualifier?: string;
}

export type CounterReasoningRelation = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type CounterReasoningAlignment = 'ALIGNS' | 'OPPOSES' | 'NEUTRAL';

export interface CounterReasoningFactor {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: CounterReasoningRelation;
}

export interface EvaluatedCounterReasoningFactor {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: CounterReasoningRelation;
  readonly alignment: CounterReasoningAlignment;
  readonly reason?: string;
}

export type CounterReasoningEdgeSemantic =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'ACTIVATION'
  | 'MODIFICATION'
  | 'CONFIRMATION'
  | 'NEUTRAL';

export type CounterReasoningOutcomePolarity = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type CounterReasoningPropositionAlignment =
  | 'SUPPORTS_PROPOSITION'
  | 'OPPOSES_PROPOSITION'
  | 'NEUTRAL';

export interface CounterReasoningPropositionFactor {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: CounterReasoningRelation;
  readonly edgeSemantic: CounterReasoningEdgeSemantic;
  readonly propositionAlignment: CounterReasoningPropositionAlignment;
  readonly reason?: string;
}

export interface CounterReasoningEvidenceResolution {
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly supportingNodes?: readonly ReasoningNode[];
  readonly challengingNodes?: readonly ReasoningNode[];
  readonly factors: readonly CounterReasoningFactor[];
}

export interface CounterReasoningContext {
  readonly domain: ReasoningNodeDomain;
  readonly graph: ReasoningTraceGraph;
  readonly finalSynthesis?: CareerWealthFinalSynthesis;
  readonly natalPromiseStatus?: string;
  readonly primaryEvidenceIds?: readonly string[];
  readonly secondaryEvidenceIds?: readonly string[];
}

export interface CounterReasoningOutput {
  readonly claim: CounterReasoningClaim;
  readonly disposition: CounterReasoningDisposition;
  readonly conclusionChanged: false;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly evaluatedFactors: readonly CounterReasoningPropositionFactor[];
  readonly rebuttal: string;
  readonly guardrailApplied: boolean;
  readonly guardrailReasons: readonly string[];
}

