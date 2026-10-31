import { buildAiContext, buildProductAiContext } from '../ai/context/aiContextFactory';
import { createAnalysisContext } from '../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../core/analysis/resolveAnalysisTemporalState';
import { buildLifeAnalysis } from '../domain/synthesis';
import type { DomainInterpretation } from '../domain/interpretation';
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
import {
  ACCEPTANCE_MISSING,
  type AcceptanceConclusion,
  type AcceptanceProvenance,
  type AcceptanceSurface,
  type NormalizedAcceptanceConclusion,
  type ParityDifference,
  type EvidenceResolution,
  type UnresolvedEvidence,
  type SelectedPeriodAcceptanceProjection
} from './goldenAcceptanceTypes';
import {
  normalizeAcceptanceConclusion,
  normalizeAcceptanceSurface
} from './goldenAcceptanceNormalizer';
import type { GoldenAcceptancePipeline } from './goldenAcceptanceRunner';
import { assertConclusionInventory, assertParity, deepEqualAcceptance } from './goldenAcceptanceAssertions';
import { buildGoldenAcceptanceReport, type AcceptanceGate, type GoldenAcceptanceReport, type GateStatus } from './goldenAcceptanceReport';
import { GOLDEN_C11_BASELINE } from '../test/fixtures/careerGoldenBaseline';
import { GOLDEN_WEALTH_BASELINE, GOLDEN_WEALTH_MANIFESTATION_BASELINE } from '../test/fixtures/wealthGoldenBaseline';
import { SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE, SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE } from '../test/fixtures/selectedPeriodGoldenFixtures';
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

export interface EvidenceResolverRecord {
  readonly id: string;
  readonly domain?: string;
  readonly source?: string;
  readonly ruleId?: string;
  readonly role?: string;
  readonly provenance?: {
    readonly source?: string;
    readonly ruleId?: string;
    readonly axis?: string;
  };
}

export interface EvidenceNamespaces {
  readonly domainUniverse: readonly EvidenceResolverRecord[];
  readonly externalNamespaces?: readonly ExternalEvidenceNamespace[];
}

export interface ExternalEvidenceNamespace {
  readonly owner: string;
  readonly records: readonly EvidenceResolverRecord[];
}

export const REQUIRED_SURFACES = Object.freeze({
  CAREER: Object.freeze(['career-ui', 'ai-context', 'product-ai-context', 'reasoning-trace', 'json-export', 'selected-period-ui'] as const),
  WEALTH: Object.freeze(['wealth-ui', 'ai-context', 'product-ai-context', 'reasoning-trace', 'json-export', 'selected-period-ui'] as const)
});

type RequiredSurfaceName<D extends GoldenAcceptanceDomain> = typeof REQUIRED_SURFACES[D][number];
type SurfaceProjection<Name extends string> =
  Name extends 'selected-period-ui'
    ? SelectedPeriodAcceptanceProjection | typeof ACCEPTANCE_MISSING
    : AcceptanceConclusion | readonly AcceptanceConclusion[] | typeof ACCEPTANCE_MISSING;
type AcceptanceSurfaceProjection = AcceptanceConclusion
  | SelectedPeriodAcceptanceProjection
  | readonly AcceptanceConclusion[]
  | typeof ACCEPTANCE_MISSING;
export type GoldenAcceptanceProjections<D extends GoldenAcceptanceDomain = GoldenAcceptanceDomain> =
  D extends GoldenAcceptanceDomain
    ? Readonly<{ [Name in RequiredSurfaceName<D>]: SurfaceProjection<Name> }> & Readonly<{
      canonical: AcceptanceConclusion;
    }>
    : never;

export const SURFACE_ALLOWED_DIFFERENCE_KINDS: Readonly<Record<string, readonly ParityDifference['kind'][]>> = Object.freeze({
  'ai-context': Object.freeze(['EXTERNAL_EVIDENCE'] as const),
  'product-ai-context': Object.freeze(['EXTERNAL_EVIDENCE'] as const)
});

export function buildRequiredSurfaceGates(
  requiredSurfaces: readonly string[],
  projections: Readonly<Record<string, unknown>>,
  differences: readonly ParityDifference[],
  expectedEvidenceIds: readonly string[]
): readonly AcceptanceGate[] {
  return requiredSurfaces.map(name => {
    const projection = projections[name];
    const missing = !Object.prototype.hasOwnProperty.call(projections, name)
      || projection === undefined
      || projection === ACCEPTANCE_MISSING;
    const surfaceDifferences = differences.filter(difference => baseSurfaceName(difference.surface) === name);
    return {
      name,
      status: classifySurfaceGateStatus(
        name,
        surfaceDifferences,
        missing,
        expectedEvidenceIds,
        SURFACE_ALLOWED_DIFFERENCE_KINDS[name] ?? []
      ),
      ...(surfaceDifferences.length === 0 ? {} : { details: `${surfaceDifferences.length} difference(s)` })
    };
  });
}

