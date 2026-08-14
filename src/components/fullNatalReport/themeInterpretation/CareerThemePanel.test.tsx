import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerThemePanel } from './CareerThemePanel';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { CareerThemeInterpretation } from '../../../engine/themeInterpretation/themeInterpretationTypes';

describe('CareerThemePanel Component', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalCareer = horoscope.themeInterpretationV2?.career!;

  it('renders CareerThemePanel with canonical data and custom id', () => {
    const { container } = render(
      <CareerThemePanel career={canonicalCareer} id="custom-career-panel" />
    );

    // Assert main panel container ID
    const panel = container.querySelector('#custom-career-panel');
    expect(panel).toBeInTheDocument();

    // Assert header
    expect(screen.getByText('Career & Professional Life')).toBeInTheDocument();
    expect(
      screen.getByText(/Deterministic career analysis based on structural houses/i)
    ).toBeInTheDocument();
  });

  it('renders career status and evidence confidence badges', () => {
    render(<CareerThemePanel career={canonicalCareer} id="career-theme-panel" />);

    // Conclusion status badge (e.g. Supported)
    expect(screen.getAllByLabelText(/Conclusion Status:/i).length).toBeGreaterThan(0);

    // Evidence Confidence badge (e.g. Evidence Confidence: High)
    expect(screen.getAllByLabelText(/Evidence Confidence:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Evidence Confidence:/i).length).toBeGreaterThan(0);
  });

  it('renders Natal Career Promise card with support and challenge factors', () => {
    render(<CareerThemePanel career={canonicalCareer} id="career-theme-panel" />);

    // Natal Career Promise card
    expect(
      screen.getByText('Natal Career Promise (Root Structural Potential)')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Natal Promise Status:/i)
    ).toBeInTheDocument();

    // Primary support and challenge sections
    expect(screen.getByText(/Primary Structural Support/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary Structural Challenges/i)).toBeInTheDocument();

    // Wording check
    expect(
      screen.getByText(
        /Natal Promise represents the structural support identified in the birth chart before modifiers, divisional confirmation, and timing are considered./i
      )
    ).toBeInTheDocument();
  });

  it('renders D10 (Dasamsa) Confirmation Card', () => {
    render(<CareerThemePanel career={canonicalCareer} id="career-theme-panel" />);

    expect(
      screen.getByText('D10 (Dasamsa) Divisional Confirmation')
    ).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(/Confirmation Status:/i).length
    ).toBeGreaterThan(0);
  });

  it('renders Timing / Activation Card with Vimshottari period activation', () => {
    render(<CareerThemePanel career={canonicalCareer} id="career-theme-panel" />);

    expect(
      screen.getByText('Timing / Activation (Vimshottari Windows)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Vimshottari Windows')
    ).toBeInTheDocument();
  });

  it('renders Collapsible Technical Engine Audit & Metadata card', () => {
    render(<CareerThemePanel career={canonicalCareer} id="career-theme-panel" />);

    expect(
      screen.getByText(/Technical Engine Audit & Metadata/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Evaluated Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Triggered Rules/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidence Items/i)).toBeInTheDocument();
  });

  it('renders correctly with synthetic edge-case career fixture', () => {
    const edgeCareer: CareerThemeInterpretation = {
      ...canonicalCareer,
      conclusion: {
        ...canonicalCareer.conclusion,
        status: 'MIXED',
        confidence: 'LOW',
        summary: 'Synthetic edge career summary.'
      },
      careerNatalPromise: {
        ...canonicalCareer.careerNatalPromise,
        status: 'MIXED',
        evidenceConfidence: 'LOW',
        primarySupport: [],
        primaryChallenges: []
      }
    };

    const { container } = render(
      <CareerThemePanel career={edgeCareer} id="edge-career-panel" />
    );

    expect(container.querySelector('#edge-career-panel')).toBeInTheDocument();
    expect(screen.getByText('Synthetic edge career summary.')).toBeInTheDocument();
    expect(
      screen.getByText('No strong primary structural support configurations identified.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('No acute primary structural afflictions identified on key factors.')
    ).toBeInTheDocument();
  });
});
