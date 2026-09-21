import type {
  CareerDashaActivationContext,
  CareerDashaActivation,
  CareerDashaActivationHierarchy,
  CareerDashaActivationLevel,
  CareerDashaActivationRole,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength,
  CareerDashaActivationEffect,
  CareerDashaActivationEvidence,
  CareerDashaPlanetContext,
  CareerDashaTiming
} from './careerDashaActivationTypes';

import {
  isCareerDashaRelevant,
  isCareerDashaConditionUsable,
  isCareerDashaConditionSupportive,
  hasEstablishedCareerPromise,
  doesPlanetActivateCareerPromise,
  doesPlanetChallengeCareerPromise,
  resolveCareerDashaEffect,
  resolveCareerDashaStrength,
  resolveCareerDashaPlanetDirection
} from './careerDashaActivationRules';

import {
  resolveDashaHierarchy,
  type DashaTimingEvidence
} from '../../reasoning/dashaHierarchy';

export function resolveCareerDashaActivation(
  context: CareerDashaActivationContext
): CareerDashaActivationHierarchy {
  const { mdTiming, adTiming, pdTiming } = context;

  const md = resolveLevel(context, 'MD', 'PRIMARY_DRIVER', mdTiming);
  const ad = resolveLevel(context, 'AD', 'MODIFIER', adTiming);
  const pd = resolveLevel(context, 'PD', 'REFINEMENT', pdTiming);

  return resolveCareerDashaHierarchy(md, ad, pd);
}

function resolveLevel(
  context: CareerDashaActivationContext,
  level: CareerDashaActivationLevel,
  role: CareerDashaActivationRole,
  timing: CareerDashaTiming,
  planetContext?: CareerDashaPlanetContext
): CareerDashaActivation {
  const { structuralDirection, structuralPrimarySupport } = context;

  const actualPlanetContext = planetContext ?? findPlanetContext(context, timing.planet);

  if (!actualPlanetContext) {
    return Object.freeze({
      level,
      planet: timing.planet,
      role,
      effect: 'INSUFFICIENT_DATA',
      direction: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      evidence: Object.freeze([]),
      statement: `Planet ${timing.planet} has insufficient context for ${level} activation.`,
      start: timing.start,
      end: timing.end
    });
  }

  const hasCareerPromise = hasEstablishedCareerPromise(structuralDirection, structuralPrimarySupport);
  const planetActivates = doesPlanetActivateCareerPromise(actualPlanetContext, structuralDirection);
  const planetChallenges = doesPlanetChallengeCareerPromise(actualPlanetContext);
  const isRelevant = isCareerDashaRelevant(actualPlanetContext.relevance);

  const effect = resolveCareerDashaEffect(
    hasCareerPromise,
    planetActivates,
    planetChallenges,
    actualPlanetContext.expressions,
    isRelevant
  );

  const direction = resolveCareerDashaPlanetDirection(actualPlanetContext);

  const strength = resolveCareerDashaStrength(
    actualPlanetContext.condition,
    direction
  );

  const evidence = buildActivationEvidence(
    context,
    actualPlanetContext,
    level,
    role,
    effect,
    direction,
    strength
  );

  const statement = buildActivationStatement(
    level,
    actualPlanetContext.planet,
    role,
    effect,
    direction,
    strength,
    evidence
  );

  return Object.freeze({
    level,
    planet: actualPlanetContext.planet,
    role,
    effect,
    direction,
    strength,
    evidence,
    statement,
    start: timing.start,
    end: timing.end
  });
}

function findPlanetContext(
  context: CareerDashaActivationContext,
  planet: string
): CareerDashaPlanetContext | undefined {
  return context.planetContexts.find(pc => pc.planet === planet);
}

