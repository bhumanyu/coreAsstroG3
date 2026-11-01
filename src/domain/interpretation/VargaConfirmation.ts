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
  readonly availability?: 'AVAILABLE' | 'UNAVAILABLE';
  readonly unavailabilityReason?: string;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
}

export function createVargaConfirmation(
  confirmation: VargaConfirmation
): VargaConfirmation {
  const availability = confirmation.availability ??
    (confirmation.relationship === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE');
  return Object.freeze({
    ...confirmation,
    availability,
    ...(availability === 'UNAVAILABLE'
      ? { unavailabilityReason: confirmation.unavailabilityReason ?? 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.' }
      : {}),
    evidenceIds: Object.freeze([
      ...confirmation.evidenceIds
    ])
  });
}
