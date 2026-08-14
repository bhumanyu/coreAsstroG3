import React from 'react';
import { PlanetaryStrengthSection as PlanetaryStrengthSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PlanetaryStrengthSectionProps {
  readonly section: PlanetaryStrengthSectionType;
}

export const PlanetaryStrengthSection: React.FC<PlanetaryStrengthSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.planets || section.planets.length === 0) {
    return <EmptyState title="Planetary Strength Analysis Unavailable" message="Planetary strength (Shadbala) calculations were not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && (
        <PartialStateNotice message="Planetary strength analysis is incomplete or partial." />
      )}

      {/* Technical Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono-code text-[11px] uppercase">
              <th className="p-3 font-semibold">Planet</th>
              <th className="p-3 font-semibold">Shadbala Total</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Meets Minimum?</th>
              <th className="p-3 font-semibold text-right">Subcomponents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono-code">
            {section.planets.map((item) => (
              <tr key={item.planet} className="hover:bg-slate-900/40 transition-colors">
                <td className="p-3 font-bold font-serif-astro text-slate-100 text-sm">
                  {formatPlanetName(item.planet)}
                </td>
                <td className="p-3 font-bold text-indigo-300">
                  {item.calculatedTotal !== undefined ? item.calculatedTotal.toFixed(2) : 'N/A'}
                </td>
                <td className="p-3 text-slate-300">
                  {item.shadbalaStatus || 'N/A'}
                </td>
                <td className="p-3">
                  {item.meetsMinimum !== undefined ? (
                    item.meetsMinimum ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px]">
                        <XCircle className="w-3 h-3" /> No
                      </span>
                    )
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {item.components && item.components.length > 0 ? (
                    <EvidenceList evidence={item.components} title="Components" />
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
