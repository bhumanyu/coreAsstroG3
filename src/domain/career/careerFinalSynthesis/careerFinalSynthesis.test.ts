import { describe, it, expect } from 'vitest';
import { Planet } from '../../../types';
import { synthesizeCareerFinal } from './careerFinalSynthesis';
import type {
  CareerFinalSynthesisInput,
  CareerFinalSynthesisResult
} from './careerFinalSynthesisTypes';
import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';
import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength,
  CareerDashaActivationHierarchy
} from '../careerDasha';
import type {
  CareerD10QualificationDirection,
  CareerD10QualificationStrength,
  CareerD10QualificationEffect
} from '../careerD10';
import type {
  CareerExpressionStrength
} from '../careerExpression';
import type { CareerManifestationMode } from '../careerTypes';

describe('C11 Final Synthesis', () => {
  describe('C11-INV-01: Natal promise is authoritative', () => {
    it('should not manufacture natal promise from secondary layers', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'UNAVAILABLE',
        natalStrength: 'UNDETERMINED',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.JUPITER,
            role: 'PRIMARY_DRIVER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Jupiter MD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.SATURN,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Saturn AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'ACTIVATES',
          overallDirection: 'SUPPORT',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha activates'
        },
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        expressionStrength: 'STRONG',
        transitDirection: 'SUPPORT'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('INSUFFICIENT_DATA');
      expect(result.natalDirection).toBe('UNAVAILABLE');
      expect(result.natalStrength).toBe('UNDETERMINED');
    });

    it('should preserve natal direction despite strong secondary support', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.JUPITER,
            role: 'PRIMARY_DRIVER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Jupiter MD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.SATURN,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Saturn AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'ACTIVATES',
          overallDirection: 'SUPPORT',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha activates'
        },
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        expressionStrength: 'STRONG',
        transitDirection: 'SUPPORT'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.natalDirection).toBe('CHALLENGE');
      expect(result.finalDirection).toBe('CHALLENGE');
    });

    it('should derive final direction from natal foundation', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.SATURN,
            role: 'PRIMARY_DRIVER',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'STRONG',
            evidence: [],
            statement: 'Saturn MD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.JUPITER,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Jupiter AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'DOES_NOT_ACTIVATE',
            direction: 'NEUTRAL',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD does not activate',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'CHALLENGES',
          overallDirection: 'CHALLENGE',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha challenges'
        },
        d10Direction: 'CHALLENGE',
        d10Strength: 'STRONG'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.finalDirection).toBe('SUPPORT' as const);
    });
  });

  describe('C11-INV-02: Dasha hierarchy from canonical C9', () => {
    it('should accept dashaHierarchy input without re-deriving', () => {
      const hierarchy: CareerDashaActivationHierarchy = {
        md: {
          level: 'MD',
          planet: Planet.JUPITER,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          evidence: [],
          statement: 'Jupiter MD activates career',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        ad: {
          level: 'AD',
          planet: Planet.SATURN,
          role: 'MODIFIER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED',
          strength: 'MODERATE',
          evidence: [],
          statement: 'Saturn AD partially activates',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        pd: {
          level: 'PD',
          planet: Planet.MERCURY,
          role: 'REFINEMENT',
          effect: 'DOES_NOT_ACTIVATE',
          direction: 'NEUTRAL',
          strength: 'WEAK',
          evidence: [],
          statement: 'Mercury PD does not activate',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'Dasha activates career'
      };

      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: hierarchy
      };

      const result = synthesizeCareerFinal(input);

      // Should use the hierarchy's overall values
      expect(result.dashaEffect).toBe('ACTIVATES');
      expect(result.dashaDirection).toBe('SUPPORT');
    });
  });

  describe('C11-INV-03: Transit only affects timingStatus/currentPressure', () => {
    it('should not let transit affect finalDirection or finalStrength', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        transitDirection: 'CHALLENGE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalDirection).toBe('SUPPORT');
      expect(result.finalStrength).toBe('VERY_STRONG');
      expect(result.transitDirection).toBe('CHALLENGE');
    });

    it('should let transit affect currentPressure', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.JUPITER,
            role: 'PRIMARY_DRIVER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Jupiter MD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.SATURN,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Saturn AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'ACTIVATES',
          overallDirection: 'SUPPORT',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha activates'
        },
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        transitDirection: 'CHALLENGE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.currentPressure).not.toBe('NONE');
    });
  });

  describe('C11-INV-04: Strong natal support not erased by D10 challenge', () => {
    it('should preserve SUPPORTED status with VERY_STRONG natal despite D10 challenge', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        d10Direction: 'CHALLENGE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
    });

    it('should preserve SUPPORTED status with STRONG natal despite D10 challenge', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        d10Direction: 'CHALLENGE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
    });
  });

  describe('C11-INV-05: Missing evidence ≠ negative evidence', () => {
    it('should not treat missing Dasha as challenge', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG'
        // No dashaHierarchy provided
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
    });

    it('should not treat missing D10 as challenge', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG'
        // No d10Direction provided
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
    });

    it('should derive LOW confidence for weak natal regardless of missing secondary evidence', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'WEAK'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.confidence).toBe('LOW');
    });
  });

  describe('C11-INV-06: Evidence traceability', () => {
    it('should populate evidenceIds, sourceIds, and ruleIds distinctly', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        evidenceIds: ['evidence-1', 'evidence-2'],
        sourceIds: ['source-1', 'source-2', 'source-1'], // duplicate allowed
        ruleIds: ['rule-1', 'rule-2']
      };

      const result = synthesizeCareerFinal(input);

      expect(result.evidenceIds).toEqual(['evidence-1', 'evidence-2']);
      expect(result.sourceIds).toEqual(['source-1', 'source-2', 'source-1']);
      expect(result.ruleIds).toEqual(['rule-1', 'rule-2']);
      expect(result.evidenceTrace.evidenceIds).toEqual(['evidence-1', 'evidence-2']);
      expect(result.evidenceTrace.sourceIds).toEqual(['source-1', 'source-2', 'source-1']);
      expect(result.evidenceTrace.ruleIds).toEqual(['rule-1', 'rule-2']);
    });

    it('should maintain canonical evidenceIds vs sourceIds distinction', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        evidenceIds: ['ev-1', 'ev-2'],
        sourceIds: ['src-1', 'src-2', 'src-1', 'src-3'],
        ruleIds: ['rule-1']
      };

      const result = synthesizeCareerFinal(input);

      // evidenceIds should be canonical (deduplicated by caller)
      expect(result.evidenceIds.length).toBe(2);
      // sourceIds can have duplicates (provenance occurrences)
      expect(result.sourceIds.length).toBe(4);
      // ruleIds should be canonical (deduplicated by caller)
      expect(result.ruleIds.length).toBe(1);
    });
  });

  describe('C11-INV-07: Dasha challenge modifies timing status, not natal direction', () => {
    it('should set timingStatus to CHALLENGED when dashaDirection is CHALLENGE', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.SATURN,
            role: 'PRIMARY_DRIVER',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'STRONG',
            evidence: [],
            statement: 'Saturn MD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.JUPITER,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Jupiter AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'DOES_NOT_ACTIVATE',
            direction: 'NEUTRAL',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD does not activate',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'CHALLENGES',
          overallDirection: 'CHALLENGE',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha challenges'
        }
      };

      const result = synthesizeCareerFinal(input);

      expect(result.timingStatus).toBe('CHALLENGED');
      expect(result.natalDirection).toBe('SUPPORT'); // natal direction preserved
    });

    it('should preserve natalDirection despite dasha challenge', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.SATURN,
            role: 'PRIMARY_DRIVER',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'STRONG',
            evidence: [],
            statement: 'Saturn MD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.JUPITER,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Jupiter AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'DOES_NOT_ACTIVATE',
            direction: 'NEUTRAL',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD does not activate',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'CHALLENGES',
          overallDirection: 'CHALLENGE',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha challenges'
        }
      };

      const result = synthesizeCareerFinal(input);

      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.dashaDirection).toBe('CHALLENGE');
    });
  });

  describe('C11-INV-08: Transit cannot rewrite natal promise', () => {
    it('should keep transitDirection separate from finalDirection', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        transitDirection: 'CHALLENGE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.transitDirection).toBe('CHALLENGE');
      expect(result.finalDirection).toBe('SUPPORT');
      expect(result.natalDirection).toBe('SUPPORT');
    });

    it('should not let transit CHALLENGE override natal SUPPORT', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        transitDirection: 'CHALLENGE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
    });
  });

  describe('C11-INV-09: Dasha hierarchy MD > AD > PD canonical', () => {
    it('should respect dashaHierarchy input without re-deriving', () => {
      const hierarchy: CareerDashaActivationHierarchy = {
        md: {
          level: 'MD',
          planet: Planet.JUPITER,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          evidence: [],
          statement: 'Jupiter MD activates career',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        ad: {
          level: 'AD',
          planet: Planet.SATURN,
          role: 'MODIFIER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED',
          strength: 'MODERATE',
          evidence: [],
          statement: 'Saturn AD partially activates',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        pd: {
          level: 'PD',
          planet: Planet.MERCURY,
          role: 'REFINEMENT',
          effect: 'DOES_NOT_ACTIVATE',
          direction: 'NEUTRAL',
          strength: 'WEAK',
          evidence: [],
          statement: 'Mercury PD does not activate',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'Dasha activates career'
      };

      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: hierarchy
      };

      const result = synthesizeCareerFinal(input);

      // Should use provided dashaEffect/dashaDirection from hierarchy
      expect(result.dashaEffect).toBe('ACTIVATES');
      expect(result.dashaDirection).toBe('SUPPORT');
    });
  });

  describe('C11-INV-10: Strong natal support preserved', () => {
    it('should preserve VERY_STRONG natal in finalStatus', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalStrength).toBe('VERY_STRONG');
    });

    it('should preserve STRONG natal in finalStatus', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalStrength).toBe('STRONG');
    });

    it('should downgrade VERY_STRONG to CONDITIONALLY_SUPPORTED with multiple secondary challenges', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.SATURN,
            role: 'PRIMARY_DRIVER',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'STRONG',
            evidence: [],
            statement: 'Saturn MD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.JUPITER,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Jupiter AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'DOES_NOT_ACTIVATE',
            direction: 'NEUTRAL',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD does not activate',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'CHALLENGES',
          overallDirection: 'CHALLENGE',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha challenges'
        },
        d10Direction: 'CHALLENGE',
        d10Strength: 'STRONG',
        expressionStrength: 'WEAK'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('CONDITIONALLY_SUPPORTED');
    });
  });

  describe('C11-INV-11: Deterministic output', () => {
    it('should produce byte-identical output for identical inputs', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.JUPITER,
            role: 'PRIMARY_DRIVER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Jupiter MD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.SATURN,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Saturn AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'ACTIVATES',
          overallDirection: 'SUPPORT',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha activates'
        },
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        expressionStrength: 'STRONG',
        transitDirection: 'SUPPORT',
        evidenceIds: ['ev-1', 'ev-2'],
        sourceIds: ['src-1'],
        ruleIds: ['rule-1']
      };

      const result1 = synthesizeCareerFinal(input);
      const result2 = synthesizeCareerFinal(input);

      expect(result1).toEqual(result2);
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('should be pure function with no side effects', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG'
      };

      const originalInput = { ...input };
      synthesizeCareerFinal(input);

      expect(input).toEqual(originalInput);
    });
  });

  describe('C11-INV-12: Frozen result', () => {
    it('should return frozen result object', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG'
      };

      const result = synthesizeCareerFinal(input);

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should freeze nested arrays', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        expressions: [
          {
            mode: 'LEADERSHIP' as CareerManifestationMode,
            direction: 'SUPPORT',
            strength: 'STRONG',
            qualified: true,
            evidenceIds: ['ev-1']
          }
        ],
        conflicts: [],
        evidenceIds: ['ev-1'],
        sourceIds: ['src-1'],
        ruleIds: ['rule-1']
      };

      const result = synthesizeCareerFinal(input);

      expect(Object.isFrozen(result.expressions)).toBe(true);
      expect(Object.isFrozen(result.conflicts)).toBe(true);
      expect(Object.isFrozen(result.evidenceIds)).toBe(true);
      expect(Object.isFrozen(result.sourceIds)).toBe(true);
      expect(Object.isFrozen(result.ruleIds)).toBe(true);
      expect(Object.isFrozen(result.evidenceTrace)).toBe(true);
      expect(Object.isFrozen(result.evidenceTrace.evidenceIds)).toBe(true);
      expect(Object.isFrozen(result.evidenceTrace.sourceIds)).toBe(true);
      expect(Object.isFrozen(result.evidenceTrace.ruleIds)).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete input with all layers', () => {
      const hierarchy: CareerDashaActivationHierarchy = {
        md: {
          level: 'MD',
          planet: Planet.JUPITER,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          evidence: [],
          statement: 'Jupiter MD activates career',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        ad: {
          level: 'AD',
          planet: Planet.SATURN,
          role: 'MODIFIER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED',
          strength: 'MODERATE',
          evidence: [],
          statement: 'Saturn AD partially activates',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        pd: {
          level: 'PD',
          planet: Planet.MERCURY,
          role: 'REFINEMENT',
          effect: 'DOES_NOT_ACTIVATE',
          direction: 'NEUTRAL',
          strength: 'WEAK',
          evidence: [],
          statement: 'Mercury PD does not activate',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'Dasha activates career'
      };

      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        expressionStrength: 'STRONG',
        dashaHierarchy: hierarchy,
        d10Effect: 'QUALIFIES',
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        transitDirection: 'SUPPORT',
        expressions: [
          {
            mode: 'LEADERSHIP' as CareerManifestationMode,
            direction: 'SUPPORT',
            strength: 'VERY_STRONG',
            qualified: true,
            evidenceIds: ['ev-1']
          }
        ],
        conflicts: [],
        evidenceIds: ['ev-1', 'ev-2'],
        sourceIds: ['src-1', 'src-2'],
        ruleIds: ['rule-1', 'rule-2']
      };

      const result = synthesizeCareerFinal(input);

      expect(result.reasoningVersion).toBe('C11');
      expect(result.domain).toBe('CAREER');
      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
      expect(result.finalStrength).toBe('VERY_STRONG');
      expect(result.confidence).toBe('HIGH');
      expect(result.natalDirection).toBe('SUPPORT');
      expect(result.natalStrength).toBe('VERY_STRONG');
      expect(result.timingStatus).toBe('ACTIVE');
      expect(result.currentPressure).toBe('NONE');
    });

    it('should handle minimal input with only natal', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'MODERATE'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('SUPPORTED');
      expect(result.finalDirection).toBe('SUPPORT');
      expect(result.finalStrength).toBe('MODERATE');
      expect(result.confidence).toBe('MEDIUM');
    });

    it('should handle challenged natal with no secondary support', () => {
      const input: CareerFinalSynthesisInput = {
        natalDirection: 'CHALLENGE',
        natalStrength: 'WEAK'
      };

      const result = synthesizeCareerFinal(input);

      expect(result.finalStatus).toBe('CHALLENGED');
      expect(result.finalDirection).toBe('CHALLENGE');
      expect(result.finalStrength).toBe('WEAK');
    });
  });

  describe('Golden scenarios for C11 fixes', () => {
    it('should preserve C8 CONDITIONAL as CONDITIONAL, not CHALLENGE', () => {
      const hierarchy: CareerDashaActivationHierarchy = {
        md: {
          level: 'MD',
          planet: Planet.JUPITER,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          evidence: [],
          statement: 'Jupiter MD activates career',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        ad: {
          level: 'AD',
          planet: Planet.SATURN,
          role: 'MODIFIER',
          effect: 'PARTIALLY_ACTIVATES',
          direction: 'MIXED',
          strength: 'MODERATE',
          evidence: [],
          statement: 'Saturn AD partially activates',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        pd: {
          level: 'PD',
          planet: Planet.MERCURY,
          role: 'REFINEMENT',
          effect: 'DOES_NOT_ACTIVATE',
          direction: 'NEUTRAL',
          strength: 'WEAK',
          evidence: [],
          statement: 'Mercury PD does not activate',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        overallEffect: 'ACTIVATES',
        overallDirection: 'SUPPORT',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'Dasha activates career'
      };

      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        expressionStrength: 'WEAK', // Maps to CONDITIONAL
        dashaHierarchy: hierarchy,
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG'
      };

      const result = synthesizeCareerFinal(input);

      // Expression status should be CONDITIONAL, not CHALLENGE
      expect(result.expressionStatus).toBe('CONDITIONAL');
      // Final status should reflect conditionality
      expect(result.finalStatus).toBe('CONDITIONALLY_SUPPORTED');
      // Final direction should preserve CONDITIONAL
      expect(result.finalDirection).toBe('CONDITIONAL');
      // Should NOT be artificially downgraded to CHALLENGE
      expect(result.finalDirection).not.toBe('CHALLENGE');
    });

    it('should respect dashaHierarchy over convenience fields', () => {
      const hierarchy: CareerDashaActivationHierarchy = {
        md: {
          level: 'MD',
          planet: Planet.SATURN,
          role: 'PRIMARY_DRIVER',
          effect: 'CHALLENGES',
          direction: 'CHALLENGE',
          strength: 'STRONG',
          evidence: [],
          statement: 'Saturn MD challenges career',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        ad: {
          level: 'AD',
          planet: Planet.JUPITER,
          role: 'MODIFIER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'MODERATE',
          evidence: [],
          statement: 'Jupiter AD activates',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        pd: {
          level: 'PD',
          planet: Planet.MERCURY,
          role: 'REFINEMENT',
          effect: 'DOES_NOT_ACTIVATE',
          direction: 'NEUTRAL',
          strength: 'WEAK',
          evidence: [],
          statement: 'Mercury PD does not activate',
          start: '2024-01-01',
          end: '2024-12-31'
        },
        overallEffect: 'CHALLENGES',
        overallDirection: 'CHALLENGE',
        overallStrength: 'STRONG',
        dominantLevel: 'MD',
        statement: 'Dasha challenges career'
      };

      const input: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'STRONG',
        dashaHierarchy: hierarchy
        // Note: No convenience fields provided - hierarchy is authoritative
      };

      const result = synthesizeCareerFinal(input);

      // Should use hierarchy's overall values
      expect(result.dashaEffect).toBe('CHALLENGES');
      expect(result.dashaDirection).toBe('CHALLENGE');
      // Timing status should reflect dasha challenge
      expect(result.timingStatus).toBe('CHALLENGED');
    });

    it('should prefer consistent high-quality layers over contradictory many layers', () => {
      // Scenario 1: Two consistent high-quality supporting layers
      const consistentInput: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.JUPITER,
            role: 'PRIMARY_DRIVER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Jupiter MD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.VENUS,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Venus AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Mercury PD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'ACTIVATES',
          overallDirection: 'SUPPORT',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha activates'
        },
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        expressionStrength: 'STRONG',
        conflicts: [] // No conflicts
      };

      const consistentResult = synthesizeCareerFinal(consistentInput);

      // Scenario 2: Four mutually contradictory layers
      const contradictoryInput: CareerFinalSynthesisInput = {
        natalDirection: 'SUPPORT',
        natalStrength: 'VERY_STRONG',
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.SATURN,
            role: 'PRIMARY_DRIVER',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'STRONG',
            evidence: [],
            statement: 'Saturn MD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.JUPITER,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'STRONG',
            evidence: [],
            statement: 'Jupiter AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'CHALLENGES',
          overallDirection: 'CHALLENGE',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha challenges'
        },
        d10Direction: 'CHALLENGE',
        d10Strength: 'STRONG',
        expressionStrength: 'WEAK',
        conflicts: [
          {
            source: 'DASHA',
            direction: 'CHALLENGE',
            severity: 'HIGH',
            evidenceIds: ['ev-1'],
            statement: 'Dasha contradicts natal'
          },
          {
            source: 'D10',
            direction: 'CHALLENGE',
            severity: 'HIGH',
            evidenceIds: ['ev-2'],
            statement: 'D10 contradicts natal'
          }
        ]
      };

      const contradictoryResult = synthesizeCareerFinal(contradictoryInput);

      // Consistent case should have equal or higher confidence
      expect(consistentResult.confidence).toBe('HIGH');
      expect(contradictoryResult.confidence).toBe('MEDIUM');
      // Consistent case should be SUPPORTED
      expect(consistentResult.finalStatus).toBe('SUPPORTED');
      // Contradictory case should be downgraded
      expect(contradictoryResult.finalStatus).toBe('CONDITIONALLY_SUPPORTED');
    });

    it('should produce semantically distinct results for D10-only vs Dasha-only challenges', () => {
      const baseInput = {
        natalDirection: 'SUPPORT' as CareerStructuralDirection,
        natalStrength: 'STRONG' as CareerStructuralStrength
      };

      // D10-only challenge (execution qualification)
      const d10ChallengeInput: CareerFinalSynthesisInput = {
        ...baseInput,
        d10Direction: 'CHALLENGE',
        d10Strength: 'STRONG'
      };

      const d10ChallengeResult = synthesizeCareerFinal(d10ChallengeInput);

      // Dasha-only challenge (timing qualification)
      const dashaChallengeInput: CareerFinalSynthesisInput = {
        ...baseInput,
        dashaHierarchy: {
          md: {
            level: 'MD',
            planet: Planet.SATURN,
            role: 'PRIMARY_DRIVER',
            effect: 'CHALLENGES',
            direction: 'CHALLENGE',
            strength: 'STRONG',
            evidence: [],
            statement: 'Saturn MD challenges',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          ad: {
            level: 'AD',
            planet: Planet.JUPITER,
            role: 'MODIFIER',
            effect: 'ACTIVATES',
            direction: 'SUPPORT',
            strength: 'MODERATE',
            evidence: [],
            statement: 'Jupiter AD activates',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          pd: {
            level: 'PD',
            planet: Planet.MERCURY,
            role: 'REFINEMENT',
            effect: 'DOES_NOT_ACTIVATE',
            direction: 'NEUTRAL',
            strength: 'WEAK',
            evidence: [],
            statement: 'Mercury PD does not activate',
            start: '2024-01-01',
            end: '2024-12-31'
          },
          overallEffect: 'CHALLENGES',
          overallDirection: 'CHALLENGE',
          overallStrength: 'STRONG',
          dominantLevel: 'MD',
          statement: 'Dasha challenges'
        }
      };

      const dashaChallengeResult = synthesizeCareerFinal(dashaChallengeInput);

      // Both should be SUPPORTED (C11-INV-04: strong natal not erased by single challenge)
      expect(d10ChallengeResult.finalStatus).toBe('SUPPORTED');
      expect(dashaChallengeResult.finalStatus).toBe('SUPPORTED');

      // But they should have different semantic effects:
      // D10 challenge affects currentPressure
      expect(d10ChallengeResult.currentPressure).toBe('LOW');
      // Dasha challenge affects timingStatus
      expect(dashaChallengeResult.timingStatus).toBe('CHALLENGED');
      expect(dashaChallengeResult.currentPressure).toBe('LOW');

      // D10 challenge should not affect timingStatus
      expect(d10ChallengeResult.timingStatus).toBe('UNKNOWN');
      // Dasha challenge should not affect d10Direction
      expect(d10ChallengeResult.d10Direction).toBe('CHALLENGE');
      expect(dashaChallengeResult.d10Direction).toBe('UNAVAILABLE');
    });
  });
});
