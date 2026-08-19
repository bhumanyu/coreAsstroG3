import { describe, expect, it } from 'vitest';
import { createDomainInterpretation } from './DomainInterpretation';

describe('DomainInterpretation', () => {
  it('creates a version 2 interpretation', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      version: 'V2',
      evidence: [],
      natalPromise: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Career promise is strongly supported.',
        evidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: []
      },
      dashaActivation: {
        domain: 'CAREER',
        active: true,
        effect: 'ACTIVATES',
        strength: 'MODERATE',
        confidence: 'MODERATE',
        statement: 'Current Dasha activates career themes.',
        evidenceIds: [],
        activatedPromiseEvidenceIds: []
      },
      transitTrigger: {
        domain: 'CAREER',
        active: false,
        effect: 'NO_MATERIAL_TRIGGER',
        strength: 'UNDETERMINED',
        confidence: 'UNDETERMINED',
        statement: 'No material transit trigger identified.',
        evidenceIds: [],
        triggeredPromiseEvidenceIds: []
      },
      vargaConfirmations: [],
      manifestations: [],
      conflicts: [],
      conclusion: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Career is strongly supported.',
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        unresolvedQuestions: []
      },
      generatedAt: '2026-01-01T00:00:00.000Z'
    });

    expect(interpretation.version).toBe('V2');
    expect(interpretation.domain).toBe('CAREER');
    expect(interpretation.natalPromise.strength).toBe('STRONG');
    expect(interpretation.dashaActivation.active).toBe(true);
    expect(interpretation.transitTrigger.active).toBe(false);
  });
});
