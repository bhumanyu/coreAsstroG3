import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerEventTimelineSection } from './CareerEventTimelineSection';
import type { ProductCareerEventTimeline } from '../../product/analysis/productAnalysisTypes';

function timeline(overrides: Partial<ProductCareerEventTimeline> = {}): ProductCareerEventTimeline {
  return {
    reasoningVersion: 'B06',
    methodVersion: 'B06-EVENT-SPECIFIC-TIMELINE-v1',
    status: 'GENERIC_WINDOWS_ONLY',
    taxonomy: [{
      eventType: 'PROMOTION_ROLE_EXPANSION',
      validationStatus: 'UNVALIDATED',
      requiredEvidence: ['D1_NATAL_PROMISE', 'D10_SAME_EXPRESSION_QUALIFICATION'],
      validationGap: 'Leadership expression is not evidence of a promotion.',
      releaseEnabled: false
    }],
    eventCandidates: [],
    genericWindows: [{
      windowId: 'B06_GENERIC_WINDOW:event-1',
      sourceEventId: 'event-1',
      genericType: 'CAREER_OPPORTUNITY_WINDOW',
      status: 'GENERIC_CANDIDATE_WINDOW',
      specificEventInference: 'NOT_MADE',
      timing: { type: 'DASHA_PERIOD_WINDOW', start: '2027-01-01', end: '2027-12-31' },
      opportunityId: 'opportunity-1',
      activationId: 'activation-1',
      qualificationBasis: 'B02_NATAL_PROMISE_AND_LINKED_ACTIVATION',
      conditions: ['B02_CANDIDATE_OUTCOME_QUALIFIED'],
      counterEvidenceOccurrenceIds: ['counter-occ-1'],
      evidence: {
        semanticIdentityIds: ['natal-identity-1', 'activation-1'],
        occurrenceIds: ['natal-occ-1', 'dasha-occ-1'],
        rootIdentityKeys: ['natal-root-1'],
        ruleIds: ['P2-09B-EVT-01']
      },
      limitations: ['This is a generic candidate window, not a specific career event.']
    }],
    observedOutcomeReportIds: ['user-report-1'],
    diagnostics: ['EVENT_SPECIFIC_TAXONOMY_NOT_VALIDATED'],
    guaranteedEventsAvailable: false,
    numericProbabilityAvailable: false,
    statement: 'One generic window retained. No specific event inferred.',
    ...overrides
  };
}

describe('CareerEventTimelineSection', () => {
  it('labels generic windows as indicative candidates and displays event-specific validation gaps', () => {
    render(<CareerEventTimelineSection eventTimeline={timeline()} />);

    expect(screen.getByRole('heading', { name: 'Career Event Timeline' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Qualified generic career windows' })).toHaveTextContent('Career opportunity window');
    expect(screen.getByText(/Event-specific inference: NOT MADE/)).toBeInTheDocument();
    expect(screen.getByText(/Conditions: B02 CANDIDATE OUTCOME QUALIFIED/)).toBeInTheDocument();
    expect(screen.getByText(/Counter-evidence occurrences: counter-occ-1/)).toBeInTheDocument();
    expect(screen.getByText(/not a specific career event/i)).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Event-specific taxonomy validation status' })).toHaveTextContent('Promotion or role expansion');
    expect(screen.getByText('Leadership expression is not evidence of a promotion.')).toBeInTheDocument();
    expect(screen.getByText(
      /Event-specific predictions are disabled until each event type has its own validated natal and activation evidence rules/
    )).toBeInTheDocument();
  });

  it('does not fabricate observed outcomes when no B02 report references exist', () => {
    render(<CareerEventTimelineSection eventTimeline={timeline({ observedOutcomeReportIds: [] })} />);
    expect(screen.getByText(/No explicit B02 user-reported outcome references/)).toBeInTheDocument();
    expect(screen.queryByText('PROMOTION')).not.toBeInTheDocument();
  });

  it('shows an unavailable state without converting missing evidence into a negative prediction', () => {
    render(<CareerEventTimelineSection eventTimeline={timeline({
      status: 'UNAVAILABLE',
      genericWindows: [],
      statement: 'No natal-linked generic window is available.'
    })} />);
    expect(screen.getByText(/No generic window passed the B06 natal-linkage checks/)).toBeInTheDocument();
    expect(screen.getByText('No natal-linked generic window is available.')).toBeInTheDocument();
  });
});
