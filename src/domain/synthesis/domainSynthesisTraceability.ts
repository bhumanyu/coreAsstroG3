import type { DomainInterpretation } from '../interpretation';
import type { LifeAnalysis } from './domainSynthesisTypes';

export function assertLifeAnalysisTraceability(
  analysis: LifeAnalysis,
  domains: readonly DomainInterpretation[]
): void {
  const validEvidenceIds = new Set<string>();

  for (const d of domains) {
    if (Array.isArray(d.evidence)) {
      for (const e of d.evidence) {
        if (e && typeof e.id === 'string') {
          validEvidenceIds.add(e.id);
        }
      }
    }
    for (const eId of d.natalPromise?.supportingEvidenceIds ?? []) {
      validEvidenceIds.add(eId);
    }
    for (const eId of d.natalPromise?.challengingEvidenceIds ?? []) {
      validEvidenceIds.add(eId);
    }
    for (const eId of d.dashaActivation?.evidenceIds ?? []) {
      validEvidenceIds.add(eId);
    }
    for (const eId of d.transitTrigger?.evidenceIds ?? []) {
      validEvidenceIds.add(eId);
    }
    if (d.vargaConfirmations) {
      for (const v of d.vargaConfirmations) {
        for (const eId of v.evidenceIds ?? []) {
          validEvidenceIds.add(eId);
        }
      }
    }
  }

  // 1. Validate top-level evidenceIds
  for (const eId of analysis.evidenceIds) {
    if (!validEvidenceIds.has(eId)) {
      throw new Error(
        `Traceability failure: unrecognized evidence ID "${eId}" in life analysis evidenceIds.`
      );
    }
  }

  // 2. Validate domain summary evidence IDs
  for (const summary of analysis.domains) {
    for (const eId of summary.supportingEvidenceIds) {
      if (!validEvidenceIds.has(eId)) {
        throw new Error(
          `Traceability failure: unrecognized evidence ID "${eId}" in ${summary.domain} supportingEvidenceIds.`
        );
      }
    }
    for (const eId of summary.challengingEvidenceIds) {
      if (!validEvidenceIds.has(eId)) {
        throw new Error(
          `Traceability failure: unrecognized evidence ID "${eId}" in ${summary.domain} challengingEvidenceIds.`
        );
      }
    }
  }

  // 3. Validate shared timing evidence IDs
  for (const st of analysis.sharedTiming) {
    for (const eId of st.evidenceIds) {
      if (!validEvidenceIds.has(eId)) {
        throw new Error(
          `Traceability failure: unrecognized evidence ID "${eId}" in shared timing.`
        );
      }
    }
  }

  // 4. Validate conflict evidence IDs
  for (const c of analysis.conflicts) {
    for (const eId of c.evidenceIds) {
      if (!validEvidenceIds.has(eId)) {
        throw new Error(
          `Traceability failure: unrecognized evidence ID "${eId}" in conflict ${c.id}.`
        );
      }
    }
  }
}
