import type { DomainInterpretation } from './DomainInterpretation';
import type {
  ConfidenceLevel,
  ConflictTier,
  EvidenceSource,
  ManifestationMode,
  TimingActivationEffect,
  TransitTriggerEffect,
  VargaRelationship
} from './DomainInterpretationTypes';

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
          relationship: v.relationship,
          statement: v.statement
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

    evidenceIds: Object.freeze([
      ...interpretation.conclusion.primaryEvidenceIds
    ])
  });
}
