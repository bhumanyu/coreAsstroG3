import type { EvidenceSourceType } from '../evidence';
import type {
  DomainId,
  EvidencePhase,
  EvidencePolarity,
  EvidenceRole,
  EvidenceSource,
  EvidenceStrength
} from './DomainInterpretationTypes';
import type { Planet } from '../../types';
import type { EvidenceProvenance } from '../careerWealth/provenance';

/**
 * Sentinel value returned by resolveSemanticIdentity when both identityKey and id are empty/whitespace.
 *
 * This sentinel signals that the evidence has no resolvable semantic identity and must be treated
 * as a failure signal (DEGRADED traceability) by consumers. All call sites that project resolved IDs
 * must filter this sentinel to prevent invalid evidence from appearing traceable via a shared token.
 *
 * The sentinel is kept private to the identity boundary (DomainEvidence.ts) and exported only for
 * use by consumers that project resolved identities. It should never be used as a valid identity.
 *
 * Consumers of resolveSemanticIdentity MUST filter this sentinel:
 * - domainTimingAdapter.ts: filters in mapPeriodToCanonicalEvidenceIds (line 72)
 * - careerTrajectoryEngine.ts: filters by checking against evidenceIdentitySet (lines 219-220, 274-276)
 * - canonicalCareerEvidenceMapper.ts: uses for sorting; sentinel appears in output but is acceptable
 *   since validation handles unknown references explicitly (lines 937-938, 966, 977)
 *
 * Note: careerFinalSynthesisIntegration.ts does NOT use resolveSemanticIdentity; it has inline
 * logic for WeightedReasoningEvidence (different field structure: identityKey + evidenceId).
 */
export const UNRESOLVED_IDENTITY_SENTINEL = '__UNRESOLVED_IDENTITY__' as const;

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
  readonly provenance?: EvidenceProvenance;
  readonly timing?: {
    readonly period: 'MD' | 'AD' | 'PD';
    readonly level?: 'MD' | 'AD' | 'PD';
    readonly planet?: Planet;
  };
  readonly evidenceFamily?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly planet?: Planet;
  readonly house?: number;
  readonly identityKey?: string;
  /**
   * Manifestation rule IDs this evidence matches for manifestation synthesis.
   * This is separate from ruleId to preserve the canonical ruleId for provenance
   * while still supporting legacy manifestation rule matching.
   */
  readonly manifestationRuleIds?: readonly string[];
}

/**
 * Resolves the semantic identity of a DomainEvidence.
 *
 * Returns the semantic identity key (identityKey) when present and non-empty (after trimming),
 * falling back to the occurrence ID (id) when identityKey is absent, empty, or whitespace-only.
 * This enables cross-layer evidence matching where multiple occurrences of the same semantic fact
 * should resolve to a single identity.
 *
 * If both identityKey and id are empty/whitespace, returns UNRESOLVED_IDENTITY_SENTINEL
 * that consumers must treat as a failure signal (DEGRADED traceability) rather than a valid ID.
 * This prevents invalid evidence from appearing traceable via a shared token.
 *
 * @param evidence - The DomainEvidence to resolve
 * @returns The semantic identity (trimmed identityKey if non-empty, otherwise trimmed id, otherwise UNRESOLVED_IDENTITY_SENTINEL)
 */
export function resolveSemanticIdentity(e: DomainEvidence): string {
  const trimmedIdentityKey = e.identityKey?.trim();
  if (trimmedIdentityKey && trimmedIdentityKey.length > 0) {
    return trimmedIdentityKey;
  }

  const trimmedId = e.id?.trim();
  if (trimmedId && trimmedId.length > 0) {
    return trimmedId;
  }

  // Both identityKey and id are empty/whitespace - signal resolution failure
  // Consumers must filter this marker and treat as DEGRADED traceability
  return UNRESOLVED_IDENTITY_SENTINEL;
}

export function createDomainEvidence(
  evidence: Partial<DomainEvidence> & {
    id: string;
    sourceType: EvidenceSourceType;
  }
): DomainEvidence {
  // Validate non-empty id to prevent unresolvable evidence
  const trimmedId = evidence.id?.trim();
  if (!trimmedId || trimmedId.length === 0) {
    throw new Error(`createDomainEvidence: id must be non-empty (received: "${evidence.id}")`);
  }

  return Object.freeze({
    id: trimmedId,
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
    ...(evidence.provenance ? { provenance: Object.freeze(evidence.provenance) } : {}),
    ...(evidence.timing ? { timing: Object.freeze({ ...evidence.timing }) } : {}),
    ...(evidence.evidenceFamily ? { evidenceFamily: evidence.evidenceFamily } : {}),
    ...(evidence.dimension ? { dimension: evidence.dimension } : {}),
    ...(evidence.planet ? { planet: evidence.planet } : {}),
    ...(evidence.house !== undefined ? { house: evidence.house } : {}),
    ...(evidence.identityKey ? { identityKey: evidence.identityKey } : {}),
    ...(evidence.manifestationRuleIds ? { manifestationRuleIds: Object.freeze(evidence.manifestationRuleIds) } : {})
  });
}