function baseSurfaceName(surface: string): string {
  return surface.replace(/\[\d+\]$/, '');
}

function selectedPeriodEvidenceUniverse(
  domainUniverse: readonly EvidenceResolverRecord[],
  availableEvidence: readonly EvidenceResolverRecord[]
): readonly EvidenceResolverRecord[] {
  const domainIds = new Set(domainUniverse.map(record => record.id));
  return [
    ...domainUniverse,
    ...availableEvidence.filter(record => !domainIds.has(record.id))
  ];
}

function isValidatedExternalEvidenceDifference(difference: ParityDifference): boolean {
  if (!difference.actual || typeof difference.actual !== 'object') return false;
  const actual = difference.actual as {
    readonly id?: unknown;
    readonly owner?: unknown;
    readonly namespaceOwner?: unknown;
    readonly provenance?: AcceptanceProvenance;
    readonly resolvedProvenance?: AcceptanceProvenance;
  };
  const provenance = actual.provenance;
  const resolvedProvenance = actual.resolvedProvenance;
  if (typeof actual.id !== 'string'
    || typeof actual.owner !== 'string'
    || typeof actual.namespaceOwner !== 'string'
    || actual.owner !== actual.namespaceOwner
    || !provenance
    || !resolvedProvenance) return false;
  if (provenance.evidenceId !== actual.id
    || provenance.owner !== actual.owner
    || provenance.occurrence !== actual.id
    || resolvedProvenance.evidenceId !== actual.id
    || resolvedProvenance.owner !== actual.owner
    || resolvedProvenance.occurrence !== actual.id) return false;
  return (['source', 'ruleId', 'occurrence', 'stage', 'type'] as const)
    .every(key => provenance[key] === resolvedProvenance[key]);
}

export function classifySurfaceGateStatus(
  surface: string,
  differences: readonly ParityDifference[],
  missing = false,
  expectedEvidenceIds: readonly string[] = [],
  allowedDifferenceKinds: readonly ParityDifference['kind'][] = SURFACE_ALLOWED_DIFFERENCE_KINDS[surface] ?? []
): GateStatus {
  if (missing) return 'FAIL';
  if (differences.length === 0) return 'PASS';

  const allAllowed = differences.every(difference => {
    if (allowedDifferenceKinds.includes(difference.kind)) {
      return difference.kind !== 'EXTERNAL_EVIDENCE' || isValidatedExternalEvidenceDifference(difference);
    }
    if (surface === 'reasoning-trace') {
      if (difference.kind !== 'EVIDENCE_MISMATCH' || difference.path !== '$.evidence'
        || !Array.isArray(difference.expected) || !Array.isArray(difference.actual)) return false;
      const expectedIds = new Set(difference.expected.map(item => (item as { readonly id?: unknown }).id));
      const actualEntries = difference.actual as readonly { readonly id?: unknown; readonly resolution?: unknown }[];
      const actualIds = new Set(actualEntries.map(item => item.id));
      const extras = actualEntries.filter(item => !expectedIds.has(item.id));
      return extras.length > 0
        && [...expectedEvidenceIds].every(id => actualIds.has(id))
        && extras.every(item => typeof item.id === 'string' && !expectedIds.has(item.id) && item.resolution === 'RESOLVED');
    }

    if (surface === 'json-export' && difference.kind === 'EVIDENCE_MISMATCH'
      && difference.path === '$.evidence' && Array.isArray(difference.expected) && Array.isArray(difference.actual)) {
      const expectedItems = difference.expected as readonly { readonly id?: unknown; readonly owner?: unknown; readonly resolution?: unknown }[];
      const actualItems = difference.actual as readonly { readonly id?: unknown; readonly owner?: unknown; readonly resolution?: unknown }[];
      if (expectedItems.length !== actualItems.length) return false;
      const actualById = new Map(actualItems.map(item => [item.id, item]));
      return expectedItems.every(expected => {
        const actual = actualById.get(expected.id);
        if (!actual) return false;
        const expectedWithoutResolution = { id: expected.id, owner: expected.owner };
        const actualWithoutResolution = { id: actual.id, owner: actual.owner };
        return deepEqualAcceptance(expectedWithoutResolution, actualWithoutResolution)
          && expected.resolution !== undefined
          && actual.resolution === undefined;
      });
    }
    if (surface === 'json-export' && difference.kind === 'PROVENANCE_MISMATCH'
      && difference.path === '$.provenance' && Array.isArray(difference.expected) && Array.isArray(difference.actual)) {
      const expectedItems = difference.expected as readonly { readonly evidenceId?: unknown; readonly owner?: unknown; readonly [key: string]: unknown }[];
      const actualItems = difference.actual as readonly { readonly evidenceId?: unknown; readonly owner?: unknown; readonly [key: string]: unknown }[];
      if (expectedItems.length !== actualItems.length) return false;
      const actualById = new Map(actualItems.map(item => [item.evidenceId, item]));
      return expectedItems.every(expected => {
        const actual = actualById.get(expected.evidenceId);
        if (!actual || expected.owner === undefined || actual.owner !== undefined) return false;
        const { owner: _owner, ...expectedRest } = expected;
        const { owner: _actualOwner, ...actualRest } = actual;
        return deepEqualAcceptance(expectedRest, actualRest);
      });
    }
    return false;
  });
  return allAllowed ? 'BLOCKED' : 'FAIL';
}

