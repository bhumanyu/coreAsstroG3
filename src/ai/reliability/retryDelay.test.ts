import { describe, expect, it } from 'vitest';
import { calculateRetryDelayMs } from './retryDelay';

const policy = {
  maxAttempts: 5,
  baseDelayMs: 100,
  maxDelayMs: 1000,
  jitterRatio: 0,
  allowPostRetry: true,
  retryableStatusCodes: [429, 503],
  retryableErrorCodes: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'HTTP_ERROR'
  ] as const
};

describe('calculateRetryDelayMs', () => {
  it('calculates exponential delay with zero jitter', () => {
    expect(calculateRetryDelayMs(1, policy)).toBe(100);
    expect(calculateRetryDelayMs(2, policy)).toBe(200);
    expect(calculateRetryDelayMs(3, policy)).toBe(400);
    expect(calculateRetryDelayMs(4, policy)).toBe(800);
  });

  it('caps the delay at maxDelayMs', () => {
    expect(calculateRetryDelayMs(5, policy)).toBe(1000);
    expect(calculateRetryDelayMs(10, policy)).toBe(1000);
  });

  it('never produces a negative jittered delay', () => {
    const jitterPolicy = {
      ...policy,
      jitterRatio: 1
    };

    expect(calculateRetryDelayMs(1, jitterPolicy, () => 0)).toBe(0);
  });

  it('produces expected positive and negative jitter with deterministic random generator', () => {
    const jitterPolicy = {
      ...policy,
      jitterRatio: 0.5
    };

    // random() = 1 -> boundedRandom * 2 - 1 = +1 -> 100 + (1 * 50) = 150
    expect(calculateRetryDelayMs(1, jitterPolicy, () => 1)).toBe(150);

    // random() = 0.5 -> boundedRandom * 2 - 1 = 0 -> 100 + 0 = 100
    expect(calculateRetryDelayMs(1, jitterPolicy, () => 0.5)).toBe(100);

    // random() = 0 -> boundedRandom * 2 - 1 = -1 -> 100 - 50 = 50
    expect(calculateRetryDelayMs(1, jitterPolicy, () => 0)).toBe(50);
  });
});
