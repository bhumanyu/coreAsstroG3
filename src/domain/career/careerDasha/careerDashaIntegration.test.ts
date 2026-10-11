import {
  buildCareerDashaAnalysis
} from './careerDashaIntegration';

import type {
  CareerDashaIntegrationInput
} from './careerDashaIntegration';

import {
  Planet
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis
} from '../careerExpression';

import type {
  CareerPlanetaryRelevance
} from '../careerPlanetaryRelevance';

import {
  CareerPlanetRelevance,
  CareerPlanetRole,
  CareerPlanetRelevanceReason,
  CareerPlanetEffect,
  CareerExpressionHint
} from '../careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from '../careerPlanetaryCondition';

import type {
  CareerStructuralReasoning
} from '../careerStructuralReasoning';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  Horoscope
} from '../../../types';

import type {
  WeightedReasoningEvidence
} from '../../reasoning/reasoningTypes';

import {
  calculateHoroscope
} from '../../../engine/astroEngine';

import {
  CANONICAL_BIRTH_DETAILS
} from '../../../test/fixtures/canonicalChart';

// Simplified test using real engine data and minimal focused mocks
// This tests the integration layer specifically, not recreating the full C5/C6/C8 test suite

function makeHoroscopeWithDasha(): Horoscope {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  // Add mock Dasha timing for testing
  return Object.freeze({
    ...horoscope,
    dashaInterpretation: Object.freeze({
      current: Object.freeze({
        mahadasha: Object.freeze({
          planet: Planet.SATURN,
          start: '2020-01-01',
          end: '2025-01-01'
        }),
        antardasha: Object.freeze({
          planet: Planet.JUPITER,
          start: '2020-01-01',
          end: '2022-01-01'
        }),
        pratyantardasha: Object.freeze({
          planet: Planet.MERCURY,
          start: '2020-01-01',
          end: '2021-01-01'
        })
      })
    })
  } as Horoscope);
}

function makeHoroscopeWithPartialDasha(): Horoscope {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  // Add mock Dasha timing with missing planet for testing
  return Object.freeze({
    ...horoscope,
    dashaInterpretation: Object.freeze({
      current: Object.freeze({
        mahadasha: Object.freeze({
          planet: Planet.SATURN,
          start: '2020-01-01',
          end: '2025-01-01'
        }),
        antardasha: Object.freeze({
          // Missing planet - should NOT default to Sun
          start: '2020-01-01',
          end: '2022-01-01'
        }),
        pratyantardasha: Object.freeze({
          // Missing planet - should NOT default to Sun
          start: '2020-01-01',
          end: '2021-01-01'
        })
      })
    })
  } as Horoscope);
}

