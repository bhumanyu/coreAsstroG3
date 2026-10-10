import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength
} from '../careerDasha';

import type {
  CareerD10Context,
  CareerD10QualificationResult,
  CareerD10Evidence,
  CareerD10ExpressionQualification,
  CareerD10QualificationDirection,
  CareerD10QualificationEffect
} from './careerD10QualificationTypes';

import type {
  CareerExpression
} from '../careerExpression';

import {
  hasNatalCareerPromise,
  isD10DataAvailable,
  resolveD10Direction,
  resolveD10Effect,
  resolveD10Strength,
  qualifyNatalCareerWithD10,
  evaluateDimensionQualification
} from './careerD10QualificationRules';

function createEvidence(
  role: 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'MODIFIER',
  direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNDETERMINED' | 'UNAVAILABLE',
  weight: number,
  statement: string,
  source: string
): CareerD10Evidence {
  const evidenceId = `CAREER_D10_QUAL:${source}:${direction}:${role}`;
  return Object.freeze({
    id: evidenceId,
    role,
    direction,
    weight,
    statement,
    source
  });
}

function createQualificationStatement(
  d10Effect: string,
  d10Direction: string,
  d10Strength: string,
  qualifiedDirection: string,
  qualifiedStrength: string,
  natalPromisePreserved: boolean,
  dashaPreserved: boolean
): string {
  const parts = [
    `D10 qualification effect: ${d10Effect}.`,
    `D10 direction: ${d10Direction}.`,
    `D10 strength: ${d10Strength}.`,
    `Qualified direction: ${qualifiedDirection}.`,
    `Qualified strength: ${qualifiedStrength}.`,
    `Natal promise preserved: ${natalPromisePreserved}.`,
    `Dasha preserved: ${dashaPreserved}.`
  ];

  return parts.join(' ');
}

/**
 * Qualifies a single expression with D10 dimension rules.
 * This is the authoritative semantic resolver for per-expression qualification.
 */
function qualifyExpressionSemantically(
  expression: CareerExpression,
  context: CareerD10Context,
  d10Direction: CareerD10QualificationDirection,
  d10Effect: CareerD10QualificationEffect
): CareerD10ExpressionQualification {
  // Order-independent, non-empty identity: mode + sorted supporting ids
  const expressionId = [expression.mode, ...[...expression.supportingEvidenceIds].sort()].join(':');

  // Evaluate per-dimension qualification
  const dimensionResult = evaluateDimensionQualification(expression.mode, context);

  // Determine relationship based on dimension result
  let relationship: CareerD10QualificationEffect;
  if (!dimensionResult.matched) {
    relationship = 'INSUFFICIENT_DATA';
  } else if (expression.direction === 'CONDITIONAL') {
    // Per spec §25: conditional expressions get QUALIFIES but preserve conditional flag
    relationship = 'QUALIFIES';
  } else if (expression.direction === 'SUPPORTED' && dimensionResult.direction === 'SUPPORT') {
    relationship = 'REINFORCES';
  } else if (expression.direction === 'SUPPORTED' && dimensionResult.direction === 'CHALLENGE') {
    relationship = 'CONFLICTS';
  } else if (expression.direction === 'SUPPORTED' && dimensionResult.direction === 'MIXED') {
    relationship = 'QUALIFIES';
  } else {
    relationship = 'INSUFFICIENT_DATA';
  }

  const qualified = relationship !== 'INSUFFICIENT_DATA';

  // Build evidence from dimension result sourceIds
  const qualificationEvidence: CareerD10Evidence[] = dimensionResult.sourceIds.map((sourceId, idx) =>
    createEvidence(
      'PRIMARY',
      dimensionResult.direction,
      1,
      `Expression ${expressionId} qualified by D10 factor ${sourceId}.`,
      sourceId
    )
  );

  const qualification: CareerD10ExpressionQualification = Object.freeze({
    expressionId,
    qualified,
    effect: relationship,
    direction: qualified ? dimensionResult.direction : expression.direction === 'SUPPORTED' ? 'SUPPORT' :
      expression.direction === 'CONDITIONAL' ? 'MIXED' : 'UNAVAILABLE',
    strength: qualified ? dimensionResult.strength : expression.strength === 'STRONG' ? 'STRONG' :
      expression.strength === 'MODERATE' ? 'MODERATE' :
        expression.strength === 'WEAK' ? 'WEAK' : 'UNDETERMINED',
    evidence: Object.freeze(qualificationEvidence),
    statement: qualified
      ? `Expression ${expressionId} qualified by D10 with effect ${relationship}.`
      : `Expression ${expressionId} not qualified by D10; preserved original direction.`
  });

  return qualification;
}

