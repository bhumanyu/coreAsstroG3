import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../../../i18n/i18n';
import {
  WealthHero,
  WealthOverallSection,
  WealthDimensionsSection,
  WealthD2Section,
  WealthDashaSection,
  WealthTransitSection,
  WealthSpeculativeRiskSection,
  WealthQualificationsSection,
  WealthEvidenceSection,
  WealthConclusionSection
} from '../index';
import { WealthDimensionCard } from '../WealthDimensionCard';
import type {
  WealthHeroViewModel,
  WealthOverallViewModel,
  WealthDimensionsViewModel,
  WealthD2ViewModel,
  WealthDashaViewModel,
  WealthTransitViewModel,
  WealthSpeculativePropensityViewModel,
  WealthRiskAndSuitabilityViewModel,
  WealthQualificationViewModel,
  WealthEvidenceViewModel,
  WealthConclusionViewModel
} from '../../../product/analysis/wealthViewModel';

describe('Wealth Section Components Suite (P-UI-05)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  describe('WealthHero', () => {
    it('renders heading, chart sign chips, confidence, and notice badge', () => {
      const hero: WealthHeroViewModel = {
        ascendantSign: 'Taurus',
        moonSign: 'Cancer',
        sunSign: 'Aries',
        moonNakshatra: 'Pushya',
        status: 'READY',
        confidence: 'HIGH',
        warnings: [
          {
            domain: 'WEALTH',
            code: 'WARN_1',
            severity: 'INFO',
            message: 'Sample wealth advisory'
          }
        ]
      };

      render(<WealthHero hero={hero} />);

      expect(screen.getByText('Wealth & Financial Prosperity')).toBeInTheDocument();
      expect(screen.getByText('Taurus')).toBeInTheDocument();
      expect(screen.getByText('Cancer')).toBeInTheDocument();
      expect(screen.getByText('Aries')).toBeInTheDocument();
      expect(screen.getByText('Pushya')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('1 Notice')).toBeInTheDocument();
    });
  });

  describe('WealthOverallSection', () => {
    it('renders promise, status, and confidence as three separate dimensions', () => {
      const overall: WealthOverallViewModel = {
        promise: 'STRONG',
        status: 'MIXED',
        confidence: 'HIGH',
        headline: 'Dynamic Financial Inflow',
        statement: 'Solid foundation with fluctuating expenditures.'
      };

      render(<WealthOverallSection overall={overall} />);

      expect(screen.getByText('Natal Wealth Foundation & Overall Status')).toBeInTheDocument();
      // Strong (Promise)
      expect(screen.getAllByText('Strong').length).toBeGreaterThanOrEqual(1);
      // Mixed (Status)
      expect(screen.getAllByText('Mixed').length).toBeGreaterThanOrEqual(1);
      // High Confidence (Confidence)
      expect(screen.getAllByText('High Confidence').length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Dynamic Financial Inflow')).toBeInTheDocument();
      expect(
        screen.getByText('Solid foundation with fluctuating expenditures.')
      ).toBeInTheDocument();
    });
  });

  describe('WealthDimensionsSection', () => {
    it('localizes insufficient dimension status in Hindi instead of showing the enum value', async () => {
      await i18n.changeLanguage('hi');
      render(
        <WealthDimensionCard
          dimension={{
            id: 'ACCUMULATION',
            label: 'संचय',
            houseLabel: '2H',
            status: 'INSUFFICIENT_DATA'
          }}
        />
      );

      expect(screen.getByText('अपर्याप्त डेटा')).toBeInTheDocument();
      expect(screen.queryByText('INSUFFICIENT_DATA')).not.toBeInTheDocument();
    });

    it('renders all four dimensions with house labels and statements', () => {
      const dimensions: WealthDimensionsViewModel = {
        accumulation: {
          id: 'ACCUMULATION',
          label: 'Accumulation',
          houseLabel: '2nd House (Astrological accumulation indication)',
          status: 'STRONGLY_SUPPORTED',
          statement: '2nd lord Jupiter exalted in Cancer.'
        },
        gains: {
          id: 'GAINS',
          label: 'Gains & Inflow',
          houseLabel: '11th House (Astrological gains indication)',
          status: 'SUPPORTED',
          statement: '11th lord situated in 10th house.'
        },
        fortune: {
          id: 'FORTUNE',
          label: 'Fortune & Luck',
          houseLabel: '9th House (Lakshmi Sthana & Prosperity)',
          status: 'STRONGLY_SUPPORTED',
          statement: '9th lord in mutual aspect with lagna lord.'
        },
        speculation: {
          id: 'SPECULATION',
          label: 'Speculation & Venture',
          houseLabel: '5th House (Astrological speculation indication)',
          status: 'CHALLENGED',
          statement: '5th house influenced by Rahu.'
        },
        items: []
      };
      // Populate items
      (dimensions as any).items = [
        dimensions.accumulation,
        dimensions.gains,
        dimensions.fortune,
        dimensions.speculation
      ];

      render(<WealthDimensionsSection dimensions={dimensions} />);

      expect(screen.getByText('Astrological Wealth Indicators')).toBeInTheDocument();
      expect(screen.getByText(
        'Chart-derived indications only; not verified income, savings, assets, or investment facts.'
      )).toBeInTheDocument();
      expect(screen.getByText('Accumulation')).toBeInTheDocument();
      expect(screen.getByText('2nd House (Astrological accumulation indication)')).toBeInTheDocument();
      expect(screen.getByText('2nd lord Jupiter exalted in Cancer.')).toBeInTheDocument();

      expect(screen.getByText('Gains & Inflow')).toBeInTheDocument();
      expect(screen.getByText('11th House (Astrological gains indication)')).toBeInTheDocument();

      expect(screen.getByText('Fortune & Luck')).toBeInTheDocument();
      expect(screen.getByText('9th House (Lakshmi Sthana & Prosperity)')).toBeInTheDocument();

      expect(screen.getByText('Speculation & Venture')).toBeInTheDocument();
      expect(screen.getByText('5th House (Astrological speculation indication)')).toBeInTheDocument();
      expect(screen.getByText('5th house influenced by Rahu.')).toBeInTheDocument();
    });
  });

  describe('WealthD2Section — canonical availability projection', () => {
    it.each([
      ['CONFIRMS', 'Confirms'],
      ['PARTIALLY_CONFIRMS', 'Partially Confirms'],
      ['MODIFIES', 'Modifies'],
      ['CONFLICTS', 'Conflicts'],
      ['UNAVAILABLE', 'Unavailable']
    ])('renders canonical %s as %s without a component-level override', (relationship, label) => {
      const d2: WealthD2ViewModel = {
        relationship,
        statement: relationship === 'UNAVAILABLE'
          ? 'D2 calculation and interpretation have not passed independent validation.'
          : 'Canonical product-analysis D2 relationship.'
      };

      render(<WealthD2Section d2={d2} />);
      expect(screen.getByText('Hora (D2) Divisional Alignment')).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(d2.statement!)).toBeInTheDocument();
    });
  });

  describe('WealthDashaSection', () => {
    it('renders MD, AD, and PD period cards in hierarchical order', () => {
      const dasha: WealthDashaViewModel = {
        status: 'AVAILABLE',
        currentActivation: 'Jupiter MD with Saturn AD active.',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: ['ev_md'],
            statement: 'Jupiter Mahadasha establishes expansion.'
          },
          {
            level: 'AD',
            planet: 'Saturn',
            role: 'MODIFIER',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: ['ev_ad'],
            statement: 'Saturn Antardasha consolidates assets.'
          },
          {
            level: 'PD',
            planet: 'Mercury',
            role: 'REFINEMENT',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: ['ev_pd'],
            statement: 'Mercury Pratyantardasha triggers trading liquidity.'
          }
        ]
      };

      render(<WealthDashaSection dasha={dasha} />);

      expect(screen.getByText('Wealth Timing & Vimshottari Dasha Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Active Window')).toBeInTheDocument();
      expect(screen.getByText('Jupiter MD with Saturn AD active.')).toBeInTheDocument();
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
      expect(screen.getByText('Saturn')).toBeInTheDocument();
      expect(screen.getByText('Mercury')).toBeInTheDocument();
      expect(screen.getByText('Mahadasha (MD)')).toBeInTheDocument();
      expect(screen.getByText('Antardasha (AD)')).toBeInTheDocument();
      expect(screen.getByText('Pratyantardasha (PD)')).toBeInTheDocument();
    });

    it('renders partial wealth dasha timing as partial rather than unavailable', () => {
      const dasha: WealthDashaViewModel = {
        status: 'PARTIAL',
        currentActivation: 'Jupiter MD with Saturn AD active.',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: ['ev_md'],
            statement: 'Jupiter Mahadasha establishes expansion.'
          },
          {
            level: 'AD',
            planet: 'Saturn',
            role: 'MODIFIER',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: ['ev_ad'],
            statement: 'Saturn Antardasha consolidates assets.'
          }
        ]
      };

      render(<WealthDashaSection dasha={dasha} />);

      expect(screen.getByText('Partial Window')).toBeInTheDocument();
      expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
      expect(screen.getByText('Saturn')).toBeInTheDocument();
      expect(screen.queryByText('Pratyantardasha (PD)')).not.toBeInTheDocument();
    });

    it('renders unavailable fallback when dasha status is UNAVAILABLE', () => {
      const dasha: WealthDashaViewModel = {
        status: 'UNAVAILABLE',
        periods: []
      };

      render(<WealthDashaSection dasha={dasha} />);

      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Vimshottari dasha timing calculations are currently unavailable for this wealth analysis.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('WealthTransitSection', () => {
    it('renders transit effect and statement when AVAILABLE', () => {
      const transit: WealthTransitViewModel = {
        status: 'AVAILABLE',
        effect: 'TRIGGER',
        statement: 'Jupiter transiting 11th house activates substantial financial inflows.'
      };

      render(<WealthTransitSection transit={transit} />);

      expect(screen.getByText('Planetary Transits (Gochara)')).toBeInTheDocument();
      expect(screen.getByText('Trigger')).toBeInTheDocument();
      expect(
        screen.getByText('Jupiter transiting 11th house activates substantial financial inflows.')
      ).toBeInTheDocument();
    });

    it('renders unavailable fallback when transit status is UNAVAILABLE', () => {
      const transit: WealthTransitViewModel = {
        status: 'UNAVAILABLE',
        effect: 'UNAVAILABLE',
        statement: 'Transit data calculation not available'
      };

      render(<WealthTransitSection transit={transit} />);

      expect(screen.getByText('Transit data calculation not available')).toBeInTheDocument();
    });
  });

  describe('WealthSpeculativeRiskSection — C03 separation', () => {
    const riskAndSuitability: WealthRiskAndSuitabilityViewModel = {
      actualExposure: 'UNAVAILABLE',
      tradingHistory: 'UNAVAILABLE',
      suitability: 'UNAVAILABLE',
      suitabilityReason: 'No separately governed suitability model is approved.'
    };

    it.each([
      ['VERY_STRONG', 'Very strong indication'],
      ['STRONG', 'Strong indication'],
      ['MODERATE', 'Moderate indication'],
      ['MIXED', 'Mixed indication'],
      ['CHALLENGED', 'Challenged indication'],
      ['INSUFFICIENT_DATA', 'Insufficient data']
    ] as const)('renders propensity %s as %s', (status, label) => {
      const speculativePropensity: WealthSpeculativePropensityViewModel = {
        status,
        label,
        source: 'ASTROLOGICAL_INDICATION',
        adviceAvailable: false,
        description: 'Chart-derived indication only.'
      };
      const { unmount } = render(
        <WealthSpeculativeRiskSection
          speculativePropensity={speculativePropensity}
          riskAndSuitability={riskAndSuitability}
        />
      );
      expect(screen.getByText('Astrological Speculative Propensity')).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(/not a measure of actual trading exposure/)).toBeInTheDocument();
      expect(screen.getByText(/Actual exposure:/)).toBeInTheDocument();
      expect(screen.getByText(/Trading history:/)).toBeInTheDocument();
      expect(screen.getByText(/Suitability:/)).toBeInTheDocument();
      expect(screen.queryByText(/investments recommended/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/risk profile|market exposure profile/i)).not.toBeInTheDocument();
      unmount();
    });
  });

  describe('WealthQualificationsSection', () => {
    it('renders qualifications list with severity badges', () => {
      const qualifications: WealthQualificationViewModel[] = [
        {
          type: 'EXPENDITURE_PRESSURE',
          severity: 'HIGH',
          description: 'Mars in 12th house elevates expenditure volatility.'
        }
      ];

      render(<WealthQualificationsSection qualifications={qualifications} />);

      expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
      expect(screen.getByText('EXPENDITURE_PRESSURE')).toBeInTheDocument();
      expect(screen.getByText('High Severity')).toBeInTheDocument();
      expect(
        screen.getByText('Mars in 12th house elevates expenditure volatility.')
      ).toBeInTheDocument();
    });
  });

  describe('WealthEvidenceSection', () => {
    it('renders evidence cards and wires onOpenReasoning', () => {
      const onOpenReasoning = vi.fn();
      const evidence: WealthEvidenceViewModel[] = [
        {
          id: 'ev_dhana_1',
          title: 'Exalted 2nd Lord',
          statement: 'Jupiter exalted in 7th house Kendra creating strong Dhana Yoga.',
          direction: 'SUPPORT',
          role: 'PRIMARY',
          source: 'WEALTH_ENGINE',
          ruleId: 'RULE_DHANA_YOGA',
          derivedFromIds: ['natal_jupiter']
        }
      ];

      render(
        <WealthEvidenceSection evidence={evidence} onOpenReasoning={onOpenReasoning} />
      );

      expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();
      expect(screen.getByText('Exalted 2nd Lord')).toBeInTheDocument();
      expect(screen.getByText('Primary Driver')).toBeInTheDocument();
      expect(screen.getByText('Supporting')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /explore reasoning graph/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });
  });

  describe('WealthConclusionSection', () => {
    it('renders "Integrated Wealth Synthesis" title ONLY when integratedSynthesisAvailable is true', () => {
      const conclusion: WealthConclusionViewModel = {
        headline: 'Prosperous Trajectory',
        statement: 'Strong long-term accumulation potential.',
        confidence: 'HIGH',
        integratedSynthesisAvailable: true,
        primaryEvidenceCount: 3,
        supportingEvidenceCount: 4,
        challengingEvidenceCount: 1,
        primaryDriverCount: 3,
        supportingFactorCount: 4,
        challengingFactorCount: 1
      };

      render(<WealthConclusionSection conclusion={conclusion} />);

      expect(screen.getByText('Integrated Wealth Synthesis')).toBeInTheDocument();
      expect(screen.getByText('Prosperous Trajectory')).toBeInTheDocument();
      expect(screen.getByText('Primary Drivers')).toBeInTheDocument();
      expect(screen.getByText('Supporting Factors')).toBeInTheDocument();
      expect(screen.getByText('Challenging Factors')).toBeInTheDocument();
    });

    it('renders "Wealth Conclusion" title when integratedSynthesisAvailable is false', () => {
      const conclusion: WealthConclusionViewModel = {
        headline: 'Preliminary Wealth Reading',
        statement: 'Basic natal indicators available.',
        confidence: 'MEDIUM',
        integratedSynthesisAvailable: false,
        primaryEvidenceCount: 1,
        supportingEvidenceCount: 1,
        challengingEvidenceCount: 0,
        primaryDriverCount: 1,
        supportingFactorCount: 1,
        challengingFactorCount: 0
      };

      render(<WealthConclusionSection conclusion={conclusion} />);

      expect(screen.getByText('Wealth Conclusion')).toBeInTheDocument();
      expect(screen.queryByText('Integrated Wealth Synthesis')).not.toBeInTheDocument();
    });

    it('invokes onOpenReasoning when "Trace Full Evidential Reasoning" is clicked', () => {
      const onOpenReasoning = vi.fn();
      const conclusion: WealthConclusionViewModel = {
        headline: 'Prosperous Trajectory',
        statement: 'Strong accumulation.',
        confidence: 'HIGH',
        integratedSynthesisAvailable: true,
        primaryEvidenceCount: 2,
        supportingEvidenceCount: 2,
        challengingEvidenceCount: 0,
        primaryDriverCount: 2,
        supportingFactorCount: 2,
        challengingFactorCount: 0
      };

      render(
        <WealthConclusionSection conclusion={conclusion} onOpenReasoning={onOpenReasoning} />
      );

      const btn = screen.getByRole('button', { name: /trace full evidential reasoning/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });
  });
});
