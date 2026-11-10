/**
 * Shared user-facing interpretation for product-layer classifications.
 *
 * This module is presentation-only: it never changes canonical values or
 * derives astrological conclusions. Each known classification receives plain
 * language; unknown values are safely title-cased rather than leaked as enums.
 */
export type InterpretationTone = 'supportive' | 'challenging' | 'neutral' | 'incomplete';

const labels: Readonly<Record<string, string>> = Object.freeze({
  // Conclusion outcomes
  STRONGLY_SUPPORTED: 'Strongly supportive indications',
  SUPPORTED: 'Supportive indications',
  MIXED: 'A combination of supportive and challenging indications',
  CHALLENGED: 'Challenging indications',
  LIMITED: 'Limited indications',
  UNAVAILABLE: 'Not available',

  // Promise strength (separate from conclusion and confidence)
  VERY_STRONG: 'Very strong underlying indications',
  STRONG: 'Strong underlying indications',
  MODERATE: 'Moderate underlying indications',
  WEAK: 'Limited underlying indications',
  VERY_WEAK: 'Very limited underlying indications',

  // Analysis confidence (not strength)
  HIGH: 'High confidence in the available evidence',
  MEDIUM: 'Moderate confidence in the available evidence',
  LOW: 'Limited confidence in the available evidence',

  // Evidence direction
  SUPPORT: 'Supportive',
  CHALLENGE: 'Challenging',
  NEUTRAL: 'Neutral',
  UNDETERMINED: 'Not yet determined',

  // Availability and analysis state
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Not available for this analysis',
  CONDITIONAL: 'Available with conditions',
  PARTIAL: 'Partially available',
  INSUFFICIENT: 'Not enough information',
  INSUFFICIENT_DATA: 'There is not enough information to assess this',
  BLOCKED: 'Not assessed because a required prerequisite is missing',
  NOT_APPLICABLE: 'Not applicable to this analysis',
  NOT_ASSESSED: 'Not assessed',
  NOT_PROVIDED: 'Not provided',
  COMPLETE: 'Complete',
  READY: 'Ready',
  ERROR: 'Could not be completed',
  IDLE: 'Not started',
  LOADING: 'In progress',

  // Dasha activation effects
  ACTIVATES: 'The period activates relevant chart indications',
  PARTIALLY_ACTIVATES: 'The period activates some relevant chart indications',
  DOES_NOT_ACTIVATE: 'The period does not clearly activate these indications',
  CHALLENGES: 'The period brings challenging influences to these indications',
  STRONGLY_SUPPORTS: 'The period strongly supports these indications',
  SUPPORTS: 'The period supports these indications',
  CONTRADICTS: 'The period conflicts with these indications',
  UNKNOWN: 'The influence cannot currently be determined',

  // Transit effects
  TRIGGER: 'A transit trigger is indicated',
  MODIFIER: 'Transits may modify the underlying indications',
  CHALLENGE: 'A challenging transit influence is indicated',
  NO_MATERIAL_TRIGGER: 'No significant transit trigger is identified',

  // Temporal relation and activation
  PAST: 'Past period',
  CURRENT: 'Current period',
  FUTURE: 'Upcoming period',
  UNKNOWN_TEMPORAL_RELATION: 'Timing cannot be determined',
  ACTIVE: 'Currently active',
  NOT_ACTIVE: 'No clear activation is identified for the selected period',
  NEUTRAL: 'No clearly supportive or challenging influence is identified',

  // D10/D2 divisional qualification relationships
  CONFIRMS: 'The divisional chart supports the natal indication',
  PARTIALLY_CONFIRMS: 'The divisional chart provides partial support',
  MODIFIES: 'The divisional chart modifies how the indication may manifest',
  CONFLICTS: 'The divisional chart shows conflicting indications',

  // Evidence role
  PRIMARY: 'Primary factor',
  SUPPORTING: 'Supporting factor',
  CHALLENGING: 'Challenging factor',
  MODIFIER: 'Modifying factor',
  REFINEMENT: 'Refining factor',
  CONFLICTING: 'Conflicting factor',

  // Severity
  NONE: 'None identified',
  MINIMAL: 'Minimal',
  MILD: 'Mild',
  MODERATE_SEVERITY: 'Moderate',
  HIGH_SEVERITY: 'High',
  CRITICAL: 'Critical'
});

const explanations: Readonly<Record<string, string>> = Object.freeze({
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

/** Safe label for known enum values and future codes. Never returns raw snake case. */
export function formatUserFacingClassification(value?: string | null): string {
  const key = normalize(value);
  if (!key) return 'Not available';
  if (labels[key]) return labels[key];

  return key
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Plain-language explanation for states that are commonly misread. */
export function explainUserFacingClassification(value?: string | null): string | undefined {
  const key = normalize(value);
  return explanations[key];
}

/** A domain outcome label; never concatenates outcome, strength and confidence. */
export function formatOutcome(value?: string | null): string {
  const key = normalize(value);
  switch (key) {
    case 'STRONGLY_SUPPORTED': return 'Strongly supportive outlook';
    case 'SUPPORTED': return 'Supportive outlook';
    case 'MIXED': return 'Mixed outlook';
    case 'CHALLENGED': return 'Challenging outlook';
    case 'LIMITED': return 'Limited indications';
    case 'UNAVAILABLE': return 'Unable to assess';
    default: return formatUserFacingClassification(value);
  }
}

/** Confidence is deliberately named as confidence in evidence, never strength. */
export function formatEvidenceConfidence(value?: string | null): string {
  const key = normalize(value);
  switch (key) {
    case 'HIGH': return 'High evidence confidence';
    case 'MEDIUM': return 'Moderate evidence confidence';
    case 'LOW': return 'Limited evidence confidence';
    default: return 'Confidence unavailable';
  }
}

/** Strength describes the underlying indication and is not an outcome verdict. */
export function formatIndicationStrength(value?: string | null): string {
  const key = normalize(value);
  switch (key) {
    case 'VERY_STRONG': return 'Very strong foundation';
    case 'STRONG': return 'Strong foundation';
    case 'MODERATE': return 'Moderate foundation';
    case 'WEAK': return 'Limited foundation';
    case 'VERY_WEAK': return 'Very limited foundation';
    case 'UNAVAILABLE': return 'Foundation not assessed';
    default: return formatUserFacingClassification(value);
  }
}

/** Build a concise, non-repetitive narrative from separate canonical dimensions. */
export function buildDomainAssessmentNarrative(input: {
  outcome?: string | null;
  strength?: string | null;
  confidence?: string | null;
  activation?: string | null;
}): string {
  const outcome = formatOutcome(input.outcome);
  const strength = explainUserFacingClassification(input.strength)
    ?? formatIndicationStrength(input.strength);
  const confidence = formatEvidenceConfidence(input.confidence);
  const activationExplanation = explainUserFacingClassification(input.activation)
    ?? (input.activation ? formatUserFacingClassification(input.activation) : undefined);

  const parts = [
    outcome,
    strength === 'Foundation not assessed' ? undefined : strength,
    confidence,
    activationExplanation
  ].filter((part): part is string => Boolean(part));

  return parts.join('. ') + '.';
}
