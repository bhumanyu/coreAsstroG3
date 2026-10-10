import type {
  CareerProfessionCandidate,
  CareerProfessionEvidence,
  CareerProfessionProvenance,
  CareerProfessionAnalysis
} from './careerProfessionTypes';

/**
 * P2-10A Career Profession Utils
 *
 * This module provides utility functions for ID generation, canonical sorting,
 * evidence merge/dedup, and freezing helpers for profession candidates.
 *
 * All ID generation is deterministic and uses hash-like identifiers.
 * No Date, random, or UUID is used.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - ai
 * - Any raw horoscope/chart astrology calculation
 */

/**
 * Create a stable profession candidate ID.
 * Combines domain, family, pattern IDs, and basis into a deterministic ID.
 *
 * Pattern-scoped: includes patternIds so candidates from distinct patterns are not collapsed.
 */
export function createProfessionCandidateId(
  domain: string,
  family: string,
  patternIds: readonly string[],
  basis: string
): string {
  const sortedPatternIds = [...patternIds].sort(codePointCompare);
  const patternKey = sortedPatternIds.join('|');
  return `PROF:${domain}:${family}:${basis}:${patternKey}`;
}

/**
 * Create a stable profession evidence ID.
 * Combines basis, rule ID, and source IDs into a deterministic ID.
 */
export function createProfessionEvidenceId(
  basis: string,
  ruleId: string,
  sourceIds: readonly string[]
): string {
  const sortedSourceIds = [...sourceIds].sort(codePointCompare);
  const sourceKey = sortedSourceIds.join('|');
  return `EVID:${basis}:${ruleId}:${sourceKey}`;
}

/**
 * Code-point string comparator for deterministic sorting.
 * Uses code-point comparison instead of locale-sensitive localeCompare.
 */
