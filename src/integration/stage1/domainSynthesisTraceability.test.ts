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

describe('Domain Synthesis Traceability (P-028)', () => {
  function makeMockInterpretations() {
    const career = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({
        strength: 'STRONG',
        supportingEvidenceIds: ['CAREER:NP:1', 'CAREER:NP:2'],
        challengingEvidenceIds: []
      }),
      dashaActivation: createDashaActivation({
        effect: 'ACTIVATES',
        evidenceIds: ['CAREER:DA:1']
      }),
      transitTrigger: createTransitTrigger({
        effect: 'TRIGGER',
        evidenceIds: ['CAREER:TT:1']
      }),
      conclusion: createDomainConclusion({
        statement: 'Career is solid.',
        confidence: 'HIGH'
      }),
      evidence: [
        createDomainEvidence({ id: 'CAREER:NP:1', sourceType: 'HOUSE' }),
        createDomainEvidence({ id: 'CAREER:NP:2', sourceType: 'LORDSHIP' }),
        createDomainEvidence({ id: 'CAREER:DA:1', sourceType: 'DASHA' }),
        createDomainEvidence({ id: 'CAREER:TT:1', sourceType: 'TRANSIT' })
      ],
      conclusionData: { natalStatus: 'STRONG' }
    });

    const wealth = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({
        strength: 'STRONG',
        supportingEvidenceIds: ['WEALTH:NP:1'],
        challengingEvidenceIds: ['WEALTH:NP:CH']
      }),
      dashaActivation: createDashaActivation({
        effect: 'CHALLENGES',
        evidenceIds: ['WEALTH:DA:1']
      }),
      transitTrigger: createTransitTrigger({
        effect: 'CHALLENGE',
        evidenceIds: ['WEALTH:TT:1']
      }),
      conclusion: createDomainConclusion({
        statement: 'Wealth supported with timing pressures.',
        confidence: 'HIGH'
      }),
      evidence: [
        createDomainEvidence({ id: 'WEALTH:NP:1', sourceType: 'HOUSE' }),
        createDomainEvidence({ id: 'WEALTH:NP:CH', sourceType: 'HOUSE' }),
        createDomainEvidence({ id: 'WEALTH:DA:1', sourceType: 'DASHA' }),
        createDomainEvidence({ id: 'WEALTH:TT:1', sourceType: 'TRANSIT' })
      ],
      conclusionData: { overallStatus: 'SUPPORTED' }
    });

    return [career, wealth] as const;
  }

  it('passes strict traceability check for genuine synthesis result', () => {
    const [career, wealth] = makeMockInterpretations();
    const analysis = buildLifeAnalysis([career, wealth]);

    expect(() =>
      assertLifeAnalysisTraceability(analysis, [career, wealth])
    ).not.toThrow();

    expect(analysis.evidenceIds.length).toBeGreaterThan(0);
  });

  it('fails traceability check when top-level evidenceIds contains hallucinated ID', () => {
    const [career, wealth] = makeMockInterpretations();
    const analysis = buildLifeAnalysis([career, wealth]);

    const corrupted = {
      ...analysis,
      evidenceIds: [...analysis.evidenceIds, 'HALLUCINATED:EVID:999']
    };

    expect(() =>
      assertLifeAnalysisTraceability(corrupted, [career, wealth])
    ).toThrowError(/Traceability failure: unrecognized evidence ID/);
  });

  it('fails traceability check when domain summary contains invalid supportingEvidenceIds', () => {
    const [career, wealth] = makeMockInterpretations();
    const analysis = buildLifeAnalysis([career, wealth]);

    const corrupted = {
      ...analysis,
      domains: [
        {
          ...analysis.domains[0],
          supportingEvidenceIds: ['ROGUE:CAREER:ID']
        },
        ...analysis.domains.slice(1)
      ]
    };

    expect(() =>
      assertLifeAnalysisTraceability(corrupted, [career, wealth])
    ).toThrowError(/Traceability failure: unrecognized evidence ID/);
  });

  it('fails traceability check when shared timing contains invalid evidence ID', () => {
    const [career, wealth] = makeMockInterpretations();
    const analysis = buildLifeAnalysis([career, wealth]);

    if (analysis.sharedTiming.length > 0) {
      const corrupted = {
        ...analysis,
        sharedTiming: [
          {
            ...analysis.sharedTiming[0],
            evidenceIds: ['ROGUE:TIMING:ID']
          }
        ]
      };

      expect(() =>
        assertLifeAnalysisTraceability(corrupted, [career, wealth])
      ).toThrowError(/Traceability failure: unrecognized evidence ID/);
    }
  });

  it('fails traceability check when conflict contains invalid evidence ID', () => {
    const [career, wealth] = makeMockInterpretations();
    const analysis = buildLifeAnalysis([career, wealth]);

    if (analysis.conflicts.length > 0) {
      const corrupted = {
        ...analysis,
        conflicts: [
          {
            ...analysis.conflicts[0],
            evidenceIds: ['ROGUE:CONFLICT:ID']
          }
        ]
      };

      expect(() =>
        assertLifeAnalysisTraceability(corrupted, [career, wealth])
      ).toThrowError(/Traceability failure: unrecognized evidence ID/);
    }
  });
});
