import type {
  ReasoningDirection,
  TimingActivationEffect,
  DomainStrength,
  TimingHierarchyResult
} from './reasoningTypes';
import type { NatalPromiseResult } from './reasoningConclusion';
import type { DomainEvidence } from '../interpretation/DomainEvidence';

export type ConflictSeverity =
  | 'MINOR'
  | 'MODERATE'
  | 'MAJOR'
  | 'CRITICAL';

export type ConflictScope =
  | 'PROMISE'
  | 'EXPRESSION'
  | 'TIMING'
  | 'RISK';

export interface ReasoningConflict {
  readonly kind: string;
  readonly severity: ConflictSeverity;
  readonly scope: ConflictScope;
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface ConflictResolution {
  readonly conflicts: readonly ReasoningConflict[];
  readonly finalDirection: ReasoningDirection;
  readonly rationale: string;
}

export function detectReasoningConflicts(params: {
  readonly natalPromise: NatalPromiseResult;
  readonly vargaDirection?: ReasoningDirection;
  readonly dashaEffect?: TimingActivationEffect;
  readonly transitDirection?: ReasoningDirection;
  readonly explicitConflicts?: readonly ReasoningConflict[];
}): readonly ReasoningConflict[] {
  const conflicts: ReasoningConflict[] = [
    ...(params.explicitConflicts ?? [])
  ];

  // 1. Promise-level conflict: Primary factors internally clash
  if (
    params.natalPromise.primarySupport > 0 &&
    params.natalPromise.primaryChallenge > 0
  ) {
    conflicts.push({
      kind: 'NATAL_PRIMARY_CONFLICT',
      severity: 'MAJOR',
      scope: 'PROMISE',
      evidenceIds: [],
      statement:
        'Direct tension between primary natal structural factors creates conflicting foundational capacity.'
    });
  }

  // 2. Expression-level conflict: Strong natal promise vs conflicting divisional confirmation
  if (
    params.natalPromise.direction === 'SUPPORT' &&
    params.vargaDirection === 'CHALLENGE'
  ) {
    conflicts.push({
      kind: 'VARGA_EXPRESSION_CONFLICT',
      severity: 'MODERATE',
      scope: 'EXPRESSION',
      evidenceIds: [],
      statement:
        'Divisional confirmation introduces operational friction to the expression of natal promise.'
    });
  }

  // 3. Timing-level conflict: Strong natal promise vs challenging Dasha
  if (
    params.natalPromise.direction === 'SUPPORT' &&
    params.dashaEffect === 'CHALLENGES'
  ) {
    conflicts.push({
      kind: 'DASHA_NATAL_TENSION',
      severity: 'MODERATE',
      scope: 'TIMING',
      evidenceIds: [],
      statement:
        'Current Dasha regime introduces temporary timing friction against a supportive natal promise.'
    });
  }

  // 4. Short-term trigger conflict: Challenging transit vs supportive natal/dasha
  if (
    params.natalPromise.direction === 'SUPPORT' &&
    params.transitDirection === 'CHALLENGE'
  ) {
    conflicts.push({
      kind: 'TRANSIT_NATAL_TENSION',
      severity: 'MINOR',
      scope: 'TIMING',
      evidenceIds: [],
      statement:
        'Current planetary transit creates temporary pressure without compromising core natal capacity.'
    });
  }

  return Object.freeze(conflicts);
}

export function resolveReasoningConflicts(params: {
  readonly natalPromise: NatalPromiseResult;
  readonly vargaDirection?: ReasoningDirection;
  readonly dashaEffect?: TimingActivationEffect;
  readonly transitDirection?: ReasoningDirection;
  readonly explicitConflicts?: readonly ReasoningConflict[];
}): ConflictResolution {
  const conflicts = detectReasoningConflicts(params);

  // Resolution hierarchy:
  // Promise > Expression (Varga) > Timing (Dasha) > Trigger (Transit)
  let finalDirection: ReasoningDirection = params.natalPromise.direction;
  let rationale =
    'Conflict resolution applied in structural hierarchy: Promise > Expression > Timing > Trigger.';

  if (params.natalPromise.direction === 'UNAVAILABLE') {
    finalDirection = 'UNAVAILABLE';
    rationale = 'Natal promise data is insufficient to establish domain capacity.';
  } else if (params.natalPromise.direction === 'MIXED') {
    finalDirection = 'MIXED';
    rationale =
      'Primary promise-level conflict takes precedence over secondary and timing layers.';
  } else if (params.natalPromise.direction === 'SUPPORT') {
    // A challenging transit NEVER erases a strong natal promise
    if (params.vargaDirection === 'CHALLENGE') {
      // Varga qualifies/modifies expression, but does not overwrite D1
      finalDirection = 'SUPPORT';
      rationale =
        'Strong natal promise preserved with divisional execution friction noted in expression layer.';
    } else if (params.dashaEffect === 'CHALLENGES') {
      finalDirection = 'SUPPORT';
      rationale =
        'Supportive natal capacity preserved despite active timing headwinds.';
    } else {
      finalDirection = 'SUPPORT';
      rationale = 'Natal promise is structurally supported across evaluated layers.';
    }
  } else if (params.natalPromise.direction === 'CHALLENGE') {
    // Dasha activation cannot create a natal promise where none exists
    if (params.dashaEffect === 'ACTIVATES') {
      finalDirection = 'CHALLENGE';
      rationale =
        'Favorable Dasha activation operates within a constrained natal structural promise.';
    } else {
      finalDirection = 'CHALLENGE';
      rationale = 'Natal structural indications present ongoing domain challenges.';
    }
  }

  return Object.freeze({
    conflicts,
    finalDirection,
    rationale
  });
}

/**
 * Deterministically resolves final domain strength by consuming the full hierarchy:
 * Promise > Expression (Varga) > Timing (Dasha) > Trigger (Transit).
 *
 * 1. Preserves strong natal promise against transit-only pressure.
 * 2. Applies divisional qualification (one-notch downgrade on Varga conflict).
 * 3. Reflects genuine Dasha CHALLENGES as a timing reduction.
 * 4. Never fabricates promise where natal direction is CHALLENGE or UNAVAILABLE.
 */
export function resolveFinalDomainStrength(params: {
  readonly natalStrength: DomainStrength;
  readonly natalDirection: ReasoningDirection;
  readonly vargaDirection?: ReasoningDirection;
  readonly dashaEffect?: TimingActivationEffect;
  readonly transitDirection?: ReasoningDirection;
  readonly conflicts?: readonly ReasoningConflict[];
}): DomainStrength {
  const {
    natalStrength,
    natalDirection,
    vargaDirection,
    dashaEffect
  } = params;

  if (natalDirection === 'UNAVAILABLE' || natalStrength === 'UNDETERMINED') {
    return 'UNDETERMINED';
  }

  // Never fabricate promise where natal direction is CHALLENGE
  if (natalDirection === 'CHALLENGE') {
    return natalStrength;
  }

  if (natalDirection === 'MIXED') {
    return 'MIXED';
  }

  // Natal is SUPPORT
  let current: DomainStrength = natalStrength;

  // 1. Varga conflict downgrade (matching resolveCareerConclusionStrength semantics)
  if (vargaDirection === 'CHALLENGE') {
    if (current === 'VERY_STRONG') {
      current = 'STRONG';
    } else if (current === 'STRONG') {
      current = 'MODERATE';
    } else if (current === 'MODERATE') {
      current = 'MIXED';
    }
  }

  // 2. Dasha timing impact (genuine CHALLENGES timing reduction)
  if (dashaEffect === 'CHALLENGES') {
    if (current === 'VERY_STRONG') {
      current = 'STRONG';
    } else if (current === 'STRONG') {
      current = 'MODERATE';
    } else if (current === 'MODERATE') {
      current = 'MIXED';
    }
  }

  // 3. Transit-only pressure preserves strong natal promise (no reduction from transitDirection alone)

  return current;
}

/**
 * Deterministically grades currentPressure across NONE/LOW/MODERATE/HIGH based on:
 * - Transit evidence presence and strength
 * - Dasha finalEffect and MD/AD hierarchy dominance
 * - Conflict scope and severity
 */
export function resolveGradedCurrentPressure(params: {
  readonly transitEvidence?: readonly DomainEvidence[];
  readonly transitDirection?: ReasoningDirection;
  readonly timingHierarchy?: TimingHierarchyResult;
  readonly dashaEffect?: TimingActivationEffect;
  readonly conflicts?: readonly ReasoningConflict[];
}): 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' {
  const {
    transitEvidence = [],
    transitDirection = 'NEUTRAL',
    timingHierarchy,
    dashaEffect = timingHierarchy?.finalEffect,
    conflicts = []
  } = params;

