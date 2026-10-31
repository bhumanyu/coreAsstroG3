import { buildAiContext, buildProductAiContext } from '../ai/context/aiContextFactory';
import { createAnalysisContext } from '../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../core/analysis/resolveAnalysisTemporalState';
import { buildLifeAnalysis } from '../domain/synthesis';
import type { DomainInterpretation } from '../domain/interpretation';
import type { DomainEvidence } from '../domain/interpretation/DomainEvidence';
import type { CareerFinalSynthesisResult } from '../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import { interpretCareerV2 } from '../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../domain/wealth/WealthDomainInterpreterV2';
import type { CareerConclusionData } from '../domain/career/careerTypes';
import type { WealthConclusionData } from '../domain/wealth/wealthTypes';
import type { SelectedPeriodSynthesisValue } from '../domain/synthesis/selectedPeriodSynthesis';
import { buildLifeAnalysisViewModel } from '../product/life-analysis/lifeAnalysisMapper';
import { resolveLifeAnalysisEvidence } from '../product/life-analysis/lifeAnalysisEvidence';
import { buildProductSelectedPeriodSynthesis } from '../product/analysis/selectedPeriodProductService';
import { buildSelectedPeriodViewModel } from '../product/analysis/selectedPeriodViewModel';
import {
  mapEvidenceItems,
  mapProductAnalysis,
  mapSelectedPeriodSynthesis
} from '../product/analysis/productAnalysisMapper';
import { selectCareerViewModel } from '../product/analysis/careerViewModel';
import { selectWealthViewModel } from '../product/analysis/wealthViewModel';
import type { ProductAnalysis } from '../product/analysis/productAnalysisTypes';
import { buildChartExport } from '../features/chart-export/chartExportMapper';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';
import type { Horoscope } from '../types';
import {
  GOLDEN_TEST_METHODOLOGY
} from '../domain/career/__tests__/golden/goldenCareerFixtures';
import type {
  AcceptanceConclusion,
  AcceptanceProvenance,
  AcceptanceSurface,
  NormalizedAcceptanceConclusion,
  ParityDifference
} from './goldenAcceptanceTypes';
import {
  normalizeAcceptanceConclusion,
  normalizeAcceptanceSurface,
  projectDomainEvidenceToAcceptanceProvenance
} from './goldenAcceptanceNormalizer';
import type { GoldenAcceptancePipeline } from './goldenAcceptanceRunner';
import { assertConclusionInventory, assertParity } from './goldenAcceptanceAssertions';
import { GOLDEN_C11_BASELINE } from '../test/fixtures/careerGoldenBaseline';
import { GOLDEN_WEALTH_BASELINE, GOLDEN_WEALTH_MANIFESTATION_BASELINE } from '../test/fixtures/wealthGoldenBaseline';
import { calculateHoroscope } from '../engine/astroEngine';
import type { ReasoningNode } from '../domain/careerWealth/reasoningTrace/reasoningNode';

export type GoldenAcceptanceDomain = 'CAREER' | 'WEALTH';
export type GoldenAcceptanceFixtureKind = 'STANDARD' | 'MISSING_EVIDENCE';

function isConclusionList(
  value: AcceptanceConclusion | readonly AcceptanceConclusion[] | undefined
): value is readonly AcceptanceConclusion[] {
  return Array.isArray(value);
}

export interface GoldenAcceptanceProductionResult {
  readonly horoscope: ReturnType<typeof calculateHoroscope>;
  readonly context: ReturnType<typeof createAnalysisContext>;
  readonly temporalState: ReturnType<typeof resolveAnalysisTemporalState>;
  readonly career: DomainInterpretation;
  readonly wealth: DomainInterpretation;
  readonly productAnalysis: ProductAnalysis;
  readonly careerView: ReturnType<typeof selectCareerViewModel>;
  readonly wealthView: ReturnType<typeof selectWealthViewModel>;
  readonly aiContext: ReturnType<typeof buildAiContext>;
  readonly productAiContext: ReturnType<typeof buildProductAiContext>;
  readonly selectedPeriodView: ReturnType<typeof buildSelectedPeriodViewModel>;
  readonly selectedPeriod?: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData>;
  readonly chartExport: ReturnType<typeof buildChartExport>;
}

