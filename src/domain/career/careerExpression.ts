import type {
  CareerManifestationMode
} from './careerTypes';

import type {
  CareerPlanetRelevance,
  CareerPlanetRole,
  CareerPlanetEffect
} from './careerPlanetaryRelevance';

import type {
  CareerPlanetaryCondition
} from './careerPlanetaryCondition';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from './careerStructuralReasoning';

import {
  Planet
} from '../../types';

// New C8 Types

export type CareerExpressionStrength =
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'UNAVAILABLE';

export type CareerExpressionDirection =
  | 'SUPPORTED'
  | 'CONDITIONAL'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type CareerExpressionEvidenceRole =
  | 'STRUCTURAL'
  | 'PLANETARY'
  | 'CONDITION'
  | 'RELATIONSHIP';

export interface CareerExpressionEvidence {
  readonly id: string;
  readonly mode: CareerManifestationMode;
  readonly role: CareerExpressionEvidenceRole;
  readonly statement: string;
  readonly weight: number;
  readonly planets: readonly Planet[];
  readonly houses: readonly number[];
}

export interface CareerExpression {
  readonly mode: CareerManifestationMode;
  readonly direction: CareerExpressionDirection;
  readonly strength: CareerExpressionStrength;
  readonly evidence: readonly CareerExpressionEvidence[];
  readonly supportingEvidenceIds: readonly string[];
  readonly statement: string;
  readonly conditional: boolean;
}

export interface CareerExpressionAnalysis {
  readonly expressions: readonly CareerExpression[];
  readonly primaryExpression?: CareerExpression;
  readonly statement: string;
}

export interface CareerExpressionPlanetContext {
  readonly planet: Planet;
  readonly relevance: CareerPlanetRelevance;
  readonly roles: readonly CareerPlanetRole[];
  readonly effect: CareerPlanetEffect;
  readonly condition: CareerPlanetaryCondition;
  readonly relatedHouses: readonly number[];
  readonly relatedPlanets: readonly Planet[];
}

export interface CareerExpressionContext {
  readonly structuralDirection: CareerStructuralDirection;
  readonly structuralStrength: CareerStructuralStrength;
  readonly structuralPrimarySupport: number;
  readonly structuralPrimaryChallenge: number;
  readonly relevantPlanets: readonly CareerExpressionPlanetContext[];
}

// Rule Infrastructure

export const CAREER_EXPRESSION_RULE_IDS = Object.freeze({
  TECHNICAL_SPECIALIZATION: 'CAREER.EXPRESSION.TECHNICAL_SPECIALIZATION',
  SERVICE_EMPLOYMENT: 'CAREER.EXPRESSION.SERVICE_EMPLOYMENT',
  MANAGEMENT: 'CAREER.EXPRESSION.MANAGEMENT',
  LEADERSHIP: 'CAREER.EXPRESSION.LEADERSHIP',
  AUTHORITY: 'CAREER.EXPRESSION.AUTHORITY',
  INDEPENDENT_WORK: 'CAREER.EXPRESSION.INDEPENDENT_WORK',
  BUSINESS_ENTREPRENEURSHIP: 'CAREER.EXPRESSION.BUSINESS_ENTREPRENEURSHIP'
} as const);

// Planet to potential mode mappings (Rahu/Ketu have no manifestation mapping)
const PLANET_MODE_POTENTIAL: Readonly<Record<Planet, readonly CareerManifestationMode[]>> = Object.freeze({
  [Planet.MERCURY]: Object.freeze(['TECHNICAL_SPECIALIZATION' as const]),
  [Planet.SATURN]: Object.freeze(['SERVICE_EMPLOYMENT' as const, 'MANAGEMENT' as const, 'AUTHORITY' as const]),
  [Planet.SUN]: Object.freeze(['LEADERSHIP' as const, 'AUTHORITY' as const]),
  [Planet.MARS]: Object.freeze(['TECHNICAL_SPECIALIZATION' as const]),
  [Planet.JUPITER]: Object.freeze(['MANAGEMENT' as const]),
  [Planet.VENUS]: Object.freeze([]),
  [Planet.MOON]: Object.freeze([]),
  [Planet.RAHU]: Object.freeze([]),
  [Planet.KETU]: Object.freeze([])
});

