import type { AiContext } from '../../types/aiContextTypes';
import type { AiTask } from '../../types/aiRequestTypes';
import type { AiReasoningResult, AiReasoningStatus } from '../../types/aiReasoningResult';
import type { LocalRuleDefinition, LocalRuleDomain } from './localVedicRulesTypes';
import { LOCAL_VEDIC_RULES } from './rules';

export const TASK_DOMAIN: Record<AiTask, LocalRuleDomain> = Object.freeze({
  CHART_SYNTHESIS: 'CHART',
  CAREER_ANALYSIS: 'CAREER',
  WEALTH_ANALYSIS: 'WEALTH',
  DASHA_ANALYSIS: 'DASHA',
  LIFE_THEME_ANALYSIS: 'LIFE_THEME',
  GENERAL_QUERY: 'GENERAL'
});

function buildConclusion(task: AiTask, context: AiContext): string {
  switch (task) {
    case 'CAREER_ANALYSIS': {
      if (context.career) {
        return `Career analysis indicates a status of ${context.career.status}, with natal promise assessed as ${context.career.natalPromise} and D10 relationship configured as ${context.career.d10Relationship}. Key career factors are established across ${context.career.supportingFactors.length} supporting and ${context.career.challengingFactors.length} challenging indications.`;
      }
      return 'Career analysis facts are not fully configured in the provided context.';
    }
    case 'WEALTH_ANALYSIS': {
      if (context.wealth) {
        const subthemeCount = context.wealth.subthemes?.length ?? 0;
        return `Wealth analysis indicates a status of ${context.wealth.status} across ${subthemeCount} evaluated financial subthemes with ${context.wealth.supportingFactors.length} supporting factors.`;
      }
      return 'Wealth analysis facts are not fully configured in the provided context.';
    }
    case 'DASHA_ANALYSIS': {
      if (context.dasha.active) {
        const { mahadasha, antardasha, pratyantardasha } = context.dasha.active;
        const subPeriods = [
          antardasha ? `Antardasha of ${antardasha}` : undefined,
          pratyantardasha ? `Pratyantardasha of ${pratyantardasha}` : undefined
        ].filter(Boolean).join(', ');
        return `Vimshottari Dasha analysis highlights active Mahadasha of ${mahadasha}${subPeriods ? ` with ${subPeriods}` : ''}, correlating current planetary cycles with natal promise activations.`;
      }
      return 'Active Vimshottari dasha periods are not specified in the context.';
    }
    case 'LIFE_THEME_ANALYSIS': {
      return `Life theme analysis evaluated ${context.lifeThemes.length} foundational themes across career, wealth, spiritual development, and life vitality.`;
    }
    case 'CHART_SYNTHESIS': {
      return `Chart synthesis evaluates the native's birth chart incorporating ${context.evidence.length} evidence items across ${context.planets.length} planetary positions, ${context.houses.length} house structures, and divisional alignments.`;
    }
    case 'GENERAL_QUERY':
    default: {
      return `General Vedic astrological reasoning synthesized from ${context.evidence.length} projected evidence facts and ${context.yogas.length} yoga indicators.`;
    }
  }
}

/**
 * Deterministically reasons over an immutable AiContext using local Vedic heuristic rules.
 * Never performs raw astronomical/astrological calculations; purely interprets projected facts and evidence.
 */
export function reasonWithLocalRules(
  task: AiTask,
  context: AiContext
): AiReasoningResult {
  const targetDomain = TASK_DOMAIN[task] ?? 'GENERAL';

  // Filter rules by task domain + GENERAL domain
  const candidateRules = LOCAL_VEDIC_RULES.filter(
    (rule) => rule.domain === targetDomain || rule.domain === 'GENERAL'
  );

  // Sort rules deterministically by priority (descending), then id (ascending)
  const sortedRules = [...candidateRules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.id.localeCompare(b.id);
  });

  const validEvidenceIdSet = new Set(context.evidence.map((e) => e.id));
  const supportingSet = new Set<string>();
  const challengingSet = new Set<string>();
  const triggeredRuleSet = new Set<string>();
  const warnings: string[] = [];

  for (const rule of sortedRules) {
    try {
      const evaluation = rule.evaluate(context);
      if (evaluation.triggered) {
        triggeredRuleSet.add(rule.id);

        if (evaluation.warnings) {
          warnings.push(...evaluation.warnings);
        }

        if (evaluation.supportingEvidenceIds) {
          for (const id of evaluation.supportingEvidenceIds) {
            if (validEvidenceIdSet.has(id)) {
              supportingSet.add(id);
            }
          }
        }

        if (evaluation.challengingEvidenceIds) {
          for (const id of evaluation.challengingEvidenceIds) {
            if (validEvidenceIdSet.has(id)) {
              challengingSet.add(id);
            }
          }
        }
      }
    } catch (error) {
      warnings.push(
        `Rule ${rule.id} evaluation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  let status: AiReasoningStatus = 'PARTIAL';
  if (supportingSet.size > 0 && challengingSet.size > 0) {
    status = 'PARTIAL';
  } else if (supportingSet.size > 0 || challengingSet.size > 0) {
    status = 'SUCCESS';
  } else {
    status = 'PARTIAL';
  }

  const conclusion = buildConclusion(task, context);

  return Object.freeze({
    status,
    conclusion,
    supportingEvidenceIds: Object.freeze(Array.from(supportingSet).sort()),
    challengingEvidenceIds: Object.freeze(Array.from(challengingSet).sort()),
    unresolvedQuestions: Object.freeze([]),
    warnings: Object.freeze(warnings),
    triggeredRuleIds: Object.freeze(Array.from(triggeredRuleSet).sort())
  });
}
