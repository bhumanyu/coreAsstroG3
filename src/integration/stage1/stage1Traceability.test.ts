import { describe, expect, it, beforeAll } from 'vitest';
import { runStage1Integration } from './stage1IntegrationHarness';
import { STAGE1_GOLDEN_INPUT } from './stage1GoldenFixture';
import { assertStage1Traceability } from './stage1Traceability';
import { forbiddenAiContextKeys } from '../../ai/context/aiContextPrivacy';

let stage1Result: Awaited<ReturnType<typeof runStage1Integration>>;

beforeAll(async () => {
  stage1Result = await runStage1Integration(STAGE1_GOLDEN_INPUT);
}, 30000);

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
  it('passes comprehensive Stage-1 traceability validation on golden input', () => {
    // Runs internal domain evidence checks, AI structured output checks, and explanation view model checks
    assertStage1Traceability(stage1Result);
  });

  it('enforces strict domain isolation between Career and Wealth evidence spaces', () => {
    const careerEvidence = stage1Result.career.evidence;
    const wealthEvidence = stage1Result.wealth.evidence;

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

    for (const id of stage1Result.career.conclusion.supportingSourceIds ?? []) {
      expect(careerIds.has(id)).toBe(true);
    }
    for (const id of stage1Result.career.conclusion.challengingSourceIds ?? []) {
      expect(careerIds.has(id)).toBe(true);
    }

    for (const id of stage1Result.wealth.conclusion.supportingSourceIds ?? []) {
      expect(wealthIds.has(id)).toBe(true);
    }
    for (const id of stage1Result.wealth.conclusion.challengingSourceIds ?? []) {
      expect(wealthIds.has(id)).toBe(true);
    }
  }, 30000);

  it('validates AI context sanitization using official forbiddenAiContextKeys', () => {
    const allKeys = collectKeys(stage1Result.aiContext);
    expect(allKeys.length).toBeGreaterThan(0);

    // Verify none of the keys in AiContext violate the privacy boundary
    for (const key of allKeys) {
      const lowerKey = key.toLowerCase();
      for (const forbidden of forbiddenAiContextKeys) {
        expect(lowerKey).not.toBe(forbidden.toLowerCase());
      }
    }

    // Verify direct horoscope reference is not present in AiContext
    expect(Object.values(stage1Result.aiContext)).not.toContain(stage1Result.horoscope);
  }, 30000);
});
