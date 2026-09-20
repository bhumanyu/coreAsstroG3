import type {
  CareerHouseRelationship,
  CareerHouseRelationshipType
} from './careerHouseRelationship';

import {
  careerHouseRelationshipKey
} from './careerHouseRelationship';

import {
  interpretCareerHouseRelationships
} from './careerHouseRelationshipSemantics';

import type {
  CareerHouseRelationshipSemantic,
  CareerHouseRelationshipEffect,
  CareerHouseRelationshipRelevance,
  CareerHouseRelationshipSemanticStrength
} from './careerHouseRelationshipSemantics';

export type CareerStructuralDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type CareerStructuralStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type CareerStructuralEvidenceRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MIXED'
  | 'MODIFIER';

export interface CareerStructuralEvidence {
  readonly id: string;
  readonly relationship: CareerHouseRelationship;
  readonly semantic: CareerHouseRelationshipSemantic;
  readonly role: CareerStructuralEvidenceRole;
  readonly direction: CareerStructuralDirection;
  readonly weight: number;
  readonly statement: string;
}

export interface CareerStructuralConflict {
  readonly evidenceIds: readonly string[];
  readonly supportWeight: number;
  readonly challengeWeight: number;
  readonly ratio: number;
  readonly statement: string;
}

export interface CareerStructuralReasoning {
  readonly direction: CareerStructuralDirection;
  readonly strength: CareerStructuralStrength;

  readonly primarySupport: number;
  readonly primaryChallenge: number;

  readonly supportingSupport: number;
  readonly supportingChallenge: number;

  readonly challengingSupport: number;
  readonly challengingChallenge: number;

  readonly mixedWeight: number;

  readonly evidence: readonly CareerStructuralEvidence[];

  readonly primaryEvidenceIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];

  readonly conflicts: readonly CareerStructuralConflict[];

  readonly statement: string;
}

const CAREER_STRUCTURAL_STRENGTH_WEIGHT: Readonly<
  Record<CareerHouseRelationshipSemanticStrength, number>
> = Object.freeze({
  STRONG: 3,
  MODERATE: 2,
  WEAK: 1
});

function resolveDirection(
  effect: CareerHouseRelationshipEffect
): CareerStructuralDirection {
  switch (effect) {
    case 'SUPPORT':
      return 'SUPPORT';

    case 'CHALLENGE':
      return 'CHALLENGE';

    case 'MIXED':
      return 'MIXED';

    case 'NEUTRAL':
      return 'NEUTRAL';

    default:
      return 'UNAVAILABLE';
  }
}

function resolveRole(
  relevance: CareerHouseRelationshipRelevance
): CareerStructuralEvidenceRole {
  switch (relevance) {
    case 'PRIMARY':
      return 'PRIMARY';

    case 'SUPPORTING':
      return 'SUPPORTING';

    case 'CHALLENGING':
      return 'CHALLENGING';

    case 'MIXED':
      return 'MIXED';

    case 'NEUTRAL':
      return 'MODIFIER';

    default:
      return 'MODIFIER';
  }
}

function createStructuralEvidence(
  semantic: CareerHouseRelationshipSemantic
): CareerStructuralEvidence {
  const direction =
    resolveDirection(semantic.effect);

  const role =
    resolveRole(semantic.relevance);

  const weight =
    CAREER_STRUCTURAL_STRENGTH_WEIGHT[
      semantic.strength
    ];

  const relationshipKey =
    careerHouseRelationshipKey(
      semantic.relationship
    );

  return Object.freeze({
    id:
      `CAREER_STRUCTURAL:${relationshipKey}`,

    relationship:
      semantic.relationship,

    semantic,

    role,

    direction,

    weight,

    statement:
      semantic.statement
  });
}

interface StructuralTotals {
  readonly primarySupport: number;
  readonly primaryChallenge: number;

  readonly supportingSupport: number;
  readonly supportingChallenge: number;

  readonly challengingSupport: number;
  readonly challengingChallenge: number;

