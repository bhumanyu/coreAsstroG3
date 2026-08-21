import { describe, expect, it } from 'vitest';
import {
  buildDomainInterpretation
} from './DomainInterpretationBuilder';
import {
  detectDomainConflicts,
  sortDomainEvidence,
  strengthRank
} from './DomainEvidenceRole';
import { calculateEvidenceConfidence } from './EvidenceConfidence';
import { projectDomainInterpretationForAi } from './DomainInterpretationAiProjection';

describe('DomainInterpretationBuilder', () => {
  it('builds a valid DomainInterpretation', () => {
    const interpretation = buildDomainInterpretation({
      domain: 'CAREER',
      evidence: [
        {
          id: 'CAREER-001',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: '10th lord strong in own house.',
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 90,
          relatedEvidenceIds: []
        }
      ],
      natalPromise: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Strong career promise.',
        evidenceIds: ['CAREER-001'],
        supportingEvidenceIds: ['CAREER-001'],
        challengingEvidenceIds: []
      },
      dashaActivation: {
        domain: 'CAREER',
        active: false,
        effect: 'DOES_NOT_ACTIVATE',
        strength: 'UNDETERMINED',
        confidence: 'UNDETERMINED',
        statement: 'No active dasha.',
        evidenceIds: [],
        activatedPromiseEvidenceIds: []
      },
      transitTrigger: {
        domain: 'CAREER',
        active: false,
        effect: 'NO_MATERIAL_TRIGGER',
        strength: 'UNDETERMINED',
        confidence: 'UNDETERMINED',
        statement: 'No active transit.',
        evidenceIds: [],
        triggeredPromiseEvidenceIds: []
      },
      vargaConfirmations: [
        {
          domain: 'CAREER',
          varga: 'D10',
          relationship: 'CONFIRMS',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: 'D10 confirms career status.',
          evidenceIds: []
        }
      ],
      manifestations: [
        {
          mode: 'LEADERSHIP',
          confidence: 'HIGH',
          statement: 'High leadership potential.',
          evidenceIds: ['CAREER-001']
        }
      ],
      conflicts: [],
      conclusion: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Career conclusion is strong.',
        primaryEvidenceIds: ['CAREER-001'],
        supportingEvidenceIds: ['CAREER-001'],
        challengingEvidenceIds: [],
        unresolvedQuestions: []
      }
    });

    expect(interpretation.version).toBe('V2');
    expect(interpretation.domain).toBe('CAREER');
    expect(interpretation.evidence).toHaveLength(1);
  });

  it('rejects mismatched natal promise domain', () => {
    expect(() =>
      buildDomainInterpretation({
        domain: 'CAREER',
        evidence: [],
        natalPromise: {
          domain: 'WEALTH',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: '...',
          evidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        dashaActivation: {
          domain: 'CAREER',
          active: false,
          effect: 'DOES_NOT_ACTIVATE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
          evidenceIds: [],
          activatedPromiseEvidenceIds: []
        },
        transitTrigger: {
          domain: 'CAREER',
          active: false,
          effect: 'NO_MATERIAL_TRIGGER',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
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
          statement: '...',
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: []
        }
      })
    ).toThrow('Natal promise domain does not match interpretation domain.');
  });

  it('rejects mismatched dasha activation domain', () => {
    expect(() =>
      buildDomainInterpretation({
        domain: 'CAREER',
        evidence: [],
        natalPromise: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: '...',
          evidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        dashaActivation: {
          domain: 'WEALTH',
          active: false,
          effect: 'DOES_NOT_ACTIVATE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
          evidenceIds: [],
          activatedPromiseEvidenceIds: []
        },
        transitTrigger: {
          domain: 'CAREER',
          active: false,
          effect: 'NO_MATERIAL_TRIGGER',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
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
          statement: '...',
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: []
        }
      })
    ).toThrow('Dasha activation domain does not match interpretation domain.');
  });

  it('rejects mismatched varga confirmation domain', () => {
    expect(() =>
      buildDomainInterpretation({
        domain: 'CAREER',
        evidence: [],
        natalPromise: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: '...',
          evidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        dashaActivation: {
          domain: 'CAREER',
          active: false,
          effect: 'DOES_NOT_ACTIVATE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
          evidenceIds: [],
          activatedPromiseEvidenceIds: []
        },
        transitTrigger: {
          domain: 'CAREER',
          active: false,
          effect: 'NO_MATERIAL_TRIGGER',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
          evidenceIds: [],
          triggeredPromiseEvidenceIds: []
        },
        vargaConfirmations: [
          {
            domain: 'WEALTH',
            varga: 'D10',
            relationship: 'CONFIRMS',
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: '...',
            evidenceIds: []
          }
        ],
        manifestations: [],
        conflicts: [],
        conclusion: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: '...',
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: []
        }
      })
    ).toThrow('Varga confirmation domain does not match interpretation domain.');
  });

  it('rejects empty manifestation statement', () => {
    expect(() =>
      buildDomainInterpretation({
        domain: 'CAREER',
        evidence: [],
        natalPromise: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: '...',
          evidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: []
        },
        dashaActivation: {
          domain: 'CAREER',
          active: false,
          effect: 'DOES_NOT_ACTIVATE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
          evidenceIds: [],
          activatedPromiseEvidenceIds: []
        },
        transitTrigger: {
          domain: 'CAREER',
          active: false,
          effect: 'NO_MATERIAL_TRIGGER',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '...',
          evidenceIds: [],
          triggeredPromiseEvidenceIds: []
        },
        vargaConfirmations: [],
        manifestations: [
          {
            mode: 'LEADERSHIP',
            confidence: 'HIGH',
            statement: '   ',
            evidenceIds: []
          }
        ],
        conflicts: [],
        conclusion: {
          domain: 'CAREER',
          strength: 'STRONG',
          confidence: 'HIGH',
          statement: '...',
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          unresolvedQuestions: []
        }
      })
    ).toThrow('Domain manifestation statement cannot be empty.');
  });
});

