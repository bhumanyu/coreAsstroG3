import React from 'react';
import { HouseAnalysisSection as HouseAnalysisSectionType, HouseReportItem } from '../../types';
import { HouseAnalysisCard } from './HouseAnalysisCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { CollapsibleItem, SectionAccordion } from './ObservationAccordion';

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

      <SectionAccordion title="House Analysis" count={section.houses.length}>
        {section.houses.map((item: HouseReportItem) => (
          <CollapsibleItem key={item.house} itemId={String(item.house)} title={`House ${item.house}`}>
            <HouseAnalysisCard item={item} />
          </CollapsibleItem>
        ))}
      </SectionAccordion>
    </div>
  );
};
