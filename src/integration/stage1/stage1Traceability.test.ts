import { describe, expect, it } from 'vitest';
import { runStage1Integration } from './stage1IntegrationHarness';
import { STAGE1_GOLDEN_INPUT } from './stage1GoldenFixture';
import { assertStage1Traceability } from './stage1Traceability';
import { forbiddenAiContextKeys } from '../../ai/context/aiContextPrivacy';

function collectKeys(obj: unknown, prefix = '', visited = new Set<unknown>()): string[] {
  if (!obj || typeof obj !== 'object' || visited.has(obj)) {
    return [];
  }
  visited.add(obj);

  const keys: string[] = [];

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      keys.push(...collectKeys(obj[i], `${prefix}[${i}]`, visited));
    }
  } else {
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      keys.push(key);
      keys.push(...collectKeys((obj as Record<string, unknown>)[key], fullPath, visited));
    }
  }

  return keys;
}

describe('Stage-1 Traceability & Domain Isolation Integration', () => {
  it('passes comprehensive Stage-1 traceability validation on golden input', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    // Runs internal domain evidence checks, AI structured output checks, and explanation view model checks
    assertStage1Traceability(result);
  });

  it('enforces strict domain isolation between Career and Wealth evidence spaces', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    const careerEvidence = result.career.evidence;
    const wealthEvidence = result.wealth.evidence;

    expect(careerEvidence.length).toBeGreaterThan(0);
    expect(wealthEvidence.length).toBeGreaterThan(0);

    // Verify all Career evidence items are marked with domain 'CAREER'
    for (const item of careerEvidence) {
      expect(item.domain).toBe('CAREER');
    }

    // Verify all Wealth evidence items are marked with domain 'WEALTH'
    for (const item of wealthEvidence) {
      expect(item.domain).toBe('WEALTH');
    }

    // Check conclusion evidence IDs are strictly scoped to their respective domains
    const careerIds = new Set(careerEvidence.map((e) => e.id));
    const wealthIds = new Set(wealthEvidence.map((e) => e.id));

    for (const id of result.career.conclusion.supportingEvidenceIds) {
      expect(careerIds.has(id)).toBe(true);
    }
    for (const id of result.career.conclusion.challengingEvidenceIds) {
      expect(careerIds.has(id)).toBe(true);
    }

    for (const id of result.wealth.conclusion.supportingEvidenceIds) {
      expect(wealthIds.has(id)).toBe(true);
    }
    for (const id of result.wealth.conclusion.challengingEvidenceIds) {
      expect(wealthIds.has(id)).toBe(true);
    }
  });

  it('validates AI context sanitization using official forbiddenAiContextKeys', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    const allKeys = collectKeys(result.aiContext);
    expect(allKeys.length).toBeGreaterThan(0);

    // Verify none of the keys in AiContext violate the privacy boundary
    for (const key of allKeys) {
      const lowerKey = key.toLowerCase();
      for (const forbidden of forbiddenAiContextKeys) {
        expect(lowerKey).not.toBe(forbidden.toLowerCase());
      }
    }

    // Verify direct horoscope reference is not present in AiContext
    expect(Object.values(result.aiContext)).not.toContain(result.horoscope);
  });
});
