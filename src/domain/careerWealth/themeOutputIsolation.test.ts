import { describe, expect, it, vi } from 'vitest';
import * as careerThemeModule from '../../engine/themeInterpretation/themeInterpretation';
import * as wealthThemeModule from '../../engine/themeInterpretation/wealthThemeInterpretation';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { listSelectableMdAdPeriods } from '../../core/analysis/selectedMdAdPeriod';
import { runLifeAnalysisProduct } from '../../product/life-analysis/lifeAnalysisProductService';
import {
  isCareerDomainInterpretation,
  isWealthDomainInterpretation
} from '../../product/life-analysis/lifeAnalysisTypes';
import { buildProductSelectedPeriodSynthesis } from '../../product/analysis/selectedPeriodProductService';
import { buildProductAiContext } from '../../ai/context/aiContextFactory';
import type { DomainInterpretation } from '../interpretation';

const FIXED_AS_OF = '2026-01-01T00:00:00.000Z';

const methodology = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
} as const;

/*
 * The former Wealth coupling passed interpretWealthTheme().evidence directly through
 * buildWealthEvidence() and linkWealthEvidence(). The canonical path now gets a typed record
 * collection from the shared Wealth evidence producer; the wrapper's presentation result is
 * independently perturbable without affecting reasoning.
 *
 * Wealth decoupling seam for P0-12 (not implemented here): reasoning should consume a
 * producer-owned, typed evidence collection independently of the theme result wrapper. The
 * mapper/linker need stable occurrence ID, rule ID, statement, effect, evidence family,
 * priority/strength, and available semantic subjects (planets/houses/dimension), identity key,
 * and timing/transit/varga metadata used by their existing mapping rules. D2 relationship and
 * reference-dataset availability also need explicit producer-owned inputs; they must not be
 * inferred from a UI/theme summary or from a fabricated empty collection.
 *
 * Career C11's natal, expression, Dasha, and D10 inputs are built through the canonical path:
 * natal from horoscope, expression adapted from canonicalCareerFoundation mechanisms, Dasha from
 * horoscope/natal/expression and the temporal Dasha report, and D10 from horoscope/natal/expression.
 * The production D10 projection is mapped from canonical D10 analysis. Legacy theme evidence is
 * retained only by the explicitly optional structural-comparison helper and cached report output.
 */
