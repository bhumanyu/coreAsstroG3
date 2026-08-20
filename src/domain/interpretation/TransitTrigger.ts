import type {
  ConfidenceLevel,
  DomainId,
  DomainStrength,
  TransitTriggerEffect
} from './DomainInterpretationTypes';

export interface TransitTrigger {
  readonly domain: DomainId;
  readonly active: boolean;
  readonly effect: TransitTriggerEffect;
  readonly strength: DomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly triggeredPromiseEvidenceIds: readonly string[];
}

export function createTransitTrigger(
  trigger: Partial<TransitTrigger> & {
    effect: TransitTriggerEffect;
  }
): TransitTrigger {
  const evidenceIds = trigger.evidenceIds ?? [];
  const triggeredPromiseEvidenceIds =
    trigger.triggeredPromiseEvidenceIds ?? [];

  return Object.freeze({
    domain: trigger.domain ?? 'CAREER',
    active: trigger.active ?? true,
    effect: trigger.effect,
    strength: trigger.strength ?? 'MODERATE',
    confidence: trigger.confidence ?? 'MODERATE',
    statement: trigger.statement ?? '',
    evidenceIds: Object.freeze([...evidenceIds]),
    triggeredPromiseEvidenceIds: Object.freeze([
      ...triggeredPromiseEvidenceIds
    ])
  });
}
