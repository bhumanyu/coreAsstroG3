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
  CareerDashaTiming,
  CareerDashaEvidenceBasis,
  CareerDashaActivationDiagnosticCode
} from './careerDashaActivationTypes';
import type { CareerPlanetaryConditionAssessment } from '../careerPlanetaryCondition';

import {
  isCareerDashaRelevant,
  isCareerDashaConditionUsable,
  isCareerDashaConditionSupportive,
  hasEstablishedCareerPromise,
  doesPlanetActivateCareerPromise,
  doesPlanetChallengeCareerPromise,
  resolveCareerDashaEffect,
  resolveCareerDashaStrength,
  resolveCareerDashaPlanetDirection,
  createCanonicalEvidenceKey
} from './careerDashaActivationRules';

import {
  resolveDashaHierarchy,
  type DashaTimingEvidence
} from '../../reasoning/dashaHierarchy';

import type {
  TimingActivationEffect
} from '../../reasoning/reasoningTypes';

function toTimingActivationEffect(
  effect: CareerDashaActivationEffect
): TimingActivationEffect {
  // CareerDashaActivationEffect and TimingActivationEffect are semantically identical
  // This conversion is type-safe since both unions have the exact same values
  return effect as TimingActivationEffect;
}

function toCareerDashaActivationEffect(
  effect: TimingActivationEffect
): CareerDashaActivationEffect {
  // TimingActivationEffect and CareerDashaActivationEffect are semantically identical
  // This conversion is type-safe since both unions have the exact same values
  return effect as CareerDashaActivationEffect;
}

interface CareerDashaLevelDiagnosticCapture {
  level: CareerDashaActivationLevel;
  planet?: CareerDashaTiming['planet'];
  contextResolved: boolean;
  relevance?: CareerDashaPlanetContext['relevance'];
  condition?: CareerDashaPlanetContext['condition'];
  conditionAssessment?: CareerDashaPlanetContext['conditionAssessment'];
  afflictionAssessed?: boolean;
  expressionCount?: number;
  expressionEvidenceCount?: number;
  evidenceBasis?: CareerDashaEvidenceBasis;
  diagnostics?: readonly CareerDashaActivationDiagnosticCode[];
  hasCareerPromise?: boolean;
  planetActivates?: boolean;
  planetChallenges?: boolean;
  isRelevant?: boolean;
}

export function resolveCareerDashaActivation(
  context: CareerDashaActivationContext
): CareerDashaActivationHierarchy {
  const { mdTiming, adTiming, pdTiming } = context;
  const mdContext = mdTiming.planet ? findPlanetContext(context, mdTiming.planet) : undefined;
  const adContext = adTiming.planet ? findPlanetContext(context, adTiming.planet) : undefined;
  const pdContext = pdTiming.planet ? findPlanetContext(context, pdTiming.planet) : undefined;
  const mdDiagnostic: CareerDashaLevelDiagnosticCapture = {
    level: 'MD', planet: mdTiming.planet, contextResolved: mdContext !== undefined
  };
  const adDiagnostic: CareerDashaLevelDiagnosticCapture = {
    level: 'AD', planet: adTiming.planet, contextResolved: adContext !== undefined
  };
  const pdDiagnostic: CareerDashaLevelDiagnosticCapture = {
    level: 'PD', planet: pdTiming.planet, contextResolved: pdContext !== undefined
  };

  const md = resolveLevel(context, 'MD', 'PRIMARY_DRIVER', mdTiming, mdContext, mdDiagnostic);
  const ad = resolveLevel(context, 'AD', 'MODIFIER', adTiming, adContext, adDiagnostic);
  const pd = resolveLevel(context, 'PD', 'REFINEMENT', pdTiming, pdContext, pdDiagnostic);

  const diagnosticTrace = Object.freeze({
    structuralPrimarySupport: context.structuralPrimarySupport,
    expressionTrace: context.expressionTrace,
    planetContextResolution: Object.freeze([
      Object.freeze({ level: 'MD' as const, planet: mdTiming.planet, resolved: mdContext !== undefined }),
      Object.freeze({ level: 'AD' as const, planet: adTiming.planet, resolved: adContext !== undefined }),
      Object.freeze({ level: 'PD' as const, planet: pdTiming.planet, resolved: pdContext !== undefined })
    ]),
    levels: Object.freeze([
      Object.freeze({ ...mdDiagnostic, direction: md.direction, effect: md.effect }),
      Object.freeze({ ...adDiagnostic, direction: ad.direction, effect: ad.effect }),
      Object.freeze({ ...pdDiagnostic, direction: pd.direction, effect: pd.effect })
    ])
  });

  return resolveCareerDashaHierarchy(md, ad, pd, diagnosticTrace);
}

