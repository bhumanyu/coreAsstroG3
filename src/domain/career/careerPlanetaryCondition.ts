import { Planet } from '../../types';

import type {
  CareerPlanetRelevance
} from './careerPlanetaryRelevance';

export type CareerPlanetaryCondition =
  | 'STRONG'
  | 'MODERATE'
  | 'NEUTRAL'
  | 'WEAK'
  | 'AFFLICTED'
  | 'UNAVAILABLE';

export type CareerPlanetaryDignity =
  | 'EXALTED'
  | 'OWN_SIGN'
  | 'FRIENDLY_SIGN'
  | 'NEUTRAL_SIGN'
  | 'ENEMY_SIGN'
  | 'DEBILITATED'
  | 'UNAVAILABLE';

export type CareerPlanetaryAffliction =
  | 'NONE'
  | 'MILD'
  | 'MODERATE'
  | 'SEVERE'
  | 'UNAVAILABLE';

export type CareerPlanetaryMotion =
  | 'DIRECT'
  | 'RETROGRADE'
  | 'STATIONARY'
  | 'UNKNOWN';

export type CareerPlanetaryCombustion =
  | 'NOT_COMBUST'
  | 'COMBUST'
  | 'UNAVAILABLE';

export type CareerPlanetaryConditionFactorType =
  | 'DIGNITY'
  | 'AFFLICTION'
  | 'MOTION'
  | 'COMBUSTION'
  | 'BENEFIC_SUPPORT'
  | 'MALEFIC_PRESSURE';

export interface CareerPlanetaryConditionFactor {
  readonly type: CareerPlanetaryConditionFactorType;
  readonly effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly statement: string;
}

export interface CareerPlanetaryConditionFactors {
  readonly positive: readonly CareerPlanetaryConditionFactor[];
  readonly negative: readonly CareerPlanetaryConditionFactor[];
  readonly neutral: readonly CareerPlanetaryConditionFactor[];
}

export interface CareerPlanetaryConditionContext {
  readonly planet: Planet;

  readonly relevance: CareerPlanetRelevance;

  readonly dignity: CareerPlanetaryDignity;

  readonly affliction: CareerPlanetaryAffliction;

  readonly motion: CareerPlanetaryMotion;

  readonly combustion: CareerPlanetaryCombustion;

  readonly beneficSupport: boolean;

  readonly maleficPressure: boolean;

  readonly dataAvailable: boolean;
}

export interface CareerPlanetaryConditionResult {
  readonly planet: Planet;

  readonly relevance: CareerPlanetRelevance;

  readonly condition: CareerPlanetaryCondition;

  readonly dignity: CareerPlanetaryDignity;

  readonly affliction: CareerPlanetaryAffliction;

  readonly motion: CareerPlanetaryMotion;

  readonly combustion: CareerPlanetaryCombustion;

  readonly positiveFactors: readonly CareerPlanetaryConditionFactor[];

  readonly negativeFactors: readonly CareerPlanetaryConditionFactor[];

  readonly relatedPlanets: readonly Planet[];

  readonly conditional: boolean;

  readonly statement: string;
}

function isCareerRelevant(
  relevance: CareerPlanetRelevance
): boolean {
  return relevance !== 'NEUTRAL';
}

function resolveDignityEffect(
  dignity: CareerPlanetaryDignity
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' {
  switch (dignity) {
    case 'EXALTED':
    case 'OWN_SIGN':
    case 'FRIENDLY_SIGN':
      return 'SUPPORT';

    case 'ENEMY_SIGN':
    case 'DEBILITATED':
      return 'CHALLENGE';

    case 'NEUTRAL_SIGN':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
  }
}

function resolveAfflictionEffect(
  affliction: CareerPlanetaryAffliction
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' {
  switch (affliction) {
    case 'NONE':
    case 'UNAVAILABLE':
      return 'NEUTRAL';

    case 'MILD':
    case 'MODERATE':
    case 'SEVERE':
      return 'CHALLENGE';
  }
}

function resolveMotionEffect(
  motion: CareerPlanetaryMotion
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' {
  switch (motion) {
    case 'DIRECT':
    case 'RETROGRADE':
    case 'STATIONARY':
    case 'UNKNOWN':
      return 'NEUTRAL';
  }
}

function resolveCombustionEffect(
  combustion: CareerPlanetaryCombustion
): 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' {
  switch (combustion) {
    case 'COMBUST':
      return 'CHALLENGE';

    case 'NOT_COMBUST':
    case 'UNAVAILABLE':
      return 'NEUTRAL';
  }
}

