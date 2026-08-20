import type {
  ConfidenceLevel,
  DomainId,
  DomainStrength,
  TimingActivationEffect
} from './DomainInterpretationTypes';

export interface DashaActivation {
  readonly domain: DomainId;
  readonly active: boolean;
  readonly effect: TimingActivationEffect;
  readonly strength: DomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly activatedPromiseEvidenceIds: readonly string[];
}

export function createDashaActivation(
  activation: Partial<DashaActivation> & {
    effect: TimingActivationEffect;
  }
): DashaActivation {
  const evidenceIds = activation.evidenceIds ?? [];
  const activatedPromiseEvidenceIds =
    activation.activatedPromiseEvidenceIds ?? [];

  return Object.freeze({
    domain: activation.domain ?? 'CAREER',
    active: activation.active ?? true,
    effect: activation.effect,
    strength: activation.strength ?? 'MODERATE',
    confidence: activation.confidence ?? 'MODERATE',
    statement: activation.statement ?? '',
    evidenceIds: Object.freeze([...evidenceIds]),
    activatedPromiseEvidenceIds: Object.freeze([
      ...activatedPromiseEvidenceIds
    ])
  });
}
