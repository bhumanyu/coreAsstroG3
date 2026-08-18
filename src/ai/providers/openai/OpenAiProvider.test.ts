import { describe, expect, it } from 'vitest';
import { OpenAiProvider } from './OpenAiProvider';
import { FakeRemoteAiTransport } from '../remote/testFixtures';
import type { AiRequest } from '../../types/aiRequestTypes';
import type { AiContext } from '../../types/aiContextTypes';

function createRequest(): AiRequest {
  return {
    requestId: 'openai-provider-test',
    schemaVersion: '1.0.0',
    task: 'CAREER_ANALYSIS',
    context: {
      evidence: [
        {
          id: 'E001',
          type: 'YOGA',
          sourceRuleId: 'RULE_1',
          status: 'PRESENT',
          description: 'Raja Yoga'
        }
      ] as unknown as AiContext['evidence']
    } as AiContext,
    responseFormat: 'STRUCTURED'
  };
}

describe('OpenAiProvider', () => {
  it('exposes REMOTE_LLM identity', () => {
    const provider = new OpenAiProvider({
      apiKey: 'secret',
      model: 'gpt-5.6'
    });

    expect(provider.identity).toMatchObject({
      id: 'openai',
      name: 'OpenAI',
      kind: 'REMOTE_LLM',
      version: 'gpt-5.6'
    });
  });

  it('supports structured CoreAstro tasks', () => {
    const provider = new OpenAiProvider({
      apiKey: 'secret'
    });

    expect(provider.capabilities).toContain('STRUCTURED_OUTPUT');
    expect(provider.capabilities).toContain('CAREER');
    expect(provider.capabilities).toContain('WEALTH');
    expect(provider.capabilities).toContain('DASHA');
    expect(provider.capabilities).toContain('LIFE_THEMES');
    expect(provider.capabilities).toContain('CHART_SYNTHESIS');
  });

  it('generates through the PR-025D transport boundary', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: {
        id: 'resp-test',
        model: 'gpt-5.6',
        status: 'completed',
        output_text: JSON.stringify({
          status: 'SUCCESS',
          conclusion: 'Career supported.',
          supportingEvidenceIds: ['E001'],
          challengingEvidenceIds: [],
          unresolvedQuestions: [],
          warnings: []
        })
      }
    });

    const provider = new OpenAiProvider(
      {
        apiKey: 'secret',
        model: 'gpt-5.6'
      },
      transport
    );

    const response = await provider.generate(createRequest());

    expect(response.requestId).toBe('openai-provider-test');
    expect(response.format).toBe('STRUCTURED');
    expect(response.structuredOutput).toMatchObject({
      status: 'SUCCESS'
    });
    expect(response.metadata?.provider).toBe('openai');
    expect(response.metadata?.remote).toBe(true);
    expect(transport.requests).toHaveLength(1);
  });

  it('never exposes API key in response', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: {
        id: 'resp-secret-test',
        model: 'gpt-5.6',
        status: 'completed',
        output_text: 'Safe response'
      }
    });

    const provider = new OpenAiProvider(
      {
        apiKey: 'secret-openai-key'
      },
      transport
    );

    const response = await provider.generate({
      ...createRequest(),
      responseFormat: 'NARRATIVE'
    });

    expect(JSON.stringify(response)).not.toContain('secret-openai-key');
  });
});
