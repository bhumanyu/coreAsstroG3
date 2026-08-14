import React from 'react';
import { YogaCard } from './YogaCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';

interface YogaSectionProps {
  readonly section: any;
}

export const YogaSection: React.FC<YogaSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title="Yoga Formations Unavailable" message="Yoga formation calculations were not provided in the report." />;
  }

  const detectedCount = section.detected?.length || 0;
  const strongCount = section.strong?.length || 0;
  const weakenedCount = section.weakened?.length || 0;
  const cancelledCount = section.cancelled?.length || 0;
  const neutralCount = section.neutral?.length || 0;

  const allYogas = section.detected || [];

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Yoga formation analysis is partial." />}

      {/* Summary Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Detected</span>
          <span className="text-base font-mono-code font-bold text-slate-100">{detectedCount}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] font-mono-code uppercase text-emerald-400 block">Strong</span>
          <span className="text-base font-mono-code font-bold text-emerald-300">{strongCount}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/30">
          <span className="text-[10px] font-mono-code uppercase text-amber-400 block">Weakened</span>
          <span className="text-base font-mono-code font-bold text-amber-300">{weakenedCount}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-rose-500/30">
          <span className="text-[10px] font-mono-code uppercase text-rose-400 block">Cancelled</span>
          <span className="text-base font-mono-code font-bold text-rose-300">{cancelledCount}</span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Neutral</span>
          <span className="text-base font-mono-code font-bold text-slate-300">{neutralCount}</span>
        </div>
      </div>

      {/* Yogas Grid */}
      {allYogas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allYogas.map((yoga: any, idx: number) => (
            <YogaCard key={`${yoga.type}-${idx}`} yoga={yoga} />
          ))}
        </div>
      ) : (
        <EmptyState title="No Yogas Detected" message="No classical planetary yoga combinations were detected in this chart." />
      )}
    </div>
  );
};