/**
 * Discriminated evidence resolver: resolves evidence IDs against a universe of records.
 *
 * Returns a map of evidence ID to resolution state and the resolved record (if available).
 * Resolution states:
 * - RESOLVED: ID resolves to exactly one record in the universe with matching owner
 * - DANGLING: ID does not resolve to any record in the universe
 * - AMBIGUOUS: ID resolves to multiple records in the universe (duplicate IDs)
 * - OWNER_MISMATCH: ID resolves to a record but its domain does not match expected owner
 * - EXTERNAL: ID resolves only in a declared external namespace
 */
export function resolveEvidenceIds(
  ids: readonly string[],
  namespaces: EvidenceNamespaces,
  expectedOwner: GoldenAcceptanceDomain
): Map<string, {
  resolution: EvidenceResolution;
  record?: EvidenceResolverRecord;
  actualOwner?: string;
  namespaceOwner?: string;
}> {
  const domainEvidenceById = new Map<string, EvidenceResolverRecord[]>();
  const externalEvidenceById = new Map<string, { readonly record: EvidenceResolverRecord; readonly namespaceOwner: string }[]>();
  const addRecords = (index: Map<string, EvidenceResolverRecord[]>, records: readonly EvidenceResolverRecord[]) => {
    for (const record of records) {
      const existing = index.get(record.id) || [];
      existing.push(record);
      index.set(record.id, existing);
    }
  };
  addRecords(domainEvidenceById, namespaces.domainUniverse);
  for (const externalNamespace of namespaces.externalNamespaces ?? []) {
    for (const record of externalNamespace.records) {
      const existing = externalEvidenceById.get(record.id) ?? [];
      existing.push({ record, namespaceOwner: externalNamespace.owner });
      externalEvidenceById.set(record.id, existing);
    }
  }

  const resolutionMap = new Map<string, {
    resolution: EvidenceResolution;
    record?: EvidenceResolverRecord;
    actualOwner?: string;
    namespaceOwner?: string;
  }>();
  for (const id of ids) {
    const domainRecords = domainEvidenceById.get(id) ?? [];
    // Domain records are authoritative for an ID; external namespaces resolve external-only IDs.
    const externalRecords = externalEvidenceById.get(id) ?? [];
    const records = domainRecords.length > 0
      ? domainRecords
      : externalRecords.map(entry => entry.record);
    const external = domainRecords.length === 0 && records.length > 0;
    if (records.length === 0) {
      resolutionMap.set(id, { resolution: 'DANGLING' });
    } else if (records.length > 1) {
      resolutionMap.set(id, { resolution: 'AMBIGUOUS' });
    } else {
      const record = records[0];
      if (external) {
        resolutionMap.set(id, {
          resolution: 'EXTERNAL',
          record,
          actualOwner: record.domain,
          namespaceOwner: externalRecords[0].namespaceOwner
        });
      } else if (record.domain !== expectedOwner) {
        resolutionMap.set(id, { resolution: 'OWNER_MISMATCH', record, actualOwner: record.domain });
      } else {
        resolutionMap.set(id, { resolution: 'RESOLVED', record });
      }
    }
  }

  return resolutionMap;
}

function acceptanceEvidenceFromResolution(
  id: string,
  resolution: {
    readonly resolution: EvidenceResolution;
    readonly record?: EvidenceResolverRecord;
    readonly actualOwner?: string;
    readonly namespaceOwner?: string;
  }
): AcceptanceConclusion['evidence'][number] {
  const owner = resolution.record?.domain ?? resolution.actualOwner;
  return {
    id,
    ...(owner === undefined ? {} : { owner }),
    resolution: resolution.resolution,
    ...(resolution.record && (resolution.resolution === 'RESOLVED' || resolution.resolution === 'EXTERNAL')
      ? {
          ...(resolution.resolution === 'EXTERNAL' && resolution.namespaceOwner !== undefined
            ? { namespaceOwner: resolution.namespaceOwner }
            : {}),
          resolvedProvenance: acceptanceProvenanceFromResolution(id, resolution)
        }
      : {})
  };
}

