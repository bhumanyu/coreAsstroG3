import React from 'react';
import { PlanetAnalysisSection as PlanetAnalysisSectionType } from '../../types';
import { PlanetAnalysisCard } from './PlanetAnalysisCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';

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

      <div className="grid grid-cols-1 gap-4">
        {section.planets.map((item) => (
          <PlanetAnalysisCard key={item.planet} item={item} />
        ))}
      </div>
    </div>
  );
};
