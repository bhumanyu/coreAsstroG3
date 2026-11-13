import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
import { ENGLISH_USER_FACING_COPY } from '../../life-analysis/userFacingInterpretation';

describe('OverviewViewModel & Selectors (P-UI-03)', () => {
  it('passes a non-default copy provider through the overview selector', () => {
    const copy = {
      ...ENGLISH_USER_FACING_COPY,
      combinedSummary: () => 'Custom combined conclusion.'
    };

    const vm = selectOverviewViewModel(createProductAnalysis(), copy);

    expect(vm.overall.summary).toBe('Custom combined conclusion.');
  });

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
        },
        synthesis: {
          statement: 'This diagnostic statement must not be presented.'
        }
      },
      wealth: {
        ...createProductAnalysis().wealth,
        overall: {
          status: 'STRONGLY_SUPPORTED',
          promise: 'STRONG',
          confidence: 'HIGH',
          statement: 'Solid wealth indicators.'
        },
        synthesis: {
          statement: 'This diagnostic statement must not be presented.'
        }
      }
    });

    const vm = selectOverviewViewModel(analysis);

    expect(vm.career.strength).toBe('VERY_STRONG');
    expect(vm.career.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.career.confidence).toBe('HIGH');
    expect(vm.career.summary).toContain('Not assessed');

    expect(vm.wealth.strength).toBe('STRONG');
    expect(vm.wealth.status).toBe('STRONGLY_SUPPORTED');
    expect(vm.wealth.confidence).toBe('HIGH');
    expect(vm.wealth.summary).toContain('Not assessed');
  });

  it('builds summaries and all assessment dimensions from structured synthesis fields', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        synthesis: {
          ...base.career.synthesis,
          finalStatus: 'MIXED',
          finalDirection: 'MIXED',
          finalStrength: 'MIXED',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG',
          dashaDirection: 'SUPPORT',
          timingStatus: 'NOT_ACTIVE',
          confidence: 'HIGH'
        }
      },
      wealth: {
        ...base.wealth,
        synthesis: {
          overallStatus: 'MIXED',
          promiseStatus: 'MIXED',
          dimensionStatuses: {
            ACCUMULATION: 'STRONG',
            GAINS: 'CHALLENGED',
            FORTUNE: 'MIXED',
            SPECULATION: 'INSUFFICIENT_DATA'
          },
          confidence: 'MEDIUM',
          natalStrength: 'STRONG',
          dashaDirection: 'SUPPORT',
          timingStatus: 'INSUFFICIENT_DATA'
        }
      }
    });

    const vm = selectOverviewViewModel(analysis);
    for (const domain of [vm.career, vm.wealth]) {
      expect(domain.assessment.foundation.label).not.toBe('Not assessed');
      expect(domain.assessment.dashaSupport.label).not.toBe('Not assessed');
      expect(domain.assessment.timing.label).not.toBe('Not assessed');
      expect(domain.assessment.confidence.label).not.toBe('Not assessed');
    }
    expect(vm.career.summary).not.toContain('MIXED (');
    expect(vm.career.summary).not.toContain('NOT_ACTIVE');
    expect(JSON.stringify(vm.career.assessment)).not.toContain('NOT_ACTIVE');
    expect(vm.wealth.summary).not.toContain('MIXED (');
    expect(vm.wealth.summary).not.toContain('NOT_ACTIVE');
    expect(JSON.stringify(vm.wealth.assessment)).not.toContain('NOT_ACTIVE');
    expect(vm.overall.summary).not.toContain('MIXED (');
    expect(vm.overall.summary).not.toContain('NOT_ACTIVE');
    expect(JSON.stringify(vm.overall.assessment)).not.toContain('NOT_ACTIVE');
    expect(vm.wealth.assessment.details).toHaveLength(4);
    expect(vm.wealth.assessment.details.map((detail) => detail.label)).toEqual([
      'Accumulation',
      'Gains',
      'Fortune',
      'Speculation'
    ]);
    expect(vm.overall.summary).toContain('Mixed career outlook');
    expect(vm.overall.summary).not.toContain('Foundation');
    expect(vm.overall.summary).not.toContain('confidence');
  });

  it('keeps domain-specific summaries detailed while the overall conclusion stays concise', () => {
    const base = createProductAnalysis();
    const analysis = createProductAnalysis({
      career: {
        ...base.career,
        synthesis: {
          ...base.career.synthesis,
          finalStatus: 'MIXED',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG',
          dashaDirection: 'NEUTRAL',
          timingStatus: 'NOT_ACTIVE',
          confidence: 'MEDIUM'
        }
      },
      wealth: {
        ...base.wealth,
        synthesis: {
          ...base.wealth.synthesis,
          overallStatus: 'STRONG',
          promiseStatus: 'STRONG'
        }
      }
    });

    const vm = selectOverviewViewModel(analysis);
    expect(vm.overall.summary).toBe('Mixed career outlook; Strong wealth outlook.');
    expect(vm.career.summary).toContain('Mixed outlook');
    expect(vm.career.summary).toContain('Strong foundation with mixed indications');
    expect(vm.career.assessment.foundation.label).toBe('Strong foundation with mixed indications');
    expect(vm.career.assessment.dashaSupport.label).toBe('Neutral');
    expect(vm.career.assessment.timing.label).toBe('No clear activation identified');
    expect(vm.career.assessment.confidence.label).toBe('Medium confidence');
    expect(JSON.stringify(vm.career.assessment)).not.toMatch(/MIXED\s*\(|NOT_ACTIVE/);
  });

  it('does not use diagnostic synthesis statements in product view models', () => {
    const sourceDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const viewModelFiles = [
      'analysis/overviewViewModel.ts',
      'analysis/careerViewModel.ts',
      'analysis/wealthViewModel.ts',
      'analysis/reasoningViewModel.ts'
    ];
    for (const file of viewModelFiles) {
      const source = readFileSync(join(sourceDirectory, file), 'utf8');
      expect(source, file).not.toMatch(/synthesis(?:\?\.|\.)statement/);
    }
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

    // Top evidence items project canonical evidence IDs
    expect(vm1.career.topEvidence[0].id).toBe(analysis.career.evidence[0].id);
    expect(vm1.career.topEvidence[0].technical.statement).toBe(analysis.career.evidence[0].statement);
  });

  it('selectOverviewFindings deduplicates by evidence ID and extracts findings', () => {
    const analysis = createProductAnalysis();
    const findings = selectOverviewFindings(analysis, 5);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toHaveProperty('id');
    expect(findings[0]).toHaveProperty('title');
    expect(findings[0]).toHaveProperty('explanation');
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

  it('deriveOverallConfidence excludes intentionally unavailable D2 from the confidence-bearing layer count', () => {
    const base = createProductAnalysis();
    const d2Unavailable: ProductAnalysis = {
      ...base,
      wealth: {
        ...base.wealth,
        d2: { relationship: 'UNAVAILABLE' }
      }
    };

    // D2 is optional/unvalidated and does not reduce confidence.
    expect(deriveOverallConfidence(d2Unavailable)).toBe('HIGH');

    // One validated layer unavailable -> MEDIUM.
    const oneUnavail: ProductAnalysis = {
      ...d2Unavailable,
      career: {
        ...d2Unavailable.career,
        d10: { relationship: 'UNAVAILABLE' }
      }
    };
    expect(deriveOverallConfidence(oneUnavail)).toBe('MEDIUM');

    // Two validated layers unavailable -> MEDIUM.
    const twoUnavail: ProductAnalysis = {
      ...oneUnavail,
      career: {
        ...oneUnavail.career,
        activation: {
          ...oneUnavail.career.activation,
          dasha: { status: 'UNAVAILABLE', periods: [] }
        }
      }
    };
    expect(deriveOverallConfidence(twoUnavail)).toBe('MEDIUM');

    // Three validated layers unavailable -> LOW.
    const threeUnavail: ProductAnalysis = {
      ...twoUnavail,
      wealth: {
        ...twoUnavail.wealth,
        activation: {
          ...twoUnavail.wealth.activation,
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
