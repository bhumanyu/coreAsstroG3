import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  WealthThemeInterpretation,
  WealthEvidenceFamily
} from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import { ThemeOverviewCard } from './ThemeOverviewCard';
import { ThemePromiseCard } from './ThemePromiseCard';
import { ThemeConfirmationCard } from './ThemeConfirmationCard';
import { ThemeTimingCard } from './ThemeTimingCard';
import { ThemeEvidenceSection } from './ThemeEvidenceSection';
import { ThemeMetadataCard } from './ThemeMetadataCard';
import { WealthSubthemeGrid } from './WealthSubthemeGrid';
import { Coins } from 'lucide-react';

interface WealthThemePanelProps {
  readonly wealth: WealthThemeInterpretation;
  readonly id?: string;
}

export const WealthThemePanel: React.FC<WealthThemePanelProps> = ({
  wealth,
  id = 'wealth-theme-panel'
}) => {
  const { t } = useTranslation('reports');
  const safeEvidence = [...(wealth.evidence || [])];
  const timingEvidence = safeEvidence.filter(
    (e) => e.dimension === 'TIMING' || e.timingEvidence !== undefined
  );
  const yogaEvidence = safeEvidence.filter(
    (e) => e.evidenceFamily === WealthEvidenceFamily.YOGA
  );

  // Define unified structural domains for Wealth combining House + Lord
  const wealthDomainGroups = [
    {
      domainName: t('theme.wealth.domains.accumulation'),
      families: [
        WealthEvidenceFamily.SECOND_HOUSE,
        WealthEvidenceFamily.SECOND_LORD
      ],
      description: t('theme.wealth.domainDescriptions.accumulation')
    },
    {
      domainName: t('theme.wealth.domains.gains'),
      families: [
        WealthEvidenceFamily.ELEVENTH_HOUSE,
        WealthEvidenceFamily.ELEVENTH_LORD
      ],
      description: t('theme.wealth.domainDescriptions.gains')
    },
    {
      domainName: t('theme.wealth.domains.fortune'),
      families: [
        WealthEvidenceFamily.NINTH_HOUSE,
        WealthEvidenceFamily.NINTH_LORD
      ],
      description: t('theme.wealth.domainDescriptions.fortune')
    },
    {
      domainName: t('theme.wealth.domains.speculation'),
      families: [
        WealthEvidenceFamily.FIFTH_HOUSE,
        WealthEvidenceFamily.FIFTH_LORD
      ],
      description: t('theme.wealth.domainDescriptions.speculation')
    },
    {
      domainName: t('theme.wealth.domains.significators'),
      families: [
        WealthEvidenceFamily.JUPITER,
        WealthEvidenceFamily.VENUS,
        WealthEvidenceFamily.MERCURY
      ],
      description: t('theme.wealth.domainDescriptions.significators')
    }
  ];

  return (
    <div id={id} className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-serif-astro text-slate-100">
              {t('theme.wealth.header')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('theme.wealth.description')}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Theme Overview Card */}
      <ThemeOverviewCard
        id={`${id}-overview`}
        title={t('theme.wealth.synthesis')}
        status={wealth.conclusion.status}
        confidence={wealth.conclusion.confidence}
        summary={wealth.conclusion.summary}
        keySupportingFactors={wealth.conclusion.keySupportingFactors}
        keyChallengingFactors={wealth.conclusion.keyChallengingFactors}
        keyConditionalFactors={wealth.conclusion.keyConditionalFactors}
      />

      {/* 2. Natal Wealth Promise Card */}
      <ThemePromiseCard
        id={`${id}-promise`}
        title={t('theme.wealth.promise')}
        status={wealth.wealthNatalPromise.status}
        confidence={wealth.wealthNatalPromise.evidenceConfidence}
        primarySupport={wealth.wealthNatalPromise.primarySupport}
        primaryChallenges={wealth.wealthNatalPromise.primaryChallenges}
        structuralEvidence={wealth.wealthNatalPromise.structuralEvidence}
      />

      {/* 3. Four Wealth Pillars (Subthemes) Grid */}
      <WealthSubthemeGrid
        id={`${id}-subthemes`}
        subthemes={wealth.subthemes}
      />

      {/* 4. Yoga Confirmation, D2 Status, and Timing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Yoga Confirmation */}
        <ThemeConfirmationCard
          id={`${id}-yoga-confirmation`}
          title={t('theme.wealth.yoga')}
          relationship={wealth.metadata.yogaConfirmationStatus}
          type="YOGA"
          statement={
            wealth.metadata.yogaConfirmationStatus === 'CONFIRMS'
              ? t('theme.wealth.yogaConfirmed')
              : wealth.metadata.yogaConfirmationStatus === 'ABSENT'
              ? t('theme.wealth.yogaAbsent')
              : t('theme.wealth.yogaUnavailable')
          }
          unavailableReason={
            wealth.metadata.yogaConfirmationStatus === 'CONFIRMS'
              ? t('theme.wealth.yogaConfirmed')
              : wealth.metadata.yogaConfirmationStatus === 'ABSENT'
              ? t('theme.wealth.yogaAbsent')
              : t('theme.wealth.yogaUnavailable')
          }
          evidence={yogaEvidence}
        />

        {/* D2 (Hora) Status - Explicitly Unavailable in current engine */}
        <ThemeConfirmationCard
          id={`${id}-d2-confirmation`}
          title={t('theme.wealth.d2')}
          relationship="UNAVAILABLE"
          type="VARGA"
          isAvailable={false}
          unavailableReason={t('theme.wealth.d2Unavailable')}
        />

        {/* Timing Card */}
        <ThemeTimingCard
          id={`${id}-timing`}
          title={t('theme.wealth.timing')}
          timingEvidence={timingEvidence}
        />
      </div>

      {/* 5. Complete Structured Evidence Hierarchy with Unified Domains */}
      <ThemeEvidenceSection
        id={`${id}-evidence-section`}
        evidence={wealth.evidence}
        groupedEvidence={wealth.groupedEvidence}
        familySummaries={wealth.familySummaries}
        customDomainGroups={wealthDomainGroups}
      />

      {/* 6. Technical Metadata & Audit */}
      <ThemeMetadataCard
        id={`${id}-metadata`}
        metadata={wealth.metadata}
      />
    </div>
  );
};
