import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import i18n from '../../i18n/i18n';
import { CareerPage } from '../CareerPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import type { CareerOutcomeAnalysis } from '../../domain/career/careerOutcomeQualification/careerOutcomeTypes';
import { analyzeCareerPathways } from '../../domain/career/careerPathway';

describe('CareerPage (P-UI-04)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('1. Loading state: renders CareerLoadingState when status is LOADING', () => {
    render(
      <CareerPage
        productAnalysisState={{
          status: 'LOADING'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Vocational Trajectory')).toBeInTheDocument();
  });

  it('2. Unavailable state: renders CareerUnavailableState when analysis is absent', () => {
    render(
      <CareerPage
        productAnalysisState={{
          status: 'READY',
          analysis: undefined
        }}
      />
    );

    expect(screen.getByText('Career Analysis Unavailable')).toBeInTheDocument();
  });

  it('3. Error state: renders CareerErrorState with error message and handles retry', () => {
    const onRetry = vi.fn();
    render(
      <CareerPage
        productAnalysisState={{
          status: 'ERROR',
          error: 'Calculation engine failed'
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Career Analysis Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Calculation engine failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('4. Rendered sections: renders all sections from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <CareerPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // D03 evidence, confidence and diagnostic experience
    expect(screen.getByRole('heading', { name: 'Evidence, confidence & limitations' })).toBeInTheDocument();
    expect(screen.getByText(/Evidence confidence/)).toBeInTheDocument();
    expect(screen.getByText('D10 divisional confirmation')).toBeInTheDocument();

    // Hero
    expect(screen.getByText('Career & Professional Trajectory')).toBeInTheDocument();
    expect(screen.getAllByText('Capricorn').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Leo')).toBeInTheDocument();

    // Natal Promise
    expect(screen.getByText('Natal Vocational Promise')).toBeInTheDocument();
    expect(screen.getByText('Executive Trajectory')).toBeInTheDocument();
    expect(
      screen.getByText('High vocational promise across 10th lord and Lagna.')
    ).toBeInTheDocument();

    // Expression & Style
    expect(screen.getByText('Vocational Expression & Working Style')).toBeInTheDocument();
    expect(screen.getByText('Strategic Leadership')).toBeInTheDocument();

    // D10 Varga Alignment
    expect(screen.getByText('Dasamsa (D10) Divisional Alignment')).toBeInTheDocument();
    expect(screen.getByText('Confirms')).toBeInTheDocument();

    // Timing & Dasha Hierarchy: individual planet names and role labels
    expect(screen.getByText('Career Timing & Vimshottari Dasha Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getAllByText('Primary Driver').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Modifier').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Refinement')).toBeInTheDocument();

    // Transits
    expect(screen.getByText('Planetary Transits (Gochara)')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();

    // Qualifications
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('COMBUSTION')).toBeInTheDocument();

    // Profession analysis status is distinct from pattern qualification.
    expect(screen.getByRole('heading', { name: 'Profession Analysis Status' })).toBeInTheDocument();
    expect(screen.getAllByText('Insufficient data').length).toBeGreaterThan(0);
    expect(screen.getByText(/profession analysis could not be completed.*not a negative career prediction/i)).toBeInTheDocument();

    // Evidence
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();

    // Integrated Conclusion
    expect(screen.getByText('Integrated Vocational Synthesis')).toBeInTheDocument();
  });

  it('4A. Outcome qualification: renders candidate windows and separate observed facts when supplied', () => {
    const analysis = {
      ...createProductAnalysis(),
      career: {
        ...createProductAnalysis().career,
        outcomeQualification: {
          reasoningVersion: 'B02' as const,
          methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
          status: 'CONDITIONAL' as const,
          candidateOutcomes: [],
          observedOutcomes: [{
            reportId: 'career-report-1',
            outcomeType: 'PROMOTION' as const,
            statement: 'User reported a promotion.',
            source: 'USER_REPORTED' as const,
            occurredAt: '2025-07-01'
          }],
          diagnostics: [],
          guaranteedOutcomeAvailable: false as const,
          numericProbabilityAvailable: false as const,
          statement: 'Outcome qualification remains conditional.'
        }
      }
    };
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis }} />);

    expect(screen.getByRole('heading', { name: 'Career Outcome Qualification' })).toBeInTheDocument();
    expect(screen.getByText('Outcome qualification remains conditional.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'User-reported observed career outcomes' })).toHaveTextContent('User reported a promotion.');
    expect(screen.getByText(/No outcome candidate is qualified/)).toBeInTheDocument();
  });

  it('4B. B06 timeline: renders generic windows and keeps specific taxonomy gated', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      career: {
        ...base.career,
        eventTimeline: {
          reasoningVersion: 'B06' as const,
          methodVersion: 'B06-EVENT-SPECIFIC-TIMELINE-v1',
          status: 'GENERIC_WINDOWS_ONLY' as const,
          taxonomy: [{
            eventType: 'PROMOTION_ROLE_EXPANSION' as const,
            validationStatus: 'UNVALIDATED' as const,
            requiredEvidence: ['D1_NATAL_PROMISE', 'D10_SAME_EXPRESSION_QUALIFICATION'],
            validationGap: 'Authority expression does not prove a promotion.',
            releaseEnabled: false as const
          }],
          eventCandidates: [],
          genericWindows: [{
            windowId: 'B06_GENERIC_WINDOW:event-1',
            sourceEventId: 'event-1',
            genericType: 'CAREER_OPPORTUNITY_WINDOW' as const,
            status: 'GENERIC_CANDIDATE_WINDOW' as const,
            specificEventInference: 'NOT_MADE' as const,
            timing: { type: 'DASHA_PERIOD_WINDOW' as const, start: '2027-01-01', end: '2027-12-31' },
            opportunityId: 'opportunity-1',
            activationId: 'activation-1',
            qualificationBasis: 'B02_NATAL_PROMISE_AND_LINKED_ACTIVATION' as const,
            conditions: ['B02_CANDIDATE_OUTCOME_QUALIFIED'],
            counterEvidenceOccurrenceIds: [],
            evidence: {
              semanticIdentityIds: ['natal-identity-1', 'activation-1'],
              occurrenceIds: ['natal-occ-1', 'dasha-occ-1'],
              rootIdentityKeys: ['natal-root-1'],
              ruleIds: ['P2-09B-EVT-01']
            },
            limitations: ['This is a generic candidate window, not a specific career event.']
          }],
          observedOutcomeReportIds: [],
          diagnostics: ['EVENT_SPECIFIC_TAXONOMY_NOT_VALIDATED'],
          guaranteedEventsAvailable: false as const,
          numericProbabilityAvailable: false as const,
          statement: 'One generic window retained. No specific event inferred.'
        }
      }
    };
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis }} />);

    expect(screen.getByRole('heading', { name: 'Career Event Timeline' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Qualified generic career windows' })).toHaveTextContent('Career opportunity window');
    expect(screen.getByRole('list', { name: 'Event-specific taxonomy validation status' })).toHaveTextContent('Promotion or role expansion');
    expect(screen.getByText(/No explicit B02 user-reported outcome references/)).toBeInTheDocument();
  });

  it('D05: renders the ten-step guided journey and anchors each step to canonical sections', () => {
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis: createProductAnalysis() }} />);
    const journey = screen.getByRole('navigation', { name: 'Guided career journey' });
    expect(within(journey).getAllByRole('link')).toHaveLength(10);
    expect(within(journey).getByRole('link', { name: /Natal promise/ })).toHaveAttribute('href', '#career-promise');
    expect(within(journey).getByRole('link', { name: /Candidate timeline/ })).toHaveAttribute('href', '#career-events');
    expect(screen.getByRole('region', { name: 'Career overview' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Career evidence and confidence' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Career Sustainability, Risk & Timing Context' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Corporate & Independent Pathways' })).toBeInTheDocument();
  });

  it('D05: missing Dasha, partial D10 and absent event timeline remain explicit', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      career: {
        ...base.career,
        d10: { relationship: 'UNAVAILABLE' as const, statement: 'Partial D10 inputs are unavailable.' },
        activation: {
          ...base.career.activation,
          dasha: { status: 'UNAVAILABLE' as const, periods: [] }
        },
        eventTimeline: undefined
      }
    };
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis }} />);
    const journey = screen.getByRole('navigation', { name: 'Guided career journey' });
    expect(within(journey).getByRole('link', { name: /D10 qualification/ })).toHaveTextContent('Unavailable');
    expect(within(journey).getByRole('link', { name: /Activation & timing/ })).toHaveTextContent('Unavailable');
    expect(screen.getByText('B06 event timeline is unavailable. No event window is inferred by the page.')).toBeInTheDocument();
    expect(screen.getByText(/Vimshottari dasha timing calculations are currently unavailable/)).toBeInTheDocument();
  });

  it('B05: dual pathway verdict is based on explicit canonical B02 candidates', () => {
    const base = createProductAnalysis();
    const outcomeQualification = {
      reasoningVersion: 'B02' as const,
      methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
      status: 'CANDIDATES_AVAILABLE' as const,
      candidateOutcomes: [
        {
          candidateId: 'employment-candidate',
          outcomeType: 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY' as const,
          status: 'CANDIDATE' as const,
          qualification: 'SUPPORTED_CANDIDATE' as const,
          qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION' as const,
          sourceEventId: 'event-employment',
          opportunityId: 'opp-employment',
          activationId: 'activation-employment',
          timing: { type: 'UNTIMED' as const },
          supportingEvidence: { natalPromiseOccurrenceIds: ['natal-employment'], activationOccurrenceIds: ['activation-employment'], candidateEventEvidenceIds: [], ruleIds: ['rule-employment'] },
          executionConditions: { professionAnalysisStatus: 'PARTIAL' as const, d10Qualification: 'UNAVAILABLE' as const, practicalExecution: 'NOT_ASSESSED' as const, requiredChecks: ['SKILLS_AND_EXPERIENCE_FIT', 'REAL_WORLD_OPPORTUNITY', 'USER_ACTION_AND_EXECUTION', 'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'] as const },
          counterIndications: { severity: 'NONE' as const, evidenceOccurrenceIds: [], conflicts: [] },
          guarantee: 'NONE' as const
        },
        {
          candidateId: 'business-candidate',
          outcomeType: 'INDEPENDENT_OR_BUSINESS_ACTIVITY' as const,
          status: 'CANDIDATE' as const,
          qualification: 'CONDITIONALLY_SUPPORTED_CANDIDATE' as const,
          qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION' as const,
          sourceEventId: 'event-business',
          opportunityId: 'opp-business',
          activationId: 'activation-business',
          timing: { type: 'UNTIMED' as const },
          supportingEvidence: { natalPromiseOccurrenceIds: ['natal-business'], activationOccurrenceIds: ['activation-business'], candidateEventEvidenceIds: [], ruleIds: ['rule-business'] },
          executionConditions: { professionAnalysisStatus: 'PARTIAL' as const, d10Qualification: 'PARTIAL' as const, practicalExecution: 'NOT_ASSESSED' as const, requiredChecks: ['SKILLS_AND_EXPERIENCE_FIT', 'REAL_WORLD_OPPORTUNITY', 'USER_ACTION_AND_EXECUTION', 'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'] as const },
          counterIndications: { severity: 'NONE' as const, evidenceOccurrenceIds: [], conflicts: [] },
          guarantee: 'NONE' as const
        }
      ],
      observedOutcomes: [],
      diagnostics: [],
      guaranteedOutcomeAvailable: false as const,
      numericProbabilityAvailable: false as const,
      statement: 'Both pathway types are candidates only.'
    } as CareerOutcomeAnalysis;
    const pathwayPotential = analyzeCareerPathways({ outcomeAnalysis: outcomeQualification });
    const analysis = {
      ...base,
      career: { ...base.career, outcomeQualification, pathwayPotential }
    };

    render(<CareerPage productAnalysisState={{ status: 'READY', analysis }} />);
    const comparison = screen.getByRole('region', { name: 'Corporate & Independent Pathways' });
    expect(within(comparison).getByText('Conditional dual potential')).toBeInTheDocument();
    expect(within(comparison).getByText('employment-candidate · Supported candidate')).toBeInTheDocument();
    expect(within(comparison).getByText('business-candidate · Conditionally supported candidate')).toBeInTheDocument();
    expect(within(comparison).getByText(/not a suitability verdict or recommendation/i)).toBeInTheDocument();
  });

  it('D05: no timeline candidates remain unavailable rather than inferred from Dasha alone', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      career: {
        ...base.career,
        eventTimeline: {
          reasoningVersion: 'B06' as const,
          methodVersion: 'B06-test',
          status: 'UNAVAILABLE' as const,
          taxonomy: [],
          eventCandidates: [],
          genericWindows: [],
          observedOutcomeReportIds: [],
          diagnostics: ['NO_LINKED_EVENT_EVIDENCE'],
          guaranteedEventsAvailable: false as const,
          numericProbabilityAvailable: false as const,
          statement: 'No event-specific or generic window is qualified.'
        }
      }
    };
    render(<CareerPage productAnalysisState={{ status: 'READY', analysis }} />);
    expect(screen.getByText(/No event-specific or generic window is qualified/)).toBeInTheDocument();
    expect(screen.getByText(/No generic window passed the B06 natal-linkage checks/)).toBeInTheDocument();
    expect(screen.getByText(/These windows are indicative candidates, never guarantees/i)).toBeInTheDocument();
  });

  it('5. Navigation to reasoning: invokes onNavigate with reasoning', () => {
    const onNavigate = vi.fn();
    const analysis = createProductAnalysis();
    render(
      <CareerPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        onNavigate={onNavigate}
      />
    );

    const exploreBtn = screen.getByRole('button', { name: /explore reasoning graph/i });
    fireEvent.click(exploreBtn);
    expect(onNavigate).toHaveBeenCalledWith('reasoning');

    const traceBtn = screen.getByRole('button', { name: /trace full evidential reasoning/i });
    fireEvent.click(traceBtn);
    expect(onNavigate).toHaveBeenCalledWith('reasoning');
  });
});
