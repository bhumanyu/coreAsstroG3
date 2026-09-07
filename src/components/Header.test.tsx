import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';

describe('Header Component', () => {
  it('renders all expected product navigation tabs with Overview first and Detailed Analysis present', () => {
    const handleNavigate = vi.fn();
    const handleOpenModal = vi.fn();
    const handleResetPreset = vi.fn();

    render(
      <Header
        activePage="overview"
        onNavigate={handleNavigate}
        onOpenBirthForm={handleOpenModal}
        onResetPreset={handleResetPreset}
      />
    );

    const expectedProductTabs = [
      'Overview',
      'Career',
      'Wealth',
      'Dasha & Timing',
      'Why This Result?',
      'Detailed Analysis'
    ];

    expectedProductTabs.forEach((tab) => {
      expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
    });

    // Ensure Brand shows CoreAstro and Vedic Astrology
    expect(screen.getByText('CoreAstro')).toBeInTheDocument();
    expect(screen.getByText('Vedic Astrology')).toBeInTheDocument();

    // Ensure version and engine wording moved OUT of the header
    expect(screen.queryByText(/v0\.1\.0-TS/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Calculation System/)).not.toBeInTheDocument();

    // Ensure standalone AI Explanation is NOT present
    expect(screen.queryByRole('button', { name: 'AI Explanation' })).not.toBeInTheDocument();
  });

  it('invokes onNavigate with selected AppPage when clicked', () => {
    const handleNavigate = vi.fn();

    render(
      <Header
        activePage="overview"
        onNavigate={handleNavigate}
        onOpenBirthForm={vi.fn()}
        onResetPreset={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Detailed Analysis' }));
    expect(handleNavigate).toHaveBeenCalledWith('detailed');

    fireEvent.click(screen.getByRole('button', { name: 'Career' }));
    expect(handleNavigate).toHaveBeenCalledWith('career');

    fireEvent.click(screen.getByRole('button', { name: 'Wealth' }));
    expect(handleNavigate).toHaveBeenCalledWith('wealth');
  });

  it('supports legacy birthDetails and activeTab props for backwards compatibility', () => {
    const handleTabChange = vi.fn();

    render(
      <Header
        birthDetails={CANONICAL_BIRTH_DETAILS}
        activeTab="life-analysis"
        setActiveTab={handleTabChange}
        onOpenBirthForm={vi.fn()}
      />
    );

    expect(screen.getByText('Birth Chart')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Detailed Analysis' }));
    expect(handleTabChange).toHaveBeenCalledWith('report');

    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    expect(handleTabChange).toHaveBeenCalledWith('life-analysis');

    handleTabChange.mockClear();
    // Clicking a product-only page without legacy equivalent should not invoke legacy setActiveTab
    fireEvent.click(screen.getByRole('button', { name: 'Career' }));
    expect(handleTabChange).not.toHaveBeenCalled();
  });
});