function getEvidence(
  interpretation: DomainInterpretation,
  ids: readonly string[]
): readonly DomainEvidence[] {
  const wanted = new Set(ids);
  return interpretation.evidence.filter(item => wanted.has(item.id));
}

function projectProvenance(
  evidence: readonly DomainEvidence[],
  owner: GoldenAcceptanceDomain
): readonly AcceptanceProvenance[] {
  return evidence.map(item => projectDomainEvidenceToAcceptanceProvenance(item, owner));
}

function canonicalConclusion(
  domain: GoldenAcceptanceDomain,
  interpretation: DomainInterpretation
): AcceptanceConclusion {
  const conclusion = canonicalProjection(domain, interpretation);
  if (!conclusion) {
    throw new Error(`Missing canonical ${domain} synthesis in production interpretation.`);
  }
  return conclusion;
}

function conclusionFromValues(
  domain: GoldenAcceptanceDomain,
  status: string | undefined,
  evidence: readonly { readonly id: string; readonly source?: string; readonly ruleId?: string; readonly role?: string }[],
  interpretation?: DomainInterpretation,
  scope: AcceptanceConclusion['scope'] = 'LIFETIME',
  subjectId = `chart:${domain.toLowerCase()}`,
  strictEvidenceResolution = true
): AcceptanceConclusion | undefined {
  if (status === undefined) return undefined;
  const items = evidence.filter(item => Boolean(item.id));
  const evidenceRecords = interpretation
    ? getEvidence(interpretation, items.map(item => item.id))
    : [];
  const evidenceById = new Map(evidenceRecords.map(e => [e.id, e]));

  // Enforce evidence resolution: check for dangling references and owner mismatches
  // Only enforce when strictEvidenceResolution is true (for UI surfaces)
  // AI context aggregates evidence from multiple sources, so we allow dangling references
  if (strictEvidenceResolution) {
    for (const item of items) {
      const record = evidenceById.get(item.id);
      if (!record) {
        throw new Error(`DANGLING_REFERENCE: evidence ID ${item.id} does not resolve to a domain record`);
      }
      // Verify domain ownership (CAREER evidence should be in career interpretation, etc.)
      if (record.domain !== domain) {
        throw new Error(`OWNER_MISMATCH: evidence ID ${item.id} belongs to domain ${record.domain} but was claimed by ${domain}`);
      }
    }
  }

  return {
    domain,
    scope,
    subjectId,
    status,
    evidence: items.map(item => ({ id: item.id, owner: domain })),
    provenance: items.map(item => {
      const record = evidenceById.get(item.id);
      if (!record) {
        // For AI context (non-strict), use the item's source/ruleId if available
        return {
          evidenceId: item.id,
          owner: domain,
          ...(item.source === undefined ? {} : { source: item.source }),
          ...(item.ruleId === undefined ? {} : { ruleId: item.ruleId }),
          occurrence: item.id,
          ...(item.role === undefined ? {} : { type: item.role })
        };
      }
      return projectDomainEvidenceToAcceptanceProvenance(record, domain);
    })
  };
}

/** Acceptance-layer adapter: projects canonical synthesis (used only for canonical surface). */
function canonicalProjection(
  domain: GoldenAcceptanceDomain,
  interpretation: DomainInterpretation
): AcceptanceConclusion | undefined {
  const synthesis = domain === 'CAREER'
    ? interpretation.conclusionData?.canonicalCareerFinalSynthesis as CareerFinalSynthesisResult | undefined
    : interpretation.conclusionData?.wealthFinalSynthesis as WealthConclusionData['wealthFinalSynthesis'];
  if (!synthesis) return undefined;
  const evidence = getEvidence(interpretation, synthesis.evidenceIds);
  return {
    domain,
    scope: 'LIFETIME',
    subjectId: `chart:${domain.toLowerCase()}`,
    status: synthesis.finalStatus,
    evidence: synthesis.evidenceIds.map(id => ({ id, owner: domain })),
    provenance: projectProvenance(evidence, domain)
  };
}

