import { describe, expect, it } from 'vitest';
import { Planet, Sign } from '../../types';
import { createAiRequest } from '../api/createAiRequest';
import type { AiContext } from '../types/aiContextTypes';
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
});
