import type {
  ConfidenceLevel,
  DomainId,
  DomainStrength
} from './DomainInterpretationTypes';

export interface TransitTrigger {
  readonly domain: DomainId;
  readonly active: boolean;
  readonly strength: DomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly triggeredPromiseEvidenceIds: readonly string[];
}

export function createTransitTrigger(
  trigger: TransitTrigger
): TransitTrigger {
  return Object.freeze({
    ...trigger,
    evidenceIds: Object.freeze([
      ...trigger.evidenceIds
    ]),
    triggeredPromiseEvidenceIds: Object.freeze([
      ...trigger.triggeredPromiseEvidenceIds
    ])
  });
}