function resolveLevel(
  context: CareerDashaActivationContext,
  level: CareerDashaActivationLevel,
  role: CareerDashaActivationRole,
  timing: CareerDashaTiming,
  planetContext?: CareerDashaPlanetContext,
  diagnostic?: CareerDashaLevelDiagnosticCapture
): CareerDashaActivation {
  const { structuralDirection, structuralPrimarySupport } = context;

  const actualPlanetContext = planetContext ?? (timing.planet ? findPlanetContext(context, timing.planet) : undefined);

  if (!actualPlanetContext) {
    return Object.freeze({
      level,
      planet: timing.planet,
      role,
      effect: 'INSUFFICIENT_DATA',
      direction: 'UNAVAILABLE',
      strength: 'UNDETERMINED',
      conditionAssessment: 'UNAVAILABLE',
      afflictionAssessed: false,
      expressionEvidenceCount: 0,
      evidenceBasis: 'UNAVAILABLE',
      diagnostics: Object.freeze([]),
      evidence: Object.freeze([]),
      statement: timing.planet ? `Planet ${timing.planet} has insufficient context for ${level} activation.` : `No planet specified for ${level} activation.`,
      start: timing.start,
      end: timing.end,
      active: false,
      activatedPromiseEvidenceIds: Object.freeze([]),
      challengedPromiseEvidenceIds: Object.freeze([]),
      expressionEvidenceIds: Object.freeze([])
    });
  }

  const hasCareerPromise = hasEstablishedCareerPromise(structuralDirection, structuralPrimarySupport);
  const planetActivates = doesPlanetActivateCareerPromise(actualPlanetContext, structuralDirection);
  const planetChallenges = doesPlanetChallengeCareerPromise(actualPlanetContext);
  const isRelevant = isCareerDashaRelevant(actualPlanetContext.relevance);
  const conditionAssessment = actualPlanetContext.conditionAssessment
    ?? (actualPlanetContext.condition === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : actualPlanetContext.afflictionAssessed === true ? 'FULL' : 'PARTIAL');
  const afflictionAssessed = actualPlanetContext.afflictionAssessed ?? false;
  const expressionEvidenceCount = new Set(
    actualPlanetContext.expressions.flatMap(expression => expression.evidence.map(item => item.id))
  ).size;
  const evidenceBasis: CareerDashaEvidenceBasis = expressionEvidenceCount > 0
    ? 'CONDITION_RELEVANCE_AND_C8_EXPRESSION'
    : 'CONDITION_AND_RELEVANCE';
  const effect = resolveCareerDashaEffect(
    hasCareerPromise,
    planetActivates,
    planetChallenges,
    actualPlanetContext.expressions,
    isRelevant
  );

  const diagnostics: readonly CareerDashaActivationDiagnosticCode[] = Object.freeze([
    ...(conditionAssessment === 'PARTIAL' && (effect === 'ACTIVATES' || effect === 'CHALLENGES')
      ? ['C9_EFFECTS_BASED_ON_PARTIAL_CONDITION_ASSESSMENT' as const]
      : []),
    'C9_PROVENANCE_INCOMPLETE_UPSTREAM_IDS_UNAVAILABLE'
  ]);
  if (diagnostic) {
    diagnostic.relevance = actualPlanetContext.relevance;
    diagnostic.condition = actualPlanetContext.condition;
    diagnostic.conditionAssessment = conditionAssessment;
    diagnostic.afflictionAssessed = afflictionAssessed;
    diagnostic.expressionCount = actualPlanetContext.expressions.length;
    diagnostic.expressionEvidenceCount = expressionEvidenceCount;
    diagnostic.evidenceBasis = evidenceBasis;
    diagnostic.diagnostics = diagnostics;
    diagnostic.hasCareerPromise = hasCareerPromise;
    diagnostic.planetActivates = planetActivates;
    diagnostic.planetChallenges = planetChallenges;
    diagnostic.isRelevant = isRelevant;
  }

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
    strength,
    conditionAssessment,
    afflictionAssessed
  );

  const statement = buildActivationStatement(
    level,
    actualPlanetContext.planet,
    role,
    effect,
    direction,
    strength,
    evidence,
    !afflictionAssessed
  );

  // Determine active status and collect evidence IDs from consumed sources
  const active = effect !== 'INSUFFICIENT_DATA' && effect !== 'UNKNOWN';
  // Only populate activatedPromiseEvidenceIds when there's an established career promise
  const activatedPromiseEvidenceIds = (hasCareerPromise && planetActivates)
    ? extractActivatedPromiseEvidenceIds(evidence)
    : Object.freeze([]);
  const challengedPromiseEvidenceIds = planetChallenges
    ? extractChallengedPromiseEvidenceIds(evidence)
    : Object.freeze([]);
  const expressionEvidenceIds = extractExpressionEvidenceIds(evidence);

  return Object.freeze({
    level,
    planet: actualPlanetContext.planet,
    role,
    effect,
    direction,
    strength,
    conditionAssessment,
    afflictionAssessed,
    expressionEvidenceCount,
    evidenceBasis,
    diagnostics,
    evidence,
    statement,
    start: timing.start,
    end: timing.end,
    active,
    activatedPromiseEvidenceIds,
    challengedPromiseEvidenceIds,
    expressionEvidenceIds
  });
}

