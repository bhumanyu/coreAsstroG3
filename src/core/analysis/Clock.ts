export interface Clock {
  now(): string;
}

export const systemClock: Clock = Object.freeze({
  now: () => new Date().toISOString()
});
