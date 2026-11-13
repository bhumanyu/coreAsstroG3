import React from 'react';
import { useTranslation } from 'react-i18next';
import type { UserFacingEvidence } from '../../product/life-analysis/evidencePresentation';

export interface TechnicalEvidenceDetailsProps {
  readonly evidence: UserFacingEvidence;
}

export const TechnicalEvidenceDetails: React.FC<TechnicalEvidenceDetailsProps> = ({ evidence }) => {
  const { t } = useTranslation('reports');
  const { technical } = evidence;
  const fields: readonly [string, string | undefined][] = [
    [t('reasoning.technicalEvidence.id'), technical.id],
    [t('reasoning.technicalEvidence.ruleId'), technical.ruleId],
    [t('reasoning.technicalEvidence.source'), technical.source],
    [t('reasoning.technicalEvidence.role'), technical.role],
    [t('reasoning.technicalEvidence.direction'), technical.direction],
    [t('reasoning.technicalEvidence.sourceType'), technical.sourceType],
    [t('reasoning.technicalEvidence.phase'), technical.phase],
    [t('reasoning.technicalEvidence.dimension'), technical.dimension],
    [t('reasoning.technicalEvidence.house'), technical.house?.toString()],
    [t('reasoning.technicalEvidence.houses'), technical.houses?.join(', ')],
    [t('reasoning.technicalEvidence.planet'), technical.planet],
    [t('reasoning.technicalEvidence.derivedFrom'), technical.derivedFromIds?.join(', ')],
    [t('reasoning.technicalEvidence.statement'), technical.statement]
  ];

  return (
    <details className="mt-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2">
      <summary className="cursor-pointer text-xs font-medium text-slate-400">
        {t('reasoning.technicalEvidence.title')}
      </summary>
      <dl className="mt-2 space-y-1 text-[11px]">
        {fields.map(([label, value]) => value ? (
          <div key={label} className="grid grid-cols-[auto_1fr] gap-x-2">
            <dt className="font-medium text-slate-500">{label}</dt>
            <dd className="break-all font-mono-code text-slate-300">{value}</dd>
          </div>
        ) : null)}
      </dl>
    </details>
  );
};
