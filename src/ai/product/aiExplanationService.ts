import type { Horoscope } from '../../types';
import { buildAiContext } from '../context/aiContextFactory';
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

export interface RunAiExplanationOptions {
  readonly horoscope: Horoscope;
  readonly task: AiTask;
  readonly router?: AiRouter;
}

export async function runAiExplanation(
  options: RunAiExplanationOptions
): Promise<AiExplanationResult> {
  const requestId = createRequestId();

  try {
    const context = buildAiContext(options.horoscope);

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
      message:
        error instanceof Error
          ? error.message
          : 'AI explanation could not be generated.',
      warnings: Object.freeze([])
    });
  }
}

function mapRoutingResultToViewModel(
  result: AiRoutingResult,
  evidence: readonly AiEvidence[],
  task: AiTask
): AiExplanationResult {
  const structured = extractStructuredOutput(
    result.response.structuredOutput
  );

  if (structured) {
    if (structured.status === 'ERROR') {
      return Object.freeze({
        kind: 'ERROR',
        requestId: result.requestId,
        task,
        status: 'ERROR',
        message:
          structured.conclusion ||
          'AI explanation could not be generated.',
        warnings: Object.freeze([
          ...(structured.warnings ?? [])
        ])
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
      warnings: Object.freeze([...structured.warnings]),
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

  return Object.freeze({
    kind: 'SUCCESS',
    requestId: result.requestId,
    task,
    status: 'PARTIAL',
    conclusion: result.response.content || 'No explanation was produced.',
    supportingEvidence: Object.freeze([]),
    challengingEvidence: Object.freeze([]),
    unresolvedQuestions: Object.freeze([]),
    warnings: Object.freeze([...(result.response.warnings ?? [])]),
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
