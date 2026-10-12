import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '../../../context/ThemeContext';

describe('ThemeToggle Design System Component', () => {
  it('renders theme toggle button with accessible label and toggles theme', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle showLabel />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to light theme/i });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
  });
});
