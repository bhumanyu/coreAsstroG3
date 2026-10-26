import type {
  ProductAnalysis,
  ProductSelectedPeriodResult,
  ProductSelectedPeriodSynthesis
} from '../../product/analysis/productAnalysisTypes';
import type {
  ChartExportV1,
  ExportedCareerInterpretationV1,
  ExportedCareerSynthesisV1,
  ExportedChartFactsV1,
  ExportedDiagnosticV1,
  ExportedEvidenceV1,
  ExportedInterpretationV1,
  ExportedMissingInputV1,
  ExportedPeriodV1,
  ExportedSelectedPeriodEvidenceV1,
  ExportedSelectedPeriodSynthesisV1,
  ExportedSynthesisProvenanceV1,
  ExportedValue,
  ExportedWealthInterpretationV1,
  ExportedWealthSynthesisV1
} from './chartExportSchema';
import { validateChartExport } from './chartExportSchema';

export interface ChartExportSelection {
  /** The exact aggregate rendered by the caller when export is requested. */
  readonly analysis: ProductAnalysis;
  /** The exact selected-period result associated with that aggregate, if any. */
  readonly selectedPeriod?: ProductSelectedPeriodResult;
}

function projectEvidence(
  evidence: ProductAnalysis['career']['evidence'] | ProductAnalysis['wealth']['evidence']
): readonly ExportedEvidenceV1[] {
  return evidence.map((item) => ({
    id: item.id,
    title: item.title,
    statement: item.statement,
    direction: item.direction,
    role: item.role,
    source: item.source,
    ...(item.ruleId === undefined ? {} : { ruleId: item.ruleId })
  }));
}

function projectDiagnostics(
  diagnostics: readonly { readonly code: string; readonly message: string }[]
): readonly ExportedDiagnosticV1[] {
  return diagnostics.map(({ code, message }) => ({ code, message }));
}

function projectSelectedPeriodEvidence(
  evidence: ProductSelectedPeriodSynthesis['evidence']
): readonly ExportedSelectedPeriodEvidenceV1[] {
  return evidence.map((item) => ({
    stage: item.stage,
    ...(item.classification === undefined ? {} : { classification: item.classification }),
    ...(item.evidenceId === undefined ? {} : { evidenceId: item.evidenceId }),
    ...(item.identityKey === undefined ? {} : { identityKey: item.identityKey }),
    ...(item.dimension === undefined ? {} : { dimension: item.dimension }),
    ...(item.polarity === undefined ? {} : { polarity: item.polarity }),
    ...(item.source === undefined ? {} : { source: item.source }),
    ...(item.ruleId === undefined ? {} : { ruleId: item.ruleId }),
    ...(item.level === undefined ? {} : { level: item.level }),
    ...(item.provenanceStage === undefined ? {} : { provenanceStage: item.provenanceStage }),
    ...(item.referenceKind === undefined ? {} : { referenceKind: item.referenceKind })
  }));
}

function projectSelectedCareer(
  career: ProductSelectedPeriodSynthesis['career']
): ExportedCareerSynthesisV1 {
  return {
    qualificationBasis: career.qualificationBasis,
    expressions: career.expressions.map((expression) => ({
      expressionRefKey: expression.expressionRefKey,
      status: expression.status,
      linkedLevels: [...expression.linkedLevels],
      qualificationBasis: expression.qualificationBasis,
      ...(expression.matchBasis === undefined ? {} : { matchBasis: expression.matchBasis }),
      diagnostics: projectDiagnostics(expression.diagnostics),
      expressionEvidenceIds: [...expression.expressionEvidenceIds],
      qualifiedEvidenceIds: [...expression.qualifiedEvidenceIds],
      unqualifiedEvidenceIds: [...expression.unqualifiedEvidenceIds],
      mdDashaEvidenceIds: [...expression.mdDashaEvidenceIds],
      adDashaEvidenceIds: [...expression.adDashaEvidenceIds],
      expressionSource: expression.expressionSource
    })),
    diagnostics: projectDiagnostics(career.diagnostics)
  };
}

