import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REMOTE_RETRY_POLICY,
  validateRemoteRetryPolicy
} from './RemoteRetryPolicy';

describe('RemoteRetryPolicy', () => {
  it('has safe defaults', () => {
    expect(DEFAULT_REMOTE_RETRY_POLICY.maxAttempts).toBe(3);
    expect(DEFAULT_REMOTE_RETRY_POLICY.baseDelayMs).toBe(250);
    expect(DEFAULT_REMOTE_RETRY_POLICY.maxDelayMs).toBe(4000);
    expect(DEFAULT_REMOTE_RETRY_POLICY.jitterRatio).toBe(0.2);
    expect(DEFAULT_REMOTE_RETRY_POLICY.allowPostRetry).toBe(false);
    expect(DEFAULT_REMOTE_RETRY_POLICY.retryableStatusCodes).toEqual([
      408, 425, 429, 500, 502, 503, 504
    ]);
    expect(DEFAULT_REMOTE_RETRY_POLICY.retryableErrorCodes).toEqual([
      'TIMEOUT',
      'NETWORK_ERROR',
      'HTTP_ERROR'
    ]);
  });

  it('accepts valid policy', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitterRatio: 0.2,
        allowPostRetry: false,
        retryableStatusCodes: [429, 503],
        retryableErrorCodes: ['NETWORK_ERROR']
      })
    ).not.toThrow();
  });

  it('rejects zero or negative attempts', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        maxAttempts: 0
      })
    ).toThrow(/maxAttempts must be an integer/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        maxAttempts: -2
      })
    ).toThrow(/maxAttempts must be an integer/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        maxAttempts: 2.5
      })
    ).toThrow(/maxAttempts must be an integer/);
  });

  it('rejects negative delay', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        baseDelayMs: -1
      })
    ).toThrow(/baseDelayMs must be greater than or equal to zero/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        maxDelayMs: -10
      })
    ).toThrow(/maxDelayMs must be greater than or equal to zero/);
  });

  it('rejects max delay below base delay', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        baseDelayMs: 2000,
        maxDelayMs: 1000
      })
    ).toThrow(/maxDelayMs must be greater than or equal to baseDelayMs/);
  });

  it('rejects jitter outside range', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        jitterRatio: 1.1
      })
    ).toThrow(/jitterRatio must be between zero and one/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        jitterRatio: -0.1
      })
    ).toThrow(/jitterRatio must be between zero and one/);
  });

  it('rejects non-array status or error codes', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableStatusCodes: '429' as any
      })
    ).toThrow(/retryableStatusCodes must be an array/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableErrorCodes: null as any
      })
    ).toThrow(/retryableErrorCodes must be an array/);
  });

  it('rejects invalid or out-of-range HTTP status codes', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableStatusCodes: [429, 'banana' as any]
      })
    ).toThrow(/retryableStatusCodes must contain valid HTTP status codes/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableStatusCodes: [429, 99]
      })
    ).toThrow(/retryableStatusCodes must contain valid HTTP status codes/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableStatusCodes: [429, 600]
      })
    ).toThrow(/retryableStatusCodes must contain valid HTTP status codes/);

    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableStatusCodes: [429.5]
      })
    ).toThrow(/retryableStatusCodes must contain valid HTTP status codes/);
  });

  it('rejects duplicate HTTP status codes', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableStatusCodes: [429, 503, 429]
      })
    ).toThrow(/retryableStatusCodes must not contain duplicates/);
  });

  it('rejects invalid or unsupported error codes', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableErrorCodes: ['NETWORK_ERROR', 'SOMETHING_RANDOM' as any]
      })
    ).toThrow(/retryableErrorCodes contains an unsupported error code/);
  });

  it('rejects duplicate error codes', () => {
    expect(() =>
      validateRemoteRetryPolicy({
        ...DEFAULT_REMOTE_RETRY_POLICY,
        retryableErrorCodes: ['NETWORK_ERROR', 'TIMEOUT', 'NETWORK_ERROR']
      })
    ).toThrow(/retryableErrorCodes must not contain duplicates/);
  });
});
