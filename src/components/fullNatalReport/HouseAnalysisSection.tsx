import React from 'react';
import { HouseAnalysisSection as HouseAnalysisSectionType, HouseReportItem } from '../../types';
import { HouseAnalysisCard } from './HouseAnalysisCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';

interface HouseAnalysisSectionProps {
  readonly section: HouseAnalysisSectionType;
}

export const HouseAnalysisSection: React.FC<HouseAnalysisSectionProps> = ({ section }) => {
  if (section.status === 'UNAVAILABLE' || !section.houses || section.houses.length === 0) {
    return <EmptyState title="House Analysis Unavailable" message="House analysis details were not provided in the report." />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && (
        <PartialStateNotice message="House analysis is incomplete or partial." />
      )}

      {/* Grid of 12 Houses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.houses.map((item: HouseReportItem) => (
          <HouseAnalysisCard key={item.house} item={item} />
        ))}
      </div>
    </div>
  );
};
