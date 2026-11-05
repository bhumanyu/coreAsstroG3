import type {
  ProductAnalysis,
  ProductConfidence,
  ProductConfidenceDiagnostic,
  ProductConfidenceLayerState,
  ProductDomainConfidenceMetadata,
  ProductUnifiedConfidenceProjection
} from './productAnalysisTypes';

type Domain = 'CAREER' | 'WEALTH';

function asConfidence(value: unknown): ProductConfidence {
  return value === 'HIGH' || value === 'LOW' || value === 'MEDIUM' ? value : 'LOW';
}

function layerState(value: unknown): ProductConfidenceLayerState {
  if (value === 'AVAILABLE' || value === 'PARTIAL' || value === 'UNAVAILABLE' ||
      value === 'BLOCKED' || value === 'NOT_APPLICABLE') return value;
  return 'UNAVAILABLE';
}

function productDiagnostic(
  code: string,
  severity: 'INFO' | 'WARNING' | 'ERROR',
  message: string,
  evidenceIds: readonly string[] = [],
  ruleIds: readonly string[] = []
): ProductConfidenceDiagnostic {
  return Object.freeze({
    code,
    severity,
    message,
    ...(evidenceIds.length ? { evidenceIds: Object.freeze([...new Set(evidenceIds)].sort()) } : {}),
    ...(ruleIds.length ? { ruleIds: Object.freeze([...new Set(ruleIds)].sort()) } : {})
  });
}

