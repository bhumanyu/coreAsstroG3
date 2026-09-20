import { describe, expect, it } from 'vitest';

import { careerHouseRules } from '../../engine/themeInterpretation/rules/career/careerHouseRules';
import { careerLordRules } from '../../engine/themeInterpretation/rules/career/careerLordRules';
import { careerPlanetRules } from '../../engine/themeInterpretation/rules/career/careerPlanetRules';
import { careerAspectRules } from '../../engine/themeInterpretation/rules/career/careerAspectRules';
import { careerYogaRules } from '../../engine/themeInterpretation/rules/career/careerYogaRules';
import { careerVargaRules } from '../../engine/themeInterpretation/rules/career/careerVargaRules';
import { careerDashaRules } from '../../engine/themeInterpretation/rules/career/careerDashaRules';

import {
  CAREER_SEMANTIC_SOURCE_RULE_IDS
} from './careerSemanticSourceRegistry';

function ruleIds(
  rules: readonly { readonly id: string }[]
): readonly string[] {
  return rules.map((rule) => rule.id);
}

describe('CW-R1 C1 — Career semantic source inventory', () => {
  it('freezes the House rule source', () => {
    expect(ruleIds(careerHouseRules)).toEqual([
      'CAREER_10H_STRONG_001',
      'CAREER_10H_AFFLICTION_001',
      'CAREER_10H_OCCUPANT_001',
      'CAREER_6H_SERVICE_001',
      'CAREER_11H_GAINS_001',
      'CAREER_2H_WEALTH_001',
      'CAREER_6H_10H_LINK_001',
      'CAREER_10H_11H_LINK_001'
    ]);
  });

  it('freezes the Lord rule source', () => {
    expect(ruleIds(careerLordRules)).toEqual([
      'CAREER_10L_DIGNITY_001',
      'CAREER_6L_10L_LINK_001',
      'CAREER_10L_11L_LINK_001'
    ]);
  });

  it('freezes the Planet rule source', () => {
    expect(ruleIds(careerPlanetRules)).toEqual([
      'CAREER_SUN_RELEVANCE_001',
      'CAREER_SATURN_RELEVANCE_001',
      'CAREER_MERCURY_RELEVANCE_001',
      'CAREER_MARS_RELEVANCE_001',
      'CAREER_JUPITER_RELEVANCE_001'
    ]);
  });

  it('freezes the Aspect rule source', () => {
    expect(ruleIds(careerAspectRules)).toEqual([
      'CAREER_ASPECT_10H_001'
    ]);
  });

  it('freezes the Yoga rule source', () => {
    expect(ruleIds(careerYogaRules)).toEqual([
      'CAREER_YOGA_CONFIRMATION_001'
    ]);
  });

  it('freezes the Varga rule source', () => {
    expect(ruleIds(careerVargaRules)).toEqual([
      'CAREER_D10_CONFIRMATION_001'
    ]);
  });

  it('freezes the Dasha rule source', () => {
    expect(ruleIds(careerDashaRules)).toEqual([
      'CAREER_DASHA_TIMING_001'
    ]);
  });

  it('contains no duplicate rule ids across Career rule producers', () => {
    const actualIds = [
      ...ruleIds(careerHouseRules),
      ...ruleIds(careerLordRules),
      ...ruleIds(careerPlanetRules),
      ...ruleIds(careerAspectRules),
      ...ruleIds(careerYogaRules),
      ...ruleIds(careerVargaRules),
      ...ruleIds(careerDashaRules)
    ];

    expect(new Set(actualIds).size).toBe(actualIds.length);
  });

  it('ensures every audited rule is backed by an actual rule source', () => {
    const actualIds = [
      ...ruleIds(careerHouseRules),
      ...ruleIds(careerLordRules),
      ...ruleIds(careerPlanetRules),
      ...ruleIds(careerAspectRules),
      ...ruleIds(careerYogaRules),
      ...ruleIds(careerVargaRules),
      ...ruleIds(careerDashaRules)
    ];

    expect(
      [...new Set(actualIds)].sort()
    ).toEqual(
      [...CAREER_SEMANTIC_SOURCE_RULE_IDS].sort()
    );
  });
});
