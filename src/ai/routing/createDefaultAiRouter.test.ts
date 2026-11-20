import { describe, expect, it } from 'vitest';
import { Planet, Sign } from '../../types';
import { createAiRequest } from '../api/createAiRequest';
import type { AiContext } from '../types/aiContextTypes';
import type { AiProvider } from '../types/aiProviderTypes';
import type { AiResponse } from '../types/aiResponseTypes';
import { createDefaultAiRouter } from './createDefaultAiRouter';

const minimalContext: AiContext = {
  schemaVersion: '1.1.0',
  source: {
    engine: 'CORE_ASTRO',
    deterministic: true,
    astrologySystem: 'VEDIC'
  },
  ascendant: { sign: Sign.ARIES, lord: Planet.MARS },
  planets: [],
  houses: [],
  yogas: [],
  dasha: { system: 'VIMSHOTTARI', periods: [] },
  divisional: {
    d9: { varga: 'D9', status: 'UNAVAILABLE' },
    d10: { varga: 'D10', status: 'UNAVAILABLE' }
  },
  lifeThemes: [],
  evidence: [],
  methodology: {
    zodiac: 'SIDEREAL',
    ayanamsa: 'LAHIRI',
    houseSystem: 'WHOLE_SIGN',
    dashaSystem: 'VIMSHOTTARI',
    aspectSystem: 'PARASHARI'
  }
};

describe('createDefaultAiRouter', () => {
  it('registers and selects only the local Vedic rules provider', async () => {
    const router = createDefaultAiRouter();
    const request = createAiRequest(
      'CHART_SYNTHESIS',
      minimalContext,
      'STRUCTURED',
      'default-local-router-test'
    );

    const result = await router.route(request);

    expect(result.providerId).toBe('local-vedic-rules');
    expect(result.providerKind).toBe('LOCAL_RULES');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].providerId).toBe('local-vedic-rules');
    expect(result.candidates[0].kind).toBe('LOCAL_RULES');
    expect(result.response.metadata?.provider).toBe('local-vedic-rules');
  });

  it('prefers a configured remote provider and falls back to local rules after failure', async () => {
    const remoteProvider: AiProvider = {
      identity: { id: 'configured-remote', name: 'Configured remote', kind: 'REMOTE_LLM' },
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      getStatus: () => ({ availability: 'AVAILABLE' }),
      generate: async () => { throw new Error('simulated remote outage'); }
    };
    const router = createDefaultAiRouter({ remoteProvider });
    const request = createAiRequest(
      'CHART_SYNTHESIS',
      minimalContext,
      'STRUCTURED',
      'configured-remote-router-test'
    );
    const preferredProviderId = router.getConfiguredRemoteProviderId(request);
    const result = await router.route(request, {
      mode: 'AUTO',
      preferredProviderId,
      fallbackPolicy: 'ALLOW_FALLBACK'
    });

    expect(preferredProviderId).toBe('configured-remote');
    expect(result.providerId).toBe('local-vedic-rules');
    expect(result.routingMode).toBe('AUTO');
    expect(result.fallbackUsed).toBe(true);
  });

  it('uses a configured remote provider as the primary route', async () => {
    const remoteProvider: AiProvider = {
      identity: { id: 'configured-remote-success', name: 'Configured remote', kind: 'REMOTE_LLM' },
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      getStatus: () => ({ availability: 'AVAILABLE' }),
      generate: async (request): Promise<AiResponse> => ({
        requestId: request.requestId,
        format: 'STRUCTURED',
        content: 'Remote summary.',
        structuredOutput: {
          status: 'SUCCESS',
          conclusion: 'Remote summary.',
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: [],
          warnings: []
        },
        warnings: []
      })
    };
    const router = createDefaultAiRouter({ remoteProvider });
    const request = createAiRequest('CHART_SYNTHESIS', minimalContext, 'STRUCTURED', 'remote-primary-test');
    const preferredProviderId = router.getConfiguredRemoteProviderId(request);
    const result = await router.route(request, {
      mode: 'AUTO',
      preferredProviderId,
      fallbackPolicy: 'ALLOW_FALLBACK'
    });

    expect(result.providerId).toBe('configured-remote-success');
    expect(result.fallbackUsed).toBe(false);
  });

  it('does not register an unavailable remote provider', async () => {
    const unavailableRemote: AiProvider = {
      identity: { id: 'unconfigured-remote', name: 'Unconfigured remote', kind: 'REMOTE_LLM' },
      capabilities: ['CHART_SYNTHESIS', 'STRUCTURED_OUTPUT'],
      getStatus: () => ({ availability: 'UNAVAILABLE' }),
      generate: async (): Promise<AiResponse> => ({
        requestId: 'unused',
        format: 'STRUCTURED',
        warnings: []
      })
    };
    const router = createDefaultAiRouter({ remoteProvider: unavailableRemote });
    const request = createAiRequest('CHART_SYNTHESIS', minimalContext, 'STRUCTURED', 'no-remote-test');

    expect(router.getConfiguredRemoteProviderId(request)).toBeUndefined();
    expect((await router.route(request)).providerId).toBe('local-vedic-rules');
  });
});
