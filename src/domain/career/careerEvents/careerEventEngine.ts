import type {
  CareerEventsInput,
  CareerEventsAnalysis,
  CareerEvent,
  CareerEventType,
  CareerEventTiming,
  CareerEventTimingType
} from './careerEventTypes';

import type {
  CareerTrajectoryOpportunity
} from '../careerTrajectory/careerTrajectoryTypes';

import type {
  CareerDashaCanonicalPeriod,
  CareerDashaCanonicalEvidence
} from '../careerDasha/careerDashaCanonicalTypes';

/**
 * P2-09B Career Events & Timing Engine
 *
 * Deterministic downstream module that consumes canonical C11 (via P2-09A trajectory)
 * and C9 (Dasha canonical analysis) to produce evidence-traceable career event candidates
 * and source-backed timing windows.
 *
 * This is a standalone analysis layer — it must NOT recalculate any C4–C11 astrology,
 * must NOT wire itself into CareerDomainInterpreterV2.ts, and must NOT call AI.
 *
 * EVT-01: Opportunity-window candidates require an existing qualified trajectory opportunity
 * AND an activating period. Dasha cannot manufacture an opportunity.
 *
 * EVT-02: Periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL effect/direction produce NO event.
 * Missing evidence is not negative evidence.
 *
 * EVT-03: Use source dates as-is; never infer/interpolate/extend. Missing/partial dates → UNTIMED.
 * Malformed or start>end dates → throw.
 */

/**
 * Validates a date string.
 *
 * Accepts both ISO format (from vimshottari engine) and YYYY-MM-DD format (from test fixtures).
 * Returns true if the date is valid, false otherwise.
 */
function isValidDate(dateStr: string | undefined): boolean {
  if (!dateStr) {
    return false;
  }

  // Try ISO format first (from vimshottari.ts: toISOString())
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return true;
  }

  // Try YYYY-MM-DD format (from test fixtures)
  const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (yyyyMmDdRegex.test(dateStr)) {
    const parsed = new Date(dateStr);
    return !isNaN(parsed.getTime());
  }

  return false;
}

/**
 * Checks if a Dasha period is activating (ACTIVATES or PARTIALLY_ACTIVATES) with SUPPORT direction.
 */
function isActivatingPeriod(period: CareerDashaCanonicalPeriod): boolean {
  return (
    (period.effect === 'ACTIVATES' || period.effect === 'PARTIALLY_ACTIVATES') &&
    period.direction === 'SUPPORT'
  );
}

/**
 * Checks if a Dasha period is challenging (CHALLENGES) with CHALLENGE direction.
 */
function isChallengingPeriod(period: CareerDashaCanonicalPeriod): boolean {
  return (
    period.effect === 'CHALLENGES' &&
    period.direction === 'CHALLENGE'
  );
}

/**
 * Checks if a Dasha period should produce no event (EVT-02).
 *
 * Periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL effect/direction produce NO event.
 * Missing evidence is not negative evidence.
 */
function shouldSkipPeriod(period: CareerDashaCanonicalPeriod): boolean {
  const skipEffects = new Set(['UNKNOWN', 'INSUFFICIENT_DATA', 'DOES_NOT_ACTIVATE']);
  const skipDirections = new Set(['UNKNOWN', 'UNAVAILABLE', 'NEUTRAL']);

  return (
    skipEffects.has(period.effect) ||
    skipDirections.has(period.direction)
  );
}

/**
 * Checks if a trajectory opportunity is qualified.
 *
 * Qualified means: qualified === true AND direction is SUPPORT or CONDITIONAL.
 */
function isQualifiedOpportunity(opportunity: CareerTrajectoryOpportunity): boolean {
  return (
    opportunity.qualified &&
    (opportunity.direction === 'SUPPORT' || opportunity.direction === 'CONDITIONAL')
  );
}

/**
 * Builds timing information from a Dasha period.
 *
 * If the period has valid start and end dates, returns a DASHA_PERIOD_WINDOW.
 * Otherwise, returns UNTIMED.
 *
 * Throws if dates are malformed or start > end.
 */
