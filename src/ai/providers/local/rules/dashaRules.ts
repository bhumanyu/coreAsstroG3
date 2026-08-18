import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
import { notTriggered, triggered } from '../utils/ruleResult';

export const DASHA_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-DASHA-001',
    domain: 'DASHA',
    priority: 90,
    evaluate(context: AiContext) {
      if (!context.dasha.active && context.dasha.periods.length === 0) {
        return notTriggered();
      }

      const active = context.dasha.active;
      const dashaEvidence = rankEvidence(
        context.evidence.filter(
          (e) => e.source === 'DASHA' || e.dashaLevel != null || e.timingReason != null
        )
      );

      const supportingIds = dashaEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = dashaEvidence
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

      const statement = active
        ? `Active Vimshottari period is Mahadasha of ${active.mahadasha}${
            active.antardasha ? `, Antardasha of ${active.antardasha}` : ''
          }.`
        : `Vimshottari Dasha system configured with ${context.dasha.periods.length} life cycle periods.`;

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-DASHA-002',
    domain: 'DASHA',
    priority: 75,
    evaluate(context: AiContext) {
      if (!context.dasha.active) {
        return triggered(
          'NEUTRAL',
          'No active Vimshottari Dasha period is available for timing interpretation.'
        );
      }

      const timingEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            e.dimension === 'TIMING' ||
            e.priority === 'TIMING' ||
            e.timingReason != null
        )
      );

      if (timingEvidence.length === 0) {
        return notTriggered();
      }

      const supportingIds = timingEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = timingEvidence
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

      let statement =
        'No directional timing evidence is available for the active Vimshottari period.';

      if (effect === 'SUPPORT') {
        statement =
          'The active Vimshottari period has supporting deterministic timing evidence.';
      } else if (effect === 'CHALLENGE') {
        statement =
          'The active Vimshottari period has challenging deterministic timing evidence.';
      } else if (effect === 'MIXED') {
        statement =
          'The active Vimshottari period has both supporting and challenging deterministic timing evidence.';
      }

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
