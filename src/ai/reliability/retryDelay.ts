import type { RemoteRetryPolicy } from './RemoteRetryPolicy';

export function calculateRetryDelayMs(
  attempt: number,
  policy: RemoteRetryPolicy,
  random: () => number = Math.random
): number {
  const exponent = Math.max(0, attempt - 1);

  const exponentialDelay = Math.min(
    policy.maxDelayMs,
    policy.baseDelayMs * (2 ** exponent)
  );

  if (policy.jitterRatio === 0) {
    return Math.round(exponentialDelay);
  }

  const randomValue = random();
  const boundedRandom = Math.min(1, Math.max(0, randomValue));
  const jitterRange = exponentialDelay * policy.jitterRatio;
  const jitter = (boundedRandom * 2 - 1) * jitterRange;

  return Math.max(0, Math.round(exponentialDelay + jitter));
}
