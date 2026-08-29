import type { ReasoningNodeDomain } from '../reasoningTrace/reasoningNode';
import type {
  CounterReasoningClaim,
  CounterReasoningQuestionType
} from './counterReasoningTypes';
import { classifyQuestion } from './questionClassifier';

export interface ResolveClaimParams {
  readonly domain: ReasoningNodeDomain;
  readonly question: string;
  readonly questionType?: CounterReasoningQuestionType;
  readonly targetSubjectKey?: string;
}

/**
 * Resolves a CounterReasoningClaim from a question, domain, and optional parameters.
 * Enforces exact canonical subjectKeys matching the reasoning graph nodes:
 * - 'NATAL_PROMISE'
 * - 'DASHA_ACTIVATION'
 * - 'TIMING_TRIGGER'
 * - 'D10_CONFIRMATION' (CAREER) / 'D2_CONFIRMATION' (WEALTH)
 * - 'CAREER_MANIFESTATION' (CAREER) / 'WEALTH_MANIFESTATION' (WEALTH)
 * - 'FINAL_SYNTHESIS' (default)
 */
export function resolveClaim(params: ResolveClaimParams): CounterReasoningClaim {
  const { domain, question } = params;
  const questionType = params.questionType ?? classifyQuestion(question);

  let targetSubjectKey = params.targetSubjectKey;

  if (!targetSubjectKey) {
    const normalized = question.toLowerCase();

    if (questionType === 'DASHA_CHALLENGE' || normalized.includes('dasha') || normalized.includes('period')) {
      targetSubjectKey = 'DASHA_ACTIVATION';
    } else if (
      questionType === 'DIVISIONAL_CHALLENGE' ||
      normalized.includes('d10') ||
      normalized.includes('d2') ||
      normalized.includes('dasamsa') ||
      normalized.includes('hora') ||
      normalized.includes('divisional')
    ) {
      targetSubjectKey = domain === 'CAREER' ? 'D10_CONFIRMATION' : 'D2_CONFIRMATION';
    } else if (
      questionType === 'TIMING_CHALLENGE' ||
      normalized.includes('transit') ||
      normalized.includes('timing') ||
      normalized.includes('gochara')
    ) {
      targetSubjectKey = 'TIMING_TRIGGER';
    } else if (
      normalized.includes('manifestation') ||
      normalized.includes('manifest') ||
      normalized.includes('concrete') ||
      (domain === 'CAREER' && (normalized.includes('role') || normalized.includes('industry'))) ||
      (domain === 'WEALTH' && (normalized.includes('asset') || normalized.includes('stream')))
    ) {
      targetSubjectKey = domain === 'CAREER' ? 'CAREER_MANIFESTATION' : 'WEALTH_MANIFESTATION';
    } else if (
      normalized.includes('natal') ||
      normalized.includes('promise') ||
      normalized.includes('birth chart') ||
      normalized.includes('capacity') ||
      normalized.includes('potential')
    ) {
      targetSubjectKey = 'NATAL_PROMISE';
    } else {
      targetSubjectKey = 'FINAL_SYNTHESIS';
    }
  }

  // Determine polarity
  let polarity: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
  if (questionType === 'WHY') {
    polarity = 'SUPPORT';
  } else if (
    questionType === 'WHY_NOT' ||
    questionType === 'DASHA_CHALLENGE' ||
    questionType === 'DIVISIONAL_CHALLENGE' ||
    questionType === 'TIMING_CHALLENGE' ||
    questionType === 'GENERAL_CHALLENGE'
  ) {
    polarity = 'CHALLENGE';
  }

  return {
    domain,
    question,
    questionType,
    targetSubjectKey,
    polarity
  };
}
