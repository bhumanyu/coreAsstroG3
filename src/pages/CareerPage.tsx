/**
 * Career Page (P-UI-04 / D05)
 *
 * Guided presentation over canonical ProductAnalysis. Does not calculate
 * astrology, score, profession fit, Dasha timing, or event outcomes.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EvidenceConfidencePanel } from '../components/lifeAnalysis/EvidenceConfidencePanel';
import { selectEvidenceExperience } from '../product/analysis/evidenceExperienceViewModel';
import type { ProductAnalysisState } from '../app/AppState';
import type { AppPage } from '../app/navigation/navigationTypes';
import { selectCareerViewModel } from '../product/analysis/careerViewModel';
import {
  CareerHero,
  CareerPromiseSection,
  CareerExpressionSection,
  CareerD10Section,
  CareerDashaSection,
  CareerTransitSection,
  CareerQualificationsSection,
  CareerEvidenceSection,
  CareerConclusionSection,
  CareerProfessionStatusSection,
  CareerOutcomeQualificationSection,
  CareerEventTimelineSection,
  CareerLoadingState,
  CareerUnavailableState,
  CareerErrorState,
  CareerJourney,
  CareerAnalyticalAxesSection,
  CareerPathwayComparisonSection
} from '../components/career';

export interface CareerPageProps {
  readonly productAnalysisState?: ProductAnalysisState;
  readonly onRetry?: () => void;
  readonly onNavigate?: (page: AppPage) => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({
  productAnalysisState,
  onRetry,
  onNavigate
}) => {
  const { t } = useTranslation('career');
  const status = productAnalysisState?.status;
  const analysis = productAnalysisState?.analysis;
  const errorMessage = productAnalysisState?.error;

  const viewModel = useMemo(
    () => (analysis ? selectCareerViewModel(analysis) : undefined),
    [analysis]
  );
  const evidenceExperience = useMemo(
    () => (analysis && viewModel
      ? selectEvidenceExperience(analysis, 'CAREER', viewModel.confidenceCompleteness)
      : undefined),
    [analysis, viewModel]
  );

  if (status === 'ERROR' && !analysis) {
    return <CareerErrorState errorMessage={errorMessage} onRetry={onRetry} />;
  }
  if (status === 'LOADING' || (status === 'IDLE' && !analysis)) {
    return <CareerLoadingState />;
  }
  if (!analysis || !viewModel) {
    return <CareerUnavailableState onRetry={onRetry} />;
  }

  const professionState = viewModel.profession.ranking.status === 'AVAILABLE'
    && viewModel.profession.status === 'COMPLETE'
    ? 'AVAILABLE' as const
    : viewModel.profession.ranking.status === 'PARTIAL'
      || viewModel.profession.status === 'PARTIAL'
      ? 'PARTIAL' as const
      : 'UNAVAILABLE' as const;
  const pathwayState = viewModel.pathwayPotential?.status === 'AVAILABLE'
    ? 'AVAILABLE' as const
    : viewModel.pathwayPotential?.status === 'PARTIAL' || viewModel.pathwayPotential?.status === 'UNRESOLVED'
      ? 'PARTIAL' as const
      : 'UNAVAILABLE' as const;
  const eventState = viewModel.eventTimeline?.status === 'GENERIC_WINDOWS_ONLY'
    && viewModel.eventTimeline.genericWindows.length > 0
    ? 'AVAILABLE' as const
    : viewModel.eventTimeline?.status === 'PARTIAL'
      ? 'PARTIAL' as const
      : 'UNAVAILABLE' as const;
  const axesState = viewModel.analyticalAxes
    && [viewModel.analyticalAxes.promise, viewModel.analyticalAxes.activation,
      viewModel.analyticalAxes.sustainability, viewModel.analyticalAxes.risk,
      viewModel.analyticalAxes.timing].some(axis => axis.status === 'AVAILABLE' || axis.status === 'PARTIAL')
    ? 'AVAILABLE' as const : 'UNAVAILABLE' as const;

  const journeySteps = [
    { id: 'career-overview', title: t('journey.overview'), description: t('journey.overviewDescription'), state: 'AVAILABLE' as const },
    { id: 'career-promise', title: t('journey.promise'), description: t('journey.promiseDescription'), state: 'AVAILABLE' as const },
    { id: 'career-expressions', title: t('journey.expressions'), description: t('journey.expressionsDescription'), state: viewModel.expression.available ? 'AVAILABLE' as const : 'UNAVAILABLE' as const },
    { id: 'career-professions', title: t('journey.professions'), description: t('journey.professionsDescription'), state: professionState },
    { id: 'career-pathways', title: t('journey.pathways'), description: t('journey.pathwaysDescription'), state: pathwayState },
    { id: 'career-d10', title: t('journey.d10'), description: t('journey.d10Description'), state: viewModel.d10.relationship === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : viewModel.d10.relationship === 'PARTIALLY_CONFIRMS' ? 'PARTIAL' as const : 'AVAILABLE' as const },
    { id: 'career-activation', title: t('journey.activation'), description: t('journey.activationDescription'), state: viewModel.dasha.status === 'AVAILABLE' ? 'AVAILABLE' as const : viewModel.dasha.status === 'PARTIAL' ? 'PARTIAL' as const : 'UNAVAILABLE' as const },
    { id: 'career-events', title: t('journey.events'), description: t('journey.eventsDescription'), state: eventState },
    { id: 'career-risks', title: t('journey.risks'), description: t('journey.risksDescription'), state: axesState },
    { id: 'career-evidence', title: t('journey.evidence'), description: t('journey.evidenceDescription'), state: evidenceExperience ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <section id="career-overview" aria-label={t('sections.overview')} className="scroll-mt-6 space-y-4">
        <CareerHero hero={viewModel.hero} />
        <CareerJourney steps={journeySteps} />
      </section>

      <section id="career-promise" aria-label={t('sections.promise')} className="scroll-mt-6 space-y-4">
        <CareerPromiseSection promise={viewModel.promise} />
      </section>

      <section id="career-expressions" aria-label={t('sections.expressions')} className="scroll-mt-6 space-y-4">
        <CareerExpressionSection expression={viewModel.expression} />
      </section>

      <section id="career-professions" aria-label={t('sections.professions')} className="scroll-mt-6 space-y-4">
        <CareerProfessionStatusSection profession={viewModel.profession} />
      </section>

      <CareerPathwayComparisonSection pathwayPotential={viewModel.pathwayPotential} />

      <section id="career-d10" aria-label={t('sections.d10')} className="scroll-mt-6 space-y-4">
        <CareerD10Section d10={viewModel.d10} />
      </section>

      <section id="career-activation" aria-label={t('sections.activation')} className="scroll-mt-6 space-y-4">
        <CareerDashaSection dasha={viewModel.dasha} />
        <CareerTransitSection transit={viewModel.transit} />
      </section>

      <section id="career-events" aria-label={t('sections.events')} className="scroll-mt-6 space-y-4">
        {viewModel.outcomeQualification
          ? <CareerOutcomeQualificationSection outcomeQualification={viewModel.outcomeQualification} />
          : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">{t('unavailable.outcome')}</div>}
        {viewModel.eventTimeline
          ? <CareerEventTimelineSection eventTimeline={viewModel.eventTimeline} />
          : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">{t('unavailable.timeline')}</div>}
      </section>

      <section aria-label={t('sections.risks')} className="scroll-mt-6 space-y-4">
        <CareerAnalyticalAxesSection axes={viewModel.analyticalAxes} />
        <CareerQualificationsSection qualifications={viewModel.qualifications} />
      </section>

      <section id="career-evidence" aria-label={t('sections.evidence')} className="scroll-mt-6 space-y-4">
        <CareerEvidenceSection
          evidence={viewModel.evidence}
          onOpenReasoning={() => onNavigate?.('reasoning')}
        />
        {evidenceExperience
          ? <EvidenceConfidencePanel model={evidenceExperience} />
          : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">{t('unavailable.evidence')}</div>}
      </section>

      <CareerConclusionSection
        conclusion={viewModel.conclusion}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />
    </main>
  );
};