describe('detectDomainConflicts', () => {
  it('detects supporting and challenging evidence', () => {
    const conflicts = detectDomainConflicts('CAREER', [
      {
        id: 'CAREER-001',
        sourceType: 'LORDSHIP',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Strong career lord support.',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 90,
        relatedEvidenceIds: []
      },
      {
        id: 'CAREER-002',
        sourceType: 'VARGA',
        domain: 'CAREER',
        role: 'CONFIRMATION',
        phase: 'VARGA_CONFIRMATION',
        source: 'D10',
        statement: 'D10 shows significant affliction.',
        polarity: 'CHALLENGING',
        strength: 'STRONG',
        priority: 80,
        relatedEvidenceIds: []
      }
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].domain).toBe('CAREER');
    expect(conflicts[0].positiveEvidenceIds).toContain('CAREER-001');
    expect(conflicts[0].negativeEvidenceIds).toContain('CAREER-002');
  });

  it('returns empty conflicts when only supporting evidence is present', () => {
    const conflicts = detectDomainConflicts('CAREER', [
      {
        id: 'CAREER-001',
        sourceType: 'LORDSHIP',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Strong career lord support.',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 90,
        relatedEvidenceIds: []
      }
    ]);

    expect(conflicts).toHaveLength(0);
  });
});

describe('sortDomainEvidence', () => {
  it('sorts deterministically by priority descending then strength descending', () => {
    const sorted = sortDomainEvidence([
      {
        id: 'E1',
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'SECONDARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Moderate priority 50',
        polarity: 'SUPPORTING',
        strength: 'MODERATE',
        priority: 50,
        relatedEvidenceIds: []
      },
      {
        id: 'E2',
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Primary priority 90 weak',
        polarity: 'SUPPORTING',
        strength: 'WEAK',
        priority: 90,
        relatedEvidenceIds: []
      },
      {
        id: 'E3',
        sourceType: 'HOUSE',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Primary priority 90 strong',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 90,
        relatedEvidenceIds: []
      }
    ]);

    expect(sorted[0].id).toBe('E3');
    expect(sorted[1].id).toBe('E2');
    expect(sorted[2].id).toBe('E1');
  });
});

describe('calculateEvidenceConfidence', () => {
  it('returns UNDETERMINED for empty evidence', () => {
    expect(calculateEvidenceConfidence([])).toBe('UNDETERMINED');
  });

  it('calculates VERY_HIGH confidence for strong high priority evidence', () => {
    expect(
      calculateEvidenceConfidence([
        {
          id: 'E1',
          sourceType: 'LORDSHIP',
          domain: 'CAREER',
          role: 'PRIMARY',
          phase: 'NATAL_PROMISE',
          source: 'D1',
          statement: 'Strong 1',
          polarity: 'SUPPORTING',
          strength: 'VERY_STRONG',
          priority: 90,
          relatedEvidenceIds: []
        }
      ])
    ).toBe('VERY_HIGH');
  });
});

describe('projectDomainInterpretationForAi', () => {
  it('creates clean AI projection preserving boundaries', () => {
    const interpretation = buildDomainInterpretation({
      domain: 'CAREER',
      evidence: [],
      natalPromise: {
        domain: 'CAREER',
        strength: 'STRONG',
        confidence: 'HIGH',
        statement: 'Strong promise.',
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
        statement: 'Dasha active.',
        evidenceIds: [],
        activatedPromiseEvidenceIds: []
      },
      transitTrigger: {
        domain: 'CAREER',
        active: false,
        effect: 'NO_MATERIAL_TRIGGER',
        strength: 'UNDETERMINED',
        confidence: 'UNDETERMINED',
        statement: 'No transit.',
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
        statement: 'Final career synthesis.',
        primaryEvidenceIds: ['E1', 'E2'],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        unresolvedQuestions: []
      }
    });

    const projection = projectDomainInterpretationForAi(interpretation);
    expect(projection.domain).toBe('CAREER');
    expect(projection.natalPromise.strength).toBe('STRONG');
    expect(projection.dashaActivation.active).toBe(true);
    expect(projection.transitTrigger.active).toBe(false);
    expect(projection.conclusion.statement).toBe('Final career synthesis.');
    expect(projection.evidenceIds).toEqual(['E1', 'E2']);
  });
});