function buildTiming(period: CareerDashaCanonicalPeriod): CareerEventTiming {
  const hasStart = isValidDate(period.start);
  const hasEnd = isValidDate(period.end);

  if (!hasStart || !hasEnd) {
    return Object.freeze({
      type: 'UNTIMED' as CareerEventTimingType
    });
  }

  // Both dates are valid — check start <= end
  const startDate = new Date(period.start!);
  const endDate = new Date(period.end!);

  if (startDate > endDate) {
    throw new Error(
      `Invalid period: start date (${period.start}) is after end date (${period.end})`
    );
  }

  return Object.freeze({
    type: 'DASHA_PERIOD_WINDOW' as CareerEventTimingType,
    start: period.start,
    end: period.end
  });
}

/**
 * Collects Dasha evidence identity keys for a period.
 *
 * Returns the identityKey from each evidence item (semantic identity).
 * Never mixes in occurrence IDs, source IDs, rule IDs, or event IDs.
 */
function collectDashaEvidenceIds(
  dashaEvidence: readonly CareerDashaCanonicalEvidence[],
  level: 'MD' | 'AD' | 'PD'
): readonly string[] {
  const relevantEvidence = dashaEvidence.filter(e => e.level === level);
  const identityKeys = relevantEvidence.map(e => e.identityKey);
  return Object.freeze([...new Set(identityKeys)].sort());
}

/**
 * Generates a stable event ID from domain inputs.
 *
 * Format: 'CAREER_EVENT:{eventType}:{sourceKey}'
 * Where sourceKey is derived from the opportunity and period.
 */
function generateEventId(
  eventType: CareerEventType,
  opportunityMode: string,
  periodLevel: string,
  periodPlanet: string | undefined
): string {
  const planetPart = periodPlanet ?? 'none';
  const sourceKey = `${opportunityMode}:${periodLevel}:${planetPart}`;
  return `CAREER_EVENT:${eventType}:${sourceKey}`;
}

/**
 * Builds an event from a qualified opportunity and activating period.
 *
 * EVT-01: Requires qualified opportunity AND activating period.
 * EVT-03: Uses source dates as-is; missing/partial dates → UNTIMED.
 */
function buildOpportunityEvent(
  opportunity: CareerTrajectoryOpportunity,
  period: CareerDashaCanonicalPeriod,
  dashaEvidence: readonly CareerDashaCanonicalEvidence[]
): CareerEvent {
  const eventType: CareerEventType = 'CAREER_OPPORTUNITY_WINDOW';
  const timing = buildTiming(period);

  // Collect evidence IDs: trajectory opportunity evidenceIds + Dasha evidence identityKeys
  const trajectoryEvidenceIds = opportunity.evidenceIds;
  const dashaEvidenceIds = collectDashaEvidenceIds(dashaEvidence, period.level);
  const allEvidenceIds = [...trajectoryEvidenceIds, ...dashaEvidenceIds];
  const sortedEvidenceIds = Object.freeze([...new Set(allEvidenceIds)].sort());

  const eventId = generateEventId(
    eventType,
    opportunity.mode,
    period.level,
    period.planet
  );

  const statement = [
    `Career opportunity window during ${period.level} Dasha.`,
    `Mode: ${opportunity.mode}.`,
    timing.type === 'DASHA_PERIOD_WINDOW'
      ? `Timing: ${timing.start} to ${timing.end}.`
      : 'Timing: untimed (dates unavailable).'
  ].join(' ');

  return Object.freeze({
    eventId,
    eventType,
    status: 'CANDIDATE',
    timing,
    evidenceIds: sortedEvidenceIds,
    statement
  });
}

/**
 * Builds a challenge event from a trajectory opportunity and challenging period.
 *
 * Requires qualified opportunity (qualified trajectories can face challenges during challenging periods).
 * EVT-02: Only CHALLENGES effect with CHALLENGE direction produces a challenge event.
 */
