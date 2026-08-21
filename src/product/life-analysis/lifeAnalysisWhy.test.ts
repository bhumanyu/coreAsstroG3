import { describe, it, expect, vi } from 'vitest';
import {
  buildWhyExperience,
  resolveLifeAnalysisEvidenceDetails,
  calculateEvidenceIntegrity,
  groupEvidence
} from './lifeAnalysisWhy';
import { resolveRuleMetadata } from './lifeAnalysisEvidenceRules';
import { runLifeAnalysisProduct } from './lifeAnalysisProductService';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from '../../integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from '../../domain/synthesis';
import type { DomainEvidence } from '../../domain/interpretation/DomainEvidence';
import type { DomainInterpretation } from '../../domain/interpretation';
import type { LifeAnalysis } from '../../domain/synthesis';
import type { AiRouter } from '../../ai/routing/AiRouter';

describe('P-030 Deterministic Traceable Why Experience', () => {
  const goldenAnalysis = buildLifeAnalysis([
    STAGE1_GOLDEN_CAREER,
    STAGE1_GOLDEN_WEALTH
  ]);

  it('Test 1: complete trace — every referenced and resolvable evidence item has traceability.valid = true', () => {
    const why = buildWhyExperience({
      analysis: goldenAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    expect(why.integrity.status).toBe('VALID');
    expect(why.integrity.unresolved).toBe(0);
    expect(why.integrity.unresolvedIds).toHaveLength(0);
    expect(why.evidence.length).toBe(why.integrity.totalReferenced);

    for (const item of why.evidence) {
      expect(item.traceability.valid).toBe(true);
      expect(item.traceability.evidenceId).toBe(item.id);
      expect(item.traceability.domain).toBe(item.domain);
      expect(item.statement).toBeTruthy();
      expect(item.source.label).toBeTruthy();
      expect(item.availability).toBe('AVAILABLE');
    }
  });

  it('Test 2: unknown evidence — unresolvable evidence ID is dropped, status is PARTIAL, unresolvedIds contains it', () => {
    const mutatedAnalysis: LifeAnalysis = {
      ...goldenAnalysis,
      evidenceIds: [...goldenAnalysis.evidenceIds, 'GHOST_EVIDENCE_999']
    };

    const why = buildWhyExperience({
      analysis: mutatedAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    expect(why.integrity.status).toBe('PARTIAL');
    expect(why.integrity.unresolved).toBe(1);
    expect(why.integrity.unresolvedIds).toContain('GHOST_EVIDENCE_999');

    // The ghost evidence must NOT appear in the resolved evidence list
    const ghostItem = why.evidence.find((e) => e.id === 'GHOST_EVIDENCE_999');
    expect(ghostItem).toBeUndefined();
  });

  it('Test 3: conflicting polarity — evidence present in both supporting and challenging sets has displayPolarity = CONFLICTING', () => {
    const sharedId = goldenAnalysis.evidenceIds[0];
    const conflictingAnalysis: LifeAnalysis = {
      ...goldenAnalysis,
      domains: [
        {
          domain: 'CAREER',
          status: 'MIXED',
          strength: 'MODERATE',
          confidence: 'HIGH',
          primaryConclusion: 'Mixed signals',
          supportingEvidenceIds: [sharedId],
          challengingEvidenceIds: []
        },
        {
          domain: 'WEALTH',
          status: 'CHALLENGED',
          strength: 'WEAK',
          confidence: 'HIGH',
          primaryConclusion: 'Friction',
          supportingEvidenceIds: [],
          challengingEvidenceIds: [sharedId]
        }
      ]
    };

    const why = buildWhyExperience({
      analysis: conflictingAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    const conflictingItem = why.evidence.find((e) => e.id === sharedId);
    expect(conflictingItem).toBeDefined();
    expect(conflictingItem?.displayPolarity).toBe('CONFLICTING');
    expect(why.grouped.conflicting.some((e) => e.id === sharedId)).toBe(true);
  });

  it('Test 4: primary role preserved — PRIMARY DomainEvidence maps to role PRIMARY', () => {
    const primaryEvidence = STAGE1_GOLDEN_CAREER.evidence.find(
      (e) => e.role === 'PRIMARY'
    );
    expect(primaryEvidence).toBeDefined();

    const why = buildWhyExperience({
      analysis: goldenAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    const mappedItem = why.evidence.find((e) => e.id === primaryEvidence!.id);
    expect(mappedItem).toBeDefined();
    expect(mappedItem?.role).toBe('PRIMARY');
    expect(why.grouped.primary.some((e) => e.id === primaryEvidence!.id)).toBe(true);
  });

  it('Test 5: related evidence preserved — relatedEvidenceIds passthrough matches source DomainEvidence', () => {
    const d10Confirmation = STAGE1_GOLDEN_CAREER.evidence.find(
      (e) => e.role === 'CONFIRMATION' && e.source === 'D10'
    );
    expect(d10Confirmation).toBeDefined();
    expect(d10Confirmation!.relatedEvidenceIds).toBeDefined();
    expect(d10Confirmation!.relatedEvidenceIds!.length).toBeGreaterThan(0);

    const why = buildWhyExperience({
      analysis: goldenAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    const mappedItem = why.evidence.find((e) => e.id === d10Confirmation!.id);
    expect(mappedItem).toBeDefined();
    expect(mappedItem?.relatedEvidenceIds).toEqual(
      d10Confirmation!.relatedEvidenceIds
    );
  });

  it('Test 6: missing rule metadata — unknown ruleId yields rule: undefined while traceability.valid remains true', () => {
    const customEvidence: DomainEvidence = {
      id: 'CUSTOM_TEST_EV_001',
      domain: 'CAREER',
      role: 'SECONDARY',
      polarity: 'SUPPORTING',
      statement: 'Custom astrological factor statement.',
      source: 'D1',
      ruleId: 'NON_EXISTENT_RULE_XYZ_999',
      phase: 'NATAL_PROMISE',
      strength: 'STRONG',
      priority: 1,
      relatedEvidenceIds: []
    };

    const customInterp: DomainInterpretation = {
      ...STAGE1_GOLDEN_CAREER,
      evidence: [customEvidence]
    };

    const customAnalysis: LifeAnalysis = {
      ...goldenAnalysis,
      evidenceIds: ['CUSTOM_TEST_EV_001']
    };

    const why = buildWhyExperience({
      analysis: customAnalysis,
      domainInterpretations: [customInterp]
    });

    expect(why.evidence).toHaveLength(1);
    const item = why.evidence[0];
    expect(item.id).toBe('CUSTOM_TEST_EV_001');
    expect(item.rule).toBeUndefined(); // Unknown rule is undefined (never fabricated)
    expect(item.traceability.valid).toBe(true); // Evidence itself is still valid and traceable
    expect(item.traceability.ruleId).toBe('NON_EXISTENT_RULE_XYZ_999');
  });

  it('Test 7: missing chart fact — chartFact is undefined when no notes/periodKey/dimension exist', () => {
    const minimalEvidence: DomainEvidence = {
      id: 'MINIMAL_EV_001',
      domain: 'WEALTH',
      role: 'PRIMARY',
      polarity: 'SUPPORTING',
      statement: 'Minimal wealth structural factor.',
      source: 'D1',
      phase: 'NATAL_PROMISE',
      strength: 'STRONG',
      priority: 1,
      relatedEvidenceIds: []
    };

    const customInterp: DomainInterpretation = {
      ...STAGE1_GOLDEN_WEALTH,
      evidence: [minimalEvidence]
    };

    const customAnalysis: LifeAnalysis = {
      ...goldenAnalysis,
      evidenceIds: ['MINIMAL_EV_001']
    };

    const why = buildWhyExperience({
      analysis: customAnalysis,
      domainInterpretations: [customInterp]
    });

    expect(why.evidence[0].chartFact).toBeUndefined();
  });

  it('Test 8: grouping logic — groups evidence items correctly by role and display polarity', () => {
    const items = [
      {
        id: '1',
        domain: 'CAREER' as const,
        role: 'PRIMARY' as const,
        polarity: 'SUPPORTING' as const,
        displayPolarity: 'SUPPORTING' as const,
        title: 'T1',
        statement: 'S1',
        source: { type: 'HOUSE' as const, label: 'House' },
        relatedEvidenceIds: [],
        traceability: { evidenceId: '1', domain: 'CAREER' as const, relatedEvidenceIds: [], valid: true },
        availability: 'AVAILABLE' as const
      },
      {
        id: '2',
        domain: 'CAREER' as const,
        role: 'SECONDARY' as const,
        polarity: 'CHALLENGING' as const,
        displayPolarity: 'CHALLENGING' as const,
        title: 'T2',
        statement: 'S2',
        source: { type: 'HOUSE' as const, label: 'House' },
        relatedEvidenceIds: [],
        traceability: { evidenceId: '2', domain: 'CAREER' as const, relatedEvidenceIds: [], valid: true },
        availability: 'AVAILABLE' as const
      },
      {
        id: '3',
        domain: 'WEALTH' as const,
        role: 'CONFIRMATION' as const,
        polarity: 'SUPPORTING' as const,
        displayPolarity: 'CONFLICTING' as const,
        title: 'T3',
        statement: 'S3',
        source: { type: 'VARGA' as const, label: 'D2' },
        relatedEvidenceIds: [],
        traceability: { evidenceId: '3', domain: 'WEALTH' as const, relatedEvidenceIds: [], valid: true },
        availability: 'AVAILABLE' as const
      },
      {
        id: '4',
        domain: 'CAREER' as const,
        role: 'TIMING' as const,
        polarity: 'SUPPORTING' as const,
        displayPolarity: 'SUPPORTING' as const,
        title: 'T4',
        statement: 'S4',
        source: { type: 'DASHA' as const, label: 'Dasha' },
        relatedEvidenceIds: [],
        traceability: { evidenceId: '4', domain: 'CAREER' as const, relatedEvidenceIds: [], valid: true },
        availability: 'AVAILABLE' as const
      },
      {
        id: '5',
        domain: 'WEALTH' as const,
        role: 'MODIFIER' as const,
        polarity: 'SUPPORTING' as const,
        displayPolarity: 'SUPPORTING' as const,
        title: 'T5',
        statement: 'S5',
        source: { type: 'ASPECT' as const, label: 'Aspect' },
        relatedEvidenceIds: [],
        traceability: { evidenceId: '5', domain: 'WEALTH' as const, relatedEvidenceIds: [], valid: true },
        availability: 'AVAILABLE' as const
      }
    ];

    const grouped = groupEvidence(items);
    expect(grouped.primary).toHaveLength(1);
    expect(grouped.supporting).toHaveLength(1);
    expect(grouped.confirmations).toHaveLength(1);
    expect(grouped.timing).toHaveLength(1);
    expect(grouped.modifiers).toHaveLength(1);
    expect(grouped.challenging).toHaveLength(1);
    expect(grouped.conflicting).toHaveLength(1);
  });

  it('Test 9: AI remains downstream — runLifeAnalysisProduct with includeAiExplanation=false skips AI and produces deterministic Why model', async () => {
    const mockRouter: AiRouter = {
      route: vi.fn()
    } as unknown as AiRouter;

    const productResult = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false,
      router: mockRouter
    });

    expect(productResult.status).toBe('READY');
    expect(productResult.analysis?.why).toBeDefined();
    expect(productResult.analysis?.why.integrity.status).toBe('VALID');
    expect(productResult.analysis?.why.evidence.length).toBeGreaterThan(0);
    expect(productResult.aiExplanation).toBeUndefined();
    expect(mockRouter.route).not.toHaveBeenCalled();
  });

  it('Test 10: AI failure resilience — Why experience remains fully populated when AI explanation throws an error', async () => {
    const failingRouter: AiRouter = {
      route: vi.fn().mockRejectedValue(new Error('AI provider connection timeout'))
    } as unknown as AiRouter;

    const productResult = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: true,
      router: failingRouter
    });

    expect(productResult.status).toBe('READY');
    expect(productResult.analysis).toBeDefined();
    expect(productResult.analysis?.why.integrity.status).toBe('VALID');
    expect(productResult.analysis?.why.evidence.length).toBeGreaterThan(0);
    expect(productResult.aiExplanation?.status).toBe('ERROR');
  });

  it('Test 11: Stage-1 Golden Fixture integration — Career (10H/10L/D10) and Wealth (2H/11H/D2) are present in Why evidence universe', () => {
    const why = buildWhyExperience({
      analysis: goldenAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    const careerSources = why.evidence
      .filter((e) => e.domain === 'CAREER')
      .map((e) => e.source.type);
    const wealthSources = why.evidence
      .filter((e) => e.domain === 'WEALTH')
      .map((e) => e.source.type);

    expect(careerSources).toContain('HOUSE');
    expect(careerSources).toContain('LORDSHIP');
    expect(careerSources).toContain('VARGA');
    expect(wealthSources).toContain('HOUSE');
    expect(wealthSources).toContain('LORDSHIP');
    expect(wealthSources).toContain('PLANET');

    // Every item in why.evidence must exist in the domain interpretations
    const allDomainIds = new Set([
      ...STAGE1_GOLDEN_CAREER.evidence.map((e) => e.id),
      ...STAGE1_GOLDEN_WEALTH.evidence.map((e) => e.id)
    ]);

    for (const item of why.evidence) {
      expect(allDomainIds.has(item.id)).toBe(true);
    }
  });

  it('Test 12: Rule metadata registry resolution — maps Career and Wealth rule metadata correctly', () => {
    const careerRule = resolveRuleMetadata('CAREER_10H_STRONG_001');
    expect(careerRule).toBeDefined();
    expect(careerRule?.category).toBe('STRUCTURAL');
    expect(careerRule?.name).toContain('10th House');

    const wealthRule = resolveRuleMetadata('WEALTH_2H_STRONG_001');
    expect(wealthRule).toBeDefined();
    expect(wealthRule?.category).toBe('STRUCTURAL');
    expect(wealthRule?.name).toContain('2nd House');

    const unknownRule = resolveRuleMetadata('RANDOM_NON_EXISTENT');
    expect(unknownRule).toBeUndefined();
  });

  it('Test 13: calculationId omission — calculationId is omitted from source and traceability when not present on DomainEvidence', () => {
    const why = buildWhyExperience({
      analysis: goldenAnalysis,
      domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH]
    });

    for (const item of why.evidence) {
      expect(item.source.calculationId).toBeUndefined();
      expect(item.traceability.calculationId).toBeUndefined();
      expect(item.traceability.ruleId).toBeDefined(); // ruleId is populated
    }
  });

  it('Test 14: D1 fallback mapping — unclassified D1 source falls back to type OTHER with Natal Chart (D1) label', () => {
    const unclassifiedD1Evidence: DomainEvidence = {
      id: 'UNCLASSIFIED_D1_EV_001',
      domain: 'CAREER',
      role: 'SECONDARY',
      polarity: 'SUPPORTING',
      statement: 'Unclassified general D1 fact.',
      source: 'D1',
      phase: 'NATAL_PROMISE',
      strength: 'MODERATE',
      priority: 2,
      relatedEvidenceIds: []
    };

    const customInterp: DomainInterpretation = {
      ...STAGE1_GOLDEN_CAREER,
      evidence: [unclassifiedD1Evidence]
    };

    const customAnalysis: LifeAnalysis = {
      ...goldenAnalysis,
      evidenceIds: ['UNCLASSIFIED_D1_EV_001']
    };

    const why = buildWhyExperience({
      analysis: customAnalysis,
      domainInterpretations: [customInterp]
    });

    expect(why.evidence).toHaveLength(1);
    expect(why.evidence[0].source.type).toBe('OTHER');
    expect(why.evidence[0].source.label).toBe('Natal Chart (D1)');
  });

  it('Test 15: NEUTRAL polarity mapping — NEUTRAL DomainEvidence maps to displayPolarity NEUTRAL when not explicitly in supporting or challenging sets', () => {
    const neutralEvidence: DomainEvidence = {
      id: 'NEUTRAL_EV_001',
      domain: 'CAREER',
      role: 'MODIFIER',
      polarity: 'NEUTRAL',
      statement: 'Neutral ambient factor.',
      source: 'D1',
      phase: 'NATAL_PROMISE',
      strength: 'MODERATE',
      priority: 3,
      relatedEvidenceIds: []
    };

    const customInterp: DomainInterpretation = {
      ...STAGE1_GOLDEN_CAREER,
      evidence: [neutralEvidence]
    };

    const customAnalysis: LifeAnalysis = {
      ...goldenAnalysis,
      domains: [
        {
          domain: 'CAREER',
          status: 'MIXED',
          strength: 'MODERATE',
          confidence: 'HIGH',
          primaryConclusion: 'Mixed signals',
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        }
      ],
      evidenceIds: ['NEUTRAL_EV_001']
    };

    const why = buildWhyExperience({
      analysis: customAnalysis,
      domainInterpretations: [customInterp]
    });

    expect(why.evidence).toHaveLength(1);
    expect(why.evidence[0].displayPolarity).toBe('NEUTRAL');
  });
});
