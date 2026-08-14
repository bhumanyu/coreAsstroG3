import { describe, it, expect } from 'vitest';
import { computeWealthNatalPromise } from '../wealthThemeInterpretation';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { WealthEvidence, WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';
import { buildFamilySummaries } from '../themeInterpretationUtils';

describe('computeWealthNatalPromise', () => {
  const completeContext: ThemeInterpretationContext = {
    houseInterpretation: {} as any,
    planetInterpretation: {} as any,
    yogas: {} as any,
    divisionalInterpretation: {} as any,
    functionalRoles: {} as any,
    planetaryStrength: {} as any,
    dashaInterpretation: {} as any,
    natalGrahaDrishti: {} as any
  };

  it('returns STRONG when both 2nd and 11th are strongly supported without challenges', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_2H_STRONG_001:HOUSE_2',
        ruleId: 'WEALTH_2H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '2H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_11H_STRONG_001:HOUSE_11',
        ruleId: 'WEALTH_11H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '11H strong',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    expect(promise.status).toBe('STRONG');
    expect(promise.evidenceConfidence).toBe('HIGH');
  });

  it('returns SUPPORTED (not STRONG) when 2nd is strong but 11th is only moderately supported', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_2H_STRONG_001:HOUSE_2',
        ruleId: 'WEALTH_2H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '2H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_11H_SUPPORT_001:HOUSE_11',
        ruleId: 'WEALTH_11H_SUPPORT_001',
        evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'MODERATE',
        effect: 'SUPPORT',
        statement: '11H supported',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_9H_STRONG_001:HOUSE_9',
        ruleId: 'WEALTH_9H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.NINTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '9H strong',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    expect(promise.status).toBe('SUPPORTED');
  });

  it('resolves support from ONLY 5/9 (Fortune/Speculation) to SUPPORTED, never STRONG', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_9H_STRONG_001:HOUSE_9',
        ruleId: 'WEALTH_9H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.NINTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '9H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_5H_STRONG_001:HOUSE_5',
        ruleId: 'WEALTH_5H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.FIFTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '5H strong',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    expect(promise.status).toBe('SUPPORTED');
    expect(promise.status).not.toBe('STRONG');
  });

  it('does NOT grant HIGH confidence from 2H+2L alone without 2 independent structural domains', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_2H_STRONG_001:HOUSE_2',
        ruleId: 'WEALTH_2H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '2H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_2L_DIGNITY_001:JUPITER',
        ruleId: 'WEALTH_2L_DIGNITY_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_LORD,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '2L exalted',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    // Both belong to the 'SECOND' domain, so independentSupportingDomains.size is 1
    expect(promise.evidenceConfidence).toBe('MEDIUM');
  });

  it('returns MIXED when there are both supporting and challenging primary factors', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_2H_STRONG_001:HOUSE_2',
        ruleId: 'WEALTH_2H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '2H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_11H_AFFLICTION_001:HOUSE_11',
        ruleId: 'WEALTH_11H_AFFLICTION_001',
        evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'CHALLENGE',
        statement: '11H afflicted',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    expect(promise.status).toBe('MIXED');
  });

  it('returns ADVERSE when primary factors are challenging and no support exists', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_2H_AFFLICTION_001:HOUSE_2',
        ruleId: 'WEALTH_2H_AFFLICTION_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'CHALLENGE',
        statement: '2H afflicted',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    expect(promise.status).toBe('ADVERSE');
  });

  it('returns MIXED when 2H and 11H are strong but a core structural family (2L) resolves to MIXED', () => {
    const evidence: WealthEvidence[] = [
      {
        id: 'WEALTH_2H_STRONG_001:HOUSE_2',
        ruleId: 'WEALTH_2H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '2H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_11H_STRONG_001:HOUSE_11',
        ruleId: 'WEALTH_11H_STRONG_001',
        evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE,
        priority: 'PRIMARY',
        strength: 'STRONG',
        effect: 'SUPPORT',
        statement: '11H strong',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_2L_SUPPORT_001:PLANET_VENUS',
        ruleId: 'WEALTH_2L_SUPPORT_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_LORD,
        priority: 'PRIMARY',
        strength: 'MODERATE',
        effect: 'SUPPORT',
        statement: '2L supported',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_2L_AFFLICTION_001:PLANET_VENUS',
        ruleId: 'WEALTH_2L_AFFLICTION_001',
        evidenceFamily: WealthEvidenceFamily.SECOND_LORD,
        priority: 'PRIMARY',
        strength: 'MODERATE',
        effect: 'CHALLENGE',
        statement: '2L afflicted',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'WEALTH_11L_SUPPORT_001:PLANET_MERCURY',
        ruleId: 'WEALTH_11L_SUPPORT_001',
        evidenceFamily: WealthEvidenceFamily.ELEVENTH_LORD,
        priority: 'PRIMARY',
        strength: 'MODERATE',
        effect: 'SUPPORT',
        statement: '11L supported',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const summaries = buildFamilySummaries(evidence);
    expect(summaries[WealthEvidenceFamily.SECOND_LORD]?.status).toBe('MIXED');
    const promise = computeWealthNatalPromise(evidence, completeContext, summaries);
    expect(promise.status).toBe('MIXED');
  });

  it('returns UNAVAILABLE when context data is insufficient', () => {
    const insufficientContext: ThemeInterpretationContext = {
      houseInterpretation: undefined,
      planetInterpretation: undefined
    } as any;

    const evidence: WealthEvidence[] = [];
    const summaries = buildFamilySummaries(evidence);
    const promise = computeWealthNatalPromise(evidence, insufficientContext, summaries);
    expect(promise.status).toBe('UNAVAILABLE');
    expect(promise.evidenceConfidence).toBe('LOW');
  });
});
