import React from 'react';
import type { ProductAnalysis } from '../product/analysis';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectOverviewViewModel } from '../product/analysis/overviewViewModel';
import {
  OverviewHeader,
  OverallAssessmentCard,
  DomainSummaryCard,
  CurrentDashaCard,
  KeyFindingsCard,
  QualificationsCard,
  EvidencePreview,
  OverviewEmptyState,
  OverviewLoadingState,
  OverviewErrorState
} from '../components/overview';

export interface OverviewPageProps {
  readonly analysis?: ProductAnalysis;
  readonly status?: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  readonly errorMessage?: string;
  readonly onNavigate?: (page: AppPage) => void;
  readonly onRetry?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  analysis,
  status = 'IDLE',
  errorMessage,
  onNavigate,
  onRetry
}) => {
  if (status === 'LOADING') {
    return <OverviewLoadingState />;
  }

  if (status === 'ERROR' || (!analysis && errorMessage)) {
    return (
      <OverviewErrorState
        errorMessage={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (!analysis || status === 'IDLE') {
    return <OverviewEmptyState onRetry={onRetry} />;
  }

  const viewModel = selectOverviewViewModel(analysis);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Chart Metadata */}
      <OverviewHeader
        chart={viewModel.chart}
        warnings={viewModel.warnings}
      />

      {/* Overall Assessment Banner */}
      <OverallAssessmentCard overall={viewModel.overall} />

      {/* Domain Summaries: Career and Wealth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DomainSummaryCard
          domain={viewModel.career}
          domainKey="career"
          onOpen={() => onNavigate?.('career')}
        />
        <DomainSummaryCard
          domain={viewModel.wealth}
          domainKey="wealth"
          onOpen={() => onNavigate?.('wealth')}
        />
      </div>

      {/* Planetary Timing (Vimshottari Dasha Hierarchy) */}
      <CurrentDashaCard
        dasha={viewModel.dasha}
        onOpenDasha={() => onNavigate?.('dasha')}
      />

      {/* Key Cross-Domain Findings & Qualifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KeyFindingsCard findings={viewModel.findings} />
        <QualificationsCard qualifications={viewModel.qualifications} />
      </div>

      {/* Evidence & Transparent Reasoning Provenance Teaser */}
      <EvidencePreview
        onOpenReasoning={() => onNavigate?.('reasoning')}
        totalEvidenceCount={viewModel.totalEvidenceCount}
      />
    </div>
  );
};
