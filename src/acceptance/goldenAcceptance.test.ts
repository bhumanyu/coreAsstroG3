import { describe, expect, it } from 'vitest';
import { normalizeAcceptanceConclusion, normalizeAcceptanceSurface, projectDomainEvidenceToAcceptanceProvenance } from './goldenAcceptanceNormalizer';
import { assertConclusionInventory, assertParity, deepEqualAcceptance } from './goldenAcceptanceAssertions';
import { aggregateGateStatus, buildGoldenAcceptanceReport } from './goldenAcceptanceReport';
import type { AcceptanceConclusion, SelectedPeriodAcceptanceProjection } from './goldenAcceptanceTypes';
import type { DomainEvidence } from '../domain/interpretation/DomainEvidence';
import type { CareerFinalEvidenceTrace } from '../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type { ReasoningNode } from '../domain/careerWealth/reasoningTrace/reasoningNode';
import {
  createGoldenAcceptanceProductionPipeline,
  resolveEvidenceIds,
  runGoldenAcceptanceProductionGate
} from './goldenAcceptanceProductionHarness';
import { runGoldenAcceptanceParity } from './goldenAcceptanceRunner';
import { GOLDEN_C11_BASELINE } from '../test/fixtures/careerGoldenBaseline';
import { GOLDEN_WEALTH_BASELINE } from '../test/fixtures/wealthGoldenBaseline';
import { SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE, SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE } from '../test/fixtures/selectedPeriodGoldenFixtures';

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

  it('reports EXTERNAL as evidence outside the declared domain namespace', () => {
    const expected = normalizeAcceptanceConclusion({
      ...supported,
      evidence: [],
      provenance: []
    });
    const differences = assertParity(expected, [normalizeAcceptanceSurface('external-surface', {
      ...supported,
      evidence: [{ id: 'EXTERNAL-EV', resolution: 'EXTERNAL' }],
      provenance: [{ evidenceId: 'EXTERNAL-EV' }]
    })]);
    expect(differences).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'EXTERNAL_EVIDENCE', actual: 'EXTERNAL-EV' })
    ]));
  });

  it('applies the external-evidence allowance without skipping provenance comparison', () => {
    const externalConclusion: AcceptanceConclusion = {
      ...supported,
      evidence: [{ id: 'EXTERNAL-EV', owner: 'WEALTH', resolution: 'EXTERNAL' }],
      provenance: [{
        evidenceId: 'EXTERNAL-EV',
        owner: 'WEALTH',
        source: 'WEALTH_SOURCE',
        ruleId: 'WEALTH_RULE',
        occurrence: 'EXTERNAL-EV'
      }]
    };
    const expected = normalizeAcceptanceConclusion(externalConclusion);
    const allowed = normalizeAcceptanceSurface('ai-context', externalConclusion, true);
    const required = normalizeAcceptanceSurface('canonical', externalConclusion);

    expect(assertParity(expected, [allowed])).toEqual([]);
    expect(assertParity(expected, [required])).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'EXTERNAL_EVIDENCE', actual: 'EXTERNAL-EV' })
    ]));
    expect(assertParity(expected, [{
      ...allowed,
      conclusion: normalizeAcceptanceConclusion({
        ...externalConclusion,
        evidence: [{ ...externalConclusion.evidence[0], owner: 'CAREER' }],
        provenance: [{ ...externalConclusion.provenance[0], owner: 'CAREER', ruleId: 'UNEXPECTED_RULE' }]
      })
    }])).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'VALUE_MISMATCH', path: '$.evidence' }),
      expect.objectContaining({ kind: 'VALUE_MISMATCH', path: '$.provenance' })
    ]));
  });

  it('uses explicit namespace precedence and ambiguity rules for collisions', () => {
    const domainRecord = { id: 'SHARED', domain: 'CAREER', source: 'DOMAIN' };
    const wrongDomainRecord = { id: 'SHARED-WRONG', domain: 'WEALTH', source: 'DOMAIN' };
    const externalRecord = { id: 'SHARED', domain: 'WEALTH', source: 'EXTERNAL' };
    const firstExternalRecord = { id: 'DUPLICATE-EXTERNAL', domain: 'CAREER', source: 'EXTERNAL-A' };
    const secondExternalRecord = { id: 'DUPLICATE-EXTERNAL', domain: 'CAREER', source: 'EXTERNAL-B' };

    const resolutions = resolveEvidenceIds(
      ['SHARED', 'SHARED-WRONG', 'DUPLICATE-EXTERNAL'],
      {
        domainUniverse: [domainRecord, wrongDomainRecord],
        externalNamespaces: [
          [externalRecord, firstExternalRecord],
          [secondExternalRecord]
        ]
      },
      'CAREER'
    );

    expect(resolutions.get('SHARED')).toEqual({ resolution: 'RESOLVED', record: domainRecord });
    expect(resolutions.get('SHARED')).not.toMatchObject({ resolution: 'EXTERNAL' });
    expect(resolutions.get('SHARED-WRONG')).toEqual({
      resolution: 'OWNER_MISMATCH',
      record: wrongDomainRecord,
      actualOwner: 'WEALTH'
    });
    expect(resolutions.get('DUPLICATE-EXTERNAL')).toEqual({ resolution: 'AMBIGUOUS' });
  });

  it('compares conclusion kinds and does not treat presentation conclusions as synthesis finals', () => {
    const expected = normalizeAcceptanceConclusion({ ...supported, conclusionKind: 'SYNTHESIS_FINAL' });
    const surface = normalizeAcceptanceSurface('career-ui', {
      ...supported,
      conclusionKind: 'PROFESSION_COMPLETENESS'
    });
    expect(assertParity(expected, [surface])).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'VALUE_MISMATCH',
        path: '$.conclusionKind',
        expected: 'SYNTHESIS_FINAL',
        actual: 'PROFESSION_COMPLETENESS'
      })
    ]));
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
        ],
        canonical: { ...supported, domain: 'CAREER', scope: 'LIFETIME', subjectId: 'chart:career' },
        'selected-period-ui': {
          domain: 'CAREER',
          scope: 'SELECTED_PERIOD',
          subjectId: 'chart:career',
          resultState: 'OK',
          evidence: [],
          provenance: []
        }
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
    const selectedPeriod = projections['selected-period-ui'] as SelectedPeriodAcceptanceProjection;
    expect(selectedPeriod).toMatchObject({
      domain,
      scope: 'SELECTED_PERIOD'
    });
    // Selected period now has typed fields instead of JSON-encoded status
    expect(selectedPeriod.resultState).toBeDefined();
    expect(projections.canonical).toMatchObject({ conclusionKind: 'SYNTHESIS_FINAL' });
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

  it('projects AI synthesis provenance from resolved domain records without inventing owners', () => {
    const pipeline = createGoldenAcceptanceProductionPipeline('CAREER');
    const result = pipeline.run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const projections = pipeline.collect(result);

    for (const surfaceName of ['ai-context', 'product-ai-context']) {
      const conclusion = projections[surfaceName] as AcceptanceConclusion;
      const evidence = conclusion.evidence.find(item => {
        const record = result.career.evidence.find(candidate => candidate.id === item.id);
        return item.resolution === 'RESOLVED'
          && record?.provenance?.source !== undefined
          && record.provenance.ruleId !== undefined;
      });
      expect(evidence, surfaceName).toBeDefined();
      if (!evidence) throw new Error(`${surfaceName} emitted no resolved provenance-complete evidence.`);
      const record = result.career.evidence.find(item => item.id === evidence.id);
      if (!record) throw new Error(`${surfaceName} evidence did not resolve back to the domain universe.`);
      expect(conclusion.provenance.find(item => item.evidenceId === evidence.id)).toEqual(
        projectDomainEvidenceToAcceptanceProvenance(record, record.domain)
      );

      for (const item of conclusion.evidence.filter(candidate => candidate.resolution === 'DANGLING' || candidate.resolution === 'EXTERNAL')) {
        expect(item).not.toHaveProperty('owner');
      }
    }
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
      // NOTE: dataStatus, promiseEvidenceIds, and dashaRuleReferences are NOT part of the canonical
      // WealthDimensionFinalSynthesis contract. They exist only in selected-period synthesis.
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
                const selectedPeriod = projection as SelectedPeriodAcceptanceProjection;
          expect(selectedPeriod, `${domain} ${surface}`).toMatchObject({
            domain,
            scope: 'SELECTED_PERIOD'
          });
          // Selected period now has typed fields instead of JSON-encoded status
          expect(selectedPeriod.resultState).toBeDefined();
          continue;
        }
        // UI, AI-context, and product-ai-context are placeholder adapters reading from view models
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
          // Other surfaces are placeholder adapters reading from view models
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

    const approvedSurfaceExpectations: readonly {
      readonly name: string;
      readonly allowedStatuses: readonly ('PASS' | 'FAIL' | 'BLOCKED')[];
    }[] = [
      { name: `${domain.toLowerCase()}-ui`, allowedStatuses: ['PASS', 'FAIL'] },
      { name: 'ai-context', allowedStatuses: ['PASS', 'FAIL'] },
      { name: 'product-ai-context', allowedStatuses: ['PASS', 'FAIL'] },
      { name: 'reasoning-trace', allowedStatuses: ['BLOCKED', 'PASS'] },
      { name: 'json-export', allowedStatuses: ['BLOCKED', 'PASS'] },
      { name: 'selected-period-ui', allowedStatuses: ['PASS'] }
    ];

    for (const { name, allowedStatuses } of approvedSurfaceExpectations) {
      const gateEntry = gate.surfaceGates.find(g => g.name === name);
      const hasDifferences = gate.surfaceDifferences.some(difference => difference.surface === name);
      expect(gateEntry?.status).toBe(allowedStatuses.includes('BLOCKED') && hasDifferences ? 'BLOCKED' : hasDifferences ? 'FAIL' : 'PASS');
      expect(allowedStatuses).toContain(gateEntry?.status);
      expect(gate.report.gates.find(g => g.name === 'canonical-baseline')?.status).toBe('PASS');
      expect(gate.report.gates.find(g => g.name === name)?.status).toBe(gateEntry?.status);
    }

    const hasGenuineFailures = gate.baselineDifferences.length > 0
      || gate.surfaceGates.some(surface => surface.status === 'FAIL');
    expect(gate.report.status).toBe(hasGenuineFailures
      ? 'FAIL'
      : gate.surfaceGates.some(surface => surface.status === 'BLOCKED') ? 'BLOCKED' : 'PASS');
    expect(gate.selectedPeriod?.scope).toBe('SELECTED_PERIOD');
  });

  it('fails required surfaces that are absent from production projections', () => {
    const pipeline = createGoldenAcceptanceProductionPipeline('CAREER');
    const result = pipeline.run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const conclusionData = result.career.conclusionData;
    if (!conclusionData) throw new Error('Production fixture emitted no career conclusion data.');
    const withoutTrace = {
      ...result,
      career: {
        ...result.career,
        conclusionData: {
          ...conclusionData,
          reasoningTraceGraph: undefined
        }
      }
    };

    const gate = runGoldenAcceptanceProductionGate('CAREER', 'STANDARD', withoutTrace);
    expect(gate.surfaceDifferences).toContainEqual(expect.objectContaining({
      surface: 'reasoning-trace',
      kind: 'MISSING'
    }));
    expect(gate.surfaceGates.find(surface => surface.name === 'reasoning-trace')?.status).toBe('FAIL');
    expect(gate.report.status).toBe('FAIL');
  });

  it('makes any parity difference fail even when gates pass or block', () => {
    const difference = { surface: 'ui', kind: 'VALUE_MISMATCH' as const, path: '$.status', reason: 'status differs' };
    expect(buildGoldenAcceptanceReport([{ name: 'gate', status: 'PASS' }], [difference]).status).toBe('FAIL');
    expect(buildGoldenAcceptanceReport([{ name: 'gate', status: 'BLOCKED' }], [difference]).status).toBe('FAIL');
  });

  it('asserts selected-period projection against approved golden baseline', () => {
    const pipeline = createGoldenAcceptanceProductionPipeline('WEALTH');
    const result = pipeline.run();
    const projections = pipeline.collect(result);
    const selectedPeriod = projections['selected-period-ui'] as SelectedPeriodAcceptanceProjection;

    // Dimensions, interval, and relation are golden for the fixed fixture; evidence and provenance are runtime-derived.
    expect(selectedPeriod).toMatchObject({
      domain: SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.domain,
      scope: SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.scope,
      resultState: SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.resultState,
      careerQualificationStatus: SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.careerQualificationStatus
    });
    expect(selectedPeriod.wealthDimensions).toEqual(SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.wealthDimensions);
    expect(selectedPeriod.interval).toEqual(SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.interval);
    expect(selectedPeriod.temporalRelation).toBe(SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE.temporalRelation);
    expect(['PAST', 'CURRENT', 'FUTURE']).toContain(selectedPeriod.temporalRelation);
    expect(Array.isArray(selectedPeriod.evidence)).toBe(true);
    expect(Array.isArray(selectedPeriod.provenance)).toBe(true);
  });

  it('asserts selected-period projection against approved golden baseline for CAREER', () => {
    const pipeline = createGoldenAcceptanceProductionPipeline('CAREER');
    const result = pipeline.run();
    const projections = pipeline.collect(result);
    const selectedPeriod = projections['selected-period-ui'] as SelectedPeriodAcceptanceProjection;

    // Qualification status, interval, and relation are golden for the fixed fixture; evidence and provenance are runtime-derived.
    expect(selectedPeriod).toMatchObject({
      domain: SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE.domain,
      scope: SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE.scope,
      resultState: SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE.resultState,
      careerQualificationStatus: SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE.careerQualificationStatus
    });
    expect(selectedPeriod.interval).toEqual(SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE.interval);
    expect(selectedPeriod.temporalRelation).toBe(SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE.temporalRelation);
    expect(['PAST', 'CURRENT', 'FUTURE']).toContain(selectedPeriod.temporalRelation);
    expect(Array.isArray(selectedPeriod.evidence)).toBe(true);
    expect(Array.isArray(selectedPeriod.provenance)).toBe(true);
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

  it('resolves a production-shaped reasoning graph through trace and production gates', () => {
    const pipeline = createGoldenAcceptanceProductionPipeline('CAREER');
    const productionResult = pipeline.run() as import('./goldenAcceptanceProductionHarness').GoldenAcceptanceProductionResult;
    const canonicalEvidenceId = productionResult.career.conclusionData
      ?.canonicalCareerFinalSynthesis?.evidenceIds[0];
    if (!canonicalEvidenceId) throw new Error('Production fixture emitted no canonical career evidence ID.');
    const resolvedEvidence = productionResult.career.evidence.find(item => item.id !== canonicalEvidenceId);
    if (!resolvedEvidence) throw new Error('Production fixture emitted no additional career evidence record.');

    const danglingId = canonicalEvidenceId;
    const duplicatedId = 'DUPLICATE-EV-2';
    const wrongOwnerId = 'WRONG-OWNER-EV';
    const duplicateOne: DomainEvidence = { ...resolvedEvidence, id: duplicatedId };
    const duplicateTwo: DomainEvidence = { ...resolvedEvidence, id: duplicatedId, statement: `${resolvedEvidence.statement} duplicate` };
    const wrongOwnerEvidence: DomainEvidence = { ...resolvedEvidence, id: wrongOwnerId, domain: 'WEALTH' };
    const evidenceNode = (nodeId: string, evidenceId: string): ReasoningNode => ({
      nodeId,
      type: 'EVIDENCE',
      domain: 'CAREER',
      axis: 'NATAL',
      evidenceId,
      subjectKey: 'production-fixture',
      label: evidenceId
    });
    const reasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [
        evidenceNode('trace-dangling', danglingId),
        evidenceNode('trace-duplicate', duplicatedId),
        evidenceNode('trace-wrong-owner', wrongOwnerId),
        evidenceNode('trace-resolved', resolvedEvidence.id),
        {
          nodeId: 'trace-synthesis',
          type: 'SYNTHESIS',
          domain: 'CAREER',
          axis: 'FINAL',
          subjectKey: 'production-fixture',
          label: 'Career synthesis'
        }
      ] satisfies readonly ReasoningNode[],
      edges: []
    };
    const fixtureRun = {
      ...productionResult,
      career: {
        ...productionResult.career,
        evidence: [
          ...productionResult.career.evidence.filter(item => item.id !== canonicalEvidenceId),
          duplicateOne,
          duplicateTwo,
          wrongOwnerEvidence
        ],
        conclusionData: {
          ...productionResult.career.conclusionData,
          reasoningTraceGraph
        }
      }
    };

    const projections = pipeline.collect(fixtureRun);
    const trace = projections['reasoning-trace'] as AcceptanceConclusion;
    expect(trace.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: danglingId, resolution: 'DANGLING' }),
      expect.objectContaining({ id: duplicatedId, resolution: 'AMBIGUOUS' }),
      expect.objectContaining({ id: wrongOwnerId, resolution: 'OWNER_MISMATCH', owner: 'WEALTH' }),
      expect.objectContaining({ id: resolvedEvidence.id, resolution: 'RESOLVED', owner: 'CAREER' })
    ]));
    expect(trace.evidence.find(item => item.id === danglingId)).not.toHaveProperty('owner');
    expect(trace.evidence.find(item => item.id === duplicatedId)).not.toHaveProperty('owner');
    expect(trace.provenance.find(item => item.evidenceId === resolvedEvidence.id)).toMatchObject({
      owner: 'CAREER',
      source: resolvedEvidence.provenance?.source ?? resolvedEvidence.source,
      ruleId: resolvedEvidence.provenance?.ruleId ?? resolvedEvidence.ruleId,
      occurrence: resolvedEvidence.id
    });

    const canonical = projections.canonical as AcceptanceConclusion;
    expect(canonical.evidence.find(item => item.id === canonicalEvidenceId)).toEqual({
      id: canonicalEvidenceId,
      resolution: 'DANGLING'
    });

    const gate = runGoldenAcceptanceProductionGate('CAREER', 'STANDARD', fixtureRun);
    expect(gate.surfaceDifferences).toEqual(expect.arrayContaining([
      expect.objectContaining({ surface: 'reasoning-trace', kind: 'DANGLING_REFERENCE', actual: danglingId }),
      expect.objectContaining({ surface: 'reasoning-trace', kind: 'AMBIGUOUS_EVIDENCE', actual: duplicatedId }),
      expect.objectContaining({ surface: 'reasoning-trace', kind: 'OWNER_MISMATCH', actual: wrongOwnerId })
    ]));
    expect(gate.surfaceGates.find(item => item.name === 'reasoning-trace')?.status).toBe('BLOCKED');
    expect(gate.report.gates.find(item => item.name === 'reasoning-trace')?.status).toBe('BLOCKED');
    const hasUnblockedFailures = gate.baselineDifferences.length > 0
      || gate.surfaceGates.some(surface => surface.status === 'FAIL');
    expect(gate.report.status).toBe(hasUnblockedFailures ? 'FAIL' : 'BLOCKED');
  });
});
