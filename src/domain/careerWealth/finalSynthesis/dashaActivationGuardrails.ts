import type {
  CareerDashaSynthesis,
  CareerDashaEffect,
  CareerDashaPeriodSynthesis
} from '../../career/careerDasha/careerDashaSynthesisTypes';
import { resolveCombinedCareerDashaEffect } from '../../career/careerDasha/careerDashaScoring';
import type {
  SynthesisAxisStatus,
  FinalDomainConfidence,
  FinalSynthesisActivationHierarchy
} from './careerWealthFinalSynthesisTypes';

export interface DashaActivationGuardrailResult {
  readonly effect: CareerDashaEffect;
  readonly status: SynthesisAxisStatus;
  readonly confidence?: FinalDomainConfidence;
  readonly strength?: number;
  readonly summary?: string;
  readonly hierarchy?: FinalSynthesisActivationHierarchy;
  readonly hierarchyConsistent: boolean;
}

function mapCareerDashaEffectToAxisStatus(effect: CareerDashaEffect): SynthesisAxisStatus {
  switch (effect) {
    case 'STRONGLY_SUPPORTS':
    case 'SUPPORTS':
      return 'SUPPORT';
    case 'STRONGLY_CHALLENGES':
    case 'CHALLENGES':
      return 'CHALLENGE';
    case 'MIXED':
      return 'MIXED';
    case 'DOES_NOT_ACTIVATE':
      return 'NEUTRAL';
    case 'INSUFFICIENT_DATA':
    default:
      return 'INSUFFICIENT_DATA';
  }
}

function mapConfidence(confidence: string | undefined): FinalDomainConfidence | undefined {
  if (!confidence) return undefined;
  const norm = confidence.toUpperCase();
  if (norm === 'HIGH' || norm === 'MEDIUM' || norm === 'LOW') {
    return norm as FinalDomainConfidence;
  }
  return undefined;
}

function formatPlanetName(planet?: string): string {
  if (!planet) return '';
  return planet.charAt(0).toUpperCase() + planet.slice(1).toLowerCase();
}

function buildHierarchySummary(
  combined: CareerDashaPeriodSynthesis,
  hierarchyConsistent: boolean
): string {
  const mdPlanetStr = combined.md?.planet ? ` ${formatPlanetName(combined.md.planet)}` : '';
  const adPlanetStr = combined.ad?.planet ? ` ${formatPlanetName(combined.ad.planet)}` : '';
  const pdPlanetStr = combined.pd?.planet ? ` ${formatPlanetName(combined.pd.planet)}` : '';

  const mdEff = combined.md?.effect;
  const adEff = combined.ad?.effect;
  const pdEff = combined.pd?.effect;

  const parts: string[] = [];

  // MD Primary
  if (mdEff === 'STRONGLY_SUPPORTS' || mdEff === 'SUPPORTS') {
    parts.push(`MD${mdPlanetStr} provides primary SUPPORT`);
  } else if (mdEff === 'STRONGLY_CHALLENGES' || mdEff === 'CHALLENGES') {
    parts.push(`MD${mdPlanetStr} provides primary CHALLENGE`);
  } else if (mdEff === 'MIXED') {
    parts.push(`MD${mdPlanetStr} provides primary MIXED activation`);
  } else {
    parts.push(`MD${mdPlanetStr} is ${mdEff ?? 'INSUFFICIENT_DATA'}`);
  }

  // AD Modifier
  const mdIsSupport = mdEff === 'STRONGLY_SUPPORTS' || mdEff === 'SUPPORTS';
  const mdIsChallenge = mdEff === 'STRONGLY_CHALLENGES' || mdEff === 'CHALLENGES';
  const adIsSupport = adEff === 'STRONGLY_SUPPORTS' || adEff === 'SUPPORTS';
  const adIsChallenge = adEff === 'STRONGLY_CHALLENGES' || adEff === 'CHALLENGES';

  if (adIsSupport && mdIsSupport) {
    parts.push(`AD${adPlanetStr} reinforces support`);
  } else if (adIsChallenge && mdIsChallenge) {
    parts.push(`AD${adPlanetStr} reinforces challenge`);
  } else if (adIsChallenge && mdIsSupport) {
    parts.push(`AD${adPlanetStr} introduces modifying CHALLENGE`);
  } else if (adIsSupport && mdIsChallenge) {
    parts.push(`AD${adPlanetStr} provides modifying SUPPORT`);
  } else if (adEff === 'MIXED') {
    parts.push(`AD${adPlanetStr} provides modifying MIXED influence`);
  } else {
    parts.push(`AD${adPlanetStr} is ${adEff ?? 'INSUFFICIENT_DATA'}`);
  }

  // PD Refinement
  const pdIsSupport = pdEff === 'STRONGLY_SUPPORTS' || pdEff === 'SUPPORTS';
  const pdIsChallenge = pdEff === 'STRONGLY_CHALLENGES' || pdEff === 'CHALLENGES';

  if (pdIsChallenge) {
    parts.push(`PD${pdPlanetStr} introduces short-term CHALLENGE qualification`);
  } else if (pdIsSupport) {
    parts.push(`PD${pdPlanetStr} provides short-term SUPPORT trigger`);
  } else if (pdEff === 'MIXED') {
    parts.push(`PD${pdPlanetStr} introduces short-term MIXED refinement`);
  } else {
    parts.push(`PD${pdPlanetStr} is ${pdEff ?? 'INSUFFICIENT_DATA'}`);
  }

  let summary = parts.join('; ') + '.';
  if (!hierarchyConsistent) {
    summary += ' (Note: CW-05 recomputed the activation from canonical MD/AD/PD hierarchy.)';
  }
  return summary;
}

/**
 * Resolves Dasha activation at the CW-05 final synthesis boundary.
 * Recomputes the canonical activation effect via CW-02 resolveCombinedCareerDashaEffect
 * rather than blindly trusting the flattened combinedEffect.
 */
export function resolveDashaActivationGuardrail(
  dashaSynthesis?: CareerDashaSynthesis
): DashaActivationGuardrailResult {
  if (!dashaSynthesis?.combined) {
    return Object.freeze({
      effect: 'INSUFFICIENT_DATA' as const,
      status: 'INSUFFICIENT_DATA' as const,
      confidence: undefined,
      strength: undefined,
      summary: undefined,
      hierarchy: undefined,
      hierarchyConsistent: false
    });
  }

  const combined = dashaSynthesis.combined;
  const resolvedEffect = resolveCombinedCareerDashaEffect(
    combined.md,
    combined.ad,
    combined.pd,
    combined.combinedScore
  );

  const status = mapCareerDashaEffectToAxisStatus(resolvedEffect);
  const hierarchyConsistent = resolvedEffect === combined.combinedEffect;

  const hierarchy: FinalSynthesisActivationHierarchy = Object.freeze({
    md: Object.freeze({
      effect: combined.md?.effect ?? 'INSUFFICIENT_DATA',
      role: 'PRIMARY' as const
    }),
    ad: Object.freeze({
      effect: combined.ad?.effect ?? 'INSUFFICIENT_DATA',
      role: 'MODIFIER' as const
    }),
    pd: Object.freeze({
      effect: combined.pd?.effect ?? 'INSUFFICIENT_DATA',
      role: 'REFINEMENT' as const
    })
  });

  const confidence = mapConfidence(combined.combinedConfidence);
  const strength = combined.combinedScore;
  const summary = buildHierarchySummary(combined, hierarchyConsistent);

  return Object.freeze({
    effect: resolvedEffect,
    status,
    confidence,
    strength,
    summary,
    hierarchy,
    hierarchyConsistent
  });
}