/** Acceptance-layer adapter: extracts UI surface conclusion from view model. */
function uiConclusionFromViewModel(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult,
  interpretation: DomainInterpretation
): AcceptanceConclusion | undefined {
  if (domain === 'CAREER') {
    const status = result.careerView.profession.status;
    if (!status) return undefined;
    const evidenceItems = result.careerView.evidence.map(e => ({
      id: e.id,
      source: e.source,
      ruleId: e.ruleId,
      role: e.role
    }));
    // UI surfaces should have strict evidence resolution
    return conclusionFromValues(domain, status, evidenceItems, interpretation, 'LIFETIME', `chart:${domain.toLowerCase()}`, true);
  }

  const wealthStatus = result.wealthView.overall.status;
  if (!wealthStatus) return undefined;
  const evidenceItems = result.wealthView.evidence.map(e => ({
    id: e.id,
    source: e.source,
    ruleId: e.ruleId,
    role: e.role
  }));
  // UI surfaces should have strict evidence resolution
  return conclusionFromValues(domain, wealthStatus, evidenceItems, interpretation, 'LIFETIME', `chart:${domain.toLowerCase()}`, true);
}

/** Acceptance-layer adapter: extracts AI context conclusion from AI context fields. */
function aiConclusionFromContext(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult,
  interpretation: DomainInterpretation
): AcceptanceConclusion | undefined {
  const aiContext = domain === 'CAREER' ? result.aiContext.career : result.aiContext.wealth;
  if (!aiContext) return undefined;

  const finalSynthesis = aiContext.finalSynthesis;
  if (!finalSynthesis) return undefined;

  const status = finalSynthesis.finalStatus;
  if (!status) return undefined;

  const evidenceItems = finalSynthesis.evidenceIds.map(id => ({ id }));
  // AI context aggregates evidence from multiple sources (D10, dasha, etc.)
  // Pass strictEvidenceResolution=false to allow dangling references
  return conclusionFromValues(domain, status, evidenceItems, interpretation, 'LIFETIME', `chart:${domain.toLowerCase()}`, false);
}

/** Acceptance-layer adapter: extracts product AI context conclusion from product AI context. */
function productAiConclusionFromContext(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult,
  interpretation: DomainInterpretation
): AcceptanceConclusion | undefined {
  const productAiContext = domain === 'CAREER' ? result.productAiContext.career : result.productAiContext.wealth;
  if (!productAiContext) return undefined;

  const finalSynthesis = productAiContext.finalSynthesis;
  if (!finalSynthesis) return undefined;

  const status = finalSynthesis.finalStatus;
  if (!status) return undefined;

  const evidenceItems = finalSynthesis.evidenceIds.map(id => ({ id }));
  // Product AI context aggregates evidence from multiple sources
  // Pass strictEvidenceResolution=false to allow dangling references
  return conclusionFromValues(domain, status, evidenceItems, interpretation, 'LIFETIME', `chart:${domain.toLowerCase()}`, false);
}