interface CareerExpressionRule {
  readonly id: string;
  readonly mode: CareerManifestationMode;
  evaluate(context: CareerExpressionContext): CareerExpressionEvidence | undefined;
}

// Helper functions

function hasCareerRelevance(relevance: CareerPlanetRelevance): boolean {
  return relevance !== 'NEUTRAL';
}

function isPlanetAvailableForExpression(
  planetContext: CareerExpressionPlanetContext
): boolean {
  return hasCareerRelevance(planetContext.relevance) &&
    planetContext.condition !== 'UNAVAILABLE';
}

function hasCareerStructuralContext(context: CareerExpressionContext): boolean {
  return context.structuralDirection === 'SUPPORT' ||
    context.structuralDirection === 'MIXED' ||
    context.structuralDirection === 'CHALLENGE';
}

function hasCareerStructuralSupport(context: CareerExpressionContext): boolean {
  return (
    context.structuralDirection === 'SUPPORT' ||
    context.structuralDirection === 'MIXED'
  ) && context.structuralPrimarySupport > 0;
}

function getPlanetContext(
  context: CareerExpressionContext,
  planet: Planet
): CareerExpressionPlanetContext | undefined {
  return context.relevantPlanets.find(p => p.planet === planet);
}

function hasHouseInSet(
  houses: readonly number[],
  houseSet: ReadonlySet<number>
): boolean {
  return Array.from(houses).some(h => houseSet.has(h));
}

// Rule implementations

function createTechnicalSpecializationEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + Mercury/Mars relevant + 6H or 10H
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  const mercury = getPlanetContext(context, Planet.MERCURY);
  const mars = getPlanetContext(context, Planet.MARS);

  const technicalPlanets: CareerExpressionPlanetContext[] = [];
  if (mercury && isPlanetAvailableForExpression(mercury)) {
    technicalPlanets.push(mercury);
  }
  if (mars && isPlanetAvailableForExpression(mars)) {
    technicalPlanets.push(mars);
  }

  if (technicalPlanets.length === 0) {
    return undefined;
  }

  // Need at least one technical planet in 6H or 10H
  const hasHouseContext = technicalPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([6, 10]))
  );

  if (!hasHouseContext) {
    return undefined;
  }

  // Additional structural signal: need supporting houses (2H, 11H) or relationship
  const hasSupportingHouse = technicalPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([2, 11]))
  );

  if (!hasSupportingHouse) {
    return undefined;
  }

  const involvedPlanets = Array.from(technicalPlanets).map(p => p.planet);
  const involvedHouses = Array.from(technicalPlanets).flatMap(p => p.relatedHouses);

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.TECHNICAL_SPECIALIZATION,
    mode: 'TECHNICAL_SPECIALIZATION',
    role: 'PLANETARY',
    statement: `Technical specialization indicated by ${involvedPlanets.join(', ')} in career-relevant houses.`,
    weight: 2,
    planets: Object.freeze(involvedPlanets),
    houses: Object.freeze(Array.from(new Set(involvedHouses)))
  });
}

function createServiceEmploymentEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + Saturn + 6H + 10H
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  const saturn = getPlanetContext(context, Planet.SATURN);
  if (!saturn || !isPlanetAvailableForExpression(saturn)) {
    return undefined;
  }

  const relatedHouses = saturn.relatedHouses;
  if (!hasHouseInSet(relatedHouses, new Set<number>([6]))) {
    return undefined;
  }

  if (!hasHouseInSet(relatedHouses, new Set<number>([10]))) {
    return undefined;
  }

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.SERVICE_EMPLOYMENT,
    mode: 'SERVICE_EMPLOYMENT',
    role: 'PLANETARY',
    statement: 'Service employment indicated by Saturn in 6H and 10H.',
    weight: 2,
    planets: Object.freeze([Planet.SATURN]),
    houses: relatedHouses
  });
}



function createManagementEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + Jupiter + 10H
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  const jupiter = getPlanetContext(context, Planet.JUPITER);
  if (!jupiter || !isPlanetAvailableForExpression(jupiter)) {
    return undefined;
  }

  if (!hasHouseInSet(jupiter.relatedHouses, new Set<number>([10]))) {
    return undefined;
  }

  // Additional structural signal: need supporting house (2H, 6H, 11H)
  const hasSupportingHouse = hasHouseInSet(jupiter.relatedHouses, new Set<number>([2, 6, 11]));

  if (!hasSupportingHouse) {
    return undefined;
  }

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.MANAGEMENT,
    mode: 'MANAGEMENT',
    role: 'PLANETARY',
    statement: 'Management indicated by Jupiter in 10H with supporting house connections.',
    weight: 2,
    planets: Object.freeze([Planet.JUPITER]),
    houses: jupiter.relatedHouses
  });
}

function createLeadershipEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + Sun + 10H + additional structural signal
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  const sun = getPlanetContext(context, Planet.SUN);
  if (!sun || !isPlanetAvailableForExpression(sun)) {
    return undefined;
  }

  if (!hasHouseInSet(sun.relatedHouses, new Set<number>([10]))) {
    return undefined;
  }

  // Additional structural signal: need supporting house (2H, 11H) or strong condition
  const hasSupportingHouse = hasHouseInSet(sun.relatedHouses, new Set<number>([2, 11]));
  const hasStrongCondition = sun.condition === 'STRONG' || sun.condition === 'MODERATE';

  if (!hasSupportingHouse && !hasStrongCondition) {
    return undefined;
  }

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.LEADERSHIP,
    mode: 'LEADERSHIP',
    role: 'PLANETARY',
    statement: 'Leadership indicated by Sun in 10H with supporting structural signals.',
    weight: 2,
    planets: Object.freeze([Planet.SUN]),
    houses: sun.relatedHouses
  });
}

function createAuthorityEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + Sun or Saturn + 10H
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  const sun = getPlanetContext(context, Planet.SUN);
  const saturn = getPlanetContext(context, Planet.SATURN);

  const authorityPlanets: CareerExpressionPlanetContext[] = [];
  if (sun && isPlanetAvailableForExpression(sun) && hasHouseInSet(sun.relatedHouses, new Set<number>([10]))) {
    authorityPlanets.push(sun);
  }
  if (saturn && isPlanetAvailableForExpression(saturn) && hasHouseInSet(saturn.relatedHouses, new Set<number>([10]))) {
    authorityPlanets.push(saturn);
  }

  if (authorityPlanets.length === 0) {
    return undefined;
  }

  // Additional structural signal: need supporting house or strong condition
  const hasSupportingHouse = authorityPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([2, 11]))
  );
  const hasStrongCondition = authorityPlanets.some(p =>
    p.condition === 'STRONG' || p.condition === 'MODERATE'
  );

  if (!hasSupportingHouse && !hasStrongCondition) {
    return undefined;
  }

  const involvedPlanets = Array.from(authorityPlanets).map(p => p.planet);
  const involvedHouses = Array.from(authorityPlanets).flatMap(p => p.relatedHouses);

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.AUTHORITY,
    mode: 'AUTHORITY',
    role: 'PLANETARY',
    statement: `Authority indicated by ${involvedPlanets.join(', ')} in 10H with supporting signals.`,
    weight: 2,
    planets: Object.freeze(involvedPlanets),
    houses: Object.freeze(Array.from(new Set(involvedHouses)))
  });
}





function createIndependentWorkEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + Mercury/Venus + 11H
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  const mercury = getPlanetContext(context, Planet.MERCURY);
  const venus = getPlanetContext(context, Planet.VENUS);

  const independentPlanets: CareerExpressionPlanetContext[] = [];
  if (mercury && isPlanetAvailableForExpression(mercury) && hasHouseInSet(mercury.relatedHouses, new Set<number>([11]))) {
    independentPlanets.push(mercury);
  }
  if (venus && isPlanetAvailableForExpression(venus) && hasHouseInSet(venus.relatedHouses, new Set<number>([11]))) {
    independentPlanets.push(venus);
  }

  if (independentPlanets.length === 0) {
    return undefined;
  }

  // Additional structural signal: need career house connection (6H, 10H)
  const hasCareerHouse = independentPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([6, 10]))
  );

  if (!hasCareerHouse) {
    return undefined;
  }

  const involvedPlanets = Array.from(independentPlanets).map(p => p.planet);
  const involvedHouses = Array.from(independentPlanets).flatMap(p => p.relatedHouses);

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.INDEPENDENT_WORK,
    mode: 'INDEPENDENT_WORK',
    role: 'PLANETARY',
    statement: `Independent work indicated by ${involvedPlanets.join(', ')} in 11H with career connections.`,
    weight: 2,
    planets: Object.freeze(involvedPlanets),
    houses: Object.freeze(Array.from(new Set(involvedHouses)))
  });
}



