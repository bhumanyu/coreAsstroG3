import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PartialStateNoticeProps {
  readonly message?: string;
}

export const PartialStateNotice: React.FC<PartialStateNoticeProps> = ({
  message = 'Partial analysis available. Some calculations or inputs were incomplete in the upstream report.'
}) => {
  return (
    <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-amber-200/90 text-xs my-2">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <span className="font-semibold uppercase tracking-wider font-mono-code text-[11px] text-amber-400 block">
          Partial Analysis Notice
        </span>
        <p className="leading-relaxed text-slate-300">{message}</p>
      </div>
    </div>
  );
};
