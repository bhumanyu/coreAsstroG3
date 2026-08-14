import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LifeThemesSection } from './LifeThemesSection';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { LifeThemesSection as LifeThemesSectionType, LifeTheme } from '../../types';

describe('LifeThemesSection Integration Tests', () => {
  const canonicalHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const canonicalSection = canonicalHoroscope.fullNatalAnalysis!.lifeThemes;

  it('renders CareerThemePanel (id "theme-panel-career") and WealthThemePanel (id "theme-panel-wealth") when both are present', () => {
    const { container } = render(<LifeThemesSection section={canonicalSection} />);

    // Assert Life Themes Overview header exists
    expect(screen.getByText('Life Themes Overview')).toBeInTheDocument();
    expect(screen.getByText('Deterministic Multi-Tier Interpretations')).toBeInTheDocument();

    // Query panels by id
    const careerPanel = container.querySelector('#theme-panel-career');
    const wealthPanel = container.querySelector('#theme-panel-wealth');

    expect(careerPanel).toBeInTheDocument();
    expect(wealthPanel).toBeInTheDocument();

    // Headers inside panels
    expect(screen.getAllByText('Career & Professional Life').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Wealth & Prosperity').length).toBeGreaterThanOrEqual(1);
  });

  it('renders other generic themes via LifeThemeCard alongside specialized panels', () => {
    render(<LifeThemesSection section={canonicalSection} />);

    const nonCareerWealthThemes = canonicalSection.themes.filter(
      (t) =>
        t.theme !== LifeTheme.CAREER_STATUS &&
        (t.theme as string) !== 'CAREER_STATUS' &&
        t.theme !== LifeTheme.WEALTH_FINANCE &&
        (t.theme as string) !== 'WEALTH_PROSPERITY' &&
        (t.theme as string) !== 'WEALTH_FINANCE'
    );

    expect(nonCareerWealthThemes.length).toBeGreaterThan(0);
    nonCareerWealthThemes.forEach((t) => {
      expect(screen.getByText(t.label)).toBeInTheDocument();
    });
  });

  it('renders ThemeInterpretationUnavailable when career theme is present but career interpretation is undefined', () => {
    const sectionWithoutCareer: LifeThemesSectionType = {
      ...canonicalSection,
      career: undefined
    };

    const { container } = render(<LifeThemesSection section={sectionWithoutCareer} />);

    // Career theme panel id should NOT be rendered
    expect(container.querySelector('#theme-panel-career')).toBeNull();

    // ThemeInterpretationUnavailable for Career & Status should be rendered
    expect(
      screen.getByText('Career & Status Interpretation Unavailable')
    ).toBeInTheDocument();
  });

  it('renders ThemeInterpretationUnavailable when wealth theme is present but wealth interpretation is undefined', () => {
    const sectionWithoutWealth: LifeThemesSectionType = {
      ...canonicalSection,
      wealth: undefined
    };

    const { container } = render(<LifeThemesSection section={sectionWithoutWealth} />);

    // Wealth theme panel id should NOT be rendered
    expect(container.querySelector('#theme-panel-wealth')).toBeNull();

    // ThemeInterpretationUnavailable for Wealth & Prosperity should be rendered
    expect(
      screen.getByText('Wealth & Prosperity Interpretation Unavailable')
    ).toBeInTheDocument();
  });

  it('retains generic behavior and does not render career/wealth panels when both career and wealth are absent', () => {
    const genericSection: LifeThemesSectionType = {
      ...canonicalSection,
      career: undefined,
      wealth: undefined
    };

    const { container } = render(<LifeThemesSection section={genericSection} />);

    // Life Themes Overview header should NOT be rendered
    expect(screen.queryByText('Life Themes Overview')).toBeNull();

    // Neither panel should be rendered
    expect(container.querySelector('#theme-panel-career')).toBeNull();
    expect(container.querySelector('#theme-panel-wealth')).toBeNull();

    // Generic themes cards still render
    expect(screen.getAllByText(/Confidence:/i).length).toBeGreaterThan(0);
  });

  it('renders EmptyState when section status is UNAVAILABLE', () => {
    const unavailableSection: LifeThemesSectionType = {
      status: 'UNAVAILABLE',
      themes: [],
      synthesis: []
    };

    render(<LifeThemesSection section={unavailableSection} />);
    expect(screen.getByText('Life Themes Synthesis Unavailable')).toBeInTheDocument();
  });

  it('renders PartialStateNotice when section status is PARTIAL', () => {
    const partialSection: LifeThemesSectionType = {
      ...canonicalSection,
      status: 'PARTIAL'
    };

    render(<LifeThemesSection section={partialSection} />);
    expect(screen.getByText('Life theme synthesis is partial.')).toBeInTheDocument();
  });
});
