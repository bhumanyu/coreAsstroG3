import type { Horoscope } from '../../types';
import { systemClock } from '../../core/analysis/Clock';
import { buildProductAiContext } from '../context/aiContextFactory';
import { buildSelectedPeriodEvidenceIndex } from '../context/selectedPeriodEvidenceHelper';
import { createAiRequest } from '../api/createAiRequest';
import { createDefaultAiRouter } from '../routing/createDefaultAiRouter';
import type { AiRouter } from '../routing/AiRouter';
import type { AiTask } from '../types/aiRequestTypes';
import type { AiRoutingResult } from '../routing/aiRoutingTypes';
import type { AiEvidence, AiContext } from '../types/aiContextTypes';
import type { DomainInterpretation, DomainEvidence } from '../../domain/interpretation';
import type { LifeAnalysis } from '../../domain/synthesis';
import type { AnalysisTemporalState } from '../../core/analysis/AnalysisTemporalState';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
import type {
  SelectedPeriodSynthesisValue
} from '../../domain/synthesis/selectedPeriodSynthesis';
import {
  isAiExplanationStructuredOutput,
  type AiExplanationResult,
  type AiExplanationViewModel,
  type AiExplanationEvidence,
  type AiExplanationStructuredOutput
} from './aiExplanationTypes';

export interface RunProductAiExplanationOptions {
  readonly horoscope: Horoscope;
  readonly task: AiTask;
  readonly domainInterpretations: readonly DomainInterpretation[];
  readonly lifeAnalysis: LifeAnalysis;
  readonly temporalState: AnalysisTemporalState;
  readonly router?: AiRouter;
  /**
   * Optional selected-period synthesis for SELECTED_PERIOD_ANALYSIS task.
   * When provided, this is projected into AI context as an additive field.
   */
  readonly selectedPeriod?: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData>;
  /**
   * Optional selected-period evidence collections for SELECTED_PERIOD_ANALYSIS task.
   * When provided with selectedPeriod, these are projected into selectedPeriod.availableEvidence
   * for evidence resolution in SELECTED_PERIOD_ANALYSIS tasks.
   */
  readonly selectedPeriodEvidence?: {
    readonly careerEvidence?: readonly DomainEvidence[];
    readonly careerDashaEvidence?: readonly DomainEvidence[];
    readonly wealthEvidence?: readonly DomainEvidence[];
  };
}

export type RunAiExplanationOptions = RunProductAiExplanationOptions;

export async function runAiExplanation(
  options: RunProductAiExplanationOptions
): Promise<AiExplanationResult> {
  const requestId = createRequestId();

  // Build context and extract traceability IDs once before try/catch
  // These are computed once and reused in both success and error paths
  let context: AiContext;
  let traceabilityIds: readonly string[];
  try {
    context = buildProductAiContext(options.horoscope, {
      domainInterpretations: options.domainInterpretations,
      lifeAnalysis: options.lifeAnalysis,
      temporalState: options.temporalState,
      selectedPeriod: options.selectedPeriod,
      selectedPeriodEvidence: options.selectedPeriodEvidence
    });
    traceabilityIds = extractTraceabilityIds(context);
  } catch (contextError) {
    // If context construction itself throws, fall back to empty traceability IDs
    traceabilityIds = [];
    // Since context construction failed, we need to return error immediately
    return Object.freeze({
      kind: 'ERROR',
      requestId,
      task: options.task,
      status: 'ERROR',
      message: getSafeAiExplanationErrorMessage(contextError),
      warnings: Object.freeze([])
    });
  }

  try {
    const request = createAiRequest(
      options.task,
      context,
      'STRUCTURED',
      requestId,
      traceabilityIds
    );

    const router = options.router ?? createDefaultAiRouter();

    /**
     * P-026 intentionally uses LOCAL_ONLY.
     *
     * This proves the complete product path
     * without introducing network dependencies.
     */
    const routingResult = await router.route(request, {
      mode: 'LOCAL_ONLY',
      fallbackPolicy: 'NO_FALLBACK'
    });

    return mapRoutingResultToViewModel(
      routingResult,
      context.evidence,
      context.selectedPeriod,
      options.task
    );
  } catch (error) {
    // Use the real requestId, not evidence-IDs-as-request-id
    // Traceability IDs are already on the request object
    return Object.freeze({
      kind: 'ERROR',
      requestId,
      task: options.task,
      status: 'ERROR',
      message: getSafeAiExplanationErrorMessage(error),
      warnings: Object.freeze([])
    });
  }
}

