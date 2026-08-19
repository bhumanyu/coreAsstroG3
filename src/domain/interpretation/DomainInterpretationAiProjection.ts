import type { DomainInterpretation } from './DomainInterpretation';

export interface DomainInterpretationAiProjection {
  readonly domain: DomainInterpretation['domain'];

  readonly natalPromise: {
    readonly strength: DomainInterpretation['natalPromise']['strength'];
    readonly statement: string;
  };

  readonly dashaActivation: {
    readonly active: boolean;
    readonly statement: string;
  };

  readonly transitTrigger: {
    readonly active: boolean;
    readonly statement: string;
  };

  readonly conclusion: {
    readonly strength: DomainInterpretation['conclusion']['strength'];
    readonly confidence: DomainInterpretation['conclusion']['confidence'];
    readonly statement: string;
  };

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
      statement: interpretation.dashaActivation.statement
    }),

    transitTrigger: Object.freeze({
      active: interpretation.transitTrigger.active,
      statement: interpretation.transitTrigger.statement
    }),

    conclusion: Object.freeze({
      strength: interpretation.conclusion.strength,
      confidence: interpretation.conclusion.confidence,
      statement: interpretation.conclusion.statement
    }),

    evidenceIds: Object.freeze([
      ...interpretation.conclusion.primaryEvidenceIds
    ])
  });
}
