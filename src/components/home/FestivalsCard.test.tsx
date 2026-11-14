import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FestivalsCard } from './FestivalsCard';

afterEach(() => {
  vi.useRealTimers();
});

describe('FestivalsCard', () => {
  it('switches tabs and lists only upcoming entries in chronological order', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T12:00:00Z'));
    render(<FestivalsCard />);

    const festivalTab = screen.getByRole('tab', { name: 'Festivals' });
    expect(festivalTab).toHaveAttribute('aria-selected', 'true');
    const festivalItems = within(screen.getByRole('list')).getAllByRole('listitem');
    const festivalNames = festivalItems.map((item) => item.textContent);
    expect(festivalNames[0]).toContain('Karva Chauth');
    expect(festivalNames[1]).toContain('Dhanteras');
    expect(festivalNames[2]).toContain('Diwali');
    expect(festivalNames.some((name) => name?.includes('Navratri'))).toBe(false);

    fireEvent.click(screen.getByRole('tab', { name: 'Holidays' }));
    expect(screen.getByRole('tab', { name: 'Holidays' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Christmas Day')).toBeInTheDocument();
  });
});
