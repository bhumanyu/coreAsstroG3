import React from 'react';
import { useTranslation } from 'react-i18next';
import { MethodologySection } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface MethodologyCardProps {
  readonly section: MethodologySection;
}

export const MethodologyCard: React.FC<MethodologyCardProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title={t('fullNatal.components.methodology.unavailableTitle')} message={t('fullNatal.components.methodology.unavailableMessage')} />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.methodology')} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.methodology.zodiac')}</span>
          <span className="text-xs font-mono-code font-bold text-slate-200">{section.zodiac}</span>
        </div>
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.methodology.ayanamsa')}</span>
          <span className="text-xs font-mono-code font-bold text-indigo-300">{section.ayanamsa}</span>
        </div>
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.methodology.houseSystem')}</span>
          <span className="text-xs font-mono-code font-bold text-slate-200">{section.houseSystem}</span>
        </div>
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.methodology.dashaSystem')}</span>
          <span className="text-xs font-mono-code font-bold text-slate-200">{section.dashaSystem}</span>
        </div>
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.methodology.aspectSystem')}</span>
          <span className="text-xs font-mono-code font-bold text-slate-200">{section.aspectSystem}</span>
        </div>
      </div>

      {/* Divisional Charts list */}
      {section.divisionalCharts && section.divisionalCharts.length > 0 && (
        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> {t('fullNatal.components.methodology.divisionalCharts')}
          </span>
          <div className="flex flex-wrap gap-2">
            {section.divisionalCharts.map((chart) => (
              <span key={chart} className="px-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono-code text-slate-300">
                {chart}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Limitations if present */}
      {section.limitations && section.limitations.length > 0 && (
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono-code uppercase text-amber-400 flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-3.5 h-3.5" /> {t('fullNatal.components.methodology.engineLimitations')}
          </span>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
            {section.limitations.map((lim, idx) => (
              <li key={idx}>{lim}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
