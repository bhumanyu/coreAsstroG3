import type { DomainEvidence } from '../../interpretation';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';
import type {
  WealthTimingSynthesis,
  WealthTimingFactor
} from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import {
  CANONICAL_WEALTH_MANIFESTATION_DIMENSIONS,
  type WealthManifestationDimension,
  type WealthManifestationStatus,
  type WealthManifestationDirection,
  type WealthManifestationFactor,
  type WealthDimensionManifestationSynthesis,
  type WealthManifestationSynthesis
} from './wealthManifestationTypes';
import {
  getWealthDimensionRuleSet,
  WEALTH_DIMENSION_HOUSES,
  WEALTH_DIMENSION_KARAKAS
} from './wealthManifestationRules';

export function resolveWealthDimensionManifestation(
  dimension: WealthManifestationDimension,
  natalEvidence: readonly DomainEvidence[],
  wealthTimingSynthesis?: WealthTimingSynthesis,
  d2Relationship?: VargaRelationship | string
): WealthDimensionManifestationSynthesis {
  const factors: WealthManifestationFactor[] = [];
  const ruleSet = getWealthDimensionRuleSet(dimension);
  const house = WEALTH_DIMENSION_HOUSES[dimension];
  const karakas = WEALTH_DIMENSION_KARAKAS[dimension];

  // 1. NATAL FACTORS (Isolated per dimension)
  const matchingNatal = natalEvidence.filter((item) => {
    if (item.phase && item.phase !== 'NATAL_PROMISE' && item.phase !== 'MODIFIER') {
      return false;
    }
    if (item.source === 'DASHA' || item.source === 'TRANSIT' || item.source === 'D2') {
      return false;
    }
    if (item.dimension === dimension) return true;
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
    const direction: WealthManifestationDirection = isSupport ? 'SUPPORT' : isChallenge ? 'CHALLENGE' : 'NEUTRAL';
    const weight = item.strength === 'STRONG' ? 1.5 : item.strength === 'MODERATE' ? 1.0 : 0.5;

    if (isSupport) natalSupportCount += weight;
    if (isChallenge) natalChallengeCount += weight;

    factors.push({
      id: `NATAL_${dimension}_${item.id}`,
      dimension,
      direction,
      weight,
      source: 'NATAL',
      statement: item.statement,
      evidenceIds: [item.id]
    });
  }

  let natalSupport: WealthManifestationDirection = 'NEUTRAL';
  if (natalChallengeCount > 0 && natalSupportCount === 0) {
    natalSupport = 'CHALLENGE';
  } else if (natalSupportCount > 0 && natalChallengeCount === 0) {
    natalSupport = 'SUPPORT';
  } else if (natalSupportCount > 0 && natalChallengeCount > 0) {
    natalSupport = natalChallengeCount >= natalSupportCount ? 'CHALLENGE' : 'SUPPORT';
  }

  // 2. D2 VARGA FACTORS
  let d2Support: WealthManifestationDirection = 'NEUTRAL';
  if (d2Relationship === 'CONFIRMED' || d2Relationship === 'SUPPORTIVE' || d2Relationship === 'FAVORABLE') {
    d2Support = 'SUPPORT';
    factors.push({
      id: `D2_${dimension}_CONFIRMED`,
      dimension,
      direction: 'SUPPORT',
      weight: 1.0,
      source: 'D2',
      statement: `D2 Hora confirms wealth capacity for ${dimension.toLowerCase()}.`
    });
  } else if (d2Relationship === 'CONTRADICTED' || d2Relationship === 'CHALLENGED' || d2Relationship === 'UNFAVORABLE') {
    d2Support = 'CHALLENGE';
    factors.push({
      id: `D2_${dimension}_CONTRADICTED`,
      dimension,
      direction: 'CHALLENGE',
      weight: 1.0,
      source: 'D2',
      statement: `D2 Hora contradicts or restricts wealth capacity for ${dimension.toLowerCase()}.`
    });
  }

  // 3. DASHA FACTORS & 4. TRANSIT FACTORS (CW-03 Synthesis isolated per dimension)
  let dashaSupport: WealthManifestationDirection = 'NEUTRAL';
  let transitSupport: WealthManifestationDirection = 'NEUTRAL';

  if (wealthTimingSynthesis && wealthTimingSynthesis.dimensions) {
    const dimTiming = wealthTimingSynthesis.dimensions[dimension];
    if (dimTiming) {
      if (dimTiming.dashaEffect === 'SUPPORTS') {
        dashaSupport = 'SUPPORT';
      } else if (dimTiming.dashaEffect === 'CHALLENGES') {
        dashaSupport = 'CHALLENGE';
      }

      if (dimTiming.transitEffect === 'SUPPORTS') {
        transitSupport = 'SUPPORT';
      } else if (dimTiming.transitEffect === 'CHALLENGES') {
        transitSupport = 'CHALLENGE';
      }

      for (const tf of dimTiming.factors) {
        const isDasha = tf.category === 'DASHA_LORD_TRANSIT' || Boolean(tf.dashaEvidenceIds?.length);
        const source = isDasha ? 'DASHA' : 'TRANSIT';

        factors.push({
          id: `${source}_${dimension}_${tf.id}`,
          dimension,
          direction: tf.direction,
          weight: tf.weight,
          source,
          statement: tf.statement,
          evidenceIds: tf.natalEvidenceIds,
          dashaEvidenceIds: tf.dashaEvidenceIds,
          transitEvidenceIds: [tf.id]
        });
      }
    }
  }

  // 5. HIERARCHICAL RESOLUTION (Strict hierarchy spec §8, §14, §15, §16, §17-19)
  let status: WealthManifestationStatus;
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH';

  if (natalSupport === 'CHALLENGE') {
    status = 'CHALLENGED';
    confidence = 'HIGH';
  } else if (natalSupport === 'NEUTRAL') {
    // Missing natal foundational evidence => INSUFFICIENT_DATA (no MODERATE fallback)
    status = 'INSUFFICIENT_DATA';
    confidence = 'LOW';
  } else {
    // Natal is SUPPORT
    const hasSecondaryChallenge =
      dashaSupport === 'CHALLENGE' ||
      transitSupport === 'CHALLENGE' ||
      d2Support === 'CHALLENGE';

    const hasStructuralSecondarySupport =
      dashaSupport === 'SUPPORT' ||
      d2Support === 'SUPPORT';

    const hasTransitSupport = transitSupport === 'SUPPORT';

    if (hasSecondaryChallenge) {
      status = 'MIXED';
      confidence = 'MEDIUM';
    } else if (hasStructuralSecondarySupport) {
      status = 'STRONGLY_SUPPORTED';
      confidence = 'HIGH';
    } else if (hasTransitSupport) {
      status = 'SUPPORTED';
      confidence = 'MEDIUM';
    } else {
      status = 'SUPPORTED';
      confidence = 'LOW';
    }
  }

  const dimLabel = dimension.toLowerCase();
  let summary = '';
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      summary = `Natal promise for ${dimLabel} is confirmed by favorable timing and varga indications.`;
      break;
    case 'SUPPORTED':
      summary = `Natal foundation supports ${dimLabel} prosperity pathways.`;
      break;
    case 'MIXED':
      summary = `Natal capacity for ${dimLabel} is tempered by frictional timing or secondary factors.`;
      break;
    case 'CHALLENGED':
      summary = `Natal structural configurations present challenges to ${dimLabel}.`;
      break;
    case 'INSUFFICIENT_DATA':
    default:
      summary = `Insufficient natal foundational evidence to confirm ${dimLabel} manifestation.`;
      break;
  }

  return Object.freeze({
    reasoningVersion: 'CW-04',
    dimension,
    status,
    confidence,
    natalSupport,
    dashaSupport,
    transitSupport,
    d2Support,
    factors: Object.freeze(factors),
    summary
  });
}

