export interface OpenAiProviderOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly endpoint?: string;
  readonly timeoutMs?: number;
}

export interface OpenAiResponseUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly total_tokens?: number;
}

export interface OpenAiResponseEnvelope {
  readonly id?: string;
  readonly object?: string;
  readonly model?: string;
  readonly status?: string;
  readonly output_text?: string;
  readonly output?: readonly unknown[];
  readonly usage?: OpenAiResponseUsage;
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
  };
  readonly incomplete_details?: {
    readonly reason?: string;
  };
}

export interface OpenAiStructuredReasoning {
  readonly status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  readonly conclusion: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly unresolvedQuestions: readonly string[];
  readonly warnings: readonly string[];
}

export interface OpenAiProviderMetadata {
  readonly provider: 'openai';
  readonly model: string;
  readonly responseId?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}
