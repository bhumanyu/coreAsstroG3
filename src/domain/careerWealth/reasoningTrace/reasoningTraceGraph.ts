import type { ReasoningNode, ReasoningNodeDomain } from './reasoningNode';
import type { ReasoningEdge } from './reasoningEdge';
import type { ReasoningTraceCompleteness } from './reasoningTraceCompleteness';

export interface ReasoningTraceGraph {
  readonly traceId: string;
  readonly nodes: readonly ReasoningNode[];
  readonly edges: readonly ReasoningEdge[];
  readonly traceCompleteness?: ReasoningTraceCompleteness;
}

export function buildReasoningTraceId(domain: ReasoningNodeDomain): string {
  return `CW-TRACE-${domain}`;
}
