import type {
  CareerFinalConfidence,
  CareerFinalDirection,
  CareerFinalStatus,
  CareerFinalStrength,
  CareerFinalTimingStatus
} from '../../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  FinalDomainConfidence,
  FinalDomainStatus,
  SynthesisAxisStatus
} from '../../domain/careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import type { WealthDimension } from '../../domain/wealth/wealthTypes';
import type {
  ActivationEffect,
  ConclusionStatus,
  ProductAvailability,
  ProductDirection,
  ProductEvidenceRole,
  ProductTemporalRelation,
  PromiseStrength,
  TransitEffect
} from '../analysis/productAnalysisTypes';
import { HINDI_USER_FACING_COPY } from './userFacingInterpretation.hi';

export { HINDI_USER_FACING_COPY };

/**
 * Shared user-facing interpretation for product-layer classifications.
 *
 * Presentation-only: this module never changes canonical values or derives
 * astrological conclusions. Copy is isolated behind a provider so presentation
 * wording can be localized without changing canonical classification values.
 */
type ClassificationLabelKey =
  | CareerFinalConfidence
  | CareerFinalDirection
  | CareerFinalStatus
  | CareerFinalStrength
  | CareerFinalTimingStatus
  | FinalDomainConfidence
  | FinalDomainStatus
  | SynthesisAxisStatus
  | ProductAvailability
  | ProductDirection
  | ProductEvidenceRole
  | ProductTemporalRelation
  | PromiseStrength
  | ConclusionStatus
  | ActivationEffect
  | TransitEffect
  | 'INSUFFICIENT'
  | 'BLOCKED'
  | 'NOT_APPLICABLE'
  | 'NOT_ASSESSED'
  | 'NOT_PROVIDED'
  | 'COMPLETE'
  | 'READY'
  | 'ERROR'
  | 'IDLE'
  | 'LOADING'
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'DOES_NOT_ACTIVATE'
  | 'CHALLENGES'
  | 'STRONGLY_SUPPORTS'
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'UNKNOWN'
  | 'TRIGGER'
  | 'MODIFIER'
  | 'NO_MATERIAL_TRIGGER'
  | 'NONE'
  | 'MINIMAL'
  | 'MILD'
  | 'CRITICAL'
  | 'CONFIRMS'
  | 'PARTIALLY_CONFIRMS'
  | 'MODIFIES'
  | 'CONFLICTS';

