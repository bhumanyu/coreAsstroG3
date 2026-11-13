import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EvidenceConfidencePanel } from './EvidenceConfidencePanel';
import type { ProductEvidenceExperienceViewModel } from '../../product/analysis/productAnalysisTypes';

function model(overrides: Partial<ProductEvidenceExperienceViewModel> = {}): ProductEvidenceExperienceViewModel {
  return {
    domain: 'CAREER',
    confidence: 'LOW',
    confidenceLabel: 'Low confidence',
    promiseStrengthLabel: 'Strong',
    coverage: 'INSUFFICIENT',
    coverageLabel: 'Not enough evidence to assess',
    owner: 'C11',
    confidenceReasons: ['Some required evidence is not available.'],
    layers: [{
      id: 'NATAL_PROMISE', label: 'Natal foundation', state: 'AVAILABLE',
      stateLabel: 'Available', required: true
    }, {
      id: 'D10', label: 'D10 divisional confirmation', state: 'UNAVAILABLE',
      stateLabel: 'Unavailable', reason: 'D10 is not available.', required: false
    }],
    diagnostics: [{
      id: 'D10_MISSING', state: 'UNAVAILABLE', title: 'D10 divisional confirmation unavailable',
      message: 'D10 could not be assessed from the available validated inputs.',
      technicalCode: 'D10_MISSING'
    }],
    conflicts: [],
    evidence: [{
      id: 'occurrence-1', title: '10th lord placement',
      statement: 'The 10th lord occupies a supportive position.',
      direction: 'SUPPORT', role: 'PRIMARY', sourceLabel: 'Natal chart',
      ruleId: 'CAREER_RULE_10L_01',
      derivedFromIds: ['occurrence-2', 'missing-occurrence'],
      resolvedRelatedEvidence: [{ id: 'occurrence-2', title: 'Sun aspect' }],
      unresolvedRelatedCount: 1
    }],
    missingEvidenceCount: 1,
    ...overrides
  };
}

describe('EvidenceConfidencePanel (D03)', () => {
  it('distinguishes low confidence from promise strength and shows missing-layer reasons', () => {
    render(<EvidenceConfidencePanel model={model()} />);
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByText(/Strength describes the indication/)).toBeInTheDocument();
    expect(screen.getByText('D10 divisional confirmation unavailable')).toBeInTheDocument();
    expect(screen.getByText('D10 is not available.')).toBeInTheDocument();
  });

  it('shows conflicts and unresolved evidence references without creating broken links', () => {
    const source = model();
    render(<EvidenceConfidencePanel model={{
      ...source,
      evidence: source.evidence.map(item => ({ ...item, direction: 'MIXED' as const })),
      conflicts: source.evidence.map(item => ({ ...item, direction: 'MIXED' as const }))
    }} />);
    expect(screen.getByText('Conflicting or challenging evidence remains visible')).toBeInTheDocument();
    expect(screen.getByText('1 related reference(s) are not available in this evidence list.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sun aspect' })).toHaveAttribute('href', '#d03-evidence-occurrence-2');
    expect(screen.queryByRole('link', { name: 'missing-occurrence' })).not.toBeInTheDocument();
  });

  it('handles empty evidence without implying a negative result', () => {
    const source = model({ evidence: [], conflicts: [], missingEvidenceCount: 1 });
    render(<EvidenceConfidencePanel model={source} />);
    expect(screen.getByText(/No evidence occurrences are available/)).toBeInTheDocument();
    expect(screen.getByText(/not evidence of a negative outcome/)).toBeInTheDocument();
  });

  it('renders long evidence lists without truncating entries', () => {
    const source = model();
    const items = Array.from({ length: 40 }, (_, index) => ({
      ...source.evidence[0],
      id: `occurrence-${index}`,
      title: `Evidence item ${index}`,
      derivedFromIds: [],
      resolvedRelatedEvidence: [],
      unresolvedRelatedCount: 0
    }));
    render(<EvidenceConfidencePanel model={{ ...source, evidence: items, conflicts: [] }} />);
    expect(screen.getByText('Evidence item 0')).toBeInTheDocument();
    expect(screen.getByText('Evidence item 39')).toBeInTheDocument();
    expect(screen.getByText('40 available')).toBeInTheDocument();
  });

  it('provides semantic headings, a labelled region, and responsive content structure', () => {
    render(<EvidenceConfidencePanel model={model()} />);
    expect(screen.getByRole('region', { name: /Evidence, confidence & limitations/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evidence occurrences' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evidence coverage' })).toBeInTheDocument();
    expect(screen.getByText('Evidence occurrences').closest('section')).toHaveClass('space-y-5');
  });

  it('keeps technical identifiers behind a keyboard-operable disclosure', () => {
    render(<EvidenceConfidencePanel model={model()} />);
    const details = screen.getByText('Evidence provenance').closest('details');
    expect(details).not.toBeNull();
    expect(within(details as HTMLElement).getByText('CAREER_RULE_10L_01')).toBeInTheDocument();
    expect(screen.getByText('Technical detail').closest('details')).not.toBeNull();
  });
});
