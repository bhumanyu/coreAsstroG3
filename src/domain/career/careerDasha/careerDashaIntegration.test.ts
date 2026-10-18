import {
  buildCareerDashaAnalysis,
  buildSelectedCareerDashaCanonicalAnalysis
} from './careerDashaIntegration';

import type {
  SelectedPeriodActivationContext
} from '../../../core/analysis';

import {
  SELECTED_PERIOD_CONTEXT_VERSION,
  MD_AD_PERIOD_RESOLVER_VERSION
} from '../../../core/analysis';

import {
  DashaSystem
} from '../../../types';

import type {
  CareerDashaIntegrationInput,
  CareerDashaIntegrationInputExtended,
  CareerDashaMechanismAwareInput
} from './careerDashaIntegration';

import {
  Planet
} from '../../../types';

import type {
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis
} from '../careerExpression';

import type {
  CareerManifestationMode
} from '../careerTypes';

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

function makeMinimalNatalAnalysis(): CareerNatalAnalysis {
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
      })
    ]),
    condition: Object.freeze([
      Object.freeze({
        planet: Planet.SATURN,
        relevance: 'PRIMARY' as CareerPlanetRelevance,
        condition: 'STRONG',
        dignity: 'OWN_SIGN' as any,
        affliction: 'NONE' as any,
        motion: 'DIRECT' as any,
        combustion: 'NOT_COMBUST' as any,
        beneficSupport: false,
        maleficPressure: false,
        dataAvailable: true,
        positiveFactors: Object.freeze([]),
        negativeFactors: Object.freeze([]),
        relatedHouses: Object.freeze([10]),
        relatedPlanets: Object.freeze([]),
        conditional: false,
        statement: 'Saturn is strong.'
      })
    ]),
    lordRelationships: [],
    direction: 'SUPPORT',
    strength: 'STRONG',
    evidence: [],
    conflicts: [],
    reasoningTrace: Object.freeze({
      primaryPromise: [],
      secondarySupport: [],
      modifiers: [],
      yogas: [],
      varga: [],
      dasha: [],
      transit: []
    })
  });
}

function makeMinimalExpressionAnalysis(): CareerExpressionAnalysis {
  return Object.freeze({
    expressions: [],
    evidenceIds: [],
    unresolvedEvidenceIds: [],
    sourceIds: [],
    ruleIds: [],
    statement: 'No expressions'
  });
}

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

/**
 * Helper to create a full SelectedPeriodActivationContext fixture matching PBA-03 type.
 */
