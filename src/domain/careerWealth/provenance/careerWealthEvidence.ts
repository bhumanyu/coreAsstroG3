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
  EvidenceEffect as ProvenanceEffect,
  EvidenceProvenance
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

export interface CreateCareerWealthEvidenceInput {
  readonly identity: EvidenceIdentityInput;
  readonly statement: string;
  readonly sourceType: EvidenceSourceType;
  readonly role: EvidenceRole;
  readonly phase: EvidencePhase;
  readonly priority: number;
  readonly strength: GenericEvidenceStrength; // Magnitude in DomainEvidence (STRONG / MODERATE / WEAK / VERY_STRONG)
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
  readonly metadata?: Record<string, unknown>;
}

/**
 * Factory that creates a CareerWealthEvidence instance ensuring:
 * - DomainEvidence.id === provenance.evidenceId
 * - DomainEvidence.ruleId === provenance.ruleId
 * - DomainEvidence.polarity === mapEffectToPolarity(provenance.effect)
 * - DomainEvidence.domain === provenance.domain
 * - DomainEvidence.source === provenance.source
 * - Caller-provided interpretation semantics (sourceType, role, phase, priority, strength) are explicitly preserved
 * - provenance is frozen and populated
 */
export function createCareerWealthEvidence(
  input: CreateCareerWealthEvidenceInput
): CareerWealthEvidence {
  const provenance = createEvidenceProvenance(input.identity);
  const polarity = mapEffectToPolarity(provenance.effect);

  const domainEvidence = createDomainEvidence({
    id: provenance.evidenceId,
    sourceType: input.sourceType,
    domain: provenance.domain as DomainId,
    role: input.role,
    phase: input.phase,
    source: provenance.source,
    statement: input.statement,
    polarity,
    strength: input.strength,
    priority: input.priority,
    ruleId: provenance.ruleId,
    relatedEvidenceIds: input.relatedEvidenceIds,
    notes: input.notes,
    provenance,
    timing: input.timing,
    evidenceFamily: input.evidenceFamily,
    dimension: input.dimension,
    planet: input.planet,
    house: input.house,
    metadata: input.metadata
  });

  return domainEvidence as CareerWealthEvidence;
}