function buildActivationEvidence(
  context: CareerDashaActivationContext,
  planetContext: CareerDashaPlanetContext,
  level: CareerDashaActivationLevel,
  role: CareerDashaActivationRole,
  effect: CareerDashaActivationEffect,
  direction: CareerDashaActivationDirection,
  strength: CareerDashaActivationStrength
): readonly CareerDashaActivationEvidence[] {
  const evidence: CareerDashaActivationEvidence[] = [];
  const seenKeys = new Set<string>();

  const structuralKey = `${level}:${planetContext.planet}:STRUCTURAL:structural:STRUCTURAL`;
  if (!seenKeys.has(structuralKey)) {
    evidence.push(Object.freeze({
      id: structuralKey,
      role: 'STRUCTURAL',
      statement: `Structural direction: ${context.structuralDirection}, strength: ${context.structuralStrength}, primary support: ${context.structuralPrimarySupport}.`,
      direction: context.structuralDirection === 'SUPPORT' ? 'SUPPORT' : context.structuralDirection === 'CHALLENGE' ? 'CHALLENGE' : 'NEUTRAL'
    }));
    seenKeys.add(structuralKey);
  }

  const relevanceKey = `${level}:${planetContext.planet}:PLANETARY_RELEVANCE:relevance:${planetContext.relevance}`;
  if (!seenKeys.has(relevanceKey)) {
    evidence.push(Object.freeze({
      id: relevanceKey,
      role: 'PLANETARY_RELEVANCE',
      statement: `Planet ${planetContext.planet} has ${planetContext.relevance.toLowerCase()} career relevance with roles: ${planetContext.roles.join(', ')}.`,
      planet: planetContext.planet
    }));
    seenKeys.add(relevanceKey);
  }

  const conditionKey = `${level}:${planetContext.planet}:PLANETARY_CONDITION:condition:${planetContext.condition}`;
  if (!seenKeys.has(conditionKey)) {
    evidence.push(Object.freeze({
      id: conditionKey,
      role: 'PLANETARY_CONDITION',
      statement: `Planet ${planetContext.planet} has ${planetContext.condition.toLowerCase()} condition.`,
      planet: planetContext.planet,
      direction: isCareerDashaConditionSupportive(planetContext.condition) ? 'SUPPORT' : 'NEUTRAL'
    }));
    seenKeys.add(conditionKey);
  }

  for (const expression of planetContext.expressions) {
    const exprKey = `${level}:${planetContext.planet}:EXPRESSION:${expression.mode}:${expression.direction}`;
    if (!seenKeys.has(exprKey)) {
      evidence.push(Object.freeze({
        id: exprKey,
        role: 'EXPRESSION',
        statement: `${expression.mode} expression with ${expression.direction.toLowerCase()} direction and ${expression.strength.toLowerCase()} strength.`,
        planet: planetContext.planet,
        direction: expression.direction === 'SUPPORTED' ? 'SUPPORT' : expression.direction === 'CONDITIONAL' ? 'NEUTRAL' : 'UNAVAILABLE'
      }));
      seenKeys.add(exprKey);
    }
  }

  const timingKey = `${level}:${planetContext.planet}:TIMING:timing:${role}`;
  if (!seenKeys.has(timingKey)) {
    evidence.push(Object.freeze({
      id: timingKey,
      role: 'TIMING',
      statement: `${level} period role: ${role}.`
    }));
    seenKeys.add(timingKey);
  }

  // Add activation-summary evidence row with effect, direction, and strength
  const activationKey = `${level}:${planetContext.planet}:ACTIVATION_SUMMARY:activation:${effect}`;
  if (!seenKeys.has(activationKey)) {
    evidence.push(Object.freeze({
      id: activationKey,
      role: 'TIMING',
      statement: `Activation effect: ${effect}, direction: ${direction}, strength: ${strength}.`,
      direction,
      strength
    }));
    seenKeys.add(activationKey);
  }

  return Object.freeze(evidence);
}

function buildActivationStatement(
  level: CareerDashaActivationLevel,
  planet: string,
  role: CareerDashaActivationRole,
  effect: CareerDashaActivationEffect,
  direction: CareerDashaActivationDirection,
  strength: CareerDashaActivationStrength,
  evidence: readonly CareerDashaActivationEvidence[]
): string {
  const parts = [
    `${level} period for planet ${planet}.`,
    `Role: ${role}.`,
    `Effect: ${effect}.`,
    `Direction: ${direction}.`,
    `Strength: ${strength}.`,
    `Evidence count: ${evidence.length}.`
  ];

  return parts.join(' ');
}

function resolveCareerDashaHierarchy(
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation
): CareerDashaActivationHierarchy {
  // Build DashaTimingEvidence for each level
  const mdEvidence: DashaTimingEvidence = Object.freeze({
    level: 'MD',
    effect: md.effect as any, // CareerDashaActivationEffect maps to TimingActivationEffect
    evidenceIds: md.evidence.map(e => e.id),
    confidence: 1
  });

  const adEvidence: DashaTimingEvidence = Object.freeze({
    level: 'AD',
    effect: ad.effect as any,
    evidenceIds: ad.evidence.map(e => e.id),
    confidence: 1
  });

  const pdEvidence: DashaTimingEvidence = Object.freeze({
    level: 'PD',
    effect: pd.effect as any,
    evidenceIds: pd.evidence.map(e => e.id),
    confidence: 1
  });

  // Delegate to canonical hierarchy resolver
  const hierarchyResult = resolveDashaHierarchy(mdEvidence, adEvidence, pdEvidence);

  // Derive overallDirection and overallStrength from finalEffect + dominantLevel
  const overallDirection = deriveOverallDirection(hierarchyResult.finalEffect, hierarchyResult.dominantLevel, md, ad, pd);
  const overallStrength = deriveOverallStrength(hierarchyResult.finalEffect, hierarchyResult.dominantLevel, md, ad, pd);

  const statement = buildHierarchyStatement(md, ad, pd, hierarchyResult.finalEffect, overallDirection, overallStrength, hierarchyResult.dominantLevel);

  return Object.freeze({
    md,
    ad,
    pd,
    overallEffect: hierarchyResult.finalEffect as any,
    overallDirection,
    overallStrength,
    dominantLevel: hierarchyResult.dominantLevel,
    statement
  });
}

