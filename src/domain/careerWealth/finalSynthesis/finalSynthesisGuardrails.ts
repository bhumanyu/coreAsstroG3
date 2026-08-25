import type { DomainStrength } from '../../reasoning/reasoningTypes';
import type {
  FinalDomainStatus,
  WealthDimensionFinalSynthesis
} from './careerWealthFinalSynthesisTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';

const ALL_WEALTH_DIMENSIONS: readonly WealthDimension[] = [
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
];

/**
 * Enforces that secondary evidence (Dasha, Transit, Varga) can never overturn a natal challenge or deficiency.
 * The natal promise acts as an upper ceiling for career synthesis.
 */
export function enforceCareerNatalCeiling(
  natalPromise: DomainStrength,
  candidate: FinalDomainStatus
): FinalDomainStatus {
  if (candidate === 'INSUFFICIENT_DATA' || natalPromise === 'UNDETERMINED') {
    return 'INSUFFICIENT_DATA';
  }

  if (natalPromise === 'WEAK' || natalPromise === 'VERY_WEAK') {
    return 'CHALLENGED';
  }

  if (natalPromise === 'MIXED') {
    if (candidate === 'VERY_STRONG' || candidate === 'STRONG' || candidate === 'MODERATE') {
      return 'MIXED';
    }
    return candidate;
  }

  if (natalPromise === 'MODERATE') {
    if (candidate === 'VERY_STRONG' || candidate === 'STRONG') {
      return 'MODERATE';
    }
    return candidate;
  }

  return candidate;
}

/**
 * Enforces natal ceiling for an individual wealth dimension.
 */
export function enforceWealthNatalCeiling(
  natalPromise: DomainStrength | undefined,
  candidate: FinalDomainStatus
): FinalDomainStatus {
  if (!natalPromise || natalPromise === 'UNDETERMINED' || candidate === 'INSUFFICIENT_DATA') {
    return 'INSUFFICIENT_DATA';
  }

  if (natalPromise === 'WEAK' || natalPromise === 'VERY_WEAK') {
    return 'CHALLENGED';
  }

  if (natalPromise === 'MIXED') {
    if (candidate === 'VERY_STRONG' || candidate === 'STRONG' || candidate === 'MODERATE') {
      return 'MIXED';
    }
    return candidate;
  }

  if (natalPromise === 'MODERATE') {
    if (candidate === 'VERY_STRONG' || candidate === 'STRONG') {
      return 'MODERATE';
    }
    return candidate;
  }

  return candidate;
}

/**
 * Enforces complete structural and logical isolation across wealth dimensions.
 * Cross-dimension inference is strictly forbidden (e.g. speculation cannot be inferred from accumulation).
 */
export function enforceWealthDimensionIsolation(
  dimensions: Partial<Record<WealthDimension, WealthDimensionFinalSynthesis>>
): Readonly<Record<WealthDimension, WealthDimensionFinalSynthesis>> {
  const result: Record<WealthDimension, WealthDimensionFinalSynthesis> = {} as any;
  for (const dim of ALL_WEALTH_DIMENSIONS) {
    const existing = dimensions[dim];
    if (existing) {
      result[dim] = Object.isFrozen(existing) ? existing : Object.freeze({ ...existing });
    } else {
      result[dim] = Object.freeze({
        status: 'INSUFFICIENT_DATA',
        confidence: 'LOW',
        primaryPromise: 'UNDETERMINED',
        dashaEffect: 'INSUFFICIENT_DATA',
        timingEffect: 'INSUFFICIENT_DATA',
        divisionalEffect: 'UNAVAILABLE',
        summary: `${dim} has insufficient data.`,
        evidenceIds: Object.freeze([])
      });
    }
  }
  return Object.freeze(result);
}
