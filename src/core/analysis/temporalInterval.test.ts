import { describe, expect, it } from 'vitest';
import { validateInterval } from './temporalInterval';

describe('validateInterval', () => {
  it('accepts intervals starting at the Unix epoch', () => {
    expect(validateInterval(
      '1970-01-01T00:00:00.000Z',
      '1970-01-02T00:00:00.000Z'
    )).toBe(true);
  });
});
