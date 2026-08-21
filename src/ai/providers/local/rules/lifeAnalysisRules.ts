import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
import { notTriggered, triggered } from '../utils/ruleResult';

export const LIFE_ANALYSIS_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-LIFE-001',
    domain: 'LIFE_ANALYSIS',
    priority: 95,
    evaluate(context: AiContext) {
      if (!context.lifeAnalysis) {
        return notTriggered();
      }

      const lifeAnalysisEvidenceIds = new Set(context.lifeAnalysis.evidenceIds || []);

      const relevantEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            lifeAnalysisEvidenceIds.has(e.id) ||
            e.source === 'CAREER' ||
            e.source === 'WEALTH' ||
            e.source === 'D10' ||
            e.source === 'D2' ||
            e.source === 'DASHA'
        )
      );

      const supportingIds = relevantEvidence
        .filter((e) => e.effect === 'SUPPORT')
        .map((e) => e.id);

      const challengingIds = relevantEvidence
        .filter((e) => e.effect === 'CHALLENGE')
        .map((e) => e.id);

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (
        context.lifeAnalysis.status === 'STRONGLY_SUPPORTED' ||
        context.lifeAnalysis.status === 'SUPPORTED'
      ) {
        effect = 'SUPPORT';
      } else if (context.lifeAnalysis.status === 'CHALLENGED') {
        effect = 'CHALLENGE';
      } else if (context.lifeAnalysis.status === 'MIXED') {
        effect = 'MIXED';
      }

      const domainCount = context.lifeAnalysis.domainSummaries?.length ?? 0;
      const statement = `Cross-domain life analysis status is ${context.lifeAnalysis.status} across ${domainCount} evaluated domains with completeness ${context.lifeAnalysis.completeness}.`;

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-LIFE-002',
    domain: 'LIFE_ANALYSIS',
    priority: 85,
    evaluate(context: AiContext) {
      if (!context.lifeAnalysis || context.lifeAnalysis.conflictCount === 0) {
        return notTriggered();
      }

      const conflictingEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            e.vargaRelationship === 'CONFLICTS' ||
            ((e.source === 'CAREER' ||
              e.source === 'WEALTH' ||
              e.source === 'D10' ||
              e.source === 'D2' ||
              e.source === 'DASHA') &&
              e.effect === 'CHALLENGE')
        )
      );

      const challengingIds = conflictingEvidence.map((e) => e.id);

      return triggered(
        'CHALLENGE',
        `Cross-domain synthesis identified ${context.lifeAnalysis.conflictCount} conflict(s) across evaluated life domains.`,
        [],
        challengingIds
      );
    }
  }
]);
