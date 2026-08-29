import type { ReasoningNodeDomain, ReasoningNode } from '../reasoningTrace/reasoningNode';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';
import type { CareerWealthFinalSynthesis } from '../finalSynthesis/careerWealthFinalSynthesisTypes';

export type CounterReasoningQuestionType =
  | 'WHY'
  | 'WHY_NOT'
  | 'DASHA_CHALLENGE'
  | 'DIVISIONAL_CHALLENGE'
  | 'TIMING_CHALLENGE'
  | 'WHAT_IF'
  | 'GENERAL_CHALLENGE';

export type CounterReasoningDisposition =
  | 'CONFIRMED'
  | 'PARTIALLY_CONFIRMED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNSUPPORTED_CLAIM';

export interface CounterReasoningClaim {
  readonly domain: ReasoningNodeDomain;
  readonly question: string;
  readonly questionType: CounterReasoningQuestionType;
  readonly targetSubjectKey: string;
  readonly polarity?: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
}

export interface CounterReasoningEvidenceResolution {
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly supportingNodes?: readonly ReasoningNode[];
  readonly challengingNodes?: readonly ReasoningNode[];
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
