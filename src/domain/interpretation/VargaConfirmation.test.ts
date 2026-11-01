import { describe, expect, it } from 'vitest';
import { createVargaConfirmation } from './VargaConfirmation';

describe('createVargaConfirmation — A08 D2 containment', () => {
  it('overrides a declared D2 CONFIRMS relationship and exposes the validation reason', () => {
    const confirmation = createVargaConfirmation({
      domain: 'WEALTH',
      varga: 'D2',
      relationship: 'CONFIRMS',
      strength: 'STRONG',
      confidence: 'HIGH',
      statement: 'Unvalidated D2 declaration says confirms.',
      evidenceIds: ['D2-OCCURRENCE-1']
    });

    expect(confirmation.relationship).toBe('UNAVAILABLE');
    expect(confirmation.strength).toBe('UNDETERMINED');
    expect(confirmation.confidence).toBe('UNDETERMINED');
    expect(confirmation.availability).toBe('UNAVAILABLE');
    expect(confirmation.unavailabilityReason).toContain('independent validation');
    expect(confirmation.statement).toContain('independent validation');
    expect(confirmation.evidenceIds).toEqual(['D2-OCCURRENCE-1']);
  });

  it('does not alter validated D10 relationships', () => {
    const confirmation = createVargaConfirmation({
      domain: 'CAREER',
      varga: 'D10',
      relationship: 'CONFIRMS',
      strength: 'STRONG',
      confidence: 'HIGH',
      statement: 'D10 confirmation.',
      evidenceIds: ['D10-OCCURRENCE-1']
    });

    expect(confirmation.relationship).toBe('CONFIRMS');
    expect(confirmation.availability).toBeUndefined();
    expect(confirmation.statement).toBe('D10 confirmation.');
  });
});
