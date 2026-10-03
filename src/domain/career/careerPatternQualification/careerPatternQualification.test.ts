import {
  qualifyCareerPatterns
} from './careerPatternQualification';
import type {
  CareerPatternQualificationInput,
  CareerPatternParticipantQualification
} from './careerPatternQualificationTypes';
import {
  mapPlanetaryCondition,
  mapCareerRelevance,
  classifyStructuralStrength,
  classifyActivationPotential,
  classifyDivisionalConfirmation,
  classifyPatternCoherence,
  classifyQualificationStatus
} from './careerPatternQualificationRules';
import type {
  CareerPattern,
  CareerPatternClassificationEvidence
} from '../careerPattern/careerPatternTypes';
import type {
  CareerPlanetaryRelevance,
  CareerPlanetRelevance
} from '../careerPlanetaryRelevance';
import type {
  CareerPlanetaryConditionResult
} from '../careerPlanetaryCondition';
import { Planet } from '../../../types';
import type { CareerNetworkTopology, CareerNetworkDirection } from '../careerGraph/careerHouseNetworkTypes';

/**
 * Helper: Creates a minimal CareerPattern for testing.
 */
function makePattern(
  overrides: Partial<CareerPattern> = {}
): CareerPattern {
  const evidence: CareerPatternClassificationEvidence[] = [
    Object.freeze({
      evidenceId: 'evidence-1',
      ruleId: 'rule-1',
      sourceNetworkId: 'network-1',
      sourceNetworkIdentityKey: 'key-1'
    })
  ];

  return Object.freeze({
    patternId: 'pattern-1',
    identityKey: 'TEST_PATTERN',
    family: 'CAREER_HOUSE_NETWORK',
    level: 'HOUSE_NETWORK',
    classification: 'CAREER_HOUSE_NETWORK',
    name: 'Test Pattern',
    topology: 'LOOP' as CareerNetworkTopology,
    direction: 'DIRECT' as CareerNetworkDirection,
    houses: [10, 6, 2],
    houseRoles: Object.freeze({ 10: 'CAREER_HOUSE', 6: 'SERVICE_HOUSE', 2: 'WEALTH_HOUSE' }),
    planets: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
    networkIds: ['network-1'],
    relationshipIds: ['rel-1', 'rel-2'],
    evidence,
    provenance: Object.freeze({
      sourceNetworkIds: ['network-1'],
      relationshipIds: ['rel-1', 'rel-2'],
      ruleIds: ['rule-1']
    }),
    ...overrides
  });
}

/**
 * Helper: Creates a minimal CareerPlanetaryRelevance for testing.
 * Typed against the real interface with minimal required fields.
 */
function makeRelevance(
  planet: Planet,
  relevance: CareerPlanetRelevance,
  overrides: Partial<CareerPlanetaryRelevance> = {}
): CareerPlanetaryRelevance {
  return Object.freeze({
    planet,
    relevance,
    roles: [],
    reasons: [],
    effect: 'NEUTRAL',
    expressionHints: [],
    relatedHouses: [],
    relatedPlanets: [],
    conditional: relevance === 'CONDITIONAL',
    statement: `Planet ${planet} has ${relevance.toLowerCase()} relevance.`,
    ...overrides
  });
}

/**
 * Helper: Creates a minimal CareerPlanetaryConditionResult for testing.
 * Typed against the real interface with minimal required fields.
 */
function makeCondition(
  planet: Planet,
  condition: CareerPlanetaryConditionResult['condition'],
  overrides: Partial<CareerPlanetaryConditionResult> = {}
): CareerPlanetaryConditionResult {
  return Object.freeze({
    planet,
    relevance: 'PRIMARY' as CareerPlanetRelevance,
    condition,
    dignity: 'NEUTRAL_SIGN',
    affliction: 'NONE',
    motion: 'DIRECT',
    combustion: 'NOT_COMBUST',
    positiveFactors: [],
    negativeFactors: [],
    relatedPlanets: [],
    conditional: condition === 'UNAVAILABLE',
    statement: `Planet ${planet} has ${condition.toLowerCase()} condition.`,
    ...overrides
  });
}

