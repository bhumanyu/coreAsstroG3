import React from 'react';
import { useTranslation } from 'react-i18next';
import { CareerThemeInterpretation } from '../../../engine/themeInterpretation/themeInterpretationTypes';
import { ThemeOverviewCard } from './ThemeOverviewCard';
import { ThemePromiseCard } from './ThemePromiseCard';
import { ThemeConfirmationCard } from './ThemeConfirmationCard';
import { ThemeTimingCard } from './ThemeTimingCard';
import { ThemeEvidenceSection } from './ThemeEvidenceSection';
import { ThemeMetadataCard } from './ThemeMetadataCard';
import { Briefcase } from 'lucide-react';

interface CareerThemePanelProps {
  readonly career: CareerThemeInterpretation;
  readonly id?: string;
}

export const CareerThemePanel: React.FC<CareerThemePanelProps> = ({
  career,
  id = 'career-theme-panel'
}) => {
  const { t } = useTranslation('reports');
  const safeEvidence = [...(career.evidence || [])];
  const timingEvidence = safeEvidence.filter(
    (e) => e.dimension === 'TIMING' || e.timingEvidence !== undefined
  );
  const d10Evidence = safeEvidence.filter(
    (e) => e.evidenceFamily === 'D10' || e.vargaEvidence !== undefined
  );
  const d10Statement =
    d10Evidence.length > 0
      ? d10Evidence[0].vargaEvidence?.statement || d10Evidence[0].statement
      : undefined;

  return (
    <div id={id} className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif-astro text-slate-100">
              {t('theme.career.header')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('theme.career.description')}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Theme Overview Card */}
      <ThemeOverviewCard
        id={`${id}-overview`}
        title={t('theme.career.synthesis')}
        status={career.conclusion.status}
        confidence={career.conclusion.confidence}
        summary={career.conclusion.summary}
        keySupportingFactors={career.conclusion.keySupportingFactors}
        keyChallengingFactors={career.conclusion.keyChallengingFactors}
        keyConditionalFactors={career.conclusion.keyConditionalFactors}
      />

      {/* 2. Natal Career Promise Card */}
      <ThemePromiseCard
        id={`${id}-promise`}
        title={t('theme.career.promise')}
        status={career.careerNatalPromise.status}
        confidence={career.careerNatalPromise.evidenceConfidence}
        primarySupport={career.careerNatalPromise.primarySupport}
        primaryChallenges={career.careerNatalPromise.primaryChallenges}
        structuralEvidence={career.careerNatalPromise.structuralEvidence}
      />

      {/* 3. D10 Confirmation Card and Timing Card Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ThemeConfirmationCard
          id={`${id}-d10-confirmation`}
          title={t('theme.career.d10')}
          relationship={career.metadata.vargaConfirmationStatus}
          type="VARGA"
          statement={d10Statement}
          evidence={d10Evidence}
        />

        <ThemeTimingCard
          id={`${id}-timing`}
          title={t('theme.career.timing')}
          timingEvidence={timingEvidence}
        />
      </div>

      {/* 4. Complete Structured Evidence Hierarchy */}
      <ThemeEvidenceSection
        id={`${id}-evidence-section`}
        evidence={career.evidence}
        groupedEvidence={career.groupedEvidence}
        familySummaries={career.familySummaries}
      />

      {/* 5. Technical Metadata & Audit */}
      <ThemeMetadataCard
        id={`${id}-metadata`}
        metadata={career.metadata}
      />
    </div>
  );
};
