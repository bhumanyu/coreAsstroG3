import { describe, expect, it } from 'vitest';
import { buildCareerEventTimeline, CAREER_EVENT_SPECIFIC_RULE_CATALOGUE } from './careerEventTimelineEngine';
import type {
  CareerEventTimelineInput
} from './careerEventTimelineTypes';
import type { CareerAnalyticalAxes } from '../careerFinalSynthesis/careerAnalyticalAxes';
import type { CareerFinalSynthesisResult } from '../careerFinalSynthesis/careerFinalSynthesisTypes';
import type { CareerEventsAnalysis, CareerEvent } from '../careerEvents/careerEventTypes';
import type { CareerTrajectoryAnalysis } from '../careerTrajectory/careerTrajectoryTypes';
import type { CareerDashaCanonicalAnalysis } from '../careerDasha/careerDashaCanonicalTypes';
import type { CareerOutcomeAnalysis } from '../careerOutcomeQualification/careerOutcomeTypes';

function opportunityEvent(eventId = 'event-opportunity', activationId = 'activation-support-1'): CareerEvent {
  return {
    eventId,
    eventType: 'CAREER_OPPORTUNITY_WINDOW',
    status: 'CANDIDATE',
    timing: { type: 'DASHA_PERIOD_WINDOW', start: '2027-01-01', end: '2027-12-31' },
    evidenceIds: ['natal-identity-1', activationId],
    ruleIds: ['P2-09B-EVT-01'],
    statement: 'Generic opportunity candidate window.',
    opportunityId: 'opportunity-1',
    activationId
  };
}

function challengeEvent(eventId = 'event-challenge', activationId = 'activation-challenge-1'): CareerEvent {
  return {
    eventId,
    eventType: 'CAREER_CHALLENGE_WINDOW',
    status: 'CANDIDATE',
    timing: { type: 'DASHA_PERIOD_WINDOW', start: '2028-01-01', end: '2028-06-30' },
    evidenceIds: [activationId],
    ruleIds: ['P2-09B-EVT-02'],
    statement: 'Generic challenge candidate window.',
    opportunityId: null,
    activationId
  };
}

