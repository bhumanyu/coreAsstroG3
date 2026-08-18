import type { AiEvidence } from '../../../types/aiContextTypes';

/**
 * Priority weighting lookup for evidence ranking in the local reasoning layer.
 * NOTE: This is for reasoning prioritization only — it is NOT an astrological calculation.
 */
const STRENGTH_WEIGHT: Record<string, number> = {
  STRONG: 3,
  MODERATE: 2,
  WEAK: 1,
  UNKNOWN: 0
};

const PRIORITY_WEIGHT: Record<string, number> = {
  PRIMARY: 4,
  SECONDARY: 2,
  CONFIRMATORY: 2,
  TIMING: 1
};

/**
 * Computes a deterministic heuristic priority score for an evidence item to order reasoning findings.
 * This is an internal AI prioritization mechanism and does NOT modify or perform astrological calculations.
 */
export function scoreEvidence(evidence: AiEvidence): number {
  let score = 0;

  if (evidence.strength) {
    score += STRENGTH_WEIGHT[evidence.strength] ?? 0;
  }

  if (evidence.priority) {
    score += PRIORITY_WEIGHT[evidence.priority] ?? 0;
  }

  if (evidence.dimension === 'NATAL_STRUCTURE') {
    score += 2;
  } else if (evidence.dimension === 'CONFIRMATION') {
    score += 1;
  }

  return score;
}

/**
 * Sorts evidence deterministically by priority score (descending), using evidence ID as tie-breaker.
 */
export function rankEvidence(evidenceList: readonly AiEvidence[]): readonly AiEvidence[] {
  return [...evidenceList].sort((a, b) => {
    const scoreA = scoreEvidence(a);
    const scoreB = scoreEvidence(b);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return a.id.localeCompare(b.id);
  });
}
