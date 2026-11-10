import type {
  CareerOutcomeAnalysis,
  CareerOutcomeCandidate
} from '../careerOutcomeQualification/careerOutcomeTypes';
import type {
  CareerPathwayAnalysis,
  CareerPathwayAnalysisInput,
  CareerPathwayCandidateReference,
  CareerPathwayMode,
  CareerPathwayModeAssessment,
  CareerPathwayVerdict
} from './careerPathwayTypes';

function sortedUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(value => value.trim().length > 0))].sort());
}

function projectCandidate(candidate: CareerOutcomeCandidate): CareerPathwayCandidateReference {
  return Object.freeze({
    candidateId: candidate.candidateId,
    qualification: candidate.qualification,
    sourceEventId: candidate.sourceEventId,
    opportunityId: candidate.opportunityId,
    activationId: candidate.activationId,
    timing: Object.freeze({ ...candidate.timing }),
    supportingEvidenceOccurrenceIds: sortedUnique([
      ...candidate.supportingEvidence.natalPromiseOccurrenceIds,
      ...candidate.supportingEvidence.activationOccurrenceIds
    ]),
    ruleIds: sortedUnique(candidate.supportingEvidence.ruleIds),
    counterEvidenceOccurrenceIds: sortedUnique(candidate.counterIndications.evidenceOccurrenceIds),
    counterIndicationSeverity: candidate.counterIndications.severity
  });
}

function assessMode(
  mode: CareerPathwayMode,
  candidates: readonly CareerOutcomeCandidate[]
): CareerPathwayModeAssessment {
  const projected = candidates.map(projectCandidate).sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  const supportedCandidateCount = candidates.filter(candidate => candidate.qualification === 'SUPPORTED_CANDIDATE').length;
  const conditionalCandidateCount = candidates.filter(candidate => candidate.qualification === 'CONDITIONALLY_SUPPORTED_CANDIDATE').length;
  return Object.freeze({
    mode,
    status: projected.length === 0
      ? 'NOT_IDENTIFIED'
      : supportedCandidateCount > 0
        ? 'SUPPORTED_CANDIDATE'
        : 'CONDITIONAL_CANDIDATE',
    candidates: Object.freeze(projected),
    candidateCount: projected.length,
    supportedCandidateCount,
    conditionalCandidateCount,
    supportingEvidenceOccurrenceIds: sortedUnique(projected.flatMap(candidate => candidate.supportingEvidenceOccurrenceIds)),
    ruleIds: sortedUnique(projected.flatMap(candidate => candidate.ruleIds)),
    counterEvidenceOccurrenceIds: sortedUnique(projected.flatMap(candidate => candidate.counterEvidenceOccurrenceIds)),
    practicalExecution: 'NOT_ASSESSED',
    financialReadiness: 'NOT_ASSESSED',
    personalPreference: 'NOT_ASSESSED'
  });
}

function deriveVerdict(
  outcome: CareerOutcomeAnalysis,
  employment: CareerPathwayModeAssessment,
  independent: CareerPathwayModeAssessment
): CareerPathwayVerdict {
  if (outcome.status === 'INSUFFICIENT') return 'INSUFFICIENT_DATA';
  if (outcome.status === 'UNRESOLVED') return 'UNRESOLVED';
  const hasEmployment = employment.candidateCount > 0;
  const hasIndependent = independent.candidateCount > 0;
  if (hasEmployment && hasIndependent) {
    return employment.supportedCandidateCount > 0 && independent.supportedCandidateCount > 0
      ? 'DUAL_POTENTIAL'
      : 'CONDITIONAL_DUAL_POTENTIAL';
  }
  if (hasEmployment) return 'EMPLOYMENT_POTENTIAL_IDENTIFIED';
  if (hasIndependent) return 'INDEPENDENT_POTENTIAL_IDENTIFIED';
  return 'NO_MODE_CANDIDATE';
}

function statementFor(verdict: CareerPathwayVerdict): string {
  switch (verdict) {
    case 'DUAL_POTENTIAL':
      return 'The canonical B02 analysis identifies both employment/service and independent/business candidate pathways. This is dual potential evidence, not a suitability verdict or recommendation.';
    case 'CONDITIONAL_DUAL_POTENTIAL':
      return 'The canonical B02 analysis identifies both employment/service and independent/business candidate pathways, with at least one pathway conditional. This is not a suitability verdict or recommendation.';
    case 'EMPLOYMENT_POTENTIAL_IDENTIFIED':
      return 'Employment/service candidate evidence is present. An independent/business candidate is not identified in the current B02 output; that absence is not evidence of unsuitability.';
    case 'INDEPENDENT_POTENTIAL_IDENTIFIED':
      return 'Independent/business candidate evidence is present. An employment/service candidate is not identified in the current B02 output; that absence is not evidence of unsuitability.';
    case 'NO_MODE_CANDIDATE':
      return 'The current B02 output does not identify an employment/service or independent/business candidate. No negative suitability conclusion is inferred.';
    case 'UNRESOLVED':
      return 'B02 pathway evidence is unresolved. No corporate-versus-independent conclusion is produced.';
    case 'INSUFFICIENT_DATA':
      return 'B02 does not contain sufficient evidence to compare employment/service and independent/business pathways.';
  }
}

