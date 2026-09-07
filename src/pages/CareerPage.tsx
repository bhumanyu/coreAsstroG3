import React from 'react';
import { Briefcase } from 'lucide-react';
import type {
  LifeAnalysisProductState,
  DomainStrength,
  VargaRelationship,
  TimingActivationEffect,
  TransitTriggerEffect,
  ConfidenceLevel
} from '../product/life-analysis/lifeAnalysisTypes';
import type { ProductAnalysisState } from '../app/AppState';
import { selectCareer } from '../product/analysis/productAnalysisSelectors';
import { PageHeading } from '../components/layout/PageHeading';
import { CareerAnalysisCard } from '../components/lifeAnalysis/CareerAnalysisCard';
import { LifeAnalysisLoading } from '../components/lifeAnalysis/LifeAnalysisLoading';
import { LifeAnalysisError } from '../components/lifeAnalysis/LifeAnalysisError';
import { EmptyState } from '../components/fullNatalReport/EmptyState';
import type { AppPage } from '../app/navigation/navigationTypes';

export interface CareerPageProps {
  readonly state?: LifeAnalysisProductState;
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({
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
        title="Career Analysis Unavailable"
        message="No career analysis could be calculated for the current chart."
        icon={<Briefcase className="w-5 h-5 text-indigo-400" aria-hidden="true" />}
      />
    );
  }

  const careerFromAggregate = aggregateAnalysis ? selectCareer(aggregateAnalysis) : undefined;

  const careerSummary = legacyAnalysis?.domains.find((d) => d.domain === 'CAREER') ?? (
    careerFromAggregate
      ? {
          domain: 'CAREER' as const,
          displayName: 'Career & Professional Life',
          status: 'SUPPORTED' as const,
          strength: (careerFromAggregate.promise.strength as any) || 'STRONG',
          confidence: (careerFromAggregate.promise.confidence as ConfidenceLevel) || 'HIGH',
          conclusion: careerFromAggregate.promise.statement || '',
          headline: careerFromAggregate.promise.headline,
          statement: careerFromAggregate.promise.statement,
          supportingEvidenceCount: careerFromAggregate.evidence.length,
          challengingEvidenceCount: 0
        }
      : undefined
  );

  const careerDetail = legacyAnalysis?.careerDetail ?? (
    careerFromAggregate
      ? {
          natalPromise: (careerFromAggregate.promise.strength as DomainStrength) || 'STRONG',
          d10Relationship: (careerFromAggregate.d10.relationship === 'UNAVAILABLE' ? 'CONFIRMS' : careerFromAggregate.d10.relationship) as VargaRelationship,
          currentDashaEffect: (careerFromAggregate.timing.dashaPeriods[0]?.effect as TimingActivationEffect) || 'SUPPORTIVE',
          currentTransitEffect: (careerFromAggregate.timing.transitEffect as TransitTriggerEffect) || 'NEUTRAL',
          promiseHeadline: careerFromAggregate.promise.headline,
          promiseStatement: careerFromAggregate.promise.statement,
          headline: careerFromAggregate.promise.headline,
          statement: careerFromAggregate.promise.statement,
          status: (careerFromAggregate.promise.strength as DomainStrength) || 'STRONG',
          capacityLevel: 'BALANCED',
          manifestations: careerFromAggregate.manifestations,
          d10Statement: careerFromAggregate.d10.statement,
          timing: {
            status: 'AVAILABLE' as const,
            currentActivation: careerFromAggregate.timing.currentActivation,
            currentPressure: careerFromAggregate.timing.currentPressure,
            transitEffect: careerFromAggregate.timing.transitEffect as TransitTriggerEffect,
            transitStatement: careerFromAggregate.timing.transitStatement
          },
          qualifications: careerFromAggregate.qualifications,
          actionableTakeaways: careerFromAggregate.takeaways
        }
      : undefined
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeading
        eyebrow="Life Domain Analysis"
        title="Career & Professional Trajectory"
        description="Comprehensive evaluation of status, vocational capacity, D10 Dashamsha divisional strength, and career dasha timing."
      />

      <CareerAnalysisCard
        detail={careerDetail}
        summary={careerSummary}
        why={legacyAnalysis?.careerWhy}
      />
    </div>
  );
};