function mapRoutingResultToViewModel(
  result: AiRoutingResult,
  evidence: readonly AiEvidence[],
  selectedPeriod: AiContext['selectedPeriod'],
  task: AiTask
): AiExplanationResult {
  const rawStructured = result.response.structuredOutput;
  const structured = extractStructuredOutput(rawStructured);
  const structuredOutputWasProvided =
    rawStructured !== undefined && rawStructured !== null;

  if (structured) {
    const mergedWarnings = mergeWarnings(
      structured.warnings,
      result.response.warnings
    );

    if (structured.status === 'ERROR') {
      return Object.freeze({
        kind: 'ERROR',
        requestId: result.requestId,
        task,
        status: 'ERROR',
        message:
          structured.conclusion ||
          'AI explanation could not be generated.',
        warnings: mergedWarnings
      });
    }

    const status: 'SUCCESS' | 'PARTIAL' =
      structured.status === 'PARTIAL' ? 'PARTIAL' : 'SUCCESS';

    const resolvedSupporting = resolveEvidence(
      structured.supportingEvidenceIds,
      evidence,
      selectedPeriod,
      task,
      'SUPPORTING'
    );
    const resolvedChallenging = resolveEvidence(
      structured.challengingEvidenceIds,
      evidence,
      selectedPeriod,
      task,
      'CHALLENGING'
    );

    // Add unresolved IDs to unresolvedQuestions
    const unresolvedIds = [
      ...resolvedSupporting.unresolvedIds,
      ...resolvedChallenging.unresolvedIds
    ];
    const extendedUnresolvedQuestions = unresolvedIds.length > 0
      ? [
        ...structured.unresolvedQuestions,
        `The following evidence IDs could not be resolved: ${unresolvedIds.join(', ')}`
      ]
      : structured.unresolvedQuestions;

    return Object.freeze({
      kind: 'SUCCESS',
      requestId: result.requestId,
      task,
      status,
      conclusion: structured.conclusion,
      supportingEvidence: resolvedSupporting.evidence,
      challengingEvidence: resolvedChallenging.evidence,
      unresolvedQuestions: Object.freeze(extendedUnresolvedQuestions),
      warnings: mergedWarnings,
      triggeredRuleIds: Object.freeze([...(structured.triggeredRuleIds ?? [])]),
      providerId: result.providerId,
      providerName: result.providerName,
      providerKind: result.providerKind,
      routingMode: result.routingMode,
      fallbackUsed: result.fallbackUsed,
      selectionReason: result.selectionReason,
      generatedAt: systemClock.now()
    });
  }

  const fallbackWarnings = structuredOutputWasProvided
    ? [
      'Structured AI explanation was unavailable; displaying the available textual explanation.'
    ]
    : [];

  const content = result.response.content?.trim() ?? '';

  if (!content) {
    return Object.freeze({
      kind: 'ERROR',
      requestId: result.requestId,
      task,
      status: 'ERROR',
      message: structuredOutputWasProvided
        ? 'AI explanation returned an invalid structured response.'
        : 'AI explanation returned no usable content.',
      warnings: mergeWarnings(
        fallbackWarnings,
        result.response.warnings
      )
    });
  }

  return Object.freeze({
    kind: 'SUCCESS',
    requestId: result.requestId,
    task,
    status: 'PARTIAL',
    conclusion: content,
    supportingEvidence: Object.freeze([]),
    challengingEvidence: Object.freeze([]),
    unresolvedQuestions: Object.freeze([]),
    warnings: mergeWarnings(fallbackWarnings, result.response.warnings),
    triggeredRuleIds: Object.freeze([]),
    providerId: result.providerId,
    providerName: result.providerName,
    providerKind: result.providerKind,
    routingMode: result.routingMode,
    fallbackUsed: result.fallbackUsed,
    selectionReason: result.selectionReason,
    generatedAt: systemClock.now()
  });
}

