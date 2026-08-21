import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import type { LifeAnalysisCompletenessViewModel } from '../../product/life-analysis/lifeAnalysisTypes';

interface LifeAnalysisStatusBadgeProps {
  readonly completeness?: LifeAnalysisCompletenessViewModel | string;
  readonly status?: string;
  readonly className?: string;
}

export const LifeAnalysisStatusBadge: React.FC<LifeAnalysisStatusBadgeProps> = ({
  completeness,
  status,
  className = ''
}) => {
  const code =
    typeof completeness === 'string'
      ? completeness.toUpperCase()
      : completeness?.overall?.toUpperCase() || status?.toUpperCase() || 'COMPLETE';

  if (code === 'PARTIAL') {
    return (
      <span
        role="status"
        aria-label="Partial Analysis"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        <span>Partial Analysis</span>
      </span>
    );
  }

  if (code === 'INSUFFICIENT_DATA') {
    return (
      <span
        role="status"
        aria-label="Insufficient Data"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
        <span>Insufficient Data</span>
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label="Analysis Complete"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 ${className}`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
      <span>Analysis Complete</span>
    </span>
  );
};