function createConditionFactors(
  context: CareerPlanetaryConditionContext
): CareerPlanetaryConditionFactors {
  const positive: CareerPlanetaryConditionFactor[] = [];
  const negative: CareerPlanetaryConditionFactor[] = [];
  const neutral: CareerPlanetaryConditionFactor[] = [];

  switch (context.dignity) {
    case 'EXALTED':
      positive.push({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is exalted.'
      });
      break;

    case 'OWN_SIGN':
      positive.push({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is in its own sign.'
      });
      break;

    case 'FRIENDLY_SIGN':
      positive.push({
        type: 'DIGNITY',
        effect: 'SUPPORT',
        statement: 'Planet is in a friendly sign.'
      });
      break;

    case 'ENEMY_SIGN':
      negative.push({
        type: 'DIGNITY',
        effect: 'CHALLENGE',
        statement: 'Planet is in an enemy sign.'
      });
      break;

    case 'DEBILITATED':
      negative.push({
        type: 'DIGNITY',
        effect: 'CHALLENGE',
        statement: 'Planet is debilitated.'
      });
      break;

    default:
      break;
  }

  if (
    context.affliction === 'MILD' ||
    context.affliction === 'MODERATE' ||
    context.affliction === 'SEVERE'
  ) {
    negative.push({
      type: 'AFFLICTION',
      effect: 'CHALLENGE',
      statement:
        `Planet has ${context.affliction.toLowerCase()} affliction.`
    });
  }

  if (context.combustion === 'COMBUST') {
    negative.push({
      type: 'COMBUSTION',
      effect: 'CHALLENGE',
      statement: 'Planet is combust.'
    });
  }

  if (context.beneficSupport) {
    positive.push({
      type: 'BENEFIC_SUPPORT',
      effect: 'SUPPORT',
      statement:
        'Planet receives deterministic benefic support.'
    });
  }

  if (context.maleficPressure) {
    negative.push({
      type: 'MALEFIC_PRESSURE',
      effect: 'CHALLENGE',
      statement:
        'Planet receives deterministic malefic pressure.'
    });
  }

  if (context.motion === 'RETROGRADE') {
    neutral.push({
      type: 'MOTION',
      effect: 'NEUTRAL',
      statement: 'Planet is retrograde.'
    });
  }

  return {
    positive: Object.freeze(positive),
    negative: Object.freeze(negative),
    neutral: Object.freeze(neutral)
  };
}

function hasRequiredConditionData(
  context: CareerPlanetaryConditionContext
): boolean {
  return (
    context.dataAvailable &&
    context.dignity !== 'UNAVAILABLE' &&
    context.affliction !== 'UNAVAILABLE' &&
    context.combustion !== 'UNAVAILABLE' &&
    context.motion !== 'UNKNOWN'
  );
}

function resolveCondition(
  context: CareerPlanetaryConditionContext
): CareerPlanetaryCondition {
  if (!hasRequiredConditionData(context)) {
    return 'UNAVAILABLE';
  }

  if (context.affliction === 'SEVERE') {
    return 'AFFLICTED';
  }

  if (context.dignity === 'DEBILITATED') {
    return 'WEAK';
  }

  const dignityEffect =
    resolveDignityEffect(context.dignity);

  const afflictionEffect =
    resolveAfflictionEffect(context.affliction);

  const combustionEffect =
    resolveCombustionEffect(context.combustion);

  const positive =
    dignityEffect === 'SUPPORT' ||
    context.beneficSupport;

  const negative =
    dignityEffect === 'CHALLENGE' ||
    afflictionEffect === 'CHALLENGE' ||
    combustionEffect === 'CHALLENGE' ||
    context.maleficPressure;

  if (
    context.dignity === 'EXALTED' &&
    !negative
  ) {
    return 'STRONG';
  }

  if (
    context.dignity === 'OWN_SIGN' &&
    !negative
  ) {
    return 'STRONG';
  }

  if (positive && negative) {
    return 'MODERATE';
  }

  if (positive) {
    return 'MODERATE';
  }

  if (negative) {
    return 'WEAK';
  }

  return 'NEUTRAL';
}

function createConditionStatement(
  context: CareerPlanetaryConditionContext,
  condition: CareerPlanetaryCondition,
  factors: CareerPlanetaryConditionFactors
): string {
  const parts = [
    `Planet ${context.planet} has Career condition ${condition}.`,
    `Career relevance is ${context.relevance}.`
  ];

  if (factors.positive.length > 0) {
    parts.push(
      `Supporting condition factors: ${factors.positive
        .map(factor => factor.statement)
        .join(' ')
      }`
    );
  }

  if (factors.negative.length > 0) {
    parts.push(
      `Challenging condition factors: ${factors.negative
        .map(factor => factor.statement)
        .join(' ')
      }`
    );
  }

  if (factors.neutral.length > 0) {
    parts.push(
      `Neutral condition factors: ${factors.neutral
        .map(factor => factor.statement)
        .join(' ')
      }`
    );
  }

  return parts.join(' ');
}

export function interpretCareerPlanetaryCondition(
  context: CareerPlanetaryConditionContext
): CareerPlanetaryConditionResult {
  const relevant = isCareerRelevant(context.relevance);

  if (!relevant) {
    return Object.freeze({
      planet: context.planet,
      relevance: context.relevance,
      condition: 'UNAVAILABLE',
      dignity: context.dignity,
      affliction: context.affliction,
      motion: context.motion,
      combustion: context.combustion,
      positiveFactors: Object.freeze([]),
      negativeFactors: Object.freeze([]),
      relatedPlanets: Object.freeze([]),
      conditional: false,
      statement:
        `Planet ${context.planet} has no established Career relevance; ` +
        `Career condition is unavailable.`
    });
  }

  const factors = createConditionFactors(context);

  const condition = resolveCondition(context);

  const statement = createConditionStatement(
    context,
    condition,
    factors
  );

  return Object.freeze({
    planet: context.planet,
    relevance: context.relevance,
    condition,
    dignity: context.dignity,
    affliction: context.affliction,
    motion: context.motion,
    combustion: context.combustion,
    positiveFactors: factors.positive,
    negativeFactors: factors.negative,
    relatedPlanets: Object.freeze([]),
    conditional: condition === 'UNAVAILABLE',
    statement
  });
}

export function interpretCareerPlanetaryConditionBatch(
  contexts: readonly CareerPlanetaryConditionContext[]
): readonly CareerPlanetaryConditionResult[] {
  return Object.freeze(
    contexts.map(interpretCareerPlanetaryCondition)
  );
}