function acceptanceProvenanceFromResolution(
  id: string,
  resolution: {
    readonly resolution: EvidenceResolution;
    readonly record?: EvidenceResolverRecord;
    readonly actualOwner?: string;
    readonly namespaceOwner?: string;
  }
): AcceptanceProvenance {
  const record = resolution.resolution === 'RESOLVED' || resolution.resolution === 'EXTERNAL'
    ? resolution.record
    : undefined;
  if (!record || record.domain === undefined) {
    return {
      evidenceId: id,
      ...(resolution.resolution === 'OWNER_MISMATCH' && resolution.actualOwner !== undefined
        ? { owner: resolution.actualOwner }
        : {})
    };
  }
  return {
    evidenceId: id,
    owner: record.domain,
    source: record.provenance?.source || record.source || undefined,
    ruleId: record.provenance?.ruleId || record.ruleId || undefined,
    occurrence: record.id,
    ...(record.provenance?.axis === undefined ? {} : { stage: record.provenance.axis }),
    ...(record.role === undefined ? {} : { type: record.role })
  };
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
  enforceStrictResolution = true,
  externalNamespaces: readonly ExternalEvidenceNamespace[] = []
): AcceptanceConclusion | undefined {
  if (status === undefined) return undefined;
  const items = evidence.filter(item => Boolean(item.id));

  if (!interpretation) {
    // No interpretation available: treat all as unresolved
    return {
      domain,
      scope,
      subjectId,
      status,
      evidence: items.map(item => ({ id: item.id, resolution: 'DANGLING' as const })),
      provenance: items.map(item => ({ evidenceId: item.id }))
    };
  }

  const resolutionMap = resolveEvidenceIds(items.map(item => item.id), {
    domainUniverse: interpretation.evidence,
    externalNamespaces
  }, domain);

  // Enforce strict resolution: fail on any unresolved evidence
  if (enforceStrictResolution) {
    for (const [id, resolution] of resolutionMap) {
      if (resolution.resolution !== 'RESOLVED') {
        throw new Error(`Evidence resolution failed for ${id}: ${resolution.resolution}${resolution.actualOwner ? ` (owner: ${resolution.actualOwner})` : ''}`);
      }
    }
  }

  return {
    domain,
    scope,
    subjectId,
    status,
    evidence: items.map(item => acceptanceEvidenceFromResolution(
      item.id,
      resolutionMap.get(item.id) ?? { resolution: 'DANGLING' }
    )),
    provenance: items.map(item => acceptanceProvenanceFromResolution(
      item.id,
      resolutionMap.get(item.id) ?? { resolution: 'DANGLING' }
    ))
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
  const resolutionMap = resolveEvidenceIds(synthesis.evidenceIds, {
    domainUniverse: interpretation.evidence
  }, domain);
  return {
    domain,
    scope: 'LIFETIME',
    subjectId: `chart:${domain.toLowerCase()}`,
    status: synthesis.finalStatus,
    conclusionKind: 'SYNTHESIS_FINAL',
    evidence: synthesis.evidenceIds.map(id => acceptanceEvidenceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    )),
    provenance: synthesis.evidenceIds.map(id => acceptanceProvenanceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    ))
  };
}

