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
  CONDITIONALLY_SUPPORTED: 'Conditionally supportive indications',
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
  PARTIALLY_ACTIVE: 'Partially active',
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
    case 'CONDITIONALLY_SUPPORTED': return 'Conditionally supportive outlook';
    case 'MIXED': return 'Mixed outlook';
    case 'CHALLENGED': return 'Challenging outlook';
    case 'VERY_STRONG': return 'Very strong indications';
    case 'STRONG': return 'Strong indications';
    case 'MODERATE': return 'Moderate indications';
    case 'INSUFFICIENT_DATA': return 'Not enough information to assess this';
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

export interface UserFacingAssessmentDimension {
  readonly title: string;
  readonly label: string;
  readonly explanation: string;
}

export interface UserFacingAssessmentDetail {
  readonly label: string;
  readonly explanation: string;
}

export interface UserFacingAssessment {
  readonly summary: string;
  readonly foundation: UserFacingAssessmentDimension;
  readonly dashaSupport: UserFacingAssessmentDimension;
  readonly timing: UserFacingAssessmentDimension;
  readonly confidence: UserFacingAssessmentDimension;
  readonly detailsLabel: string;
  readonly details: readonly UserFacingAssessmentDetail[];
}

const NOT_ASSESSED_LABEL = 'Not assessed';
const NOT_ASSESSED_EXPLANATION = 'This dimension was not assessed from the available structured information.';
const ASSESSMENT_OUTCOMES = new Set([
  'STRONGLY_SUPPORTED',
  'SUPPORTED',
  'CONDITIONALLY_SUPPORTED',
  'MIXED',
  'CHALLENGED',
  'LIMITED',
  'VERY_STRONG',
  'STRONG',
  'MODERATE',
  'INSUFFICIENT_DATA',
  'UNAVAILABLE',
  'SUPPORT',
  'CHALLENGE',
  'NEUTRAL',
  'CONDITIONAL',
  'PARTIAL',
  'AVAILABLE',
  'UNDETERMINED'
]);

function safeAssessmentOutcome(value?: string | null): string {
  const key = normalize(value);
  return ASSESSMENT_OUTCOMES.has(key) ? formatOutcome(key) : NOT_ASSESSED_LABEL;
}

function assessmentDimension(
  title: string,
  value: string | null | undefined,
  explanation?: string
): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (!key || !LABELS[key]) {
    return { title, label: NOT_ASSESSED_LABEL, explanation: NOT_ASSESSED_EXPLANATION };
  }
  return {
    title,
    label: LABELS[key],
    explanation: explanation ?? EXPLANATIONS[key] ?? 'This is a descriptive assessment, not a guaranteed outcome.'
  };
}

function foundationAssessment(
  direction?: string | null,
  strength?: string | null
): UserFacingAssessmentDimension {
  const directionKey = normalize(direction);
  const strengthKey = normalize(strength);
  if (directionKey === 'MIXED' || strengthKey === 'MIXED') {
    return assessmentDimension('Foundation', 'MIXED');
  }
  if (['UNAVAILABLE', 'INSUFFICIENT_DATA', 'UNKNOWN'].includes(directionKey)) {
    return assessmentDimension('Foundation', undefined);
  }
  if (['SUPPORT', 'CHALLENGE', 'NEUTRAL'].includes(directionKey)) {
    return assessmentDimension(
      'Foundation',
      directionKey,
      directionKey === 'SUPPORT'
        ? 'The structured natal assessment identifies supportive chart indications; this is not a prediction of a guaranteed outcome.'
        : directionKey === 'CHALLENGE'
          ? 'The structured natal assessment identifies challenging chart indications; this does not establish that an outcome is impossible.'
          : undefined
    );
  }
  if (['VERY_STRONG', 'STRONG', 'MODERATE', 'WEAK', 'VERY_WEAK', 'UNAVAILABLE', 'UNDETERMINED'].includes(strengthKey)) {
    const label = formatIndicationStrength(strengthKey);
    return {
      title: 'Foundation',
      label,
      explanation: explainUserFacingClassification(strengthKey)
        ?? 'This describes the underlying chart indication, not current timing or certainty of an event.'
    };
  }
  return assessmentDimension('Foundation', undefined);
}

