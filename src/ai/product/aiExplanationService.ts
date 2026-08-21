import type { Horoscope } from '../../types';
import { buildAiContext, type BuildAiContextOptions } from '../context/aiContextFactory';
import { createAiRequest } from '../api/createAiRequest';
import { createDefaultAiRouter } from '../routing/createDefaultAiRouter';
import type { AiRouter } from '../routing/AiRouter';
import type { AiTask } from '../types/aiRequestTypes';
import type { AiRoutingResult } from '../routing/aiRoutingTypes';
import type { AiEvidence } from '../types/aiContextTypes';
import {
  isAiExplanationStructuredOutput,
  type AiExplanationResult,
  type AiExplanationViewModel,
  type AiExplanationEvidence,
  type AiExplanationStructuredOutput
} from './aiExplanationTypes';

export interface RunAiExplanationOptions extends BuildAiContextOptions {
  readonly horoscope: Horoscope;
  readonly task: AiTask;
  readonly router?: AiRouter;
}

export async function runAiExplanation(
  options: RunAiExplanationOptions
): Promise<AiExplanationResult> {
  const requestId = createRequestId();

  try {
    const context = buildAiContext(options.horoscope, {
      domainInterpretations: options.domainInterpretations,
      lifeAnalysis: options.lifeAnalysis
    });

    const request = createAiRequest(
      options.task,
      context,
      'STRUCTURED',
      requestId
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
      options.task
    );
  } catch (error) {
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

    return Object.freeze({
      kind: 'SUCCESS',
      requestId: result.requestId,
      task,
      status,
      conclusion: structured.conclusion,
      supportingEvidence: resolveEvidence(
        structured.supportingEvidenceIds,
        evidence,
        'SUPPORTING'
      ),
      challengingEvidence: resolveEvidence(
        structured.challengingEvidenceIds,
        evidence,
        'CHALLENGING'
      ),
      unresolvedQuestions: Object.freeze([...structured.unresolvedQuestions]),
      warnings: mergedWarnings,
      triggeredRuleIds: Object.freeze([...(structured.triggeredRuleIds ?? [])]),
      providerId: result.providerId,
      providerName: result.providerName,
      providerKind: result.providerKind,
      routingMode: result.routingMode,
      fallbackUsed: result.fallbackUsed,
      selectionReason: result.selectionReason,
      generatedAt: new Date().toISOString()
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
    generatedAt: new Date().toISOString()
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
  role: 'SUPPORTING' | 'CHALLENGING'
): readonly AiExplanationEvidence[] {
  const evidenceById = new Map(
    evidence.map((item) => [item.id, item])
  );

  const resolved: AiExplanationEvidence[] = [];

  for (const id of ids) {
    const item = evidenceById.get(id);
    if (!item) {
      continue;
    }

    resolved.push(
      Object.freeze({
        evidence: item,
        role
      })
    );
  }

  return Object.freeze(resolved);
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
