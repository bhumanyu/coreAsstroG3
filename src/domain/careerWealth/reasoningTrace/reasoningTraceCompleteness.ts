import type { DomainEvidence, EvidenceSource } from '../../interpretation';
import { validateDomainEvidenceRootLinks } from '../../interpretation/DomainEvidence';

export type ReasoningTraceEvidenceNamespace = 'IDENTITY' | 'OCCURRENCE';

export interface ReasoningTraceEvidenceReference {
  readonly id: string;
  readonly namespace: ReasoningTraceEvidenceNamespace;
}

export interface ReasoningTraceChartInputReference {
  readonly source: EvidenceSource;
  readonly planet?: string;
  readonly house?: number;
  readonly period?: 'MD' | 'AD' | 'PD';
  readonly timingPlanet?: string;
  readonly evidenceFamily?: string;
}

export interface ReasoningTraceEvidenceLink {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly conclusionNodeId: string;
  readonly synthesisRuleId: string;
  readonly includedInSynthesis: boolean;
  readonly synthesisEvidenceReference?: string;
  readonly synthesisEvidenceNamespace?: ReasoningTraceEvidenceNamespace;
  /** DomainEvidence.id; never replaced by identityKey or a provenance alias. */
  readonly evidenceOccurrenceId: string;
  readonly semanticIdentityKey?: string;
  readonly producerRuleId?: string;
  readonly sourceRuleId?: string;
  readonly sourceRecordId?: string;
  /** relatedEvidenceIds are occurrence IDs and are preserved in that namespace. */
  readonly sourceRecordOccurrenceIds: readonly string[];
  /** rootEvidenceIds are semantic identity keys and remain in their own namespace. */
  readonly rootEvidenceIdentityKeys: readonly string[];
  readonly chartInput?: ReasoningTraceChartInputReference;
}

export type ReasoningTraceCompletenessDiagnosticCode =
  | 'MISSING_EVIDENCE_OCCURRENCE'
  | 'MISSING_SOURCE_RULE'
  | 'MISSING_CHART_CALCULATION_LINK'
  | 'INVALID_RELATED_EVIDENCE_LINK'
  | 'UNRESOLVED_ROOT_EVIDENCE_LINK'
  | 'MISSING_SEMANTIC_IDENTITY'
  | 'NO_EVIDENCE_OCCURRENCES'
  | 'NO_SYNTHESIS_EVIDENCE_REFERENCES';

export interface ReasoningTraceCompletenessDiagnostic {
  readonly code: ReasoningTraceCompletenessDiagnosticCode;
  readonly evidenceOccurrenceId?: string;
  readonly reference?: string;
  readonly message: string;
}

export interface ReasoningTraceCompleteness {
  readonly status: 'COMPLETE' | 'PARTIAL' | 'INCOMPLETE';
  readonly conclusionNodeId: string;
  readonly synthesisRuleId: string;
  readonly expectedEvidenceReferenceCount: number;
  readonly resolvedEvidenceOccurrenceCount: number;
  readonly links: readonly ReasoningTraceEvidenceLink[];
  readonly diagnostics: readonly ReasoningTraceCompletenessDiagnostic[];
}

/**
 * Builds an auditable conclusion-to-source trace report.
 * Occurrence IDs, semantic identity keys, rule IDs and related occurrence IDs
 * are never substituted for one another. Missing source/calculation references
 * are diagnosed rather than synthesized.
 */
