import React from 'react';
import { useTranslation } from 'react-i18next';
import { BirthInformationSection } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { Calendar, MapPin, Clock, Compass, Globe } from 'lucide-react';

interface BirthInformationCardProps {
  readonly section: BirthInformationSection;
}

export const BirthInformationCard: React.FC<BirthInformationCardProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE') {
    return <EmptyState title={t('fullNatal.components.birthInformation.unavailableTitle')} message={t('fullNatal.components.birthInformation.unavailableMessage')} />;
  }

  const { details } = section;

  return (
    <div className="space-y-3">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.birthInformation')} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {details.name && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400">{t('fullNatal.components.birthInformation.subjectName')}</span>
            <p className="text-sm font-semibold text-slate-100">{details.name}</p>
          </div>
        )}

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" /> {t('fullNatal.components.birthInformation.dateTime')}
          </span>
          <p className="text-sm font-mono-code font-semibold text-slate-100 break-all">{details.dateTimeStr}</p>
        </div>

        {details.placeOfBirth && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" /> {t('fullNatal.components.birthInformation.placeOfBirth')}
            </span>
            <p className="text-sm font-semibold text-slate-100">{details.placeOfBirth}</p>
          </div>
        )}

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> {t('fullNatal.components.birthInformation.timeZone')}
          </span>
          <p className="text-sm font-mono-code text-slate-200">{details.timeZone}</p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
            <Globe className="w-3 h-3 text-purple-400" /> {t('fullNatal.components.birthInformation.coordinates')}
          </span>
          <p className="text-sm font-mono-code text-slate-200">
            {details.latitude.toFixed(4)}° N, {details.longitude.toFixed(4)}° E
          </p>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" /> {t('fullNatal.components.birthInformation.ayanamsaSystem')}
          </span>
          <p className="text-sm font-mono-code font-semibold text-indigo-300">{details.ayanamsa}</p>
        </div>
      </div>
    </div>
  );
};
