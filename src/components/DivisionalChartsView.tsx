import React from 'react';
import { Horoscope, ChartType } from '../types';
import { KundaliChart } from './KundaliChart';

interface DivisionalChartsViewProps {
  horoscope: Horoscope;
}

export const DivisionalChartsView: React.FC<DivisionalChartsViewProps> = ({ horoscope }) => {
  const chartDescriptions: Record<ChartType, { title: string; desc: string; significance: string }> = {
    [ChartType.RASI]: {
      title: 'Rasi Chart (D1)',
      desc: 'Primary birth chart representing physical existence, general destiny, and planetary placements.',
      significance: 'Root Chart / Physical Body'
    },
    [ChartType.DREKKANA]: {
      title: 'Drekkana Chart (D3)',
      desc: '1/3rd division of signs (10° per Part). Evaluates siblings, courage, vitality, and energy.',
      significance: 'Siblings & Valor'
    },
    [ChartType.NAVAMSA]: {
      title: 'Navamsa Chart (D9)',
      desc: '1/9th division of signs (3°20\' per Part). Crucial varga for spouse, inner strength, and dharma.',
      significance: 'Spouse & Soul Purpose'
    },
    [ChartType.DASAMSA]: {
      title: 'Dasamsa Chart (D10)',
      desc: '1/10th division of signs (3° per Part). Determines career achievements, authority, and karma.',
      significance: 'Career & Achievements'
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-xl font-bold font-serif-astro text-slate-100">
          Divisional Vargas Inspection (D1, D3, D9, D10)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explore multi-varga division mathematics computed by CoreAstroEngine
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[ChartType.RASI, ChartType.DREKKANA, ChartType.NAVAMSA, ChartType.DASAMSA].map((type) => {
          const chart = horoscope.charts[type];
          const info = chartDescriptions[type];
          if (!chart || !info) return null;

          return (
            <div key={type} className="space-y-2">
              <div className="px-2">
                <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 border border-indigo-500/20 rounded-md inline-block mb-1">
                  {info.significance}
                </span>
                <p className="text-xs text-slate-400">{info.desc}</p>
              </div>
              <KundaliChart chart={chart} title={info.title} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
