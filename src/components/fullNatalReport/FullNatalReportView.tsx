import React from 'react';
import { useTranslation } from 'react-i18next';
import { FullNatalAnalysisReport } from '../../types';
import { REPORT_SECTION_IDS } from './reportUtils';
import { useReportSectionObserver } from '../../hooks/useReportSectionObserver';
import { ReportHeader } from './ReportHeader';
import { ReportNavigation } from './ReportNavigation';
import { ReportSection } from './ReportSection';
import { BirthInformationCard } from './BirthInformationCard';
import { MethodologyCard } from './MethodologyCard';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { AscendantSection } from './AscendantSection';
import { PlanetAnalysisSection } from './PlanetAnalysisSection';
import { HouseAnalysisSection } from './HouseAnalysisSection';
import { FunctionalRolesSection } from './FunctionalRolesSection';
import { YogaSection } from './YogaSection';
import { PlanetaryStrengthSection } from './PlanetaryStrengthSection';
import { D9Section } from './D9Section';
import { D10Section } from './D10Section';
import { DashaSection } from './DashaSection';
import { CurrentDashaSection } from './CurrentDashaSection';
import { CurrentTransitSection } from './CurrentTransitSection';
import { LifeThemesSection } from './LifeThemesSection';
import { MajorLifePeriodsSection } from './MajorLifePeriodsSection';
import { OverallSynthesisSection } from './OverallSynthesisSection';
import type { ProductAnalysis } from '../../product/analysis/productAnalysisTypes';
import { ProductAnalysisReportView } from './ProductAnalysisReportView';
import { ProductAnalysisReportBoundary } from './ProductAnalysisReportBoundary';

export interface FullNatalReportViewProps {
  readonly report: FullNatalAnalysisReport;
  readonly productAnalysis?: ProductAnalysis;
  readonly productAnalysisStatus?: 'IDLE' | 'LOADING' | 'READY' | 'ERROR';
  readonly productAnalysisError?: string;
  readonly onRetryAnalysis?: () => void;
  readonly onNavigateToDashaTiming?: () => void;
}