describe('canonical interpretation independence from legacy theme outputs', () => {
  it('builds canonical domain outputs without invoking either legacy theme interpreter', async () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology });
    const baseline = await runLifeAnalysisProduct({
      horoscope,
      context,
      includeAiExplanation: false
    });
    expect(baseline.status).not.toBe('ERROR');

    const careerThemeSpy = vi.spyOn(careerThemeModule, 'interpretCareerTheme')
      .mockImplementation(() => {
        throw new Error('Legacy Career theme interpreter must not run in canonical production');
      });
    const wealthThemeSpy = vi.spyOn(wealthThemeModule, 'interpretWealthTheme')
      .mockImplementation(() => {
        throw new Error('Legacy Wealth theme interpreter must not run in canonical production');
      });

    try {
      const state = await runLifeAnalysisProduct({
        horoscope,
        context,
        includeAiExplanation: false
      });
      expect(state.status).not.toBe('ERROR');
      expect(careerThemeSpy).not.toHaveBeenCalled();
      expect(wealthThemeSpy).not.toHaveBeenCalled();

      const selection = resolveValidSelection(baseline.temporalState?.dashaInterpretation);
      const outputs = projectCanonicalOutputs(state, horoscope, context, selection);
      expect(outputs.c11Career).toBeDefined();
      expect(outputs.cw05Wealth).toBeDefined();
      expect(outputs.careerEvidence.length).toBeGreaterThan(0);
      expect(outputs.wealthEvidence.length).toBeGreaterThan(0);
      expect(outputs.analysis).toBeDefined();
      expect(outputs.aiCanonical.career).toBeDefined();
      expect(outputs.aiCanonical.wealth).toBeDefined();
      expectNoLegacyThemeReferences({
        analysis: outputs.analysis,
        aiCanonical: outputs.aiCanonical,
        c11Career: outputs.c11Career,
        cw05Wealth: outputs.cw05Wealth
      }, horoscope);
    } finally {
      careerThemeSpy.mockRestore();
      wealthThemeSpy.mockRestore();
    }
  });

  it('continues projecting cached legacy theme outputs into the full natal report', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.themeInterpretationV2?.career?.evidence.length).toBeGreaterThan(0);
    expect(horoscope.themeInterpretationV2?.wealth?.evidence.length).toBeGreaterThan(0);
    expect(horoscope.fullNatalAnalysis?.lifeThemes.career)
      .toBe(horoscope.themeInterpretationV2?.career);
    expect(horoscope.fullNatalAnalysis?.lifeThemes.wealth)
      .toBe(horoscope.themeInterpretationV2?.wealth);
  });

  it('keeps canonical conclusions, view-model projections, and canonical AI context unchanged when theme output is perturbed', async () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology });

    // This verifies canonical AI context; generated explanation execution is deferred to AI-boundary integration coverage.
    const baseline = await runLifeAnalysisProduct({
      horoscope,
      context,
      includeAiExplanation: false
    });
    expect(baseline.status).not.toBe('ERROR');

    const originalCareerTheme = careerThemeModule.interpretCareerTheme;
    const originalWealthTheme = wealthThemeModule.interpretWealthTheme;
    const careerThemeSpy = vi.spyOn(careerThemeModule, 'interpretCareerTheme');
    const wealthThemeSpy = vi.spyOn(wealthThemeModule, 'interpretWealthTheme');
    let originalCareerResult: ReturnType<typeof careerThemeModule.interpretCareerTheme> | undefined;
    let perturbedCareerResult: ReturnType<typeof careerThemeModule.interpretCareerTheme> | undefined;
    let originalWealthResult: ReturnType<typeof wealthThemeModule.interpretWealthTheme> | undefined;
    let perturbedWealthResult: ReturnType<typeof wealthThemeModule.interpretWealthTheme> | undefined;

    try {
      careerThemeSpy.mockImplementation((input) => {
        const theme = originalCareerTheme(input);
        originalCareerResult = theme;
        perturbedCareerResult = {
          ...theme,
          evidence: Object.freeze([]),
          conclusion: Object.freeze({
            ...theme.conclusion,
            status: 'CHALLENGED',
            summary: 'Perturbed legacy Career theme output'
          }),
          metadata: Object.freeze({
            ...theme.metadata,
            vargaConfirmationStatus: 'CONFLICTS',
            dataCompleteness: 'INSUFFICIENT'
          })
        };
        return perturbedCareerResult;
      });
      wealthThemeSpy.mockImplementation((input) => {
        const theme = originalWealthTheme(input);
        originalWealthResult = theme;
        perturbedWealthResult = {
          ...theme,
          evidence: Object.freeze([]),
          conclusion: Object.freeze({
            ...theme.conclusion,
            status: 'CHALLENGED',
            summary: 'Perturbed legacy Wealth theme output'
          }),
          metadata: Object.freeze({
            ...theme.metadata,
            vargaConfirmationStatus: 'CONFLICTS',
            dataCompleteness: 'INSUFFICIENT'
          })
        };
        return perturbedWealthResult;
      });

      const themeInput = {
        horoscope,
        dashaInterpretation: baseline.temporalState?.dashaInterpretation
      };
      careerThemeSpy(themeInput);
      wealthThemeSpy(themeInput);
      expect(perturbedCareerResult?.evidence).toEqual([]);
      expect(originalCareerResult?.evidence?.length).toBeGreaterThan(0);
      expect(perturbedWealthResult?.evidence).toEqual([]);
      expect(originalWealthResult?.evidence?.length).toBeGreaterThan(0);
      expect(perturbedCareerResult).not.toEqual(originalCareerResult);
      expect(perturbedCareerResult?.conclusion.summary).not.toBe(originalCareerResult?.conclusion.summary);
      expect(perturbedWealthResult).not.toEqual(originalWealthResult);
      expect(perturbedWealthResult?.conclusion.summary).not.toBe(originalWealthResult?.conclusion.summary);
      careerThemeSpy.mockClear();
      wealthThemeSpy.mockClear();

      const perturbed = await runLifeAnalysisProduct({
        horoscope,
        context,
        includeAiExplanation: false
      });
      expect(perturbed.status).not.toBe('ERROR');
      expect(careerThemeSpy).not.toHaveBeenCalled();
      expect(wealthThemeSpy).not.toHaveBeenCalled();
      expect(perturbed.temporalState).toEqual(baseline.temporalState);

      const selection = resolveValidSelection(baseline.temporalState?.dashaInterpretation);
      const baselineOutputs = projectCanonicalOutputs(baseline, horoscope, context, selection);
      const perturbedOutputs = projectCanonicalOutputs(perturbed, horoscope, context, selection);

      expect(wealthRegressionProjection(perturbedOutputs)).toEqual(
        wealthRegressionProjection(baselineOutputs)
      );
      expect(perturbedOutputs.analysis).toEqual(baselineOutputs.analysis);
      expect(perturbedOutputs.careerEvidence).toEqual(baselineOutputs.careerEvidence);
      expect(perturbedOutputs.wealthEvidence).toEqual(baselineOutputs.wealthEvidence);
      expect(perturbedOutputs.careerConclusion).toEqual(baselineOutputs.careerConclusion);
      expect(perturbedOutputs.wealthConclusion).toEqual(baselineOutputs.wealthConclusion);
      expect(perturbedOutputs.careerConclusionData).toEqual(baselineOutputs.careerConclusionData);
      expect(perturbedOutputs.wealthConclusionData).toEqual(baselineOutputs.wealthConclusionData);
      expect(perturbedOutputs.c11Career).toEqual(baselineOutputs.c11Career);
      expect(perturbedOutputs.cw05Wealth).toEqual(baselineOutputs.cw05Wealth);
      expect(perturbedOutputs.selectedPeriod).toEqual(baselineOutputs.selectedPeriod);
      expect(perturbedOutputs.aiCanonical).toEqual(baselineOutputs.aiCanonical);
      expectNoLegacyThemeReferences({
        analysis: perturbedOutputs.analysis,
        aiCanonical: perturbedOutputs.aiCanonical,
        c11Career: perturbedOutputs.c11Career,
        cw05Wealth: perturbedOutputs.cw05Wealth
      }, horoscope);
    } finally {
      careerThemeSpy.mockRestore();
      wealthThemeSpy.mockRestore();
    }
  });
});

