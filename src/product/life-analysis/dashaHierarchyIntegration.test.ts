import { describe, it, expect } from 'vitest';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import { buildDashaTimingViewModel } from '../dasha-timing/buildDashaTimingViewModel';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { resolveLifeAnalysisEvidence } from './lifeAnalysisEvidence';

describe('D07-C: Hierarchy Integration Pipeline Tests', () => {
  const asOf = '2024-06-01T00:00:00.000Z';
  const analysisContext = createAnalysisContext({
    asOf,
    methodology: {
      zodiacSystem: 'SIDEREAL',
      houseSystem: 'WHOLE_SIGN',
      ayanamsa: 'LAHIRI',
      calculationEngine: 'ASTRO_CORE_V1',
      rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
      vargaRules: 'PARASHARA_D10_D2',
      dashaSystem: 'VIMSHOTTARI'
    }
  });
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, asOf);
  const temporalState = resolveAnalysisTemporalState(horoscope, analysisContext);
  const domainOptions = { context: analysisContext, temporalState };
  const career = interpretCareerV2(horoscope, domainOptions);
  const wealth = interpretWealthV2(horoscope, domainOptions);

  it('wires career and wealth dasha hierarchy into lifeAnalysisMapper view model', () => {
    const lifeAnalysis = buildLifeAnalysis([career, wealth]);

    const context = buildAiContext(
      horoscope,
      {
        domainInterpretations: [career, wealth],
        lifeAnalysis
      }
    );

    const evidence = resolveLifeAnalysisEvidence(
      lifeAnalysis,
      context.evidence
    );

    const viewModel = buildLifeAnalysisViewModel(
      lifeAnalysis,
      career,
      wealth,
      evidence
    );

    expect(viewModel.careerDetail?.dashaHierarchy).toBeDefined();
    expect(viewModel.careerDetail?.dashaHierarchy?.overallEffect).toBeDefined();
    expect(viewModel.careerDetail?.dashaHierarchy?.primary).toBeDefined();
    expect(viewModel.careerDetail?.dashaHierarchy?.modifier).toBeDefined();
    expect(viewModel.careerDetail?.dashaHierarchy?.trigger).toBeDefined();

    expect(viewModel.wealthDetail?.dashaHierarchy).toBeDefined();
    expect(viewModel.wealthDetail?.dashaHierarchy?.dimensions).toHaveLength(4);
    expect(viewModel.wealthDetail?.dashaHierarchy?.summary).toBeDefined();
  });

  it('populates careerHierarchy and wealthHierarchy in buildDashaTimingViewModel', () => {
    const timingVm = buildDashaTimingViewModel({
      temporalState,
      horoscope,
      careerTiming: career,
      wealthTiming: wealth
    });

    expect(timingVm.careerHierarchy).toBeDefined();
    expect(timingVm.careerHierarchy?.overallEffect).toBeDefined();
    expect(timingVm.wealthHierarchy).toBeDefined();
    expect(timingVm.wealthHierarchy?.dimensions).toHaveLength(4);
  });

  it('populates hierarchy facts in buildAiContext and passes all evidence invariants', () => {
    const lifeAnalysis = buildLifeAnalysis([career, wealth]);

    const context = buildAiContext(
      horoscope,
      {
        domainInterpretations: [career, wealth],
        lifeAnalysis
      }
    );

    expect(context.career?.timing?.hierarchy).toBeDefined();
    expect(context.career?.timing?.hierarchy?.primary.role).toBe('PRIMARY');
    expect(context.career?.timing?.hierarchy?.modifier.role).toBe('MODIFIER');
    expect(context.career?.timing?.hierarchy?.trigger.role).toBe('TRIGGER');
    expect(context.career?.timing?.hierarchy?.overallEffect).toBeDefined();

    expect(context.wealth?.timing?.hierarchy).toBeDefined();
    expect(context.wealth?.timing?.hierarchy?.dimensions).toHaveLength(4);

    // Verify all hierarchy evidence IDs are present in context.evidence
    const evidenceIds = new Set(context.evidence.map((e) => e.id));
    if (context.career?.timing?.hierarchy?.evidenceIds) {
      for (const id of context.career.timing.hierarchy.evidenceIds) {
        expect(evidenceIds.has(id)).toBe(true);
      }
    }
    if (context.wealth?.timing?.hierarchy?.evidenceIds) {
      for (const id of context.wealth.timing.hierarchy.evidenceIds) {
        expect(evidenceIds.has(id)).toBe(true);
      }
    }
  });
});
