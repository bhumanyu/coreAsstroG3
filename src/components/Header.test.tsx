import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Header } from './Header';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';

describe('Header Component', () => {
  it('renders grouped desktop navigation and the reduced mobile navigation', () => {
    const handleNavigate = vi.fn();
    const handleOpenModal = vi.fn();

    render(
      <Header
        activePage="overview"
        onNavigate={handleNavigate}
        onOpenBirthForm={handleOpenModal}
      />
    );

    const navigationMenus = screen.getAllByRole('navigation', { name: 'Product Views' });
    expect(navigationMenus).toHaveLength(2);
    expect(within(navigationMenus[0]).getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(within(navigationMenus[0]).getByRole('button', { name: 'Kundli' })).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByText('Home', { selector: 'summary' })).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByText('Chart')).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByText('Insights')).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByText('Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Birth Details & Ayanamsa' })).toBeInTheDocument();

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
      />
    );

    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
    fireEvent.click(within(desktopNavigation).getByText('Report'));
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Detailed Analysis' }));
    expect(handleNavigate).toHaveBeenCalledWith('detailed');

    fireEvent.click(within(desktopNavigation).getByText('Insights'));
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Career' }));
    expect(handleNavigate).toHaveBeenCalledWith('career');

    fireEvent.click(within(desktopNavigation).getByText('Insights'));
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Wealth' }));
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
    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
    fireEvent.click(within(desktopNavigation).getByText('Report'));
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Detailed Analysis' }));
    expect(handleTabChange).toHaveBeenCalledWith('report');

    fireEvent.click(within(desktopNavigation).getByText('Insights'));
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Overview' }));
    expect(handleTabChange).toHaveBeenCalledWith('life-analysis');

    handleTabChange.mockClear();
    // Clicking a product-only page without legacy equivalent should not invoke legacy setActiveTab
    fireEvent.click(within(desktopNavigation).getByText('Insights'));
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Career' }));
    expect(handleTabChange).not.toHaveBeenCalled();
  });
});
