import React from 'react';
import { AnalysisAvailability } from '../../types';
import { ReportStatusBadge } from './ReportStatusBadge';

interface ReportSectionProps {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly status?: AnalysisAvailability;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  id,
  number,
  title,
  subtitle,
  status,
  children,
  className = ''
}) => {
  return (
    <section
      id={id}
      className={`scroll-mt-24 sm:scroll-mt-28 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 transition-all ${className}`}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-start sm:items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono-code font-bold text-xs shrink-0">
            {String(number).padStart(2, '0')}
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif-astro text-slate-100 tracking-wide">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {status && (
          <div className="shrink-0 self-start sm:self-center">
            <ReportStatusBadge status={status} />
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
};
