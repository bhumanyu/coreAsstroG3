import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
import { triggered } from '../utils/ruleResult';

export const GENERAL_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-GEN-001',
    domain: 'GENERAL',
    priority: 50,
    evaluate(context: AiContext) {
      const ranked = rankEvidence(context.evidence);
      const supportingIds = ranked
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = ranked
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (supportingIds.length > challengingIds.length) {
        effect = 'SUPPORT';
      } else if (challengingIds.length > supportingIds.length) {
        effect = 'CHALLENGE';
      } else if (supportingIds.length > 0 && challengingIds.length > 0) {
        effect = 'MIXED';
      }

      const statement = `General Vedic reasoning applied over ${context.evidence.length} projected facts.`;
      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
