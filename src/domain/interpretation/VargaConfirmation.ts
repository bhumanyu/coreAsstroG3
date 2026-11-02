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
  const isD2 = confirmation.varga === 'D2';
  const isUnavailable = isD2 || confirmation.availability === 'UNAVAILABLE' ||
    confirmation.relationship === 'UNAVAILABLE';
  const unavailabilityReason = isD2
    ? 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.'
    : confirmation.unavailabilityReason ?? 'Divisional relationship is unavailable for this calculation.';
  return Object.freeze({
    ...confirmation,
    ...(isD2 ? {
      relationship: 'UNAVAILABLE' as const,
      strength: 'UNDETERMINED' as const,
      confidence: 'UNDETERMINED' as const,
      statement: unavailabilityReason
    } : {}),
    ...(isUnavailable ? {
      availability: 'UNAVAILABLE' as const,
      unavailabilityReason
    } : confirmation.availability ? { availability: confirmation.availability } : {}),
    evidenceIds: Object.freeze([
      ...confirmation.evidenceIds
    ])
  });
}
