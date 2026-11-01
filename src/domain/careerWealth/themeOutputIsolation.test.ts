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

describe('canonical interpretation independence from legacy theme outputs', () => {
  it('keeps canonical conclusions, selected-period synthesis, and AI canonical facts unchanged when theme output is perturbed', async () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const context = createAnalysisContext({ asOf: FIXED_AS_OF, methodology });

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

    try {
      careerThemeSpy.mockImplementation((input) => {
        const theme = originalCareerTheme(input);
        return {
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
      });
      wealthThemeSpy.mockImplementation((input) => {
        const theme = originalWealthTheme(input);
        return {
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
      });

      const perturbed = await runLifeAnalysisProduct({
        horoscope,
        context,
        includeAiExplanation: false
      });
      expect(perturbed.status).not.toBe('ERROR');

      const selection = resolveValidSelection(baseline.temporalState?.dashaInterpretation);
      const baselineOutputs = projectCanonicalOutputs(baseline, horoscope, context, selection);
      const perturbedOutputs = projectCanonicalOutputs(perturbed, horoscope, context, selection);

      expect.soft(perturbedOutputs.c11Career).toEqual(baselineOutputs.c11Career);
      expect.soft(perturbedOutputs.cw05Wealth).toEqual(baselineOutputs.cw05Wealth);
      expect.soft(perturbedOutputs.selectedPeriod).toEqual(baselineOutputs.selectedPeriod);
      expect.soft(perturbedOutputs.aiCanonical).toEqual(baselineOutputs.aiCanonical);
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
    !state.lifeAnalysis) {
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
