import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { notTriggered, triggered } from '../utils/ruleResult';

export const WEALTH_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-WEALTH-001',
    domain: 'WEALTH',
    priority: 90,
    evaluate(context: AiContext) {
      if (!context.wealth) {
        return notTriggered();
      }

      const relevantEvidence = context.evidence.filter((e) => e.source === 'WEALTH');
      const supportingIds = relevantEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = relevantEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (
        context.wealth.status === 'STRONGLY_SUPPORTED' ||
        context.wealth.status === 'SUPPORTED'
      ) {
        effect = 'SUPPORT';
      } else if (context.wealth.status === 'CHALLENGED') {
        effect = 'CHALLENGE';
      } else if (context.wealth.status === 'MIXED') {
        effect = 'MIXED';
      }

      const statement = `Wealth analysis status is ${context.wealth.status}.`;
      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-WEALTH-002',
    domain: 'WEALTH',
    priority: 80,
    evaluate(context: AiContext) {
      if (!context.wealth?.subthemes || context.wealth.subthemes.length === 0) {
        return notTriggered();
      }

      const subthemes = context.wealth.subthemes;
      const supportedCount = subthemes.filter(
        (s) => s.status === 'STRONGLY_SUPPORTED' || s.status === 'SUPPORTED'
      ).length;
      const challengedCount = subthemes.filter(
        (s) => s.status === 'CHALLENGED'
      ).length;

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (supportedCount > challengedCount) {
        effect = 'SUPPORT';
      } else if (challengedCount > supportedCount) {
        effect = 'CHALLENGE';
      } else if (supportedCount > 0 && challengedCount > 0) {
        effect = 'MIXED';
      }

      const relevantEvidence = context.evidence.filter(
        (e) => e.source === 'WEALTH' || e.source === 'HOUSE'
      );
      const supportingIds = relevantEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = relevantEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      const statement = `Evaluated ${subthemes.length} wealth subthemes across accumulation, gains, fortune, and speculation.`;
      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-WEALTH-003',
    domain: 'WEALTH',
    priority: 70,
    evaluate(context: AiContext) {
      const dhanaYogas = context.yogas.filter(
        (y) =>
          y.category === 'DHANA' ||
          y.type.toUpperCase().includes('DHANA') ||
          y.type.toUpperCase().includes('LAKSHMI')
      );

      if (dhanaYogas.length === 0) {
        return notTriggered();
      }

      const activeDhanaYogas = dhanaYogas.filter((y) => y.status !== 'CANCELLED');
      const effect: LocalRuleEffect = activeDhanaYogas.length > 0 ? 'SUPPORT' : 'NEUTRAL';

      const yogaEvidence = context.evidence.filter(
        (e) =>
          e.source === 'YOGA' &&
          (e.statement.toUpperCase().includes('DHANA') ||
            e.statement.toUpperCase().includes('LAKSHMI') ||
            e.effect === 'SUPPORT')
      );
      const supportingIds = yogaEvidence.map((e) => e.id);

      const statement = `Dhana and prosperity yoga patterns reinforce financial potential in the chart.`;
      return triggered(effect, statement, supportingIds);
    }
  }
]);
