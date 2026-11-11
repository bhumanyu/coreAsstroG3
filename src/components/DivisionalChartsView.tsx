import React from 'react';
import { Horoscope, ChartType } from '../types';
import { KundaliChart } from './KundaliChart';
import { useTranslation } from 'react-i18next';

interface DivisionalChartsViewProps {
  horoscope: Horoscope;
}

export const DivisionalChartsView: React.FC<DivisionalChartsViewProps> = ({ horoscope }) => {
  const { t } = useTranslation('astrology');
  const chartDescriptionKeys: Record<ChartType, 'rasi' | 'drekkana' | 'navamsa' | 'dasamsa'> = {
    [ChartType.RASI]: 'rasi',
    [ChartType.DREKKANA]: 'drekkana',
    [ChartType.NAVAMSA]: 'navamsa',
    [ChartType.DASAMSA]: 'dasamsa'
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-xl font-bold font-serif-astro text-slate-100">
          {t('divisionalInspectionTitle')}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('divisionalInspectionDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[ChartType.RASI, ChartType.DREKKANA, ChartType.NAVAMSA, ChartType.DASAMSA].map((type) => {
          const chart = horoscope.charts[type];
          const descriptionKey = chartDescriptionKeys[type];
          if (!chart || !descriptionKey) return null;

          return (
            <div key={type} className="space-y-2">
              <div className="px-2">
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 border border-indigo-500/20 rounded-md inline-block mb-1">
                  {t(`divisionalCharts.${descriptionKey}.significance`)}
                </span>
                <p className="text-xs text-slate-400">{t(`divisionalCharts.${descriptionKey}.description`)}</p>
              </div>
              <KundaliChart chart={chart} title={t(`divisionalCharts.${descriptionKey}.title`)} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
