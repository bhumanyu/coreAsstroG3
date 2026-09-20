import {
  describe,
  expect,
  it
} from 'vitest';

import {
  resolveCareerExpression,
  resolveCareerExpressions,
  type CareerExpressionContext,
  type CareerExpressionPlanetContext
} from './careerExpression';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from './careerStructuralReasoning';

import {
  type CareerPlanetRelevance,
  type CareerPlanetRole,
  type CareerPlanetEffect
} from './careerPlanetaryRelevance';

import type {
  CareerPlanetaryCondition
} from './careerPlanetaryCondition';

import { Planet } from '../../types';

describe('Career Expression (C8)', () => {
  describe('Structural guardrails', () => {
    it('should return UNAVAILABLE when structural direction is UNAVAILABLE', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'UNAVAILABLE',
        structuralStrength: 'UNDETERMINED',
        structuralPrimarySupport: 0,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([])
      };

      const result = resolveCareerExpression(context);

      expect(result.expressions).toEqual(Object.freeze([]));
      expect(result.primaryExpression).toBeUndefined();
      expect(result.statement).toContain('UNAVAILABLE');
    });

    it('should return UNAVAILABLE when no structural evidence is present', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'NEUTRAL',
        structuralStrength: 'UNDETERMINED',
        structuralPrimarySupport: 0,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([])
      };

      const result = resolveCareerExpression(context);

      expect(result.expressions).toEqual(Object.freeze([]));
      expect(result.primaryExpression).toBeUndefined();
      expect(result.statement).toContain('unavailable');
    });

    it('should return no expression from secondary planetary evidence alone', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'NEUTRAL',
        structuralStrength: 'UNDETERMINED',
        structuralPrimarySupport: 0,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'SECONDARY' as CareerPlanetRelevance,
            roles: Object.freeze(['NATURAL_KARAKA' as CareerPlanetRole]),
            effect: 'NEUTRAL',
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      expect(result.expressions).toEqual(Object.freeze([]));
      expect(result.primaryExpression).toBeUndefined();
    });

    it('challenge-only structure should never yield SUPPORTED', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'CHALLENGE',
        structuralStrength: 'WEAK',
        structuralPrimarySupport: 0,
        structuralPrimaryChallenge: 3,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      expect(result.expressions.length).toBeGreaterThan(0);
      result.expressions.forEach(expr => {
        expect(expr.direction).not.toBe('SUPPORTED');
      });
    });
  });

  describe('Per-mode positive cases', () => {
    it('should detect TECHNICAL_SPECIALIZATION with Mercury in 6H/10H + supporting house', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr).toBeDefined();
      expect(technicalExpr?.direction).toBe('SUPPORTED');
    });

    it('should detect TECHNICAL_SPECIALIZATION with Mars in 6H/10H + supporting house', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MARS,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr).toBeDefined();
      expect(technicalExpr?.direction).toBe('SUPPORTED');
    });

    it('should detect SERVICE_EMPLOYMENT with Saturn in 6H + 10H', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.SATURN,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const serviceExpr = result.expressions.find(e => e.mode === 'SERVICE_EMPLOYMENT');
      expect(serviceExpr).toBeDefined();
      expect(serviceExpr?.direction).toBe('SUPPORTED');
    });

    it('should detect EMPLOYMENT with planets in 6H + 10H', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['HOUSE_OCCUPANT' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6]),
            relatedPlanets: Object.freeze([])
          },
          {
            planet: Planet.JUPITER,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['HOUSE_OCCUPANT' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const employmentExpr = result.expressions.find(e => e.mode === 'EMPLOYMENT');
      expect(employmentExpr).toBeDefined();
      expect(employmentExpr?.direction).toBe('SUPPORTED');
    });

    it('should NOT detect SERVICE_EMPLOYMENT with 10H alone (no 6H)', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.SATURN,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const serviceExpr = result.expressions.find(e => e.mode === 'SERVICE_EMPLOYMENT');
      expect(serviceExpr).toBeUndefined();
    });

    it('should detect MANAGEMENT with Jupiter in 10H + supporting house', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.JUPITER,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const managementExpr = result.expressions.find(e => e.mode === 'MANAGEMENT');
      expect(managementExpr).toBeDefined();
      expect(managementExpr?.direction).toBe('SUPPORTED');
    });

    it('should NOT detect MANAGEMENT with Jupiter alone (no 10H)', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.JUPITER,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const managementExpr = result.expressions.find(e => e.mode === 'MANAGEMENT');
      expect(managementExpr).toBeUndefined();
    });

    it('should detect LEADERSHIP with Sun in 10H + support', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.SUN,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const leadershipExpr = result.expressions.find(e => e.mode === 'LEADERSHIP');
      expect(leadershipExpr).toBeDefined();
      expect(leadershipExpr?.direction).toBe('SUPPORTED');
    });

    it('should NOT detect LEADERSHIP with Sun alone (no 10H)', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.SUN,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const leadershipExpr = result.expressions.find(e => e.mode === 'LEADERSHIP');
      expect(leadershipExpr).toBeUndefined();
    });
  });

  describe('Condition matrix', () => {
    it('STRONG condition should yield SUPPORTED', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr?.direction).toBe('SUPPORTED');
    });

    it('MODERATE condition should yield SUPPORTED or CONDITIONAL', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'MODERATE',
        structuralPrimarySupport: 2,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'MODERATE' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr?.direction).toMatch(/SUPPORTED|CONDITIONAL/);
    });

    it('WEAK condition should yield CONDITIONAL', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'MODERATE',
        structuralPrimarySupport: 2,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'WEAK' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr?.direction).toBe('CONDITIONAL');
    });

    it('AFFLICTED condition should yield CONDITIONAL', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'MODERATE',
        structuralPrimarySupport: 2,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'AFFLICTED' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr?.direction).toBe('CONDITIONAL');
    });

    it('UNAVAILABLE condition should yield UNAVAILABLE', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'UNAVAILABLE' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr).toBeUndefined();
    });
  });

  describe('Determinism', () => {
    it('identical input should produce identical output', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result1 = resolveCareerExpression(context);
      const result2 = resolveCareerExpression(context);

      expect(result1).toEqual(result2);
    });

    it('input ordering should not change output', () => {
      const planets: CareerExpressionPlanetContext[] = [
        {
          planet: Planet.MERCURY,
          relevance: 'PRIMARY',
          roles: Object.freeze(['CAREER_LORD']),
          effect: 'SUPPORT',
          condition: 'STRONG',
          relatedHouses: Object.freeze([6, 10, 2]),
          relatedPlanets: Object.freeze([])
        },
        {
          planet: Planet.JUPITER,
          relevance: 'PRIMARY',
          roles: Object.freeze(['HOUSE_OCCUPANT']),
          effect: 'SUPPORT',
          condition: 'STRONG',
          relatedHouses: Object.freeze([10]),
          relatedPlanets: Object.freeze([])
        }
      ];

      const context1: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze(planets)
      };

      const context2: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([planets[1], planets[0]])
      };

      const result1 = resolveCareerExpression(context1);
      const result2 = resolveCareerExpression(context2);

      expect(result1.expressions.length).toBe(result2.expressions.length);
      expect(result1.primaryExpression?.mode).toBe(result2.primaryExpression?.mode);
    });

    it('result arrays should be frozen', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      expect(Object.isFrozen(result.expressions)).toBe(true);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe('Counterfactuals', () => {
    it('remove Mercury → technical expression disappears', () => {
      const withMercury: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const withoutMercury: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([])
      };

      const resultWith = resolveCareerExpression(withMercury);
      const resultWithout = resolveCareerExpression(withoutMercury);

      const technicalWith = resultWith.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      const technicalWithout = resultWithout.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');

      expect(technicalWith).toBeDefined();
      expect(technicalWithout).toBeUndefined();
    });

    it('remove structural support → no supported technical expression', () => {
      const withSupport: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const withoutSupport: CareerExpressionContext = {
        structuralDirection: 'NEUTRAL',
        structuralStrength: 'UNDETERMINED',
        structuralPrimarySupport: 0,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const resultWith = resolveCareerExpression(withSupport);
      const resultWithout = resolveCareerExpression(withoutSupport);

      const technicalWith = resultWith.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      const technicalWithout = resultWithout.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');

      expect(technicalWith?.direction).toBe('SUPPORTED');
      expect(technicalWithout).toBeUndefined();
    });

    it('flip Mercury condition STRONG→AFFLICTED → SUPPORTED→CONDITIONAL', () => {
      const strongContext: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const afflictedContext: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'AFFLICTED' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const strongResult = resolveCareerExpression(strongContext);
      const afflictedResult = resolveCareerExpression(afflictedContext);

      const strongExpr = strongResult.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      const afflictedExpr = afflictedResult.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');

      expect(strongExpr?.direction).toBe('SUPPORTED');
      expect(afflictedExpr?.direction).toBe('CONDITIONAL');
    });

    it('flip Mercury relevance PRIMARY→NEUTRAL → available→unavailable', () => {
      const primaryContext: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const neutralContext: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'NEUTRAL' as CareerPlanetRelevance,
            roles: Object.freeze([] as readonly CareerPlanetRole[]),
            effect: 'NEUTRAL',
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const primaryResult = resolveCareerExpression(primaryContext);
      const neutralResult = resolveCareerExpression(neutralContext);

      const primaryExpr = primaryResult.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      const neutralExpr = neutralResult.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');

      expect(primaryExpr).toBeDefined();
      expect(neutralExpr).toBeUndefined();
    });
  });

  describe('No double counting', () => {
    it('multi-role Mercury should contribute ONE planetary evidence source', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole, 'HOUSE_OCCUPANT' as CareerPlanetRole, 'RELATIONSHIP_PARTICIPANT' as CareerPlanetRole, 'NATURAL_KARAKA' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const technicalExpr = result.expressions.find(e => e.mode === 'TECHNICAL_SPECIALIZATION');
      expect(technicalExpr).toBeDefined();

      // Should have exactly one evidence item for Mercury
      const mercuryEvidence = technicalExpr?.evidence.filter(e => e.planets.includes(Planet.MERCURY));
      expect(mercuryEvidence?.length).toBe(1);

      // But roles should be preserved in the upstream context (not in evidence)
      const mercuryContext = context.relevantPlanets.find(p => p.planet === Planet.MERCURY);
      expect(mercuryContext?.roles.length).toBe(4);
    });
  });

  describe('Entrepreneurship multi-factor requirements', () => {
    it('single planet without business house should yield UNAVAILABLE for ENTREPRENEURSHIP', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MARS,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([11]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const entrepreneurshipExpr = result.expressions.find(e => e.mode === 'ENTREPRENEURSHIP');
      expect(entrepreneurshipExpr).toBeUndefined();
    });

    it('single planet with business house and strong condition should yield ENTREPRENEURSHIP', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MARS,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([11, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const entrepreneurshipExpr = result.expressions.find(e => e.mode === 'ENTREPRENEURSHIP');
      expect(entrepreneurshipExpr).toBeDefined();
      expect(entrepreneurshipExpr?.direction).toBe('SUPPORTED');
    });

    it('single planet with business house but weak condition should yield UNAVAILABLE for ENTREPRENEURSHIP', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MARS,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'WEAK' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([11, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const entrepreneurshipExpr = result.expressions.find(e => e.mode === 'ENTREPRENEURSHIP');
      expect(entrepreneurshipExpr).toBeUndefined();
    });

    it('insufficient business structure should yield UNAVAILABLE for BUSINESS_ENTREPRENEURSHIP', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MARS,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([11]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      const businessExpr = result.expressions.find(e => e.mode === 'BUSINESS_ENTREPRENEURSHIP');
      expect(businessExpr).toBeUndefined();
    });
  });

  describe('Primary expression resolution', () => {
    it('should select highest-ranked SUPPORTED expression', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.SUN,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10, 2]),
            relatedPlanets: Object.freeze([])
          },
          {
            planet: Planet.JUPITER,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['HOUSE_OCCUPANT' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      // LEADERSHIP is higher in hierarchy than MANAGEMENT
      expect(result.primaryExpression?.mode).toBe('LEADERSHIP');
    });

    it('should select the higher semantic hierarchy when expressions differ', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          },
          {
            planet: Planet.JUPITER,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      // Both TECHNICAL_SPECIALIZATION and MANAGEMENT could be primary
      // Since they're at different hierarchy levels, the higher one should win
      // This test verifies the hierarchy is respected
      expect(result.primaryExpression).toBeDefined();
      expect(result.primaryExpression?.mode).toBe('MANAGEMENT');
    });
  });

  describe('Boundary/firewall', () => {
    it('result should NOT contain Dasha, D10, transit, dignity, score, finalConclusion', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.MERCURY,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      // Check that result doesn't have forbidden fields
      expect(result).not.toHaveProperty('dasha');
      expect(result).not.toHaveProperty('d10');
      expect(result).not.toHaveProperty('transit');
      expect(result).not.toHaveProperty('dignity');
      expect(result).not.toHaveProperty('score');
      expect(result).not.toHaveProperty('finalConclusion');
      expect(result).not.toHaveProperty('manifestationMode');
    });

    it('should NOT mutate C6 relevance or C7 condition inputs', () => {
      const originalPlanets: CareerExpressionPlanetContext[] = [
        {
          planet: Planet.MERCURY,
          relevance: 'PRIMARY',
          roles: Object.freeze(['CAREER_LORD']),
          effect: 'SUPPORT',
          condition: 'STRONG',
          relatedHouses: Object.freeze([6, 10, 2]),
          relatedPlanets: Object.freeze([])
        }
      ];

      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze(originalPlanets)
      };

      resolveCareerExpression(context);

      // Verify inputs weren't mutated
      expect(context.relevantPlanets[0].relevance).toBe('PRIMARY');
      expect(context.relevantPlanets[0].condition).toBe('STRONG');
    });
  });

  describe('Batch processing', () => {
    it('should process multiple contexts correctly', () => {
      const contexts: readonly CareerExpressionContext[] = Object.freeze([
        {
          structuralDirection: 'SUPPORT',
          structuralStrength: 'STRONG',
          structuralPrimarySupport: 3,
          structuralPrimaryChallenge: 0,
          relevantPlanets: Object.freeze([
            {
              planet: Planet.MERCURY,
              relevance: 'PRIMARY' as CareerPlanetRelevance,
              roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
              effect: 'SUPPORT' as CareerPlanetEffect,
              condition: 'STRONG' as CareerPlanetaryCondition,
              relatedHouses: Object.freeze([6, 10, 2]),
              relatedPlanets: Object.freeze([])
            }
          ])
        },
        {
          structuralDirection: 'UNAVAILABLE',
          structuralStrength: 'UNDETERMINED',
          structuralPrimarySupport: 0,
          structuralPrimaryChallenge: 0,
          relevantPlanets: Object.freeze([])
        }
      ]);

      const results = resolveCareerExpressions(contexts);

      expect(results.length).toBe(2);
      expect(results[0].expressions.length).toBeGreaterThan(0);
      expect(results[1].expressions.length).toBe(0);
    });
  });

  describe('Rahu/Ketu handling', () => {
    it('Rahu should not produce manifestation modes', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.RAHU,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      // Rahu should not produce any expression modes
      expect(result.expressions.length).toBe(0);
    });

    it('Ketu should not produce manifestation modes', () => {
      const context: CareerExpressionContext = {
        structuralDirection: 'SUPPORT',
        structuralStrength: 'STRONG',
        structuralPrimarySupport: 3,
        structuralPrimaryChallenge: 0,
        relevantPlanets: Object.freeze([
          {
            planet: Planet.KETU,
            relevance: 'PRIMARY' as CareerPlanetRelevance,
            roles: Object.freeze(['CAREER_LORD' as CareerPlanetRole]),
            effect: 'SUPPORT' as CareerPlanetEffect,
            condition: 'STRONG' as CareerPlanetaryCondition,
            relatedHouses: Object.freeze([6, 10, 2]),
            relatedPlanets: Object.freeze([])
          }
        ])
      };

      const result = resolveCareerExpression(context);

      // Ketu should not produce any expression modes
      expect(result.expressions.length).toBe(0);
    });
  });
});
