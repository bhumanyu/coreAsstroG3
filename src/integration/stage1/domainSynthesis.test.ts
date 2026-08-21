import { describe, it, expect } from 'vitest';
import {
  buildLifeAnalysis,
  assertLifeAnalysisTraceability
} from '../../domain/synthesis';
import {
  createDomainInterpretation,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createDomainConclusion,
  createDomainEvidence
} from '../../domain/interpretation';

describe('Domain Synthesis (P-028)', () => {
  function makeCareerStrong() {
    return createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({
        strength: 'VERY_STRONG',
        supportingEvidenceIds: ['CAREER:E1'],
        challengingEvidenceIds: []
      }),
      dashaActivation: createDashaActivation({
        effect: 'ACTIVATES',
        evidenceIds: ['CAREER:D1']
      }),
      transitTrigger: createTransitTrigger({
        effect: 'TRIGGER',
        evidenceIds: ['CAREER:T1']
      }),
      conclusion: createDomainConclusion({
        statement: 'Career is strongly supported.',
        confidence: 'HIGH'
      }),
      evidence: [createDomainEvidence({ id: 'CAREER:E1', sourceType: 'HOUSE' })],
      conclusionData: { natalStatus: 'VERY_STRONG' }
    });
  }

  function makeWealthSupported() {
    return createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({
        strength: 'STRONG',
        supportingEvidenceIds: ['WEALTH:E1'],
        challengingEvidenceIds: ['WEALTH:E2']
      }),
      dashaActivation: createDashaActivation({
        effect: 'CHALLENGES',
        evidenceIds: ['WEALTH:D1']
      }),
      transitTrigger: createTransitTrigger({
        effect: 'CHALLENGE',
        evidenceIds: ['WEALTH:T1']
      }),
      conclusion: createDomainConclusion({
        statement: 'Wealth is supported overall, speculation challenged.',
        confidence: 'HIGH'
      }),
      evidence: [
        createDomainEvidence({ id: 'WEALTH:E1', sourceType: 'HOUSE' }),
        createDomainEvidence({ id: 'WEALTH:E2', sourceType: 'HOUSE' })
      ],
      conclusionData: { overallStatus: 'SUPPORTED' }
    });
  }

  it('should identify strongest domains', () => {
    const career = makeCareerStrong();
    const wealth = makeWealthSupported();

    const analysis = buildLifeAnalysis([career, wealth]);

    expect(analysis.strongestDomains).toContain('CAREER');
    expect(analysis.strongestDomains).toContain('WEALTH');
    expect(analysis.conclusion.status).toBe('MIXED'); // Career strong, Wealth challenged
  });

  it('should detect shared timing conflict', () => {
    const career = makeCareerStrong();
    const wealth = makeWealthSupported();

    const analysis = buildLifeAnalysis([career, wealth]);

    const timingConflicts = analysis.conflicts.filter(
      (c) => c.type === 'DOMAIN_VS_TIMING'
    );
    expect(timingConflicts.length).toBeGreaterThan(0);
    expect(timingConflicts[0].evidenceIds).toContain('CAREER:D1');
    expect(timingConflicts[0].evidenceIds).toContain('WEALTH:D1');
  });

  it('should enforce evidence traceability', () => {
    const career = makeCareerStrong();
    const wealth = makeWealthSupported();

    const analysis = buildLifeAnalysis([career, wealth]);

    // Should not throw
    expect(() =>
      assertLifeAnalysisTraceability(analysis, [career, wealth])
    ).not.toThrow();

    // Inject rogue evidence id
    const badAnalysis = {
      ...analysis,
      evidenceIds: [...analysis.evidenceIds, 'FAKE-ID']
    };
    expect(() =>
      assertLifeAnalysisTraceability(badAnalysis, [career, wealth])
    ).toThrow();
  });

  it('should handle missing domains gracefully', () => {
    const career = makeCareerStrong();

    const analysis = buildLifeAnalysis([career]);

    expect(analysis.dataCompleteness.overall).toBe('PARTIAL');
    expect(analysis.confidence).toBe('LOW');
  });

  it('should handle no domains', () => {
    const analysis = buildLifeAnalysis([]);

    expect(analysis.dataCompleteness.overall).toBe('INSUFFICIENT_DATA');
    expect(analysis.confidence).toBe('VERY_LOW');
  });
});
