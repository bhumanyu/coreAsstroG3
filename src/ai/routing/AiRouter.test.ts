import { describe, it, expect } from 'vitest';
import { AiProviderRegistry } from './AiProviderRegistry';
import { AiRouter } from './AiRouter';
import { createMockProvider } from './testFixtures';
import type { AiRequest } from '../types/aiRequestTypes';
import type { AiContext } from '../types/aiContextTypes';

describe('AiRouter', () => {
  const dummyContext = {} as AiContext;

  const testRequest: AiRequest = {
    requestId: 'req-router-test-1',
    schemaVersion: '1.0.0',
    task: 'CHART_SYNTHESIS',
    context: dummyContext,
    responseFormat: 'STRUCTURED'
  };

  it('should throw an error when routing on an empty registry', async () => {
    const registry = new AiProviderRegistry();
    const router = new AiRouter(registry);

    await expect(router.route(testRequest)).rejects.toThrow(
      /No AI providers are registered/
    );
  });

  it('should route to the selected provider with fallbackUsed = false', async () => {
    const provider = createMockProvider({
      id: 'local-rules-1',
      kind: 'LOCAL_RULES',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT']
    });
    const registry = new AiProviderRegistry([provider]);
    const router = new AiRouter(registry);

    const result = await router.route(testRequest);

    expect(result.requestId).toBe(testRequest.requestId);
    expect(result.providerId).toBe('local-rules-1');
    expect(result.fallbackUsed).toBe(false);
    expect(result.response.metadata?.provider).toBe('local-rules-1');
    expect(result.response.metadata?.routing).toEqual({
      mode: 'AUTO',
      fallbackUsed: false,
      selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
      candidateCount: 1
    });
  });

  it('should execute transparent fallback when preferred provider fails with ALLOW_FALLBACK', async () => {
    const primary = createMockProvider({
      id: 'remote-primary',
      kind: 'REMOTE_LLM',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      fail: true
    });
    const fallback = createMockProvider({
      id: 'local-fallback',
      kind: 'LOCAL_RULES',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT']
    });

    const registry = new AiProviderRegistry([primary, fallback]);
    const router = new AiRouter(registry);

    const result = await router.route(testRequest, {
      preferredProviderId: 'remote-primary',
      fallbackPolicy: 'ALLOW_FALLBACK'
    });

    expect(result.providerId).toBe('local-fallback');
    expect(result.fallbackUsed).toBe(true);
    expect(result.selectionReason).toBe('LOCAL_FALLBACK');
    expect(result.response.metadata?.routing).toMatchObject({
      fallbackUsed: true,
      selectionReason: 'LOCAL_FALLBACK'
    });
  });

  it('should rethrow provider error and NOT fall back when fallbackPolicy is NO_FALLBACK', async () => {
    const primary = createMockProvider({
      id: 'remote-primary',
      kind: 'REMOTE_LLM',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      fail: true
    });
    const fallback = createMockProvider({
      id: 'local-fallback',
      kind: 'LOCAL_RULES',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT']
    });

    const registry = new AiProviderRegistry([primary, fallback]);
    const router = new AiRouter(registry);

    await expect(
      router.route(testRequest, {
        preferredProviderId: 'remote-primary',
        fallbackPolicy: 'NO_FALLBACK'
      })
    ).rejects.toThrow(/remote-primary failed/);
  });

  it('should route to local fallback when preferred provider is UNAVAILABLE in registry', async () => {
    const primary = createMockProvider({
      id: 'remote-down',
      kind: 'REMOTE_LLM',
      availability: 'UNAVAILABLE',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT']
    });
    const fallback = createMockProvider({
      id: 'local-rules-2',
      kind: 'LOCAL_RULES',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT']
    });

    const registry = new AiProviderRegistry([primary, fallback]);
    const router = new AiRouter(registry);

    const result = await router.route(testRequest, {
      preferredProviderId: 'remote-down'
    });

    expect(result.providerId).toBe('local-rules-2');
    expect(result.selectionReason).toBe('LOCAL_FALLBACK');
  });

  it('should throw ALL_PROVIDERS_FAILED when all eligible providers fail', async () => {
    const provider1 = createMockProvider({
      id: 'failing-1',
      kind: 'LOCAL_RULES',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      fail: true
    });
    const provider2 = createMockProvider({
      id: 'failing-2',
      kind: 'LOCAL_RULES',
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      fail: true
    });

    const registry = new AiProviderRegistry([provider1, provider2]);
    const router = new AiRouter(registry);

    await expect(router.route(testRequest)).rejects.toThrow(
      /All eligible AI providers failed/
    );
  });
});
