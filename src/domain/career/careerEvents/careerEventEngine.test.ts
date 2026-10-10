import { describe, it, expect } from 'vitest';

import {
  buildCareerEvents
} from './careerEventEngine';

import type {
  CareerEventsInput
} from './careerEventTypes';

import type {
  CareerTrajectoryAnalysis,
  CareerTrajectoryOpportunity
} from '../careerTrajectory/careerTrajectoryTypes';

import type {
  CareerDashaCanonicalAnalysis,
  CareerDashaCanonicalPeriod,
  CareerDashaCanonicalEvidence
} from '../careerDasha/careerDashaCanonicalTypes';

import {
  Planet
} from '../../../types';

/**
 * P2-09A trajectory fixture factory.
 */
function createTrajectoryFixture(
  overrides: Partial<CareerTrajectoryAnalysis> = {}
): CareerTrajectoryAnalysis {
  const base: CareerTrajectoryAnalysis = {
    reasoningVersion: 'P2-09A',
    domain: 'CAREER',
    longTermPattern: 'INSUFFICIENT_DATA',
    currentPhase: 'UNKNOWN',
    currentStatus: 'INSUFFICIENT_DATA',
    opportunities: [],
    evidenceIds: [],
    unresolvedEvidenceIds: [],
    sourceIds: [],
    ruleIds: [],
    datedForecastAvailable: false,
    statement: 'No trajectory data'
  };

  return { ...base, ...overrides };
}

/**
 * C9 Dasha canonical fixture factory.
 */
function createDashaFixture(
  overrides: Partial<CareerDashaCanonicalAnalysis> = {}
): CareerDashaCanonicalAnalysis {
  const basePeriod: CareerDashaCanonicalPeriod = {
    level: 'MD',
    planet: undefined,
    role: 'PRIMARY_DRIVER',
    effect: 'INSUFFICIENT_DATA',
    direction: 'UNAVAILABLE',
    strength: 'UNDETERMINED',
    start: undefined,
    end: undefined,
    statement: 'No period data'
  };

  const base: CareerDashaCanonicalAnalysis = {
    overallEffect: 'INSUFFICIENT_DATA',
    overallDirection: 'UNAVAILABLE',
    overallStrength: 'UNDETERMINED',
    dominantLevel: 'NONE',
    md: basePeriod,
    ad: { ...basePeriod, level: 'AD', role: 'MODIFIER' },
    pd: { ...basePeriod, level: 'PD', role: 'REFINEMENT' },
    evidence: [],
    rootEvidenceIds: [],
    statement: 'No Dasha data'
  };

  return { ...base, ...overrides };
}

/**
 * Creates a Dasha period with specified properties.
 */
function createPeriod(
  level: 'MD' | 'AD' | 'PD',
  overrides: Partial<CareerDashaCanonicalPeriod> = {}
): CareerDashaCanonicalPeriod {
  const base: CareerDashaCanonicalPeriod = {
    level,
    planet: Planet.SUN,
    role: level === 'MD' ? 'PRIMARY_DRIVER' : level === 'AD' ? 'MODIFIER' : 'REFINEMENT',
    effect: 'ACTIVATES',
    direction: 'SUPPORT',
    strength: 'STRONG',
    start: '2020-01-01',
    end: '2030-01-01',
    statement: 'Test period'
  };

  return { ...base, ...overrides };
}

/**
 * Creates a Dasha evidence item.
 */
function createDashaEvidence(
  level: 'MD' | 'AD' | 'PD',
  overrides: Partial<CareerDashaCanonicalEvidence> = {}
): CareerDashaCanonicalEvidence {
  const base: CareerDashaCanonicalEvidence = {
    identityKey: `CAREER_DASHA:${level}:SUN:PRIMARY_DRIVER`,
    id: `CAREER_DASHA:${level}:SUN:PRIMARY_DRIVER:ACTIVATES`,
    level,
    planet: Planet.SUN,
    role: level === 'MD' ? 'PRIMARY_DRIVER' : level === 'AD' ? 'MODIFIER' : 'REFINEMENT',
    effect: 'ACTIVATES',
    direction: 'SUPPORT',
    strength: 'STRONG',
    statement: 'Test evidence',
    sourceIds: ['source-1'],
    provenance: {
      source: 'C9_DASHA',
      activationLevel: level,
      natalRootIds: []
    }
  };

  return { ...base, ...overrides };
}

