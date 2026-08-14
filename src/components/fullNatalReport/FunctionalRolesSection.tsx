import React from 'react';
import { FunctionalRolesSection as FunctionalRolesSectionType, FunctionalRoleReportItem } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatFunctionalRole } from './reportUtils';
import { EvidenceList } from './EvidenceList';

interface FunctionalRolesSectionProps {
  readonly section: FunctionalRolesSectionType;
}

export const FunctionalRolesSection: React.FC<FunctionalRolesSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.items || section.items.length === 0) {
    return <EmptyState title="Functional Roles Analysis Unavailable" message="Functional role classifications were not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && (
        <PartialStateNotice message="Functional role analysis is incomplete or partial." />
      )}

      {/* Summary Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono-code text-[11px] uppercase">
              <th className="p-3 font-semibold">Planet</th>
              <th className="p-3 font-semibold">Functional Nature</th>
              <th className="p-3 font-semibold">Owned Houses</th>
              <th className="p-3 font-semibold">Special Classifications</th>
              <th className="p-3 font-semibold text-right">Evidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono-code">
            {section.items.map((item: FunctionalRoleReportItem) => {
              const nature = item.functionalNature || 'NEUTRAL';
              const isBenefic = nature.toUpperCase().includes('BENEFIC');
              const isMalefic = nature.toUpperCase().includes('MALEFIC');
              const isYogakaraka = item.isYogakaraka;

              return (
                <tr key={item.planet} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold font-serif-astro text-slate-100 text-sm">
                    {formatPlanetName(item.planet)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                        isBenefic
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : isMalefic
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {formatFunctionalRole(nature)}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {item.ownedHouses && item.ownedHouses.length > 0
                      ? item.ownedHouses.map((h: number) => `H${h}`).join(', ')
                      : '—'}
                  </td>
                  <td className="p-3 space-x-1">
                    {isYogakaraka && (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-bold text-[10px]">
                        Yogakaraka
                      </span>
                    )}
                    {!isYogakaraka && <span className="text-slate-500">—</span>}
                  </td>
                  <td className="p-3 text-right">
                    {item.evidence && item.evidence.length > 0 ? (
                      <EvidenceList evidence={item.evidence} title="Role Evidence" />
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
