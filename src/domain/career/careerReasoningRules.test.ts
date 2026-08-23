import { describe, it, expect } from 'vitest';
import { CAREER_MANIFESTATION_RULES } from './careerReasoningRules';
import { CAREER_RULES } from '../../engine/themeInterpretation/rules/career/careerRules';
import { CAREER_RULE_METADATA_REGISTRY } from '../../engine/themeInterpretation/themeInterpretationMetadata';

describe('Career Manifestation Rules Provenance Audit', () => {
  const registeredRuleIds = new Set<string>([
    ...CAREER_RULES.map((r) => r.id),
    ...Object.keys(CAREER_RULE_METADATA_REGISTRY)
  ]);

  it('contains only canonical manifestation keys', () => {
    const keys = Object.keys(CAREER_MANIFESTATION_RULES);
    expect(keys).toEqual([
      'LEADERSHIP',
      'MANAGEMENT',
      'TECHNICAL_SPECIALIZATION',
      'SERVICE_EMPLOYMENT',
      'AUTHORITY',
      'INDEPENDENT_WORK',
      'BUSINESS_ENTREPRENEURSHIP'
    ]);
    expect(keys).not.toContain('EMPLOYMENT');
    expect(keys).not.toContain('ENTREPRENEURSHIP');
  });

  it('asserts every rule ID in CAREER_MANIFESTATION_RULES resolves in the engine rule registry', () => {
    for (const [mode, ruleIds] of Object.entries(CAREER_MANIFESTATION_RULES)) {
      expect(ruleIds.length).toBeGreaterThan(0);
      for (const ruleId of ruleIds) {
        const baseRuleId = ruleId.split(':')[0];
        const exists = registeredRuleIds.has(ruleId) || registeredRuleIds.has(baseRuleId);
        expect(
          exists,
          `Rule ID "${ruleId}" in manifestation mode "${mode}" was not found in CAREER_RULES or CAREER_RULE_METADATA_REGISTRY`
        ).toBe(true);
      }
    }
  });
});
