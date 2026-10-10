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
  CareerDashaCanonicalEvidence,
  CareerDashaCanonicalAnalysis
} from '../careerDasha/careerDashaCanonicalTypes';

import {
  CAREER_DASHA_CANONICAL_EFFECTS,
  CAREER_DASHA_CANONICAL_ROLES
} from '../careerDasha/careerDashaCanonicalTypes';

import {
  Planet
} from '../../../types';

import {
  REASONING_DIRECTIONS
} from '../../reasoning/reasoningTypes';

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
 * Validates a date string with strict parsing.
 *
 * Accepts two formats:
 * 1. ISO format (from vimshottari engine): e.g., '2020-01-01T00:00:00.000Z'
 * 2. YYYY-MM-DD format (from test fixtures): e.g., '2020-01-01'
 *
 * Rejects impossible calendar dates (e.g., '2020-02-31') by validating round-trip.
 * Returns true if the date is valid, false otherwise.
 */
function isValidDate(dateStr: string | undefined): boolean {
  if (!dateStr) {
    return false;
  }

  // Try ISO format first (from vimshottari.ts: toISOString())
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  if (isoRegex.test(dateStr)) {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return false;
    }
    // Round-trip validation for ISO
    return parsed.toISOString() === dateStr;
  }

  // Try YYYY-MM-DD format (from test fixtures)
  const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (yyyyMmDdRegex.test(dateStr)) {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return false;
    }
    // Round-trip validation for YYYY-MM-DD to catch impossible dates like 2020-02-31
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const roundTrip = `${year}-${month}-${day}`;
    return roundTrip === dateStr;
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
 * Checks if a period has matching Dasha evidence.
 *
 * This verifies period-evidence consistency only by checking if the period
 * has matching Dasha evidence (same level, planet, effect, direction, role).
 * It does NOT verify any relationship between the opportunity and the activation.
 */
function periodHasMatchingEvidence(
  period: CareerDashaCanonicalPeriod,
  dashaEvidence: readonly CareerDashaCanonicalEvidence[]
): boolean {
  const matchingEvidence = collectDashaEvidenceIds(dashaEvidence, period);
  return matchingEvidence.length > 0;
}

/**
 * Builds timing information from a Dasha period.
 *
 * If the period has valid start and end dates, returns a DASHA_PERIOD_WINDOW.
 * Otherwise, returns UNTIMED.
 *
 * Throws if start > end (reversed range).
 * Malformed dates (e.g., '2020-02-31') produce UNTIMED.
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
 * Matches evidence to the exact period by filtering on:
 * - level
 * - planet
 * - effect
 * - direction
 * - role
 *
 * This ensures a SUPPORT event cannot inherit a CHALLENGE evidence identity.
 * If no canonical Dasha evidence matches the period, returns empty array.
 *
 * Returns the identityKey from each evidence item (semantic identity).
 * Never mixes in occurrence IDs, source IDs, rule IDs, or event IDs.
 */
function collectDashaEvidenceIds(
  dashaEvidence: readonly CareerDashaCanonicalEvidence[],
  period: CareerDashaCanonicalPeriod
): readonly string[] {
  const relevantEvidence = dashaEvidence.filter(e =>
    e.level === period.level &&
    e.planet === period.planet &&
    e.effect === period.effect &&
    e.direction === period.direction &&
    e.role === period.role
  );
  const identityKeys = relevantEvidence.map(e => e.identityKey);
  return Object.freeze([...new Set(identityKeys)].sort());
}

/**
 * Generates a stable event ID from domain inputs.
 *
 * Format: 'CAREER_EVENT:{eventType}:{sourceKey}'
 * Where sourceKey is a collision-free JSON encoding of the identity tuple.
 *
 * Discriminator components (all stable semantic inputs, no UUIDs/timestamps):
 * - Event type (e.g., 'CAREER_OPPORTUNITY_WINDOW')
 * - Opportunity mode (e.g., 'MANAGEMENT')
 * - Opportunity evidence IDs (sorted array)
 * - Period level (e.g., 'MD')
 * - Period planet (e.g., 'SUN') - null if missing
 * - Period start date (if available, from source) - null if missing
 * - Period end date (if available, from source) - null if missing
 *
 * Uses JSON.stringify with a fixed-order tuple, where evidenceIds is a nested array.
 * Array boundaries provide structural delimiters, making the encoding unambiguous
 * even if evidence IDs contain literal ':' or '|' characters.
 *
 * This ensures distinct semantic opportunities and distinct period windows cannot collapse.
 *
 * IMPORTANT: Event ID identity reflects the SOURCE period (raw periodStart/periodEnd strings),
 * NOT the normalized timing. Two periods with different invalid/partial date strings will
 * produce distinct eventIds even though buildTiming collapses both to UNTIMED timing.
 * This is intentional: identity captures the source period specification, while timing
 * represents the normalized result. A period with 'invalid-date' and a period with 'partial-date'
 * are distinct source inputs even if both become UNTIMED after normalization.
 */