function buildProductionRun(
  fixtureKind: GoldenAcceptanceFixtureKind,
  missingEvidenceDomain: GoldenAcceptanceDomain
): GoldenAcceptanceProductionResult {
  const chart = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = createAnalysisContext({
    asOf: '2024-01-01T00:00:00.000Z',
    methodology: GOLDEN_TEST_METHODOLOGY
  });
  const temporalState = resolveAnalysisTemporalState(chart, context);
  const interpretationHoroscope: Horoscope = fixtureKind === 'MISSING_EVIDENCE'
    ? {
      ...chart,
      planetFacts: {} as Horoscope['planetFacts'],
      houseAnalysis: undefined,
      planetAnalysis: undefined,
      planetInterpretation: undefined,
      houseInterpretation: undefined,
      functionalRoles: undefined,
      planetaryStrength: undefined,
      yogas: undefined,
      divisionalInterpretation: undefined,
      natalGrahaDrishti: undefined
    }
    : chart;
  const horoscope = chart;
  const domainOptions = { context, temporalState };

  const career = interpretCareerV2(
    fixtureKind === 'MISSING_EVIDENCE' && missingEvidenceDomain === 'CAREER' ? interpretationHoroscope : chart,
    domainOptions
  );
  const wealth = interpretWealthV2(
    fixtureKind === 'MISSING_EVIDENCE' && missingEvidenceDomain === 'WEALTH' ? interpretationHoroscope : chart,
    domainOptions
  );
  const interpretations = [career, wealth] as const;
  const lifeAnalysis = buildLifeAnalysis(interpretations);

  const aiContext = buildAiContext(horoscope, {
    domainInterpretations: interpretations,
    lifeAnalysis,
    temporalState
  });
  const resolvedEvidence = resolveLifeAnalysisEvidence(lifeAnalysis, aiContext.evidence);
  const lifeAnalysisViewModel = buildLifeAnalysisViewModel(
    lifeAnalysis,
    career,
    wealth,
    resolvedEvidence,
    temporalState.dashaInterpretation?.current
  );
  const baseAnalysis = mapProductAnalysis({
    birthDetails: CANONICAL_BIRTH_DETAILS,
    horoscope,
    lifeAnalysisViewModel,
    context,
    temporalState,
    careerEvidence: mapEvidenceItems(career.evidence, 'CAREER'),
    wealthEvidence: mapEvidenceItems(wealth.evidence, 'WEALTH')
  });

  const mahadasha = baseAnalysis.dashPeriodOptions?.mahadashas.find(md =>
    md.valid && md.antardashas.some(ad => ad.valid)
  );
  const antardasha = mahadasha?.antardashas.find(ad => ad.valid);
  if (!mahadasha || !antardasha) {
    throw new Error('Production fixture did not provide a valid selected period.');
  }
  const selection = { mahadashaId: mahadasha.id, antardashaId: antardasha.id };
  const selectedPeriodView = buildSelectedPeriodViewModel({
    options: baseAnalysis.dashPeriodOptions,
    selection
  });
  const internalArtifacts = career.conclusionData?.internalArtifacts;
  if (!internalArtifacts || !career.conclusionData || !wealth.conclusionData) {
    throw new Error('Production fixture is missing canonical selected-period prerequisites.');
  }
  const selectedPeriodResult = buildProductSelectedPeriodSynthesis({
    selection,
    context,
    temporalState,
    horoscope,
    careerArtifacts: internalArtifacts,
    careerEvidence: career.evidence,
    careerDashaEvidence: internalArtifacts.careerDashaEvidence,
    wealthEvidence: wealth.evidence,
    careerBaseline: career.conclusionData as CareerConclusionData,
    wealthBaseline: wealth.conclusionData as WealthConclusionData
  });
  if (!selectedPeriodResult.ok) {
    throw new Error(`Selected-period production synthesis failed: ${selectedPeriodResult.error}`);
  }
  const selectedPeriod = selectedPeriodResult.value;
  const productAnalysis: ProductAnalysis = {
    ...baseAnalysis,
    selectedPeriod: {
      status: 'OK',
      synthesis: {
        ...mapSelectedPeriodSynthesis(selectedPeriod),
        aiExplanationStatus: 'NOT_REQUESTED'
      }
    }
  };
  const selectedPeriodEvidence = {
    careerEvidence: career.evidence,
    careerDashaEvidence: internalArtifacts.careerDashaEvidence,
    wealthEvidence: wealth.evidence
  };
  const aiContextWithPeriod = buildAiContext(horoscope, {
    domainInterpretations: interpretations,
    lifeAnalysis,
    temporalState,
    selectedPeriod,
    selectedPeriodEvidence
  });
  const productAiContextWithPeriod = buildProductAiContext(horoscope, {
    domainInterpretations: interpretations,
    lifeAnalysis,
    temporalState,
    selectedPeriod,
    selectedPeriodEvidence
  });

  return {
    horoscope,
    context,
    temporalState,
    career,
    wealth,
    productAnalysis,
    careerView: selectCareerViewModel(productAnalysis),
    wealthView: selectWealthViewModel(productAnalysis),
    aiContext: aiContextWithPeriod,
    productAiContext: productAiContextWithPeriod,
    selectedPeriodView,
    selectedPeriod,
    chartExport: buildChartExport({ analysis: productAnalysis, selectedPeriod: productAnalysis.selectedPeriod }, context.asOf)
  };
}