function makeAxes(overrides: {
  activationConflicts?: string[];
  riskSupport?: string[];
  riskConflicts?: string[];
} = {}): CareerAnalyticalAxes {
  return {
    version: 'B01-AXIS-PROJECTION-v1',
    promise: {
      axis: 'PROMISE', status: 'AVAILABLE', result: { direction: 'SUPPORT', strength: 'STRONG' },
      supportingEvidenceOccurrenceIds: ['natal-occ-1'], conflictingEvidenceOccurrenceIds: [],
      ruleIds: [], coverage: { status: 'COMPLETE', availableSources: ['C4_C7_NATAL'], missingSources: [], evidenceOccurrenceCount: 1 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' }, methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    activation: {
      axis: 'ACTIVATION', status: 'AVAILABLE', result: { direction: 'SUPPORT', effect: 'ACTIVATES', strength: 'STRONG', dominantLevel: 'MD' },
      supportingEvidenceOccurrenceIds: ['dasha-occ-support'], conflictingEvidenceOccurrenceIds: overrides.activationConflicts ?? [],
      ruleIds: [], coverage: { status: 'COMPLETE', availableSources: ['C9_DASHA_EVIDENCE'], missingSources: [], evidenceOccurrenceCount: 1 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' }, methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    sustainability: {
      axis: 'SUSTAINABILITY', status: 'UNAVAILABLE', result: { assessment: 'NOT_ASSESSED', requiredEvidenceFamily: 'CAREER_SUSTAINABILITY' },
      supportingEvidenceOccurrenceIds: [], conflictingEvidenceOccurrenceIds: [], ruleIds: [],
      coverage: { status: 'INSUFFICIENT', availableSources: [], missingSources: ['CAREER_SUSTAINABILITY'], evidenceOccurrenceCount: 0 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' }, methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    risk: {
      axis: 'RISK', status: 'AVAILABLE', result: { assessment: 'ADVERSE_EVIDENCE_PRESENT', conflictCount: 1, nonActivationOccurrences: [] },
      supportingEvidenceOccurrenceIds: overrides.riskSupport ?? [], conflictingEvidenceOccurrenceIds: overrides.riskConflicts ?? [],
      ruleIds: [], coverage: { status: 'COMPLETE', availableSources: ['C4_C7_NATAL', 'C9_DASHA'], missingSources: [], evidenceOccurrenceCount: 1 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' }, methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    timing: {
      axis: 'TIMING', status: 'AVAILABLE', result: { candidateWindows: [], untimedLevels: [], guarantee: 'NONE' },
      supportingEvidenceOccurrenceIds: [], conflictingEvidenceOccurrenceIds: [], ruleIds: [],
      coverage: { status: 'COMPLETE', availableSources: ['C9_DASHA'], missingSources: [], evidenceOccurrenceCount: 1 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' }, methodVersion: 'B01-AXIS-PROJECTION-v1'
    }
  } as CareerAnalyticalAxes;
}

function makeDasha(evidence: readonly Record<string, unknown>[]): CareerDashaCanonicalAnalysis {
  return { evidence } as unknown as CareerDashaCanonicalAnalysis;
}

function activationEvidence(
  identityKey: string,
  id: string,
  effect: 'ACTIVATES' | 'CHALLENGES',
  direction: 'SUPPORT' | 'CHALLENGE',
  natalRootIds: string[] = ['natal-identity-1']
): Record<string, unknown> {
  return {
    identityKey,
    id,
    level: 'MD',
    role: 'PRIMARY_DRIVER',
    effect,
    direction,
    strength: 'STRONG',
    statement: 'Canonical C9 test evidence.',
    sourceIds: ['source-' + id],
    provenance: { source: 'C9_DASHA', activationLevel: 'MD', natalRootIds }
  };
}

function makeOutcomeCandidate(event: CareerEvent): Record<string, unknown> {
  return {
    candidateId: 'b02-' + event.eventId,
    outcomeType: 'GENERAL_CAREER_OPPORTUNITY',
    status: 'CANDIDATE',
    qualification: 'SUPPORTED_CANDIDATE',
    qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION',
    sourceEventId: event.eventId,
    opportunityId: event.opportunityId,
    activationId: event.activationId,
    timing: event.timing,
    supportingEvidence: {
      natalPromiseOccurrenceIds: ['natal-occ-1'],
      activationOccurrenceIds: ['dasha-occ-support'],
      candidateEventEvidenceIds: [...event.evidenceIds],
      ruleIds: [...event.ruleIds]
    },
    executionConditions: {
      professionAnalysisStatus: 'COMPLETE',
      d10Qualification: 'QUALIFIED',
      practicalExecution: 'NOT_ASSESSED',
      requiredChecks: ['SKILLS_AND_EXPERIENCE_FIT', 'REAL_WORLD_OPPORTUNITY', 'USER_ACTION_AND_EXECUTION', 'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS']
    },
    counterIndications: { severity: 'LOW', evidenceOccurrenceIds: ['counter-occ-1'], conflicts: [] },
    guarantee: 'NONE'
  };
}

function makeInput(params: {
  events?: readonly CareerEvent[];
  dashaEvidence?: readonly Record<string, unknown>[];
  outcomeCandidates?: readonly Record<string, unknown>[];
  observedOutcomes?: readonly Record<string, unknown>[];
  axes?: CareerAnalyticalAxes;
  conflicts?: readonly Record<string, unknown>[];
} = {}): CareerEventTimelineInput {
  const events = params.events ?? [opportunityEvent()];
  return {
    axes: params.axes ?? makeAxes(),
    finalSynthesis: {
      reasoningVersion: 'C11',
      domain: 'CAREER',
      finalStatus: 'SUPPORTED',
      finalDirection: 'SUPPORT',
      evidenceIds: ['natal-identity-1'],
      conflicts: params.conflicts ?? [],
      natalDirection: 'SUPPORT'
    } as unknown as CareerFinalSynthesisResult,
    trajectory: {
      reasoningVersion: 'P2-09A',
      domain: 'CAREER',
      opportunities: [{
        mode: 'MANAGEMENT', direction: 'SUPPORT', strength: 'STRONG', qualified: true,
        evidenceIds: ['natal-identity-1'], opportunityId: 'opportunity-1'
      }]
    } as unknown as CareerTrajectoryAnalysis,
    events: {
      reasoningVersion: 'P2-09B',
      domain: 'CAREER',
      guaranteedEventsAvailable: false,
      events,
      evidenceIds: events.flatMap(event => event.evidenceIds),
      statement: 'fixture'
    } as CareerEventsAnalysis,
    dasha: makeDasha(params.dashaEvidence ?? [
      activationEvidence('activation-support-1', 'dasha-occ-support', 'ACTIVATES', 'SUPPORT')
    ]),
    outcomeAnalysis: {
      reasoningVersion: 'B02',
      methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
      status: 'CANDIDATES_AVAILABLE',
      candidateOutcomes: params.outcomeCandidates ?? events
        .filter(event => event.eventType === 'CAREER_OPPORTUNITY_WINDOW' || event.eventType === 'CAREER_CONDITIONAL_WINDOW')
        .map(makeOutcomeCandidate),
      observedOutcomes: params.observedOutcomes ?? [],
      diagnostics: [],
      guaranteedOutcomeAvailable: false,
      numericProbabilityAvailable: false,
      statement: 'B02 fixture'
    } as unknown as CareerOutcomeAnalysis
  };
}

describe('B06 Career Event-Specific Timeline', () => {
  it('retains an opportunity as a generic window only when B02 confirms natal promise and linked activation', () => {
    const event = opportunityEvent();
    const result = buildCareerEventTimeline(makeInput({ events: [event] }));

    expect(result.status).toBe('GENERIC_WINDOWS_ONLY');
    expect(result.genericWindows).toHaveLength(1);
    expect(result.genericWindows[0].sourceEventId).toBe(event.eventId);
    expect(result.genericWindows[0].specificEventInference).toBe('NOT_MADE');
    expect(result.genericWindows[0].qualificationBasis).toBe('B02_NATAL_PROMISE_AND_LINKED_ACTIVATION');
    expect(result.genericWindows[0].conditions).toContain('B02_CANDIDATE_OUTCOME_QUALIFIED');
    expect(result.genericWindows[0].counterEvidenceOccurrenceIds).toEqual(['counter-occ-1']);
    expect(result.eventCandidates).toEqual([]);
  });

  it('does not emit or retain an opportunity from Dasha activation without B02 natal promise qualification', () => {
    const event = opportunityEvent();
    const result = buildCareerEventTimeline(makeInput({ events: [event], outcomeCandidates: [] }));

    expect(result.genericWindows).toEqual([]);
    expect(result.status).toBe('PARTIAL');
    expect(result.diagnostics).toContain('NO_NATAL_LINKED_GENERIC_WINDOWS_AVAILABLE');
  });

  it('does not treat natal promise without linked activation as a timeline window', () => {
    const event = opportunityEvent();
    const result = buildCareerEventTimeline(makeInput({
      events: [event],
      dashaEvidence: [],
      outcomeCandidates: []
    }));

    expect(result.genericWindows).toEqual([]);
    expect(result.eventCandidates).toEqual([]);
  });

  it('suppresses a Dasha challenge when no matching natal C11 counter-indication is linked', () => {
    const event = challengeEvent();
    const result = buildCareerEventTimeline(makeInput({
      events: [event],
      dashaEvidence: [activationEvidence('activation-challenge-1', 'dasha-occ-challenge', 'CHALLENGES', 'CHALLENGE')],
      axes: makeAxes({ activationConflicts: ['dasha-occ-challenge'], riskSupport: ['dasha-occ-challenge'] })
    }));

    expect(result.genericWindows).toEqual([]);
    expect(result.diagnostics).toContain('UNLINKED_OR_UNQUALIFIED_GENERIC_WINDOWS_SUPPRESSED');
  });

  it('retains a generic challenge window only with linked C11 natal counter-evidence and B01 risk/activation provenance', () => {
    const event = challengeEvent();
    const result = buildCareerEventTimeline(makeInput({
      events: [event],
      dashaEvidence: [activationEvidence('activation-challenge-1', 'dasha-occ-challenge', 'CHALLENGES', 'CHALLENGE', ['natal-risk-identity'])],
      axes: makeAxes({ activationConflicts: ['dasha-occ-challenge'], riskSupport: ['dasha-occ-challenge'], riskConflicts: ['dasha-risk-counter'] }),
      conflicts: [{
        source: 'NATAL', direction: 'CHALLENGE', severity: 'HIGH',
        evidenceIds: ['natal-risk-identity'], statement: 'Natal counter-indication fixture.'
      }]
    }));

    expect(result.genericWindows).toHaveLength(1);
    expect(result.genericWindows[0].genericType).toBe('CAREER_CHALLENGE_WINDOW');
    expect(result.genericWindows[0].qualificationBasis).toBe('B01_NATAL_RISK_AND_LINKED_CHALLENGE_ACTIVATION');
    expect(result.genericWindows[0].evidence.rootIdentityKeys).toEqual(['natal-risk-identity']);
    expect(result.genericWindows[0].conditions).toContain('C9_CHALLENGE_ACTIVATION_RESOLVED');
    expect(result.genericWindows[0].counterEvidenceOccurrenceIds).toEqual(['dasha-risk-counter']);
    expect(result.eventCandidates).toEqual([]);
  });

  it('suppresses challenge windows when canonical Dasha activation evidence is missing', () => {
    const event = challengeEvent();
    const result = buildCareerEventTimeline(makeInput({
      events: [event],
      dashaEvidence: [],
      axes: makeAxes({ activationConflicts: ['dasha-occ-challenge'], riskSupport: ['dasha-occ-challenge'] }),
      conflicts: [{ source: 'NATAL', direction: 'CHALLENGE', severity: 'HIGH', evidenceIds: ['natal-risk-identity'], statement: 'fixture' }]
    }));

    expect(result.genericWindows).toEqual([]);
  });

  it('C11 semantic identity: preserves distinct source windows sharing the same evidence identities', () => {
    const first = opportunityEvent('event-overlap-1');
    const second = { ...opportunityEvent('event-overlap-2'), timing: { type: 'DASHA_PERIOD_WINDOW' as const, start: '2027-06-01', end: '2028-03-01' } };
    const result = buildCareerEventTimeline(makeInput({ events: [first, second] }));

    expect(result.genericWindows).toHaveLength(2);
    expect(new Set(result.genericWindows.map(item => item.windowId)).size).toBe(2);
    expect(result.genericWindows[0].evidence.semanticIdentityIds)
      .toEqual(result.genericWindows[1].evidence.semanticIdentityIds);
    expect(result.genericWindows.map(item => item.timing.start)).toEqual(['2027-01-01', '2027-06-01']);
  });

  it('retains the proposed taxonomy as unvalidated and emits no unsupported specific event type', () => {
    const result = buildCareerEventTimeline(makeInput());

    expect(CAREER_EVENT_SPECIFIC_RULE_CATALOGUE).toHaveLength(10);
    expect(result.taxonomy.every(item => item.validationStatus === 'UNVALIDATED' && item.releaseEnabled === false)).toBe(true);
    expect(result.eventCandidates).toEqual([]);
    expect(result.diagnostics).toContain('EVENT_SPECIFIC_TAXONOMY_NOT_VALIDATED');
  });

  it('references only explicitly supplied B02 observed facts and never converts them into chart event candidates', () => {
    const result = buildCareerEventTimeline(makeInput({
      observedOutcomes: [{
        reportId: 'user-report-1',
        outcomeType: 'PROMOTION',
        statement: 'User explicitly reported a promotion.',
        source: 'USER_REPORTED'
      }]
    }));

    expect(result.observedOutcomeReportIds).toEqual(['user-report-1']);
    expect(result.eventCandidates).toEqual([]);
    expect(result.genericWindows[0].specificEventInference).toBe('NOT_MADE');
  });

  it('is deterministic under permutation of input event order', () => {
    const first = opportunityEvent('event-stable-a');
    const second = opportunityEvent('event-stable-b');
    const inputA = makeInput({ events: [first, second] });
    const inputB = makeInput({ events: [second, first] });

    expect(buildCareerEventTimeline(inputA)).toEqual(buildCareerEventTimeline(inputB));
  });
});
