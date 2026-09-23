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
  readonly primarySourceIds?: readonly string[];
  readonly supportingSourceIds?: readonly string[];
  readonly challengingSourceIds?: readonly string[];
  readonly unresolvedSourceIds?: readonly string[];
}

export function createDomainConclusion(
  conclusion: Partial<DomainConclusion> & {
    statement: string;
  }
): DomainConclusion {
  return Object.freeze({
    domain: conclusion.domain ?? 'CAREER',
    strength: conclusion.strength ?? 'MODERATE',
    confidence: conclusion.confidence ?? 'MODERATE',
    statement: conclusion.statement,
    primaryEvidenceIds: Object.freeze([
      ...(conclusion.primaryEvidenceIds ?? [])
    ]),
    supportingEvidenceIds: Object.freeze([
      ...(conclusion.supportingEvidenceIds ?? [])
    ]),
    challengingEvidenceIds: Object.freeze([
      ...(conclusion.challengingEvidenceIds ?? [])
    ]),
    unresolvedQuestions: Object.freeze([
      ...(conclusion.unresolvedQuestions ?? [])
    ]),
    primarySourceIds: conclusion.primarySourceIds !== undefined
      ? Object.freeze([...conclusion.primarySourceIds])
      : undefined,
    supportingSourceIds: conclusion.supportingSourceIds !== undefined
      ? Object.freeze([...conclusion.supportingSourceIds])
      : undefined,
    challengingSourceIds: conclusion.challengingSourceIds !== undefined
      ? Object.freeze([...conclusion.challengingSourceIds])
      : undefined,
    unresolvedSourceIds: conclusion.unresolvedSourceIds !== undefined
      ? Object.freeze([...conclusion.unresolvedSourceIds])
      : undefined
  });
}
