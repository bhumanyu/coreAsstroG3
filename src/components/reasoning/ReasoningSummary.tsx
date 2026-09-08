import React from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

export interface ReasoningSummaryProps {
  readonly evidenceCount: number;
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
}

export const ReasoningSummary: React.FC<ReasoningSummaryProps> = ({
  evidenceCount,
  supportingEvidenceCount,
  challengingEvidenceCount
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Total Evidence</span>
          <span className="text-lg font-bold text-slate-100">{evidenceCount}</span>
        </div>
        <HelpCircle className="w-5 h-5 text-indigo-400" aria-hidden="true" />
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono-code uppercase text-emerald-400/80 block">Supporting</span>
          <span className="text-lg font-bold text-emerald-300">{supportingEvidenceCount}</span>
        </div>
        <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono-code uppercase text-rose-400/80 block">Challenging</span>
          <span className="text-lg font-bold text-rose-300">{challengingEvidenceCount}</span>
        </div>
        <XCircle className="w-5 h-5 text-rose-400" aria-hidden="true" />
      </div>
    </div>
  );
};
