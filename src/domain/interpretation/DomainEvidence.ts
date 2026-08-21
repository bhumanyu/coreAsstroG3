import type { EvidenceSourceType } from '../evidence';
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
  readonly sourceType: EvidenceSourceType;
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
  readonly timing?: {
    readonly period: 'MD' | 'AD' | 'PD';
    readonly level?: 'MD' | 'AD' | 'PD';
    readonly periodKey?: string;
  };
  readonly evidenceFamily?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
}

export function createDomainEvidence(
  evidence: Partial<DomainEvidence> & {
    id: string;
    sourceType: EvidenceSourceType;
  }
): DomainEvidence {
  return Object.freeze({
    id: evidence.id,
    sourceType: evidence.sourceType,
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
