import type {
  ActivationEffect,
  ConclusionStatus,
  D10ProductResult,
  ProductAvailability,
  ProductCareerAnalyticalAxes,
  ProductCareerEventTimeline,
  ProductCareerEventSpecificTaxonomyItem,
  ProductCareerAxisStatus,
  ProductCareerOutcomeStatus,
  ProductCareerPathwayAnalysis,
  ProductCareerPathwayModeAssessment,
  ProductCareerOutcomeAnalysis,
  ProductCareerProfessionRankedCandidate,
  ProductCareerProfessionConfidence,
  ProductCareerProfessionRanking,
  ProductConfidence,
  ProductConfidenceCoverageStatus,
  ProductConfidenceLayerState,
  ProductDirection,
  ProductDashaPeriod,
  ProductDashaPeriodOptions,
  ProductSelectedPeriodResult,
  ProductSelectedPeriodSynthesis,
  ProductSynthesisEvidenceReference,
  ProductSynthesisProvenance,
  ProductSynthesisWealthDimensionRow,
  ProductQualificationStatus,
  AiProductState,
  ProductEvidenceRole,
  ProductStatus,
  ProductTemporalRelation,
  ProductWarning,
  ReasoningNode,
  AstrologicalSpeculativePropensity,
  AstrologicalSpeculativePropensityProduct,
  PromiseStrength,
  TransitEffect
} from '../product/analysis/productAnalysisTypes';
import type {
  CareerProfessionBasis,
  CareerProfessionDomain,
  CareerProfessionEvidence,
  CareerProfessionFamily
} from '../domain/career/careerProfession/careerProfessionTypes';
import type { CareerExpressionType } from '../domain/career/careerExpression/careerExpressionTypes';
import type { CareerExpressionQualificationStatus } from '../domain/career/careerExpression/careerExpressionTypes';
import type { CareerMechanismType } from '../domain/career/careerMechanism/careerMechanismTypes';
import type { AiExplanationResult } from '../ai/product/aiExplanationTypes';
import type { CareerProfessionStatus } from '../product/analysis/careerQualificationPresentation';
import type {
  WealthLifecycleCandidateAvailability,
  WealthLifecycleEventType,
  WealthLifecycleEventStatus
} from '../domain/wealth/wealthLifecycleTypes';
import type { WealthFinancialDatum } from '../domain/wealth/wealthFinancialData';
import type { WealthFinancialDataViewModel } from '../product/analysis/wealthViewModel';
import type { FunctionalNature } from '../engine/functionalNature/functionalNature';
import type { YogaStrengthLevel } from '../engine/yoga/yogaTypes';
import type { YogaReportItem } from '../engine/fullNatalAnalysis/fullNatalAnalysisTypes';
import type {
  CareerNatalPromise,
  CareerEvidenceFamilySummary,
  ThemeEvidenceEffect,
  ThemeEvidencePriority,
  ThemeEvidenceStrength
} from '../engine/themeInterpretation/themeInterpretationTypes';

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
    HIGH: 'productConfidence.HIGH',
    UNAVAILABLE: 'productConfidence.UNAVAILABLE'
  } satisfies Record<ProductConfidence | ProductCareerProfessionConfidence, string>,
  functionalNature: {
    BENEFIC: 'functionalNature.BENEFIC',
    MALEFIC: 'functionalNature.MALEFIC',
    MIXED: 'functionalNature.MIXED',
    NEUTRAL: 'functionalNature.NEUTRAL'
  } satisfies Record<FunctionalNature, string>,
  themeEvidenceEffect: {
    SUPPORT: 'themeEvidenceEffect.SUPPORT',
    CHALLENGE: 'themeEvidenceEffect.CHALLENGE',
    NEUTRAL: 'themeEvidenceEffect.NEUTRAL'
  } satisfies Record<ThemeEvidenceEffect, string>,
  themeEvidenceGroupStatus: {
    SUPPORT: 'themeEvidenceGroupStatus.SUPPORT',
    CHALLENGE: 'themeEvidenceGroupStatus.CHALLENGE',
    MIXED: 'themeEvidenceGroupStatus.MIXED',
    NEUTRAL: 'themeEvidenceGroupStatus.NEUTRAL'
  } satisfies Record<CareerEvidenceFamilySummary['status'], string>,
  themeEvidencePriority: {
    PRIMARY: 'themeEvidencePriority.PRIMARY',
    SECONDARY: 'themeEvidencePriority.SECONDARY',
    CONFIRMATORY: 'themeEvidencePriority.CONFIRMATORY',
    TIMING: 'themeEvidencePriority.TIMING'
  } satisfies Record<ThemeEvidencePriority, string>,
  themeEvidenceStrength: {
    WEAK: 'themeEvidenceStrength.WEAK',
    MODERATE: 'themeEvidenceStrength.MODERATE',
    STRONG: 'themeEvidenceStrength.STRONG'
  } satisfies Record<ThemeEvidenceStrength, string>,
  themePromiseStatus: {
    STRONG: 'themePromiseStatus.STRONG',
    SUPPORTED: 'themePromiseStatus.SUPPORTED',
    MIXED: 'themePromiseStatus.MIXED',
    ADVERSE: 'themePromiseStatus.ADVERSE',
    UNAVAILABLE: 'themePromiseStatus.UNAVAILABLE'
  } satisfies Record<CareerNatalPromise['status'], string>,
  yogaFinalStatus: {
    PRESENT: 'yogaFinalStatus.PRESENT',
    WEAKENED: 'yogaFinalStatus.WEAKENED',
    STRONG: 'yogaFinalStatus.STRONG',
    CANCELLED: 'yogaFinalStatus.CANCELLED'
  } satisfies Record<NonNullable<YogaReportItem['finalStatus']>, string>,
  yogaStrength: {
    VERY_WEAK: 'yogaStrength.VERY_WEAK',
    WEAK: 'yogaStrength.WEAK',
    MODERATE: 'yogaStrength.MODERATE',
    STRONG: 'yogaStrength.STRONG',
    VERY_STRONG: 'yogaStrength.VERY_STRONG'
  } satisfies Record<YogaStrengthLevel, string>,
  dashaAvailability: {
    AVAILABLE: 'dashaAvailability.AVAILABLE',
    UNAVAILABLE: 'dashaAvailability.UNAVAILABLE',
    CONDITIONAL: 'dashaAvailability.CONDITIONAL',
    PARTIAL: 'dashaAvailability.PARTIAL'
  } satisfies Record<ProductAvailability, string>,
  temporalRelation: {
    PAST: 'temporalRelation.PAST',
    CURRENT: 'temporalRelation.CURRENT',
    FUTURE: 'temporalRelation.FUTURE',
    UNKNOWN: 'temporalRelation.UNKNOWN'
  } satisfies Record<ProductTemporalRelation, string>,
  selectedPeriodDiagnostic: {
    INVALID_MAHADASHA_INTERVAL: 'selectedPeriodDiagnostic.INVALID_MAHADASHA_INTERVAL',
    INVALID_ANTARDASHA_INTERVAL: 'selectedPeriodDiagnostic.INVALID_ANTARDASHA_INTERVAL',
    ANTARDASHA_OUTSIDE_MAHADASHA: 'selectedPeriodDiagnostic.ANTARDASHA_OUTSIDE_MAHADASHA',
    DUPLICATE_MAHADASHA_ID: 'selectedPeriodDiagnostic.DUPLICATE_MAHADASHA_ID',
    DUPLICATE_ANTARDASHA_ID: 'selectedPeriodDiagnostic.DUPLICATE_ANTARDASHA_ID',
    NON_CANONICAL_DATE_FORMAT: 'selectedPeriodDiagnostic.NON_CANONICAL_DATE_FORMAT'
  } satisfies Partial<Record<ProductDashaPeriodOptions['diagnostics'][number], string>>,
  professionDomain: {
    TECHNOLOGY: 'professionDomain.TECHNOLOGY',
    FINANCE: 'professionDomain.FINANCE',
    HEALTHCARE: 'professionDomain.HEALTHCARE',
    EDUCATION: 'professionDomain.EDUCATION',
    LEADERSHIP: 'professionDomain.LEADERSHIP',
    COMMUNICATION: 'professionDomain.COMMUNICATION',
    RESEARCH: 'professionDomain.RESEARCH',
    SERVICE: 'professionDomain.SERVICE',
    INSTITUTIONAL: 'professionDomain.INSTITUTIONAL',
    FOREIGN: 'professionDomain.FOREIGN',
    REMOTE: 'professionDomain.REMOTE'
  } satisfies Record<CareerProfessionDomain, string>,
  professionFamily: {
    TECHNICAL_LEADERSHIP: 'professionFamily.TECHNICAL_LEADERSHIP',
    FINANCIAL_SERVICES: 'professionFamily.FINANCIAL_SERVICES',
    MEDICAL_PRACTICE: 'professionFamily.MEDICAL_PRACTICE',
    ACADEMIC_TEACHING: 'professionFamily.ACADEMIC_TEACHING',
    EXECUTIVE_MANAGEMENT: 'professionFamily.EXECUTIVE_MANAGEMENT',
    MEDIA_COMMUNICATION: 'professionFamily.MEDIA_COMMUNICATION',
    ANALYTICAL_RESEARCH: 'professionFamily.ANALYTICAL_RESEARCH',
    PUBLIC_SERVICE: 'professionFamily.PUBLIC_SERVICE',
    GOVERNMENT_ADMINISTRATION: 'professionFamily.GOVERNMENT_ADMINISTRATION',
    INTERNATIONAL_BUSINESS: 'professionFamily.INTERNATIONAL_BUSINESS',
    DISTRIBUTED_TEAMWORK: 'professionFamily.DISTRIBUTED_TEAMWORK'
  } satisfies Record<CareerProfessionFamily, string>,
  professionBasis: {
    EXPRESSION: 'professionBasis.EXPRESSION',
    MECHANISM: 'professionBasis.MECHANISM',
    '10H_FOUNDATION': 'professionBasis.10H_FOUNDATION',
    '10L_FOUNDATION': 'professionBasis.10L_FOUNDATION',
    D10_QUALIFICATION: 'professionBasis.D10_QUALIFICATION',
    DOMAIN_EVIDENCE: 'professionBasis.DOMAIN_EVIDENCE'
  } satisfies Record<CareerProfessionBasis, string>,
  professionExpressionType: {
    AUTHORITY_EXPRESSION: 'professionExpressionType.AUTHORITY_EXPRESSION',
    LEADERSHIP_EXPRESSION: 'professionExpressionType.LEADERSHIP_EXPRESSION',
    TEACHING_EXPRESSION: 'professionExpressionType.TEACHING_EXPRESSION',
    RESEARCH_WORK: 'professionExpressionType.RESEARCH_WORK',
    COMMUNICATION_WORK: 'professionExpressionType.COMMUNICATION_WORK',
    WRITING_WORK: 'professionExpressionType.WRITING_WORK',
    INNOVATION_WORK: 'professionExpressionType.INNOVATION_WORK',
    SERVICE_WORK: 'professionExpressionType.SERVICE_WORK',
    ANALYTICAL_SPECIALIZED_WORK: 'professionExpressionType.ANALYTICAL_SPECIALIZED_WORK',
    FINANCIAL_WORK: 'professionExpressionType.FINANCIAL_WORK',
    INSURANCE_WORK: 'professionExpressionType.INSURANCE_WORK',
    TAXATION_WORK: 'professionExpressionType.TAXATION_WORK',
    COMPLIANCE_WORK: 'professionExpressionType.COMPLIANCE_WORK',
    CRISIS_MANAGEMENT_WORK: 'professionExpressionType.CRISIS_MANAGEMENT_WORK',
    INSTITUTIONAL_WORK_EXPRESSION: 'professionExpressionType.INSTITUTIONAL_WORK_EXPRESSION',
    ISOLATED_WORK_EXPRESSION: 'professionExpressionType.ISOLATED_WORK_EXPRESSION',
    FOREIGN_WORK_EXPRESSION: 'professionExpressionType.FOREIGN_WORK_EXPRESSION',
    REMOTE_WORK_EXPRESSION: 'professionExpressionType.REMOTE_WORK_EXPRESSION'
  } satisfies Record<CareerExpressionType, string>,
  careerExpressionQualification: {
    QUALIFIED: 'careerExpressionQualification.QUALIFIED',
    CANDIDATE: 'careerExpressionQualification.CANDIDATE',
    UNRESOLVED: 'careerExpressionQualification.UNRESOLVED',
    NOT_APPLICABLE: 'careerExpressionQualification.NOT_APPLICABLE'
  } satisfies Record<CareerExpressionQualificationStatus, string>,
  professionMechanismType: {
    AGENCY: 'professionMechanismType.AGENCY',
    SELF_DIRECTION: 'professionMechanismType.SELF_DIRECTION',
    INITIATIVE: 'professionMechanismType.INITIATIVE',
    VISIBILITY: 'professionMechanismType.VISIBILITY',
    STATUS: 'professionMechanismType.STATUS',
    AUTHORITY: 'professionMechanismType.AUTHORITY',
    LEADERSHIP: 'professionMechanismType.LEADERSHIP',
    STRATEGY: 'professionMechanismType.STRATEGY',
    ADVISORY: 'professionMechanismType.ADVISORY',
    TEACHING: 'professionMechanismType.TEACHING',
    INNOVATION: 'professionMechanismType.INNOVATION',
    DECISION_MAKING: 'professionMechanismType.DECISION_MAKING',
    COMMUNICATION: 'professionMechanismType.COMMUNICATION',
    WRITING: 'professionMechanismType.WRITING',
    PUBLIC_INTERFACE: 'professionMechanismType.PUBLIC_INTERFACE',
    CLIENT_INTERACTION: 'professionMechanismType.CLIENT_INTERACTION',
    CONTRACTUAL_INTERACTION: 'professionMechanismType.CONTRACTUAL_INTERACTION',
    PARTNERSHIP: 'professionMechanismType.PARTNERSHIP',
    COMMERCIAL_INTERACTION: 'professionMechanismType.COMMERCIAL_INTERACTION',
    ENTREPRENEURIAL_EFFORT: 'professionMechanismType.ENTREPRENEURIAL_EFFORT',
    EXECUTION: 'professionMechanismType.EXECUTION',
    HANDS_ON_CAPABILITY: 'professionMechanismType.HANDS_ON_CAPABILITY',
    COURAGE: 'professionMechanismType.COURAGE',
    SELF_EFFORT: 'professionMechanismType.SELF_EFFORT',
    SKILL_DEVELOPMENT: 'professionMechanismType.SKILL_DEVELOPMENT',
    SERVICE_EMPLOYMENT: 'professionMechanismType.SERVICE_EMPLOYMENT',
    COMPETITION: 'professionMechanismType.COMPETITION',
    PROFESSIONALIZATION: 'professionMechanismType.PROFESSIONALIZATION',
    PROFESSIONAL_GAINS: 'professionMechanismType.PROFESSIONAL_GAINS',
    CREATIVE_INTELLECTUAL: 'professionMechanismType.CREATIVE_INTELLECTUAL',
    DHARMA_DRIVEN_PROFESSION: 'professionMechanismType.DHARMA_DRIVEN_PROFESSION',
    AUTHORITY_LEADERSHIP: 'professionMechanismType.AUTHORITY_LEADERSHIP',
    STABILITY: 'professionMechanismType.STABILITY',
    WORK_ENVIRONMENT: 'professionMechanismType.WORK_ENVIRONMENT',
    ADMINISTRATIVE_FOUNDATION: 'professionMechanismType.ADMINISTRATIVE_FOUNDATION',
    EXPENDITURE: 'professionMechanismType.EXPENDITURE',
    INTELLIGENCE: 'professionMechanismType.INTELLIGENCE',
    SPECIALIZED_KNOWLEDGE: 'professionMechanismType.SPECIALIZED_KNOWLEDGE',
    RESEARCH: 'professionMechanismType.RESEARCH',
    INVESTIGATION: 'professionMechanismType.INVESTIGATION',
    TRANSFORMATION: 'professionMechanismType.TRANSFORMATION',
    BUSINESS: 'professionMechanismType.BUSINESS',
    CONSULTING: 'professionMechanismType.CONSULTING',
    BANKING_FINANCE: 'professionMechanismType.BANKING_FINANCE',
    INSURANCE: 'professionMechanismType.INSURANCE',
    TAXATION: 'professionMechanismType.TAXATION',
    COMPLIANCE: 'professionMechanismType.COMPLIANCE',
    RISK: 'professionMechanismType.RISK',
    CRISIS: 'professionMechanismType.CRISIS',
    CRISIS_MANAGEMENT: 'professionMechanismType.CRISIS_MANAGEMENT',
    INSTITUTIONAL_BASE: 'professionMechanismType.INSTITUTIONAL_BASE',
    INSTITUTIONAL_SERVICE: 'professionMechanismType.INSTITUTIONAL_SERVICE',
    INSTITUTIONAL_WORK: 'professionMechanismType.INSTITUTIONAL_WORK',
    ISOLATED_ENVIRONMENT: 'professionMechanismType.ISOLATED_ENVIRONMENT',
    FOREIGN: 'professionMechanismType.FOREIGN',
    FOREIGN_WORK: 'professionMechanismType.FOREIGN_WORK',
    REMOTE_WORK: 'professionMechanismType.REMOTE_WORK'
  } satisfies Record<CareerMechanismType, string>,
  professionDiagnostic: {
    D10_QUALIFICATION_PARTIAL: 'professionDiagnostic.D10_QUALIFICATION_PARTIAL',
    DUPLICATE_DOMAIN_EVIDENCE_OCCURRENCE_ID: 'professionDiagnostic.DUPLICATE_DOMAIN_EVIDENCE_OCCURRENCE_ID',
    NO_PROFESSION_FAMILY_CANDIDATES_AVAILABLE: 'professionDiagnostic.NO_PROFESSION_FAMILY_CANDIDATES_AVAILABLE',
    D1_PROMISE_ESTABLISHED_BUT_ONE_OR_MORE_QUALIFICATION_OR_COVERAGE_INPUTS_ARE_PARTIAL: 'professionDiagnostic.D1_PROMISE_ESTABLISHED_BUT_ONE_OR_MORE_QUALIFICATION_OR_COVERAGE_INPUTS_ARE_PARTIAL',
    PROFESSION_ANALYSIS_NOT_PROVIDED: 'professionDiagnostic.PROFESSION_ANALYSIS_NOT_PROVIDED',
    D1_PROMISE_DIRECTION_NOT_PROVIDED: 'professionDiagnostic.D1_PROMISE_DIRECTION_NOT_PROVIDED',
    D1_NATAL_PROMISE_NOT_ESTABLISHED: 'professionDiagnostic.D1_NATAL_PROMISE_NOT_ESTABLISHED',
    D1_NATAL_PROMISE_MIXED_CONTESTED: 'professionDiagnostic.D1_NATAL_PROMISE_MIXED_CONTESTED',
    PROFESSION_INPUTS_MISSING: 'professionDiagnostic.PROFESSION_INPUTS_MISSING',
    NO_PROFESSION_RULE_MATCHED: 'professionDiagnostic.NO_PROFESSION_RULE_MATCHED',
    NO_PROFESSION_CANDIDATES_AVAILABLE: 'professionDiagnostic.NO_PROFESSION_CANDIDATES_AVAILABLE',
    PROFESSION_RANKING_REJECTED_BY_D1_GATE: 'professionDiagnostic.PROFESSION_RANKING_REJECTED_BY_D1_GATE'
  } satisfies Partial<Record<ProductCareerProfessionRanking['diagnostics'][number], string>>,
  careerRequiredCheck: {
    SKILLS_AND_EXPERIENCE_FIT: 'careerRequiredCheck.SKILLS_AND_EXPERIENCE_FIT',
    REAL_WORLD_OPPORTUNITY: 'careerRequiredCheck.REAL_WORLD_OPPORTUNITY',
    USER_ACTION_AND_EXECUTION: 'careerRequiredCheck.USER_ACTION_AND_EXECUTION',
    EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS: 'careerRequiredCheck.EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['executionConditions']['requiredChecks'][number], string>,
  observedOutcomeSource: {
    USER_REPORTED: 'observedOutcomeSource.USER_REPORTED'
  } satisfies Record<ProductCareerOutcomeAnalysis['observedOutcomes'][number]['source'], string>,
  observedOutcomeType: {
    PROMOTION: 'observedOutcomeType.PROMOTION',
    JOB_CHANGE: 'observedOutcomeType.JOB_CHANGE',
    ROLE_CHANGE: 'observedOutcomeType.ROLE_CHANGE',
    LEADERSHIP_APPOINTMENT: 'observedOutcomeType.LEADERSHIP_APPOINTMENT',
    COMPENSATION_CHANGE: 'observedOutcomeType.COMPENSATION_CHANGE',
    BUSINESS_LAUNCH: 'observedOutcomeType.BUSINESS_LAUNCH',
    BUSINESS_EXPANSION: 'observedOutcomeType.BUSINESS_EXPANSION',
    RECOGNITION: 'observedOutcomeType.RECOGNITION',
    LAYOFF_OR_JOB_LOSS: 'observedOutcomeType.LAYOFF_OR_JOB_LOSS',
    CAREER_BREAK: 'observedOutcomeType.CAREER_BREAK',
    OTHER: 'observedOutcomeType.OTHER'
  } satisfies Record<ProductCareerOutcomeAnalysis['observedOutcomes'][number]['outcomeType'], string>,
  careerConflictSource: {
    NATAL: 'careerConflictSource.NATAL',
    EXPRESSION: 'careerConflictSource.EXPRESSION',
    D10: 'careerConflictSource.D10',
    DASHA: 'careerConflictSource.DASHA',
    TRANSIT: 'careerConflictSource.TRANSIT'
  } satisfies Record<ProductCareerOutcomeAnalysis['candidateOutcomes'][number]['counterIndications']['conflicts'][number]['source'], string>,
  professionReferenceType: {
    PROFESSION_RULE: 'professionReferenceType.PROFESSION_RULE',
    DOMAIN_EVIDENCE: 'professionReferenceType.DOMAIN_EVIDENCE',
    D10_QUALIFICATION: 'professionReferenceType.D10_QUALIFICATION'
  } satisfies Record<ProductCareerProfessionRankedCandidate['scoreContributions'][number]['referenceType'], string>,
  professionEvidenceLinkage: {
    COMPLETE: 'professionEvidenceLinkage.COMPLETE',
    PARTIAL: 'professionEvidenceLinkage.PARTIAL'
  } satisfies Record<NonNullable<CareerProfessionEvidence['linkage']>, string>,
  analysisDomain: {
    CAREER: 'analysisDomain.CAREER',
    WEALTH: 'analysisDomain.WEALTH'
  } satisfies Record<ProductSynthesisEvidenceReference['stage'], string>,
  productQualificationStatus: {
    CANONICAL: 'productQualificationStatus.CANONICAL',
    PROVISIONAL: 'productQualificationStatus.PROVISIONAL',
    UNAVAILABLE: 'productQualificationStatus.UNAVAILABLE'
  } satisfies Record<ProductQualificationStatus, string>,
  synthesisQualificationBasis: {
    CANONICAL_STATUS: 'synthesisQualificationBasis.CANONICAL_STATUS',
    PROXY_DIRECTION: 'synthesisQualificationBasis.PROXY_DIRECTION',
    UNAVAILABLE: 'synthesisQualificationBasis.UNAVAILABLE'
  } satisfies Record<ProductSelectedPeriodSynthesis['career']['qualificationBasis'], string>,
  synthesisProvenanceStatus: {
    PRESENT: 'synthesisProvenanceStatus.PRESENT',
    PARTIAL: 'synthesisProvenanceStatus.PARTIAL',
    MISSING: 'synthesisProvenanceStatus.MISSING'
  } satisfies Record<ProductSynthesisProvenance['career']['status'], string>,
  wealthActivationDataStatus: {
    COMPLETE: 'wealthActivationDataStatus.COMPLETE',
    PARTIAL: 'wealthActivationDataStatus.PARTIAL',
    INSUFFICIENT_DATA: 'wealthActivationDataStatus.INSUFFICIENT_DATA'
  } satisfies Record<ProductSynthesisWealthDimensionRow['dataStatus'], string>,
  selectedPeriodStatus: {
    OK: 'selectedPeriodStatus.OK',
    INVALID_SELECTION: 'selectedPeriodStatus.INVALID_SELECTION',
    SYNTHESIS_FAILED: 'selectedPeriodStatus.SYNTHESIS_FAILED',
    UNAVAILABLE: 'selectedPeriodStatus.UNAVAILABLE'
  } satisfies Record<ProductSelectedPeriodResult['status'], string>,
  aiAvailability: {
    AVAILABLE: 'aiAvailability.AVAILABLE',
    UNAVAILABLE: 'aiAvailability.UNAVAILABLE',
    GENERATING: 'aiAvailability.GENERATING',
    FAILED: 'aiAvailability.FAILED'
  } satisfies Record<AiProductState['status'], string>,
  evidenceClassification: {
    SUPPORTING: 'evidenceClassification.SUPPORTING',
    CHALLENGING: 'evidenceClassification.CHALLENGING',
    NEUTRAL: 'evidenceClassification.NEUTRAL',
    MIXED: 'evidenceClassification.MIXED',
    UNRESOLVED: 'evidenceClassification.UNRESOLVED'
  } satisfies Record<NonNullable<ProductSynthesisEvidenceReference['classification']>, string>,
  evidenceProvenanceStage: {
    CAREER_EXPRESSION: 'evidenceProvenanceStage.CAREER_EXPRESSION',
    CAREER_QUALIFICATION: 'evidenceProvenanceStage.CAREER_QUALIFICATION',
    CAREER_ACTIVATION: 'evidenceProvenanceStage.CAREER_ACTIVATION',
    WEALTH_NATAL_PROMISE: 'evidenceProvenanceStage.WEALTH_NATAL_PROMISE',
    WEALTH_DASHA_RULE: 'evidenceProvenanceStage.WEALTH_DASHA_RULE'
  } satisfies Record<NonNullable<ProductSynthesisEvidenceReference['provenanceStage']>, string>,
  evidenceReferenceKind: {
    EVIDENCE: 'evidenceReferenceKind.EVIDENCE',
    RULE: 'evidenceReferenceKind.RULE'
  } satisfies Record<NonNullable<ProductSynthesisEvidenceReference['referenceKind']>, string>,
  wealthDimension: {
    ACCUMULATION: 'wealthDimension.ACCUMULATION',
    GAINS: 'wealthDimension.GAINS',
    FORTUNE: 'wealthDimension.FORTUNE',
    SPECULATION: 'wealthDimension.SPECULATION'
  } satisfies Record<ProductSynthesisWealthDimensionRow['dimension'], string>,
  speculativePropensity: {
    VERY_STRONG: 'speculativePropensity.VERY_STRONG',
    STRONG: 'speculativePropensity.STRONG',
    MODERATE: 'speculativePropensity.MODERATE',
    MIXED: 'speculativePropensity.MIXED',
    CHALLENGED: 'speculativePropensity.CHALLENGED',
    INSUFFICIENT_DATA: 'speculativePropensity.INSUFFICIENT_DATA'
  } satisfies Record<AstrologicalSpeculativePropensity, string>,
  speculativePropensitySource: {
    ASTROLOGICAL_INDICATION: 'speculativePropensitySource.ASTROLOGICAL_INDICATION'
  } satisfies Record<AstrologicalSpeculativePropensityProduct['source'], string>,
  selectedPeriodAiStatus: {
    SUCCESS: 'selectedPeriodAiStatus.SUCCESS',
    PARTIAL: 'selectedPeriodAiStatus.PARTIAL',
    ERROR: 'selectedPeriodAiStatus.ERROR',
    UNAVAILABLE: 'selectedPeriodAiStatus.UNAVAILABLE'
  } satisfies Record<AiExplanationResult['status'], string>,
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
  careerEventType: {
    CAREER_ENTRY_START: 'careerEventType.CAREER_ENTRY_START',
    JOB_CHANGE_TRANSITION: 'careerEventType.JOB_CHANGE_TRANSITION',
    PROMOTION_ROLE_EXPANSION: 'careerEventType.PROMOTION_ROLE_EXPANSION',
    LEADERSHIP_RESPONSIBILITY: 'careerEventType.LEADERSHIP_RESPONSIBILITY',
    ENTREPRENEURSHIP_BUSINESS_INITIATION: 'careerEventType.ENTREPRENEURSHIP_BUSINESS_INITIATION',
    FOREIGN_REMOTE_OPPORTUNITY: 'careerEventType.FOREIGN_REMOTE_OPPORTUNITY',
    CHALLENGE_INTERRUPTION: 'careerEventType.CHALLENGE_INTERRUPTION',
    RECOVERY_REENTRY: 'careerEventType.RECOVERY_REENTRY',
    PEAK_CONSOLIDATION: 'careerEventType.PEAK_CONSOLIDATION',
    RETIREMENT_TRANSITION: 'careerEventType.RETIREMENT_TRANSITION'
  } satisfies Record<ProductCareerEventSpecificTaxonomyItem['eventType'], string>,
  careerGenericWindowType: {
    CAREER_OPPORTUNITY_WINDOW: 'careerGenericWindowType.CAREER_OPPORTUNITY_WINDOW',
    CAREER_CHALLENGE_WINDOW: 'careerGenericWindowType.CAREER_CHALLENGE_WINDOW',
    CAREER_CONDITIONAL_WINDOW: 'careerGenericWindowType.CAREER_CONDITIONAL_WINDOW'
  } satisfies Record<ProductCareerEventTimeline['genericWindows'][number]['genericType'], string>,
  careerWindowQualificationBasis: {
    B02_NATAL_PROMISE_AND_LINKED_ACTIVATION: 'careerWindowQualificationBasis.B02_NATAL_PROMISE_AND_LINKED_ACTIVATION',
    B01_NATAL_RISK_AND_LINKED_CHALLENGE_ACTIVATION: 'careerWindowQualificationBasis.B01_NATAL_RISK_AND_LINKED_CHALLENGE_ACTIVATION'
  } satisfies Record<ProductCareerEventTimeline['genericWindows'][number]['qualificationBasis'], string>,
  careerEventValidationStatus: {
    UNVALIDATED: 'careerEventValidationStatus.UNVALIDATED'
  } satisfies Record<ProductCareerEventSpecificTaxonomyItem['validationStatus'], string>,
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
  wealthLifecycleEventType: {
    ACCUMULATION: 'wealthLifecycleEventType.ACCUMULATION',
    GAINS: 'wealthLifecycleEventType.GAINS',
    ASSET_BUILDING_INDICATION: 'wealthLifecycleEventType.ASSET_BUILDING_INDICATION',
    PRESERVATION: 'wealthLifecycleEventType.PRESERVATION',
    EROSION_CHALLENGE: 'wealthLifecycleEventType.EROSION_CHALLENGE',
    DEBT_EXPOSURE_INDICATION: 'wealthLifecycleEventType.DEBT_EXPOSURE_INDICATION',
    DEBT_REPAYMENT_REDUCTION_INDICATION: 'wealthLifecycleEventType.DEBT_REPAYMENT_REDUCTION_INDICATION',
    LIQUIDITY_PRESSURE: 'wealthLifecycleEventType.LIQUIDITY_PRESSURE',
    LIQUIDITY_RELIEF: 'wealthLifecycleEventType.LIQUIDITY_RELIEF',
    RECOVERY: 'wealthLifecycleEventType.RECOVERY',
    INHERITANCE_INDICATION: 'wealthLifecycleEventType.INHERITANCE_INDICATION'
  } satisfies Record<WealthLifecycleEventType, string>,
  careerRiskAssessment: {
    ADVERSE_EVIDENCE_PRESENT: 'careerRiskAssessment.ADVERSE_EVIDENCE_PRESENT',
    NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES: 'careerRiskAssessment.NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES'
  } satisfies Record<CareerRiskAssessment, string>,
  careerSustainabilityAssessment: {
    NOT_ASSESSED: 'careerSustainabilityAssessment.NOT_ASSESSED'
  } satisfies Record<CareerSustainabilityAssessment, string>,
  guarantee: {
    NONE: 'guarantee.NONE'
  } satisfies Record<'NONE', string>,
  reasoningNodeType: {
    PROMISE: 'reasoningNodeType.PROMISE',
    VARGA: 'reasoningNodeType.VARGA',
    ACTIVATION: 'reasoningNodeType.ACTIVATION',
    TRANSIT: 'reasoningNodeType.TRANSIT',
    SYNTHESIS: 'reasoningNodeType.SYNTHESIS',
    EVIDENCE: 'reasoningNodeType.EVIDENCE'
  } satisfies Record<ReasoningNode['type'], string>
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

export function enumLabelWithFallback(
  t: EnumLabelTranslator,
  family: EnumLabelFamily,
  fallbackFamily: EnumLabelFamily,
  value: string | null | undefined
): string {
  const label = enumLabel(t, family, value);
  return value !== null && value !== undefined && label === value
    ? enumLabel(t, fallbackFamily, value)
    : label;
}
