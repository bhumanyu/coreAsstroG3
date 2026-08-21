import { CAREER_RULE_METADATA_REGISTRY } from '../../engine/themeInterpretation/themeInterpretationMetadata';
import { CareerEvidenceFamily } from '../../engine/themeInterpretation/themeInterpretationTypes';
import type {
  EvidenceRuleViewModel,
  EvidenceRuleCategory
} from './lifeAnalysisEvidenceTypes';

/**
 * Derives the rule category from Career evidence family.
 */
function mapCareerFamilyToCategory(family: CareerEvidenceFamily): EvidenceRuleCategory {
  switch (family) {
    case CareerEvidenceFamily.TENTH_HOUSE:
    case CareerEvidenceFamily.SIXTH_HOUSE:
    case CareerEvidenceFamily.ELEVENTH_HOUSE:
    case CareerEvidenceFamily.SECOND_HOUSE:
    case CareerEvidenceFamily.TENTH_LORD:
    case CareerEvidenceFamily.SIXTH_LORD:
    case CareerEvidenceFamily.ELEVENTH_LORD:
    case CareerEvidenceFamily.ASPECT:
      return 'STRUCTURAL';
    case CareerEvidenceFamily.SUN:
    case CareerEvidenceFamily.SATURN:
    case CareerEvidenceFamily.MERCURY:
    case CareerEvidenceFamily.MARS:
    case CareerEvidenceFamily.JUPITER:
      return 'PLANETARY';
    case CareerEvidenceFamily.YOGA:
      return 'YOGA';
    case CareerEvidenceFamily.D10:
      return 'VARGA';
    case CareerEvidenceFamily.DASHA:
      return 'TIMING';
    default:
      return 'OTHER';
  }
}

/**
 * Static metadata registry for Wealth rules, assembled directly from existing
 * engine wealth rule definitions without inventing new astrology principles.
 */
