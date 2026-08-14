import React from 'react';
import { ChevronDown, FileText } from 'lucide-react';

interface EvidenceListProps {
  readonly evidence?: readonly unknown[];
  readonly title?: string;
  readonly className?: string;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
  evidence,
  title = 'Technical Evidence & Rules',
  className = ''
}) => {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  const renderEvidenceItem = (item: unknown, index: number) => {
    if (item === null || item === undefined) {
      return null;
    }

    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      return (
        <li key={index} className="text-xs text-slate-300 font-mono-code leading-relaxed">
          {String(item)}
        </li>
      );
    }

    if (typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      
      // Known rule structure handling
      const ruleId = typeof obj.ruleId === 'string' ? obj.ruleId : undefined;
      const type = typeof obj.type === 'string' ? obj.type : undefined;
      const reason = typeof obj.reason === 'string' ? obj.reason : undefined;
      const description = typeof obj.description === 'string' ? obj.description : undefined;

      if (ruleId || reason || description || type) {
        return (
          <li key={index} className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              {ruleId && (
                <span className="font-mono-code font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 text-[10px]">
                  {ruleId}
                </span>
              )}
              {type && (
                <span className="font-mono-code text-[10px] text-slate-400 uppercase tracking-wider">
                  {type}
                </span>
              )}
            </div>
            {(reason || description) && (
              <p className="text-slate-300 font-sans leading-relaxed">
                {reason || description}
              </p>
            )}
            {/* Render any additional fields cleanly */}
            <div className="text-[11px] font-mono-code text-slate-400 space-y-0.5 pt-1">
              {Object.entries(obj).map(([k, v]) => {
                if (['ruleId', 'type', 'reason', 'description'].includes(k) || v === undefined) {
                  return null;
                }
                let displayVal = String(v);
                if (typeof v === 'object') {
                  try {
                    displayVal = JSON.stringify(v);
                  } catch {
                    displayVal = '[Object]';
                  }
                }
                return (
                  <div key={k} className="flex items-start gap-1">
                    <span className="text-slate-500">{k}:</span>
                    <span className="text-slate-300 break-all">{displayVal}</span>
                  </div>
                );
              })}
            </div>
          </li>
        );
      }

      // Fallback object rendering
      return (
        <li key={index} className="bg-slate-950/60 rounded-lg p-2 border border-slate-800 text-xs text-slate-300 font-mono-code space-y-1">
          {Object.entries(obj).map(([k, v]) => (
            <div key={k} className="flex items-start gap-1">
              <span className="text-indigo-400 font-semibold">{k}:</span>
              <span className="text-slate-300 break-all">
                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </li>
      );
    }

    return null;
  };

  return (
    <details className={`group bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden ${className}`}>
      <summary className="px-3 py-2 flex items-center justify-between text-xs font-mono-code font-medium text-slate-400 hover:text-indigo-300 cursor-pointer select-none bg-slate-900/50 hover:bg-slate-900/80 transition-colors">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          {title} ({evidence.length})
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="p-3 bg-slate-950/80 border-t border-slate-800/60">
        <ul className="space-y-2">
          {evidence.map((item, idx) => renderEvidenceItem(item, idx))}
        </ul>
      </div>
    </details>
  );
};
