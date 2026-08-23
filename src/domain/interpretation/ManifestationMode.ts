import type {
  ManifestationMode
} from './DomainInterpretationTypes';
import type { DomainEvidence } from './DomainEvidence';

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
  readonly status?: 'SUPPORTED' | 'POSSIBLE' | 'CHALLENGED' | 'MIXED' | 'INSUFFICIENT_DATA';
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

/**
 * Deterministically resolves the manifestation status based on evidence quality.
 * Enforces Spec §12: SUPPORTED requires (1 primary/strong + 1 independent corroborating) OR (>= 2 independent signals).
 * A single signal yields POSSIBLE. Zero yields INSUFFICIENT_DATA.
 */
export function resolveManifestationStatus(
  evidence: readonly DomainEvidence[]
): 'SUPPORTED' | 'POSSIBLE' | 'CHALLENGED' | 'MIXED' | 'INSUFFICIENT_DATA' {
  const supporting = evidence.filter((e) => e.polarity === 'SUPPORTING');
  const challenging = evidence.filter((e) => e.polarity === 'CHALLENGING');

  if (supporting.length === 0 && challenging.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  if (supporting.length > 0 && challenging.length > 0) {
    return 'MIXED';
  }

  if (challenging.length > 0 && supporting.length === 0) {
    return 'CHALLENGED';
  }

  const primary = supporting.filter((e) => e.role === 'PRIMARY');
  const strong = supporting.filter(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );

  const hasCorroboratedStrong =
    (primary.length >= 1 || strong.length >= 1) && supporting.length >= 2;
  const hasMultipleSignals = supporting.length >= 2;

  if (hasCorroboratedStrong || hasMultipleSignals) {
    return 'SUPPORTED';
  }

  if (supporting.length === 1) {
    return 'POSSIBLE';
  }

  return 'INSUFFICIENT_DATA';
}
