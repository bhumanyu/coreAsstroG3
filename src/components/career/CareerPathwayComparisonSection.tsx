import React from 'react';
import type { CareerProfessionViewModel } from '../../product/analysis/careerViewModel';
import type { ProductCareerOutcomeAnalysis } from '../../product/analysis/productAnalysisTypes';

export interface CareerPathwayComparisonSectionProps {
  readonly profession: CareerProfessionViewModel;
  readonly outcomeQualification?: ProductCareerOutcomeAnalysis;
}

export const CareerPathwayComparisonSection: React.FC<CareerPathwayComparisonSectionProps> = ({ profession, outcomeQualification }) => {
  const candidates = profession.ranking.rankedCandidates.filter(candidate =>
    /corporate|employment|service|independent|business|entrepreneur/i.test(`${candidate.domain} ${candidate.family}`)
  );
  const corporate = candidates.filter(candidate => /corporate|employment|service/i.test(`${candidate.domain} ${candidate.family}`));
  const independent = candidates.filter(candidate => /independent|business|entrepreneur/i.test(`${candidate.domain} ${candidate.family}`));
  const outcomeModes = outcomeQualification?.candidateOutcomes.filter(candidate =>
    candidate.outcomeType === 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY' || candidate.outcomeType === 'INDEPENDENT_OR_BUSINESS_ACTIVITY'
  ) ?? [];

  return (
    <section id="career-pathways" aria-labelledby="career-pathways-heading" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
      <header className="space-y-1">
        <h2 id="career-pathways-heading" className="text-base font-semibold text-slate-100">Corporate & Independent Pathways</h2>
        <p className="text-xs text-slate-400">A side-by-side view of pathway candidates that C11/B02 have actually supplied. This is not a recommendation or decision.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Corporate / employment</h3>
          {corporate.length > 0 ? corporate.map(candidate => (
            <div key={candidate.candidateId} className="space-y-1">
              <p className="text-sm text-slate-100">{candidate.domain} · {candidate.family}</p>
              <p className="text-xs text-slate-400">{candidate.alternativeExplanation}</p>
              <p className="text-xs text-slate-500">C11 confidence {candidate.confidence} · D10 {candidate.d10Status}</p>
            </div>
          )) : <p className="text-xs text-slate-400">No separately identified corporate/employment pathway candidate in the canonical profession ranking.</p>}
          {outcomeModes.filter(candidate=>candidate.outcomeType==='EMPLOYMENT_OR_SERVICE_OPPORTUNITY').map(candidate=>(
            <p key={candidate.candidateId} className="text-xs text-slate-300">B02: Employment or service opportunity · {candidate.qualification.replaceAll('_',' ')} · Candidate only</p>
          ))}
        </article>
        <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-200">Entrepreneurial / independent</h3>
          {independent.length > 0 ? independent.map(candidate => (
            <div key={candidate.candidateId} className="space-y-1">
              <p className="text-sm text-slate-100">{candidate.domain} · {candidate.family}</p>
              <p className="text-xs text-slate-400">{candidate.alternativeExplanation}</p>
              <p className="text-xs text-slate-500">C11 rank {candidate.rank} · {candidate.confidence} confidence · D10 {candidate.d10Status}</p>
            </div>
          )) : <p className="text-xs text-slate-400">No separately identified independent/business pathway candidate in the canonical profession ranking.</p>}
          {outcomeModes.filter(candidate=>candidate.outcomeType==='INDEPENDENT_OR_BUSINESS_ACTIVITY').map(candidate=>(
            <p key={candidate.candidateId} className="text-xs text-slate-300">B02: Independent or business activity · {candidate.qualification.replaceAll('_',' ')} · Candidate only</p>
          ))}
        </article>
      </div>
      <p className="text-xs leading-relaxed text-amber-300">The current schema does not provide a dedicated corporate-versus-entrepreneurial suitability verdict. Empty sides mean no candidate was supplied, not that the pathway is unsuitable. Practical execution, personal preference and financial readiness are not assessed here.</p>
    </section>
  );
};
