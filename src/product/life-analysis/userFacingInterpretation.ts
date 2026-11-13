/**
 * Shared user-facing interpretation for product-layer classifications.
 *
 * Presentation-only: this module never changes canonical values or derives
 * astrological conclusions. Copy is isolated behind a provider so presentation
 * wording can be localized without changing canonical classification values.
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
  NOT_ACTIVE: 'No clear activation identified',
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

export interface UserFacingCopyProvider {
  readonly labels: Readonly<Record<string, string>>;
  readonly assessmentLabels: Readonly<Record<string, string>>;
  readonly explanations: Readonly<Record<string, string>>;
  readonly outcomes: Readonly<Record<string, string>>;
  readonly directionLabels: Readonly<Record<string, string>>;
  readonly confidenceLabels: Readonly<Record<string, string>>;
  readonly confidenceUnavailable: string;
  readonly strengthLabels: Readonly<Record<string, string>>;
  readonly foundationUnavailable: string;
  readonly wealthFoundationLabels: Readonly<Record<string, string>>;
  readonly detailLabels: Readonly<Record<string, string>>;
  readonly titles: Readonly<Record<string, string>>;
  readonly notAssessed: string;
  readonly notAvailable: string;
  readonly notAssessedExplanation: string;
  readonly genericExplanation: string;
  readonly mixedFoundationLabel: (strengthLabel: string) => string;
  readonly mixedFoundationExplanation: (strengthLabel: string) => string;
  readonly combinedFoundationLabel: (strengthLabel: string, directionLabel: string) => string;
  readonly combinedFoundationExplanation: (strengthLabel: string, direction: string) => string;
  readonly foundationDirectionExplanation: (direction: string) => string;
  readonly foundationStrengthExplanation: (strength: string) => string;
  readonly conditionalSupportLabel: string;
  readonly conditionalSupportExplanation: string;
  readonly timingExplanation: string;
  readonly confidenceExplanation: string;
  readonly combinedDimensionLabel: (careerLabel: string, wealthLabel: string) => string;
  readonly combinedDimensionExplanation: (careerExplanation: string, wealthExplanation: string) => string;
  readonly domainDetailLabel: (domain: 'career' | 'wealth', label: string) => string;
  readonly periodSupportExplanation: string;
  readonly domainOutcome: (outcome: string, domain: 'career' | 'wealth') => string;
  readonly combinedSummary: (careerOutcome: string, wealthOutcome: string) => string;
  readonly wealthFoundationExplanation: (status: string) => string;
}

const englishUserFacingCopy: UserFacingCopyProvider = {
  labels: LABELS,
  assessmentLabels: Object.freeze({ MIXED: 'Mixed indications' }),
  explanations: EXPLANATIONS,
  outcomes: Object.freeze({
    STRONGLY_SUPPORTED: 'Strongly supportive outlook',
    SUPPORTED: 'Supportive outlook',
    CONDITIONALLY_SUPPORTED: 'Conditionally supportive outlook',
    MIXED: 'Mixed outlook',
    CHALLENGED: 'Challenging outlook',
    VERY_STRONG: 'Very strong indications',
    STRONG: 'Strong indications',
    MODERATE: 'Moderate indications',
    INSUFFICIENT_DATA: 'Not enough information to assess this',
    LIMITED: 'Limited indications',
    UNAVAILABLE: 'Unable to assess',
    SUPPORT: 'Supportive outlook',
    CHALLENGE: 'Challenging outlook',
    NEUTRAL: 'Neutral outlook',
    CONDITIONAL: 'Conditional outlook',
    PARTIAL: 'Partially assessed',
    AVAILABLE: 'Available',
    UNDETERMINED: 'Not yet determined'
  }),
  directionLabels: Object.freeze({
    SUPPORT: 'supportive indications',
    CHALLENGE: 'challenging indications',
    MIXED: 'mixed indications',
    NEUTRAL: 'neutral indications',
    CONDITIONAL: 'conditional indications'
  }),
  confidenceLabels: Object.freeze({
    HIGH: 'High confidence',
    MEDIUM: 'Medium confidence',
    LOW: 'Low confidence'
  }),
  confidenceUnavailable: 'Confidence unavailable',
  strengthLabels: Object.freeze({
    VERY_STRONG: 'Very strong foundation',
    STRONG: 'Strong foundation',
    MODERATE: 'Moderate foundation',
    WEAK: 'Limited foundation',
    VERY_WEAK: 'Very limited foundation',
    MIXED: 'Mixed foundation'
  }),
  foundationUnavailable: 'Foundation not assessed',
  wealthFoundationLabels: Object.freeze({
    VERY_STRONG: 'Very strong foundation',
    STRONG: 'Strong foundation',
    MODERATE: 'Moderate foundation',
    MIXED: 'Mixed foundation',
    CHALLENGED: 'Challenged foundation'
  }),
  detailLabels: Object.freeze({
    'FINAL OUTCOME': 'Final outcome',
    'INTEGRATED DIRECTION': 'Integrated direction',
    'INTEGRATED STRENGTH': 'Integrated strength',
    ACCUMULATION: 'Accumulation',
    GAINS: 'Gains',
    FORTUNE: 'Fortune',
    SPECULATION: 'Speculation'
  }),
  titles: Object.freeze({
    FOUNDATION: 'Foundation',
    'DASHA SUPPORT': 'Dasha support',
    TIMING: 'Timing',
    'EVIDENCE CONFIDENCE': 'Evidence confidence',
    'MORE ASSESSMENT DETAIL': 'More assessment detail',
    'ADDITIONAL ASSESSMENT': 'Additional assessment'
  }),
  notAssessed: 'Not assessed',
  notAvailable: 'Not available',
  notAssessedExplanation: 'This dimension was not assessed from the available structured information.',
  genericExplanation: 'This is a descriptive assessment, not a guaranteed outcome.',
  mixedFoundationLabel: (strengthLabel) => `${strengthLabel} with mixed indications`,
  mixedFoundationExplanation: (strengthLabel) =>
    `${strengthLabel} reflects supporting factors that coexist with challenging factors. A ${strengthLabel.toLowerCase()} does not guarantee a favourable result.`,
  combinedFoundationLabel: (strengthLabel, directionLabel) =>
    `${strengthLabel} with ${directionLabel}`,
  combinedFoundationExplanation: (strengthLabel, direction) => {
    if (direction === 'SUPPORT') {
      return `${strengthLabel} and supportive factors describe the natal foundation; neither guarantees a particular result.`;
    }
    if (direction === 'CHALLENGE') {
      return `${strengthLabel} coexists with challenging factors; this does not establish that a favourable outcome is impossible.`;
    }
    if (direction === 'NEUTRAL') {
      return `${strengthLabel} is reported alongside neutral indications; no clear supportive or challenging direction is established.`;
    }
    return `${strengthLabel} is reported alongside conditional indications; this is not a guaranteed outcome.`;
  },
  foundationDirectionExplanation: (direction) => {
    if (direction === 'SUPPORT') {
      return 'The structured natal assessment identifies supportive chart indications; this is not a prediction of a guaranteed outcome.';
    }
    if (direction === 'CHALLENGE') {
      return 'The structured natal assessment identifies challenging chart indications; this does not establish that an outcome is impossible.';
    }
    if (direction === 'NEUTRAL') {
      return 'The available evidence does not show a clear supportive or challenging influence.';
    }
    return 'The structured natal assessment is conditional and is not a guaranteed outcome.';
  },
  foundationStrengthExplanation: (strength) =>
    `This describes a ${strength.toLowerCase()} underlying chart indication, not current timing or certainty of an event.`,
  conditionalSupportLabel: 'Conditional support',
  conditionalSupportExplanation: 'The available period indications are conditional and should not be read as a guaranteed outcome.',
  timingExplanation: 'This is a timing observation and does not change the underlying chart assessment.',
  confidenceExplanation: 'Confidence describes evidence completeness, not astrological strength.',
  combinedDimensionLabel: (careerLabel, wealthLabel) =>
    `Career: ${careerLabel}; Wealth: ${wealthLabel}`,
  combinedDimensionExplanation: (careerExplanation, wealthExplanation) =>
    `Career: ${careerExplanation} Wealth: ${wealthExplanation}`,
  domainDetailLabel: (domain, label) =>
    `${domain === 'career' ? 'Career' : 'Wealth'} — ${label}`,
  periodSupportExplanation: 'This describes period support separately from the underlying chart foundation.',
  domainOutcome: (outcome, domain) => {
    const subject = domain === 'career' ? 'career' : 'wealth';
    const adjectiveByOutcome: Readonly<Record<string, string>> = {
      'Strongly supportive outlook': 'Strongly supportive',
      'Supportive outlook': 'Supportive',
      'Conditionally supportive outlook': 'Conditionally supportive',
      'Mixed outlook': 'Mixed',
      'Challenging outlook': 'Challenging',
      'Very strong indications': 'Very strong',
      'Strong indications': 'Strong',
      'Moderate indications': 'Moderate',
      'Limited indications': 'Limited',
      'Unable to assess': 'Not assessed',
      'Not enough information to assess this': 'Not assessed',
      'Not assessed': 'Not assessed'
    };
    const adjective = adjectiveByOutcome[outcome] ?? 'Not assessed';
    return adjective === 'Not assessed'
      ? `${subject === 'career' ? 'Career' : 'Wealth'} assessment not assessed`
      : `${adjective} ${subject} outlook`;
  },
  combinedSummary: (careerOutcome, wealthOutcome) =>
    `${careerOutcome}; ${wealthOutcome}.`,
  wealthFoundationExplanation: (status) => {
    if (status === 'MIXED') {
      return 'Supportive and challenging factors coexist in the wealth foundation; this is not a wholly favourable or unfavourable result.';
    }
    if (status === 'CHALLENGED') {
      return 'The structured wealth foundation includes challenging indications; this is not a prediction that financial outcomes are impossible.';
    }
    if (status === 'INSUFFICIENT_DATA') {
      return 'There is not enough validated information to assess the wealth foundation.';
    }
    return 'This describes the natal wealth foundation, not a guaranteed financial outcome.';
  }
};

export const ENGLISH_USER_FACING_COPY: UserFacingCopyProvider = Object.freeze(englishUserFacingCopy);

function normalize(value?: string | null): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

/** Returns a label for known values and a conservative fallback otherwise. */
export function formatUserFacingClassification(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  const key = normalize(value);
  if (!key) return copy.notAvailable;
  return copy.labels[key] ?? copy.notAssessed;
}

