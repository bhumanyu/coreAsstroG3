import type { ReasoningEdgeType } from './reasoningEdge';
import type {
  SynthesisAxisStatus,
  FinalDomainStatus
} from '../finalSynthesis/careerWealthFinalSynthesisTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';
import type { DomainStrength } from '../../reasoning/reasoningTypes';

/**
 * Maps a general synthesis axis status (SUPPORT/CHALLENGE) to a ReasoningEdgeType.
 * Returns undefined for NEUTRAL, INSUFFICIENT_DATA, MIXED, or unhandled values (no edge emitted).
 */
export function mapAxisStatusToEdgeType(
  status: SynthesisAxisStatus | string | undefined
): ReasoningEdgeType | undefined {
  if (!status) return undefined;
  const upper = status.toUpperCase();
  if (upper === 'SUPPORT') {
    return 'SUPPORTS';
  }
  if (upper === 'CHALLENGE') {
    return 'CHALLENGES';
  }
  return undefined;
}

/**
 * Maps an activation synthesis axis status (e.g. Dasha activation) to a ReasoningEdgeType.
 * Returns ACTIVATES for SUPPORT, CHALLENGES for CHALLENGE, and undefined otherwise.
 */
export function mapActivationStatusToEdgeType(
  activationStatus: SynthesisAxisStatus | string | undefined
): ReasoningEdgeType | undefined {
  if (!activationStatus) return undefined;
  const upper = activationStatus.toUpperCase();
  if (upper === 'SUPPORT' || upper === 'ACTIVE') {
    return 'ACTIVATES';
  }
  if (upper === 'CHALLENGE' || upper === 'INACTIVE') {
    return 'CHALLENGES';
  }
  return undefined;
}

/**
 * Maps a divisional relationship (D10 / D2) to a ReasoningEdgeType.
 * CONFIRMS / PARTIALLY_CONFIRMS -> CONFIRMS
 * CONFLICTS / CONFLICTING -> CHALLENGES
 * NEUTRAL / UNAVAILABLE / undefined -> undefined (no edge emitted)
 */
export function mapDivisionalRelationshipToEdgeType(
  rel: VargaRelationship | string | undefined
): ReasoningEdgeType | undefined {
  if (!rel) return undefined;
  const upper = rel.toUpperCase();
  if (upper === 'CONFIRMS' || upper === 'PARTIALLY_CONFIRMS') {
    return 'CONFIRMS';
  }
  if (upper === 'CONFLICTS' || upper === 'CONFLICTING') {
    return 'CHALLENGES';
  }
  return undefined;
}

/**
 * Maps a manifestation status to a ReasoningEdgeType.
 * Returns MANIFESTS only when a real supported/mixed/challenged manifestation exists,
 * and undefined when status is INSUFFICIENT_DATA, absent, or undefined.
 */
export function mapManifestationStatusToEdgeType(
  status: FinalDomainStatus | string | undefined
): ReasoningEdgeType | undefined {
  if (!status) return undefined;
  const upper = status.toUpperCase();
  if (
    upper === 'VERY_STRONG' ||
    upper === 'STRONG' ||
    upper === 'MODERATE' ||
    upper === 'MIXED' ||
    upper === 'CHALLENGED'
  ) {
    return 'MANIFESTS';
  }
  return undefined;
}

/**
 * Maps a natal promise status to a ReasoningEdgeType for the Natal -> Final edge.
 */
export function mapPromiseStatusToEdgeType(
  status: FinalDomainStatus | DomainStrength | string | undefined
): ReasoningEdgeType | undefined {
  if (!status) return undefined;
  const upper = status.toUpperCase();
  if (
    upper === 'VERY_STRONG' ||
    upper === 'STRONG' ||
    upper === 'EXCELLENT' ||
    upper === 'GOOD' ||
    upper === 'MODERATE'
  ) {
    return 'SUPPORTS';
  }
  if (
    upper === 'CHALLENGED' ||
    upper === 'POOR' ||
    upper === 'WEAK' ||
    upper === 'VERY_WEAK' ||
    upper === 'LIMITED'
  ) {
    return 'CHALLENGES';
  }
  return undefined;
}
