import type { DomainInterpretation } from './DomainInterpretation';
import type { DomainEvidence } from './DomainEvidence';
import type {
  ConfidenceLevel,
  ConflictTier,
  EvidencePolarity,
  EvidenceRole,
  EvidenceSource,
  EvidenceStrength,
  ManifestationMode,
  TimingActivationEffect,
  TransitTriggerEffect,
  VargaRelationship
} from './DomainInterpretationTypes';
import type { EvidenceSourceType } from '../evidence/evidenceSourceTypes';

export interface DomainEvidenceAiProjection {
  /** Exact evidence occurrence identity. */
  readonly id: string;
  /** Semantic identity is preserved separately from the occurrence ID. */
  readonly identityKey?: string;
  readonly sourceRecordId?: string;
  readonly relatedEvidenceIds: readonly string[];
  readonly rootEvidenceIds: readonly string[];
  readonly source: DomainEvidence['source'];
  readonly planet?: DomainEvidence['planet'];
  readonly house?: DomainEvidence['house'];
  readonly timing?: DomainEvidence['timing'];
  readonly statement: string;
  readonly sourceType: EvidenceSourceType;
  readonly role: EvidenceRole;
  readonly polarity: EvidencePolarity;
  readonly strength: EvidenceStrength;
  readonly ruleId?: string;
  readonly dimension?: string;
}

export interface DomainInterpretationAiProjection {
  readonly domain: DomainInterpretation['domain'];

  readonly natalPromise: {
    readonly strength: DomainInterpretation['natalPromise']['strength'];
    readonly statement: string;
  };

  readonly dashaActivation: {
    readonly active: boolean;
    readonly effect?: TimingActivationEffect;
    readonly statement: string;
  };

  readonly transitTrigger: {
    readonly active: boolean;
    readonly effect?: TransitTriggerEffect;
    readonly statement: string;
  };

  readonly conclusion: {
    readonly strength: DomainInterpretation['conclusion']['strength'];
    readonly confidence: DomainInterpretation['conclusion']['confidence'];
    readonly statement: string;
    readonly conclusionData?: any;
  };

  readonly vargaConfirmations: readonly {
    readonly varga: EvidenceSource;
    readonly relationship: VargaRelationship;
    readonly availability?: 'AVAILABLE' | 'UNAVAILABLE';
    readonly unavailabilityReason?: string;
    readonly statement: string;
  }[];

  readonly conflicts: readonly {
    readonly tier: ConflictTier;
    readonly description: string;
    readonly resolution: string;
  }[];

  readonly manifestations: readonly {
    readonly mode: ManifestationMode;
    readonly confidence: ConfidenceLevel;
    readonly statement: string;
  }[];

  readonly evidenceIds: readonly string[];

  readonly evidence: readonly DomainEvidenceAiProjection[];
}

export function projectDomainInterpretationForAi(
  interpretation: DomainInterpretation
): DomainInterpretationAiProjection {
  return Object.freeze({
    domain: interpretation.domain,

    natalPromise: Object.freeze({
      strength: interpretation.natalPromise.strength,
      statement: interpretation.natalPromise.statement
    }),

    dashaActivation: Object.freeze({
      active: interpretation.dashaActivation.active,
      effect: interpretation.dashaActivation.effect,
      statement: interpretation.dashaActivation.statement
    }),

    transitTrigger: Object.freeze({
      active: interpretation.transitTrigger.active,
      effect: interpretation.transitTrigger.effect,
      statement: interpretation.transitTrigger.statement
    }),

    conclusion: Object.freeze({
      strength: interpretation.conclusion.strength,
      confidence: interpretation.conclusion.confidence,
      statement: interpretation.conclusion.statement,
      ...(interpretation.conclusionData
        ? { conclusionData: Object.freeze({ ...interpretation.conclusionData }) }
        : {})
    }),

    vargaConfirmations: Object.freeze(
      interpretation.vargaConfirmations.map((v) =>
        Object.freeze({
          varga: v.varga,
          relationship: v.varga === 'D2' ? 'UNAVAILABLE' : v.relationship,
          ...(v.varga === 'D2'
            ? { availability: 'UNAVAILABLE' as const, unavailabilityReason: 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.' }
            : v.availability ? { availability: v.availability } : {}),
          statement: v.varga === 'D2'
            ? 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.'
            : v.statement
        })
      )
    ),

    conflicts: Object.freeze(
      interpretation.conflicts.map((c) =>
        Object.freeze({
          tier: c.tier ?? 'SECONDARY_CONFLICT',
          description: c.description,
          resolution: c.resolution
        })
      )
    ),

    manifestations: Object.freeze(
      interpretation.manifestations.map((m) =>
        Object.freeze({
          mode: m.mode,
          confidence: m.confidence,
          statement: m.statement
        })
      )
    ),

    evidenceIds: Object.freeze(
      [...interpretation.conclusion.primaryEvidenceIds]
    ),

    evidence: Object.freeze(
      interpretation.evidence.map((e) =>
        Object.freeze({
          id: e.id,
          ...(e.identityKey ? { identityKey: e.identityKey } : {}),
          ...(e.sourceRecordId ? { sourceRecordId: e.sourceRecordId } : {}),
          relatedEvidenceIds: Object.freeze([...e.relatedEvidenceIds]),
          rootEvidenceIds: Object.freeze([...(e.rootEvidenceIds ?? [])]),
          source: e.source,
          ...(e.planet ? { planet: e.planet } : {}),
          ...(e.house !== undefined ? { house: e.house } : {}),
          ...(e.timing ? { timing: Object.freeze({ ...e.timing }) } : {}),
          statement: e.statement,
          sourceType: e.sourceType,
          role: e.role,
          polarity: e.polarity,
          strength: e.strength,
          ...(e.ruleId ? { ruleId: e.ruleId } : {}),
          ...(e.dimension ? { dimension: e.dimension } : {})
        })
      )
    )
  });
}
