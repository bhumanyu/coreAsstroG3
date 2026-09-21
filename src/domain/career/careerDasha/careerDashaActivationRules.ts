import type {
  CareerPlanetRelevance
} from '../careerPlanetaryRelevance';

import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type {
  CareerExpression
} from '../careerExpression';

import type {
  CareerStructuralDirection
} from '../careerStructuralReasoning';

import type {
  CareerDashaPlanetContext,
  CareerDashaActivationDirection,
  CareerDashaActivationEffect,
  CareerDashaActivationStrength
} from './careerDashaActivationTypes';

export function resolveCareerDashaPlanetDirection(
  planetContext: CareerDashaPlanetContext
): CareerDashaActivationDirection {
  const { relevance, condition, expressions } = planetContext;

  if (condition === 'UNAVAILABLE') {
    return 'UNAVAILABLE';
  }

  const hasStrongCondition = condition === 'STRONG' || condition === 'MODERATE';
  const hasWeakCondition = condition === 'WEAK' || condition === 'AFFLICTED';

  const hasSupportedExpressions = expressions.some(
    e => e.direction === 'SUPPORTED'
  );
  const hasConditionalExpressions = expressions.some(
    e => e.direction === 'CONDITIONAL'
  );

  if (relevance === 'PRIMARY' || relevance === 'SUPPORTING') {
    if (hasStrongCondition && hasSupportedExpressions) {
      return 'SUPPORT';
    }

    if (hasWeakCondition && !hasSupportedExpressions) {
      return 'CHALLENGE';
    }

    if (hasStrongCondition && hasConditionalExpressions) {
      return 'SUPPORT';
    }

    if (hasWeakCondition && hasSupportedExpressions) {
      return 'MIXED';
    }

    if (hasConditionalExpressions && !hasWeakCondition) {
      return 'NEUTRAL';
    }

    return 'NEUTRAL';
  }

  return 'UNAVAILABLE';
}

export function isCareerDashaRelevant(
  relevance: CareerPlanetRelevance
): boolean {
  return relevance === 'PRIMARY' || relevance === 'SUPPORTING';
}

export function isCareerDashaConditionUsable(
  condition: CareerPlanetaryCondition
): boolean {
  return condition !== 'UNAVAILABLE';
}

export function isCareerDashaConditionSupportive(
  condition: CareerPlanetaryCondition
): boolean {
  return condition === 'STRONG' || condition === 'MODERATE';
}

export function hasEstablishedCareerPromise(
  structuralDirection: CareerStructuralDirection,
  structuralPrimarySupport: number
): boolean {
  if (structuralDirection === 'UNAVAILABLE') {
    return false;
  }

  if (structuralDirection === 'CHALLENGE') {
    return false;
  }

  if (structuralDirection === 'SUPPORT' || structuralDirection === 'MIXED') {
    return structuralPrimarySupport > 0;
  }

  return false;
}

export function doesPlanetActivateCareerPromise(
  planetContext: CareerDashaPlanetContext,
  structuralDirection: CareerStructuralDirection
): boolean {
  if (!isCareerDashaRelevant(planetContext.relevance)) {
    return false;
  }

  if (!isCareerDashaConditionUsable(planetContext.condition)) {
    return false;
  }

  const direction = resolveCareerDashaPlanetDirection(planetContext);

  if (direction === 'SUPPORT') {
    return true;
  }

  if (direction === 'MIXED' && structuralDirection === 'SUPPORT') {
    return true;
  }

  return false;
}

export function doesPlanetChallengeCareerPromise(
  planetContext: CareerDashaPlanetContext
): boolean {
  if (!isCareerDashaRelevant(planetContext.relevance)) {
    return false;
  }

  if (!isCareerDashaConditionUsable(planetContext.condition)) {
    return false;
  }

  const direction = resolveCareerDashaPlanetDirection(planetContext);

  return direction === 'CHALLENGE';
}

export function resolveCareerDashaEffect(
  hasCareerPromise: boolean,
  planetActivates: boolean,
  planetChallenges: boolean,
  expressions: readonly CareerExpression[],
  isRelevant: boolean
): CareerDashaActivationEffect {
  if (!hasCareerPromise) {
    return 'INSUFFICIENT_DATA';
  }

  if (!isRelevant) {
    return 'DOES_NOT_ACTIVATE';
  }

  if (planetChallenges) {
    return 'CHALLENGES';
  }

  // C6→C7→C8→C9 separation of concerns: C9 determines whether an active Dasha planet
  // ACTIVATES an already-established Career promise. A PRIMARY-relevant planet with STRONG
  // condition and established structural Career promise should be able to activate even without
  // a C8 expression object. Expression presence refines but does not gate activation.
  if (expressions.length > 0) {
    const hasSupported = expressions.some(e => e.direction === 'SUPPORTED');
    const hasConditional = expressions.some(e => e.direction === 'CONDITIONAL');

    if (hasConditional && !hasSupported) {
      return 'PARTIALLY_ACTIVATES';
    }

    if (hasSupported) {
      return 'ACTIVATES';
    }
  }

  if (planetActivates) {
    return 'ACTIVATES';
  }

  return 'DOES_NOT_ACTIVATE';
}

export function resolveCareerDashaStrength(
  condition: CareerPlanetaryCondition,
  direction: CareerDashaActivationDirection
): CareerDashaActivationStrength {
  if (condition === 'UNAVAILABLE') {
    return 'UNDETERMINED';
  }

  if (direction === 'UNAVAILABLE') {
    return 'UNDETERMINED';
  }

  if (direction === 'SUPPORT') {
    if (condition === 'STRONG') {
      return 'VERY_STRONG';
    }

    if (condition === 'MODERATE') {
      return 'STRONG';
    }

    if (condition === 'NEUTRAL') {
      return 'MODERATE';
    }

    if (condition === 'WEAK') {
      return 'WEAK';
    }

    if (condition === 'AFFLICTED') {
      return 'VERY_WEAK';
    }
  }

  if (direction === 'CHALLENGE') {
    if (condition === 'STRONG') {
      return 'WEAK';
    }

    if (condition === 'MODERATE') {
      return 'WEAK';
    }

    if (condition === 'NEUTRAL') {
      return 'VERY_WEAK';
    }

    if (condition === 'WEAK') {
      return 'VERY_WEAK';
    }

    if (condition === 'AFFLICTED') {
      return 'VERY_WEAK';
    }
  }

  if (direction === 'MIXED') {
    if (condition === 'STRONG' || condition === 'MODERATE') {
      return 'MODERATE';
    }

    return 'WEAK';
  }

  if (direction === 'NEUTRAL') {
    if (condition === 'STRONG' || condition === 'MODERATE') {
      return 'MODERATE';
    }

    return 'WEAK';
  }

  return 'UNDETERMINED';
}
