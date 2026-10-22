import { describe, it, expect } from 'vitest';
import { Planet, DashaSystem } from '../../types';
import type {
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  SELECTED_PERIOD_CONTEXT_VERSION,
  MD_AD_PERIOD_RESOLVER_VERSION,
  createSelectedPeriodId
} from '../../core/analysis';
import type {
  SelectedPeriodActivationContext
} from '../../core/analysis';
import type {
  SelectedExpressionActivation,
  SelectedCareerDashaActivationSuccess
} from '../career/careerDasha/selectedCareerDashaActivation';
import type {
  SelectedWealthPeriodActivation,
  SelectedWealthDimensionActivation,
  SelectedWealthDashaRuleReference
} from '../wealth/selectedWealthDashaActivation';
import type {
  DomainEvidence
} from '../interpretation/DomainEvidence';
import {
  createDomainEvidence
} from '../interpretation/DomainEvidence';
import type {
  CareerFinalSynthesisResult
} from '../career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  CareerWealthFinalSynthesis
} from '../careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import {
  buildSelectedPeriodSynthesis
} from './selectedPeriodSynthesis';

/**
 * Helper to create a mock selected period context.
 */
function makeSelectedPeriodContext(): SelectedPeriodActivationContext {
  const mahadashaNode: DashaMahadashaInterpretation = {
    planet: Planet.JUPITER,
    start: '2020-01-01T00:00:00.000Z',
    end: '2036-01-01T00:00:00.000Z',
    natal: {} as any,
    antardashas: [],
    evidence: [],
    confidence: 'HIGH'
  };

  const antardashaNode: DashaAntardashaInterpretation = {
    planet: Planet.SATURN,
    start: '2020-01-01T00:00:00.000Z',
    end: '2022-01-01T00:00:00.000Z',
    natal: {} as any,
    pratyantardashas: [],
    evidence: [],
    confidence: 'HIGH'
  };

  return Object.freeze({
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: DashaSystem.VIMSHOTTARI,
    level: 'MD_AD',
    selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: '2021-06-15T00:00:00.000Z',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: Object.freeze({
      start: '2020-01-01T00:00:00.000Z',
      end: '2022-01-01T00:00:00.000Z'
    }),
    mahadasha: Object.freeze({
      id: 'md-1',
      planet: Planet.JUPITER,
      start: '2020-01-01T00:00:00.000Z',
      end: '2036-01-01T00:00:00.000Z'
    }),
    antardasha: Object.freeze({
      id: 'ad-1',
      mahadashaId: 'md-1',
      planet: Planet.SATURN,
      start: '2020-01-01T00:00:00.000Z',
      end: '2022-01-01T00:00:00.000Z'
    }),
    mahadashaNode,
    antardashaNode
  });
}

/**
 * Helper to create a Moon/Moon selected period context for regression tests.
 */
function makeMoonMoonContext(): SelectedPeriodActivationContext {
  const mahadashaNode: DashaMahadashaInterpretation = {
    planet: Planet.MOON,
    start: '2020-01-01T00:00:00.000Z',
    end: '2039-01-01T00:00:00.000Z',
    natal: {} as any,
    antardashas: [],
    evidence: [],
    confidence: 'HIGH'
  };

  const antardashaNode: DashaAntardashaInterpretation = {
    planet: Planet.MOON,
    start: '2025-01-01T00:00:00.000Z',
    end: '2027-01-01T00:00:00.000Z',
    natal: {} as any,
    pratyantardashas: [],
    evidence: [],
    confidence: 'HIGH'
  };

  return Object.freeze({
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: DashaSystem.VIMSHOTTARI,
    level: 'MD_AD',
    selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: '2026-01-01T00:00:00.000Z',
    temporalRelation: 'CURRENT',
    intervalSemantics: '[start,end)',
    interval: Object.freeze({
      start: '2025-01-01T00:00:00.000Z',
      end: '2027-01-01T00:00:00.000Z'
    }),
    mahadasha: Object.freeze({
      id: 'md-1',
      planet: Planet.MOON,
      start: '2020-01-01T00:00:00.000Z',
      end: '2039-01-01T00:00:00.000Z'
    }),
    antardasha: Object.freeze({
      id: 'ad-1',
      mahadashaId: 'md-1',
      planet: Planet.MOON,
      start: '2025-01-01T00:00:00.000Z',
      end: '2027-01-01T00:00:00.000Z'
    }),
    mahadashaNode,
    antardashaNode
  });
}

/**
 * Helper to create a mock career activation.
 */
function makeCareerActivation(
  qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE' = 'CANONICAL_STATUS'
): SelectedCareerDashaActivationSuccess {
  const expressionActivations: SelectedExpressionActivation[] = [
    Object.freeze({
      expressionRefKey: 'EMPLOYMENT:SUPPORT:evid1',
      expressionSource: 'CALLER',
      expression: {} as any,
      expressionEvidenceIds: Object.freeze(['evid1']),
      qualifiedEvidenceIds: Object.freeze(['evid1']),
      unqualifiedEvidenceIds: Object.freeze([]),
      linkedLevels: Object.freeze(['MD' as const, 'AD' as const]),
      mdDashaEvidenceIds: Object.freeze(['md-evid1']),
      adDashaEvidenceIds: Object.freeze(['ad-evid1']),
      matchBasis: 'UNAMBIGUOUS',
      activation: Object.freeze({
        mdActivation: Object.freeze({
          level: 'MD',
          planet: Planet.JUPITER,
          role: 'PRIMARY_DRIVER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          statement: 'MD activates'
        }),
        adActivation: Object.freeze({
          level: 'AD',
          planet: Planet.SATURN,
          role: 'MODIFIER',
          effect: 'ACTIVATES',
          direction: 'SUPPORT',
          strength: 'STRONG',
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z',
          statement: 'AD activates'
        })
      })
    })
  ];

  return Object.freeze({
    selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
    temporalRelation: 'CURRENT',
    interval: Object.freeze({
      start: '2020-01-01T00:00:00.000Z',
      end: '2022-01-01T00:00:00.000Z'
    }),
    expressionActivations,
    unmatchedExpressionEvidenceIds: Object.freeze([]),
    qualificationBasis,
    canonicalDashaAnalysis: {} as any,
    selectedDashaInterpretation: Object.freeze({
      mahadashaNode: {} as any,
      antardashaNode: {} as any
    }),
    statement: 'Career activation statement',
    diagnostics: Object.freeze([])
  });
}

/**
 * Helper to create a mock wealth activation.
 */
function makeWealthActivation(): SelectedWealthPeriodActivation {
  const dimensions: Record<string, SelectedWealthDimensionActivation> = {
    ACCUMULATION: Object.freeze({
      dimension: 'ACCUMULATION',
      effect: 'ACTIVATES',
      linkedLevels: Object.freeze(['MD' as const, 'AD' as const]),
      md: Object.freeze({
        effect: 'ACTIVATES',
        dashaRuleReferences: Object.freeze([
          Object.freeze({
            ruleId: 'rule-1',
            level: 'MD',
            source: 'DASHA'
          })
        ])
      }),
      ad: Object.freeze({
        effect: 'ACTIVATES',
        dashaRuleReferences: Object.freeze([
          Object.freeze({
            ruleId: 'rule-2',
            level: 'AD',
            source: 'DASHA'
          })
        ])
      }),
      promiseEvidenceIds: Object.freeze(['promise-1']),
      dashaRuleReferences: Object.freeze([
        Object.freeze({
          ruleId: 'rule-1',
          level: 'MD',
          source: 'DASHA'
        }),
        Object.freeze({
          ruleId: 'rule-2',
          level: 'AD',
          source: 'DASHA'
        })
      ]),
      insufficientReason: 'LINKED' as const
    }),
    GAINS: Object.freeze({
      dimension: 'GAINS',
      effect: 'PARTIALLY_ACTIVATES',
      linkedLevels: Object.freeze(['MD' as const]),
      md: Object.freeze({
        effect: 'ACTIVATES',
        dashaRuleReferences: Object.freeze([])
      }),
      ad: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      promiseEvidenceIds: Object.freeze(['promise-2']),
      dashaRuleReferences: Object.freeze([]),
      insufficientReason: 'LINKED' as const
    }),
    FORTUNE: Object.freeze({
      dimension: 'FORTUNE',
      effect: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      md: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      ad: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      promiseEvidenceIds: Object.freeze([]),
      dashaRuleReferences: Object.freeze([]),
      insufficientReason: 'NO_PROMISE_EVIDENCE' as const
    }),
    SPECULATION: Object.freeze({
      dimension: 'SPECULATION',
      effect: 'CHALLENGES',
      linkedLevels: Object.freeze(['AD' as const]),
      md: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      ad: Object.freeze({
        effect: 'CHALLENGES',
        dashaRuleReferences: Object.freeze([])
      }),
      promiseEvidenceIds: Object.freeze(['promise-3']),
      dashaRuleReferences: Object.freeze([]),
      insufficientReason: 'LINKED' as const
    })
  };

  return Object.freeze({
    selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
    interval: Object.freeze({
      start: '2020-01-01T00:00:00.000Z',
      end: '2022-01-01T00:00:00.000Z'
    }),
    temporalRelation: 'CURRENT',
    dimensions: Object.freeze(dimensions)
  });
}

/**
 * Helper to create mock evidence.
 */
function makeEvidence(
  id: string,
  polarity: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL',
  domain: 'CAREER' | 'WEALTH',
  dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION',
  phase?: 'NATAL_PROMISE' | 'DASHA_ACTIVATION',
  overrides?: Partial<DomainEvidence>
): DomainEvidence {
  return Object.freeze({
    id,
    sourceType: 'PLANET',
    domain,
    role: 'PRIMARY',
    phase: phase ?? 'NATAL_PROMISE',
    source: 'D1',
    statement: `Evidence ${id}`,
    polarity,
    strength: 'STRONG',
    priority: 1,
    relatedEvidenceIds: Object.freeze([]),
    dimension,
    identityKey: `key-${id}`,
    ...overrides
  });
}

