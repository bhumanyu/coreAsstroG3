import React from 'react';
import { Info } from 'lucide-react';

interface LifeAnalysisPartialProps {
  readonly message?: string;
}

export const LifeAnalysisPartial: React.FC<LifeAnalysisPartialProps> = ({
  message = 'Partial life domain analysis rendered. One or more domains had incomplete upstream astrological inputs.'
}) => {
  return (
    <div
      role="status"
      aria-label="Partial Analysis Notice"
      className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-200"
    >
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
        <Info className="w-4 h-4" aria-hidden="true" />
      </div>
      <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-sans">
        {message}
      </p>
    </div>
  );
};
