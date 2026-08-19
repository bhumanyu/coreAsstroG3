import type {
  ConfidenceLevel,
  DomainId,
  DomainStrength
} from './DomainInterpretationTypes';

export interface DomainConclusion {
  readonly domain: DomainId;
  readonly strength: DomainStrength;
  readonly confidence: ConfidenceLevel;
  readonly statement: string;
  readonly primaryEvidenceIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly unresolvedQuestions: readonly string[];
}

export function createDomainConclusion(
  conclusion: DomainConclusion
): DomainConclusion {
  return Object.freeze({
    ...conclusion,
    primaryEvidenceIds: Object.freeze([
      ...conclusion.primaryEvidenceIds
    ]),
    supportingEvidenceIds: Object.freeze([
      ...conclusion.supportingEvidenceIds
    ]),
    challengingEvidenceIds: Object.freeze([
      ...conclusion.challengingEvidenceIds
    ]),
    unresolvedQuestions: Object.freeze([
      ...conclusion.unresolvedQuestions
    ])
  });
}
