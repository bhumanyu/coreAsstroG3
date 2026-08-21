import type { AiContext } from '../../types/aiContextTypes';
import type { AiTask } from '../../types/aiRequestTypes';
import type { AiReasoningResult, AiReasoningStatus } from '../../types/aiReasoningResult';
import type { LocalRuleDefinition, LocalRuleDomain } from './localVedicRulesTypes';
import { rankEvidence } from './utils/evidenceScorer';
import { LOCAL_VEDIC_RULES } from './rules';

export const TASK_DOMAIN: Record<AiTask, LocalRuleDomain> = Object.freeze({
  CHART_SYNTHESIS: 'CHART',
  CAREER_ANALYSIS: 'CAREER',
  WEALTH_ANALYSIS: 'WEALTH',
  DASHA_ANALYSIS: 'DASHA',
  LIFE_THEME_ANALYSIS: 'LIFE_THEME',
  LIFE_ANALYSIS_EXPLANATION: 'LIFE_ANALYSIS',
  GENERAL_QUERY: 'GENERAL'
});

function buildLifeAnalysisExplanationConclusion(context: AiContext): string {
  if (!context.lifeAnalysis) {
    return 'Life analysis facts and cross-domain synthesis are not available in the provided context.';
  }

  const careerInterp = context.domainInterpretations?.find((d) => d.domain === 'CAREER');
  const wealthInterp = context.domainInterpretations?.find((d) => d.domain === 'WEALTH');

  const careerPart = careerInterp
    ? `Career analysis indicates ${careerInterp.conclusion.statement}`
    : context.career
      ? `Career analysis indicates ${context.career.status}`
      : 'Career analysis is pending';

  const wealthPart = wealthInterp
    ? `Wealth analysis indicates ${wealthInterp.conclusion.statement}`
    : context.wealth
      ? `Wealth analysis indicates ${context.wealth.status}`
      : 'Wealth analysis is pending';

  const overall = context.lifeAnalysis.overallStatement
    ? ` Overall synthesis: ${context.lifeAnalysis.overallStatement}`
    : ` Overall synthesis indicates ${context.lifeAnalysis.status} alignment across domains.`;

  const evidencePart = ` Grounded in ${context.evidence.length} projected evidence factors across evaluated domains.`;

  return `Cross-domain synthesis integrates Career and Wealth domain interpretations: ${careerPart}; ${wealthPart}.${overall}${evidencePart}`;
}

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
    case 'LIFE_ANALYSIS_EXPLANATION': {
      return buildLifeAnalysisExplanationConclusion(context);
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
  context: AiContext,
  rulesOverride?: readonly LocalRuleDefinition[]
): AiReasoningResult {
  const targetDomain = TASK_DOMAIN[task] ?? 'GENERAL';

  // Filter rules strictly by task domain
  const candidateRules = (rulesOverride ?? LOCAL_VEDIC_RULES).filter(
    (rule) => rule.domain === targetDomain
  );

  // Sort rules deterministically by priority (descending), then id (ascending)
  const sortedRules = [...candidateRules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.id.localeCompare(b.id);
  });

  const validEvidenceMap = new Map(context.evidence.map((e) => [e.id, e]));
  const supportingSet = new Set<string>();
  const challengingSet = new Set<string>();
  const triggeredRuleSet = new Set<string>();
  const unresolvedQuestionsSet = new Set<string>();
  const warnings: string[] = [];
  let ruleFailureCount = 0;

  // Check for missing task-level context and record unresolved questions
  switch (task) {
    case 'CAREER_ANALYSIS': {
      if (!context.career) {
        unresolvedQuestionsSet.add('Career context is unavailable in the provided chart projection.');
      }
      break;
    }
    case 'WEALTH_ANALYSIS': {
      if (!context.wealth) {
        unresolvedQuestionsSet.add('Wealth context is unavailable in the provided chart projection.');
      }
      break;
    }
    case 'DASHA_ANALYSIS': {
      if (!context.dasha.active) {
        unresolvedQuestionsSet.add('No active Vimshottari Dasha period is available.');
      }
      break;
    }
    case 'LIFE_THEME_ANALYSIS': {
      if (context.lifeThemes.length === 0) {
        unresolvedQuestionsSet.add('No life theme facts are available in the provided context.');
      }
      break;
    }
    case 'LIFE_ANALYSIS_EXPLANATION': {
      if (!context.lifeAnalysis) {
        unresolvedQuestionsSet.add('Life analysis is unavailable.');
      }
      break;
    }
    case 'CHART_SYNTHESIS': {
      if (context.planets.length === 0) {
        unresolvedQuestionsSet.add('Planetary facts are unavailable in the provided context.');
      }
      if (context.houses.length === 0) {
        unresolvedQuestionsSet.add('House facts are unavailable in the provided context.');
      }
      break;
    }
    case 'GENERAL_QUERY': {
      if (context.evidence.length === 0) {
        unresolvedQuestionsSet.add('No evidence items are available in the provided context.');
      }
      break;
    }
  }

  for (const rule of sortedRules) {
    try {
      const evaluation = rule.evaluate(context);
      if (evaluation.triggered) {
        triggeredRuleSet.add(rule.id);

        if (evaluation.warnings) {
          warnings.push(...evaluation.warnings);
        }

        if (evaluation.unresolvedQuestions) {
          for (const q of evaluation.unresolvedQuestions) {
            unresolvedQuestionsSet.add(q);
          }
        }

        if (evaluation.supportingEvidenceIds) {
          for (const id of evaluation.supportingEvidenceIds) {
            if (validEvidenceMap.has(id)) {
              supportingSet.add(id);
            } else {
              warnings.push(
                `Rule ${rule.id} referenced unknown supporting evidence ID: ${id}`
              );
            }
          }
        }

        if (evaluation.challengingEvidenceIds) {
          for (const id of evaluation.challengingEvidenceIds) {
            if (validEvidenceMap.has(id)) {
              challengingSet.add(id);
            } else {
              warnings.push(
                `Rule ${rule.id} referenced unknown challenging evidence ID: ${id}`
              );
            }
          }
        }
      }
    } catch (error) {
      ruleFailureCount++;
      warnings.push(
        `Rule ${rule.id} evaluation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  let status: AiReasoningStatus = 'PARTIAL';
  if (ruleFailureCount > 0) {
    status = 'PARTIAL';
  } else if (supportingSet.size > 0 && challengingSet.size > 0) {
    status = 'PARTIAL';
  } else if (supportingSet.size > 0 || challengingSet.size > 0) {
    status = 'SUCCESS';
  } else {
    status = 'PARTIAL';
  }

  const conclusion = buildConclusion(task, context);

  // Rank supporting and challenging evidence deterministically by priority score
  const rankedSupporting = rankEvidence(
    Array.from(supportingSet)
      .map((id) => validEvidenceMap.get(id))
      .filter((e): e is NonNullable<typeof e> => e != null)
  ).map((e) => e.id);

  const rankedChallenging = rankEvidence(
    Array.from(challengingSet)
      .map((id) => validEvidenceMap.get(id))
      .filter((e): e is NonNullable<typeof e> => e != null)
  ).map((e) => e.id);

  return Object.freeze({
    status,
    conclusion,
    supportingEvidenceIds: Object.freeze(rankedSupporting),
    challengingEvidenceIds: Object.freeze(rankedChallenging),
    unresolvedQuestions: Object.freeze(Array.from(unresolvedQuestionsSet).sort()),
    warnings: Object.freeze(warnings),
    triggeredRuleIds: Object.freeze(Array.from(triggeredRuleSet).sort())
  });
}
