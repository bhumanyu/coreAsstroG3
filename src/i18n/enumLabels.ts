import type {
  ActivationEffect,
  ConclusionStatus,
  D10ProductResult,
  ProductAvailability,
  ProductCareerAnalyticalAxes,
  ProductCareerEventTimeline,
  ProductCareerAxisStatus,
  ProductCareerOutcomeStatus,
  ProductCareerPathwayAnalysis,
  ProductCareerPathwayModeAssessment,
  ProductCareerOutcomeAnalysis,
  ProductCareerProfessionRankedCandidate,
  ProductConfidence,
  ProductConfidenceCoverageStatus,
  ProductConfidenceLayerState,
  ProductDirection,
  ProductDashaPeriod,
  ProductEvidenceRole,
  ProductStatus,
  ProductWarning,
  PromiseStrength,
  TransitEffect
} from '../product/analysis/productAnalysisTypes';
import type { CareerProfessionStatus } from '../product/analysis/careerQualificationPresentation';
import type {
  WealthLifecycleCandidateAvailability,
  WealthLifecycleEventStatus
} from '../domain/wealth/wealthLifecycleTypes';
import type { WealthFinancialDatum } from '../domain/wealth/wealthFinancialData';
import type { WealthFinancialDataViewModel } from '../product/analysis/wealthViewModel';

type CareerAxisCoverageStatus = ProductCareerAnalyticalAxes['promise']['coverage']['status'];
type QualificationSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
type DashaLevel = ProductDashaPeriod['level'] | 'NONE';
type CareerRiskAssessment = ProductCareerAnalyticalAxes['risk']['result'] extends infer TResult
  ? TResult extends { readonly assessment: infer TAssessment } ? TAssessment : never
  : never;
type CareerSustainabilityAssessment = ProductCareerAnalyticalAxes['sustainability']['result'] extends infer TResult
  ? TResult extends { readonly assessment: infer TAssessment } ? TAssessment : never
  : never;

