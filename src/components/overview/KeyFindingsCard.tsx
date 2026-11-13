import React from 'react';
import { useTranslation } from 'react-i18next';
import type { OverviewFinding } from '../../product/analysis/overviewViewModel';
import { Layers, CheckCircle } from 'lucide-react';
import { enumLabel } from '../../i18n/enumLabels';
import { TechnicalEvidenceDetails } from '../reasoning/TechnicalEvidenceDetails';

export interface KeyFindingsCardProps {
  readonly findings: readonly OverviewFinding[];
}

export const FindingRow: React.FC<{ readonly finding: OverviewFinding }> = ({ finding }) => {
  const { t: tEnum } = useTranslation('enums');
  const roleText = enumLabel(tEnum, 'productEvidenceRole', finding.role);
  const directionText = enumLabel(tEnum, 'productDirection', finding.direction);

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-1">
          {finding.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            {roleText}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-code bg-slate-800 border border-slate-700 text-slate-300">
            {directionText}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {finding.explanation}
      </p>
      <p className="text-[10px] text-slate-500">{finding.sourceLabel}</p>
      <TechnicalEvidenceDetails evidence={finding} />
    </div>
  );
};

export const KeyFindingsCard: React.FC<KeyFindingsCardProps> = ({ findings }) => {
  const { t } = useTranslation('dashboard');
  return (
    <section
      aria-label={t('findings.ariaLabel')}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Layers className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {t('findings.title')}
            </h3>
            <span className="text-xs text-slate-400">
              {t('findings.subtitle')}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {findings.length > 0 ? (
            findings.map((f, idx) => (
              <FindingRow key={`${f.id}-${idx}`} finding={f} />
            ))
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
              <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" aria-hidden="true" />
              <span>{t('findings.empty')}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
