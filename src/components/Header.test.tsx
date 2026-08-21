import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';
import type { AppTab } from '../types/appTabs';

describe('Header Component', () => {
  it('renders all expected tabs with Life Analysis first and Detailed Analysis present', () => {
    const handleTabChange = vi.fn();
    const handleOpenModal = vi.fn();
    const handleResetPreset = vi.fn();

    render(
      <Header
        birthDetails={CANONICAL_BIRTH_DETAILS}
        onOpenBirthForm={handleOpenModal}
        activeTab="life-analysis"
        setActiveTab={handleTabChange}
        onResetPreset={handleResetPreset}
      />
    );

    const buttons = screen.getAllByRole('button');
    const tabButtons = buttons.filter((b) =>
      [
        'Life Analysis',
        'Detailed Analysis',
        'Horoscope & Charts',
        'Planetary Facts & Dignity',
        'Gochara Transits (PR-037)',
        'Divisional Vargas (D1, D3, D9, D10)',
        '27 Nakshatras Wheel',
        'Natural Relationships',
        'Golden Vector Test Suite'
      ].includes(b.textContent || '')
    );

    expect(tabButtons).toHaveLength(9);
    expect(tabButtons[0].textContent).toBe('Life Analysis');
    expect(tabButtons[1].textContent).toBe('Detailed Analysis');

    // Ensure AI Explanation is NOT present
    expect(screen.queryByRole('button', { name: 'AI Explanation' })).not.toBeInTheDocument();
  });

  it('invokes setActiveTab with selected AppTab when clicked', () => {
    const handleTabChange = vi.fn();

    render(
      <Header
        birthDetails={CANONICAL_BIRTH_DETAILS}
        onOpenBirthForm={vi.fn()}
        activeTab="life-analysis"
        setActiveTab={handleTabChange}
        onResetPreset={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Detailed Analysis' }));
    expect(handleTabChange).toHaveBeenCalledWith('report');

    fireEvent.click(screen.getByRole('button', { name: 'Horoscope & Charts' }));
    expect(handleTabChange).toHaveBeenCalledWith('horoscope');
  });
});
