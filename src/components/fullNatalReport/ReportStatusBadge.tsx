import React from 'react';
import { AnalysisAvailability } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ReportStatusBadgeProps {
  readonly status?: AnalysisAvailability;
}

export const ReportStatusBadge: React.FC<ReportStatusBadgeProps> = ({ status = 'AVAILABLE' }) => {
  switch (status) {
    case 'AVAILABLE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>Available</span>
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>Partial</span>
        </span>
      );
    case 'UNAVAILABLE':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
          <XCircle className="w-3 h-3" />
          <span>Unavailable</span>
        </span>
      );
  }
};
