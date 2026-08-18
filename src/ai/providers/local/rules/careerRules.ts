import type { AiContext } from '../../../types/aiContextTypes';
import type { LocalRuleDefinition, LocalRuleEffect } from '../localVedicRulesTypes';
import { rankEvidence } from '../utils/evidenceScorer';
import { notTriggered, triggered } from '../utils/ruleResult';

export const CAREER_RULES: readonly LocalRuleDefinition[] = Object.freeze([
  {
    id: 'LOCAL-CAREER-001',
    domain: 'CAREER',
    priority: 90,
    evaluate(context: AiContext) {
      if (!context.career) {
        return notTriggered();
      }

      const relevantEvidence = rankEvidence(
        context.evidence.filter(
          (e) =>
            e.source === 'CAREER' ||
            e.source === 'D10' ||
            (e.source === 'DASHA' &&
              (e.dimension === 'CONFIRMATION' ||
                e.dimension === 'TIMING' ||
                e.statement.toLowerCase().includes('career') ||
                e.statement.toLowerCase().includes('profession') ||
                e.statement.toLowerCase().includes('d10') ||
                e.statement.toLowerCase().includes('10th')))
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
        context.career.status === 'STRONGLY_SUPPORTED' ||
        context.career.status === 'SUPPORTED'
      ) {
        effect = 'SUPPORT';
      } else if (context.career.status === 'CHALLENGED') {
        effect = 'CHALLENGE';
      } else if (context.career.status === 'MIXED') {
        effect = 'MIXED';
      }

      const statement = `Career status is ${context.career.status} with natal promise ${context.career.natalPromise} and D10 relationship ${context.career.d10Relationship}.`;

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  },
  {
    id: 'LOCAL-CAREER-002',
    domain: 'CAREER',
    priority: 85,
    evaluate(context: AiContext) {
      if (!context.career || context.career.d10Relationship !== 'CONFLICTS') {
        return notTriggered();
      }

      const conflictingEvidence = rankEvidence(
        context.evidence.filter((e) => e.vargaRelationship === 'CONFLICTS')
      );
      const challengingIds = conflictingEvidence.map((e) => e.id);

      return triggered(
        'CHALLENGE',
        `D10 Dashamsha relationship ${context.career.d10Relationship} conflicts with natal career indicators.`,
        [],
        challengingIds
      );
    }
  }
]);
