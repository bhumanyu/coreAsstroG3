import type { CareerAnalyticalAxes } from '../careerFinalSynthesis/careerAnalyticalAxes';
import type { CareerFinalSynthesisResult } from '../careerFinalSynthesis/careerFinalSynthesisTypes';
import type { CareerEvent, CareerEventsAnalysis } from '../careerEvents/careerEventTypes';
import type { CareerTrajectoryAnalysis, CareerTrajectoryOpportunity } from '../careerTrajectory/careerTrajectoryTypes';
import type { CareerProfessionAnalysis } from '../careerProfession/careerProfessionTypes';
import type {
  CareerOutcomeAnalysis,
  CareerOutcomeAnalysisInput,
  CareerOutcomeAnalysisStatus,
  CareerOutcomeCandidate,
  CareerOutcomeCandidateType,
  CareerOutcomeCounterIndication,
  CareerOutcomeExecutionConditions,
  CareerObservedOutcomeInput
} from './careerOutcomeTypes';

export const CAREER_OUTCOME_QUALIFICATION_VERSION = 'B02-OUTCOME-QUALIFICATION-v1' as const;

const PRACTICAL_CHECKS = Object.freeze([
  'SKILLS_AND_EXPERIENCE_FIT',
  'REAL_WORLD_OPPORTUNITY',
  'USER_ACTION_AND_EXECUTION',
  'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'
] as const);

function sortedUnique(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...new Set(values.filter(value => typeof value === 'string' && value.trim().length > 0))]
      .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
  );
}

function isSupportivePromise(axes: CareerAnalyticalAxes, finalSynthesis: CareerFinalSynthesisResult): boolean {
  const direction = axes.promise.result?.direction as string | undefined;
  return axes.promise.status === 'AVAILABLE' &&
    (direction === 'SUPPORT' || direction === 'CONDITIONAL') &&
    axes.promise.supportingEvidenceOccurrenceIds.length > 0 &&
    (finalSynthesis.natalDirection === 'SUPPORT' || finalSynthesis.natalDirection === 'CONDITIONAL') &&
    finalSynthesis.natalStrength !== 'UNDETERMINED' &&
    (finalSynthesis.finalStatus === 'SUPPORTED' ||
      finalSynthesis.finalStatus === 'CONDITIONALLY_SUPPORTED') &&
    (finalSynthesis.finalDirection === 'SUPPORT' || finalSynthesis.finalDirection === 'CONDITIONAL');
}

function isActiveActivation(axes: CareerAnalyticalAxes): boolean {
  const result = axes.activation.result;
  return axes.activation.status === 'AVAILABLE' &&
    result !== null &&
    result.direction === 'SUPPORT' &&
    (result.effect === 'ACTIVATES' || result.effect === 'PARTIALLY_ACTIVATES') &&
    axes.activation.supportingEvidenceOccurrenceIds.length > 0;
}

function outcomeTypeForMode(mode: string): CareerOutcomeCandidateType {
  switch (mode) {
    case 'LEADERSHIP':
    case 'MANAGEMENT':
    case 'AUTHORITY':
      return 'ROLE_OR_AUTHORITY_EXPANSION';
    case 'SERVICE_EMPLOYMENT':
    case 'EMPLOYMENT':
      return 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY';
    case 'TECHNICAL_SPECIALIZATION':
    case 'SPECIALIZATION':
      return 'TECHNICAL_SPECIALIZATION_OR_SKILL_DEVELOPMENT';
    case 'INDEPENDENT_WORK':
    case 'BUSINESS_ENTREPRENEURSHIP':
    case 'ENTREPRENEURSHIP':
      return 'INDEPENDENT_OR_BUSINESS_ACTIVITY';
    case 'PUBLIC_INSTITUTIONAL':
      return 'PUBLIC_OR_INSTITUTIONAL_CAREER';
    default:
      return 'GENERAL_CAREER_OPPORTUNITY';
  }
}

