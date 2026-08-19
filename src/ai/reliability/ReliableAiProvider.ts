import type {
  AiCapability,
  AiProvider,
  AiProviderIdentity,
  AiProviderStatus
} from '../types/aiProviderTypes';
import type { AiRequest } from '../types/aiRequestTypes';
import type { AiResponse } from '../types/aiResponseTypes';
import { classifyRemoteRetry } from './RemoteRetryClassifier';
import { calculateRetryDelayMs } from './retryDelay';
import {
  DEFAULT_REMOTE_RETRY_POLICY,
  validateRemoteRetryPolicy,
  type RemoteRetryPolicy
} from './RemoteRetryPolicy';

function sleep(delayMs: number): Promise<void> {
  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export class ReliableAiProvider implements AiProvider {
  readonly identity: AiProviderIdentity;
  readonly capabilities: readonly AiCapability[];
  private readonly provider: AiProvider;
  private readonly policy: RemoteRetryPolicy;

  constructor(
    provider: AiProvider,
    policy: RemoteRetryPolicy = DEFAULT_REMOTE_RETRY_POLICY
  ) {
    validateRemoteRetryPolicy(policy);

    this.provider = provider;
    this.policy = Object.freeze({
      ...policy,
      retryableStatusCodes: Object.freeze([...policy.retryableStatusCodes]),
      retryableErrorCodes: Object.freeze([...policy.retryableErrorCodes])
    });

    this.identity = Object.freeze({
      ...provider.identity
    });

    this.capabilities = Object.freeze([
      ...provider.capabilities
    ]);
  }

  getStatus(): AiProviderStatus {
    return this.provider.getStatus();
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    let attempt = 1;

    while (true) {
      try {
        return await this.provider.generate(request);
      } catch (error) {
        const decision = classifyRemoteRetry(
          error,
          request,
          attempt,
          this.policy
        );

        if (!decision.retryable) {
          throw error;
        }

        const delayMs = calculateRetryDelayMs(attempt, this.policy);
        await sleep(delayMs);

        attempt += 1;
      }
    }
  }
}
