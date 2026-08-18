import { describe, it, expect } from 'vitest';
import { AiProviderSelector } from './AiProviderSelector';
import { createMockProvider } from './testFixtures';
import type { AiRequest } from '../types/aiRequestTypes';
import type { AiContext } from '../types/aiContextTypes';

describe('AiProviderSelector', () => {
  const dummyContext = {} as AiContext;
  const selector = new AiProviderSelector();

  const careerRequest: AiRequest = {
    requestId: 'req-career-1',
    schemaVersion: '1.0.0',
    task: 'CAREER_ANALYSIS',
    context: dummyContext,
    responseFormat: 'STRUCTURED'
  };

  it('should select provider matching required capabilities', () => {
    const careerProvider = createMockProvider({
      id: 'career-pro',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const dashaProvider = createMockProvider({
      id: 'dasha-only',
      capabilities: ['DASHA', 'STRUCTURED_OUTPUT']
    });

    const selection = selector.select([careerProvider, dashaProvider], careerRequest);
    expect(selection.provider.identity.id).toBe('career-pro');
    expect(selection.candidates.length).toBe(2);
    expect(selection.candidates.find((c) => c.providerId === 'career-pro')?.eligible).toBe(true);
    expect(selection.candidates.find((c) => c.providerId === 'dasha-only')?.eligible).toBe(false);
    expect(selection.candidates.find((c) => c.providerId === 'dasha-only')?.rejectedReason).toContain(
      'Missing required capabilities: CAREER'
    );
  });

  it('should reject all providers and throw when none have required capability', () => {
    const dashaProvider = createMockProvider({
      id: 'dasha-only',
      capabilities: ['DASHA']
    });

    expect(() => selector.select([dashaProvider], careerRequest)).toThrow(/No eligible AI provider/);
  });

  it('should reject UNAVAILABLE providers', () => {
    const unavailableProvider = createMockProvider({
      id: 'career-down',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT'],
      availability: 'UNAVAILABLE',
      statusMessage: 'Service maintenance'
    });

    expect(() => selector.select([unavailableProvider], careerRequest)).toThrow(
      /No eligible AI provider/
    );
  });

  it('should keep DEGRADED providers eligible with lowered score', () => {
    const degraded = createMockProvider({
      id: 'career-degraded',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT'],
      availability: 'DEGRADED'
    });
    const available = createMockProvider({
      id: 'career-available',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT'],
      availability: 'AVAILABLE'
    });

    const selection = selector.select([degraded, available], careerRequest);
    expect(selection.provider.identity.id).toBe('career-available');

    const degradedCandidate = selection.candidates.find((c) => c.providerId === 'career-degraded');
    const availableCandidate = selection.candidates.find((c) => c.providerId === 'career-available');
    expect(degradedCandidate?.eligible).toBe(true);
    expect(availableCandidate?.score).toBeGreaterThan(degradedCandidate?.score ?? 0);
  });

  it('should honor preferredProviderId when eligible', () => {
    const providerA = createMockProvider({
      id: 'provider-a',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const providerB = createMockProvider({
      id: 'provider-b',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });

    const selection = selector.select([providerA, providerB], careerRequest, {
      preferredProviderId: 'provider-b'
    });

    expect(selection.provider.identity.id).toBe('provider-b');
    expect(selection.reason).toBe('PREFERRED_PROVIDER');
  });

  it('should filter by LOCAL_ONLY and REMOTE_ONLY modes', () => {
    const local = createMockProvider({
      id: 'local-rules',
      kind: 'LOCAL_RULES',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const remote = createMockProvider({
      id: 'remote-llm',
      kind: 'REMOTE_LLM',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });

    const localSelection = selector.select([local, remote], careerRequest, { mode: 'LOCAL_ONLY' });
    expect(localSelection.provider.identity.id).toBe('local-rules');

    const remoteSelection = selector.select([local, remote], careerRequest, { mode: 'REMOTE_ONLY' });
    expect(remoteSelection.provider.identity.id).toBe('remote-llm');
  });

  it('should deterministically break score ties using alphabetical provider ID', () => {
    const providerZ = createMockProvider({
      id: 'provider-z',
      kind: 'LOCAL_RULES',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const providerA = createMockProvider({
      id: 'provider-a',
      kind: 'LOCAL_RULES',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });

    const selection = selector.select([providerZ, providerA], careerRequest);
    expect(selection.provider.identity.id).toBe('provider-a');
  });

  it('should throw PREFERRED_PROVIDER_UNAVAILABLE when preferred provider is UNAVAILABLE and fallbackPolicy is NO_FALLBACK', () => {
    const unavailablePreferred = createMockProvider({
      id: 'openai-preferred',
      availability: 'UNAVAILABLE',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const fallbackLocal = createMockProvider({
      id: 'local-available',
      availability: 'AVAILABLE',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });

    expect(() =>
      selector.select([unavailablePreferred, fallbackLocal], careerRequest, {
        preferredProviderId: 'openai-preferred',
        fallbackPolicy: 'NO_FALLBACK'
      })
    ).toThrowError(/Preferred AI provider "openai-preferred" is UNAVAILABLE/);
  });

  it('should return orderedCandidates containing only eligible providers in execution rank order', () => {
    const provider1 = createMockProvider({
      id: 'provider-1',
      kind: 'LOCAL_RULES',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const provider2 = createMockProvider({
      id: 'provider-2',
      kind: 'LOCAL_RULES',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });
    const unavail = createMockProvider({
      id: 'provider-unavail',
      availability: 'UNAVAILABLE',
      capabilities: ['CAREER', 'STRUCTURED_OUTPUT']
    });

    const selection = selector.select([provider1, unavail, provider2], careerRequest, {
      preferredProviderId: 'provider-2'
    });

    expect(selection.orderedCandidates.length).toBe(2);
    expect(selection.orderedCandidates[0].providerId).toBe('provider-2');
    expect(selection.orderedCandidates[1].providerId).toBe('provider-1');
    expect(selection.reason).toBe('PREFERRED_PROVIDER');
  });
});
