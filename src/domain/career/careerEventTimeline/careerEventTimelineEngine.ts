import type {
  CareerEventTimelineInput,
  CareerEventTimelineAnalysis,
  CareerEventTimelineWindow,
  CareerEventSpecificRuleContract,
  CareerEvent
} from './careerEventTimelineTypes';

export const CAREER_EVENT_SPECIFIC_RULE_CATALOGUE: readonly CareerEventSpecificRuleContract[] = Object.freeze([
  {
    eventType: 'CAREER_ENTRY_START',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'LINKED_C9_SUPPORT_ACTIVATION']),
    validationGap: 'Current C11 expressions describe broad career modes, not an explicit first-entry/start event; no event-specific rule family or independently validated event fixture exists.',
    releaseEnabled: false
  },
  {
    eventType: 'JOB_CHANGE_TRANSITION',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'LINKED_C9_SUPPORT_ACTIVATION', 'D10_SAME_EXPRESSION_QUALIFICATION']),
    validationGap: 'No canonical D1 transition/mobility event rule is available. Employment/service or foreign/independent modes cannot be re-labelled as a job change.',
    releaseEnabled: false
  },
  {
    eventType: 'PROMOTION_ROLE_EXPANSION',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'D10_SAME_EXPRESSION_QUALIFICATION', 'LINKED_C9_SUPPORT_ACTIVATION']),
    validationGap: 'Authority/leadership expression is not evidence of a promotion. A validated promotion/role-expansion rule and same-expression D10 qualification are absent.',
    releaseEnabled: false
  },
  {
    eventType: 'LEADERSHIP_RESPONSIBILITY',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'D10_SAME_EXPRESSION_QUALIFICATION', 'LINKED_C9_SUPPORT_ACTIVATION']),
    validationGap: 'Broad leadership/management expression does not establish an appointment or assignment of leadership responsibility.',
    releaseEnabled: false
  },
  {
    eventType: 'ENTREPRENEURSHIP_BUSINESS_INITIATION',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'D10_SAME_EXPRESSION_QUALIFICATION', 'LINKED_C9_SUPPORT_ACTIVATION']),
    validationGap: 'Independent/business manifestation modes do not prove business initiation; no event-specific initiation rule is validated.',
    releaseEnabled: false
  },
  {
    eventType: 'FOREIGN_REMOTE_OPPORTUNITY',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'D10_SAME_EXPRESSION_QUALIFICATION', 'LINKED_C9_SUPPORT_ACTIVATION']),
    validationGap: 'Foreign/remote expression labels do not establish a concrete foreign or remote career opportunity; event-specific source evidence is not validated.',
    releaseEnabled: false
  },
  {
    eventType: 'CHALLENGE_INTERRUPTION',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'C11_NATAL_COUNTER_INDICATION', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'LINKED_C9_CHALLENGE_ACTIVATION']),
    validationGap: 'A Dasha challenge is not an interruption. A natal-linked, event-specific interruption rule and positive/negative fixtures are not present.',
    releaseEnabled: false
  },
  {
    eventType: 'RECOVERY_REENTRY',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'PRIOR_CHALLENGE_WINDOW', 'SUBSEQUENT_SUPPORT_ACTIVATION', 'SOURCE_DATED_TEMPORAL_ORDER']),
    validationGap: 'No validated recovery/continuity evidence family or ordered challenge-to-recovery event rule exists; B01 Sustainability is explicitly NOT_ASSESSED.',
    releaseEnabled: false
  },
  {
    eventType: 'PEAK_CONSOLIDATION',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'VALIDATED_SUSTAINABILITY_EVIDENCE', 'D10_SAME_EXPRESSION_QUALIFICATION', 'LINKED_C9_SUPPORT_ACTIVATION']),
    validationGap: 'No validated sustainability/continuity evidence family exists; peak or consolidation cannot be inferred from strong promise or rank.',
    releaseEnabled: false
  },
  {
    eventType: 'RETIREMENT_TRANSITION',
    validationStatus: 'UNVALIDATED',
    requiredEvidence: Object.freeze(['D1_NATAL_PROMISE', 'EVENT_SPECIFIC_D1_EXPRESSION', 'EVENT_SPECIFIC_RULE_PROVENANCE', 'USER_CONFIRMED_ACTIVE_CAREER_CONTEXT', 'SOURCE_DATED_TEMPORAL_ORDER']),
    validationGap: 'No retirement/exit rule or independently confirmed active-career context exists. Age or Dasha alone cannot establish retirement.',
    releaseEnabled: false
  }
] as const);

