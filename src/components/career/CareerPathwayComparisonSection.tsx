import React from 'react';
import type { ProductCareerPathwayAnalysis, ProductCareerPathwayModeAssessment } from '../../product/analysis/productAnalysisTypes';

export interface CareerPathwayComparisonSectionProps {
  readonly pathwayPotential?: ProductCareerPathwayAnalysis;
}

function ModePanel({ title, assessment }: { title: string; assessment: ProductCareerPathwayModeAssessment }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-mono text-slate-300">{assessment.status}</span>
      </header>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div><span className="block text-slate-500">Candidates</span><span className="text-slate-200">{assessment.candidateCount}</span></div>
        <div><span className="block text-slate-500">Supported</span><span className="text-slate-200">{assessment.supportedCandidateCount}</span></div>
        <div><span className="block text-slate-500">Conditional</span><span className="text-slate-200">{assessment.conditionalCandidateCount}</span></div>
      </div>
      {assessment.candidates.length > 0 ? assessment.candidates.map(candidate => (
        <div key={candidate.candidateId} className="border-t border-slate-800 pt-3 space-y-1">
          <p className="text-xs font-semibold text-slate-100">{candidate.candidateId} · {candidate.qualification.replaceAll('_', ' ')}</p>
          <p className="text-xs text-slate-400">
            {candidate.timing.type === 'DASHA_PERIOD_WINDOW'
              ? `Candidate timing: ${candidate.timing.start ?? 'start unavailable'} — ${candidate.timing.end ?? 'end unavailable'}`
              : 'Candidate timing: untimed'}
          </p>
          <p className="text-xs text-slate-500">Evidence occurrences: {candidate.supportingEvidenceOccurrenceIds.join(', ') || 'not linked'}</p>
          <p className="text-xs text-slate-500">Rules: {candidate.ruleIds.join(', ') || 'not linked'} · Counter-evidence severity: {candidate.counterIndicationSeverity}</p>
          {candidate.counterEvidenceOccurrenceIds.length > 0 && (
            <p className="text-xs text-amber-300">Counter-evidence occurrences: {candidate.counterEvidenceOccurrenceIds.join(', ')}</p>
          )}
        </div>
      )) : (
        <p className="text-xs text-slate-400">No candidate is identified in the current B02 output. This is not evidence that the pathway is unsuitable.</p>
      )}
      <p className="text-[11px] text-slate-500">
        Practical execution: {assessment.practicalExecution} · Financial readiness: {assessment.financialReadiness} · Personal preference: {assessment.personalPreference}
      </p>
    </article>
  );
}

export const CareerPathwayComparisonSection: React.FC<CareerPathwayComparisonSectionProps> = ({ pathwayPotential }) => {
  if (!pathwayPotential) {
    return (
      <section id="career-pathways" aria-labelledby="career-pathways-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
        <h2 id="career-pathways-heading" className="text-base font-semibold text-slate-100">Corporate & Independent Pathways</h2>
        <p className="text-sm text-slate-400">B05 pathway comparison is unavailable because no canonical B02 outcome analysis is attached. No verdict is inferred from B04 profession families.</p>
      </section>
    );
  }

  return (
    <section id="career-pathways" aria-labelledby="career-pathways-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="career-pathways-heading" className="text-base font-semibold text-slate-100">Corporate & Independent Pathways</h2>
          <span className="rounded-full border border-slate-700 px-2 py-1 text-[11px] font-mono text-slate-300">{pathwayPotential.verdict}</span>
        </div>
        <p className="text-xs text-slate-400">{pathwayPotential.statement}</p>
        <p className="text-xs text-slate-500">B05 status: {pathwayPotential.status} · Confidence: {pathwayPotential.confidence.status} · Source: {pathwayPotential.sourceReasoningVersion} / {pathwayPotential.sourceMethodVersion}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ModePanel title="Corporate / employment" assessment={pathwayPotential.employment} />
        <ModePanel title="Entrepreneurial / independent" assessment={pathwayPotential.independent} />
      </div>
      <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3 space-y-2">
        <p className="text-xs text-amber-200">This is a comparison of explicitly qualified B02 candidate pathways, not a recommendation, employment forecast, business-success prediction or suitability assessment.</p>
        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-400">
          {pathwayPotential.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
        </ul>
      </div>
    </section>
  );
};
