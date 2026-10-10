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
  },
  {
    id: 'LOCAL-CAREER-004',
    domain: 'CAREER',
    priority: 75,
    evaluate(context: AiContext) {
      const canonicalC11 = context.career?.canonicalC11;
      if (!canonicalC11) {
        return notTriggered();
      }

      const statement =
        `Canonical C11 synthesis: final status ${canonicalC11.finalStatus}, ` +
        `final direction ${canonicalC11.finalDirection}, final strength ${canonicalC11.finalStrength}, ` +
        `confidence ${canonicalC11.confidence}. ` +
        `Natal direction ${canonicalC11.natalDirection}, natal strength ${canonicalC11.natalStrength}. ` +
        `Expression status ${canonicalC11.expressionStatus}, D10 direction ${canonicalC11.d10Direction}, ` +
        `Dasha effect ${canonicalC11.dashaEffect}, timing status ${canonicalC11.timingStatus}. ` +
        `${canonicalC11.conflicts.length > 0 ? `${canonicalC11.conflicts.length} conflict(s) detected. ` : ''}` +
        `${canonicalC11.strongestExpressions.length > 0 ? `Strongest expressions: ${canonicalC11.strongestExpressions.join(', ')}. ` : ''}`;

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (canonicalC11.finalDirection === 'SUPPORT') {
        effect = 'SUPPORT';
      } else if (canonicalC11.finalDirection === 'CHALLENGE') {
        effect = 'CHALLENGE';
      } else if (canonicalC11.finalDirection === 'MIXED') {
        effect = 'MIXED';
      }

      return triggered(effect, statement, [], []);
    }
  },
  {
    id: 'LOCAL-CAREER-005',
    domain: 'CAREER',
    priority: 70,
    evaluate(context: AiContext) {
      const profession = context.career?.profession;
      if (!profession) {
        return notTriggered();
      }

      const statement =
        `Profession analysis: availability ${profession.availability}, status ${profession.status}. ` +
        `D10 status ${profession.d10Status}. ` +
        `${profession.candidates.length > 0 ? `${profession.candidates.length} profession candidate(s) identified. ` : 'No profession candidates identified. '}` +
        `${profession.missingInputs.length > 0 ? `Missing inputs: ${profession.missingInputs.join(', ')}. ` : ''}` +
        `${profession.unresolvedExpressionTypes.length > 0 ? `Unresolved expression types: ${profession.unresolvedExpressionTypes.join(', ')}. ` : ''}` +
        `${profession.mappedTypes.length > 0 ? `Mapped expression types: ${profession.mappedTypes.join(', ')}. ` : ''}`;

      let effect: LocalRuleEffect = 'NEUTRAL';
      if (profession.availability === 'AVAILABLE' && profession.status === 'COMPLETE') {
        effect = 'SUPPORT';
      } else if (profession.availability === 'UNAVAILABLE' || profession.status === 'INSUFFICIENT_DATA') {
        effect = 'NEUTRAL';
      } else if (profession.status === 'PARTIAL') {
        effect = 'MIXED';
      }

      return triggered(effect, statement, [], []);
    }
  }
]);