/** Acceptance-layer adapter: extracts UI surface conclusion from view model. */
function uiConclusionFromViewModel(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult,
  interpretation: DomainInterpretation
): AcceptanceConclusion | undefined {
  if (domain === 'CAREER') {
    // careerView.profession.status is a completeness view, not the C11 finalStatus
    // It should be compared to a profession-completeness expectation, not to canonical C11
    const status = result.careerView.profession.status;
    if (!status) return undefined;

    const evidenceItems = result.careerView.evidence.map(e => ({
      id: e.id,
      source: e.source,
      ruleId: e.ruleId,
      role: e.role
    }));

    // UI surfaces should have strict evidence resolution
    const conclusion = conclusionFromValues(domain, status, evidenceItems, interpretation, 'LIFETIME', `chart:${domain.toLowerCase()}`, true);

    // Mark as profession-completeness conclusion kind (not synthesis-final)
    if (conclusion) {
      return {
        ...conclusion,
        conclusionKind: 'PROFESSION_COMPLETENESS'
      };
    }

    return conclusion;
  }

  // wealthView.overall.status should be compared to CW-05 only if the ViewModel exposes it
  // Otherwise it's a different conclusion kind
  const wealthStatus = result.wealthView.overall.status;
  if (!wealthStatus) return undefined;

  const evidenceItems = result.wealthView.evidence.map(e => ({
    id: e.id,
    source: e.source,
    ruleId: e.ruleId,
    role: e.role
  }));

  // UI surfaces should have strict evidence resolution
  const conclusion = conclusionFromValues(domain, wealthStatus, evidenceItems, interpretation, 'LIFETIME', `chart:${domain.toLowerCase()}`, true);

  // Mark as presentation conclusion kind (not synthesis-final)
  if (conclusion) {
    return {
      ...conclusion,
      conclusionKind: 'PRESENTATION'
    };
  }

  return conclusion;
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
  const careerC11 = domain === 'CAREER' ? result.aiContext.career?.canonicalC11 : undefined;
  if (!finalSynthesis && !careerC11) return undefined;

  const status = careerC11?.finalStatus ?? finalSynthesis?.finalStatus;
  if (!status) return undefined;

  // Resolve evidence against the AI context's evidence universe
  const aiEvidenceUniverse = result.aiContext.evidence || [];
  const evidenceIds = careerC11?.canonicalEvidenceIds ?? finalSynthesis?.evidenceIds ?? [];
  const resolutionMap = resolveEvidenceIds(evidenceIds, {
    domainUniverse: interpretation.evidence,
    externalNamespaces: [{ owner: domain, records: aiEvidenceUniverse }]
  }, domain);

  return {
    domain,
    scope: 'LIFETIME',
    subjectId: `chart:${domain.toLowerCase()}`,
    status,
    conclusionKind: 'SYNTHESIS_FINAL',
    evidence: evidenceIds.map(id => acceptanceEvidenceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    )),
    provenance: evidenceIds.map(id => acceptanceProvenanceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    ))
  };
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
  const careerC11 = domain === 'CAREER' ? result.productAiContext.career?.canonicalC11 : undefined;
  if (!finalSynthesis && !careerC11) return undefined;

  const status = careerC11?.finalStatus ?? finalSynthesis?.finalStatus;
  if (!status) return undefined;

  // Resolve evidence against the product AI context's evidence universe
  const productAiEvidenceUniverse = result.productAiContext.evidence || [];
  const evidenceIds = careerC11?.canonicalEvidenceIds ?? finalSynthesis?.evidenceIds ?? [];
  const resolutionMap = resolveEvidenceIds(evidenceIds, {
    domainUniverse: interpretation.evidence,
    externalNamespaces: [{ owner: domain, records: productAiEvidenceUniverse }]
  }, domain);

  return {
    domain,
    scope: 'LIFETIME',
    subjectId: `chart:${domain.toLowerCase()}`,
    status,
    conclusionKind: 'SYNTHESIS_FINAL',
    evidence: evidenceIds.map(id => acceptanceEvidenceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    )),
    provenance: evidenceIds.map(id => acceptanceProvenanceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    ))
  };
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

  // Resolve all trace evidence IDs through discriminated resolver
  const resolutionMap = resolveEvidenceIds(evidenceIds, {
    domainUniverse: interpretation.evidence
  }, domain);
  const evidence = evidenceIds.map(id => acceptanceEvidenceFromResolution(
    id,
    resolutionMap.get(id) ?? { resolution: 'DANGLING' }
  ));
  const provenance = evidenceIds.map(id => acceptanceProvenanceFromResolution(
    id,
    resolutionMap.get(id) ?? { resolution: 'DANGLING' }
  ));

  return {
    domain,
    scope: 'LIFETIME',
    subjectId: `chart:${domain.toLowerCase()}`,
    status,
    evidence,
    provenance
  };
}

function projectSelectedPeriod(
  domain: GoldenAcceptanceDomain,
  result: GoldenAcceptanceProductionResult
): SelectedPeriodAcceptanceProjection {
  const selectedPeriod = result.selectedPeriod;
  if (!selectedPeriod) {
    return {
      domain,
      scope: 'SELECTED_PERIOD',
      subjectId: `chart:${domain.toLowerCase()}`,
      resultState: 'UNAVAILABLE',
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
      dataStatus: selectedPeriod.wealth.dimensions[dim].dataStatus,
      promiseEvidenceIds: selectedPeriod.wealth.dimensions[dim].promiseEvidenceIds,
      dashaRuleReferences: selectedPeriod.wealth.dimensions[dim].dashaRuleReferences
    }))
    : [];

  const interpretation = domain === 'CAREER' ? result.career : result.wealth;
  const dashaEvidence = (selectedPeriod.evidence ?? []).filter(item => item.stage === domain);
  const promiseEvidenceIds = wealthDimensions.flatMap(dimension => dimension.promiseEvidenceIds);
  const dashaEvidenceIds = Array.from(new Set([
    ...dashaEvidence.flatMap(item => item.evidenceId ? [item.evidenceId] : []),
    ...promiseEvidenceIds
  ]));
  const availableEvidence = result.aiContext.selectedPeriod?.availableEvidence ?? [];
  const resolutionMap = resolveEvidenceIds(dashaEvidenceIds, {
    domainUniverse: selectedPeriodEvidenceUniverse(interpretation.evidence, availableEvidence)
  }, domain);

  return {
    domain,
    scope: 'SELECTED_PERIOD',
    subjectId: `chart:${domain.toLowerCase()}`,
    resultState: 'OK',
    careerQualificationStatus,
    wealthDimensions: wealthDimensions.length > 0 ? wealthDimensions : undefined,
    evidence: dashaEvidenceIds.map(id => acceptanceEvidenceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    )),
    provenance: dashaEvidenceIds.map(id => acceptanceProvenanceFromResolution(
      id,
      resolutionMap.get(id) ?? { resolution: 'DANGLING' }
    )),
    ...(result.selectedPeriodView.interval === undefined ? {} : {
      interval: {
        start: result.selectedPeriodView.interval.start,
        end: result.selectedPeriodView.interval.end
      },
      temporalRelation: selectedPeriod.period.temporalRelation
    })
  };
}

