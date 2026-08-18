import { describe, expect, it } from 'vitest';
import { OpenAiRequestMapper } from './OpenAiRequestMapper';
import type { AiRequest } from '../../types/aiRequestTypes';
import type { AiContext } from '../../types/aiContextTypes';
import type { RemoteAiProviderConfig } from '../remote';

function createRequest(
  responseFormat: 'STRUCTURED' | 'NARRATIVE',
  context: Partial<AiContext> = {}
): AiRequest {
  return {
    requestId: 'openai-request-1',
    schemaVersion: '1.0.0',
    task: 'CAREER_ANALYSIS',
    context: context as AiContext,
    instructions: Object.freeze(['Analyze the career evidence.']),
    responseFormat
  };
}

function createConfig(): RemoteAiProviderConfig {
  return {
    identity: {
      id: 'openai',
      name: 'OpenAI',
      kind: 'REMOTE_LLM'
    },
    capabilities: Object.freeze(['CAREER', 'STRUCTURED_OUTPUT']),
    endpoint: 'https://api.openai.com/v1/responses',
    apiKey: 'secret-test-key'
  };
}

describe('OpenAiRequestMapper', () => {
  it('creates the Responses API request', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'secret-test-key',
      model: 'gpt-5.6'
    });

    const request = mapper.map(
      createRequest('STRUCTURED'),
      createConfig()
    );

    expect(request.url).toBe('https://api.openai.com/v1/responses');
    expect(request.method).toBe('POST');
    expect(request.headers.authorization).toBe('Bearer secret-test-key');
    expect(request.body).toMatchObject({
      model: 'gpt-5.6'
    });
  });

  it('uses JSON schema structured output', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'secret',
      model: 'gpt-5.6'
    });

    const request = mapper.map(
      createRequest('STRUCTURED'),
      createConfig()
    );

    const body = request.body as Record<string, unknown>;

    expect(body.text).toMatchObject({
      format: {
        type: 'json_schema',
        name: 'coreastro_reasoning',
        strict: true
      }
    });
  });

  it('does not add structured schema for narrative requests', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'secret'
    });

    const request = mapper.map(
      createRequest('NARRATIVE'),
      createConfig()
    );

    const body = request.body as Record<string, unknown>;

    expect(body.text).toBeUndefined();
  });

  it('never places API key in URL', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'secret-key'
    });

    const request = mapper.map(
      createRequest('NARRATIVE'),
      createConfig()
    );

    expect(request.url).not.toContain('secret-key');
  });

  it('does not blindly serialize the AiRequest object', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'secret'
    });

    const request = mapper.map(
      createRequest('NARRATIVE', {
        methodology: {
          zodiac: 'SIDEREAL',
          ayanamsa: 'LAHIRI',
          houseSystem: 'WHOLE_SIGN',
          dashaSystem: 'VIMSHOTTARI',
          aspectSystem: 'PARASHARI'
        }
      }),
      createConfig()
    );

    const body = request.body as Record<string, unknown>;
    const input = String(body.input);

    expect(input).toContain('"context"');
    expect(input).toContain('"methodology"');
    expect(input).not.toContain('"apiKey"');
  });

  it('uses a configured custom model', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'secret',
      model: 'custom-test-model'
    });

    const request = mapper.map(
      createRequest('NARRATIVE'),
      createConfig()
    );

    expect(
      (request.body as Record<string, unknown>).model
    ).toBe('custom-test-model');
  });

  it('never places the API key in the request body', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: 'super-secret-openai-key'
    });

    const request = mapper.map(
      createRequest('NARRATIVE'),
      {
        ...createConfig(),
        apiKey: 'super-secret-openai-key'
      }
    );

    expect(JSON.stringify(request.body)).not.toContain(
      'super-secret-openai-key'
    );
  });

  it('rejects missing API key', () => {
    const mapper = new OpenAiRequestMapper({
      apiKey: ''
    });

    expect(() =>
      mapper.map(createRequest('NARRATIVE'), {
        ...createConfig(),
        apiKey: ''
      })
    ).toThrow(/API key is required/);
  });
});
