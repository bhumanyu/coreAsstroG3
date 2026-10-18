import React from 'react';
import { PlanetaryStrengthSection as PlanetaryStrengthSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { CheckCircle2, XCircle } from 'lucide-react';
import { CollapsibleItem, SectionAccordion } from './ObservationAccordion';

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

      <SectionAccordion title="Planetary Strength" count={section.planets.length}>
        {section.planets.map((item) => (
          <CollapsibleItem
            key={item.planet}
            itemId={item.planet}
            title={formatPlanetName(item.planet)}
            trailing={
              <span className="font-mono-code font-bold text-indigo-300">
                {item.calculatedTotal !== undefined ? item.calculatedTotal.toFixed(2) : 'N/A'}
              </span>
            }
          >
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-400">Status</span>
                <p className="mt-1 text-slate-300">{item.shadbalaStatus || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-400">Meets Minimum?</span>
                <div className="mt-1">
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
                  ) : <span className="text-slate-500">—</span>}
                </div>
              </div>
              {item.components && item.components.length > 0 ? (
                <EvidenceList evidence={item.components} title="Components" />
              ) : (
                <span className="text-slate-500">No subcomponents provided.</span>
              )}
            </div>
          </CollapsibleItem>
        ))}
      </SectionAccordion>
    </div>
  );
};