export function createGoldenAcceptanceProductionPipeline(
  domain: 'CAREER',
  fixtureKind?: GoldenAcceptanceFixtureKind
): GoldenAcceptancePipeline<'CAREER'>;
export function createGoldenAcceptanceProductionPipeline(
  domain: 'WEALTH',
  fixtureKind?: GoldenAcceptanceFixtureKind
): GoldenAcceptancePipeline<'WEALTH'>;
export function createGoldenAcceptanceProductionPipeline(
  domain: GoldenAcceptanceDomain,
  fixtureKind?: GoldenAcceptanceFixtureKind
): GoldenAcceptancePipeline;
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
      const common = {
        'ai-context': aiConclusion ?? ACCEPTANCE_MISSING,
        'product-ai-context': productAiConclusion ?? ACCEPTANCE_MISSING,
        'reasoning-trace': trace ?? ACCEPTANCE_MISSING,
        'json-export': jsonConclusion ?? ACCEPTANCE_MISSING,
        'selected-period-ui': projectSelectedPeriod(domain, result),
        canonical
      };
      const projections = domain === 'CAREER'
        ? { ...common, 'career-ui': uiConclusion ?? ACCEPTANCE_MISSING }
        : { ...common, 'wealth-ui': uiConclusion ?? ACCEPTANCE_MISSING };
      return projections as GoldenAcceptanceProjections;
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

