import React from 'react';
import { PlanetAnalysisSection as PlanetAnalysisSectionType } from '../../types';
import { PlanetAnalysisCard } from './PlanetAnalysisCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { formatPlanetName } from './reportUtils';
import { CollapsibleItem, SectionAccordion } from './ObservationAccordion';

interface PlanetAnalysisSectionProps {
  readonly section: PlanetAnalysisSectionType;
}

export const PlanetAnalysisSection: React.FC<PlanetAnalysisSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.planets || section.planets.length === 0) {
    return <EmptyState title="Planetary Analysis Unavailable" message="Planetary analysis details were not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message="Planetary analysis contains partial data." />}

      <SectionAccordion title="Planetary Analysis" count={section.planets.length}>
        {section.planets.map((item) => (
          <CollapsibleItem key={item.planet} itemId={item.planet} title={formatPlanetName(item.planet)}>
            <PlanetAnalysisCard item={item} />
          </CollapsibleItem>
        ))}
      </SectionAccordion>
    </div>
  );
};
