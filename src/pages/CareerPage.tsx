/**
 * Career Page (P-UI-04 / D05)
 *
 * Guided presentation over canonical ProductAnalysis. Does not calculate
 * astrology, score, profession fit, Dasha timing, or event outcomes.
 */
import React, { useMemo } from 'react';
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
    { id: 'career-overview', title: 'Overview', description: 'Canonical career summary and natal context.', state: 'AVAILABLE' as const },
    { id: 'career-promise', title: 'Natal promise', description: 'C11 promise and dominant manifestations.', state: 'AVAILABLE' as const },
    { id: 'career-expressions', title: 'Career expressions', description: 'Canonical working style and expressions.', state: viewModel.expression.available ? 'AVAILABLE' as const : 'UNAVAILABLE' as const },
    { id: 'career-professions', title: 'Profession families', description: 'B04 ranked families and unresolved candidates.', state: professionState },
    { id: 'career-pathways', title: 'Pathway comparison', description: 'B05 comparison of explicit B02 employment/service and independent/business candidates.', state: pathwayState },
    { id: 'career-d10', title: 'D10 qualification', description: 'D10 qualifies an existing expression; it does not create promise.', state: viewModel.d10.relationship === 'UNAVAILABLE' ? 'UNAVAILABLE' as const : viewModel.d10.relationship === 'PARTIALLY_CONFIRMS' ? 'PARTIAL' as const : 'AVAILABLE' as const },
    { id: 'career-activation', title: 'Activation & timing', description: 'Canonical Dasha and transit activation.', state: viewModel.dasha.status === 'AVAILABLE' ? 'AVAILABLE' as const : viewModel.dasha.status === 'PARTIAL' ? 'PARTIAL' as const : 'UNAVAILABLE' as const },
    { id: 'career-events', title: 'Candidate timeline', description: 'Indicative B02/B06 candidates, never guarantees.', state: eventState },
    { id: 'career-risks', title: 'Risk & sustainability', description: 'B01 axes, evidence gaps, risks and conflicts.', state: axesState },
    { id: 'career-evidence', title: 'Evidence & confidence', description: 'C11 ownership, D01 confidence and D03 trace.', state: evidenceExperience ? 'AVAILABLE' as const : 'UNAVAILABLE' as const }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <section id="career-overview" aria-label="Career overview" className="scroll-mt-6 space-y-4">
        <CareerHero hero={viewModel.hero} />
        <CareerJourney steps={journeySteps} />
      </section>

      <section id="career-promise" aria-label="Natal promise" className="scroll-mt-6 space-y-4">
        <CareerPromiseSection promise={viewModel.promise} />
      </section>

      <section id="career-expressions" aria-label="Career expressions" className="scroll-mt-6 space-y-4">
        <CareerExpressionSection expression={viewModel.expression} />
      </section>

      <section id="career-professions" aria-label="Profession family candidates" className="scroll-mt-6 space-y-4">
        <CareerProfessionStatusSection profession={viewModel.profession} />
      </section>

      <CareerPathwayComparisonSection pathwayPotential={viewModel.pathwayPotential} />

      <section id="career-d10" aria-label="D10 qualification" className="scroll-mt-6 space-y-4">
        <CareerD10Section d10={viewModel.d10} />
      </section>

      <section id="career-activation" aria-label="Career activation and timing" className="scroll-mt-6 space-y-4">
        <CareerDashaSection dasha={viewModel.dasha} />
        <CareerTransitSection transit={viewModel.transit} />
      </section>

      <section id="career-events" aria-label="Candidate event timeline" className="scroll-mt-6 space-y-4">
        {viewModel.outcomeQualification
          ? <CareerOutcomeQualificationSection outcomeQualification={viewModel.outcomeQualification} />
          : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">B02 outcome qualification is unavailable for this analysis.</div>}
        {viewModel.eventTimeline
          ? <CareerEventTimelineSection eventTimeline={viewModel.eventTimeline} />
          : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">B06 event timeline is unavailable. No event window is inferred by the page.</div>}
      </section>

      <section aria-label="Career risks and sustainability" className="scroll-mt-6 space-y-4">
        <CareerAnalyticalAxesSection axes={viewModel.analyticalAxes} />
        <CareerQualificationsSection qualifications={viewModel.qualifications} />
      </section>

      <section id="career-evidence" aria-label="Career evidence and confidence" className="scroll-mt-6 space-y-4">
        <CareerEvidenceSection
          evidence={viewModel.evidence}
          onOpenReasoning={() => onNavigate?.('reasoning')}
        />
        {evidenceExperience
          ? <EvidenceConfidencePanel model={evidenceExperience} />
          : <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">Career confidence/evidence projection is unavailable.</div>}
      </section>

      <CareerConclusionSection
        conclusion={viewModel.conclusion}
        onOpenReasoning={() => onNavigate?.('reasoning')}
      />
    </main>
  );
};
