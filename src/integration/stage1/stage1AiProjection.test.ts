import { describe, expect, it } from 'vitest';
import { projectDomainInterpretationForAi } from '../../domain/interpretation/DomainInterpretationAiProjection';
import {
  buildSpeculationChallengedWealthInterpretation,
  buildIncompleteCareerInterpretation,
  buildIncompleteWealthInterpretation,
  buildHighPressureCareerInterpretation,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH,
  STAGE1_GOLDEN_INPUT,
  STAGE1_GOLDEN_EXPECTATION
} from './stage1GoldenFixture';
import { runStage1Integration } from './stage1IntegrationHarness';

describe('Stage-1 AI Projection Integration', () => {
  it('preserves speculation dimension separation through AI projection', () => {
    const wealthScenario = buildSpeculationChallengedWealthInterpretation();
    const projected = projectDomainInterpretationForAi(wealthScenario);

    const conclusionData = projected.conclusion.conclusionData as Record<string, unknown> | undefined;
    expect(conclusionData).toBeDefined();

    // Speculation must be CHALLENGED
    expect(conclusionData?.speculationStatus).toBe('CHALLENGED');

    // Overall status must remain SUPPORTED or STRONGLY_SUPPORTED
    expect(
      conclusionData?.overallStatus === 'SUPPORTED' ||
      conclusionData?.overallStatus === 'STRONGLY_SUPPORTED'
    ).toBe(true);

    // Accumulation and Gains must be strongly supported
    expect(conclusionData?.accumulationStatus).toBe('STRONGLY_SUPPORTED');
    expect(conclusionData?.gainsStatus).toBe('STRONGLY_SUPPORTED');
  });

  it('preserves D2 and D10 varga confirmations without degradation or loss', () => {
    const careerWithD10 = buildHighPressureCareerInterpretation();
    const wealthWithD2 = buildSpeculationChallengedWealthInterpretation();

    const projectedCareer = projectDomainInterpretationForAi(careerWithD10);
    const projectedWealth = projectDomainInterpretationForAi(wealthWithD2);

    const d10Conf = projectedCareer.vargaConfirmations.find((v) => v.varga === 'D10');
    expect(d10Conf).toBeDefined();
    expect(d10Conf?.relationship).toBe('CONFIRMS');

    const d2Conf = projectedWealth.vargaConfirmations.find((v) => v.varga === 'D2');
    expect(d2Conf).toBeDefined();
    expect(d2Conf?.relationship).toBe('CONFIRMS');
  });

  it('preserves Dasha timing and per-dimension activation effects distinctly', () => {
    const wealthScenario = buildSpeculationChallengedWealthInterpretation();
    const projectedWealth = projectDomainInterpretationForAi(wealthScenario);
    const conclusionData = projectedWealth.conclusion.conclusionData as Record<string, unknown> | undefined;

    expect(projectedWealth.dashaActivation).toBeDefined();
    expect(projectedWealth.dashaActivation.active).toBe(true);
    expect(projectedWealth.dashaActivation.effect).toBeDefined();

    // Dimension-specific Dasha effects are preserved distinctly
    expect(conclusionData?.accumulationDashaEffect).toBe('ACTIVATES');
    expect(conclusionData?.gainsDashaEffect).toBe('DOES_NOT_ACTIVATE');
  });

  it('guarantees deterministic Dasha=ACTIVATES and Transit=CHALLENGE effects survive AI projection', () => {
    // High-pressure career scenario: Dasha ACTIVATES executive authority, but Saturn transit CHALLENGES (effect: CHALLENGE) 10H
    const highPressure = buildHighPressureCareerInterpretation();

    // 1. Validate raw domain interpretation effects
    expect(highPressure.dashaActivation.effect).toBe('ACTIVATES');
    expect(highPressure.transitTrigger.effect).toBe('CHALLENGE');

    // 2. Perform AI projection
    const projectedCareer = projectDomainInterpretationForAi(highPressure);

    // 3. Assert exact deterministic preservation of effects across projection boundary
    expect(projectedCareer.dashaActivation.effect).toBe('ACTIVATES');
    expect(projectedCareer.transitTrigger.effect).toBe('CHALLENGE');
    expect(projectedCareer.dashaActivation.active).toBe(true);
    expect(projectedCareer.transitTrigger.active).toBe(true);
  });

  it('preserves golden horoscope Dasha and Transit effects through AI projection', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

    const projectedCareer = result.aiContext.domainInterpretations?.find(
      (d) => d.domain === 'CAREER'
    );
    const projectedWealth = result.aiContext.domainInterpretations?.find(
      (d) => d.domain === 'WEALTH'
    );

    expect(projectedCareer).toBeDefined();
    expect(projectedWealth).toBeDefined();

    expect(projectedCareer?.dashaActivation.effect).toBe(
      STAGE1_GOLDEN_EXPECTATION.career.dashaEffect
    );
    expect(projectedCareer?.transitTrigger.effect).toBe(
      STAGE1_GOLDEN_EXPECTATION.career.transitEffect
    );

    expect(projectedWealth?.dashaActivation.effect).toBe(
      STAGE1_GOLDEN_EXPECTATION.wealth.dashaEffect
    );
    expect(projectedWealth?.transitTrigger.effect).toBe(
      STAGE1_GOLDEN_EXPECTATION.wealth.transitEffect
    );
  });

  it('preserves UNAVAILABLE and INSUFFICIENT_DATA states without inventing confirmations', () => {
    const incompleteCareer = buildIncompleteCareerInterpretation();
    const incompleteWealth = buildIncompleteWealthInterpretation();

    const projectedCareer = projectDomainInterpretationForAi(incompleteCareer);
    const projectedWealth = projectDomainInterpretationForAi(incompleteWealth);

    // Career D10 is UNAVAILABLE, not fabricated
    const careerD10 = projectedCareer.vargaConfirmations.find((v) => v.varga === 'D10');
    expect(careerD10?.relationship).toBe('UNAVAILABLE');
    expect(projectedCareer.dashaActivation.effect).toBe('INSUFFICIENT_DATA');

    // Wealth D2 is UNAVAILABLE, not fabricated
    const wealthD2 = projectedWealth.vargaConfirmations.find((v) => v.varga === 'D2');
    expect(wealthD2?.relationship).toBe('UNAVAILABLE');
    expect(projectedWealth.dashaActivation.effect).toBe('INSUFFICIENT_DATA');
  });

  it('preserves evidence IDs without inflation or fabrication in full pipeline integration', async () => {
    const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);
    const aiEvidenceIds = new Set(result.aiContext.evidence.map((e) => e.id));

    // Check all projected domain evidence IDs exist in AiContext.evidence
    for (const domainInterp of result.aiContext.domainInterpretations ?? []) {
      for (const id of domainInterp.evidenceIds) {
        expect(
          aiEvidenceIds.has(id),
          `Domain ${domainInterp.domain} projected evidence ID '${id}' not found in AiContext.evidence`
        ).toBe(true);
      }
    }
  });

  it('preserves high pressure career status without premature conclusion downgrade', () => {
    const highPressure = buildHighPressureCareerInterpretation();
    const projected = projectDomainInterpretationForAi(highPressure);

    expect(projected.natalPromise.strength).toBe('VERY_STRONG');
    expect(projected.conclusion.strength).toBe('VERY_STRONG');

    const conclusionData = projected.conclusion.conclusionData as Record<string, unknown> | undefined;
    expect(conclusionData?.currentPressure).toBe('HIGH');
    expect(conclusionData?.currentActivation).toBe('ACTIVE');
  });
});
