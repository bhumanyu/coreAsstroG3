import type { ReasoningEdgeType } from './reasoningEdge';
import type {
  SynthesisAxisStatus,
  FinalDomainStatus
} from '../finalSynthesis/careerWealthFinalSynthesisTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';

/**
 * Maps a natal promise status to a ReasoningEdgeType for the Natal -> Final edge.
 * VERY_STRONG / STRONG / MODERATE -> 'SUPPORTS'
 * CHALLENGED -> 'CHALLENGES'
 * MIXED / INSUFFICIENT_DATA -> undefined (no edge emitted)
 */
export function mapPromiseStatusToEdgeType(
  status: FinalDomainStatus
): ReasoningEdgeType | undefined {
  switch (status) {
    case 'VERY_STRONG':
    case 'STRONG':
    case 'MODERATE':
      return 'SUPPORTS';
    case 'CHALLENGED':
      return 'CHALLENGES';
    case 'MIXED':
    case 'INSUFFICIENT_DATA':
      return undefined;
    default: {
      const _exhaustive: never = status;
      return undefined;
    }
  }
}

/**
 * Maps an activation synthesis axis status (e.g. Dasha activation) to a ReasoningEdgeType.
 * SUPPORT -> 'ACTIVATES'
 * CHALLENGE -> 'CHALLENGES'
 * MIXED -> 'MODIFIES'
 * NEUTRAL / INSUFFICIENT_DATA -> undefined
 */
export function mapActivationStatusToEdgeType(
  status: SynthesisAxisStatus
): ReasoningEdgeType | undefined {
  switch (status) {
    case 'SUPPORT':
      return 'ACTIVATES';
    case 'CHALLENGE':
      return 'CHALLENGES';
    case 'MIXED':
      return 'MODIFIES';
    case 'NEUTRAL':
    case 'INSUFFICIENT_DATA':
      return undefined;
    default: {
      const _exhaustive: never = status;
      return undefined;
    }
  }
}

/**
 * Maps a timing synthesis axis status (e.g. Transit trigger) to a ReasoningEdgeType.
 * SUPPORT -> 'ACTIVATES'
 * CHALLENGE -> 'CHALLENGES'
 * MIXED -> 'MODIFIES'
 * NEUTRAL / INSUFFICIENT_DATA -> undefined
 */
export function mapTimingStatusToEdgeType(
  status: SynthesisAxisStatus
): ReasoningEdgeType | undefined {
  switch (status) {
    case 'SUPPORT':
      return 'ACTIVATES';
    case 'CHALLENGE':
      return 'CHALLENGES';
    case 'MIXED':
      return 'MODIFIES';
    case 'NEUTRAL':
    case 'INSUFFICIENT_DATA':
      return undefined;
    default: {
      const _exhaustive: never = status;
      return undefined;
    }
  }
}

/**
 * Maps a divisional relationship (D10 / D2) to a ReasoningEdgeType.
 * CONFIRMS / PARTIALLY_CONFIRMS -> 'CONFIRMS'
 * CONFLICTS -> 'CHALLENGES'
 * MODIFIES / UNAVAILABLE -> undefined (no edge emitted)
 */
export function mapDivisionalRelationshipToEdgeType(
  rel: VargaRelationship
): ReasoningEdgeType | undefined {
  switch (rel) {
    case 'CONFIRMS':
    case 'PARTIALLY_CONFIRMS':
      return 'CONFIRMS';
    case 'CONFLICTS':
      return 'CHALLENGES';
    case 'MODIFIES':
    case 'UNAVAILABLE':
      return undefined;
    default: {
      const _exhaustive: never = rel;
      return undefined;
    }
  }
}

/**
 * Maps a manifestation status to a ReasoningEdgeType.
 * VERY_STRONG / STRONG / MODERATE -> 'MANIFESTS'
 * CHALLENGED -> 'CHALLENGES'
 * MIXED / INSUFFICIENT_DATA -> undefined (no edge emitted)
 */
export function mapManifestationStatusToEdgeType(
  status: FinalDomainStatus
): ReasoningEdgeType | undefined {
  switch (status) {
    case 'VERY_STRONG':
    case 'STRONG':
    case 'MODERATE':
      return 'MANIFESTS';
    case 'CHALLENGED':
      return 'CHALLENGES';
    case 'MIXED':
    case 'INSUFFICIENT_DATA':
      return undefined;
    default: {
      const _exhaustive: never = status;
      return undefined;
    }
  }
}
