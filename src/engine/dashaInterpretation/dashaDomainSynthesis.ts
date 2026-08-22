import { DashaEvidenceEffect, DashaReasoningEvidence } from './dashaReasoningTypes';
import { DASHA_REASONING_WEIGHTS } from './dashaReasoningWeights';

export type DashaLifeDomain = 'CAREER' | 'WEALTH' | 'MARRIAGE';

/**
 * Domain house associations for dasha timing synthesis.
 * Defined strictly at the domain layer (not inside the generic planetary reasoner).
 */
export const DASHA_DOMAIN_HOUSES: Readonly<Record<DashaLifeDomain, readonly number[]>> = Object.freeze({
  CAREER: Object.freeze([10, 6, 2, 1, 7]),
  WEALTH: Object.freeze([2, 11, 5, 9, 1]),
  MARRIAGE: Object.freeze([7, 2, 11, 4, 8, 12])
});

export interface DashaDomainSynthesis {
  readonly domain: DashaLifeDomain | string;
  readonly effect: DashaEvidenceEffect;
  readonly confidence: number;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly neutralEvidenceIds: readonly string[];
  readonly activatedHouses: readonly number[];
  readonly summary: string;
}

function buildDomainSummary(
  domain: string,
  effect: DashaEvidenceEffect,
  confidence: number,
  activatedHouses: readonly number[]
): string {
  const confPercent = Math.round(confidence * 100);
  const housesStr = activatedHouses.length > 0 ? ` (houses ${activatedHouses.join(', ')})` : '';
  const domainCapitalized = domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();

  switch (effect) {
    case 'SUPPORT':
      return `${domainCapitalized} domain${housesStr} indicates supportive dasha influences (confidence: ${confPercent}%).`;
    case 'CHALLENGE':
      return `${domainCapitalized} domain${housesStr} indicates challenging dasha influences (confidence: ${confPercent}%).`;
    case 'MIXED':
      return `${domainCapitalized} domain${housesStr} indicates mixed supportive and challenging influences (confidence: ${confPercent}%).`;
    case 'NEUTRAL':
    default:
      if (activatedHouses.length > 0) {
        return `${domainCapitalized} domain${housesStr} is activated with neutral directional bias.`;
      }
      return `No direct house activation for ${domain.toLowerCase()} in this dasha period.`;
  }
}

/**
 * Synthesizes per-domain directions (Career, Wealth, Marriage) from reasoning evidence
 * by mapping planetary activations to domain-specific house portfolios.
 */
export function synthesizeDashaDomains(
  evidence: readonly DashaReasoningEvidence[],
  planetActivatedHouses: readonly number[]
): readonly DashaDomainSynthesis[] {
  const domains: readonly DashaLifeDomain[] = ['CAREER', 'WEALTH', 'MARRIAGE'];
  const results: DashaDomainSynthesis[] = [];

  for (const domain of domains) {
    const domainHouses = DASHA_DOMAIN_HOUSES[domain];

    // Relevant houses activated for this domain
    const relevantHouses = Array.from(
      new Set(planetActivatedHouses.filter((h) => domainHouses.includes(h)))
    ).sort((a, b) => a - b);

    // If no houses of this domain are activated by the planet, this domain has no activation -> NEUTRAL with 0 confidence
    if (relevantHouses.length === 0) {
      results.push(
        Object.freeze({
          domain,
          effect: 'NEUTRAL',
          confidence: 0,
          supportingEvidenceIds: Object.freeze([]),
          challengingEvidenceIds: Object.freeze([]),
          neutralEvidenceIds: Object.freeze([]),
          activatedHouses: Object.freeze([]),
          summary: buildDomainSummary(domain, 'NEUTRAL', 0, [])
        })
      );
      continue;
    }

    // Filter reasoning evidence relevant to this domain:
    // 1) Facts/implications activating domain houses
    // 2) General planetary condition outcomes (which govern the activated houses)
    const domainEvidence = evidence.filter((item) => {
      if (item.activatedHouses.some((h) => domainHouses.includes(h))) {
        return true;
      }
      if (item.level === 'OUTCOME' && item.basis === 'COMBINATION') {
        return true;
      }
      return false;
    });

    const supportingEvidenceIds: string[] = [];
    const challengingEvidenceIds: string[] = [];
    const neutralEvidenceIds: string[] = [];

    let supportScore = 0;
    let challengeScore = 0;

    for (const item of domainEvidence) {
      const weight = DASHA_REASONING_WEIGHTS[item.basis] ?? 1.0;
      const clampedConfidence = Math.max(0, Math.min(1, item.confidence));
      const score = weight * clampedConfidence;

      if (item.effect === 'SUPPORT') {
        supportingEvidenceIds.push(item.id);
        supportScore += score;
      } else if (item.effect === 'CHALLENGE') {
        challengingEvidenceIds.push(item.id);
        challengeScore += score;
      } else {
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
        effect = supportScore / totalScore >= 0.6 ? 'SUPPORT' : 'MIXED';
      } else {
        effect = challengeScore / totalScore >= 0.6 ? 'CHALLENGE' : 'MIXED';
      }
    } else {
      effect = 'NEUTRAL';
      confidence = 0;
    }

    const summary = buildDomainSummary(domain, effect, confidence, relevantHouses);

    results.push(
      Object.freeze({
        domain,
        effect,
        confidence,
        supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
        challengingEvidenceIds: Object.freeze(challengingEvidenceIds),
        neutralEvidenceIds: Object.freeze(neutralEvidenceIds),
        activatedHouses: Object.freeze(relevantHouses),
        summary
      })
    );
  }

  return Object.freeze(results);
}
