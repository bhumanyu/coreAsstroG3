import {
  mapCanonicalCareerEvidence,
  validateC11References,
  deduplicateCanonicalEvidence,
  type CanonicalCareerEvidenceInput
} from './canonicalCareerEvidenceMapper';

import {
  resolveManifestation
} from './manifestation/careerManifestationSynthesis';

import {
  createDomainEvidence
} from '../interpretation/DomainEvidence';

import type {
  CareerNatalAnalysis
} from './careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpression,
  CareerExpressionEvidence,
  CareerExpressionStrength
} from './careerExpression';

import type {
  CareerDashaCanonicalAnalysis,
  CareerDashaCanonicalEvidence,
  CareerDashaCanonicalPeriod
} from './careerDasha/careerDashaCanonicalTypes';

import type {
  CareerD10CanonicalAnalysis,
  CareerD10CanonicalEvidence
} from './careerD10/careerD10CanonicalTypes';

import type {
  CareerFinalSynthesisResult
} from './careerFinalSynthesis/careerFinalSynthesisTypes';

import type {
  WeightedReasoningEvidence,
  ReasoningDirection,
  DomainStrength
} from '../reasoning/reasoningTypes';

import type {
  CareerStructuralReasoning
} from './careerStructuralReasoning';

import type {
  ReasoningTrace
} from '../reasoning/reasoningTypes';

import {
  Planet
} from '../../types';

