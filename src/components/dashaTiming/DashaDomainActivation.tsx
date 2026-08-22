import React from 'react';
import { Target } from 'lucide-react';
import type { CareerTimingProduct, WealthTimingProduct } from '../../product/dasha-timing/dashaTimingTypes';
import { CareerTimingCard } from './CareerTimingCard';
import { WealthTimingCard } from './WealthTimingCard';

export interface DashaDomainActivationProps {
  readonly career?: CareerTimingProduct;
  readonly wealth?: WealthTimingProduct;
  readonly onOpenEvidence?: (evidenceIds: readonly string[]) => void;
}

export const DashaDomainActivation: React.FC<DashaDomainActivationProps> = ({
  career,
  wealth,
  onOpenEvidence
}) => {
  return (
    <section aria-labelledby="domain-timing-heading" className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 id="domain-timing-heading" className="text-base sm:text-lg font-semibold text-slate-100">
              Life Domain Timing Activations
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic activation of Career (10H/D10) and Wealth (2H/11H/9H/5H) across active Dasha periods
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CareerTimingCard timing={career} onOpenEvidence={onOpenEvidence} />
        <WealthTimingCard timing={wealth} onOpenEvidence={onOpenEvidence} />
      </div>
    </section>
  );
};