function resolveHierarchyDirection(
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation
): CareerDashaActivationDirection {
  if (md.effect === 'INSUFFICIENT_DATA' && ad.effect === 'INSUFFICIENT_DATA' && pd.effect === 'INSUFFICIENT_DATA') {
    return 'UNAVAILABLE';
  }

  const mdSupport = md.direction === 'SUPPORT';
  const adSupport = ad.direction === 'SUPPORT';
  const pdSupport = pd.direction === 'SUPPORT';

  const mdChallenge = md.direction === 'CHALLENGE';
  const adChallenge = ad.direction === 'CHALLENGE';
  const pdChallenge = pd.direction === 'CHALLENGE';

  if (mdSupport && adSupport && pdSupport) {
    return 'SUPPORT';
  }

  if (mdChallenge && adChallenge && pdChallenge) {
    return 'CHALLENGE';
  }

  if (mdSupport && adChallenge) {
    return 'MIXED';
  }

  if (mdChallenge && adSupport) {
    return 'MIXED';
  }

  if (mdSupport && !adChallenge) {
    return 'SUPPORT';
  }

  if (mdChallenge && !adSupport) {
    return 'CHALLENGE';
  }

  if (adSupport && !mdChallenge) {
    return 'SUPPORT';
  }

  if (adChallenge && !mdSupport) {
    return 'CHALLENGE';
  }

  return 'NEUTRAL';
}

function resolveHierarchyStrength(
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation
): CareerDashaActivationStrength {
  if (md.effect === 'INSUFFICIENT_DATA' && ad.effect === 'INSUFFICIENT_DATA' && pd.effect === 'INSUFFICIENT_DATA') {
    return 'UNDETERMINED';
  }

  const mdStrength = md.strength;
  const adStrength = ad.strength;
  const pdStrength = pd.strength;

  const direction = resolveHierarchyDirection(md, ad, pd);

  if (direction === 'SUPPORT') {
    if (mdStrength === 'VERY_STRONG' || mdStrength === 'STRONG') {
      return mdStrength;
    }

    if (adStrength === 'VERY_STRONG' || adStrength === 'STRONG') {
      return adStrength;
    }

    if (mdStrength === 'MODERATE' || adStrength === 'MODERATE') {
      return 'MODERATE';
    }

    return 'WEAK';
  }

  if (direction === 'CHALLENGE') {
    if (mdStrength === 'VERY_WEAK' || mdStrength === 'WEAK') {
      return mdStrength;
    }

    if (adStrength === 'VERY_WEAK' || adStrength === 'WEAK') {
      return adStrength;
    }

    if (mdStrength === 'MODERATE' || adStrength === 'MODERATE') {
      return 'WEAK';
    }

    return 'VERY_WEAK';
  }

  if (direction === 'MIXED') {
    if (mdStrength === 'VERY_STRONG' || mdStrength === 'STRONG' || mdStrength === 'MODERATE') {
      return 'MODERATE';
    }

    if (adStrength === 'VERY_STRONG' || adStrength === 'STRONG' || adStrength === 'MODERATE') {
      return 'MODERATE';
    }

    return 'WEAK';
  }

  return 'UNDETERMINED';
}

function deriveOverallDirection(
  finalEffect: string,
  dominantLevel: string,
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation
): CareerDashaActivationDirection {
  // Derive direction deterministically from finalEffect + dominantLevel
  // The effect hierarchy is the single source of truth
  if (finalEffect === 'ACTIVATES') {
    return 'SUPPORT';
  }
  if (finalEffect === 'CHALLENGES') {
    return 'CHALLENGE';
  }
  if (finalEffect === 'PARTIALLY_ACTIVATES') {
    return 'MIXED';
  }
  if (finalEffect === 'DOES_NOT_ACTIVATE' || finalEffect === 'UNKNOWN' || finalEffect === 'INSUFFICIENT_DATA') {
    return 'NEUTRAL';
  }
  return 'UNAVAILABLE';
}

function deriveOverallStrength(
  finalEffect: string,
  dominantLevel: string,
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation
): CareerDashaActivationStrength {
  // Take strength from the dominant level
  if (dominantLevel === 'MD') {
    return md.strength;
  }
  if (dominantLevel === 'AD') {
    return ad.strength;
  }
  if (dominantLevel === 'PD') {
    return pd.strength;
  }
  return 'UNDETERMINED';
}

function buildHierarchyStatement(
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation,
  finalEffect: string,
  overallDirection: CareerDashaActivationDirection,
  overallStrength: CareerDashaActivationStrength,
  dominantLevel: string
): string {
  const parts = [
    `Career Dasha activation hierarchy.`,
    `MD: ${md.planet} (${md.effect}, ${md.direction}, ${md.strength}).`,
    `AD: ${ad.planet} (${ad.effect}, ${ad.direction}, ${ad.strength}).`,
    `PD: ${pd.planet} (${pd.effect}, ${pd.direction}, ${pd.strength}).`,
    `Overall effect: ${finalEffect}.`,
    `Overall direction: ${overallDirection}.`,
    `Overall strength: ${overallStrength}.`,
    `Dominant level: ${dominantLevel}.`
  ];

  return parts.join(' ');
}
