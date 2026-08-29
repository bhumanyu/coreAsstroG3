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

export interface CounterReasoningClaim {
  readonly domain: ReasoningNodeDomain;
  readonly question: string;
  readonly questionType: CounterReasoningQuestionType;
  readonly targetSubjectKey: string;
  readonly polarity?: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly assertedPolarity: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly assertedOutcome?: string;
  readonly subjectQualifier?: string;
}

export interface CounterReasoningFactor {
  readonly evidenceId: string;
  readonly edgeType: ReasoningEdgeType;
  readonly explanation: string;
  readonly relation: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
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
  readonly rebuttal: string;
  readonly guardrailApplied: boolean;
  readonly guardrailReasons: readonly string[];
}