function projectSelectedWealth(
  wealth: ProductSelectedPeriodSynthesis['wealth']
): ExportedWealthSynthesisV1 {
  const projectDimension = (dimension: keyof ProductSelectedPeriodSynthesis['wealth']['dimensions']) => {
    const row = wealth.dimensions[dimension];
    return {
      dimension: row.dimension,
      effect: row.effect,
      dataStatus: row.dataStatus,
      linkedLevels: [...row.linkedLevels],
      diagnostics: projectDiagnostics(row.diagnostics),
      promiseEvidenceIds: [...row.promiseEvidenceIds],
      dashaRuleReferences: row.dashaRuleReferences.map(({ ruleId, source, level }) => ({ ruleId, source, level })),
      insufficientReason: row.insufficientReason
    };
  };
  return {
    dimensions: {
      ACCUMULATION: projectDimension('ACCUMULATION'),
      GAINS: projectDimension('GAINS'),
      FORTUNE: projectDimension('FORTUNE'),
      SPECULATION: projectDimension('SPECULATION')
    },
    diagnostics: projectDiagnostics(wealth.diagnostics)
  };
}

function projectMissingInputs(
  missingInputs: ProductSelectedPeriodSynthesis['missingInputs']
): readonly ExportedMissingInputV1[] {
  return missingInputs.map(({ domain, code, description }) => ({ domain, code, description }));
}

function projectSynthesisProvenance(
  provenance: ProductSelectedPeriodSynthesis['provenance']
): ExportedSynthesisProvenanceV1 {
  return {
    career: {
      status: provenance.career.status,
      ...(provenance.career.version === undefined ? {} : { version: provenance.career.version }),
      ...(provenance.career.qualificationBasis === undefined
        ? {} : { qualificationBasis: provenance.career.qualificationBasis })
    },
    wealth: {
      status: provenance.wealth.status,
      ...(provenance.wealth.version === undefined ? {} : { version: provenance.wealth.version })
    }
  };
}

function projectDeterministicSynthesis(
  synthesis: ProductSelectedPeriodSynthesis
): ExportedSelectedPeriodSynthesisV1 {
  return {
    career: projectSelectedCareer(synthesis.career),
    wealth: projectSelectedWealth(synthesis.wealth),
    evidence: projectSelectedPeriodEvidence(synthesis.evidence),
    missingInputs: projectMissingInputs(synthesis.missingInputs),
    provenance: projectSynthesisProvenance(synthesis.provenance),
    qualificationStatus: synthesis.qualificationStatus
  };
}

export function buildExportedChartFacts(analysis: ProductAnalysis): ExportedValue<ExportedChartFactsV1> {
  if (analysis.chart.isAvailable === false) {
    return { status: 'UNAVAILABLE', reason: 'Chart summary facts are unavailable in this analysis.' };
  }
  const facts: ExportedChartFactsV1 = {
    ...(analysis.chart.ascendantSign === undefined ? {} : { ascendantSign: analysis.chart.ascendantSign }),
    ...(analysis.chart.ascendantDegree === undefined ? {} : { ascendantDegree: analysis.chart.ascendantDegree }),
    ...(analysis.chart.moonSign === undefined ? {} : { moonSign: analysis.chart.moonSign }),
    ...(analysis.chart.sunSign === undefined ? {} : { sunSign: analysis.chart.sunSign }),
    ...(analysis.chart.moonNakshatra === undefined ? {} : { moonNakshatra: analysis.chart.moonNakshatra })
  };
  if (Object.keys(facts).length === 0) {
    return { status: 'UNAVAILABLE', reason: 'No chart summary facts are available.' };
  }
  const missing = [
    analysis.chart.ascendantSign === undefined ? 'ascendant sign' : undefined,
    analysis.chart.moonSign === undefined ? 'Moon sign' : undefined,
    analysis.chart.sunSign === undefined ? 'Sun sign' : undefined
  ].filter((item): item is string => item !== undefined);
  return missing.length > 0
    ? { status: 'PARTIAL', value: facts, limitations: [`Some chart summary fields are unavailable: ${missing.join(', ')}.`] }
    : { status: 'AVAILABLE', value: facts };
}

function projectCareer(analysis: ProductAnalysis): ExportedCareerInterpretationV1 {
  const { career } = analysis;
  return {
    status: career.status ?? analysis.status,
    promise: {
      ...(career.promise.status === undefined ? {} : { status: career.promise.status }),
      strength: career.promise.strength,
      confidence: career.promise.confidence,
      ...(career.promise.headline === undefined ? {} : { headline: career.promise.headline }),
      ...(career.promise.statement === undefined ? {} : { statement: career.promise.statement }),
      ...(career.promise.dominantManifestations === undefined
        ? {} : { dominantManifestations: [...career.promise.dominantManifestations] })
    },
    d10Relationship: career.d10.relationship,
    evidence: projectEvidence(career.evidence)
  };
}