function executionConditions(profession?: CareerProfessionAnalysis): CareerOutcomeExecutionConditions {
  const professionAnalysisStatus = profession?.status ?? 'NOT_PROVIDED';
  const hasD10QualifiedCandidate = profession?.candidates.some(candidate => candidate.d10Status === 'QUALIFIED') ?? false;
  const hasPartialD10 = profession?.candidates.some(candidate =>
    candidate.d10Status === 'NOT_PROVIDED' || candidate.d10Status === 'NOT_APPLICABLE'
  ) ?? false;
  const d10Qualification = hasD10QualifiedCandidate
    ? 'QUALIFIED'
    : profession && (profession.status === 'PARTIAL' || hasPartialD10)
      ? 'PARTIAL'
      : 'UNAVAILABLE';

  return Object.freeze({
    professionAnalysisStatus,
    d10Qualification,
    practicalExecution: 'NOT_ASSESSED',
    requiredChecks: PRACTICAL_CHECKS
  });
}

function counterIndications(
  axes: CareerAnalyticalAxes,
  finalSynthesis: CareerFinalSynthesisResult
): CareerOutcomeCandidate['counterIndications'] {
  const conflicts: CareerOutcomeCounterIndication[] = finalSynthesis.conflicts
    .filter(conflict => conflict.direction === 'CHALLENGE' || conflict.direction === 'MIXED')
    .map(conflict => Object.freeze({
      source: conflict.source,
      direction: conflict.direction,
      severity: conflict.severity,
      evidenceIdentityIds: sortedUnique(conflict.evidenceIds)
    }));

  const severity = conflicts.some(conflict => conflict.severity === 'HIGH')
    ? 'HIGH'
    : conflicts.some(conflict => conflict.severity === 'MODERATE')
      ? 'MODERATE'
      : conflicts.length > 0 || axes.risk.conflictingEvidenceOccurrenceIds.length > 0
        ? 'LOW'
        : 'NONE';

  return Object.freeze({
    severity,
    evidenceOccurrenceIds: sortedUnique(axes.risk.conflictingEvidenceOccurrenceIds),
    conflicts: Object.freeze(conflicts)
  });
}

function findOpportunity(
  trajectory: CareerTrajectoryAnalysis,
  event: CareerEvent
): CareerTrajectoryOpportunity | undefined {
  if (!event.opportunityId) return undefined;
  return trajectory.opportunities.find(opportunity => opportunity.opportunityId === event.opportunityId);
}

function isEligibleEvent(event: CareerEvent, opportunity: CareerTrajectoryOpportunity | undefined): boolean {
  if (event.status !== 'CANDIDATE' || !opportunity || !event.activationId) return false;
  if (event.eventType !== 'CAREER_OPPORTUNITY_WINDOW' && event.eventType !== 'CAREER_CONDITIONAL_WINDOW') return false;
  if (!opportunity.qualified || (opportunity.direction !== 'SUPPORT' && opportunity.direction !== 'CONDITIONAL')) return false;
  if (opportunity.evidenceIds.length === 0 || event.evidenceIds.length === 0) return false;
  const eventEvidence = new Set(event.evidenceIds);
  return eventEvidence.has(event.activationId) &&
    opportunity.evidenceIds.some(id => eventEvidence.has(id));
}

function validateObservedDate(value: string, field: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new Error(`Invalid observed outcome ${field}: ${value}`);
    }
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new Error(`Invalid observed outcome ${field}: ${value}`);
  }
}

