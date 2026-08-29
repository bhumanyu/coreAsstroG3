import type {
  DomainId,
  EvidencePhase,
  EvidencePolarity,
  EvidenceRole,
  EvidenceStrength as GenericEvidenceStrength
} from '../../interpretation/DomainInterpretationTypes';
import type { EvidenceSourceType } from '../../evidence';
import {
  createDomainEvidence,
  type DomainEvidence
} from '../../interpretation/DomainEvidence';
import { Planet } from '../../../types';
import type {
  EvidenceAxis,
  EvidenceEffect as ProvenanceEffect,
  EvidenceProvenance,
  EvidenceSource as ProvenanceSource,
  EvidenceStrength as ProvenanceStrength
} from './evidenceProvenance';
import {
  createEvidenceProvenance
} from './evidenceProvenanceFactory';
import type { EvidenceIdentityInput } from './evidenceIdentity';

/**
 * CareerWealthEvidence is a subtype of DomainEvidence that guarantees a populated provenance.
 */
export interface CareerWealthEvidence extends DomainEvidence {
  readonly provenance: EvidenceProvenance;
}

/**
 * Maps provenance EvidenceEffect to DomainEvidence EvidencePolarity.
 */
export function mapEffectToPolarity(effect: ProvenanceEffect): EvidencePolarity {
  switch (effect) {
    case 'SUPPORT':
      return 'SUPPORTING';
    case 'CHALLENGE':
      return 'CHALLENGING';
    case 'NEUTRAL':
      return 'NEUTRAL';
  }
}

/**
 * Maps provenance Axis to DomainEvidence EvidencePhase.
 */
export function mapAxisToPhase(axis: EvidenceAxis): EvidencePhase {
  switch (axis) {
    case 'NATAL':
      return 'NATAL_PROMISE';
    case 'DASHA':
      return 'DASHA_ACTIVATION';
    case 'TIMING':
      return 'TRANSIT_TRIGGER';
    case 'DIVISIONAL':
      return 'VARGA_CONFIRMATION';
    case 'MANIFESTATION':
      return 'MODIFIER';
  }
}

/**
 * Maps provenance Source to DomainEvidence EvidenceSourceType.
 */
export function mapProvenanceSourceToSourceType(source: ProvenanceSource): EvidenceSourceType {
  switch (source) {
    case 'D1':
      return 'HOUSE';
    case 'D2':
    case 'D10':
      return 'VARGA';
    case 'DASHA':
      return 'DASHA';
    case 'TRANSIT':
      return 'TRANSIT';
  }
}

/**
 * Maps provenance Strength to priority weight for DomainEvidence.
 */
export function mapProvenanceStrengthToPriority(strength: ProvenanceStrength): number {
  switch (strength) {
    case 'PRIMARY':
      return 90;
    case 'SECONDARY':
      return 70;
    case 'TERTIARY':
      return 50;
  }
}

/**
 * Maps provenance Strength to role for DomainEvidence.
 */
export function mapProvenanceStrengthToRole(strength: ProvenanceStrength): EvidenceRole {
  switch (strength) {
    case 'PRIMARY':
      return 'PRIMARY';
    case 'SECONDARY':
      return 'SECONDARY';
    case 'TERTIARY':
      return 'MODIFIER';
  }
}

export interface CreateCareerWealthEvidenceInput {
  readonly identity: EvidenceIdentityInput;
  readonly statement: string;
  readonly strength: GenericEvidenceStrength; // Magnitude in DomainEvidence (STRONG / MODERATE / WEAK / VERY_STRONG)
  readonly sourceType?: EvidenceSourceType;
  readonly role?: EvidenceRole;
  readonly phase?: EvidencePhase;
  readonly priority?: number;
  readonly planet?: Planet;
  readonly house?: number;
  readonly relatedEvidenceIds?: readonly string[];
  readonly notes?: string;
  readonly timing?: {
    readonly period: 'MD' | 'AD' | 'PD';
    readonly level?: 'MD' | 'AD' | 'PD';
    readonly planet?: Planet;
  };
  readonly evidenceFamily?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
}

/**
 * Factory that creates a CareerWealthEvidence instance ensuring:
 * - DomainEvidence.id === provenance.evidenceId
 * - DomainEvidence.ruleId === provenance.ruleId
 * - DomainEvidence.polarity === mapEffectToPolarity(provenance.effect)
 * - DomainEvidence.domain === provenance.domain
 * - DomainEvidence.source === provenance.source
 * - DomainEvidence.strength (magnitude) is preserved
 * - provenance is frozen and populated
 */
export function createCareerWealthEvidence(
  input: CreateCareerWealthEvidenceInput
): CareerWealthEvidence {
  const provenance = createEvidenceProvenance(input.identity);
  const polarity = mapEffectToPolarity(provenance.effect);
  const phase = input.phase ?? mapAxisToPhase(provenance.axis);
  const sourceType =
    input.sourceType ?? mapProvenanceSourceToSourceType(provenance.source);
  const role = input.role ?? mapProvenanceStrengthToRole(provenance.strength);
  const priority =
    input.priority ?? mapProvenanceStrengthToPriority(provenance.strength);

  const domainEvidence = createDomainEvidence({
    id: provenance.evidenceId,
    sourceType,
    domain: provenance.domain as DomainId,
    role,
    phase,
    source: provenance.source,
    statement: input.statement,
    polarity,
    strength: input.strength,
    priority,
    ruleId: provenance.ruleId,
    relatedEvidenceIds: input.relatedEvidenceIds,
    notes: input.notes,
    provenance,
    timing: input.timing,
    evidenceFamily: input.evidenceFamily,
    dimension: input.dimension,
    planet: input.planet,
    house: input.house
  });

  return domainEvidence as CareerWealthEvidence;
}
