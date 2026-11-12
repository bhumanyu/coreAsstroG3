import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WealthLifecycleViewModel } from '../../product/analysis/wealthViewModel';
import { Clock3, AlertCircle, ShieldCheck, Lock } from 'lucide-react';

export interface WealthLifecycleSectionProps { readonly lifecycle: WealthLifecycleViewModel; }

export const WealthLifecycleSection: React.FC<WealthLifecycleSectionProps> = ({ lifecycle }) => {
  const { t } = useTranslation('wealth');
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4" aria-labelledby="wealth-lifecycle-title">
      <div className="flex items-start gap-3 border-b border-slate-800/80 pb-3">
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-300"><Clock3 className="h-5 w-5" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1">
          <h2 id="wealth-lifecycle-title" className="text-base font-semibold text-slate-100">{t('lifecycle.title')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('disclaimers.lifecycle')}</p>
        </div>
        <span className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">{lifecycle.status.replaceAll('_', ' ')}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] text-slate-400">{t('lifecycle.candidates')}</div><div className="mt-1 text-xl font-semibold text-slate-100">{lifecycle.candidateCount}</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] text-slate-400">{t('lifecycle.observedFacts')}</div><div className="mt-1 text-xl font-semibold text-slate-100">{lifecycle.observedFactCount}</div></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"><div className="text-[11px] text-slate-400">{t('lifecycle.guarantee')}</div><div className="mt-1 text-sm font-semibold text-slate-100">{t('lifecycle.none')}</div></div>
      </div>

      {lifecycle.candidates.length > 0 ? (
        <div className="space-y-3">
          {lifecycle.candidates.map(candidate => (
            <article key={candidate.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-100">{candidate.type}</h3><span className="text-xs text-slate-400">{candidate.status}</span></div>
              <p className="text-xs text-slate-300">{candidate.timingLabel}</p>
              {candidate.limitations.map((item, index) => <p key={index} className="text-xs text-slate-400">{item}</p>)}
            </article>
          ))}
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          {lifecycle.status === 'BLOCKED' ? <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />}
          <div><p className="text-sm font-medium text-slate-200">{t('lifecycle.rulesNotApproved')}</p><p className="mt-1 text-xs text-slate-400">{t('lifecycle.rulesNotApprovedDescription')}</p></div>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-300" aria-hidden="true" /><h3 className="text-xs font-semibold text-slate-200">{t('lifecycle.diagnostics')}</h3></div>
        {lifecycle.diagnostics.length > 0 ? lifecycle.diagnostics.slice(0, 12).map((item, index) => (
          <div key={item.code + '-' + (item.eventType ?? 'all') + '-' + index} className="text-xs text-slate-400"><span className="font-mono text-slate-300">{item.code}</span>{item.eventType ? ' · ' + item.eventType.replaceAll('_', ' ') : ''}: {item.message}</div>
        )) : <p className="text-xs text-slate-400">{t('lifecycle.noDiagnostics')}</p>}
      </div>

      <p className="text-xs leading-relaxed text-slate-400">{lifecycle.statement}</p>
      <p className="text-[11px] text-slate-500">{t('disclaimers.lifecycleFacts')}</p>
    </section>
  );
};