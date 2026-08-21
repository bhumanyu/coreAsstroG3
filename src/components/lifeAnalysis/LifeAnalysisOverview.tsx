import React from 'react';
import { Compass, Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import type {
  LifeAnalysisOverallViewModel,
  LifeAnalysisCompletenessViewModel
} from '../../product/life-analysis/lifeAnalysisTypes';
import type { LifeAnalysisConfidence } from '../../domain/synthesis';
import {
  formatEnum,
  getStatusBadgeClass,
  getConfidenceBadgeClass
} from './lifeAnalysisUx';

interface LifeAnalysisOverviewProps {
  readonly overall: LifeAnalysisOverallViewModel;
  readonly completeness: LifeAnalysisCompletenessViewModel;
  readonly confidence: LifeAnalysisConfidence;
}

export const LifeAnalysisOverview: React.FC<LifeAnalysisOverviewProps> = ({
  overall,
  completeness,
  confidence
}) => {
  return (
    <section
      aria-labelledby="overview-heading"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="overview-heading" className="text-lg font-semibold text-slate-100">
              Life Domain Synthesis Overview
            </h2>
            <p className="text-xs text-slate-400">
              Unified cross-domain deterministic synthesis & alignment
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
              overall.status
            )}`}
          >
            {formatEnum(overall.status)}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono-code border flex items-center gap-1.5 ${getConfidenceBadgeClass(
              confidence
            )}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Confidence: {formatEnum(confidence)}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono-code bg-slate-800/80 text-slate-300 border border-slate-700">
            {completeness.label}
          </span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-serif-astro">
          {overall.statement}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
              <span>Strongest Areas of Focus</span>
            </div>
            {overall.strongestDomainNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {overall.strongestDomainNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                No explicitly dominant domain singled out
              </span>
            )}
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Challenged / Deliberate Growth Areas</span>
            </div>
            {overall.challengedDomainNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {overall.challengedDomainNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                No severe domain-level challenges detected
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
