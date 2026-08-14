import {
  CareerEvidenceFamily,
  CareerThemeStatus,
  EvidenceConfidence,
  ThemeEvidenceEffect,
  ThemeEvidencePriority,
  VargaRelationship
} from '../../../engine/themeInterpretation/themeInterpretationTypes';
import {
  WealthEvidenceFamily,
  WealthThemeStatus
} from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';

export function formatThemeStatus(status: CareerThemeStatus | WealthThemeStatus | string): string {
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      return 'Strongly Supported';
    case 'SUPPORTED':
      return 'Supported';
    case 'MIXED':
      return 'Mixed';
    case 'CHALLENGED':
      return 'Challenged';
    case 'LIMITED_EVIDENCE':
      return 'Limited Evidence';
    default:
      return status?.replace(/_/g, ' ') || 'Unknown';
  }
}

export function formatThemePromiseStatus(status: string): string {
  switch (status) {
    case 'STRONG':
      return 'Strong';
    case 'SUPPORTED':
      return 'Supported';
    case 'MIXED':
      return 'Mixed';
    case 'ADVERSE':
      return 'Adverse';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return status?.replace(/_/g, ' ') || 'Unknown';
  }
}

export function formatEvidenceEffect(effect: ThemeEvidenceEffect | string): string {
  switch (effect) {
    case 'SUPPORT':
      return 'Support';
    case 'CHALLENGE':
      return 'Challenge';
    case 'NEUTRAL':
      return 'Neutral';
    default:
      return effect || 'Neutral';
  }
}

export function formatEvidencePriority(priority: ThemeEvidencePriority | string): string {
  switch (priority) {
    case 'PRIMARY':
      return 'Primary';
    case 'SECONDARY':
      return 'Secondary';
    case 'CONFIRMATORY':
      return 'Confirmatory';
    case 'TIMING':
      return 'Timing';
    default:
      return priority || 'Secondary';
  }
}

export function formatEvidenceDimension(dimension: string | undefined): string {
  switch (dimension) {
    case 'NATAL_STRUCTURE':
      return 'Natal Structure';
    case 'MODIFIER':
      return 'Modifiers & Dispositions';
    case 'CONFIRMATION':
      return 'Confirmation & Yogas';
    case 'TIMING':
      return 'Timing & Activation';
    default:
      return dimension?.replace(/_/g, ' ') || 'General Evidence';
  }
}

export function formatVargaRelationship(relationship: VargaRelationship | string | undefined): string {
  switch (relationship) {
    case 'CONFIRMS':
      return 'Confirms';
    case 'PARTIALLY_CONFIRMS':
      return 'Partially Confirms';
    case 'MODIFIES':
      return 'Modifies';
    case 'CONFLICTS':
      return 'Conflicts';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return relationship?.replace(/_/g, ' ') || 'Unavailable';
  }
}

export function formatYogaConfirmation(status: string | undefined): string {
  switch (status) {
    case 'CONFIRMS':
      return 'Confirms';
    case 'ABSENT':
      return 'Absent';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return status?.replace(/_/g, ' ') || 'Unavailable';
  }
}

export function formatCompleteness(completeness: string | undefined): string {
  switch (completeness) {
    case 'COMPLETE':
      return 'Complete Data';
    case 'PARTIAL':
      return 'Partial Data';
    case 'INSUFFICIENT':
      return 'Insufficient Data';
    default:
      return completeness || 'Unknown';
  }
}

