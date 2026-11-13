import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE' || !section.planets || section.planets.length === 0) {
    return <EmptyState title={t('fullNatal.components.planets.unavailableTitle')} message={t('fullNatal.components.planets.unavailableMessage')} />;
  }

  return (
    <div className="space-y-4">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.planets')} />}

      <SectionAccordion title={t('fullNatal.components.planets.sectionTitle')} count={section.planets.length}>
        {section.planets.map((item) => (
          <CollapsibleItem key={item.planet} itemId={item.planet} title={formatPlanetName(item.planet)}>
            <PlanetAnalysisCard item={item} />
          </CollapsibleItem>
        ))}
      </SectionAccordion>
    </div>
  );
};
