import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CareerPathwayComparisonSection } from './CareerPathwayComparisonSection';
import type { ProductCareerPathwayAnalysis } from '../../product/analysis/productAnalysisTypes';
import i18n from '../../i18n/i18n';

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
    otherCareerCandidateCount: 0,
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
    expect(within(region).getByText('Dual potential')).toBeInTheDocument();
    expect(within(region).getByText('employment-1 · Supported candidate')).toBeInTheDocument();
    expect(within(region).getByText('business-1 · Supported candidate')).toBeInTheDocument();
    expect(within(region).getByText(/not a recommendation/i)).toBeInTheDocument();
    expect(container).toHaveTextContent('Financial readiness: Not assessed');
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
    expect(within(region).getByText('Not identified')).toBeInTheDocument();
    expect(within(region).getByText(/absence is not evidence of unsuitability/i)).toBeInTheDocument();
  });

  it('does not infer pathway conclusions when B05 is unavailable', () => {
    render(<CareerPathwayComparisonSection />);
    expect(screen.getByText(/no canonical B02 outcome analysis is attached/i)).toBeInTheDocument();
    expect(screen.getByText(/No verdict is inferred from B04 profession families/)).toBeInTheDocument();
  });

  it.each(['PARTIAL', 'UNRESOLVED', 'INSUFFICIENT_DATA', 'UNAVAILABLE'] as const)(
    'shows incomplete assessment for NOT_IDENTIFIED modes when parent status is %s',
    status => {
      const base = makePathway();
      const pathway: ProductCareerPathwayAnalysis = {
        ...base,
        status,
        employment: { ...base.employment, status: 'NOT_IDENTIFIED', candidates: [], candidateCount: 0 },
        independent: { ...base.independent, status: 'NOT_IDENTIFIED', candidates: [], candidateCount: 0 }
      };
      render(<CareerPathwayComparisonSection pathwayPotential={pathway} />);
      expect(screen.getAllByText('Assessment incomplete')).toHaveLength(2);
      expect(screen.queryByText('Not identified')).not.toBeInTheDocument();
    }
  );

  it('keeps the ordinary NOT_IDENTIFIED label when parent status is AVAILABLE', () => {
    const base = makePathway();
    render(<CareerPathwayComparisonSection pathwayPotential={{
      ...base,
      employment: { ...base.employment, status: 'NOT_IDENTIFIED', candidates: [], candidateCount: 0 }
    }} />);
    expect(screen.getByText('Not identified')).toBeInTheDocument();
    expect(screen.queryByText('Assessment incomplete')).not.toBeInTheDocument();
  });

  it('does not replace supported or conditional mode labels when parent status is partial', () => {
    const base = makePathway();
    render(<CareerPathwayComparisonSection pathwayPotential={{
      ...base,
      status: 'PARTIAL',
      employment: { ...base.employment, status: 'SUPPORTED_CANDIDATE' },
      independent: { ...base.independent, status: 'CONDITIONAL_CANDIDATE' }
    }} />);
    expect(screen.getByText('Supported candidate')).toBeInTheDocument();
    expect(screen.getByText('Conditional candidate')).toBeInTheDocument();
    expect(screen.queryByText('Assessment incomplete')).not.toBeInTheDocument();
  });

  it('localizes known diagnostics and safely describes unknown ones without exposing codes', () => {
    const diagnostics = [
      'NATAL_PROMISE_NOT_ESTABLISHED',
      'DASHA_ACTIVATION_NOT_ESTABLISHED',
      'NO_LINKED_P2_09B_OUTCOME_CANDIDATE',
      'EMPLOYMENT_SERVICE_CANDIDATE_NOT_IDENTIFIED',
      'INDEPENDENT_BUSINESS_CANDIDATE_NOT_IDENTIFIED',
      'B02_OUTCOME_ANALYSIS_NOT_PROVIDED',
      'B02_OUTCOME_ANALYSIS_NOT_PROVIDED',
      'C11_FINAL_CONCLUSION_NOT_SUPPORTIVE',
      'P2_09B_CANDIDATE_NOT_PROMOTED_WITHOUT_BOTH_PROMISE_AND_ACTIVATION',
      'UNRECOGNIZED_INTERNAL_CODE',
      'UNRECOGNIZED_INTERNAL_CODE'
    ];
    const { container } = render(<CareerPathwayComparisonSection pathwayPotential={{
      ...makePathway(),
      diagnostics
    }} />);
    const list = screen.getByRole('list', { name: 'Pathway diagnostics' });
    expect(list).toHaveTextContent('A natal career promise has not been established.');
    expect(list).toHaveTextContent('A linked dasha activation has not been established.');
    expect(list).toHaveTextContent('No linked P2-09B outcome candidate is available.');
    expect(list).toHaveTextContent('No employment or service candidate was identified.');
    expect(list).toHaveTextContent('No independent or business candidate was identified.');
    expect(list).toHaveTextContent('The canonical B02 outcome analysis was not provided.');
    expect(list).toHaveTextContent('The final C11 conclusion does not support promoting this outcome candidate.');
    expect(list).toHaveTextContent('An outcome candidate was not promoted without both natal promise and linked activation.');
    expect(list).toHaveTextContent('A pathway diagnostic was reported but is not yet described.');
    expect(within(list).getAllByText('The canonical B02 outcome analysis was not provided.')).toHaveLength(1);
    expect(within(list).getAllByText('A pathway diagnostic was reported but is not yet described.')).toHaveLength(1);
    expect(container).not.toHaveTextContent('UNRECOGNIZED_INTERNAL_CODE');
  });

  it('renders only valid positive other-candidate counts', () => {
    const base = makePathway();
    const { rerender } = render(<CareerPathwayComparisonSection pathwayPotential={{
      ...base,
      otherCareerCandidateCount: 2,
      diagnostics: ['OTHER_CAREER_CANDIDATE_NOT_CLASSIFIED_TO_EITHER_MODE']
    }} />);
    expect(screen.getByText('Other career candidates not classified to either pathway: 2.')).toBeInTheDocument();
    expect(screen.getByText('Some career candidates are not classified to either pathway.')).toBeInTheDocument();
    rerender(<CareerPathwayComparisonSection pathwayPotential={{ ...base, otherCareerCandidateCount: 0.5 }} />);
    expect(screen.queryByText(/Other career candidates not classified/)).not.toBeInTheDocument();
  });

  it('renders legacy persisted pathway records without inventing an other-candidate count', () => {
    const { otherCareerCandidateCount: _count, ...legacyPathway } = makePathway();
    render(<CareerPathwayComparisonSection pathwayPotential={legacyPathway} />);
    expect(screen.queryByText(/Other career candidates not classified/)).not.toBeInTheDocument();
  });

  it('localizes pathway diagnostics in Hindi', async () => {
    await i18n.changeLanguage('hi');
    render(<CareerPathwayComparisonSection pathwayPotential={{
      ...makePathway(),
      diagnostics: ['B02_OUTCOME_ANALYSIS_NOT_PROVIDED', 'UNRECOGNIZED_INTERNAL_CODE']
    }} />);
    const diagnostics = screen.getByRole('list', { name: 'कार्य-पथ निदान' });
    expect(diagnostics).toHaveTextContent('प्रामाणिक B02 परिणाम विश्लेषण उपलब्ध नहीं कराया गया।');
    expect(diagnostics).toHaveTextContent('कार्य-पथ निदान दिया गया है, लेकिन उसका विवरण उपलब्ध नहीं है।');
    expect(diagnostics).not.toHaveTextContent('UNRECOGNIZED_INTERNAL_CODE');
  });
});
