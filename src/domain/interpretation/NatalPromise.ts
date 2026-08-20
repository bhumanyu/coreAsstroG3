import type {
  ConfidenceLevel,
  DomainId,
  DomainStrength
} from './DomainInterpretationTypes';

export interface NatalPromise {
  readonly domain: DomainId;
  readonly strength: DomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
}

export function createNatalPromise(
  promise: Partial<NatalPromise> & { strength: DomainStrength }
): NatalPromise {
  const supporting = promise.supportingEvidenceIds ?? [];
  const challenging = promise.challengingEvidenceIds ?? [];
  const evidenceIds =
    promise.evidenceIds ??
    Array.from(new Set([...supporting, ...challenging]));

  return Object.freeze({
    domain: promise.domain ?? 'CAREER',
    strength: promise.strength,
    confidence: promise.confidence ?? 'MODERATE',
    statement: promise.statement ?? '',
    evidenceIds: Object.freeze([...evidenceIds]),
    supportingEvidenceIds: Object.freeze([...supporting]),
    challengingEvidenceIds: Object.freeze([...challenging])
  });
}
