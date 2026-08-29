export type ReasoningEdgeType =
  | 'SUPPORTS'
  | 'CHALLENGES'
  | 'ACTIVATES'
  | 'CONFIRMS'
  | 'MODIFIES'
  | 'MANIFESTS'
  | 'CONTRADICTS';

export interface ReasoningEdge {
  readonly edgeId: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly type: ReasoningEdgeType;
  readonly explanation: string;
}