function mergeWarnings(
  structuredWarnings: readonly string[],
  responseWarnings: readonly string[] | undefined
): readonly string[] {
  return Object.freeze([
    ...new Set([
      ...structuredWarnings,
      ...(responseWarnings ?? [])
    ])
  ]);
}

function getSafeAiExplanationErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.name === 'ValidationError'
  ) {
    return 'The AI explanation request was invalid.';
  }

  return 'AI explanation could not be generated.';
}

function extractStructuredOutput(
  value: unknown
): AiExplanationStructuredOutput | undefined {
  if (isAiExplanationStructuredOutput(value)) {
    return value;
  }
  return undefined;
}

function resolveEvidence(
  ids: readonly string[],
  evidence: readonly AiEvidence[],
  selectedPeriod: AiContext['selectedPeriod'],
  task: AiTask,
  role: 'SUPPORTING' | 'CHALLENGING'
): { evidence: readonly AiExplanationEvidence[]; unresolvedIds: readonly string[] } {
  const evidenceById = new Map(
    evidence.map((item) => [item.id, item])
  );

  // Build selected-period evidence index for SELECTED_PERIOD_ANALYSIS task
  // This index maps evidence IDs to actual AiEvidence objects from both
  // selectedPeriod collections and context.evidence
  const selectedPeriodEvidenceResult = task === 'SELECTED_PERIOD_ANALYSIS'
    ? buildSelectedPeriodEvidenceIndex(evidence, selectedPeriod)
    : null;

  const resolved: AiExplanationEvidence[] = [];
  const unresolvedIds: string[] = [];

  for (const id of ids) {
    // If the ID is ambiguous, mark it as unresolved and skip lookup
    if (selectedPeriodEvidenceResult && selectedPeriodEvidenceResult.ambiguousIds.includes(id)) {
      unresolvedIds.push(id);
      continue;
    }

    // For SELECTED_PERIOD_ANALYSIS, look up in selectedPeriodEvidenceIndex first
    // For other tasks, validate against context.evidence
    const item = task === 'SELECTED_PERIOD_ANALYSIS' && selectedPeriodEvidenceResult
      ? selectedPeriodEvidenceResult.index.get(id)
      : evidenceById.get(id);

    if (!item) {
      unresolvedIds.push(id);
      continue;
    }

    resolved.push(
      Object.freeze({
        evidence: item,
        role
      })
    );
  }

  return {
    evidence: Object.freeze(resolved),
    unresolvedIds: Object.freeze(unresolvedIds)
  };
}

function createRequestId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `ai-ui-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function extractTraceabilityIds(context: AiContext): readonly string[] {
  const ids = new Set<string>();

  // Extract from context.evidence
  if (context.evidence) {
    for (const evidence of context.evidence) {
      if (evidence.id) {
        ids.add(evidence.id);
      }
    }
  }

  // Extract from selectedPeriod context if present
  if (context.selectedPeriod) {
    // From career expressions
    if (context.selectedPeriod.career?.expressions) {
      for (const expr of context.selectedPeriod.career.expressions) {
        expr.expressionEvidenceIds?.forEach((id: string) => ids.add(id));
        expr.qualifiedEvidenceIds?.forEach((id: string) => ids.add(id));
        expr.unqualifiedEvidenceIds?.forEach((id: string) => ids.add(id));
        expr.mdDashaEvidenceIds?.forEach((id: string) => ids.add(id));
        expr.adDashaEvidenceIds?.forEach((id: string) => ids.add(id));
      }
    }

    // From wealth dimensions
    if (context.selectedPeriod.wealth?.dimensions) {
      for (const dim of Object.values(context.selectedPeriod.wealth.dimensions)) {
        dim.promiseEvidenceIds?.forEach((id: string) => ids.add(id));
      }
    }

    // From evidence references
    if (context.selectedPeriod.evidence) {
      for (const ref of context.selectedPeriod.evidence) {
        if (ref.evidenceId) {
          ids.add(ref.evidenceId);
        }
      }
    }
  }

  return Array.from(ids);
}
