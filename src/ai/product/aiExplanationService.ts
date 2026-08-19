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
): AiExplanationViewModel {
  const structured = extractStructuredOutput(
    result.response.structuredOutput
  );

  const rawStructured =
    typeof result.response.structuredOutput === 'object' &&
    result.response.structuredOutput !== null
      ? (result.response.structuredOutput as Record<string, unknown>)
      : undefined;

  const conclusion =
    structured?.conclusion ??
    (typeof rawStructured?.conclusion === 'string'
      ? rawStructured.conclusion
      : (result.response.content || 'No explanation was produced.'));

  const supportingIds: readonly string[] =
    structured?.supportingEvidenceIds ??
    (Array.isArray(rawStructured?.supportingEvidenceIds)
      ? (rawStructured.supportingEvidenceIds as string[])
      : []);

  const challengingIds: readonly string[] =
    structured?.challengingEvidenceIds ??
    (Array.isArray(rawStructured?.challengingEvidenceIds)
      ? (rawStructured.challengingEvidenceIds as string[])
      : []);

  const unresolvedQuestions: readonly string[] =
    structured?.unresolvedQuestions ??
    (Array.isArray(rawStructured?.unresolvedQuestions)
      ? (rawStructured.unresolvedQuestions as string[])
      : []);

  const warnings: readonly string[] =
    structured?.warnings ??
    (Array.isArray(rawStructured?.warnings)
      ? (rawStructured.warnings as string[])
      : (result.response.warnings ?? []));

  const triggeredRuleIds: readonly string[] =
    structured?.triggeredRuleIds ??
    (Array.isArray(rawStructured?.triggeredRuleIds)
      ? (rawStructured.triggeredRuleIds as string[])
      : []);

  const status: 'SUCCESS' | 'PARTIAL' =
    (structured?.status === 'PARTIAL' || rawStructured?.status === 'PARTIAL')
      ? 'PARTIAL'
      : 'SUCCESS';

  return Object.freeze({
    kind: 'SUCCESS',
    requestId: result.requestId,
    task,
    status,
    conclusion,
    supportingEvidence: resolveEvidence(
      supportingIds,
      evidence,
      'SUPPORTING'
    ),
    challengingEvidence: resolveEvidence(
      challengingIds,
      evidence,
      'CHALLENGING'
    ),
    unresolvedQuestions: Object.freeze([...unresolvedQuestions]),
    warnings: Object.freeze([...warnings]),
    triggeredRuleIds: Object.freeze([...triggeredRuleIds]),
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
