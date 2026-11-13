import React from 'react';
import { AnalysisAvailability } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enumLabel } from '../../i18n/enumLabels';

interface ReportStatusBadgeProps {
  readonly status?: AnalysisAvailability;
}

export const ReportStatusBadge: React.FC<ReportStatusBadgeProps> = ({ status = 'AVAILABLE' }) => {
  const { t: tEnum } = useTranslation('enums');
  switch (status) {
    case 'AVAILABLE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>{enumLabel(tEnum, 'productAvailability', status)}</span>
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>{enumLabel(tEnum, 'productAvailability', status)}</span>
        </span>
      );
    case 'UNAVAILABLE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
          <XCircle className="w-3 h-3" />
          <span>{enumLabel(tEnum, 'productAvailability', status)}</span>
        </span>
      );
  }
};
