import { describe, it, expect } from 'vitest';
import {
  selectReasoningViewModel,
  selectReasoningOverview,
  selectDedupedEvidence,
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

    // Assert that primary driver is in PRIMARY
    const primaryGroup = groups.find((g) => g.id === 'PRIMARY');
    expect(primaryGroup?.items.some((i) => i.id === 'ev_primary_support')).toBe(true);

    // Assert modifying challenge is in MODIFIER
    const modifierGroup = groups.find((g) => g.id === 'MODIFIER');
    expect(modifierGroup?.items.some((i) => i.id === 'ev_modifier_challenge')).toBe(true);

    // Assert refinement is in REFINEMENT
    const refinementGroup = groups.find((g) => g.id === 'REFINEMENT');
    expect(refinementGroup?.items.some((i) => i.id === 'ev_refinement_neutral')).toBe(true);

    // Assert neutral and conflicting items are in their respective role groups
    const neutralGroup = groups.find((g) => g.id === 'NEUTRAL');
    expect(neutralGroup?.items.some((i) => i.id === 'ev_unclassified_neutral')).toBe(true);

    const conflictingGroup = groups.find((g) => g.id === 'CONFLICTING');
    expect(conflictingGroup?.items.some((i) => i.id === 'ev_conflicting_item')).toBe(true);

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

    // Only PRIMARY should exist; SUPPORTING, MODIFIER, REFINEMENT, CHALLENGING, CONFLICTING, NEUTRAL, OTHER should be absent
    const groupIds = groups.map((g) => g.id);
    expect(groupIds).toEqual(['PRIMARY']);
    expect(groupIds).not.toContain('SUPPORTING');
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

    // Sum of group item counts equals unique items since each item belongs to exactly one role-based group
    const groups = vm.evidenceGroups;
    const totalGroupItems = groups.reduce((acc, g) => acc + g.items.length, 0);
    expect(totalGroupItems).toBe(2); // PRIMARY (1) + MODIFIER (1) = 2
    expect(vm.hero.evidenceCount).toBe(totalGroupItems);
    expect(vm.hero.evidenceCount).toBe(new Set(duplicateEvidence.map((e) => e.id)).size);
  });

  it('11. Orthogonal dimensions: preserves PRIMARY role with CHALLENGING direction without mutation and maps to its role group', () => {
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

    // Appears in PRIMARY group based on canonical role
    const primaryGroup = vm.evidenceGroups.find((g) => g.id === 'PRIMARY');
    expect(primaryGroup?.items.some((i) => i.id === 'ev_mixed_1')).toBe(true);

    // Direction is preserved on the item itself rather than splitting into multiple groups
    expect(primaryGroup?.items[0].direction).toBe('CHALLENGE');
    const challengingRoleGroup = vm.evidenceGroups.find((g) => g.id === 'CHALLENGING');
    expect(challengingRoleGroup).toBeUndefined();
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

  it('14. selectReasoningOverview projects both Career and Wealth conclusions, including Career-available / Wealth-UNAVAILABLE partial case (§32, §50)', () => {
    const analysisPartial = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        status: 'FAVORABLE',
        promise: {
          status: 'SUPPORTED',
          confidence: 'HIGH',
          strength: 'STRONG',
          statement: 'Promising trajectory.'
        }
      },
      wealth: {
        ...createProductAnalysis().wealth,
        overall: {
          status: 'UNAVAILABLE',
          promise: 'UNAVAILABLE',
          confidence: 'LOW'
        }
      }
    });

    const overview = selectReasoningOverview(analysisPartial);

    // Career is available with correct metrics
    expect(overview.career.availability).toBe('AVAILABLE');
    expect(overview.career.status).toBe('FAVORABLE');
    expect(overview.career.confidence).toBe('HIGH');
    expect(overview.career.strength).toBe('STRONG');
    expect(overview.career.headline).toBe('Strong Career Outlook');

    // Wealth is explicitly UNAVAILABLE, never fabricating a verdict or headline
    expect(overview.wealth.availability).toBe('UNAVAILABLE');
    expect(overview.wealth.status).toBe('UNAVAILABLE');
    expect(overview.wealth.confidence).toBe('UNAVAILABLE');
    expect(overview.wealth.headline).toBeUndefined();
    expect(overview.wealth.statement).toBeUndefined();
  });

  it('15. Promise vs conclusion vs confidence preserved separately for a fixture with promise=STRONG, status=MIXED, confidence=HIGH (§37)', () => {
    const complexAnalysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        status: 'MIXED',
        promise: {
          status: 'SUPPORTED',
          confidence: 'HIGH',
          strength: 'STRONG',
          statement: 'Strong vocational promise counterbalanced by active friction.'
        }
      }
    });

    const vm = selectReasoningViewModel(complexAnalysis, 'CAREER');

    // Separate fields preserved
    expect(vm.hero.strength).toBe('STRONG');
    expect(vm.hero.status).toBe('MIXED');
    expect(vm.hero.confidence).toBe('HIGH');
    expect(vm.conclusion.strength).toBe('STRONG');
    expect(vm.conclusion.status).toBe('MIXED');
    expect(vm.conclusion.confidence).toBe('HIGH');
  });

  it('16. Evidence direction and role independence: direction=CHALLENGE + role=PRIMARY and direction=SUPPORT + role=MODIFIER are preserved (§38)', () => {
    const mixedEvidence: ProductEvidence[] = [
      {
        id: 'ev_pri_chal',
        title: 'Primary Challenge',
        statement: 'Debilitated 10th lord acts as primary obstacle.',
        direction: 'CHALLENGE',
        role: 'PRIMARY',
        source: 'CAREER_ENGINE'
      },
      {
        id: 'ev_mod_sup',
        title: 'Modifying Support',
        statement: 'Benefic aspect modifies the impediment favorably.',
        direction: 'SUPPORT',
        role: 'MODIFIER',
        source: 'CAREER_ENGINE'
      }
    ];

    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        evidence: mixedEvidence
      }
    });

    const vm = selectReasoningViewModel(analysis, 'CAREER');
    const primaryGroup = vm.evidenceGroups.find((g) => g.id === 'PRIMARY');
    const modifierGroup = vm.evidenceGroups.find((g) => g.id === 'MODIFIER');

    expect(primaryGroup?.items[0].id).toBe('ev_pri_chal');
    expect(primaryGroup?.items[0].direction).toBe('CHALLENGE');
    expect(primaryGroup?.items[0].role).toBe('PRIMARY');

    expect(modifierGroup?.items[0].id).toBe('ev_mod_sup');
    expect(modifierGroup?.items[0].direction).toBe('SUPPORT');
    expect(modifierGroup?.items[0].role).toBe('MODIFIER');
  });

  it('17. selectDedupedEvidence deduplicates evidence by ID across career and wealth without loss (§39)', () => {
    const sharedEvidence: ProductEvidence = {
      id: 'ev_shared_jupiter',
      title: 'Exalted Jupiter in 1st',
      statement: 'Jupiter provides blessing to both career and wealth.',
      direction: 'SUPPORT',
      role: 'PRIMARY',
      source: 'CORE'
    };

    const careerOnlyEvidence: ProductEvidence = {
      id: 'ev_career_mars',
      title: 'Mars in 10th',
      statement: 'Mars strengthens executive leadership.',
      direction: 'SUPPORT',
      role: 'SUPPORTING',
      source: 'CAREER'
    };

    const wealthOnlyEvidence: ProductEvidence = {
      id: 'ev_wealth_venus',
      title: 'Venus in 2nd',
      statement: 'Venus enhances financial accumulation.',
      direction: 'SUPPORT',
      role: 'SUPPORTING',
      source: 'WEALTH'
    };

    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        evidence: [sharedEvidence, careerOnlyEvidence]
      },
      wealth: {
        ...createProductAnalysis().wealth,
        evidence: [sharedEvidence, wealthOnlyEvidence]
      }
    });

    const deduped = selectDedupedEvidence(analysis);
    expect(deduped).toHaveLength(3);
    expect(deduped.map((e) => e.id)).toEqual(['ev_shared_jupiter', 'ev_career_mars', 'ev_wealth_venus']);
  });

  it('18. D10/D2 handles CONFIRMS, PARTIALLY_CONFIRMS, MODIFIES, CONFLICTS, and UNAVAILABLE without fabricated statements (§42, §43)', () => {
    const relationships = ['CONFIRMS', 'PARTIALLY_CONFIRMS', 'MODIFIES', 'CONFLICTS', 'UNAVAILABLE'] as const;

    for (const rel of relationships) {
      const analysis = createProductAnalysis({
        career: {
          ...createProductAnalysis().career,
          d10: {
            relationship: rel,
            statement: rel === 'UNAVAILABLE' ? undefined : `${rel} career trajectory.`
          }
        }
      });

      const vm = selectReasoningViewModel(analysis, 'CAREER');
      expect(vm.varga?.relationship).toBe(rel);
      if (rel === 'UNAVAILABLE') {
        expect(vm.varga?.statement).toBeUndefined();
      } else {
        expect(vm.varga?.statement).toBe(`${rel} career trajectory.`);
      }
    }
  });

  it('19. Dasha MD -> AD -> PD chronological order is strictly preserved (§41)', () => {
    const periods: ProductDashaPeriod[] = [
      {
        level: 'MD',
        planet: 'Jupiter',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        effect: 'ACTIVATES',
        evidenceIds: [],
        statement: 'Jupiter MD'
      },
      {
        level: 'AD',
        planet: 'Saturn',
        role: 'MODIFIER',
        direction: 'CHALLENGE',
        effect: 'DELAYS',
        evidenceIds: [],
        statement: 'Saturn AD'
      },
      {
        level: 'PD',
        planet: 'Mercury',
        role: 'REFINEMENT',
        direction: 'SUPPORT',
        effect: 'FACILITATES',
        evidenceIds: [],
        statement: 'Mercury PD'
      }
    ];

    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        activation: {
          ...createProductAnalysis().career.activation,
          dasha: {
            status: 'AVAILABLE',
            periods
          }
        }
      }
    });

    const vm = selectReasoningViewModel(analysis, 'CAREER');
    expect(vm.dasha?.periods.map((p) => p.level)).toEqual(['MD', 'AD', 'PD']);
    expect(vm.dasha?.periods.map((p) => p.planet)).toEqual(['Jupiter', 'Saturn', 'Mercury']);
  });
});
