import React from 'react';
import { Coins } from 'lucide-react';
import type {
  LifeAnalysisProductState,
  DomainStrength,
  VargaRelationship,
  TimingActivationEffect,
  TransitTriggerEffect,
  ConfidenceLevel,
  WealthDimensionStatus,
  LifeAnalysisDomainSummaryViewModel,
  LifeAnalysisWealthDetailViewModel
} from '../product/life-analysis/lifeAnalysisTypes';
import type {
  PromiseStrength,
  ActivationEffect,
  TransitEffect,
  ConclusionStatus
} from '../product/analysis';
import type { ProductAnalysisState } from '../app/AppState';
import { selectWealth } from '../product/analysis/productAnalysisSelectors';
import { PageHeading } from '../components/layout/PageHeading';
import { WealthAnalysisCard } from '../components/lifeAnalysis/WealthAnalysisCard';
import { LifeAnalysisLoading } from '../components/lifeAnalysis/LifeAnalysisLoading';
import { LifeAnalysisError } from '../components/lifeAnalysis/LifeAnalysisError';
import { EmptyState } from '../components/fullNatalReport/EmptyState';
import type { AppPage } from '../app/navigation/navigationTypes';

export interface WealthPageProps {
  readonly state?: LifeAnalysisProductState;
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const WealthPage: React.FC<WealthPageProps> = ({
  state,
  productAnalysisState,
  onRetry
}) => {
  const isLoading =
    productAnalysisState?.status === 'LOADING' ||
    (!productAnalysisState && state?.status === 'LOADING');

  if (isLoading) {
    return <LifeAnalysisLoading />;
  }

  const isError =
    (productAnalysisState?.status === 'ERROR' && !productAnalysisState.analysis && !state?.analysis) ||
    (!productAnalysisState && state?.status === 'ERROR' && !state?.analysis);

  if (isError) {
    return (
      <LifeAnalysisError
        message={productAnalysisState?.error || state?.errorMessage}
        onRetry={onRetry}
      />
    );
  }

  const legacyAnalysis = state?.analysis;
  const aggregateAnalysis = productAnalysisState?.analysis;

  if (!legacyAnalysis && !aggregateAnalysis) {
    return (
      <EmptyState
        title="Wealth Analysis Unavailable"
        message="No wealth analysis could be calculated for the current chart."
        icon={<Coins className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const wealthFromAggregate = aggregateAnalysis ? selectWealth(aggregateAnalysis) : undefined;

  const wealthSummary: LifeAnalysisDomainSummaryViewModel | undefined = legacyAnalysis?.domains.find((d) => d.domain === 'WEALTH') ?? (
    wealthFromAggregate
      ? {
          domain: 'WEALTH' as const,
          displayName: 'Wealth & Assets',
          status: 'SUPPORTED' as const,
          strength: (wealthFromAggregate.overall.promise as DomainStrength) || 'UNAVAILABLE',
          confidence: (wealthFromAggregate.overall.confidence as ConfidenceLevel) || 'MEDIUM',
          conclusion: wealthFromAggregate.overall.statement || '',
          headline: wealthFromAggregate.overall.headline,
          statement: wealthFromAggregate.overall.statement,
          supportingEvidenceCount: wealthFromAggregate.evidence.length,
          challengingEvidenceCount: 0
        }
      : undefined
  );

  const wealthDetail: LifeAnalysisWealthDetailViewModel | undefined = legacyAnalysis?.wealthDetail ?? (
    wealthFromAggregate
      ? {
          natalPromise: (wealthFromAggregate.overall.promise as DomainStrength | 'UNAVAILABLE') || 'UNAVAILABLE',
          d2Relationship: wealthFromAggregate.d2.relationship as VargaRelationship,
          currentDashaEffect: (wealthFromAggregate.activation.dasha.periods[0]?.effect as ActivationEffect) || 'UNAVAILABLE',
          currentTransitEffect: (wealthFromAggregate.activation.transit.effect as TransitEffect) || 'UNAVAILABLE',
          overallStatus: (wealthFromAggregate.overall.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
          accumulationStatus: (wealthFromAggregate.dimensions.accumulation.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
          gainsStatus: (wealthFromAggregate.dimensions.gains.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
          fortuneStatus: (wealthFromAggregate.dimensions.fortune.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
          speculationStatus: (wealthFromAggregate.dimensions.speculation.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
          promiseHeadline: wealthFromAggregate.overall.headline,
          promiseStatement: wealthFromAggregate.overall.statement,
          headline: wealthFromAggregate.overall.headline,
          statement: wealthFromAggregate.overall.statement,
          status: (wealthFromAggregate.overall.promise as DomainStrength | 'UNAVAILABLE') || 'UNAVAILABLE',
          accumulation: {
            status: (wealthFromAggregate.dimensions.accumulation.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
            statement: wealthFromAggregate.dimensions.accumulation.statement
          },
          gains: {
            status: (wealthFromAggregate.dimensions.gains.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
            statement: wealthFromAggregate.dimensions.gains.statement
          },
          fortune: {
            status: (wealthFromAggregate.dimensions.fortune.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
            statement: wealthFromAggregate.dimensions.fortune.statement
          },
          speculation: {
            status: (wealthFromAggregate.dimensions.speculation.status as WealthDimensionStatus | 'UNAVAILABLE') || 'UNAVAILABLE',
            statement: wealthFromAggregate.dimensions.speculation.statement
          },
          d2Statement: wealthFromAggregate.d2.statement,
          timing: {
            status: wealthFromAggregate.activation.dasha.status === 'AVAILABLE' ? ('AVAILABLE' as const) : ('UNAVAILABLE' as const),
            transitEffect: wealthFromAggregate.activation.transit.effect as TransitTriggerEffect,
            transitStatement: wealthFromAggregate.activation.transit.statement
          },
          qualifications: wealthFromAggregate.qualifications as any
        }
      : undefined
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        eyebrow="Life Domain Analysis"
        title="Wealth & Financial Prosperity"
        description="Classical evaluation of 2nd house (accumulation), 11th house (gains), Dhana yoga formations, and financial manifestation potential."
      />

      <WealthAnalysisCard
        detail={wealthDetail}
        summary={wealthSummary}
        why={legacyAnalysis?.wealthWhy}
      />
    </div>
  );
};
