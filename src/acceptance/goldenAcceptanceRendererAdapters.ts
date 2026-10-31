import type { FullNatalAnalysisReport } from '../engine/fullNatalAnalysis/fullNatalAnalysisTypes';
import type {
  ProductSelectedPeriodSynthesis,
  ProductSynthesisWealthDimensionRow
} from '../product/analysis/productAnalysisTypes';
import type { CareerViewModel } from '../product/analysis/careerViewModel';
import type { WealthViewModel } from '../product/analysis/wealthViewModel';

export interface FullNatalReportRendererProjection {
  readonly status: FullNatalAnalysisReport['overallSynthesis']['status'];
  readonly conclusion: string;
  readonly evidenceReferences: readonly string[];
}

export interface SelectedPeriodReportRendererProjection {
  readonly selectedPeriodId: string;
  readonly interval: ProductSelectedPeriodSynthesis['period']['interval'];
  readonly temporalRelation: ProductSelectedPeriodSynthesis['period']['temporalRelation'];
  readonly qualificationStatus: ProductSelectedPeriodSynthesis['qualificationStatus'];
  readonly careerQualificationBasis: ProductSelectedPeriodSynthesis['career']['qualificationBasis'];
  readonly evidenceIds: readonly string[];
  readonly wealthDimensions: readonly Pick<
    ProductSynthesisWealthDimensionRow,
    'dimension' | 'effect' | 'dataStatus'
  >[];
}

export interface CareerReportRendererProjection {
  readonly status: CareerViewModel['profession']['status'];
  readonly evidenceIds: readonly string[];
  readonly confidence: CareerViewModel['conclusion']['confidence'];
  readonly headline?: string;
  readonly statement?: string;
  readonly primaryEvidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
}

export interface WealthReportRendererProjection {
  readonly status: WealthViewModel['overall']['status'];
  readonly evidenceIds: readonly string[];
  readonly confidence: WealthViewModel['conclusion']['confidence'];
  readonly headline?: string;
  readonly statement?: string;
  readonly primaryEvidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
}

export function projectFullNatalReportRenderer(
  report: FullNatalAnalysisReport
): FullNatalReportRendererProjection {
  return {
    status: report.overallSynthesis.status,
    conclusion: report.overallSynthesis.overallConclusion,
    evidenceReferences: report.overallSynthesis.keyObservations
      .flatMap(observation => observation.evidenceReferences)
  };
}

export function projectSelectedPeriodReportRenderer(
  synthesis: ProductSelectedPeriodSynthesis,
  domain?: 'CAREER' | 'WEALTH'
): SelectedPeriodReportRendererProjection {
  return {
    selectedPeriodId: synthesis.period.selectedPeriodId,
    interval: synthesis.period.interval,
    temporalRelation: synthesis.period.temporalRelation,
    qualificationStatus: synthesis.qualificationStatus,
    careerQualificationBasis: synthesis.career.qualificationBasis,
    evidenceIds: synthesis.evidence.flatMap(reference =>
      reference.referenceKind === 'RULE'
        || reference.evidenceId === undefined
        || (domain !== undefined && reference.stage !== domain)
        ? []
        : [reference.evidenceId]
    ),
    wealthDimensions: (['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const)
      .map(dimension => ({
        dimension,
        effect: synthesis.wealth.dimensions[dimension].effect,
        dataStatus: synthesis.wealth.dimensions[dimension].dataStatus
      }))
  };
}

export function projectCareerReportRenderer(
  viewModel: CareerViewModel
): CareerReportRendererProjection {
  return {
    status: viewModel.profession.status,
    evidenceIds: viewModel.evidence.map(evidence => evidence.id),
    confidence: viewModel.conclusion.confidence,
    headline: viewModel.conclusion.headline,
    statement: viewModel.conclusion.statement,
    primaryEvidenceCount: viewModel.conclusion.primaryEvidenceCount,
    supportingEvidenceCount: viewModel.conclusion.supportingEvidenceCount,
    challengingEvidenceCount: viewModel.conclusion.challengingEvidenceCount
  };
}

export function projectWealthReportRenderer(
  viewModel: WealthViewModel
): WealthReportRendererProjection {
  return {
    status: viewModel.overall.status,
    evidenceIds: viewModel.evidence.map(evidence => evidence.id),
    confidence: viewModel.conclusion.confidence,
    headline: viewModel.conclusion.headline,
    statement: viewModel.conclusion.statement,
    primaryEvidenceCount: viewModel.conclusion.primaryEvidenceCount,
    supportingEvidenceCount: viewModel.conclusion.supportingEvidenceCount,
    challengingEvidenceCount: viewModel.conclusion.challengingEvidenceCount
  };
}