export function formatEvidenceFamily(family: string): string {
  switch (family) {
    // Career & Wealth Houses & Lords
    case CareerEvidenceFamily.TENTH_HOUSE:
      return '10th House (Karma Bhava)';
    case CareerEvidenceFamily.TENTH_LORD:
      return '10th House Lord';
    case CareerEvidenceFamily.SIXTH_HOUSE:
      return '6th House (Shatru/Seva Bhava)';
    case CareerEvidenceFamily.SIXTH_LORD:
      return '6th House Lord';
    case CareerEvidenceFamily.SECOND_HOUSE:
    case WealthEvidenceFamily.SECOND_HOUSE:
      return '2nd House (Dhana/Kutumba Bhava)';
    case CareerEvidenceFamily.SECOND_LORD:
    case WealthEvidenceFamily.SECOND_LORD:
      return '2nd House Lord';
    case CareerEvidenceFamily.ELEVENTH_HOUSE:
    case WealthEvidenceFamily.ELEVENTH_HOUSE:
      return '11th House (Labha Bhava)';
    case CareerEvidenceFamily.ELEVENTH_LORD:
    case WealthEvidenceFamily.ELEVENTH_LORD:
      return '11th House Lord';
    case WealthEvidenceFamily.FIFTH_HOUSE:
      return '5th House (Purva Punya Bhava)';
    case WealthEvidenceFamily.FIFTH_LORD:
      return '5th House Lord';
    case WealthEvidenceFamily.NINTH_HOUSE:
      return '9th House (Bhagya Bhava)';
    case WealthEvidenceFamily.NINTH_LORD:
      return '9th House Lord';

    // Planets
    case CareerEvidenceFamily.SUN:
      return 'Sun (Surya - Authority & Leadership)';
    case CareerEvidenceFamily.SATURN:
      return 'Saturn (Shani - Discipline & Career Duty)';
    case CareerEvidenceFamily.MERCURY:
    case WealthEvidenceFamily.MERCURY:
      return 'Mercury (Budha - Commerce & Analysis)';
    case CareerEvidenceFamily.MARS:
      return 'Mars (Mangala - Initiative & Enterprise)';
    case CareerEvidenceFamily.JUPITER:
    case WealthEvidenceFamily.JUPITER:
      return 'Jupiter (Guru - Wealth & Expansion Karaka)';
    case WealthEvidenceFamily.VENUS:
      return 'Venus (Shukra - Prosperity & Material Assets)';

    // Synthesized Families
    case CareerEvidenceFamily.FUNCTIONAL_ROLE:
    case WealthEvidenceFamily.FUNCTIONAL_ROLE:
      return 'Functional Benefic/Malefic Roles';
    case CareerEvidenceFamily.PLANETARY_STRENGTH:
    case WealthEvidenceFamily.PLANETARY_STRENGTH:
      return 'Planetary Strength (Shadbala / Dignity)';
    case CareerEvidenceFamily.ASPECT:
    case WealthEvidenceFamily.ASPECT:
      return 'Graha Drishti & Sambandha Aspects';
    case CareerEvidenceFamily.YOGA:
    case WealthEvidenceFamily.YOGA:
      return 'Classical Astrological Yogas';
    case CareerEvidenceFamily.D10:
      return 'D10 Dasamsa Divisional Confirmation';
    case WealthEvidenceFamily.D2:
      return 'D2 Hora Divisional Confirmation';
    case CareerEvidenceFamily.DASHA:
    case WealthEvidenceFamily.DASHA:
      return 'Vimshottari Dasha Activation';
    case WealthEvidenceFamily.TRANSIT:
      return 'Gochar Transit Influence';
    default:
      return family.replace(/_/g, ' ');
  }
}

export function formatConfidence(confidence: EvidenceConfidence | string | undefined): string {
  switch (confidence) {
    case 'HIGH':
      return 'Evidence Confidence: High';
    case 'MEDIUM':
      return 'Evidence Confidence: Medium';
    case 'LOW':
      return 'Evidence Confidence: Low';
    default:
      return `Evidence Confidence: ${confidence || 'Medium'}`;
  }
}

export function getThemeStatusStyle(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40'
      };
    case 'SUPPORTED':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30'
      };
    case 'MIXED':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-300',
        border: 'border-amber-500/30'
      };
    case 'CHALLENGED':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-300',
        border: 'border-rose-500/30'
      };
    case 'LIMITED_EVIDENCE':
      return {
        bg: 'bg-slate-800/80',
        text: 'text-slate-300',
        border: 'border-slate-700'
      };
    default:
      return {
        bg: 'bg-slate-800/80',
        text: 'text-slate-300',
        border: 'border-slate-700'
      };
  }
}

export function getPromiseStatusStyle(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'STRONG':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-200',
        border: 'border-emerald-500/50'
      };
    case 'SUPPORTED':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30'
      };
    case 'MIXED':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-300',
        border: 'border-amber-500/30'
      };
    case 'ADVERSE':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-300',
        border: 'border-rose-500/40'
      };
    case 'UNAVAILABLE':
    default:
      return {
        bg: 'bg-slate-800',
        text: 'text-slate-400',
        border: 'border-slate-700'
      };
  }
}

export function getEffectStyle(effect: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (effect) {
    case 'SUPPORT':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        border: 'border-emerald-500/30'
      };
    case 'CHALLENGE':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-300',
        border: 'border-rose-500/30'
      };
    case 'NEUTRAL':
    default:
      return {
        bg: 'bg-slate-800/80',
        text: 'text-slate-300',
        border: 'border-slate-700'
      };
  }
}

export function getVargaRelationshipStyle(rel: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (rel) {
    case 'CONFIRMS':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40'
      };
    case 'PARTIALLY_CONFIRMS':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-300',
        border: 'border-teal-500/30'
      };
    case 'MODIFIES':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-300',
        border: 'border-amber-500/30'
      };
    case 'CONFLICTS':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-300',
        border: 'border-rose-500/40'
      };
    case 'ABSENT':
    case 'UNAVAILABLE':
    default:
      return {
        bg: 'bg-slate-800/80',
        text: 'text-slate-400',
        border: 'border-slate-700'
      };
  }
}