function dashaAssessment(value?: string | null): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (key === 'MIXED') return assessmentDimension('Dasha support', key);
  if (key === 'CONDITIONAL') {
    return {
      title: 'Dasha support',
      label: 'Conditional support',
      explanation: 'The available period indications are conditional and should not be read as a guaranteed outcome.'
    };
  }
  if (['SUPPORT', 'CHALLENGE', 'NEUTRAL', 'CONDITIONAL', 'UNAVAILABLE', 'INSUFFICIENT_DATA'].includes(key)) {
    return assessmentDimension(
      'Dasha support',
      key,
      EXPLANATIONS[key] ?? 'This describes period support separately from the underlying chart foundation.'
    );
  }
  return assessmentDimension('Dasha support', undefined);
}

function timingAssessment(value?: string | null): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (['ACTIVE', 'PARTIALLY_ACTIVE', 'NOT_ACTIVE', 'CHALLENGED', 'UNKNOWN', 'UNAVAILABLE', 'INSUFFICIENT_DATA', 'SUPPORT', 'MIXED', 'NEUTRAL'].includes(key)) {
    return assessmentDimension(
      'Timing',
      key,
      EXPLANATIONS[key] ?? 'This is a timing observation and does not change the underlying chart assessment.'
    );
  }
  return assessmentDimension('Timing', undefined);
}

function confidenceAssessment(value?: string | null): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (['HIGH', 'MEDIUM', 'LOW'].includes(key)) {
    return {
      title: 'Evidence confidence',
      label: formatEvidenceConfidence(key),
      explanation: explainUserFacingClassification(key)
        ?? 'Confidence describes evidence completeness, not astrological strength.'
    };
  }
  return assessmentDimension('Evidence confidence', undefined);
}

/** Builds conservative presentation wording only from structured classifications. */
export function buildUserFacingAssessment(input: {
  readonly outcome?: string | null;
  readonly overallStatus?: string | null;
  readonly natalDirection?: string | null;
  readonly natalStrength?: string | null;
  readonly dashaDirection?: string | null;
  readonly timingStatus?: string | null;
  readonly confidence?: string | null;
  readonly details?: readonly { readonly label: string; readonly status?: string | null }[];
}): UserFacingAssessment {
  const foundation = foundationAssessment(input.natalDirection, input.natalStrength);
  const dashaSupport = dashaAssessment(input.dashaDirection);
  const timing = timingAssessment(input.timingStatus);
  const confidence = confidenceAssessment(input.confidence);
  const outcome = input.outcome ?? input.overallStatus;
  const summaryParts = [
    safeAssessmentOutcome(outcome),
    foundation.label,
    dashaSupport.label,
    timing.label,
    confidence.label
  ];
  return {
    summary: summaryParts.join('. ') + '.',
    foundation,
    dashaSupport,
    timing,
    confidence,
    detailsLabel: 'More assessment detail',
    details: (input.details ?? []).map(({ label, status }) => ({
      label,
      explanation: safeAssessmentOutcome(status)
    }))
  };
}

export function combineUserFacingAssessments(
  career: UserFacingAssessment,
  wealth: UserFacingAssessment
): UserFacingAssessment {
  const combineDimension = (
    title: string,
    careerDimension: UserFacingAssessmentDimension,
    wealthDimension: UserFacingAssessmentDimension
  ): UserFacingAssessmentDimension => {
    if (careerDimension.label === NOT_ASSESSED_LABEL && wealthDimension.label === NOT_ASSESSED_LABEL) {
      return assessmentDimension(title, undefined);
    }
    return {
      title,
      label: `Career: ${careerDimension.label}; Wealth: ${wealthDimension.label}`,
      explanation: `Career: ${careerDimension.explanation} Wealth: ${wealthDimension.explanation}`
    };
  };
  const foundation = combineDimension('Foundation', career.foundation, wealth.foundation);
  const dashaSupport = combineDimension('Dasha support', career.dashaSupport, wealth.dashaSupport);
  const timing = combineDimension('Timing', career.timing, wealth.timing);
  const confidence = combineDimension('Evidence confidence', career.confidence, wealth.confidence);
  const details = [
    ...career.details.map((item) => ({ label: `Career — ${item.label}`, explanation: item.explanation })),
    ...wealth.details.map((item) => ({ label: `Wealth — ${item.label}`, explanation: item.explanation }))
  ];
  return {
    summary: `Career: ${career.summary} Wealth: ${wealth.summary}`,
    foundation,
    dashaSupport,
    timing,
    confidence,
    detailsLabel: 'More assessment detail',
    details
  };
}