function findPlanetContext(
  context: CareerDashaActivationContext,
  planet: string
): CareerDashaPlanetContext | undefined {
  return context.planetContexts.find(pc => pc.planet === planet);
}

/**
 * Extracts activated promise evidence IDs from the evidence array.
 * Returns IDs from evidence with role 'PLANETARY_RELEVANCE' or 'PLANETARY_CONDITION'
 * that indicate promise activation.
 */
function extractActivatedPromiseEvidenceIds(
  evidence: readonly CareerDashaActivationEvidence[]
): readonly string[] {
  const ids = evidence
    .filter(e => e.role === 'PLANETARY_RELEVANCE' || e.role === 'PLANETARY_CONDITION')
    .map(e => e.id);
  return Object.freeze(Array.from(new Set(ids)).sort());
}

/**
 * Extracts challenged promise evidence IDs from the evidence array.
 * Returns IDs from evidence with role 'PLANETARY_CONDITION' that indicate challenge.
 */
function extractChallengedPromiseEvidenceIds(
  evidence: readonly CareerDashaActivationEvidence[]
): readonly string[] {
  const ids = evidence
    .filter(e => e.role === 'PLANETARY_CONDITION' && e.direction === 'CHALLENGE')
    .map(e => e.id);
  return Object.freeze(Array.from(new Set(ids)).sort());
}

/**
 * Extracts expression evidence IDs from the evidence array.
 * Returns IDs from evidence with role 'EXPRESSION'.
 */
function extractExpressionEvidenceIds(
  evidence: readonly CareerDashaActivationEvidence[]
): readonly string[] {
  const ids = evidence
    .filter(e => e.role === 'EXPRESSION')
    .map(e => e.id);
  return Object.freeze(Array.from(new Set(ids)).sort());
}

