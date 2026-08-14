import { CareerEvidenceFamily, ThemeEvidencePriority } from './themeInterpretationTypes';

export interface ThemeRuleMetadata {
  readonly ruleId: string;
  readonly title: string;
  readonly principle: string;
  readonly evidenceFamily: CareerEvidenceFamily;
  readonly priority: ThemeEvidencePriority;
  readonly classicalReference?: string;
  readonly referencePending?: boolean;
  readonly notes?: string;
}

export const CAREER_RULE_METADATA_REGISTRY: Readonly<Record<string, ThemeRuleMetadata>> = Object.freeze({
  // House Rules
  CAREER_10H_STRONG_001: Object.freeze({
    ruleId: 'CAREER_10H_STRONG_001',
    title: '10th House Primary Strength',
    principle: 'The 10th house is the primary seat of Karma, public status, and profession in Vedic astrology.',
    evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
    priority: 'PRIMARY',
    referencePending: true,
    notes: 'Classical verification pending against BPHS Chapter 18.'
  }),
  CAREER_10H_AFFLICTION_001: Object.freeze({
    ruleId: 'CAREER_10H_AFFLICTION_001',
    title: '10th House Affliction',
    principle: 'Explicit upstream house interpretation challenges on the 10th house indicate structural career friction.',
    evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
    priority: 'PRIMARY',
    referencePending: true,
    notes: 'Derived from upstream house interpretation evidence.'
  }),
  CAREER_10H_OCCUPANT_001: Object.freeze({
    ruleId: 'CAREER_10H_OCCUPANT_001',
    title: '10th House Occupants',
    principle: 'Planets occupying the 10th house directly shape public work and professional activities.',
    evidenceFamily: CareerEvidenceFamily.TENTH_HOUSE,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'BPHS 10th house occupant principles.'
  }),
  CAREER_6H_SERVICE_001: Object.freeze({
    ruleId: 'CAREER_6H_SERVICE_001',
    title: '6th House Daily Work & Service',
    principle: 'The 6th house governs daily labor, service roles, overcoming competition, and employment duties.',
    evidenceFamily: CareerEvidenceFamily.SIXTH_HOUSE,
    priority: 'SECONDARY',
    referencePending: true,
    notes: '6th house Upachaya principles.'
  }),
  CAREER_11H_GAINS_001: Object.freeze({
    ruleId: 'CAREER_11H_GAINS_001',
    title: '11th House Career Gains',
    principle: 'The 11th house governs income from profession, professional networks, and fulfillment of career goals.',
    evidenceFamily: CareerEvidenceFamily.ELEVENTH_HOUSE,
    priority: 'SECONDARY',
    referencePending: true,
    notes: '11th house gains principles.'
  }),
  CAREER_2H_WEALTH_001: Object.freeze({
    ruleId: 'CAREER_2H_WEALTH_001',
    title: '2nd House Wealth & Family Assets',
    principle: 'The 2nd house represents accumulated financial assets and income earned through professional speech/assets.',
    evidenceFamily: CareerEvidenceFamily.SECOND_HOUSE,
    priority: 'SECONDARY',
    referencePending: true,
    notes: '2nd house wealth principles.'
  }),
  CAREER_6H_10H_LINK_001: Object.freeze({
    ruleId: 'CAREER_6H_10H_LINK_001',
    title: '6th-10th House Connection',
    principle: 'Linkage between service (6H) and executive career (10H) indicates professional service or organizational role.',
    evidenceFamily: CareerEvidenceFamily.SIXTH_HOUSE,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Inter-house relationship principles.'
  }),
  CAREER_10H_11H_LINK_001: Object.freeze({
    ruleId: 'CAREER_10H_11H_LINK_001',
    title: '10th-11th House Connection',
    principle: 'Direct linkage between career (10H) and gains (11H) supports strong financial returns from profession.',
    evidenceFamily: CareerEvidenceFamily.ELEVENTH_HOUSE,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Inter-house relationship principles.'
  }),

  // Lord Rules
  CAREER_10L_DIGNITY_001: Object.freeze({
    ruleId: 'CAREER_10L_DIGNITY_001',
    title: '10th Lord Dignity & Strength',
    principle: 'The dignity and placement of the 10th lord dictates the foundation and strength of one’s career trajectory.',
    evidenceFamily: CareerEvidenceFamily.TENTH_LORD,
    priority: 'PRIMARY',
    referencePending: true,
    notes: 'Classical BPHS Lordship dignity rules.'
  }),
  CAREER_6L_10L_LINK_001: Object.freeze({
    ruleId: 'CAREER_6L_10L_LINK_001',
    title: '6th Lord & 10th Lord Relationship',
    principle: 'Connection between 6th lord and 10th lord links competitive service with career trajectory.',
    evidenceFamily: CareerEvidenceFamily.SIXTH_LORD,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Lordship relationship principles.'
  }),
  CAREER_10L_11L_LINK_001: Object.freeze({
    ruleId: 'CAREER_10L_11L_LINK_001',
    title: '10th Lord & 11th Lord Relationship',
    principle: 'Connection between 10th lord and 11th lord creates Dhana/Karma synthesis.',
    evidenceFamily: CareerEvidenceFamily.ELEVENTH_LORD,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Lordship relationship principles.'
  }),

  // Planet Rules
  CAREER_SUN_RELEVANCE_001: Object.freeze({
    ruleId: 'CAREER_SUN_RELEVANCE_001',
    title: 'Sun Public Authority & Karaka Role',
    principle: 'Sun is the natural karaka for authority, government, public leadership, and status.',
    evidenceFamily: CareerEvidenceFamily.SUN,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Natural karaka principles.'
  }),
  CAREER_SATURN_RELEVANCE_001: Object.freeze({
    ruleId: 'CAREER_SATURN_RELEVANCE_001',
    title: 'Saturn Work Ethic & Karma Karaka Role',
    principle: 'Saturn is the natural karaka for Karma (action), discipline, endurance, and service.',
    evidenceFamily: CareerEvidenceFamily.SATURN,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Natural karaka principles.'
  }),
  CAREER_MERCURY_RELEVANCE_001: Object.freeze({
    ruleId: 'CAREER_MERCURY_RELEVANCE_001',
    title: 'Mercury Commerce & Analytical Skill Karaka Role',
    principle: 'Mercury is the natural karaka for trade, intellect, communication, and commerce.',
    evidenceFamily: CareerEvidenceFamily.MERCURY,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Natural karaka principles.'
  }),
  CAREER_MARS_RELEVANCE_001: Object.freeze({
    ruleId: 'CAREER_MARS_RELEVANCE_001',
    title: 'Mars Executive Drive & Technical Initiative Karaka Role',
    principle: 'Mars provides energy, executive drive, technical initiative, and courage in career pursuits.',
    evidenceFamily: CareerEvidenceFamily.MARS,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Natural karaka principles.'
  }),
  CAREER_JUPITER_RELEVANCE_001: Object.freeze({
    ruleId: 'CAREER_JUPITER_RELEVANCE_001',
    title: 'Jupiter Executive Wisdom & Guidance Karaka Role',
    principle: 'Jupiter provides wisdom, expansion, counsel, and ethical guidance in leadership.',
    evidenceFamily: CareerEvidenceFamily.JUPITER,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Natural karaka principles.'
  }),

  // Aspect Rules
  CAREER_ASPECT_10H_001: Object.freeze({
    ruleId: 'CAREER_ASPECT_10H_001',
    title: 'Planetary Aspects on 10th House / 10th Lord',
    principle: 'Planetary aspects modify the atmosphere and expression of the 10th house and 10th lord.',
    evidenceFamily: CareerEvidenceFamily.ASPECT,
    priority: 'SECONDARY',
    referencePending: true,
    notes: 'Graha Drishti principles.'
  }),

  // Yoga Rules
  CAREER_YOGA_CONFIRMATION_001: Object.freeze({
    ruleId: 'CAREER_YOGA_CONFIRMATION_001',
    title: 'Career-Relevant Yoga Assessment',
    principle: 'Upstream Yogas (Raja, Dhana, Dharma-Karmadhipati, Pancha Mahapurusha) confirm career potential.',
    evidenceFamily: CareerEvidenceFamily.YOGA,
    priority: 'CONFIRMATORY',
    referencePending: true,
    notes: 'Yoga assessment from YogaAnalysisReport.'
  }),

  // Varga Rules
  CAREER_D10_CONFIRMATION_001: Object.freeze({
    ruleId: 'CAREER_D10_CONFIRMATION_001',
    title: 'D10 Dasamsa Divisional Confirmation',
    principle: 'D10 provides divisional detail confirming or modifying D1 career promises.',
    evidenceFamily: CareerEvidenceFamily.D10,
    priority: 'CONFIRMATORY',
    referencePending: true,
    notes: 'Divisional D10 principles.'
  }),

  // Dasha Rules
  CAREER_DASHA_TIMING_001: Object.freeze({
    ruleId: 'CAREER_DASHA_TIMING_001',
    title: 'Active Dasha Career Timing Alignment',
    principle: 'Active Dasha periods (MD/AD/PD) activate natal career factors and indicate timing windows.',
    evidenceFamily: CareerEvidenceFamily.DASHA,
    priority: 'TIMING',
    referencePending: true,
    notes: 'Dasha activation principles.'
  })
});
