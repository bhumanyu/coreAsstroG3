import React, { useState } from 'react';
import { Briefcase, ShieldCheck, Compass, Activity, Zap, HelpCircle } from 'lucide-react';
import type {
  LifeAnalysisCareerDetailViewModel,
  LifeAnalysisDomainSummaryViewModel
} from '../../product/life-analysis/lifeAnalysisTypes';
import type { WhyExperienceViewModel } from '../../product/life-analysis/lifeAnalysisEvidenceTypes';
import {
  formatEnum,
  getVargaBadgeClass,
  getEffectBadgeClass
} from './lifeAnalysisUx';
import { DomainPromiseBadge } from './DomainPromiseBadge';
import { LifeAnalysisEvidencePanel } from './LifeAnalysisEvidencePanel';

interface CareerAnalysisCardProps {
  readonly detail?: LifeAnalysisCareerDetailViewModel;
  readonly summary?: LifeAnalysisDomainSummaryViewModel;
  readonly why?: WhyExperienceViewModel;
}

export const CareerAnalysisCard: React.FC<CareerAnalysisCardProps> = ({
  detail,
  summary,
  why
}) => {
  const [isWhyOpen, setIsWhyOpen] = useState(false);

  if (!detail) {
    return null;
  }

  return (
    <article
      aria-labelledby="career-analysis-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="career-analysis-heading" className="text-base font-semibold text-slate-100">
              Career & Vocation Domain (D10 / 10th House)
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic evaluation of natal promise, Dasamsa varga, and timing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {why && (
            <button
              type="button"
              onClick={() => setIsWhyOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Why this conclusion?</span>
            </button>
          )}
          {summary && <DomainPromiseBadge promise={summary.strength} />}
        </div>
      </div>

      {detail.headline && (
        <h4 className="text-sm font-semibold text-indigo-300 font-serif-astro">
          {detail.headline}
        </h4>
      )}

      {detail.statement && (
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-serif-astro">
          {detail.statement}
        </p>
      )}

      {/* Structural Dimension Breakdown — 3 Distinct Concepts: Natal Promise ≠ D10 ≠ Dasha/Transit */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" aria-hidden="true" />
            Natal Promise
          </span>
          <p className="text-xs font-semibold text-slate-200">
            {formatEnum(detail.natalPromise)}
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-purple-400" aria-hidden="true" />
            D10 Dasamsa
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getVargaBadgeClass(
              detail.d10Relationship
            )}`}
          >
            {formatEnum(detail.d10Relationship)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            Current Dasha
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEffectBadgeClass(
              detail.currentDashaEffect
            )}`}
          >
            {formatEnum(detail.currentDashaEffect)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" aria-hidden="true" />
            Current Transit
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getEffectBadgeClass(
              detail.currentTransitEffect
            )}`}
          >
            {formatEnum(detail.currentTransitEffect)}
          </span>
        </div>
      </div>

      {detail.dominantManifestations && detail.dominantManifestations.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-2">
            Dominant Career Archetypes & Manifestations:
          </span>
          <div className="flex flex-wrap gap-2">
            {detail.dominantManifestations.map((mode) => (
              <span
                key={mode}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono-code text-indigo-300"
              >
                {formatEnum(mode)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Domain Evidence Modal Dialog */}
      {why && (
        <LifeAnalysisEvidencePanel
          isOpen={isWhyOpen}
          onClose={() => setIsWhyOpen(false)}
          title="Career & Vocation Evidence"
          domain="CAREER"
          why={why}
        />
      )}
    </article>
  );
};