function traceConclusion(
  domain: GoldenAcceptanceDomain,
  interpretation: DomainInterpretation
): AcceptanceConclusion | undefined {
  const graph = interpretation.conclusionData?.reasoningTraceGraph as {
    readonly nodes: readonly ReasoningNode[];
  } | undefined;
  if (!graph) return undefined;
  const finalNode = graph.nodes.find(node => node.type === 'SYNTHESIS');
  // No typed status field exists on ReasoningNode; mark as UNAVAILABLE
  // We assert evidence-ID references independently instead of claiming trace-status parity
  const status = 'UNAVAILABLE';
  const evidenceIds = graph.nodes.flatMap(node => node.evidenceId ? [node.evidenceId] : []);
  const evidence = getEvidence(interpretation, evidenceIds);
  return {
    domain,
    scope: 'LIFETIME',
    subjectId: `chart:${domain.toLowerCase()}`,
    status,
    evidence: evidenceIds.map(id => ({ id, owner: domain })),
    provenance: projectProvenance(evidence, domain)
  };
}

function projectSelectedPeriod(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult
): AcceptanceConclusion {
  const selectedPeriod = result.selectedPeriod;
  if (!selectedPeriod) {
    return {
      domain,
      scope: 'SELECTED_PERIOD',
      subjectId: `chart:${domain.toLowerCase()}`,
      status: 'UNAVAILABLE',
      evidence: [],
      provenance: []
    };
  }

  // For CAREER: extract qualification status
  const careerQualificationStatus = domain === 'CAREER'
    ? selectedPeriod.career.qualificationBasis
    : undefined;

  // For WEALTH: extract per-dimension effect and dataStatus
  const wealthDimensions = domain === 'WEALTH'
    ? (['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const).map(dim => ({
        dimension: dim,
        effect: selectedPeriod.wealth.dimensions[dim].effect,
        dataStatus: selectedPeriod.wealth.dimensions[dim].dataStatus
      }))
    : [];

  const evidence = selectedPeriod.evidence ?? [];
  const evidenceIds = evidence.flatMap(item => item.evidenceId ? [item.evidenceId] : []);

  // Build a structured status that captures the selected-period state
  const structuredStatus = JSON.stringify({
    resultState: 'OK',
    ...(careerQualificationStatus !== undefined ? { careerQualificationStatus } : {}),
    ...(wealthDimensions.length > 0 ? { wealthDimensions } : {})
  });

  return {
    domain,
    scope: 'SELECTED_PERIOD',
    subjectId: `chart:${domain.toLowerCase()}`,
    status: structuredStatus,
    evidence: evidenceIds.map(id => ({ id, owner: domain })),
    provenance: evidence.flatMap(item => item.evidenceId ? [{
      evidenceId: item.evidenceId,
      owner: domain,
      ...(item.source === undefined ? {} : { source: item.source }),
      ...(item.ruleId === undefined ? {} : { ruleId: item.ruleId }),
      ...(item.provenanceStage === undefined ? {} : { stage: item.provenanceStage }),
      ...(item.classification === undefined ? {} : { type: item.classification })
    }] : []),
    ...(result.selectedPeriodView.interval === undefined ? {} : {
      temporalScope: {
        start: result.selectedPeriodView.interval.start,
        end: result.selectedPeriodView.interval.end,
        temporalRelation: selectedPeriod.period.temporalRelation
      }
    })
  };
}

