import { describe, expect, it } from 'vitest';
import { classifyRemoteRetry } from './RemoteRetryClassifier';
import { DEFAULT_REMOTE_RETRY_POLICY } from './RemoteRetryPolicy';
import { RemoteAiError } from '../providers/remote/RemoteAiError';

describe('classifyRemoteRetry', () => {
  it('does not retry POST by default', () => {
    const decision = classifyRemoteRetry(
      new RemoteAiError('NETWORK_ERROR', 'network failed'),
      1,
      DEFAULT_REMOTE_RETRY_POLICY
    );

    expect(decision.retryable).toBe(false);
    expect(decision.reason).toBe('POST_RETRY_DISABLED');
    expect(decision.delayEligible).toBe(false);
  });

  it('retries network errors when POST retry is enabled', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    const decision = classifyRemoteRetry(
      new RemoteAiError('NETWORK_ERROR', 'network failed'),
      1,
      policy
    );

    expect(decision.retryable).toBe(true);
    expect(decision.reason).toBe('RETRYABLE_ERROR');
    expect(decision.delayEligible).toBe(true);
  });

  it('retries timeout errors when enabled', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    const decision = classifyRemoteRetry(
      new RemoteAiError('TIMEOUT', 'request timed out'),
      1,
      policy
    );

    expect(decision.retryable).toBe(true);
    expect(decision.reason).toBe('RETRYABLE_ERROR');
    expect(decision.delayEligible).toBe(true);
  });

  it('retries all default retryable HTTP statuses (408, 425, 429, 500, 502, 503, 504)', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    for (const statusCode of [408, 425, 429, 500, 502, 503, 504]) {
      const decision = classifyRemoteRetry(
        new RemoteAiError('HTTP_ERROR', `HTTP ${statusCode}`, { statusCode }),
        1,
        policy
      );

      expect(decision.retryable).toBe(true);
      expect(decision.reason).toBe('RETRYABLE_HTTP_STATUS');
      expect(decision.delayEligible).toBe(true);
    }
  });

  it('does not retry HTTP 400, 401, 403, 404', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    for (const statusCode of [400, 401, 403, 404]) {
      const decision = classifyRemoteRetry(
        new RemoteAiError('HTTP_ERROR', `HTTP ${statusCode}`, { statusCode }),
        1,
        policy
      );

      expect(decision.retryable).toBe(false);
      expect(decision.reason).toBe('NON_RETRYABLE_ERROR');
      expect(decision.delayEligible).toBe(false);
    }
  });

  it('does not retry HTTP_ERROR without statusCode', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    const decision = classifyRemoteRetry(
      new RemoteAiError('HTTP_ERROR', 'unknown HTTP error'),
      1,
      policy
    );

    expect(decision.retryable).toBe(false);
    expect(decision.reason).toBe('NON_RETRYABLE_ERROR');
  });

  it('does not retry non-RemoteAiError', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    const decision = classifyRemoteRetry(
      new TypeError('Something crashed'),
      1,
      policy
    );

    expect(decision.retryable).toBe(false);
    expect(decision.reason).toBe('NON_RETRYABLE_ERROR');
  });

  it('does not retry mapping, invalid response, or invalid endpoint errors', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true
    };

    const nonRetryableCodes = [
      'MAPPING_ERROR',
      'INVALID_RESPONSE',
      'INVALID_ENDPOINT',
      'INVALID_CONFIGURATION'
    ] as const;

    for (const code of nonRetryableCodes) {
      const decision = classifyRemoteRetry(
        new RemoteAiError(code, `${code} occurred`),
        1,
        policy
      );

      expect(decision.retryable).toBe(false);
      expect(decision.reason).toBe('NON_RETRYABLE_ERROR');
    }
  });

  it('stops when attempts are exhausted', () => {
    const policy = {
      ...DEFAULT_REMOTE_RETRY_POLICY,
      allowPostRetry: true,
      maxAttempts: 3
    };

    const decision = classifyRemoteRetry(
      new RemoteAiError('NETWORK_ERROR', 'network failed'),
      3,
      policy
    );

    expect(decision.retryable).toBe(false);
    expect(decision.reason).toBe('ATTEMPTS_EXHAUSTED');
    expect(decision.delayEligible).toBe(false);
  });
});