export function synthesizeWealthManifestations(
  natalEvidence: readonly DomainEvidence[],
  wealthTimingSynthesis?: WealthTimingSynthesis,
  d2Relationship?: VargaRelationship | string
): WealthManifestationSynthesis {
  const dimMap: Record<string, WealthDimensionManifestationSynthesis> = {};

  for (const dim of CANONICAL_WEALTH_MANIFESTATION_DIMENSIONS) {
    dimMap[dim] = resolveWealthDimensionManifestation(
      dim,
      natalEvidence,
      wealthTimingSynthesis,
      d2Relationship
    );
  }

  const dimensions = Object.freeze(dimMap) as Readonly<
    Record<WealthManifestationDimension, WealthDimensionManifestationSynthesis>
  >;

  const supportedDims = CANONICAL_WEALTH_MANIFESTATION_DIMENSIONS.filter(
    (d) => dimensions[d].status === 'STRONGLY_SUPPORTED' || dimensions[d].status === 'SUPPORTED'
  );

  const summary =
    supportedDims.length > 0
      ? `Wealth manifestation is strongest in ${supportedDims.map((d) => d.toLowerCase()).join(', ')}.`
      : 'Wealth manifestation shows limited or challenged pathways across classical dimensions.';

  return Object.freeze({
    reasoningVersion: 'CW-04',
    dimensions,
    summary
  });
}