function createBusinessEntrepreneurshipEvidence(
  context: CareerExpressionContext
): CareerExpressionEvidence | undefined {
  // Prerequisites: structural support + multi-axis combination for entrepreneurship
  if (!hasCareerStructuralContext(context)) {
    return undefined;
  }

  // Multi-axis entrepreneurship indicators:
  // 1. Initiative houses: 3H/3L (effort, communication, initiative)
  // 2. Speculation/gain houses: 5H/5L (risk-taking, speculation)
  // 3. Partnership/business houses: 7H/7L (partnerships, business relationships)
  // 4. Career houses: 10H/10L (career, profession, karma)
  // 5. Gain houses: 11H/11L (gains, fulfillment, network)
  // 6. Key planets: Mars (action, drive), Mercury (business acumen), Sun (leadership)
  // 7. D10 qualification (career divisional chart)

  const mars = getPlanetContext(context, Planet.MARS);
  const mercury = getPlanetContext(context, Planet.MERCURY);
  const sun = getPlanetContext(context, Planet.SUN);
  const jupiter = getPlanetContext(context, Planet.JUPITER);

  const entrepreneurshipIndicators: string[] = [];
  const involvedPlanets: Planet[] = [];
  const involvedHouses: number[] = [];

  // Check for initiative axis (3H/3L)
  const hasInitiativeAxis = context.relevantPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([3])) &&
    isPlanetAvailableForExpression(p)
  );
  if (hasInitiativeAxis) {
    entrepreneurshipIndicators.push('3H initiative axis');
    involvedHouses.push(3);
  }

  // Check for speculation axis (5H/5L)
  const hasSpeculationAxis = context.relevantPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([5])) &&
    isPlanetAvailableForExpression(p)
  );
  if (hasSpeculationAxis) {
    entrepreneurshipIndicators.push('5H speculation axis');
    involvedHouses.push(5);
  }

  // Check for partnership axis (7H/7L)
  const hasPartnershipAxis = context.relevantPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([7])) &&
    isPlanetAvailableForExpression(p)
  );
  if (hasPartnershipAxis) {
    entrepreneurshipIndicators.push('7H partnership axis');
    involvedHouses.push(7);
  }

  // Check for career axis (10H/10L)
  const hasCareerAxis = context.relevantPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([10])) &&
    isPlanetAvailableForExpression(p)
  );
  if (hasCareerAxis) {
    entrepreneurshipIndicators.push('10H career axis');
    involvedHouses.push(10);
  }

  // Check for gain axis (11H/11L)
  const hasGainAxis = context.relevantPlanets.some(p =>
    hasHouseInSet(p.relatedHouses, new Set<number>([11])) &&
    isPlanetAvailableForExpression(p)
  );
  if (hasGainAxis) {
    entrepreneurshipIndicators.push('11H gain axis');
    involvedHouses.push(11);
  }

  // Check for key planets
  if (mars && isPlanetAvailableForExpression(mars)) {
    entrepreneurshipIndicators.push('Mars (action/drive)');
    involvedPlanets.push(mars.planet);
    involvedHouses.push(...mars.relatedHouses);
  }

  if (mercury && isPlanetAvailableForExpression(mercury)) {
    entrepreneurshipIndicators.push('Mercury (business acumen)');
    involvedPlanets.push(mercury.planet);
    involvedHouses.push(...mercury.relatedHouses);
  }

  if (sun && isPlanetAvailableForExpression(sun)) {
    entrepreneurshipIndicators.push('Sun (leadership)');
    involvedPlanets.push(sun.planet);
    involvedHouses.push(...sun.relatedHouses);
  }

  if (jupiter && isPlanetAvailableForExpression(jupiter)) {
    entrepreneurshipIndicators.push('Jupiter (expansion)');
    involvedPlanets.push(jupiter.planet);
    involvedHouses.push(...jupiter.relatedHouses);
  }

  // Require at least 3 different axes for coherent entrepreneurship indication
  if (entrepreneurshipIndicators.length < 3) {
    return undefined;
  }

  // Check for strong conditions across involved planets
  const hasStrongConditions = involvedPlanets.some(planet => {
    const planetContext = getPlanetContext(context, planet);
    return planetContext && (planetContext.condition === 'STRONG' || planetContext.condition === 'MODERATE');
  });

  if (!hasStrongConditions) {
    return undefined;
  }

  return Object.freeze({
    id: CAREER_EXPRESSION_RULE_IDS.BUSINESS_ENTREPRENEURSHIP,
    mode: 'BUSINESS_ENTREPRENEURSHIP',
    role: 'PLANETARY',
    statement: `Business entrepreneurship indicated by multi-axis combination: ${entrepreneurshipIndicators.join(', ')}. Strong conditions present.`,
    weight: 3, // Higher weight for multi-axis evidence
    planets: Object.freeze(Array.from(new Set(involvedPlanets))),
    houses: Object.freeze(Array.from(new Set(involvedHouses)))
  });
}

// Rule registry
const CAREER_EXPRESSION_RULES: Readonly<CareerExpressionRule[]> = Object.freeze([
  {
    id: CAREER_EXPRESSION_RULE_IDS.TECHNICAL_SPECIALIZATION,
    mode: 'TECHNICAL_SPECIALIZATION',
    evaluate: createTechnicalSpecializationEvidence
  },
  {
    id: CAREER_EXPRESSION_RULE_IDS.SERVICE_EMPLOYMENT,
    mode: 'SERVICE_EMPLOYMENT',
    evaluate: createServiceEmploymentEvidence
  },
  {
    id: CAREER_EXPRESSION_RULE_IDS.MANAGEMENT,
    mode: 'MANAGEMENT',
    evaluate: createManagementEvidence
  },
  {
    id: CAREER_EXPRESSION_RULE_IDS.LEADERSHIP,
    mode: 'LEADERSHIP',
    evaluate: createLeadershipEvidence
  },
  {
    id: CAREER_EXPRESSION_RULE_IDS.AUTHORITY,
    mode: 'AUTHORITY',
    evaluate: createAuthorityEvidence
  },
  {
    id: CAREER_EXPRESSION_RULE_IDS.INDEPENDENT_WORK,
    mode: 'INDEPENDENT_WORK',
    evaluate: createIndependentWorkEvidence
  },
  {
    id: CAREER_EXPRESSION_RULE_IDS.BUSINESS_ENTREPRENEURSHIP,
    mode: 'BUSINESS_ENTREPRENEURSHIP',
    evaluate: createBusinessEntrepreneurshipEvidence
  }
]);

