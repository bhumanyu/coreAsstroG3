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
  CareerD10ExpressionQualification
} from './careerD10QualificationTypes';

import {
  hasNatalCareerPromise,
  isD10DataAvailable,
  resolveD10Direction,
  resolveD10Effect,
  resolveD10Strength,
  qualifyNatalCareerWithD10
} from './careerD10QualificationRules';

let evidenceCounter = 0;

function generateEvidenceId(base: string): string {
  evidenceCounter++;
  return `CAREER_D10_QUAL:${base}:${evidenceCounter}`;
}

function createEvidence(
  role: 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'MODIFIER',
  direction: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL' | 'UNDETERMINED' | 'UNAVAILABLE',
  weight: number,
  statement: string,
  source?: string
): CareerD10Evidence {
  return Object.freeze({
    id: generateEvidenceId('EVIDENCE'),
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

export function resolveCareerD10Qualification(
  context: CareerD10Context
): CareerD10QualificationResult {
  evidenceCounter = 0;

  const evidence: CareerD10Evidence[] = [];

  const natalDirection = context.natalDirection;
  const natalStrength = context.natalStrength;

  const dashaEffect = context.dashaEffect ?? 'UNAVAILABLE';
  const dashaDirection = context.dashaDirection ?? 'UNAVAILABLE';
  const dashaPreserved = context.dashaEffect !== undefined;

  if (natalDirection === 'UNAVAILABLE') {
    const unavailableEvidence = createEvidence(
      'PRIMARY',
      'UNAVAILABLE',
      0,
      'Natal career direction is unavailable; D10 qualification cannot proceed.'
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
      'Natal career has no promise; D10 cannot create promise where none exists.'
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
      'D10 data is unavailable; qualification cannot proceed.'
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
    'D10_DIRECTION_RESOLUTION'
  );
  evidence.push(d10DirectionEvidence);

  const d10EffectEvidence = createEvidence(
    'PRIMARY',
    d10Direction,
    1,
    `D10 qualification effect is ${d10Effect}.`,
    'D10_EFFECT_RESOLUTION'
  );
  evidence.push(d10EffectEvidence);

  const d10StrengthEvidence = createEvidence(
    'SUPPORTING',
    d10Direction,
    0.5,
    `D10 strength is ${d10Strength}.`,
    'D10_STRENGTH_RESOLUTION'
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
    'QUALIFICATION_RESOLUTION'
  );
  evidence.push(qualificationEvidence);

  const expressionQualifications: CareerD10ExpressionQualification[] = Object.freeze([]);

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
