import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { Planet, Sign } from '../../../types';
import { buildAiContext } from '../../context/aiContextFactory';
import { reasonWithLocalRules, TASK_DOMAIN } from './localVedicRulesEngine';
import {
  CAREER_RULES,
  WEALTH_RULES,
  DASHA_RULES,
  CHART_SYNTHESIS_RULES
} from './rules';
import type { AiTask } from '../../types/aiRequestTypes';
import type { AiContext, AiEvidence } from '../../types/aiContextTypes';
import type { LocalRuleDefinition } from './localVedicRulesTypes';

describe('localVedicRulesEngine', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = buildAiContext(horoscope);

  it('should have an exhaustive TASK_DOMAIN mapping for all seven tasks', () => {
    const tasks: readonly AiTask[] = [
      'CHART_SYNTHESIS',
      'CAREER_ANALYSIS',
      'WEALTH_ANALYSIS',
      'DASHA_ANALYSIS',
      'LIFE_THEME_ANALYSIS',
      'LIFE_ANALYSIS_EXPLANATION',
      'GENERAL_QUERY'
    ];

    for (const task of tasks) {
      expect(TASK_DOMAIN[task]).toBeDefined();
    }
    expect(TASK_DOMAIN.LIFE_ANALYSIS_EXPLANATION).toBe('LIFE_ANALYSIS');
  });

  it('should produce dedicated life analysis explanation conclusion mentioning Career and Wealth', () => {
    const result = reasonWithLocalRules('LIFE_ANALYSIS_EXPLANATION', context);
    expect(result.conclusion).toContain('Career');
    expect(result.conclusion).toContain('Wealth');
    expect(result.conclusion).toContain('Cross-domain synthesis');
  });

  it('should add unresolved question when lifeAnalysis is missing for LIFE_ANALYSIS_EXPLANATION', () => {
    const contextWithoutLifeAnalysis = {
      ...context,
      lifeAnalysis: undefined
    };
    const result = reasonWithLocalRules('LIFE_ANALYSIS_EXPLANATION', contextWithoutLifeAnalysis);
    expect(result.unresolvedQuestions).toContain('Life analysis is unavailable.');
  });

  it('should reason deterministically across multiple evaluations', () => {
    const run1 = reasonWithLocalRules('CAREER_ANALYSIS', context);
    const run2 = reasonWithLocalRules('CAREER_ANALYSIS', context);

    expect(run1).toEqual(run2);
  });

  it('should include career status, natal promise, and D10 relationship in career conclusion', () => {
    const result = reasonWithLocalRules('CAREER_ANALYSIS', context);

    expect(context.career).toBeDefined();
    if (context.career) {
      expect(result.conclusion).toContain(context.career.status);
      expect(result.conclusion).toContain(context.career.natalPromise);
      expect(result.conclusion).toContain(context.career.d10Relationship);
    }
  });

  it('should only return evidence IDs that exist in context.evidence', () => {
    const tasks: readonly AiTask[] = [
      'CHART_SYNTHESIS',
      'CAREER_ANALYSIS',
      'WEALTH_ANALYSIS',
      'DASHA_ANALYSIS',
      'LIFE_THEME_ANALYSIS',
      'LIFE_ANALYSIS_EXPLANATION',
      'GENERAL_QUERY'
    ];

    const validEvidenceIds = new Set(context.evidence.map((e) => e.id));

    for (const task of tasks) {
      const result = reasonWithLocalRules(task, context);

      for (const id of result.supportingEvidenceIds) {
        expect(validEvidenceIds.has(id)).toBe(true);
      }
      for (const id of result.challengingEvidenceIds) {
        expect(validEvidenceIds.has(id)).toBe(true);
      }
    }
  });

  it('should include total evidence count string in chart synthesis conclusion', () => {
    const result = reasonWithLocalRules('CHART_SYNTHESIS', context);

    expect(result.conclusion).toContain(String(context.evidence.length));
    expect(result.triggeredRuleIds.length).toBeGreaterThan(0);
  });

  it('should execute wealth analysis rules properly', () => {
    const result = reasonWithLocalRules('WEALTH_ANALYSIS', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-WEALTH'))).toBe(true);
  });

  it('should execute dasha analysis rules properly', () => {
    const result = reasonWithLocalRules('DASHA_ANALYSIS', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-DASHA'))).toBe(true);
  });

  it('should execute life theme analysis rules properly', () => {
    const result = reasonWithLocalRules('LIFE_THEME_ANALYSIS', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-THEME'))).toBe(true);
  });

  it('should execute life analysis explanation rules properly and select supporting evidence', () => {
    const result = reasonWithLocalRules('LIFE_ANALYSIS_EXPLANATION', context);

    expect(result.status).toBeDefined();
    expect(result.conclusion).toBeDefined();
    expect(result.conclusion).toContain('Career');
    expect(result.conclusion).toContain('Wealth');
    expect(result.supportingEvidenceIds.length).toBeGreaterThan(0);
    expect(result.triggeredRuleIds.some((id) => id.startsWith('LOCAL-LIFE'))).toBe(true);
  });

  it('should strictly isolate domain rules and not trigger GENERAL rules for domain tasks', () => {
    const careerResult = reasonWithLocalRules('CAREER_ANALYSIS', context);
    expect(careerResult.triggeredRuleIds.some((id) => id.startsWith('LOCAL-GEN'))).toBe(false);
    expect(careerResult.triggeredRuleIds.every((id) => id.startsWith('LOCAL-CAREER'))).toBe(true);

    const wealthResult = reasonWithLocalRules('WEALTH_ANALYSIS', context);
    expect(wealthResult.triggeredRuleIds.some((id) => id.startsWith('LOCAL-GEN'))).toBe(false);
    expect(wealthResult.triggeredRuleIds.every((id) => id.startsWith('LOCAL-WEALTH'))).toBe(true);

    const lifeResult = reasonWithLocalRules('LIFE_ANALYSIS_EXPLANATION', context);
    expect(lifeResult.triggeredRuleIds.some((id) => id.startsWith('LOCAL-GEN'))).toBe(false);
    expect(lifeResult.triggeredRuleIds.every((id) => id.startsWith('LOCAL-LIFE'))).toBe(true);

    const generalResult = reasonWithLocalRules('GENERAL_QUERY', context);
    expect(generalResult.triggeredRuleIds.every((id) => id.startsWith('LOCAL-GEN'))).toBe(true);
  });

  it('should produce ranked, frozen results with triggeredRuleIds', () => {
    const result = reasonWithLocalRules('GENERAL_QUERY', context);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.supportingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(result.challengingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(result.triggeredRuleIds)).toBe(true);
    expect(Object.isFrozen(result.warnings)).toBe(true);
  });

  it('should not fabricate SUPPORT in LOCAL-CHART-002 when evidence is predominantly challenging', () => {
    const chartRule002 = CHART_SYNTHESIS_RULES.find((r) => r.id === 'LOCAL-CHART-002');
    expect(chartRule002).toBeDefined();

    // Construct artificial context with only challenging ascendant lord evidence
    const mockContext: AiContext = {
      ...context,
      ascendant: { sign: Sign.ARIES, lord: Planet.MARS },
      planets: Object.freeze([
        {
          planet: Planet.MARS,
          sign: Sign.CANCER,
          house: 4,
          strengthStatus: 'DEBILITATED',
          functionalRoles: Object.freeze(['LAGNA_LORD']),
          ownedHouses: Object.freeze([1, 8])
        }
      ]),
      evidence: Object.freeze([
        {
          id: 'ev-test-asc-lord-debilitated',
          source: 'PLANET',
          dimension: 'NATAL_STRUCTURE',
          statement: 'Mars is debilitated',
          effect: 'CHALLENGE',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: Object.freeze([Planet.MARS])
        } as AiEvidence
      ])
    };

    const evalResult = chartRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('CHALLENGE');
  });

  it('should not fabricate SUPPORT in LOCAL-DASHA-002 when timing evidence has 0 supporting and 0 challenging', () => {
    const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
    expect(dashaRule002).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      evidence: Object.freeze([
        {
          id: 'ev-test-neutral-timing',
          source: 'DASHA',
          dimension: 'TIMING',
          statement: 'Neutral timing cycle',
          effect: 'NEUTRAL',
          strength: 'MODERATE',
          priority: 'TIMING'
        } as AiEvidence
      ])
    };

    const evalResult = dashaRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('NEUTRAL');
  });

  it('should not treat UNKNOWN status yogas as SUPPORT in LOCAL-WEALTH-003', () => {
    const wealthRule003 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-003');
    expect(wealthRule003).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      yogas: Object.freeze([
        {
          type: 'DHANA_YOGA',
          category: 'DHANA',
          status: 'UNKNOWN',
          planets: Object.freeze([Planet.JUPITER]),
          houses: Object.freeze([2, 11])
        }
      ]),
      evidence: Object.freeze([])
    };

    const evalResult = wealthRule003!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('NEUTRAL');
  });

  it('should scope career D10 conflict rule ONLY to vargaRelationship === CONFLICTS', () => {
    const careerRule002 = CAREER_RULES.find((r) => r.id === 'LOCAL-CAREER-002');
    expect(careerRule002).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      career: {
        status: 'CHALLENGED',
        natalPromise: 'MIXED',
        d10Relationship: 'CONFLICTS',
        confidence: 'HIGH',
        supportingFactors: Object.freeze([]),
        challengingFactors: Object.freeze(['conflicting varga'])
      },
      evidence: Object.freeze([
        {
          id: 'ev-d10-confirm',
          source: 'D10',
          dimension: 'CONFIRMATION',
          statement: 'D10 reinforces position',
          effect: 'SUPPORT',
          strength: 'STRONG',
          vargaRelationship: 'CONFIRMS'
        } as AiEvidence,
        {
          id: 'ev-d10-conflict',
          source: 'D10',
          dimension: 'CONFIRMATION',
          statement: 'D10 clashes with lagna',
          effect: 'CHALLENGE',
          strength: 'STRONG',
          vargaRelationship: 'CONFLICTS'
        } as AiEvidence
      ])
    };

    const evalResult = careerRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.challengingEvidenceIds).toContain('ev-d10-conflict');
    expect(evalResult.challengingEvidenceIds).not.toContain('ev-d10-confirm');
  });

  it('should not fabricate SUPPORT in LOCAL-CHART-003 when varga evidence has undefined relationship (0 confirms, 0 conflicts)', () => {
    const chartRule003 = CHART_SYNTHESIS_RULES.find((r) => r.id === 'LOCAL-CHART-003');
    expect(chartRule003).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      evidence: Object.freeze([
        {
          id: 'ev-d9-unspecified',
          source: 'D9',
          dimension: 'CONFIRMATION',
          statement: 'D9 placement observed without relationship classification',
          effect: 'NEUTRAL',
          strength: 'MODERATE',
          priority: 'CONFIRMATORY'
        } as AiEvidence
      ])
    };

    const evalResult = chartRule003!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('NEUTRAL');
  });

  it('should map challenging yoga evidence to challengingEvidenceIds in LOCAL-WEALTH-003', () => {
    const wealthRule003 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-003');
    expect(wealthRule003).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      yogas: Object.freeze([
        {
          type: 'DHANA_YOGA',
          category: 'DHANA',
          status: 'WEAKENED',
          planets: Object.freeze([Planet.JUPITER]),
          houses: Object.freeze([2, 11])
        }
      ]),
      evidence: Object.freeze([
        {
          id: 'ev-dhana-challenge',
          source: 'YOGA',
          dimension: 'NATAL_STRUCTURE',
          statement: 'Dhana yoga combust and weakened by malefic aspect',
          effect: 'CHALLENGE',
          strength: 'STRONG',
          priority: 'PRIMARY'
        } as AiEvidence
      ])
    };

    const evalResult = wealthRule003!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.challengingEvidenceIds).toContain('ev-dhana-challenge');
    expect(evalResult.supportingEvidenceIds).not.toContain('ev-dhana-challenge');
    expect(evalResult.effect).toBe('CHALLENGE');
  });

  it('should populate unresolvedQuestions when essential task context is missing', () => {
    const contextWithoutCareer: AiContext = {
      ...context,
      career: undefined
    };
    const careerResult = reasonWithLocalRules('CAREER_ANALYSIS', contextWithoutCareer);
    expect(careerResult.unresolvedQuestions).toContain('Career context is unavailable in the provided chart projection.');

    const contextWithoutWealth: AiContext = {
      ...context,
      wealth: undefined
    };
    const wealthResult = reasonWithLocalRules('WEALTH_ANALYSIS', contextWithoutWealth);
    expect(wealthResult.unresolvedQuestions).toContain('Wealth context is unavailable in the provided chart projection.');

    const contextWithoutDasha: AiContext = {
      ...context,
      dasha: {
        system: 'VIMSHOTTARI',
        active: undefined,
        periods: Object.freeze([])
      }
    };
    const dashaResult = reasonWithLocalRules('DASHA_ANALYSIS', contextWithoutDasha);
    expect(dashaResult.unresolvedQuestions).toContain('No active Vimshottari Dasha period is available.');
  });

  it('should emit warnings and not crash when a rule references unknown evidence IDs', () => {
    const syntheticRule: LocalRuleDefinition = {
      id: 'LOCAL-SYNTHETIC-UNKNOWN',
      domain: 'CAREER',
      priority: 100,
      evaluate: () => ({
        triggered: true,
        effect: 'SUPPORT',
        statement: 'Synthetic rule with unknown IDs',
        supportingEvidenceIds: ['fake-supporting-id-999'],
        challengingEvidenceIds: ['fake-challenging-id-888']
      })
    };

    const result = reasonWithLocalRules('CAREER_ANALYSIS', context, [syntheticRule]);
    expect(result.warnings).toContain(
      'Rule LOCAL-SYNTHETIC-UNKNOWN referenced unknown supporting evidence ID: fake-supporting-id-999'
    );
    expect(result.warnings).toContain(
      'Rule LOCAL-SYNTHETIC-UNKNOWN referenced unknown challenging evidence ID: fake-challenging-id-888'
    );
    expect(result.supportingEvidenceIds).not.toContain('fake-supporting-id-999');
    expect(result.challengingEvidenceIds).not.toContain('fake-challenging-id-888');
  });

  it('should set status to PARTIAL and record warning when a rule throws during evaluation', () => {
    const throwingRule: LocalRuleDefinition = {
      id: 'LOCAL-SYNTHETIC-THROW',
      domain: 'CAREER',
      priority: 100,
      evaluate: () => {
        throw new Error('Test rule evaluation crashed');
      }
    };

    const result = reasonWithLocalRules('CAREER_ANALYSIS', context, [throwingRule]);
    expect(result.status).toBe('PARTIAL');
    expect(result.warnings).toContain(
      'Rule LOCAL-SYNTHETIC-THROW evaluation failed: Test rule evaluation crashed'
    );
  });

  it('should return NEUTRAL in LOCAL-DASHA-002 when no active dasha is present', () => {
    const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
    expect(dashaRule002).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      dasha: {
        system: 'VIMSHOTTARI',
        active: undefined,
        periods: Object.freeze([])
      }
    };

    const evalResult = dashaRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('NEUTRAL');
    expect(evalResult.statement).toContain('No active Vimshottari Dasha period is available');
  });

  it('should generate appropriate statements in LOCAL-DASHA-002 for SUPPORT and CHALLENGE effects', () => {
    const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
    expect(dashaRule002).toBeDefined();

    const supportContext: AiContext = {
      ...context,
      dasha: {
        system: 'VIMSHOTTARI',
        active: {
          mahadasha: Planet.JUPITER,
          antardasha: Planet.SATURN
        },
        periods: Object.freeze([])
      },
      evidence: Object.freeze([
        {
          id: 'ev-timing-support',
          source: 'DASHA',
          dimension: 'TIMING',
          statement: 'Favorable dasha timing',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'TIMING'
        } as AiEvidence
      ])
    };

    const supportEval = dashaRule002!.evaluate(supportContext);
    expect(supportEval.triggered).toBe(true);
    expect(supportEval.effect).toBe('SUPPORT');
    expect(supportEval.statement).toBe(
      'The active Vimshottari period has supporting deterministic timing evidence.'
    );

    const challengeContext: AiContext = {
      ...supportContext,
      evidence: Object.freeze([
        {
          id: 'ev-timing-challenge',
          source: 'DASHA',
          dimension: 'TIMING',
          statement: 'Challenging dasha timing',
          effect: 'CHALLENGE',
          strength: 'STRONG',
          priority: 'TIMING'
        } as AiEvidence
      ])
    };

    const challengeEval = dashaRule002!.evaluate(challengeContext);
    expect(challengeEval.triggered).toBe(true);
    expect(challengeEval.effect).toBe('CHALLENGE');
    expect(challengeEval.statement).toBe(
      'The active Vimshottari period has challenging deterministic timing evidence.'
    );
  });

  it('should produce "partially confirm" in LOCAL-CHART-003 when only PARTIALLY_CONFIRMS exists', () => {
    const chartRule003 = CHART_SYNTHESIS_RULES.find((r) => r.id === 'LOCAL-CHART-003');
    expect(chartRule003).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      evidence: Object.freeze([
        {
          id: 'ev-d9-partial',
          source: 'D9',
          dimension: 'CONFIRMATION',
          statement: 'D9 navamsha position partially aligns with rashi placement',
          effect: 'SUPPORT',
          strength: 'MODERATE',
          priority: 'CONFIRMATORY',
          vargaRelationship: 'PARTIALLY_CONFIRMS'
        } as AiEvidence
      ])
    };

    const evalResult = chartRule003!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('SUPPORT');
    expect(evalResult.statement).toContain('partially confirm');
  });

  it('should restrict LOCAL-CHART-002 evidence to ascendant lord or house 1', () => {
    const chartRule002 = CHART_SYNTHESIS_RULES.find((r) => r.id === 'LOCAL-CHART-002');
    expect(chartRule002).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      ascendant: {
        sign: Sign.ARIES,
        lord: Planet.MARS
      },
      evidence: Object.freeze([
        {
          id: 'ev-mars',
          source: 'PLANET',
          dimension: 'NATAL_STRUCTURE',
          statement: 'Mars in Aries exalted',
          effect: 'SUPPORT',
          strength: 'STRONG',
          priority: 'PRIMARY',
          planets: Object.freeze([Planet.MARS])
        } as AiEvidence,
        {
          id: 'ev-house7-venus',
          source: 'HOUSE',
          dimension: 'NATAL_STRUCTURE',
          statement: 'Venus in 7th house',
          effect: 'SUPPORT',
          strength: 'MODERATE',
          priority: 'SECONDARY',
          houses: Object.freeze([7]),
          planets: Object.freeze([Planet.VENUS])
        } as AiEvidence
      ])
    };

    const evalResult = chartRule002!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.supportingEvidenceIds).toContain('ev-mars');
    expect(evalResult.supportingEvidenceIds).not.toContain('ev-house7-venus');
  });

  it('should format LOCAL-WEALTH-003 statement with positive, weakened, and cancelled breakdowns', () => {
    const wealthRule003 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-003');
    expect(wealthRule003).toBeDefined();

    const mockContext: AiContext = {
      ...context,
      yogas: Object.freeze([
        {
          type: 'DHANA_YOGA',
          category: 'DHANA',
          status: 'PRESENT',
          planets: Object.freeze([Planet.JUPITER]),
          houses: Object.freeze([2])
        },
        {
          type: 'LAKSHMI_YOGA',
          category: 'DHANA',
          status: 'WEAKENED',
          planets: Object.freeze([Planet.VENUS]),
          houses: Object.freeze([9])
        },
        {
          type: 'DHANA_YOGA',
          category: 'DHANA',
          status: 'CANCELLED',
          planets: Object.freeze([Planet.MERCURY]),
          houses: Object.freeze([11])
        }
      ]),
      evidence: Object.freeze([])
    };

    const evalResult = wealthRule003!.evaluate(mockContext);
    expect(evalResult.triggered).toBe(true);
    expect(evalResult.effect).toBe('CHALLENGE');
    expect(evalResult.statement).toBe(
      'Dhana and prosperity yoga patterns evaluated: 1 positive, 1 weakened, 1 cancelled.'
    );
  });

  describe('D04 Local Dasha Rules Evaluation', () => {
    it('should format LOCAL-DASHA-001 statement with explicit MD/AD/PD hierarchy', () => {
      const dashaRule001 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-001');
      expect(dashaRule001).toBeDefined();

      const mockContext: AiContext = {
        ...context,
        dasha: {
          system: 'VIMSHOTTARI',
          periods: [],
          active: {
            mahadasha: Planet.JUPITER,
            antardasha: Planet.SATURN,
            pratyantardasha: Planet.MERCURY
          }
        }
      };

      const evalResult = dashaRule001!.evaluate(mockContext);
      expect(evalResult.triggered).toBe(true);
      expect(evalResult.statement).toBe(
        'Active Vimshottari period hierarchy: Mahadasha of JUPITER (primary), Antardasha of SATURN (secondary), Pratyantardasha of MERCURY (short-term).'
      );
    });

    it('should evaluate LOCAL-DASHA-002 with fallback timing evidence when interpretation is absent', () => {
      const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
      expect(dashaRule002).toBeDefined();

      const supportEv: AiEvidence = {
        id: 'DASHA:MAHADASHA:D-MD-01:JUPITER:1:SUPPORT',
        source: 'DASHA',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Jupiter functional benefic in Kendra',
        planets: [Planet.JUPITER],
        houses: [1],
        priority: 'TIMING',
        dimension: 'TIMING',
        dashaLevel: 'MAHADASHA',
        timingPlanet: Planet.JUPITER
      };

      const challengeEv: AiEvidence = {
        id: 'DASHA:ANTARDASHA:D-AD-01:SATURN:8:CHALLENGE',
        source: 'DASHA',
        effect: 'CHALLENGE',
        strength: 'STRONG',
        statement: 'Saturn placed in 8th house',
        planets: [Planet.SATURN],
        houses: [8],
        priority: 'TIMING',
        dimension: 'TIMING',
        dashaLevel: 'ANTARDASHA',
        timingPlanet: Planet.SATURN
      };

      // Context with more supporting than challenging
      const supportContext: AiContext = {
        ...context,
        dasha: {
          system: 'VIMSHOTTARI',
          periods: [],
          active: {
            mahadasha: Planet.JUPITER,
            antardasha: Planet.SATURN
          }
        },
        evidence: [supportEv]
      };

      const supportResult = dashaRule002!.evaluate(supportContext);
      expect(supportResult.triggered).toBe(true);
      expect(supportResult.effect).toBe('SUPPORT');
      expect(supportResult.supportingEvidenceIds).toContain(supportEv.id);
      expect(supportResult.statement).toBe(
        'The active Vimshottari period has supporting deterministic timing evidence.'
      );

      // Context with both supporting and challenging (mixed)
      const mixedContext: AiContext = {
        ...context,
        dasha: {
          system: 'VIMSHOTTARI',
          periods: [],
          active: {
            mahadasha: Planet.JUPITER,
            antardasha: Planet.SATURN
          }
        },
        evidence: [supportEv, challengeEv]
      };

      const mixedResult = dashaRule002!.evaluate(mixedContext);
      expect(mixedResult.triggered).toBe(true);
      expect(mixedResult.effect).toBe('MIXED');
      expect(mixedResult.supportingEvidenceIds).toContain(supportEv.id);
      expect(mixedResult.challengingEvidenceIds).toContain(challengeEv.id);
      expect(mixedResult.statement).toBe(
        'The active Vimshottari period has both supporting and challenging deterministic timing evidence.'
      );
    });

    it('should consume MD×AD pair relationship evidence in LOCAL-DASHA-002', () => {
      const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
      expect(dashaRule002).toBeDefined();

      const pairEvId = 'DASHA:PAIR:D-PAIR-01:JUPITER,SATURN::SUPPORT';
      const pairEv: AiEvidence = {
        id: pairEvId,
        source: 'DASHA',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Jupiter and Saturn form supportive trine relationship',
        planets: [Planet.JUPITER, Planet.SATURN],
        priority: 'TIMING',
        dimension: 'TIMING'
      };

      const mdEvId = 'DASHA:MAHADASHA:D-MD-01:JUPITER:9:SUPPORT';
      const mdEv: AiEvidence = {
        id: mdEvId,
        source: 'DASHA',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Jupiter in 9th house',
        planets: [Planet.JUPITER],
        houses: [9],
        priority: 'TIMING',
        dimension: 'TIMING',
        dashaLevel: 'MAHADASHA',
        timingPlanet: Planet.JUPITER
      };

      const hierarchicalContext: AiContext = {
        ...context,
        evidence: [mdEv, pairEv],
        dasha: {
          system: 'VIMSHOTTARI',
          periods: [],
          active: {
            mahadasha: Planet.JUPITER,
            antardasha: Planet.SATURN
          },
          interpretation: {
            status: 'AVAILABLE',
            asOf: '2024-06-01T00:00:00.000Z',
            confidence: 'HIGH',
            evidenceIds: [],
            mahadasha: {
              level: 'MAHADASHA',
              planet: Planet.JUPITER,
              start: '2020-01-01',
              end: '2036-01-01',
              placement: { house: 9, sign: Sign.SAGITTARIUS },
              ownedHouses: [9, 12],
              functionalRoles: ['TRIKONA_LORD'],
              evidenceIds: [mdEvId],
              confidence: 'HIGH'
            },
            antardasha: {
              level: 'ANTARDASHA',
              planet: Planet.SATURN,
              start: '2022-01-01',
              end: '2024-07-01',
              placement: { house: 11, sign: Sign.AQUARIUS },
              ownedHouses: [10, 11],
              functionalRoles: ['KENDRA_LORD'],
              evidenceIds: [],
              confidence: 'HIGH'
            },
            pair: {
              mahadashaLord: Planet.JUPITER,
              antardashaLord: Planet.SATURN,
              sharedHouses: [],
              combinedHouseSet: [9, 10, 11, 12],
              relationshipEvidenceIds: [pairEvId]
            }
          }
        }
      };

      const result = dashaRule002!.evaluate(hierarchicalContext);
      expect(result.triggered).toBe(true);
      expect(result.effect).toBe('SUPPORT');
      expect(result.supportingEvidenceIds).toContain(pairEvId);
      expect(result.supportingEvidenceIds).toContain(mdEvId);
      expect(result.statement).toContain('Mahadasha of JUPITER establishes a support primary timing foundation.');
      expect(result.statement).toContain('Antardasha of SATURN (with JUPITER-SATURN relationship)');
      expect(result.statement).toContain('Hierarchical timing outcome is SUPPORT.');

      const fullTaskResult = reasonWithLocalRules('DASHA_ANALYSIS', hierarchicalContext);
      expect(fullTaskResult.supportingEvidenceIds).toContain(pairEvId);
    });

    it('should preserve MD primacy when MD is SUPPORT and multiple PD evidence entries are CHALLENGE', () => {
      const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002');
      expect(dashaRule002).toBeDefined();

      const mdEvId = 'DASHA:MAHADASHA:D-MD-01:JUPITER:9:SUPPORT';
      const mdEv: AiEvidence = {
        id: mdEvId,
        source: 'DASHA',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Jupiter strong in 9th house',
        planets: [Planet.JUPITER],
        houses: [9],
        priority: 'TIMING',
        dimension: 'TIMING',
        dashaLevel: 'MAHADASHA',
        timingPlanet: Planet.JUPITER
      };

      // 4 challenging PD evidence items
      const pdEvIds = [
        'DASHA:PRATYANTARDASHA:D-PD-01:MERCURY:6:CHALLENGE',
        'DASHA:PRATYANTARDASHA:D-PD-02:MERCURY:8:CHALLENGE',
        'DASHA:PRATYANTARDASHA:D-PD-03:MERCURY:12:CHALLENGE',
        'DASHA:PRATYANTARDASHA:D-PD-04:MERCURY::CHALLENGE'
      ];
      const pdEvList: AiEvidence[] = pdEvIds.map((id, index) => ({
        id,
        source: 'DASHA',
        effect: 'CHALLENGE',
        strength: 'MODERATE' as const,
        statement: `Mercury challenging transit ${index + 1}`,
        planets: [Planet.MERCURY],
        priority: 'TIMING',
        dimension: 'TIMING',
        dashaLevel: 'PRATYANTARDASHA',
        timingPlanet: Planet.MERCURY
      }));

      const hierarchyContext: AiContext = {
        ...context,
        evidence: [mdEv, ...pdEvList],
        dasha: {
          system: 'VIMSHOTTARI',
          periods: [],
          active: {
            mahadasha: Planet.JUPITER,
            antardasha: Planet.SATURN,
            pratyantardasha: Planet.MERCURY
          },
          interpretation: {
            status: 'AVAILABLE',
            asOf: '2024-06-01T00:00:00.000Z',
            confidence: 'HIGH',
            evidenceIds: [],
            mahadasha: {
              level: 'MAHADASHA',
              planet: Planet.JUPITER,
              start: '2020-01-01',
              end: '2036-01-01',
              placement: { house: 9, sign: Sign.SAGITTARIUS },
              ownedHouses: [9, 12],
              functionalRoles: ['TRIKONA_LORD'],
              evidenceIds: [mdEvId],
              confidence: 'HIGH'
            },
            antardasha: {
              level: 'ANTARDASHA',
              planet: Planet.SATURN,
              start: '2022-01-01',
              end: '2024-07-01',
              placement: { house: 11, sign: Sign.AQUARIUS },
              ownedHouses: [10, 11],
              functionalRoles: ['KENDRA_LORD'],
              evidenceIds: [],
              confidence: 'HIGH'
            },
            pratyantardasha: {
              level: 'PRATYANTARDASHA',
              planet: Planet.MERCURY,
              start: '2024-01-01',
              end: '2024-05-01',
              placement: { house: 6, sign: Sign.VIRGO },
              ownedHouses: [3, 6],
              functionalRoles: ['DUSTHANA_LORD'],
              evidenceIds: pdEvIds,
              confidence: 'MEDIUM'
            }
          }
        }
      };

      const result = dashaRule002!.evaluate(hierarchyContext);
      expect(result.triggered).toBe(true);
      // MD primacy is preserved — outcome must NOT be flipped to CHALLENGE by PD count
      expect(result.effect).not.toBe('CHALLENGE');
      expect(result.effect).toBe('SUPPORT');
      expect(result.supportingEvidenceIds).toContain(mdEvId);
      for (const pdId of pdEvIds) {
        expect(result.challengingEvidenceIds).toContain(pdId);
      }
      expect(result.statement).toContain('Mahadasha of JUPITER establishes a support primary timing foundation.');
      expect(result.statement).toContain('Pratyantardasha of MERCURY provides challenge short-term refinement.');
      expect(result.statement).toContain('Hierarchical timing outcome is SUPPORT.');
    });

    it('should produce deep-equal deterministic rule output for end-to-end horoscope across multiple runs', () => {
      const e2eHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, {
        asOf: '2024-06-01T00:00:00.000Z'
      });
      const e2eContext1 = buildAiContext(e2eHoroscope);
      const e2eContext2 = buildAiContext(e2eHoroscope);

      const dashaRule002 = DASHA_RULES.find((r) => r.id === 'LOCAL-DASHA-002')!;
      const run1 = dashaRule002.evaluate(e2eContext1);
      const run2 = dashaRule002.evaluate(e2eContext2);

      expect(run1).toEqual(run2);

      const fullRun1 = reasonWithLocalRules('DASHA_ANALYSIS', e2eContext1);
      const fullRun2 = reasonWithLocalRules('DASHA_ANALYSIS', e2eContext2);
      expect(fullRun1).toEqual(fullRun2);

      // Verify all returned evidence IDs resolve against context.evidence
      const contextEvidenceIds = new Set(e2eContext1.evidence.map((e) => e.id));
      for (const id of run1.supportingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
      for (const id of run1.challengingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
      for (const id of fullRun1.supportingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
      for (const id of fullRun1.challengingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
    });
  });

  describe('LOCAL-WEALTH-004 Dasha Timing Rule (per-dimension projection)', () => {
    const e2eHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, {
      asOf: '2024-06-01T00:00:00.000Z'
    });
    const baseContext = buildAiContext(e2eHoroscope);
    const wealthRule004 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-004')!;

    it('should not emit a blanket SUPPORT when Accumulation/Gains/Fortune = ACTIVATES and Speculation = CHALLENGES', () => {
      expect(wealthRule004).toBeDefined();

      const evSupport: AiEvidence = {
        id: 'ev-wealth-dim-support',
        source: 'WEALTH',
        dimension: 'TIMING',
        statement: 'Benefic activates accumulation and gains',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY'
      };
      const evChallenge: AiEvidence = {
        id: 'ev-wealth-dim-challenge',
        source: 'WEALTH',
        dimension: 'TIMING',
        statement: 'Malefic challenges speculation',
        effect: 'CHALLENGE',
        strength: 'STRONG',
        priority: 'PRIMARY'
      };

      const mockContext3Act1Chal: AiContext = {
        ...baseContext,
        evidence: [...baseContext.evidence, evSupport, evChallenge],
        wealth: {
          ...baseContext.wealth!,
          timing: {
            status: 'AVAILABLE',
            asOf: '2024-06-01T00:00:00.000Z',
            hierarchy: {
              primary: { level: 'MAHADASHA', role: 'PRIMARY', planet: Planet.JUPITER, effect: 'ACTIVATES' },
              modifier: { level: 'ANTARDASHA', role: 'MODIFIER', planet: Planet.SATURN, effect: 'ACTIVATES' },
              trigger: { level: 'PRATYANTARDASHA', role: 'TRIGGER', planet: Planet.MERCURY, effect: 'CHALLENGES' },
              dimensions: [
                { dimension: 'ACCUMULATION', primary: 'ACTIVATES', modifier: 'ACTIVATES', trigger: 'ACTIVATES', overallEffect: 'ACTIVATES' },
                { dimension: 'GAINS', primary: 'ACTIVATES', modifier: 'ACTIVATES', trigger: 'ACTIVATES', overallEffect: 'ACTIVATES' },
                { dimension: 'FORTUNE', primary: 'ACTIVATES', modifier: 'ACTIVATES', trigger: 'ACTIVATES', overallEffect: 'ACTIVATES' },
                { dimension: 'SPECULATION', primary: 'CHALLENGES', modifier: 'CHALLENGES', trigger: 'CHALLENGES', overallEffect: 'CHALLENGES' }
              ],
              evidenceIds: ['ev-wealth-dim-support', 'ev-wealth-dim-challenge']
            }
          }
        }
      };

      const evalResult = wealthRule004.evaluate(mockContext3Act1Chal);
      expect(evalResult.triggered).toBe(true);
      // Must not collapse 3:1 majority into a blanket SUPPORT
      expect(evalResult.effect).not.toBe('SUPPORT');
      expect(evalResult.effect).toBe('MIXED');
      // Speculation CHALLENGES effect must be preserved and visible in statement
      expect(evalResult.statement).toContain('Speculation');
      expect(evalResult.statement).toContain('CHALLENGES');
      expect(evalResult.statement).toContain('Accumulation');
      expect(evalResult.statement).toContain('ACTIVATES');
      // Challenging evidence must be emitted
      expect(evalResult.challengingEvidenceIds).toContain('ev-wealth-dim-challenge');
      expect(evalResult.supportingEvidenceIds).toContain('ev-wealth-dim-support');

      // Assert all projected evidenceIds resolve in context.evidence
      const contextEvidenceIds = new Set(mockContext3Act1Chal.evidence.map((e) => e.id));
      for (const id of evalResult.supportingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
      for (const id of evalResult.challengingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
    });

    it('should not emit a blanket CHALLENGE when 1 dimension ACTIVATES and 3 CHALLENGE, preserving each dimension', () => {
      const evSupport: AiEvidence = {
        id: 'ev-wealth-dim-support-2',
        source: 'WEALTH',
        dimension: 'TIMING',
        statement: 'Benefic activates speculation',
        effect: 'SUPPORT',
        strength: 'STRONG',
        priority: 'PRIMARY'
      };
      const evChallenge: AiEvidence = {
        id: 'ev-wealth-dim-challenge-2',
        source: 'WEALTH',
        dimension: 'TIMING',
        statement: 'Malefic challenges accumulation/gains/fortune',
        effect: 'CHALLENGE',
        strength: 'STRONG',
        priority: 'PRIMARY'
      };

      const mockContext1Act3Chal: AiContext = {
        ...baseContext,
        evidence: [...baseContext.evidence, evSupport, evChallenge],
        wealth: {
          ...baseContext.wealth!,
          timing: {
            status: 'AVAILABLE',
            asOf: '2024-06-01T00:00:00.000Z',
            hierarchy: {
              primary: { level: 'MAHADASHA', role: 'PRIMARY', planet: Planet.JUPITER, effect: 'CHALLENGES' },
              modifier: { level: 'ANTARDASHA', role: 'MODIFIER', planet: Planet.SATURN, effect: 'CHALLENGES' },
              trigger: { level: 'PRATYANTARDASHA', role: 'TRIGGER', planet: Planet.MERCURY, effect: 'ACTIVATES' },
              dimensions: [
                { dimension: 'ACCUMULATION', primary: 'CHALLENGES', modifier: 'CHALLENGES', trigger: 'CHALLENGES', overallEffect: 'CHALLENGES' },
                { dimension: 'GAINS', primary: 'CHALLENGES', modifier: 'CHALLENGES', trigger: 'CHALLENGES', overallEffect: 'CHALLENGES' },
                { dimension: 'FORTUNE', primary: 'CHALLENGES', modifier: 'CHALLENGES', trigger: 'CHALLENGES', overallEffect: 'CHALLENGES' },
                { dimension: 'SPECULATION', primary: 'ACTIVATES', modifier: 'ACTIVATES', trigger: 'ACTIVATES', overallEffect: 'ACTIVATES' }
              ],
              evidenceIds: ['ev-wealth-dim-support-2', 'ev-wealth-dim-challenge-2']
            }
          }
        }
      };

      const evalResult = wealthRule004.evaluate(mockContext1Act3Chal);
      expect(evalResult.triggered).toBe(true);
      // Must not collapse 1:3 into a blanket CHALLENGE
      expect(evalResult.effect).not.toBe('CHALLENGE');
      expect(evalResult.effect).toBe('MIXED');
      // Each dimension's effect is preserved in the projected statement
      expect(evalResult.statement).toContain('Speculation');
      expect(evalResult.statement).toContain('ACTIVATES');
      expect(evalResult.statement).toContain('Accumulation');
      expect(evalResult.statement).toContain('CHALLENGES');
      expect(evalResult.statement).toContain('Gains');
      expect(evalResult.statement).toContain('Fortune');

      // Assert all projected evidenceIds resolve in context.evidence
      const contextEvidenceIds = new Set(mockContext1Act3Chal.evidence.map((e) => e.id));
      for (const id of evalResult.supportingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
      for (const id of evalResult.challengingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
    });

    it('should evaluate deterministically with deep-equal outputs across multiple runs', () => {
      const e2eHoroscope1 = calculateHoroscope(CANONICAL_BIRTH_DETAILS, {
        asOf: '2024-06-01T00:00:00.000Z'
      });
      const e2eContext1 = buildAiContext(e2eHoroscope1);
      const e2eContext2 = buildAiContext(e2eHoroscope1);

      const run1 = wealthRule004.evaluate(e2eContext1);
      const run2 = wealthRule004.evaluate(e2eContext2);
      expect(run1).toEqual(run2);

      const fullRun1 = reasonWithLocalRules('WEALTH_ANALYSIS', e2eContext1);
      const fullRun2 = reasonWithLocalRules('WEALTH_ANALYSIS', e2eContext2);
      expect(fullRun1).toEqual(fullRun2);

      const contextEvidenceIds = new Set(e2eContext1.evidence.map((e) => e.id));
      for (const id of run1.supportingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
      for (const id of run1.challengingEvidenceIds || []) {
        expect(contextEvidenceIds.has(id)).toBe(true);
      }
    });
  });
});