function generateEventId(
  eventType: CareerEventType,
  opportunityMode: string,
  opportunityEvidenceIds: readonly string[],
  periodLevel: string,
  periodPlanet: string | undefined,
  periodStart: string | undefined,
  periodEnd: string | undefined
): string {
  // Sort evidenceIds inside this function to ensure deterministic output
  const sortedEvidenceIds = [...opportunityEvidenceIds].sort();

  // Encode identity tuple as JSON with fixed field order
  // Nested array for evidenceIds provides structural boundaries
  const identityTuple = [
    eventType,
    opportunityMode,
    sortedEvidenceIds,
    periodLevel,
    periodPlanet ?? null,
    periodStart ?? null,
    periodEnd ?? null
  ] as const;

  const sourceKey = JSON.stringify(identityTuple);
  return `CAREER_EVENT:${sourceKey}`;
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
  const dashaEvidenceIds = collectDashaEvidenceIds(dashaEvidence, period);
  const allEvidenceIds = [...trajectoryEvidenceIds, ...dashaEvidenceIds];
  const sortedEvidenceIds = Object.freeze([...new Set(allEvidenceIds)].sort());

  const eventId = generateEventId(
    eventType,
    opportunity.mode,
    trajectoryEvidenceIds,
    period.level,
    period.planet,
    period.start,
    period.end
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
    ruleIds: Object.freeze(['P2-09B-EVT-01']),
    statement
  });
}

/**
 * Builds a challenge event from a challenging period.
 *
 * EVT-02: Only CHALLENGES effect with CHALLENGE direction produces a challenge event.
 *
 * CHALLENGE SEMANTICS: Challenge events are independent of qualified opportunities.
 * They are generated whenever a period has matching canonical CHALLENGE evidence,
 * regardless of whether any qualified opportunity exists. Challenge events use ONLY
 * the period's canonical CHALLENGE evidence (matched by level, planet, effect, direction, role).
 * They do NOT include any opportunity evidenceIds. This preserves separate evidence roles.
 */
function buildChallengeEvent(
  period: CareerDashaCanonicalPeriod,
  dashaEvidence: readonly CareerDashaCanonicalEvidence[]
): CareerEvent {
  const eventType: CareerEventType = 'CAREER_CHALLENGE_WINDOW';
  const timing = buildTiming(period);

  // Collect evidence IDs: ONLY Dasha CHALLENGE evidence (matched to period)
  const dashaEvidenceIds = collectDashaEvidenceIds(dashaEvidence, period);
  const sortedEvidenceIds = Object.freeze([...dashaEvidenceIds]);

  // EventId derived from period identity only (no opportunity dependency)
  const eventId = generateEventId(
    eventType,
    'CHALLENGE', // Fixed mode for challenge events
    [], // No opportunity evidenceIds
    period.level,
    period.planet,
    period.start,
    period.end
  );

  const statement = [
    `Career challenge window during ${period.level} Dasha.`,
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
    ruleIds: Object.freeze(['P2-09B-EVT-02']),
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
  const dashaEvidenceIds = collectDashaEvidenceIds(dashaEvidence, period);
  const allEvidenceIds = [...trajectoryEvidenceIds, ...dashaEvidenceIds];
  const sortedEvidenceIds = Object.freeze([...new Set(allEvidenceIds)].sort());

  const eventId = generateEventId(
    eventType,
    opportunity.mode,
    trajectoryEvidenceIds,
    period.level,
    period.planet,
    period.start,
    period.end
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
    ruleIds: Object.freeze(['P2-09B-EVT-01']),
    statement
  });
}

