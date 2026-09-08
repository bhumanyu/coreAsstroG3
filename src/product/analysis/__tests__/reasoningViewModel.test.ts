import { describe, it, expect } from 'vitest';
import {
  selectReasoningViewModel,
  buildEvidenceGroups,
  mapEvidence
} from '../reasoningViewModel';
import { createProductAnalysis } from './testHelpers';
import type {
  ProductDashaPeriod,
  ProductEvidence,
  ProductEvidenceRole,
  ProductDirection
} from '../productAnalysisTypes';

describe('ReasoningViewModel pure projection selectors (P-UI-06)', () => {
  it('1. selector maps all Career fields correctly', () => {
    const analysis = createProductAnalysis();
    const vm = selectReasoningViewModel(analysis, 'CAREER');

    expect(vm.domain).toBe('CAREER');
    expect(vm.hero.domain).toBe('CAREER');
    expect(vm.hero.title).toBe('Career & Vocational Reasoning');
    expect(vm.hero.confidence).toBe('HIGH');
    expect(vm.hero.strength).toBe('STRONG');
    expect(vm.hero.ascendantSign).toBe('Capricorn');
    expect(vm.hero.moonSign).toBe('Leo');
    expect(vm.hero.sunSign).toBe('Capricorn');
    expect(vm.hero.moonNakshatra).toBe('Magha');

    // D10 varga
    expect(vm.d10.chart).toBe('D10');
    expect(vm.d10.relationship).toBe('CONFIRMS');
    expect(vm.d10.statement).toBe('Dasamsa confirms strong 10th house status.');

    // Dasha
    expect(vm.dasha.status).toBe('AVAILABLE');
    expect(vm.dasha.periods).toHaveLength(3);
    expect(vm.dasha.md?.planet).toBe('Jupiter');
    expect(vm.dasha.ad?.planet).toBe('Saturn');
    expect(vm.dasha.pd?.planet).toBe('Mercury');

    // Transit
    expect(vm.transit.status).toBe('AVAILABLE');
    expect(vm.transit.effect).toBe('TRIGGER');

    // Qualifications
    expect(vm.qualifications).toHaveLength(1);
    expect(vm.qualifications[0].type).toBe('COMBUSTION');
    expect(vm.qualifications[0].severity).toBe('LOW');

    // Conclusion
    expect(vm.conclusion.integratedSynthesisAvailable).toBe(true);
    expect(vm.conclusion.confidence).toBe('HIGH');
    expect(vm.conclusion.strength).toBe('STRONG');

    // Chain
    expect(vm.chain).toHaveLength(5);
    expect(vm.chain[0].type).toBe('PROMISE');
    expect(vm.chain[1].type).toBe('VARGA');
    expect(vm.chain[2].type).toBe('ACTIVATION');
    expect(vm.chain[3].type).toBe('TRANSIT');
    expect(vm.chain[4].type).toBe('SYNTHESIS');
  });

  it('2. selector maps all Wealth fields correctly', () => {
    const analysis = createProductAnalysis();
    const vm = selectReasoningViewModel(analysis, 'WEALTH');

    expect(vm.domain).toBe('WEALTH');
    expect(vm.hero.domain).toBe('WEALTH');
    expect(vm.hero.title).toBe('Wealth & Asset Accumulation Reasoning');
    expect(vm.hero.confidence).toBe('HIGH');
    expect(vm.hero.strength).toBe('MODERATE');

    // D2 varga
    expect(vm.varga.chart).toBe('D2');
    expect(vm.varga.relationship).toBe('CONFIRMS');
    expect(vm.varga.statement).toBe('Hora D2 confirms liquid capital accumulation.');

    // Wealth evidence is used
    expect(vm.allEvidence.map((e) => e.id)).toEqual(['ev_wealth_1']);

    // Dasha & Transit
    expect(vm.dasha.status).toBe('AVAILABLE');
    expect(vm.transit.status).toBe('AVAILABLE');
  });

  it('3. mapEvidence preserves all fields and provenance without mutation', () => {
    const rawEvidence: ProductEvidence = {
      id: 'ev_test_1',
      title: 'Jupiter in 2nd House',
      statement: 'Jupiter occupies second bhava with benefic aspect.',
      direction: 'SUPPORT',
      role: 'PRIMARY',
      source: 'TEST_ENGINE',
      ruleId: 'RULE_JUP_2ND',
      derivedFromIds: ['ev_birth_d1']
    };

    const mapped = mapEvidence(rawEvidence);
    expect(mapped.id).toBe('ev_test_1');
    expect(mapped.title).toBe('Jupiter in 2nd House');
    expect(mapped.direction).toBe('SUPPORT');
    expect(mapped.role).toBe('PRIMARY');
    expect(mapped.source).toBe('TEST_ENGINE');
    expect(mapped.ruleId).toBe('RULE_JUP_2ND');
    expect(mapped.derivedFromIds).toEqual(['ev_birth_d1']);
    expect(mapped.provenance).toEqual({
      ruleId: 'RULE_JUP_2ND',
      derivedFromIds: ['ev_birth_d1'],
      source: 'TEST_ENGINE',
      isAvailable: true
    });
  });

  it('4. buildEvidenceGroups groups by role and direction, and guarantees ZERO evidence loss via OTHER', () => {
    const evidenceList: ProductEvidence[] = [
      {
        id: 'ev_primary_support',
        title: 'Primary Driver 1',
        statement: 'Statement 1',
        direction: 'SUPPORT',
        role: 'PRIMARY',
        source: 'CORE'
      },
      {
        id: 'ev_modifier_challenge',
        title: 'Modifier 1',
        statement: 'Statement 2',
        direction: 'CHALLENGE',
        role: 'MODIFIER',
        source: 'CORE'
      },
      {
        id: 'ev_refinement_neutral',
        title: 'Refinement 1',
        statement: 'Statement 3',
        direction: 'NEUTRAL',
        role: 'REFINEMENT',
        source: 'CORE'
      },
      {
        id: 'ev_unclassified_neutral',
        title: 'Neutral Context Item',
        statement: 'Statement 4',
        direction: 'NEUTRAL',
        role: 'NEUTRAL',
        source: 'CORE'
      },
      {
        id: 'ev_conflicting_item',
        title: 'Conflicting Factor',
        statement: 'Statement 5',
        direction: 'MIXED',
        role: 'CONFLICTING',
        source: 'CORE'
      }
    ];

    const mappedEvidence = evidenceList.map(mapEvidence);
    const groups = buildEvidenceGroups(mappedEvidence);

    // Assert that primary driver is in PRIMARY and SUPPORTING
    const primaryGroup = groups.find((g) => g.id === 'PRIMARY');
    expect(primaryGroup?.items.some((i) => i.id === 'ev_primary_support')).toBe(true);

    const supportingGroup = groups.find((g) => g.id === 'SUPPORTING');
    expect(supportingGroup?.items.some((i) => i.id === 'ev_primary_support')).toBe(true);

    // Assert modifying challenge is in MODIFIER and CHALLENGING
    const modifierGroup = groups.find((g) => g.id === 'MODIFIER');
    expect(modifierGroup?.items.some((i) => i.id === 'ev_modifier_challenge')).toBe(true);

    const challengingGroup = groups.find((g) => g.id === 'CHALLENGING');
    expect(challengingGroup?.items.some((i) => i.id === 'ev_modifier_challenge')).toBe(true);

    // Assert refinement is in REFINEMENT
    const refinementGroup = groups.find((g) => g.id === 'REFINEMENT');
    expect(refinementGroup?.items.some((i) => i.id === 'ev_refinement_neutral')).toBe(true);

    // Assert that unclassified neutral and conflicting items were caught in OTHER
    const otherGroup = groups.find((g) => g.id === 'OTHER');
    expect(otherGroup).toBeDefined();
    expect(otherGroup?.title).toBe('Additional Factors');
    expect(otherGroup?.items.some((i) => i.id === 'ev_unclassified_neutral')).toBe(true);
    expect(otherGroup?.items.some((i) => i.id === 'ev_conflicting_item')).toBe(true);

    // ZERO EVIDENCE LOSS: Every item in mappedEvidence appears in at least one group
    const allGroupedIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
    for (const item of mappedEvidence) {
      expect(allGroupedIds.has(item.id)).toBe(true);
    }
  });

  it('5. buildEvidenceGroups drops empty groups', () => {
    const evidenceList: ProductEvidence[] = [
      {
        id: 'ev_only_primary',
        title: 'Only Primary',
        statement: 'Statement',
        direction: 'SUPPORT',
        role: 'PRIMARY',
        source: 'CORE'
      }
    ];
    const groups = buildEvidenceGroups(evidenceList.map(mapEvidence));

    // Only PRIMARY and SUPPORTING should exist; MODIFIER, REFINEMENT, CHALLENGING, OTHER should be absent
    const groupIds = groups.map((g) => g.id);
    expect(groupIds).toContain('PRIMARY');
    expect(groupIds).toContain('SUPPORTING');
    expect(groupIds).not.toContain('MODIFIER');
    expect(groupIds).not.toContain('REFINEMENT');
    expect(groupIds).not.toContain('CHALLENGING');
    expect(groupIds).not.toContain('OTHER');
  });

  it('6. PARTIAL dasha renders periods without crashing', () => {
    const base = createProductAnalysis();
    const partialDashaAnalysis = createProductAnalysis({
      career: {
        ...base.career,
        activation: {
          ...base.career.activation,
          dasha: {
            status: 'PARTIAL',
            currentActivation: 'Partial dasha sequence active.',
            periods: [
              {
                level: 'MD',
                planet: 'Jupiter',
                role: 'PRIMARY',
                direction: 'SUPPORT',
                effect: 'ACTIVATES',
                evidenceIds: ['ev_1']
              }
            ]
          }
        }
      }
    });

    const vm = selectReasoningViewModel(partialDashaAnalysis, 'CAREER');
    expect(vm.dasha.status).toBe('PARTIAL');
    expect(vm.dasha.periods).toHaveLength(1);
    expect(vm.dasha.md?.planet).toBe('Jupiter');
    expect(vm.dasha.ad).toBeUndefined();
    expect(vm.dasha.pd).toBeUndefined();
  });

  it('7. UNAVAILABLE D10 does not fabricate statement', () => {
    const base = createProductAnalysis();
    const unavailableD10Analysis = createProductAnalysis({
      career: {
        ...base.career,
        d10: {
          relationship: 'UNAVAILABLE',
          statement: undefined
        }
      }
    });

    const vm = selectReasoningViewModel(unavailableD10Analysis, 'CAREER');
    expect(vm.d10.relationship).toBe('UNAVAILABLE');
    expect(vm.d10.statement).toBeUndefined();
  });

  it('8. optional AI commentary is projected when present and undefined when absent', () => {
    const analysisWithAi = createProductAnalysis();
    const vmWithAi = selectReasoningViewModel(analysisWithAi, 'CAREER');
    expect(vmWithAi.ai).toBeDefined();
    expect(vmWithAi.ai?.available).toBe(true);
    expect(vmWithAi.ai?.statement).toBe('Executive trajectory supported.');

    const analysisWithoutAi = createProductAnalysis({
      ai: undefined
    });
    const vmWithoutAi = selectReasoningViewModel(analysisWithoutAi, 'CAREER');
    expect(vmWithoutAi.ai).toBeUndefined();
  });

  it('9. Non-causal chain interpretation: chain layers represent parallel contributing evidence layers rather than a causal sequence', () => {
    const analysis = createProductAnalysis();
    const vm = selectReasoningViewModel(analysis, 'CAREER');

    // Chain contains distinct evidence layer types
    const layerTypes = vm.chain.map((node) => node.type);
    expect(layerTypes).toContain('PROMISE');
    expect(layerTypes).toContain('VARGA');
    expect(layerTypes).toContain('ACTIVATION');
    expect(layerTypes).toContain('TRANSIT');
    expect(layerTypes).toContain('SYNTHESIS');

    // Each node provides independent layer statements
    expect(vm.chain.find((n) => n.type === 'PROMISE')?.label).toBe('Natal Vocational Promise');
    expect(vm.chain.find((n) => n.type === 'VARGA')?.label).toBe('Dasamsa (D10) Varga Alignment');
    expect(vm.chain.find((n) => n.type === 'ACTIVATION')?.label).toBe('Vimshottari Dasha Activation');
    expect(vm.chain.find((n) => n.type === 'TRANSIT')?.label).toBe('Gochara Transit Triggers');
    expect(vm.chain.find((n) => n.type === 'SYNTHESIS')?.label).toBe('Integrated Vocational Conclusion');
  });

  it('10. Unique evidence count: evidenceCount is based on unique IDs and does not double-count items across multiple groups or duplicate raw items', () => {
    const duplicateEvidence: ProductEvidence[] = [
      {
        id: 'ev_unique_1',
        title: 'Primary Factor 1',
        statement: 'Statement 1',
        direction: 'CHALLENGE',
        role: 'PRIMARY',
        source: 'CORE'
      },
      {
        id: 'ev_unique_2',
        title: 'Modifying Factor 2',
        statement: 'Statement 2',
        direction: 'SUPPORT',
        role: 'MODIFIER',
        source: 'CORE'
      },
      // Duplicate of ev_unique_1 in raw array
      {
        id: 'ev_unique_1',
        title: 'Primary Factor 1 Duplicate',
        statement: 'Statement 1',
        direction: 'CHALLENGE',
        role: 'PRIMARY',
        source: 'CORE'
      }
    ];

    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        evidence: duplicateEvidence
      }
    });

    const vm = selectReasoningViewModel(analysis, 'CAREER');

    // Total unique evidence items is 2, not 3
    expect(vm.hero.evidenceCount).toBe(2);
    expect(vm.conclusion.evidenceCount).toBe(2);
    expect(vm.allEvidence).toHaveLength(2);

    // Sum of group item counts is greater because items belong to role groups and direction groups simultaneously
    const groups = vm.evidenceGroups;
    const totalGroupItems = groups.reduce((acc, g) => acc + g.items.length, 0);
    expect(totalGroupItems).toBe(4); // PRIMARY (1) + MODIFIER (1) + SUPPORTING (1) + CHALLENGING (1) = 4
    expect(vm.hero.evidenceCount).toBeLessThan(totalGroupItems);
    expect(vm.hero.evidenceCount).toBe(new Set(duplicateEvidence.map((e) => e.id)).size);
  });

  it('11. Orthogonal dimensions: preserves PRIMARY role with CHALLENGING direction without mutation and maps to both groups', () => {
    const mixedEvidence: ProductEvidence[] = [
      {
        id: 'ev_mixed_1',
        title: 'Adverse 10th Lord Placement',
        statement: '10th lord in 8th house creates structural career challenges.',
        direction: 'CHALLENGE',
        role: 'PRIMARY',
        source: 'CORE_RULES',
        ruleId: 'RULE_10TH_IN_8TH'
      }
    ];

    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        evidence: mixedEvidence
      }
    });

    const vm = selectReasoningViewModel(analysis, 'CAREER');
    expect(vm.allEvidence[0].role).toBe('PRIMARY');
    expect(vm.allEvidence[0].direction).toBe('CHALLENGE');

    // Appears in PRIMARY group
    const primaryGroup = vm.evidenceGroups.find((g) => g.id === 'PRIMARY');
    expect(primaryGroup?.items.some((i) => i.id === 'ev_mixed_1')).toBe(true);

    // Also appears in CHALLENGING group
    const challengingGroup = vm.evidenceGroups.find((g) => g.id === 'CHALLENGING');
    expect(challengingGroup?.items.some((i) => i.id === 'ev_mixed_1')).toBe(true);
  });

  it('12. Provenance is not validation: provenance availability confirms rule metadata trace without modifying deterministic verdict', () => {
    const analysisWithProvenance = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        status: 'UNFAVORABLE',
        promise: {
          status: 'UNFAVORABLE',
          confidence: 'LOW',
          strength: 'WEAK',
          statement: 'Challenging career indicators.'
        },
        evidence: [
          {
            id: 'ev_prov_1',
            title: 'Debilitated Ruler',
            statement: 'Ruler debilitated.',
            direction: 'CHALLENGE',
            role: 'PRIMARY',
            source: 'SHADBALA_RULES',
            ruleId: 'RULE_DEBILITATED_RULER',
            derivedFromIds: ['shadbala_sun']
          }
        ]
      }
    });

    const vm = selectReasoningViewModel(analysisWithProvenance, 'CAREER');

    // Provenance is available and traceable
    expect(vm.conclusion.provenanceAvailable).toBe(true);
    expect(vm.allEvidence[0].provenance.isAvailable).toBe(true);
    expect(vm.allEvidence[0].provenance.ruleId).toBe('RULE_DEBILITATED_RULER');
    expect(vm.allEvidence[0].provenance.derivedFromIds).toEqual(['shadbala_sun']);

    // Verdict, confidence, and strength are unaffected by whether provenance is verified
    expect(vm.conclusion.status).toBe('UNFAVORABLE');
    expect(vm.conclusion.confidence).toBe('LOW');
    expect(vm.conclusion.strength).toBe('WEAK');
  });

  it('13. AI explanation remains descriptive: AI commentary does not modify deterministic verdict status, confidence, strength, or evidence counts', () => {
    const baseAnalysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        promise: {
          status: 'SUPPORTED',
          confidence: 'HIGH',
          strength: 'STRONG',
          statement: 'Promising trajectory.'
        }
      },
      ai: {
        status: 'AVAILABLE',
        conclusion: 'Expansive professional horizon described by planetary periods.',
        explanation: 'Parasara Classical commentary.',
        providerInfo: {
          name: 'Gemini 1.5 Pro',
          mode: 'Deterministic Commentary'
        }
      }
    });

    const vmWithAi = selectReasoningViewModel(baseAnalysis, 'CAREER');

    // AI is projected
    expect(vmWithAi.ai?.available).toBe(true);
    expect(vmWithAi.ai?.statement).toBe('Expansive professional horizon described by planetary periods.');

    // Deterministic metrics are unchanged
    expect(vmWithAi.conclusion.status).toBe('SUPPORTED');
    expect(vmWithAi.conclusion.confidence).toBe('HIGH');
    expect(vmWithAi.conclusion.strength).toBe('STRONG');
    expect(vmWithAi.conclusion.evidenceCount).toBe(vmWithAi.allEvidence.length);
  });
});