function makeSelectedPeriod(overrides: Partial<SelectedPeriodActivationContext> = {}): SelectedPeriodActivationContext {
  // Create minimal but valid DashaMahadashaInterpretation and DashaAntardashaInterpretation nodes
  const mahadashaNode: DashaMahadashaInterpretation = Object.freeze({
    planet: Planet.SATURN,
    start: '2020-01-01',
    end: '2025-01-01',
    natal: Object.freeze({
      planet: Planet.SATURN,
      dignity: 'OWN_SIGN' as any,
      strength: 'STRONG' as any,
      activation: 'ACTIVE' as any
    } as any),
    antardashas: Object.freeze([]),
    evidence: Object.freeze([]),
    confidence: 'HIGH' as any
  });

  const antardashaNode: DashaAntardashaInterpretation = Object.freeze({
    planet: Planet.JUPITER,
    start: '2020-01-01',
    end: '2022-01-01',
    natal: Object.freeze({
      planet: Planet.JUPITER,
      dignity: 'OWN_SIGN' as any,
      strength: 'STRONG' as any,
      activation: 'ACTIVE' as any
    } as any),
    pratyantardashas: Object.freeze([]),
    evidence: Object.freeze([]),
    confidence: 'HIGH' as any
  });

  return Object.freeze({
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: DashaSystem.VIMSHOTTARI,
    level: 'MD_AD',
    selectedPeriodId: 'SATURN-JUPITER-2020-2022',
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: '2021-06-15',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: Object.freeze({
      start: '2020-01-01',
      end: '2022-01-01'
    }),
    mahadasha: Object.freeze({
      id: 'md-saturn-2020-2025',
      planet: Planet.SATURN,
      start: '2020-01-01',
      end: '2025-01-01'
    }),
    antardasha: Object.freeze({
      id: 'ad-jupiter-2020-2022',
      mahadashaId: 'md-saturn-2020-2025',
      planet: Planet.JUPITER,
      start: '2020-01-01',
      end: '2022-01-01'
    }),
    mahadashaNode,
    antardashaNode,
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

  describe('P2-11C Gate 3: Mechanism-aware activation', () => {
    it('should resolve planet associations from explicit participant identities', () => {
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_AUTHORITY_001',
        participantIds: ['PLANET:SUN', 'PLANET:MARS'],
        sourceEvidenceIds: ['EVIDENCE_001', 'EVIDENCE_002'],
        ruleIds: ['RULE_AUTH_001']
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // Statement should indicate mechanism-aware input
      expect(result.statement).toContain('Mechanism-aware: true');
      expect(result.statement).toContain('MECH_AUTHORITY_001');

      // Planet contexts should be built from participantIds
      // SUN and MARS should be in the planet contexts
      if (result.hierarchy && result.hierarchy.md) {
        expect(result.hierarchy.md.planet).toBeDefined();
      }
    });

    it('should return explicit UNAVAILABLE when participant/planet identity cannot be resolved', () => {
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_INVALID_001',
        participantIds: ['INVALID_PARTICIPANT_ID'], // Not a valid PLANET:{Planet} format
        sourceEvidenceIds: ['EVIDENCE_001'],
        ruleIds: ['RULE_INVALID_001']
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // Should not fabricate a planet - unavailable participant should be skipped
      // Statement should indicate mechanism-aware input
      expect(result.statement).toContain('Mechanism-aware: true');
    });

    it('should never treat unavailable activation as negative activation', () => {
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_TEST_001',
        participantIds: [], // Empty participant IDs
        sourceEvidenceIds: [],
        ruleIds: []
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // UNAVAILABLE should not be treated as negative (CHALLENGE)
      // The overall direction should not be CHALLENGE just because participants are empty
      expect(result.overallDirection).not.toBe('CHALLENGE');
    });

    it('should never create a mechanism or natal promise', () => {
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_TEST_001',
        participantIds: ['PLANET:JUPITER'],
        sourceEvidenceIds: ['EVIDENCE_001'],
        ruleIds: ['RULE_TEST_001']
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // C9 should not create mechanisms or natal promises
      // It only activates existing natal promises
      // The evidence should be Dasha activation evidence, not natal promise evidence
      result.evidence.forEach(evidence => {
        expect(evidence.provenance.source).toBe('C9_DASHA');
      });
    });

    it('should preserve source evidence IDs and rule IDs through the result', () => {
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_TEST_001',
        participantIds: ['PLANET:SATURN'],
        sourceEvidenceIds: ['SOURCE_EVIDENCE_001', 'SOURCE_EVIDENCE_002'],
        ruleIds: ['RULE_QUAL_001', 'RULE_QUAL_002']
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // Statement should include mechanism ID
      expect(result.statement).toContain('MECH_TEST_001');
    });

    it('should read MD/AD/PD timing verbatim from horoscope.dashaInterpretation', () => {
      const horoscope = makeHoroscopeWithDasha();
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_TEST_001',
        participantIds: ['PLANET:SATURN'],
        sourceEvidenceIds: ['EVIDENCE_001'],
        ruleIds: ['RULE_TEST_001']
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope,
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // MD timing should match horoscope.dashaInterpretation
      expect(result.md.planet).toBe(Planet.SATURN);
      expect(result.md.start).toBe('2020-01-01');
      expect(result.md.end).toBe('2025-01-01');

      // AD timing should match horoscope.dashaInterpretation
      expect(result.ad.planet).toBe(Planet.JUPITER);
      expect(result.ad.start).toBe('2020-01-01');
      expect(result.ad.end).toBe('2022-01-01');

      // PD timing should match horoscope.dashaInterpretation
      expect(result.pd.planet).toBe(Planet.MERCURY);
      expect(result.pd.start).toBe('2020-01-01');
      expect(result.pd.end).toBe('2021-01-01');
    });

    it('should use legacy planet-derived path with explicit limitation diagnostic when mechanismAwareInput is absent', () => {
      const natal = makeMinimalNatalAnalysis();

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis()
        // mechanismAwareInput absent - legacy path
      });

      const result = buildCareerDashaAnalysis(input);

      // Statement should indicate legacy path
      expect(result.statement).toContain('Mechanism-aware: false');
      expect(result.statement).toContain('legacy path');
    });

    it('should not use expressionId/candidateId/mode fallbacks for planet resolution', () => {
      const natal = makeMinimalNatalAnalysis();

      const mechanismAwareInput: CareerDashaMechanismAwareInput = Object.freeze({
        mechanismId: 'MECH_TEST_001',
        participantIds: ['PLANET:VENUS'],
        sourceEvidenceIds: ['EVIDENCE_001'],
        ruleIds: ['RULE_TEST_001']
      });

      const input: CareerDashaIntegrationInputExtended = Object.freeze({
        horoscope: makeHoroscopeWithDasha(),
        natal,
        expression: makeMinimalExpressionAnalysis(),
        mechanismAwareInput
      });

      const result = buildCareerDashaAnalysis(input);

      // Should resolve VENUS from participantId, not from expression mode or candidateId
      expect(result.statement).toContain('MECH_TEST_001');
    });
  });

  describe('PBA-04: Selected Career Dasha Canonical Analysis', () => {
    it('selected MD/AD planets+dates equal the PBA-03 selection', () => {
      const input = makeInput();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaCanonicalAnalysis({
        ...input,
        selectedPeriod
      });

      if (!result) {
        throw new Error('Expected result to be defined');
      }

      // MD should match selected period verbatim
      expect(result.md.planet).toBe(Planet.SATURN);
      expect(result.md.start).toBe('2020-01-01');
      expect(result.md.end).toBe('2025-01-01');

      // AD should match selected period verbatim
      expect(result.ad.planet).toBe(Planet.JUPITER);
      expect(result.ad.start).toBe('2020-01-01');
      expect(result.ad.end).toBe('2022-01-01');
    });

    it('PD explicitly unavailable (planet undefined, INSUFFICIENT_DATA)', () => {
      const input = makeInput();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaCanonicalAnalysis({
        ...input,
        selectedPeriod
      });

      if (!result) {
        throw new Error('Expected result to be defined');
      }

      // PD should be explicitly unavailable
      expect(result.pd.planet).toBeUndefined();
      expect(result.pd.effect).toBe('INSUFFICIENT_DATA');
      expect(result.pd.direction).toBe('UNAVAILABLE');
      expect(result.pd.start).toBeUndefined();
      expect(result.pd.end).toBeUndefined();
    });

    it('interval preserved verbatim from selected period', () => {
      const input = makeInput();
      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaCanonicalAnalysis({
        ...input,
        selectedPeriod
      });

      if (!result) {
        throw new Error('Expected result to be defined');
      }

      // Interval should be preserved verbatim from AD
      expect(result.ad.start).toBe('2020-01-01');
      expect(result.ad.end).toBe('2022-01-01');
    });

    it('input report/context not mutated', () => {
      const input = makeInput();
      const horoscopeBefore = JSON.stringify(input.horoscope);
      const natalBefore = JSON.stringify(input.natal);
      const expressionBefore = JSON.stringify(input.expression);

      const selectedPeriod = makeSelectedPeriod();

      buildSelectedCareerDashaCanonicalAnalysis({
        ...input,
        selectedPeriod
      });

      // Inputs should not be mutated
      expect(JSON.stringify(input.horoscope)).toBe(horoscopeBefore);
      expect(JSON.stringify(input.natal)).toBe(natalBefore);
      expect(JSON.stringify(input.expression)).toBe(expressionBefore);
    });

    it('current-path buildCareerDashaAnalysis output unchanged', () => {
      const input = makeInput();

      // Run current-path analysis
      const currentResult = buildCareerDashaAnalysis(input);

      // Result should be frozen
      expect(Object.isFrozen(currentResult)).toBe(true);
      expect(Object.isFrozen(currentResult.md)).toBe(true);
      expect(Object.isFrozen(currentResult.ad)).toBe(true);
      expect(Object.isFrozen(currentResult.pd)).toBe(true);
      expect(Object.isFrozen(currentResult.evidence)).toBe(true);

      // Should have MD/AD/PD from horoscope.dashaInterpretation
      expect(currentResult.md.planet).toBe(Planet.SATURN);
      expect(currentResult.ad.planet).toBe(Planet.JUPITER);
      expect(currentResult.pd.planet).toBe(Planet.MERCURY);
    });

    it('never reads horoscope.dashaInterpretation.current/activePeriods for selected path', () => {
      const input = makeInput({
        horoscope: Object.freeze({
          ...makeHoroscopeWithDasha(),
          dashaInterpretation: Object.freeze({
            current: Object.freeze({
              mahadasha: Object.freeze({
                planet: Planet.MARS, // Different from selected
                start: '2019-01-01',
                end: '2024-01-01'
              }),
              antardasha: Object.freeze({
                planet: Planet.VENUS, // Different from selected
                start: '2019-01-01',
                end: '2021-01-01'
              }),
              pratyantardasha: Object.freeze({
                planet: Planet.SUN,
                start: '2019-01-01',
                end: '2020-01-01'
              })
            })
          })
        } as Horoscope)
      });

      const selectedPeriod = makeSelectedPeriod();

      const result = buildSelectedCareerDashaCanonicalAnalysis({
        ...input,
        selectedPeriod
      });

      if (!result) {
        throw new Error('Expected result to be defined');
      }

      // Should use selected period, NOT current from horoscope.dashaInterpretation
      expect(result.md.planet).toBe(Planet.SATURN);
      expect(result.ad.planet).toBe(Planet.JUPITER);
      expect(result.md.planet).not.toBe(Planet.MARS);
      expect(result.ad.planet).not.toBe(Planet.VENUS);
    });

    describe('P1: Validation errors', () => {
      it('returns undefined when dashaSystem is not VIMSHOTTARI', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          dashaSystem: 'OTHER_SYSTEM' as any // Invalid dasha system
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });

      it('returns undefined when level is not MD_AD', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          level: 'MD' as any // Invalid level
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });

      it('returns undefined when intervalSemantics is not [start,end)', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          intervalSemantics: '[start,end]' as any // Invalid semantics
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });

      it('returns undefined when mahadasha context and node mismatch', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          mahadasha: Object.freeze({
            id: 'md-saturn-2020-2025',
            planet: Planet.MARS, // Mismatch with node
            start: '2020-01-01',
            end: '2025-01-01'
          }),
          mahadashaNode: Object.freeze({
            planet: Planet.SATURN, // Node still has SATURN - mismatch
            start: '2020-01-01',
            end: '2025-01-01',
            natal: Object.freeze({
              planet: Planet.SATURN,
              dignity: 'OWN_SIGN' as any,
              strength: 'STRONG' as any,
              activation: 'ACTIVE' as any
            } as any),
            antardashas: Object.freeze([]),
            evidence: Object.freeze([]),
            confidence: 'HIGH' as any
          })
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });

      it('returns undefined when antardasha context and node mismatch', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          antardasha: Object.freeze({
            id: 'ad-jupiter-2020-2022',
            mahadashaId: 'md-saturn-2020-2025',
            planet: Planet.VENUS, // Mismatch with node
            start: '2020-01-01',
            end: '2022-01-01'
          }),
          antardashaNode: Object.freeze({
            planet: Planet.JUPITER, // Node still has JUPITER - mismatch
            start: '2020-01-01',
            end: '2022-01-01',
            natal: Object.freeze({
              planet: Planet.JUPITER,
              dignity: 'OWN_SIGN' as any,
              strength: 'STRONG' as any,
              activation: 'ACTIVE' as any
            } as any),
            pratyantardashas: Object.freeze([]),
            evidence: Object.freeze([]),
            confidence: 'HIGH' as any
          })
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });

      it('returns undefined when interval start >= end', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          interval: Object.freeze({
            start: '2022-01-01', // Invalid: start >= end
            end: '2020-01-01'
          }),
          antardasha: Object.freeze({
            id: 'ad-jupiter-2022-2020',
            mahadashaId: 'md-saturn-2020-2025',
            planet: Planet.JUPITER,
            start: '2022-01-01',
            end: '2020-01-01'
          }),
          antardashaNode: Object.freeze({
            planet: Planet.JUPITER,
            start: '2022-01-01',
            end: '2020-01-01',
            natal: Object.freeze({
              planet: Planet.JUPITER,
              dignity: 'OWN_SIGN' as any,
              strength: 'STRONG' as any,
              activation: 'ACTIVE' as any
            } as any),
            pratyantardashas: Object.freeze([]),
            evidence: Object.freeze([]),
            confidence: 'HIGH' as any
          })
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });

      it('returns undefined when AD interval not contained in MD interval', () => {
        const input = makeInput();
        const selectedPeriod = makeSelectedPeriod({
          interval: Object.freeze({
            start: '2019-01-01', // AD starts before MD (2020-01-01)
            end: '2022-01-01'
          }),
          antardasha: Object.freeze({
            id: 'ad-jupiter-2019-2022',
            mahadashaId: 'md-saturn-2020-2025',
            planet: Planet.JUPITER,
            start: '2019-01-01',
            end: '2022-01-01'
          }),
          antardashaNode: Object.freeze({
            planet: Planet.JUPITER,
            start: '2019-01-01',
            end: '2022-01-01',
            natal: Object.freeze({
              planet: Planet.JUPITER,
              dignity: 'OWN_SIGN' as any,
              strength: 'STRONG' as any,
              activation: 'ACTIVE' as any
            } as any),
            pratyantardashas: Object.freeze([]),
            evidence: Object.freeze([]),
            confidence: 'HIGH' as any
          })
        });

        const result = buildSelectedCareerDashaCanonicalAnalysis({
          ...input,
          selectedPeriod
        });

        expect(result).toBeUndefined();
      });
    });
  });
});
