import type { DomainEvidence } from '../interpretation';

import type {
  LayerSummary,
  ReasoningDirection,
  ReasoningLayer,
  WeightedReasoningEvidence
} from './reasoningTypes';

import {
  EVIDENCE_STRENGTH_WEIGHTS,
  REASONING_LAYER_WEIGHTS
} from './reasoningWeights';

export function resolveLayer(
  evidence: DomainEvidence
): ReasoningLayer {
  if (evidence.phase === 'NATAL_PROMISE') {
    if (
      evidence.role === 'PRIMARY' ||
      evidence.priority >= 90
    ) {
      return 'PRIMARY_PROMISE';
    }

    if (evidence.role === 'SECONDARY') {
      return 'SECONDARY_SUPPORT';
    }

    if (evidence.role === 'CONFIRMATION' || evidence.sourceType === 'YOGA') {
      return 'YOGA';
    }

    return 'MODIFIER';
  }

  if (evidence.phase === 'MODIFIER') {
    if (
      (evidence.role === 'CONFIRMATION' && (evidence.source === 'D10' || evidence.source === 'D2')) ||
      evidence.source === 'D10' ||
      evidence.source === 'D2' ||
      evidence.sourceType === 'VARGA'
    ) {
      return 'VARGA';
    }

    if (evidence.role === 'CONFIRMATION' || evidence.sourceType === 'YOGA') {
      return 'YOGA';
    }

    return 'MODIFIER';
  }

  if (
    evidence.phase === 'VARGA_CONFIRMATION' ||
    evidence.source === 'D10' ||
    evidence.source === 'D2' ||
    evidence.sourceType === 'VARGA'
  ) {
    return 'VARGA';
  }

  if (
    evidence.phase === 'DASHA_ACTIVATION' ||
    evidence.source === 'DASHA' ||
    evidence.sourceType === 'DASHA'
  ) {
    return 'DASHA';
  }

  if (
    evidence.phase === 'TRANSIT_TRIGGER' ||
    evidence.source === 'TRANSIT' ||
    evidence.sourceType === 'TRANSIT'
  ) {
    return 'TRANSIT';
  }

  if (evidence.role === 'CONFIRMATION' || evidence.sourceType === 'YOGA') {
    return 'YOGA';
  }

  return 'MODIFIER';
}

export function resolveDirection(
  evidence: DomainEvidence
): ReasoningDirection {
  switch (evidence.polarity) {
    case 'SUPPORTING':
      return 'SUPPORT';

    case 'CHALLENGING':
      return 'CHALLENGE';

    default:
      return 'NEUTRAL';
  }
}

export function classifyReasoningEvidence(
  evidence: readonly DomainEvidence[]
): readonly WeightedReasoningEvidence[] {
  return Object.freeze(
    evidence.map((item) => {
      const layer = resolveLayer(item);
      const direction = resolveDirection(item);

      const strengthWeight =
        EVIDENCE_STRENGTH_WEIGHTS[item.strength] ?? 1.0;

      const layerWeight =
        REASONING_LAYER_WEIGHTS[layer] ?? 1.0;

      return Object.freeze({
        evidenceId: item.id,
        ...(item.ruleId ? { ruleId: item.ruleId } : {}),
        layer,
        direction,
        strength: item.strength,
        priority: item.priority,
        weight: layerWeight * strengthWeight,
        statement: item.statement,
        relatedEvidenceIds: Object.freeze([
          ...item.relatedEvidenceIds
        ])
      });
    })
  );
}

export function summarizeLayers(
  evidence: readonly WeightedReasoningEvidence[]
): readonly LayerSummary[] {
  const layerOrder: readonly ReasoningLayer[] = [
    'PRIMARY_PROMISE',
    'SECONDARY_SUPPORT',
    'MODIFIER',
    'YOGA',
    'VARGA',
    'DASHA',
    'TRANSIT'
  ];

  const presentLayers = new Set<ReasoningLayer>(
    evidence.map((item) => item.layer)
  );

  const orderedLayers = layerOrder.filter((l) => presentLayers.has(l));

  return Object.freeze(
    orderedLayers.map((layer) => {
      const layerEvidence = evidence.filter(
        (item) => item.layer === layer
      );

      const weightedSupport = layerEvidence
        .filter((item) => item.direction === 'SUPPORT')
        .reduce((sum, item) => sum + item.weight, 0);

      const weightedChallenge = layerEvidence
        .filter((item) => item.direction === 'CHALLENGE')
        .reduce((sum, item) => sum + item.weight, 0);

      const direction: ReasoningDirection =
        weightedSupport === 0 && weightedChallenge === 0
          ? 'NEUTRAL'
          : weightedSupport === weightedChallenge
            ? 'MIXED'
            : weightedSupport > weightedChallenge
              ? 'SUPPORT'
              : 'CHALLENGE';

      return Object.freeze({
        layer,
        direction,
        weightedSupport,
        weightedChallenge,
        evidenceIds: Object.freeze(
          layerEvidence.map((item) => item.evidenceId)
        )
      });
    })
  );
}