describe('CanonicalCareerEvidenceMapper', () => {
  describe('Natal Evidence Mapping', () => {
    it('maps natal supporting evidence to NATAL_PROMISE/SUPPORTING with identity preserved', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'natal-identity-1',
          evidenceId: 'natal-evidence-1',
          ruleId: 'RULE_NATAL_1',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 3,
          statement: 'Strong natal support for career',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.phase).toBe('NATAL_PROMISE');
      expect(evidence.polarity).toBe('SUPPORTING');
      expect(evidence.source).toBe('C4_STRUCTURAL_REASONING');
      expect(evidence.role).toBe('PRIMARY');
      expect(evidence.identityKey).toBe('natal-identity-1');
      expect(evidence.ruleId).toBe('RULE_NATAL_1');
      expect(evidence.relatedEvidenceIds).toEqual(['source-1']);
    });

    it('natal challenging evidence stays CHALLENGING', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'CHALLENGE',
        strength: 'WEAK',
        primarySupport: 2,
        primaryChallenge: 10,
        supportingSupport: 1,
        supportingChallenge: 5,
        challengingSupport: 3,
        challengingChallenge: 1,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'natal-challenge-1',
          evidenceId: 'natal-challenge-ev-1',
          ruleId: 'RULE_CHALLENGE_1',
          layer: 'SECONDARY_SUPPORT',
          direction: 'CHALLENGE' as ReasoningDirection,
          strength: 'WEAK',
          priority: 1,
          weight: 2,
          statement: 'Challenging natal factor',
          relatedEvidenceIds: [],
          sourceIds: ['source-challenge-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: [],
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'CHALLENGE' as ReasoningDirection,
        strength: 'WEAK' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.phase).toBe('NATAL_PROMISE');
      expect(evidence.polarity).toBe('CHALLENGING');
      expect(evidence.role).toBe('SECONDARY');
      expect(evidence.identityKey).toBe('natal-challenge-1');
    });

    it('MIXED direction preserves both occurrences under one identityKey without doubled weight', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'MIXED',
        strength: 'MODERATE',
        primarySupport: 5,
        primaryChallenge: 5,
        supportingSupport: 2,
        supportingChallenge: 2,
        challengingSupport: 2,
        challengingChallenge: 2,
        mixedWeight: 5,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'natal-mixed-1',
          evidenceId: 'natal-mixed-ev-1',
          ruleId: 'RULE_MIXED_1',
          layer: 'PRIMARY_PROMISE',
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE',
          priority: 2,
          weight: 3,
          statement: 'Mixed natal factor',
          relatedEvidenceIds: [],
          sourceIds: ['source-mixed-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'MIXED' as ReasoningDirection,
        strength: 'MODERATE' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // MIXED should split into two occurrences
      const mixedEvidence = result.filter(e => e.identityKey === 'natal-mixed-1');
      expect(mixedEvidence).toHaveLength(2);

      const supporting = mixedEvidence.find(e => e.polarity === 'SUPPORTING');
      const challenging = mixedEvidence.find(e => e.polarity === 'CHALLENGING');

      expect(supporting).toBeDefined();
      expect(challenging).toBeDefined();

      // Both share the same identityKey
      expect(supporting!.identityKey).toBe('natal-mixed-1');
      expect(challenging!.identityKey).toBe('natal-mixed-1');

      // Both share the same ruleId
      expect(supporting!.ruleId).toBe('RULE_MIXED_1');
      expect(challenging!.ruleId).toBe('RULE_MIXED_1');

      // Weight is not doubled (each has the original weight)
      expect(supporting!.priority).toBe(2);
      expect(challenging!.priority).toBe(2);

      // Provenance effect is MIXED for both
      expect(supporting!.provenance?.effect).toBe('MIXED');
      expect(challenging!.provenance?.effect).toBe('MIXED');
    });
  });

  describe('Expression Evidence Mapping', () => {
    it('preserves expression evidence without manufactured conclusion', () => {
      const expressionEvidence: CareerExpressionEvidence[] = [
        {
          id: 'expr-evidence-1',
          mode: 'TECHNICAL_SPECIALIZATION',
          role: 'PLANETARY',
          statement: 'Technical specialization indicated by Mercury',
          weight: 2,
          planets: [Planet.MERCURY],
          houses: [6, 10]
        }
      ];

      const expression: CareerExpression = {
        mode: 'TECHNICAL_SPECIALIZATION',
        direction: 'SUPPORTED',
        strength: 'STRONG',
        evidence: expressionEvidence,
        supportingEvidenceIds: ['expr-evidence-1'],
        statement: 'Technical specialization expression',
        conditional: false
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: expression,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.phase).toBe('MODIFIER');
      expect(evidence.source).toBe('D1');
      expect(evidence.role).toBe('MODIFIER');
      expect(evidence.polarity).toBe('SUPPORTING');
      expect(evidence.id).toBe('expr-evidence-1');
      expect(evidence.statement).toBe('Technical specialization indicated by Mercury');

      // No ruleId fabricated for expression evidence
      expect(evidence.ruleId).toBeUndefined();
    });

    it('CONDITIONAL expression maps to SUPPORTING with notes', () => {
      const expressionEvidence: CareerExpressionEvidence[] = [
        {
          id: 'expr-conditional-1',
          mode: 'MANAGEMENT',
          role: 'PLANETARY',
          statement: 'Management with conditions',
          weight: 2,
          planets: [Planet.JUPITER],
          houses: [10]
        }
      ];

      const expression: CareerExpression = {
        mode: 'MANAGEMENT',
        direction: 'CONDITIONAL',
        strength: 'MODERATE',
        evidence: expressionEvidence,
        supportingEvidenceIds: ['expr-conditional-1'],
        statement: 'Conditional management expression',
        conditional: true
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: expression,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.polarity).toBe('SUPPORTING');
      expect(evidence.notes).toContain('CONDITIONAL');
    });

    it('UNAVAILABLE expression emits nothing (not negative evidence)', () => {
      const expression: CareerExpression = {
        mode: 'LEADERSHIP',
        direction: 'UNAVAILABLE',
        strength: 'UNAVAILABLE',
        evidence: [],
        supportingEvidenceIds: [],
        statement: 'Leadership unavailable',
        conditional: false
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: undefined,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // UNAVAILABLE expression should emit no evidence
      const expressionEvidence = result.filter(e => e.phase === 'MODIFIER');
      expect(expressionEvidence).toHaveLength(0);
    });
  });

  describe('Dasha Evidence Mapping', () => {
    it('Dasha MIXED + DOES_NOT_ACTIVATE throws (disallowed combination)', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-mixed-disallowed',
          id: 'dasha-mixed-disallowed-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'DOES_NOT_ACTIVATE', // Disallowed with MIXED
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE' as DomainStrength,
          statement: 'Saturn MD mixed activation with disallowed effect',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'DOES_NOT_ACTIVATE',
        direction: 'MIXED' as ReasoningDirection,
        strength: 'MODERATE' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'DOES_NOT_ACTIVATE',
        overallDirection: 'MIXED' as ReasoningDirection,
        overallStrength: 'MODERATE' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha with disallowed MIXED/effect combination'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to disallowed MIXED/effect combination
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('MIXED direction/effect disallowed');
    });

    it('Dasha MIXED + PARTIALLY_ACTIVATES splits into SUPPORTING and CHALLENGING (allowed combination)', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-mixed-allowed',
          id: 'dasha-mixed-allowed-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'PARTIALLY_ACTIVATES', // Allowed with MIXED
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE' as DomainStrength,
          statement: 'Saturn MD mixed activation with allowed effect',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'PARTIALLY_ACTIVATES',
        direction: 'MIXED' as ReasoningDirection,
        strength: 'MODERATE' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'PARTIALLY_ACTIVATES',
        overallDirection: 'MIXED' as ReasoningDirection,
        overallStrength: 'MODERATE' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha with allowed MIXED/effect combination'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // MIXED should split into two occurrences
      const mixedEvidence = result.filter(e => e.identityKey === 'dasha-mixed-allowed');
      expect(mixedEvidence).toHaveLength(2);

      const supporting = mixedEvidence.find(e => e.polarity === 'SUPPORTING');
      const challenging = mixedEvidence.find(e => e.polarity === 'CHALLENGING');

      expect(supporting).toBeDefined();
      expect(challenging).toBeDefined();

      // Both share the same identityKey
      expect(supporting!.identityKey).toBe('dasha-mixed-allowed');
      expect(challenging!.identityKey).toBe('dasha-mixed-allowed');

      // Both have distinct ids with polarity suffix
      expect(supporting!.id).toBe('dasha-mixed-allowed-1:SUPPORTING');
      expect(challenging!.id).toBe('dasha-mixed-allowed-1:CHALLENGING');
    });

    it('Dasha MIXED direction splits into SUPPORTING and CHALLENGING occurrences', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-mixed-1',
          id: 'dasha-mixed-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE' as DomainStrength,
          statement: 'Saturn MD mixed activation',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'PARTIALLY_ACTIVATES',
        direction: 'MIXED' as ReasoningDirection,
        strength: 'MODERATE' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'PARTIALLY_ACTIVATES',
        overallDirection: 'MIXED' as ReasoningDirection,
        overallStrength: 'MODERATE' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha with MIXED direction'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // MIXED should split into two occurrences
      const mixedEvidence = result.filter(e => e.identityKey === 'dasha-mixed-1');
      expect(mixedEvidence).toHaveLength(2);

      const supporting = mixedEvidence.find(e => e.polarity === 'SUPPORTING');
      const challenging = mixedEvidence.find(e => e.polarity === 'CHALLENGING');

      expect(supporting).toBeDefined();
      expect(challenging).toBeDefined();

      // Both share the same identityKey
      expect(supporting!.identityKey).toBe('dasha-mixed-1');
      expect(challenging!.identityKey).toBe('dasha-mixed-1');

      // Both have distinct ids with polarity suffix
      expect(supporting!.id).toBe('dasha-mixed-1:SUPPORTING');
      expect(challenging!.id).toBe('dasha-mixed-1:CHALLENGING');

      // Both have DASHA_ACTIVATION phase and TIMING role
      expect(supporting!.phase).toBe('DASHA_ACTIVATION');
      expect(challenging!.phase).toBe('DASHA_ACTIVATION');
      expect(supporting!.role).toBe('TIMING');
      expect(challenging!.role).toBe('TIMING');

      // Timing is preserved for both
      expect(supporting!.timing?.period).toBe('MD');
      expect(challenging!.timing?.period).toBe('MD');
    });

    it('maps Dasha evidence to DASHA_ACTIVATION phase with TIMING role', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.phase).toBe('DASHA_ACTIVATION');
      expect(evidence.source).toBe('DASHA');
      expect(evidence.role).toBe('TIMING');
      expect(evidence.polarity).toBe('SUPPORTING');
      expect(evidence.strength).toBe('STRONG');
      expect(evidence.identityKey).toBe('dasha-identity-1');
      expect(evidence.timing?.period).toBe('MD');
      expect(evidence.timing?.planet).toBe(Planet.SATURN);

      // Dasha cannot be PRIMARY natal (role is TIMING, not PRIMARY)
      expect(evidence.role).not.toBe('PRIMARY');

      // Dasha evidence has no fabricated ruleId
      expect(evidence.ruleId).toBeUndefined();
      expect(evidence.provenance?.ruleId).toBeUndefined();
    });

    it('excludes Dasha evidence with unmappable strength (UNDETERMINED, VERY_WEAK, MIXED)', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-undetermined',
          id: 'dasha-undetermined-1',
          level: 'MD',
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'UNDETERMINED' as DomainStrength,
          statement: 'Undetermined strength',
          sourceIds: [],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: []
          }
        },
        {
          identityKey: 'dasha-very-weak',
          id: 'dasha-very-weak-1',
          level: 'MD',
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'VERY_WEAK' as DomainStrength,
          statement: 'Very weak strength',
          sourceIds: [],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: []
          }
        }
      ];

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'UNDETERMINED' as DomainStrength,
        dominantLevel: 'NONE',
        md: createEmptyDashaPeriod('MD'),
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: [],
        statement: 'Dasha with unmappable strength'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // Evidence with unmappable strength should be excluded
      const dashaResults = result.filter(e => e.phase === 'DASHA_ACTIVATION');
      expect(dashaResults).toHaveLength(0);
    });
  });

  describe('D10 Evidence Mapping', () => {
    it('maps D10 evidence to VARGA_CONFIRMATION phase with CONFIRMATION role', () => {
      const d10Evidence: CareerD10CanonicalEvidence[] = [
        {
          identityKey: 'd10-identity-1',
          id: 'd10-evidence-1',
          role: 'PRIMARY',
          direction: 'SUPPORT',
          d10Effect: 'QUALIFIES',
          d10Strength: 'STRONG',
          weight: 3,
          statement: 'D10 qualifies career potential',
          sourceIds: ['d10-source-1'],
          provenance: {
            source: 'C10_D10',
            ruleIds: ['RULE_D10_1'],
            sourceIds: ['d10-source-1'],
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const d10: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        d10Effect: 'QUALIFIES',
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        qualifiedDirection: 'SUPPORT',
        qualifiedStrength: 'STRONG',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: d10Evidence,
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: ['natal-root-1'],
        statement: 'D10 analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10,
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.phase).toBe('VARGA_CONFIRMATION');
      expect(evidence.source).toBe('D10');
      expect(evidence.role).toBe('CONFIRMATION');
      expect(evidence.polarity).toBe('SUPPORTING');
      expect(evidence.strength).toBe('STRONG');
      expect(evidence.identityKey).toBe('d10-identity-1');
      expect(evidence.ruleId).toBe('RULE_D10_1');

      // D10 cannot establish natal promise (phase is VARGA_CONFIRMATION, not NATAL_PROMISE)
      expect(evidence.phase).not.toBe('NATAL_PROMISE');
    });

    it('missing provenance ruleIds leaves ruleId absent (no fabrication)', () => {
      const d10Evidence: CareerD10CanonicalEvidence[] = [
        {
          identityKey: 'd10-no-rule',
          id: 'd10-no-rule-1',
          role: 'SUPPORTING',
          direction: 'SUPPORT',
          d10Effect: 'QUALIFIES',
          d10Strength: 'MODERATE',
          weight: 2,
          statement: 'D10 evidence without ruleIds',
          sourceIds: ['d10-source-2'],
          provenance: {
            source: 'C10_D10',
            ruleIds: [], // Empty ruleIds
            sourceIds: ['d10-source-2'],
            natalRootIds: []
          }
        }
      ];

      const d10: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        d10Effect: 'QUALIFIES',
        d10Direction: 'SUPPORT',
        d10Strength: 'MODERATE',
        qualifiedDirection: 'SUPPORT',
        qualifiedStrength: 'MODERATE',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: d10Evidence,
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: [],
        statement: 'D10 without ruleIds'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10,
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      // No ruleId fabricated when provenance.ruleIds is empty
      expect(evidence.ruleId).toBeUndefined();
    });

    it('excludes D10 evidence with unmappable strength (VERY_WEAK, UNDETERMINED)', () => {
      const d10Evidence: CareerD10CanonicalEvidence[] = [
        {
          identityKey: 'd10-very-weak',
          id: 'd10-very-weak-1',
          role: 'SUPPORTING',
          direction: 'SUPPORT',
          d10Effect: 'QUALIFIES',
          d10Strength: 'VERY_WEAK',
          weight: 1,
          statement: 'Very weak D10 evidence',
          sourceIds: [],
          provenance: {
            source: 'C10_D10',
            ruleIds: [],
            sourceIds: [],
            natalRootIds: []
          }
        }
      ];

      const d10: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        d10Effect: 'QUALIFIES',
        d10Direction: 'SUPPORT',
        d10Strength: 'VERY_WEAK',
        qualifiedDirection: 'SUPPORT',
        qualifiedStrength: 'VERY_WEAK',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: d10Evidence,
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: [],
        statement: 'D10 with very weak strength'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10,
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // Evidence with unmappable strength should be excluded
      const d10Results = result.filter(e => e.phase === 'VARGA_CONFIRMATION');
      expect(d10Results).toHaveLength(0);
    });
  });

  describe('Missing Layer Data', () => {
    it('missing-layer data yields no fabricated negative evidence', () => {
      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // Empty inputs should produce no evidence (not negative evidence)
      expect(result).toHaveLength(0);
    });
  });

  describe('Deduplication', () => {
    it('duplicate semantic identity dedupes without weight inflation', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'duplicate-identity',
          evidenceId: 'duplicate-1',
          ruleId: 'RULE_DUPLICATE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 3,
          weight: 3,
          statement: 'Duplicate evidence',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'duplicate-identity',
          evidenceId: 'duplicate-2',
          ruleId: 'RULE_DUPLICATE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 2,
          weight: 2,
          statement: 'Duplicate evidence',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // Should deduplicate to one record
      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.identityKey).toBe('duplicate-identity');

      // Priority should be max (3), not sum (5)
      expect(evidence.priority).toBe(3);

      // Both sourceIds should be merged
      expect(evidence.relatedEvidenceIds).toContain('source-1');
      expect(evidence.relatedEvidenceIds).toContain('source-2');
    });

    it('multiple occurrences retain required sourceIds', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'multi-occurrence',
          evidenceId: 'multi-1',
          ruleId: 'RULE_MULTI',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Multi-occurrence evidence',
          relatedEvidenceIds: [],
          sourceIds: ['src-a', 'src-b']
        },
        {
          identityKey: 'multi-occurrence',
          evidenceId: 'multi-2',
          ruleId: 'RULE_MULTI',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Multi-occurrence evidence',
          relatedEvidenceIds: [],
          sourceIds: ['src-c', 'src-d']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      // All sourceIds should be present
      expect(evidence.relatedEvidenceIds).toContain('src-a');
      expect(evidence.relatedEvidenceIds).toContain('src-b');
      expect(evidence.relatedEvidenceIds).toContain('src-c');
      expect(evidence.relatedEvidenceIds).toContain('src-d');
      expect(evidence.relatedEvidenceIds).toHaveLength(4);
    });
  });

  describe('Determinism', () => {
    it('input-order invariance: different input order produces same output', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence1: WeightedReasoningEvidence[] = [
        {
          identityKey: 'identity-a',
          evidenceId: 'ev-a',
          ruleId: 'RULE_A',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Evidence A',
          relatedEvidenceIds: [],
          sourceIds: ['src-a']
        },
        {
          identityKey: 'identity-b',
          evidenceId: 'ev-b',
          ruleId: 'RULE_B',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Evidence B',
          relatedEvidenceIds: [],
          sourceIds: ['src-b']
        }
      ];

      const mockEvidence2: WeightedReasoningEvidence[] = [
        mockEvidence1[1],
        mockEvidence1[0]
      ];

      const mockReasoningTrace1: ReasoningTrace = {
        primaryPromise: mockEvidence1,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const mockReasoningTrace2: ReasoningTrace = {
        primaryPromise: mockEvidence2,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal1: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence1,
        conflicts: [],
        reasoningTrace: mockReasoningTrace1
      };

      const natal2: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence2,
        conflicts: [],
        reasoningTrace: mockReasoningTrace2
      };

      const input1: CanonicalCareerEvidenceInput = {
        natal: natal1,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const input2: CanonicalCareerEvidenceInput = {
        natal: natal2,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result1 = mapCanonicalCareerEvidence(input1);
      const result2 = mapCanonicalCareerEvidence(input2);

      // Results should be identical (deterministic sort)
      expect(result1).toEqual(result2);
    });
  });

  describe('Identity Distinction', () => {
    it('distinct id, sourceIds, and ruleId are preserved as separate concepts', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'semantic-identity',
          evidenceId: 'occurrence-id-1',
          ruleId: 'RULE_SEMANTIC',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Evidence with distinct identities',
          relatedEvidenceIds: [],
          sourceIds: ['source-occurrence-a', 'source-occurrence-b']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      // id is the occurrence identifier
      expect(evidence.id).toBe('occurrence-id-1');

      // identityKey is the semantic identity
      expect(evidence.identityKey).toBe('semantic-identity');

      // ruleId is the rule identifier
      expect(evidence.ruleId).toBe('RULE_SEMANTIC');

      // sourceIds are in relatedEvidenceIds
      expect(evidence.relatedEvidenceIds).toContain('source-occurrence-a');
      expect(evidence.relatedEvidenceIds).toContain('source-occurrence-b');

      // All three are distinct
      expect(evidence.id).not.toBe(evidence.identityKey);
      expect(evidence.id).not.toBe(evidence.ruleId);
      expect(evidence.identityKey).not.toBe(evidence.ruleId);
    });
  });

  describe('C11 Reference Validation', () => {
    it('unknown C11 evidence references are handled explicitly (ignored)', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'test-identity',
          evidenceId: 'test-evidence-1',
          ruleId: 'RULE_TEST',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Test evidence',
          relatedEvidenceIds: [],
          sourceIds: ['src-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      // C11 has evidenceIds that don't match mapper output
      const finalSynthesis: CareerFinalSynthesisResult = {
        reasoningVersion: 'C11',
        domain: 'CAREER',
        finalStatus: 'SUPPORTED',
        finalDirection: 'SUPPORT',
        finalStrength: 'STRONG',
        confidence: 'HIGH',
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        expressionStatus: 'SUPPORT',
        d10Direction: 'SUPPORT',
        d10Effect: 'QUALIFIES',
        dashaEffect: 'ACTIVATES',
        dashaDirection: 'SUPPORT',
        timingStatus: 'ACTIVE',
        transitDirection: 'NEUTRAL',
        currentPressure: 'NONE',
        expressions: [],
        strongestExpressions: [],
        challengedExpressions: [],
        conflicts: [],
        evidenceIds: ['unknown-evidence-id'], // Unknown reference
        sourceIds: [],
        ruleIds: [],
        evidenceTrace: {
          evidenceIds: ['unknown-evidence-id'],
          sourceIds: [],
          ruleIds: []
        },
        statement: 'Final synthesis with unknown reference'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis
      };

      // Should not throw - unknown references are handled explicitly
      const result = mapCanonicalCareerEvidence(input);

      // Mapper should still produce its output
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-evidence-1');

      // Also test the exposed validation function
      const validationResult = validateC11References(result, finalSynthesis);
      expect(validationResult.unreferenced).toContain('test-identity');
      expect(validationResult.missing).toContain('unknown-evidence-id');
    });

    it('C11 evidenceId matching identityKey (not id) is treated as referenced', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'semantic-identity-1',
          evidenceId: 'occurrence-id-1',
          ruleId: 'RULE_TEST',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Test evidence',
          relatedEvidenceIds: [],
          sourceIds: ['src-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      // C11 has evidenceId that matches identityKey but not occurrence id
      const finalSynthesis: CareerFinalSynthesisResult = {
        reasoningVersion: 'C11',
        domain: 'CAREER',
        finalStatus: 'SUPPORTED',
        finalDirection: 'SUPPORT',
        finalStrength: 'STRONG',
        confidence: 'HIGH',
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        expressionStatus: 'SUPPORT',
        d10Direction: 'SUPPORT',
        d10Effect: 'QUALIFIES',
        dashaEffect: 'ACTIVATES',
        dashaDirection: 'SUPPORT',
        timingStatus: 'ACTIVE',
        transitDirection: 'NEUTRAL',
        currentPressure: 'NONE',
        expressions: [],
        strongestExpressions: [],
        challengedExpressions: [],
        conflicts: [],
        evidenceIds: ['semantic-identity-1'], // Matches identityKey, not occurrence id
        sourceIds: [],
        ruleIds: [],
        evidenceTrace: {
          evidenceIds: ['semantic-identity-1'],
          sourceIds: [],
          ruleIds: []
        },
        statement: 'Final synthesis with identityKey reference'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis
      };

      const result = mapCanonicalCareerEvidence(input);

      // Should not throw - identityKey match is valid
      expect(result).toHaveLength(1);
      expect(result[0].identityKey).toBe('semantic-identity-1');
      expect(result[0].id).toBe('occurrence-id-1');

      // Validation should show no missing/unreferenced since identityKey matches
      const validationResult = validateC11References(result, finalSynthesis);
      expect(validationResult.unreferenced).not.toContain('semantic-identity-1');
      expect(validationResult.missing).not.toContain('semantic-identity-1');
    });
  });

  describe('Dasha Evidence Mapping', () => {
    it('Dasha evidence has no fabricated ruleId (omitted when real ruleId does not exist)', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      // No ruleId or provenance should be present (CareerDashaCanonicalProvenance does not expose ruleId)
      expect(evidence.ruleId).toBeUndefined();
      expect(evidence.provenance).toBeUndefined();
    });

    it('Dasha evidence preserves sourceIds in relatedEvidenceIds', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1', 'dasha-source-2'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.relatedEvidenceIds).toContain('dasha-source-1');
      expect(evidence.relatedEvidenceIds).toContain('dasha-source-2');
      expect(evidence.relatedEvidenceIds).toHaveLength(2);
    });

    it('Dasha polarity/effect consistency: throws on SUPPORTING with CHALLENGE effect', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'CHALLENGES', // CHALLENGE effect
          direction: 'SUPPORT', // SUPPORT direction
          strength: 'STRONG' as DomainStrength,
          statement: 'Inconsistent Dasha evidence',
          sourceIds: [],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: []
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'CHALLENGES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'CHALLENGES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: [],
        statement: 'Dasha with inconsistency'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to polarity/effect inconsistency
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('polarity/effect inconsistency');
    });
  });

  describe('D10 MIXED Evidence Mapping', () => {
    it('D10 MIXED direction splits into SUPPORTING and CHALLENGING occurrences', () => {
      const d10Evidence: CareerD10CanonicalEvidence[] = [
        {
          identityKey: 'd10-mixed-1',
          id: 'd10-mixed-1',
          role: 'PRIMARY',
          direction: 'MIXED',
          d10Effect: 'QUALIFIES',
          d10Strength: 'MODERATE',
          weight: 2,
          statement: 'D10 mixed evidence',
          sourceIds: ['d10-source-1'],
          provenance: {
            source: 'C10_D10',
            ruleIds: ['RULE_D10_1'],
            sourceIds: ['d10-source-1'],
            natalRootIds: []
          }
        }
      ];

      const d10: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'MIXED',
        natalStrength: 'MODERATE',
        d10Effect: 'QUALIFIES',
        d10Direction: 'MIXED',
        d10Strength: 'MODERATE',
        qualifiedDirection: 'MIXED',
        qualifiedStrength: 'MODERATE',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: d10Evidence,
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: [],
        statement: 'D10 with MIXED direction'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10,
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // MIXED should split into two occurrences
      const mixedEvidence = result.filter(e => e.identityKey === 'd10-mixed-1');
      expect(mixedEvidence).toHaveLength(2);

      const supporting = mixedEvidence.find(e => e.polarity === 'SUPPORTING');
      const challenging = mixedEvidence.find(e => e.polarity === 'CHALLENGING');

      expect(supporting).toBeDefined();
      expect(challenging).toBeDefined();

      // Both share the same identityKey
      expect(supporting!.identityKey).toBe('d10-mixed-1');
      expect(challenging!.identityKey).toBe('d10-mixed-1');

      // Both have MIXED provenance effect
      expect(supporting!.provenance?.effect).toBe('MIXED');
      expect(challenging!.provenance?.effect).toBe('MIXED');
    });
  });

  describe('Expression Strength Mapping', () => {
    it('throws on unexpected CareerExpressionStrength value', () => {
      const expressionEvidence: CareerExpressionEvidence[] = [
        {
          id: 'expr-evidence-1',
          mode: 'TECHNICAL_SPECIALIZATION',
          role: 'PLANETARY',
          statement: 'Technical specialization indicated by Mercury',
          weight: 2,
          planets: [Planet.MERCURY],
          houses: [6, 10]
        }
      ];

      const expression: CareerExpression = {
        mode: 'TECHNICAL_SPECIALIZATION',
        direction: 'SUPPORTED',
        // Use type assertion to simulate invalid runtime value
        strength: 'INVALID_STRENGTH' as CareerExpressionStrength,
        evidence: expressionEvidence,
        supportingEvidenceIds: ['expr-evidence-1'],
        statement: 'Technical specialization expression',
        conditional: false
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: expression,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to unexpected strength value
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('Unexpected CareerExpressionStrength value');
    });

    it('expression UNAVAILABLE strength excludes record (returns null)', () => {
      const expressionEvidence: CareerExpressionEvidence[] = [
        {
          id: 'expr-evidence-1',
          mode: 'TECHNICAL_SPECIALIZATION',
          role: 'PLANETARY',
          statement: 'Technical specialization indicated by Mercury',
          weight: 2,
          planets: [Planet.MERCURY],
          houses: [6, 10]
        }
      ];

      const expression: CareerExpression = {
        mode: 'TECHNICAL_SPECIALIZATION',
        direction: 'SUPPORTED',
        strength: 'UNAVAILABLE', // Unavailable strength
        evidence: expressionEvidence,
        supportingEvidenceIds: ['expr-evidence-1'],
        statement: 'Technical specialization expression',
        conditional: false
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: expression,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // UNAVAILABLE strength should exclude the record
      expect(result).toHaveLength(0);
    });
  });



  describe('Deduplication Field Disagreement', () => {
    it('throws on strength disagreement in dedup', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'disagree-identity',
          evidenceId: 'disagree-1',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'First occurrence',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'disagree-identity',
          evidenceId: 'disagree-2',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection, // Same direction
          strength: 'WEAK', // Different strength
          priority: 1,
          weight: 2,
          statement: 'Second occurrence',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to strength disagreement
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('Semantic field disagreement');
    });
  });

  describe('Missing Identity Key Policy', () => {
    it('records without identityKey are emitted as separate non-deduplicable items', () => {
      // Direct unit test of the dedup helper's no-identityKey branch
      // Construct two DomainEvidence records with identityKey: undefined
      // Make them otherwise merge-compatible (same statement, ruleId, etc.)
      // Use distinct ids since identityKey is absent
      const evidence1 = createDomainEvidence({
        id: 'no-identity-1',
        sourceType: 'STRUCTURAL',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'C4_STRUCTURAL_REASONING',
        statement: 'Evidence without identityKey',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 1,
        ruleId: 'RULE_NO_IDENTITY',
        relatedEvidenceIds: ['src-1'],
        // identityKey is intentionally undefined
      });

      const evidence2 = createDomainEvidence({
        id: 'no-identity-2',
        sourceType: 'STRUCTURAL',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'C4_STRUCTURAL_REASONING',
        statement: 'Evidence without identityKey',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 1,
        ruleId: 'RULE_NO_IDENTITY',
        relatedEvidenceIds: ['src-2'],
        // identityKey is intentionally undefined
      });

      const result = deduplicateCanonicalEvidence([evidence1, evidence2]);

      // Both should survive as separate output items (not merged)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('no-identity-1');
      expect(result[1].id).toBe('no-identity-2');
      expect(result[0].identityKey).toBeUndefined();
      expect(result[1].identityKey).toBeUndefined();
    });

    it('records with unique identityKeys are preserved as separate items', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'unique-identity-1',
          evidenceId: 'unique-1',
          ruleId: 'RULE_UNIQUE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Evidence with unique identityKey',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'unique-identity-2',
          evidenceId: 'unique-2',
          ruleId: 'RULE_UNIQUE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Another evidence with unique identityKey',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // Both records should be preserved separately (different identityKeys)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('unique-1');
      expect(result[1].id).toBe('unique-2');
    });
  });

  describe('Immutability', () => {
    it('Dasha evidence has no fabricated ruleId (omitted when real ruleId does not exist)', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      // No ruleId or provenance should be present (CareerDashaCanonicalProvenance does not expose ruleId)
      expect(evidence.ruleId).toBeUndefined();
      expect(evidence.provenance).toBeUndefined();
    });

    it('Dasha evidence preserves sourceIds in relatedEvidenceIds', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1', 'dasha-source-2'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      expect(evidence.relatedEvidenceIds).toContain('dasha-source-1');
      expect(evidence.relatedEvidenceIds).toContain('dasha-source-2');
      expect(evidence.relatedEvidenceIds).toHaveLength(2);
    });

    it('Dasha polarity/effect consistency: throws on SUPPORTING with CHALLENGE effect', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'CHALLENGES', // CHALLENGE effect
          direction: 'SUPPORT', // SUPPORT direction
          strength: 'STRONG' as DomainStrength,
          statement: 'Inconsistent Dasha evidence',
          sourceIds: [],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: []
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'CHALLENGES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'CHALLENGES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: [],
        statement: 'Dasha with inconsistency'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to polarity/effect inconsistency
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('polarity/effect inconsistency');
    });
  });

  describe('D10 MIXED Evidence Mapping', () => {
    it('D10 MIXED direction splits into SUPPORTING and CHALLENGING occurrences', () => {
      const d10Evidence: CareerD10CanonicalEvidence[] = [
        {
          identityKey: 'd10-mixed-1',
          id: 'd10-mixed-1',
          role: 'PRIMARY',
          direction: 'MIXED',
          d10Effect: 'QUALIFIES',
          d10Strength: 'MODERATE',
          weight: 2,
          statement: 'D10 mixed evidence',
          sourceIds: ['d10-source-1'],
          provenance: {
            source: 'C10_D10',
            ruleIds: ['RULE_D10_1'],
            sourceIds: ['d10-source-1'],
            natalRootIds: []
          }
        }
      ];

      const d10: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'MIXED',
        natalStrength: 'MODERATE',
        d10Effect: 'QUALIFIES',
        d10Direction: 'MIXED',
        d10Strength: 'MODERATE',
        qualifiedDirection: 'MIXED',
        qualifiedStrength: 'MODERATE',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: d10Evidence,
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: [],
        statement: 'D10 with MIXED direction'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10,
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // MIXED should split into two occurrences
      const mixedEvidence = result.filter(e => e.identityKey === 'd10-mixed-1');
      expect(mixedEvidence).toHaveLength(2);

      const supporting = mixedEvidence.find(e => e.polarity === 'SUPPORTING');
      const challenging = mixedEvidence.find(e => e.polarity === 'CHALLENGING');

      expect(supporting).toBeDefined();
      expect(challenging).toBeDefined();

      // Both share the same identityKey
      expect(supporting!.identityKey).toBe('d10-mixed-1');
      expect(challenging!.identityKey).toBe('d10-mixed-1');

      // Both have MIXED provenance effect
      expect(supporting!.provenance?.effect).toBe('MIXED');
      expect(challenging!.provenance?.effect).toBe('MIXED');
    });
  });

  describe('Expression Strength Mapping', () => {
    it('throws on unexpected CareerExpressionStrength value', () => {
      const expressionEvidence: CareerExpressionEvidence[] = [
        {
          id: 'expr-evidence-1',
          mode: 'TECHNICAL_SPECIALIZATION',
          role: 'PLANETARY',
          statement: 'Technical specialization indicated by Mercury',
          weight: 2,
          planets: [Planet.MERCURY],
          houses: [6, 10]
        }
      ];

      const expression: CareerExpression = {
        mode: 'TECHNICAL_SPECIALIZATION',
        direction: 'SUPPORTED',
        // Use type assertion to simulate invalid runtime value
        strength: 'INVALID_STRENGTH' as CareerExpressionStrength,
        evidence: expressionEvidence,
        supportingEvidenceIds: ['expr-evidence-1'],
        statement: 'Technical specialization expression',
        conditional: false
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: expression,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to unexpected strength value
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('Unexpected CareerExpressionStrength value');
    });

    it('expression UNAVAILABLE strength excludes record (returns null)', () => {
      const expressionEvidence: CareerExpressionEvidence[] = [
        {
          id: 'expr-evidence-1',
          mode: 'TECHNICAL_SPECIALIZATION',
          role: 'PLANETARY',
          statement: 'Technical specialization indicated by Mercury',
          weight: 2,
          planets: [Planet.MERCURY],
          houses: [6, 10]
        }
      ];

      const expression: CareerExpression = {
        mode: 'TECHNICAL_SPECIALIZATION',
        direction: 'SUPPORTED',
        strength: 'UNAVAILABLE', // Unavailable strength
        evidence: expressionEvidence,
        supportingEvidenceIds: ['expr-evidence-1'],
        statement: 'Technical specialization expression',
        conditional: false
      };

      const expressionAnalysis: CareerExpressionAnalysis = {
        expressions: [expression],
        primaryExpression: expression,
        statement: 'Expression analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: expressionAnalysis,
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // UNAVAILABLE strength should exclude the record
      expect(result).toHaveLength(0);
    });
  });



  describe('Deduplication Field Disagreement', () => {
    it('throws on strength disagreement in dedup', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'disagree-identity',
          evidenceId: 'disagree-1',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'First occurrence',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'disagree-identity',
          evidenceId: 'disagree-2',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection, // Same direction
          strength: 'WEAK', // Different strength
          priority: 1,
          weight: 2,
          statement: 'Second occurrence',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to strength disagreement
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('Semantic field disagreement');
    });
  });

  describe('Immutability', () => {
    it('output array and records are deeply frozen', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'test-identity',
          evidenceId: 'test-evidence-1',
          ruleId: 'RULE_TEST',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Test evidence',
          relatedEvidenceIds: [],
          sourceIds: ['src-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      // Output array should be frozen
      expect(Object.isFrozen(result)).toBe(true);

      // Each record should be frozen
      for (const evidence of result) {
        expect(Object.isFrozen(evidence)).toBe(true);
      }
    });
  });

  describe('Deduplication Field Disagreement Extended', () => {
    it('throws on mixed group with non-polarity field disagreement (statement)', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'MIXED',
        strength: 'MODERATE',
        primarySupport: 5,
        primaryChallenge: 5,
        supportingSupport: 2,
        supportingChallenge: 2,
        challengingSupport: 2,
        challengingChallenge: 2,
        mixedWeight: 5,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'mixed-disagree-statement',
          evidenceId: 'mixed-disagree-1',
          ruleId: 'RULE_MIXED_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE',
          priority: 2,
          weight: 3,
          statement: 'First statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'mixed-disagree-statement',
          evidenceId: 'mixed-disagree-2',
          ruleId: 'RULE_MIXED_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE',
          priority: 2,
          weight: 3,
          statement: 'Different statement', // Different statement - should throw
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'MIXED' as ReasoningDirection,
        strength: 'MODERATE' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to statement disagreement in MIXED group
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('Semantic field disagreement');
    });

    it('throws on same identityKey with different house (conflicting field)', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'conflicting-house',
          evidenceId: 'conflicting-1',
          ruleId: 'RULE_CONFLICT',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Same statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'conflicting-house',
          evidenceId: 'conflicting-2',
          ruleId: 'RULE_CONFLICT',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Same statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: mockEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      const input: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // First verify this works when house values are the same (both undefined)
      const result1 = mapCanonicalCareerEvidence(input);
      expect(result1).toHaveLength(1); // Should dedup successfully

      // Now test with Dasha where timing/planet can differ
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'conflicting-house-dasha',
          id: 'dasha-conflicting-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        },
        {
          identityKey: 'conflicting-house-dasha',
          id: 'dasha-conflicting-2',
          level: 'MD',
          planet: Planet.JUPITER, // Different planet - should throw
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career', // Same statement
          sourceIds: ['dasha-source-2'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha with conflicting planet'
      };

      const input2: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to planet disagreement (planet is part of timing in Dasha)
      expect(() => mapCanonicalCareerEvidence(input2)).toThrow('Semantic field disagreement');
    });

    it('throws on mixed group with non-polarity field disagreement (timing)', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'mixed-disagree-timing',
          id: 'mixed-timing-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE' as DomainStrength,
          statement: 'Saturn MD mixed activation',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        },
        {
          identityKey: 'mixed-disagree-timing',
          id: 'mixed-timing-2',
          level: 'AD', // Different level - should throw
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED' as ReasoningDirection,
          strength: 'MODERATE' as DomainStrength,
          statement: 'Saturn MD mixed activation',
          sourceIds: ['dasha-source-2'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'AD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'PARTIALLY_ACTIVATES',
        direction: 'MIXED' as ReasoningDirection,
        strength: 'MODERATE' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'PARTIALLY_ACTIVATES',
        overallDirection: 'MIXED' as ReasoningDirection,
        overallStrength: 'MODERATE' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha with MIXED timing disagreement'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Should throw due to timing disagreement in MIXED group
      expect(() => mapCanonicalCareerEvidence(input)).toThrow('Semantic field disagreement');
    });

    it('throws on statement disagreement in dedup (input-order invariant)', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence1: WeightedReasoningEvidence[] = [
        {
          identityKey: 'disagree-statement',
          evidenceId: 'disagree-1',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'First statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'disagree-statement',
          evidenceId: 'disagree-2',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Different statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockEvidence2: WeightedReasoningEvidence[] = [
        mockEvidence1[1],
        mockEvidence1[0]
      ];

      const mockReasoningTrace1: ReasoningTrace = {
        primaryPromise: mockEvidence1,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const mockReasoningTrace2: ReasoningTrace = {
        primaryPromise: mockEvidence2,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal1: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence1,
        conflicts: [],
        reasoningTrace: mockReasoningTrace1
      };

      const natal2: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence2,
        conflicts: [],
        reasoningTrace: mockReasoningTrace2
      };

      const input1: CanonicalCareerEvidenceInput = {
        natal: natal1,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const input2: CanonicalCareerEvidenceInput = {
        natal: natal2,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Both should throw due to statement disagreement, regardless of order
      expect(() => mapCanonicalCareerEvidence(input1)).toThrow('Semantic field disagreement');
      expect(() => mapCanonicalCareerEvidence(input2)).toThrow('Semantic field disagreement');
    });

    it('throws on ruleId disagreement in dedup (input-order invariant)', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence1: WeightedReasoningEvidence[] = [
        {
          identityKey: 'disagree-rule',
          evidenceId: 'disagree-1',
          ruleId: 'RULE_A',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Same statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'disagree-rule',
          evidenceId: 'disagree-2',
          ruleId: 'RULE_B',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Same statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockEvidence2: WeightedReasoningEvidence[] = [
        mockEvidence1[1],
        mockEvidence1[0]
      ];

      const mockReasoningTrace1: ReasoningTrace = {
        primaryPromise: mockEvidence1,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const mockReasoningTrace2: ReasoningTrace = {
        primaryPromise: mockEvidence2,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal1: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence1,
        conflicts: [],
        reasoningTrace: mockReasoningTrace1
      };

      const natal2: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence2,
        conflicts: [],
        reasoningTrace: mockReasoningTrace2
      };

      const input1: CanonicalCareerEvidenceInput = {
        natal: natal1,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const input2: CanonicalCareerEvidenceInput = {
        natal: natal2,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Both should throw due to ruleId disagreement, regardless of order
      expect(() => mapCanonicalCareerEvidence(input1)).toThrow('Semantic field disagreement');
      expect(() => mapCanonicalCareerEvidence(input2)).toThrow('Semantic field disagreement');
    });

    it('throws on sourceType disagreement in dedup (input-order invariant)', () => {
      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const mockEvidence1: WeightedReasoningEvidence[] = [
        {
          identityKey: 'disagree-source',
          evidenceId: 'disagree-1',
          ruleId: 'RULE_DISAGREE',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Same statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-1']
        },
        {
          identityKey: 'disagree-source',
          evidenceId: 'disagree-2',
          ruleId: 'RULE_DISAGREE',
          layer: 'YOGA',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: 'Same statement',
          relatedEvidenceIds: [],
          sourceIds: ['source-2']
        }
      ];

      const mockEvidence2: WeightedReasoningEvidence[] = [
        mockEvidence1[1],
        mockEvidence1[0]
      ];

      const mockReasoningTrace1: ReasoningTrace = {
        primaryPromise: mockEvidence1,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const mockReasoningTrace2: ReasoningTrace = {
        primaryPromise: mockEvidence2,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal1: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence1,
        conflicts: [],
        reasoningTrace: mockReasoningTrace1
      };

      const natal2: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: mockEvidence2,
        conflicts: [],
        reasoningTrace: mockReasoningTrace2
      };

      const input1: CanonicalCareerEvidenceInput = {
        natal: natal1,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const input2: CanonicalCareerEvidenceInput = {
        natal: natal2,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      // Both should throw due to sourceType disagreement (different layers), regardless of order
      expect(() => mapCanonicalCareerEvidence(input1)).toThrow('Semantic field disagreement');
      expect(() => mapCanonicalCareerEvidence(input2)).toThrow('Semantic field disagreement');
    });
  });

  describe('Dasha Double-Counting Guard', () => {
    it('canonical C9 evidence carries source === DASHA and phase === DASHA_ACTIVATION for exclusion from natal scoring', () => {
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-identity-1',
          id: 'dasha-evidence-1',
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Saturn MD activates career',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-root-1']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SATURN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Saturn MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-root-1'],
        statement: 'Dasha analysis complete'
      };

      const input: CanonicalCareerEvidenceInput = {
        natal: createEmptyNatalAnalysis(),
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const result = mapCanonicalCareerEvidence(input);

      expect(result).toHaveLength(1);
      const evidence = result[0];

      // Canonical C9 evidence must carry source === 'DASHA' for exclusion from natal scoring
      expect(evidence.source).toBe('DASHA');

      // Canonical C9 evidence must carry phase === 'DASHA_ACTIVATION' for exclusion from natal scoring
      expect(evidence.phase).toBe('DASHA_ACTIVATION');

      // synthesizeCareerManifestations/resolveManifestation excludes source === 'DASHA' from natal scoring
      // This ensures Dasha evidence contributes zero to natal manifestation scoring (timing-only contribution)
    });

    it('regression test: canonical C9 evidence contributes zero to natal manifestation scoring (no double-counting)', () => {
      // This test restores the deleted expect(synWithDasha).toEqual(synWithoutDasha) assertion
      // by proving that canonical DASHA-sourced evidence does not affect natal manifestation synthesis

      const mockStructural: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 10,
        primaryChallenge: 2,
        supportingSupport: 5,
        supportingChallenge: 1,
        challengingSupport: 1,
        challengingChallenge: 3,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test structural'
      };

      const natalEvidence: WeightedReasoningEvidence[] = [
        {
          identityKey: 'natal-10h-strong',
          evidenceId: 'natal-10h-1',
          ruleId: 'CAREER_10H_STRONG_001',
          layer: 'PRIMARY_PROMISE',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG',
          priority: 1,
          weight: 2,
          statement: '10th house strong',
          relatedEvidenceIds: [],
          sourceIds: ['natal-source-1']
        }
      ];

      const mockReasoningTrace: ReasoningTrace = {
        primaryPromise: natalEvidence,
        secondarySupport: [],
        modifiers: [],
        yogas: [],
        varga: [],
        dasha: [],
        transit: []
      };

      const natal: CareerNatalAnalysis = {
        structural: mockStructural,
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: natalEvidence,
        conflicts: [],
        reasoningTrace: mockReasoningTrace
      };

      // Case 1: Natal-only evidence (no Dasha)
      const inputWithoutDasha: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha: createEmptyDashaAnalysis(),
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const evidenceWithoutDasha = mapCanonicalCareerEvidence(inputWithoutDasha);

      // Case 2: Natal + Dasha evidence
      const dashaEvidence: CareerDashaCanonicalEvidence[] = [
        {
          identityKey: 'dasha-sun-md',
          id: 'dasha-sun-1',
          level: 'MD',
          planet: Planet.SUN,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          statement: 'Sun MD activates career',
          sourceIds: ['dasha-source-1'],
          provenance: {
            source: 'C9_DASHA',
            activationLevel: 'MD',
            natalRootIds: ['natal-10h-strong']
          }
        }
      ];

      const dashaPeriod: CareerDashaCanonicalPeriod = {
        level: 'MD',
        planet: Planet.SUN,
        role: 'PRIMARY_DRIVER',
        effect: 'ACTIVATES',
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        statement: 'Sun MD period'
      };

      const dasha: CareerDashaCanonicalAnalysis = {
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT' as ReasoningDirection,
        overallStrength: 'STRONG' as DomainStrength,
        dominantLevel: 'MD',
        md: dashaPeriod,
        ad: createEmptyDashaPeriod('AD'),
        pd: createEmptyDashaPeriod('PD'),
        evidence: dashaEvidence,
        rootEvidenceIds: ['natal-10h-strong'],
        statement: 'Dasha with Sun MD'
      };

      const inputWithDasha: CanonicalCareerEvidenceInput = {
        natal,
        expression: createEmptyExpressionAnalysis(),
        dasha,
        d10: createEmptyD10Analysis(),
        finalSynthesis: createEmptyFinalSynthesis()
      };

      const evidenceWithDasha = mapCanonicalCareerEvidence(inputWithDasha);

      // Verify that adding Dasha evidence increases total evidence count
      expect(evidenceWithDasha.length).toBe(evidenceWithoutDasha.length + 1);

      // Verify canonical Dasha evidence has source === 'DASHA' and phase === 'DASHA_ACTIVATION'
      const dashaItem = evidenceWithDasha.find(e => e.source === 'DASHA');
      expect(dashaItem).toBeDefined();
      expect(dashaItem!.phase).toBe('DASHA_ACTIVATION');

      // Test that Dasha evidence does not affect natal manifestation scoring
      const synWithoutDasha = resolveManifestation('LEADERSHIP', evidenceWithoutDasha);
      const synWithDasha = resolveManifestation('LEADERSHIP', evidenceWithDasha);

      // Natal support should be identical (Dasha excluded from natal scoring)
      expect(synWithDasha.natalSupport).toBe(synWithoutDasha.natalSupport);

      // Natal factors should be identical (Dasha excluded from natal factors)
      const natalFactorsWithoutDasha = synWithoutDasha.factors.filter(f => f.source === 'NATAL');
      const natalFactorsWithDasha = synWithDasha.factors.filter(f => f.source === 'NATAL');
      expect(natalFactorsWithDasha).toEqual(natalFactorsWithoutDasha);

      // Status should be identical (no double-counting)
      expect(synWithDasha.status).toBe(synWithoutDasha.status);
    });
  });

  describe('Direction Mapping Exhaustiveness', () => {
    it('unsupported ReasoningDirection value throws error in mapDirectionToPolarity', () => {
      // Use type assertion to bypass compiler check for invalid runtime value
      const invalidDirection = 'INVALID_DIRECTION' as ReasoningDirection;

      expect(() => {
        // Import the mapper function and test it directly
        // Since we can't call it directly from here, we'll test through the main mapper
        const mockStructural: CareerStructuralReasoning = {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 10,
          primaryChallenge: 2,
          supportingSupport: 5,
          supportingChallenge: 1,
          challengingSupport: 1,
          challengingChallenge: 3,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Test structural'
        };

        const mockEvidence: WeightedReasoningEvidence[] = [
          {
            identityKey: 'test-identity',
            evidenceId: 'test-evidence-1',
            ruleId: 'RULE_TEST',
            layer: 'PRIMARY_PROMISE',
            direction: invalidDirection, // Invalid direction
            strength: 'STRONG',
            priority: 1,
            weight: 2,
            statement: 'Test evidence',
            relatedEvidenceIds: [],
            sourceIds: ['src-1']
          }
        ];

        const mockReasoningTrace: ReasoningTrace = {
          primaryPromise: mockEvidence,
          secondarySupport: [],
          modifiers: [],
          yogas: [],
          varga: [],
          dasha: [],
          transit: []
        };

        const natal: CareerNatalAnalysis = {
          structural: mockStructural,
          relevance: [],
          condition: [],
          lordRelationships: [],
          direction: 'SUPPORT' as ReasoningDirection,
          strength: 'STRONG' as DomainStrength,
          evidence: mockEvidence,
          conflicts: [],
          reasoningTrace: mockReasoningTrace
        };

        const input: CanonicalCareerEvidenceInput = {
          natal,
          expression: createEmptyExpressionAnalysis(),
          dasha: createEmptyDashaAnalysis(),
          d10: createEmptyD10Analysis(),
          finalSynthesis: createEmptyFinalSynthesis()
        };

        mapCanonicalCareerEvidence(input);
      }).toThrow('Unexpected ReasoningDirection value');
    });
  });
});

// Helper functions to create test fixtures

function createEmptyNatalAnalysis(): CareerNatalAnalysis {
  const mockStructural: CareerStructuralReasoning = {
    direction: 'NEUTRAL',
    strength: 'UNDETERMINED',
    primarySupport: 0,
    primaryChallenge: 0,
    supportingSupport: 0,
    supportingChallenge: 0,
    challengingSupport: 0,
    challengingChallenge: 0,
    mixedWeight: 0,
    evidence: [],
    primaryEvidenceIds: [],
    supportingEvidenceIds: [],
    challengingEvidenceIds: [],
    conflicts: [],
    statement: 'No structural data'
  };

  const mockReasoningTrace: ReasoningTrace = {
    primaryPromise: [],
    secondarySupport: [],
    modifiers: [],
    yogas: [],
    varga: [],
    dasha: [],
    transit: []
  };

  return {
    structural: mockStructural,
    relevance: [],
    condition: [],
    lordRelationships: [],
    direction: 'NEUTRAL' as ReasoningDirection,
    strength: 'UNDETERMINED' as DomainStrength,
    evidence: [],
    conflicts: [],
    reasoningTrace: mockReasoningTrace
  };
}

function createEmptyExpressionAnalysis(): CareerExpressionAnalysis {
  return {
    expressions: [],
    primaryExpression: undefined,
    statement: 'No expression data'
  };
}

function createEmptyDashaPeriod(level: 'MD' | 'AD' | 'PD'): CareerDashaCanonicalPeriod {
  return {
    level,
    role: 'TRIGGER',
    effect: 'UNKNOWN',
    direction: 'NEUTRAL' as ReasoningDirection,
    strength: 'UNDETERMINED' as DomainStrength,
    statement: `No ${level} data`
  };
}

function createEmptyDashaAnalysis(): CareerDashaCanonicalAnalysis {
  return {
    overallEffect: 'UNKNOWN',
    overallDirection: 'NEUTRAL' as ReasoningDirection,
    overallStrength: 'UNDETERMINED' as DomainStrength,
    dominantLevel: 'NONE',
    md: createEmptyDashaPeriod('MD'),
    ad: createEmptyDashaPeriod('AD'),
    pd: createEmptyDashaPeriod('PD'),
    evidence: [],
    rootEvidenceIds: [],
    statement: 'No dasha data'
  };
}

function createEmptyD10Analysis(): CareerD10CanonicalAnalysis {
  return {
    availability: 'UNAVAILABLE',
    natalDirection: 'NEUTRAL',
    natalStrength: 'UNDETERMINED',
    d10Effect: 'UNAVAILABLE',
    d10Direction: 'UNAVAILABLE',
    d10Strength: 'UNDETERMINED',
    qualifiedDirection: 'UNAVAILABLE',
    qualifiedStrength: 'UNDETERMINED',
    natalPromisePreserved: false,
    relationship: 'UNAVAILABLE',
    evidence: [],
    conflicts: [],
    expressionQualifications: [],
    rootEvidenceIds: [],
    statement: 'No D10 data'
  };
}

function createEmptyFinalSynthesis(): CareerFinalSynthesisResult {
  return {
    reasoningVersion: 'C11',
    domain: 'CAREER',
    finalStatus: 'INSUFFICIENT_DATA',
    finalDirection: 'UNAVAILABLE',
    finalStrength: 'UNDETERMINED',
    confidence: 'LOW',
    natalDirection: 'UNAVAILABLE',
    natalStrength: 'UNDETERMINED',
    expressionStatus: 'UNAVAILABLE',
    d10Direction: 'UNAVAILABLE',
    d10Effect: 'UNKNOWN',
    dashaEffect: 'UNKNOWN',
    dashaDirection: 'UNAVAILABLE',
    timingStatus: 'UNKNOWN',
    transitDirection: 'UNAVAILABLE',
    currentPressure: 'UNKNOWN',
    expressions: [],
    strongestExpressions: [],
    challengedExpressions: [],
    conflicts: [],
    evidenceIds: [],
    sourceIds: [],
    ruleIds: [],
    evidenceTrace: {
      evidenceIds: [],
      sourceIds: [],
      ruleIds: []
    },
    statement: 'No final synthesis data'
  };
}
