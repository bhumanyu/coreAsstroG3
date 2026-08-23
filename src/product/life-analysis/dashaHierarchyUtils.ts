import type { TimingActivationEffect } from '../../domain/interpretation/DomainInterpretationTypes';
import type {
  DashaHierarchyEvidenceRef,
  DashaHierarchyLevel,
  DashaHierarchyRole
} from './dashaHierarchyTypes';

export function formatEffectLabel(effect?: TimingActivationEffect | string): string {
  switch (effect) {
    case 'ACTIVATES':
      return 'Activates';
    case 'PARTIALLY_ACTIVATES':
      return 'Partially Activates';
    case 'CHALLENGES':
      return 'Challenges';
    case 'DOES_NOT_ACTIVATE':
      return 'Does Not Activate';
    case 'INSUFFICIENT_DATA':
      return 'Insufficient Data';
    case 'UNKNOWN':
    default:
      return 'Unknown';
  }
}

/**
 * Deterministic rule-based hierarchical timing effect combination.
 * Hierarchy: Primary (MD) -> Modifier (AD) -> Trigger (PD)
 * Constraints:
 * - Primary sets the fundamental baseline context.
 * - Modifier can confirm, challenge, or soften the primary effect.
 * - Trigger (PD) can never flip an established primary/modifier direction.
 */
export function combineTimingHierarchy(
  primary: TimingActivationEffect,
  modifier: TimingActivationEffect,
  trigger: TimingActivationEffect
): { overallEffect: TimingActivationEffect; confidence: number } {
  let baseEffect: TimingActivationEffect;

  // Step 1: Combine Primary (MD) with Modifier (AD)
  if (primary === 'ACTIVATES') {
    if (modifier === 'ACTIVATES' || modifier === 'PARTIALLY_ACTIVATES') {
      baseEffect = 'ACTIVATES';
    } else if (modifier === 'CHALLENGES') {
      baseEffect = 'PARTIALLY_ACTIVATES'; // AD challenge not discarded (§15)
    } else {
      // INSUFFICIENT_DATA, UNKNOWN, DOES_NOT_ACTIVATE: keep ACTIVATES but note confidence (§16)
      baseEffect = 'ACTIVATES';
    }
  } else if (primary === 'CHALLENGES') {
    if (modifier === 'ACTIVATES' || modifier === 'PARTIALLY_ACTIVATES') {
      baseEffect = 'PARTIALLY_ACTIVATES'; // Challenge context preserved, never full ACTIVATES (§17)
    } else if (modifier === 'CHALLENGES') {
      baseEffect = 'CHALLENGES';
    } else {
      baseEffect = 'CHALLENGES';
    }
  } else if (primary === 'PARTIALLY_ACTIVATES') {
    baseEffect = 'PARTIALLY_ACTIVATES';
  } else {
    // Primary is DOES_NOT_ACTIVATE, INSUFFICIENT_DATA, or UNKNOWN (§13 Rule A)
    // The overall must NOT be forced to ACTIVATES by AD/PD.
    if (modifier === 'ACTIVATES' || modifier === 'PARTIALLY_ACTIVATES') {
      baseEffect = 'PARTIALLY_ACTIVATES';
    } else if (modifier === 'CHALLENGES') {
      baseEffect = 'CHALLENGES';
    } else {
      baseEffect = primary;
    }
  }

  // Step 2: PD refinement (Trigger) - PD must NOT flip the base direction established by MD+AD (§18)
  let overallEffect: TimingActivationEffect = baseEffect;

  if (
    baseEffect === 'DOES_NOT_ACTIVATE' ||
    baseEffect === 'INSUFFICIENT_DATA' ||
    baseEffect === 'UNKNOWN'
  ) {
    if (trigger === 'ACTIVATES' || trigger === 'PARTIALLY_ACTIVATES') {
      overallEffect = 'PARTIALLY_ACTIVATES'; // Cannot force pure ACTIVATES if MD was inactive
    } else if (trigger === 'CHALLENGES') {
      overallEffect = 'CHALLENGES';
    } else {
      overallEffect = baseEffect;
    }
  } else {
    // Base effect is established (ACTIVATES, CHALLENGES, or PARTIALLY_ACTIVATES).
    // PD trigger cannot override or flip the established direction (§18, §29).
    overallEffect = baseEffect;
  }

  // Step 3: Deterministic confidence derivation from cross-level agreement (§8)
  let conf = 0.75;

  const isConclusive = (e: TimingActivationEffect) =>
    e === 'ACTIVATES' || e === 'CHALLENGES' || e === 'PARTIALLY_ACTIVATES';

  if (!isConclusive(primary)) {
    conf -= 0.20;
  }

  // Cross-level agreement bonus
  if (primary === modifier && modifier === trigger && isConclusive(primary)) {
    conf += 0.15;
  } else if (primary === modifier && isConclusive(primary)) {
    conf += 0.10;
  }

  const isSupportive = (e: TimingActivationEffect) =>
    e === 'ACTIVATES' || e === 'PARTIALLY_ACTIVATES';
  const isChallenging = (e: TimingActivationEffect) => e === 'CHALLENGES';

  // Conflict penalties
  if (
    (isSupportive(primary) && isChallenging(modifier)) ||
    (isChallenging(primary) && isSupportive(modifier))
  ) {
    conf -= 0.15;
  }

  if (
    (isSupportive(primary) && isChallenging(trigger)) ||
    (isChallenging(primary) && isSupportive(trigger))
  ) {
    conf -= 0.05;
  }

  // Missing data penalties
  if (modifier === 'INSUFFICIENT_DATA' || modifier === 'UNKNOWN') {
    conf -= 0.10;
  }
  if (trigger === 'INSUFFICIENT_DATA' || trigger === 'UNKNOWN') {
    conf -= 0.05;
  }

  const confidence = Math.max(0.2, Math.min(0.95, Number(conf.toFixed(2))));

  return { overallEffect, confidence };
}

/**
 * Builds tag-enriched DashaHierarchyEvidenceRef list and unique evidence IDs.
 */
export function buildHierarchyEvidence(
  mdIds: readonly string[] = [],
  adIds: readonly string[] = [],
  pdIds: readonly string[] = []
): {
  evidence: readonly DashaHierarchyEvidenceRef[];
  evidenceIds: readonly string[];
} {
  const refs: DashaHierarchyEvidenceRef[] = [];
  const idSet = new Set<string>();
  const uniqueIds: string[] = [];

  const addIds = (
    ids: readonly string[],
    level: DashaHierarchyLevel,
    role: DashaHierarchyRole
  ) => {
    for (const id of ids) {
      if (id && typeof id === 'string') {
        refs.push(Object.freeze({ evidenceId: id, level, role }));
        if (!idSet.has(id)) {
          idSet.add(id);
          uniqueIds.push(id);
        }
      }
    }
  };

  addIds(mdIds, 'MAHADASHA', 'PRIMARY');
  addIds(adIds, 'ANTARDASHA', 'MODIFIER');
  addIds(pdIds, 'PRATYANTARDASHA', 'TRIGGER');

  return {
    evidence: Object.freeze(refs),
    evidenceIds: Object.freeze(uniqueIds)
  };
}
