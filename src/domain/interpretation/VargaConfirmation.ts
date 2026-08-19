import type {
  ConfidenceLevel,
  DomainId,
  DomainStrength,
  EvidenceSource,
  VargaRelationship
} from './DomainInterpretationTypes';

export interface VargaConfirmation {
  readonly domain: DomainId;
  readonly varga: EvidenceSource;
  readonly relationship: VargaRelationship;
  readonly strength: DomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
}

export function createVargaConfirmation(
  confirmation: VargaConfirmation
): VargaConfirmation {
  return Object.freeze({
    ...confirmation,
    evidenceIds: Object.freeze([
      ...confirmation.evidenceIds
    ])
  });
}
