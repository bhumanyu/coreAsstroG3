import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';

describe('Card Design System Component', () => {
  it('renders card with header, title, description, content, and footer', () => {
    render(
      <Card variant="glass" interactive>
        <CardHeader>
          <CardTitle>Planetary Strength</CardTitle>
          <CardDescription>Comprehensive Shadbala Breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Jupiter: Exalted in 4th House</p>
        </CardContent>
        <CardFooter>
          <span>Verified Engine Output</span>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Planetary Strength')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive Shadbala Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Jupiter: Exalted in 4th House')).toBeInTheDocument();
    expect(screen.getByText('Verified Engine Output')).toBeInTheDocument();
  });

  it('supports gradient and default variants', () => {
    const { container, rerender } = render(<Card variant="gradient">Gradient Card</Card>);
    expect(container.firstChild).toHaveClass('rounded-2xl');

    rerender(<Card variant="default">Default Card</Card>);
    expect(screen.getByText('Default Card')).toBeInTheDocument();
  });
});