function selectedPeriodDifferences(
  domain: GoldenAcceptanceDomain,
  projection: SelectedPeriodAcceptanceProjection | typeof ACCEPTANCE_MISSING,
  domainUniverse: readonly EvidenceResolverRecord[],
  availableEvidence: readonly EvidenceResolverRecord[],
  ruleReferenceUniverse: readonly {
    readonly ruleId?: string;
    readonly source?: string;
    readonly level?: 'MD' | 'AD' | 'PD';
    readonly stage: 'CAREER' | 'WEALTH';
    readonly referenceKind?: 'EVIDENCE' | 'RULE';
  }[]
): readonly ParityDifference[] {
  if (projection === ACCEPTANCE_MISSING) {
    return [{
      surface: 'selected-period-ui',
      kind: 'MISSING',
      path: '$',
      reason: 'Required selected-period projection was not produced.'
    }];
  }
  const expected = domain === 'CAREER'
    ? SELECTED_PERIOD_CAREER_ACCEPTANCE_BASELINE
    : SELECTED_PERIOD_WEALTH_ACCEPTANCE_BASELINE;
  const differences: ParityDifference[] = [];
  for (const key of ['domain', 'scope', 'subjectId'] as const) {
    if (projection[key] !== expected[key]) {
      differences.push({
        surface: 'selected-period-ui',
        kind: 'VALUE_MISMATCH',
        path: `$.${key}`,
        expected: expected[key],
        actual: projection[key],
        reason: `Selected-period ${key} differs from the approved fixture.`
      });
    }
  }
  if (projection.resultState !== expected.resultState) {
    differences.push({
      surface: 'selected-period-ui',
      kind: 'STATUS_MISMATCH',
      path: '$.resultState',
      expected: expected.resultState,
      actual: projection.resultState,
      reason: 'Selected-period result state differs from the approved fixture.'
    });
  }
  if (projection.careerQualificationStatus !== expected.careerQualificationStatus) {
    differences.push({
      surface: 'selected-period-ui',
      kind: 'VALUE_MISMATCH',
      path: '$.careerQualificationStatus',
      expected: expected.careerQualificationStatus,
      actual: projection.careerQualificationStatus,
      reason: 'Selected-period careerQualificationStatus differs from the approved fixture.'
    });
  }
  const baselineDimensions = (dimensions: SelectedPeriodAcceptanceProjection['wealthDimensions']) =>
    (dimensions ?? []).map(({ dimension, effect, dataStatus }) => ({ dimension, effect, dataStatus }));
  if (!deepEqualAcceptance(baselineDimensions(projection.wealthDimensions), baselineDimensions(expected.wealthDimensions))) {
    differences.push({
      surface: 'selected-period-ui',
      kind: 'VALUE_MISMATCH',
      path: '$.wealthDimensions',
      expected: baselineDimensions(expected.wealthDimensions),
      actual: baselineDimensions(projection.wealthDimensions),
      reason: 'Selected-period dimension effects or data status differ from the approved fixture.'
    });
  }
  if (!deepEqualAcceptance(projection.interval, expected.interval)
    || projection.temporalRelation !== expected.temporalRelation) {
    differences.push({
      surface: 'selected-period-ui',
      kind: 'TEMPORAL_MISMATCH',
      path: '$.temporal',
      expected: { interval: expected.interval, temporalRelation: expected.temporalRelation },
      actual: { interval: projection.interval, temporalRelation: projection.temporalRelation },
      reason: 'Selected-period interval or temporal relation differs from the approved fixture.'
    });
  }

  const promiseEvidenceIds = (projection.wealthDimensions ?? [])
    .flatMap(dimension => dimension.promiseEvidenceIds ?? []);
  const evidenceIds = Array.from(new Set([
    ...projection.evidence.map(item => item.id),
    ...promiseEvidenceIds
  ]));
  const resolutions = resolveEvidenceIds(evidenceIds, {
    domainUniverse: selectedPeriodEvidenceUniverse(domainUniverse, availableEvidence)
  }, domain);
  const reportedIssues = new Set<string>();
  const reportResolutionIssue = (id: string, resolution: EvidenceResolution, path: string) => {
    const key = `${id}:${resolution}:${path}`;
    if (reportedIssues.has(key)) return;
    reportedIssues.add(key);
    const kind = resolution === 'DANGLING' ? 'DANGLING_REFERENCE'
      : resolution === 'AMBIGUOUS' ? 'AMBIGUOUS_EVIDENCE'
        : resolution === 'OWNER_MISMATCH' ? 'OWNER_MISMATCH'
          : 'EXTERNAL_EVIDENCE';
    differences.push({
      surface: 'selected-period-ui',
      kind,
      path,
      actual: id,
      reason: `Selected-period reference ${id} resolves as ${resolution}.`
    });
  };
  for (const id of evidenceIds) {
    const resolution = resolutions.get(id);
    if (!resolution || resolution.resolution !== 'RESOLVED') {
      reportResolutionIssue(id, resolution?.resolution ?? 'DANGLING', '$.evidence');
    }
  }

  for (const dimension of projection.wealthDimensions ?? []) {
    for (const reference of dimension.dashaRuleReferences ?? []) {
      const candidates = ruleReferenceUniverse.filter(candidate =>
        candidate.referenceKind === 'RULE'
        && candidate.stage === 'WEALTH'
        && candidate.ruleId === reference.ruleId
        && candidate.source === reference.source
        && candidate.level === reference.level
      );
      if (candidates.length === 0) {
        differences.push({
          surface: 'selected-period-ui',
          kind: 'DANGLING_REFERENCE',
          path: `$.wealthDimensions.${dimension.dimension}.dashaRuleReferences`,
          actual: reference.ruleId,
          reason: `Dasha rule reference ${reference.ruleId} has no matching domain evidence record.`
        });
      }
    }
  }

  const provenanceByEvidenceId = new Map<string, AcceptanceProvenance[]>();
  for (const item of projection.provenance) {
    const entries = provenanceByEvidenceId.get(item.evidenceId) ?? [];
    entries.push(item);
    provenanceByEvidenceId.set(item.evidenceId, entries);
  }
  for (const [evidenceId, provenanceEntries] of provenanceByEvidenceId) {
    const resolution = resolutions.get(evidenceId);
    if (!evidenceIds.includes(evidenceId) || !resolution?.record) {
      differences.push({
        surface: 'selected-period-ui',
        kind: 'DANGLING_REFERENCE',
        path: '$.provenance',
        actual: evidenceId,
        reason: `Selected-period provenance references evidence ${evidenceId}, which does not resolve.`
      });
      continue;
    }
    if (provenanceEntries.length > 1) {
      differences.push({
        surface: 'selected-period-ui',
        kind: 'AMBIGUOUS_EVIDENCE',
        path: '$.provenance',
        actual: evidenceId,
        reason: `Selected-period provenance has multiple entries for ${evidenceId}.`
      });
      continue;
    }
    const actualProvenance = provenanceEntries[0];
    if (actualProvenance.owner !== resolution.record.domain) {
      differences.push({
        surface: 'selected-period-ui',
        kind: 'OWNER_MISMATCH',
        path: '$.provenance',
        actual: evidenceId,
        expected: resolution.record.domain,
        reason: `Selected-period provenance owner does not match evidence ${evidenceId}.`
      });
      continue;
    }
    const expectedProvenance = acceptanceProvenanceFromResolution(evidenceId, resolution);
    if (!deepEqualAcceptance(actualProvenance, expectedProvenance)) {
      differences.push({
        surface: 'selected-period-ui',
        kind: 'PROVENANCE_MISMATCH',
        path: '$.provenance',
        expected: expectedProvenance,
        actual: actualProvenance,
        reason: `Selected-period provenance differs from evidence ${evidenceId}.`
      });
    }
  }
  return differences;
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
  readonly surfaceGates: readonly AcceptanceGate[];
  readonly report: GoldenAcceptanceReport;
  readonly selectedPeriod?: SelectedPeriodAcceptanceProjection;
}

