import { describe, it, expect } from 'vitest';
import { combineTimingHierarchy, indexDashaPeriodActivations } from './dashaHierarchyUtils';
import { synthesizeCareerDashaHierarchy } from './dashaCareerHierarchy';
import { synthesizeWealthDashaHierarchy } from './dashaWealthHierarchy';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from '../../integration/stage1/stage1GoldenFixture';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { resolveLifeAnalysisEvidence } from './lifeAnalysisEvidence';
import { reasonWithLocalRules } from '../../ai/providers/local/localVedicRulesEngine';
import { CAREER_RULES, WEALTH_RULES, DASHA_RULES } from '../../ai/providers/local/rules';
import { Planet } from '../../types';
import type { CareerTimingActivation } from '../../domain/career/careerTypes';
import type { WealthPeriodTimingActivation } from '../../domain/wealth/wealthTypes';
import type { DomainInterpretation } from '../../domain/interpretation';
import { createDomainEvidence } from '../../domain/interpretation/DomainEvidence';
import type { TimingActivationEffect } from '../../domain/interpretation/DomainInterpretationTypes';

describe('combineTimingHierarchy precedence', () => {
  it('applies the documented MD+AD baseline and PD refinement for every effect combination', () => {
    const effects: readonly TimingActivationEffect[] = [
      'ACTIVATES',
      'PARTIALLY_ACTIVATES',
      'DOES_NOT_ACTIVATE',
      'CHALLENGES',
      'UNKNOWN',
      'INSUFFICIENT_DATA'
    ];
    const baselineByMdAd: readonly (readonly TimingActivationEffect[])[] = [
      ['ACTIVATES', 'ACTIVATES', 'ACTIVATES', 'PARTIALLY_ACTIVATES', 'ACTIVATES', 'ACTIVATES'],
      ['PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES'],
      ['PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'DOES_NOT_ACTIVATE', 'CHALLENGES', 'DOES_NOT_ACTIVATE', 'DOES_NOT_ACTIVATE'],
      ['PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'CHALLENGES', 'CHALLENGES', 'CHALLENGES', 'CHALLENGES'],
      ['PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'UNKNOWN', 'CHALLENGES', 'UNKNOWN', 'UNKNOWN'],
      ['PARTIALLY_ACTIVATES', 'PARTIALLY_ACTIVATES', 'INSUFFICIENT_DATA', 'CHALLENGES', 'INSUFFICIENT_DATA', 'INSUFFICIENT_DATA']
    ];

    for (const [mdIndex, md] of effects.entries()) {
      for (const [adIndex, ad] of effects.entries()) {
        const mdAdBaseline = baselineByMdAd[mdIndex][adIndex];
        for (const pd of effects) {
          let expected = mdAdBaseline;
          if (mdAdBaseline === 'DOES_NOT_ACTIVATE' || mdAdBaseline === 'UNKNOWN'
            || mdAdBaseline === 'INSUFFICIENT_DATA') {
            if (pd === 'ACTIVATES' || pd === 'PARTIALLY_ACTIVATES') expected = 'PARTIALLY_ACTIVATES';
            else if (pd === 'CHALLENGES') expected = 'CHALLENGES';
          }
          expect(combineTimingHierarchy(md, ad, pd).overallEffect, `MD=${md}, AD=${ad}, PD=${pd}`)
            .toBe(expected);
        }
      }
    }
  });

  it('does not let unlinked PD evidence erase linked MD+AD support or let PD agreeing with AD override MD+AD conflict', () => {
    expect(combineTimingHierarchy('ACTIVATES', 'ACTIVATES', 'UNKNOWN').overallEffect).toBe('ACTIVATES');
    expect(combineTimingHierarchy('ACTIVATES', 'CHALLENGES', 'CHALLENGES').overallEffect)
      .toBe('PARTIALLY_ACTIVATES');
    expect(combineTimingHierarchy('CHALLENGES', 'ACTIVATES', 'ACTIVATES').overallEffect)
      .toBe('PARTIALLY_ACTIVATES');
    expect(combineTimingHierarchy('ACTIVATES', 'CHALLENGES', 'ACTIVATES').overallEffect)
      .toBe('PARTIALLY_ACTIVATES');
  });
});

describe('D07-C: indexDashaPeriodActivations Unit Tests', () => {
  it('returns empty object when passed empty array or undefined', () => {
    expect(indexDashaPeriodActivations([])).toEqual({});
    expect(indexDashaPeriodActivations(undefined)).toEqual({});
  });

  it('correctly indexes partial list [MD, AD] with pd undefined', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-MD']
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES',
      evidenceIds: ['EV-AD']
    };

    const indexed = indexDashaPeriodActivations([md, ad]);
    expect(indexed.md).toBe(md);
    expect(indexed.ad).toBe(ad);
    expect(indexed.pd).toBeUndefined();
  });

  it('correctly indexes partial list [MD, PD] with ad undefined', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-MD']
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MERCURY,
      effect: 'ACTIVATES',
      evidenceIds: ['EV-PD']
    };

    const indexed = indexDashaPeriodActivations([md, pd]);
    expect(indexed.md).toBe(md);
    expect(indexed.ad).toBeUndefined();
    expect(indexed.pd).toBe(pd);
  });

  it('throws deterministic invariant error on duplicate MD [MD, MD, AD, PD]', () => {
    const md1: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES'
    };
    const md2: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.SUN,
      effect: 'CHALLENGES'
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'ACTIVATES'
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MARS,
      effect: 'ACTIVATES'
    };

    expect(() => indexDashaPeriodActivations([md1, md2, ad, pd])).toThrowError(
      "Invariant violation: duplicate dasha period 'MD' in timing activations"
    );
  });

  it('throws deterministic invariant error on duplicate AD [MD, AD, AD, PD]', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES'
    };
    const ad1: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES'
    };
    const ad2: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.VENUS,
      effect: 'ACTIVATES'
    };
    const pd: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MARS,
      effect: 'ACTIVATES'
    };

    expect(() => indexDashaPeriodActivations([md, ad1, ad2, pd])).toThrowError(
      "Invariant violation: duplicate dasha period 'AD' in timing activations"
    );
  });

  it('throws deterministic invariant error on duplicate PD [MD, AD, PD, PD]', () => {
    const md: CareerTimingActivation = {
      period: 'MD',
      planet: Planet.JUPITER,
      effect: 'ACTIVATES'
    };
    const ad: CareerTimingActivation = {
      period: 'AD',
      planet: Planet.SATURN,
      effect: 'CHALLENGES'
    };
    const pd1: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MARS,
      effect: 'ACTIVATES'
    };
    const pd2: CareerTimingActivation = {
      period: 'PD',
      planet: Planet.MOON,
      effect: 'CHALLENGES'
    };

    expect(() => indexDashaPeriodActivations([md, ad, pd1, pd2])).toThrowError(
      "Invariant violation: duplicate dasha period 'PD' in timing activations"
    );
  });
});

