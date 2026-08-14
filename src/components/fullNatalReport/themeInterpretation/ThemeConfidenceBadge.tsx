import React from 'react';
import { formatConfidence } from './themeUiUtils';
import { EvidenceConfidence } from '../../../engine/themeInterpretation/themeInterpretationTypes';

interface ThemeConfidenceBadgeProps {
  readonly confidence: EvidenceConfidence | string;
  readonly className?: string;
  readonly id?: string;
}

export const ThemeConfidenceBadge: React.FC<ThemeConfidenceBadgeProps> = ({
  confidence,
  className = '',
  id
}) => {
  const label = formatConfidence(confidence);

  return (
    <span
      id={id}
      aria-label={label}
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono-code bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 ${className}`}
    >
      {label}
    </span>
  );
};