export function resolveCareerD10Qualification(
  context: CareerD10Context
): CareerD10QualificationResult {
  const evidence: CareerD10Evidence[] = [];

  const natalDirection = context.natalDirection;
  const natalStrength = context.natalStrength;

  const dashaEffect = context.dashaEffect ?? 'UNAVAILABLE';
  const dashaDirection = context.dashaDirection ?? 'UNAVAILABLE';
  // Note: dashaPreserved indicates whether dasha fields were provided in context.
  // C10 is parallel to C9 and does not use dasha fields in qualification logic.
  // These fields are retained for backward compatibility and will be removed in future waves.
  const dashaPreserved = context.dashaEffect !== undefined;

  if (natalDirection === 'UNAVAILABLE') {
    const unavailableEvidence = createEvidence(
      'PRIMARY',
      'UNAVAILABLE',
      0,
      'Natal career direction is unavailable; D10 qualification cannot proceed.',
      'C10_D10_NATAL_DIRECTION_CHECK'
    );
    evidence.push(unavailableEvidence);

    return Object.freeze({
      natalDirection,
      natalStrength,
      dashaEffect,
      dashaDirection,
      d10Effect: 'UNAVAILABLE',
      d10Direction: 'UNAVAILABLE',
      d10Strength: 'UNDETERMINED',
      qualifiedDirection: 'UNAVAILABLE',
      qualifiedStrength: 'UNDETERMINED',
      natalPromisePreserved: true,
      dashaPreserved,
      evidence: Object.freeze(evidence),
      expressionQualifications: Object.freeze([]),
      statement: 'Natal career direction is unavailable; D10 qualification is unavailable.'
    });
  }

  if (!hasNatalCareerPromise(natalDirection, natalStrength)) {
    const insufficientEvidence = createEvidence(
      'PRIMARY',
      'UNDETERMINED',
      0,
      'Natal career has no promise; D10 cannot create promise where none exists.',
      'C10_D10_NATAL_PROMISE_CHECK'
    );
    evidence.push(insufficientEvidence);

    return Object.freeze({
      natalDirection,
      natalStrength,
      dashaEffect,
      dashaDirection,
      d10Effect: 'INSUFFICIENT_DATA',
      d10Direction: 'UNDETERMINED',
      d10Strength: 'UNDETERMINED',
      qualifiedDirection: 'UNDETERMINED',
      qualifiedStrength: 'UNDETERMINED',
      natalPromisePreserved: true,
      dashaPreserved,
      evidence: Object.freeze(evidence),
      expressionQualifications: Object.freeze([]),
      statement: 'Natal career has no promise; D10 qualification is insufficient.'
    });
  }

  if (!isD10DataAvailable(context)) {
    const unavailableEvidence = createEvidence(
      'PRIMARY',
      'UNAVAILABLE',
      0,
      'D10 data is unavailable; qualification cannot proceed.',
      'C10_D10_DATA_CHECK'
    );
    evidence.push(unavailableEvidence);

    return Object.freeze({
      natalDirection,
      natalStrength,
      dashaEffect,
      dashaDirection,
      d10Effect: 'UNAVAILABLE',
      d10Direction: 'UNAVAILABLE',
      d10Strength: 'UNDETERMINED',
      qualifiedDirection: natalDirection === 'SUPPORT' ? 'SUPPORT' :
        natalDirection === 'CHALLENGE' ? 'CHALLENGE' :
          natalDirection === 'MIXED' ? 'MIXED' : 'UNAVAILABLE',
      qualifiedStrength: natalStrength === 'VERY_STRONG' ? 'VERY_STRONG' :
        natalStrength === 'STRONG' ? 'STRONG' :
          natalStrength === 'MODERATE' ? 'MODERATE' :
            natalStrength === 'WEAK' ? 'WEAK' :
              natalStrength === 'VERY_WEAK' ? 'VERY_WEAK' : 'UNDETERMINED',
      natalPromisePreserved: true,
      dashaPreserved,
      evidence: Object.freeze(evidence),
      expressionQualifications: Object.freeze([]),
      statement: 'D10 data is unavailable; preserving natal direction and strength.'
    });
  }

  const d10Direction = resolveD10Direction(context);
  const d10Effect = resolveD10Effect(natalDirection, d10Direction, context);
  const d10Strength = resolveD10Strength(natalStrength, d10Direction, context);

  const d10DirectionEvidence = createEvidence(
    'PRIMARY',
    d10Direction,
    1,
    `D10 resolves to direction ${d10Direction}.`,
    'C10_D10_DIRECTION_RESOLUTION'
  );
  evidence.push(d10DirectionEvidence);

  const d10EffectEvidence = createEvidence(
    'PRIMARY',
    d10Direction,
    1,
    `D10 qualification effect is ${d10Effect}.`,
    'C10_D10_EFFECT_RESOLUTION'
  );
  evidence.push(d10EffectEvidence);

  const d10StrengthEvidence = createEvidence(
    'SUPPORTING',
    d10Direction,
    0.5,
    `D10 strength is ${d10Strength}.`,
    'C10_D10_STRENGTH_RESOLUTION'
  );
  evidence.push(d10StrengthEvidence);

  const {
    qualifiedDirection,
    qualifiedStrength,
    natalPromisePreserved
  } = qualifyNatalCareerWithD10(
    natalDirection,
    natalStrength,
    d10Direction,
    d10Strength,
    context
  );

  const qualificationEvidence = createEvidence(
    'PRIMARY',
    qualifiedDirection,
    1,
    `Qualified direction is ${qualifiedDirection} (natal: ${natalDirection}, D10: ${d10Direction}).`,
    'C10_D10_QUALIFICATION_RESOLUTION'
  );
  evidence.push(qualificationEvidence);

  // Populate expressionQualifications using the semantic resolver
  const expressionQualifications: readonly CareerD10ExpressionQualification[] = Object.freeze(
    context.expressions.map(expr =>
      qualifyExpressionSemantically(expr, context, d10Direction, d10Effect)
    )
  );

  const statement = createQualificationStatement(
    d10Effect,
    d10Direction,
    d10Strength,
    qualifiedDirection,
    qualifiedStrength,
    natalPromisePreserved,
    dashaPreserved
  );

  return Object.freeze({
    natalDirection,
    natalStrength,
    dashaEffect,
    dashaDirection,
    d10Effect,
    d10Direction,
    d10Strength,
    qualifiedDirection,
    qualifiedStrength,
    natalPromisePreserved,
    dashaPreserved,
    evidence: Object.freeze(evidence),
    expressionQualifications,
    statement
  });
}
