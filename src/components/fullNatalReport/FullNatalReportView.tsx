import React from 'react';
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

export interface FullNatalReportViewProps {
  readonly report: FullNatalAnalysisReport;
}

export const FullNatalReportView: React.FC<FullNatalReportViewProps> = ({ report }) => {
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
            title="Birth Information & Astronomical Anchor"
            subtitle="Recorded birth details, geographic coordinates, and time settings"
            status={report.birthInformation?.status}
          >
            <BirthInformationCard section={report.birthInformation} />
          </ReportSection>

          {/* Section 2: Methodology & Scope */}
          <ReportSection
            id="methodology"
            number={2}
            title="Methodology & Engine Scope"
            subtitle="Astronomical parameters, ayanamsa, and calculation systems"
            status={report.methodology?.status}
          >
            <MethodologyCard section={report.methodology} />
          </ReportSection>

          {/* Section 3: Executive Summary */}
          <ReportSection
            id="executive-summary"
            number={3}
            title="Executive Summary"
            subtitle="Core chart synthesis headline and theme distribution"
            status={report.executiveSummary?.status}
          >
            <ExecutiveSummaryCard section={report.executiveSummary} />
          </ReportSection>

          {/* Section 4: Ascendant (Lagna) Analysis */}
          <ReportSection
            id="ascendant"
            number={4}
            title="Ascendant (Lagna) Analysis"
            subtitle="1st House Lagna sign, lord, occupants, and received aspects"
            status={report.ascendant?.status}
          >
            <AscendantSection section={report.ascendant} />
          </ReportSection>

          {/* Section 5: Planetary Analysis */}
          <ReportSection
            id="planets"
            number={5}
            title="Planetary Analysis"
            subtitle="Positions, dignities, nakshatras, states, and aspects for all planets"
            status={report.planets?.status}
          >
            <PlanetAnalysisSection section={report.planets} />
          </ReportSection>

          {/* Section 6: House Analysis */}
          <ReportSection
            id="houses"
            number={6}
            title="House Analysis"
            subtitle="Detailed examination of all 12 bhavas, lords, occupants, and aspects"
            status={report.houses?.status}
          >
            <HouseAnalysisSection section={report.houses} />
          </ReportSection>

          {/* Section 7: Functional Roles & Nature */}
          <ReportSection
            id="functional-roles"
            number={7}
            title="Functional Roles & Nature"
            subtitle="Functional benefics, malefics, neutrals, badhakas, and yogakarakas"
            status={report.functionalRoles?.status}
          >
            <FunctionalRolesSection section={report.functionalRoles} />
          </ReportSection>

          {/* Section 8: Yoga Formations */}
          <ReportSection
            id="yogas"
            number={8}
            title="Yoga Formations"
            subtitle="Classical planetary combinations, strength, and modification factors"
            status={report.yogas?.status}
          >
            <YogaSection section={report.yogas} />
          </ReportSection>

          {/* Section 9: Planetary Strengths (Shadbala) */}
          <ReportSection
            id="planetary-strength"
            number={9}
            title="Planetary Strengths (Shadbala)"
            subtitle="Technical Shadbala strength totals and component breakdown"
            status={report.planetaryStrength?.status}
          >
            <PlanetaryStrengthSection section={report.planetaryStrength} />
          </ReportSection>

          {/* Section 10: Navamsha (D9) Analysis */}
          <ReportSection
            id="d9"
            number={10}
            title="Navamsha (D9) Analysis"
            subtitle="D9 varga ascendant, house lordships, and domain metadata"
            status={report.d9?.status}
          >
            <D9Section section={report.d9} />
          </ReportSection>

          {/* Section 11: Dashamsha (D10) Analysis */}
          <ReportSection
            id="d10"
            number={11}
            title="Dashamsha (D10) Analysis"
            subtitle="D10 varga ascendant, career lordships, and domain metadata"
            status={report.d10?.status}
          >
            <D10Section section={report.d10} />
          </ReportSection>

          {/* Section 12: Vimshottari Dasha Timeline */}
          <ReportSection
            id="vimshottari"
            number={12}
            title="Vimshottari Dasha Timeline"
            subtitle="Full chronological sequence of major life planetary periods"
            status={report.vimshottari?.status}
          >
            <DashaSection section={report.vimshottari} />
          </ReportSection>

          {/* Section 13: Active Dasha Period */}
          <ReportSection
            id="current-dasha"
            number={13}
            title="Active Dasha Period"
            subtitle="Current active Mahadasha, Antardasha, and Pratyantardasha"
            status={report.currentDasha?.status}
          >
            <CurrentDashaSection section={report.currentDasha} />
          </ReportSection>

          {/* Section 14: Current Transit Analysis */}
          <ReportSection
            id="current-transit"
            number={14}
            title="Current Transit Analysis"
            subtitle="Real-time Gochara transit state and engine exclusions"
            status={report.currentTransit?.status}
          >
            <CurrentTransitSection section={report.currentTransit} />
          </ReportSection>

          {/* Section 15: Life Themes Synthesis */}
          <ReportSection
            id="life-themes"
            number={15}
            title="Life Themes Synthesis"
            subtitle="Synthesized life domain evaluations and supporting/weakening factors"
            status={report.lifeThemes?.status}
          >
            <LifeThemesSection section={report.lifeThemes} />
          </ReportSection>

          {/* Section 16: Major Life Periods */}
          <ReportSection
            id="major-life-periods"
            number={16}
            title="Major Life Periods"
            subtitle="Major life periods, focus houses, dates, and confidence"
            status={report.majorLifePeriods?.status}
          >
            <MajorLifePeriodsSection section={report.majorLifePeriods} />
          </ReportSection>

          {/* Section 17: Overall Synthesis */}
          <ReportSection
            id="overall-synthesis"
            number={17}
            title="Overall Synthesis"
            subtitle="Final integrated conclusion, repeated support themes, and key observations"
            status={report.overallSynthesis?.status}
          >
            <OverallSynthesisSection section={report.overallSynthesis} />
          </ReportSection>
        </div>
      </div>
    </div>
  );
};
