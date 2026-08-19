import type { AiRequest } from '../types/aiRequestTypes';
import { RemoteAiError } from '../providers/remote/RemoteAiError';
import type { RemoteRetryPolicy } from './RemoteRetryPolicy';

export interface RetryDecision {
  readonly retryable: boolean;
  readonly reason:
    | 'RETRYABLE_ERROR'
    | 'RETRYABLE_HTTP_STATUS'
    | 'NON_RETRYABLE_ERROR'
    | 'ATTEMPTS_EXHAUSTED'
    | 'POST_RETRY_DISABLED';
  readonly delayEligible: boolean;
}

export function classifyRemoteRetry(
  error: unknown,
  request: AiRequest,
  attempt: number,
  policy: RemoteRetryPolicy
): RetryDecision {
  if (attempt >= policy.maxAttempts) {
    return Object.freeze({
      retryable: false,
      reason: 'ATTEMPTS_EXHAUSTED',
      delayEligible: false
    });
  }

  /**
   * Current RemoteAiProvider uses POST.
   * Do not retry POST unless explicitly enabled.
   */
  if (!policy.allowPostRetry) {
    return Object.freeze({
      retryable: false,
      reason: 'POST_RETRY_DISABLED',
      delayEligible: false
    });
  }

  if (!(error instanceof RemoteAiError)) {
    return Object.freeze({
      retryable: false,
      reason: 'NON_RETRYABLE_ERROR',
      delayEligible: false
    });
  }

  if (
    !policy.retryableErrorCodes.includes(
      error.code as typeof policy.retryableErrorCodes[number]
    )
  ) {
    return Object.freeze({
      retryable: false,
      reason: 'NON_RETRYABLE_ERROR',
      delayEligible: false
    });
  }

  if (error.code === 'HTTP_ERROR') {
    if (
      error.statusCode === undefined ||
      !policy.retryableStatusCodes.includes(error.statusCode)
    ) {
      return Object.freeze({
        retryable: false,
        reason: 'NON_RETRYABLE_ERROR',
        delayEligible: false
      });
    }

    return Object.freeze({
      retryable: true,
      reason: 'RETRYABLE_HTTP_STATUS',
      delayEligible: true
    });
  }

  return Object.freeze({
    retryable: true,
    reason: 'RETRYABLE_ERROR',
    delayEligible: true
  });
}
