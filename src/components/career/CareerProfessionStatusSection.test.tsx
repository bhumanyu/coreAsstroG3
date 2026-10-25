import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerProfessionStatusSection } from './CareerProfessionStatusSection';
import { getCareerProfessionStatusCopy, type CareerProfessionStatus } from '../../product/analysis/careerQualificationPresentation';
import { selectCareerViewModel } from '../../product/analysis/careerViewModel';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

const statuses: readonly CareerProfessionStatus[] = [
  'COMPLETE',
  'PARTIAL',
  'INSUFFICIENT_DATA'
];

describe('CareerProfessionStatusSection', () => {
  it.each(statuses)('renders %s alongside the unchanged machine status', (status) => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status,
      statusCopy: getCareerProfessionStatusCopy(status)
    };

    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByRole('heading', { name: 'Profession Analysis Status' })).toBeInTheDocument();
    expect(screen.getByText(status)).toBeInTheDocument();
    expect(screen.getByText(profession.statusCopy.label)).toBeInTheDocument();
    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
  });

  it('does not portray insufficient profession data as a negative career prediction', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'INSUFFICIENT_DATA' as const,
      missingInputs: ['career10HFoundation'],
      statusCopy: getCareerProfessionStatusCopy('INSUFFICIENT_DATA')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    const renderedText = screen.getByRole('region', {
      name: 'Profession Analysis Status'
    }).textContent?.toLowerCase() ?? '';
    expect(renderedText).not.toContain('no career promise');
    expect(renderedText).not.toContain('no career potential');
    expect(renderedText).toContain('not a negative career prediction');
    expect(renderedText).toContain('10th-house career foundation');
  });

  it('does not label a partial profession analysis as mixed or neutral', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      status: 'PARTIAL' as const,
      statusCopy: getCareerProfessionStatusCopy('PARTIAL')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText('PARTIAL')).toBeInTheDocument();
    expect(screen.getByText('Partial analysis')).toBeInTheDocument();
    expect(screen.queryByText(/mixed|neutral/i)).not.toBeInTheDocument();
  });

  it('shows only the generic explanation when there are no missing inputs', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      missingInputs: [],
      statusCopy: getCareerProfessionStatusCopy('INSUFFICIENT_DATA')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Missing profession analysis inputs' })).not.toBeInTheDocument();
    expect(screen.queryByText('Missing inputs')).not.toBeInTheDocument();
  });

  it('renders labels for each known missing input and preserves the generic explanation', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      missingInputs: [
        'career10HFoundation',
        'career10LFoundation',
        'careerD10CanonicalAnalysis',
        'domainEvidence'
      ],
      statusCopy: getCareerProfessionStatusCopy('PARTIAL')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByText(profession.statusCopy.explanation)).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Missing profession analysis inputs' });
    expect(list).toHaveTextContent('10th-house career foundation');
    expect(list).toHaveTextContent('10th-lord career foundation');
    expect(list).toHaveTextContent('Canonical D10 career analysis');
    expect(list).toHaveTextContent('Career domain evidence');
  });

  it('falls back to the raw key for an unmapped missing input', () => {
    const profession = {
      ...selectCareerViewModel(createProductAnalysis()).profession,
      missingInputs: ['futureEngineInput'],
      statusCopy: getCareerProfessionStatusCopy('PARTIAL')
    };
    render(<CareerProfessionStatusSection profession={profession} />);

    expect(screen.getByRole('list', { name: 'Missing profession analysis inputs' }))
      .toHaveTextContent('futureEngineInput');
  });
});
