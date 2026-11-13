import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '../layout/PageHeading';
import type { ReasoningHeroViewModel } from '../../product/analysis/reasoningViewModel';
import {
  getConclusionStatusBadgeClass,
  getPromiseStrengthBadgeClass
} from './reasoningFormat';
import { enumLabel } from '../../i18n/enumLabels';
import {
  AlertTriangle,
  ShieldCheck,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export interface ReasoningHeroProps {
  readonly hero: ReasoningHeroViewModel;
}

export const ReasoningHero: React.FC<ReasoningHeroProps> = ({ hero }) => {
  const { t } = useTranslation('reports');
  const { t: tEnum } = useTranslation('enums');
  const warnings = hero.warnings || [];

  const statusBadgeClass = getConclusionStatusBadgeClass(hero.status);
  const strengthBadgeClass = getPromiseStrengthBadgeClass(hero.strength);

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={t('reasoning.heroEyebrow')}
        title={hero.title}
        description={t('reasoning.heroDescription')}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusBadgeClass}`}>
            <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{enumLabel(tEnum, 'conclusionStatus', hero.status)}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${strengthBadgeClass}`}>
            <span className="font-mono-code">{enumLabel(tEnum, 'promiseStrength', hero.strength)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono-code">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
            <span>{enumLabel(tEnum, 'productConfidence', hero.confidence)}</span>
          </div>

          {warnings.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono-code">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>
                {t(warnings.length === 1 ? 'reasoning.notice' : 'reasoning.notices', { count: warnings.length })}
              </span>
            </div>
          )}
        </div>
      </PageHeading>

      {/* Evidentiary Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-slate-400 block">{t('reasoning.totalEvidence')}</span>
            <span className="text-xl font-bold text-slate-100">{t('reasoning.evidenceItems', { count: hero.evidenceCount })}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-emerald-400/80 block">{t('reasoning.supportingFactors')}</span>
            <span className="text-xl font-bold text-emerald-300">{t('reasoning.factorCount', { count: hero.supportingEvidenceCount })}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono-code uppercase text-rose-400/80 block">{t('reasoning.challengingFactors')}</span>
            <span className="text-xl font-bold text-rose-300">{t('reasoning.factorCount', { count: hero.challengingEvidenceCount })}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};