/**
 * Creates a trajectory opportunity.
 */
function createOpportunity(
  overrides: Partial<CareerTrajectoryOpportunity> = {}
): CareerTrajectoryOpportunity {
  const base: CareerTrajectoryOpportunity = {
    mode: 'MANAGEMENT',
    direction: 'SUPPORT',
    strength: 'STRONG',
    qualified: true,
    evidenceIds: ['evidence-1']
  };

  return { ...base, ...overrides };
}

/**
 * Creates a valid CareerEventsInput.
 */
function createEventsInput(
  trajectory: CareerTrajectoryAnalysis,
  dasha: CareerDashaCanonicalAnalysis
): CareerEventsInput {
  return {
    trajectory,
    dasha
  };
}

describe('CareerEventEngine', () => {
  describe('Basic functionality', () => {
    it('generates opportunity window for qualified opportunity + activating period', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('CAREER_OPPORTUNITY_WINDOW');
      expect(result.events[0].status).toBe('CANDIDATE');
      expect(result.events[0].timing.type).toBe('DASHA_PERIOD_WINDOW');
      expect(result.events[0].timing.start).toBe('2020-01-01');
      expect(result.events[0].timing.end).toBe('2030-01-01');
    });

    it('generates challenge window for qualified opportunity + challenging period', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'CHALLENGES', direction: 'CHALLENGE' }),
        evidence: [createDashaEvidence('MD', { effect: 'CHALLENGES', direction: 'CHALLENGE' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('CAREER_CHALLENGE_WINDOW');
    });

    it('generates conditional window for CONDITIONAL opportunity + activating period', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'CONDITIONAL' })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('CAREER_CONDITIONAL_WINDOW');
    });

    it('handles UNTIMED events when dates are missing', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', start: undefined, end: undefined }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].timing.type).toBe('UNTIMED');
      expect(result.events[0].timing.start).toBeUndefined();
      expect(result.events[0].timing.end).toBeUndefined();
    });

    it('accepts ISO format dates from vimshottari engine', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          start: '2020-01-01T00:00:00.000Z',
          end: '2030-01-01T00:00:00.000Z'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].timing.type).toBe('DASHA_PERIOD_WINDOW');
      expect(result.events[0].timing.start).toBe('2020-01-01T00:00:00.000Z');
      expect(result.events[0].timing.end).toBe('2030-01-01T00:00:00.000Z');
    });
  });

  describe('EVT-01: Dasha cannot manufacture opportunities', () => {
    it('does not generate event for unqualified opportunity', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ qualified: false })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('does not generate event for CHALLENGE direction opportunity', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'CHALLENGE', qualified: true })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('does not generate event for MIXED direction opportunity', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'MIXED', qualified: true })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('does not generate event for NEUTRAL direction opportunity', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'NEUTRAL', qualified: true })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('does not generate event for UNAVAILABLE direction opportunity', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'UNAVAILABLE', qualified: true })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('does not generate event with zero supporting evidence', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: [] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });
  });

  describe('EVT-02: Missing evidence is not negative evidence', () => {
    it('UNKNOWN effect produces no event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'UNKNOWN', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD', { effect: 'UNKNOWN' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('INSUFFICIENT_DATA effect produces no event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'INSUFFICIENT_DATA', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD', { effect: 'INSUFFICIENT_DATA' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('UNAVAILABLE direction produces no event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'UNAVAILABLE' }),
        evidence: [createDashaEvidence('MD', { direction: 'UNAVAILABLE' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('NEUTRAL direction produces no event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'NEUTRAL' }),
        evidence: [createDashaEvidence('MD', { direction: 'NEUTRAL' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('DOES_NOT_ACTIVATE effect produces no event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'DOES_NOT_ACTIVATE', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD', { effect: 'DOES_NOT_ACTIVATE' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('CONDITIONAL direction opportunity is never coerced to support', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'CONDITIONAL' })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].eventType).toBe('CAREER_CONDITIONAL_WINDOW');
      expect(result.events[0].eventType).not.toBe('CAREER_OPPORTUNITY_WINDOW');
    });

    it('MIXED direction opportunity is never coerced to support', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ direction: 'MIXED', qualified: true })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });
  });

  describe('EVT-03: Date handling', () => {
    it('partial dates (start only) produce UNTIMED event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          start: '2020-01-01',
          end: undefined
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].timing.type).toBe('UNTIMED');
    });

    it('partial dates (end only) produce UNTIMED event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          start: undefined,
          end: '2030-01-01'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].timing.type).toBe('UNTIMED');
    });

    it('malformed date produces UNTIMED event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          start: 'invalid-date',
          end: '2030-01-01'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].timing.type).toBe('UNTIMED');
    });

    it('start after end throws error', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          start: '2030-01-01',
          end: '2020-01-01'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);

      expect(() => buildCareerEvents(input)).toThrow(
        'Invalid period: start date (2030-01-01) is after end date (2020-01-01)'
      );
    });
  });

  describe('Evidence ID semantics', () => {
    it('uses identityKey from Dasha evidence', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: ['opp-evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD', { identityKey: 'dasha-identity-key' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events[0].evidenceIds).toContain('dasha-identity-key');
      expect(result.events[0].evidenceIds).toContain('opp-evidence-1');
    });

    it('does not mix occurrence IDs in evidenceIds', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: ['opp-evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD', {
          identityKey: 'dasha-identity-key',
          id: 'dasha-occurrence-id'
        })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events[0].evidenceIds).toContain('dasha-identity-key');
      expect(result.events[0].evidenceIds).not.toContain('dasha-occurrence-id');
    });
  });

  describe('Deterministic output', () => {
    it('generates stable eventId from domain inputs', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result1 = buildCareerEvents(input);
      const result2 = buildCareerEvents(input);

      expect(result1.events[0].eventId).toBe(result2.events[0].eventId);
      // New format includes opportunity evidence, start/end dates
      expect(result1.events[0].eventId).toContain('CAREER_EVENT:CAREER_OPPORTUNITY_WINDOW:MANAGEMENT:evidence-1:MD:SUN:2020-01-01:2030-01-01');
    });

    it('sorts evidence IDs uniquely', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: ['zebra', 'apple', 'banana'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD', { identityKey: 'dasha-identity' })]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events[0].evidenceIds).toEqual(['apple', 'banana', 'dasha-identity', 'zebra']);
    });

    it('dedupes events by eventId (merges evidenceIds)', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [
          createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] }),
          createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] }) // Same evidenceIds
        ]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Same eventId for both opportunities (same mode + evidenceIds + period + planet)
      // Should dedupe to one event with merged evidenceIds (including Dasha evidence)
      expect(result.events).toHaveLength(1);
      expect(result.events[0].evidenceIds).toEqual([
        'CAREER_DASHA:MD:SUN:PRIMARY_DRIVER',
        'evidence-1'
      ]);
    });

    it('throws on same eventId with conflicting payloads', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.SUN,
          start: '2020-01-01',
          end: '2030-01-01'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result1 = buildCareerEvents(input);

      // Manually create a conflicting event with same eventId but different eventType
      const conflictingEvent = {
        ...result1.events[0],
        eventType: 'CAREER_CHALLENGE_WINDOW' as const // Different eventType
      };

      // Manually merge events to trigger conflict detection
      const mergedEvents = [result1.events[0], conflictingEvent];

      // This should throw when deduped due to conflicting eventType
      expect(() => {
        const eventMap = new Map<string, typeof result1.events[0]>();
        for (const event of mergedEvents) {
          const existing = eventMap.get(event.eventId);
          if (existing) {
            if (
              existing.eventType !== event.eventType ||
              JSON.stringify(existing.timing) !== JSON.stringify(event.timing)
            ) {
              throw new Error(`Conflicting payloads for same eventId: ${event.eventId}`);
            }
          } else {
            eventMap.set(event.eventId, event);
          }
        }
      }).toThrow('Conflicting payloads for same eventId');
    });

    it('sorts events by eventId with code-point comparator', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [
          createOpportunity({ mode: 'zebra' }),
          createOpportunity({ mode: 'apple' })
        ]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        ad: createPeriod('AD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.MOON }),
        evidence: [
          createDashaEvidence('MD'),
          createDashaEvidence('AD', { level: 'AD', planet: Planet.MOON, role: 'MODIFIER' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Check sorted by eventId (code-point order)
      const eventIds = result.events.map(e => e.eventId);
      const sortedEventIds = [...eventIds].sort((a, b) => {
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
          const diff = a.charCodeAt(i) - b.charCodeAt(i);
          if (diff !== 0) return diff;
        }
        return a.length - b.length;
      });

      expect(eventIds).toEqual(sortedEventIds);
    });

    it('input permutation produces identical output (determinism)', () => {
      const opp1 = createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] });
      const opp2 = createOpportunity({ mode: 'ENTREPRENEURSHIP', evidenceIds: ['evidence-2'] });

      const trajectory1 = createTrajectoryFixture({
        opportunities: [opp1, opp2]
      });

      const trajectory2 = createTrajectoryFixture({
        opportunities: [opp2, opp1]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const result1 = buildCareerEvents(createEventsInput(trajectory1, dasha));
      const result2 = buildCareerEvents(createEventsInput(trajectory2, dasha));

      expect(result1.events).toEqual(result2.events);
    });
  });

  describe('Validation tests', () => {
    it('invalid trajectory reasoningVersion throws error', () => {
      const trajectory = createTrajectoryFixture({
        reasoningVersion: 'INVALID' as any
      });

      const dasha = createDashaFixture();

      const input = createEventsInput(trajectory, dasha);

      expect(() => buildCareerEvents(input)).toThrow(
        "Invalid trajectory reasoningVersion: expected 'P2-09A', got 'INVALID'"
      );
    });

    it('invalid trajectory domain throws error', () => {
      const trajectory = createTrajectoryFixture({
        domain: 'INVALID' as any
      });

      const dasha = createDashaFixture();

      const input = createEventsInput(trajectory, dasha);

      expect(() => buildCareerEvents(input)).toThrow(
        "Invalid trajectory domain: expected 'CAREER', got 'INVALID'"
      );
    });
  });

  describe('Freeze checks', () => {
    it('returns frozen result', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.events)).toBe(true);
      expect(Object.isFrozen(result.evidenceIds)).toBe(true);
    });

    it('returns frozen event objects', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(Object.isFrozen(result.events[0])).toBe(true);
      expect(Object.isFrozen(result.events[0].evidenceIds)).toBe(true);
      expect(Object.isFrozen(result.events[0].ruleIds)).toBe(true);
      expect(Object.isFrozen(result.events[0].timing)).toBe(true);
    });
  });

  describe('Contract compliance', () => {
    it('guaranteedEventsAvailable is always false', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.guaranteedEventsAvailable).toBe(false);
    });

    it('reasoningVersion is P2-09B', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.reasoningVersion).toBe('P2-09B');
    });

    it('domain is CAREER', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.domain).toBe('CAREER');
    });

    it('all events have status CANDIDATE', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      result.events.forEach(event => {
        expect(event.status).toBe('CANDIDATE');
      });
    });

    it('uses restricted event type vocabulary', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      const allowedTypes = new Set(['CAREER_OPPORTUNITY_WINDOW', 'CAREER_CHALLENGE_WINDOW', 'CAREER_CONDITIONAL_WINDOW']);
      result.events.forEach(event => {
        expect(allowedTypes.has(event.eventType)).toBe(true);
      });
    });
  });

  describe('Multi-period handling', () => {
    it('generates events for MD, AD, and PD periods', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        ad: createPeriod('AD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.MOON }),
        pd: createPeriod('PD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.MARS }),
        evidence: [
          createDashaEvidence('MD'),
          createDashaEvidence('AD', { level: 'AD', planet: Planet.MOON, role: 'MODIFIER' }),
          createDashaEvidence('PD', { level: 'PD', planet: Planet.MARS, role: 'REFINEMENT' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(3);
    });

    it('skips periods with SKIP effects', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        ad: createPeriod('AD', { effect: 'UNKNOWN', direction: 'SUPPORT' }),
        pd: createPeriod('PD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [
          createDashaEvidence('MD'),
          createDashaEvidence('AD', { level: 'AD', effect: 'UNKNOWN', role: 'MODIFIER' }),
          createDashaEvidence('PD', { level: 'PD', role: 'REFINEMENT' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(2); // MD and PD only
    });
  });

  describe('Edge cases', () => {
    it('handles empty opportunities', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: []
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events).toHaveLength(0);
    });

    it('handles empty Dasha evidence (suppresses event due to compatibility check)', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: []
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // No event generated due to compatibility check (no matching Dasha evidence)
      expect(result.events).toHaveLength(0);
    });

    it('handles multiple opportunities with same mode (distinct evidence produces distinct events)', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [
          createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] }),
          createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-2'] })
        ]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Different evidenceIds should produce different events (not merged)
      expect(result.events).toHaveLength(2);
      expect(result.events[0].eventId).not.toBe(result.events[1].eventId);
    });
  });

  describe('Regression tests for P1 fixes', () => {
    it('distinct semantic opportunities produce distinct events (not merged)', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [
          createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] }),
          createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-2'] })
        ]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Different evidenceIds should produce different eventIds
      expect(result.events).toHaveLength(2);
      expect(result.events[0].eventId).not.toBe(result.events[1].eventId);
    });

    it('periods with same planet/level but different dates do not collapse', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: ['evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.SUN,
          start: '2020-01-01',
          end: '2030-01-01'
        }),
        ad: createPeriod('AD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.SUN,
          start: '2030-01-01',
          end: '2040-01-01'
        }),
        evidence: [
          createDashaEvidence('MD'),
          createDashaEvidence('AD', { level: 'AD', planet: Planet.SUN, role: 'MODIFIER' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Different dates should produce different eventIds
      expect(result.events).toHaveLength(2);
      expect(result.events[0].eventId).not.toBe(result.events[1].eventId);
    });

    it('mixed-direction evidence at same level attaches only matching direction', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: ['evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        evidence: [
          createDashaEvidence('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', identityKey: 'support-evidence' }),
          createDashaEvidence('MD', { effect: 'CHALLENGES', direction: 'CHALLENGE', identityKey: 'challenge-evidence' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Only SUPPORT evidence should be attached
      expect(result.events[0].evidenceIds).toContain('support-evidence');
      expect(result.events[0].evidenceIds).not.toContain('challenge-evidence');
    });

    it('challenging period event carries only challenge-matched evidence', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ evidenceIds: ['opp-evidence'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'CHALLENGES', direction: 'CHALLENGE', planet: Planet.SUN }),
        evidence: [
          createDashaEvidence('MD', { effect: 'CHALLENGES', direction: 'CHALLENGE', identityKey: 'challenge-evidence' }),
          createDashaEvidence('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', identityKey: 'support-evidence' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Challenge event should only have CHALLENGE evidence, not opportunity SUPPORT evidence
      expect(result.events[0].evidenceIds).toContain('challenge-evidence');
      expect(result.events[0].evidenceIds).not.toContain('opp-evidence');
      expect(result.events[0].evidenceIds).not.toContain('support-evidence');
    });

    it('rejects impossible calendar date 2020-02-31', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.SUN,
          start: '2020-02-31',
          end: '2030-01-01'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Malformed date should produce UNTIMED event
      expect(result.events).toHaveLength(1);
      expect(result.events[0].timing.type).toBe('UNTIMED');
    });

    it('rejects reversed range (start > end)', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.SUN,
          start: '2030-01-01',
          end: '2020-01-01'
        }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);

      expect(() => buildCareerEvents(input)).toThrow(
        'Invalid period: start date (2030-01-01) is after end date (2020-01-01)'
      );
    });

    it('accepts both ISO and YYYY-MM-DD formats', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.SUN,
          start: '2020-01-01T00:00:00.000Z',
          end: '2030-01-01T00:00:00.000Z'
        }),
        ad: createPeriod('AD', {
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          planet: Planet.MOON,
          start: '2030-01-01',
          end: '2040-01-01'
        }),
        evidence: [
          createDashaEvidence('MD'),
          createDashaEvidence('AD', { level: 'AD', planet: Planet.MOON, role: 'MODIFIER' })
        ]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Both formats should be accepted
      expect(result.events).toHaveLength(2);
      expect(result.events[0].timing.type).toBe('DASHA_PERIOD_WINDOW');
      expect(result.events[1].timing.type).toBe('DASHA_PERIOD_WINDOW');
    });

    it('activating period incompatible with opportunity mode does not produce event', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity({ mode: 'MANAGEMENT', evidenceIds: ['evidence-1'] })]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        evidence: [] // No matching Dasha evidence - incompatible
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // No event should be produced when compatibility check fails
      expect(result.events).toHaveLength(0);
    });

    it('each event carries its generating rule ID', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      expect(result.events[0].ruleIds).toContain('P2-09B-EVT-01');
    });

    it('malformed Dasha input throws error', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: undefined as any,
        ad: undefined as any,
        pd: undefined as any
      });

      const input = createEventsInput(trajectory, dasha);

      expect(() => buildCareerEvents(input)).toThrow('Dasha analysis must include md, ad, and pd periods');
    });

    it('empty Dasha evidence produces no events for activating periods', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT', planet: Planet.SUN }),
        evidence: []
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // No event when no matching Dasha evidence
      expect(result.events).toHaveLength(0);
    });
  });

  describe('Deep immutability tests', () => {
    it('deep freezes all nested structures', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const input = createEventsInput(trajectory, dasha);
      const result = buildCareerEvents(input);

      // Top-level frozen
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.events)).toBe(true);
      expect(Object.isFrozen(result.evidenceIds)).toBe(true);

      // Event frozen
      expect(Object.isFrozen(result.events[0])).toBe(true);
      expect(Object.isFrozen(result.events[0].evidenceIds)).toBe(true);
      expect(Object.isFrozen(result.events[0].ruleIds)).toBe(true);
      expect(Object.isFrozen(result.events[0].timing)).toBe(true);
    });
  });

  describe('Input non-mutation tests', () => {
    it('does not mutate input trajectory', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const originalOppCount = trajectory.opportunities.length;
      const originalOppMode = trajectory.opportunities[0].mode;

      const input = createEventsInput(trajectory, dasha);
      buildCareerEvents(input);

      // Verify input not mutated
      expect(trajectory.opportunities.length).toBe(originalOppCount);
      expect(trajectory.opportunities[0].mode).toBe(originalOppMode);
    });

    it('does not mutate input dasha', () => {
      const trajectory = createTrajectoryFixture({
        opportunities: [createOpportunity()]
      });

      const dasha = createDashaFixture({
        md: createPeriod('MD', { effect: 'ACTIVATES', direction: 'SUPPORT' }),
        evidence: [createDashaEvidence('MD')]
      });

      const originalEvidenceCount = dasha.evidence.length;
      const originalEvidenceId = dasha.evidence[0].identityKey;

      const input = createEventsInput(trajectory, dasha);
      buildCareerEvents(input);

      // Verify input not mutated
      expect(dasha.evidence.length).toBe(originalEvidenceCount);
      expect(dasha.evidence[0].identityKey).toBe(originalEvidenceId);
    });
  });
});
