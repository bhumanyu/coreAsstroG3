import { describe, expect, it } from 'vitest';
import { Planet, Sign } from '../../types';
import { createAiRequest } from '../api/createAiRequest';
import type { AiContext } from '../types/aiContextTypes';
import {
  createServerAiComposition,
  serverAiConfigurationFromEnv
} from './serverAiComposition';

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

describe('createServerAiComposition', () => {
  it('returns a local-only composition when remote AI is disabled', () => {
    const composition = createServerAiComposition({
      remoteAiEnabled: false,
      openAiApiKey: 'test-key'
    });

    expect(composition.remoteStatus).toBe('DISABLED');
    expect(composition.policyDenialReason).toBe('REMOTE_AI_DISABLED');
    expect(composition.aiRoutingMode).toBe('LOCAL_ONLY');
    expect(composition.aiProviderTimeoutMs).toBeUndefined();

    const request = createAiRequest(
      'SELECTED_PERIOD_ANALYSIS',
      minimalContext,
      'STRUCTURED',
      'server-composition-disabled'
    );
    expect(composition.aiRouter.getConfiguredRemoteProviderId(request)).toBeUndefined();
  });

  it('returns a local-only composition when no provider credential is configured', () => {
    const composition = createServerAiComposition({
      remoteAiEnabled: true
    });

    expect(composition.remoteStatus).toBe('NOT_CONFIGURED');
    expect(composition.policyDenialReason).toBe('PROXY_NOT_CONFIGURED');
    expect(composition.aiRoutingMode).toBe('LOCAL_ONLY');
  });

  it('treats a blank provider credential as not configured', () => {
    const composition = createServerAiComposition({
      remoteAiEnabled: true,
      openAiApiKey: '   '
    });

    expect(composition.remoteStatus).toBe('NOT_CONFIGURED');
    expect(composition.aiRoutingMode).toBe('LOCAL_ONLY');
  });

  it('registers the OpenAI remote provider when enabled and credentialed', () => {
    const composition = createServerAiComposition({
      remoteAiEnabled: true,
      openAiApiKey: 'test-key',
      openAiModel: 'test-model',
      openAiTimeoutMs: 5_000
    });

    expect(composition.remoteStatus).toBe('CONFIGURED');
    expect(composition.aiRoutingMode).toBe('REMOTE_PRIMARY');
    expect(composition.aiProviderTimeoutMs).toBe(5_000);

    const request = createAiRequest(
      'SELECTED_PERIOD_ANALYSIS',
      minimalContext,
      'STRUCTURED',
      'server-composition-configured'
    );
    expect(composition.aiRouter.getConfiguredRemoteProviderId(request)).toBe('openai');
  });
});

describe('serverAiConfigurationFromEnv', () => {
  it('maps trusted server environment variables', () => {
    const config = serverAiConfigurationFromEnv({
      COREASTRO_REMOTE_AI_ENABLED: 'true',
      OPENAI_API_KEY: 'env-key',
      OPENAI_MODEL: 'env-model',
      OPENAI_ENDPOINT: 'https://example.invalid/v1/responses',
      OPENAI_TIMEOUT_MS: '7000'
    });

    expect(config).toEqual({
      remoteAiEnabled: true,
      openAiApiKey: 'env-key',
      openAiModel: 'env-model',
      openAiEndpoint: 'https://example.invalid/v1/responses',
      openAiTimeoutMs: 7_000
    });
  });

  it('defaults to disabled and omits absent or invalid optional values', () => {
    const config = serverAiConfigurationFromEnv({
      COREASTRO_REMOTE_AI_ENABLED: '1',
      OPENAI_TIMEOUT_MS: 'not-a-number'
    });

    expect(config.remoteAiEnabled).toBe(false);
    expect(config.openAiApiKey).toBeUndefined();
    expect(config.openAiTimeoutMs).toBeUndefined();
  });
});
