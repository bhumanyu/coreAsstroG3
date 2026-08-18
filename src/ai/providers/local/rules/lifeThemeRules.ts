import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { notTriggered, triggered } from '../utils/ruleResult';

export const LIFE_THEME_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-THEME-001',
    domain: 'LIFE_THEME',
    priority: 90,
    evaluate(context: AiContext) {
      if (!context.lifeThemes || context.lifeThemes.length === 0) {
        return notTriggered();
      }

      const supportedThemes = context.lifeThemes.filter((t) => t.effect === 'SUPPORT');
      const challengedThemes = context.lifeThemes.filter((t) => t.effect === 'CHALLENGE');

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (supportedThemes.length > challengedThemes.length) {
        effect = 'SUPPORT';
      } else if (challengedThemes.length > supportedThemes.length) {
        effect = 'CHALLENGE';
      } else if (supportedThemes.length > 0 && challengedThemes.length > 0) {
        effect = 'MIXED';
      }

      const themeEvidence = context.evidence.filter((e) => e.source === 'LIFE_THEME');
      const supportingIds = themeEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = themeEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      const statement = `Evaluated ${context.lifeThemes.length} life themes across natal dimensions.`;
      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