const LABELS: Readonly<Record<ClassificationLabelKey, string>> = Object.freeze({
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

type ExplanationKey =
  | SynthesisAxisStatus
  | FinalDomainConfidence
  | CareerFinalTimingStatus
  | 'UNAVAILABLE'
  | 'BLOCKED'
  | 'PARTIAL'
  | 'STRONG';

const EXPLANATIONS: Readonly<Record<ExplanationKey, string>> = Object.freeze({
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
  STRONG: 'The underlying natal indicators are pronounced. This describes chart foundation, not current timing or certainty of a particular event.',
  SUPPORT: 'Supportive indications are present in this assessment.',
  CHALLENGE: 'Challenging indications are present in this assessment.',
  ACTIVE: 'The selected period is active in the timing assessment.',
  PARTIALLY_ACTIVE: 'The selected period is partially active in the timing assessment.',
  CHALLENGED: 'The selected period includes challenging timing indications.',
  UNKNOWN: 'The timing effect could not be determined from available information.'
});

export interface UserFacingCopyProvider {
  readonly labels: Readonly<Record<ClassificationLabelKey, string>>;
  readonly assessmentLabels: Readonly<Record<'MIXED', string>>;
  readonly explanations: Readonly<Record<ExplanationKey, string>>;
  readonly outcomes: Readonly<Record<AssessmentOutcomeKey, string>>;
  readonly directionLabels: Readonly<Record<FoundationDirectionKey, string>>;
  readonly confidenceLabels: Readonly<Record<ConfidenceKey, string>>;
  readonly confidenceUnavailable: string;
  readonly strengthLabels: Readonly<Record<FoundationStrengthKey, string>>;
  readonly foundationUnavailable: string;
  readonly wealthFoundationLabels: Readonly<Record<WealthFoundationKey, string>>;
  readonly detailLabels: Readonly<Record<DetailLabelKey, string>>;
  readonly titles: Readonly<Record<TitleKey, string>>;
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
  readonly additionalDetailLabel: (index: number) => string;
}

type AssessmentOutcomeKey =
  | FinalDomainStatus
  | CareerFinalStatus
  | ConclusionStatus
  | SynthesisAxisStatus
  | ProductAvailability
  | 'UNDETERMINED';
type FoundationDirectionKey = SynthesisAxisStatus | 'CONDITIONAL' | 'UNAVAILABLE';
type FoundationStrengthKey = CareerFinalStrength;
type WealthFoundationKey = FinalDomainStatus;
type ConfidenceKey = CareerFinalConfidence | FinalDomainConfidence;
type DetailLabelKey =
  | WealthDimension
  | 'FINAL OUTCOME'
  | 'INTEGRATED DIRECTION'
  | 'INTEGRATED STRENGTH';
type TitleKey =
  | 'FOUNDATION'
  | 'DASHA SUPPORT'
  | 'TIMING'
  | 'EVIDENCE CONFIDENCE'
  | 'MORE ASSESSMENT DETAIL'
  | 'ADDITIONAL ASSESSMENT';
type UserFacingCopyMapKey =
  | 'labels'
  | 'assessmentLabels'
  | 'explanations'
  | 'outcomes'
  | 'directionLabels'
  | 'confidenceLabels'
  | 'strengthLabels'
  | 'wealthFoundationLabels'
  | 'detailLabels'
  | 'titles';
type UserFacingCopyStringKey =
  | 'confidenceUnavailable'
  | 'foundationUnavailable'
  | 'notAssessed'
  | 'notAvailable'
  | 'notAssessedExplanation'
  | 'genericExplanation'
  | 'conditionalSupportLabel'
  | 'conditionalSupportExplanation'
  | 'timingExplanation'
  | 'confidenceExplanation'
  | 'periodSupportExplanation';
type UserFacingCopyFunctionKey =
  | 'mixedFoundationLabel'
  | 'mixedFoundationExplanation'
  | 'combinedFoundationLabel'
  | 'combinedFoundationExplanation'
  | 'foundationDirectionExplanation'
  | 'foundationStrengthExplanation'
  | 'combinedDimensionLabel'
  | 'combinedDimensionExplanation'
  | 'domainDetailLabel'
  | 'domainOutcome'
  | 'combinedSummary'
  | 'wealthFoundationExplanation'
  | 'additionalDetailLabel';

const englishUserFacingCopy: UserFacingCopyProvider = {
  labels: LABELS,
  assessmentLabels: Object.freeze({ MIXED: 'Mixed indications' } satisfies Record<'MIXED', string>),
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
  } satisfies Record<AssessmentOutcomeKey, string>),
  directionLabels: Object.freeze({
    SUPPORT: 'supportive indications',
    CHALLENGE: 'challenging indications',
    MIXED: 'mixed indications',
    NEUTRAL: 'neutral indications',
    INSUFFICIENT_DATA: 'not enough information',
    CONDITIONAL: 'conditional indications',
    UNAVAILABLE: 'unavailable indications'
  } satisfies Record<FoundationDirectionKey, string>),
  confidenceLabels: Object.freeze({
    HIGH: 'High confidence',
    MEDIUM: 'Medium confidence',
    LOW: 'Low confidence'
  } satisfies Record<ConfidenceKey, string>),
  confidenceUnavailable: 'Confidence unavailable',
  strengthLabels: Object.freeze({
    VERY_STRONG: 'Very strong foundation',
    STRONG: 'Strong foundation',
    MODERATE: 'Moderate foundation',
    WEAK: 'Limited foundation',
    VERY_WEAK: 'Very limited foundation',
    MIXED: 'Mixed foundation',
    UNDETERMINED: 'Not assessed'
  } satisfies Record<FoundationStrengthKey, string>),
  foundationUnavailable: 'Foundation not assessed',
  wealthFoundationLabels: Object.freeze({
    VERY_STRONG: 'Very strong foundation',
    STRONG: 'Strong foundation',
    MODERATE: 'Moderate foundation',
    MIXED: 'Mixed foundation',
    CHALLENGED: 'Challenged foundation',
    INSUFFICIENT_DATA: 'Foundation not assessed'
  } satisfies Record<WealthFoundationKey, string>),
  detailLabels: Object.freeze({
    'FINAL OUTCOME': 'Final outcome',
    'INTEGRATED DIRECTION': 'Integrated direction',
    'INTEGRATED STRENGTH': 'Integrated strength',
    ACCUMULATION: 'Accumulation',
    GAINS: 'Gains',
    FORTUNE: 'Fortune',
    SPECULATION: 'Speculation'
  } satisfies Record<DetailLabelKey, string>),
  titles: Object.freeze({
    FOUNDATION: 'Foundation',
    'DASHA SUPPORT': 'Dasha support',
    TIMING: 'Timing',
    'EVIDENCE CONFIDENCE': 'Evidence confidence',
    'MORE ASSESSMENT DETAIL': 'More assessment detail',
    'ADDITIONAL ASSESSMENT': 'Additional assessment'
  } satisfies Record<TitleKey, string>),
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
  },
  additionalDetailLabel: (index) => `Additional assessment (${index})`
};