describe('Career Pattern Qualification', () => {
  describe('Identity Preservation', () => {
    it('preserves patternId and identityKey from source pattern', () => {
      const pattern = makePattern({
        patternId: 'test-pattern-id',
        identityKey: 'TEST_IDENTITY_KEY'
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [],
        condition: []
      };

      const result = qualifyCareerPatterns(input);

      expect(result.qualifiedPatterns).toHaveLength(1);
      const qualified = result.qualifiedPatterns[0];
      expect(qualified.patternId).toBe('test-pattern-id');
      expect(qualified.identityKey).toBe('TEST_IDENTITY_KEY');
    });

    it('does not mint new identity — inherits from source pattern', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [],
        condition: []
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.patternId).toBe(pattern.patternId);
      expect(qualified.identityKey).toBe(pattern.identityKey);
      expect(qualified.sourcePattern).toBe(pattern);
    });
  });

  describe('Qualification Semantics', () => {
    it('returns INSUFFICIENT_DATA when structuralStrength is NOT_ASSESSED', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.status).toBe('INSUFFICIENT_DATA');
      expect(qualified.dimensions.structuralStrength).toBe('NOT_ASSESSED');
    });

    it('returns INSUFFICIENT_DATA when activationPotential is UNKNOWN', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.status).toBe('INSUFFICIENT_DATA');
      expect(qualified.dimensions.activationPotential).toBe('UNKNOWN');
    });

    it('returns INSUFFICIENT_DATA when divisionalConfirmation is NOT_ASSESSED', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.status).toBe('INSUFFICIENT_DATA');
      expect(qualified.dimensions.divisionalConfirmation).toBe('NOT_ASSESSED');
    });

    it('does NOT force QUALIFIED status — uses conservative rules', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      // Conservative rules produce INSUFFICIENT_DATA, not QUALIFIED
      expect(qualified.status).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('MIXED Condition Preservation', () => {
    it('maps CONDITIONAL relevance to MIXED', () => {
      const relevance = makeRelevance(Planet.SATURN, 'CONDITIONAL');
      const result = mapCareerRelevance(relevance);

      expect(result).toBe('MIXED');
    });

    it('preserves MIXED through qualification pipeline', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'CONDITIONAL')],
        condition: [makeCondition(Planet.SATURN, 'MODERATE')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      const saturnParticipant = qualified.participants.find((p: CareerPatternParticipantQualification) => p.planet === Planet.SATURN);
      expect(saturnParticipant?.relevance).toBe('MIXED');
    });
  });

  describe('Missing Relevance/Condition → UNAVAILABLE', () => {
    it('maps missing relevance to UNAVAILABLE', () => {
      const result = mapCareerRelevance(undefined);
      expect(result).toBe('UNAVAILABLE');
    });

    it('maps missing condition to UNAVAILABLE', () => {
      const result = mapPlanetaryCondition(undefined);
      expect(result).toBe('UNAVAILABLE');
    });

    it('does NOT treat missing data as negative evidence', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')], // Mercury missing
        condition: [makeCondition(Planet.SATURN, 'STRONG')] // Mercury missing
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      const mercuryParticipant = qualified.participants.find(p => p.planet === Planet.MERCURY);
      expect(mercuryParticipant?.relevance).toBe('UNAVAILABLE');
      expect(mercuryParticipant?.condition).toBe('UNAVAILABLE');
    });
  });

  describe('Divisional NOT_ASSESSED', () => {
    it('returns NOT_ASSESSED for divisionalConfirmation', () => {
      const pattern = makePattern();

      const result = classifyDivisionalConfirmation(pattern);
      expect(result).toBe('NOT_ASSESSED');
    });

    it('divisionalConfirmation is NOT_ASSESSED in qualified output', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.divisionalConfirmation).toBe('NOT_ASSESSED');
    });
  });

  describe('No Dasha/D10/Timing Fields', () => {
    it('input interface does NOT contain horoscope, dasha, d10, or timing fields', () => {
      const input: CareerPatternQualificationInput = {
        patterns: [],
        relevance: [],
        condition: []
      };

      // TypeScript will catch if any of these fields are added
      expect(input).not.toHaveProperty('horoscope');
      expect(input).not.toHaveProperty('dasha');
      expect(input).not.toHaveProperty('d10');
      expect(input).not.toHaveProperty('timing');
    });

    it('output does NOT contain timing-related fields', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified).not.toHaveProperty('dasha');
      expect(qualified).not.toHaveProperty('d10');
      expect(qualified).not.toHaveProperty('timing');
      expect(qualified).not.toHaveProperty('transit');
    });
  });

  describe('Determinism', () => {
    it('pattern-permutation determinism: same output for different input orders', () => {
      const pattern1 = makePattern({ patternId: 'pattern-1', identityKey: 'A' });
      const pattern2 = makePattern({ patternId: 'pattern-2', identityKey: 'B' });

      const input1: CareerPatternQualificationInput = {
        patterns: [pattern1, pattern2],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const input2: CareerPatternQualificationInput = {
        patterns: [pattern2, pattern1],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result1 = qualifyCareerPatterns(input1);
      const result2 = qualifyCareerPatterns(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('participant-order determinism: canonical SUN→KETU ordering', () => {
      const pattern = makePattern({
        planets: [Planet.KETU, Planet.SUN, Planet.MARS] // Mixed order
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SUN, 'PRIMARY'),
          makeRelevance(Planet.MARS, 'SUPPORTING'),
          makeRelevance(Planet.KETU, 'SECONDARY')
        ],
        condition: [
          makeCondition(Planet.SUN, 'STRONG'),
          makeCondition(Planet.MARS, 'MODERATE'),
          makeCondition(Planet.KETU, 'WEAK')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.participants[0].planet).toBe(Planet.SUN);
      expect(qualified.participants[1].planet).toBe(Planet.MARS);
      expect(qualified.participants[2].planet).toBe(Planet.KETU);
    });
  });

  describe('Conflict Non-Removal', () => {
    it('does NOT remove conflicting patterns from output', () => {
      const pattern1 = makePattern({ patternId: 'pattern-1', identityKey: 'CONFLICT_A' });
      const pattern2 = makePattern({ patternId: 'pattern-2', identityKey: 'CONFLICT_B' });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern1, pattern2],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      expect(result.qualifiedPatterns).toHaveLength(2);
    });

    it('retains all participants even with mixed conditions', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'PRIMARY')
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'WEAK')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.participants).toHaveLength(2);
    });
  });

  describe('Deep Immutability', () => {
    it('deep freezes all output objects', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      // Top-level result should be frozen
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.qualifiedPatterns)).toBe(true);

      const qualified = result.qualifiedPatterns[0];
      expect(Object.isFrozen(qualified)).toBe(true);
      expect(Object.isFrozen(qualified.dimensions)).toBe(true);
      expect(Object.isFrozen(qualified.participants)).toBe(true);
      expect(Object.isFrozen(qualified.evidence)).toBe(true);
      expect(Object.isFrozen(qualified.provenance)).toBe(true);

      // Nested arrays should be frozen
      expect(Object.isFrozen(qualified.participants[0])).toBe(true);
      expect(Object.isFrozen(qualified.evidence[0])).toBe(true);
      expect(Object.isFrozen(qualified.provenance.sourcePatternIds)).toBe(true);
      expect(Object.isFrozen(qualified.provenance.sourceEvidenceIds)).toBe(true);
      expect(Object.isFrozen(qualified.provenance.ruleIds)).toBe(true);
    });

    it('throws when attempting to modify frozen output', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      expect(() => {
        // @ts-expect-error - Intentionally testing immutability
        result.qualifiedPatterns[0].status = 'QUALIFIED';
      }).toThrow();
    });
  });

  describe('Planetary Condition Mapping', () => {
    it('maps STRONG condition to STRONG', () => {
      const condition = makeCondition(Planet.SATURN, 'STRONG');
      const result = mapPlanetaryCondition(condition);
      expect(result).toBe('STRONG');
    });

    it('maps MODERATE condition to MODERATE', () => {
      const condition = makeCondition(Planet.SATURN, 'MODERATE');
      const result = mapPlanetaryCondition(condition);
      expect(result).toBe('MODERATE');
    });

    it('maps NEUTRAL condition to MODERATE (conservative)', () => {
      const condition = makeCondition(Planet.SATURN, 'NEUTRAL');
      const result = mapPlanetaryCondition(condition);
      expect(result).toBe('MODERATE');
    });

    it('maps WEAK condition to WEAK', () => {
      const condition = makeCondition(Planet.SATURN, 'WEAK');
      const result = mapPlanetaryCondition(condition);
      expect(result).toBe('WEAK');
    });

    it('maps AFFLICTED condition to WEAK', () => {
      const condition = makeCondition(Planet.SATURN, 'AFFLICTED');
      const result = mapPlanetaryCondition(condition);
      expect(result).toBe('WEAK');
    });

    it('maps UNAVAILABLE condition to UNAVAILABLE', () => {
      const condition = makeCondition(Planet.SATURN, 'UNAVAILABLE');
      const result = mapPlanetaryCondition(condition);
      expect(result).toBe('UNAVAILABLE');
    });
  });

  describe('Career Relevance Mapping', () => {
    it('maps PRIMARY relevance to PRIMARY', () => {
      const relevance = makeRelevance(Planet.SATURN, 'PRIMARY');
      const result = mapCareerRelevance(relevance);
      expect(result).toBe('PRIMARY');
    });

    it('maps SUPPORTING relevance to SUPPORTING', () => {
      const relevance = makeRelevance(Planet.SATURN, 'SUPPORTING');
      const result = mapCareerRelevance(relevance);
      expect(result).toBe('SUPPORTING');
    });

    it('maps SECONDARY relevance to SUPPORTING', () => {
      const relevance = makeRelevance(Planet.SATURN, 'SECONDARY');
      const result = mapCareerRelevance(relevance);
      expect(result).toBe('SUPPORTING');
    });

    it('maps CONDITIONAL relevance to MIXED', () => {
      const relevance = makeRelevance(Planet.SATURN, 'CONDITIONAL');
      const result = mapCareerRelevance(relevance);
      expect(result).toBe('MIXED');
    });

    it('maps NEUTRAL relevance to NEUTRAL', () => {
      const relevance = makeRelevance(Planet.SATURN, 'NEUTRAL');
      const result = mapCareerRelevance(relevance);
      expect(result).toBe('NEUTRAL');
    });
  });

  describe('Structural Strength Classification', () => {
    it('returns NOT_ASSESSED for all patterns (methodology deferred)', () => {
      const pattern = makePattern();

      const result = classifyStructuralStrength(pattern, []);
      expect(result).toBe('NOT_ASSESSED');
    });
  });

  describe('Activation Potential Classification', () => {
    it('returns UNKNOWN for all patterns (timing deferred to C9)', () => {
      const pattern = makePattern();

      const result = classifyActivationPotential(pattern);
      expect(result).toBe('UNKNOWN');
    });
  });

  describe('Pattern Coherence Classification', () => {
    it('returns INSUFFICIENT_DATA when houses are empty', () => {
      const pattern = makePattern({ houses: [] });

      const result = classifyPatternCoherence(pattern);
      expect(result).toBe('INSUFFICIENT_DATA');
    });

    it('returns INSUFFICIENT_DATA when relationshipIds are empty', () => {
      const pattern = makePattern({ relationshipIds: [] });

      const result = classifyPatternCoherence(pattern);
      expect(result).toBe('INSUFFICIENT_DATA');
    });

    it('returns MODERATE when houses and relationshipIds are present', () => {
      const pattern = makePattern();

      const result = classifyPatternCoherence(pattern);
      expect(result).toBe('MODERATE');
    });
  });

  describe('Evidence ID Generation', () => {
    it('generates evidence IDs in format P2-04:<DIMENSION>:<identityKey>', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.evidence[0].evidenceId).toMatch(/^P2-04:.*:TEST_PATTERN$/);
    });
  });

  describe('Provenance Tracking', () => {
    it('extracts sourceEvidenceIds from pattern.evidence[].evidenceId', () => {
      const pattern = makePattern({
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: 'evidence-1',
            ruleId: 'rule-1',
            sourceNetworkId: 'network-1',
            sourceNetworkIdentityKey: 'key-1'
          }),
          Object.freeze({
            evidenceId: 'evidence-2',
            ruleId: 'rule-2',
            sourceNetworkId: 'network-2',
            sourceNetworkIdentityKey: 'key-2'
          })
        ])
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.provenance.sourceEvidenceIds).toEqual(['evidence-1', 'evidence-2']);
    });

    it('sets sourcePatternIds from pattern.patternId', () => {
      const pattern = makePattern({ patternId: 'test-pattern-id' });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.provenance.sourcePatternIds).toEqual(['test-pattern-id']);
    });

    it('extracts ruleIds from pattern.evidence[].ruleId (deduped and sorted)', () => {
      const pattern = makePattern({
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: 'evidence-1',
            ruleId: 'rule-3',
            sourceNetworkId: 'network-1',
            sourceNetworkIdentityKey: 'key-1'
          }),
          Object.freeze({
            evidenceId: 'evidence-2',
            ruleId: 'rule-1',
            sourceNetworkId: 'network-2',
            sourceNetworkIdentityKey: 'key-2'
          }),
          Object.freeze({
            evidenceId: 'evidence-3',
            ruleId: 'rule-2',
            sourceNetworkId: 'network-3',
            sourceNetworkIdentityKey: 'key-3'
          }),
          Object.freeze({
            evidenceId: 'evidence-4',
            ruleId: 'rule-1', // Duplicate
            sourceNetworkId: 'network-4',
            sourceNetworkIdentityKey: 'key-4'
          })
        ])
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.provenance.ruleIds).toEqual(['rule-1', 'rule-2', 'rule-3']);
    });
  });

  describe('Multi-Participant Aggregation', () => {
    it('aggregates planetary condition: UNAVAILABLE in any participant yields UNAVAILABLE', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'PRIMARY'),
          makeRelevance(Planet.JUPITER, 'PRIMARY')
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'STRONG'),
          makeCondition(Planet.JUPITER, 'UNAVAILABLE') // One unavailable
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.planetaryCondition).toBe('UNAVAILABLE');
    });

    it('aggregates planetary condition: WEAK in any participant yields WEAK', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'PRIMARY'),
          makeRelevance(Planet.JUPITER, 'PRIMARY')
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'WEAK'), // One weak
          makeCondition(Planet.JUPITER, 'STRONG')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.planetaryCondition).toBe('WEAK');
    });

    it('aggregates planetary condition: MODERATE when all are STRONG or MODERATE', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'PRIMARY')
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'MODERATE')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.planetaryCondition).toBe('MODERATE');
    });

    it('aggregates career relevance: MIXED in any participant yields MIXED (downgrades PRIMARY)', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'CONDITIONAL') // Yields MIXED
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'STRONG')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.careerRelevance).toBe('MIXED');
    });

    it('aggregates career relevance: MIXED in any participant yields MIXED (downgrades SUPPORTING)', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'SUPPORTING'),
          makeRelevance(Planet.MERCURY, 'CONDITIONAL') // Yields MIXED
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'STRONG')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.careerRelevance).toBe('MIXED');
    });

    it('aggregates career relevance: NEUTRAL in any participant yields NEUTRAL', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'NEUTRAL')
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'STRONG')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.careerRelevance).toBe('NEUTRAL');
    });

    it('aggregates career relevance: SUPPORTING downgrades PRIMARY', () => {
      const pattern = makePattern({
        planets: [Planet.SATURN, Planet.MERCURY]
      });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.MERCURY, 'SUPPORTING')
        ],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.MERCURY, 'STRONG')
        ]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.dimensions.careerRelevance).toBe('SUPPORTING');
    });
  });
});
