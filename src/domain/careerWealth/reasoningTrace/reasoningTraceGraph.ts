import type { ReasoningNode, ReasoningNodeDomain } from './reasoningNode';
import type { ReasoningEdge } from './reasoningEdge';

export interface ReasoningTraceGraph {
  readonly traceId: string;
  readonly nodes: readonly ReasoningNode[];
  readonly edges: readonly ReasoningEdge[];
}

export function buildReasoningTraceId(domain: ReasoningNodeDomain): string {
  return `CW-TRACE-${domain}`;
}