export const ENGLISH_USER_FACING_COPY: UserFacingCopyProvider = Object.freeze(englishUserFacingCopy);

export const USER_FACING_COPY_PROVIDERS: readonly UserFacingCopyProvider[] = Object.freeze([
  ENGLISH_USER_FACING_COPY,
  HINDI_USER_FACING_COPY
]);

export function resolveUserFacingCopy(language: string): UserFacingCopyProvider {
  return language.trim().toLowerCase().split(/[-_]/, 1)[0] === 'hi'
    ? HINDI_USER_FACING_COPY
    : ENGLISH_USER_FACING_COPY;
}

export const USER_FACING_COPY_CONTRACT = Object.freeze({
  keys: Object.freeze({
    labels: Object.keys(LABELS),
    assessmentLabels: ['MIXED'],
    outcomes: Object.keys(englishUserFacingCopy.outcomes),
    directionLabels: Object.keys(englishUserFacingCopy.directionLabels),
    confidenceLabels: Object.keys(englishUserFacingCopy.confidenceLabels),
    strengthLabels: Object.keys(englishUserFacingCopy.strengthLabels),
    wealthFoundationLabels: Object.keys(englishUserFacingCopy.wealthFoundationLabels),
    detailLabels: Object.keys(englishUserFacingCopy.detailLabels),
    titles: Object.keys(englishUserFacingCopy.titles),
    explanations: Object.keys(EXPLANATIONS)
  } satisfies Record<UserFacingCopyMapKey, readonly string[]>),
  strings: Object.freeze([
    'confidenceUnavailable',
    'foundationUnavailable',
    'notAssessed',
    'notAvailable',
    'notAssessedExplanation',
    'genericExplanation',
    'conditionalSupportLabel',
    'conditionalSupportExplanation',
    'timingExplanation',
    'confidenceExplanation',
    'periodSupportExplanation'
  ] satisfies readonly UserFacingCopyStringKey[]),
  functions: Object.freeze({
    mixedFoundationLabel: (copy: UserFacingCopyProvider) => copy.mixedFoundationLabel('Strong foundation'),
    mixedFoundationExplanation: (copy: UserFacingCopyProvider) => copy.mixedFoundationExplanation('Strong foundation'),
    combinedFoundationLabel: (copy: UserFacingCopyProvider) => copy.combinedFoundationLabel('Strong foundation', 'mixed indications'),
    combinedFoundationExplanation: (copy: UserFacingCopyProvider) => copy.combinedFoundationExplanation('Strong foundation', 'MIXED'),
    foundationDirectionExplanation: (copy: UserFacingCopyProvider) => copy.foundationDirectionExplanation('SUPPORT'),
    foundationStrengthExplanation: (copy: UserFacingCopyProvider) => copy.foundationStrengthExplanation('STRONG'),
    combinedDimensionLabel: (copy: UserFacingCopyProvider) => copy.combinedDimensionLabel('Career', 'Wealth'),
    combinedDimensionExplanation: (copy: UserFacingCopyProvider) => copy.combinedDimensionExplanation('Career is assessed.', 'Wealth is assessed.'),
    domainDetailLabel: (copy: UserFacingCopyProvider) => copy.domainDetailLabel('career', 'Foundation'),
    domainOutcome: (copy: UserFacingCopyProvider) => copy.domainOutcome('Supportive outlook', 'career'),
    combinedSummary: (copy: UserFacingCopyProvider) => copy.combinedSummary('Career outlook', 'Wealth outlook'),
    wealthFoundationExplanation: (copy: UserFacingCopyProvider) => copy.wealthFoundationExplanation('STRONG'),
    additionalDetailLabel: (copy: UserFacingCopyProvider) => copy.additionalDetailLabel(1)
  } satisfies Record<UserFacingCopyFunctionKey, (copy: UserFacingCopyProvider) => string>)
});

