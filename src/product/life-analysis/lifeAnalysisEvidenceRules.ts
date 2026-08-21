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
    description: 'The 2nd house governs accumulated wealth (Dhana), liquid savings, and speech.'
  }),
  WEALTH_2H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_2H_AFFLICTION_001',
    name: '2nd House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 2nd house indicate potential challenges in financial retention or wealth stability.'
  }),
  WEALTH_11H_STRONG_001: Object.freeze({
    id: 'WEALTH_11H_STRONG_001',
    name: '11th House Gains & Income Strength',
    category: 'STRUCTURAL',
    description: 'The 11th house governs continuous income (Labha), profits, and realization of financial objectives.'
  }),
  WEALTH_11H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_11H_AFFLICTION_001',
    name: '11th House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 11th house reflect potential friction in recurring gains or financial realization.'
  }),
  WEALTH_9H_STRONG_001: Object.freeze({
    id: 'WEALTH_9H_STRONG_001',
    name: '9th House Fortune & Lakshmi Sthana Strength',
    category: 'STRUCTURAL',
    description: 'The 9th house governs higher fortune (Bhagya), divine grace, and effortless financial luck.'
  }),
  WEALTH_9H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_9H_AFFLICTION_001',
    name: '9th House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 9th house indicate fluctuations in fortune and luck.'
  }),
  WEALTH_5H_STRONG_001: Object.freeze({
    id: 'WEALTH_5H_STRONG_001',
    name: '5th House Intellect & Purva Punya Wealth Strength',
    category: 'STRUCTURAL',
    description: 'The 5th house governs past meritorious deeds (Purva Punya), investment intellect, and speculative success.'
  }),
  WEALTH_5H_AFFLICTION_001: Object.freeze({
    id: 'WEALTH_5H_AFFLICTION_001',
    name: '5th House Affliction',
    category: 'STRUCTURAL',
    description: 'Afflictions to the 5th house indicate volatility in investments or speculative judgment.'
  }),
  WEALTH_2H_11H_LINK_001: Object.freeze({
    id: 'WEALTH_2H_11H_LINK_001',
    name: '2nd-11th House Dhana-Labha Link',
    category: 'STRUCTURAL',
    description: 'Direct structural linkage between 2nd house (accumulation) and 11th house (gains) establishes a primary wealth generator.'
  }),
  WEALTH_2H_9H_LINK_001: Object.freeze({
    id: 'WEALTH_2H_9H_LINK_001',
    name: '2nd-9th House Wealth-Fortune Link',
    category: 'STRUCTURAL',
    description: 'Linkage between wealth (2H) and divine fortune (9H) channels fortune into tangible asset accumulation.'
  }),
  WEALTH_2H_5H_LINK_001: Object.freeze({
    id: 'WEALTH_2H_5H_LINK_001',
    name: '2nd-5th House Wealth-Intellect Link',
    category: 'STRUCTURAL',
    description: 'Linkage between wealth (2H) and intellect/speculation (5H) builds accumulation through smart enterprise.'
  }),
  WEALTH_5H_11H_LINK_001: Object.freeze({
    id: 'WEALTH_5H_11H_LINK_001',
    name: '5th-11th House Speculation-Gains Link',
    category: 'STRUCTURAL',
    description: 'Direct polarity connection between 5th house and 11th house yields strong returns on investment and intellectual ventures.'
  }),
  WEALTH_9H_11H_LINK_001: Object.freeze({
    id: 'WEALTH_9H_11H_LINK_001',
    name: '9th-11th House Fortune-Gains Link',
    category: 'STRUCTURAL',
    description: 'Connection between fortune (9H) and gains (11H) creates high-yield financial channels.'
  }),
  WEALTH_5H_9H_LINK_001: Object.freeze({
    id: 'WEALTH_5H_9H_LINK_001',
    name: '5th-9th House Trikona Prosperity Link',
    category: 'STRUCTURAL',
    description: 'Trikona relationship between 5th house and 9th house amplifies dharmic merit and financial protection.'
  }),

  // Lord Rules
  WEALTH_2L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_2L_DIGNITY_001',
    name: '2nd Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The dignity, placement, and strength of the 2nd lord dictate the baseline capacity for asset accumulation.'
  }),
  WEALTH_11L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_11L_DIGNITY_001',
    name: '11th Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The 11th lord governs continuous cash flow, professional earnings, and expansion of liquid wealth.'
  }),
  WEALTH_9L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_9L_DIGNITY_001',
    name: '9th Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The 9th lord governs divine support, auspicious financial opportunities, and broad prosperity.'
  }),
  WEALTH_5L_DIGNITY_001: Object.freeze({
    id: 'WEALTH_5L_DIGNITY_001',
    name: '5th Lord Dignity & Placement',
    category: 'STRUCTURAL',
    description: 'The 5th lord governs financial discernment, investment wisdom, and purva punya rewards.'
  }),
  WEALTH_2L_11L_LINK_001: Object.freeze({
    id: 'WEALTH_2L_11L_LINK_001',
    name: '2nd Lord & 11th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the lords of 2nd and 11th houses constitutes a classic Dhana Yoga combination.'
  }),
  WEALTH_2L_9L_LINK_001: Object.freeze({
    id: 'WEALTH_2L_9L_LINK_001',
    name: '2nd Lord & 9th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 2nd lord and 9th lord links fortune with accumulated wealth.'
  }),
  WEALTH_2L_5L_LINK_001: Object.freeze({
    id: 'WEALTH_2L_5L_LINK_001',
    name: '2nd Lord & 5th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 2nd lord and 5th lord links merit and intellect with wealth creation.'
  }),
  WEALTH_5L_11L_LINK_001: Object.freeze({
    id: 'WEALTH_5L_11L_LINK_001',
    name: '5th Lord & 11th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between the 5th lord and 11th lord creates dynamic opportunities for financial expansion.'
  }),
  WEALTH_9L_11L_LINK_001: Object.freeze({
    id: 'WEALTH_9L_11L_LINK_001',
    name: '9th Lord & 11th Lord Relationship',
    category: 'STRUCTURAL',
    description: 'Connection between 9th lord (fortune) and 11th lord (gains) fosters auspicious, compounding prosperity.'
  }),
  WEALTH_5L_9L_LINK_001: Object.freeze({
    id: 'WEALTH_5L_9L_LINK_001',
    name: '5th Lord & 9th Lord Trikona Relationship',
    category: 'STRUCTURAL',
    description: 'Mutual connection between the auspicious trikona lords brings profound dharmic prosperity.'
  }),

  // Planet Rules
  WEALTH_JUPITER_KARAKA_001: Object.freeze({
    id: 'WEALTH_JUPITER_KARAKA_001',
    name: 'Jupiter Universal Wealth Karaka',
    category: 'PLANETARY',
    description: 'Jupiter naturally signifies broad prosperity, financial abundance, liquid capital, and ethical growth.'
  }),
  WEALTH_VENUS_KARAKA_001: Object.freeze({
    id: 'WEALTH_VENUS_KARAKA_001',
    name: 'Venus Lakshmi / Prosperity Significator',
    category: 'PLANETARY',
    description: 'Venus signifies material luxuries, conveyances, landed comforts, aesthetic wealth, and tangible assets.'
  }),
  WEALTH_MERCURY_KARAKA_001: Object.freeze({
    id: 'WEALTH_MERCURY_KARAKA_001',
    name: 'Mercury Commerce & Trade Significator',
    category: 'PLANETARY',
    description: 'Mercury signifies commercial intelligence, business profits, financial transactions, and liquid assets.'
  }),

  // Aspect Rules
  WEALTH_ASPECT_2H_001: Object.freeze({
    id: 'WEALTH_ASPECT_2H_001',
    name: 'Planetary Aspects on 2nd House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 2nd house modify financial retention and family assets.'
  }),
  WEALTH_ASPECT_11H_001: Object.freeze({
    id: 'WEALTH_ASPECT_11H_001',
    name: 'Planetary Aspects on 11th House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 11th house influence income flow and realization of gains.'
  }),
  WEALTH_ASPECT_9H_001: Object.freeze({
    id: 'WEALTH_ASPECT_9H_001',
    name: 'Planetary Aspects on 9th House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 9th house modify fortune and divine support.'
  }),
  WEALTH_ASPECT_5H_001: Object.freeze({
    id: 'WEALTH_ASPECT_5H_001',
    name: 'Planetary Aspects on 5th House',
    category: 'STRUCTURAL',
    description: 'Planetary aspects onto the 5th house influence investment intellect and speculative opportunities.'
  }),

  // Yoga Rules
  WEALTH_YOGA_CONFIRMATION_001: Object.freeze({
    id: 'WEALTH_YOGA_CONFIRMATION_001',
    name: 'Wealth-Relevant Yoga Assessment',
    category: 'YOGA',
    description: 'Upstream Dhana Yogas, Lakshmi Yoga, and Vasumati Yoga confirm wealth potential.'
  }),

  // Dasha Rules
  WEALTH_DASHA_TIMING_001: Object.freeze({
    id: 'WEALTH_DASHA_TIMING_001',
    name: 'Active Dasha Wealth Timing Alignment',
    category: 'TIMING',
    description: 'Active Dasha periods activate natal wealth factors and indicate windows for financial manifestation.'
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