/** Explanation for classifications whose meaning is easy to misinterpret. */
export function explainUserFacingClassification(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string | undefined {
  return copy.explanations[normalize(value)];
}

/** Domain outcome, separate from strength and evidence confidence. */
export function formatOutcome(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  return copy.outcomes[normalize(value)] ?? copy.notAssessed;
}

/** Confidence describes evidence completeness, not astrological strength. */
export function formatEvidenceConfidence(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  const key = normalize(value);
  if (!key || key === 'UNAVAILABLE') return copy.confidenceUnavailable;
  return ['HIGH', 'MEDIUM', 'LOW'].includes(key)
    ? copy.labels[key]
    : copy.notAssessed;
}

/** Strength describes underlying indication, not outcome or timing. */
export function formatIndicationStrength(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  const key = normalize(value);
  if (!key) return copy.notAvailable;
  if (key === 'UNAVAILABLE') return copy.foundationUnavailable;
  return copy.strengthLabels[key] ?? copy.labels[key] ?? copy.notAssessed;
}

/** Build a concise narrative from distinct canonical dimensions. */
export function buildDomainAssessmentNarrative(input: {
  outcome?: string | null;
  strength?: string | null;
  confidence?: string | null;
  activation?: string | null;
}, copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY): string {
  const parts = [
    formatOutcome(input.outcome, copy),
    input.strength ? formatIndicationStrength(input.strength, copy) : undefined,
    input.confidence ? formatEvidenceConfidence(input.confidence, copy) : undefined,
    input.activation ? explainUserFacingClassification(input.activation, copy)
      ?? formatUserFacingClassification(input.activation, copy) : undefined
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
  readonly outcomeLabel: string;
  readonly foundation: UserFacingAssessmentDimension;
  readonly dashaSupport: UserFacingAssessmentDimension;
  readonly timing: UserFacingAssessmentDimension;
  readonly confidence: UserFacingAssessmentDimension;
  readonly detailsLabel: string;
  readonly details: readonly UserFacingAssessmentDetail[];
}

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

function safeAssessmentOutcome(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  const key = normalize(value);
  return ASSESSMENT_OUTCOMES.has(key) ? formatOutcome(key, copy) : copy.notAssessed;
}

function assessmentDimension(
  title: string,
  value: string | null | undefined,
  explanation?: string,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (!key || !copy.labels[key]) {
    return { title, label: copy.notAssessed, explanation: copy.notAssessedExplanation };
  }
  return {
    title,
    label: copy.assessmentLabels[key] ?? copy.labels[key],
    explanation: explanation ?? copy.explanations[key] ?? copy.genericExplanation
  };
}

function foundationAssessment(
  direction?: string | null,
  strength?: string | null,
  promiseStatus?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingAssessmentDimension {
  const directionKey = normalize(direction);
  const strengthKey = normalize(strength);
  const promiseKey = normalize(promiseStatus);
  const title = copy.titles.FOUNDATION;

  if (promiseKey) {
    const label = copy.wealthFoundationLabels[promiseKey];
    if (!label) return assessmentDimension(title, undefined, undefined, copy);
    return {
      title,
      label,
      explanation: copy.wealthFoundationExplanation(promiseKey)
    };
  }

  const strengthLabel = copy.strengthLabels[strengthKey];
  const directionLabel = copy.directionLabels[directionKey];

  if (directionKey === 'MIXED' && strengthLabel) {
    return {
      title,
      label: copy.mixedFoundationLabel(strengthLabel),
      explanation: copy.mixedFoundationExplanation(strengthLabel)
    };
  }

  if (directionKey && strengthKey) {
    if (strengthLabel && directionLabel) {
      return {
        title,
        label: copy.combinedFoundationLabel(strengthLabel, directionLabel),
        explanation: copy.combinedFoundationExplanation(strengthLabel, directionKey)
      };
    }
    return assessmentDimension(title, undefined, undefined, copy);
  }

  if (directionKey) {
    return directionLabel
      ? assessmentDimension(title, directionKey, copy.foundationDirectionExplanation(directionKey), copy)
      : assessmentDimension(title, undefined, undefined, copy);
  }

  if (strengthKey) {
    if (strengthLabel) {
      return {
        title,
        label: strengthLabel,
        explanation: copy.explanations[strengthKey]
          ?? copy.foundationStrengthExplanation(strengthKey)
      };
    }
    if (strengthKey === 'UNAVAILABLE' || strengthKey === 'UNDETERMINED') {
      return assessmentDimension(title, undefined, undefined, copy);
    }
    return assessmentDimension(title, undefined, undefined, copy);
  }
  return assessmentDimension(title, undefined, undefined, copy);
}

function dashaAssessment(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingAssessmentDimension {
  const key = normalize(value);
  const title = copy.titles['DASHA SUPPORT'];
  if (key === 'MIXED') return assessmentDimension(title, key, undefined, copy);
  if (key === 'CONDITIONAL') {
    return {
      title,
      label: copy.conditionalSupportLabel,
      explanation: copy.conditionalSupportExplanation
    };
  }
  if (['SUPPORT', 'CHALLENGE', 'NEUTRAL', 'INSUFFICIENT_DATA'].includes(key)) {
    return assessmentDimension(
      title,
      key,
      copy.explanations[key] ?? copy.periodSupportExplanation,
      copy
    );
  }
  return assessmentDimension(title, undefined, undefined, copy);
}

function timingAssessment(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (['ACTIVE', 'PARTIALLY_ACTIVE', 'NOT_ACTIVE', 'CHALLENGED', 'SUPPORT', 'MIXED', 'NEUTRAL', 'INSUFFICIENT_DATA'].includes(key)) {
    return assessmentDimension(
      copy.titles.TIMING,
      key,
      copy.explanations[key] ?? copy.timingExplanation,
      copy
    );
  }
  return assessmentDimension(copy.titles.TIMING, undefined, undefined, copy);
}

function confidenceAssessment(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingAssessmentDimension {
  const key = normalize(value);
  if (['HIGH', 'MEDIUM', 'LOW'].includes(key)) {
    return {
      title: copy.titles['EVIDENCE CONFIDENCE'],
      label: copy.confidenceLabels[key],
      explanation: copy.explanations[key]
        ?? copy.confidenceExplanation
    };
  }
  return assessmentDimension(copy.titles['EVIDENCE CONFIDENCE'], undefined, undefined, copy);
}

/** Builds conservative presentation wording only from structured classifications. */
export function buildUserFacingAssessment(input: {
  readonly outcome?: string | null;
  readonly overallStatus?: string | null;
  readonly natalDirection?: string | null;
  readonly natalStrength?: string | null;
  readonly natalPromiseStatus?: string | null;
  readonly dashaDirection?: string | null;
  readonly timingStatus?: string | null;
  readonly confidence?: string | null;
  readonly details?: readonly { readonly label: string; readonly status?: string | null }[];
  readonly copy?: UserFacingCopyProvider;
}): UserFacingAssessment {
  const copy = input.copy ?? ENGLISH_USER_FACING_COPY;
  const foundation = foundationAssessment(input.natalDirection, input.natalStrength, input.natalPromiseStatus, copy);
  const dashaSupport = dashaAssessment(input.dashaDirection, copy);
  const timing = timingAssessment(input.timingStatus, copy);
  const confidence = confidenceAssessment(input.confidence, copy);
  const outcome = input.outcome ?? input.overallStatus;
  const outcomeLabel = safeAssessmentOutcome(outcome, copy);
  const summaryParts = [
    outcomeLabel,
    foundation.label,
    dashaSupport.label,
    timing.label,
    confidence.label
  ];
  return {
    summary: summaryParts.join('. ') + '.',
    outcomeLabel,
    foundation,
    dashaSupport,
    timing,
    confidence,
    detailsLabel: copy.titles['MORE ASSESSMENT DETAIL'],
    details: (input.details ?? []).map(({ label, status }) => ({
      label: copy.detailLabels[normalize(label)] ?? copy.titles['ADDITIONAL ASSESSMENT'],
      explanation: safeAssessmentOutcome(status, copy)
    }))
  };
}

export function combineUserFacingAssessments(
  career: UserFacingAssessment,
  wealth: UserFacingAssessment,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): UserFacingAssessment {
  const combineDimension = (
    title: string,
    careerDimension: UserFacingAssessmentDimension,
    wealthDimension: UserFacingAssessmentDimension
  ): UserFacingAssessmentDimension => {
    if (careerDimension.label === copy.notAssessed && wealthDimension.label === copy.notAssessed) {
      return assessmentDimension(title, undefined, undefined, copy);
    }
    return {
      title,
      label: copy.combinedDimensionLabel(careerDimension.label, wealthDimension.label),
      explanation: copy.combinedDimensionExplanation(careerDimension.explanation, wealthDimension.explanation)
    };
  };
  const foundation = combineDimension(copy.titles.FOUNDATION, career.foundation, wealth.foundation);
  const dashaSupport = combineDimension(copy.titles['DASHA SUPPORT'], career.dashaSupport, wealth.dashaSupport);
  const timing = combineDimension(copy.titles.TIMING, career.timing, wealth.timing);
  const confidence = combineDimension(copy.titles['EVIDENCE CONFIDENCE'], career.confidence, wealth.confidence);
  const details = [
    ...career.details.map((item) => ({ label: copy.domainDetailLabel('career', item.label), explanation: item.explanation })),
    ...wealth.details.map((item) => ({ label: copy.domainDetailLabel('wealth', item.label), explanation: item.explanation }))
  ];
  return {
    summary: copy.combinedSummary(
      copy.domainOutcome(career.outcomeLabel, 'career'),
      copy.domainOutcome(wealth.outcomeLabel, 'wealth')
    ),
    outcomeLabel: copy.combinedSummary(
      copy.domainOutcome(career.outcomeLabel, 'career'),
      copy.domainOutcome(wealth.outcomeLabel, 'wealth')
    ),
    foundation,
    dashaSupport,
    timing,
    confidence,
    detailsLabel: copy.titles['MORE ASSESSMENT DETAIL'],
    details
  };
}
