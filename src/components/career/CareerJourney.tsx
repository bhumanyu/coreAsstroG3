import React from 'react';
import { Compass, CheckCircle2, CircleDashed } from 'lucide-react';

export interface CareerJourneyStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly state: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
}

export interface CareerJourneyProps {
  readonly steps: readonly CareerJourneyStep[];
}

const stateLabel: Record<CareerJourneyStep['state'], string> = {
  AVAILABLE: 'Available',
  PARTIAL: 'Partial',
  UNAVAILABLE: 'Unavailable'
};

export const CareerJourney: React.FC<CareerJourneyProps> = ({ steps }) => (
  <nav aria-label="Guided career journey" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3">
    <div className="flex items-center gap-2">
      <Compass className="h-4 w-4 text-indigo-300" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-slate-100">Your Career Journey</h2>
      <span className="text-xs text-slate-500">Canonical C11 · B01–B06 outputs</span>
    </div>
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {steps.map((step, index) => (
        <li key={step.id}>
          <a href={`#${step.id}`} className="group flex h-full min-h-16 items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left transition-colors hover:border-indigo-500/60 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
            <span className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true">
              {step.state === 'AVAILABLE' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <CircleDashed className="h-4 w-4 text-amber-300" />}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-slate-200">{index + 1}. {step.title}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{step.description}</span>
              <span className="mt-1 block text-[10px] uppercase tracking-wide text-slate-400">{stateLabel[step.state]}</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  </nav>
);
