import type { Horoscope } from '../../types';

import {
  buildCareerStructuralReasoning,
  toDomainEvidence
} from './careerStructuralReasoningIntegration';

import type { CareerStructuralReasoning } from './careerStructuralReasoning';

import {
  buildCareerPlanetaryRelevance
} from './careerPlanetaryRelevanceIntegration';

import {
  buildCareerPlanetaryCondition
} from './careerPlanetaryConditionIntegration';

import {
  buildCareerLordRelationships
} from './careerLordRelationshipIntegration';

import {
  createCareerNatalAnalysis,
  type CareerNatalAnalysis,
  type CareerNatalConflict
} from './careerNatalAnalysis';

import {
  classifyReasoningEvidence
} from '../reasoning/reasoningHierarchy';

import {
  deduplicateReasoningEvidence,
  canonicalToWeighted
} from '../reasoning/deduplicateEvidence';

import {
  buildReasoningTrace
} from '../reasoning/reasoningTrace';

import type {
  ReasoningDirection,
  DomainStrength
} from '../reasoning/reasoningTypes';

export interface CareerNatalConvergenceInput {
  readonly horoscope: Horoscope;
}

function resolveNatalDirection(
  structural: CareerStructuralReasoning
): ReasoningDirection {
  // 1:1 map from structural.direction to ReasoningDirection
  return structural.direction as ReasoningDirection;
}

function resolveNatalStrength(
  structural: CareerStructuralReasoning
): DomainStrength {
  // 1:1 map from structural.strength to DomainStrength
  return structural.strength as DomainStrength;
}

function buildNatalConflicts(
  structural: CareerStructuralReasoning
): readonly CareerNatalConflict[] {
  const conflicts: CareerNatalConflict[] = [];

  for (const conflict of structural.conflicts) {
    const evidenceIds = new Set(conflict.evidenceIds);

    // Filter structural.evidence by id ∈ conflict.evidenceIds and direction
    const supportingEvidenceIds = Object.freeze(
      structural.evidence
        .filter(e => evidenceIds.has(e.id) && e.direction === 'SUPPORT')
        .map(e => e.id)
        .sort()
    );

    const challengingEvidenceIds = Object.freeze(
      structural.evidence
        .filter(e => evidenceIds.has(e.id) && e.direction === 'CHALLENGE')
        .map(e => e.id)
        .sort()
    );

    // Build identityKey from sorted evidence IDs
    const identityKey = [
      'CAREER_NATAL_STRUCTURAL_CONFLICT',
      ...[...evidenceIds].sort()
    ].join(':');

    conflicts.push(
      Object.freeze({
        identityKey,
        supportingEvidenceIds,
        challengingEvidenceIds,
        supportWeight: conflict.supportWeight,
        challengeWeight: conflict.challengeWeight,
        ratio: conflict.ratio,
        statement: conflict.statement
      })
    );
  }

  return Object.freeze(conflicts);
}

export function buildCareerNatalAnalysis(
  input: CareerNatalConvergenceInput
): CareerNatalAnalysis {
  const { horoscope } = input;

  // Pipeline order (one-way): C4 → C5 → C6 → C7
  const structural = buildCareerStructuralReasoning({ horoscope });
  const relevance = buildCareerPlanetaryRelevance({ horoscope, structural });
  const condition = buildCareerPlanetaryCondition({ horoscope, relevance });
  const lordRelationships = buildCareerLordRelationships({ structural });

  // Evidence: only from C4 structural reasoning
  const evidence = canonicalToWeighted(
    deduplicateReasoningEvidence(
      classifyReasoningEvidence(toDomainEvidence(structural))
    )
  );

  // Direction and strength: 1:1 maps from structural
  const direction = resolveNatalDirection(structural);
  const strength = resolveNatalStrength(structural);

  // Conflicts: enriched from C4 conflicts
  const conflicts = buildNatalConflicts(structural);

  // Reasoning trace
  const reasoningTrace = buildReasoningTrace(evidence);

  return createCareerNatalAnalysis({
    structural,
    relevance,
    condition,
    lordRelationships,
    direction,
    strength,
    evidence,
    conflicts,
    reasoningTrace
  });
}