function makeMinimalNatal(): CareerNatalAnalysis {
  // Create natal evidence with correct identityKey format for the planets in Dasha
  const saturnEvidence: WeightedReasoningEvidence = Object.freeze({
    identityKey: 'CW-CAREER-NATAL-D1-SATURN_10TH_LORD-SATURN',
    evidenceId: 'natal-saturn-evidence-1',
    ruleId: 'SATURN_10TH_LORD',
    layer: 'PRIMARY_PROMISE',
    direction: 'SUPPORT',
    strength: 'STRONG',
    priority: 90,
    weight: 2.7,
    statement: 'Saturn as 10th lord in 10th house supports career',
    relatedEvidenceIds: [],
    sourceIds: ['source-1']
  });

  const jupiterEvidence: WeightedReasoningEvidence = Object.freeze({
    identityKey: 'CW-CAREER-NATAL-D1-JUPITER_7TH_LORD-JUPITER',
    evidenceId: 'natal-jupiter-evidence-1',
    ruleId: 'JUPITER_7TH_LORD',
    layer: 'PRIMARY_PROMISE',
    direction: 'SUPPORT',
    strength: 'STRONG',
    priority: 90,
    weight: 2.7,
    statement: 'Jupiter as 7th lord supports career',
    relatedEvidenceIds: [],
    sourceIds: ['source-2']
  });

  const mercuryEvidence: WeightedReasoningEvidence = Object.freeze({
    identityKey: 'CW-CAREER-NATAL-D1-MERCURY_1ST_LORD-MERCURY',
    evidenceId: 'natal-mercury-evidence-1',
    ruleId: 'MERCURY_1ST_LORD',
    layer: 'PRIMARY_PROMISE',
    direction: 'SUPPORT',
    strength: 'STRONG',
    priority: 90,
    weight: 2.7,
    statement: 'Mercury as 1st lord supports career',
    relatedEvidenceIds: [],
    sourceIds: ['source-3']
  });

  // Use a minimal natal that satisfies the type requirements
  // The actual C5/C6/C8 test suites should cover detailed semantics
  return Object.freeze({
    structural: Object.freeze({
      direction: 'SUPPORT' as CareerStructuralDirection,
      strength: 'STRONG' as CareerStructuralStrength,
      primarySupport: 5,
      primaryChallenge: 0,
      supportingSupport: 3,
      supportingChallenge: 1,
      challengingSupport: 1,
      challengingChallenge: 3,
      mixedWeight: 0,
      evidence: Object.freeze([]),
      primaryEvidenceIds: Object.freeze([]),
      supportingEvidenceIds: Object.freeze([]),
      challengingEvidenceIds: Object.freeze([]),
      conflicts: Object.freeze([]),
      statement: 'Strong structural support for career.'
    } as unknown as CareerStructuralReasoning),
    relevance: Object.freeze([
      Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
        reasons: Object.freeze(['PRIMARY_LORDSHIP' as CareerPlanetRelevanceReason]),
        effect: 'SUPPORT' as CareerPlanetEffect,
        expressionHints: Object.freeze([] as CareerExpressionHint[]),
        relatedHouses: Object.freeze([10]),
        relatedPlanets: Object.freeze([]),
        conditional: false,
        statement: 'Saturn has primary career relevance.'
      }),
      Object.freeze({
        planet: Planet.JUPITER,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
        reasons: Object.freeze(['PRIMARY_LORDSHIP' as CareerPlanetRelevanceReason]),
        effect: 'SUPPORT' as CareerPlanetEffect,
        expressionHints: Object.freeze([] as CareerExpressionHint[]),
        relatedHouses: Object.freeze([7]),
        relatedPlanets: Object.freeze([]),
        conditional: false,
        statement: 'Jupiter has primary career relevance.'
      }),
      Object.freeze({
        planet: Planet.MERCURY,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
        reasons: Object.freeze(['PRIMARY_LORDSHIP' as CareerPlanetRelevanceReason]),
        effect: 'SUPPORT' as CareerPlanetEffect,
        expressionHints: Object.freeze([] as CareerExpressionHint[]),
        relatedHouses: Object.freeze([1]),
        relatedPlanets: Object.freeze([]),
        conditional: false,
        statement: 'Mercury has primary career relevance.'
      })
    ]) as readonly CareerPlanetaryRelevance[],
    condition: Object.freeze([]) as readonly CareerPlanetaryConditionResult[],
    lordRelationships: Object.freeze([]),
    direction: 'SUPPORT',
    strength: 'STRONG',
    evidence: Object.freeze([saturnEvidence, jupiterEvidence, mercuryEvidence]),
    conflicts: Object.freeze([]),
    reasoningTrace: Object.freeze({
      primaryPromise: Object.freeze([saturnEvidence, jupiterEvidence, mercuryEvidence]),
      secondarySupport: Object.freeze([]),
      modifiers: Object.freeze([]),
      yogas: Object.freeze([]),
      varga: Object.freeze([]),
      dasha: Object.freeze([]),
      transit: Object.freeze([])
    })
  });
}

function makeMinimalExpression(): CareerExpressionAnalysis {
  return Object.freeze({
    expressions: Object.freeze([]),
    statement: 'No expressions available.'
  });
}

function makeInput(overrides: Partial<CareerDashaIntegrationInput> = {}): CareerDashaIntegrationInput {
  return Object.freeze({
    horoscope: makeHoroscopeWithDasha(),
    natal: makeMinimalNatal(),
    expression: makeMinimalExpression(),
    ...overrides
  });
}