function projectWealth(analysis: ProductAnalysis): ExportedWealthInterpretationV1 {
  const { wealth } = analysis;
  return {
    status: wealth.overall.status,
    promise: wealth.overall.promise,
    confidence: wealth.overall.confidence,
    ...(wealth.overall.headline === undefined ? {} : { headline: wealth.overall.headline }),
    ...(wealth.overall.statement === undefined ? {} : { statement: wealth.overall.statement }),
    d2Relationship: wealth.d2.relationship,
    evidence: projectEvidence(wealth.evidence)
  };
}

export function buildExportedInterpretation(analysis: ProductAnalysis): ExportedValue<ExportedInterpretationV1> {
  if (analysis.status === 'ERROR') {
    return { status: 'UNAVAILABLE', reason: 'Interpretation is unavailable because analysis did not complete.' };
  }
  const value: ExportedInterpretationV1 = {
    career: analysis.career.status === 'UNAVAILABLE'
      ? { status: 'UNAVAILABLE', reason: 'Career interpretation is unavailable.' }
      : { status: 'AVAILABLE', value: projectCareer(analysis) },
    wealth: analysis.wealth.overall.status === 'UNAVAILABLE'
      ? { status: 'UNAVAILABLE', reason: 'Wealth interpretation is unavailable.' }
      : { status: 'AVAILABLE', value: projectWealth(analysis) }
  };
  return analysis.status === 'PARTIAL'
    ? { status: 'PARTIAL', value, limitations: ['The canonical analysis is marked PARTIAL; unavailable domains remain explicitly unavailable.'] }
    : { status: 'AVAILABLE', value };
}

function selectedPeriodValue(
  selectedPeriod: ProductSelectedPeriodResult | undefined
): ExportedValue<ExportedPeriodV1> {
  if (!selectedPeriod || selectedPeriod.status !== 'OK') {
    return {
      status: 'UNAVAILABLE',
      reason: selectedPeriod?.status === 'INVALID_SELECTION'
        ? 'No valid selected period is available.'
        : selectedPeriod?.status === 'SYNTHESIS_FAILED'
          ? 'Selected-period synthesis did not complete.'
          : 'No selected period was provided for this export.'
    };
  }
  const { period } = selectedPeriod.synthesis;
  return {
    status: 'AVAILABLE',
    value: {
      selectedPeriodId: period.selectedPeriodId,
      mahadashaId: period.mahadashaId,
      mahadashaPlanet: period.mahadashaPlanet,
      antardashaId: period.antardashaId,
      antardashaPlanet: period.antardashaPlanet,
      start: period.interval.start,
      end: period.interval.end,
      analysisAsOf: period.analysisAsOf,
      temporalRelation: period.temporalRelation,
      deterministicSynthesis: projectDeterministicSynthesis(selectedPeriod.synthesis)
    }
  };
}

export function buildChartExport(selection: ChartExportSelection, exportedAt: string | Date): ChartExportV1 {
  const { analysis, selectedPeriod } = selection;
  const exportTimestamp = exportedAt instanceof Date ? exportedAt.toISOString() : exportedAt;
  const output: ChartExportV1 = {
    schemaVersion: 1,
    provenance: {
      analysisId: analysis.analysisId,
      asOf: analysis.asOf,
      exportedAt: exportTimestamp,
      engineVersion: analysis.engineVersion,
      rulesVersion: analysis.rulesVersion,
      methodology: { ...analysis.methodology }
    },
    birth: {
      dateTime: analysis.birth.dateTime,
      timezone: analysis.birth.timezone,
      latitude: analysis.birth.latitude,
      longitude: analysis.birth.longitude,
      ayanamsa: analysis.birth.ayanamsa
    },
    selectedPeriod: selectedPeriodValue(selectedPeriod),
    chartFacts: buildExportedChartFacts(analysis),
    interpretation: buildExportedInterpretation(analysis)
  };
  if (output.selectedPeriod.status === 'AVAILABLE'
    && output.selectedPeriod.value.analysisAsOf !== output.provenance.asOf) {
    throw new Error('Selected period analysisAsOf does not match export provenance asOf.');
  }
  const validation = validateChartExport(output);
  if (!validation.ok) throw new Error(`Chart export validation failed: ${validation.error}`);
  return output;
}

export type { ProductSelectedPeriodSynthesis };
