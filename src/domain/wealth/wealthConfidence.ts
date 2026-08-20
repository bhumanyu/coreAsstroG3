import type { ConfidenceLevel } from '../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import {
  calculateEvidenceConfidence,
  type ConfidenceEvaluationOptions
} from '../interpretation/EvidenceConfidence';
import type { VargaRelationship } from '../interpretation';
import type { WealthDataCompleteness } from './wealthTypes';
import type { DomainConflict } from '../interpretation';

export interface WealthConfidenceInput {
  readonly evidence: readonly DomainEvidence[];
  readonly d2Relationship?: VargaRelationship;
  readonly completeness?: WealthDataCompleteness;
  readonly conflicts?: readonly DomainConflict[];
}

export function calculateWealthConfidence(
  input: readonly DomainEvidence[] | WealthConfidenceInput,
  options?: ConfidenceEvaluationOptions
): ConfidenceLevel {
  if ('evidence' in input) {
    const { evidence, d2Relationship, completeness, conflicts } = input;
    const hasVargaConflict =
      d2Relationship === 'CONFLICTS' ||
      Boolean(conflicts?.some((c: DomainConflict) => c.tier === 'PRIMARY_VS_VARGA'));
    const hasPrimaryChallenge = Boolean(
      conflicts?.some((c: DomainConflict) => c.tier === 'PRIMARY_VS_PRIMARY')
    );

    const completenessStatus =
      completeness?.primaryFactors === 'AVAILABLE'
        ? 'COMPLETE'
        : completeness?.primaryFactors === 'PARTIAL'
        ? 'PARTIAL'
        : 'INSUFFICIENT';

    return calculateEvidenceConfidence(evidence, {
      dataCompleteness: completenessStatus,
      hasVargaConflict,
      hasPrimaryChallenge
    });
  }

  return calculateEvidenceConfidence(input, options);
}