function resolveValidSelection(report: Parameters<typeof listSelectableMdAdPeriods>[0] | undefined) {
  if (!report) throw new Error('Expected the product pipeline to provide a Dasha report');

  const periods = listSelectableMdAdPeriods(report);
  const mahadasha = periods.mahadashas.find((candidate) =>
    candidate.valid && periods.antardashas.some((antardasha) =>
      antardasha.valid && antardasha.mahadashaId === candidate.id
    )
  );
  if (!mahadasha) throw new Error('Expected a valid MD/AD selection');
  const antardasha = periods.antardashas.find((candidate) =>
    candidate.valid && candidate.mahadashaId === mahadasha.id
  );
  if (!antardasha) throw new Error('Expected a valid AD under the selected MD');

  return {
    mahadashaId: mahadasha.id,
    antardashaId: antardasha.id
  };
}

function projectCanonicalOutputs(
  state: Awaited<ReturnType<typeof runLifeAnalysisProduct>>,
  horoscope: ReturnType<typeof calculateHoroscope>,
  context: ReturnType<typeof createAnalysisContext>,
  selection: { readonly mahadashaId: string; readonly antardashaId: string }
) {
  const careerInterpretation = requireDomainInterpretation(
    state.domainInterpretations,
    'CAREER'
  );
  const wealthInterpretation = requireDomainInterpretation(
    state.domainInterpretations,
    'WEALTH'
  );
  if (!isCareerDomainInterpretation(careerInterpretation) ||
    !isWealthDomainInterpretation(wealthInterpretation) ||
    !careerInterpretation.conclusionData ||
    !wealthInterpretation.conclusionData ||
    !state.careerArtifacts ||
    !state.temporalState ||
    !state.lifeAnalysis ||
    !state.analysis) {
    throw new Error('Expected complete Career/Wealth canonical pipeline outputs');
  }

  const selectedPeriod = buildProductSelectedPeriodSynthesis({
    selection,
    context,
    temporalState: state.temporalState,
    horoscope,
    careerArtifacts: state.careerArtifacts,
    careerEvidence: careerInterpretation.evidence,
    careerDashaEvidence: state.careerArtifacts.careerDashaEvidence,
    wealthEvidence: wealthInterpretation.evidence,
    careerBaseline: careerInterpretation.conclusionData,
    wealthBaseline: wealthInterpretation.conclusionData
  });
  if (!selectedPeriod.ok) {
    throw new Error(`Selected-period projection failed: ${selectedPeriod.error}`);
  }

  const aiContext = buildProductAiContext(horoscope, {
    domainInterpretations: [careerInterpretation, wealthInterpretation],
    lifeAnalysis: state.lifeAnalysis,
    temporalState: state.temporalState
  });

  return {
    analysis: state.analysis,
    careerEvidence: careerInterpretation.evidence,
    wealthEvidence: wealthInterpretation.evidence,
    careerConclusion: careerInterpretation.conclusion,
    wealthConclusion: wealthInterpretation.conclusion,
    careerConclusionData: careerInterpretation.conclusionData,
    wealthConclusionData: wealthInterpretation.conclusionData,
    c11Career: careerInterpretation.conclusionData.canonicalCareerFinalSynthesis,
    cw05Wealth: wealthInterpretation.conclusionData.wealthFinalSynthesis,
    selectedPeriod: selectedPeriod.value,
    aiCanonical: {
      career: aiContext.career?.canonicalC11,
      wealth: aiContext.wealth?.finalSynthesis
    }
  };
}

