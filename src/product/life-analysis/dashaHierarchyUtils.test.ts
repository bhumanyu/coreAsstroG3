import { describe, it, expect } from 'vitest';
import { indexDashaPeriodActivations } from './dashaHierarchyUtils';
import { synthesizeCareerDashaHierarchy } from './dashaCareerHierarchy';
import { synthesizeWealthDashaHierarchy } from './dashaWealthHierarchy';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import { buildDashaTimingViewModel } from '../dasha-timing/buildDashaTimingViewModel';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from '../../integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { resolveLifeAnalysisEvidence } from './lifeAnalysisEvidence';
import { reasonWithLocalRules } from '../../ai/providers/local/localVedicRulesEngine';
import { CAREER_RULES, WEALTH_RULES, DASHA_RULES } from '../../ai/providers/local/rules';
import { Planet } from '../../types';
import type { CareerTimingActivation } from '../../domain/career/careerTypes';
import type { WealthPeriodTimingActivation } from '../../domain/wealth/wealthTypes';
import type { DomainInterpretation } from '../../domain/interpretation';

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
  it('proves deterministic hierarchy survives AiContext projection and local reasoning engine', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, {
      asOf: '2024-06-01T00:00:00.000Z'
    });

    const context = buildAiContext(horoscope, {
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH],
      lifeAnalysis: buildLifeAnalysis([STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH])
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
    expect(careerHierarchy?.evidenceIds?.length).toBeGreaterThan(0);

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
    expect(wealthHierarchy?.evidenceIds?.length).toBeGreaterThan(0);

    // 3. Ensure all hierarchy evidenceIds resolve against context.evidence
    const evidenceIdSet = new Set(context.evidence.map((e) => e.id));
    for (const id of careerHierarchy!.evidenceIds!) {
      expect(evidenceIdSet.has(id)).toBe(true);
    }
    for (const id of wealthHierarchy!.evidenceIds!) {
      expect(evidenceIdSet.has(id)).toBe(true);
    }

    // 4. Assert local career rule evaluates and preserves deterministic hierarchy outcome
    const careerRule003 = CAREER_RULES.find((r) => r.id === 'LOCAL-CAREER-003');
    expect(careerRule003).toBeDefined();
    const careerEval = careerRule003!.evaluate(context);
    expect(careerEval.triggered).toBe(true);
    expect(careerEval.statement).toContain('Career timing hierarchy evaluated');
    expect(careerEval.statement).toContain('PRIMARY');
    expect(careerEval.statement).toContain('MODIFIER');
    expect(careerEval.statement).toContain('TRIGGER');
    expect(careerEval.statement).toContain(careerHierarchy!.overallEffect);

    // 5. Assert local wealth rule evaluates and preserves deterministic hierarchy outcome
    const wealthRule004 = WEALTH_RULES.find((r) => r.id === 'LOCAL-WEALTH-004');
    expect(wealthRule004).toBeDefined();
    const wealthEval = wealthRule004!.evaluate(context);
    expect(wealthEval.triggered).toBe(true);
    expect(wealthEval.statement).toContain('Wealth timing hierarchy evaluated per dimension');
    expect(wealthEval.statement).toContain('PRIMARY');
    expect(wealthEval.statement).toContain('MODIFIER');
    expect(wealthEval.statement).toContain('TRIGGER');

    // 6. Assert reasonWithLocalRules end-to-end execution
    const careerReasoning = reasonWithLocalRules('CAREER_ANALYSIS', context);
    expect(careerReasoning.triggeredRuleIds).toContain('LOCAL-CAREER-003');

    const wealthReasoning = reasonWithLocalRules('WEALTH_ANALYSIS', context);
    expect(wealthReasoning.triggeredRuleIds).toContain('LOCAL-WEALTH-004');
  });
});
