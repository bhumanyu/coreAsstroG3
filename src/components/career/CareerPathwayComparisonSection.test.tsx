import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CareerPathwayComparisonSection } from './CareerPathwayComparisonSection';
import type { ProductCareerPathwayAnalysis } from '../../product/analysis/productAnalysisTypes';

function makePathway(): ProductCareerPathwayAnalysis {
  const candidate = (candidateId: string, qualification: 'SUPPORTED_CANDIDATE' | 'CONDITIONALLY_SUPPORTED_CANDIDATE') => ({
    candidateId,
    qualification,
    sourceEventId: 'event-' + candidateId,
    opportunityId: 'opportunity-' + candidateId,
    activationId: 'activation-' + candidateId,
    timing: { type: 'UNTIMED' as const },
    supportingEvidenceOccurrenceIds: ['evidence-' + candidateId],
    ruleIds: ['rule-' + candidateId],
    counterEvidenceOccurrenceIds: [],
    counterIndicationSeverity: 'NONE' as const
  });
  return {
    reasoningVersion: 'B05',
    methodVersion: 'B05-DUAL-POTENTIAL-v1',
    sourceReasoningVersion: 'B02',
    sourceMethodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
    status: 'AVAILABLE',
    verdict: 'DUAL_POTENTIAL',
    employment: {
      mode: 'EMPLOYMENT_SERVICE',
      status: 'SUPPORTED_CANDIDATE',
      candidates: [candidate('employment-1', 'SUPPORTED_CANDIDATE')],
      candidateCount: 1,
      supportedCandidateCount: 1,
      conditionalCandidateCount: 0,
      supportingEvidenceOccurrenceIds: ['evidence-employment-1'],
      ruleIds: ['rule-employment-1'],
      counterEvidenceOccurrenceIds: [],
      practicalExecution: 'NOT_ASSESSED',
      financialReadiness: 'NOT_ASSESSED',
      personalPreference: 'NOT_ASSESSED'
    },
    independent: {
      mode: 'INDEPENDENT_BUSINESS',
      status: 'SUPPORTED_CANDIDATE',
      candidates: [candidate('business-1', 'SUPPORTED_CANDIDATE')],
      candidateCount: 1,
      supportedCandidateCount: 1,
      conditionalCandidateCount: 0,
      supportingEvidenceOccurrenceIds: ['evidence-business-1'],
      ruleIds: ['rule-business-1'],
      counterEvidenceOccurrenceIds: [],
      practicalExecution: 'NOT_ASSESSED',
      financialReadiness: 'NOT_ASSESSED',
      personalPreference: 'NOT_ASSESSED'
    },
    confidence: { status: 'NOT_ASSESSED', reason: 'No suitability score is defined.' },
    guaranteedOutcomeAvailable: false,
    numericProbabilityAvailable: false,
    suitabilityAvailable: false,
    diagnostics: [],
    statement: 'Both explicit B02 pathway candidate types are present.',
    limitations: ['This is not a suitability assessment.']
  };
}

describe('CareerPathwayComparisonSection', () => {
  it('renders the canonical B05 dual-potential verdict with both evidence trails', () => {
    const { container } = render(<CareerPathwayComparisonSection pathwayPotential={makePathway()} />);
    const region = screen.getByRole('region', { name: 'Corporate & Independent Pathways' });
    expect(within(region).getByText('DUAL_POTENTIAL')).toBeInTheDocument();
    expect(within(region).getByText('employment-1 · SUPPORTED CANDIDATE')).toBeInTheDocument();
    expect(within(region).getByText('business-1 · SUPPORTED CANDIDATE')).toBeInTheDocument();
    expect(within(region).getByText(/not a recommendation/i)).toBeInTheDocument();
    expect(container).toHaveTextContent('Financial readiness: NOT_ASSESSED');
  });

  it('keeps an absent pathway as NOT_IDENTIFIED rather than unsuitable', () => {
    const pathway = makePathway();
    const { view } = { view: pathway };
    const partial: ProductCareerPathwayAnalysis = {
      ...view,
      verdict: 'EMPLOYMENT_POTENTIAL_IDENTIFIED',
      status: 'AVAILABLE',
      independent: {
        ...view.independent,
        status: 'NOT_IDENTIFIED',
        candidates: [],
        candidateCount: 0,
        supportedCandidateCount: 0,
        conditionalCandidateCount: 0,
        supportingEvidenceOccurrenceIds: [],
        ruleIds: [],
        counterEvidenceOccurrenceIds: []
      },
      statement: 'Employment/service candidate evidence is present. An independent/business candidate is not identified; that absence is not evidence of unsuitability.'
    };
    render(<CareerPathwayComparisonSection pathwayPotential={partial} />);
    const region = screen.getByRole('region', { name: 'Corporate & Independent Pathways' });
    expect(within(region).getByText('NOT_IDENTIFIED')).toBeInTheDocument();
    expect(within(region).getByText(/absence is not evidence of unsuitability/i)).toBeInTheDocument();
  });

  it('does not infer pathway conclusions when B05 is unavailable', () => {
    render(<CareerPathwayComparisonSection />);
    expect(screen.getByText(/no canonical B02 outcome analysis is attached/i)).toBeInTheDocument();
    expect(screen.getByText(/No verdict is inferred from B04 profession families/)).toBeInTheDocument();
  });
});