function requireDomainInterpretation(
  interpretations: readonly DomainInterpretation[] | undefined,
  domain: DomainInterpretation['domain']
): DomainInterpretation {
  const interpretation = interpretations?.find((candidate) => candidate.domain === domain);
  if (!interpretation) throw new Error(`Expected ${domain} domain interpretation`);
  return interpretation;
}

function wealthRegressionProjection(
  outputs: ReturnType<typeof projectCanonicalOutputs>
) {
  const synthesis = outputs.wealthConclusionData.wealthFinalSynthesis;
  return {
    evidenceIds: outputs.wealthEvidence.map((item) => item.id),
    natalEvidenceIds: outputs.wealthEvidence
      .filter((item) => item.phase === 'NATAL_PROMISE')
      .map((item) => item.id),
    dimensionStatuses: outputs.wealthConclusionData.dimensions.map((dimension) => ({
      dimension: dimension.dimension,
      status: dimension.status,
      supportingEvidenceIds: dimension.supportingEvidenceIds,
      challengingEvidenceIds: dimension.challengingEvidenceIds
    })),
    conclusionStatuses: {
      overall: outputs.wealthConclusionData.overallStatus,
      accumulation: outputs.wealthConclusionData.accumulationStatus,
      gains: outputs.wealthConclusionData.gainsStatus,
      fortune: outputs.wealthConclusionData.fortuneStatus,
      speculation: outputs.wealthConclusionData.speculationStatus
    },
    cw05: synthesis && {
      status: synthesis.status,
      finalStatus: synthesis.finalStatus,
      promiseStatus: synthesis.promiseStatus,
      activationStatus: synthesis.activationStatus,
      timingStatus: synthesis.timingStatus,
      divisionalStatus: synthesis.divisionalStatus,
      manifestationStatus: synthesis.manifestationStatus,
      confidence: synthesis.confidence,
      evidenceIds: synthesis.evidenceIds,
      natalEvidenceIds: synthesis.natalEvidenceIds
    }
  };
}

function expectNoLegacyThemeReferences(
  canonicalOutputs: unknown,
  horoscope: ReturnType<typeof calculateHoroscope>
): void {
  const legacyNodes = collectObjectGraph([
    horoscope.themeInterpretationV2,
    horoscope.fullNatalAnalysis?.lifeThemes
  ]);
  const canonicalNodes = collectObjectGraph([canonicalOutputs]);
  const sharedNodes = Array.from(canonicalNodes).filter((node) => legacyNodes.has(node));
  expect(sharedNodes).toEqual([]);
}

function collectObjectGraph(roots: readonly unknown[]): Set<object> {
  const visited = new Set<object>();
  const pending = [...roots];
  while (pending.length > 0) {
    const value = pending.pop();
    if (value === null || typeof value !== 'object' || visited.has(value)) continue;
    visited.add(value);
    pending.push(...Object.values(value));
  }
  return visited;
}