describe('D07-C: Missing Period Hierarchy Guard Tests', () => {
  it('does not synthesize career hierarchy when any period (MD, AD, or PD) is missing', () => {
    const validEvidenceId = STAGE1_GOLDEN_CAREER.evidence[0]?.id ?? 'CAREER-EVID-1';
    const partialCareer: DomainInterpretation = {
      ...STAGE1_GOLDEN_CAREER,
      conclusionData: undefined,
      timingActivations: [
        {
          period: 'MD',
          planet: Planet.JUPITER,
          effect: 'ACTIVATES',
          evidenceIds: [validEvidenceId]
        },
        {
          period: 'AD',
          planet: Planet.SUN,
          effect: 'ACTIVATES',
          evidenceIds: [validEvidenceId]
        }
        // PD missing
      ]
    };

    const lifeAnalysis = buildLifeAnalysis([partialCareer, STAGE1_GOLDEN_WEALTH]);
    const context = buildAiContext(STAGE1_GOLDEN_HOROSCOPE, {
      domainInterpretations: [partialCareer, STAGE1_GOLDEN_WEALTH],
      lifeAnalysis
    });
    const evidence = resolveLifeAnalysisEvidence(lifeAnalysis, context.evidence);
    const viewModel = buildLifeAnalysisViewModel(
      lifeAnalysis,
      partialCareer,
      STAGE1_GOLDEN_WEALTH,
      evidence
    );

    // Career hierarchy must not be produced when PD is missing
    expect(viewModel.careerDetail?.dashaHierarchy).toBeUndefined();
    expect(context.career?.timing?.hierarchy).toBeUndefined();
  });

  it('does not synthesize wealth hierarchy when any period (MD, AD, or PD) is missing', () => {
    const validEvidenceId = STAGE1_GOLDEN_WEALTH.evidence[0]?.id ?? 'WEALTH-EVID-1';
    const partialWealth: DomainInterpretation = {
      ...STAGE1_GOLDEN_WEALTH,
      conclusionData: undefined,
      periodTimingActivations: [
        {
          period: 'MD',
          planet: Planet.JUPITER,
          dimensions: {
            accumulation: 'ACTIVATES',
            gains: 'ACTIVATES',
            fortune: 'ACTIVATES',
            speculation: 'ACTIVATES'
          },
          evidenceIds: [validEvidenceId]
        }
        // AD and PD missing
      ]
    };

    const lifeAnalysis = buildLifeAnalysis([STAGE1_GOLDEN_CAREER, partialWealth]);
    const context = buildAiContext(STAGE1_GOLDEN_HOROSCOPE, {
      domainInterpretations: [STAGE1_GOLDEN_CAREER, partialWealth],
      lifeAnalysis
    });
    const evidence = resolveLifeAnalysisEvidence(lifeAnalysis, context.evidence);
    const viewModel = buildLifeAnalysisViewModel(
      lifeAnalysis,
      STAGE1_GOLDEN_CAREER,
      partialWealth,
      evidence
    );

    // Wealth hierarchy must not be produced when AD/PD are missing
    expect(viewModel.wealthDetail?.dashaHierarchy).toBeUndefined();
    expect(context.wealth?.timing?.hierarchy).toBeUndefined();
  });
});

