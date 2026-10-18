import React from 'react';
import { FunctionalRolesSection as FunctionalRolesSectionType, FunctionalRoleReportItem } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatFunctionalRole } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { CollapsibleItem, SectionAccordion } from './ObservationAccordion';

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

      <SectionAccordion title="Functional Roles" count={section.items.length}>
        {section.items.map((item: FunctionalRoleReportItem) => {
          const nature = item.functionalNature || 'NEUTRAL';
          const isBenefic = nature.toUpperCase().includes('BENEFIC');
          const isMalefic = nature.toUpperCase().includes('MALEFIC');
          const isYogakaraka = item.isYogakaraka;

          return (
            <CollapsibleItem
              key={item.planet}
              itemId={item.planet}
              title={formatPlanetName(item.planet)}
              trailing={
                <span
                  className={`inline-block px-2 py-0.5 rounded font-mono-code font-bold text-[10px] uppercase border ${
                    isBenefic
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : isMalefic
                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {formatFunctionalRole(nature)}
                </span>
              }
            >
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-400">Owned Houses</span>
                  <p className="mt-1 text-slate-300">
                    {item.ownedHouses && item.ownedHouses.length > 0
                      ? item.ownedHouses.map((house: number) => `H${house}`).join(', ')
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-400">Special Classifications</span>
                  <div className="mt-1">
                    {isYogakaraka ? (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-mono-code font-bold text-[10px]">
                        Yogakaraka
                      </span>
                    ) : <span className="text-slate-500">—</span>}
                  </div>
                </div>
                {item.evidence && item.evidence.length > 0 ? (
                  <EvidenceList evidence={item.evidence} title="Role Evidence" />
                ) : (
                  <span className="text-slate-500">No role evidence provided.</span>
                )}
              </div>
            </CollapsibleItem>
          );
        })}
      </SectionAccordion>
    </div>
  );
};