export function analyzeCareerPathways(
  input: CareerPathwayAnalysisInput
): CareerPathwayAnalysis {
  const outcome = input.outcomeAnalysis;
  if (!outcome) {
    const emptyEmployment = assessMode('EMPLOYMENT_SERVICE', []);
    const emptyIndependent = assessMode('INDEPENDENT_BUSINESS', []);
    return Object.freeze({
      reasoningVersion: 'B05',
      methodVersion: 'B05-DUAL-POTENTIAL-v1',
      sourceReasoningVersion: 'B02',
      sourceMethodVersion: 'NOT_PROVIDED',
      status: 'UNAVAILABLE',
      verdict: 'INSUFFICIENT_DATA',
      employment: emptyEmployment,
      independent: emptyIndependent,
      confidence: Object.freeze({
        status: 'NOT_ASSESSED',
        reason: 'No B02 outcome analysis is attached; B05 does not infer pathways from B04 profession families.'
      }),
      guaranteedOutcomeAvailable: false,
      numericProbabilityAvailable: false,
      suitabilityAvailable: false,
      diagnostics: Object.freeze(['B02_OUTCOME_ANALYSIS_NOT_PROVIDED']),
      statement: statementFor('INSUFFICIENT_DATA'),
      limitations: Object.freeze([
        'B05 compares only explicit B02 employment/service and independent/business candidate outcomes.',
        'An unrepresented pathway is NOT_IDENTIFIED, not unsuitable.',
        'Practical execution, financial readiness and personal preference are NOT_ASSESSED.'
      ])
    });
  }

  const employmentCandidates = outcome.candidateOutcomes.filter(
    candidate => candidate.outcomeType === 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY'
  );
  const independentCandidates = outcome.candidateOutcomes.filter(
    candidate => candidate.outcomeType === 'INDEPENDENT_OR_BUSINESS_ACTIVITY'
  );
  const employment = assessMode('EMPLOYMENT_SERVICE', employmentCandidates);
  const independent = assessMode('INDEPENDENT_BUSINESS', independentCandidates);
  const verdict = deriveVerdict(outcome, employment, independent);
  const status: CareerPathwayAnalysis['status'] =
    verdict === 'INSUFFICIENT_DATA' ? 'INSUFFICIENT_DATA'
      : verdict === 'UNRESOLVED' ? 'UNRESOLVED'
        : outcome.status === 'PARTIAL' || outcome.status === 'CONDITIONAL' || verdict === 'CONDITIONAL_DUAL_POTENTIAL'
          ? 'PARTIAL'
          : verdict === 'NO_MODE_CANDIDATE' ? 'UNAVAILABLE' : 'AVAILABLE';

  return Object.freeze({
    reasoningVersion: 'B05',
    methodVersion: 'B05-DUAL-POTENTIAL-v1',
    sourceReasoningVersion: 'B02',
    sourceMethodVersion: outcome.methodVersion,
    status,
    verdict,
    employment,
    independent,
    confidence: Object.freeze({
      status: 'NOT_ASSESSED',
      reason: 'B05 reports candidate presence and qualification only; it does not create a parallel confidence or suitability score.'
    }),
    guaranteedOutcomeAvailable: false,
    numericProbabilityAvailable: false,
    suitabilityAvailable: false,
    diagnostics: Object.freeze([
      ...outcome.diagnostics,
      ...(employment.candidateCount === 0 ? ['EMPLOYMENT_SERVICE_CANDIDATE_NOT_IDENTIFIED'] : []),
      ...(independent.candidateCount === 0 ? ['INDEPENDENT_BUSINESS_CANDIDATE_NOT_IDENTIFIED'] : [])
    ]),
    statement: statementFor(verdict),
    limitations: Object.freeze([
      'B05 compares only explicit B02 employment/service and independent/business candidate outcomes.',
      'An unrepresented pathway is NOT_IDENTIFIED, not unsuitable.',
      'B04 profession ranking is not reinterpreted as a corporate-versus-entrepreneurial ranking.',
      'C11 remains the sole final Career synthesis and confidence authority.',
      'Practical execution, financial readiness and personal preference are NOT_ASSESSED.',
      'No guaranteed outcome or numeric probability is available.'
    ])
  });
}
