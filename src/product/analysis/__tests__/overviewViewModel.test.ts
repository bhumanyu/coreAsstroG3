import { describe, it, expect } from 'vitest';
import {
  selectOverviewViewModel,
  selectTopEvidence,
  selectOverviewFindings,
  selectOverviewQualifications,
  deriveOverallConfidence,
  EVIDENCE_ROLE_PRIORITY
} from '../overviewViewModel';
import { selectAllEvidence } from '../productAnalysisSelectors';
import type { ProductEvidence, ProductAnalysis } from '../productAnalysisTypes';
import { createProductAnalysis } from './testHelpers';

describe('OverviewViewModel & Selectors (P-UI-03)', () => {
  it('(1) maps career strength from promise.strength and wealth from overall.promise / status', () => {
    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        status: 'STRONGLY_SUPPORTED',
        promise: {
          status: 'STRONGLY_SUPPORTED',
          strength: 'VERY_STRONG',
          confidence: 'HIGH',
          statement: 'Exceptional executive promise.'
        }
      },
      wealth: {
        ...createProductAnalysis().wealth,
        overall: {
          status: 'STRONGLY_SUPPORTED',
          promise: 'STRONG',
          confidence: 'HIGH',
          statement: 'Solid wealth indicators.'
        }
      }
    });

    const vm = selectOverviewViewModel(analysis);

    expect(vm.career.strength).toBe('VERY_STRONG');
    expect(vm.career.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.career.confidence).toBe('HIGH');
    expect(vm.career.summary).toBe('Exceptional executive promise.');

    expect(vm.wealth.strength).toBe('STRONG');
    expect(vm.wealth.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.wealth.confidence).toBe('HIGH');
    expect(vm.wealth.summary).toBe('Solid wealth indicators.');
  });

  it('(1b) career status is undefined when not provided, avoiding conflation with strength', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      career: {
        ...base.career,
        status: undefined,
        promise: {
          ...base.career.promise,
          status: undefined,
          strength: 'VERY_STRONG'
        }
      }
    };

    const vm = selectOverviewViewModel(analysis);
    expect(vm.career.strength).toBe('VERY_STRONG');
    expect(vm.career.status).toBeUndefined();
  });

  it('(2) MD/AD/PD hierarchy preserved via dasha.current -> md/ad/pd with correct levels and AVAILABLE status', () => {
    const analysis = createProductAnalysis();
    const vm = selectOverviewViewModel(analysis);

    expect(vm.dasha.status).toBe('AVAILABLE');
    expect(vm.dasha.availability).toBe(true);
    expect(vm.dasha.currentPeriodLabel).toBe('Jupiter → Saturn → Mercury');

    expect(vm.dasha.md).toBeDefined();
    expect(vm.dasha.md?.level).toBe('MD');
    expect(vm.dasha.md?.planet).toBe('Jupiter');
    expect(vm.dasha.md?.role).toBe('PRIMARY');

    expect(vm.dasha.ad).toBeDefined();
    expect(vm.dasha.ad?.level).toBe('AD');
    expect(vm.dasha.ad?.planet).toBe('Saturn');
    expect(vm.dasha.ad?.role).toBe('MODIFIER');

    expect(vm.dasha.pd).toBeDefined();
    expect(vm.dasha.pd?.level).toBe('PD');
    expect(vm.dasha.pd?.planet).toBe('Mercury');
    expect(vm.dasha.pd?.role).toBe('REFINEMENT');

    // Hierarchy preservation
    expect(vm.dasha.periods.map((p) => p.level)).toEqual(['MD', 'AD', 'PD']);
  });

  it('(2b) derives PARTIAL dasha status when some but not all periods are present', () => {
    const base = createProductAnalysis();
    const partialAnalysis: ProductAnalysis = {
      ...base,
      dasha: {
        ...base.dasha,
        current: {
          mahadasha: base.dasha.current.mahadasha,
          antardasha: base.dasha.current.antardasha,
          pratyantardasha: undefined
        }
      }
    };

    const vm = selectOverviewViewModel(partialAnalysis);
    expect(vm.dasha.status).toBe('PARTIAL');
    expect(vm.dasha.availability).toBe(true);
    expect(vm.dasha.currentPeriodLabel).toBe('Jupiter → Saturn');
    expect(vm.dasha.periods).toHaveLength(2);
  });

  it('(2c) derives UNAVAILABLE dasha status when no periods are present', () => {
    const base = createProductAnalysis();
    const unavailAnalysis: ProductAnalysis = {
      ...base,
      dasha: {
        ...base.dasha,
        current: {
          mahadasha: undefined,
          antardasha: undefined,
          pratyantardasha: undefined
        }
      }
    };

    const vm = selectOverviewViewModel(unavailAnalysis);
    expect(vm.dasha.status).toBe('UNAVAILABLE');
    expect(vm.dasha.availability).toBe(false);
    expect(vm.dasha.currentPeriodLabel).toBe('Timing Unavailable');
    expect(vm.dasha.periods).toHaveLength(0);
  });

  it('(3) evidence direction and role preserved through selectTopEvidence with real literals', () => {
    const evidenceList: ProductEvidence[] = [
      {
        id: 'ev_neutral',
        title: 'Neutral Point',
        statement: 'Neutral factor',
        direction: 'NEUTRAL',
        role: 'NEUTRAL',
        source: 'TEST'
      },
      {
        id: 'ev_supporting',
        title: 'Supporting Point',
        statement: 'Supporting factor',
        direction: 'SUPPORT',
        role: 'SUPPORTING',
        source: 'TEST'
      },
      {
        id: 'ev_primary_1',
        title: 'Primary Driver 1',
        statement: 'Mars in Aries',
        direction: 'SUPPORT',
        role: 'PRIMARY',
        source: 'TEST'
      },
      {
        id: 'ev_challenging',
        title: 'Challenging Point',
        statement: 'Saturn obstruction',
        direction: 'CHALLENGE',
        role: 'CHALLENGING',
        source: 'TEST'
      },
      {
        id: 'ev_primary_2',
        title: 'Primary Driver 2',
        statement: 'Sun in 10th',
        direction: 'SUPPORT',
        role: 'PRIMARY',
        source: 'TEST'
      },
      {
        id: 'ev_modifier',
        title: 'Modifier Point',
        statement: 'Jupiter aspect',
        direction: 'MIXED',
        role: 'MODIFIER',
        source: 'TEST'
      }
    ];

    const top3 = selectTopEvidence(evidenceList, 3);
    expect(top3).toHaveLength(3);

    // Stably sorted: PRIMARY items first (preserving index order), then MODIFIER
    expect(top3[0].id).toBe('ev_primary_1');
    expect(top3[0].role).toBe('PRIMARY');
    expect(top3[0].direction).toBe('SUPPORT');

    expect(top3[1].id).toBe('ev_primary_2');
    expect(top3[1].role).toBe('PRIMARY');
    expect(top3[1].direction).toBe('SUPPORT');

    expect(top3[2].id).toBe('ev_modifier');
    expect(top3[2].role).toBe('MODIFIER');
    expect(top3[2].direction).toBe('MIXED');
  });

  it('(4) partial data: unavailable fields retain UNAVAILABLE/Unavailable without coercion to strength', () => {
    const analysis = createProductAnalysis({
      status: 'PARTIAL',
      career: {
        ...createProductAnalysis().career,
        promise: {
          strength: 'UNAVAILABLE',
          confidence: 'LOW',
          statement: undefined
        },
        d10: {
          relationship: 'UNAVAILABLE',
          statement: undefined
        },
        activation: {
          dasha: { status: 'UNAVAILABLE', periods: [] },
          transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
        }
      },
      wealth: {
        ...createProductAnalysis().wealth,
        overall: {
          status: 'UNAVAILABLE',
          promise: 'UNAVAILABLE',
          confidence: 'LOW',
          statement: undefined
        },
        d2: {
          relationship: 'UNAVAILABLE',
          statement: undefined
        },
        activation: {
          dasha: { status: 'UNAVAILABLE', periods: [] },
          transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
        }
      }
    });

    const vm = selectOverviewViewModel(analysis);

    // Assert that 'UNAVAILABLE' is directly preserved on the domain strength, never coerced to 'WEAK'
    expect(vm.career.strength).toBe('UNAVAILABLE');
    expect(vm.career.confidence).toBe('LOW');
    expect(vm.wealth.strength).toBe('UNAVAILABLE');
    expect(vm.wealth.confidence).toBe('LOW');

    // Confidence derivation with >=3 unavailable signals produces 'LOW'
    expect(deriveOverallConfidence(analysis)).toBe('LOW');
    expect(vm.overall.confidence).toBe('LOW');
    expect(vm.overall.status).toBe('PARTIAL');
  });

  it('(5) selectors perform no recalculation and return projections', () => {
    const analysis = createProductAnalysis();

    // Call selector multiple times
    const vm1 = selectOverviewViewModel(analysis);
    const vm2 = selectOverviewViewModel(analysis);

    // Chart metadata is projected directly
    expect(vm1.chart.ascendantSign).toBe(analysis.chart.ascendantSign);
    expect(vm1.chart.moonSign).toBe(analysis.chart.moonSign);
    expect(vm1.chart.sunSign).toBe(analysis.chart.sunSign);
    expect(vm1.chart.moonNakshatra).toBe(analysis.chart.moonNakshatra);

    // Warnings array is projected by reference
    expect(vm1.warnings).toBe(analysis.warnings);
    expect(vm2.warnings).toBe(analysis.warnings);

    // Top evidence items preserve object identity
    expect(vm1.career.topEvidence[0]).toBe(analysis.career.evidence[0]);
  });

  it('selectOverviewFindings deduplicates by evidence ID and extracts findings', () => {
    const analysis = createProductAnalysis();
    const findings = selectOverviewFindings(analysis, 5);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toHaveProperty('id');
    expect(findings[0]).toHaveProperty('title');
    expect(findings[0]).toHaveProperty('statement');
    expect(findings[0]).toHaveProperty('direction');
    expect(findings[0]).toHaveProperty('role');
    expect(findings[0]).toHaveProperty('evidenceIds');
  });

  it('selectOverviewQualifications concatenates career and wealth qualifications', () => {
    const analysis = createProductAnalysis();
    const quals = selectOverviewQualifications(analysis);

    expect(quals).toHaveLength(2);
    expect(quals[0].id).toBe('COMBUSTION');
    expect(quals[0].severity).toBe('LOW');
    expect(quals[1].id).toBe('EXPENDITURE_PRESSURE');
    expect(quals[1].severity).toBe('MEDIUM');
  });

  it('deriveOverallConfidence handles 0, 1-2, and 3+ unavailable counts', () => {
    const base = createProductAnalysis();

    // 0 unavailable -> HIGH
    expect(deriveOverallConfidence(base)).toBe('HIGH');

    // 1 unavailable -> MEDIUM
    const oneUnavail: ProductAnalysis = {
      ...base,
      career: {
        ...base.career,
        d10: { relationship: 'UNAVAILABLE' }
      }
    };
    expect(deriveOverallConfidence(oneUnavail)).toBe('MEDIUM');

    // 2 unavailable -> MEDIUM
    const twoUnavail: ProductAnalysis = {
      ...oneUnavail,
      wealth: {
        ...oneUnavail.wealth,
        d2: { relationship: 'UNAVAILABLE' }
      }
    };
    expect(deriveOverallConfidence(twoUnavail)).toBe('MEDIUM');

    // 3 unavailable -> LOW
    const threeUnavail: ProductAnalysis = {
      ...twoUnavail,
      career: {
        ...twoUnavail.career,
        activation: {
          ...twoUnavail.career.activation,
          dasha: { status: 'UNAVAILABLE', periods: [] }
        }
      }
    };
    expect(deriveOverallConfidence(threeUnavail)).toBe('LOW');
  });

  it('totalEvidenceCount reflects complete evidence index and is not capped by findings limit', () => {
    // Override with career & wealth evidence exceeding 5 items total
    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        evidence: [
          { id: 'c1', title: 'C1', statement: 'C1', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' },
          { id: 'c2', title: 'C2', statement: 'C2', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' },
          { id: 'c3', title: 'C3', statement: 'C3', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' },
          { id: 'c4', title: 'C4', statement: 'C4', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' }
        ]
      },
      wealth: {
        ...createProductAnalysis().wealth,
        evidence: [
          { id: 'w1', title: 'W1', statement: 'W1', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' },
          { id: 'w2', title: 'W2', statement: 'W2', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' },
          { id: 'w3', title: 'W3', statement: 'W3', direction: 'SUPPORT', role: 'PRIMARY', source: 'TEST' }
        ]
      }
    });

    const vm = selectOverviewViewModel(analysis);
    const allEvidence = selectAllEvidence(analysis);

    // Total evidence count matches selectAllEvidence length (4 + 3 = 7)
    expect(vm.totalEvidenceCount).toBe(allEvidence.length);
    expect(vm.totalEvidenceCount).toBe(7);

    // Findings are capped at 5
    expect(vm.findings.length).toBe(5);

    // Specifically verify totalEvidenceCount is strictly greater than findings.length
    expect(vm.totalEvidenceCount).toBeGreaterThan(vm.findings.length);
  });
});