export function codePointCompare(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Canonical sort for profession candidates.
 * Sorts by candidateId using code-point comparison.
 */
export function canonicalSortProfessionCandidates(
  candidates: readonly CareerProfessionCandidate[]
): CareerProfessionCandidate[] {
  return [...candidates].sort((a, b) => codePointCompare(a.candidateId, b.candidateId));
}

/**
 * Canonical sort for profession evidence.
 * Sorts by evidenceId using code-point comparison.
 */
export function canonicalSortProfessionEvidence(
  evidence: readonly CareerProfessionEvidence[]
): CareerProfessionEvidence[] {
  return [...evidence].sort((a, b) => codePointCompare(a.evidenceId, b.evidenceId));
}

/**
 * Deduplicate profession candidates by candidateId.
 * Returns the first occurrence of each unique candidateId.
 */
export function deduplicateProfessionCandidates(
  candidates: readonly CareerProfessionCandidate[]
): CareerProfessionCandidate[] {
  const seen = new Set<string>();
  const result: CareerProfessionCandidate[] = [];

  for (const candidate of candidates) {
    if (!seen.has(candidate.candidateId)) {
      seen.add(candidate.candidateId);
      result.push(candidate);
    }
  }

  return result;
}

/**
 * Deduplicate profession evidence by evidenceId.
 * Returns the first occurrence of each unique evidenceId.
 */
export function deduplicateProfessionEvidence(
  evidence: readonly CareerProfessionEvidence[]
): CareerProfessionEvidence[] {
  const seen = new Set<string>();
  const result: CareerProfessionEvidence[] = [];

  for (const ev of evidence) {
    if (!seen.has(ev.evidenceId)) {
      seen.add(ev.evidenceId);
      result.push(ev);
    }
  }

  return result;
}

/**
 * Merge profession provenances.
 * Deduplicates and sorts all provenance arrays.
 */
export function mergeProfessionProvenances(
  provenances: readonly CareerProfessionProvenance[]
): CareerProfessionProvenance {
  const expressionIds = new Set<string>();
  const mechanismIds = new Set<string>();
  const patternIds = new Set<string>();
  const evidenceIds = new Set<string>();
  const sourceIds = new Set<string>();
  const ruleIds = new Set<string>();

  for (const prov of provenances) {
    for (const id of prov.expressionIds) {
      expressionIds.add(id);
    }
    for (const id of prov.mechanismIds) {
      mechanismIds.add(id);
    }
    for (const id of prov.patternIds) {
      patternIds.add(id);
    }
    for (const id of prov.evidenceIds) {
      evidenceIds.add(id);
    }
    for (const id of prov.sourceIds) {
      sourceIds.add(id);
    }
    for (const id of prov.ruleIds) {
      ruleIds.add(id);
    }
  }

  return Object.freeze({
    expressionIds: Object.freeze([...expressionIds].sort(codePointCompare)),
    mechanismIds: Object.freeze([...mechanismIds].sort(codePointCompare)),
    patternIds: Object.freeze([...patternIds].sort(codePointCompare)),
    evidenceIds: Object.freeze([...evidenceIds].sort(codePointCompare)),
    sourceIds: Object.freeze([...sourceIds].sort(codePointCompare)),
    ruleIds: Object.freeze([...ruleIds].sort(codePointCompare))
  });
}

/**
 * Deep freeze a profession candidate.
 * Recursively freezes all nested arrays and objects.
 */
export function freezeProfessionCandidate(
  candidate: CareerProfessionCandidate
): CareerProfessionCandidate {
  return Object.freeze({
    ...candidate,
    expressionTypes: Object.freeze([...candidate.expressionTypes]),
    mechanismTypes: Object.freeze([...candidate.mechanismTypes]),
    patternIds: Object.freeze([...candidate.patternIds]),
    evidence: Object.freeze(
      candidate.evidence.map(ev =>
        Object.freeze({
          ...ev,
          sourceIds: Object.freeze([...ev.sourceIds])
        })
      )
    ),
    domainEvidenceIds: Object.freeze([...candidate.domainEvidenceIds]),
    relatedEvidenceIds: Object.freeze([...candidate.relatedEvidenceIds])
  });
}

/**
 * Deep freeze a profession analysis.
 * Recursively freezes all nested arrays and objects.
 */
export function freezeProfessionAnalysis(
  analysis: {
    readonly candidates: readonly CareerProfessionCandidate[];
    readonly status: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
    readonly unresolvedExpressionTypes: readonly string[];
    readonly mappedTypes: readonly string[];
    readonly missingInputs: readonly string[];
    readonly provenance: CareerProfessionProvenance;
  }
): CareerProfessionAnalysis {
  return Object.freeze({
    ...analysis,
    candidates: Object.freeze(
      analysis.candidates.map(freezeProfessionCandidate)
    ),
    unresolvedExpressionTypes: Object.freeze([...analysis.unresolvedExpressionTypes] as any),
    mappedTypes: Object.freeze([...analysis.mappedTypes] as any),
    missingInputs: Object.freeze([...analysis.missingInputs]),
    provenance: Object.freeze({
      ...analysis.provenance,
      expressionIds: Object.freeze([...analysis.provenance.expressionIds]),
      mechanismIds: Object.freeze([...analysis.provenance.mechanismIds]),
      patternIds: Object.freeze([...analysis.provenance.patternIds]),
      evidenceIds: Object.freeze([...analysis.provenance.evidenceIds]),
      sourceIds: Object.freeze([...analysis.provenance.sourceIds]),
      ruleIds: Object.freeze([...analysis.provenance.ruleIds])
    })
  });
}

/**
 * Merge and dedupe source IDs.
 */
export function mergeSourceIds(
  sourceIdArrays: readonly (readonly string[])[]
): readonly string[] {
  const ids = new Set<string>();
  for (const arr of sourceIdArrays) {
    for (const id of arr) {
      ids.add(id);
    }
  }
  return Object.freeze([...ids].sort(codePointCompare));
}

/**
 * Merge and dedupe related evidence IDs.
 */
export function mergeRelatedEvidenceIds(
  evidenceIdArrays: readonly (readonly string[])[]
): readonly string[] {
  const ids = new Set<string>();
  for (const arr of evidenceIdArrays) {
    for (const id of arr) {
      ids.add(id);
    }
  }
  return Object.freeze([...ids].sort(codePointCompare));
}
