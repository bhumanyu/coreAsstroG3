import React from 'react';
import { useTranslation } from 'react-i18next';
import { EvidenceConfidence } from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { enumLabel } from '../../../i18n/enumLabels';

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
  const { t: tEnum } = useTranslation('enums');
  const { t } = useTranslation('reports');
  const label = t('fullNatal.components.themeEvidence.evidenceConfidence', {
    value: enumLabel(tEnum, 'productConfidence', confidence)
  });

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
