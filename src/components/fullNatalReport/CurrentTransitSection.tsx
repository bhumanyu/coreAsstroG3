import React from 'react';
import { CurrentTransitSection as CurrentTransitSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';

interface CurrentTransitSectionProps {
  readonly section: CurrentTransitSectionType;
}

export const CurrentTransitSection: React.FC<CurrentTransitSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE') {
    return (
      <EmptyState
        title="Current Transit Analysis Unavailable"
        message={section.reason || 'Real-time transit analysis was excluded from the natal analysis report.'}
      />
    );
  }

  return (
    <div className="space-y-3">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Transit analysis is partial." />}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono-code">
        {section.reason}
      </div>
    </div>
  );
};
