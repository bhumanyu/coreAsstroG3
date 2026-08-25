import { CAREER_MANIFESTATION_RULES } from '../careerReasoningRules';
import type { CareerManifestationMode } from './careerManifestationSynthesisTypes';

export { CAREER_MANIFESTATION_RULES };

export function getModeRuleSet(mode: CareerManifestationMode): ReadonlySet<string> {
  const rules = CAREER_MANIFESTATION_RULES[mode];
  if (!rules) {
    return new Set<string>();
  }
  return new Set<string>(rules);
}