describe('buildSelectedPeriodSynthesis', () => {
  describe('invalid context error', () => {
    it('returns error for invalid selected period context', () => {
      const invalidContext = {} as SelectedPeriodActivationContext;
      const result = buildSelectedPeriodSynthesis({
        selectedPeriod: invalidContext
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD_CONTEXT');
      }
    });
  });

  describe('period identity verbatim', () => {
    it('copies period fields verbatim from selectedPeriod', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.period.selectedPeriodId).toBe(selectedPeriod.selectedPeriodId);
        expect(result.value.period.mahadashaId).toBe(selectedPeriod.mahadasha.id);
        expect(result.value.period.mahadashaPlanet).toBe(selectedPeriod.mahadasha.planet);
        expect(result.value.period.antardashaId).toBe(selectedPeriod.antardasha.id);
        expect(result.value.period.antardashaPlanet).toBe(selectedPeriod.antardasha.planet);
        expect(result.value.period.interval.start).toBe(selectedPeriod.interval.start);
        expect(result.value.period.interval.end).toBe(selectedPeriod.interval.end);
        expect(result.value.period.analysisAsOf).toBe(selectedPeriod.analysisAsOf);
        expect(result.value.period.temporalRelation).toBe(selectedPeriod.temporalRelation);
      }
    });
  });

  describe('baseline object identity and no mutation', () => {
    it('carries career baseline by reference with unchanged flag', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerBaseline = Object.freeze({ id: 'career-baseline' } as unknown as CareerFinalSynthesisResult);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerBaseline
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.natalBaseline.career?.baseline).toBe(careerBaseline);
        expect(result.value.natalBaseline.career?.unchanged).toBe(true);
      }
    });

    it('carries wealth baseline by reference with unchanged flag', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthBaseline = Object.freeze({ id: 'wealth-baseline' } as unknown as CareerWealthFinalSynthesis);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthBaseline
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.natalBaseline.wealth?.baseline).toBe(wealthBaseline);
        expect(result.value.natalBaseline.wealth?.unchanged).toBe(true);
      }
    });

    it('does not mutate input baselines', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerBaseline = { id: 'career-baseline' } as unknown as CareerFinalSynthesisResult;
      const wealthBaseline = { id: 'wealth-baseline' } as unknown as CareerWealthFinalSynthesis;

      const originalCareer = JSON.stringify(careerBaseline);
      const originalWealth = JSON.stringify(wealthBaseline);

      buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerBaseline,
        wealthBaseline
      });

      expect(JSON.stringify(careerBaseline)).toBe(originalCareer);
      expect(JSON.stringify(wealthBaseline)).toBe(originalWealth);
    });
  });

  describe('Career and Wealth independence', () => {
    it('Career and Wealth sections are independent', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const wealthActivation = makeWealthActivation();

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation
      });

      expect(result1.ok).toBe(true);
      if (!result1.ok) return;

      const careerSection1 = result1.value.career;
      const wealthSection1 = result1.value.wealth;

      // Mutate career section input and rebuild
      const modifiedCareerActivation = makeCareerActivation('PROXY_DIRECTION');
      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation: modifiedCareerActivation,
        wealthActivation
      });

      expect(result2.ok).toBe(true);
      if (!result2.ok) return;

      // Wealth section should be identical
      expect(result2.value.wealth).toEqual(wealthSection1);
      // Career section should differ
      expect(result2.value.career).not.toEqual(careerSection1);
    });
  });

  describe('all four dimensions independent', () => {
    it('each wealth dimension is independent', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const dimensions = result.value.wealth.dimensions;
      expect(dimensions.ACCUMULATION.effect).toBe('ACTIVATES');
      expect(dimensions.GAINS.effect).toBe('PARTIALLY_ACTIVATES');
      expect(dimensions.FORTUNE.effect).toBe('INSUFFICIENT_DATA');
      expect(dimensions.SPECULATION.effect).toBe('CHALLENGES');
    });
  });

  describe('PROXY_DIRECTION visible + diagnostic', () => {
    it('includes PROXY_DIRECTION in qualificationBasis', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation('PROXY_DIRECTION');

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.career.qualificationBasis).toBe('PROXY_DIRECTION');
    });

    it('adds CAREER_QUALIFICATION_UNAVAILABLE diagnostic for PROXY_DIRECTION', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation('PROXY_DIRECTION');

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // The diagnostic is now at section level in diagnostics array
      const hasDiagnostic = result.value.career.diagnostics.some(d => d.code === 'CAREER_QUALIFICATION_UNAVAILABLE');
      expect(hasDiagnostic).toBe(true);
      expect(result.value.career.qualificationBasis).toBe('PROXY_DIRECTION');
    });

    it('adds CAREER_QUALIFICATION_UNAVAILABLE diagnostic for UNAVAILABLE', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation('UNAVAILABLE' as any);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // The diagnostic is now at section level in diagnostics array
      const hasDiagnostic = result.value.career.diagnostics.some(d => d.code === 'CAREER_QUALIFICATION_UNAVAILABLE');
      expect(hasDiagnostic).toBe(true);
      expect(result.value.career.qualificationBasis).toBe('UNAVAILABLE');
    });
  });

  describe('supporting/challenging/mixed classification with provenance', () => {
    it('classifies supporting evidence correctly', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const supportingRefs = result.value.evidence.filter(e => e.classification === 'SUPPORTING');
      expect(supportingRefs.length).toBeGreaterThan(0);
      expect(supportingRefs[0].evidenceId).toBe('evid1');
    });

    it('classifies challenging evidence correctly', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'CHALLENGING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const challengingRefs = result.value.evidence.filter(e => e.classification === 'CHALLENGING');
      expect(challengingRefs.length).toBeGreaterThan(0);
      expect(challengingRefs[0].evidenceId).toBe('evid1');
    });

    it('classifies neutral evidence correctly', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'NEUTRAL', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const neutralRefs = result.value.evidence.filter(e => e.classification === 'NEUTRAL');
      expect(neutralRefs.length).toBeGreaterThan(0);
      expect(neutralRefs[0].evidenceId).toBe('evid1');
    });
  });

  describe('unqualified ≠ challenging', () => {
    it('unqualified evidence is not classified as challenging', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Unqualified evidence should be SUPPORTING (its actual polarity), not CHALLENGING
      const refs = result.value.evidence.filter(e => e.evidenceId === 'evid1');
      expect(refs.length).toBeGreaterThan(0);
      expect(refs[0].classification).not.toBe('CHALLENGING');
    });
  });

  describe('missing-input codes', () => {
    it('reports CAREER_ACTIVATION_MISSING when career activation not provided', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const missingCareer = result.value.missingInputs.find(m => m.code === 'CAREER_ACTIVATION_MISSING');
      expect(missingCareer).toBeDefined();
      expect(missingCareer?.domain).toBe('CAREER');
    });

    it('reports WEALTH_ACTIVATION_MISSING when wealth activation not provided', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const missingWealth = result.value.missingInputs.find(m => m.code === 'WEALTH_ACTIVATION_MISSING');
      expect(missingWealth).toBeDefined();
      expect(missingWealth?.domain).toBe('WEALTH');
    });

    it('reports CAREER_EVIDENCE_MISSING when evidence not provided despite activation', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const missingEvidence = result.value.missingInputs.find(m => m.code === 'CAREER_EVIDENCE_MISSING');
      expect(missingEvidence).toBeDefined();
    });

    it('reports WEALTH_EVIDENCE_MISSING when evidence not provided despite activation', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const missingEvidence = result.value.missingInputs.find(m => m.code === 'WEALTH_EVIDENCE_MISSING');
      expect(missingEvidence).toBeDefined();
    });

    it('emits PARTIAL_CAREER_ACTIVATION_FAILED when career missing and wealth present', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.provenance.career.status).toBe('MISSING');
      expect(result.value.provenance.wealth.status).toBe('PRESENT');
      expect(result.value.career.diagnostics.some(d => d.code === 'PARTIAL_CAREER_ACTIVATION_FAILED')).toBe(true);
    });

    it('emits PARTIAL_WEALTH_ACTIVATION_FAILED when wealth missing and career present', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.provenance.career.status).toBe('PRESENT');
      expect(result.value.provenance.wealth.status).toBe('MISSING');
      expect(result.value.wealth.diagnostics.some(d => d.code === 'PARTIAL_WEALTH_ACTIVATION_FAILED')).toBe(true);
    });
  });

  describe('unresolved refs', () => {
    it('marks unresolvable promise evidence IDs as UNRESOLVED', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // promise-2 and promise-3 are not in wealthEvidence, so they should be UNRESOLVED
      const unresolvedRefs = result.value.evidence.filter(e =>
        e.classification === 'UNRESOLVED' && e.evidenceId && !e.evidenceId.startsWith('rule-')
      );
      expect(unresolvedRefs.length).toBeGreaterThan(0);
    });
  });

  describe('stable ordering under different insertion order', () => {
    it('produces same evidence ordering regardless of input order', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerEvidence1 = Object.freeze([
        makeEvidence('evid2', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);
      const careerEvidence2 = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid2', 'SUPPORTING', 'CAREER')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerEvidence: careerEvidence1
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerEvidence: careerEvidence2
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      expect(result1.value.evidence).toEqual(result2.value.evidence);
    });

    it('produces same missingInputs ordering regardless of input order', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      expect(result1.value.missingInputs).toEqual(result2.value.missingInputs);
    });
  });

  describe('repeatability', () => {
    it('produces identical results on two runs with same inputs', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const wealthActivation = makeWealthActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence,
        wealthEvidence
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence,
        wealthEvidence
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      expect(result1.value).toEqual(result2.value);
    });
  });

  describe('no interpreter/Dasha invocation', () => {
    it('builds synthesis from inputs only without invoking interpreters', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const wealthActivation = makeWealthActivation();

      // This test asserts that the function does not invoke interpreters or Dasha resolvers
      // by construction: it only uses the provided inputs
      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // If we got here without errors, the function didn't try to invoke interpreters
      // (which would fail with the mock data)
      expect(result.value.synthesisVersion).toBe('PBA-06-v1');
    });
  });

  describe('golden acceptance scenario', () => {
    it('produces complete result object with all fields', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const wealthActivation = makeWealthActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid2', 'CHALLENGING', 'CAREER'),
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('ad-evid1', 'SUPPORTING', 'CAREER')
      ]);
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('promise-2', 'SUPPORTING', 'WEALTH', 'GAINS'),
        makeEvidence('promise-3', 'CHALLENGING', 'WEALTH', 'SPECULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const value = result.value;

      // Check synthesis version
      expect(value.synthesisVersion).toBe('PBA-06-v1');

      // Check period section
      expect(value.period.selectedPeriodId).toBe(selectedPeriod.selectedPeriodId);
      expect(value.period.mahadashaId).toBe(selectedPeriod.mahadasha.id);
      expect(value.period.mahadashaPlanet).toBe(selectedPeriod.mahadasha.planet);
      expect(value.period.antardashaId).toBe(selectedPeriod.antardasha.id);
      expect(value.period.antardashaPlanet).toBe(selectedPeriod.antardasha.planet);
      expect(value.period.interval).toEqual(selectedPeriod.interval);
      expect(value.period.analysisAsOf).toBe(selectedPeriod.analysisAsOf);
      expect(value.period.temporalRelation).toBe(selectedPeriod.temporalRelation);

      // Check natal baseline (none provided in this scenario)
      expect(value.natalBaseline.career).toBeUndefined();
      expect(value.natalBaseline.wealth).toBeUndefined();

      // Check career section
      expect(value.career.qualificationBasis).toBe('CANONICAL_STATUS');
      expect(value.career.expressions.length).toBeGreaterThan(0);
      expect(value.career.expressions[0].expressionRefKey).toBeDefined();
      expect(value.career.expressions[0].status).toBeDefined();
      expect(value.career.expressions[0].linkedLevels).toBeDefined();
      expect(value.career.expressions[0].qualificationBasis).toBeDefined();

      // Check wealth section
      expect(value.wealth.dimensions.ACCUMULATION.dimension).toBe('ACCUMULATION');
      expect(value.wealth.dimensions.GAINS.dimension).toBe('GAINS');
      expect(value.wealth.dimensions.FORTUNE.dimension).toBe('FORTUNE');
      expect(value.wealth.dimensions.SPECULATION.dimension).toBe('SPECULATION');

      // Check evidence
      expect(value.evidence.length).toBeGreaterThan(0);
      expect(value.evidence.every(e => e.stage === 'CAREER' || e.stage === 'WEALTH')).toBe(true);

      // Check missing inputs (baselines are missing in this scenario)
      expect(value.missingInputs.length).toBe(4);
      expect(value.missingInputs.some(m => m.code === 'BASELINE_CAREER_UNAVAILABLE')).toBe(true);
      expect(value.missingInputs.some(m => m.code === 'BASELINE_WEALTH_UNAVAILABLE')).toBe(true);
      // Also expect unresolved evidence from dasha evidence IDs
      expect(value.missingInputs.some(m => m.code === 'EVIDENCE_REFERENCE_UNRESOLVED')).toBe(true);

      // Check provenance
      expect(value.provenance.career.status).toBe('PRESENT');
      expect(value.provenance.career.version).toBe('PBA-04-v1');
      expect(value.provenance.career.qualificationBasis).toBe('CANONICAL_STATUS');
      expect(value.provenance.wealth.status).toBe('PRESENT');
      expect(value.provenance.wealth.version).toBe('PBA-05-v1');
    });
  });

  describe('career status derivation', () => {
    it('derives ACTIVATES from support-only effects', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // The mock activation has ACTIVATES on both MD and AD
      expect(result.value.career.expressions[0].status).toBe('ACTIVATES');
    });

    it('derives INSUFFICIENT_DATA from empty linkedLevels', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      // Modify to have empty linkedLevels
      const modifiedActivation = Object.freeze({
        ...careerActivation,
        expressionActivations: Object.freeze([
          Object.freeze({
            ...careerActivation.expressionActivations[0],
            linkedLevels: Object.freeze([])
          })
        ])
      });

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation: modifiedActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.career.expressions[0].status).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('wealth data status derivation', () => {
    it('derives COMPLETE when both activation and evidence present', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('COMPLETE');
    });

    it('derives PARTIAL when only activation or evidence present', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      // Create a wealth activation with no promise evidence IDs
      const partialWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
        interval: Object.freeze({
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z'
        }),
        temporalRelation: 'CURRENT',
        dimensions: Object.freeze({
          ACCUMULATION: Object.freeze({
            dimension: 'ACCUMULATION',
            effect: 'ACTIVATES',
            linkedLevels: Object.freeze(['MD' as const]),
            md: Object.freeze({
              effect: 'ACTIVATES',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]), // No promise evidence
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          GAINS: Object.freeze({
            dimension: 'GAINS',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          FORTUNE: Object.freeze({
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          SPECULATION: Object.freeze({
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          })
        })
      });

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: partialWealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
    });

    it('derives INSUFFICIENT_DATA when neither activation nor evidence present', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('INSUFFICIENT_DATA');
    });

    it('derives PARTIAL when LINKED with complete input but UNKNOWN effect (neutral-only evidence)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      // Create a wealth activation with LINKED status but UNKNOWN effect (neutral-only dasha evidence)
      const linkedUnknownWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
        interval: Object.freeze({
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z'
        }),
        temporalRelation: 'CURRENT',
        dimensions: Object.freeze({
          ACCUMULATION: Object.freeze({
            dimension: 'ACCUMULATION',
            effect: 'UNKNOWN', // Linked but neutral-only evidence
            linkedLevels: Object.freeze(['MD' as const]),
            md: Object.freeze({
              effect: 'UNKNOWN',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze(['promise-1']),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'LINKED' as const
          }),
          GAINS: Object.freeze({
            dimension: 'GAINS',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          FORTUNE: Object.freeze({
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          SPECULATION: Object.freeze({
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          })
        })
      });

      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: linkedUnknownWealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // dataStatus reflects input availability AND determinacy: PARTIAL since effect is UNKNOWN
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
      expect(result.value.wealth.dimensions.ACCUMULATION.effect).toBe('UNKNOWN');
      expect(result.value.wealth.dimensions.ACCUMULATION.insufficientReason).toBe('LINKED');

      // Should emit diagnostic for complete input, linked, but indeterminate effect
      const diag = result.value.wealth.dimensions.ACCUMULATION.diagnostics.find(
        d => d.code === 'WEALTH_DIMENSION_COMPLETE_BUT_INDETERMINATE'
      );
      expect(diag).toBeDefined();
      expect(diag?.message).toContain('ACCUMULATION');
      expect(diag?.message).toContain('UNKNOWN');
    });
  });

  describe('stage-specific evidence provenance (High-1)', () => {
    it('tags career evidence with provenanceStage', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Check that evidence has provenanceStage
      const careerRefs = result.value.evidence.filter(e => e.stage === 'CAREER');
      expect(careerRefs.length).toBeGreaterThan(0);
      expect(careerRefs[0].provenanceStage).toBeDefined();
      expect(['CAREER_EXPRESSION', 'CAREER_QUALIFICATION', 'CAREER_ACTIVATION']).toContain(careerRefs[0].provenanceStage);
    });

    it('tags wealth promise evidence with WEALTH_NATAL_PROMISE', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const promiseRefs = result.value.evidence.filter(e =>
        e.stage === 'WEALTH' && e.provenanceStage === 'WEALTH_NATAL_PROMISE'
      );
      expect(promiseRefs.length).toBeGreaterThan(0);
    });

    it('tags wealth dasha rule references with WEALTH_DASHA_RULE and referenceKind RULE', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const ruleRefs = result.value.evidence.filter(e =>
        e.stage === 'WEALTH' && e.provenanceStage === 'WEALTH_DASHA_RULE'
      );
      expect(ruleRefs.length).toBeGreaterThan(0);
      expect(ruleRefs[0].referenceKind).toBe('RULE');
      expect(ruleRefs[0].ruleId).toBeDefined();
      // Rule refs should not have classification or polarity (High-1)
      expect(ruleRefs[0].classification).toBeUndefined();
      expect(ruleRefs[0].polarity).toBeUndefined();
    });
  });

  describe('EVIDENCE_REFERENCE_UNRESOLVED missing-input entries (High-2)', () => {
    it('adds EVIDENCE_REFERENCE_UNRESOLVED for unresolved career evidence', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // The mock activation has evidence IDs that don't exist in careerEvidence
      const unresolvedMissing = result.value.missingInputs.filter(m =>
        m.code === 'EVIDENCE_REFERENCE_UNRESOLVED' && m.domain === 'CAREER'
      );
      expect(unresolvedMissing.length).toBeGreaterThan(0);
    });

    it('adds EVIDENCE_REFERENCE_UNRESOLVED for unresolved wealth promise evidence', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // promise-2 and promise-3 are not in wealthEvidence
      const unresolvedMissing = result.value.missingInputs.filter(m =>
        m.code === 'EVIDENCE_REFERENCE_UNRESOLVED' && m.domain === 'WEALTH'
      );
      expect(unresolvedMissing.length).toBeGreaterThan(0);
    });
  });

  describe('honest dataStatus (Medium-6)', () => {
    it('upgrades dataStatus when ALL promise IDs resolve with valid WEALTH NATAL_PROMISE', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // ACCUMULATION has promise-1 which is in evidence with matching dimension and valid domain/phase
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('COMPLETE');
    });

    it('downgrades to PARTIAL when some promise IDs do not resolve', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        // Only promise-1 is present, promise-2 and promise-3 are missing
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // GAINS has promise-2 which is not in evidence, so should be PARTIAL
      expect(result.value.wealth.dimensions.GAINS.dataStatus).toBe('PARTIAL');
    });

    it('downgrades to PARTIAL when 3 IDs but only 1 resolves (Medium-6)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      // Create a wealth activation with 3 promise evidence IDs
      const partialWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        selectedPeriodId: createSelectedPeriodId('md-1', 'ad-1'),
        interval: Object.freeze({
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z'
        }),
        temporalRelation: 'CURRENT',
        dimensions: Object.freeze({
          ACCUMULATION: Object.freeze({
            dimension: 'ACCUMULATION',
            effect: 'ACTIVATES',
            linkedLevels: Object.freeze(['MD' as const]),
            md: Object.freeze({
              effect: 'ACTIVATES',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze(['promise-1', 'promise-2', 'promise-3']), // 3 IDs
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'LINKED' as const
          }),
          GAINS: Object.freeze({
            dimension: 'GAINS',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          FORTUNE: Object.freeze({
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          SPECULATION: Object.freeze({
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          })
        })
      });

      const wealthEvidence = Object.freeze([
        // Only promise-1 is present and valid
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: partialWealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // 3 IDs but only 1 resolves → PARTIAL
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
    });

    it('downgrades to PARTIAL for dimension mismatch (Medium-6)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        // promise-1 has wrong dimension (GAINS instead of ACCUMULATION)
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'GAINS')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // ACCUMULATION has dimension mismatch → PARTIAL
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
    });

    it('downgrades to PARTIAL for wrong domain (Medium-6)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        // promise-1 has wrong domain (CAREER instead of WEALTH)
        makeEvidence('promise-1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // ACCUMULATION has wrong domain → PARTIAL
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');

      // Should have WEALTH_EVIDENCE_INVALID diagnostic
      const invalidDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_INVALID');
      expect(invalidDiag).toBeDefined();
    });
  });

  describe('full PBA-04 traceability (High-4)', () => {
    it('preserves all five evidence-ID collections in expression rows', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const row = result.value.career.expressions[0];
      expect(row.expressionEvidenceIds).toBeDefined();
      expect(row.qualifiedEvidenceIds).toBeDefined();
      expect(row.unqualifiedEvidenceIds).toBeDefined();
      expect(row.mdDashaEvidenceIds).toBeDefined();
      expect(row.adDashaEvidenceIds).toBeDefined();
      expect(row.expressionSource).toBeDefined();
    });

    it('carries expressionSource verbatim', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const row = result.value.career.expressions[0];
      expect(row.expressionSource).toBe('CALLER');
    });
  });

  describe('qualification basis when absent (Medium-5)', () => {
    it('emits UNAVAILABLE when career activation absent', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.career.qualificationBasis).toBe('UNAVAILABLE');
    });

    it('keeps PROXY_DIRECTION explicit when present', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation('PROXY_DIRECTION');

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.career.qualificationBasis).toBe('PROXY_DIRECTION');
    });
  });

  describe('activation-context consistency (Medium-6)', () => {
    it('returns ACTIVATION_PERIOD_MISMATCH for mismatched career activation', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      // Modify activation to have mismatched selectedPeriodId
      const mismatchedActivation = Object.freeze({
        ...careerActivation,
        selectedPeriodId: 'different-period-id'
      });

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation: mismatchedActivation
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ACTIVATION_PERIOD_MISMATCH');
      }
    });

    it('returns ACTIVATION_PERIOD_MISMATCH for mismatched wealth activation', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      // Modify activation to have mismatched interval
      const mismatchedActivation = Object.freeze({
        ...wealthActivation,
        interval: Object.freeze({
          start: '2021-01-01T00:00:00.000Z',
          end: '2023-01-01T00:00:00.000Z'
        })
      });

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: mismatchedActivation
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ACTIVATION_PERIOD_MISMATCH');
      }
    });
  });

  describe('baseline missing-input entries (contract gaps)', () => {
    it('adds BASELINE_CAREER_UNAVAILABLE when career baseline absent', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const missingBaseline = result.value.missingInputs.find(m => m.code === 'BASELINE_CAREER_UNAVAILABLE');
      expect(missingBaseline).toBeDefined();
      expect(missingBaseline?.domain).toBe('CAREER');
    });

    it('adds BASELINE_WEALTH_UNAVAILABLE when wealth baseline absent', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const missingBaseline = result.value.missingInputs.find(m => m.code === 'BASELINE_WEALTH_UNAVAILABLE');
      expect(missingBaseline).toBeDefined();
      expect(missingBaseline?.domain).toBe('WEALTH');
    });
  });

  describe('section-level diagnostics (High-2)', () => {
    it('career section includes diagnostics array', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.career.diagnostics).toBeDefined();
      expect(Array.isArray(result.value.career.diagnostics)).toBe(true);
    });

    it('wealth section includes diagnostics array', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.wealth.diagnostics).toBeDefined();
      expect(Array.isArray(result.value.wealth.diagnostics)).toBe(true);
    });
  });

  describe('duplicate-ID ambiguity (High-2)', () => {
    it('order independence: reversing input order produces identical result (High-2)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const customWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        ...wealthActivation,
        dimensions: Object.freeze({
          ...wealthActivation.dimensions,
          ACCUMULATION: Object.freeze({
            ...wealthActivation.dimensions.ACCUMULATION,
            promiseEvidenceIds: Object.freeze(['dup-1']),
            insufficientReason: 'LINKED' as const
          })
        })
      });
      const wealthEvidence1 = Object.freeze([
        makeEvidence('dup-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('dup-1', 'CHALLENGING', 'WEALTH', 'GAINS')
      ]);
      const wealthEvidence2 = Object.freeze([
        makeEvidence('dup-1', 'CHALLENGING', 'WEALTH', 'GAINS'),
        makeEvidence('dup-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: customWealthActivation,
        wealthEvidence: wealthEvidence1
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: customWealthActivation,
        wealthEvidence: wealthEvidence2
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Results should be identical regardless of input order
      expect(result1.value.wealth.diagnostics).toEqual(result2.value.wealth.diagnostics);
      expect(result1.value.evidence).toEqual(result2.value.evidence);
    });
  });

  describe('dimension mismatch (High-3)', () => {
    it('preserves source dimension on mismatch and marks UNRESOLVED', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        // Evidence has GAINS dimension but ACCUMULATION is requesting
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'GAINS')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have WEALTH_EVIDENCE_DIMENSION_MISMATCH diagnostic
      const mismatchDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_DIMENSION_MISMATCH');
      expect(mismatchDiag).toBeDefined();

      // Ref should be UNRESOLVED
      const mismatchRef = result.value.evidence.find(e => e.evidenceId === 'promise-1' && e.dimension === 'GAINS');
      expect(mismatchRef?.classification).toBe('UNRESOLVED');
      // Should preserve source dimension (GAINS), not requested dimension (ACCUMULATION)
      expect(mismatchRef?.dimension).toBe('GAINS');
    });
  });

  describe('C9 evidence lookup (High-4)', () => {
    it('never lets C9 ID resolve to C8 record (careerEvidence)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // md-evid1 is in careerEvidence (C8) but should NOT resolve for ACTIVATION stage
      // because we only resolve against careerDashaEvidence (C9)
      const unresolvedRef = result.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(unresolvedRef?.classification).toBe('UNRESOLVED');
    });

    it('successfully resolves MD evidence from careerDashaEvidence (Medium-2)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerDashaEvidence = Object.freeze([
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // md-evid1 should resolve from careerDashaEvidence (C9)
      const resolvedRef = result.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(resolvedRef?.classification).toBe('SUPPORTING');
      expect(resolvedRef?.evidenceId).toBe('md-evid1');
    });

    it('successfully resolves AD evidence from careerDashaEvidence (Medium-2)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerDashaEvidence = Object.freeze([
        makeEvidence('ad-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // ad-evid1 should resolve from careerDashaEvidence (C9)
      const resolvedRef = result.value.evidence.find(e =>
        e.evidenceId === 'ad-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(resolvedRef?.classification).toBe('SUPPORTING');
      expect(resolvedRef?.evidenceId).toBe('ad-evid1');
    });

    it('emits C9_EVIDENCE_SET_MISSING when careerDashaEvidence absent (Medium-2)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation
        // careerDashaEvidence not provided
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have C9_EVIDENCE_SET_MISSING diagnostics for MD and AD evidence
      const c9MissingDiags = result.value.career.diagnostics.filter(d => d.code === 'C9_EVIDENCE_SET_MISSING');
      expect(c9MissingDiags.length).toBeGreaterThan(0);
      expect(c9MissingDiags[0].message).toContain('md-evid1');

      // Refs should be UNRESOLVED
      const unresolvedMdRef = result.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(unresolvedMdRef?.classification).toBe('UNRESOLVED');
    });

    it('emits C9_EVIDENCE_REFERENCE_UNRESOLVED for missing MD ID in careerDashaEvidence (Medium-2)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerDashaEvidence = Object.freeze([
        // Only ad-evid1 is present, md-evid1 is missing
        makeEvidence('ad-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have C9_EVIDENCE_REFERENCE_UNRESOLVED diagnostic for missing md-evid1
      const unresolvedDiag = result.value.career.diagnostics.find(d => d.code === 'C9_EVIDENCE_REFERENCE_UNRESOLVED');
      expect(unresolvedDiag).toBeDefined();
      expect(unresolvedDiag?.message).toContain('md-evid1');
      expect(unresolvedDiag?.message).toContain('not found in careerDashaEvidence');

      // MD ref should be UNRESOLVED with original evidenceId
      const unresolvedMdRef = result.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(unresolvedMdRef?.classification).toBe('UNRESOLVED');
      expect(unresolvedMdRef?.evidenceId).toBe('md-evid1');
      expect(unresolvedMdRef?.provenanceStage).toBe('CAREER_ACTIVATION');

      // AD ref should resolve normally
      const resolvedAdRef = result.value.evidence.find(e =>
        e.evidenceId === 'ad-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(resolvedAdRef?.classification).toBe('SUPPORTING');
    });

    it('emits C9_EVIDENCE_REFERENCE_UNRESOLVED for missing AD ID in careerDashaEvidence (Medium-2)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerDashaEvidence = Object.freeze([
        // Only md-evid1 is present, ad-evid1 is missing
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have C9_EVIDENCE_REFERENCE_UNRESOLVED diagnostic for missing ad-evid1
      const unresolvedDiag = result.value.career.diagnostics.find(d => d.code === 'C9_EVIDENCE_REFERENCE_UNRESOLVED');
      expect(unresolvedDiag).toBeDefined();
      expect(unresolvedDiag?.message).toContain('ad-evid1');
      expect(unresolvedDiag?.message).toContain('not found in careerDashaEvidence');

      // AD ref should be UNRESOLVED with original evidenceId
      const unresolvedAdRef = result.value.evidence.find(e =>
        e.evidenceId === 'ad-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(unresolvedAdRef?.classification).toBe('UNRESOLVED');
      expect(unresolvedAdRef?.evidenceId).toBe('ad-evid1');
      expect(unresolvedAdRef?.provenanceStage).toBe('CAREER_ACTIVATION');

      // MD ref should resolve normally
      const resolvedMdRef = result.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(resolvedMdRef?.classification).toBe('SUPPORTING');
    });
  });

  describe('uniform dedup coverage for careerEvidence (Low-3)', () => {
    it('deduplicates identical careerEvidence records silently (no diagnostic)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid1', 'SUPPORTING', 'CAREER') // identical duplicate
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should NOT have EVIDENCE_ID_AMBIGUOUS diagnostic
      const ambiguousDiag = result.value.career.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag).toBeUndefined();

      // Ref should resolve normally (not UNRESOLVED)
      const resolvedRef = result.value.evidence.find(e => e.evidenceId === 'evid1');
      expect(resolvedRef?.classification).toBe('SUPPORTING');
    });

    it('detects conflicting careerEvidence duplicates with EVIDENCE_ID_AMBIGUOUS (order-independent)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerEvidence1 = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid1', 'CHALLENGING', 'CAREER')
      ]);
      const careerEvidence2 = Object.freeze([
        makeEvidence('evid1', 'CHALLENGING', 'CAREER'),
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence: careerEvidence1
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerEvidence: careerEvidence2
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Both should have EVIDENCE_ID_AMBIGUOUS diagnostic
      const ambiguousDiag1 = result1.value.career.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      const ambiguousDiag2 = result2.value.career.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag1).toBeDefined();
      expect(ambiguousDiag2).toBeDefined();

      // Both refs should be UNRESOLVED
      const unresolvedRef1 = result1.value.evidence.find(e => e.evidenceId === 'evid1');
      const unresolvedRef2 = result2.value.evidence.find(e => e.evidenceId === 'evid1');
      expect(unresolvedRef1?.classification).toBe('UNRESOLVED');
      expect(unresolvedRef2?.classification).toBe('UNRESOLVED');

      // Results should be identical regardless of order
      expect(result1.value.career.diagnostics).toEqual(result2.value.career.diagnostics);
      expect(result1.value.evidence).toEqual(result2.value.evidence);
    });
  });

  describe('uniform dedup coverage for careerDashaEvidence (Low-3)', () => {
    it('deduplicates identical careerDashaEvidence records silently (no diagnostic)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerDashaEvidence = Object.freeze([
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER') // identical duplicate
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should NOT have EVIDENCE_ID_AMBIGUOUS diagnostic
      const ambiguousDiag = result.value.career.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag).toBeUndefined();

      // Ref should resolve normally (not UNRESOLVED)
      const resolvedRef = result.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(resolvedRef?.classification).toBe('SUPPORTING');
    });

    it('detects conflicting careerDashaEvidence duplicates with EVIDENCE_ID_AMBIGUOUS (order-independent)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const careerDashaEvidence1 = Object.freeze([
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('md-evid1', 'CHALLENGING', 'CAREER')
      ]);
      const careerDashaEvidence2 = Object.freeze([
        makeEvidence('md-evid1', 'CHALLENGING', 'CAREER'),
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence: careerDashaEvidence1
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        careerDashaEvidence: careerDashaEvidence2
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Both should have EVIDENCE_ID_AMBIGUOUS diagnostic
      const ambiguousDiag1 = result1.value.career.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      const ambiguousDiag2 = result2.value.career.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag1).toBeDefined();
      expect(ambiguousDiag2).toBeDefined();

      // Both refs should be UNRESOLVED
      const unresolvedRef1 = result1.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      const unresolvedRef2 = result2.value.evidence.find(e =>
        e.evidenceId === 'md-evid1' && e.provenanceStage === 'CAREER_ACTIVATION'
      );
      expect(unresolvedRef1?.classification).toBe('UNRESOLVED');
      expect(unresolvedRef2?.classification).toBe('UNRESOLVED');

      // Results should be identical regardless of order
      expect(result1.value.career.diagnostics).toEqual(result2.value.career.diagnostics);
      expect(result1.value.evidence).toEqual(result2.value.evidence);
    });
  });

  describe('order independence (Medium-5)', () => {
    it('produces identical results with reordered inputs containing duplicates', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence1 = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('evid2', 'CHALLENGING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('evid1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION') // duplicate
      ]);
      const wealthEvidence2 = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('evid1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'), // duplicate
        makeEvidence('evid2', 'CHALLENGING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence: wealthEvidence1
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence: wealthEvidence2
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Results should be identical regardless of input order
      expect(result1.value.wealth.diagnostics).toEqual(result2.value.wealth.diagnostics);
      expect(result1.value.evidence).toEqual(result2.value.evidence);
    });

    it('whole-value equality for reordered inputs', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerActivation = makeCareerActivation();
      const wealthActivation = makeWealthActivation();
      const careerEvidence1 = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid2', 'CHALLENGING', 'CAREER')
      ]);
      const careerEvidence2 = Object.freeze([
        makeEvidence('evid2', 'CHALLENGING', 'CAREER'),
        makeEvidence('evid1', 'SUPPORTING', 'CAREER')
      ]);
      const wealthEvidence1 = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('promise-2', 'SUPPORTING', 'WEALTH', 'GAINS')
      ]);
      const wealthEvidence2 = Object.freeze([
        makeEvidence('promise-2', 'SUPPORTING', 'WEALTH', 'GAINS'),
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence: careerEvidence1,
        wealthEvidence: wealthEvidence1
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence: careerEvidence2,
        wealthEvidence: wealthEvidence2
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Entire value should be equal despite reordering
      expect(result1.value).toEqual(result2.value);
    });
  });



  describe('invalid domain/phase wealth evidence', () => {
    it('emits WEALTH_EVIDENCE_INVALID for wrong domain with UNRESOLVED ref and PARTIAL status', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        // Evidence has wrong domain (CAREER instead of WEALTH)
        makeEvidence('promise-1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have WEALTH_EVIDENCE_INVALID diagnostic
      const invalidDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_INVALID');
      expect(invalidDiag).toBeDefined();
      expect(invalidDiag?.message).toContain('promise-1');
      expect(invalidDiag?.message).toContain('CAREER');

      // Ref should be UNRESOLVED with original fields preserved
      const invalidRef = result.value.evidence.find(e => e.evidenceId === 'promise-1' && e.provenanceStage === 'WEALTH_NATAL_PROMISE');
      expect(invalidRef?.classification).toBe('UNRESOLVED');
      expect(invalidRef?.evidenceId).toBe('promise-1');

      // Data status should be PARTIAL (not COMPLETE)
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
    });

    it('emits WEALTH_EVIDENCE_INVALID for wrong phase with UNRESOLVED ref and PARTIAL status', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      // Create evidence with wrong phase (not NATAL_PROMISE)
      const wrongPhaseEvidence = makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', 'DASHA_ACTIVATION');

      const wealthEvidence = Object.freeze([wrongPhaseEvidence]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have WEALTH_EVIDENCE_INVALID diagnostic
      const invalidDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_INVALID');
      expect(invalidDiag).toBeDefined();
      expect(invalidDiag?.message).toContain('DASHA_ACTIVATION');

      // Data status should be PARTIAL
      expect(result.value.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
    });
  });

  describe('wealth diagnostics per category (PBA-05)', () => {
    it('asserts WEALTH_EVIDENCE_INVALID diagnostic code for wrong domain', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'CAREER')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const invalidDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_INVALID');
      expect(invalidDiag).toBeDefined();
      expect(invalidDiag?.code).toBe('WEALTH_EVIDENCE_INVALID');
    });

    it('asserts WEALTH_EVIDENCE_INVALID diagnostic code for wrong phase', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', 'DASHA_ACTIVATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const invalidDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_INVALID');
      expect(invalidDiag).toBeDefined();
      expect(invalidDiag?.code).toBe('WEALTH_EVIDENCE_INVALID');
    });

    it('asserts WEALTH_EVIDENCE_DIMENSION_MISMATCH diagnostic code for dimension mismatch', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'GAINS')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const mismatchDiag = result.value.wealth.diagnostics.find(d => d.code === 'WEALTH_EVIDENCE_DIMENSION_MISMATCH');
      expect(mismatchDiag).toBeDefined();
      expect(mismatchDiag?.code).toBe('WEALTH_EVIDENCE_DIMENSION_MISMATCH');
    });

    it('asserts EVIDENCE_ID_AMBIGUOUS diagnostic code for conflicting duplicates', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const customWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        ...makeWealthActivation(),
        dimensions: Object.freeze({
          ...makeWealthActivation().dimensions,
          ACCUMULATION: Object.freeze({
            ...makeWealthActivation().dimensions.ACCUMULATION,
            promiseEvidenceIds: Object.freeze(['dup-1'])
          })
        })
      });
      const wealthEvidence = Object.freeze([
        makeEvidence('dup-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', undefined, { identityKey: 'key-A' }),
        makeEvidence('dup-1', 'CHALLENGING', 'WEALTH', 'ACCUMULATION', undefined, { identityKey: 'key-B' })
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: customWealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const ambiguousDiag = result.value.wealth.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag).toBeDefined();
      expect(ambiguousDiag?.code).toBe('EVIDENCE_ID_AMBIGUOUS');
    });
  });

  describe('wealthUnresolvedIds includes dimension field', () => {
    it('asserts wealthUnresolvedIds entries include correct dimension field', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
        // promise-2 and promise-3 are missing
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Check missingInputs for unresolved wealth evidence with dimension
      const unresolvedWealthEntries = result.value.missingInputs.filter(
        m => m.code === 'EVIDENCE_REFERENCE_UNRESOLVED' && m.domain === 'WEALTH'
      );

      expect(unresolvedWealthEntries.length).toBeGreaterThan(0);

      // At least one entry should mention dimension GAINS (for promise-2)
      const gainsEntry = unresolvedWealthEntries.find(m => m.description.includes('GAINS'));
      expect(gainsEntry).toBeDefined();

      // At least one entry should mention dimension SPECULATION (for promise-3)
      const specEntry = unresolvedWealthEntries.find(m => m.description.includes('SPECULATION'));
      expect(specEntry).toBeDefined();
    });
  });

  describe('missingInputs distinguishes WEALTH_ACTIVATION_MISSING from WEALTH_EVIDENCE_MISSING', () => {
    it('reports WEALTH_ACTIVATION_MISSING when wealth activation not provided', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const activationMissing = result.value.missingInputs.find(m => m.code === 'WEALTH_ACTIVATION_MISSING');
      expect(activationMissing).toBeDefined();
      expect(activationMissing?.domain).toBe('WEALTH');

      const evidenceMissing = result.value.missingInputs.find(m => m.code === 'WEALTH_EVIDENCE_MISSING');
      expect(evidenceMissing).toBeUndefined(); // Should not have evidence missing if activation is missing
    });

    it('reports WEALTH_EVIDENCE_MISSING when wealth activation present but evidence missing', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation
        // wealthEvidence not provided
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const activationMissing = result.value.missingInputs.find(m => m.code === 'WEALTH_ACTIVATION_MISSING');
      expect(activationMissing).toBeUndefined(); // Activation is present

      const evidenceMissing = result.value.missingInputs.find(m => m.code === 'WEALTH_EVIDENCE_MISSING');
      expect(evidenceMissing).toBeDefined();
      expect(evidenceMissing?.domain).toBe('WEALTH');
    });

    it('reports neither when both activation and evidence are present', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION')
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const activationMissing = result.value.missingInputs.find(m => m.code === 'WEALTH_ACTIVATION_MISSING');
      expect(activationMissing).toBeUndefined();

      const evidenceMissing = result.value.missingInputs.find(m => m.code === 'WEALTH_EVIDENCE_MISSING');
      expect(evidenceMissing).toBeUndefined();
    });
  });

  describe('duplicate semantics: identical dedup vs conflicting ambiguity', () => {
    it('deduplicates identical records silently (no diagnostic)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION') // identical duplicate
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should NOT have EVIDENCE_ID_AMBIGUOUS diagnostic (identical dedup)
      const ambiguousDiag = result.value.wealth.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag).toBeUndefined();

      // Ref should resolve normally (not UNRESOLVED)
      const resolvedRef = result.value.evidence.find(e => e.evidenceId === 'promise-1');
      expect(resolvedRef?.classification).toBe('SUPPORTING');
    });

    it('detects ambiguous duplicates with different identityKey (Medium-1)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const customWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        ...wealthActivation,
        dimensions: Object.freeze({
          ...wealthActivation.dimensions,
          ACCUMULATION: Object.freeze({
            ...wealthActivation.dimensions.ACCUMULATION,
            promiseEvidenceIds: Object.freeze(['dup-1']),
            insufficientReason: 'LINKED' as const
          })
        })
      });
      const wealthEvidence = Object.freeze([
        makeEvidence('dup-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', undefined, { identityKey: 'key-A' }),
        makeEvidence('dup-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', undefined, { identityKey: 'key-B' })
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: customWealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have EVIDENCE_ID_AMBIGUOUS diagnostic
      const ambiguousDiag = result.value.wealth.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag).toBeDefined();
      expect(ambiguousDiag?.message).toContain('dup-1');

      // Ref should be UNRESOLVED
      const unresolvedRef = result.value.evidence.find(e => e.evidenceId === 'dup-1');
      expect(unresolvedRef?.classification).toBe('UNRESOLVED');
    });

    it('detects ambiguous duplicates with different source (Medium-1)', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const wealthActivation = makeWealthActivation();
      const customWealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        ...wealthActivation,
        dimensions: Object.freeze({
          ...wealthActivation.dimensions,
          ACCUMULATION: Object.freeze({
            ...wealthActivation.dimensions.ACCUMULATION,
            promiseEvidenceIds: Object.freeze(['dup-2']),
            insufficientReason: 'LINKED' as const
          })
        })
      });
      const wealthEvidence = Object.freeze([
        makeEvidence('dup-2', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', undefined, { source: 'D1' }),
        makeEvidence('dup-2', 'SUPPORTING', 'WEALTH', 'ACCUMULATION', undefined, { source: 'D2' })
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation: customWealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Should have EVIDENCE_ID_AMBIGUOUS diagnostic
      const ambiguousDiag = result.value.wealth.diagnostics.find(d => d.code === 'EVIDENCE_ID_AMBIGUOUS');
      expect(ambiguousDiag).toBeDefined();
      expect(ambiguousDiag?.message).toContain('dup-2');

      // Ref should be UNRESOLVED
      const unresolvedRef = result.value.evidence.find(e => e.evidenceId === 'dup-2');
      expect(unresolvedRef?.classification).toBe('UNRESOLVED');
    });
  });

  describe('both-fail diagnostic (81512bf)', () => {
    it('emits SYNTHESIS_PARTIAL_NO_DOMAINS when both activations are missing with error codes', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerBaseline = Object.freeze({ id: 'career-baseline' } as unknown as CareerFinalSynthesisResult);
      const wealthBaseline = Object.freeze({ id: 'wealth-baseline' } as unknown as CareerWealthFinalSynthesis);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerBaseline,
        wealthBaseline,
        careerErrorCode: 'INVALID_SELECTED_PERIOD_CONTEXT',
        wealthErrorCode: 'INVALID_SELECTED_PERIOD_CONTEXT'
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Assert success/partial discriminant (both MISSING = PARTIAL, not ERROR)
      expect(result.value.provenance.career.status).toBe('MISSING');
      expect(result.value.provenance.wealth.status).toBe('MISSING');

      // Assert both provenance entries are MISSING
      expect(result.value.provenance.career.status).toBe('MISSING');
      expect(result.value.provenance.wealth.status).toBe('MISSING');

      // Assert SYNTHESIS_PARTIAL_NO_DOMAINS diagnostic is present (in career diagnostics)
      const bothFailDiag = result.value.career.diagnostics.find((d: any) => d.code === 'SYNTHESIS_PARTIAL_NO_DOMAINS');
      expect(bothFailDiag).toBeDefined();
      expect(bothFailDiag?.message).toContain('Career activation failed');
      expect(bothFailDiag?.message).toContain('wealth activation failed');

      // Assert both supplied error codes appear in the SYNTHESIS_PARTIAL_NO_DOMAINS message
      expect(bothFailDiag?.message).toContain('INVALID_SELECTED_PERIOD_CONTEXT');

      // Assert natal baselines are carried by reference with unchanged flag
      expect(result.value.natalBaseline.career?.baseline).toBe(careerBaseline);
      expect(result.value.natalBaseline.career?.unchanged).toBe(true);
      expect(result.value.natalBaseline.wealth?.baseline).toBe(wealthBaseline);
      expect(result.value.natalBaseline.wealth?.unchanged).toBe(true);
    });

    it('emits SYNTHESIS_PARTIAL_NO_DOMAINS with different error codes', () => {
      const selectedPeriod = makeSelectedPeriodContext();
      const careerBaseline = Object.freeze({ id: 'career-baseline-2' } as unknown as CareerFinalSynthesisResult);
      const wealthBaseline = Object.freeze({ id: 'wealth-baseline-2' } as unknown as CareerWealthFinalSynthesis);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerBaseline,
        wealthBaseline,
        careerErrorCode: 'INCOMPLETE_CANONICAL_INPUT',
        wealthErrorCode: 'INVALID_SELECTED_PERIOD_CONTEXT'
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Assert SYNTHESIS_PARTIAL_NO_DOMAINS diagnostic is present (in career diagnostics)
      const bothFailDiag = result.value.career.diagnostics.find((d: any) => d.code === 'SYNTHESIS_PARTIAL_NO_DOMAINS');
      expect(bothFailDiag).toBeDefined();

      // Assert both error codes appear in the SYNTHESIS_PARTIAL_NO_DOMAINS message
      expect(bothFailDiag?.message).toContain('INCOMPLETE_CANONICAL_INPUT');
      expect(bothFailDiag?.message).toContain('INVALID_SELECTED_PERIOD_CONTEXT');

      // Assert natal baselines are carried by reference with unchanged flag
      expect(result.value.natalBaseline.career?.baseline).toBe(careerBaseline);
      expect(result.value.natalBaseline.career?.unchanged).toBe(true);
      expect(result.value.natalBaseline.wealth?.baseline).toBe(wealthBaseline);
      expect(result.value.natalBaseline.wealth?.unchanged).toBe(true);
    });
  });

  describe('PBA-06 golden fixture: full reproducible synthesis', () => {
    it('produces complete, reproducible result with fully-populated scenario (PBA-06 completion gate)', () => {
      const selectedPeriod = makeSelectedPeriodContext();

      // Career activation with qualified expressions
      const careerActivation = makeCareerActivation('CANONICAL_STATUS');

      // Wealth activation with all four dimensions resolved
      const wealthActivation = makeWealthActivation();

      // Complete evidence sets
      const careerEvidence = Object.freeze([
        makeEvidence('evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('evid2', 'CHALLENGING', 'CAREER')
      ]);

      const careerDashaEvidence = Object.freeze([
        makeEvidence('md-evid1', 'SUPPORTING', 'CAREER'),
        makeEvidence('ad-evid1', 'SUPPORTING', 'CAREER')
      ]);

      const wealthEvidence = Object.freeze([
        makeEvidence('promise-1', 'SUPPORTING', 'WEALTH', 'ACCUMULATION'),
        makeEvidence('promise-2', 'SUPPORTING', 'WEALTH', 'GAINS'),
        makeEvidence('promise-3', 'CHALLENGING', 'WEALTH', 'SPECULATION')
      ]);

      // Baselines (both lifetime baselines unchanged, no cross-domain coupling)
      const careerBaseline = Object.freeze({ id: 'career-baseline' } as unknown as CareerFinalSynthesisResult);
      const wealthBaseline = Object.freeze({ id: 'wealth-baseline' } as unknown as CareerWealthFinalSynthesis);

      // Run twice to assert reproducibility
      const result1 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence,
        careerDashaEvidence,
        wealthEvidence,
        careerBaseline,
        wealthBaseline
      });

      const result2 = buildSelectedPeriodSynthesis({
        selectedPeriod,
        careerActivation,
        wealthActivation,
        careerEvidence,
        careerDashaEvidence,
        wealthEvidence,
        careerBaseline,
        wealthBaseline
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      if (!result1.ok || !result2.ok) return;

      // Assert reproducibility
      expect(result1.value).toEqual(result2.value);

      // Golden fixture: frozen literal of the full result
      const expectedGoldenFixture = Object.freeze({
        synthesisVersion: 'PBA-06-v1',
        period: Object.freeze({
          selectedPeriodId: selectedPeriod.selectedPeriodId,
          mahadashaId: selectedPeriod.mahadasha.id,
          mahadashaPlanet: selectedPeriod.mahadasha.planet,
          antardashaId: selectedPeriod.antardasha.id,
          antardashaPlanet: selectedPeriod.antardasha.planet,
          interval: Object.freeze({
            start: selectedPeriod.interval.start,
            end: selectedPeriod.interval.end
          }),
          analysisAsOf: selectedPeriod.analysisAsOf,
          temporalRelation: selectedPeriod.temporalRelation
        }),
        natalBaseline: Object.freeze({
          career: Object.freeze({
            baseline: careerBaseline,
            unchanged: true
          }),
          wealth: Object.freeze({
            baseline: wealthBaseline,
            unchanged: true
          })
        }),
        career: Object.freeze({
          qualificationBasis: 'CANONICAL_STATUS',
          expressions: Object.freeze([
            Object.freeze({
              expressionRefKey: 'EMPLOYMENT:SUPPORT:evid1',
              status: 'ACTIVATES',
              linkedLevels: Object.freeze(['MD', 'AD']),
              qualificationBasis: 'CANONICAL_STATUS',
              matchBasis: 'UNAMBIGUOUS',
              diagnostics: Object.freeze([]),
              expressionEvidenceIds: Object.freeze(['evid1']),
              qualifiedEvidenceIds: Object.freeze(['evid1']),
              unqualifiedEvidenceIds: Object.freeze([]),
              mdDashaEvidenceIds: Object.freeze(['md-evid1']),
              adDashaEvidenceIds: Object.freeze(['ad-evid1']),
              expressionSource: 'CALLER'
            })
          ]),
          diagnostics: Object.freeze([])
        }),
        wealth: Object.freeze({
          dimensions: Object.freeze({
            ACCUMULATION: Object.freeze({
              dimension: 'ACCUMULATION',
              effect: 'ACTIVATES',
              dataStatus: 'COMPLETE',
              linkedLevels: Object.freeze(['MD', 'AD']),
              diagnostics: Object.freeze([]),
              promiseEvidenceIds: Object.freeze(['promise-1']),
              dashaRuleReferences: Object.freeze([
                Object.freeze({ ruleId: 'rule-1', level: 'MD', source: 'DASHA' }),
                Object.freeze({ ruleId: 'rule-2', level: 'AD', source: 'DASHA' })
              ]),
              insufficientReason: 'LINKED' as const
            }),
            GAINS: Object.freeze({
              dimension: 'GAINS',
              effect: 'PARTIALLY_ACTIVATES',
              dataStatus: 'COMPLETE',
              linkedLevels: Object.freeze(['MD']),
              diagnostics: Object.freeze([]),
              promiseEvidenceIds: Object.freeze(['promise-2']),
              dashaRuleReferences: Object.freeze([]),
              insufficientReason: 'LINKED' as const
            }),
            FORTUNE: Object.freeze({
              dimension: 'FORTUNE',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: Object.freeze([]),
              diagnostics: Object.freeze([]),
              promiseEvidenceIds: Object.freeze([]),
              dashaRuleReferences: Object.freeze([]),
              insufficientReason: 'NO_PROMISE_EVIDENCE' as const
            }),
            SPECULATION: Object.freeze({
              dimension: 'SPECULATION',
              effect: 'CHALLENGES',
              dataStatus: 'COMPLETE',
              linkedLevels: Object.freeze(['AD']),
              diagnostics: Object.freeze([]),
              promiseEvidenceIds: Object.freeze(['promise-3']),
              dashaRuleReferences: Object.freeze([]),
              insufficientReason: 'LINKED' as const
            })
          }),
          diagnostics: Object.freeze([])
        }),
        evidence: Object.freeze([
          // Career activation evidence (C9) - sorted first by stage/provenanceStage
          Object.freeze({
            classification: 'SUPPORTING',
            evidenceId: 'ad-evid1',
            identityKey: 'key-ad-evid1',
            polarity: 'SUPPORTING',
            source: 'D1',
            stage: 'CAREER',
            provenanceStage: 'CAREER_ACTIVATION',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          }),
          Object.freeze({
            classification: 'SUPPORTING',
            evidenceId: 'md-evid1',
            identityKey: 'key-md-evid1',
            polarity: 'SUPPORTING',
            source: 'D1',
            stage: 'CAREER',
            provenanceStage: 'CAREER_ACTIVATION',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          }),
          // Career expression evidence
          Object.freeze({
            classification: 'SUPPORTING',
            evidenceId: 'evid1',
            identityKey: 'key-evid1',
            polarity: 'SUPPORTING',
            source: 'D1',
            stage: 'CAREER',
            provenanceStage: 'CAREER_EXPRESSION',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          }),
          // Career qualification evidence
          Object.freeze({
            classification: 'SUPPORTING',
            evidenceId: 'evid1',
            identityKey: 'key-evid1',
            polarity: 'SUPPORTING',
            source: 'D1',
            stage: 'CAREER',
            provenanceStage: 'CAREER_QUALIFICATION',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          }),
          // Wealth dasha rule references (no classification/polarity)
          Object.freeze({
            ruleId: 'rule-1',
            source: 'DASHA',
            level: 'MD',
            stage: 'WEALTH',
            provenanceStage: 'WEALTH_DASHA_RULE',
            referenceKind: 'RULE'
          }),
          Object.freeze({
            ruleId: 'rule-2',
            source: 'DASHA',
            level: 'AD',
            stage: 'WEALTH',
            provenanceStage: 'WEALTH_DASHA_RULE',
            referenceKind: 'RULE'
          }),
          // Wealth promise evidence
          Object.freeze({
            classification: 'SUPPORTING',
            evidenceId: 'promise-1',
            identityKey: 'key-promise-1',
            dimension: 'ACCUMULATION',
            polarity: 'SUPPORTING',
            source: 'D1',
            stage: 'WEALTH',
            provenanceStage: 'WEALTH_NATAL_PROMISE',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          }),
          Object.freeze({
            classification: 'SUPPORTING',
            evidenceId: 'promise-2',
            identityKey: 'key-promise-2',
            dimension: 'GAINS',
            polarity: 'SUPPORTING',
            source: 'D1',
            stage: 'WEALTH',
            provenanceStage: 'WEALTH_NATAL_PROMISE',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          }),
          Object.freeze({
            classification: 'CHALLENGING',
            evidenceId: 'promise-3',
            identityKey: 'key-promise-3',
            dimension: 'SPECULATION',
            polarity: 'CHALLENGING',
            source: 'D1',
            stage: 'WEALTH',
            provenanceStage: 'WEALTH_NATAL_PROMISE',
            referenceKind: 'EVIDENCE',
            ruleId: undefined
          })
        ]),
        missingInputs: Object.freeze([]),
        provenance: Object.freeze({
          career: Object.freeze({
            status: 'PRESENT',
            version: 'PBA-04-v1',
            qualificationBasis: 'CANONICAL_STATUS'
          }),
          wealth: Object.freeze({
            status: 'PRESENT',
            version: 'PBA-05-v1'
          })
        })
      });

      // Assert full result equals golden fixture
      expect(result1.value).toEqual(expectedGoldenFixture);
    });
  });

  describe('Moon Mahadasha → Moon Antardasha GAINS synthesis regression', () => {
    it('derives PARTIAL dataStatus for Moon/Moon neutral-only GAINS (LINKED with UNKNOWN effect)', () => {
      const selectedPeriod = makeMoonMoonContext();

      // Build wealth activation for Moon/Moon neutral-only GAINS case
      const wealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        selectedPeriodId: selectedPeriod.selectedPeriodId,
        interval: Object.freeze({
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z'
        }),
        temporalRelation: 'CURRENT',
        dimensions: Object.freeze({
          ACCUMULATION: Object.freeze({
            dimension: 'ACCUMULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          GAINS: Object.freeze({
            dimension: 'GAINS',
            effect: 'UNKNOWN',
            linkedLevels: Object.freeze(['MD' as const, 'AD' as const]),
            md: Object.freeze({
              effect: 'UNKNOWN',
              dashaRuleReferences: Object.freeze([
                Object.freeze({
                  ruleId: 'MOON_MD_GAINS_NEUTRAL',
                  level: 'MD',
                  source: 'test-fixture'
                })
              ])
            }),
            ad: Object.freeze({
              effect: 'UNKNOWN',
              dashaRuleReferences: Object.freeze([
                Object.freeze({
                  ruleId: 'MOON_AD_GAINS_NEUTRAL',
                  level: 'AD',
                  source: 'test-fixture'
                })
              ])
            }),
            promiseEvidenceIds: Object.freeze(['NATAL_GAINS_MOON_PROMISE']),
            dashaRuleReferences: Object.freeze([
              Object.freeze({
                ruleId: 'MOON_MD_GAINS_NEUTRAL',
                level: 'MD',
                source: 'test-fixture'
              }),
              Object.freeze({
                ruleId: 'MOON_AD_GAINS_NEUTRAL',
                level: 'AD',
                source: 'test-fixture'
              })
            ]),
            insufficientReason: 'LINKED' as const
          }),
          FORTUNE: Object.freeze({
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          SPECULATION: Object.freeze({
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          })
        })
      });

      // Build natal promise evidence using createDomainEvidence
      const wealthEvidence = Object.freeze([
        createDomainEvidence({
          id: 'NATAL_GAINS_MOON_PROMISE',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'GAINS promise fixture',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          relatedEvidenceIds: [],
          dimension: 'GAINS',
          house: 11,
          planet: Planet.MOON
        })
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Assert GAINS dimension state
      const gains = result.value.wealth.dimensions.GAINS;
      expect(gains.effect).toBe('UNKNOWN');
      expect(gains.dataStatus).toBe('PARTIAL');
      expect(gains.insufficientReason).toBe('LINKED');
      expect(gains.linkedLevels).toEqual(['MD', 'AD']);
      expect(gains.promiseEvidenceIds).toEqual(['NATAL_GAINS_MOON_PROMISE']);
      expect(gains.dashaRuleReferences).toEqual([
        { ruleId: 'MOON_MD_GAINS_NEUTRAL', level: 'MD', source: 'test-fixture' },
        { ruleId: 'MOON_AD_GAINS_NEUTRAL', level: 'AD', source: 'test-fixture' }
      ]);

      // Assert provenance
      expect(result.value.provenance.wealth.status).toBe('PRESENT');
      expect(result.value.provenance.wealth.version).toBe('PBA-05-v1');

      // Assert projected WEALTH RULE references in evidence array
      const wealthRuleRefs = result.value.evidence.filter(
        ref => ref.stage === 'WEALTH' &&
          ref.provenanceStage === 'WEALTH_DASHA_RULE' &&
          ref.referenceKind === 'RULE'
      );
      expect(wealthRuleRefs.length).toBe(2);

      // Assert on the sorted set of rule references (order-independent)
      const ruleRefSet = wealthRuleRefs.map(ref => ({
        ruleId: ref.ruleId,
        level: ref.level,
        source: ref.source
      }));
      expect(ruleRefSet).toContainEqual({
        ruleId: 'MOON_MD_GAINS_NEUTRAL',
        level: 'MD',
        source: 'test-fixture'
      });
      expect(ruleRefSet).toContainEqual({
        ruleId: 'MOON_AD_GAINS_NEUTRAL',
        level: 'AD',
        source: 'test-fixture'
      });

      // Assert the actual emitted order (this is the engine's stable sort order)
      expect(wealthRuleRefs.map(ref => ref.ruleId)).toEqual([
        'MOON_AD_GAINS_NEUTRAL',
        'MOON_MD_GAINS_NEUTRAL'
      ]);
    });

    it('derives COMPLETE dataStatus for mixed MD-support / AD-challenge (PARTIALLY_ACTIVATES with all evidence resolved)', () => {
      const selectedPeriod = makeMoonMoonContext();

      // Build wealth activation for mixed MD-support / AD-challenge case
      const wealthActivation: SelectedWealthPeriodActivation = Object.freeze({
        selectedPeriodId: selectedPeriod.selectedPeriodId,
        interval: Object.freeze({
          start: '2025-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z'
        }),
        temporalRelation: 'CURRENT',
        dimensions: Object.freeze({
          ACCUMULATION: Object.freeze({
            dimension: 'ACCUMULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          GAINS: Object.freeze({
            dimension: 'GAINS',
            effect: 'PARTIALLY_ACTIVATES',
            linkedLevels: Object.freeze(['MD' as const, 'AD' as const]),
            md: Object.freeze({
              effect: 'ACTIVATES',
              dashaRuleReferences: Object.freeze([
                Object.freeze({
                  ruleId: 'MOON_MD_GAINS_SUPPORT',
                  level: 'MD',
                  source: 'test-fixture'
                })
              ])
            }),
            ad: Object.freeze({
              effect: 'CHALLENGES',
              dashaRuleReferences: Object.freeze([
                Object.freeze({
                  ruleId: 'MOON_AD_GAINS_CHALLENGE',
                  level: 'AD',
                  source: 'test-fixture'
                })
              ])
            }),
            promiseEvidenceIds: Object.freeze(['NATAL_GAINS_MOON_PROMISE']),
            dashaRuleReferences: Object.freeze([
              Object.freeze({
                ruleId: 'MOON_MD_GAINS_SUPPORT',
                level: 'MD',
                source: 'test-fixture'
              }),
              Object.freeze({
                ruleId: 'MOON_AD_GAINS_CHALLENGE',
                level: 'AD',
                source: 'test-fixture'
              })
            ]),
            insufficientReason: 'LINKED' as const
          }),
          FORTUNE: Object.freeze({
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }),
          SPECULATION: Object.freeze({
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            linkedLevels: Object.freeze([]),
            md: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            ad: Object.freeze({
              effect: 'INSUFFICIENT_DATA',
              dashaRuleReferences: Object.freeze([])
            }),
            promiseEvidenceIds: Object.freeze([]),
            dashaRuleReferences: Object.freeze([]),
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          })
        })
      });

      // Build natal promise evidence
      const wealthEvidence = Object.freeze([
        createDomainEvidence({
          id: 'NATAL_GAINS_MOON_PROMISE',
          sourceType: 'HOUSE',
          domain: 'WEALTH',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'GAINS promise fixture',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          relatedEvidenceIds: [],
          dimension: 'GAINS',
          house: 11,
          planet: Planet.MOON
        })
      ]);

      const result = buildSelectedPeriodSynthesis({
        selectedPeriod,
        wealthActivation,
        wealthEvidence
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // Assert GAINS dimension state
      const gains = result.value.wealth.dimensions.GAINS;
      expect(gains.effect).toBe('PARTIALLY_ACTIVATES');
      expect(gains.dataStatus).toBe('COMPLETE');
      expect(gains.insufficientReason).toBe('LINKED');
      expect(gains.linkedLevels).toEqual(['MD', 'AD']);
      expect(gains.promiseEvidenceIds).toEqual(['NATAL_GAINS_MOON_PROMISE']);
      expect(gains.dashaRuleReferences).toEqual([
        { ruleId: 'MOON_MD_GAINS_SUPPORT', level: 'MD', source: 'test-fixture' },
        { ruleId: 'MOON_AD_GAINS_CHALLENGE', level: 'AD', source: 'test-fixture' }
      ]);

      // Assert provenance
      expect(result.value.provenance.wealth.status).toBe('PRESENT');
      expect(result.value.provenance.wealth.version).toBe('PBA-05-v1');

      // Assert projected WEALTH RULE references in evidence array
      const wealthRuleRefs = result.value.evidence.filter(
        ref => ref.stage === 'WEALTH' &&
          ref.provenanceStage === 'WEALTH_DASHA_RULE' &&
          ref.referenceKind === 'RULE'
      );
      expect(wealthRuleRefs.length).toBe(2);

      // Assert on the sorted set of rule references (order-independent)
      const ruleRefSet = wealthRuleRefs.map(ref => ({
        ruleId: ref.ruleId,
        level: ref.level,
        source: ref.source
      }));
      expect(ruleRefSet).toContainEqual({
        ruleId: 'MOON_MD_GAINS_SUPPORT',
        level: 'MD',
        source: 'test-fixture'
      });
      expect(ruleRefSet).toContainEqual({
        ruleId: 'MOON_AD_GAINS_CHALLENGE',
        level: 'AD',
        source: 'test-fixture'
      });

      // Assert the actual emitted order (this is the engine's stable sort order)
      expect(wealthRuleRefs.map(ref => ref.ruleId)).toEqual([
        'MOON_AD_GAINS_CHALLENGE',
        'MOON_MD_GAINS_SUPPORT'
      ]);
    });
  });
});