function sortedUnique(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...new Set(values.filter(value => typeof value === 'string' && value.trim().length > 0))]
      .sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
  );
}

function compareCodePoints(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function isNatalLinkedChallenge(
  event: CareerEvent,
  input: CareerEventTimelineInput
): { readonly valid: boolean; readonly occurrenceIds: readonly string[]; readonly rootIds: readonly string[] } {
  if (event.eventType !== 'CAREER_CHALLENGE_WINDOW' || !event.activationId) {
    return { valid: false, occurrenceIds: [], rootIds: [] };
  }
  const matching = input.dasha.evidence.filter(item =>
    item.identityKey === event.activationId &&
    item.effect === 'CHALLENGES' &&
    item.direction === 'CHALLENGE' &&
    item.provenance.natalRootIds.length > 0
  );
  if (matching.length !== 1) return { valid: false, occurrenceIds: [], rootIds: [] };
  const activation = matching[0];
  if (!event.evidenceIds.includes(activation.identityKey)) {
    return { valid: false, occurrenceIds: [], rootIds: [] };
  }
  if (!input.axes.activation.conflictingEvidenceOccurrenceIds.includes(activation.id) ||
      !input.axes.risk.supportingEvidenceOccurrenceIds.includes(activation.id)) {
    return { valid: false, occurrenceIds: [], rootIds: [] };
  }
  const roots = new Set(activation.provenance.natalRootIds);
  const natalConflictRoots = input.finalSynthesis.conflicts
    .filter(conflict => conflict.source === 'NATAL' && (conflict.direction === 'CHALLENGE' || conflict.direction === 'MIXED'))
    .flatMap(conflict => conflict.evidenceIds)
    .filter(identity => roots.has(identity));
  const linkedRoots = sortedUnique(natalConflictRoots);
  if (linkedRoots.length === 0) return { valid: false, occurrenceIds: [], rootIds: [] };
  return { valid: true, occurrenceIds: [activation.id], rootIds: linkedRoots };
}

function opportunityOutcome(
  event: CareerEvent,
  input: CareerEventTimelineInput
): CareerOutcomeTimelineLink | undefined {
  if (event.eventType !== 'CAREER_OPPORTUNITY_WINDOW' && event.eventType !== 'CAREER_CONDITIONAL_WINDOW') return undefined;
  const candidate = input.outcomeAnalysis.candidateOutcomes.find(item =>
    item.sourceEventId === event.eventId &&
    item.opportunityId === event.opportunityId &&
    item.activationId === event.activationId &&
    item.status === 'CANDIDATE' &&
    item.guarantee === 'NONE' &&
    item.supportingEvidence.natalPromiseOccurrenceIds.length > 0 &&
    item.supportingEvidence.activationOccurrenceIds.length > 0
  );
  if (!candidate) return undefined;
  return {
    occurrenceIds: sortedUnique([
      ...candidate.supportingEvidence.natalPromiseOccurrenceIds,
      ...candidate.supportingEvidence.activationOccurrenceIds
    ]),
    rootIds: sortedUnique(input.dasha.evidence
      .filter(item => item.identityKey === candidate.activationId)
      .flatMap(item => item.provenance.natalRootIds))
  };
}

interface CareerOutcomeTimelineLink {
  readonly occurrenceIds: readonly string[];
  readonly rootIds: readonly string[];
}

function buildGenericWindow(
  event: CareerEvent,
  input: CareerEventTimelineInput
): CareerEventTimelineWindow | undefined {
  if (event.status !== 'CANDIDATE' || event.evidenceIds.length === 0 || event.ruleIds.length === 0 || !event.activationId) {
    return undefined;
  }
  const opportunity = opportunityOutcome(event, input);
  const challenge = isNatalLinkedChallenge(event, input);
  if (!opportunity && !challenge.valid) return undefined;
  const link = opportunity ?? { occurrenceIds: challenge.occurrenceIds, rootIds: challenge.rootIds };
  const basis = opportunity
    ? 'B02_NATAL_PROMISE_AND_LINKED_ACTIVATION'
    : 'B01_NATAL_RISK_AND_LINKED_CHALLENGE_ACTIVATION';
  return Object.freeze({
    windowId: `B06_GENERIC_WINDOW:${event.eventId}`,
    sourceEventId: event.eventId,
    genericType: event.eventType,
    status: 'GENERIC_CANDIDATE_WINDOW',
    specificEventInference: 'NOT_MADE',
    timing: Object.freeze({ ...event.timing }),
    opportunityId: event.opportunityId,
    activationId: event.activationId,
    qualificationBasis: basis,
    evidence: Object.freeze({
      semanticIdentityIds: sortedUnique(event.evidenceIds),
      occurrenceIds: sortedUnique(link.occurrenceIds),
      rootIdentityKeys: sortedUnique(link.rootIds),
      ruleIds: sortedUnique(event.ruleIds)
    }),
    limitations: Object.freeze([
      'This is a generic candidate window, not a specific career event.',
      'Timing is copied from the canonical source Dasha period; no dates are inferred or extended.',
      'No promotion, job change, business launch, interruption, recovery, peak, or retirement is asserted.',
      'No guarantee or numeric probability is available.'
    ])
  });
}

function validateInput(input: CareerEventTimelineInput): void {
  if (input.axes.version !== 'B01-AXIS-PROJECTION-v1') throw new Error('B06 requires B01 analytical axes');
  if (input.finalSynthesis.reasoningVersion !== 'C11' || input.finalSynthesis.domain !== 'CAREER') throw new Error('B06 requires canonical C11 Career synthesis');
  if (input.trajectory.reasoningVersion !== 'P2-09A' || input.trajectory.domain !== 'CAREER') throw new Error('B06 requires P2-09A Career trajectory');
  if (input.events.reasoningVersion !== 'P2-09B' || input.events.domain !== 'CAREER' || input.events.guaranteedEventsAvailable !== false) throw new Error('B06 requires candidate-only P2-09B events');
  if (input.outcomeAnalysis.reasoningVersion !== 'B02' || input.outcomeAnalysis.guaranteedOutcomeAvailable !== false || input.outcomeAnalysis.numericProbabilityAvailable !== false) throw new Error('B06 requires B02 non-guaranteed outcome qualification');
  if (!Array.isArray(input.dasha.evidence)) throw new Error('B06 requires canonical C9 Dasha evidence');
}

export function buildCareerEventTimeline(input: CareerEventTimelineInput): CareerEventTimelineAnalysis {
  validateInput(input);
  const genericWindows = input.events.events
    .map(event => buildGenericWindow(event, input))
    .filter((item): item is CareerEventTimelineWindow => item !== undefined)
    .sort((a, b) => compareCodePoints(a.windowId, b.windowId));

  const sourceCount = input.events.events.length;
  const suppressedCount = sourceCount - genericWindows.length;
  const diagnostics = [
    'EVENT_SPECIFIC_TAXONOMY_NOT_VALIDATED',
    ...(suppressedCount > 0 ? ['UNLINKED_OR_UNQUALIFIED_GENERIC_WINDOWS_SUPPRESSED'] : []),
    ...(genericWindows.length === 0 ? ['NO_NATAL_LINKED_GENERIC_WINDOWS_AVAILABLE'] : []),
    ...(input.outcomeAnalysis.observedOutcomes.length > 0 ? ['OBSERVED_OUTCOMES_RETAINED_AS_EXPLICIT_B02_FACTS'] : [])
  ];
  const status = genericWindows.length === 0
    ? 'UNAVAILABLE'
    : suppressedCount > 0 || input.axes.promise.status === 'PARTIAL' || input.axes.activation.status === 'PARTIAL'
      ? 'PARTIAL'
      : 'GENERIC_WINDOWS_ONLY';

  return Object.freeze({
    reasoningVersion: 'B06',
    methodVersion: 'B06-EVENT-SPECIFIC-TIMELINE-v1',
    status,
    taxonomy: CAREER_EVENT_SPECIFIC_RULE_CATALOGUE,
    eventCandidates: Object.freeze([]),
    genericWindows: Object.freeze(genericWindows),
    observedOutcomeReportIds: sortedUnique(input.outcomeAnalysis.observedOutcomes.map(item => item.reportId)),
    diagnostics: sortedUnique(diagnostics),
    guaranteedEventsAvailable: false,
    numericProbabilityAvailable: false,
    statement: `B06 retained ${genericWindows.length} generic natal-linked career window(s). No event-specific taxonomy type is validated; no specific outcome is inferred or guaranteed.`
  });
}