export function createGoldenAcceptanceProductionPipeline(
  domain: GoldenAcceptanceDomain,
  fixtureKind: GoldenAcceptanceFixtureKind = 'STANDARD'
): GoldenAcceptancePipeline {
  return {
    run: () => buildProductionRun(fixtureKind, domain),
    collect: value => {
      const result = value as GoldenAcceptanceProductionResult;
      const interpretation = domain === 'CAREER' ? result.career : result.wealth;
      const canonical = canonicalConclusion(domain, interpretation);
      const uiConclusion = uiConclusionFromViewModel(domain, result, interpretation);
      const aiConclusion = aiConclusionFromContext(domain, result, interpretation);
      const productAiConclusion = productAiConclusionFromContext(domain, result, interpretation);
      const trace = traceConclusion(domain, interpretation);
      const exported = result.chartExport.interpretation;
      const domainExport = exported.status === 'UNAVAILABLE'
        ? undefined
        : domain === 'CAREER' ? exported.value.career : exported.value.wealth;
      const jsonConclusion = exported.status === 'UNAVAILABLE'
        ? conclusionFromValues(domain, exported.status, [], interpretation)
        : domainExport?.status === 'UNAVAILABLE'
          ? conclusionFromValues(domain, domainExport.status, [], interpretation)
          : domainExport?.value
            ? conclusionFromValues(domain, domainExport.value.status, domainExport.value.evidence, interpretation)
            : undefined;
      return {
        [`${domain.toLowerCase()}-ui`]: uiConclusion,
        'ai-context': aiConclusion,
        'product-ai-context': productAiConclusion,
        'reasoning-trace': trace,
        'json-export': jsonConclusion,
        'selected-period-ui': projectSelectedPeriod(domain, result),
        canonical
      };
    }
  };
}

function baselineDifference(
  surface: string,
  path: string,
  expected: unknown,
  actual: unknown
): ParityDifference {
  return {
    surface,
    kind: 'VALUE_MISMATCH',
    path,
    expected,
    actual,
    reason: 'Canonical production output differs from the approved golden baseline.'
  };
}

function assertCanonicalBaseline(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult
): readonly ParityDifference[] {
  if (domain === 'CAREER') {
    const actual = result.career.conclusionData?.canonicalCareerFinalSynthesis;
    if (!actual) return [baselineDifference('canonical-baseline', '$', 'C11 result', undefined)];
    const expected = GOLDEN_C11_BASELINE.canonicalC11Synthesis;
    const differences: ParityDifference[] = [];
    for (const key of ['finalStatus', 'finalDirection', 'finalStrength', 'confidence', 'evidenceIds'] as const) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) {
        differences.push(baselineDifference('canonical-baseline', `$.${key}`, expected[key], actual[key]));
      }
    }
    return differences;
  }

  const actual = result.wealth.conclusionData?.wealthFinalSynthesis;
  if (!actual) return [baselineDifference('canonical-baseline', '$', 'CW-05 wealth synthesis', undefined)];
  const expected = GOLDEN_WEALTH_BASELINE;
  const differences: ParityDifference[] = [];
  for (const key of ['finalStatus', 'status', 'ruleIds', 'evidenceIds'] as const) {
    if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) {
      differences.push(baselineDifference('canonical-baseline', `$.${key}`, expected[key], actual[key]));
    }
  }
  for (const dimension of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
    const actualDim = actual.dimensions?.[dimension];
    const expectedDim = expected.dimensions[dimension];
    if (!actualDim || !expectedDim) {
      differences.push(baselineDifference('canonical-baseline', `$.dimensions.${dimension}`, expectedDim, actualDim));
      continue;
    }
    // NOTE: dataStatus, promiseEvidenceIds, and dashaRuleReferences are NOT part of the canonical
    // WealthDimensionFinalSynthesis contract. They exist only in selected-period synthesis.
    // See wealthGoldenBaseline.ts for documentation.
    for (const key of ['finalStatus'] as const) {
      if (JSON.stringify(actualDim[key]) !== JSON.stringify(expectedDim[key])) {
        differences.push(baselineDifference('canonical-baseline', `$.dimensions.${dimension}.${key}`, expectedDim[key], actualDim[key]));
      }
    }
  }
  const manifestation = result.wealth.conclusionData?.wealthManifestationSynthesis;
  if (!manifestation) {
    differences.push(baselineDifference('canonical-baseline', '$.wealthManifestationSynthesis', 'manifestation synthesis', undefined));
  } else {
    for (const dimension of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const actualStatus = manifestation.dimensions?.[dimension]?.status;
      const expectedStatus = GOLDEN_WEALTH_MANIFESTATION_BASELINE.dimensions[dimension].status;
      if (actualStatus !== expectedStatus) {
        differences.push(baselineDifference(
          'canonical-baseline',
          `$.wealthManifestationSynthesis.dimensions.${dimension}.status`,
          expectedStatus,
          actualStatus
        ));
      }
    }
  }
  return Object.freeze(differences);
}

