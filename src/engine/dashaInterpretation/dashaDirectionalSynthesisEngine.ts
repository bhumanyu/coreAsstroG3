import { DashaReasoningEvidence, DashaEvidenceEffect } from './dashaReasoningTypes';
import { DASHA_REASONING_WEIGHTS } from './dashaReasoningWeights';
import { DashaDirectionalSynthesis } from './dashaDirectionalSynthesis';

function buildSummary(
  effect: DashaEvidenceEffect,
  confidence: number,
  supportingCount: number,
  challengingCount: number
): string {
  const confPercent = Math.round(confidence * 100);
  switch (effect) {
    case 'SUPPORT':
      return `Planetary directional synthesis indicates supportive astrological influences (${supportingCount} supporting factor${supportingCount === 1 ? '' : 's'}, confidence: ${confPercent}%).`;
    case 'CHALLENGE':
      return `Planetary directional synthesis indicates challenging astrological influences (${challengingCount} challenging factor${challengingCount === 1 ? '' : 's'}, confidence: ${confPercent}%).`;
    case 'MIXED':
      return `Planetary directional synthesis indicates mixed supportive and challenging influences (${supportingCount} supporting, ${challengingCount} challenging, confidence: ${confPercent}%).`;
    case 'NEUTRAL':
    default:
      return 'Planetary directional synthesis is neutral with no directional bias.';
  }
}

/**
 * Synthesizes dasha directional indicators from structured reasoning evidence
 * using weighted scoring (weight × confidence) rather than raw counts or text heuristics.
 */
export function synthesizeDashaDirection(
  evidence: readonly DashaReasoningEvidence[]
): DashaDirectionalSynthesis {
  const supportingEvidenceIds: string[] = [];
  const challengingEvidenceIds: string[] = [];
  const neutralEvidenceIds: string[] = [];

  let supportScore = 0;
  let challengeScore = 0;

  for (const item of evidence) {
    const weight = DASHA_REASONING_WEIGHTS[item.basis] ?? 1.0;
    const clampedConfidence = Math.max(0, Math.min(1, item.confidence));
    const score = weight * clampedConfidence;

    if (item.effect === 'SUPPORT') {
      supportingEvidenceIds.push(item.id);
      supportScore += score;
    } else if (item.effect === 'CHALLENGE') {
      challengingEvidenceIds.push(item.id);
      challengeScore += score;
    } else if (item.effect === 'NEUTRAL') {
      neutralEvidenceIds.push(item.id);
    } else if (item.effect === 'MIXED') {
      neutralEvidenceIds.push(item.id);
    }
  }

  const totalScore = supportScore + challengeScore;
  let effect: DashaEvidenceEffect = 'NEUTRAL';
  let confidence = 0;

  if (totalScore > 0) {
    confidence = Math.min(1, Math.abs(supportScore - challengeScore) / totalScore);

    if (challengeScore === 0 && supportScore > 0) {
      effect = 'SUPPORT';
    } else if (supportScore === 0 && challengeScore > 0) {
      effect = 'CHALLENGE';
    } else if (supportScore === challengeScore) {
      effect = 'MIXED';
    } else if (supportScore > challengeScore) {
      // If support clearly dominates (>60% of directional weight)
      effect = supportScore / totalScore >= 0.6 ? 'SUPPORT' : 'MIXED';
    } else {
      // If challenge clearly dominates (>60% of directional weight)
      effect = challengeScore / totalScore >= 0.6 ? 'CHALLENGE' : 'MIXED';
    }
  } else {
    effect = 'NEUTRAL';
    confidence = 0;
  }

  const summary = buildSummary(
    effect,
    confidence,
    supportingEvidenceIds.length,
    challengingEvidenceIds.length
  );

  return Object.freeze({
    effect,
    confidence,
    supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
    challengingEvidenceIds: Object.freeze(challengingEvidenceIds),
    neutralEvidenceIds: Object.freeze(neutralEvidenceIds),
    reasoningEvidence: Object.freeze([...evidence]),
    summary
  });
}
