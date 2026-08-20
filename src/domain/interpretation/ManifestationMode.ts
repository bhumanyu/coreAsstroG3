import type {
  ManifestationMode
} from './DomainInterpretationTypes';

export interface DomainManifestation {
  readonly mode: ManifestationMode;
  readonly confidence:
    | 'VERY_HIGH'
    | 'HIGH'
    | 'MODERATE'
    | 'LOW'
    | 'VERY_LOW';
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly status?: 'SUPPORTED' | 'CHALLENGED' | 'MIXED' | 'INSUFFICIENT_DATA';
}

export function createDomainManifestation(
  manifestation: DomainManifestation
): DomainManifestation {
  return Object.freeze({
    ...manifestation,
    evidenceIds: Object.freeze([
      ...manifestation.evidenceIds
    ])
  });
}
