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
  readonly evidenceFamily?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
}

export function createDomainEvidence(
  evidence: Partial<DomainEvidence> & {
    id: string;
  }
): DomainEvidence {
  return Object.freeze({
    id: evidence.id,
    domain: evidence.domain ?? 'CAREER',
    role: evidence.role ?? 'PRIMARY',
    phase: evidence.phase ?? 'NATAL_PROMISE',
    source: evidence.source ?? 'D1',
    statement: evidence.statement ?? '',
    polarity: evidence.polarity ?? 'SUPPORTING',
    strength: evidence.strength ?? 'STRONG',
    priority: evidence.priority ?? 1,
    relatedEvidenceIds: Object.freeze([
      ...(evidence.relatedEvidenceIds ?? [])
    ]),
    ...(evidence.ruleId ? { ruleId: evidence.ruleId } : {}),
    ...(evidence.notes ? { notes: evidence.notes } : {}),
    ...(evidence.timing ? { timing: Object.freeze({ ...evidence.timing }) } : {}),
    ...(evidence.evidenceFamily ? { evidenceFamily: evidence.evidenceFamily } : {}),
    ...(evidence.dimension ? { dimension: evidence.dimension } : {})
  });
}
