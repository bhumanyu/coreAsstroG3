/**
 * Shared user-facing interpretation for product-layer classifications.
 *
 * Presentation-only: this module never changes canonical values or derives
 * astrological conclusions. Known classifications get plain-language labels;
 * unknown values are safely title-cased rather than leaked as enum codes.
 */
const LABELS: Readonly<Record<string, string>> = Object.freeze({
  STRONGLY_SUPPORTED: 'Strongly supportive indications',
  SUPPORTED: 'Supportive indications',
  MIXED: 'A combination of supportive and challenging indications',
  CHALLENGED: 'Challenging indications',
  LIMITED: 'Limited indications',
  VERY_STRONG: 'Very strong underlying indications',
  STRONG: 'Strong underlying indications',
  MODERATE: 'Moderate underlying indications',
  WEAK: 'Limited underlying indications',
  VERY_WEAK: 'Very limited underlying indications',
  HIGH: 'High evidence confidence',
  MEDIUM: 'Moderate evidence confidence',
  LOW: 'Limited evidence confidence',
  SUPPORT: 'Supportive',
  CHALLENGE: 'Challenging',
  NEUTRAL: 'Neutral',
  UNDETERMINED: 'Not yet determined',
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Not available for this analysis',
  CONDITIONAL: 'Available with conditions',
  PARTIAL: 'Partially available',
  INSUFFICIENT: 'Not enough information',
  INSUFFICIENT_DATA: 'Not enough information to assess this',
  BLOCKED: 'Not assessed because a required prerequisite is missing',
  NOT_APPLICABLE: 'Not applicable to this analysis',
  NOT_ASSESSED: 'Not assessed',
  NOT_PROVIDED: 'Not provided',
  COMPLETE: 'Complete',
  READY: 'Ready',
  ERROR: 'Could not be completed',
  IDLE: 'Not started',
  LOADING: 'In progress',
  ACTIVATES: 'The period activates relevant chart indications',
  PARTIALLY_ACTIVATES: 'The period activates some relevant chart indications',
  DOES_NOT_ACTIVATE: 'The period does not clearly activate these indications',
  CHALLENGES: 'The period brings challenging influences to these indications',
  STRONGLY_SUPPORTS: 'The period strongly supports these indications',
  SUPPORTS: 'The period supports these indications',
  CONTRADICTS: 'The period conflicts with these indications',
  UNKNOWN: 'The influence cannot currently be determined',
  TRIGGER: 'A transit trigger is indicated',
  MODIFIER: 'Transits may modify the underlying indications',
  NO_MATERIAL_TRIGGER: 'No significant transit trigger is identified',
  PAST: 'Past period',
  CURRENT: 'Current period',
  FUTURE: 'Upcoming period',
  ACTIVE: 'Currently active',
  NOT_ACTIVE: 'No clear activation is identified for the selected period',
  CONFIRMS: 'The divisional chart supports the natal indication',
  PARTIALLY_CONFIRMS: 'The divisional chart provides partial support',
  MODIFIES: 'The divisional chart modifies how the indication may manifest',
  CONFLICTS: 'The divisional chart shows conflicting indications',
  PRIMARY: 'Primary factor',
  SUPPORTING: 'Supporting factor',
  CHALLENGING: 'Challenging factor',
  REFINEMENT: 'Refining factor',
  CONFLICTING: 'Conflicting factor',
  NONE: 'None identified',
  MINIMAL: 'Minimal',
  MILD: 'Mild',
  CRITICAL: 'Critical'
});

const EXPLANATIONS: Readonly<Record<string, string>> = Object.freeze({
  MIXED: 'The available indications point in more than one direction. Some factors support the outcome while others create challenges; this is not a wholly favourable or wholly unfavourable result.',
  NEUTRAL: 'The available evidence does not show a clear supportive or challenging influence. Neutral does not mean that progress is impossible.',
  NOT_ACTIVE: 'The selected period does not show a clear activation of the relevant indications. This is a timing observation, not a negative judgement about the underlying birth-chart potential.',
  UNAVAILABLE: 'This part of the analysis could not be assessed from the available validated inputs. Its absence must not be treated as evidence against the outcome.',
  INSUFFICIENT_DATA: 'There is not enough validated information to make this assessment. No positive or negative conclusion is drawn from the missing information.',
  BLOCKED: 'This assessment is withheld because a required prerequisite or validation gate has not been satisfied.',
  PARTIAL: 'Only part of this assessment could be completed. The missing portion is not treated as negative evidence.',
  HIGH: 'The available evidence is relatively complete for this assessment. Confidence describes evidence coverage, not the strength of the astrological indication.',
  MEDIUM: 'The available evidence supports a moderate level of confidence. Confidence is distinct from the strength of the astrological indication.',
  LOW: 'Important evidence is missing or incomplete, so this interpretation should be treated cautiously. Low confidence does not mean a weak astrological indication.',
  STRONG: 'The underlying natal indicators are pronounced. This describes chart foundation, not current timing or certainty of a particular event.'
});

function normalize(value?: string | null): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

/** Safe label for known enum values and future codes. */
export function formatUserFacingClassification(value?: string | null): string {
  const key = normalize(value);
  if (!key) return 'Not available';
  if (LABELS[key]) return LABELS[key];
  return key.toLowerCase().split(/[_\s]+/).filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

/** Explanation for classifications whose meaning is easy to misinterpret. */
export function explainUserFacingClassification(value?: string | null): string | undefined {
  return EXPLANATIONS[normalize(value)];
}

/** Domain outcome, separate from strength and evidence confidence. */
export function formatOutcome(value?: string | null): string {
  switch (normalize(value)) {
    case 'STRONGLY_SUPPORTED': return 'Strongly supportive outlook';
    case 'SUPPORTED': return 'Supportive outlook';
    case 'MIXED': return 'Mixed outlook';
    case 'CHALLENGED': return 'Challenging outlook';
    case 'LIMITED': return 'Limited indications';
    case 'UNAVAILABLE': return 'Unable to assess';
    default: return formatUserFacingClassification(value);
  }
}

/** Confidence describes evidence completeness, not astrological strength. */
export function formatEvidenceConfidence(value?: string | null): string {
  switch (normalize(value)) {
    case 'HIGH': return 'High evidence confidence';
    case 'MEDIUM': return 'Moderate evidence confidence';
    case 'LOW': return 'Limited evidence confidence';
    default: return 'Confidence unavailable';
  }
}

/** Strength describes underlying indication, not outcome or timing. */
export function formatIndicationStrength(value?: string | null): string {
  switch (normalize(value)) {
    case 'VERY_STRONG': return 'Very strong foundation';
    case 'STRONG': return 'Strong foundation';
    case 'MODERATE': return 'Moderate foundation';
    case 'WEAK': return 'Limited foundation';
    case 'VERY_WEAK': return 'Very limited foundation';
    case 'UNAVAILABLE': return 'Foundation not assessed';
    default: return formatUserFacingClassification(value);
  }
}

/** Build a concise narrative from distinct canonical dimensions. */
export function buildDomainAssessmentNarrative(input: {
  outcome?: string | null;
  strength?: string | null;
  confidence?: string | null;
  activation?: string | null;
}): string {
  const parts = [
    formatOutcome(input.outcome),
    input.strength ? formatIndicationStrength(input.strength) : undefined,
    input.confidence ? formatEvidenceConfidence(input.confidence) : undefined,
    input.activation ? explainUserFacingClassification(input.activation)
      ?? formatUserFacingClassification(input.activation) : undefined
  ].filter((part): part is string => Boolean(part));
  return parts.join('. ') + '.';
}