function projectionForSurface(
  projections: GoldenAcceptanceProjections,
  name: string
): AcceptanceConclusion | SelectedPeriodAcceptanceProjection | readonly AcceptanceConclusion[] | typeof ACCEPTANCE_MISSING | undefined {
  return Object.prototype.hasOwnProperty.call(projections, name)
    ? (projections as unknown as Readonly<Record<string, AcceptanceSurfaceProjection | undefined>>)[name]
    : undefined;
}

/** Runs canonical baseline and surface gates against one real interpreter run. */
export function runGoldenAcceptanceProductionGate(
  domain: GoldenAcceptanceDomain,
  fixtureKind: GoldenAcceptanceFixtureKind = 'STANDARD',
  productionResult?: GoldenAcceptanceProductionResult
): GoldenAcceptanceProductionGateResult {
  const result = productionResult ?? buildProductionRun(fixtureKind, domain);
  const pipeline = createGoldenAcceptanceProductionPipeline(domain, fixtureKind);
  const projections = pipeline.collect(result);
  const canonical = projections.canonical;
  if (!canonical || isConclusionList(canonical)) {
    throw new Error('Production acceptance pipeline did not collect exactly one canonical conclusion.');
  }
  const expected = normalizeAcceptanceConclusion(canonical);
  const surfaces: AcceptanceSurface[] = [];
  const surfaceDifferences: ParityDifference[] = [];
  const expectedEvidenceIds = expected.evidence.map(item => item.id);
  for (const name of REQUIRED_SURFACES[domain]) {
    const projection = projectionForSurface(projections, name);
    if (name === 'selected-period-ui') {
      const selectedProjection = projection === undefined || projection === ACCEPTANCE_MISSING
        ? ACCEPTANCE_MISSING
        : projection as SelectedPeriodAcceptanceProjection;
      const interpretation = domain === 'CAREER' ? result.career : result.wealth;
      surfaceDifferences.push(...selectedPeriodDifferences(
        domain,
        selectedProjection,
        interpretation.evidence,
        result.aiContext.selectedPeriod?.availableEvidence ?? [],
        result.selectedPeriod?.evidence ?? []
      ));
      continue;
    }
    const conclusions = projection === undefined || projection === ACCEPTANCE_MISSING
      ? [undefined]
      : Array.isArray(projection)
        ? projection
        : [projection as AcceptanceConclusion];
    const allowedDifferenceKinds = SURFACE_ALLOWED_DIFFERENCE_KINDS[name] ?? [];
    for (const [index, conclusion] of conclusions.entries()) {
      const surfaceName = conclusions.length > 1 ? `${name}[${index}]` : name;
      const surfaceSpecific = conclusion?.conclusionKind !== undefined
        && conclusion.conclusionKind !== 'SYNTHESIS_FINAL';
      const surface = normalizeAcceptanceSurface(surfaceName, conclusion, allowedDifferenceKinds, {
        compareStatus: !surfaceSpecific && name !== 'reasoning-trace',
        compareConclusionKind: !surfaceSpecific && name !== 'reasoning-trace' && name !== 'json-export',
        evidenceContract: surfaceSpecific ? 'SURFACE_SPECIFIC' : 'CANONICAL'
      });
      if (surface.conclusion !== ACCEPTANCE_MISSING) {
        surfaceDifferences.push(...assertConclusionInventory([surface.conclusion]));
      }
      surfaces.push(surface);
    }
  }
  const selectedPeriodValue = projectionForSurface(projections, 'selected-period-ui');
  const selectedPeriod = selectedPeriodValue === undefined || selectedPeriodValue === ACCEPTANCE_MISSING
    ? undefined
    : selectedPeriodValue as SelectedPeriodAcceptanceProjection;
  surfaceDifferences.push(...assertParity(expected, surfaces));
  const baselineDifferences = assertCanonicalBaseline(domain, result);
  const actualSurfaceGates = buildRequiredSurfaceGates(
    REQUIRED_SURFACES[domain],
    projections,
    surfaceDifferences,
    expectedEvidenceIds
  );
  const reportGates: readonly AcceptanceGate[] = [
    {
      name: 'canonical',
      status: baselineDifferences.length > 0 ? 'FAIL' : 'PASS',
      ...(baselineDifferences.length === 0 ? {} : { details: `${baselineDifferences.length} baseline difference(s)` })
    },
    ...actualSurfaceGates
  ];
  const report = buildGoldenAcceptanceReport(
    reportGates,
    [...baselineDifferences, ...surfaceDifferences],
    true
  );
  return {
    expected,
    baselineDifferences: Object.freeze([...baselineDifferences]),
    surfaceDifferences: Object.freeze([...surfaceDifferences]),
    surfaceGates: Object.freeze(actualSurfaceGates),
    report,
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
  const resolutions = resolveEvidenceIds(evidenceIds, {
    domainUniverse: interpretation.evidence
  }, domain);
  return evidenceIds.flatMap(id => {
    const resolution = resolutions.get(id);
    return resolution?.resolution === 'RESOLVED'
      ? [acceptanceProvenanceFromResolution(id, resolution)]
      : [];
  });
}
