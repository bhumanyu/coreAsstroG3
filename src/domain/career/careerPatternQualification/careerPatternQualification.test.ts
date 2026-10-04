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
  CareerPatternClassificationEvidence,
  CareerPatternFamily,
  CareerPatternLevel,
  CareerPatternClassification,
  CareerPatternHouseRole
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
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import {
  buildCareerAstroGraph,
  buildCareerGraphFactsFromStructural,
  detectCareerHouseNetworks
} from '../careerGraph/index';
import { classifyCareerPatterns } from '../careerPattern/careerPatternClassification';
import { buildCareerPlanetaryRelevance } from '../careerPlanetaryRelevanceIntegration';
import { buildCareerPlanetaryCondition } from '../careerPlanetaryConditionIntegration';
import { getQualificationPolicy } from './qualificationRegistry';

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
    mechanisms: [],
    relationships: [],
    evidence,
    provenance: Object.freeze({
      sourceNetworkIds: ['network-1'],
      relationshipIds: ['rel-1', 'rel-2'],
      ruleIds: ['rule-1'],
      establishingRelationshipIds: ['rel-1', 'rel-2'],
      supportingRelationshipIds: []
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

    it('populates flat fields from source pattern', () => {
      const pattern = makePattern();

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [],
        condition: []
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.family).toBe(pattern.family);
      expect(qualified.level).toBe(pattern.level);
      expect(qualified.classification).toBe(pattern.classification);
      expect(qualified.name).toBe(pattern.name);
      expect(qualified.topology).toBe(pattern.topology);
      expect(qualified.direction).toBe(pattern.direction);
      expect(qualified.houses).toEqual(pattern.houses);
      expect(qualified.houseRoles).toEqual(pattern.houseRoles);
      expect(qualified.planets).toEqual(pattern.planets);
      expect(qualified.networkIds).toEqual(pattern.networkIds);
      expect(qualified.relationshipIds).toEqual(pattern.relationshipIds);
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

    it('returns INSUFFICIENT_DATA when activationPotential is UNKNOWN (deferred dimension)', () => {
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
      expect(qualified.deferredDimensions).toContain('ACTIVATION_POTENTIAL');
    });

    it('returns INSUFFICIENT_DATA when divisionalConfirmation is NOT_ASSESSED (deferred dimension)', () => {
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
      expect(qualified.deferredDimensions).toContain('DIVISIONAL_CONFIRMATION');
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
      // Verify deferred dimensions are tracked separately
      expect(qualified.deferredDimensions).toContain('ACTIVATION_POTENTIAL');
      expect(qualified.deferredDimensions).toContain('DIVISIONAL_CONFIRMATION');
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

    it('returns INSUFFICIENT_DATA when establishingRelationshipIds are empty', () => {
      const pattern = makePattern({
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['rel-1', 'rel-2'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: [],
          supportingRelationshipIds: ['rel-1', 'rel-2']
        })
      });

      const result = classifyPatternCoherence(pattern);
      expect(result).toBe('INSUFFICIENT_DATA');
    });

    it('returns MODERATE when houses and establishingRelationshipIds are present', () => {
      const pattern = makePattern();

      const result = classifyPatternCoherence(pattern);
      expect(result).toBe('MODERATE');
    });

    it('returns MODERATE when both establishingRelationshipIds and supportingRelationshipIds are present', () => {
      const pattern = makePattern({
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['rel-1', 'rel-2'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['rel-1'],
          supportingRelationshipIds: ['rel-2']
        })
      });

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

    it('populates sourcePatternId in evidence records', () => {
      const pattern = makePattern({ patternId: 'test-pattern-id' });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      expect(qualified.evidence[0].sourcePatternId).toBe('test-pattern-id');
    });

    it('populates sourceEvidenceIds in evidence records (deduped and sorted)', () => {
      const pattern = makePattern({
        evidence: Object.freeze([
          Object.freeze({
            evidenceId: 'evidence-2',
            ruleId: 'rule-1',
            sourceNetworkId: 'network-1',
            sourceNetworkIdentityKey: 'key-1'
          }),
          Object.freeze({
            evidenceId: 'evidence-1',
            ruleId: 'rule-2',
            sourceNetworkId: 'network-2',
            sourceNetworkIdentityKey: 'key-2'
          }),
          Object.freeze({
            evidenceId: 'evidence-1', // Duplicate
            ruleId: 'rule-3',
            sourceNetworkId: 'network-3',
            sourceNetworkIdentityKey: 'key-3'
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
      expect(qualified.evidence[0].sourceEvidenceIds).toEqual(['evidence-1', 'evidence-2']);
    });

    it('populates ruleIds in evidence records (deduped and sorted)', () => {
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
      expect(qualified.evidence[0].ruleIds).toEqual(['rule-1', 'rule-2', 'rule-3']);
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
        planets: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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
        planets: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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
        planets: [Planet.SATURN, Planet.MERCURY],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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
        planets: [Planet.SATURN, Planet.MERCURY],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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
        planets: [Planet.SATURN, Planet.MERCURY],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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
        planets: [Planet.SATURN, Planet.MERCURY],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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
        planets: [Planet.SATURN, Planet.MERCURY],
        classification: 'CAREER_HOUSE_NETWORK',
        provenance: Object.freeze({
          sourceNetworkIds: ['network-1'],
          relationshipIds: ['REL:6→10'],
          ruleIds: ['rule-1'],
          establishingRelationshipIds: ['REL:6→10'],
          supportingRelationshipIds: []
        })
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

  describe('Deterministic Duplicate Normalization', () => {
    it('relevance: keeps highest precedence (PRIMARY > SUPPORTING > SECONDARY > CONDITIONAL > NEUTRAL)', () => {
      const pattern = makePattern({ planets: [Planet.SATURN] });

      const input1: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'SECONDARY'),
          makeRelevance(Planet.SATURN, 'PRIMARY'),
          makeRelevance(Planet.SATURN, 'NEUTRAL')
        ],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const input2: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [
          makeRelevance(Planet.SATURN, 'NEUTRAL'),
          makeRelevance(Planet.SATURN, 'SECONDARY'),
          makeRelevance(Planet.SATURN, 'PRIMARY')
        ],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result1 = qualifyCareerPatterns(input1);
      const result2 = qualifyCareerPatterns(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));

      // Verify PRIMARY was selected
      const qualified = result1.qualifiedPatterns[0];
      const saturnParticipant = qualified.participants.find(p => p.planet === Planet.SATURN);
      expect(saturnParticipant?.relevance).toBe('PRIMARY');
    });

    it('condition: keeps most severe (AFFLICTED > WEAK > MODERATE > STRONG > NEUTRAL > UNAVAILABLE)', () => {
      const pattern = makePattern({ planets: [Planet.SATURN] });

      const input1: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [
          makeCondition(Planet.SATURN, 'MODERATE'),
          makeCondition(Planet.SATURN, 'AFFLICTED'),
          makeCondition(Planet.SATURN, 'STRONG')
        ]
      };

      const input2: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [
          makeCondition(Planet.SATURN, 'STRONG'),
          makeCondition(Planet.SATURN, 'MODERATE'),
          makeCondition(Planet.SATURN, 'AFFLICTED')
        ]
      };

      const result1 = qualifyCareerPatterns(input1);
      const result2 = qualifyCareerPatterns(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));

      // Verify AFFLICTED was selected (maps to WEAK)
      const qualified = result1.qualifiedPatterns[0];
      const saturnParticipant = qualified.participants.find(p => p.planet === Planet.SATURN);
      expect(saturnParticipant?.condition).toBe('WEAK');
    });

    it('relevance: canonical representative on equal precedence', () => {
      const pattern = makePattern({ planets: [Planet.SATURN] });

      const relevance1 = makeRelevance(Planet.SATURN, 'PRIMARY', { statement: 'First PRIMARY' });
      const relevance2 = makeRelevance(Planet.SATURN, 'PRIMARY', { statement: 'Second PRIMARY' });

      const input1: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [relevance1, relevance2],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const input2: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [relevance2, relevance1],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result1 = qualifyCareerPatterns(input1);
      const result2 = qualifyCareerPatterns(input2);

      // Same output regardless of input order (canonical tie-break)
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));

      // Both use PRIMARY with lexicographically smallest statement
      const qualified1 = result1.qualifiedPatterns[0];
      const saturn1 = qualified1.participants.find(p => p.planet === Planet.SATURN);

      expect(saturn1?.relevance).toBe('PRIMARY');
      expect(saturn1?.relevanceSource?.statement).toBe('First PRIMARY'); // 'First' < 'Second' lexicographically
    });

    it('condition: canonical representative on equal precedence', () => {
      const pattern = makePattern({ planets: [Planet.SATURN] });

      const condition1 = makeCondition(Planet.SATURN, 'STRONG', { statement: 'First STRONG' });
      const condition2 = makeCondition(Planet.SATURN, 'STRONG', { statement: 'Second STRONG' });

      const input1: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [condition1, condition2]
      };

      const input2: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [condition2, condition1]
      };

      const result1 = qualifyCareerPatterns(input1);
      const result2 = qualifyCareerPatterns(input2);

      // Same output regardless of input order (canonical tie-break)
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));

      // Both use STRONG with lexicographically smallest statement
      const qualified1 = result1.qualifiedPatterns[0];
      const saturn1 = qualified1.participants.find(p => p.planet === Planet.SATURN);

      expect(saturn1?.condition).toBe('STRONG');
      expect(saturn1?.conditionSource?.statement).toBe('First STRONG'); // 'First' < 'Second' lexicographically
    });

    it('single record case is unchanged', () => {
      const pattern = makePattern({ planets: [Planet.SATURN] });

      const input: CareerPatternQualificationInput = {
        patterns: [pattern],
        relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
        condition: [makeCondition(Planet.SATURN, 'STRONG')]
      };

      const result = qualifyCareerPatterns(input);

      const qualified = result.qualifiedPatterns[0];
      const saturnParticipant = qualified.participants.find(p => p.planet === Planet.SATURN);
      expect(saturnParticipant?.relevance).toBe('PRIMARY');
      expect(saturnParticipant?.condition).toBe('STRONG');
    });
  });

  describe('Real-engine golden test (closure test)', () => {
    it('end-to-end chain produces valid qualified patterns', async () => {
      // Build the full chain from canonical birth details
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);
      const graph = buildCareerAstroGraph({ facts });
      const networks = detectCareerHouseNetworks({ graph });
      const patterns = classifyCareerPatterns({ networks: networks.networks });
      const relevance = buildCareerPlanetaryRelevance({ horoscope, structural });
      const condition = buildCareerPlanetaryCondition({ horoscope, relevance });

      // Qualify patterns
      const qualified = qualifyCareerPatterns({
        patterns: patterns.patterns,
        relevance,
        condition
      });

      // Verify qualified patterns count matches source patterns
      expect(qualified.qualifiedPatterns.length).toBe(patterns.patterns.length);

      // Verify each qualified pattern preserves identity from source
      for (let i = 0; i < patterns.patterns.length; i++) {
        const sourcePattern = patterns.patterns[i];
        const qualifiedPattern = qualified.qualifiedPatterns[i];

        expect(qualifiedPattern.patternId).toBe(sourcePattern.patternId);
        expect(qualifiedPattern.identityKey).toBe(sourcePattern.identityKey);
        expect(qualifiedPattern.classification).toBe(sourcePattern.classification);
        expect(qualifiedPattern.family).toBe(sourcePattern.family);
        expect(qualifiedPattern.level).toBe(sourcePattern.level);
      }

      // Verify all qualified patterns have expected dimension values
      for (const qualifiedPattern of qualified.qualifiedPatterns) {
        expect(qualifiedPattern.dimensions.structuralStrength).toBe('NOT_ASSESSED');
        expect(qualifiedPattern.dimensions.activationPotential).toBe('UNKNOWN');
        expect(qualifiedPattern.dimensions.divisionalConfirmation).toBe('NOT_ASSESSED');
      }

      // Verify determinism: run twice and assert identical output
      const qualified2 = qualifyCareerPatterns({
        patterns: patterns.patterns,
        relevance,
        condition
      });
      expect(JSON.stringify(qualified)).toBe(JSON.stringify(qualified2));

      // Verify deep freeze on result
      expect(Object.isFrozen(qualified)).toBe(true);
      expect(Object.isFrozen(qualified.qualifiedPatterns)).toBe(true);

      // Verify deep freeze on each qualified pattern
      for (const qualifiedPattern of qualified.qualifiedPatterns) {
        expect(Object.isFrozen(qualifiedPattern)).toBe(true);
        expect(Object.isFrozen(qualifiedPattern.dimensions)).toBe(true);
        expect(Object.isFrozen(qualifiedPattern.participants)).toBe(true);
        expect(Object.isFrozen(qualifiedPattern.evidence)).toBe(true);
        expect(Object.isFrozen(qualifiedPattern.provenance)).toBe(true);

        // Verify nested arrays are frozen
        if (qualifiedPattern.participants.length > 0) {
          expect(Object.isFrozen(qualifiedPattern.participants[0])).toBe(true);
        }
        if (qualifiedPattern.evidence.length > 0) {
          expect(Object.isFrozen(qualifiedPattern.evidence[0])).toBe(true);
        }
        expect(Object.isFrozen(qualifiedPattern.provenance.sourcePatternIds)).toBe(true);
        expect(Object.isFrozen(qualifiedPattern.provenance.sourceEvidenceIds)).toBe(true);
        expect(Object.isFrozen(qualifiedPattern.provenance.ruleIds)).toBe(true);
      }

      // Note: If canonical chart produces zero patterns, document that here.
      // Current canonical chart may or may not produce patterns depending on configuration.
      // This test validates the pipeline regardless of pattern count.
    });
  });

  describe('P2-07A Policy-Based Qualification', () => {
    describe('Policy Registry', () => {
      it('returns policy for SERVICE_TO_PROFESSION_TO_GAINS', () => {
        const policy = getQualificationPolicy('SERVICE_TO_PROFESSION_TO_GAINS');
        expect(policy).not.toBeNull();
        expect(policy?.policyId).toBe('SERVICE_TO_PROFESSION_TO_GAINS');
        expect(policy?.classification).toBe('SERVICE_TO_PROFESSION_TO_GAINS');
      });

      it('returns policy for CAREER_HOUSE_NETWORK', () => {
        const policy = getQualificationPolicy('CAREER_HOUSE_NETWORK');
        expect(policy).not.toBeNull();
        expect(policy?.policyId).toBe('CAREER_HOUSE_NETWORK');
        expect(policy?.classification).toBe('CAREER_HOUSE_NETWORK');
      });

      it('returns null for unimplemented classifications', () => {
        const policy = getQualificationPolicy('WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS');
        expect(policy).toBeNull();
      });
    });

    describe('Service-to-Profession-to-Gains Policy', () => {
      it('returns UNQUALIFIED when both 6→10 and 10→11 relationships are absent', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: [],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: [],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        expect(qualified.status).toBe('UNQUALIFIED');
        expect(qualified.decisionBlockingReasons).toHaveLength(0);
        expect(qualified.policyEvidence.length).toBeGreaterThan(0);
        expect(qualified.policyEvidence[0].explanation).toContain('6→10 and 10→11');
      });

      it('returns UNQUALIFIED when only one required relationship is present', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        expect(qualified.status).toBe('UNQUALIFIED');
        expect(qualified.policyEvidence[0].explanation).toContain('Missing: 10→11');
      });

      it('returns INSUFFICIENT_DATA when structural strength is NOT_ASSESSED', () => {
        const pattern = makePattern({
          planets: [Planet.SATURN], // Only Saturn to avoid UNAVAILABLE from missing planets
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Legacy rules determine status based on NOT_ASSESSED dimensions
        expect(qualified.status).toBe('INSUFFICIENT_DATA');
        expect(qualified.dimensions.structuralStrength).toBe('NOT_ASSESSED');
        // Verify structured decision blocking reasons
        expect(qualified.decisionBlockingReasons.length).toBeGreaterThan(0);
        // Should include METHODOLOGY_NOT_FROZEN for structural strength
        const structuralReason = qualified.decisionBlockingReasons.find(r => r.kind === 'METHODOLOGY_NOT_FROZEN');
        expect(structuralReason).toBeDefined();
        expect(structuralReason?.reason).toContain('structural strength methodology not frozen');
      });

      it('returns UNQUALIFIED when planetary condition is WEAK (negative beats missing data)', () => {
        const pattern = makePattern({
          planets: [Planet.SATURN], // Only Saturn to avoid UNAVAILABLE from missing planets
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'WEAK')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Verify policy was invoked (not legacy path)
        expect(qualified.ruleId).toBe('SERVICE_TO_PROFESSION_TO_GAINS');

        // Explicit negative (WEAK condition) beats unrelated missing data (NOT_ASSESSED structural strength)
        expect(qualified.status).toBe('UNQUALIFIED');
        expect(qualified.dimensions.planetaryCondition).toBe('WEAK');
        // Disqualifiers (WEAK condition) are NOT in decisionBlockingReasons - they're explicit negatives
        expect(qualified.decisionBlockingReasons).toHaveLength(0);
      });

      it('returns UNQUALIFIED when career relevance is NEUTRAL (negative beats missing data)', () => {
        const pattern = makePattern({
          planets: [Planet.SATURN], // Only Saturn to avoid UNAVAILABLE from missing planets
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'NEUTRAL')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Explicit negative (NEUTRAL relevance) beats unrelated missing data (NOT_ASSESSED structural strength)
        expect(qualified.status).toBe('UNQUALIFIED');
        expect(qualified.dimensions.careerRelevance).toBe('NEUTRAL');
        // Disqualifiers (NEUTRAL relevance) are NOT in decisionBlockingReasons - they're explicit negatives
        expect(qualified.decisionBlockingReasons).toHaveLength(0);
      });

      it('explicit negative beats unrelated missing data: WEAK condition + NOT_ASSESSED structural strength → UNQUALIFIED', () => {
        const pattern = makePattern({
          planets: [Planet.SATURN], // Only Saturn to avoid UNAVAILABLE from missing planets
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'WEAK')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Frozen invariant: explicit negative beats unrelated missing data
        // WEAK condition (explicit negative) should result in UNQUALIFIED, not INSUFFICIENT_DATA
        // even though structuralStrength is NOT_ASSESSED (missing data)
        expect(qualified.status).toBe('UNQUALIFIED');
        expect(qualified.dimensions.planetaryCondition).toBe('WEAK');
        expect(qualified.dimensions.structuralStrength).toBe('NOT_ASSESSED');
        expect(qualified.ruleId).toBe('SERVICE_TO_PROFESSION_TO_GAINS'); // Verify policy was used
        // Disqualifiers (WEAK condition) are NOT in decisionBlockingReasons - they're explicit negatives
        expect(qualified.decisionBlockingReasons).toHaveLength(0);
      });
    });

    describe('Career House Network Policy (Generic Carrier)', () => {
      it('returns UNQUALIFIED when no establishing relationships exist', () => {
        const pattern = makePattern({
          classification: 'CAREER_HOUSE_NETWORK',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: [],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: [],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        expect(qualified.status).toBe('UNQUALIFIED');
        expect(qualified.policyEvidence[0].explanation).toContain('no establishing relationships');
      });

      it('returns INSUFFICIENT_DATA when establishing relationships exist (legacy rules apply)', () => {
        const pattern = makePattern({
          planets: [Planet.SATURN], // Only Saturn to avoid UNAVAILABLE from missing planets
          classification: 'CAREER_HOUSE_NETWORK',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Legacy rules determine status based on NOT_ASSESSED dimensions
        expect(qualified.status).toBe('INSUFFICIENT_DATA');
        expect(qualified.dimensions.structuralStrength).toBe('NOT_ASSESSED');
        // Verify structured decision blocking reasons
        expect(qualified.decisionBlockingReasons.length).toBeGreaterThan(0);
        // Should include METHODOLOGY_NOT_FROZEN for structural strength
        const structuralReason = qualified.decisionBlockingReasons.find(r => r.kind === 'METHODOLOGY_NOT_FROZEN');
        expect(structuralReason).toBeDefined();
        expect(structuralReason?.reason).toContain('structural strength methodology not frozen');
      });
    });

    describe('Missing vs Absent Distinction (Spec §20-21)', () => {
      it('missing prerequisite → UNQUALIFIED (explicitly absent, not missing data)', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Missing 10→11 relationship → explicitly absent (not missing data)
        // So this should be UNQUALIFIED, not INSUFFICIENT_DATA
        expect(qualified.status).toBe('UNQUALIFIED');
      });

      it('missing planetary data → INSUFFICIENT_DATA (decision-blocking)', () => {
        const pattern = makePattern({
          planets: [Planet.SATURN], // Only Saturn to avoid UNAVAILABLE from missing planets
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [], // Missing relevance data
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Missing relevance data → INSUFFICIENT_DATA (decision-blocking)
        expect(qualified.status).toBe('INSUFFICIENT_DATA');
        expect(qualified.dimensions.careerRelevance).toBe('UNAVAILABLE');
        // Verify structured decision blocking reasons
        expect(qualified.decisionBlockingReasons.length).toBeGreaterThan(0);
        // Should include MISSING_INPUT for career relevance
        const relevanceReason = qualified.decisionBlockingReasons.find(r => r.kind === 'MISSING_INPUT' && r.reason.includes('career relevance'));
        expect(relevanceReason).toBeDefined();
        expect(relevanceReason?.reason).toContain('career relevance data unavailable');
      });
    });

    describe('ACTIVATION/D10 Cannot Create Qualification (Spec §9-10)', () => {
      it('activationPotential UNKNOWN never raises natal status to QUALIFIED', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Even with strong conditions, UNKNOWN activationPotential prevents QUALIFIED
        expect(qualified.dimensions.activationPotential).toBe('UNKNOWN');
        expect(qualified.status).not.toBe('QUALIFIED');
      });

      it('divisionalConfirmation NOT_ASSESSED never raises natal status to QUALIFIED', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Even with strong conditions, NOT_ASSESSED divisionalConfirmation prevents QUALIFIED
        expect(qualified.dimensions.divisionalConfirmation).toBe('NOT_ASSESSED');
        expect(qualified.status).not.toBe('QUALIFIED');
      });
    });

    describe('Policy Evidence Structure', () => {
      it('policyEvidence uses only establishingRelationshipIds (spec §25)', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11', 'REL:SUPPORT:5'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: ['REL:SUPPORT:5']
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // All policy evidence should use only establishing relationship IDs (sorted)
        qualified.policyEvidence.forEach(evidence => {
          expect(evidence.relationshipIds).toEqual(['REL:10→11', 'REL:6→10']); // Sorted
          expect(evidence.relationshipIds).not.toContain('REL:SUPPORT:5');
        });
      });

      it('policyEvidence has correct sourceType', () => {
        const pattern = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);
        const qualified = result.qualifiedPatterns[0];

        // Check that evidence has valid sourceType
        qualified.policyEvidence.forEach(evidence => {
          expect([
            'PLANETARY_RELEVANCE',
            'PLANETARY_CONDITION',
            'STRUCTURAL_RELATIONSHIP',
            'PATTERN_TOPOLOGY',
            'POLICY_RULE'
          ]).toContain(evidence.sourceType);
        });
      });
    });

    describe('Permutation Invariance (Spec §33)', () => {
      it('pattern order permutation produces identical output', () => {
        const pattern1 = makePattern({
          patternId: 'pattern-1',
          identityKey: 'A',
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const pattern2 = makePattern({
          patternId: 'pattern-2',
          identityKey: 'B',
          classification: 'CAREER_HOUSE_NETWORK',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-2'],
            relationshipIds: ['REL:2→10'],
            ruleIds: ['rule-2'],
            establishingRelationshipIds: ['REL:2→10'],
            supportingRelationshipIds: []
          })
        });

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
    });

    describe('Unrelated Edge Invariance (Spec §37)', () => {
      it('unrelated relationship does not change qualification status', () => {
        const pattern1 = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: []
          })
        });

        const pattern2 = makePattern({
          classification: 'SERVICE_TO_PROFESSION_TO_GAINS',
          provenance: Object.freeze({
            sourceNetworkIds: ['network-1'],
            relationshipIds: ['REL:6→10', 'REL:10→11', 'REL:UNRELATED:5→8'],
            ruleIds: ['rule-1'],
            establishingRelationshipIds: ['REL:6→10', 'REL:10→11'],
            supportingRelationshipIds: ['REL:UNRELATED:5→8']
          })
        });

        const input: CareerPatternQualificationInput = {
          patterns: [pattern1, pattern2],
          relevance: [makeRelevance(Planet.SATURN, 'PRIMARY')],
          condition: [makeCondition(Planet.SATURN, 'STRONG')]
        };

        const result = qualifyCareerPatterns(input);

        // Both patterns should have the same qualification status
        expect(result.qualifiedPatterns[0].status).toBe(result.qualifiedPatterns[1].status);
      });
    });
  });
});
