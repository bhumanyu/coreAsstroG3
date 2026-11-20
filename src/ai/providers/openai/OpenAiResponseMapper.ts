import type { AiRequest } from '../../types/aiRequestTypes';
import type { AiResponse } from '../../types/aiResponseTypes';
import type {
  RemoteAiHttpResponse,
  RemoteAiResponseMapper
} from '../remote';
import type {
  OpenAiResponseEnvelope,
  OpenAiStructuredReasoning
} from './OpenAiTypes';
import { buildSelectedPeriodEvidenceIndex } from '../../context/selectedPeriodEvidenceHelper';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asOpenAiResponse(body: unknown): OpenAiResponseEnvelope {
  if (!isRecord(body)) {
    throw new Error('OpenAI response body must be an object.');
  }
  return body as unknown as OpenAiResponseEnvelope;
}

function extractOutputText(response: OpenAiResponseEnvelope): string {
  if (!Array.isArray(response.output)) {
    throw new Error('OpenAI response output must be an array.');
  }

  const textParts: string[] = [];

  for (const item of response.output) {
    if (!isRecord(item)) {
      continue;
    }

    if (item.type === 'message') {
      if (!Array.isArray(item.content)) {
        throw new Error('OpenAI message output content must be an array.');
      }

      for (const part of item.content) {
        if (!isRecord(part)) {
          continue;
        }

        if (part.type === 'output_text' && typeof part.text === 'string') {
          textParts.push(part.text);
        }

        if (part.type === 'refusal') {
          throw new Error(
            'OpenAI model refused to produce the requested response.'
          );
        }
      }
    }
  }

  if (textParts.length === 0) {
    throw new Error('OpenAI response did not contain output text.');
  }

  return textParts.join('');
}

function isReasoningStatus(
  value: unknown
): value is OpenAiStructuredReasoning['status'] {
  return value === 'SUCCESS' || value === 'PARTIAL' || value === 'ERROR';
}

function requireStringArray(
  value: unknown,
  fieldName: string
): readonly string[] {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(`OpenAI structured output has invalid ${fieldName}.`);
  }

  return Object.freeze([...value]);
}

function parseStructuredOutput(
  text: string,
  requireSelectedPeriodSections: boolean
): OpenAiStructuredReasoning {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('OpenAI structured output was not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('OpenAI structured output must be an object.');
  }

  if (!isReasoningStatus(parsed.status)) {
    throw new Error('OpenAI structured output has invalid status.');
  }

  if (typeof parsed.conclusion !== 'string') {
    throw new Error('OpenAI structured output is missing conclusion.');
  }

  const optionalStringArray = (fieldName: string): readonly string[] | undefined => {
    if (parsed[fieldName] === undefined && !requireSelectedPeriodSections) {
      return undefined;
    }
    return requireStringArray(parsed[fieldName], fieldName);
  };
  const rawReasons = parsed.supportingReasons;
  let supportingReasons: OpenAiStructuredReasoning['supportingReasons'];
  if (rawReasons === undefined && !requireSelectedPeriodSections) {
    supportingReasons = undefined;
  } else {
    if (!Array.isArray(rawReasons)) {
      throw new Error('OpenAI structured output has invalid supportingReasons.');
    }
    supportingReasons = Object.freeze(rawReasons.map((reason) => {
      if (!isRecord(reason) || typeof reason.text !== 'string') {
        throw new Error('OpenAI structured output has invalid supportingReasons.');
      }
      const evidenceIds = requireStringArray(reason.evidenceIds, 'supportingReasons.evidenceIds');
      if (evidenceIds.length === 0) {
        throw new Error('OpenAI structured output has invalid supportingReasons.evidenceIds.');
      }
      return Object.freeze({
        text: reason.text,
        evidenceIds
      });
    }));
  }

  const parsedResult: OpenAiStructuredReasoning = {
    status: parsed.status,
    conclusion: parsed.conclusion,
    supportingEvidenceIds: requireStringArray(
      parsed.supportingEvidenceIds,
      'supportingEvidenceIds'
    ),
    challengingEvidenceIds: requireStringArray(
      parsed.challengingEvidenceIds,
      'challengingEvidenceIds'
    ),
    unresolvedQuestions: requireStringArray(
      parsed.unresolvedQuestions,
      'unresolvedQuestions'
    ),
    warnings: requireStringArray(
      parsed.warnings,
      'warnings'
    ),
    likelyThemes: optionalStringArray('likelyThemes'),
    supportingReasons,
    risks: optionalStringArray('risks'),
    uncertainties: optionalStringArray('uncertainties'),
    practicalFocus: optionalStringArray('practicalFocus')
  };

  return Object.freeze(parsedResult);
}

