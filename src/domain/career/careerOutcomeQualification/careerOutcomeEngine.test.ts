import { describe, expect, it } from 'vitest';
import type { CareerAnalyticalAxes } from '../careerFinalSynthesis/careerAnalyticalAxes';
import type { CareerFinalSynthesisResult } from '../careerFinalSynthesis/careerFinalSynthesisTypes';
import type { CareerEventsAnalysis } from '../careerEvents/careerEventTypes';
import type { CareerTrajectoryAnalysis } from '../careerTrajectory/careerTrajectoryTypes';
import type { CareerProfessionAnalysis } from '../careerProfession/careerProfessionTypes';
import { buildCareerOutcomeAnalysis } from './careerOutcomeEngine';

function axes(overrides: {
  promiseStatus?: CareerAnalyticalAxes['promise']['status'];
  promiseDirection?: string;
  activationStatus?: CareerAnalyticalAxes['activation']['status'];
  activationDirection?: string;
  activationEffect?: string;
  riskOccurrences?: readonly string[];
} = {}): CareerAnalyticalAxes {
  const promiseStatus = overrides.promiseStatus ?? 'AVAILABLE';
  const activationStatus = overrides.activationStatus ?? 'AVAILABLE';
  return {
    version: 'B01-AXIS-PROJECTION-v1',
    promise: {
      axis: 'PROMISE',
      status: promiseStatus,
      result: promiseStatus === 'AVAILABLE'
        ? { direction: overrides.promiseDirection ?? 'SUPPORT', strength: 'STRONG' }
        : null,
      supportingEvidenceOccurrenceIds: promiseStatus === 'AVAILABLE' ? ['natal-occ-1'] : [],
      conflictingEvidenceOccurrenceIds: [],
      ruleIds: ['RULE_NATAL'],
      coverage: { status: promiseStatus === 'AVAILABLE' ? 'COMPLETE' : 'INSUFFICIENT', availableSources: [], missingSources: [], evidenceOccurrenceCount: promiseStatus === 'AVAILABLE' ? 1 : 0 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' },
      methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    activation: {
      axis: 'ACTIVATION',
      status: activationStatus,
      result: activationStatus === 'AVAILABLE'
        ? {
            direction: overrides.activationDirection ?? 'SUPPORT',
            effect: overrides.activationEffect ?? 'ACTIVATES',
            strength: 'STRONG',
            dominantLevel: 'MD'
          }
        : null,
      supportingEvidenceOccurrenceIds: activationStatus === 'AVAILABLE' ? ['dasha-occ-1'] : [],
      conflictingEvidenceOccurrenceIds: [],
      ruleIds: ['RULE_DASHA'],
      coverage: { status: activationStatus === 'AVAILABLE' ? 'COMPLETE' : 'INSUFFICIENT', availableSources: [], missingSources: [], evidenceOccurrenceCount: activationStatus === 'AVAILABLE' ? 1 : 0 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' },
      methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    sustainability: {
      axis: 'SUSTAINABILITY',
      status: 'UNAVAILABLE',
      result: { assessment: 'NOT_ASSESSED', requiredEvidenceFamily: 'CAREER_SUSTAINABILITY' },
      supportingEvidenceOccurrenceIds: [],
      conflictingEvidenceOccurrenceIds: [],
      ruleIds: [],
      coverage: { status: 'INSUFFICIENT', availableSources: [], missingSources: ['CAREER_SUSTAINABILITY'], evidenceOccurrenceCount: 0 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' },
      methodVersion: 'B01-AXIS-PROJECTION-v1',
      unavailableReason: 'not implemented'
    },
    risk: {
      axis: 'RISK',
      status: 'AVAILABLE',
      result: { assessment: overrides.riskOccurrences?.length ? 'ADVERSE_EVIDENCE_PRESENT' : 'NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES', conflictCount: overrides.riskOccurrences?.length ?? 0 },
      supportingEvidenceOccurrenceIds: [],
      conflictingEvidenceOccurrenceIds: [...(overrides.riskOccurrences ?? [])],
      ruleIds: ['RULE_RISK'],
      coverage: { status: 'COMPLETE', availableSources: ['C4_C7_NATAL'], missingSources: [], evidenceOccurrenceCount: overrides.riskOccurrences?.length ?? 0 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' },
      methodVersion: 'B01-AXIS-PROJECTION-v1'
    },
    timing: {
      axis: 'TIMING',
      status: 'AVAILABLE',
      result: { candidateWindows: [], untimedLevels: [], guarantee: 'NONE' },
      supportingEvidenceOccurrenceIds: ['dasha-occ-1'],
      conflictingEvidenceOccurrenceIds: [],
      ruleIds: ['RULE_TIMING'],
      coverage: { status: 'COMPLETE', availableSources: ['C9_DASHA_PERIODS'], missingSources: [], evidenceOccurrenceCount: 1 },
      confidence: { status: 'NOT_ASSESSED', reason: 'test' },
      methodVersion: 'B01-AXIS-PROJECTION-v1'
    }
  } as unknown as CareerAnalyticalAxes;
}

function finalSynthesis(conflicts: CareerFinalSynthesisResult['conflicts'] = []): CareerFinalSynthesisResult {
  return {
    reasoningVersion: 'C11',
    domain: 'CAREER',
    finalStatus: 'SUPPORTED',
    finalDirection: 'SUPPORT',
    finalStrength: 'STRONG',
    confidence: 'MEDIUM',
    confidenceCoverage: {} as CareerFinalSynthesisResult['confidenceCoverage'],
    confidenceReasons: [],
    natalDirection: 'SUPPORT',
    natalStrength: 'STRONG',
    expressionStatus: 'SUPPORT',
    d10Direction: 'SUPPORT',
    d10Effect: 'REINFORCES',
    dashaEffect: 'ACTIVATES',
    dashaDirection: 'SUPPORT',
    timingStatus: 'ACTIVE',
    transitDirection: 'NEUTRAL',
    currentPressure: 'NONE',
    expressions: [],
    strongestExpressions: [],
    challengedExpressions: [],
    conflicts,
    evidenceIds: ['opportunity-semantic-1', 'dasha-semantic-1'],
    sourceIds: [],
    ruleIds: [],
    evidenceTrace: { evidenceIds: [], sourceIds: [], ruleIds: [] },
    statement: 'test',
    contradictoryDashaEvidence: []
  } as CareerFinalSynthesisResult;
}

function trajectory(): CareerTrajectoryAnalysis {
  return {
    reasoningVersion: 'P2-09A',
    domain: 'CAREER',
    longTermPattern: 'GROWTH_CAPABLE',
    currentPhase: 'ACTIVE',
    currentStatus: 'SUPPORTED',
    opportunities: [{
      mode: 'LEADERSHIP',
      direction: 'SUPPORT',
      strength: 'STRONG',
      qualified: true,
      evidenceIds: ['opportunity-semantic-1'],
      opportunityId: 'opportunity-1'
    }],
    evidenceIds: ['opportunity-semantic-1'],
    unresolvedEvidenceIds: [],
    sourceIds: [],
    ruleIds: [],
    datedForecastAvailable: false,
    statement: 'test'
  };
}

function events(): CareerEventsAnalysis {
  return {
    reasoningVersion: 'P2-09B',
    domain: 'CAREER',
    guaranteedEventsAvailable: false,
    events: [{
      eventId: 'CAREER_EVENT:CAREER_OPPORTUNITY_WINDOW:LEADERSHIP',
      eventType: 'CAREER_OPPORTUNITY_WINDOW',
      status: 'CANDIDATE',
      timing: { type: 'DASHA_PERIOD_WINDOW', start: '2026-01-01', end: '2026-12-31' },
      evidenceIds: ['opportunity-semantic-1', 'dasha-semantic-1'],
      ruleIds: ['P2-09B-EVT-01'],
      statement: 'Candidate opportunity window.',
      opportunityId: 'opportunity-1',
      activationId: 'dasha-semantic-1'
    }],
    evidenceIds: ['opportunity-semantic-1', 'dasha-semantic-1'],
    statement: 'one candidate'
  };
}

function profession(): CareerProfessionAnalysis {
  return {
    status: 'COMPLETE',
    candidates: [{
      candidateId: 'profession-1',
      domain: 'LEADERSHIP',
      family: 'EXECUTIVE_MANAGEMENT',
      basis: 'D10_QUALIFICATION',
      expressionTypes: [],
      mechanismTypes: [],
      patternIds: [],
      d10Status: 'QUALIFIED',
      evidence: [],
      domainEvidenceIds: [],
      relatedEvidenceIds: [],
      ruleId: 'RULE_PROFESSION'
    }],
    unresolvedExpressionTypes: [],
    mappedTypes: [],
    missingInputs: [],
    provenance: { expressionIds: [], mechanismIds: [], patternIds: [], evidenceIds: [], sourceIds: [], ruleIds: [] }
  };
}

describe('B02 Career outcome and success qualification', () => {
  it('does not produce a candidate from natal promise without activation', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes({ activationStatus: 'INSUFFICIENT' }),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.status).toBe('UNRESOLVED');
    expect(result.candidateOutcomes).toEqual([]);
    expect(result.diagnostics).toContain('DASHA_ACTIVATION_NOT_ESTABLISHED');
  });

  it('does not produce a candidate from activation without natal promise', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes({ promiseStatus: 'INSUFFICIENT' }),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.status).toBe('UNRESOLVED');
    expect(result.candidateOutcomes).toEqual([]);
    expect(result.diagnostics).toContain('NATAL_PROMISE_NOT_ESTABLISHED');
  });

  it('qualifies an existing candidate only when promise and linked activation are both available', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes(),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.status).toBe('CANDIDATES_AVAILABLE');
    expect(result.candidateOutcomes).toHaveLength(1);
    expect(result.candidateOutcomes[0]).toMatchObject({
      outcomeType: 'ROLE_OR_AUTHORITY_EXPANSION',
      status: 'CANDIDATE',
      qualification: 'SUPPORTED_CANDIDATE',
      guarantee: 'NONE'
    });
    expect(result.candidateOutcomes[0]?.executionConditions.practicalExecution).toBe('NOT_ASSESSED');
  });

  it('retains a candidate as conditional when C11 contains a high-severity counter-indication', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes({ riskOccurrences: ['risk-occ-1'] }),
      finalSynthesis: finalSynthesis([{
        source: 'D10',
        direction: 'CHALLENGE',
        severity: 'HIGH',
        evidenceIds: ['d10-conflict-semantic'],
        statement: 'Strong D10 counter-indication.'
      }]),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.status).toBe('CONDITIONAL');
    expect(result.candidateOutcomes[0]?.qualification).toBe('CONDITIONALLY_SUPPORTED_CANDIDATE');
    expect(result.candidateOutcomes[0]?.counterIndications.severity).toBe('HIGH');
    expect(result.candidateOutcomes[0]?.counterIndications.evidenceOccurrenceIds).toContain('risk-occ-1');
  });

  it('reports PARTIAL when one required axis has partial evidence coverage', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes({ promiseStatus: 'PARTIAL' }),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.status).toBe('PARTIAL');
    expect(result.candidateOutcomes).toEqual([]);
  });

  it('does not qualify a candidate when authoritative C11 final conclusion is challenged', () => {
    const challenged = {
      ...finalSynthesis(),
      finalStatus: 'CHALLENGED',
      finalDirection: 'CHALLENGE'
    } as CareerFinalSynthesisResult;
    const result = buildCareerOutcomeAnalysis({
      axes: axes(),
      finalSynthesis: challenged,
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.status).toBe('UNRESOLVED');
    expect(result.candidateOutcomes).toEqual([]);
    expect(result.diagnostics).toContain('C11_FINAL_CONCLUSION_NOT_SUPPORTIVE');
  });

  it('keeps missing Dasha activation unresolved rather than treating it as negative evidence', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes({ activationStatus: 'UNAVAILABLE' }),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events()
    });

    expect(result.status).toBe('UNRESOLVED');
    expect(result.candidateOutcomes).toEqual([]);
  });

  it('keeps user-reported outcomes separate from chart-derived candidate windows', () => {
    const chartOnly = buildCareerOutcomeAnalysis({
      axes: axes(),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });
    expect(chartOnly.observedOutcomes).toEqual([]);
    expect(chartOnly.candidateOutcomes).toHaveLength(1);

    const withReportedFact = buildCareerOutcomeAnalysis({
      axes: axes(),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession(),
      observedOutcomes: [{
        reportId: 'user-report-1',
        outcomeType: 'PROMOTION',
        statement: 'User reported a promotion.',
        source: 'USER_REPORTED',
        occurredAt: '2025-07-01'
      }]
    });
    expect(withReportedFact.observedOutcomes).toEqual([{
      reportId: 'user-report-1',
      outcomeType: 'PROMOTION',
      statement: 'User reported a promotion.',
      source: 'USER_REPORTED',
      occurredAt: '2025-07-01'
    }]);
    expect(withReportedFact.candidateOutcomes).toHaveLength(1);
    expect(withReportedFact.observedOutcomes[0]?.reportId).not.toBe(withReportedFact.candidateOutcomes[0]?.candidateId);
  });

  it('does not expose numeric probability or guaranteed success', () => {
    const result = buildCareerOutcomeAnalysis({
      axes: axes(),
      finalSynthesis: finalSynthesis(),
      trajectory: trajectory(),
      events: events(),
      profession: profession()
    });

    expect(result.guaranteedOutcomeAvailable).toBe(false);
    expect(result.numericProbabilityAvailable).toBe(false);
    expect('probability' in result).toBe(false);
    expect('successPercentage' in result).toBe(false);
    expect(result.candidateOutcomes[0]).not.toHaveProperty('probability');
  });
});