function buildActivationEvidence(
  context: CareerDashaActivationContext,
  planetContext: CareerDashaPlanetContext,
  level: CareerDashaActivationLevel,
  role: CareerDashaActivationRole,
  effect: CareerDashaActivationEffect,
  direction: CareerDashaActivationDirection,
  strength: CareerDashaActivationStrength,
  conditionAssessment: CareerPlanetaryConditionAssessment,
  afflictionAssessed: boolean
): readonly CareerDashaActivationEvidence[] {
  const evidence: CareerDashaActivationEvidence[] = [];
  const seenKeys = new Set<string>();

  // Extract real C8 expression evidence IDs (CareerExpressionEvidence.id)
  const expressionEvidenceIds = planetContext.expressions.flatMap(expr =>
    expr.evidence.map(e => e.id)
  );
  const sortedExpressionEvidenceIds = Object.freeze(Array.from(new Set(expressionEvidenceIds)).sort());

  // C6/C7 EVIDENCE GAP: relevanceEvidenceIds and conditionEvidenceIds are empty pending upstream evidence-ID exposure.
  // C6 (CareerPlanetaryRelevance) and C7 (CareerPlanetaryCondition) do not currently expose individual evidence IDs
  // in their data contracts. These fields are reserved for future W1 work that establishes a root evidence tree structure.
  // Do NOT fabricate evidence IDs via string matching or other heuristics — this would create false provenance.
  const relevanceEvidenceIds = Object.freeze([]);
  const conditionEvidenceIds = Object.freeze([]);

  // Related planet IDs from planet context (relatedPlanets as string representations)
  const relatedPlanetIds = Object.freeze(
    planetContext.relatedPlanets.map(p => p).sort()
  );

  // Activation rule IDs - use the canonical evidence keys as rule identifiers
  const activationRuleIds: string[] = [];

  const structuralKey = createCanonicalEvidenceKey(level, planetContext.planet, role, direction, 'STRUCTURAL');
  if (!seenKeys.has(structuralKey)) {
    // Preserve MIXED (and NEUTRAL/UNAVAILABLE) from context.structuralDirection
    // Use explicit mapping instead of ternary to preserve all direction values
    let structuralDirection: CareerDashaActivationDirection;
    switch (context.structuralDirection) {
      case 'SUPPORT':
        structuralDirection = 'SUPPORT';
        break;
      case 'CHALLENGE':
        structuralDirection = 'CHALLENGE';
        break;
      case 'MIXED':
        structuralDirection = 'MIXED';
        break;
      case 'NEUTRAL':
        structuralDirection = 'NEUTRAL';
        break;
      case 'UNAVAILABLE':
        structuralDirection = 'UNAVAILABLE';
        break;
      default:
        structuralDirection = 'NEUTRAL';
    }

    evidence.push(Object.freeze({
      id: structuralKey,
      role: 'STRUCTURAL',
      statement: `Structural direction: ${context.structuralDirection}, strength: ${context.structuralStrength}, primary support: ${context.structuralPrimarySupport}.`,
      direction: structuralDirection,
      level,
      relatedPlanetIds,
      relevanceEvidenceIds,
      conditionEvidenceIds,
      expressionEvidenceIds: Object.freeze([]),
      activationRuleIds: Object.freeze([...activationRuleIds, structuralKey]),
      sourceIds: Object.freeze([structuralKey])
    }));
    seenKeys.add(structuralKey);
    activationRuleIds.push(structuralKey);
  }

  const relevanceKey = createCanonicalEvidenceKey(level, planetContext.planet, role, direction, `RELEVANCE:${planetContext.relevance}`);
  if (!seenKeys.has(relevanceKey)) {
    evidence.push(Object.freeze({
      id: relevanceKey,
      role: 'PLANETARY_RELEVANCE',
      statement: `Planet ${planetContext.planet} has ${planetContext.relevance.toLowerCase()} career relevance with roles: ${planetContext.roles.join(', ')}.`,
      planet: planetContext.planet,
      level,
      relatedPlanetIds,
      relevanceEvidenceIds,
      conditionEvidenceIds,
      expressionEvidenceIds: Object.freeze([]),
      activationRuleIds: Object.freeze([...activationRuleIds, relevanceKey]),
      sourceIds: Object.freeze([relevanceKey])
    }));
    seenKeys.add(relevanceKey);
    activationRuleIds.push(relevanceKey);
  }

  const conditionKey = createCanonicalEvidenceKey(level, planetContext.planet, role, direction, `CONDITION:${planetContext.condition}`);
  if (!seenKeys.has(conditionKey)) {
    // Set direction to CHALLENGE when planet challenges career promise, otherwise SUPPORT for supportive conditions
    const conditionDirection = doesPlanetChallengeCareerPromise(planetContext)
      ? 'CHALLENGE'
      : isCareerDashaConditionSupportive(planetContext.condition)
        ? 'SUPPORT'
        : 'NEUTRAL';

    evidence.push(Object.freeze({
      id: conditionKey,
      role: 'PLANETARY_CONDITION',
      statement: `Planet ${planetContext.planet} has ${planetContext.condition.toLowerCase()} condition (${
        conditionAssessment === 'FULL' ? 'fully assessed' :
          conditionAssessment === 'PARTIAL' ? 'partially assessed' : 'not assessed'
      }${afflictionAssessed ? '' : '; affliction not evaluated'}).`,
      planet: planetContext.planet,
      direction: conditionDirection,
      level,
      relatedPlanetIds,
      relevanceEvidenceIds,
      conditionEvidenceIds,
      expressionEvidenceIds: Object.freeze([]),
      activationRuleIds: Object.freeze([...activationRuleIds, conditionKey]),
      sourceIds: Object.freeze([conditionKey])
    }));
    seenKeys.add(conditionKey);
    activationRuleIds.push(conditionKey);
  }

  for (const expression of planetContext.expressions) {
    const exprKey = createCanonicalEvidenceKey(level, planetContext.planet, role, direction, `EXPRESSION:${expression.mode}:${expression.direction}`);
    if (!seenKeys.has(exprKey)) {
      // Extract real C8 evidence IDs for this expression
      const exprEvidenceIds = Object.freeze(
        expression.evidence.map(e => e.id).sort()
      );

      evidence.push(Object.freeze({
        id: exprKey,
        role: 'EXPRESSION',
        statement: `${expression.mode} expression with ${expression.direction.toLowerCase()} direction and ${expression.strength.toLowerCase()} strength.`,
        planet: planetContext.planet,
        direction: expression.direction === 'SUPPORTED' ? 'SUPPORT' : expression.direction === 'CONDITIONAL' ? 'NEUTRAL' : 'UNAVAILABLE',
        level,
        relatedPlanetIds,
        relevanceEvidenceIds,
        conditionEvidenceIds,
        expressionEvidenceIds: exprEvidenceIds,
        activationRuleIds: Object.freeze([...activationRuleIds, exprKey]),
        sourceIds: Object.freeze([exprKey, ...exprEvidenceIds])
      }));
      seenKeys.add(exprKey);
      activationRuleIds.push(exprKey);
    }
  }

  const timingKey = createCanonicalEvidenceKey(level, planetContext.planet, role, direction, 'TIMING');
  if (!seenKeys.has(timingKey)) {
    evidence.push(Object.freeze({
      id: timingKey,
      role: 'TIMING',
      statement: `${level} period role: ${role}.`,
      level,
      relatedPlanetIds,
      relevanceEvidenceIds,
      conditionEvidenceIds,
      expressionEvidenceIds: Object.freeze([]),
      activationRuleIds: Object.freeze([...activationRuleIds, timingKey]),
      sourceIds: Object.freeze([timingKey])
    }));
    seenKeys.add(timingKey);
    activationRuleIds.push(timingKey);
  }

  // Add activation-summary evidence row with effect, direction, and strength
  const activationKey = createCanonicalEvidenceKey(level, planetContext.planet, role, direction, `ACTIVATION:${effect}`);
  if (!seenKeys.has(activationKey)) {
    evidence.push(Object.freeze({
      id: activationKey,
      role: 'ACTIVATION',
      statement: `Activation effect: ${effect}, direction: ${direction}, strength: ${strength}.`,
      direction,
      strength,
      level,
      relatedPlanetIds,
      relevanceEvidenceIds,
      conditionEvidenceIds,
      expressionEvidenceIds: sortedExpressionEvidenceIds,
      activationRuleIds: Object.freeze([...activationRuleIds, activationKey]),
      sourceIds: Object.freeze([activationKey, ...sortedExpressionEvidenceIds])
    }));
    seenKeys.add(activationKey);
    activationRuleIds.push(activationKey);
  }

  return Object.freeze(evidence);
}

