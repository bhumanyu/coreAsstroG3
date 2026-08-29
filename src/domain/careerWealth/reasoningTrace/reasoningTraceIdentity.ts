import type {
  ReasoningNodeAxis,
  ReasoningNodeDomain,
  ReasoningNodeType
} from './reasoningNode';
import type { ReasoningEdgeType } from './reasoningEdge';

export interface ReasoningNodeIdentityInput {
  readonly type: ReasoningNodeType;
  readonly domain: ReasoningNodeDomain;
  readonly axis: ReasoningNodeAxis;
  readonly subjectKey: string;
  readonly evidenceId?: string;
}

export interface ReasoningEdgeIdentityInput {
  readonly type: ReasoningEdgeType;
  readonly fromNodeId: string;
  readonly toNodeId: string;
}

export function normalize(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Builds a deterministic node identifier.
 * Format: CW-TRACE-NODE-<TYPE>-<DOMAIN>-<AXIS>-<SUBJECT_KEY>[-<EVIDENCE_ID>]
 */
export function buildReasoningNodeId(input: ReasoningNodeIdentityInput): string {
  if (!input.subjectKey || !input.subjectKey.trim()) {
    throw new Error('Reasoning node subjectKey must not be empty');
  }

  const normalizedSubject = normalize(input.subjectKey);
  if (!normalizedSubject) {
    throw new Error('Reasoning node subjectKey must contain valid alphanumeric characters');
  }

  const rawSegments = [
    'CW',
    'TRACE',
    'NODE',
    input.type,
    input.domain,
    input.axis,
    normalizedSubject,
    input.evidenceId && input.evidenceId.trim() ? normalize(input.evidenceId) : undefined
  ];

  return rawSegments
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .map(normalize)
    .filter(Boolean)
    .join('-');
}

/**
 * Builds a deterministic edge identifier.
 * Format: CW-TRACE-EDGE-<TYPE>-<FROM_NODE_ID>-<TO_NODE_ID>
 * Edge identity strictly excludes explanation, confidence, priority, timestamp, or index.
 */
export function buildReasoningEdgeId(input: ReasoningEdgeIdentityInput): string {
  if (!input.fromNodeId || !input.fromNodeId.trim()) {
    throw new Error('Reasoning edge fromNodeId must not be empty');
  }
  if (!input.toNodeId || !input.toNodeId.trim()) {
    throw new Error('Reasoning edge toNodeId must not be empty');
  }

  const rawSegments = [
    'CW',
    'TRACE',
    'EDGE',
    input.type,
    normalize(input.fromNodeId),
    normalize(input.toNodeId)
  ];

  return rawSegments
    .map(normalize)
    .filter(Boolean)
    .join('-');
}
