export type DomainId =
  | 'CAREER'
  | 'WEALTH'
  | 'MARRIAGE'
  | 'CHILDREN'
  | 'PROPERTY'
  | 'HEALTH'
  | 'SPIRITUALITY';

export type DomainStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type EvidenceStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK';

export type EvidencePolarity =
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'NEUTRAL';

export type EvidenceRole =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'MODIFIER'
  | 'CONFIRMATION'
  | 'TIMING';

export type EvidencePhase =
  | 'NATAL_PROMISE'
  | 'DASHA_ACTIVATION'
  | 'TRANSIT_TRIGGER'
  | 'VARGA_CONFIRMATION'
  | 'MODIFIER';

export type VargaRelationship =
  | 'CONFIRMS'
  | 'PARTIALLY_CONFIRMS'
  | 'MODIFIES'
  | 'CONFLICTS'
  | 'UNAVAILABLE';

export type TimingActivationEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'DOES_NOT_ACTIVATE'
  | 'CHALLENGES'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

export type TransitTriggerEffect =
  | 'TRIGGER'
  | 'MODIFIER'
  | 'CHALLENGE'
  | 'NO_MATERIAL_TRIGGER'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

export type ConflictTier =
  | 'PRIMARY_VS_PRIMARY'
  | 'PRIMARY_VS_MODIFIER'
  | 'PRIMARY_VS_VARGA'
  | 'PRIMARY_VS_TIMING'
  | 'PRIMARY_VS_TRANSIT'
  | 'SECONDARY_CONFLICT'
  | 'TIMING_CONFLICT';

export type EvidenceSource =
  | 'D1'
  | 'D9'
  | 'D10'
  | 'D2'
  | 'D3'
  | 'D7'
  | 'D12'
  | 'D16'
  | 'D20'
  | 'D24'
  | 'D27'
  | 'D30'
  | 'D40'
  | 'D45'
  | 'D60'
  | 'DASHA'
  | 'TRANSIT'
  | 'OTHER';

export type ManifestationMode =
  | 'EMPLOYMENT'
  | 'LEADERSHIP'
  | 'AUTHORITY'
  | 'TECHNICAL_SPECIALIZATION'
  | 'MANAGEMENT'
  | 'SERVICE_EMPLOYMENT'
  | 'INDEPENDENT_WORK'
  | 'ENTREPRENEURSHIP'
  | 'BUSINESS_ENTREPRENEURSHIP'
  | 'ACCUMULATION'
  | 'GAINS'
  | 'FORTUNE'
  | 'SPECULATION'
  | 'OTHER';

export type ConfidenceLevel =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'VERY_LOW'
  | 'UNDETERMINED';
