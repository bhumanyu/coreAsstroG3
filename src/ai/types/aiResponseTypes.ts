export interface AiResponseMetadata {
  readonly provider?: string;
  readonly model?: string;
  readonly latencyMs?: number;
  readonly tokensUsed?: {
    readonly prompt?: number;
    readonly completion?: number;
    readonly total?: number;
  };
  readonly [key: string]: unknown;
}

export interface AiResponse {
  readonly requestId: string;
  readonly content?: string;
  readonly structuredOutput?: unknown;
  readonly format: 'STRUCTURED' | 'NARRATIVE';
  readonly warnings: readonly string[];
  readonly metadata?: AiResponseMetadata;
}
