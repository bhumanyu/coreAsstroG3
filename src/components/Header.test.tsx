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
    expect(within(navigationMenus[1]).getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByRole('button', { name: 'Chart' })).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByRole('button', { name: 'Insights' })).toBeInTheDocument();
    expect(within(navigationMenus[1]).getByRole('button', { name: 'Report' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter Birth Details' })).toBeInTheDocument();

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
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Report' }));
    expect(handleNavigate).toHaveBeenCalledWith('detailed');

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Insights' }));
    fireEvent.click(within(desktopNavigation).getByRole('menuitem', { name: 'Career' }));
    expect(handleNavigate).toHaveBeenCalledWith('career');

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Insights' }));
    fireEvent.click(within(desktopNavigation).getByRole('menuitem', { name: 'Wealth' }));
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
    expect(screen.getByRole('button', { name: 'Edit Birth Details & Ayanamsa' })).toBeInTheDocument();
    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Report' }));
    expect(handleTabChange).toHaveBeenCalledWith('report');

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Insights' }));
    fireEvent.click(within(desktopNavigation).getByRole('menuitem', { name: 'Overview' }));
    expect(handleTabChange).toHaveBeenCalledWith('life-analysis');

    handleTabChange.mockClear();
    // Clicking a product-only page without legacy equivalent should not invoke legacy setActiveTab
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Insights' }));
    fireEvent.click(within(desktopNavigation).getByRole('menuitem', { name: 'Career' }));
    expect(handleTabChange).not.toHaveBeenCalled();
  });

  it('keeps only one navigation dropdown open at a time', () => {
    render(
      <Header
        activePage="overview"
        onNavigate={vi.fn()}
        onOpenBirthForm={vi.fn()}
      />
    );

    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Chart' }));
    expect(screen.getByRole('menuitem', { name: 'Planets & Dignity' })).toBeInTheDocument();

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Insights' }));
    expect(screen.queryByRole('menuitem', { name: 'Planets & Dignity' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Career' })).toBeInTheDocument();
  });

  it('closes the open navigation menu on outside click', () => {
    render(
      <Header
        activePage="overview"
        onNavigate={vi.fn()}
        onOpenBirthForm={vi.fn()}
      />
    );

    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Chart' }));
    expect(screen.getByRole('menuitem', { name: 'Planets & Dignity' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menuitem', { name: 'Planets & Dignity' })).not.toBeInTheDocument();
  });

  it('closes the open navigation menu on Escape and restores focus to the group button', () => {
    render(
      <Header
        activePage="overview"
        onNavigate={vi.fn()}
        onOpenBirthForm={vi.fn()}
      />
    );

    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
    const chartButton = within(desktopNavigation).getByRole('button', { name: 'Chart' });
    fireEvent.click(chartButton);
    expect(screen.getByRole('menuitem', { name: 'Planets & Dignity' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: 'Planets & Dignity' })).not.toBeInTheDocument();
    expect(chartButton).toHaveFocus();
  });

  it('navigates directly for single-page groups without opening a menu', () => {
    const handleNavigate = vi.fn();
    render(
      <Header
        activePage="home"
        onNavigate={handleNavigate}
        onOpenBirthForm={vi.fn()}
      />
    );

    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Home' }));
    expect(handleNavigate).toHaveBeenCalledWith('home');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Report' }));
    expect(handleNavigate).toHaveBeenCalledWith('detailed');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('navigates and closes the menu when a dropdown item is clicked', () => {
    const handleNavigate = vi.fn();
    render(
      <Header
        activePage="overview"
        onNavigate={handleNavigate}
        onOpenBirthForm={vi.fn()}
      />
    );

    const desktopNavigation = screen.getAllByRole('navigation', { name: 'Product Views' })[1];
    fireEvent.click(within(desktopNavigation).getByRole('button', { name: 'Insights' }));
    fireEvent.click(within(desktopNavigation).getByRole('menuitem', { name: 'Career' }));

    expect(handleNavigate).toHaveBeenCalledWith('career');
    expect(screen.queryByRole('menuitem', { name: 'Wealth' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
