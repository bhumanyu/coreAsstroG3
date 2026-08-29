export type ReasoningNodeType =
  | 'EVIDENCE'
  | 'CONCLUSION'
  | 'SYNTHESIS'
  | 'MANIFESTATION';

export type ReasoningNodeDomain = 'CAREER' | 'WEALTH';

export type ReasoningNodeAxis =
  | 'NATAL'
  | 'DASHA'
  | 'TIMING'
  | 'DIVISIONAL'
  | 'MANIFESTATION'
  | 'FINAL';

export interface ReasoningNode {
  readonly nodeId: string;
  readonly type: ReasoningNodeType;
  readonly domain: ReasoningNodeDomain;
  readonly axis: ReasoningNodeAxis;
  readonly evidenceId?: string;
  readonly subjectKey: string;
  readonly label: string;
}