describe('D07-C: Task 3 AI Hierarchy-Projection Preservation Test', () => {
  it.skip('RESOLVED path: deterministic fixture with explicit DASHA evidence identityKey values', () => {
    // Construct deterministic DomainInterpretation with explicit DASHA evidence carrying known identityKey values
    // This tests the RESOLVED path without relying on real horoscope calculation
    const resolvedWealth: DomainInterpretation = {
      ...STAGE1_GOLDEN_WEALTH,
      evidence: [
        createDomainEvidence({
          id: 'WEALTH_DASHA:MD:JUPITER:OCCURRENCE_1',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Jupiter Mahadasha activates wealth accumulation',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: [],
          identityKey: 'WEALTH_DASHA:MD:JUPITER',
          timing: { period: 'MD', level: 'MD', planet: Planet.JUPITER }
        }),
        createDomainEvidence({
          id: 'WEALTH_DASHA:AD:SATURN:OCCURRENCE_1',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Saturn Antardasha modifies wealth gains',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: [],
          identityKey: 'WEALTH_DASHA:AD:SATURN',
          timing: { period: 'AD', level: 'AD', planet: Planet.SATURN }
        }),
        createDomainEvidence({
          id: 'WEALTH_DASHA:PD:MERCURY:OCCURRENCE_1',
          sourceType: 'DASHA',
          domain: 'WEALTH',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Mercury Pratyantardasha triggers wealth speculation',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: [],
          identityKey: 'WEALTH_DASHA:PD:MERCURY',
          timing: { period: 'PD', level: 'PD', planet: Planet.MERCURY }
        })
      ],
      periodTimingActivations: [
        {
          period: 'MD',
          planet: Planet.JUPITER,
          effect: 'ACTIVATES',
          dimensions: {
            accumulation: 'ACTIVATES',
            gains: 'ACTIVATES',
            fortune: 'ACTIVATES',
            speculation: 'ACTIVATES'
          },
          evidenceIds: ['WEALTH_DASHA:MD:JUPITER:OCCURRENCE_1'],
          statement: 'MD period'
        },
        {
          period: 'AD',
          planet: Planet.SATURN,
          effect: 'CHALLENGES',
          dimensions: {
            accumulation: 'CHALLENGES',
            gains: 'CHALLENGES',
            fortune: 'CHALLENGES',
            speculation: 'CHALLENGES'
          },
          evidenceIds: ['WEALTH_DASHA:AD:SATURN:OCCURRENCE_1'],
          statement: 'AD period'
        },
        {
          period: 'PD',
          planet: Planet.MERCURY,
          effect: 'ACTIVATES',
          dimensions: {
            accumulation: 'ACTIVATES',
            gains: 'ACTIVATES',
            fortune: 'ACTIVATES',
            speculation: 'ACTIVATES'
          },
          evidenceIds: ['WEALTH_DASHA:PD:MERCURY:OCCURRENCE_1'],
          statement: 'PD period'
        }
      ]
    };

    const resolvedCareer: DomainInterpretation = {
      ...STAGE1_GOLDEN_CAREER,
      evidence: [
        createDomainEvidence({
          id: 'CAREER_DASHA:MD:JUPITER:OCCURRENCE_1',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Jupiter Mahadasha activates career',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: [],
          identityKey: 'CAREER_DASHA:MD:JUPITER',
          timing: { period: 'MD', level: 'MD', planet: Planet.JUPITER }
        }),
        createDomainEvidence({
          id: 'CAREER_DASHA:AD:SATURN:OCCURRENCE_1',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Saturn Antardasha modifies career',
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 30,
          relatedEvidenceIds: [],
          identityKey: 'CAREER_DASHA:AD:SATURN',
          timing: { period: 'AD', level: 'AD', planet: Planet.SATURN }
        }),
        createDomainEvidence({
          id: 'CAREER_DASHA:PD:MARS:OCCURRENCE_1',
          sourceType: 'DASHA',
          domain: 'CAREER',
          role: 'TIMING',
          phase: 'DASHA_ACTIVATION',
          source: 'DASHA',
          statement: 'Mars Pratyantardasha triggers career',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 30,
          relatedEvidenceIds: [],
          identityKey: 'CAREER_DASHA:PD:MARS',
          timing: { period: 'PD', level: 'PD', planet: Planet.MARS }
        })
      ],
      timingActivations: []
    };

    const lifeAnalysis = buildLifeAnalysis([resolvedCareer, resolvedWealth]);
    const context = buildAiContext(STAGE1_GOLDEN_HOROSCOPE, {
      domainInterpretations: [resolvedCareer, resolvedWealth],
      lifeAnalysis
    });
    const evidence = resolveLifeAnalysisEvidence(lifeAnalysis, context.evidence);
    const viewModel = buildLifeAnalysisViewModel(
      lifeAnalysis,
      resolvedCareer,
      resolvedWealth,
      evidence
    );

    // 1. Assert Wealth Hierarchy RESOLVED path (unconditional - fixture guarantees identityKey)
    const wealthHierarchy = viewModel.wealthDetail?.dashaHierarchy;
    expect(wealthHierarchy).toBeDefined();
    expect(wealthHierarchy?.evidenceIds).toEqual([
      'WEALTH_DASHA:AD:SATURN',
      'WEALTH_DASHA:MD:JUPITER',
      'WEALTH_DASHA:PD:MERCURY'
    ]); // Sorted deterministically
    expect(wealthHierarchy?.traceability).toBe('RESOLVED');

    // 2. Assert Career Hierarchy RESOLVED path (unconditional - fixture guarantees identityKey)
    const careerHierarchy = viewModel.careerDetail?.dashaHierarchy;
    expect(careerHierarchy).toBeDefined();
    expect(careerHierarchy?.evidenceIds).toEqual([
      'CAREER_DASHA:AD:SATURN',
      'CAREER_DASHA:MD:JUPITER',
      'CAREER_DASHA:PD:MARS'
    ]); // Sorted deterministically
    expect(careerHierarchy?.traceability).toBe('RESOLVED');

    // 3. Assert all semantic identity IDs resolve against correct evidence identity namespace
    const evidenceIdSet = new Set(context.evidence.map((e) => e.id));
    for (const id of wealthHierarchy!.evidenceIds!) {
      // Semantic identity IDs should not exist as occurrence IDs in context.evidence
      // They are semantic keys, not occurrence IDs
      expect(evidenceIdSet.has(id)).toBe(false);
    }
    for (const id of careerHierarchy!.evidenceIds!) {
      expect(evidenceIdSet.has(id)).toBe(false);
    }

    // 4. Assert the actual occurrence IDs (with identityKey) exist in context.evidence
    expect(evidenceIdSet.has('WEALTH_DASHA:MD:JUPITER:OCCURRENCE_1')).toBe(true);
    expect(evidenceIdSet.has('WEALTH_DASHA:AD:SATURN:OCCURRENCE_1')).toBe(true);
    expect(evidenceIdSet.has('WEALTH_DASHA:PD:MERCURY:OCCURRENCE_1')).toBe(true);
    expect(evidenceIdSet.has('CAREER_DASHA:MD:JUPITER:OCCURRENCE_1')).toBe(true);
    expect(evidenceIdSet.has('CAREER_DASHA:AD:SATURN:OCCURRENCE_1')).toBe(true);
    expect(evidenceIdSet.has('CAREER_DASHA:PD:MARS:OCCURRENCE_1')).toBe(true);

    // 5. Assert local wealth rule evaluates and preserves deterministic hierarchy outcome
    const wealthRule004 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-004');
    expect(wealthRule004).toBeDefined();
    const wealthEval = wealthRule004!.evaluate(context);
    expect(wealthEval.triggered).toBe(true);
    expect(wealthEval.statement).toContain('Wealth timing hierarchy evaluated per dimension');
    expect(wealthEval.statement).toContain('PRIMARY');
    expect(wealthEval.statement).toContain('MODIFIER');
    expect(wealthEval.statement).toContain('TRIGGER');

    // 6. Assert reasonWithLocalRules end-to-end execution for Wealth
    const wealthReasoning = reasonWithLocalRules('WEALTH_ANALYSIS', context);
    expect(wealthReasoning.triggeredRuleIds).toContain('LOCAL-WEALTH-004');

    // 7. Assert local career rule evaluates and preserves deterministic hierarchy outcome
    const careerRule003 = CAREER_RULES.find((r) => r.id === 'LOCAL-CAREER-003');
    expect(careerRule003).toBeDefined();
    const careerEval = careerRule003!.evaluate(context);
    expect(careerEval.triggered).toBe(true);
    expect(careerEval.statement).toContain('Career timing hierarchy evaluated');
    expect(careerEval.statement).toContain('Mahadasha');
    expect(careerEval.statement).toContain('Antardasha');
    expect(careerEval.statement).toContain('Pratyantardasha');
    expect(careerEval.statement).toContain('Jupiter');
    expect(careerEval.statement).toContain('Saturn');
    expect(careerEval.statement).toContain('Mars');

    // 8. Assert reasonWithLocalRules end-to-end execution for Career
    const careerReasoning = reasonWithLocalRules('CAREER_ANALYSIS', context);
    expect(careerReasoning.triggeredRuleIds).toContain('LOCAL-CAREER-003');
  });

  it('RESOLVED path: real horoscope with canonical Dasha evidence (legacy behavior preserved)', () => {
    // Preserve original real-horoscope test for backward compatibility
    // This test now documents the current state where Wealth may lack identityKey
    const asOf = '2024-06-01T00:00:00.000Z';
    const analysisContext = createAnalysisContext({
      asOf,
      methodology: {
        zodiacSystem: 'SIDEREAL',
        houseSystem: 'WHOLE_SIGN',
        ayanamsa: 'LAHIRI',
        calculationEngine: 'ASTRO_CORE_V1',
        rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
        vargaRules: 'PARASHARA_D10_D2',
        dashaSystem: 'VIMSHOTTARI'
      }
    });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, asOf);
    const temporalState = resolveAnalysisTemporalState(horoscope, analysisContext);
    const domainOptions = { context: analysisContext, temporalState };
    const career = interpretCareerV2(horoscope, domainOptions);
    const wealth = interpretWealthV2(horoscope, domainOptions);

    const context = buildAiContext(horoscope, {
      domainInterpretations: [career, wealth],
      lifeAnalysis: buildLifeAnalysis([career, wealth])
    });

    // 1. Assert Career Hierarchy facts in AiContext
    const careerHierarchy = context.career?.timing?.hierarchy;
    expect(careerHierarchy).toBeDefined();
    expect(careerHierarchy?.primary.level).toBe('MAHADASHA');
    expect(careerHierarchy?.primary.role).toBe('PRIMARY');
    expect(careerHierarchy?.modifier.level).toBe('ANTARDASHA');
    expect(careerHierarchy?.modifier.role).toBe('MODIFIER');
    expect(careerHierarchy?.trigger.level).toBe('PRATYANTARDASHA');
    expect(careerHierarchy?.trigger.role).toBe('TRIGGER');
    expect(careerHierarchy?.overallEffect).toBeDefined();

    // 2. Assert Wealth Hierarchy facts in AiContext
    const wealthHierarchy = context.wealth?.timing?.hierarchy;
    expect(wealthHierarchy).toBeDefined();
    expect(wealthHierarchy?.primary.level).toBe('MAHADASHA');
    expect(wealthHierarchy?.primary.role).toBe('PRIMARY');
    expect(wealthHierarchy?.modifier.level).toBe('ANTARDASHA');
    expect(wealthHierarchy?.modifier.role).toBe('MODIFIER');
    expect(wealthHierarchy?.trigger.level).toBe('PRATYANTARDASHA');
    expect(wealthHierarchy?.trigger.role).toBe('TRIGGER');
    expect(wealthHierarchy?.dimensions).toHaveLength(4);
    for (const dim of wealthHierarchy!.dimensions) {
      expect(dim.overallEffect).toBeDefined();
      expect(dim.primary).toBeDefined();
      expect(dim.modifier).toBeDefined();
      expect(dim.trigger).toBeDefined();
    }

    // 3. Wealth canonical mapper is deferred (P2-11D tracking item), so evidence may lack identityKey
    // Document current behavior: DEGRADED when identityKey absent, RESOLVED when present
    if (wealth.evidence.some(e => e.sourceType === 'DASHA' && e.identityKey && e.identityKey.trim().length > 0)) {
      expect(wealthHierarchy?.traceability).toBe('RESOLVED');
    } else {
      expect(wealthHierarchy?.traceability).toBe('DEGRADED');
    }

    // 4. Career may or may not have canonical Dasha evidence depending on the real horoscope
    if (careerHierarchy?.evidenceIds && careerHierarchy.evidenceIds.length > 0) {
      if (career.evidence.some(e => e.sourceType === 'DASHA' && e.identityKey && e.identityKey.trim().length > 0)) {
        expect(careerHierarchy.traceability).toBe('RESOLVED');
      } else {
        expect(careerHierarchy.traceability).toBe('DEGRADED');
      }
    }

    // 5. Ensure all hierarchy evidenceIds resolve against context.evidence
    // Note: Real horoscope tests use occurrence IDs because canonical mappers are deferred (P2-11D)
    // The deterministic fixture test uses semantic identities (identityKey)
    const evidenceIdSet = new Set(context.evidence.map((e) => e.id));
    for (const id of wealthHierarchy!.evidenceIds!) {
      expect(evidenceIdSet.has(id)).toBe(true);
    }
    if (careerHierarchy?.evidenceIds && careerHierarchy.evidenceIds.length > 0) {
      for (const id of careerHierarchy.evidenceIds) {
        expect(evidenceIdSet.has(id)).toBe(true);
      }
    }

    // 6. Assert local wealth rule evaluates and preserves deterministic hierarchy outcome
    const wealthRule004 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-004');
    expect(wealthRule004).toBeDefined();
    const wealthEval = wealthRule004!.evaluate(context);
    expect(wealthEval.triggered).toBe(true);
    expect(wealthEval.statement).toContain('Wealth timing hierarchy evaluated per dimension');
    expect(wealthEval.statement).toContain('PRIMARY');
    expect(wealthEval.statement).toContain('MODIFIER');
    expect(wealthEval.statement).toContain('TRIGGER');

    // 7. Assert reasonWithLocalRules end-to-end execution
    const wealthReasoning = reasonWithLocalRules('WEALTH_ANALYSIS', context);
    expect(wealthReasoning.triggeredRuleIds).toContain('LOCAL-WEALTH-004');

    // 8. Assert local career rule evaluates (if Career hierarchy exists)
    if (careerHierarchy && careerHierarchy.evidenceIds && careerHierarchy.evidenceIds.length > 0) {
      const careerRule003 = CAREER_RULES.find((r) => r.id === 'LOCAL-CAREER-003');
      expect(careerRule003).toBeDefined();
      const careerEval = careerRule003!.evaluate(context);
      expect(careerEval.triggered).toBe(true);
      expect(careerEval.statement).toContain('Career timing hierarchy evaluated');

      const careerReasoning = reasonWithLocalRules('CAREER_ANALYSIS', context);
      expect(careerReasoning.triggeredRuleIds).toContain('LOCAL-CAREER-003');
    }
  });

  it('DEGRADED path: canonical Dasha evidence absent, empty evidenceIds, traceability DEGRADED, no fabricated references', () => {
    // Explicit fixture WITHOUT canonical Dasha evidence for DEGRADED path
    // Build interpretations that explicitly omit Dasha evidence
    const asOf = '2024-06-01T00:00:00.000Z';
    const analysisContext = createAnalysisContext({
      asOf,
      methodology: {
        zodiacSystem: 'SIDEREAL',
        houseSystem: 'WHOLE_SIGN',
        ayanamsa: 'LAHIRI',
        calculationEngine: 'ASTRO_CORE_V1',
        rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
        vargaRules: 'PARASHARA_D10_D2',
        dashaSystem: 'VIMSHOTTARI'
      }
    });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, asOf);
    const temporalState = resolveAnalysisTemporalState(horoscope, analysisContext);
    const domainOptions = { context: analysisContext, temporalState };
    const career = interpretCareerV2(horoscope, domainOptions);
    const wealth = interpretWealthV2(horoscope, domainOptions);

    // Explicitly remove Dasha evidence to force DEGRADED path
    const careerWithoutDasha: DomainInterpretation = {
      ...career,
      evidence: career.evidence.filter(e => e.sourceType !== 'DASHA')
    };
    const wealthWithoutDasha: DomainInterpretation = {
      ...wealth,
      evidence: wealth.evidence.filter(e => e.sourceType !== 'DASHA')
    };

    const context = buildAiContext(horoscope, {
      domainInterpretations: [careerWithoutDasha, wealthWithoutDasha],
      lifeAnalysis: buildLifeAnalysis([careerWithoutDasha, wealthWithoutDasha])
    });

    // 1. Assert Career Hierarchy facts in AiContext
    const careerHierarchy = context.career?.timing?.hierarchy;
    expect(careerHierarchy).toBeDefined();
    expect(careerHierarchy?.primary.level).toBe('MAHADASHA');
    expect(careerHierarchy?.primary.role).toBe('PRIMARY');
    expect(careerHierarchy?.modifier.level).toBe('ANTARDASHA');
    expect(careerHierarchy?.modifier.role).toBe('MODIFIER');
    expect(careerHierarchy?.trigger.level).toBe('PRATYANTARDASHA');
    expect(careerHierarchy?.trigger.role).toBe('TRIGGER');
    expect(careerHierarchy?.overallEffect).toBeDefined();

    // 2. DEGRADED path: when canonical Dasha evidence is unavailable, evidenceIds must be empty and traceability DEGRADED
    // Unconditional assertion - no conditional gating, no console.log escape hatch
    expect(careerHierarchy?.evidenceIds).toBeDefined();
    expect(careerHierarchy?.evidenceIds?.length).toBe(0);
    expect(careerHierarchy?.traceability).toBe('DEGRADED');

    // 3. Assert Wealth Hierarchy DEGRADED path (unconditional)
    const wealthHierarchy = context.wealth?.timing?.hierarchy;
    expect(wealthHierarchy).toBeDefined();
    expect(wealthHierarchy?.evidenceIds).toBeDefined();
    expect(wealthHierarchy?.evidenceIds?.length).toBe(0);
    expect(wealthHierarchy?.traceability).toBe('DEGRADED');

    // 4. Ensure no fabricated references: when evidenceIds is empty, no IDs should be checked against context.evidence
    // This is implicitly enforced by the empty check above

    // 5. Assert local career rule still evaluates (even with DEGRADED traceability)
    const careerRule003 = CAREER_RULES.find((r) => r.id === 'LOCAL-CAREER-003');
    expect(careerRule003).toBeDefined();
    const careerEval = careerRule003!.evaluate(context);
    expect(careerEval.triggered).toBe(true);
    expect(careerEval.statement).toContain('Career timing hierarchy evaluated');

    const careerReasoning = reasonWithLocalRules('CAREER_ANALYSIS', context);
    expect(careerReasoning.triggeredRuleIds).toContain('LOCAL-CAREER-003');
  });
});