function buildChallengeEvent(
  opportunity: CareerTrajectoryOpportunity,
  period: CareerDashaCanonicalPeriod,
  dashaEvidence: readonly CareerDashaCanonicalEvidence[]
): CareerEvent {
  const eventType: CareerEventType = 'CAREER_CHALLENGE_WINDOW';
  const timing = buildTiming(period);

  // Collect evidence IDs: trajectory opportunity evidenceIds + Dasha evidence identityKeys
  const trajectoryEvidenceIds = opportunity.evidenceIds;
  const dashaEvidenceIds = collectDashaEvidenceIds(dashaEvidence, period.level);
  const allEvidenceIds = [...trajectoryEvidenceIds, ...dashaEvidenceIds];
  const sortedEvidenceIds = Object.freeze([...new Set(allEvidenceIds)].sort());

  const eventId = generateEventId(
    eventType,
    opportunity.mode,
    period.level,
    period.planet
  );

  const statement = [
    `Career challenge window during ${period.level} Dasha.`,
    `Mode: ${opportunity.mode}.`,
    timing.type === 'DASHA_PERIOD_WINDOW'
      ? `Timing: ${timing.start} to ${timing.end}.`
      : 'Timing: untimed (dates unavailable).'
  ].join(' ');

  return Object.freeze({
    eventId,
    eventType,
    status: 'CANDIDATE',
    timing,
    evidenceIds: sortedEvidenceIds,
    statement
  });
}

/**
 * Builds a conditional event from a CONDITIONAL-direction opportunity and activating period.
 *
 * CONDITIONAL opportunities remain conditional even with activating periods.
 */
function buildConditionalEvent(
  opportunity: CareerTrajectoryOpportunity,
  period: CareerDashaCanonicalPeriod,
  dashaEvidence: readonly CareerDashaCanonicalEvidence[]
): CareerEvent {
  const eventType: CareerEventType = 'CAREER_CONDITIONAL_WINDOW';
  const timing = buildTiming(period);

  // Collect evidence IDs: trajectory opportunity evidenceIds + Dasha evidence identityKeys
  const trajectoryEvidenceIds = opportunity.evidenceIds;
  const dashaEvidenceIds = collectDashaEvidenceIds(dashaEvidence, period.level);
  const allEvidenceIds = [...trajectoryEvidenceIds, ...dashaEvidenceIds];
  const sortedEvidenceIds = Object.freeze([...new Set(allEvidenceIds)].sort());

  const eventId = generateEventId(
    eventType,
    opportunity.mode,
    period.level,
    period.planet
  );

  const statement = [
    `Conditional career window during ${period.level} Dasha.`,
    `Mode: ${opportunity.mode}.`,
    timing.type === 'DASHA_PERIOD_WINDOW'
      ? `Timing: ${timing.start} to ${timing.end}.`
      : 'Timing: untimed (dates unavailable).'
  ].join(' ');

  return Object.freeze({
    eventId,
    eventType,
    status: 'CANDIDATE',
    timing,
    evidenceIds: sortedEvidenceIds,
    statement
  });
}

/**
 * Generates events from trajectory opportunities and Dasha periods.
 *
 * EVT-01: Opportunity-window candidates require qualified opportunity AND activating period.
 * EVT-02: Periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL produce NO event.
 * Never emits an event with zero supporting evidence.
 */
function generateEvents(
  opportunities: readonly CareerTrajectoryOpportunity[],
  dashaAnalysis: {
    md: CareerDashaCanonicalPeriod;
    ad: CareerDashaCanonicalPeriod;
    pd: CareerDashaCanonicalPeriod;
    evidence: readonly CareerDashaCanonicalEvidence[];
  }
): CareerEvent[] {
  const events: CareerEvent[] = [];
  const periods = [
    { level: 'MD' as const, period: dashaAnalysis.md },
    { level: 'AD' as const, period: dashaAnalysis.ad },
    { level: 'PD' as const, period: dashaAnalysis.pd }
  ];

  for (const { level, period } of periods) {
    // EVT-02: Skip periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL
    if (shouldSkipPeriod(period)) {
      continue;
    }

    const isActivating = isActivatingPeriod(period);
    const isChallenging = isChallengingPeriod(period);

    for (const opportunity of opportunities) {
      // EVT-01: Only qualified opportunities can produce events
      if (!isQualifiedOpportunity(opportunity)) {
        continue;
      }

      // No evidence to support this combination
      if (opportunity.evidenceIds.length === 0) {
        continue;
      }

      // Determine event type based on period effect and opportunity direction
      if (isActivating) {
        if (opportunity.direction === 'CONDITIONAL') {
          events.push(buildConditionalEvent(opportunity, period, dashaAnalysis.evidence));
        } else {
          events.push(buildOpportunityEvent(opportunity, period, dashaAnalysis.evidence));
        }
      } else if (isChallenging) {
        events.push(buildChallengeEvent(opportunity, period, dashaAnalysis.evidence));
      }
      // Other effect/direction combinations (e.g., MIXED, NEUTRAL) produce no event
    }
  }

  return events;
}