// Presentation order (not astrological superiority)
const CAREER_EXPRESSION_PRESENTATION_ORDER: Readonly<CareerManifestationMode[]> = Object.freeze([
  'LEADERSHIP',
  'MANAGEMENT',
  'TECHNICAL_SPECIALIZATION',
  'SERVICE_EMPLOYMENT',
  'AUTHORITY',
  'INDEPENDENT_WORK',
  'BUSINESS_ENTREPRENEURSHIP'
]);

// Direction resolver
function resolveDirection(
  evidence: readonly CareerExpressionEvidence[],
  context: CareerExpressionContext
): CareerExpressionDirection {
  if (evidence.length === 0) {
    return 'UNAVAILABLE';
  }

  // Use C4 structural context instead of checking evidence role
  // Structural prerequisite exists in context, not in the evidence object itself
  const hasUsableCareerStructure = (
    context.structuralDirection === 'SUPPORT' ||
    context.structuralDirection === 'MIXED'
  ) && context.structuralPrimarySupport > 0;

  if (!hasUsableCareerStructure) {
    return 'CONDITIONAL';
  }

  // Check if any evidence comes from planets with STRONG or MODERATE condition
  const hasStrongCondition = evidence.some(e => {
    return e.planets.some(planet => {
      const planetContext = getPlanetContext(context, planet);
      return planetContext && (planetContext.condition === 'STRONG' || planetContext.condition === 'MODERATE');
    });
  });

  const hasWeakCondition = evidence.some(e => {
    return e.planets.some(planet => {
      const planetContext = getPlanetContext(context, planet);
      return planetContext && (planetContext.condition === 'WEAK' || planetContext.condition === 'AFFLICTED');
    });
  });

  if (hasStrongCondition && !hasWeakCondition) {
    return 'SUPPORTED';
  }

  if (hasWeakCondition) {
    return 'CONDITIONAL';
  }

  return 'SUPPORTED';
}

// Strength resolver (qualitative only)
function resolveStrength(
  evidence: readonly CareerExpressionEvidence[],
  direction: CareerExpressionDirection,
  context: CareerExpressionContext
): CareerExpressionStrength {
  if (evidence.length === 0) {
    return 'UNAVAILABLE';
  }

  if (direction === 'UNAVAILABLE') {
    return 'UNAVAILABLE';
  }

  // Count strong condition sources
  const strongConditionCount = evidence.reduce((count, e) => {
    return count + e.planets.filter(planet => {
      const planetContext = getPlanetContext(context, planet);
      return planetContext && planetContext.condition === 'STRONG';
    }).length;
  }, 0);

  // Count moderate condition sources
  const moderateConditionCount = evidence.reduce((count, e) => {
    return count + e.planets.filter(planet => {
      const planetContext = getPlanetContext(context, planet);
      return planetContext && planetContext.condition === 'MODERATE';
    }).length;
  }, 0);

  // Check for major challenge
  const hasMajorChallenge = context.structuralPrimaryChallenge > context.structuralPrimarySupport;

  // Check for supporting condition
  const hasSupportingCondition = strongConditionCount > 0 || moderateConditionCount > 0;

  if (strongConditionCount >= 2 && !hasMajorChallenge && hasSupportingCondition) {
    return 'STRONG';
  }

  if (strongConditionCount === 1 && moderateConditionCount >= 1) {
    return 'MODERATE';
  }

  if (moderateConditionCount >= 2) {
    return 'MODERATE';
  }

  if (strongConditionCount === 1 && !hasMajorChallenge) {
    return 'MODERATE';
  }

  if (moderateConditionCount === 1 && !hasMajorChallenge) {
    return 'MODERATE';
  }

  // Single weak source
  const weakConditionCount = evidence.reduce((count, e) => {
    return count + e.planets.filter(planet => {
      const planetContext = getPlanetContext(context, planet);
      return planetContext && (planetContext.condition === 'WEAK' || planetContext.condition === 'AFFLICTED');
    }).length;
  }, 0);

  if (weakConditionCount === 1 && evidence.length === 1) {
    return 'WEAK';
  }

  return 'MODERATE';
}

