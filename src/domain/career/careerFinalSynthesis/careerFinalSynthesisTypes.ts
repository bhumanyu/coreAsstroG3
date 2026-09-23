import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength,
  CareerDashaActivationHierarchy
} from '../careerDasha';

import type {
  CareerD10QualificationDirection,
  CareerD10QualificationStrength,
  CareerD10QualificationEffect
} from '../careerD10';

import type { CareerExpressionStrength } from '../careerExpression';

export type CareerFinalDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type CareerFinalStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type CareerFinalStatus =
  | 'SUPPORTED'
  | 'CONDITIONALLY_SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_DATA';

export type CareerFinalConfidence =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type CareerFinalTimingStatus =
  | 'ACTIVE'
  | 'PARTIALLY_ACTIVE'
  | 'CHALLENGED'
  | 'NOT_ACTIVE'
  | 'UNKNOWN';

export interface CareerFinalExpression {
  readonly mode: string;
  readonly direction: CareerFinalDirection;
  readonly strength: CareerFinalStrength;
  readonly qualified: boolean;
  readonly evidenceIds: readonly string[];
}

export interface CareerFinalConflict {
  readonly source:
    | 'NATAL'
    | 'EXPRESSION'
    | 'D10'
    | 'DASHA'
    | 'TRANSIT';

  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED';

  readonly severity:
    | 'LOW'
    | 'MODERATE'
    | 'HIGH';

  readonly evidenceIds: readonly string[];

  readonly statement: string;
}

export interface CareerFinalEvidenceTrace {
  readonly evidenceIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

export interface CareerFinalSynthesisInput {
  readonly natalDirection: CareerStructuralDirection;
  readonly natalStrength: CareerStructuralStrength;

  readonly expressionStrength?: CareerExpressionStrength;

  readonly dashaEffect?: CareerDashaActivationEffect;
  readonly dashaDirection?: CareerDashaActivationDirection;
  readonly dashaStrength?: CareerDashaActivationStrength;
  readonly dashaHierarchy?: CareerDashaActivationHierarchy;

  readonly d10Effect?: CareerD10QualificationEffect;
  readonly d10Direction?: CareerD10QualificationDirection;
  readonly d10Strength?: CareerD10QualificationStrength;

  readonly transitDirection?: CareerFinalDirection;

  readonly expressions?: readonly CareerFinalExpression[];

  readonly conflicts?: readonly CareerFinalConflict[];

  readonly evidenceIds?: readonly string[];

  readonly sourceRuleIds?: readonly string[];
}

export interface CareerFinalSynthesisResult {
  readonly reasoningVersion: 'C11';

  readonly domain: 'CAREER';

  readonly finalStatus: CareerFinalStatus;

  readonly finalDirection: CareerFinalDirection;

  readonly finalStrength: CareerFinalStrength;

  readonly confidence: CareerFinalConfidence;

  readonly natalDirection: CareerFinalDirection;

  readonly natalStrength: CareerFinalStrength;

  readonly expressionStatus: CareerFinalDirection;

  readonly d10Direction: CareerFinalDirection;

  readonly d10Effect: CareerD10QualificationEffect | 'UNKNOWN';

  readonly dashaEffect: CareerDashaActivationEffect;

  readonly dashaDirection: CareerFinalDirection;

  readonly timingStatus: CareerFinalTimingStatus;

  readonly transitDirection: CareerFinalDirection;

  readonly currentPressure:
    | 'NONE'
    | 'LOW'
    | 'MODERATE'
    | 'HIGH'
    | 'STRONG'
    | 'UNKNOWN';

  readonly expressions: readonly CareerFinalExpression[];

  readonly strongestExpressions: readonly string[];

  readonly challengedExpressions: readonly string[];

  readonly conflicts: readonly CareerFinalConflict[];

  readonly evidenceIds: readonly string[];

  readonly sourceRuleIds: readonly string[];

  readonly statement: string;
}
