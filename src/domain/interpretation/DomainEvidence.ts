import type {
  DomainId,
  EvidencePhase,
  EvidencePolarity,
  EvidenceRole,
  EvidenceSource,
  EvidenceStrength
} from './DomainInterpretationTypes';

export interface DomainEvidence {
  readonly id: string;
  readonly domain: DomainId;
  readonly role: EvidenceRole;
  readonly phase: EvidencePhase;
  readonly source: EvidenceSource;
  readonly statement: string;
  readonly polarity: EvidencePolarity;
  readonly strength: EvidenceStrength;
  readonly priority: number;
  readonly ruleId?: string;
  readonly relatedEvidenceIds: readonly string[];
  readonly notes?: string;
  readonly timing?: { readonly period: 'MD' | 'AD' | 'PD' };
}

export function createDomainEvidence(
  evidence: Omit<DomainEvidence, 'relatedEvidenceIds'> & {
    readonly relatedEvidenceIds?: readonly string[];
  }
): DomainEvidence {
  return Object.freeze({
    ...evidence,
    relatedEvidenceIds: Object.freeze([
      ...(evidence.relatedEvidenceIds ?? [])
    ]),
    ...(evidence.timing ? { timing: Object.freeze({ ...evidence.timing }) } : {})
  });
}
