import type { RemoteRetryPolicy } from './RemoteRetryPolicy';

export function calculateRetryDelayMs(
  attempt: number,
  policy: RemoteRetryPolicy,
  random: () => number = Math.random
): number {
  const exponent = Math.max(0, attempt - 1);

  const exponentialDelay =
    policy.baseDelayMs * (2 ** exponent);

  const boundedDelay = Math.min(
    policy.maxDelayMs,
    exponentialDelay
  );

  if (policy.jitterRatio === 0) {
    return Math.round(boundedDelay);
  }

  const randomValue = random();
  const boundedRandom = Math.min(1, Math.max(0, randomValue));
  const jitterRange = boundedDelay * policy.jitterRatio;
  const jitter = (boundedRandom * 2 - 1) * jitterRange;

  return Math.min(
    policy.maxDelayMs,
    Math.max(0, Math.round(boundedDelay + jitter))
  );
}
