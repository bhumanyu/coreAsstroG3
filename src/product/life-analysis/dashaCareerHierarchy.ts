import type { CareerTimingActivation } from '../../domain/career/careerTypes';
import type {
  DashaCareerHierarchySynthesis
} from './dashaHierarchyTypes';
import {
  combineTimingHierarchy,
  buildHierarchyEvidence,
  formatEffectLabel
} from './dashaHierarchyUtils';

function buildCareerSummary(
  md: CareerTimingActivation,
  ad: CareerTimingActivation,
  pd: CareerTimingActivation,
  overallEffect: string
): string {
  const mdPlanet = md.planet ? `${md.planet}` : 'Mahadasha lord';
  const adPlanet = ad.planet ? `${ad.planet}` : 'Antardasha lord';
  const pdPlanet = pd.planet ? `${pd.planet}` : 'Pratyantardasha lord';

  const mdText = `${mdPlanet} establishes the primary career context (${formatEffectLabel(md.effect)})`;
  const adText = `${adPlanet} modifies the context (${formatEffectLabel(ad.effect)})`;
  const pdText = `${pdPlanet} acts as the short-term trigger (${formatEffectLabel(pd.effect)})`;

  return `${mdText}; ${adText}; ${pdText}. Overall synthesized career activation is ${formatEffectLabel(overallEffect)}.`;
}

/**
 * Deterministic aggregation layer for Career Dasha timing hierarchy (MD > AD > PD).
 * MAHADASHA = PRIMARY, ANTARDASHA = MODIFIER, PRATYANTARDASHA = TRIGGER.
 */
export function synthesizeCareerDashaHierarchy(
  md: CareerTimingActivation,
  ad: CareerTimingActivation,
  pd: CareerTimingActivation
): DashaCareerHierarchySynthesis {
  const { overallEffect, confidence } = combineTimingHierarchy(
    md.effect,
    ad.effect,
    pd.effect
  );

  const { evidence, evidenceIds } = buildHierarchyEvidence(
    md.evidenceIds ?? [],
    ad.evidenceIds ?? [],
    pd.evidenceIds ?? []
  );

  const summary = buildCareerSummary(md, ad, pd, overallEffect);

  return Object.freeze({
    primary: md,
    modifier: ad,
    trigger: pd,
    overallEffect,
    confidence,
    evidence,
    evidenceIds,
    summary
  });
}