  readonly mixedWeight: number;
}

function aggregateEvidence(
  evidence: readonly CareerStructuralEvidence[]
): StructuralTotals {
  let primarySupport = 0;
  let primaryChallenge = 0;

  let supportingSupport = 0;
  let supportingChallenge = 0;

  let challengingSupport = 0;
  let challengingChallenge = 0;

  let mixedWeight = 0;

  for (const item of evidence) {
    if (item.direction === 'MIXED') {
      mixedWeight += item.weight;
      continue;
    }

    switch (item.role) {
      case 'PRIMARY':
        if (item.direction === 'SUPPORT') {
          primarySupport += item.weight;
        } else if (item.direction === 'CHALLENGE') {
          primaryChallenge += item.weight;
        }
        break;

      case 'SUPPORTING':
        if (item.direction === 'SUPPORT') {
          supportingSupport += item.weight;
        } else if (item.direction === 'CHALLENGE') {
          supportingChallenge += item.weight;
        }
        break;

      case 'CHALLENGING':
        if (item.direction === 'SUPPORT') {
          challengingSupport += item.weight;
        } else if (item.direction === 'CHALLENGE') {
          challengingChallenge += item.weight;
        }
        break;

      case 'MIXED':
      case 'MODIFIER':
        break;
    }
  }

  return Object.freeze({
    primarySupport,
    primaryChallenge,
    supportingSupport,
    supportingChallenge,
    challengingSupport,
    challengingChallenge,
    mixedWeight
  });
}

function resolveStructuralDirection(
  totals: StructuralTotals
): CareerStructuralDirection {
  const primarySupport =
    totals.primarySupport;

  const primaryChallenge =
    totals.primaryChallenge;

  if (
    primarySupport === 0 &&
    primaryChallenge === 0
  ) {
    const secondarySupport =
      totals.supportingSupport +
      totals.challengingSupport;

    const secondaryChallenge =
      totals.supportingChallenge +
      totals.challengingChallenge;

    if (
      secondarySupport === 0 &&
      secondaryChallenge === 0 &&
      totals.mixedWeight === 0
    ) {
      return 'UNAVAILABLE';
    }

    if (
      secondarySupport > secondaryChallenge
    ) {
      return 'SUPPORT';
    }

    if (
      secondaryChallenge > secondarySupport
    ) {
      return 'CHALLENGE';
    }

    return 'MIXED';
  }

  if (
    primarySupport > 0 &&
    primaryChallenge > 0
  ) {
    return 'MIXED';
  }

  if (primarySupport > primaryChallenge) {
    return 'SUPPORT';
  }

  if (primaryChallenge > primarySupport) {
    return 'CHALLENGE';
  }

  return 'MIXED';
}

function resolveStructuralStrength(
  totals: StructuralTotals,
  direction: CareerStructuralDirection
): CareerStructuralStrength {
  const primaryTotal =
    totals.primarySupport +
    totals.primaryChallenge;

  if (primaryTotal === 0) {
    return 'UNDETERMINED';
  }

  const primaryDominance =
    Math.abs(
      totals.primarySupport -
      totals.primaryChallenge
    ) / primaryTotal;

  if (direction === 'SUPPORT') {
    if (primaryDominance >= 0.75) {
      return 'VERY_STRONG';
    }

    if (primaryDominance >= 0.50) {
      return 'STRONG';
    }

    return 'MODERATE';
  }

  if (direction === 'CHALLENGE') {
    if (primaryDominance >= 0.75) {
      return 'VERY_WEAK';
    }

    if (primaryDominance >= 0.50) {
      return 'WEAK';
    }

    return 'MIXED';
  }

  if (direction === 'MIXED') {
    return 'MIXED';
  }

  return 'UNDETERMINED';
}

