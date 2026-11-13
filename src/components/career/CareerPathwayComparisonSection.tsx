import React from 'react';
import type { ProductCareerPathwayAnalysis, ProductCareerPathwayModeAssessment } from '../../product/analysis/productAnalysisTypes';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface CareerPathwayComparisonSectionProps {
  readonly pathwayPotential?: ProductCareerPathwayAnalysis;
}

function ModePanel({ title, assessment }: { title: string; assessment: ProductCareerPathwayModeAssessment }) {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-mono text-slate-300">{enumLabel(tEnum, 'careerPathwayModeStatus', assessment.status)}</span>
      </header>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><span className="block text-slate-500">{t('ui.pathways.candidates')}</span><span className="text-slate-200">{assessment.candidateCount}</span></div>
        <div><span className="block text-slate-500">{t('ui.pathways.supported')}</span><span className="text-slate-200">{assessment.supportedCandidateCount}</span></div>
        <div><span className="block text-slate-500">{t('ui.pathways.conditional')}</span><span className="text-slate-200">{assessment.conditionalCandidateCount}</span></div>
      </div>
      {assessment.candidates.length > 0 ? assessment.candidates.map(candidate => (
        <div key={candidate.candidateId} className="border-t border-slate-800 pt-3 space-y-1">
          <p className="text-xs font-semibold text-slate-100">{candidate.candidateId} · {enumLabel(tEnum, 'careerPathwayCandidateQualification', candidate.qualification)}</p>
          <p className="text-xs text-slate-400">
            {candidate.timing.type === 'DASHA_PERIOD_WINDOW'
              ? `${t('ui.pathways.timing')}: ${candidate.timing.start ?? t('ui.pathways.startUnavailable')} — ${candidate.timing.end ?? t('ui.pathways.endUnavailable')}`
              : `${t('ui.pathways.timing')}: ${t('ui.pathways.untimed')}`}
          </p>
          <p className="text-xs text-slate-500">{t('ui.pathways.evidenceOccurrences')}: {candidate.supportingEvidenceOccurrenceIds.join(', ') || t('ui.pathways.notLinked')}</p>
          <p className="text-xs text-slate-500">{t('ui.pathways.rules')}: {candidate.ruleIds.join(', ') || t('ui.pathways.notLinked')} · {t('ui.pathways.counterSeverity')}: {enumLabel(tEnum, 'careerCounterIndicationSeverity', candidate.counterIndicationSeverity)}</p>
          {candidate.counterEvidenceOccurrenceIds.length > 0 && (
            <p className="text-xs text-amber-300">{t('ui.pathways.counterOccurrences')}: {candidate.counterEvidenceOccurrenceIds.join(', ')}</p>
          )}
        </div>
      )) : (
        <p className="text-xs text-slate-400">{t('ui.pathways.noCandidate')}</p>
      )}
      <p className="text-[11px] text-slate-500">
        {t('ui.pathways.execution')}: {enumLabel(tEnum, 'careerPathwayAssessment', assessment.practicalExecution)} · {t('ui.pathways.financialReadiness')}: {enumLabel(tEnum, 'careerPathwayAssessment', assessment.financialReadiness)} · {t('ui.pathways.personalPreference')}: {enumLabel(tEnum, 'careerPathwayAssessment', assessment.personalPreference)}
      </p>
    </article>
  );
}

export const CareerPathwayComparisonSection: React.FC<CareerPathwayComparisonSectionProps> = ({ pathwayPotential }) => {
  const { t } = useTranslation('career');
  const { t: tEnum } = useTranslation('enums');
  if (!pathwayPotential) {
    return (
      <section id="career-pathways" aria-labelledby="career-pathways-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
        <h2 id="career-pathways-heading" className="text-base font-semibold text-slate-100">{t('ui.pathways.title')}</h2>
        <p className="text-sm text-slate-400">{t('ui.pathways.unavailable')}</p>
      </section>
    );
  }

  return (
    <section id="career-pathways" aria-labelledby="career-pathways-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="career-pathways-heading" className="text-base font-semibold text-slate-100">{t('ui.pathways.title')}</h2>
          <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-mono text-slate-300">{enumLabel(tEnum, 'careerPathwayVerdict', pathwayPotential.verdict)}</span>
        </div>
        <p className="text-xs text-slate-400">{pathwayPotential.statement}</p>
        <p className="text-xs text-slate-500">{t('ui.pathways.status')}: {enumLabel(tEnum, 'careerPathwayStatus', pathwayPotential.status)} · {t('ui.pathways.confidence')}: {enumLabel(tEnum, 'careerPathwayAssessment', pathwayPotential.confidence.status)} · {t('ui.pathways.source')}: {pathwayPotential.sourceReasoningVersion} / {pathwayPotential.sourceMethodVersion}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ModePanel title={t('ui.pathways.employment')} assessment={pathwayPotential.employment} />
        <ModePanel title={t('ui.pathways.independent')} assessment={pathwayPotential.independent} />
      </div>
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 space-y-2">
        <p className="text-xs text-amber-200">{t('ui.pathways.disclaimer')}</p>
        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-400">
          {pathwayPotential.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
        </ul>
      </div>
    </section>
  );
};
