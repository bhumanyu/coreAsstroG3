/** READ-ONLY CHART SYNTHESIS LAYER. MUST NOT RECALCULATE ASTROLOGY OR PRODUCE NUMERIC SCORES/PROBABILITIES/PREDICTIONS. */

import { LifeTheme, LifeThemeEvidenceSource } from '../lifeThemes/lifeThemeTypes';
import { LIFE_THEME_METADATA } from '../lifeThemes/lifeThemeMetadata';
import { SynthesisEvidenceFamily, SynthesisEvidence } from './chartSynthesisTypes';

export const CHART_SYNTHESIS_THEME_ORDER: readonly LifeTheme[] = Object.freeze([
  LifeTheme.SELF_IDENTITY,
  LifeTheme.FAMILY_HOME,
  LifeTheme.WEALTH_FINANCE,
  LifeTheme.COMMUNICATION,
  LifeTheme.CHILDREN_CREATIVITY,
  LifeTheme.HEALTH_SERVICE,
  LifeTheme.PARTNERSHIP,
  LifeTheme.TRANSFORMATION,
  LifeTheme.DHARMA_BELIEFS,
  LifeTheme.CAREER_STATUS,
  LifeTheme.NETWORKS_GAINS,
  LifeTheme.SPIRITUALITY_RELEASE
]);

export function mapEvidenceSourceToFamily(
  source: LifeThemeEvidenceSource
): SynthesisEvidenceFamily {
  switch (source) {
    case 'HOUSE_INTERPRETATION':
    case 'FUNCTIONAL_ROLE':
    case 'NATAL_DRISHTI':
    case 'DOMAIN_METADATA':
      return 'STRUCTURAL';
    case 'PLANET_INTERPRETATION':
      return 'PLANETARY';
    case 'YOGA':
      return 'YOGA';
    case 'D9_INTERPRETATION':
    case 'D10_INTERPRETATION':
      return 'DIVISIONAL';
    case 'DASHA_INTERPRETATION':
      return 'DASHA';
    default:
      return 'STRUCTURAL';
  }
}

export function mapEvidenceSourceToCoarseSource(
  source: LifeThemeEvidenceSource
): SynthesisEvidence['source'] {
  switch (source) {
    case 'HOUSE_INTERPRETATION':
    case 'FUNCTIONAL_ROLE':
    case 'NATAL_DRISHTI':
    case 'DOMAIN_METADATA':
      return 'HOUSE';
    case 'PLANET_INTERPRETATION':
      return 'PLANET';
    case 'YOGA':
      return 'YOGA';
    case 'D9_INTERPRETATION':
    case 'D10_INTERPRETATION':
      return 'DIVISIONAL';
    case 'DASHA_INTERPRETATION':
      return 'DASHA';
    default:
      return 'LIFE_THEME';
  }
}

export function getSynthesisThemeLabel(theme: LifeTheme): string {
  const meta = LIFE_THEME_METADATA.find((m) => m.theme === theme);
  return meta ? meta.label : String(theme);
}
