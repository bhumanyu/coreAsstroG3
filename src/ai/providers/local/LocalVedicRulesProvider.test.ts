import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildAiContext } from '../../context/aiContextFactory';
import { createAiRequest } from '../../api/createAiRequest';
import { LocalVedicRulesProvider } from './LocalVedicRulesProvider';

describe('LocalVedicRulesProvider', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = buildAiContext(horoscope);
  const provider = new LocalVedicRulesProvider();

  it('should expose valid identity and capabilities', () => {
    expect(provider.identity.id).toBe('local-vedic-rules');
    expect(provider.identity.name).toBe('Local Vedic Rules Provider');
    expect(provider.identity.kind).toBe('LOCAL_RULES');
    expect(provider.identity.version).toBe('1.0.0');
    expect(Object.isFrozen(provider.identity)).toBe(true);

    expect(provider.capabilities).toContain('OFFLINE');
    expect(provider.capabilities).toContain('LOCAL_FALLBACK');
    expect(provider.capabilities).toContain('CAREER');
    expect(provider.capabilities).toContain('WEALTH');
    expect(provider.capabilities).toContain('DASHA');
    expect(provider.capabilities).toContain('LIFE_THEMES');
    expect(provider.capabilities).toContain('CHART_SYNTHESIS');
    expect(provider.capabilities).toContain('STRUCTURED_OUTPUT');
    expect(Object.isFrozen(provider.capabilities)).toBe(true);
  });

  it('should report AVAILABLE status', () => {
    const status = provider.getStatus();
    expect(status.availability).toBe('AVAILABLE');
    expect(status.message).toBeDefined();
  });

  it('should generate an AiResponse conforming to provider contract', async () => {
    const request = createAiRequest(
      'CAREER_ANALYSIS',
      context,
      'STRUCTURED'
    );

    const response = await provider.generate(request);

    expect(response.requestId).toBe(request.requestId);
    expect(response.format).toBe('STRUCTURED');
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe('string');
    expect(response.structuredOutput).toBeDefined();
    expect(response.warnings).toEqual([]);
    expect(response.metadata?.provider).toBe('local-vedic-rules');
    expect(response.metadata?.model).toBe('LOCAL_RULES');
    expect(response.metadata?.ruleEngineVersion).toBe('1.0.0');
    expect(Object.isFrozen(response)).toBe(true);
  });

  it('should support synchronous reasoning via reason()', () => {
    const request = createAiRequest(
      'WEALTH_ANALYSIS',
      context,
      'STRUCTURED'
    );

    const reasoning = provider.reason(request);

    expect(reasoning.status).toBeDefined();
    expect(reasoning.conclusion).toBeDefined();
    expect(Array.isArray(reasoning.supportingEvidenceIds)).toBe(true);
    expect(Array.isArray(reasoning.challengingEvidenceIds)).toBe(true);
    expect(Array.isArray(reasoning.triggeredRuleIds)).toBe(true);
  });

  it('should ensure strict privacy without raw birth details in serialized output', async () => {
    const request = createAiRequest(
      'CHART_SYNTHESIS',
      context,
      'STRUCTURED'
    );

    const response = await provider.generate(request);
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain('dateOfBirth');
    expect(serialized).not.toContain('timeOfBirth');
    expect(serialized).not.toContain('latitude');
    expect(serialized).not.toContain('longitude');
  });

  it('should operate over immutable AiContext and not mutate context structures', async () => {
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.evidence)).toBe(true);
    if (context.career) {
      expect(Object.isFrozen(context.career)).toBe(true);
    }
    if (context.wealth) {
      expect(Object.isFrozen(context.wealth)).toBe(true);
    }

    const request = createAiRequest(
      'CAREER_ANALYSIS',
      context,
      'STRUCTURED'
    );

    await provider.generate(request);

    // Verify context remains frozen and unaffected
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.evidence)).toBe(true);
  });
});