export const FullNatalReportView: React.FC<FullNatalReportViewProps> = ({
  report,
  productAnalysis,
  productAnalysisStatus,
  productAnalysisError,
  onRetryAnalysis,
  onNavigateToDashaTiming
}) => {
  const { t } = useTranslation('reports');
  const activeSectionId = useReportSectionObserver(REPORT_SECTION_IDS);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header Banner */}
      <ReportHeader report={report} />

      {/* Main Grid: Sidebar Nav + Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3">
          <ReportNavigation activeSectionId={activeSectionId} />
        </div>

        {/* 17 Sections Content Column */}
        <div className="lg:col-span-9 space-y-6">
          {/* Section 1: Birth Information */}
          <ReportSection
            id="birth-information"
            number={1}
            title={t('fullNatal.sections.birthInformation.title')}
            subtitle={t('fullNatal.sections.birthInformation.subtitle')}
            status={report.birthInformation?.status}
          >
            <BirthInformationCard section={report.birthInformation} />
          </ReportSection>

          {/* Section 2: Methodology & Scope */}
          <ReportSection
            id="methodology"
            number={2}
            title={t('fullNatal.sections.methodology.title')}
            subtitle={t('fullNatal.sections.methodology.subtitle')}
            status={report.methodology?.status}
          >
            <MethodologyCard section={report.methodology} />
          </ReportSection>

          {/* Section 3: Executive Summary */}
          <ReportSection
            id="executive-summary"
            number={3}
            title={t('fullNatal.sections.executiveSummary.title')}
            subtitle={t('fullNatal.sections.executiveSummary.subtitle')}
            status={report.executiveSummary?.status}
          >
            <ExecutiveSummaryCard section={report.executiveSummary} />
          </ReportSection>

          {/* Section 4: Ascendant (Lagna) Analysis */}
          <ReportSection
            id="ascendant"
            number={4}
            title={t('fullNatal.sections.ascendant.title')}
            subtitle={t('fullNatal.sections.ascendant.subtitle')}
            status={report.ascendant?.status}
          >
            <AscendantSection section={report.ascendant} />
          </ReportSection>

          {/* Section 5: Planetary Analysis */}
          <ReportSection
            id="planets"
            number={5}
            title={t('fullNatal.sections.planets.title')}
            subtitle={t('fullNatal.sections.planets.subtitle')}
            status={report.planets?.status}
          >
            <PlanetAnalysisSection section={report.planets} />
          </ReportSection>

          {/* Section 6: House Analysis */}
          <ReportSection
            id="houses"
            number={6}
            title={t('fullNatal.sections.houses.title')}
            subtitle={t('fullNatal.sections.houses.subtitle')}
            status={report.houses?.status}
          >
            <HouseAnalysisSection section={report.houses} />
          </ReportSection>

          {/* Section 7: Functional Roles & Nature */}
          <ReportSection
            id="functional-roles"
            number={7}
            title={t('fullNatal.sections.functionalRoles.title')}
            subtitle={t('fullNatal.sections.functionalRoles.subtitle')}
            status={report.functionalRoles?.status}
          >
            <FunctionalRolesSection section={report.functionalRoles} />
          </ReportSection>

          {/* Section 8: Yoga Formations */}
          <ReportSection
            id="yogas"
            number={8}
            title={t('fullNatal.sections.yogas.title')}
            subtitle={t('fullNatal.sections.yogas.subtitle')}
            status={report.yogas?.status}
          >
            <YogaSection section={report.yogas} />
          </ReportSection>

          {/* Section 9: Planetary Strengths (Shadbala) */}
          <ReportSection
            id="planetary-strength"
            number={9}
            title={t('fullNatal.sections.planetaryStrength.title')}
            subtitle={t('fullNatal.sections.planetaryStrength.subtitle')}
            status={report.planetaryStrength?.status}
          >
            <PlanetaryStrengthSection section={report.planetaryStrength} />
          </ReportSection>

          {/* Section 10: Navamsha (D9) Analysis */}
          <ReportSection
            id="d9"
            number={10}
            title={t('fullNatal.sections.d9.title')}
            subtitle={t('fullNatal.sections.d9.subtitle')}
            status={report.d9?.status}
          >
            <D9Section section={report.d9} />
          </ReportSection>

          {/* Section 11: Dashamsha (D10) Analysis */}
          <ReportSection
            id="d10"
            number={11}
            title={t('fullNatal.sections.d10.title')}
            subtitle={t('fullNatal.sections.d10.subtitle')}
            status={report.d10?.status}
          >
            <D10Section section={report.d10} />
          </ReportSection>

          {/* Section 12: Vimshottari Dasha Timeline */}
          <ReportSection
            id="vimshottari"
            number={12}
            title={t('fullNatal.sections.vimshottari.title')}
            subtitle={t('fullNatal.sections.vimshottari.subtitle')}
            status={report.vimshottari?.status}
          >
            <DashaSection section={report.vimshottari} />
          </ReportSection>

          {/* Section 13: Active Dasha Period */}
          <ReportSection
            id="current-dasha"
            number={13}
            title={t('fullNatal.sections.currentDasha.title')}
            subtitle={t('fullNatal.sections.currentDasha.subtitle')}
            status={report.currentDasha?.status}
          >
            <CurrentDashaSection
              section={report.currentDasha}
              onNavigateToDashaTiming={onNavigateToDashaTiming}
            />
          </ReportSection>

          {/* Section 14: Current Transit Analysis */}
          <ReportSection
            id="current-transit"
            number={14}
            title={t('fullNatal.sections.currentTransit.title')}
            subtitle={t('fullNatal.sections.currentTransit.subtitle')}
            status={report.currentTransit?.status}
          >
            <CurrentTransitSection section={report.currentTransit} />
          </ReportSection>

          {/* Section 15: Life Themes Synthesis */}
          <ReportSection
            id="life-themes"
            number={15}
            title={t('fullNatal.sections.lifeThemes.title')}
            subtitle={t('fullNatal.sections.lifeThemes.subtitle')}
            status={report.lifeThemes?.status}
          >
            <LifeThemesSection section={report.lifeThemes} />
          </ReportSection>

          {/* Section 16: Major Life Periods */}
          <ReportSection
            id="major-life-periods"
            number={16}
            title={t('fullNatal.sections.majorLifePeriods.title')}
            subtitle={t('fullNatal.sections.majorLifePeriods.subtitle')}
            status={report.majorLifePeriods?.status}
          >
            <MajorLifePeriodsSection section={report.majorLifePeriods} />
          </ReportSection>

          {/* Section 17: Overall Synthesis */}
          <ReportSection
            id="overall-synthesis"
            number={17}
            title={t('fullNatal.sections.overallSynthesis.title')}
            subtitle={t('fullNatal.sections.overallSynthesis.subtitle')}
            status={report.overallSynthesis?.status}
          >
            <OverallSynthesisSection section={report.overallSynthesis} />
          </ReportSection>
        </div>
      </div>
      <ProductAnalysisReportBoundary resetKey={productAnalysis?.analysisId ?? productAnalysisStatus ?? 'UNAVAILABLE'}>
        <ProductAnalysisReportView analysis={productAnalysis} analysisStatus={productAnalysisStatus} analysisError={productAnalysisError} onRetryAnalysis={onRetryAnalysis} />
      </ProductAnalysisReportBoundary>
    </div>
  );
};
