export type DashaReasoningLevel = 'FACT' | 'IMPLICATION' | 'OUTCOME';

export type DashaEvidenceEffect = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';

export type DashaReasoningBasis =
  | 'PLACEMENT'
  | 'OWNERSHIP'
  | 'FUNCTIONAL_ROLE'
  | 'FUNCTIONAL_NATURE'
  | 'DIGNITY'
  | 'STATE'
  | 'STRENGTH'
  | 'ASPECT'
  | 'YOGA'
  | 'HOUSE_DOMAIN'
  | 'COMBINATION';

export interface DashaReasoningEvidence {
  readonly id: string;
  readonly level: DashaReasoningLevel;
  readonly basis: DashaReasoningBasis;
  readonly effect: DashaEvidenceEffect;
  readonly statement: string;
  readonly confidence: number;
  readonly sourceEvidenceIds: readonly string[];
  readonly activatedHouses: readonly number[];
}
