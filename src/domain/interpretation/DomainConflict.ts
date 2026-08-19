import type {
  DomainId,
  EvidencePhase,
  EvidenceStrength
} from './DomainInterpretationTypes';

export interface DomainConflict {
  readonly id: string;
  readonly domain: DomainId;
  readonly description: string;
  readonly positiveEvidenceIds: readonly string[];
  readonly negativeEvidenceIds: readonly string[];
  readonly primaryPhase: EvidencePhase;
  readonly severity: EvidenceStrength;
  readonly resolution: string;
}

export function createDomainConflict(
  conflict: DomainConflict
): DomainConflict {
  return Object.freeze({
    ...conflict,
    positiveEvidenceIds: Object.freeze([
      ...conflict.positiveEvidenceIds
    ]),
    negativeEvidenceIds: Object.freeze([
      ...conflict.negativeEvidenceIds
    ])
  });
}