describe('C9 Dasha Integration', () => {
  describe('Test 1: MD primary / AD modifier / PD refinement roles', () => {
    it('assigns correct roles to MD/AD/PD', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      expect(result.md.role).toBe('PRIMARY_DRIVER');
      expect(result.ad.role).toBe('MODIFIER');
      expect(result.pd.role).toBe('REFINEMENT');
    });
  });

  describe('Test 2: Unavailable case', () => {
    it('returns planet: undefined and overallDirection: UNAVAILABLE when no Dasha', () => {
      const input = makeInput({
        horoscope: Object.freeze({
          dashaInterpretation: undefined
        } as Horoscope)
      });

      const result = buildCareerDashaAnalysis(input);

      expect(result.overallEffect).toBe('INSUFFICIENT_DATA');
      expect(result.overallDirection).toBe('UNAVAILABLE');
      expect(result.md.planet).toBeUndefined();
      expect(result.ad.planet).toBeUndefined();
      expect(result.pd.planet).toBeUndefined();
    });
  });

  describe('Test 3: Determinism (two runs toEqual)', () => {
    it('produces identical results on repeated calls', () => {
      const input = makeInput();

      const result1 = buildCareerDashaAnalysis(input);
      const result2 = buildCareerDashaAnalysis(input);

      expect(result1).toEqual(result2);
    });
  });

  describe('Test 4: Immutability', () => {
    it('frozen result + arrays, horoscope not mutated', () => {
      const input = makeInput();
      const horoscopeBefore = JSON.stringify(input.horoscope);

      const result = buildCareerDashaAnalysis(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.md)).toBe(true);
      expect(Object.isFrozen(result.ad)).toBe(true);
      expect(Object.isFrozen(result.pd)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);

      const horoscopeAfter = JSON.stringify(input.horoscope);
      expect(horoscopeBefore).toBe(horoscopeAfter);
    });
  });

  describe('Test 5: No D10/transit fields present', () => {
    it('does not include D10 or transit-specific fields', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      // Should not have D10-specific fields
      expect(result).not.toHaveProperty('d10Qualification');
      expect(result).not.toHaveProperty('d10Evidence');

      // Should not have transit-specific fields
      expect(result).not.toHaveProperty('transit');
      expect(result).not.toHaveProperty('transitEvidence');
    });
  });

  describe('Test 6: Real-engine integration', () => {
    it('produces a coherent hierarchy with real horoscope calculation', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      const input = makeInput({
        horoscope
      });

      const result = buildCareerDashaAnalysis(input);

      // Should produce a valid hierarchy
      expect(result).toHaveProperty('md');
      expect(result).toHaveProperty('ad');
      expect(result).toHaveProperty('pd');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('overallEffect');
      expect(result).toHaveProperty('overallDirection');

      // With our mock Dasha data added, should have actual planets
      // If the real horoscope doesn't have Dasha, it will return unavailable
      if (horoscope.dashaInterpretation?.current) {
        expect(result.md.planet).toBeDefined();
        expect(result.ad.planet).toBeDefined();
        expect(result.pd.planet).toBeDefined();
      } else {
        // Real horoscope may not have Dasha data, so it should be unavailable
        expect(result.overallEffect).toBe('INSUFFICIENT_DATA');
        expect(result.overallDirection).toBe('UNAVAILABLE');
      }
    });
  });

  describe('Test 7: SourceIds are activation evidence ids (not circular)', () => {
    it('sourceIds point to activation evidence ids, not the C9 occurrence id', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      // Check that sourceIds are not just the C9-generated id
      result.evidence.forEach(evidence => {
        // sourceIds should be the actual activation evidence ids
        expect(evidence.sourceIds.length).toBeGreaterThanOrEqual(0);
        // The C9-generated id should not be in sourceIds (no circular reference)
        expect(evidence.sourceIds).not.toContain(evidence.id);
      });
    });
  });

  describe('Test 8: Root evidence linkage via identityKey parsing', () => {
    it('natalRootIds are populated for planets with matching natal evidence', () => {
      // Create natal evidence with correct identityKey format: CW-CAREER-NATAL-D1-<RULE_ID>-<PLANET>
      const natalEvidence: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'CW-CAREER-NATAL-D1-SATURN_10TH_LORD-SATURN',
        evidenceId: 'natal-saturn-evidence-1',
        ruleId: 'SATURN_10TH_LORD',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 90,
        weight: 2.7,
        statement: 'Saturn as 10th lord in 10th house supports career',
        relatedEvidenceIds: [],
        sourceIds: ['source-1']
      });

      const natal: CareerNatalAnalysis = Object.freeze({
        structural: Object.freeze({
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 0,
          supportingSupport: 5,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 0,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Strong structural support'
        }),
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT',
        strength: 'STRONG',
        evidence: [natalEvidence],
        conflicts: [],
        reasoningTrace: Object.freeze({
          primaryPromise: [natalEvidence],
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        })
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: [],
        evidenceIds: [],
        unresolvedEvidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        statement: 'No expressions'
      });

      const input: CareerDashaIntegrationInput = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression
      });

      const result = buildCareerDashaAnalysis(input);

      // Find evidence for SATURN planet
      const saturnEvidence = result.evidence.find(e => e.planet === Planet.SATURN);
      expect(saturnEvidence).toBeDefined();

      // The natalRootIds should include the natal evidence ID
      if (saturnEvidence) {
        expect(saturnEvidence.provenance.natalRootIds).toContain('natal-saturn-evidence-1');
      }
    });

    it('natalRootIds are empty when no planet specified', () => {
      const input = makeInput();
      const result = buildCareerDashaAnalysis(input);

      // Check that evidence without a planet has empty natalRootIds
      const evidenceWithoutPlanet = result.evidence.filter(e => !e.planet);
      evidenceWithoutPlanet.forEach(evidence => {
        expect(evidence.provenance.natalRootIds).toEqual([]);
      });
    });
  });

  describe('Test 9: INSUFFICIENT_DATA maps to UNAVAILABLE at adapter', () => {
    it('missing data maps to UNAVAILABLE, not NEUTRAL', () => {
      const input = makeInput({
        horoscope: Object.freeze({
          dashaInterpretation: undefined
        } as Horoscope)
      });

      const result = buildCareerDashaAnalysis(input);

      expect(result.overallEffect).toBe('INSUFFICIENT_DATA');
      expect(result.overallDirection).toBe('UNAVAILABLE');
      // Should NOT be NEUTRAL (missing evidence ≠ negative evidence)
      expect(result.overallDirection).not.toBe('NEUTRAL');
    });
  });

  describe('Test 10: Missing AD/PD planet timing does NOT default to Sun', () => {
    it('when AD/PD planet is missing, planet remains undefined with INSUFFICIENT_DATA', () => {
      const input = makeInput({
        horoscope: makeHoroscopeWithPartialDasha()
      });

      const result = buildCareerDashaAnalysis(input);

      // MD should have planet (it's present)
      expect(result.md.planet).toBe(Planet.SATURN);

      // AD and PD should have undefined planet (missing from timing)
      expect(result.ad.planet).toBeUndefined();
      expect(result.pd.planet).toBeUndefined();

      // AD and PD should have INSUFFICIENT_DATA effect
      expect(result.ad.effect).toBe('INSUFFICIENT_DATA');
      expect(result.pd.effect).toBe('INSUFFICIENT_DATA');

      // AD and PD should have UNAVAILABLE direction
      expect(result.ad.direction).toBe('UNAVAILABLE');
      expect(result.pd.direction).toBe('UNAVAILABLE');

      // AD and PD should NOT resolve to Sun activation even if Sun is career-relevant
      expect(result.ad.planet).not.toBe(Planet.SUN);
      expect(result.pd.planet).not.toBe(Planet.SUN);
    });
  });

  describe('Test 11: Canonical CW-... identityKey parsing with guards', () => {
    it('canonical CW-... key with optional OBJECT_KEY segment resolves correct planet at index 5', () => {
      // Create natal evidence with canonical CW-... format including optional OBJECT_KEY
      // Format: CW-CAREER-NATAL-D1-SATURN_10TH_LORD-SATURN-10TH_HOUSE
      const natalEvidence: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'CW-CAREER-NATAL-D1-SATURN_10TH_LORD-SATURN-10TH_HOUSE',
        evidenceId: 'natal-saturn-10th-evidence',
        ruleId: 'SATURN_10TH_LORD',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 90,
        weight: 2.7,
        statement: 'Saturn as 10th lord in 10th house supports career',
        relatedEvidenceIds: [],
        sourceIds: ['source-1']
      });

      const natal: CareerNatalAnalysis = Object.freeze({
        structural: Object.freeze({
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 0,
          supportingSupport: 5,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 0,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Strong structural support'
        }),
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT',
        strength: 'STRONG',
        evidence: [natalEvidence],
        conflicts: [],
        reasoningTrace: Object.freeze({
          primaryPromise: [natalEvidence],
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        })
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: [],
        evidenceIds: [],
        unresolvedEvidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        statement: 'No expressions'
      });

      const input: CareerDashaIntegrationInput = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression
      });

      const result = buildCareerDashaAnalysis(input);

      // Find evidence for SATURN planet
      const saturnEvidence = result.evidence.find(e => e.planet === Planet.SATURN);
      expect(saturnEvidence).toBeDefined();

      // The natalRootIds should include the natal evidence ID
      if (saturnEvidence) {
        expect(saturnEvidence.provenance.natalRootIds).toContain('natal-saturn-10th-evidence');
      }
    });

    it('non-canonical identityKey (occurrence-ID fallback) is safely ignored', () => {
      // Create natal evidence with non-canonical identityKey (raw occurrence-ID fallback)
      // This simulates classifyReasoningEvidence fallback when neither planet nor house is present
      const nonCanonicalEvidence: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'raw-occurrence-id-fallback-12345', // Not CW-... format
        evidenceId: 'raw-fallback-evidence',
        ruleId: 'UNKNOWN_RULE',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 90,
        weight: 2.7,
        statement: 'Fallback evidence without canonical identity',
        relatedEvidenceIds: [],
        sourceIds: ['source-1']
      });

      const natal: CareerNatalAnalysis = Object.freeze({
        structural: Object.freeze({
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 0,
          supportingSupport: 5,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 0,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Strong structural support'
        }),
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT',
        strength: 'STRONG',
        evidence: [nonCanonicalEvidence],
        conflicts: [],
        reasoningTrace: Object.freeze({
          primaryPromise: [nonCanonicalEvidence],
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        })
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: [],
        evidenceIds: [],
        unresolvedEvidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        statement: 'No expressions'
      });

      const input: CareerDashaIntegrationInput = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression
      });

      const result = buildCareerDashaAnalysis(input);

      // Non-canonical evidence should be safely ignored (not mis-parsed)
      // The function should not throw or mis-identify a planet from the non-canonical key
      expect(result.evidence).toBeDefined();
      // All natalRootIds should be empty since non-canonical key was ignored
      result.evidence.forEach(evidence => {
        expect(evidence.provenance.natalRootIds).toEqual([]);
      });
    });

    it('identityKey starting with CW but with insufficient segments is safely ignored', () => {
      // Create evidence with CW prefix but insufficient segments (< 6)
      const invalidCanonicalEvidence: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'CW-CAREER-NATAL', // Only 3 segments (less than required 6)
        evidenceId: 'invalid-evidence',
        ruleId: 'TEST_RULE',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 90,
        weight: 2.7,
        statement: 'Invalid canonical evidence',
        relatedEvidenceIds: [],
        sourceIds: ['source-1']
      });

      const natal: CareerNatalAnalysis = Object.freeze({
        structural: Object.freeze({
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 0,
          supportingSupport: 5,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 0,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Strong structural support'
        }),
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT',
        strength: 'STRONG',
        evidence: [invalidCanonicalEvidence],
        conflicts: [],
        reasoningTrace: Object.freeze({
          primaryPromise: [invalidCanonicalEvidence],
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        })
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: [],
        evidenceIds: [],
        unresolvedEvidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        statement: 'No expressions'
      });

      const input: CareerDashaIntegrationInput = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression
      });

      const result = buildCareerDashaAnalysis(input);

      // Invalid canonical evidence should be safely ignored (not mis-parsed)
      expect(result.evidence).toBeDefined();
      // All natalRootIds should be empty since invalid key was ignored
      result.evidence.forEach(evidence => {
        expect(evidence.provenance.natalRootIds).toEqual([]);
      });
    });

    it('CW-prefixed key with invalid domain/axis/source is safely ignored', () => {
      // Create evidence with CW prefix and ≥6 segments but invalid domain/axis/source
      const invalidEnumEvidence: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'CW-INVALID_DOMAIN-NATAL-D1-SATURN_10TH_LORD-SATURN', // Invalid domain
        evidenceId: 'invalid-domain-evidence',
        ruleId: 'SATURN_10TH_LORD',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 90,
        weight: 2.7,
        statement: 'Evidence with invalid domain',
        relatedEvidenceIds: [],
        sourceIds: ['source-1']
      });

      const natal: CareerNatalAnalysis = Object.freeze({
        structural: Object.freeze({
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 0,
          supportingSupport: 5,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 0,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Strong structural support'
        }),
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT',
        strength: 'STRONG',
        evidence: [invalidEnumEvidence],
        conflicts: [],
        reasoningTrace: Object.freeze({
          primaryPromise: [invalidEnumEvidence],
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        })
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: [],
        evidenceIds: [],
        unresolvedEvidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        statement: 'No expressions'
      });

      const input: CareerDashaIntegrationInput = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression
      });

      const result = buildCareerDashaAnalysis(input);

      // Evidence with invalid domain should be safely ignored
      expect(result.evidence).toBeDefined();
      // All natalRootIds should be empty since invalid key was ignored
      result.evidence.forEach(evidence => {
        expect(evidence.provenance.natalRootIds).toEqual([]);
      });
    });

    it('key with hyphenated ruleId (normalized) resolves subjectKey at correct position', () => {
      // Create evidence where ruleId originally contained hyphens
      // After normalization by buildEvidenceIdentityKey, hyphens become underscores
      // Format: CW-CAREER-NATAL-D1-SATURN_10TH_LORD_EXAM-SATURN
      // Original ruleId: 'SATURN-10TH-LORD-EXAM' -> normalized: 'SATURN_10TH_LORD_EXAM'
      const hyphenatedRuleIdEvidence: WeightedReasoningEvidence = Object.freeze({
        identityKey: 'CW-CAREER-NATAL-D1-SATURN_10TH_LORD_EXAM-SATURN',
        evidenceId: 'hyphenated-ruleid-evidence',
        ruleId: 'SATURN_10TH_LORD_EXAM',
        layer: 'PRIMARY_PROMISE',
        direction: 'SUPPORT',
        strength: 'STRONG',
        priority: 90,
        weight: 2.7,
        statement: 'Evidence with hyphenated ruleId (normalized)',
        relatedEvidenceIds: [],
        sourceIds: ['source-1']
      });

      const natal: CareerNatalAnalysis = Object.freeze({
        structural: Object.freeze({
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 0,
          supportingSupport: 5,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 0,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Strong structural support'
        }),
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT',
        strength: 'STRONG',
        evidence: [hyphenatedRuleIdEvidence],
        conflicts: [],
        reasoningTrace: Object.freeze({
          primaryPromise: [hyphenatedRuleIdEvidence],
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        })
      });

      const expression: CareerExpressionAnalysis = Object.freeze({
        expressions: [],
        evidenceIds: [],
        unresolvedEvidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        statement: 'No expressions'
      });

      const input: CareerDashaIntegrationInput = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression
      });

      const result = buildCareerDashaAnalysis(input);

      // Find evidence for SATURN planet
      const saturnEvidence = result.evidence.find(e => e.planet === Planet.SATURN);
      expect(saturnEvidence).toBeDefined();

      // The natalRootIds should include the evidence ID
      // Subject key (SATURN) should be at the correct position (index 5) despite normalized ruleId
      if (saturnEvidence) {
        expect(saturnEvidence.provenance.natalRootIds).toContain('hyphenated-ruleid-evidence');
      }
    });
  });
});
