import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WealthSubthemeGrid } from './WealthSubthemeGrid';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { WealthSubthemeKey, WealthSubthemeSummary, WealthEvidenceFamily } from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';

describe('WealthSubthemeGrid Component', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalWealth = horoscope.themeInterpretationV2?.wealth!;

  it('renders all four pillars with canonical data', () => {
    const { container } = render(
      <WealthSubthemeGrid
        subthemes={canonicalWealth.subthemes}
        id="canonical-subtheme-grid"
      />
    );

    expect(container.querySelector('#canonical-subtheme-grid')).toBeInTheDocument();
    expect(screen.getByText('Four Pillars of Wealth & Prosperity')).toBeInTheDocument();

    // 1. Accumulation
    expect(screen.getByText('Wealth Accumulation & Liquid Assets')).toBeInTheDocument();
    expect(screen.getByText('House 2 Focus')).toBeInTheDocument();

    // 2. Gains
    expect(screen.getByText('Income, Gains & Financial Inflows')).toBeInTheDocument();
    expect(screen.getByText('House 11 Focus')).toBeInTheDocument();

    // 3. Fortune
    expect(screen.getByText('Prosperity & Bhagya (Fortune)')).toBeInTheDocument();
    expect(screen.getByText('House 9 Focus')).toBeInTheDocument();

    // 4. Speculation
    expect(screen.getByText('Investments & Speculative Growth')).toBeInTheDocument();
    expect(screen.getByText('House 5 Focus')).toBeInTheDocument();

    // Pillar Status Badges with accessibility aria-labels
    expect(screen.getAllByLabelText(/Pillar Status:/i).length).toBe(4);

    // Support and Challenge counts rendered
    expect(screen.getAllByText(/Support/i).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText(/Challenge/i).length).toBeGreaterThanOrEqual(4);
  });

  it('renders custom status badges correctly for each subtheme state', () => {
    const mockSubthemes: Record<WealthSubthemeKey, WealthSubthemeSummary> = {
      ACCUMULATION: {
        key: 'ACCUMULATION',
        houseNumber: 2,
        title: 'Asset Accumulation & Net Worth',
        primaryFamily: WealthEvidenceFamily.SECOND_HOUSE,
        lordFamily: WealthEvidenceFamily.SECOND_LORD,
        status: 'SUPPORT',
        supportingEvidenceCount: 5,
        challengingEvidenceCount: 1,
        summaryStatement: 'Strong 2nd house accumulation indicators.'
      },
      GAINS: {
        key: 'GAINS',
        houseNumber: 11,
        title: 'Income, Profits & Expansion',
        primaryFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        lordFamily: WealthEvidenceFamily.ELEVENTH_LORD,
        status: 'CHALLENGE',
        supportingEvidenceCount: 0,
        challengingEvidenceCount: 3,
        summaryStatement: 'Challenged 11th house gains.'
      },
      FORTUNE: {
        key: 'FORTUNE',
        houseNumber: 9,
        title: 'Bhagya, Fortune & Higher Prosperity',
        primaryFamily: WealthEvidenceFamily.NINTH_HOUSE,
        lordFamily: WealthEvidenceFamily.NINTH_LORD,
        status: 'MIXED',
        supportingEvidenceCount: 2,
        challengingEvidenceCount: 2,
        summaryStatement: 'Mixed fortune factors.'
      },
      SPECULATION: {
        key: 'SPECULATION',
        houseNumber: 5,
        title: 'Investments, Speculation & Intelligence',
        primaryFamily: WealthEvidenceFamily.FIFTH_HOUSE,
        lordFamily: WealthEvidenceFamily.FIFTH_LORD,
        status: 'NEUTRAL',
        supportingEvidenceCount: 0,
        challengingEvidenceCount: 0,
        summaryStatement: 'Neutral 5th house speculative potential.'
      }
    };

    render(<WealthSubthemeGrid subthemes={mockSubthemes} id="mock-grid" />);

    expect(screen.getByLabelText('Pillar Status: Supportive')).toBeInTheDocument();
    expect(screen.getByLabelText('Pillar Status: Challenged')).toBeInTheDocument();
    expect(screen.getByLabelText('Pillar Status: Mixed Support & Challenge')).toBeInTheDocument();
    expect(screen.getByLabelText('Pillar Status: Neutral')).toBeInTheDocument();

    expect(screen.getByText('Strong 2nd house accumulation indicators.')).toBeInTheDocument();
    expect(screen.getByText('5 Support')).toBeInTheDocument();
    expect(screen.getByText('3 Challenge')).toBeInTheDocument();
  });
});