export function buildReasoningTraceCompleteness(params: {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly conclusionNodeId: string;
  readonly synthesisRuleId: string;
  readonly synthesisEvidenceReferences: readonly ReasoningTraceEvidenceReference[];
  readonly evidence: readonly DomainEvidence[];
}): ReasoningTraceCompleteness {
  const { domain, conclusionNodeId, synthesisRuleId, synthesisEvidenceReferences, evidence } = params;
  const occurrenceIds = new Set(evidence.map(item => item.id));
  const includedOccurrenceIds = new Set<string>();
  const synthesisReferenceByOccurrence = new Map<string, ReasoningTraceEvidenceReference>();
  const diagnostics: ReasoningTraceCompletenessDiagnostic[] = [];
  const links: ReasoningTraceEvidenceLink[] = [];

  if (evidence.length === 0) {
    diagnostics.push(Object.freeze({
      code: 'NO_EVIDENCE_OCCURRENCES',
      message: 'No domain evidence occurrences were supplied for trace validation.'
    }));
  }

  if (synthesisEvidenceReferences.length === 0) {
    diagnostics.push(Object.freeze({
      code: 'NO_SYNTHESIS_EVIDENCE_REFERENCES',
      message: 'The canonical synthesis did not expose any evidence references for end-to-end trace validation.'
    }));
  }

  for (const reference of synthesisEvidenceReferences) {
    const matches = reference.namespace === 'IDENTITY'
      ? evidence.filter(item => item.identityKey === reference.id)
      : evidence.filter(item => item.id === reference.id);

    if (matches.length === 0) {
      diagnostics.push(Object.freeze({
        code: 'MISSING_EVIDENCE_OCCURRENCE',
        reference: reference.id,
        message: 'Synthesis evidence reference ' + reference.id + ' did not resolve in the declared ' + reference.namespace + ' namespace.'
      }));
      continue;
    }

    for (const item of matches) {
      includedOccurrenceIds.add(item.id);
      synthesisReferenceByOccurrence.set(item.id, reference);
    }
  }

  for (const item of evidence) {
    const synthesisReference = synthesisReferenceByOccurrence.get(item.id);
    const producerRuleId = item.provenance?.ruleId;
    const sourceRuleId = item.ruleId;
    const chartInputAvailable = item.planet !== undefined ||
      item.house !== undefined ||
      item.timing !== undefined;
    const chartInput: ReasoningTraceChartInputReference | undefined = chartInputAvailable
      ? Object.freeze({
          source: item.source,
          ...(item.planet ? { planet: item.planet } : {}),
          ...(item.house !== undefined ? { house: item.house } : {}),
          ...(item.timing?.period ? { period: item.timing.period } : {}),
          ...(item.timing?.planet ? { timingPlanet: item.timing.planet } : {}),
          ...(item.evidenceFamily ? { evidenceFamily: item.evidenceFamily } : {})
        })
      : undefined;

    if (!item.identityKey?.trim()) {
      diagnostics.push(Object.freeze({
        code: 'MISSING_SEMANTIC_IDENTITY',
        evidenceOccurrenceId: item.id,
        message: 'Evidence occurrence ' + item.id + ' has no semantic identityKey.'
      }));
    }
    if (!producerRuleId && !sourceRuleId) {
      diagnostics.push(Object.freeze({
        code: 'MISSING_SOURCE_RULE',
        evidenceOccurrenceId: item.id,
        message: 'Evidence occurrence ' + item.id + ' has no producer/source rule ID.'
      }));
    }
    if (!chartInput && !item.sourceRecordId) {
      diagnostics.push(Object.freeze({
        code: 'MISSING_CHART_CALCULATION_LINK',
        evidenceOccurrenceId: item.id,
        message: 'Evidence occurrence ' + item.id + ' has no explicit chart input or source-record reference.'
      }));
    }

    for (const relatedId of item.relatedEvidenceIds) {
      if (!occurrenceIds.has(relatedId)) {
        diagnostics.push(Object.freeze({
          code: 'INVALID_RELATED_EVIDENCE_LINK',
          evidenceOccurrenceId: item.id,
          reference: relatedId,
          message: 'Related evidence reference ' + relatedId + ' does not resolve to a DomainEvidence occurrence ID.'
        }));
      }
    }

    links.push(Object.freeze({
      domain,
      conclusionNodeId,
      synthesisRuleId,
      includedInSynthesis: Boolean(synthesisReference),
      ...(synthesisReference ? {
        synthesisEvidenceReference: synthesisReference.id,
        synthesisEvidenceNamespace: synthesisReference.namespace
      } : {}),
      evidenceOccurrenceId: item.id,
      ...(item.identityKey ? { semanticIdentityKey: item.identityKey } : {}),
      ...(producerRuleId ? { producerRuleId } : {}),
      ...(sourceRuleId ? { sourceRuleId } : {}),
      ...(sourceRecordId ? { sourceRecordId } : {}),
      sourceRecordOccurrenceIds: Object.freeze([...item.relatedEvidenceIds]),
      rootEvidenceIdentityKeys: Object.freeze([...(item.rootEvidenceIds ?? [])]),
      ...(chartInput ? { chartInput } : {})
    }));
  }

  const rootValidation = validateDomainEvidenceRootLinks(evidence);
  for (const diagnostic of rootValidation.unresolved) {
    diagnostics.push(Object.freeze({
      code: 'UNRESOLVED_ROOT_EVIDENCE_LINK',
      evidenceOccurrenceId: diagnostic.sourceOccurrenceId,
      reference: diagnostic.rootIdentityKey,
      message: 'Root evidence identity ' + diagnostic.rootIdentityKey + ' is invalid (' + diagnostic.code + ').'
    }));
  }

  const sortedDiagnostics = diagnostics.sort((a, b) =>
    (a.evidenceOccurrenceId ?? '').localeCompare(b.evidenceOccurrenceId ?? '') ||
    a.code.localeCompare(b.code) ||
    (a.reference ?? '').localeCompare(b.reference ?? '')
  );
  const missingOccurrence = sortedDiagnostics.some(d => d.code === 'MISSING_EVIDENCE_OCCURRENCE' || d.code === 'NO_SYNTHESIS_EVIDENCE_REFERENCES');
  const status: ReasoningTraceCompleteness['status'] = sortedDiagnostics.length === 0
    ? 'COMPLETE'
    : missingOccurrence || links.length === 0
      ? 'INCOMPLETE'
      : 'PARTIAL';

  return Object.freeze({
    status,
    conclusionNodeId,
    synthesisRuleId,
    expectedEvidenceReferenceCount: synthesisEvidenceReferences.length,
    resolvedEvidenceOccurrenceCount: includedOccurrenceIds.size,
    links: Object.freeze(links.sort((a, b) => a.evidenceOccurrenceId.localeCompare(b.evidenceOccurrenceId))),
    diagnostics: Object.freeze(sortedDiagnostics)
  });
}
