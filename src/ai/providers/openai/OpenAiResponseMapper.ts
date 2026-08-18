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

  if (!isReasoningStatus(parsed.status)) {
    throw new Error('OpenAI structured output has invalid status.');
  }

  if (typeof parsed.conclusion !== 'string') {
    throw new Error('OpenAI structured output is missing conclusion.');
  }

  return Object.freeze({
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
