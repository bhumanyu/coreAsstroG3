import { describe, it, expect } from 'vitest';
import { CAREER_MANIFESTATION_RULES } from './careerReasoningRules';
import { careerHouseRules } from '../../engine/themeInterpretation/rules/career/careerHouseRules';
import { careerPlanetRules } from '../../engine/themeInterpretation/rules/career/careerPlanetRules';
import { careerLordRules } from '../../engine/themeInterpretation/rules/career/careerLordRules';
import { careerAspectRules } from '../../engine/themeInterpretation/rules/career/careerAspectRules';
import { careerYogaRules } from '../../engine/themeInterpretation/rules/career/careerYogaRules';
import { careerVargaRules } from '../../engine/themeInterpretation/rules/career/careerVargaRules';
import { careerDashaRules } from '../../engine/themeInterpretation/rules/career/careerDashaRules';
import { CAREER_RULES } from '../../engine/themeInterpretation/rules/career/careerRules';
import { CAREER_RULE_METADATA_REGISTRY } from '../../engine/themeInterpretation/themeInterpretationMetadata';

describe('Career Manifestation Rule Audit (Producer Provenance)', () => {
  const producerRuleIds = new Set<string>([
    ...careerHouseRules.map((r) => r.id),
    ...careerPlanetRules.map((r) => r.id),
    ...careerLordRules.map((r) => r.id),
    ...careerAspectRules.map((r) => r.id),
    ...careerYogaRules.map((r) => r.id),
    ...careerVargaRules.map((r) => r.id),
    ...careerDashaRules.map((r) => r.id),
    ...CAREER_RULES.map((r) => r.id)
  ]);

  const metadataRuleIds = new Set<string>(Object.keys(CAREER_RULE_METADATA_REGISTRY));

  it('verifies that every manifestation rule ID is emitted by a real evidence producer', () => {
    for (const [mode, rules] of Object.entries(CAREER_MANIFESTATION_RULES)) {
      expect(rules.length).toBeGreaterThan(0);
      for (const ruleId of rules) {
        const baseRuleId = ruleId.split(':')[0];
        const isEmitted = producerRuleIds.has(ruleId) || producerRuleIds.has(baseRuleId);
        expect(
          isEmitted,
          `Manifestation rule "${ruleId}" in mode "${mode}" is not emitted by any real evidence generator in careerHouseRules, careerPlanetRules, careerLordRules, careerYogaRules, etc.`
        ).toBe(true);
      }
    }
  });

  it('verifies that every manifestation rule ID has corresponding metadata in CAREER_RULE_METADATA_REGISTRY', () => {
    for (const [mode, rules] of Object.entries(CAREER_MANIFESTATION_RULES)) {
      for (const ruleId of rules) {
        const baseRuleId = ruleId.split(':')[0];
        const hasMetadata = metadataRuleIds.has(ruleId) || metadataRuleIds.has(baseRuleId);
        expect(
          hasMetadata,
          `Manifestation rule "${ruleId}" in mode "${mode}" lacks metadata registration in CAREER_RULE_METADATA_REGISTRY`
        ).toBe(true);
      }
    }
  });

  it('ensures all 7 canonical manifestation modes are present and valid', () => {
    const modes = Object.keys(CAREER_MANIFESTATION_RULES);
    expect(modes).toEqual([
      'LEADERSHIP',
      'MANAGEMENT',
      'TECHNICAL_SPECIALIZATION',
      'SERVICE_EMPLOYMENT',
      'AUTHORITY',
      'INDEPENDENT_WORK',
      'BUSINESS_ENTREPRENEURSHIP'
    ]);
  });
});
