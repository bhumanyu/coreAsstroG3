import React from 'react';
import { PageHeading } from '../layout/PageHeading';
import type { ReasoningHeroViewModel } from '../../product/analysis/reasoningViewModel';
import {
  formatConfidence,
  formatConclusionStatus,
  formatPromiseStrength,
  getConclusionStatusBadgeClass,
  getPromiseStrengthBadgeClass
} from './reasoningFormat';
import {
  AlertTriangle,
  ShieldCheck,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export interface ReasoningHeroProps {
  readonly hero: ReasoningHeroViewModel;
}

export const ReasoningHero: React.FC<ReasoningHeroProps> = ({ hero }) => {
  const warnings = hero.warnings || [];

  const statusBadgeClass = getConclusionStatusBadgeClass(hero.status);
  const strengthBadgeClass = getPromiseStrengthBadgeClass(hero.strength);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Explainable Astrological Intelligence"
        title={hero.title}
        description="Deterministic evidence framework, divisional alignment, chronological dasha timing, and evidentiary provenance."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusBadgeClass}`}>
            <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{formatConclusionStatus(hero.status)}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${strengthBadgeClass}`}>
            <span className="font-mono-code">{formatPromiseStrength(hero.strength)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono-code">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>{formatConfidence(hero.confidence)}</span>
          </div>

          {warnings.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono-code">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>
                {warnings.length} {warnings.length === 1 ? 'Notice' : 'Notices'}
              </span>
            </div>
          )}
        </div>
      </PageHeading>

      {/* Evidentiary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-slate-400 block">Total Evidence Items</span>
            <span className="text-xl font-bold text-slate-100">{hero.evidenceCount} Evidence Items</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-emerald-400/80 block">Supporting Factors</span>
            <span className="text-xl font-bold text-emerald-300">{hero.supportingEvidenceCount} Factors</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-rose-400/80 block">Challenging Factors</span>
            <span className="text-xl font-bold text-rose-300">{hero.challengingEvidenceCount} Factors</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};
