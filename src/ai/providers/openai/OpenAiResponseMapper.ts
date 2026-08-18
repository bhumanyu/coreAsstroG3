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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asOpenAiResponse(body: unknown): OpenAiResponseEnvelope {
  if (!isRecord(body)) {
    throw new Error('OpenAI response body must be an object.');
  }
  return body as OpenAiResponseEnvelope;
}

function requireOutputText(response: OpenAiResponseEnvelope): string {
  if (typeof response.output_text !== 'string') {
    throw new Error('OpenAI response did not contain output_text.');
  }
  return response.output_text;
}

function parseStructuredOutput(text: string): OpenAiStructuredReasoning {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('OpenAI structured output was not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('OpenAI structured output must be an object.');
  }

  if (typeof parsed.status !== 'string') {
    throw new Error('OpenAI structured output is missing status.');
  }

  if (typeof parsed.conclusion !== 'string') {
    throw new Error('OpenAI structured output is missing conclusion.');
  }

  if (!Array.isArray(parsed.supportingEvidenceIds)) {
    throw new Error('OpenAI structured output has invalid supportingEvidenceIds.');
  }

  if (!Array.isArray(parsed.challengingEvidenceIds)) {
    throw new Error('OpenAI structured output has invalid challengingEvidenceIds.');
  }

  if (!Array.isArray(parsed.unresolvedQuestions)) {
    throw new Error('OpenAI structured output has invalid unresolvedQuestions.');
  }

  if (!Array.isArray(parsed.warnings)) {
    throw new Error('OpenAI structured output has invalid warnings.');
  }

  return Object.freeze({
    status: parsed.status as OpenAiStructuredReasoning['status'],
    conclusion: parsed.conclusion,
    supportingEvidenceIds: Object.freeze(
      parsed.supportingEvidenceIds.filter(
        (value): value is string => typeof value === 'string'
      )
    ),
    challengingEvidenceIds: Object.freeze(
      parsed.challengingEvidenceIds.filter(
        (value): value is string => typeof value === 'string'
      )
    ),
    unresolvedQuestions: Object.freeze(
      parsed.unresolvedQuestions.filter(
        (value): value is string => typeof value === 'string'
      )
    ),
    warnings: Object.freeze(
      parsed.warnings.filter(
        (value): value is string => typeof value === 'string'
      )
    )
  });
}

function validateEvidenceIds(
  request: AiRequest,
  result: OpenAiStructuredReasoning
): void {
  const knownIds = new Set(
    (request.context?.evidence ?? []).map((evidence) => evidence.id)
  );

  const referencedIds = [
    ...result.supportingEvidenceIds,
    ...result.challengingEvidenceIds
  ];

  for (const id of referencedIds) {
    if (!knownIds.has(id)) {
      throw new Error('OpenAI response referenced an unknown evidence ID.');
    }
  }
}

export class OpenAiResponseMapper implements RemoteAiResponseMapper {
  map(request: AiRequest, response: RemoteAiHttpResponse): AiResponse {
    const openAiResponse = asOpenAiResponse(response.body);

    if (openAiResponse.status === 'failed') {
      throw new Error('OpenAI response generation failed.');
    }

    if (openAiResponse.status === 'incomplete') {
      throw new Error('OpenAI response generation was incomplete.');
    }

    const text = requireOutputText(openAiResponse);
    const usage = openAiResponse.usage;

    const metadata = {
      provider: 'openai' as const,
      model: openAiResponse.model ?? 'openai',
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

    const structured = parseStructuredOutput(text);
    validateEvidenceIds(request, structured);

    return Object.freeze({
      requestId: request.requestId,
      content: structured.conclusion,
      structuredOutput: structured,
      format: 'STRUCTURED',
      warnings: structured.warnings,
      metadata: Object.freeze(metadata)
    });
  }
}
