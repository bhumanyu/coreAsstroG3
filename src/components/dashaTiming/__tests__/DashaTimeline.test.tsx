import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashaTimeline } from '../DashaTimeline';
import type { DashaTimelineProduct, DashaTimelinePeriodProduct } from '../../../product/dasha-timing/dashaTimingTypes';

describe('DashaTimeline', () => {
  const mockTimeline: DashaTimelineProduct = {
    availability: 'AVAILABLE',
    periods: [
      {
        planet: 'JUPITER',
        start: '2020-01-01T00:00:00.000Z',
        end: '2036-01-01T00:00:00.000Z',
        index: 0,
        durationYears: 16,
        antardashas: [
          {
            planet: 'JUPITER',
            start: '2020-01-01T00:00:00.000Z',
            end: '2024-03-10T00:00:00.000Z'
          },
          {
            planet: 'SATURN',
            start: '2024-03-10T00:00:00.000Z',
            end: '2026-09-22T00:00:00.000Z'
          },
          {
            planet: 'MERCURY',
            start: '2026-09-22T00:00:00.000Z',
            end: '2029-05-15T00:00:00.000Z'
          }
        ]
      },
      {
        planet: 'SATURN',
        start: '2036-01-01T00:00:00.000Z',
        end: '2055-01-01T00:00:00.000Z',
        index: 1,
        durationYears: 19,
        antardashas: [
          {
            planet: 'SATURN',
            start: '2036-01-01T00:00:00.000Z',
            end: '2040-05-20T00:00:00.000Z'
          },
          {
            planet: 'MERCURY',
            start: '2040-05-20T00:00:00.000Z',
            end: '2043-02-10T00:00:00.000Z'
          }
        ]
      },
      {
        planet: 'JUPITER',
        start: '2055-01-01T00:00:00.000Z',
        end: '2071-01-01T00:00:00.000Z',
        index: 2,
        durationYears: 16,
        antardashas: [
          {
            planet: 'JUPITER',
            start: '2055-01-01T00:00:00.000Z',
            end: '2059-04-10T00:00:00.000Z'
          }
        ]
      }
    ]
  };

  it('renders timeline with all Mahadasha periods', () => {
    render(<DashaTimeline timeline={mockTimeline} />);

    expect(screen.getByText('Vimshottari 120-Year Mahadasha Timeline')).toBeInTheDocument();
    expect(screen.getByText('3 Mahadashas')).toBeInTheDocument();
    // Jupiter appears twice in the timeline (two different Jupiter Mahadashas)
    expect(screen.getAllByText('Jupiter').length).toBe(2);
    expect(screen.getByText('Saturn')).toBeInTheDocument();
  });

  it('disambiguates active Mahadasha by interval (not planet name)', () => {
    // Timeline has two Jupiter Mahadashas with different intervals
    // Active should be the first one (2020-2036)
    render(
      <DashaTimeline
        timeline={mockTimeline}
        activeMahadashaStart="2020-01-01T00:00:00.000Z"
        activeMahadashaEnd="2036-01-01T00:00:00.000Z"
      />
    );

    // Should find exactly one "Active" label
    const activeLabels = screen.getAllByText('Active');
    expect(activeLabels.length).toBe(1);

    // Verify the Active label is on a card with the correct interval
    const activeCard = activeLabels[0].closest('.rounded-2xl');
    expect(activeCard).toHaveClass('bg-gradient-to-b');
    expect(activeCard?.textContent).toContain('2020-01-01T00:00:00.000Z');
    expect(activeCard?.textContent).toContain('2036-01-01T00:00:00.000Z');
  });

  it('shows actual Antardasha count instead of hardcoded "9"', () => {
    render(<DashaTimeline timeline={mockTimeline} />);

    // Check that the toggle buttons show the actual count based on the data
    const toggleButtons = screen.getAllByText(/View \d+ Antardashas/);
    expect(toggleButtons.length).toBeGreaterThan(0);

    // First card (Jupiter 2020-2036) should have 3 Antardashas
    expect(toggleButtons[0].textContent).toContain('View 3 Antardashas');

    // Second card (Saturn 2036-2055) should have 2 Antardashas
    expect(toggleButtons[1].textContent).toContain('View 2 Antardashas');

    // Third card (Jupiter 2055-2071) should have 1 Antardasha
    expect(toggleButtons[2].textContent).toContain('View 1 Antardashas');
  });

  it('renders empty state when timeline unavailable', () => {
    const unavailableTimeline: DashaTimelineProduct = {
      availability: 'UNAVAILABLE',
      periods: []
    };

    render(<DashaTimeline timeline={unavailableTimeline} />);

    expect(screen.getByText('Vimshottari Timeline Unavailable')).toBeInTheDocument();
  });

  it('handles case where no active Mahadasha is specified', () => {
    render(<DashaTimeline timeline={mockTimeline} />);

    // No "Active" labels should appear
    const activeLabels = screen.queryAllByText('Active');
    expect(activeLabels.length).toBe(0);
  });
});
