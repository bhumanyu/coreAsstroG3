import type { ReasoningNodeDomain, ReasoningNode } from '../reasoningTrace/reasoningNode';
import type { ReasoningEdgeType } from '../reasoningTrace/reasoningEdge';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';
import type { CareerWealthFinalSynthesis } from '../finalSynthesis/careerWealthFinalSynthesisTypes';

export type CounterReasoningDomain = ReasoningNodeDomain;

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
  | 'DELAY'
  | 'OBSTACLE'
  | 'LOSS'
  | 'VOLATILITY'
  | 'CHALLENGE'
  | 'PROMOTION'
  | 'GROWTH'
  | 'STABILITY'
  | 'MANIFESTATION'
  | 'EMPLOYMENT'
  | 'LEADERSHIP'
  | 'BUSINESS'
  | 'TECHNICAL_SPECIALIZATION'
  | 'SUPPORT'
  | 'UNKNOWN';

export type CounterReasoningOutcomePolarity = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

export type CounterReasoningPolarity = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type CounterReasoningRelation = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type CounterReasoningAlignment = 'ALIGNS' | 'OPPOSES' | 'NEUTRAL';

export type CounterReasoningEdgeSemantic =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'ACTIVATION'
  | 'MODIFICATION'
  | 'CONFIRMATION'
  | 'NEUTRAL';

export type CounterReasoningPropositionAlignment =
  | 'SUPPORTS_PROPOSITION'
  | 'OPPOSES_PROPOSITION'
  | 'NEUTRAL';

export type CounterReasoningAssertionMode = 'AFFIRM' | 'DENY' | 'QUESTION';
export type CounterReasoningAssertionPolarity = 'POSITIVE' | 'NEGATED';

export type OutcomeMatch = 'EXACT' | 'ABSENT' | 'UNSPECIFIED';

export interface CounterReasoningClaim {
  readonly domain: ReasoningNodeDomain;
  readonly question: string;
  readonly questionType: CounterReasoningQuestionType;
  readonly targetSubjectKey: string;
  readonly polarity?: CounterReasoningPolarity;
  readonly assertedPolarity: CounterReasoningPolarity;
  readonly assertedOutcome?: CounterReasoningOutcome;
  readonly assertionMode: CounterReasoningAssertionMode;
  readonly assertionPolarity: CounterReasoningAssertionPolarity;
  readonly subjectQualifier?: string;
}

export interface CounterReasoningFactor {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: CounterReasoningRelation;
  readonly outcomeSemantics?: readonly CounterReasoningOutcome[];
}

export interface EvaluatedFactorRelation {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: CounterReasoningRelation;
  readonly edgeSemantic: CounterReasoningEdgeSemantic;
  readonly outcomeMatch: OutcomeMatch;
  readonly alignment: CounterReasoningAlignment;
  readonly reason?: string;
}

export interface EvaluatedCounterReasoningFactor {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: CounterReasoningRelation;
  readonly edgeSemantic: CounterReasoningEdgeSemantic;
  readonly outcomeMatch: OutcomeMatch;
  readonly propositionAlignment: CounterReasoningPropositionAlignment;
  /**
   * Raw domain relation alignment (for trace introspection only).
   * Note: propositionAlignment is derived from it and is the single authoritative field consumed downstream.
   * Design note: Avoid confusing raw domain relation (relationAlignment=ALIGNS) with proposition alignment (e.g. propositionAlignment=OPPOSES_PROPOSITION under negative assertion or negative polarity). Downstream evaluation consumes ONLY propositionAlignment.
   */
  readonly relationAlignment?: CounterReasoningAlignment;
  readonly reason?: string;
}

export type CounterReasoningPropositionFactor = EvaluatedCounterReasoningFactor;

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

export interface CounterReasoningResult {
  readonly claim: CounterReasoningClaim;
  readonly disposition: CounterReasoningDisposition;
  readonly conclusionChanged: false;
  readonly originalConclusion?: string;
  readonly assertionMode: CounterReasoningAssertionMode;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly evaluatedFactors: readonly EvaluatedCounterReasoningFactor[];
  readonly rebuttal: string;
  readonly guardrailApplied: boolean;
  readonly guardrailReasons: readonly string[];
}

export type CounterReasoningOutput = CounterReasoningResult;


