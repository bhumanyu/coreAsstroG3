import { describe, expect, it } from 'vitest';
import type { CareerOutcomeAnalysis, CareerOutcomeCandidate } from '../careerOutcomeQualification/careerOutcomeTypes';
import { analyzeCareerPathways } from './careerPathwayEngine';

function candidate(
  candidateId: string,
  outcomeType: CareerOutcomeCandidate['outcomeType'],
  qualification: CareerOutcomeCandidate['qualification'] = 'SUPPORTED_CANDIDATE'
): CareerOutcomeCandidate {
  return {
    candidateId,
    outcomeType,
    status: 'CANDIDATE',
    qualification,
    qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION',
    sourceEventId: `event-${candidateId}`,
    opportunityId: `opportunity-${candidateId}`,
    activationId: `activation-${candidateId}`,
    timing: { type: 'UNTIMED' },
    supportingEvidence: {
      natalPromiseOccurrenceIds: [`natal-${candidateId}`],
      activationOccurrenceIds: [`activation-evidence-${candidateId}`],
      candidateEventEvidenceIds: [`semantic-${candidateId}`],
      ruleIds: [`rule-${candidateId}`]
    },
    executionConditions: {
      professionAnalysisStatus: 'COMPLETE',
      d10Qualification: 'QUALIFIED',
      practicalExecution: 'NOT_ASSESSED',
      requiredChecks: [
        'SKILLS_AND_EXPERIENCE_FIT',
        'REAL_WORLD_OPPORTUNITY',
        'USER_ACTION_AND_EXECUTION',
        'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'
      ]
    },
    counterIndications: {
      severity: 'NONE',
      evidenceOccurrenceIds: [],
      conflicts: []
    },
    guarantee: 'NONE'
  };
}

function outcome(
  candidates: readonly CareerOutcomeCandidate[],
  status: CareerOutcomeAnalysis['status'] = 'CANDIDATES_AVAILABLE'
): CareerOutcomeAnalysis {
  return {
    reasoningVersion: 'B02',
    methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
    status,
    candidateOutcomes: candidates,
    observedOutcomes: [],
    diagnostics: [],
    guaranteedOutcomeAvailable: false,
    numericProbabilityAvailable: false,
    statement: 'B02 candidate-only output.'
  };
}

describe('B05 Career pathway comparison', () => {
  it('identifies dual potential only when both explicit B02 pathway types are present', () => {
    const result = analyzeCareerPathways({
      outcomeAnalysis: outcome([
        candidate('employment-1', 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY'),
        candidate('independent-1', 'INDEPENDENT_OR_BUSINESS_ACTIVITY')
      ])
    });

    expect(result.verdict).toBe('DUAL_POTENTIAL');
    expect(result.status).toBe('AVAILABLE');
    expect(result.employment.status).toBe('SUPPORTED_CANDIDATE');
    expect(result.independent.status).toBe('SUPPORTED_CANDIDATE');
    expect(result.employment.supportingEvidenceOccurrenceIds).toEqual(['activation-evidence-employment-1', 'natal-employment-1']);
    expect(result.suitabilityAvailable).toBe(false);
    expect(result.guaranteedOutcomeAvailable).toBe(false);
    expect(result.numericProbabilityAvailable).toBe(false);
  });

  it('marks dual potential conditional when either pathway is only conditionally qualified', () => {
    const result = analyzeCareerPathways({
      outcomeAnalysis: outcome([
        candidate('employment-1', 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY'),
        candidate('independent-1', 'INDEPENDENT_OR_BUSINESS_ACTIVITY', 'CONDITIONALLY_SUPPORTED_CANDIDATE')
      ])
    });

    expect(result.verdict).toBe('CONDITIONAL_DUAL_POTENTIAL');
    expect(result.status).toBe('PARTIAL');
    expect(result.independent.status).toBe('CONDITIONAL_CANDIDATE');
    expect(result.independent.conditionalCandidateCount).toBe(1);
  });

  it('identifies employment evidence without treating the missing independent candidate as adverse evidence', () => {
    const result = analyzeCareerPathways({
      outcomeAnalysis: outcome([candidate('employment-1', 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY')])
    });

    expect(result.verdict).toBe('EMPLOYMENT_POTENTIAL_IDENTIFIED');
    expect(result.employment.status).toBe('SUPPORTED_CANDIDATE');
    expect(result.independent.status).toBe('NOT_IDENTIFIED');
    expect(result.statement).toMatch(/absence is not evidence of unsuitability/i);
    expect(result.independent.counterEvidenceOccurrenceIds).toEqual([]);
  });

  it('identifies independent evidence without treating the missing employment candidate as adverse evidence', () => {
    const result = analyzeCareerPathways({
      outcomeAnalysis: outcome([candidate('business-1', 'INDEPENDENT_OR_BUSINESS_ACTIVITY')])
    });

    expect(result.verdict).toBe('INDEPENDENT_POTENTIAL_IDENTIFIED');
    expect(result.independent.status).toBe('SUPPORTED_CANDIDATE');
    expect(result.employment.status).toBe('NOT_IDENTIFIED');
    expect(result.statement).toMatch(/absence is not evidence of unsuitability/i);
  });

  it('does not infer a mode from unrelated profession candidates or an empty B02 output', () => {
    const result = analyzeCareerPathways({ outcomeAnalysis: outcome([], 'CANDIDATES_AVAILABLE') });
    expect(result.verdict).toBe('NO_MODE_CANDIDATE');
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.employment.status).toBe('NOT_IDENTIFIED');
    expect(result.independent.status).toBe('NOT_IDENTIFIED');
  });

  it('preserves unresolved and insufficient B02 states', () => {
    const unresolved = analyzeCareerPathways({ outcomeAnalysis: outcome([], 'UNRESOLVED') });
    const insufficient = analyzeCareerPathways({ outcomeAnalysis: outcome([], 'INSUFFICIENT') });
    expect(unresolved.verdict).toBe('UNRESOLVED');
    expect(unresolved.status).toBe('UNRESOLVED');
    expect(insufficient.verdict).toBe('INSUFFICIENT_DATA');
    expect(insufficient.status).toBe('INSUFFICIENT_DATA');
  });

  it('returns explicit unavailable state when B02 is missing', () => {
    const result = analyzeCareerPathways({});
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.verdict).toBe('INSUFFICIENT_DATA');
    expect(result.diagnostics).toContain('B02_OUTCOME_ANALYSIS_NOT_PROVIDED');
  });

  it('sorts candidate references and evidence deterministically', () => {
    const result = analyzeCareerPathways({
      outcomeAnalysis: outcome([
        candidate('employment-z', 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY'),
        candidate('employment-a', 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY')
      ])
    });
    expect(result.employment.candidates.map(item => item.candidateId)).toEqual(['employment-a', 'employment-z']);
    expect(result.employment.ruleIds).toEqual(['rule-employment-a', 'rule-employment-z']);
  });
});
