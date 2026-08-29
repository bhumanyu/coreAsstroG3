import type { CounterReasoningQuestionType } from './counterReasoningTypes';

/**
 * Classifies a user counter-reasoning or challenge question into a CounterReasoningQuestionType.
 */
export function classifyQuestion(question: string): CounterReasoningQuestionType {
  const normalized = question.trim().toLowerCase();

  // 1. What-if / Counterfactual queries (must be detectable for engine short-circuit)
  if (
    /^(what\s+if|suppose|assuming|if\s+my|if\s+the|if\s+i\s+had|what\s+would\s+happen\s+if)\b/.test(normalized) ||
    normalized.includes('what if') ||
    normalized.includes('what-if')
  ) {
    return 'WHAT_IF';
  }

  // 2. Divisional / Varga chart challenges (D10, D2, Navamsha, etc. - check before generic dasha to avoid dashamsha false-positives)
  if (
    /\b(d10|dasamsa|dashamsha|d-10|d2|hora|d-2|d9|navamsa|navamsha|d-9|varga|divisional)\b/.test(normalized) ||
    normalized.includes('d10') ||
    normalized.includes('dasamsa') ||
    normalized.includes('dashamsha') ||
    normalized.includes('d2') ||
    normalized.includes('hora') ||
    normalized.includes('divisional')
  ) {
    return 'DIVISIONAL_CHALLENGE';
  }

  // 3. Dasha / planetary period challenges
  if (
    /\b(dasha|mahadasha|antardasha|bhukti|vimshottari|pratyantardasha)\b/.test(normalized) ||
    normalized.includes('dasha') ||
    normalized.includes('mahadasha') ||
    normalized.includes('antardasha') ||
    normalized.includes('bhukti') ||
    normalized.includes('vimshottari')
  ) {
    return 'DASHA_CHALLENGE';
  }

  // 4. Timing / Transit challenges
  if (
    normalized.includes('transit') ||
    normalized.includes('gochara') ||
    normalized.includes('timing') ||
    normalized.includes('when will')
  ) {
    return 'TIMING_CHALLENGE';
  }

  // 5. Why Not / Negative inquiries
  const hasWhy =
    normalized.startsWith('why') ||
    normalized.includes('why ') ||
    normalized.includes('how come') ||
    normalized.includes('explain why');

  const hasNegative =
    normalized.includes('not') ||
    normalized.includes("n't") ||
    normalized.includes('challenged') ||
    normalized.includes('weak') ||
    normalized.includes('low') ||
    normalized.includes('delay') ||
    normalized.includes('fail') ||
    normalized.includes('obstacle') ||
    normalized.includes('problem') ||
    normalized.includes('lack') ||
    normalized.includes('conflict') ||
    normalized.includes('difficult');

  if (hasWhy && hasNegative) {
    return 'WHY_NOT';
  }

  if (
    normalized.includes('why not') ||
    normalized.includes("why isn't") ||
    normalized.includes('why is not') ||
    normalized.includes("why aren't") ||
    normalized.includes('why am i not') ||
    normalized.includes("why didn't") ||
    normalized.includes('why no')
  ) {
    return 'WHY_NOT';
  }

  // 6. Positive Why inquiries
  if (hasWhy) {
    return 'WHY';
  }

  // 7. General Challenge fallback
  return 'GENERAL_CHALLENGE';
}
