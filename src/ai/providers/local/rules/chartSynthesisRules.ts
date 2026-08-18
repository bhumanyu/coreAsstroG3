import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
import { notTriggered, triggered } from '../utils/ruleResult';

export const CHART_SYNTHESIS_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-CHART-001',
    domain: 'CHART',
    priority: 95,
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

      const statement = `Chart synthesis evaluated across ${context.evidence.length} total projected evidence factors with ${context.planets.length} planets and ${context.houses.length} houses.`;
      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-CHART-002',
    domain: 'CHART',
    priority: 85,
    evaluate(context: AiContext) {
      if (!context.ascendant) {
        return notTriggered();
      }

      const asc = context.ascendant;
      const ascLordFacts = context.planets.find((p) => p.planet === asc.lord);
      const ascEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            e.planets?.includes(asc.lord) ||
            e.houses?.includes(1) ||
            e.source === 'HOUSE' ||
            e.source === 'PLANET'
        )
      );

      const supportingIds = ascEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);
      const challengingIds = ascEvidence
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

      const strengthInfo = ascLordFacts?.strengthStatus ? ` (${ascLordFacts.strengthStatus})` : '';
      const statement = `Ascendant in ${asc.sign} ruled by ${asc.lord}${strengthInfo}.`;

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-CHART-003',
    domain: 'CHART',
    priority: 80,
    evaluate(context: AiContext) {
      const vargaEvidence = rankEvidence(
        context.evidence.filter(
          (e) => e.vargaRelationship != null || e.source === 'D9' || e.source === 'D10'
        )
      );

      if (vargaEvidence.length === 0) {
        return notTriggered();
      }

      const conflicts = vargaEvidence.filter((e) => e.vargaRelationship === 'CONFLICTS');
      const confirms = vargaEvidence.filter(
        (e) => e.vargaRelationship === 'CONFIRMS' || e.vargaRelationship === 'PARTIALLY_CONFIRMS'
      );

      const challengingIds = conflicts.map((e) => e.id);
      const supportingIds = confirms.map((e) => e.id);

      let effect: LocalRuleEffect = 'NEUTRAL';
      let statement = 'Divisional harmonic charts evaluated across natal alignments.';

      if (confirms.length > conflicts.length) {
        effect = 'SUPPORT';
        statement = 'Divisional harmonic charts confirm core natal alignments.';
      } else if (conflicts.length > confirms.length) {
        effect = 'CHALLENGE';
        statement = `Varga relationships indicate structural modifications or conflicts across divisional charts (${conflicts.length} conflicting factors detected).`;
      } else if (confirms.length > 0 && conflicts.length > 0) {
        effect = 'MIXED';
        statement = `Varga relationships present mixed confirmations and modifications across divisional charts (${confirms.length} confirming, ${conflicts.length} conflicting).`;
      }

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
