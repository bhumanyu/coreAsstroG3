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
  promise: NatalPromise
): NatalPromise {
  return Object.freeze({
    ...promise,
    evidenceIds: Object.freeze([
      ...promise.evidenceIds
    ]),
    supportingEvidenceIds: Object.freeze([
      ...promise.supportingEvidenceIds
    ]),
    challengingEvidenceIds: Object.freeze([
      ...promise.challengingEvidenceIds
    ])
  });
}
