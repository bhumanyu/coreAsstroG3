import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
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

      const relevantEvidence = rankEvidence(
        context.evidence.filter((e) => e.source === 'WEALTH')
      );
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

      const relevantEvidence = rankEvidence(
        context.evidence.filter(
          (e) => e.source === 'WEALTH' || e.source === 'HOUSE'
        )
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

      const supportingYogas = dhanaYogas.filter(
        (y) => y.status === 'PRESENT' || y.status === 'STRONG'
      );
      const challengedYogas = dhanaYogas.filter(
        (y) => y.status === 'WEAKENED'
      );
      const cancelledYogas = dhanaYogas.filter(
        (y) => y.status === 'CANCELLED'
      );

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (supportingYogas.length > challengedYogas.length + cancelledYogas.length) {
        effect = 'SUPPORT';
      } else if (challengedYogas.length + cancelledYogas.length > supportingYogas.length) {
        effect = 'CHALLENGE';
      } else if (
        supportingYogas.length > 0 &&
        (challengedYogas.length > 0 || cancelledYogas.length > 0)
      ) {
        effect = 'MIXED';
      }

      const yogaEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            e.source === 'YOGA' &&
            (e.statement.toUpperCase().includes('DHANA') ||
              e.statement.toUpperCase().includes('LAKSHMI'))
        )
      );
      const supportingIds = yogaEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = yogaEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      const statement = `Dhana and prosperity yoga patterns evaluated in the chart (${supportingYogas.length} positive indications).`;
      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
