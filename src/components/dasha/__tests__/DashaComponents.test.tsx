import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DashaHero,
  TransitTimingSection,
  CurrentDashaHierarchy,
  CareerActivationSection,
  WealthActivationSection,
  DashaEvidenceSection,
  DashaPeriodCard
} from '../index';
import type {
  DashaHeroViewModel,
  DashaTransitViewModel,
  DashaPeriodViewModel,
  DashaEvidenceViewModel
} from '../../../product/analysis/dashaViewModel';

describe('Dasha Presentational Components (P-UI-07)', () => {
  it('1. DashaHero: renders with all three periods and asserts planet names', () => {
    const hero: DashaHeroViewModel = {
      availability: 'AVAILABLE',
      status: 'READY',
      asOf: '2026-09-08',
      currentPeriodLabel: 'Jupiter → Saturn → Mercury',
      mdPlanet: 'Jupiter',
      adPlanet: 'Saturn',
      pdPlanet: 'Mercury'
    };

    render(<DashaHero hero={hero} />);

    expect(screen.getByText('Dasha & Planetary Timing')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('2. DashaHero: renders with null periods and asserts "Unavailable" fallback', () => {
    const hero: DashaHeroViewModel = {
      availability: 'UNAVAILABLE',
      status: 'READY',
      asOf: '2026-09-08',
      currentPeriodLabel: 'Timing Unavailable',
      mdPlanet: null,
      adPlanet: null,
      pdPlanet: null
    };

    render(<DashaHero hero={hero} />);

    expect(screen.getByText('Dasha & Planetary Timing')).toBeInTheDocument();
    const unavailElements = screen.getAllByText('Unavailable');
    expect(unavailElements.length).toBeGreaterThanOrEqual(3);
  });

  it('3. TransitTimingSection: renders both career and wealth domain blocks and asserts context copy', () => {
    const transit: DashaTransitViewModel = {
      career: {
        status: 'AVAILABLE',
        effect: 'TRIGGER',
        statement: 'Jupiter transit activates natal 10th house potential.'
      },
      wealth: {
        status: 'UNAVAILABLE',
        effect: 'UNAVAILABLE',
        statement: undefined
      }
    };

    render(<TransitTimingSection transit={transit} />);

    expect(screen.getByText('Transit Timing')).toBeInTheDocument();
    expect(screen.getByText('Career')).toBeInTheDocument();
    expect(screen.getByText('Wealth')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByText('Jupiter transit activates natal 10th house potential.')).toBeInTheDocument();
    expect(screen.getByText(/timing or trigger context/i)).toBeInTheDocument();
  });

  it('4. CurrentDashaHierarchy: renders hierarchy with cards and independent role/direction', () => {
    const periods: DashaPeriodViewModel[] = [
      {
        level: 'MD',
        planet: 'Jupiter',
        start: '2020-05-15',
        end: '2036-05-15',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        statement: 'Jupiter Mahadasha establishes primary baseline.',
        available: true
      },
      {
        level: 'AD',
        planet: 'Saturn',
        start: '2024-03-10',
        end: '2026-09-22',
        role: 'MODIFIER',
        direction: 'CHALLENGE',
        statement: 'Saturn Antardasha introduces structural discipline.',
        available: true
      }
    ];

    render(<CurrentDashaHierarchy hierarchy={periods} availability="AVAILABLE" />);

    expect(screen.getByText('Current Dasha Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Mahadasha (MD)')).toBeInTheDocument();
    expect(screen.getByText('Primary Driver')).toBeInTheDocument();
    expect(screen.getByText('Supporting')).toBeInTheDocument();

    expect(screen.getByText('Antardasha (AD)')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Challenging')).toBeInTheDocument();
  });

  it('5. DashaPeriodCard: renders start and end dates formatted', () => {
    const period: DashaPeriodViewModel = {
      level: 'PD',
      planet: 'Mercury',
      start: '2026-04-01',
      end: '2026-08-15',
      role: 'REFINEMENT',
      direction: 'SUPPORT',
      statement: 'Operational refinement.',
      available: true
    };

    render(<DashaPeriodCard period={period} />);

    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getByText('2026-04-01 → 2026-08-15')).toBeInTheDocument();
    expect(screen.getByText('Refinement')).toBeInTheDocument();
  });

  it('6. CareerActivationSection & WealthActivationSection: renders domain activations', () => {
    const careerActivation = {
      status: 'AVAILABLE' as const,
      periods: [],
      statement: 'Career dasha active',
      currentPressure: 'High workload requirement'
    };

    const wealthActivation = {
      status: 'PARTIAL' as const,
      periods: [],
      statement: 'Liquid asset accumulation window'
    };

    const { unmount: unmountCareer } = render(
      <CareerActivationSection activation={careerActivation} />
    );
    expect(screen.getByText('Career Activation')).toBeInTheDocument();
    expect(screen.getByText('Career dasha active')).toBeInTheDocument();
    expect(screen.getByText('High workload requirement')).toBeInTheDocument();
    unmountCareer();

    render(<WealthActivationSection activation={wealthActivation} />);
    expect(screen.getByText('Wealth Activation')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('Liquid asset accumulation window')).toBeInTheDocument();
  });

  it('7. DashaEvidenceSection: groups evidence items by role', () => {
    const evidence: DashaEvidenceViewModel = {
      total: 1,
      groups: {
        PRIMARY: [
          {
            id: 'ev_1',
            title: '10th Lord Strength',
            statement: 'Mars exalted in Lagna.',
            direction: 'SUPPORT',
            role: 'PRIMARY',
            source: 'ENGINE'
          }
        ],
        SUPPORTING: [],
        CHALLENGING: [],
        MODIFIER: [],
        REFINEMENT: [],
        CONFLICTING: [],
        NEUTRAL: []
      }
    };

    render(<DashaEvidenceSection evidence={evidence} />);
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();
    expect(screen.getByText('10th Lord Strength')).toBeInTheDocument();
    expect(screen.getByText(/Primary Driver/i)).toBeInTheDocument();
  });
});
