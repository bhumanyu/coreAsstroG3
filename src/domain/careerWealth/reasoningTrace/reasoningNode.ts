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
  /** Exact DomainEvidence occurrence ID; never replaced by identityKey. */
  readonly evidenceId?: string;
  /** Semantic identity namespace, stored separately from occurrence identity. */
  readonly identityKey?: string;
  readonly subjectKey: string;
  readonly label: string;
}
