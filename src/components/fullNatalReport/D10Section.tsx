import React from 'react';
import { useTranslation } from 'react-i18next';
import { D10Section as D10SectionType, DivisionalDomainMetadata, Planet } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName, formatSignName, formatConfidence } from './reportUtils';
import { EvidenceList } from './EvidenceList';
import { CollapsibleItem, SectionAccordion } from './ObservationAccordion';

interface D10SectionProps {
  readonly section: D10SectionType;
}

export const D10Section: React.FC<D10SectionProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE' || !section.details) {
    return <EmptyState title={t('fullNatal.components.divisional.d10UnavailableTitle')} message={t('fullNatal.components.divisional.d10UnavailableMessage')} />;
  }

  const { details } = section;

  const sectionCount = 1
    + Number(Boolean(details.houseLords))
    + Number(Boolean(details.domainMetadata && Object.keys(details.domainMetadata).length > 0))
    + Number(Boolean(details.evidence && details.evidence.length > 0));

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.d10')} />}
      <SectionAccordion title={`D10 ${t('fullNatal.components.divisional.sectionTitle')}`} count={sectionCount}>
        <CollapsibleItem itemId="ascendant-confidence" title={t('fullNatal.components.divisional.ascendantConfidence')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.divisional.d10Ascendant')}</span>
              <span className="text-sm font-bold font-serif-astro text-slate-100">{formatSignName(details.ascendantSign)}</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono-code uppercase text-slate-400 block">{t('fullNatal.components.divisional.confidenceLevel')}</span>
              <span className="text-xs font-mono-code font-bold text-indigo-300">{formatConfidence(details.confidence)}</span>
            </div>
          </div>
        </CollapsibleItem>

        {details.houseLords && (
          <CollapsibleItem
            itemId="house-lordships"
            title={t('fullNatal.components.divisional.houseLordships')}
            trailing={<span className="font-mono-code text-[10px] text-indigo-300">(12)</span>}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 font-mono-code text-xs">
              {Object.entries(details.houseLords).map(([house, planet]) => (
                <div key={house} className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">{t('fullNatal.components.divisional.house', { number: house })}</span>
                  <span className="text-indigo-300 font-bold">{formatPlanetName(planet as Planet)}</span>
                </div>
              ))}
            </div>
          </CollapsibleItem>
        )}

        {details.domainMetadata && Object.keys(details.domainMetadata).length > 0 && (
          <CollapsibleItem itemId="domain-metadata" title={t('fullNatal.components.divisional.domainMetadata')}>
            <div className="space-y-2">
              {Object.entries(details.domainMetadata).map(([house, meta]) => {
                const metaObj = meta as DivisionalDomainMetadata;
                return (
                  <div key={house} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400 font-mono-code">{t('fullNatal.components.divisional.houseDomain', { number: house })}</span>
                      {metaObj?.source && <span className="text-purple-300 text-[11px] font-semibold">{metaObj.source}</span>}
                    </div>
                    {metaObj?.domains && metaObj.domains.length > 0 && (
                      <p className="text-slate-300 text-[11px] leading-relaxed capitalize">{metaObj.domains.join(' • ')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleItem>
        )}

        {details.evidence && details.evidence.length > 0 && (
          <CollapsibleItem itemId="evidence" title={t('fullNatal.components.divisional.evidence')}>
            <EvidenceList evidence={details.evidence} title={t('fullNatal.components.divisional.d10EvidenceTitle')} />
          </CollapsibleItem>
        )}
      </SectionAccordion>
    </div>
  );
};