export const WEALTH_RULE_METADATA_REGISTRY: Readonly<Record<string, EvidenceRuleViewModel>> = Object.freeze({
  // House Rules
  WEALTH_2H_STRONG_001: Object.freeze({
    id: 'WEALTH_2H_STRONG_001',
    name: '2nd House Primary Wealth Foundation',
    category: 'STRUCTURAL',
    description: 'The 2nd house relates to accumulated resources (Dhana), liquid assets, and foundational financial holdings.'
  }),
  WEALTH_2H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_2H_AFFLICTION_001',
    name: '2nd House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 2nd house indicate potential challenges or volatility in financial retention and resource management.'
  }),
  WEALTH_11H_STRONG_001: Object.freeze({
    id: 'WEALTH_11H_STRONG_001',
    name: '11th House Gains & Income Strength',
    category: 'STRUCTURAL',
    description: 'The 11th house relates to recurring gains (Labha), revenue streams, and financial goal realization.'
  }),
  WEALTH_11H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_11H_AFFLICTION_001',
    name: '11th House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 11th house reflect potential friction in recurring income or financial realization.'
  }),
  WEALTH_9H_STRONG_001: Object.freeze({
    id: 'WEALTH_9H_STRONG_001',
    name: '9th House Fortune & Lakshmi Sthana Strength',
    category: 'STRUCTURAL',
    description: 'The 9th house relates to higher fortune (Bhagya), supportive opportunities, and protective influences in financial matters.'
  }),
  WEALTH_9H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_9H_AFFLICTION_001',
    name: '9th House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 9th house indicate potential fluctuations in fortune or external supportive conditions.'
  }),
  WEALTH_5H_STRONG_001: Object.freeze({
    id: 'WEALTH_5H_STRONG_001',
    name: '5th House Intellect & Purva Punya Wealth Strength',
    category: 'STRUCTURAL',
    description: 'The 5th house relates to investment discernment (Purva Punya), analytical acumen, and venture-related initiatives.'
  }),
  WEALTH_5H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_5H_AFFLICTION_001',
    name: '5th House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 5th house indicate potential volatility in investment timing or speculative discernment.'
  }),
  WEALTH_2H_11H_LINK_001: Object.freeze({
    id: 'WEALTH_2H_11H_LINK_001',
    name: '2nd-11th House Dhana-Labha Link',
    category: 'STRUCTURAL',
    description: 'Structural linkage between the 2nd house (accumulation) and 11th house (gains) establishing a fundamental Dhana-Labha association.'
  }),
  WEALTH_2H_9H_LINK_001: Object.freeze({
    id: 'WEALTH_2H_9H_LINK_001',
    name: '2nd-9th House Wealth-Fortune Link',
    category: 'STRUCTURAL',
    description: 'Linkage between resource accumulation (2H) and fortune (9H) connecting supportive opportunities to tangible assets.'
  }),
  WEALTH_2H_5H_LINK_001: Object.freeze({
    id: 'WEALTH_2H_5H_LINK_001',
    name: '2nd-5th House Wealth-Intellect Link',
    category: 'STRUCTURAL',
    description: 'Linkage between resources (2H) and investment discernment (5H) associating analytical enterprise with asset growth.'
  }),
  WEALTH_5H_11H_LINK_001: Object.freeze({
    id: 'WEALTH_5H_11H_LINK_001',
    name: '5th-11th House Speculation-Gains Link',
    category: 'STRUCTURAL',
    description: 'Association between the 5th and 11th houses considered relevant to speculative and gains-related analysis.'
  }),
  WEALTH_9H_11H_LINK_001: Object.freeze({
    id: 'WEALTH_9H_11H_LINK_001',
    name: '9th-11th House Fortune-Gains Link',
    category: 'STRUCTURAL',
    description: 'Connection between the 9th and 11th houses considered relevant to fortune and gains.'
  }),
  WEALTH_5H_9H_LINK_001: Object.freeze({
    id: 'WEALTH_5H_9H_LINK_001',
    name: '5th-9th House Trikona Prosperity Link',
    category: 'STRUCTURAL',
    description: 'Trikona relationship between the 5th house and 9th house combining discernment and supportive fortune.'
  }),

  // Lord Rules
  WEALTH_2L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_2L_DIGNITY_001',
    name: '2nd Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The dignity, placement, and strength of the 2nd lord indicate baseline conditions for asset retention and resource management.'
  }),
  WEALTH_11L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_11L_DIGNITY_001',
    name: '11th Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The 11th lord indicates conditions surrounding recurring income, professional gains, and revenue channels.'
  }),
  WEALTH_9L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_9L_DIGNITY_001',
    name: '9th Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The 9th lord indicates conditions surrounding supportive fortune, opportunity flow, and auspicious timing.'
  }),
  WEALTH_5L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_5L_DIGNITY_001',
    name: '5th Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The 5th lord indicates conditions surrounding financial discernment, analytical judgment, and investment initiatives.'
  }),
  WEALTH_2L_11L_LINK_001: Object.freeze({
    id: 'WEALTH_2L_11L_LINK_001',
    name: '2nd Lord & 11th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the lords of the 2nd and 11th houses representing a classical Dhana-Labha structural combination.'
  }),
  WEALTH_2L_9L_LINK_001: Object.freeze({
    id: 'WEALTH_2L_9L_LINK_001',
    name: '2nd Lord & 9th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 2nd lord and 9th lord linking supportive fortune with resource accumulation.'
  }),
  WEALTH_2L_5L_LINK_001: Object.freeze({
    id: 'WEALTH_2L_5L_LINK_001',
    name: '2nd Lord & 5th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 2nd lord and 5th lord associating discernment and enterprise with asset growth.'
  }),
  WEALTH_5L_11L_LINK_001: Object.freeze({
    id: 'WEALTH_5L_11L_LINK_001',
    name: '5th Lord & 11th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 5th lord and 11th lord associating investment initiatives with recurring gains.'
  }),
  WEALTH_9L_11L_LINK_001: Object.freeze({
    id: 'WEALTH_9L_11L_LINK_001',
    name: '9th Lord & 11th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 9th lord and 11th lord linking supportive opportunities with revenue realization.'
  }),
  WEALTH_5L_9L_LINK_001: Object.freeze({
    id: 'WEALTH_5L_9L_LINK_001',
    name: '5th Lord & 9th Lord Trikona Relationship',
    category: 'STRUCTURAL',
    description: 'Mutual connection between trikona lords linking discernment and supportive fortune.'
  }),

  // Planet Rules
  WEALTH_JUPITER_KARAKA_001: Object.freeze({
    id: 'WEALTH_JUPITER_KARAKA_001',
    name: 'Jupiter Universal Wealth Karaka',
    category: 'PLANETARY',
    description: 'Jupiter serves as primary natural significator (Naisargika Karaka) for expansion, financial wisdom, and liquid assets.'
  }),
  WEALTH_VENUS_KARAKA_001: Object.freeze({
    id: 'WEALTH_VENUS_KARAKA_001',
    name: 'Venus Lakshmi / Prosperity Significator',
    category: 'PLANETARY',
    description: 'Venus serves as natural significator for material assets, comforts, aesthetic value, and tangible property.'
  }),
  WEALTH_MERCURY_KARAKA_001: Object.freeze({
    id: 'WEALTH_MERCURY_KARAKA_001',
    name: 'Mercury Commerce & Trade Significator',
    category: 'PLANETARY',
    description: 'Mercury serves as natural significator for commercial discernment, transaction management, trade, and analytical skill.'
  }),

  // Aspect Rules
  WEALTH_ASPECT_2H_001: Object.freeze({
    id: 'WEALTH_ASPECT_2H_001',
    name: 'Planetary Aspects on 2nd House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 2nd house modifying conditions for financial retention and resource stability.'
  }),
  WEALTH_ASPECT_11H_001: Object.freeze({
    id: 'WEALTH_ASPECT_11H_001',
    name: 'Planetary Aspects on 11th House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 11th house influencing revenue flow and realization of gains.'
  }),
  WEALTH_ASPECT_9H_001: Object.freeze({
    id: 'WEALTH_ASPECT_9H_001',
    name: 'Planetary Aspects on 9th House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 9th house modifying conditions of fortune and supportive opportunity.'
  }),
  WEALTH_ASPECT_5H_001: Object.freeze({
    id: 'WEALTH_ASPECT_5H_001',
    name: 'Planetary Aspects on 5th House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 5th house influencing investment discernment and initiative evaluation.'
  }),

  // Yoga Rules
  WEALTH_YOGA_CONFIRMATION_001: Object.freeze({
    id: 'WEALTH_YOGA_CONFIRMATION_001',
    name: 'Wealth-Relevant Yoga Assessment',
    category: 'YOGA',
    description: 'Upstream classical wealth combinations (Dhana, Lakshmi, Vasumati) evaluated as structural confirmatory factors.'
  }),

  // Dasha Rules
  WEALTH_DASHA_TIMING_001: Object.freeze({
    id: 'WEALTH_DASHA_TIMING_001',
    name: 'Active Dasha Wealth Timing Alignment',
    category: 'TIMING',
    description: 'Active Dasha periods evaluated for their temporal alignment with natal and divisional wealth configurations.'
  })
});

/**
 * Resolves rule metadata by ID.
 * Searches Career and Wealth registries.
 * Returns undefined for unknown IDs — never fabricates descriptions.
 */
export function resolveRuleMetadata(ruleId?: string): EvidenceRuleViewModel | undefined {
  if (!ruleId) {
    return undefined;
  }

  // 1. Check Career Registry
  const careerMeta = CAREER_RULE_METADATA_REGISTRY[ruleId];
  if (careerMeta) {
    return Object.freeze({
      id: careerMeta.ruleId,
      name: careerMeta.title,
      category: mapCareerFamilyToCategory(careerMeta.evidenceFamily),
      description: careerMeta.principle
    });
  }

  // 2. Check Wealth Registry
  const wealthMeta = WEALTH_RULE_METADATA_REGISTRY[ruleId];
  if (wealthMeta) {
    return wealthMeta;
  }

  return undefined;
}