// Deduplicate evidence by planet identity within a single mode
function deduplicateEvidenceByMode(
  evidence: readonly CareerExpressionEvidence[]
): readonly CareerExpressionEvidence[] {
  const seenPlanets = new Set<Planet>();
  const deduplicated: CareerExpressionEvidence[] = [];

  for (const e of evidence) {
    const newPlanets = Array.from(e.planets).filter(p => !seenPlanets.has(p));
    if (newPlanets.length > 0) {
      newPlanets.forEach(p => seenPlanets.add(p));
      deduplicated.push(e);
    }
  }

  return Object.freeze(deduplicated);
}

// Create expression from evidence
function createExpression(
  mode: CareerManifestationMode,
  evidence: readonly CareerExpressionEvidence[],
  context: CareerExpressionContext
): CareerExpression {
  const direction = resolveDirection(evidence, context);
  const strength = resolveStrength(evidence, direction, context);
  const supportingEvidenceIds = Object.freeze(evidence.map(e => e.id));

  const conditional = direction === 'CONDITIONAL' || direction === 'UNAVAILABLE';

  const statement = [
    `${mode} expression direction: ${direction}.`,
    `Expression strength: ${strength}.`,
    `Evidence count: ${evidence.length}.`
  ].join(' ');

  return Object.freeze({
    mode,
    direction,
    strength,
    evidence,
    supportingEvidenceIds,
    statement,
    conditional
  });
}

// Primary expression resolver (evidence-driven selection)
function resolvePrimaryExpression(
  expressions: readonly CareerExpression[]
): CareerExpression | undefined {
  if (expressions.length === 0) {
    return undefined;
  }

  // Filter for SUPPORTED expressions only
  const supportedExpressions = expressions.filter(e => e.direction === 'SUPPORTED');

  if (supportedExpressions.length === 0) {
    return undefined;
  }

  // Evidence-driven selection: prioritize by strength and evidence weight
  // Calculate total evidence weight for each expression
  const expressionsWithWeight = supportedExpressions.map(expr => {
    const totalWeight = expr.evidence.reduce((sum, e) => sum + e.weight, 0);
    return {
      expression: expr,
      totalWeight
    };
  });

  // Sort by total weight (descending), then by strength (STRONG > MODERATE > WEAK)
  const strengthOrder: Record<CareerExpressionStrength, number> = {
    'STRONG': 3,
    'MODERATE': 2,
    'WEAK': 1,
    'UNAVAILABLE': 0
  };

  expressionsWithWeight.sort((a, b) => {
    // First sort by total evidence weight
    if (b.totalWeight !== a.totalWeight) {
      return b.totalWeight - a.totalWeight;
    }
    // Then sort by strength
    return strengthOrder[b.expression.strength] - strengthOrder[a.expression.strength];
  });

  // Return the highest-weighted, strongest expression
  return expressionsWithWeight[0].expression;
}

// Sort expressions by presentation order
function sortExpressionsByPresentationOrder(
  expressions: readonly CareerExpression[]
): readonly CareerExpression[] {
  const orderMap = new Map<CareerManifestationMode, number>();
  CAREER_EXPRESSION_PRESENTATION_ORDER.forEach((mode, index) => {
    orderMap.set(mode, index);
  });

  return Object.freeze([...expressions].sort((a, b) => {
    const orderA = orderMap.get(a.mode) ?? 999;
    const orderB = orderMap.get(b.mode) ?? 999;
    return orderA - orderB;
  }));
}