function deriveMetadata(
  domain: Domain,
  analysis: ProductAnalysis
): ProductDomainConfidenceMetadata {
  const supplied = domain === 'CAREER'
    ? analysis.confidenceMetadata?.career
    : analysis.confidenceMetadata?.wealth;

  if (supplied) {
    return Object.freeze({
      ...supplied,
      confidence: asConfidence(supplied.confidence),
      layers: Object.freeze(supplied.layers.map(layer => Object.freeze({
        ...layer,
        state: layerState(layer.state),
        evidenceIds: layer.evidenceIds ? Object.freeze([...layer.evidenceIds]) : undefined
      }))),
      reasons: Object.freeze([...supplied.reasons]),
      diagnostics: Object.freeze(supplied.diagnostics.map(d => Object.freeze({ ...d }))),
      evidenceIds: Object.freeze([...new Set(supplied.evidenceIds)].sort()),
      ruleIds: Object.freeze([...new Set(supplied.ruleIds)].sort())
    });
  }

  const warnings = (analysis.warnings ?? []).filter(w => !w.domain || w.domain === domain);
  const diagnostics = warnings.map(w => productDiagnostic(
    w.code,
    w.severity === 'ERROR' ? 'ERROR' : w.severity === 'INFO' ? 'INFO' : 'WARNING',
    w.message
  ));
  const evidence = domain === 'CAREER' ? analysis.career.evidence : analysis.wealth.evidence;
  const evidenceIds = [...new Set(evidence.map(item => item.id))].sort();
  const ruleIds = [...new Set(evidence.map(item => item.ruleId).filter((id): id is string => Boolean(id)))].sort();

  const layers = domain === 'CAREER'
    ? [
        { id: 'NATAL_PROMISE', state: evidenceIds.length ? 'AVAILABLE' : 'UNAVAILABLE', required: true, reason: evidenceIds.length ? undefined : 'Career evidence is not present in this product record.', evidenceIds },
        { id: 'DASHA', state: layerState(analysis.career.activation.dasha.status), required: true, reason: undefined, evidenceIds: analysis.career.activation.dasha.periods.flatMap(p => p.evidenceIds ?? []) },
        { id: 'D10', state: layerState(analysis.career.d10.relationship === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'), required: false, reason: analysis.career.d10.relationship === 'UNAVAILABLE' ? 'D10 relationship is unavailable.' : undefined, evidenceIds: [] },
        { id: 'TRANSIT', state: layerState(analysis.career.activation.transit.status), required: false, reason: analysis.career.activation.transit.status === 'UNAVAILABLE' ? 'Career transit layer is unavailable.' : undefined, evidenceIds: [] }
      ] as const
    : [
        { id: 'NATAL_PROMISE', state: evidenceIds.length ? 'AVAILABLE' : 'UNAVAILABLE', required: true, reason: evidenceIds.length ? undefined : 'Wealth evidence is not present in this product record.', evidenceIds },
        { id: 'DASHA', state: layerState(analysis.wealth.activation.dasha.status), required: true, reason: undefined, evidenceIds: analysis.wealth.activation.dasha.periods.flatMap(p => p.evidenceIds ?? []) },
        { id: 'D2', state: 'UNAVAILABLE', required: false, reason: 'D2 remains unavailable under the committed calculation and interpretation validation gate.', evidenceIds: [] },
        { id: 'TRANSIT', state: layerState(analysis.wealth.activation.transit.status), required: false, reason: analysis.wealth.activation.transit.status === 'UNAVAILABLE' ? 'Wealth transit layer is unavailable.' : undefined, evidenceIds: [] }
      ] as const;

  const hasError = diagnostics.some(d => d.severity === 'ERROR');
  const requiredUnavailable = layers.some(layer => layer.required && layer.state === 'UNAVAILABLE');
  const requiredBlocked = layers.some(layer => layer.required && layer.state === 'BLOCKED');
  const partial = layers.some(layer => layer.required && layer.state === 'PARTIAL');
  const coverage = hasError || requiredBlocked
    ? 'BLOCKED'
    : requiredUnavailable
      ? evidenceIds.length ? 'INSUFFICIENT' : 'UNAVAILABLE'
      : partial ? 'PARTIAL' : 'COMPLETE';

  const confidence = domain === 'CAREER'
    ? asConfidence(analysis.career.promise.confidence)
    : asConfidence(analysis.wealth.overall.confidence);

  const reasons = [
    'Domain confidence is copied from its domain-owned result; D01 does not recalculate confidence.',
    coverage === 'COMPLETE' ? 'Required presentation layers are available.' :
      coverage === 'PARTIAL' ? 'One or more required presentation layers are partial.' :
        coverage === 'BLOCKED' ? 'A blocking diagnostic or required blocked layer is present.' :
          'One or more required presentation layers are unavailable or missing.'
  ];
  if (domain === 'WEALTH') reasons.push('D2 is intentionally unavailable and is not treated as negative evidence.');
  if (diagnostics.length) reasons.push(`${diagnostics.length} domain warning/error diagnostic(s) are available.`);
  return Object.freeze({
    confidence,
    coverage,
    layers: Object.freeze(layers.map(layer => Object.freeze(layer))),
    reasons: Object.freeze(reasons),
    diagnostics: Object.freeze(diagnostics),
    evidenceIds: Object.freeze(evidenceIds),
    ruleIds: Object.freeze(ruleIds),
    owner: domain === 'CAREER' ? 'C11' : 'CW-05'
  });
}

export function selectUnifiedConfidenceProjection(
  analysis: ProductAnalysis
): ProductUnifiedConfidenceProjection {
  const career = deriveMetadata('CAREER', analysis);
  const wealth = deriveMetadata('WEALTH', analysis);
  const diagnostics = [
    ...career.diagnostics.map(d => Object.freeze({ ...d, domain: 'CAREER' as const })),
    ...wealth.diagnostics.map(d => Object.freeze({ ...d, domain: 'WEALTH' as const })),
    ...(analysis.warnings ?? []).filter(w => w.domain === 'SYSTEM' || w.domain === 'PRODUCT')
      .map(w => Object.freeze({
        ...productDiagnostic(w.code, w.severity === 'ERROR' ? 'ERROR' : w.severity === 'INFO' ? 'INFO' : 'WARNING', w.message),
        domain: 'PRODUCT' as const
      }))
  ];
  const unavailableLayers = (['CAREER', 'WEALTH'] as const).flatMap(domain => {
    const metadata = domain === 'CAREER' ? career : wealth;
    return metadata.layers
      .filter(layer => layer.state === 'UNAVAILABLE' || layer.state === 'BLOCKED' || layer.state === 'PARTIAL')
      .map(layer => Object.freeze({
        domain,
        layer: layer.id,
        reason: layer.reason ?? `${layer.id} is ${layer.state.toLowerCase()}.`
      }));
  });
  return Object.freeze({
    version: 'D01-v1',
    domains: Object.freeze({ CAREER: career, WEALTH: wealth }),
    diagnostics: Object.freeze(diagnostics),
    unavailableLayers: Object.freeze(unavailableLayers)
  });
}
