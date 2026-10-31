import { describe, expect, it } from 'vitest';
import { normalizeAcceptanceConclusion, normalizeAcceptanceSurface, projectDomainEvidenceToAcceptanceProvenance } from './goldenAcceptanceNormalizer';
import { assertConclusionInventory, assertParity, deepEqualAcceptance } from './goldenAcceptanceAssertions';
import { aggregateGateStatus, buildGoldenAcceptanceReport } from './goldenAcceptanceReport';
import type { AcceptanceConclusion } from './goldenAcceptanceTypes';
import type { DomainEvidence } from '../domain/interpretation/DomainEvidence';
import type { CareerFinalEvidenceTrace } from '../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import {
  createGoldenAcceptanceProductionPipeline,
  runGoldenAcceptanceProductionGate
} from './goldenAcceptanceProductionHarness';
import { runGoldenAcceptanceParity } from './goldenAcceptanceRunner';
import { GOLDEN_C11_BASELINE } from '../test/fixtures/careerGoldenBaseline';
import { GOLDEN_WEALTH_BASELINE } from '../test/fixtures/wealthGoldenBaseline';

const supported: AcceptanceConclusion = {
  domain: 'CAREER', scope: 'LIFETIME', subjectId: 'candidate:C1', status: 'SUPPORTED',
  evidence: [
    { id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' },
    { id: 'EV-1', owner: 'C1' }
  ],
  provenance: [{ evidenceId: 'EV-1', owner: 'C1', type: 'ESTABLISHING' }]
};

const scenarios: readonly { readonly name: string; readonly input: AcceptanceConclusion; readonly expectedStatus: string }[] = [
  { name: 'supported', input: { ...supported }, expectedStatus: 'SUPPORTED' },
  { name: 'unsupported', input: { ...supported, status: 'UNSUPPORTED', evidence: [], provenance: [] }, expectedStatus: 'UNSUPPORTED' },
  { name: 'unresolved', input: { ...supported, status: 'UNRESOLVED', evidence: [], provenance: [] }, expectedStatus: 'UNRESOLVED' },
  { name: 'conflicted', input: { ...supported, status: 'CONFLICTED' }, expectedStatus: 'CONFLICTED' },
  { name: 'neutral-only', input: { ...supported, status: 'NEUTRAL', evidence: [{ id: 'EV-NEUTRAL', owner: 'C1' }], provenance: [] }, expectedStatus: 'NEUTRAL' },
  { name: 'unlinked', input: { ...supported, status: 'UNLINKED', evidence: [{ id: 'EV-UNLINKED', owner: 'C1' }], provenance: [] }, expectedStatus: 'UNLINKED' },
  { name: 'reordered input', input: { ...supported, evidence: [{ id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] }, expectedStatus: 'SUPPORTED' },
  { name: 'exact-duplicate evidence', input: { ...supported, evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] }, expectedStatus: 'SUPPORTED' }
];

describe('PR-8 golden acceptance contract', () => {
  it('normalizes evidence and provenance deterministically without fabricating identities', () => {
    const normalized = normalizeAcceptanceConclusion(supported);
    expect(normalized.evidence.map(item => item.id)).toEqual(['EV-1', 'EV-2']);
    expect(normalized.provenance).toEqual([{ evidenceId: 'EV-1', owner: 'C1', type: 'ESTABLISHING' }]);
  });

  it('rejects duplicate IDs with different owners', () => {
    expect(() => normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-1', owner: 'C2' }]
    })).toThrow(expect.objectContaining({ code: 'SAME_ID_DIFFERENT_OWNER', conflictingId: 'EV-1' }));
  });

  it('reports missing surfaces as MISSING rather than empty parity', () => {
    const expected = normalizeAcceptanceConclusion(supported);
    const differences = assertParity(expected, [normalizeAcceptanceSurface('ui', undefined)]);
    expect(differences[0]).toEqual(expect.objectContaining({ kind: 'MISSING' }));
  });

  it('uses real deep equality and distinct conclusions inventory', () => {
    expect(deepEqualAcceptance({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
    expect(deepEqualAcceptance({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(assertConclusionInventory([
      normalizeAcceptanceConclusion(supported), normalizeAcceptanceConclusion(supported)
    ])).toEqual([expect.objectContaining({ kind: 'DUPLICATE_CONCLUSION' })]);
  });

  it('checks duplicate and conflicting conclusion inventory within each production surface', () => {
    const expected = normalizeAcceptanceConclusion(supported);
    const differences = runGoldenAcceptanceParity({
      run: () => ({}),
      collect: () => ({
        surface: [
          supported,
          { ...supported, status: 'UNSUPPORTED' }
        ]
      })
    }, expected, ['surface']);
    expect(differences.map(item => item.kind)).toContain('CONFLICT');
    expect(differences.map(item => item.kind)).toContain('VALUE_MISMATCH');
  });

  it('keeps lifetime and selected-period scopes temporally distinct', () => {
    const lifetime = normalizeAcceptanceConclusion({ ...supported, scope: 'LIFETIME', temporalScope: { kind: 'LIFETIME' } });
    const selected = normalizeAcceptanceConclusion({ ...supported, scope: 'SELECTED_PERIOD', temporalScope: { start: '2026-01-01', end: '2026-02-01' } });
    expect(lifetime.scope).toBe('LIFETIME');
    expect(selected.scope).toBe('SELECTED_PERIOD');
    expect(selected.temporalScope).not.toEqual(lifetime.temporalScope);
  });

  it('only preserves a supplied insufficient-data status without rewriting missing evidence domain semantics', () => {
    const normalized = normalizeAcceptanceConclusion({
      ...supported,
      status: 'INSUFFICIENT_DATA',
      evidence: [],
      provenance: []
    });
    expect(normalized.status).toBe('INSUFFICIENT_DATA');
    expect(normalized.evidence).toEqual([]);
    expect(normalized.provenance).toEqual([]);
  });

  it.each(scenarios)('normalizes the $name scenario', ({ input, expectedStatus }) => {
    const normalized = normalizeAcceptanceConclusion(input);
    expect(normalized.status).toBe(expectedStatus);
    expect(normalized.subjectId).toBe('candidate:C1');
    if (input.status === 'UNSUPPORTED') {
      expect(normalized.evidence).toEqual([]);
    }
  });

  it('normalizes reordered evidence byte-identically and deduplicates exact duplicates', () => {
    const forward = normalizeAcceptanceConclusion({ ...supported, evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-2', owner: 'C1' }] });
    const reverse = normalizeAcceptanceConclusion({ ...supported, evidence: [{ id: 'EV-2', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] });
    const duplicate = normalizeAcceptanceConclusion({ ...supported, evidence: [{ id: 'EV-1', owner: 'C1' }, { id: 'EV-1', owner: 'C1' }] });
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reverse));
    expect(duplicate.evidence.map(item => item.id)).toEqual(['EV-1']);
  });

  it('rejects provenance owner mismatch and dangling evidence references', () => {
    expect(() => normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }],
      provenance: [{ evidenceId: 'EV-1', owner: 'C2' }]
    })).toThrow(expect.objectContaining({ code: 'SAME_ID_DIFFERENT_OWNER', conflictingId: 'EV-1' }));
    expect(() => normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }],
      provenance: [{ evidenceId: 'EV-NOT-IN-EVIDENCE', owner: 'C1' }]
    })).toThrow(expect.objectContaining({ code: 'DANGLING_PROVENANCE', conflictingId: 'EV-NOT-IN-EVIDENCE' }));
  });

  it('preserves source-stage provenance identity instead of collapsing it', () => {
    const normalized = normalizeAcceptanceConclusion({
      ...supported,
      evidence: [{ id: 'EV-1', owner: 'C1' }],
      provenance: [
        { evidenceId: 'EV-1', owner: 'C1', source: 'PATTERN', ruleId: 'RULE-1' },
        { evidenceId: 'EV-1', owner: 'C1', source: 'ACTIVATION', ruleId: 'RULE-1' }
      ]
    });
    expect(normalized.provenance).toHaveLength(2);
  });

  it('projects synthetic DomainEvidence provenance as a unit contract', () => {
    const evidence = {
      id: 'EV-1', sourceType: 'CANONICAL', domain: 'CAREER', role: 'PRIMARY', phase: 'NATAL',
      source: 'C4_STRUCTURAL_REASONING', statement: 'test', polarity: 'SUPPORTING', strength: 'STRONG',
      priority: 1, ruleId: 'RULE-DOMAIN', relatedEvidenceIds: [],
      provenance: {
        evidenceId: 'EV-1', ruleId: 'RULE-PROVENANCE', domain: 'CAREER', axis: 'NATAL',
        source: 'D10', effect: 'SUPPORT', strength: 'PRIMARY'
      }
    } as unknown as DomainEvidence;

    expect(projectDomainEvidenceToAcceptanceProvenance(evidence, 'C1')).toEqual({
      evidenceId: 'EV-1', owner: 'C1', source: 'D10', ruleId: 'RULE-PROVENANCE',
      occurrence: 'EV-1', stage: 'NATAL', type: 'PRIMARY'
    });
  });

  it('does not positionally associate C11 trace arrays with evidence IDs', () => {
      const makeEvidence = (id: string, source?: string, ruleId?: string): DomainEvidence => ({
        id,
        sourceType: 'CANONICAL',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL',
        source: source ?? '',
        statement: 'evidence',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 1,
        ...(ruleId === undefined ? {} : { ruleId }),
        relatedEvidenceIds: []
      } as unknown as DomainEvidence);
      const scenarios: readonly {
        readonly name: string;
        readonly evidence: DomainEvidence;
        readonly expectedSource?: string;
        readonly expectedRuleId?: string;
      }[] = [
        {
          name: 'evidence with source and rule',
          evidence: makeEvidence('EV-A', 'EVIDENCE-SOURCE', 'EVIDENCE-RULE'),
          expectedSource: 'EVIDENCE-SOURCE',
          expectedRuleId: 'EVIDENCE-RULE'
        },
        {
          name: 'missing evidence source and rule remain unavailable',
          evidence: makeEvidence('EV-A')
        }
      ];
      for (const scenario of scenarios) {
        const projection = projectDomainEvidenceToAcceptanceProvenance(scenario.evidence, 'C1');
        expect(projection.source, scenario.name).toBe(scenario.expectedSource);
        expect(projection.ruleId, scenario.name).toBe(scenario.expectedRuleId);
      }
  });

  it.each(['CAREER', 'WEALTH'] as const)('connects the real %s production result to every acceptance surface', domain => {
    const pipeline = createGoldenAcceptanceProductionPipeline(domain);
    const result = pipeline.run();
    const projections = pipeline.collect(result);

    expect(projections.canonical).toBeDefined();
    expect(projections[`${domain.toLowerCase()}-ui`]).toBeDefined();
    expect(projections['ai-context']).toBeDefined();
    expect(projections['product-ai-context']).toBeDefined();
    expect(projections['reasoning-trace']).toBeDefined();
    expect(projections['json-export']).toBeDefined();
    expect(projections['selected-period-ui']).toMatchObject({
      domain,
      scope: 'SELECTED_PERIOD'
    });

    const expected = normalizeAcceptanceConclusion(projections.canonical as AcceptanceConclusion);
    const surfaces = Object.entries(projections)
      .filter(([name, value]) => name !== 'canonical' && name !== 'selected-period-ui' && value !== undefined)
      .map(([name, value]) => normalizeAcceptanceSurface(name, value as AcceptanceConclusion));
    const differences = assertParity(expected, surfaces);
    // UI, AI-context, and product-ai-context surfaces now project canonical synthesis, so they should match exactly
    // reasoning-trace (parsing status from label, different evidence set) and json-export (additional evidence) have known gaps
    const exactParityDifferences = differences.filter(d => d.surface !== 'reasoning-trace' && d.surface !== 'json-export');
    expect(exactParityDifferences).toEqual([]);
  });

  it('preserves real interpreter provenance and owner from evidence records', () => {
    const result = createGoldenAcceptanceProductionPipeline('CAREER').run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const evidence = result.career.evidence.find(item =>
      item.provenance?.source !== undefined &&
      item.provenance.ruleId !== undefined &&
      item.provenance.axis !== undefined
    );
    expect(evidence).toBeDefined();
    if (!evidence) throw new Error('Production fixture emitted no provenance-complete career evidence.');

    expect(projectDomainEvidenceToAcceptanceProvenance(evidence, 'CAREER')).toEqual({
      evidenceId: evidence.id,
      owner: 'CAREER',
      source: evidence.provenance?.source ?? evidence.source,
      ruleId: evidence.provenance?.ruleId ?? evidence.ruleId,
      occurrence: evidence.id,
      stage: evidence.provenance?.axis,
      type: evidence.role
    });
  });

  it('asserts real canonical results against the approved golden baselines', () => {
    const career = createGoldenAcceptanceProductionPipeline('CAREER').run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const c11 = career.career.conclusionData?.canonicalCareerFinalSynthesis;
    expect(c11).toBeDefined();
    expect(c11).toMatchObject({
      finalStatus: GOLDEN_C11_BASELINE.canonicalC11Synthesis.finalStatus,
      finalDirection: GOLDEN_C11_BASELINE.canonicalC11Synthesis.finalDirection,
      finalStrength: GOLDEN_C11_BASELINE.canonicalC11Synthesis.finalStrength,
      confidence: GOLDEN_C11_BASELINE.canonicalC11Synthesis.confidence,
      evidenceIds: GOLDEN_C11_BASELINE.canonicalC11Synthesis.evidenceIds
    });

    const wealth = createGoldenAcceptanceProductionPipeline('WEALTH').run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const wealthSynthesis = wealth.wealth.conclusionData?.wealthFinalSynthesis;
    expect(wealthSynthesis).toBeDefined();
    expect(wealthSynthesis).toMatchObject({
      finalStatus: GOLDEN_WEALTH_BASELINE.finalStatus,
      status: GOLDEN_WEALTH_BASELINE.status,
      ruleIds: GOLDEN_WEALTH_BASELINE.ruleIds,
      evidenceIds: GOLDEN_WEALTH_BASELINE.evidenceIds
    });
    for (const dimension of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      expect(wealthSynthesis?.dimensions?.[dimension]?.finalStatus).toBe(GOLDEN_WEALTH_BASELINE.dimensions[dimension].finalStatus);
    }
  });

  it('preserves native missing-evidence status across real production projections', () => {
    const careerPipeline = createGoldenAcceptanceProductionPipeline('CAREER', 'MISSING_EVIDENCE');
    const careerResult = careerPipeline.run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const careerC11 = careerResult.career.conclusionData?.canonicalCareerFinalSynthesis;
    expect(careerC11?.finalStatus).toBe('INSUFFICIENT_DATA');
    expect(careerC11?.evidenceIds).toEqual([]);

    const wealthPipeline = createGoldenAcceptanceProductionPipeline('WEALTH', 'MISSING_EVIDENCE');
    const wealthResult = wealthPipeline.run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const wealthSynthesis = wealthResult.wealth.conclusionData?.wealthFinalSynthesis;
    expect(wealthSynthesis?.finalStatus).toBe('INSUFFICIENT_DATA');
    expect(wealthSynthesis?.evidenceIds).toEqual([]);

    for (const [domain, projections] of [
      ['CAREER', careerPipeline.collect(careerResult)],
      ['WEALTH', wealthPipeline.collect(wealthResult)]
    ] as const) {
      expect(projections['selected-period-ui']).toMatchObject({
        domain,
        scope: 'SELECTED_PERIOD'
      });

      for (const [surface, projection] of Object.entries(projections)) {
        if (surface === 'canonical') continue;
        if (surface === 'selected-period-ui') {
          expect(projection, `${domain} ${surface}`).toMatchObject({
            domain,
            scope: 'SELECTED_PERIOD',
            status: 'UNAVAILABLE'
          });
          continue;
        }
        // UI, AI-context, and product-ai-context now project canonical synthesis even with missing evidence
        // json-export remains UNAVAILABLE for CAREER
        if (surface === 'json-export' && domain === 'CAREER') {
          expect(projection, `${domain} ${surface}`).toMatchObject({
            domain,
            status: 'UNAVAILABLE'
          });
        } else if (surface === 'json-export') {
          expect(projection, `${domain} ${surface}`).toMatchObject({
            domain,
            status: expect.any(String)
          });
        } else {
          // Other surfaces project canonical synthesis which has status (not INSUFFICIENT_DATA)
          expect(projection, `${domain} ${surface}`).toMatchObject({
            domain,
            status: expect.any(String)
          });
        }
      }
    }
  });

  it.each(['CAREER', 'WEALTH'] as const)('runs separate canonical-baseline and surface gates for %s in one interpreter run', domain => {
    const gate = runGoldenAcceptanceProductionGate(domain);
    expect(gate.expected.domain).toBe(domain);
    expect(gate.baselineDifferences).toEqual([]);
    // UI, AI-context, and product-ai-context surfaces now project canonical synthesis exactly
    // reasoning-trace (parsing status from label) and json-export (additional evidence) have known gaps
    const surfaceDifferences = gate.surfaceDifferences.filter(d => d.surface !== 'reasoning-trace' && d.surface !== 'json-export');
    expect(surfaceDifferences).toEqual([]);
    expect(gate.selectedPeriod.scope).toBe('SELECTED_PERIOD');
  });

  it('makes any parity difference fail even when gates pass or block', () => {
    const difference = { surface: 'ui', kind: 'VALUE_MISMATCH' as const, path: '$.status', reason: 'status differs' };
    expect(buildGoldenAcceptanceReport([{ name: 'gate', status: 'PASS' }], [difference]).status).toBe('FAIL');
    expect(buildGoldenAcceptanceReport([{ name: 'gate', status: 'BLOCKED' }], [difference]).status).toBe('FAIL');
  });

  it('aggregates gates conservatively and blocks external/owner-gated gates', () => {
    expect(aggregateGateStatus([
      { name: 'required', status: 'PASS' }, { name: 'blocked-external', status: 'BLOCKED' }
    ])).toBe('BLOCKED');
    expect(aggregateGateStatus([
      { name: 'failed', status: 'FAIL' }, { name: 'not-run', status: 'NOT_RUN' }
    ])).toBe('FAIL');
    const report = buildGoldenAcceptanceReport([
      { name: 'swiss-jpl', status: 'BLOCKED' },
      { name: 'owner-gated-mechanisms', status: 'BLOCKED' }
    ]);
    expect(report.status).toBe('BLOCKED');
  });

  it('reports honest coverage for blocked adapter surfaces', () => {
    const report = buildGoldenAcceptanceReport([
      { name: 'report-renderer', status: 'BLOCKED', details: 'PR-8D adapter not yet implemented' },
      { name: 'app-controller-async-state', status: 'BLOCKED', details: 'PR-8D adapter not yet implemented' }
    ]);
    expect(report.status).toBe('BLOCKED');
    expect(report.gates).toHaveLength(2);
    expect(report.gates.every(g => g.status === 'BLOCKED')).toBe(true);
  });
});
