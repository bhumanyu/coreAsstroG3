import { describe, expect, it } from 'vitest';
import { runStage1Integration, buildStage1UiModel } from './stage1IntegrationHarness';
import {
  STAGE1_GOLDEN_INPUT,
  STAGE1_GOLDEN_EXPECTATION,
  STAGE1_GOLDEN_CAREER,
  buildSpeculationChallengedWealthInterpretation,
  buildIncompleteCareerInterpretation,
  buildIncompleteWealthInterpretation,
  buildHighPressureCareerInterpretation
} from './stage1GoldenFixture';
import { assertStage1Traceability } from './stage1Traceability';
import { projectDomainInterpretationForAi } from '../../domain/interpretation/DomainInterpretationAiProjection';
import type { Stage1IntegrationResult } from './stage1IntegrationTypes';

describe('Stage-1 Presentation ViewModel & Master End-to-End Suite', () => {
  describe('Master End-to-End Pipeline (§30)', () => {
    it('executes full Stage-1 pipeline: Horoscope -> Domain V2 -> AI Context -> Router -> Explanation -> UI Model', async () => {
      const result = await runStage1Integration(STAGE1_GOLDEN_INPUT);

      // 1. Domain Status Assertions
      expect(result.career.natalPromise.strength).toBe(
        STAGE1_GOLDEN_EXPECTATION.career.natalStatus
      );
      expect(result.career.dashaActivation.effect).toBe(
        STAGE1_GOLDEN_EXPECTATION.career.dashaEffect
      );
      expect(result.career.transitTrigger.effect).toBe(
        STAGE1_GOLDEN_EXPECTATION.career.transitEffect
      );
      const d10Confirmation = result.career.vargaConfirmations.find(
        (v) => v.varga === 'D10'
      );
      expect(d10Confirmation?.relationship ?? 'UNAVAILABLE').toBe(
        STAGE1_GOLDEN_EXPECTATION.career.d10Relationship
      );

      expect(result.wealth.dashaActivation.effect).toBe(
        STAGE1_GOLDEN_EXPECTATION.wealth.dashaEffect
      );
      expect(result.wealth.transitTrigger.effect).toBe(
        STAGE1_GOLDEN_EXPECTATION.wealth.transitEffect
      );
      const d2Confirmation = result.wealth.vargaConfirmations.find(
        (v) => v.varga === 'D2'
      );
      expect(d2Confirmation?.relationship ?? 'UNAVAILABLE').toBe(
        STAGE1_GOLDEN_EXPECTATION.wealth.d2Relationship
      );

      // 2. AI Projection Assertions
      expect(result.aiContext.domainInterpretations).toBeDefined();
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

      // 3. Traceability Validation
      assertStage1Traceability(result);

      // 4. UI Contract / Presentation Model Validation
      const uiModel = buildStage1UiModel(result);
      expect(uiModel.career.status).toBeDefined();
      expect(uiModel.career.conclusion.length).toBeGreaterThan(0);
      expect(Array.isArray(uiModel.career.evidence)).toBe(true);

      expect(uiModel.wealth.overallStatus).toBeDefined();
      expect(uiModel.wealth.accumulationStatus).toBeDefined();
      expect(uiModel.wealth.gainsStatus).toBeDefined();
      expect(uiModel.wealth.fortuneStatus).toBeDefined();
      expect(uiModel.wealth.speculationStatus).toBeDefined();
      expect(uiModel.wealth.conclusion.length).toBeGreaterThan(0);
      expect(Array.isArray(uiModel.wealth.evidence)).toBe(true);
    });
  });

  describe('Negative & Incomplete Data Path (§31)', () => {
    it('faithfully preserves UNAVAILABLE and INSUFFICIENT_DATA states across domain, AI, and UI', () => {
      const incompleteCareer = buildIncompleteCareerInterpretation();
      const incompleteWealth = buildIncompleteWealthInterpretation();

      // Verify Career incomplete properties
      const d10Conf = incompleteCareer.vargaConfirmations.find((v) => v.varga === 'D10');
      expect(d10Conf?.relationship).toBe('UNAVAILABLE');
      expect(incompleteCareer.dashaActivation.effect).toBe('INSUFFICIENT_DATA');
      expect(incompleteCareer.transitTrigger.active).toBe(false);

      // Verify Wealth incomplete properties
      const d2Conf = incompleteWealth.vargaConfirmations.find((v) => v.varga === 'D2');
      expect(d2Conf?.relationship).toBe('UNAVAILABLE');
      expect(incompleteWealth.dashaActivation.effect).toBe('INSUFFICIENT_DATA');
      expect(incompleteWealth.transitTrigger.active).toBe(false);

      // Verify AI projection does NOT invent confirmation
      const projectedCareer = projectDomainInterpretationForAi(incompleteCareer);
      const projectedWealth = projectDomainInterpretationForAi(incompleteWealth);

      expect(
        projectedCareer.vargaConfirmations.find((v) => v.varga === 'D10')?.relationship
      ).toBe('UNAVAILABLE');
      expect(
        projectedWealth.vargaConfirmations.find((v) => v.varga === 'D2')?.relationship
      ).toBe('UNAVAILABLE');

      // Verify UI model presentation
      const syntheticIncompleteResult: Stage1IntegrationResult = {
        horoscope: STAGE1_GOLDEN_INPUT.horoscope!,
        career: incompleteCareer,
        wealth: incompleteWealth,
        aiContext: {} as any,
        aiRequest: {} as any,
        routingResult: {} as any,
        explanation: {
          kind: 'SUCCESS',
          requestId: 'incomplete-test-request',
          task: 'CHART_SYNTHESIS',
          status: 'SUCCESS',
          conclusion: 'Incomplete scenario conclusion.',
          supportingEvidence: [],
          challengingEvidence: [],
          unresolvedQuestions: [],
          warnings: [],
          triggeredRuleIds: [],
          providerId: 'local-vedic-rules',
          providerName: 'Local Rules Provider',
          providerKind: 'LOCAL_RULES',
          routingMode: 'LOCAL_ONLY',
          fallbackUsed: false,
          selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
          generatedAt: new Date().toISOString()
        }
      };

      const uiModel = buildStage1UiModel(syntheticIncompleteResult);
      expect(uiModel.wealth.accumulationStatus).toBeDefined();
      expect(uiModel.wealth.speculationStatus).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('High Pressure Career Path (§32)', () => {
    it('maintains STRONGLY_SUPPORTED natal career promise under high transit pressure without premature downgrade', () => {
      const highPressureCareer = buildHighPressureCareerInterpretation();
      const projectedCareer = projectDomainInterpretationForAi(highPressureCareer);

      // Natal promise remains strong
      expect(highPressureCareer.natalPromise.strength).toBe('VERY_STRONG');
      expect(highPressureCareer.conclusion.strength).toBe('VERY_STRONG');

      // Current pressure is HIGH from challenging transit over 10th house
      const conclusionData = highPressureCareer.conclusionData;
      expect(conclusionData?.natalStatus).toBe('VERY_STRONG');
      expect(conclusionData?.currentActivation).toBe('ACTIVE');
      expect(conclusionData?.currentPressure).toBe('HIGH');
      expect(conclusionData?.d10Relationship).toBe('CONFIRMS');

      // AI projection accurately preserves these fields
      const projectedConclusionData = projectedCareer.conclusion.conclusionData as Record<string, unknown>;
      expect(projectedConclusionData?.natalStatus).toBe('VERY_STRONG');
      expect(projectedConclusionData?.currentPressure).toBe('HIGH');
      expect(projectedConclusionData?.currentActivation).toBe('ACTIVE');
    });
  });

  describe('Wealth Speculation Separation Path (§33)', () => {
    it('preserves granular wealth dimensions (Accumulation/Gains STRONGLY_SUPPORTED, Speculation CHALLENGED, D2 CONFIRMS) to UI model', () => {
      const speculationChallengedWealth = buildSpeculationChallengedWealthInterpretation();
      const projectedWealth = projectDomainInterpretationForAi(speculationChallengedWealth);

      // Verify domain conclusion data
      const wealthConclusionData = speculationChallengedWealth.conclusionData;
      expect(wealthConclusionData?.accumulationStatus).toBe('STRONGLY_SUPPORTED');
      expect(wealthConclusionData?.gainsStatus).toBe('STRONGLY_SUPPORTED');
      expect(
        wealthConclusionData?.fortuneStatus === 'SUPPORTED' ||
        wealthConclusionData?.fortuneStatus === 'STRONGLY_SUPPORTED'
      ).toBe(true);
      expect(wealthConclusionData?.speculationStatus).toBe('CHALLENGED');
      expect(wealthConclusionData?.d2Relationship).toBe('CONFIRMS');

      // Overall status remains supported because accumulation + gains + fortune dominate
      expect(
        wealthConclusionData?.overallStatus === 'SUPPORTED' ||
        wealthConclusionData?.overallStatus === 'STRONGLY_SUPPORTED'
      ).toBe(true);

      // Map to UI model
      const syntheticWealthResult: Stage1IntegrationResult = {
        horoscope: STAGE1_GOLDEN_INPUT.horoscope!,
        career: STAGE1_GOLDEN_CAREER,
        wealth: speculationChallengedWealth,
        aiContext: {} as any,
        aiRequest: {} as any,
        routingResult: {} as any,
        explanation: {
          kind: 'SUCCESS',
          requestId: 'wealth-separation-test',
          task: 'CHART_SYNTHESIS',
          status: 'SUCCESS',
          conclusion: 'Wealth separation conclusion.',
          supportingEvidence: [],
          challengingEvidence: [],
          unresolvedQuestions: [],
          warnings: [],
          triggeredRuleIds: [],
          providerId: 'local-vedic-rules',
          providerName: 'Local Rules Provider',
          providerKind: 'LOCAL_RULES',
          routingMode: 'LOCAL_ONLY',
          fallbackUsed: false,
          selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
          generatedAt: new Date().toISOString()
        }
      };

      const uiModel = buildStage1UiModel(syntheticWealthResult);

      // UI ViewModel must reflect separated dimensions directly
      expect(uiModel.wealth.speculationStatus).toBe('CHALLENGED');
      expect(
        uiModel.wealth.overallStatus === 'SUPPORTED' ||
        uiModel.wealth.overallStatus === 'STRONGLY_SUPPORTED'
      ).toBe(true);
      expect(uiModel.wealth.accumulationStatus).toBe('STRONGLY_SUPPORTED');
      expect(uiModel.wealth.gainsStatus).toBe('STRONGLY_SUPPORTED');
      expect(
        uiModel.wealth.fortuneStatus === 'SUPPORTED' ||
        uiModel.wealth.fortuneStatus === 'STRONGLY_SUPPORTED'
      ).toBe(true);
    });
  });
});
