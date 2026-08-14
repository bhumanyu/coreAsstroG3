import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ThemeInterpretationUnavailableProps {
  readonly themeName: string;
  readonly reason?: string;
  readonly id?: string;
}

export const ThemeInterpretationUnavailable: React.FC<ThemeInterpretationUnavailableProps> = ({
  themeName,
  reason,
  id
}) => {
  return (
    <div
      id={id}
      className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-center space-y-2"
    >
      <div className="flex items-center justify-center gap-2 text-slate-400 font-serif-astro text-sm font-bold">
        <AlertCircle className="w-4 h-4 text-amber-400" />
        {themeName} Interpretation Unavailable
      </div>
      <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
        {reason ||
          `Detailed deterministic interpretation for ${themeName} could not be calculated due to missing planetary positions or configuration data.`}
      </p>
    </div>
  );
};
