import React from 'react';
import { D9Section as D9SectionType, DivisionalDomainMetadata, Planet } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatSignName, formatConfidence } from './reportUtils';
import { EvidenceList } from './EvidenceList';

interface D9SectionProps {
  readonly section: D9SectionType;
}

export const D9Section: React.FC<D9SectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.details) {
    return <EmptyState title="Navamsha (D9) Analysis Unavailable" message="D9 divisional interpretation was not provided in the report." />;
  }

  const { details } = section;

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Navamsha (D9) data is partial." />}

      {/* Main Header Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">D9 Ascendant Sign</span>
          <span className="text-sm font-bold font-serif-astro text-slate-100">{formatSignName(details.ascendantSign)}</span>
        </div>
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Confidence Level</span>
          <span className="text-xs font-mono-code font-bold text-indigo-300">{formatConfidence(details.confidence)}</span>
        </div>
      </div>

      {/* House Lords Table */}
      {details.houseLords && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300">
            D9 House Lordships (1–12)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 font-mono-code text-xs">
            {Object.entries(details.houseLords).map(([h, p]) => (
              <div key={h} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">House {h}:</span>
                <span className="text-indigo-300 font-bold">{formatPlanetName(p as Planet)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Metadata if present */}
      {details.domainMetadata && Object.keys(details.domainMetadata).length > 0 && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300">
            Domain Metadata & Primary Focus
          </h4>
          <div className="space-y-2">
            {Object.entries(details.domainMetadata).map(([h, meta]) => {
              const metaObj = meta as DivisionalDomainMetadata;
              return (
                <div key={h} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-mono-code">House {h} Domain</span>
                    {metaObj?.source && <span className="text-purple-300 text-[11px] font-semibold">{metaObj.source}</span>}
                  </div>
                  {metaObj?.domains && metaObj.domains.length > 0 && (
                    <p className="text-slate-300 text-[11px] leading-relaxed capitalize">{metaObj.domains.join(' • ')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence */}
      {details.evidence && details.evidence.length > 0 && (
        <EvidenceList evidence={details.evidence} title="D9 Navamsha Interpretation Evidence" />
      )}
    </div>
  );
};
