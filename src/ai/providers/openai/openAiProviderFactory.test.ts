import { describe, expect, it } from 'vitest';
import { createOpenAiProvider } from './openAiProviderFactory';

describe('createOpenAiProvider', () => {
  it('creates an OpenAI remote provider', () => {
    const provider = createOpenAiProvider({
      apiKey: 'test-key',
      model: 'gpt-5.6'
    });

    expect(provider.identity.id).toBe('openai');
    expect(provider.identity.kind).toBe('REMOTE_LLM');
  });
});
