import type { DomainEvidence } from '../../interpretation';
import type { Horoscope } from '../../../types';
import type { CareerDashaSynthesis, CareerDashaFactor } from '../careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingSynthesis, CareerTransitFactor } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import type { D10ManifestationFactor } from '../d10/d10CareerManifestationTypes';
import { getD10ManifestationFactors } from '../d10/d10CareerManifestation';
import { D10_MANIFESTATION_MODE_RULES } from '../d10/d10CareerManifestationRules';
import {
  CANONICAL_CAREER_MANIFESTATION_MODES,
  type CareerManifestationMode,
  type CareerManifestationFactor,
  type CareerManifestationSynthesis,
  type ManifestationDirection,
  type ManifestationStatus
} from './careerManifestationSynthesisTypes';
import { getModeRuleSet } from './careerManifestationRules';

export function resolveManifestation(
  mode: CareerManifestationMode,
  natalEvidence: readonly DomainEvidence[],
  dasha?: CareerDashaSynthesis,
  transit?: CareerTimingSynthesis,
  d10?: readonly D10ManifestationFactor[] | Horoscope
): CareerManifestationSynthesis {
  const factors: CareerManifestationFactor[] = [];
  const ruleSet = getModeRuleSet(mode);
  const modeConfig = D10_MANIFESTATION_MODE_RULES[mode];

  // 1. NATAL FACTORS
  const matchingNatal = natalEvidence.filter((item) => {
    if (item.phase && item.phase !== 'NATAL_PROMISE' && item.phase !== 'MODIFIER') {
      // If it has a non-natal phase like DASHA_ACTIVATION or TRANSIT_TRIGGER, skip for natal
      return false;
    }
    if (item.source === 'DASHA' || item.source === 'TRANSIT' || item.source === 'D10') {
      return false;
    }
    if ((item as any).mode === mode || (item as any).manifestationMode === mode) {
      return true;
    }
    if (item.ruleId) {
      const baseRule = item.ruleId.split(':')[0];
      if (ruleSet.has(item.ruleId) || ruleSet.has(baseRule)) return true;
    }
    return false;
  });

  let natalSupportCount = 0;
  let natalChallengeCount = 0;

  for (const item of matchingNatal) {
    const isSupport = item.polarity === 'SUPPORTING';
    const isChallenge = item.polarity === 'CHALLENGING';
    const direction: ManifestationDirection = isSupport ? 'SUPPORT' : isChallenge ? 'CHALLENGE' : 'NEUTRAL';
    const weight = item.strength === 'STRONG' ? 1.5 : item.strength === 'MODERATE' ? 1.0 : 0.5;

    if (isSupport) natalSupportCount += weight;
    if (isChallenge) natalChallengeCount += weight;

    factors.push({
      id: `NATAL_${mode}_${item.id}`,
      mode,
      direction,
      weight,
      source: 'NATAL',
      statement: item.statement,
      evidenceIds: [item.id]
    });
  }

  let natalSupport: ManifestationDirection = 'NEUTRAL';
  if (natalChallengeCount > 0 && natalSupportCount === 0) {
    natalSupport = 'CHALLENGE';
  } else if (natalSupportCount > 0 && natalChallengeCount === 0) {
    natalSupport = 'SUPPORT';
  } else if (natalSupportCount > 0 && natalChallengeCount > 0) {
    natalSupport = natalChallengeCount >= natalSupportCount ? 'CHALLENGE' : 'SUPPORT';
  }

  // 2. D10 FACTORS
  let d10Factors: readonly D10ManifestationFactor[] = [];
  if (Array.isArray(d10)) {
    d10Factors = d10.filter((f) => f.mode === mode);
  } else if (d10 && typeof d10 === 'object' && 'divisionalInterpretation' in d10) {
    d10Factors = getD10ManifestationFactors(mode, d10 as Horoscope);
  }

  let d10SupportWeight = 0;
  let d10ChallengeWeight = 0;

  for (const f of d10Factors) {
    if (f.direction === 'SUPPORT') d10SupportWeight += f.weight;
    if (f.direction === 'CHALLENGE') d10ChallengeWeight += f.weight;

    factors.push({
      id: f.id,
      mode: f.mode,
      direction: f.direction,
      weight: f.weight,
      source: 'D10',
      statement: f.statement,
      evidenceIds: f.evidenceIds
    });
  }

  let d10Support: ManifestationDirection = 'NEUTRAL';
  if (d10SupportWeight > d10ChallengeWeight) {
    d10Support = 'SUPPORT';
  } else if (d10ChallengeWeight > d10SupportWeight) {
    d10Support = 'CHALLENGE';
  }

  // 3. DASHA FACTORS
  let dashaSupportWeight = 0;
  let dashaChallengeWeight = 0;

  if (dasha && dasha.factors) {
    const primaryPlanets = modeConfig?.primaryPlanets ?? [];
    const supportingHouses = modeConfig?.supportingHouses ?? [];
    const challengingHouses = modeConfig?.challengingHouses ?? [];

    for (const df of dasha.factors) {
      const isPlanetRelevant = primaryPlanets.includes(df.planet);
      const isHouseRelevant = df.houses?.some((h) => supportingHouses.includes(h) || challengingHouses.includes(h));

      if (isPlanetRelevant || isHouseRelevant) {
        if (df.direction === 'SUPPORT') dashaSupportWeight += df.weight;
        if (df.direction === 'CHALLENGE') dashaChallengeWeight += df.weight;

        factors.push({
          id: `DASHA_${mode}_${df.id}`,
          mode,
          direction: df.direction,
          weight: df.weight,
          source: 'DASHA',
          statement: df.statement,
          evidenceIds: df.evidenceIds,
          dashaEvidenceIds: [df.id]
        });
      }
    }
  }

  let dashaSupport: ManifestationDirection = 'NEUTRAL';
  if (dashaSupportWeight > dashaChallengeWeight) {
    dashaSupport = 'SUPPORT';
  } else if (dashaChallengeWeight > dashaSupportWeight) {
    dashaSupport = 'CHALLENGE';
  }

  // 4. TRANSIT FACTORS
  let transitSupportWeight = 0;
  let transitChallengeWeight = 0;

  if (transit && transit.factors) {
    const primaryPlanets = modeConfig?.primaryPlanets ?? [];
    const supportingHouses = modeConfig?.supportingHouses ?? [];
    const challengingHouses = modeConfig?.challengingHouses ?? [];

    for (const tf of transit.factors) {
      const isPlanetRelevant =
        primaryPlanets.includes(tf.planet) ||
        (tf.transitingPlanet && primaryPlanets.includes(tf.transitingPlanet)) ||
        (tf.targetPlanet && primaryPlanets.includes(tf.targetPlanet));
      const isHouseRelevant = tf.houses?.some((h) => supportingHouses.includes(h) || challengingHouses.includes(h));

      if (isPlanetRelevant || isHouseRelevant) {
        if (tf.direction === 'SUPPORT') transitSupportWeight += tf.weight;
        if (tf.direction === 'CHALLENGE') transitChallengeWeight += tf.weight;

        factors.push({
          id: `TRANSIT_${mode}_${tf.id}`,
          mode,
          direction: tf.direction,
          weight: tf.weight,
          source: 'TRANSIT',
          statement: tf.statement,
          evidenceIds: tf.natalEvidenceIds,
          transitEvidenceIds: [tf.id]
        });
      }
    }
  }

  let transitSupport: ManifestationDirection = 'NEUTRAL';
  if (transitSupportWeight > transitChallengeWeight) {
    transitSupport = 'SUPPORT';
  } else if (transitChallengeWeight > transitSupportWeight) {
    transitSupport = 'CHALLENGE';
  }

  // 5. HIERARCHICAL RESOLUTION (Strict hierarchy spec §8, §14, §15, §16)
  let status: ManifestationStatus;
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH';

  if (natalSupport === 'CHALLENGE') {
    // Natal ceiling: challenging natal promise cannot be overturned by secondary support
    status = 'CHALLENGED';
    confidence = 'HIGH';
  } else if (natalSupport === 'NEUTRAL') {
    // Guardrail: secondary evidence cannot manufacture a manifestation without natal support
    status = 'INSUFFICIENT_DATA';
    confidence = 'LOW';
  } else {
    // Natal is SUPPORT
    const hasSecondaryChallenge =
      dashaSupport === 'CHALLENGE' ||
      d10Support === 'CHALLENGE' ||
      transitSupport === 'CHALLENGE';

    const hasStructuralSecondarySupport =
      dashaSupport === 'SUPPORT' ||
      d10Support === 'SUPPORT';

    const hasTransitSupport = transitSupport === 'SUPPORT';

    if (hasSecondaryChallenge) {
      status = 'MIXED';
      confidence = 'MEDIUM';
    } else if (hasStructuralSecondarySupport) {
      status = 'STRONGLY_SUPPORTED';
      confidence = 'HIGH';
    } else if (hasTransitSupport) {
      // Transit trigger alone without structural secondary support
      status = 'SUPPORTED';
      confidence = 'MEDIUM';
    } else {
      // All secondary neutral
      status = 'SUPPORTED';
      confidence = 'LOW';
    }
  }

  const modeLabel = mode.toLowerCase().replace(/_/g, ' ');
  let summary = '';
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      summary = `Natal promise for ${modeLabel} is confirmed by favorable divisional/timing activations.`;
      break;
    case 'SUPPORTED':
      summary = `Natal promise supports ${modeLabel} professional pathways.`;
      break;
    case 'MIXED':
      summary = `Natal potential for ${modeLabel} faces friction or contradictory indications in timing/varga factors.`;
      break;
    case 'CHALLENGED':
      summary = `Natal structural factors challenge or restrict ${modeLabel} manifestation.`;
      break;
    case 'INSUFFICIENT_DATA':
    default:
      summary = `Insufficient natal foundational evidence to support ${modeLabel} manifestation.`;
      break;
  }

  return Object.freeze({
    reasoningVersion: 'CW-04',
    mode,
    status,
    confidence,
    natalSupport,
    dashaSupport,
    transitSupport,
    d10Support,
    factors: Object.freeze(factors),
    summary
  });
}

export function synthesizeCareerManifestations(
  natalEvidence: readonly DomainEvidence[],
  dasha?: CareerDashaSynthesis,
  transit?: CareerTimingSynthesis,
  d10?: readonly D10ManifestationFactor[] | Horoscope
): readonly CareerManifestationSynthesis[] {
  return Object.freeze(
    CANONICAL_CAREER_MANIFESTATION_MODES.map((mode) =>
      resolveManifestation(mode, natalEvidence, dasha, transit, d10)
    )
  );
}
