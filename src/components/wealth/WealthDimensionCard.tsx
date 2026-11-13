import React from 'react';
import type { WealthDimensionItemViewModel } from '../../product/analysis/wealthViewModel';
import { getConclusionStatusBadgeClass } from './wealthFormat';
import { Landmark, TrendingUp, Sparkles, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

export interface WealthDimensionCardProps {
  readonly dimension: WealthDimensionItemViewModel;
}

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  ACCUMULATION: <Landmark className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
  GAINS: <TrendingUp className="w-4 h-4 text-teal-400" aria-hidden="true" />,
  FORTUNE: <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />,
  SPECULATION: <Flame className="w-4 h-4 text-purple-400" aria-hidden="true" />
};

export const WealthDimensionCard: React.FC<WealthDimensionCardProps> = ({ dimension }) => {
  const { t } = useTranslation('enums');
  const formattedStatus = enumLabel(t, 'wealthDimensionStatus', dimension.status);
  const statusBadgeClass = getConclusionStatusBadgeClass(dimension.status);
  const icon = DIMENSION_ICONS[dimension.id] ?? (
    <Landmark className="w-4 h-4 text-slate-400" aria-hidden="true" />
  );

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between light:bg-slate-50 light:border-slate-200">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 light:border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 light:bg-slate-50 light:border-slate-200">
              {icon}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 light:text-slate-900 font-sans block">
                {dimension.label}
              </span>
              <span className="text-[11px] font-mono-code text-slate-400 light:text-slate-500 block">
                {dimension.houseLabel}
              </span>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border ${statusBadgeClass}`}
          >
            {formattedStatus}
          </span>
        </div>

        {dimension.statement ? (
          <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans pt-1">
            {dimension.statement}
          </p>
        ) : (
          <p className="text-xs text-slate-400 light:text-slate-500 italic font-sans pt-1">
            Dimension analysis pending classical factor evaluation.
          </p>
        )}
      </div>
    </div>
  );
};