function detectStructuralConflicts(
  evidence: readonly CareerStructuralEvidence[]
): readonly CareerStructuralConflict[] {
  const primary =
    evidence.filter(
      (item) => item.role === 'PRIMARY'
    );

  const support =
    primary
      .filter(
        (item) =>
          item.direction === 'SUPPORT'
      )
      .reduce(
        (sum, item) => sum + item.weight,
        0
      );

  const challenge =
    primary
      .filter(
        (item) =>
          item.direction === 'CHALLENGE'
      )
      .reduce(
        (sum, item) => sum + item.weight,
        0
      );

  if (
    support === 0 ||
    challenge === 0
  ) {
    return Object.freeze([]);
  }

  const total =
    support + challenge;

  return Object.freeze([
    Object.freeze({
      evidenceIds: Object.freeze(
        primary
          .filter(
            (item) =>
              item.direction === 'SUPPORT' ||
              item.direction === 'CHALLENGE'
          )
          .map((item) => item.id)
      ),

      supportWeight:
        support,

      challengeWeight:
        challenge,

      ratio:
        Math.min(
          support,
          challenge
        ) / total,

      statement:
        'Primary Career structure contains both supporting and challenging relationships.'
    })
  ]);
}

function createStructuralStatement(
  direction: CareerStructuralDirection,
  strength: CareerStructuralStrength,
  totals: StructuralTotals
): string {
  if (direction === 'UNAVAILABLE') {
    return (
      'Career structural reasoning is unavailable because ' +
      'no usable Career house relationship evidence is present.'
    );
  }

  const primary =
    totals.primarySupport +
    totals.primaryChallenge;

  const secondary =
    totals.supportingSupport +
    totals.supportingChallenge +
    totals.challengingSupport +
    totals.challengingChallenge;

  return [
    `Career structural direction: ${direction}.`,
    `Structural strength: ${strength}.`,
    `Primary structural weight: ${primary}.`,
    `Secondary structural weight: ${secondary}.`,
    `Mixed structural weight: ${totals.mixedWeight}.`
  ].join(' ');
}

export function resolveCareerStructuralReasoning(
  semantics: readonly CareerHouseRelationshipSemantic[]
): CareerStructuralReasoning {
  const evidence = Object.freeze(
    semantics.map(
      createStructuralEvidence
    )
  );

  const totals =
    aggregateEvidence(evidence);

  const direction =
    resolveStructuralDirection(
      totals
    );

  const strength =
    resolveStructuralStrength(
      totals,
      direction
    );

  const conflicts =
    detectStructuralConflicts(
      evidence
    );

  const primaryEvidenceIds =
    Object.freeze(
      evidence
        .filter(
          (item) =>
            item.role === 'PRIMARY'
        )
        .map(
          (item) => item.id
        )
    );

  const supportingEvidenceIds =
    Object.freeze(
      evidence
        .filter(
          (item) =>
            item.role === 'SUPPORTING'
        )
        .map(
          (item) => item.id
        )
    );

  const challengingEvidenceIds =
    Object.freeze(
      evidence
        .filter(
          (item) =>
            item.role === 'CHALLENGING'
        )
        .map(
          (item) => item.id
        )
    );

  return Object.freeze({
    direction,
    strength,

    primarySupport:
      totals.primarySupport,

    primaryChallenge:
      totals.primaryChallenge,

    supportingSupport:
      totals.supportingSupport,

    supportingChallenge:
      totals.supportingChallenge,

    challengingSupport:
      totals.challengingSupport,

    challengingChallenge:
      totals.challengingChallenge,

    mixedWeight:
      totals.mixedWeight,

    evidence,

    primaryEvidenceIds,

    supportingEvidenceIds,

    challengingEvidenceIds,

    conflicts,

    statement:
      createStructuralStatement(
        direction,
        strength,
        totals
      )
  });
}

export function resolveCareerStructuralReasoningFromRelationships(
  relationships: readonly CareerHouseRelationship[]
): CareerStructuralReasoning {
  const semantics =
    interpretCareerHouseRelationships(
      relationships
    );

  return resolveCareerStructuralReasoning(
    semantics
  );
}