function normalize(value?: string | null): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function lookupCopyValue<Key extends string>(
  map: Readonly<Record<Key, string>>,
  key: string
): string | undefined {
  return Object.prototype.hasOwnProperty.call(map, key)
    ? map[key as Key]
    : undefined;
}

/** Returns a label for known values and a conservative fallback otherwise. */
export function formatUserFacingClassification(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  const key = normalize(value);
  if (!key) return copy.notAvailable;
  return lookupCopyValue(copy.labels, key) ?? copy.notAssessed;
}

/** Explanation for classifications whose meaning is easy to misinterpret. */
export function explainUserFacingClassification(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string | undefined {
  return lookupCopyValue(copy.explanations, normalize(value));
}

/** Domain outcome, separate from strength and evidence confidence. */
export function formatOutcome(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  return lookupCopyValue(copy.outcomes, normalize(value)) ?? copy.notAssessed;
}

/** Confidence describes evidence completeness, not astrological strength. */
export function formatEvidenceConfidence(
  value?: string | null,
  copy: UserFacingCopyProvider = ENGLISH_USER_FACING_COPY
): string {
  const key = normalize(value);
  if (!key || key === 'UNAVAILABLE') return copy.confidenceUnavailable;
  return ['HIGH', 'MEDIUM', 'LOW'].includes(key)
    ? lookupCopyValue(copy.labels, key) ?? copy.notAssessed
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
  return lookupCopyValue(copy.strengthLabels, key)
    ?? lookupCopyValue(copy.labels, key)
    ?? copy.notAssessed;
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
  const label = lookupCopyValue(copy.labels, key);
  if (!key || !label) {
    return { title, label: copy.notAssessed, explanation: copy.notAssessedExplanation };
  }
  return {
    title,
    label: lookupCopyValue(copy.assessmentLabels, key) ?? label,
    explanation: explanation ?? lookupCopyValue(copy.explanations, key) ?? copy.genericExplanation
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

  const promiseLabel = lookupCopyValue(copy.wealthFoundationLabels, promiseKey);
  if (promiseKey && promiseLabel) {
    return {
      title,
      label: promiseLabel,
      explanation: copy.wealthFoundationExplanation(promiseKey)
    };
  }

  const strengthLabel = lookupCopyValue(copy.strengthLabels, strengthKey);
  const directionLabel = lookupCopyValue(copy.directionLabels, directionKey);

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
        explanation: lookupCopyValue(copy.explanations, strengthKey)
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
      lookupCopyValue(copy.explanations, key) ?? copy.periodSupportExplanation,
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
      lookupCopyValue(copy.explanations, key) ?? copy.timingExplanation,
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
      label: lookupCopyValue(copy.confidenceLabels, key) ?? copy.notAssessed,
      explanation: lookupCopyValue(copy.explanations, key)
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
    details: (input.details ?? []).map(({ label, status }, index) => ({
      // Unknown classifications stay hidden but indexed so multiple details remain distinguishable.
      label: lookupCopyValue(copy.detailLabels, normalize(label)) ?? copy.additionalDetailLabel(index + 1),
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
