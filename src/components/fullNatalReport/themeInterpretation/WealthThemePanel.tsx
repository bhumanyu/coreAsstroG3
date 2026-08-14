import React from 'react';
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
      domainName: '2nd House & Lord Domain (Accumulated Wealth & Treasury)',
      families: [
        WealthEvidenceFamily.SECOND_HOUSE,
        WealthEvidenceFamily.SECOND_LORD
      ],
      description: 'Liquid assets, savings, ancestral inheritance, and sustained family wealth.'
    },
    {
      domainName: '11th House & Lord Domain (Income, Inflow & Periodic Gains)',
      families: [
        WealthEvidenceFamily.ELEVENTH_HOUSE,
        WealthEvidenceFamily.ELEVENTH_LORD
      ],
      description: 'Cash-flow velocity, enterprise earnings, network bonuses, and recurring profits.'
    },
    {
      domainName: '9th House & Lord Domain (Bhagya, Fortune & Higher Grace)',
      families: [
        WealthEvidenceFamily.NINTH_HOUSE,
        WealthEvidenceFamily.NINTH_LORD
      ],
      description: 'Divine luck, effortless windfalls, ethical prosperity, and long-range fortune.'
    },
    {
      domainName: '5th House & Lord Domain (Speculation, Merit & Enterprise)',
      families: [
        WealthEvidenceFamily.FIFTH_HOUSE,
        WealthEvidenceFamily.FIFTH_LORD
      ],
      description: 'Purva Punya, intelligent investment decisions, creative ventures, and market instincts.'
    },
    {
      domainName: 'Natural Significators & Financial Karakas (Jupiter, Venus, Mercury)',
      families: [
        WealthEvidenceFamily.JUPITER,
        WealthEvidenceFamily.VENUS,
        WealthEvidenceFamily.MERCURY
      ],
      description: 'Universal graha archetypes governing expansion (Guru), luxury (Shukra), and commerce (Budha).'
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
              Wealth & Prosperity
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic wealth analysis based on accumulation, gains, fortune, speculation, supporting factors, and timing.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Theme Overview Card */}
      <ThemeOverviewCard
        id={`${id}-overview`}
        title="Wealth Synthesis & Financial Trajectory"
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
        title="Natal Wealth Promise (Root Structural Potential)"
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
          title="Dhana Yoga Confirmation"
          relationship={wealth.metadata.yogaConfirmationStatus}
          type="YOGA"
          statement={
            wealth.metadata.yogaConfirmationStatus === 'CONFIRMS'
              ? 'Classical wealth-generating Yogas identified and reinforce natal financial potential.'
              : wealth.metadata.yogaConfirmationStatus === 'ABSENT'
              ? 'No qualifying Dhana/Lakshmi Yoga confirmation identified.'
              : 'Yoga confirmation unavailable.'
          }
          unavailableReason={
            wealth.metadata.yogaConfirmationStatus === 'CONFIRMS'
              ? 'Classical wealth-generating Yogas identified and reinforce natal financial potential.'
              : wealth.metadata.yogaConfirmationStatus === 'ABSENT'
              ? 'No qualifying Dhana/Lakshmi Yoga confirmation identified.'
              : 'Yoga confirmation unavailable.'
          }
          evidence={yogaEvidence}
        />

        {/* D2 (Hora) Status - Explicitly Unavailable in current engine */}
        <ThemeConfirmationCard
          id={`${id}-d2-confirmation`}
          title="D2 (Hora) Divisional Confirmation"
          relationship="UNAVAILABLE"
          type="VARGA"
          isAvailable={false}
          unavailableReason="D2 confirmation is not implemented in the current Wealth interpretation version."
        />

        {/* Timing Card */}
        <ThemeTimingCard
          id={`${id}-timing`}
          title="Timing / Activation"
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