function validateObservedOutcomes(
  values: readonly CareerObservedOutcomeInput[]
): readonly CareerObservedOutcomeInput[] {
  const ids = new Set<string>();
  return Object.freeze(values.map(value => {
    if (!value || value.source !== 'USER_REPORTED') {
      throw new Error('Observed career outcomes must have source USER_REPORTED');
    }
    if (!value.reportId.trim() || ids.has(value.reportId)) {
      throw new Error(`Observed career outcome reportId is empty or duplicated: ${value.reportId}`);
    }
    if (!value.statement.trim()) {
      throw new Error(`Observed career outcome ${value.reportId} must include a statement`);
    }
    ids.add(value.reportId);
    if (value.occurredAt) validateObservedDate(value.occurredAt, 'occurredAt');
    if (value.reportedAt) validateObservedDate(value.reportedAt, 'reportedAt');
    return Object.freeze({
      reportId: value.reportId,
      outcomeType: value.outcomeType,
      statement: value.statement,
      source: 'USER_REPORTED' as const,
      ...(value.occurredAt ? { occurredAt: value.occurredAt } : {}),
      ...(value.reportedAt ? { reportedAt: value.reportedAt } : {}),
      ...(value.sourceReference ? { sourceReference: value.sourceReference } : {})
    });
  }));
}

function buildCandidate(
  event: CareerEvent,
  opportunity: CareerTrajectoryOpportunity,
  axes: CareerAnalyticalAxes,
  finalSynthesis: CareerFinalSynthesisResult,
  profession?: CareerProfessionAnalysis
): CareerOutcomeCandidate {
  const execution = executionConditions(profession);
  const counter = counterIndications(axes, finalSynthesis);
  const conditional =
    event.eventType === 'CAREER_CONDITIONAL_WINDOW' ||
    finalSynthesis.finalStatus === 'MIXED' ||
    finalSynthesis.finalDirection === 'MIXED' ||
    counter.severity !== 'NONE' ||
    execution.d10Qualification !== 'QUALIFIED' ||
    execution.professionAnalysisStatus !== 'COMPLETE';

  return Object.freeze({
    candidateId: `CAREER_OUTCOME_CANDIDATE:${event.eventId}`,
    outcomeType: outcomeTypeForMode(opportunity.mode),
    status: 'CANDIDATE',
    qualification: conditional ? 'CONDITIONALLY_SUPPORTED_CANDIDATE' : 'SUPPORTED_CANDIDATE',
    qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION',
    sourceEventId: event.eventId,
    opportunityId: opportunity.opportunityId,
    activationId: event.activationId!,
    timing: Object.freeze({ ...event.timing }),
    supportingEvidence: Object.freeze({
      natalPromiseOccurrenceIds: sortedUnique(axes.promise.supportingEvidenceOccurrenceIds),
      activationOccurrenceIds: sortedUnique(axes.activation.supportingEvidenceOccurrenceIds),
      candidateEventEvidenceIds: sortedUnique(event.evidenceIds),
      ruleIds: sortedUnique([
        ...axes.promise.ruleIds,
        ...axes.activation.ruleIds,
        ...event.ruleIds,
        'B02-OUTCOME-QUALIFICATION-01'
      ])
    }),
    executionConditions: execution,
    counterIndications: counter,
    guarantee: 'NONE'
  });
}

/**
 * B02 qualifies existing P2-09B candidate windows against B01 Promise and Activation.
 * It never calculates astrology, creates Dasha windows, predicts specific real-world events,
 * or treats candidate windows as observed outcomes.
 */
