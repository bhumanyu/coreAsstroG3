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
  activation: DashaActivation
): DashaActivation {
  return Object.freeze({
    ...activation,
    evidenceIds: Object.freeze([
      ...activation.evidenceIds
    ]),
    activatedPromiseEvidenceIds: Object.freeze([
      ...activation.activatedPromiseEvidenceIds
    ])
  });
}
