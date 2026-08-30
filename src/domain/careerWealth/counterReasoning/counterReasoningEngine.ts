import type { ReasoningNodeDomain } from '../reasoningTrace/reasoningNode';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';
import type { CareerWealthFinalSynthesis } from '../finalSynthesis/careerWealthFinalSynthesisTypes';
import type {
  CounterReasoningClaim,
  CounterReasoningContext,
  CounterReasoningOutput,
  CounterReasoningQuestionType
} from './counterReasoningTypes';
import { resolveClaim } from './claimResolver';
import { findNodeBySubjectKey } from './reasoningGraphResolver';
import { resolveEvidence } from './evidenceResolver';
import { evaluateCounterArgument } from './counterArgumentEvaluator';
import { applyHierarchyGuardrails } from './counterReasoningGuardrails';
import { validateCounterReasoning } from './counterReasoningValidator';

export interface EvaluateOptions {
  readonly questionType?: CounterReasoningQuestionType;
  readonly targetSubjectKey?: string;
}

/**
 * Builds a CounterReasoningContext from domain, graph, and final synthesis objects.
 * Never performs recomputation or mutates input state.
 */
export function buildCounterReasoningContext(params: {
  readonly domain: ReasoningNodeDomain;
  readonly graph: ReasoningTraceGraph;
  readonly finalSynthesis?: CareerWealthFinalSynthesis;
}): CounterReasoningContext {
  const { domain, graph, finalSynthesis } = params;
  const natalPromiseStatus = finalSynthesis?.promiseStatus ?? finalSynthesis?.status;
  const primaryEvidenceIds = finalSynthesis?.natalEvidenceIds ?? [];
  const allEvidenceIds = finalSynthesis?.evidenceIds ?? [];
  const secondaryEvidenceIds = allEvidenceIds.filter((id) => !primaryEvidenceIds.includes(id));

  return {
    domain,
    graph,
    finalSynthesis,
    natalPromiseStatus,
    primaryEvidenceIds,
    secondaryEvidenceIds
  };
}

/**
 * Evaluates a user counter-reasoning or challenge question against the deterministic reasoning graph.
 * Invariants:
 * - Deterministic execution and ordering
 * - conclusionChanged is strictly false
 * - No mutation of graph or synthesis objects
 * - No LLM or external calls
 */
export function evaluateCounterReasoning(
  question: string,
  context: CounterReasoningContext,
  options?: EvaluateOptions
): CounterReasoningOutput {
  const claim: CounterReasoningClaim = resolveClaim({
    domain: context.domain,
    question,
    questionType: options?.questionType,
    targetSubjectKey: options?.targetSubjectKey
  });

  const originalConclusion =
    context.natalPromiseStatus ??
    context.finalSynthesis?.promiseStatus ??
    context.finalSynthesis?.status;

  // Short-circuit 1: WHAT_IF counterfactuals are unsupported in deterministic mode
  if (claim.questionType === 'WHAT_IF') {
    const output: CounterReasoningOutput = {
      claim,
      disposition: 'UNSUPPORTED_CLAIM',
      conclusionChanged: false,
      originalConclusion,
      assertionMode: claim.assertionMode,
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      evaluatedFactors: [],
      rebuttal: "Counterfactual 'what-if' scenarios are not supported in deterministic chart evaluation.",
      guardrailApplied: true,
      guardrailReasons: ['CW-07: What-if scenarios cannot alter deterministic birth chart facts.']
    };
    validateCounterReasoning(output);
    return output;
  }

  // Short-circuit 2: Target subjectKey not found in reasoning graph
  const targetNode = findNodeBySubjectKey(context.graph, claim.targetSubjectKey, context.domain);
  if (!targetNode) {
    const output: CounterReasoningOutput = {
      claim,
      disposition: 'UNSUPPORTED_CLAIM',
      conclusionChanged: false,
      originalConclusion,
      assertionMode: claim.assertionMode,
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      evaluatedFactors: [],
      rebuttal: `Target subject key '${claim.targetSubjectKey}' could not be matched in the reasoning graph.`,
      guardrailApplied: true,
      guardrailReasons: ['CW-07: Unknown or unrepresented subject key in graph topology.']
    };
    validateCounterReasoning(output);
    return output;
  }

  // Resolve supporting and challenging evidence
  const evidenceRes = resolveEvidence(context.graph, claim.targetSubjectKey, context.domain);

  // Evaluate counter-argument disposition and rebuttal
  const evalRes = evaluateCounterArgument({
    supportingEvidenceIds: evidenceRes.supportingEvidenceIds,
    challengingEvidenceIds: evidenceRes.challengingEvidenceIds,
    claim,
    context,
    factors: evidenceRes.factors
  });

  // Apply CW-01A hierarchy and protection guardrails
  const guardrailRes = applyHierarchyGuardrails({
    disposition: evalRes.disposition,
    claim,
    supportingEvidenceIds: evidenceRes.supportingEvidenceIds,
    challengingEvidenceIds: evidenceRes.challengingEvidenceIds,
    context
  });

  const output: CounterReasoningOutput = {
    claim,
    disposition: evalRes.disposition,
    conclusionChanged: false,
    originalConclusion,
    assertionMode: claim.assertionMode,
    supportingEvidenceIds: evidenceRes.supportingEvidenceIds,
    challengingEvidenceIds: evidenceRes.challengingEvidenceIds,
    evaluatedFactors: evalRes.evaluatedFactors,
    rebuttal: evalRes.rebuttal,
    guardrailApplied: guardrailRes.guardrailApplied,
    guardrailReasons: guardrailRes.guardrailReasons
  };

  validateCounterReasoning(output);
  return output;
}

export const evaluate = evaluateCounterReasoning;
