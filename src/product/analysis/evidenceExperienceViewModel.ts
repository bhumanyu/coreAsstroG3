import type {
  ProductAnalysis,
  ProductConfidenceCoverageStatus,
  ProductConfidenceLayerState,
  ProductDiagnosticPresentationState,
  ProductEvidence,
  ProductEvidenceExperienceItem,
  ProductEvidenceExperienceViewModel,
  ProductUnifiedConfidenceProjection
} from './productAnalysisTypes';

function humanize(value: string): string {
  return value.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
}

function confidenceLabel(value: string): string {
  return value === 'HIGH' ? 'High confidence' : value === 'MEDIUM' ? 'Moderate confidence' : 'Low confidence';
}

function coverageLabel(value: ProductConfidenceCoverageStatus): string {
  switch (value) {
    case 'COMPLETE': return 'Required evidence available';
    case 'PARTIAL': return 'Some required evidence is incomplete';
    case 'INSUFFICIENT': return 'Not enough evidence to assess';
    case 'BLOCKED': return 'Assessment blocked by a diagnostic';
    case 'NOT_APPLICABLE': return 'Not applicable';
    case 'UNAVAILABLE': return 'Assessment unavailable';
    default: return 'Coverage not determined';
  }
}

function layerLabel(id: string): string {
  const labels: Record<string, string> = {
    NATAL_PROMISE: 'Natal foundation',
    DASHA: 'Dasha activation',
    D10: 'D10 divisional confirmation',
    D2: 'D2 wealth confirmation',
    TRANSIT: 'Transit context'
  };
  return labels[id] ?? humanize(id);
}

function layerStateLabel(state: ProductConfidenceLayerState): string {
  switch (state) {
    case 'AVAILABLE': return 'Available';
    case 'PARTIAL': return 'Partially available';
    case 'BLOCKED': return 'Blocked';
    case 'NOT_APPLICABLE': return 'Not applicable';
    default: return 'Unavailable';
  }
}

function diagnosticState(severity: string): ProductDiagnosticPresentationState {
  if (severity === 'ERROR') return 'BLOCKED';
  if (severity === 'WARNING') return 'WARNING';
  return 'INFO';
}

function evidenceItem(
  item: ProductEvidence,
  allById: ReadonlyMap<string, ProductEvidence>
): ProductEvidenceExperienceItem {
  const ids = [...new Set(item.derivedFromIds ?? [])];
  const resolved = ids.flatMap(id => {
    const related = allById.get(id);
    return related ? [{ id, title: related.title }] : [];
  });
  return Object.freeze({
    id: item.id,
    title: item.title,
    statement: item.statement,
    direction: item.direction,
    role: item.role,
    sourceLabel: item.source,
    ...(item.ruleId ? { ruleId: item.ruleId } : {}),
    derivedFromIds: Object.freeze(ids),
    resolvedRelatedEvidence: Object.freeze(resolved),
    unresolvedRelatedCount: ids.length - resolved.length
  });
}

/**
 * D03 presentation selector.
 * It reuses D01 domain-owned confidence metadata and never computes or promotes
 * confidence/availability. Technical identifiers remain in disclosures only.
 */
export function selectEvidenceExperience(
  analysis: ProductAnalysis,
  domain: 'CAREER' | 'WEALTH',
  projection?: ProductUnifiedConfidenceProjection
): ProductEvidenceExperienceViewModel {
  const unified = projection ?? selectUnifiedConfidenceProjection(analysis);
  const metadata = unified.domains[domain];
  const sourceEvidence = domain === 'CAREER' ? analysis.career.evidence : analysis.wealth.evidence;
  const byId = new Map(sourceEvidence.map(item => [item.id, item]));
  const evidence = sourceEvidence.map(item => evidenceItem(item, byId));
  const domainDiagnostics = unified.diagnostics.filter(item => item.domain === domain);
  const unavailableDiagnostics = unified.unavailableLayers
    .filter(item => item.domain === domain)
    .map(item => ({
      id: `layer:${item.layer}`,
      state: item.reason.toLowerCase().includes('blocked') ? 'BLOCKED' as const : 'UNAVAILABLE' as const,
      title: `${layerLabel(item.layer)} unavailable`,
      message: item.reason,
      technicalCode: item.layer
    }));
  const diagnostics = [
    ...domainDiagnostics.map(item => ({
      id: item.code,
      state: diagnosticState(item.severity),
      title: item.severity === 'ERROR' ? 'Calculation could not complete' : item.severity === 'WARNING' ? 'Evidence limitation' : 'Information',
      message: item.message,
      technicalCode: item.code
    })),
    ...unavailableDiagnostics
  ];
  const conflictEvidence = evidence.filter(item =>
    item.direction === 'MIXED' || item.direction === 'UNAVAILABLE' ||
    item.role === 'CONFLICTING' || item.direction === 'CHALLENGE' && item.role === 'SUPPORTING'
  );
  const promiseStrength = domain === 'CAREER' ? analysis.career.promise.strength : analysis.wealth.overall.promise;
  return Object.freeze({
    domain,
    confidence: metadata.confidence,
    confidenceLabel: confidenceLabel(metadata.confidence),
    promiseStrengthLabel: humanize(String(promiseStrength)),
    coverage: metadata.coverage,
    coverageLabel: coverageLabel(metadata.coverage),
    owner: metadata.owner,
    confidenceReasons: Object.freeze([...metadata.reasons]),
    layers: Object.freeze(metadata.layers.map(layer => Object.freeze({
      id: layer.id,
      label: layerLabel(layer.id),
      state: layer.state,
      stateLabel: layerStateLabel(layer.state),
      ...(layer.reason ? { reason: layer.reason } : {}),
      required: layer.required
    }))),
    diagnostics: Object.freeze(diagnostics),
    conflicts: Object.freeze(conflictEvidence),
    evidence: Object.freeze(evidence),
    missingEvidenceCount: metadata.layers.filter(layer =>
      layer.state === 'UNAVAILABLE' || layer.state === 'BLOCKED' || layer.state === 'PARTIAL'
    ).length
  });
}