function validateEvidenceIds(
  request: AiRequest,
  result: OpenAiStructuredReasoning
): { result: OpenAiStructuredReasoning } {
  const selectedPeriodIndex = request.task === 'SELECTED_PERIOD_ANALYSIS'
    ? buildSelectedPeriodEvidenceIndex(
        request.context?.evidence ?? [],
        request.context?.selectedPeriod
      )
    : undefined;
  const knownIds = selectedPeriodIndex
    ? selectedPeriodIndex.index
    : new Map((request.context?.evidence ?? []).map((evidence) => [evidence.id, evidence]));
  const ambiguousIds = new Set(selectedPeriodIndex?.ambiguousIds ?? []);
  const invalidIds = new Set<string>();
  const keepKnownIds = (ids: readonly string[]) => ids.filter((id) => {
    if (!knownIds.has(id) || ambiguousIds.has(id)) {
      invalidIds.add(id);
      return false;
    }
    return true;
  });
  const supportingEvidenceIds = keepKnownIds(result.supportingEvidenceIds);
  const challengingEvidenceIds = keepKnownIds(result.challengingEvidenceIds);
  const supportingReasons = result.supportingReasons?.flatMap((reason) => {
    const evidenceIds = keepKnownIds(reason.evidenceIds);
    return evidenceIds.length > 0
      ? [Object.freeze({ ...reason, evidenceIds: Object.freeze(evidenceIds) })]
      : [];
  });
  const warnings = invalidIds.size > 0
    ? Object.freeze(['OpenAI response referenced unknown or ambiguous evidence IDs; unresolved references were omitted.'])
    : Object.freeze([]);

  return {
    result: Object.freeze({
      ...result,
      supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
      challengingEvidenceIds: Object.freeze(challengingEvidenceIds),
      ...(supportingReasons ? { supportingReasons: Object.freeze(supportingReasons) } : {}),
      warnings: Object.freeze([...result.warnings, ...warnings])
    })
  };
}

export class OpenAiResponseMapper implements RemoteAiResponseMapper {
  constructor(private readonly configuredModel?: string) {}

  map(request: AiRequest, response: RemoteAiHttpResponse): AiResponse {
    const openAiResponse = asOpenAiResponse(response.body);

    if (openAiResponse.status === 'failed') {
      throw new Error('OpenAI response generation failed.');
    }

    if (openAiResponse.status === 'incomplete') {
      throw new Error('OpenAI response generation was incomplete.');
    }

    const text = extractOutputText(openAiResponse);
    const usage = openAiResponse.usage;

    const metadata = {
      provider: 'openai' as const,
      model: openAiResponse.model ?? this.configuredModel,
      responseId: openAiResponse.id,
      tokensUsed: usage
        ? {
            prompt: usage.input_tokens,
            completion: usage.output_tokens,
            total: usage.total_tokens
          }
        : undefined
    };

    if (request.responseFormat === 'NARRATIVE') {
      return Object.freeze({
        requestId: request.requestId,
        content: text,
        format: 'NARRATIVE',
        warnings: Object.freeze([]),
        metadata: Object.freeze(metadata)
      });
    }

    const structured = parseStructuredOutput(
      text,
      request.task === 'SELECTED_PERIOD_ANALYSIS'
    );
    const validated = validateEvidenceIds(request, structured);

    return Object.freeze({
      requestId: request.requestId,
      content: validated.result.conclusion,
      structuredOutput: validated.result,
      format: 'STRUCTURED',
      warnings: validated.result.warnings,
      metadata: Object.freeze(metadata)
    });
  }
}
