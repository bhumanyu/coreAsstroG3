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
  },
  {
    id: 'LOCAL-CAREER-003',
    domain: 'CAREER',
    priority: 80,
    evaluate(context: AiContext) {
      const hierarchy = context.career?.timing?.hierarchy;
      if (!hierarchy) {
        return notTriggered();
      }

      const evidenceMap = new Map(context.evidence.map((e) => [e.id, e]));
      const supportingIds: string[] = [];
      const challengingIds: string[] = [];

      for (const id of hierarchy.evidenceIds ?? []) {
        const ev = evidenceMap.get(id);
        if (!ev) continue;
        if (ev.effect === 'SUPPORT') {
          supportingIds.push(id);
        } else if (ev.effect === 'CHALLENGE') {
          challengingIds.push(id);
        }
      }

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (hierarchy.overallEffect === 'ACTIVATES') {
        effect = 'SUPPORT';
      } else if (hierarchy.overallEffect === 'CHALLENGES') {
        effect = 'CHALLENGE';
      } else if (hierarchy.overallEffect === 'PARTIALLY_ACTIVATES') {
        effect = 'MIXED';
      }

      const statement =
        `Career timing hierarchy evaluated: ` +
        `Mahadasha of ${hierarchy.primary.planet ?? 'primary lord'} (${hierarchy.primary.role}) ${hierarchy.primary.effect.toLowerCase()}, ` +
        `Antardasha of ${hierarchy.modifier.planet ?? 'modifier lord'} (${hierarchy.modifier.role}) ${hierarchy.modifier.effect.toLowerCase()}, ` +
        `Pratyantardasha of ${hierarchy.trigger.planet ?? 'trigger lord'} (${hierarchy.trigger.role}) ${hierarchy.trigger.effect.toLowerCase()}. ` +
        `Deterministic synthesis outcome is ${hierarchy.overallEffect}.`;

      return triggered(effect, statement, supportingIds, challengingIds);
    }
  }
]);
