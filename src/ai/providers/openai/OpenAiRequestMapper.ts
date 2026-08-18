import type { AiRequest } from '../../types/aiRequestTypes';
import type {
  RemoteAiHttpRequest,
  RemoteAiProviderConfig,
  RemoteAiRequestMapper
} from '../remote';
import { OPENAI_REASONING_SCHEMA } from './openAiStructuredSchema';
import type { OpenAiProviderOptions } from './OpenAiTypes';

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.6';

function buildSystemInstructions(request: AiRequest): string {
  return [
    'You are the CoreAstro AI reasoning layer.',
    'CoreAstro deterministic calculations are authoritative.',
    'Do not recalculate planetary positions, houses, dashas, divisional charts, or other astronomical facts.',
    'Do not invent astrological facts that are absent from the supplied CoreAstro context.',
    'Do not change planetary signs, planetary houses, ascendant, dasha periods, D9/D10 status, yoga status, or evidence statements.',
    'Use the supplied evidence IDs when making conclusions.',
    'Distinguish deterministic facts from interpretation.',
    'If evidence conflicts, explicitly acknowledge the conflict.',
    'If evidence is insufficient, say so instead of inventing information.',
    `The requested CoreAstro task is: ${request.task}.`
  ].join(' ');
}

function buildContextPayload(request: AiRequest): Record<string, unknown> {
  const context = request.context;

  return {
    schemaVersion: context.schemaVersion,
    source: context.source,
    methodology: context.methodology,
    ascendant: context.ascendant,
    planets: context.planets,
    houses: context.houses,
    yogas: context.yogas,
    dasha: context.dasha,
    divisional: context.divisional,
    career: context.career,
    wealth: context.wealth,
    lifeThemes: context.lifeThemes,
    evidence: context.evidence
  };
}

function buildInput(request: AiRequest): string {
  const payload = {
    task: request.task,
    responseFormat: request.responseFormat,
    instructions: request.instructions ?? [],
    context: buildContextPayload(request)
  };

  return JSON.stringify(payload);
}

export class OpenAiRequestMapper implements RemoteAiRequestMapper {
  private readonly model: string;
  private readonly endpoint: string;

  constructor(options: OpenAiProviderOptions) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  }

  map(request: AiRequest, config: RemoteAiProviderConfig): RemoteAiHttpRequest {
    const apiKey = config.apiKey;

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('OpenAI API key is required.');
    }

    const body: Record<string, unknown> = {
      model: this.model,
      instructions: buildSystemInstructions(request),
      input: buildInput(request)
    };

    if (request.responseFormat === 'STRUCTURED') {
      body.text = {
        format: {
          type: 'json_schema',
          name: 'coreastro_reasoning',
          description: 'Structured CoreAstro reasoning result.',
          schema: OPENAI_REASONING_SCHEMA,
          strict: true
        }
      };
    }

    return Object.freeze({
      url: this.endpoint,
      method: 'POST',
      headers: Object.freeze({
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      }),
      body: Object.freeze(body)
    });
  }
}
