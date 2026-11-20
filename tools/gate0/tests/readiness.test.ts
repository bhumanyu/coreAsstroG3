import { describe, expect, it } from 'vitest';
import { deriveGate0OverallStatus } from '../lib/readiness.ts';

describe('Gate-0 combined readiness', () => {
  it('requires complete cohort brackets in addition to READY RG-09', () => {
    expect(deriveGate0OverallStatus('READY', 0)).toBe('READY');
    expect(deriveGate0OverallStatus('READY', 1)).toBe('PENDING_REVIEW');
    expect(deriveGate0OverallStatus('PENDING_REVIEW', 0)).toBe('PENDING_REVIEW');
    expect(deriveGate0OverallStatus('BLOCKED', 0)).toBe('BLOCKED');
  });
});