/**
 * Generates events from trajectory opportunities and Dasha periods.
 *
 * EVT-01: Opportunity-window candidates require qualified opportunity AND activating period.
 * EVT-02: Periods with UNKNOWN/INSUFFICIENT_DATA/UNAVAILABLE/NEUTRAL produce NO event.
 * Challenge events are independent of qualified opportunities (generated from challenging periods directly).
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

    // Generate challenge events independently of opportunities
    if (isChallenging) {
      const challengeEvidenceIds = collectDashaEvidenceIds(dashaAnalysis.evidence, period);
      if (challengeEvidenceIds.length > 0) {
        events.push(buildChallengeEvent(period, dashaAnalysis.evidence));
      }
    }

    // Generate opportunity events from qualified opportunities
    if (isActivating) {
      for (const opportunity of opportunities) {
        // EVT-01: Only qualified opportunities can produce events
        if (!isQualifiedOpportunity(opportunity)) {
          continue;
        }

        // For activating periods, require opportunity evidence
        if (opportunity.evidenceIds.length === 0) {
          continue;
        }

        // Check if period has matching Dasha evidence
        if (!periodHasMatchingEvidence(period, dashaAnalysis.evidence)) {
          continue;
        }

        if (opportunity.direction === 'CONDITIONAL') {
          events.push(buildConditionalEvent(opportunity, period, dashaAnalysis.evidence));
        } else {
          events.push(buildOpportunityEvent(opportunity, period, dashaAnalysis.evidence));
        }
      }
    }
    // Other effect/direction combinations (e.g., MIXED, NEUTRAL) produce no event
  }

  return events;
}

/**
 * Deduplicates events by event identity (eventId).
 *
 * Merges evidenceIds and ruleIds when events have the same eventId.
 * Throws if same eventId has conflicting payloads (different eventType, timing, status, or statement).
 *
 * Payload-identity fields that must agree before merge: eventType, timing, status, statement.
 * Only evidenceIds and ruleIds are intentionally mergeable (union + sort).
 *
 * Exported for direct unit testing.
 */
