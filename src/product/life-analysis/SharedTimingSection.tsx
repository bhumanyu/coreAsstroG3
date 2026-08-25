import React, { useState } from 'react';
import type { CareerTimingSynthesis, WealthTimingSynthesis } from '../../domain/timing/careerWealthTiming';
import { CareerTimingSection } from './CareerTimingSection';
import { WealthTimingSection } from './WealthTimingSection';

export interface SharedTimingSectionProps {
  careerTimingSynthesis?: CareerTimingSynthesis;
  wealthTimingSynthesis?: WealthTimingSynthesis;
  className?: string;
}

export const SharedTimingSection: React.FC<SharedTimingSectionProps> = ({
  careerTimingSynthesis,
  wealthTimingSynthesis,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'CAREER' | 'WEALTH'>('CAREER');

  if (!careerTimingSynthesis && !wealthTimingSynthesis) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {careerTimingSynthesis && (
          <button
            type="button"
            onClick={() => setActiveTab('CAREER')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'CAREER'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Career Timing
          </button>
        )}
        {wealthTimingSynthesis && (
          <button
            type="button"
            onClick={() => setActiveTab('WEALTH')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'WEALTH'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Wealth Timing
          </button>
        )}
      </div>

      {activeTab === 'CAREER' && careerTimingSynthesis && (
        <CareerTimingSection timingSynthesis={careerTimingSynthesis} />
      )}

      {activeTab === 'WEALTH' && wealthTimingSynthesis && (
        <WealthTimingSection timingSynthesis={wealthTimingSynthesis} />
      )}
    </div>
  );
};
