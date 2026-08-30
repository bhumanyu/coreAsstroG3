import type { ReasoningNodeDomain } from '../reasoningTrace/reasoningNode';
import type {
  CounterReasoningAssertionMode,
  CounterReasoningClaim,
  CounterReasoningOutcome,
  CounterReasoningPolarity,
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
 * Deterministically resolves the assertion mode of a proposition/question:
 * 1. Interrogative FIRST:
 *    - Ends with '?' OR starts with why/how/does/do/did/is/are/will/can/could/would/should/was/were/has/have/had/am -> 'QUESTION'
 * 2. THEN explicit declarative denial:
 *    - does not / do not / did not / will not / cannot / can't / won't / is not / are not / shouldn't / wouldn't / couldn't / hasn't / haven't / isn't / aren't / don't / doesn't / didn't -> 'DENY'
 * 3. Else -> 'AFFIRM'
 */
export function resolveAssertionMode(question: string): CounterReasoningAssertionMode {
  const trimmed = question.trim();

  // Interrogative detection first (e.g. "Why is my career not stable?" -> QUESTION)
  if (
    trimmed.endsWith('?') ||
    /^(why|how|does|do|did|is|are|will|can|could|would|should|was|were|has|have|had|am)\b/i.test(trimmed)
  ) {
    return 'QUESTION';
  }

  // Explicit declarative denial detection
  if (
    /\b(does not|do not|did not|will not|cannot|can't|won't|is not|are not|should not|would not|could not|has not|have not|had not|was not|were not|isn't|aren't|don't|doesn't|didn't|shouldn't|wouldn't|couldn't|hasn't|haven't|hadn't|wasn't|weren't)\b/i.test(
      trimmed
    )
  ) {
    return 'DENY';
  }

  return 'AFFIRM';
}

/**
 * Resolves a CounterReasoningClaim from a question, domain, and optional parameters.
 * Follows strict deterministic precedence:
 * 1. Explicit params.targetSubjectKey
 * 2. Explicit params.questionType mapping to canonical target
 * 3. High-confidence, domain keywords
 * 4. Fallback FINAL_SYNTHESIS
 */
export function resolveClaim(params: ResolveClaimParams): CounterReasoningClaim {
  const { domain, question } = params;
  const questionType = params.questionType ?? classifyQuestion(question);
  const assertionMode = resolveAssertionMode(question);

  let targetSubjectKey = params.targetSubjectKey;

  if (!targetSubjectKey) {
    if (params.questionType) {
      if (params.questionType === 'DASHA_CHALLENGE') {
        targetSubjectKey = 'DASHA_ACTIVATION';
      } else if (params.questionType === 'TIMING_CHALLENGE') {
        targetSubjectKey = 'TIMING_TRIGGER';
      } else if (params.questionType === 'MANIFESTATION_CHALLENGE') {
        targetSubjectKey = domain === 'CAREER' ? 'CAREER_MANIFESTATION' : 'WEALTH_MANIFESTATION';
      } else if (params.questionType === 'DIVISIONAL_CHALLENGE') {
        if (domain === 'CAREER' && /\b(d10|dasamsa|dashamsha|d-10)\b/i.test(question)) {
          targetSubjectKey = 'D10_CONFIRMATION';
        } else if (domain === 'WEALTH' && /\b(d2|hora|d-2)\b/i.test(question)) {
          targetSubjectKey = 'D2_CONFIRMATION';
        } else {
          targetSubjectKey = 'UNKNOWN';
        }
      }
    }

    if (!targetSubjectKey) {
      const normalized = question.toLowerCase();

      const hasD10 = /\b(d10|dasamsa|dashamsha|d-10)\b/i.test(normalized);
      const hasD2 = /\b(d2|hora|d-2)\b/i.test(normalized);
      const hasOtherDivisional = /\b(d9|navamsa|navamsha|d-9|varga|divisional)\b/i.test(normalized);

      if (hasD10 || hasD2 || hasOtherDivisional || questionType === 'DIVISIONAL_CHALLENGE') {
        if (domain === 'CAREER' && hasD10) {
          targetSubjectKey = 'D10_CONFIRMATION';
        } else if (domain === 'WEALTH' && hasD2) {
          targetSubjectKey = 'D2_CONFIRMATION';
        } else {
          targetSubjectKey = 'UNKNOWN';
        }
      } else if (
        questionType === 'DASHA_CHALLENGE' ||
        /\b(dasha|mahadasha|antardasha|bhukti|vimshottari|pratyantardasha|dasha period)\b/i.test(normalized)
      ) {
        targetSubjectKey = 'DASHA_ACTIVATION';
      } else if (
        questionType === 'TIMING_CHALLENGE' ||
        /\b(transit|gochara|transits|timing trigger)\b/i.test(normalized)
      ) {
        targetSubjectKey = 'TIMING_TRIGGER';
      } else if (
        questionType === 'MANIFESTATION_CHALLENGE' ||
        /\b(career manifestation|wealth manifestation|concrete manifestation|career role|industry role|asset stream|wealth stream)\b/i.test(normalized)
      ) {
        targetSubjectKey = domain === 'CAREER' ? 'CAREER_MANIFESTATION' : 'WEALTH_MANIFESTATION';
      } else if (
        /\b(natal promise|birth chart promise|foundational promise|natal potential|natal capacity)\b/i.test(normalized) ||
        /\bnatal\b/i.test(normalized)
      ) {
        targetSubjectKey = 'NATAL_PROMISE';
      } else {
        targetSubjectKey = 'FINAL_SYNTHESIS';
      }
    }
  }

  let assertedOutcome: CounterReasoningOutcome = 'SUPPORT';
  if (/\b(delay|delays|delayed|delaying)\b/i.test(question)) {
    assertedOutcome = 'DELAY';
  } else if (/\b(loss|losses|lose|losing|drain|drains|draining|depletion)\b/i.test(question)) {
    assertedOutcome = 'LOSS';
  } else if (/\b(obstacle|obstacles|blockage|blockages|barrier|barriers)\b/i.test(question)) {
    assertedOutcome = 'OBSTACLE';
  } else if (/\b(volatility|volatile|instability|unstable|fluctuation|fluctuations)\b/i.test(question)) {
    assertedOutcome = 'VOLATILITY';
  } else if (/\b(promotion|promotions|promote|promoted)\b/i.test(question)) {
    assertedOutcome = 'PROMOTION';
  } else if (/\b(growth|grow|growing|expansion)\b/i.test(question)) {
    assertedOutcome = 'GROWTH';
  } else if (
    /\b(weak|weakness|challenged|challenge|challenges|problem|problems|trouble|troubles|conflict|conflicts|friction|fail|failure|struggle|struggles|difficult|difficulty|difficulties|lack)\b/i.test(question) ||
    questionType === 'WHY_NOT'
  ) {
    assertedOutcome = 'CHALLENGE';
  }

  let assertedPolarity: CounterReasoningPolarity = 'NEUTRAL';
  if (
    questionType === 'WHY_NOT' ||
    questionType === 'DASHA_CHALLENGE' ||
    questionType === 'DIVISIONAL_CHALLENGE' ||
    questionType === 'TIMING_CHALLENGE' ||
    questionType === 'MANIFESTATION_CHALLENGE' ||
    questionType === 'GENERAL_CHALLENGE'
  ) {
    assertedPolarity = 'CHALLENGE';
  } else if (questionType === 'WHY' || questionType === 'WHAT_IF' || questionType === 'UNKNOWN') {
    assertedPolarity = 'NEUTRAL';
  }

  return {
    domain,
    question,
    questionType,
    targetSubjectKey,
    polarity: assertedPolarity,
    assertedPolarity,
    assertedOutcome,
    assertionMode
  };
}
