import { describe, it, expect } from 'vitest';
import {
  buildLifeAnalysis,
  projectLifeAnalysisForAi
} from '../../domain/synthesis';
import {
  createDomainInterpretation,
  createNatalPromise,
  createDashaActivation,
  createTransitTrigger,
  createDomainConclusion,
  createDomainEvidence
} from '../../domain/interpretation';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { STAGE1_GOLDEN_HOROSCOPE } from './stage1GoldenFixture';
import { forbiddenAiContextKeys } from '../../ai/context/aiContextPrivacy';

describe('Domain Synthesis AI Projection (P-028)', () => {
  function makeMockInterpretations() {
    const career = createDomainInterpretation({
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
        statement: 'Executive career supported.',
        confidence: 'HIGH'
      }),
      evidence: [createDomainEvidence({ id: 'CAREER:E1' })],
      conclusionData: { natalStatus: 'VERY_STRONG' }
    });

    const wealth = createDomainInterpretation({
      domain: 'WEALTH',
      natalPromise: createNatalPromise({
        strength: 'STRONG',
        supportingEvidenceIds: ['WEALTH:E1'],
        challengingEvidenceIds: []
      }),
      dashaActivation: createDashaActivation({
        effect: 'ACTIVATES',
        evidenceIds: ['WEALTH:D1']
      }),
      transitTrigger: createTransitTrigger({
        effect: 'TRIGGER',
        evidenceIds: ['WEALTH:T1']
      }),
      conclusion: createDomainConclusion({
        statement: 'Solid wealth foundation.',
        confidence: 'HIGH'
      }),
      evidence: [createDomainEvidence({ id: 'WEALTH:E1' })],
      conclusionData: { overallStatus: 'SUPPORTED' }
    });

    return [career, wealth] as const;
  }

  it('correctly projects LifeAnalysis into LifeAnalysisAiProjection format', () => {
    const [career, wealth] = makeMockInterpretations();
    const analysis = buildLifeAnalysis([career, wealth]);
    const projection = projectLifeAnalysisForAi(analysis);

    expect(projection.status).toBe(analysis.conclusion.status);
    expect(projection.overallStatement).toBe(analysis.conclusion.statement);
    expect(projection.strongestDomains).toEqual(analysis.strongestDomains);
    expect(projection.challengedDomains).toEqual(analysis.challengedDomains);
    expect(projection.confidence).toBe(analysis.confidence);
    expect(projection.completeness).toBe(analysis.dataCompleteness.overall);
    expect(projection.sharedTimingCount).toBe(analysis.sharedTiming.length);
    expect(projection.conflictCount).toBe(analysis.conflicts.length);
    expect(projection.domainSummaries.length).toBe(2);

    expect(projection.domainSummaries[0].domain).toBe('CAREER');
    expect(projection.domainSummaries[0].strength).toBe('VERY_STRONG');
    expect(projection.domainSummaries[0].primaryConclusion).toBe(
      'Executive career supported.'
    );

    expect(projection.domainSummaries[1].domain).toBe('WEALTH');
    expect(projection.domainSummaries[1].strength).toBe('STRONG');
    expect(projection.domainSummaries[1].primaryConclusion).toBe(
      'Solid wealth foundation.'
    );

    expect(projection.evidenceIds).toEqual(analysis.evidenceIds);
  });

  it('embeds lifeAnalysis inside AiContext when built from canonical horoscope', () => {
    const aiContext = buildAiContext(STAGE1_GOLDEN_HOROSCOPE);

    expect(aiContext.lifeAnalysis).toBeDefined();
    expect(aiContext.lifeAnalysis?.status).toBeDefined();
    expect(aiContext.lifeAnalysis?.overallStatement.length).toBeGreaterThan(0);
    expect(aiContext.lifeAnalysis?.domainSummaries.length).toBe(2);
    expect(aiContext.lifeAnalysis?.completeness).toBe('COMPLETE');
    expect(aiContext.lifeAnalysis?.confidence).toBe('HIGH');
  });

  it('ensures projected lifeAnalysis contains no forbidden privacy keys', () => {
    const aiContext = buildAiContext(STAGE1_GOLDEN_HOROSCOPE);
    const lifeAnalysisJson = JSON.stringify(aiContext.lifeAnalysis);

    for (const forbiddenKey of forbiddenAiContextKeys) {
      expect(lifeAnalysisJson.includes(`"${forbiddenKey}"`)).toBe(false);
    }
  });
});
