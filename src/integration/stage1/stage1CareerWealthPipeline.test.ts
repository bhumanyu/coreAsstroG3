import { describe, expect, it } from 'vitest';
import { runStage1Integration } from './stage1IntegrationHarness';
import {
  STAGE1_GOLDEN_INPUT,
  STAGE1_GOLDEN_HOROSCOPE
} from './stage1GoldenFixture';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { projectDomainInterpretationForAi } from '../../domain/interpretation/DomainInterpretationAiProjection';
import type { DomainInterpretationAiProjection } from '../../domain/interpretation/DomainInterpretationAiProjection';

describe('Stage-1 Career & Wealth Pipeline Integration', () => {
  it('projects Career V2 and Wealth V2 into AiContext with full structural fidelity', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    expect(result.aiContext.domainInterpretations).toBeDefined();
    expect(result.aiContext.domainInterpretations?.length).toBeGreaterThanOrEqual(2);

    const projectedCareer = result.aiContext.domainInterpretations?.find(
      (d) => d.domain === 'CAREER'
    );
    const projectedWealth = result.aiContext.domainInterpretations?.find(
      (d) => d.domain === 'WEALTH'
    );

    expect(projectedCareer).toBeDefined();
    expect(projectedWealth).toBeDefined();

    // Verify all required projection sections are populated for Career
    expect(projectedCareer?.natalPromise).toBeDefined();
    expect(projectedCareer?.natalPromise.strength).toBeDefined();
    expect(projectedCareer?.natalPromise.statement.length).toBeGreaterThan(0);
    expect(projectedCareer?.dashaActivation).toBeDefined();
    expect(typeof projectedCareer?.dashaActivation.active).toBe('boolean');
    expect(projectedCareer?.transitTrigger).toBeDefined();
    expect(typeof projectedCareer?.transitTrigger.active).toBe('boolean');
    expect(projectedCareer?.conclusion).toBeDefined();
    expect(projectedCareer?.conclusion.strength).toBeDefined();
    expect(projectedCareer?.conclusion.confidence).toBeDefined();
    expect(projectedCareer?.conclusion.statement.length).toBeGreaterThan(0);
    expect(projectedCareer?.vargaConfirmations).toBeDefined();
    expect(Array.isArray(projectedCareer?.vargaConfirmations)).toBe(true);
    expect(projectedCareer?.manifestations).toBeDefined();
    expect(Array.isArray(projectedCareer?.manifestations)).toBe(true);
    expect(projectedCareer?.evidenceIds).toBeDefined();

    // Verify all required projection sections are populated for Wealth
    expect(projectedWealth?.natalPromise).toBeDefined();
    expect(projectedWealth?.natalPromise.strength).toBeDefined();
    expect(projectedWealth?.natalPromise.statement.length).toBeGreaterThan(0);
    expect(projectedWealth?.dashaActivation).toBeDefined();
    expect(typeof projectedWealth?.dashaActivation.active).toBe('boolean');
    expect(projectedWealth?.transitTrigger).toBeDefined();
    expect(typeof projectedWealth?.transitTrigger.active).toBe('boolean');
    expect(projectedWealth?.conclusion).toBeDefined();
    expect(projectedWealth?.conclusion.strength).toBeDefined();
    expect(projectedWealth?.conclusion.confidence).toBeDefined();
    expect(projectedWealth?.conclusion.statement.length).toBeGreaterThan(0);
    expect(projectedWealth?.vargaConfirmations).toBeDefined();
    expect(Array.isArray(projectedWealth?.vargaConfirmations)).toBe(true);
    expect(projectedWealth?.manifestations).toBeDefined();
    expect(Array.isArray(projectedWealth?.manifestations)).toBe(true);
    expect(projectedWealth?.evidenceIds).toBeDefined();
  });

  it('proves deterministic equality between direct projection and aiContext.domainInterpretations', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    // Direct domain interpretation and projection
    const directCareer = interpretCareerV2(STAGE1_GOLDEN_HOROSCOPE);
    const directWealth = interpretWealthV2(STAGE1_GOLDEN_HOROSCOPE);

    const expectedCareerProjection = projectDomainInterpretationForAi(directCareer);
    const expectedWealthProjection = projectDomainInterpretationForAi(directWealth);

    const contextCareer = result.aiContext.domainInterpretations?.find(
      (d) => d.domain === 'CAREER'
    );
    const contextWealth = result.aiContext.domainInterpretations?.find(
      (d) => d.domain === 'WEALTH'
    );

    // Assert exact deterministic equivalence (no divergent recomputation)
    expect(contextCareer).toEqual(expectedCareerProjection);
    expect(contextWealth).toEqual(expectedWealthProjection);
  });

  it('guarantees single canonical results with no divergent recomputation across repeated runs', async () => {
    const run1 = await runStage1Integration(STAGE1_GOLDEN_INPUT);
    const run2 = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    expect(run1.career.conclusion.statement).toBe(run2.career.conclusion.statement);
    expect(run1.career.natalPromise.strength).toBe(run2.career.natalPromise.strength);
    expect(run1.wealth.conclusion.statement).toBe(run2.wealth.conclusion.statement);
    expect(run1.wealth.natalPromise.strength).toBe(run2.wealth.natalPromise.strength);

    expect(run1.aiContext.domainInterpretations).toEqual(run2.aiContext.domainInterpretations);
  });
});
