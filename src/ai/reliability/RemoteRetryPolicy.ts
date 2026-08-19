export interface RemoteRetryPolicy {
  /**
   * Maximum total execution attempts.
   *
   * 1 = no retry.
   * 2 = one retry.
   * 3 = two retries.
   */
  readonly maxAttempts: number;

  /**
   * Initial exponential backoff delay in milliseconds.
   */
  readonly baseDelayMs: number;

  /**
   * Maximum delay in milliseconds between attempts.
   */
  readonly maxDelayMs: number;

  /**
   * Random jitter ratio.
   *
   * 0.0 = no jitter
   * 0.20 = +/-20%
   * 1.0 = +/-100%
   */
  readonly jitterRatio: number;

  /**
   * Whether retrying POST requests is explicitly allowed.
   *
   * Default must be false.
   */
  readonly allowPostRetry: boolean;

  /**
   * HTTP statuses eligible for retry.
   */
  readonly retryableStatusCodes: readonly number[];

  /**
   * Remote error categories eligible for retry.
   */
  readonly retryableErrorCodes: readonly (
    | 'TIMEOUT'
    | 'NETWORK_ERROR'
    | 'HTTP_ERROR'
  )[];
}

export const DEFAULT_REMOTE_RETRY_POLICY: Readonly<RemoteRetryPolicy> =
  Object.freeze({
    maxAttempts: 3,
    baseDelayMs: 250,
    maxDelayMs: 4000,
    jitterRatio: 0.2,
    /**
     * CRITICAL:
     *
     * Remote requests are POST requests.
     * Never retry automatically unless explicitly enabled.
     */
    allowPostRetry: false,
    retryableStatusCodes: Object.freeze([
      408, 425, 429, 500, 502, 503, 504
    ]),
    retryableErrorCodes: Object.freeze([
      'TIMEOUT',
      'NETWORK_ERROR',
      'HTTP_ERROR'
    ] as const)
  });

export function validateRemoteRetryPolicy(policy: RemoteRetryPolicy): void {
  if (
    !Number.isInteger(policy.maxAttempts) ||
    policy.maxAttempts < 1
  ) {
    throw new Error(
      'maxAttempts must be an integer greater than or equal to 1.'
    );
  }

  if (
    !Number.isFinite(policy.baseDelayMs) ||
    policy.baseDelayMs < 0
  ) {
    throw new Error('baseDelayMs must be greater than or equal to zero.');
  }

  if (
    !Number.isFinite(policy.maxDelayMs) ||
    policy.maxDelayMs < 0
  ) {
    throw new Error('maxDelayMs must be greater than or equal to zero.');
  }

  if (policy.maxDelayMs < policy.baseDelayMs) {
    throw new Error('maxDelayMs must be greater than or equal to baseDelayMs.');
  }

  if (
    !Number.isFinite(policy.jitterRatio) ||
    policy.jitterRatio < 0 ||
    policy.jitterRatio > 1
  ) {
    throw new Error('jitterRatio must be between zero and one.');
  }

  if (!Array.isArray(policy.retryableStatusCodes)) {
    throw new Error('retryableStatusCodes must be an array.');
  }

  if (!Array.isArray(policy.retryableErrorCodes)) {
    throw new Error('retryableErrorCodes must be an array.');
  }
}
