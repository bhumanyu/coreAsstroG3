import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Design System Component', () => {
  it('renders primary button with children and responds to click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Calculate Horoscope</Button>);

    const button = screen.getByRole('button', { name: 'Calculate Horoscope' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary, ghost, and danger variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost Action</Button>);
    expect(screen.getByRole('button', { name: 'Ghost Action' })).toBeInTheDocument();

    rerender(<Button variant="danger">Delete Profile</Button>);
    expect(screen.getByRole('button', { name: 'Delete Profile' })).toBeInTheDocument();
  });

  it('handles loading state with spinner and disables button', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Saving Chart
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Saving Chart' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navigate
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
