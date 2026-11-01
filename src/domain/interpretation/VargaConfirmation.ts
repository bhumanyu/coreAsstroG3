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
  const isUnavailable = confirmation.availability === 'UNAVAILABLE' ||
    confirmation.relationship === 'UNAVAILABLE';
  return Object.freeze({
    ...confirmation,
    ...(isUnavailable ? {
      availability: 'UNAVAILABLE' as const,
      unavailabilityReason: confirmation.unavailabilityReason ?? (confirmation.varga === 'D2' ? 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.' : 'Divisional relationship is unavailable for this calculation.')
    } : confirmation.availability ? { availability: confirmation.availability } : {}),
    evidenceIds: Object.freeze([
      ...confirmation.evidenceIds
    ])
  });
}
