import type { LocalRuleDefinition } from '../localVedicRulesTypes';
import { CAREER_RULES } from './careerRules';
import { WEALTH_RULES } from './wealthRules';
import { DASHA_RULES } from './dashaRules';
import { LIFE_THEME_RULES } from './lifeThemeRules';
import { LIFE_ANALYSIS_RULES } from './lifeAnalysisRules';
import { CHART_SYNTHESIS_RULES } from './chartSynthesisRules';
import { GENERAL_RULES } from './generalRules';

export {
  CAREER_RULES,
  WEALTH_RULES,
  DASHA_RULES,
  LIFE_THEME_RULES,
  LIFE_ANALYSIS_RULES,
  CHART_SYNTHESIS_RULES,
  GENERAL_RULES
};

export const LOCAL_VEDIC_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  ...CAREER_RULES,
  ...WEALTH_RULES,
  ...DASHA_RULES,
  ...LIFE_THEME_RULES,
  ...LIFE_ANALYSIS_RULES,
  ...CHART_SYNTHESIS_RULES,
  ...GENERAL_RULES
]);
