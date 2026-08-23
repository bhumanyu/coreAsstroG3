import { describe, it, expect } from 'vitest';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import { buildDashaTimingViewModel } from '../dasha-timing/buildDashaTimingViewModel';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from '../../integration/stage1/stage1GoldenFixture';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { resolveLifeAnalysisEvidence } from './lifeAnalysisEvidence';

describe('D07-C: Hierarchy Integration Pipeline Tests', () => {
  it('wires career and wealth dasha hierarchy into lifeAnalysisMapper view model', () => {
    const lifeAnalysis = buildLifeAnalysis([
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH
    ]);

    const context = buildAiContext(
      STAGE1_GOLDEN_HOROSCOPE,
      {
        domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH],
        lifeAnalysis
      }
    );

    const evidence = resolveLifeAnalysisEvidence(
      lifeAnalysis,
      context.evidence
    );

    const viewModel = buildLifeAnalysisViewModel(
      lifeAnalysis,
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH,
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
    const timingVm = buildDashaTimingViewModel(
      STAGE1_GOLDEN_HOROSCOPE,
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH
    );

    expect(timingVm.careerHierarchy).toBeDefined();
    expect(timingVm.careerHierarchy?.overallEffect).toBeDefined();
    expect(timingVm.wealthHierarchy).toBeDefined();
    expect(timingVm.wealthHierarchy?.dimensions).toHaveLength(4);
  });

  it('populates hierarchy facts in buildAiContext and passes all evidence invariants', () => {
    const lifeAnalysis = buildLifeAnalysis([
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH
    ]);

    const context = buildAiContext(
      STAGE1_GOLDEN_HOROSCOPE,
      {
        domainInterpretations: [STAGE1_GOLDEN_CAREER, STAGE1_GOLDEN_WEALTH],
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
