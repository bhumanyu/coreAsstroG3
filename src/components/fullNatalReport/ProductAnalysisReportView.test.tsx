import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ProductAnalysisReportView } from './ProductAnalysisReportView';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

describe('ProductAnalysisReportView', () => {
  it('renders canonical Career, Wealth, Dasha and provenance sections', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      wealth: {
        ...base.wealth,
        d2: {
          relationship: 'UNAVAILABLE' as const,
          statement: 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.'
        }
      }
    };

    render(<ProductAnalysisReportView analysis={analysis} />);

    expect(screen.getByRole('heading', { name: 'Career & Wealth Analysis' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Career — C11 conclusion' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'User-supplied financial facts — C01' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Vimshottari Dasha and selected period' })).toBeInTheDocument();
    expect(screen.getByText('C11 confidence')).toBeInTheDocument();
    expect(screen.getByText('CW-05 confidence')).toBeInTheDocument();
    expect(screen.getByText(/Event-specific forecasts remain unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/D2 and unvalidated lifecycle event rules remain unavailable/)).toBeInTheDocument();
  });

  it('shows unavailable when no canonical ProductAnalysis is attached', () => {
    render(<ProductAnalysisReportView />);
    const report = screen.getByRole('region', { name: 'Career and Wealth product report' });
    expect(within(report).getByText(/UNAVAILABLE — no canonical ProductAnalysis snapshot/)).toBeInTheDocument();
  });

  it('preserves partial and unavailable domain states instead of promoting them to complete', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      status: 'PARTIAL' as const,
      career: { ...base.career, status: 'UNAVAILABLE' },
      wealth: { ...base.wealth, overall: { ...base.wealth.overall, status: 'PARTIAL' } }
    };

    render(<ProductAnalysisReportView analysis={analysis} />);
    expect(screen.getByRole('region', { name: 'Career — C11 conclusion' })).toHaveTextContent('UNAVAILABLE');
    expect(screen.getByRole('region', { name: 'Wealth — CW-05 conclusion' })).toHaveTextContent('PARTIAL');
  });
});
