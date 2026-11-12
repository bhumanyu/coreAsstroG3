import React from 'react';
import { Compass, CheckCircle2, CircleDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface WealthJourneyStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly state: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
}

export interface WealthJourneyProps {
  readonly steps: readonly WealthJourneyStep[];
}

export const WealthJourney: React.FC<WealthJourneyProps> = ({ steps }) => {
  const { t } = useTranslation('wealth');
  const stateLabels: Record<WealthJourneyStep['state'], string> = {
    AVAILABLE: t('ui.journey.available'),
    PARTIAL: t('ui.journey.partial'),
    UNAVAILABLE: t('ui.journey.unavailable')
  };
  return (
  <nav aria-label={t('ui.journey.aria')} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3">
    <div className="flex items-center gap-2">
      <Compass className="h-4 w-4 text-indigo-300" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-slate-100">{t('ui.journey.title')}</h2>
      <span className="text-xs text-slate-500">{t('ui.journey.scope')}</span>
    </div>
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li key={step.id}>
          <a href={`#${step.id}`} className="group flex h-full min-h-16 items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 transition-colors hover:border-indigo-500/60 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {step.state === 'AVAILABLE'
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                : <CircleDashed className="h-4 w-4 text-amber-300" />}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-slate-200">{index + 1}. {step.title}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{step.description}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-wide text-slate-400">{stateLabels[step.state]}</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  </nav>
  );
};
