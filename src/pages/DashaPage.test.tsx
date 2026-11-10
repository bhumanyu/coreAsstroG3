import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashaPage } from './DashaPage';
import { createProductAnalysis } from '../product/analysis/__tests__/testHelpers';

describe('DashaPage projection diagnostics', () => {
  it('shows a user-visible warning when the optional timing projection fails', () => {
    render(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }}
        dashaTimingProjectionError="Dasha projection failed"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Dasha timing detail could not be prepared');
    expect(screen.getByRole('alert')).toHaveTextContent('Dasha projection failed');
    expect(screen.getByRole('alert')).toHaveTextContent('canonical chart analysis remains available');
  });
});
