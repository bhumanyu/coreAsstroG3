import React from 'react';
import { useTranslation } from 'react-i18next';
import { HouseAnalysisSection as HouseAnalysisSectionType, HouseReportItem } from '../../types';
import { HouseAnalysisCard } from './HouseAnalysisCard';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';
import { CollapsibleItem, SectionAccordion } from './ObservationAccordion';

interface HouseAnalysisSectionProps {
  readonly section: HouseAnalysisSectionType;
}

export const HouseAnalysisSection: React.FC<HouseAnalysisSectionProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE' || !section.houses || section.houses.length === 0) {
    return <EmptyState title={t('fullNatal.components.houses.unavailableTitle')} message={t('fullNatal.components.houses.unavailableMessage')} />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && (
        <PartialStateNotice message={t('fullNatal.components.partial.houses')} />
      )}

      <SectionAccordion title={t('fullNatal.components.houses.sectionTitle')} count={section.houses.length}>
        {section.houses.map((item: HouseReportItem) => (
          <CollapsibleItem key={item.house} itemId={String(item.house)} title={t('fullNatal.components.houses.houseTitle', { number: item.house })}>
            <HouseAnalysisCard item={item} />
          </CollapsibleItem>
        ))}
      </SectionAccordion>
    </div>
  );
};
