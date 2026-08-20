import type { DomainConflict } from '../interpretation';
import { detectDomainConflicts } from '../interpretation';
import type { DomainEvidence, VargaRelationship } from '../interpretation';
import type { WealthDimensionInterpretation } from './wealthTypes';

export type WealthConflictTier =
  | 'PRIMARY_VS_PRIMARY'
  | 'PRIMARY_VS_VARGA'
  | 'PRIMARY_VS_MODIFIER'
  | 'PRIMARY_VS_TIMING'
  | 'PRIMARY_VS_TRANSIT'
  | 'SECONDARY_CONFLICT';

export function detectWealthConflicts(
  evidence: readonly DomainEvidence[],
  d2Relationship?: VargaRelationship,
  dimensions?: readonly WealthDimensionInterpretation[],
  transitEvidence?: readonly DomainEvidence[]
): readonly DomainConflict[] {
  return detectDomainConflicts('WEALTH', evidence);
}