export const ENUM_LABEL_KEYS = {
  productDirection: {
    SUPPORT: 'productDirection.SUPPORT',
    CHALLENGE: 'productDirection.CHALLENGE',
    NEUTRAL: 'productDirection.NEUTRAL',
    MIXED: 'productDirection.MIXED',
    UNAVAILABLE: 'productDirection.UNAVAILABLE'
  } satisfies Record<ProductDirection, string>,
  productEvidenceRole: {
    PRIMARY: 'productEvidenceRole.PRIMARY',
    SUPPORTING: 'productEvidenceRole.SUPPORTING',
    CHALLENGING: 'productEvidenceRole.CHALLENGING',
    MODIFIER: 'productEvidenceRole.MODIFIER',
    REFINEMENT: 'productEvidenceRole.REFINEMENT',
    CONFLICTING: 'productEvidenceRole.CONFLICTING',
    NEUTRAL: 'productEvidenceRole.NEUTRAL'
  } satisfies Record<ProductEvidenceRole, string>,
  activationEffect: {
    ACTIVATES: 'activationEffect.ACTIVATES',
    PARTIALLY_ACTIVATES: 'activationEffect.PARTIALLY_ACTIVATES',
    DOES_NOT_ACTIVATE: 'activationEffect.DOES_NOT_ACTIVATE',
    CHALLENGES: 'activationEffect.CHALLENGES',
    STRONGLY_SUPPORTS: 'activationEffect.STRONGLY_SUPPORTS',
    SUPPORTS: 'activationEffect.SUPPORTS',
    CONTRADICTS: 'activationEffect.CONTRADICTS',
    UNKNOWN: 'activationEffect.UNKNOWN',
    INSUFFICIENT_DATA: 'activationEffect.INSUFFICIENT_DATA',
    UNAVAILABLE: 'activationEffect.UNAVAILABLE'
  } satisfies Record<ActivationEffect, string>,
  transitEffect: {
    TRIGGER: 'transitEffect.TRIGGER',
    MODIFIER: 'transitEffect.MODIFIER',
    CHALLENGE: 'transitEffect.CHALLENGE',
    NO_MATERIAL_TRIGGER: 'transitEffect.NO_MATERIAL_TRIGGER',
    UNKNOWN: 'transitEffect.UNKNOWN',
    INSUFFICIENT_DATA: 'transitEffect.INSUFFICIENT_DATA',
    UNAVAILABLE: 'transitEffect.UNAVAILABLE'
  } satisfies Record<TransitEffect, string>,
  productConfidence: {
    LOW: 'productConfidence.LOW',
    MEDIUM: 'productConfidence.MEDIUM',
    HIGH: 'productConfidence.HIGH'
  } satisfies Record<ProductConfidence, string>,
  promiseStrength: {
    VERY_STRONG: 'promiseStrength.VERY_STRONG',
    STRONG: 'promiseStrength.STRONG',
    MODERATE: 'promiseStrength.MODERATE',
    WEAK: 'promiseStrength.WEAK',
    VERY_WEAK: 'promiseStrength.VERY_WEAK',
    UNAVAILABLE: 'promiseStrength.UNAVAILABLE'
  } satisfies Record<PromiseStrength, string>,
  careerAxisStatus: {
    AVAILABLE: 'careerAxisStatus.AVAILABLE',
    PARTIAL: 'careerAxisStatus.PARTIAL',
    UNAVAILABLE: 'careerAxisStatus.UNAVAILABLE',
    INSUFFICIENT: 'careerAxisStatus.INSUFFICIENT',
    BLOCKED: 'careerAxisStatus.BLOCKED',
    NOT_APPLICABLE: 'careerAxisStatus.NOT_APPLICABLE'
  } satisfies Record<ProductCareerAxisStatus, string>,
  careerAxisCoverage: {
    COMPLETE: 'careerAxisCoverage.COMPLETE',
    PARTIAL: 'careerAxisCoverage.PARTIAL',
    INSUFFICIENT: 'careerAxisCoverage.INSUFFICIENT'
  } satisfies Record<CareerAxisCoverageStatus, string>,
  confidenceCoverage: {
    COMPLETE: 'confidenceCoverage.COMPLETE',
    PARTIAL: 'confidenceCoverage.PARTIAL',
    INSUFFICIENT: 'confidenceCoverage.INSUFFICIENT',
    UNAVAILABLE: 'confidenceCoverage.UNAVAILABLE',
    BLOCKED: 'confidenceCoverage.BLOCKED',
    NOT_APPLICABLE: 'confidenceCoverage.NOT_APPLICABLE'
  } satisfies Record<ProductConfidenceCoverageStatus, string>,
  confidenceLayerState: {
    AVAILABLE: 'confidenceLayerState.AVAILABLE',
    PARTIAL: 'confidenceLayerState.PARTIAL',
    UNAVAILABLE: 'confidenceLayerState.UNAVAILABLE',
    BLOCKED: 'confidenceLayerState.BLOCKED',
    NOT_APPLICABLE: 'confidenceLayerState.NOT_APPLICABLE'
  } satisfies Record<ProductConfidenceLayerState, string>,
  divisionalRelationship: {
    CONFIRMS: 'divisionalRelationship.CONFIRMS',
    PARTIALLY_CONFIRMS: 'divisionalRelationship.PARTIALLY_CONFIRMS',
    MODIFIES: 'divisionalRelationship.MODIFIES',
    CONFLICTS: 'divisionalRelationship.CONFLICTS',
    UNAVAILABLE: 'divisionalRelationship.UNAVAILABLE'
  } satisfies Record<D10ProductResult['relationship'], string>,
  qualificationSeverity: {
    LOW: 'qualificationSeverity.LOW',
    MEDIUM: 'qualificationSeverity.MEDIUM',
    HIGH: 'qualificationSeverity.HIGH'
  } satisfies Record<QualificationSeverity, string>,
  diagnosticSeverity: {
    INFO: 'diagnosticSeverity.INFO',
    WARNING: 'diagnosticSeverity.WARNING',
    ERROR: 'diagnosticSeverity.ERROR'
  } satisfies Record<NonNullable<ProductWarning['severity']>, string>,
  dashaLevel: {
    MD: 'dashaLevel.MD',
    AD: 'dashaLevel.AD',
    PD: 'dashaLevel.PD',
    NONE: 'dashaLevel.NONE'
  } satisfies Record<DashaLevel, string>,
  professionStatus: {
    COMPLETE: 'professionStatus.COMPLETE',
    PARTIAL: 'professionStatus.PARTIAL',
    INSUFFICIENT_DATA: 'professionStatus.INSUFFICIENT_DATA'
  } satisfies Record<CareerProfessionStatus, string>,
  professionCandidateStatus: {
    QUALIFIED: 'professionCandidateStatus.QUALIFIED',
    PARTIAL: 'professionCandidateStatus.PARTIAL',
    CONFLICTED: 'professionCandidateStatus.CONFLICTED',
    NOT_PROVIDED: 'professionCandidateStatus.NOT_PROVIDED',
    UNAVAILABLE: 'professionCandidateStatus.UNAVAILABLE'
  } satisfies Record<ProductCareerProfessionRankedCandidate['d10Status'], string>,
  productStatus: {
    READY: 'productStatus.READY',
    PARTIAL: 'productStatus.PARTIAL',
    ERROR: 'productStatus.ERROR'
  } satisfies Record<ProductStatus, string>,
  productAvailability: {
    AVAILABLE: 'productAvailability.AVAILABLE',
    UNAVAILABLE: 'productAvailability.UNAVAILABLE',
    CONDITIONAL: 'productAvailability.CONDITIONAL',
    PARTIAL: 'productAvailability.PARTIAL'
  } satisfies Record<ProductAvailability, string>,
  conclusionStatus: {
    STRONGLY_SUPPORTED: 'conclusionStatus.STRONGLY_SUPPORTED',
    SUPPORTED: 'conclusionStatus.SUPPORTED',
    MIXED: 'conclusionStatus.MIXED',
    CHALLENGED: 'conclusionStatus.CHALLENGED',
    LIMITED: 'conclusionStatus.LIMITED',
    UNAVAILABLE: 'conclusionStatus.UNAVAILABLE'
  } satisfies Record<ConclusionStatus, string>,
  wealthDimensionStatus: {
    STRONGLY_SUPPORTED: 'wealthDimensionStatus.STRONGLY_SUPPORTED',
    SUPPORTED: 'wealthDimensionStatus.SUPPORTED',
    MIXED: 'wealthDimensionStatus.MIXED',
    CHALLENGED: 'wealthDimensionStatus.CHALLENGED',
    LIMITED: 'wealthDimensionStatus.LIMITED',
    UNAVAILABLE: 'wealthDimensionStatus.UNAVAILABLE',
    INSUFFICIENT_DATA: 'wealthDimensionStatus.INSUFFICIENT_DATA'
  } satisfies Record<ConclusionStatus | 'INSUFFICIENT_DATA', string>,
  careerOutcomeStatus: {
    CANDIDATES_AVAILABLE: 'careerOutcomeStatus.CANDIDATES_AVAILABLE',
    CONDITIONAL: 'careerOutcomeStatus.CONDITIONAL',
    PARTIAL: 'careerOutcomeStatus.PARTIAL',
    UNRESOLVED: 'careerOutcomeStatus.UNRESOLVED',
    INSUFFICIENT: 'careerOutcomeStatus.INSUFFICIENT'
  } satisfies Record<ProductCareerOutcomeStatus, string>,
  careerOutcomeType: {
    CAREER_GROWTH_OR_EXPANSION: 'careerOutcomeType.CAREER_GROWTH_OR_EXPANSION',
    ROLE_OR_AUTHORITY_EXPANSION: 'careerOutcomeType.ROLE_OR_AUTHORITY_EXPANSION',
    EMPLOYMENT_OR_SERVICE_OPPORTUNITY: 'careerOutcomeType.EMPLOYMENT_OR_SERVICE_OPPORTUNITY',
    TECHNICAL_SPECIALIZATION_OR_SKILL_DEVELOPMENT: 'careerOutcomeType.TECHNICAL_SPECIALIZATION_OR_SKILL_DEVELOPMENT',
    INDEPENDENT_OR_BUSINESS_ACTIVITY: 'careerOutcomeType.INDEPENDENT_OR_BUSINESS_ACTIVITY',
    PUBLIC_OR_INSTITUTIONAL_CAREER: 'careerOutcomeType.PUBLIC_OR_INSTITUTIONAL_CAREER',
    GENERAL_CAREER_OPPORTUNITY: 'careerOutcomeType.GENERAL_CAREER_OPPORTUNITY'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['outcomeType'], string>,
  careerOutcomeQualification: {
    SUPPORTED_CANDIDATE: 'careerOutcomeQualification.SUPPORTED_CANDIDATE',
    CONDITIONALLY_SUPPORTED_CANDIDATE: 'careerOutcomeQualification.CONDITIONALLY_SUPPORTED_CANDIDATE'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['qualification'], string>,
  careerOutcomeProfessionAnalysis: {
    COMPLETE: 'careerOutcomeProfessionAnalysis.COMPLETE',
    PARTIAL: 'careerOutcomeProfessionAnalysis.PARTIAL',
    INSUFFICIENT_DATA: 'careerOutcomeProfessionAnalysis.INSUFFICIENT_DATA',
    NOT_PROVIDED: 'careerOutcomeProfessionAnalysis.NOT_PROVIDED'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['executionConditions']['professionAnalysisStatus'], string>,
  careerOutcomeD10Qualification: {
    QUALIFIED: 'careerOutcomeD10Qualification.QUALIFIED',
    PARTIAL: 'careerOutcomeD10Qualification.PARTIAL',
    UNAVAILABLE: 'careerOutcomeD10Qualification.UNAVAILABLE'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['executionConditions']['d10Qualification'], string>,
  careerCounterIndicationSeverity: {
    NONE: 'careerCounterIndicationSeverity.NONE',
    LOW: 'careerCounterIndicationSeverity.LOW',
    MODERATE: 'careerCounterIndicationSeverity.MODERATE',
    HIGH: 'careerCounterIndicationSeverity.HIGH'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['counterIndications']['severity'], string>,
  careerEventTimelineStatus: {
    GENERIC_WINDOWS_ONLY: 'careerEventTimelineStatus.GENERIC_WINDOWS_ONLY',
    PARTIAL: 'careerEventTimelineStatus.PARTIAL',
    UNAVAILABLE: 'careerEventTimelineStatus.UNAVAILABLE'
  } satisfies Record<ProductCareerEventTimeline['status'], string>,
  careerPathwayStatus: {
    AVAILABLE: 'careerPathwayStatus.AVAILABLE',
    PARTIAL: 'careerPathwayStatus.PARTIAL',
    UNAVAILABLE: 'careerPathwayStatus.UNAVAILABLE',
    UNRESOLVED: 'careerPathwayStatus.UNRESOLVED',
    INSUFFICIENT_DATA: 'careerPathwayStatus.INSUFFICIENT_DATA'
  } satisfies Record<ProductCareerPathwayAnalysis['status'], string>,
  careerPathwayVerdict: {
    DUAL_POTENTIAL: 'careerPathwayVerdict.DUAL_POTENTIAL',
    CONDITIONAL_DUAL_POTENTIAL: 'careerPathwayVerdict.CONDITIONAL_DUAL_POTENTIAL',
    EMPLOYMENT_POTENTIAL_IDENTIFIED: 'careerPathwayVerdict.EMPLOYMENT_POTENTIAL_IDENTIFIED',
    INDEPENDENT_POTENTIAL_IDENTIFIED: 'careerPathwayVerdict.INDEPENDENT_POTENTIAL_IDENTIFIED',
    NO_MODE_CANDIDATE: 'careerPathwayVerdict.NO_MODE_CANDIDATE',
    UNRESOLVED: 'careerPathwayVerdict.UNRESOLVED',
    INSUFFICIENT_DATA: 'careerPathwayVerdict.INSUFFICIENT_DATA'
  } satisfies Record<ProductCareerPathwayAnalysis['verdict'], string>,
  careerPathwayModeStatus: {
    SUPPORTED_CANDIDATE: 'careerPathwayModeStatus.SUPPORTED_CANDIDATE',
    CONDITIONAL_CANDIDATE: 'careerPathwayModeStatus.CONDITIONAL_CANDIDATE',
    NOT_IDENTIFIED: 'careerPathwayModeStatus.NOT_IDENTIFIED'
  } satisfies Record<ProductCareerPathwayModeAssessment['status'], string>,
  careerPathwayCandidateQualification: {
    SUPPORTED_CANDIDATE: 'careerPathwayCandidateQualification.SUPPORTED_CANDIDATE',
    CONDITIONALLY_SUPPORTED_CANDIDATE: 'careerPathwayCandidateQualification.CONDITIONALLY_SUPPORTED_CANDIDATE'
  } satisfies Record<ProductCareerPathwayAnalysis['employment']['candidates'][number]['qualification'], string>,
  careerPathwayAssessment: {
    NOT_ASSESSED: 'careerPathwayAssessment.NOT_ASSESSED'
  } satisfies Record<'NOT_ASSESSED', string>,
  wealthFinancialDataStatus: {
    AVAILABLE: 'wealthFinancialDataStatus.AVAILABLE',
    UNAVAILABLE: 'wealthFinancialDataStatus.UNAVAILABLE'
  } satisfies Record<WealthFinancialDataViewModel['status'], string>,
  wealthFinancialSourceClassification: {
    ASTROLOGICAL_INDICATOR: 'wealthFinancialSourceClassification.ASTROLOGICAL_INDICATOR',
    USER_REPORTED_FINANCIAL_FACT: 'wealthFinancialSourceClassification.USER_REPORTED_FINANCIAL_FACT',
    CALCULATED_FINANCIAL_METRIC: 'wealthFinancialSourceClassification.CALCULATED_FINANCIAL_METRIC',
    CONNECTED_FINANCIAL_SOURCE: 'wealthFinancialSourceClassification.CONNECTED_FINANCIAL_SOURCE',
    UNAVAILABLE: 'wealthFinancialSourceClassification.UNAVAILABLE'
  } satisfies Record<WealthFinancialDatum['sourceClassification'], string>,
  wealthLifecycleAvailability: {
    CANDIDATES_AVAILABLE: 'wealthLifecycleAvailability.CANDIDATES_AVAILABLE',
    CONDITIONAL: 'wealthLifecycleAvailability.CONDITIONAL',
    PARTIAL: 'wealthLifecycleAvailability.PARTIAL',
    UNRESOLVED: 'wealthLifecycleAvailability.UNRESOLVED',
    INSUFFICIENT: 'wealthLifecycleAvailability.INSUFFICIENT',
    BLOCKED: 'wealthLifecycleAvailability.BLOCKED'
  } satisfies Record<WealthLifecycleCandidateAvailability, string>,
  wealthLifecycleEventStatus: {
    CANDIDATE: 'wealthLifecycleEventStatus.CANDIDATE',
    CONDITIONAL: 'wealthLifecycleEventStatus.CONDITIONAL',
    CONFLICTED: 'wealthLifecycleEventStatus.CONFLICTED',
    UNAVAILABLE: 'wealthLifecycleEventStatus.UNAVAILABLE'
  } satisfies Record<WealthLifecycleEventStatus, string>,
  careerRiskAssessment: {
    ADVERSE_EVIDENCE_PRESENT: 'careerRiskAssessment.ADVERSE_EVIDENCE_PRESENT',
    NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES: 'careerRiskAssessment.NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES'
  } satisfies Record<CareerRiskAssessment, string>,
  careerSustainabilityAssessment: {
    NOT_ASSESSED: 'careerSustainabilityAssessment.NOT_ASSESSED'
  } satisfies Record<CareerSustainabilityAssessment, string>,
  guarantee: {
    NONE: 'guarantee.NONE'
  } satisfies Record<'NONE', string>
} as const;

export type EnumLabelFamily = keyof typeof ENUM_LABEL_KEYS;
export type EnumLabelTranslator = (key: string) => string;

export function enumLabel(
  t: EnumLabelTranslator,
  family: EnumLabelFamily,
  value: string | null | undefined
): string {
  if (value === null || value === undefined) return '';
  const key = (ENUM_LABEL_KEYS[family] as Readonly<Record<string, string>>)[value];
  return key ? t(key) : value;
}