  const hasStrongTransitChallenge = transitEvidence.some(
    (e) => e.polarity === 'CHALLENGING' && (e.strength === 'STRONG' || e.strength === 'VERY_STRONG')
  );
  const hasAnyTransitChallenge =
    transitDirection === 'CHALLENGE' ||
    transitEvidence.some((e) => e.polarity === 'CHALLENGING');

  const isDashaChallenging = dashaEffect === 'CHALLENGES';
  const isDominantDashaChallenging =
    isDashaChallenging &&
    timingHierarchy?.dominantLevel === 'MD' &&
    timingHierarchy?.md.effect === 'CHALLENGES';

  const hasCompoundedTimingFriction =
    hasAnyTransitChallenge && isDashaChallenging;

  const hasCriticalConflict = conflicts.some(
    (c) => c.severity === 'CRITICAL'
  );

  // HIGH: Compounded pressure (e.g. transit challenge + challenging Dasha, or dominant MD+AD challenge with transit friction)
  if (
    hasCompoundedTimingFriction ||
    (isDominantDashaChallenging && hasAnyTransitChallenge) ||
    hasCriticalConflict
  ) {
    return 'HIGH';
  }

  // MODERATE: Single-source significant pressure (e.g. transit challenge without dasha challenge, or vice versa)
  if (
    hasStrongTransitChallenge ||
    hasAnyTransitChallenge ||
    isDashaChallenging
  ) {
    return 'MODERATE';
  }

  // LOW: Minor/mixed timing adjustments
  if (
    transitDirection === 'MIXED' ||
    dashaEffect === 'PARTIALLY_ACTIVATES' ||
    dashaEffect === 'DOES_NOT_ACTIVATE' ||
    conflicts.some((c) => c.severity === 'MINOR')
  ) {
    return 'LOW';
  }

  return 'NONE';
}
