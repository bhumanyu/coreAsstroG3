import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HomePage } from './HomePage';

describe('HomePage without birth details', () => {
  it('shows the empty state and keeps chart tiles gated while daily cards remain available', () => {
    const onNavigate = vi.fn();
    const onOpenBirthForm = vi.fn();
    render(
      <HomePage
        birthContext={undefined}
        onNavigate={onNavigate}
        onOpenBirthForm={onOpenBirthForm}
        analysisStatus="IDLE"
      />
    );

    expect(screen.getByText('Enter your birth details to calculate your horoscope')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Today’s Panchang' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'General Rashi forecast' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Festivals & Holidays' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Kundli/ }));
    expect(onOpenBirthForm).toHaveBeenCalledOnce();
    expect(onNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Enter Birth Details' }));
    expect(onOpenBirthForm).toHaveBeenCalledTimes(2);
  });
});
