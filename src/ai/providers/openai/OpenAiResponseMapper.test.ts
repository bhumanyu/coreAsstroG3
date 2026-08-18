import { describe, expect, it } from 'vitest';
import { OpenAiResponseMapper } from './OpenAiResponseMapper';
import type { AiRequest } from '../../types/aiRequestTypes';
import type { AiContext } from '../../types/aiContextTypes';

function createRequest(
  responseFormat: 'STRUCTURED' | 'NARRATIVE',
  context?: Partial<AiContext>
): AiRequest {
  return {
    requestId: 'response-test-1',
    schemaVersion: '1.0.0',
    task: 'CAREER_ANALYSIS',
    context: (context ?? {}) as AiContext,
    responseFormat
  };
}

function createRawResponse(
  text: string,
  options?: {
    status?: 'completed' | 'failed' | 'incomplete';
    id?: string;
    model?: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
  }
) {
  return {
    id: options?.id ?? 'resp-1',
    model: options?.model ?? 'gpt-5.6',
    status: options?.status ?? 'completed',
    output: [
      {
        id: 'msg-1',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'output_text',
            text,
            annotations: []
          }
        ]
      }
    ],
    usage: options?.usage
  };
}

describe('OpenAiResponseMapper', () => {
  it('maps narrative output', () => {
    const mapper = new OpenAiResponseMapper();

    const response = mapper.map(
      createRequest('NARRATIVE'),
      {
        status: 200,
        headers: {},
        body: createRawResponse('Career is strongly supported.', {
          id: 'resp-1',
          model: 'gpt-5.6',
          status: 'completed',
          usage: {
            input_tokens: 100,
            output_tokens: 25,
            total_tokens: 125
          }
        })
      }
    );

    expect(response.content).toBe('Career is strongly supported.');
    expect(response.format).toBe('NARRATIVE');
    expect(response.metadata?.provider).toBe('openai');
    expect(response.metadata?.model).toBe('gpt-5.6');
    expect(response.metadata?.tokensUsed).toEqual({
      prompt: 100,
      completion: 25,
      total: 125
    });
  });

  it('aggregates output text from multiple content parts', () => {
    const mapper = new OpenAiResponseMapper();

    const response = mapper.map(
      createRequest('NARRATIVE'),
      {
        status: 200,
        headers: {},
        body: {
          id: 'resp-multi',
          model: 'gpt-5.6',
          status: 'completed',
          output: [
            {
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'output_text',
                  text: 'Career is '
                },
                {
                  type: 'output_text',
                  text: 'strongly supported.'
                }
              ]
            }
          ]
        }
      }
    );

    expect(response.content).toBe('Career is strongly supported.');
  });

  it('rejects refusal responses', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('NARRATIVE'),
        {
          status: 200,
          headers: {},
          body: {
            id: 'resp-refusal',
            model: 'gpt-5.6',
            status: 'completed',
            output: [
              {
                type: 'message',
                role: 'assistant',
                content: [
                  {
                    type: 'refusal',
                    refusal: 'I cannot provide that response.'
                  }
                ]
              }
            ]
          }
        }
      )
    ).toThrow(/refused/);
  });

  it('maps structured JSON output', () => {
    const mapper = new OpenAiResponseMapper();

    const response = mapper.map(
      createRequest('STRUCTURED', {
        evidence: [
          {
            id: 'E001',
            type: 'YOGA',
            sourceRuleId: 'RULE_1',
            status: 'PRESENT',
            description: 'Raja Yoga present'
          }
        ] as unknown as AiContext['evidence']
      }),
      {
        status: 200,
        headers: {},
        body: createRawResponse(
          JSON.stringify({
            status: 'SUCCESS',
            conclusion: 'Career is supported.',
            supportingEvidenceIds: ['E001'],
            challengingEvidenceIds: [],
            unresolvedQuestions: [],
            warnings: []
          }),
          { id: 'resp-2', model: 'gpt-5.6' }
        )
      }
    );

    expect(response.format).toBe('STRUCTURED');
    expect(response.structuredOutput).toMatchObject({
      status: 'SUCCESS',
      conclusion: 'Career is supported.',
      supportingEvidenceIds: ['E001']
    });
    expect(response.content).toBe('Career is supported.');
  });

  it('rejects malformed structured JSON', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('STRUCTURED'),
        {
          status: 200,
          headers: {},
          body: createRawResponse('{invalid')
        }
      )
    ).toThrow(/valid JSON/);
  });

  it('rejects invalid reasoning status', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('STRUCTURED'),
        {
          status: 200,
          headers: {},
          body: createRawResponse(
            JSON.stringify({
              status: 'INVALID_STATUS',
              conclusion: 'Career is supported.',
              supportingEvidenceIds: [],
              challengingEvidenceIds: [],
              unresolvedQuestions: [],
              warnings: []
            })
          )
        }
      )
    ).toThrow(/invalid status/);
  });

  it('rejects non-string items in array fields', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('STRUCTURED'),
        {
          status: 200,
          headers: {},
          body: createRawResponse(
            JSON.stringify({
              status: 'SUCCESS',
              conclusion: 'Career is supported.',
              supportingEvidenceIds: ['E001', 123],
              challengingEvidenceIds: [],
              unresolvedQuestions: [],
              warnings: []
            })
          )
        }
      )
    ).toThrow(/invalid supportingEvidenceIds/);
  });

  it('rejects missing output text', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('NARRATIVE'),
        {
          status: 200,
          headers: {},
          body: {
            status: 'completed',
            output: []
          }
        }
      )
    ).toThrow(/output text/);
  });

  it('rejects failed responses', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('NARRATIVE'),
        {
          status: 200,
          headers: {},
          body: {
            status: 'failed',
            output: []
          }
        }
      )
    ).toThrow(/generation failed/);
  });

  it('rejects incomplete responses', () => {
    const mapper = new OpenAiResponseMapper();

    expect(() =>
      mapper.map(
        createRequest('NARRATIVE'),
        {
          status: 200,
          headers: {},
          body: {
            status: 'incomplete',
            output: []
          }
        }
      )
    ).toThrow(/incomplete/);
  });

  it('rejects unknown evidence IDs', () => {
    const mapper = new OpenAiResponseMapper();

    const requestWithEvidence = createRequest('STRUCTURED', {
      evidence: [
        {
          id: 'E001',
          type: 'YOGA',
          sourceRuleId: 'RULE_1',
          status: 'PRESENT',
          description: 'Raja Yoga'
        }
      ] as unknown as AiContext['evidence']
    });

    expect(() =>
      mapper.map(
        requestWithEvidence,
        {
          status: 200,
          headers: {},
          body: createRawResponse(
            JSON.stringify({
              status: 'SUCCESS',
              conclusion: 'Test',
              supportingEvidenceIds: ['E999'],
              challengingEvidenceIds: [],
              unresolvedQuestions: [],
              warnings: []
            })
          )
        }
      )
    ).toThrow(/unknown evidence ID/);
  });
});