// Main public API
export function resolveCareerExpression(
  context: CareerExpressionContext
): CareerExpressionAnalysis {
  // Structural guardrails
  if (context.structuralDirection === 'UNAVAILABLE') {
    return Object.freeze({
      expressions: Object.freeze([]),
      primaryExpression: undefined,
      statement: 'Career expression is unavailable because structural direction is UNAVAILABLE.'
    });
  }

  // Challenge-only structure may yield expressions but never SUPPORTED
  const isChallengeOnly = context.structuralPrimaryChallenge > 0 && context.structuralPrimarySupport === 0;

  // No structural evidence at all (neither support nor challenge)
  if (context.structuralPrimarySupport === 0 && context.structuralPrimaryChallenge === 0) {
    return Object.freeze({
      expressions: Object.freeze([]),
      primaryExpression: undefined,
      statement: 'Career expression is unavailable because no structural evidence is present.'
    });
  }

  // Evaluate all rules
  const allEvidence: CareerExpressionEvidence[] = [];
  for (const rule of CAREER_EXPRESSION_RULES) {
    const evidence = rule.evaluate(context);
    if (evidence) {
      // Filter out evidence from Rahu and Ketu (they have no manifestation mapping)
      const hasRahuKetu = evidence.planets.some(p => p === Planet.RAHU || p === Planet.KETU);
      if (!hasRahuKetu) {
        allEvidence.push(evidence);
      }
    }
  }

  // Group evidence by mode first
  const evidenceByMode = new Map<CareerManifestationMode, CareerExpressionEvidence[]>();
  for (const evidence of allEvidence) {
    const existing = evidenceByMode.get(evidence.mode) ?? [];
    evidenceByMode.set(evidence.mode, [...existing, evidence]);
  }

  // Deduplicate evidence within each mode (not globally)
  const deduplicatedEvidenceByMode = new Map<CareerManifestationMode, readonly CareerExpressionEvidence[]>();
  for (const [mode, modeEvidence] of Array.from(evidenceByMode.entries())) {
    deduplicatedEvidenceByMode.set(mode, deduplicateEvidenceByMode(modeEvidence));
  }

  // Create expressions for each mode
  const expressions: CareerExpression[] = [];
  for (const [mode, modeEvidence] of Array.from(deduplicatedEvidenceByMode.entries())) {
    const expression = createExpression(mode, modeEvidence, context);
    expressions.push(expression);
  }

  // Apply challenge-only constraint: downgrade SUPPORTED to CONDITIONAL
  const finalExpressions = expressions.map(expr => {
    if (isChallengeOnly && expr.direction === 'SUPPORTED') {
      return Object.freeze({
        ...expr,
        direction: 'CONDITIONAL' as const,
        conditional: true,
        statement: expr.statement.replace('SUPPORTED', 'CONDITIONAL (challenge-only structure)')
      });
    }
    return expr;
  });

  // Sort by presentation order
  const sortedExpressions = sortExpressionsByPresentationOrder(finalExpressions);

  // Resolve primary expression
  const primaryExpression = resolvePrimaryExpression(sortedExpressions);

  const statement = [
    `Career expression analysis complete.`,
    `Total expressions: ${sortedExpressions.length}.`,
    primaryExpression
      ? `Primary expression: ${primaryExpression.mode} (${primaryExpression.direction}).`
      : 'No primary expression identified.'
  ].join(' ');

  return Object.freeze({
    expressions: sortedExpressions,
    primaryExpression,
    statement
  });
}

export function resolveCareerExpressions(
  contexts: readonly CareerExpressionContext[]
): readonly CareerExpressionAnalysis[] {
  return Object.freeze(
    contexts.map(resolveCareerExpression)
  );
}