export function dedupeEvents(events: readonly CareerEvent[]): readonly CareerEvent[] {
  const eventMap = new Map<string, CareerEvent>();

  for (const event of events) {
    const existing = eventMap.get(event.eventId);
    if (existing) {
      // Check for truly conflicting payloads (all payload-identity fields must agree)
      if (
        existing.eventType !== event.eventType ||
        JSON.stringify(existing.timing) !== JSON.stringify(event.timing) ||
        existing.status !== event.status ||
        existing.statement !== event.statement
      ) {
        throw new Error(
          `Conflicting payloads for same eventId: ${event.eventId}`
        );
      }

      // Merge evidenceIds
      const mergedEvidenceIds = Array.from(
        new Set([...existing.evidenceIds, ...event.evidenceIds])
      ).sort();

      // Merge ruleIds
      const mergedRuleIds = Array.from(
        new Set([...existing.ruleIds, ...event.ruleIds])
      ).sort();

      // Update existing event with merged evidence and rules
      eventMap.set(event.eventId, Object.freeze({
        ...existing,
        evidenceIds: Object.freeze(mergedEvidenceIds),
        ruleIds: Object.freeze(mergedRuleIds)
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
 * Validates Dasha canonical analysis structure.
 *
 * Ensures periods are present and well-formed.
 * Validates that each period's level matches its slot.
 * Validates that effect, direction, and role are members of their respective unions.
 * Validates that each evidence item has a non-empty identityKey and valid level.
 * Validates that periods and evidence items are non-null objects.
 * Validates planet field (if present) is a valid Planet member.
 * Validates start/end fields (if present) are strings.
 */
function validateDashaAnalysis(dasha: CareerDashaCanonicalAnalysis): void {
  if (!dasha.md || !dasha.ad || !dasha.pd) {
    throw new Error('Dasha analysis must include md, ad, and pd periods');
  }

  if (!Array.isArray(dasha.evidence)) {
    throw new Error('Dasha analysis must include evidence array');
  }

  // Validate periods are non-null objects
  for (const [slot, period] of [['md', dasha.md], ['ad', dasha.ad], ['pd', dasha.pd]] as const) {
    if (period === null || typeof period !== 'object') {
      throw new Error(`Invalid ${slot} period: must be a non-null object`);
    }
  }

  // Validate period level matches slot
  if (dasha.md.level !== 'MD') {
    throw new Error(`Invalid MD period level: expected 'MD', got '${dasha.md.level}'`);
  }
  if (dasha.ad.level !== 'AD') {
    throw new Error(`Invalid AD period level: expected 'AD', got '${dasha.ad.level}'`);
  }
  if (dasha.pd.level !== 'PD') {
    throw new Error(`Invalid PD period level: expected 'PD', got '${dasha.pd.level}'`);
  }

  // Validate effect values
  const validEffects = new Set(CAREER_DASHA_CANONICAL_EFFECTS);
  for (const [slot, period] of [['md', dasha.md], ['ad', dasha.ad], ['pd', dasha.pd]] as const) {
    if (!validEffects.has(period.effect)) {
      throw new Error(`Invalid ${slot} period effect: '${period.effect}' is not a valid effect`);
    }
  }

  // Validate direction values
  const validDirections = new Set(REASONING_DIRECTIONS);
  for (const [slot, period] of [['md', dasha.md], ['ad', dasha.ad], ['pd', dasha.pd]] as const) {
    if (!validDirections.has(period.direction)) {
      throw new Error(`Invalid ${slot} period direction: '${period.direction}' is not a valid direction`);
    }
  }

  // Validate role values
  const validRoles = new Set(CAREER_DASHA_CANONICAL_ROLES);
  for (const [slot, period] of [['md', dasha.md], ['ad', dasha.ad], ['pd', dasha.pd]] as const) {
    if (!validRoles.has(period.role)) {
      throw new Error(`Invalid ${slot} period role: '${period.role}' is not a valid role`);
    }
  }

  // Validate planet field (if present) is a valid Planet member
  const validPlanets = new Set(Object.values(Planet));
  for (const [slot, period] of [['md', dasha.md], ['ad', dasha.ad], ['pd', dasha.pd]] as const) {
    if (period.planet !== undefined && !validPlanets.has(period.planet)) {
      throw new Error(`Invalid ${slot} period planet: '${period.planet}' is not a valid Planet`);
    }
  }

  // Validate start/end fields (if present) are strings
  for (const [slot, period] of [['md', dasha.md], ['ad', dasha.ad], ['pd', dasha.pd]] as const) {
    if (period.start !== undefined && typeof period.start !== 'string') {
      throw new Error(`Invalid ${slot} period start: must be a string if present`);
    }
    if (period.end !== undefined && typeof period.end !== 'string') {
      throw new Error(`Invalid ${slot} period end: must be a string if present`);
    }
  }

  // Validate evidence items
  const validLevels = new Set(['MD', 'AD', 'PD']);
  for (let i = 0; i < dasha.evidence.length; i++) {
    const evidence = dasha.evidence[i];

    // Check evidence is a non-null object
    if (evidence === null || typeof evidence !== 'object') {
      throw new Error(`Evidence at index ${i} must be a non-null object`);
    }

    // Check non-empty identityKey
    if (!evidence.identityKey || typeof evidence.identityKey !== 'string' || evidence.identityKey.trim() === '') {
      throw new Error(`Evidence at index ${i} has empty or invalid identityKey`);
    }

    // Check valid level
    if (!validLevels.has(evidence.level)) {
      throw new Error(`Evidence at index ${i} has invalid level: '${evidence.level}' (must be MD, AD, or PD)`);
    }

    // Validate evidence effect
    if (!validEffects.has(evidence.effect)) {
      throw new Error(`Evidence at index ${i} has invalid effect: '${evidence.effect}' is not a valid effect`);
    }

    // Validate evidence direction
    if (!validDirections.has(evidence.direction)) {
      throw new Error(`Evidence at index ${i} has invalid direction: '${evidence.direction}' is not a valid direction`);
    }

    // Validate evidence role
    if (!validRoles.has(evidence.role)) {
      throw new Error(`Evidence at index ${i} has invalid role: '${evidence.role}' is not a valid role`);
    }
  }
}

/**
 * Builds career events analysis from trajectory and Dasha analysis.
 *
 * Validates reasoningVersion === 'P2-09A' for trajectory.
 * Validates Dasha analysis structure.
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

  // Validate Dasha analysis structure
  validateDashaAnalysis(dasha);

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
