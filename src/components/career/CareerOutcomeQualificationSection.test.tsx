import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerOutcomeQualificationSection } from './CareerOutcomeQualificationSection';
import type { ProductCareerOutcomeAnalysis } from '../../product/analysis/productAnalysisTypes';

function analysis(overrides: Partial<ProductCareerOutcomeAnalysis> = {}): ProductCareerOutcomeAnalysis {
  return {
    reasoningVersion: 'B02',
    methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
    status: 'CANDIDATES_AVAILABLE',
    candidateOutcomes: [{
      candidateId: 'candidate-1',
      outcomeType: 'ROLE_OR_AUTHORITY_EXPANSION',
      status: 'CANDIDATE',
      qualification: 'CONDITIONALLY_SUPPORTED_CANDIDATE',
      qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION',
      sourceEventId: 'event-1',
      opportunityId: 'opportunity-1',
      activationId: 'activation-1',
      timing: { type: 'DASHA_PERIOD_WINDOW', start: '2026-01-01', end: '2026-12-31' },
      supportingEvidence: {
        natalPromiseOccurrenceIds: ['natal-occ-1'],
        activationOccurrenceIds: ['dasha-occ-1'],
        candidateEventEvidenceIds: ['natal-semantic-1', 'dasha-semantic-1'],
        ruleIds: ['B02-OUTCOME-QUALIFICATION-01']
      },
      executionConditions: {
        professionAnalysisStatus: 'PARTIAL',
        d10Qualification: 'PARTIAL',
        practicalExecution: 'NOT_ASSESSED',
        requiredChecks: ['SKILLS_AND_EXPERIENCE_FIT', 'REAL_WORLD_OPPORTUNITY', 'USER_ACTION_AND_EXECUTION', 'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS']
      },
      counterIndications: {
        severity: 'HIGH',
        evidenceOccurrenceIds: ['risk-occ-1'],
        conflicts: [{
          source: 'D10',
          direction: 'CHALLENGE',
          severity: 'HIGH',
          evidenceIdentityIds: ['d10-conflict-1']
        }]
      },
      guarantee: 'NONE'
    }],
    observedOutcomes: [],
    diagnostics: [],
    guaranteedOutcomeAvailable: false,
    numericProbabilityAvailable: false,
    statement: 'One candidate; practical execution is not assessed.',
    ...overrides
  };
}

describe('CareerOutcomeQualificationSection', () => {
  it('labels candidate windows as candidates and never as observed outcomes', () => {
    render(<CareerOutcomeQualificationSection outcomeQualification={analysis()} />);

    expect(screen.getByRole('heading', { name: 'Career Outcome Qualification' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Career outcome candidates' })).toHaveTextContent('ROLE OR AUTHORITY EXPANSION');
    expect(screen.getByText(/Candidate only · No guaranteed outcome/)).toBeInTheDocument();
    expect(screen.getByText('NOT_ASSESSED')).toBeInTheDocument();
    expect(screen.getByText('D10: CHALLENGE (HIGH)')).toBeInTheDocument();
    expect(screen.getByText(/Candidate windows are not recorded as observed events/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'User-reported observed career outcomes' })).not.toBeInTheDocument();
  });

  it('renders explicit user-reported outcomes in a separate section', () => {
    const value = analysis({
      observedOutcomes: [{
        reportId: 'report-1',
        outcomeType: 'PROMOTION',
        statement: 'User reported a promotion.',
        source: 'USER_REPORTED',
        occurredAt: '2025-07-01'
      }]
    });
    render(<CareerOutcomeQualificationSection outcomeQualification={value} />);

    const observed = screen.getByRole('list', { name: 'User-reported observed career outcomes' });
    expect(observed).toHaveTextContent('PROMOTION');
    expect(observed).toHaveTextContent('User reported a promotion.');
    expect(observed).toHaveTextContent('USER_REPORTED');
    expect(observed).not.toHaveTextContent('candidate-1');
  });

  it('renders an unresolved state without manufacturing candidate outcomes', () => {
    render(<CareerOutcomeQualificationSection outcomeQualification={analysis({
      status: 'UNRESOLVED',
      candidateOutcomes: [],
      statement: 'Required activation evidence is missing.'
    })} />);

    expect(screen.getByText(/No outcome candidate is qualified/)).toBeInTheDocument();
    expect(screen.getByText('Required activation evidence is missing.')).toBeInTheDocument();
  });
});