export function buildCareerOutcomeAnalysis(input: CareerOutcomeAnalysisInput): CareerOutcomeAnalysis {
  const { axes, finalSynthesis, trajectory, events, profession } = input;
  const observedOutcomes = validateObservedOutcomes(input.observedOutcomes ?? []);

  if (axes.version !== 'B01-AXIS-PROJECTION-v1') {
    throw new Error(`Unsupported Career analytical axes version: ${axes.version}`);
  }
  if (trajectory.reasoningVersion !== 'P2-09A' || trajectory.domain !== 'CAREER') {
    throw new Error('B02 requires a valid P2-09A Career trajectory analysis');
  }
  if (events.reasoningVersion !== 'P2-09B' || events.domain !== 'CAREER' || events.guaranteedEventsAvailable !== false) {
    throw new Error('B02 requires a valid candidate-only P2-09B Career events analysis');
  }

  const promiseReady = isSupportivePromise(axes, finalSynthesis);
  const activationReady = isActiveActivation(axes);
  const diagnostics: string[] = [];

  if (!promiseReady) diagnostics.push('NATAL_PROMISE_NOT_ESTABLISHED');
  if (!activationReady) diagnostics.push('DASHA_ACTIVATION_NOT_ESTABLISHED');
  if (
    finalSynthesis.finalStatus === 'CHALLENGED' ||
    finalSynthesis.finalStatus === 'INSUFFICIENT_DATA' ||
    (finalSynthesis.finalDirection !== 'SUPPORT' && finalSynthesis.finalDirection !== 'CONDITIONAL')
  ) {
    diagnostics.push('C11_FINAL_CONCLUSION_NOT_SUPPORTIVE');
  }

  const candidateOutcomes: CareerOutcomeCandidate[] = [];
  if (promiseReady && activationReady) {
    for (const event of events.events) {
      const opportunity = findOpportunity(trajectory, event);
      if (!isEligibleEvent(event, opportunity)) continue;
      candidateOutcomes.push(buildCandidate(event, opportunity!, axes, finalSynthesis, profession));
    }
  } else if (events.events.some(event => event.eventType === 'CAREER_OPPORTUNITY_WINDOW' || event.eventType === 'CAREER_CONDITIONAL_WINDOW')) {
    diagnostics.push('P2_09B_CANDIDATE_NOT_PROMOTED_WITHOUT_BOTH_PROMISE_AND_ACTIVATION');
  }

  candidateOutcomes.sort((a, b) => a.candidateId < b.candidateId ? -1 : a.candidateId > b.candidateId ? 1 : 0);

  let status: CareerOutcomeAnalysisStatus;
  if (candidateOutcomes.length > 0) {
    status = candidateOutcomes.some(candidate => candidate.qualification === 'CONDITIONALLY_SUPPORTED_CANDIDATE')
      ? 'CONDITIONAL'
      : 'CANDIDATES_AVAILABLE';
  } else {
    const anyAxisEvidence =
      axes.promise.supportingEvidenceOccurrenceIds.length > 0 ||
      axes.promise.conflictingEvidenceOccurrenceIds.length > 0 ||
      axes.activation.supportingEvidenceOccurrenceIds.length > 0 ||
      axes.activation.conflictingEvidenceOccurrenceIds.length > 0;
    const partialAxisCoverage =
      axes.promise.status === 'PARTIAL' ||
      axes.activation.status === 'PARTIAL';
    status = partialAxisCoverage ? 'PARTIAL' : anyAxisEvidence ? 'UNRESOLVED' : 'INSUFFICIENT';
    if (promiseReady && activationReady) diagnostics.push('NO_LINKED_P2_09B_OUTCOME_CANDIDATE');
  }

  const statement = candidateOutcomes.length > 0
    ? `Career outcome qualification: ${candidateOutcomes.length} candidate window(s) retained; no real-world outcome is guaranteed.`
    : status === 'INSUFFICIENT'
      ? 'Career outcome qualification is insufficient because required promise and activation evidence is unavailable.'
      : 'Career outcome qualification is unresolved; missing or unlinked evidence prevents an outcome candidate.';

  return Object.freeze({
    reasoningVersion: 'B02',
    methodVersion: CAREER_OUTCOME_QUALIFICATION_VERSION,
    status,
    candidateOutcomes: Object.freeze(candidateOutcomes),
    observedOutcomes,
    diagnostics: Object.freeze(sortedUnique(diagnostics)),
    guaranteedOutcomeAvailable: false,
    numericProbabilityAvailable: false,
    statement
  });
}