function buildActivationStatement(
  level: CareerDashaActivationLevel,
  planet: string | undefined,
  role: CareerDashaActivationRole,
  effect: CareerDashaActivationEffect,
  direction: CareerDashaActivationDirection,
  strength: CareerDashaActivationStrength,
  evidence: readonly CareerDashaActivationEvidence[],
  afflictionUnassessed: boolean
): string {
  const parts = [
    `${level} period for planet ${planet ?? 'none'}.`,
    `Role: ${role}.`,
    `Effect: ${effect}.`,
    `Direction: ${direction}.`,
    `Strength: ${strength}.`,
    `Evidence count: ${evidence.length}.`
  ];

  if (afflictionUnassessed) {
    parts.push('Affliction was not assessed; no affliction-based challenge is inferred.');
  }

  return parts.join(' ');
}

function resolveCareerDashaHierarchy(
  md: CareerDashaActivation,
  ad: CareerDashaActivation,
  pd: CareerDashaActivation,
  diagnosticTrace: CareerDashaActivationHierarchy['diagnosticTrace']
): CareerDashaActivationHierarchy {
  // Build DashaTimingEvidence for each level
  const mdEvidence: DashaTimingEvidence = Object.freeze({
    level: 'MD',
    effect: toTimingActivationEffect(md.effect),
    evidenceIds: md.evidence.map(e => e.id),
    confidence: 1
  });

  const adEvidence: DashaTimingEvidence = Object.freeze({
    level: 'AD',
    effect: toTimingActivationEffect(ad.effect),
    evidenceIds: ad.evidence.map(e => e.id),
    confidence: 1
  });

  const pdEvidence: DashaTimingEvidence = Object.freeze({
    level: 'PD',
    effect: toTimingActivationEffect(pd.effect),
    evidenceIds: pd.evidence.map(e => e.id),
    confidence: 1
  });

  // Delegate to canonical hierarchy resolver
  const hierarchyResult = resolveDashaHierarchy(mdEvidence, adEvidence, pdEvidence);

  // Derive overallDirection and overallStrength from finalEffect + dominantLevel
  const overallDirection = deriveOverallDirection(hierarchyResult.finalEffect);
  const overallStrength = deriveOverallStrength(hierarchyResult.dominantLevel, md, ad, pd);

  const statement = buildHierarchyStatement(md, ad, pd, hierarchyResult.finalEffect, overallDirection, overallStrength, hierarchyResult.dominantLevel);
  const activations = [md, ad, pd];
  const conditionAssessment: CareerPlanetaryConditionAssessment = activations.some(item => item.conditionAssessment === 'PARTIAL')
    ? 'PARTIAL'
    : activations.some(item => item.conditionAssessment === 'FULL')
      ? 'FULL'
      : 'UNAVAILABLE';
  const diagnostics = Object.freeze(Array.from(new Set(activations.flatMap(item => item.diagnostics ?? []))));

  return Object.freeze({
    md,
    ad,
    pd,
    overallEffect: toCareerDashaActivationEffect(hierarchyResult.finalEffect),
    overallDirection,
    overallStrength,
    conditionAssessment,
    diagnostics,
    dominantLevel: hierarchyResult.dominantLevel,
    statement,
    diagnosticTrace
  });
}

function deriveOverallDirection(
  finalEffect: TimingActivationEffect
): CareerDashaActivationDirection {
  // Derive direction deterministically from finalEffect
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
  dominantLevel: 'MD' | 'AD' | 'PD' | 'NONE',
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
  finalEffect: TimingActivationEffect,
  overallDirection: CareerDashaActivationDirection,
  overallStrength: CareerDashaActivationStrength,
  dominantLevel: 'MD' | 'AD' | 'PD' | 'NONE'
): string {
  const parts = [
    `Career Dasha activation hierarchy.`,
    `MD: ${md.planet ?? 'none'} (${md.effect}, ${md.direction}, ${md.strength}).`,
    `AD: ${ad.planet ?? 'none'} (${ad.effect}, ${ad.direction}, ${ad.strength}).`,
    `PD: ${pd.planet ?? 'none'} (${pd.effect}, ${pd.direction}, ${pd.strength}).`,
    `Overall effect: ${finalEffect}.`,
    `Overall direction: ${overallDirection}.`,
    `Overall strength: ${overallStrength}.`,
    `Dominant level: ${dominantLevel}.`
  ];

  return parts.join(' ');
}