export interface GoldenAcceptanceProductionGateResult {
  readonly expected: NormalizedAcceptanceConclusion;
  readonly baselineDifferences: readonly ParityDifference[];
  readonly surfaceDifferences: readonly ParityDifference[];
  readonly selectedPeriod: AcceptanceConclusion;
}

/** Runs canonical baseline and surface gates against one real interpreter run. */
export function runGoldenAcceptanceProductionGate(
  domain: GoldenAcceptanceDomain,
  fixtureKind: GoldenAcceptanceFixtureKind = 'STANDARD'
): GoldenAcceptanceProductionGateResult {
  const result = buildProductionRun(fixtureKind, domain);
  const pipeline = createGoldenAcceptanceProductionPipeline(domain, fixtureKind);
  const projections = pipeline.collect(result);
  const canonical = projections.canonical;
  if (!canonical || isConclusionList(canonical)) {
    throw new Error('Production acceptance pipeline did not collect exactly one canonical conclusion.');
  }
  const expected = normalizeAcceptanceConclusion(canonical);
  const surfaces: AcceptanceSurface[] = [];
  const surfaceDifferences: ParityDifference[] = [];
  for (const [name, projection] of Object.entries(projections)
    .filter(([surfaceName]) => surfaceName !== 'canonical' && surfaceName !== 'selected-period-ui')) {
    const conclusions = projection === undefined
      ? [undefined]
      : isConclusionList(projection)
        ? projection
        : [projection];
    const inventory: NormalizedAcceptanceConclusion[] = [];
    for (const conclusion of conclusions) {
      if (conclusion === undefined) {
        surfaces.push(normalizeAcceptanceSurface(name, undefined));
        continue;
      }
      const surface = normalizeAcceptanceSurface(name, conclusion);
      if (surface.conclusion !== 'MISSING') inventory.push(surface.conclusion);
      surfaces.push(surface);
    }
    surfaceDifferences.push(...assertConclusionInventory(inventory));
  }
  const selectedPeriod = projections['selected-period-ui'];
  if (!selectedPeriod || isConclusionList(selectedPeriod)) {
    throw new Error('Production acceptance pipeline did not collect its selected-period projection.');
  }
  return {
    expected,
    baselineDifferences: assertCanonicalBaseline(domain, result),
    surfaceDifferences: Object.freeze([
      ...surfaceDifferences,
      ...assertParity(expected, surfaces)
    ]),
    selectedPeriod
  };
}

export function normalizeProductionCanonical(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult
): AcceptanceConclusion {
  return canonicalConclusion(domain, domain === 'CAREER' ? result.career : result.wealth);
}

export function projectRealEvidenceProvenance(
  interpretation: DomainInterpretation,
  domain: GoldenAcceptanceDomain,
  evidenceIds: readonly string[]
): readonly AcceptanceProvenance[] {
  return projectProvenance(getEvidence(interpretation, evidenceIds), domain);
}
