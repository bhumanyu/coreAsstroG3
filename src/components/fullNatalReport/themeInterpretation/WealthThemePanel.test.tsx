import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WealthThemePanel } from './WealthThemePanel';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { WealthThemeInterpretation } from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';

describe('WealthThemePanel Component', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalWealth = horoscope.themeInterpretationV2?.wealth!;

  it('renders WealthThemePanel with canonical data and custom id', () => {
    const { container } = render(
      <WealthThemePanel wealth={canonicalWealth} id="custom-wealth-panel" />
    );

    const panel = container.querySelector('#custom-wealth-panel');
    expect(panel).toBeInTheDocument();

    expect(screen.getByText('Wealth & Prosperity')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Deterministic wealth analysis based on accumulation, gains, fortune, speculation, supporting factors, and timing./i
      )
    ).toBeInTheDocument();
  });

  it('renders wealth status and evidence confidence badges', () => {
    render(<WealthThemePanel wealth={canonicalWealth} id="wealth-theme-panel" />);

    expect(screen.getAllByLabelText(/Conclusion Status:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/Evidence Confidence:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Evidence Confidence:/i).length).toBeGreaterThan(0);
  });

  it('renders Natal Wealth Promise card', () => {
    render(<WealthThemePanel wealth={canonicalWealth} id="wealth-theme-panel" />);

    expect(
      screen.getByText('Natal Wealth Promise (Root Structural Potential)')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Natal Promise Status:/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary Structural Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary Structural Challenges/i)).toBeInTheDocument();
  });

  it('renders four wealth pillars (ACCUMULATION, GAINS, FORTUNE, SPECULATION) via WealthSubthemeGrid', () => {
    render(<WealthThemePanel wealth={canonicalWealth} id="wealth-theme-panel" />);

    expect(screen.getByText('Wealth Accumulation & Liquid Assets')).toBeInTheDocument();
    expect(screen.getByText('Income, Gains & Financial Inflows')).toBeInTheDocument();
    expect(screen.getByText('Prosperity & Bhagya (Fortune)')).toBeInTheDocument();
    expect(screen.getByText('Investments & Speculative Growth')).toBeInTheDocument();
    expect(screen.getByText('House 2 Focus')).toBeInTheDocument();
    expect(screen.getByText('House 11 Focus')).toBeInTheDocument();
    expect(screen.getByText('House 9 Focus')).toBeInTheDocument();
    expect(screen.getByText('House 5 Focus')).toBeInTheDocument();
  });

  it('renders D2 (Hora) unavailable card', () => {
    render(<WealthThemePanel wealth={canonicalWealth} id="wealth-theme-panel" />);

    expect(screen.getByText('D2 (Hora) Divisional Confirmation')).toBeInTheDocument();
    expect(
      screen.getByText(
        'D2 confirmation is not implemented in the current Wealth interpretation version.'
      )
    ).toBeInTheDocument();
  });

  it('renders Timing and Metadata cards', () => {
    render(<WealthThemePanel wealth={canonicalWealth} id="wealth-theme-panel" />);

    expect(screen.getByText('Timing / Activation')).toBeInTheDocument();
    expect(screen.getByText(/Technical Engine Audit & Metadata/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluated Rules/i)).toBeInTheDocument();
  });

  describe('Dhana Yoga Confirmation tri-state statements', () => {
    it('renders CONFIRMS statement when yogaConfirmationStatus is CONFIRMS', () => {
      const confirmsWealth: WealthThemeInterpretation = {
        ...canonicalWealth,
        metadata: {
          ...canonicalWealth.metadata,
          yogaConfirmationStatus: 'CONFIRMS'
        }
      };

      render(<WealthThemePanel wealth={confirmsWealth} id="wealth-confirms" />);
      expect(
        screen.getByText(
          'Classical wealth-generating Yogas identified and reinforce natal financial potential.'
        )
      ).toBeInTheDocument();
    });

    it('renders ABSENT statement when yogaConfirmationStatus is ABSENT', () => {
      const absentWealth: WealthThemeInterpretation = {
        ...canonicalWealth,
        metadata: {
          ...canonicalWealth.metadata,
          yogaConfirmationStatus: 'ABSENT'
        }
      };

      render(<WealthThemePanel wealth={absentWealth} id="wealth-absent" />);
      expect(
        screen.getByText('No qualifying Dhana/Lakshmi Yoga confirmation identified.')
      ).toBeInTheDocument();
    });

    it('renders UNAVAILABLE statement when yogaConfirmationStatus is UNAVAILABLE', () => {
      const unavailWealth: WealthThemeInterpretation = {
        ...canonicalWealth,
        metadata: {
          ...canonicalWealth.metadata,
          yogaConfirmationStatus: 'UNAVAILABLE'
        }
      };

      render(<WealthThemePanel wealth={unavailWealth} id="wealth-unavail" />);
      expect(
        screen.getByText('Yoga confirmation unavailable.')
      ).toBeInTheDocument();
    });
  });
});