/**
 * Deduplicates events by event identity (eventId).
 *
 * Merges evidenceIds when events have the same eventId.
 * Throws if same eventId has conflicting payloads (different eventType or timing).
 */
function dedupeEvents(events: readonly CareerEvent[]): readonly CareerEvent[] {
  const eventMap = new Map<string, CareerEvent>();

  for (const event of events) {
    const existing = eventMap.get(event.eventId);
    if (existing) {
      // Check for truly conflicting payloads (eventType or timing)
      if (
        existing.eventType !== event.eventType ||
        JSON.stringify(existing.timing) !== JSON.stringify(event.timing)
      ) {
        throw new Error(
          `Conflicting payloads for same eventId: ${event.eventId}`
        );
      }

      // Merge evidenceIds
      const mergedEvidenceIds = Array.from(
        new Set([...existing.evidenceIds, ...event.evidenceIds])
      ).sort();

      // Update existing event with merged evidence
      eventMap.set(event.eventId, Object.freeze({
        ...existing,
        evidenceIds: Object.freeze(mergedEvidenceIds)
      }));
    } else {
      eventMap.set(event.eventId, event);
    }
  }

  // Sort by eventId with deterministic code-point comparison (not localeCompare)
  const sortedEvents = Array.from(eventMap.values()).sort((a, b) => {
    for (let i = 0; i < Math.min(a.eventId.length, b.eventId.length); i++) {
      const diff = a.eventId.charCodeAt(i) - b.eventId.charCodeAt(i);
      if (diff !== 0) return diff;
    }
    return a.eventId.length - b.eventId.length;
  });

  return Object.freeze(sortedEvents);
}

/**
 * Builds career events analysis from trajectory and Dasha analysis.
 *
 * Validates reasoningVersion === 'P2-09A' for trajectory.
 * Validates reasoningVersion (if present) for Dasha.
 * Returns an Object.freeze result with all nested arrays frozen.
 * guaranteedEventsAvailable is always false.
 */
export function buildCareerEvents(
  input: CareerEventsInput
): CareerEventsAnalysis {
  const { trajectory, dasha } = input;

  // Validate P2-09A contract
  if (trajectory.reasoningVersion !== 'P2-09A') {
    throw new Error(
      `Invalid trajectory reasoningVersion: expected 'P2-09A', got '${trajectory.reasoningVersion}'`
    );
  }

  if (trajectory.domain !== 'CAREER') {
    throw new Error(
      `Invalid trajectory domain: expected 'CAREER', got '${trajectory.domain}'`
    );
  }

  // Generate events from opportunities and Dasha periods
  const rawEvents = generateEvents(trajectory.opportunities, {
    md: dasha.md,
    ad: dasha.ad,
    pd: dasha.pd,
    evidence: dasha.evidence
  });

  // Dedupe and sort events
  const events = dedupeEvents(rawEvents);

  // Collect all evidence IDs
  const allEvidenceIds = events.flatMap(e => e.evidenceIds);
  const sortedEvidenceIds = Object.freeze([...new Set(allEvidenceIds)].sort());

  // Build statement
  const statement = buildStatement(events.length);

  // Return frozen result
  return Object.freeze({
    reasoningVersion: 'P2-09B',
    domain: 'CAREER',
    guaranteedEventsAvailable: false,
    events,
    evidenceIds: sortedEvidenceIds,
    statement
  });
}

/**
 * Builds human-readable summary statement.
 */
function buildStatement(eventCount: number): string {
  return `Career events analysis: ${eventCount} event candidate(s) generated from trajectory opportunities and Dasha activations.`;
}
