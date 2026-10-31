import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../astroEngine';
import { resolveDashaInterpretationForAsOf } from '../dashaInterpretation/resolveDashaForAsOf';
import { ProductAnalysisService } from '../../product/analysis/productAnalysisService';
import {
  isCareerDomainInterpretation,
  isWealthDomainInterpretation
} from '../../product/life-analysis/lifeAnalysisTypes';
import {
  listSelectableMdAdPeriods,
  resolveSelectedMdAdPeriod
} from '../../core/analysis/selectedMdAdPeriod';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { AyanamsaType } from '../../types';
import {
  containsInstant,
  validateTimeInterval,
  type FutureEventValidationResult,
  type MissingTimelineValidationResult,
  type SampleGapValidationResult
} from './timeIntervalValidation';

const futureEventValidation: FutureEventValidationResult = {
  status: 'BLOCKED',
  detail: 'No independently sourced future-event outcomes are available to establish expected results.'
};

const sampleGapValidation: SampleGapValidationResult = {
  status: 'BLOCKED',
  detail: 'No production transit sample set with an independent gap-coverage baseline is available.'
};

describe('temporal calculation validation', () => {
  it('uses half-open [start, end) intervals and rejects invalid intervals', () => {
    const interval = validateTimeInterval(
      '2024-01-01T00:00:00.000Z',
      '2024-01-02T00:00:00.000Z'
    );
    expect(interval.ok).toBe(true);
    if (!interval.ok) return;

    expect(containsInstant('2024-01-01T00:00:00.000Z', interval.value)).toBe(true);
    expect(containsInstant('2024-01-01T23:59:59.999Z', interval.value)).toBe(true);
    expect(containsInstant('2024-01-02T00:00:00.000Z', interval.value)).toBe(false);
    expect(validateTimeInterval('2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z'))
      .toEqual({ ok: false, error: 'INVALID_ORDER' });
    expect(validateTimeInterval('2024-01-02T00:00:00.000Z', '2024-01-01T00:00:00.000Z'))
      .toEqual({ ok: false, error: 'INVALID_ORDER' });
    expect(validateTimeInterval('not-a-date', '2024-01-02T00:00:00.000Z'))
      .toEqual({ ok: false, error: 'INVALID_START' });
  });

  it('resolves exact Dasha boundaries through the production resolver', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const firstMahadasha = horoscope.vimshottari?.mahadashas[0];
    const [firstAntardasha, nextAntardasha] = firstMahadasha?.antardashas ?? [];
    expect(firstAntardasha).toBeDefined();
    expect(nextAntardasha).toBeDefined();
    if (!firstAntardasha || !nextAntardasha) return;

    const boundary = Date.parse(firstAntardasha.end);
    const before = resolveDashaInterpretationForAsOf(horoscope, new Date(boundary - 1));
    const at = resolveDashaInterpretationForAsOf(horoscope, new Date(boundary));

    expect(before?.current?.antardasha.start).toBe(firstAntardasha.start);
    expect(at?.current?.antardasha.start).toBe(nextAntardasha.start);
    expect(containsInstant(new Date(boundary - 1), {
      start: Date.parse(firstAntardasha.start),
      end: Date.parse(firstAntardasha.end)
    })).toBe(true);
    expect(containsInstant(new Date(boundary), {
      start: Date.parse(firstAntardasha.start),
      end: Date.parse(firstAntardasha.end)
    })).toBe(false);
  });

  it('builds selected-period synthesis through the real product analysis entry point', async () => {
    const service = new ProductAnalysisService();
    const asOf = '2024-06-15T00:00:00.000Z';
    const baseline = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf,
      includeAiExplanation: false
    });
    const report = baseline.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(report).toBeDefined();
    if (!report) return;

    const selectable = listSelectableMdAdPeriods(report);
    const mahadasha = selectable.mahadashas.find((period) => period.valid);
    const antardasha = selectable.antardashas.find(
      (period) => period.valid && period.mahadashaId === mahadasha?.id
    );
    expect(mahadasha).toBeDefined();
    expect(antardasha).toBeDefined();
    if (!mahadasha || !antardasha) return;

    const selected = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf,
      includeAiExplanation: false,
      selectedPeriod: {
        mahadashaId: mahadasha.id,
        antardashaId: antardasha.id
      }
    });
    expect(selected.analysis.selectedPeriod?.status).toBe('OK');
    if (selected.analysis.selectedPeriod?.status !== 'OK') return;

    const selectedPeriod = selected.analysis.selectedPeriod.synthesis.period;
    expect(selectedPeriod.analysisAsOf).toBe(asOf);
    expect(selectedPeriod.mahadashaId).toBe(mahadasha.id);
    expect(selectedPeriod.antardashaId).toBe(antardasha.id);
    expect(validateTimeInterval(selectedPeriod.interval.start, selectedPeriod.interval.end).ok).toBe(true);
  });

  it('classifies real selected MD-AD periods as future, current, and past', async () => {
    const service = new ProductAnalysisService();
    const initialAsOf = '2024-06-15T00:00:00.000Z';
    const initial = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf: initialAsOf,
      includeAiExplanation: false
    });
    const report = initial.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(report).toBeDefined();
    if (!report) return;

    const selectable = listSelectableMdAdPeriods(report);
    const selectedMahadasha = selectable.mahadashas.find((period) =>
      period.valid && Date.parse(period.start) > Date.parse(initialAsOf)
    );
    const selectedAntardasha = selectable.antardashas.find((period) =>
      period.valid && period.mahadashaId === selectedMahadasha?.id
    );
    expect(selectedMahadasha).toBeDefined();
    expect(selectedAntardasha).toBeDefined();
    if (!selectedMahadasha || !selectedAntardasha) return;

    const selection = {
      mahadashaId: selectedMahadasha.id,
      antardashaId: selectedAntardasha.id
    };
    const analyzeSelection = async (asOf: string) => {
      const run = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
        asOf,
        includeAiExplanation: false,
        selectedPeriod: selection
      });
      expect(run.analysis.selectedPeriod?.status).toBe('OK');
      if (run.analysis.selectedPeriod?.status !== 'OK') return undefined;
      return run.analysis.selectedPeriod.synthesis;
    };

    const future = await analyzeSelection(initialAsOf);
    const current = await analyzeSelection(selectedAntardasha.start);
    const past = await analyzeSelection(selectedAntardasha.end);
    expect(future?.period.temporalRelation).toBe('FUTURE');
    expect(current?.period.temporalRelation).toBe('CURRENT');
    expect(past?.period.temporalRelation).toBe('PAST');
  });

  it('rejects a child interval outside its real parent hierarchy', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = horoscope.dashaInterpretation;
    expect(report).toBeDefined();
    if (!report) return;

    const parent = report.mahadashas[0];
    const child = parent.antardashas[0];
    expect(child).toBeDefined();
    if (!child) return;
    const malformedChild = {
      ...child,
      start: new Date(Date.parse(parent.start) - 1).toISOString()
    };
    const malformedReport = {
      ...report,
      mahadashas: [
        { ...parent, antardashas: [malformedChild, ...parent.antardashas.slice(1)] },
        ...report.mahadashas.slice(1)
      ]
    };
    const periods = listSelectableMdAdPeriods(malformedReport);
    const malformedSelection = periods.antardashas.find((period) =>
      period.diagnostics.includes('ANTARDASHA_OUTSIDE_MAHADASHA')
    );
    expect(malformedSelection).toBeDefined();
    expect(periods.diagnostics).toContain('ANTARDASHA_OUTSIDE_MAHADASHA');
    if (!malformedSelection) return;

    expect(resolveSelectedMdAdPeriod(malformedReport, {
      mahadashaId: malformedSelection.mahadashaId,
      antardashaId: malformedSelection.id
    })).toEqual({ ok: false, error: 'INVALID_SELECTED_PERIOD' });
  });

  it('returns UNAVAILABLE when the real resolver has no active timeline report', async () => {
    const service = new ProductAnalysisService();
    const baseline = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf: '2024-06-15T00:00:00.000Z',
      includeAiExplanation: false
    });
    const report = baseline.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(report).toBeDefined();
    if (!report) return;
    const selectable = listSelectableMdAdPeriods(report);
    const mahadasha = selectable.mahadashas.find((period) => period.valid);
    const antardasha = selectable.antardashas.find(
      (period) => period.valid && period.mahadashaId === mahadasha?.id
    );
    expect(mahadasha).toBeDefined();
    expect(antardasha).toBeDefined();
    if (!mahadasha || !antardasha) return;

    const unavailable = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf: '2200-01-01T00:00:00.000Z',
      includeAiExplanation: false,
      selectedPeriod: {
        mahadashaId: mahadasha.id,
        antardashaId: antardasha.id
      }
    });
    const resolvedReport = unavailable.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    const validationResult: MissingTimelineValidationResult = resolvedReport === undefined
      ? { status: 'UNAVAILABLE' }
      : { status: 'AVAILABLE' };
    expect(validationResult.status).toBe('UNAVAILABLE');
    expect(unavailable.analysis.selectedPeriod).toEqual({
      status: 'INVALID_SELECTION',
      error: 'REPORT_UNAVAILABLE'
    });
  });

  it('invalidates an old profile selection after switching to another real birth profile', async () => {
    const service = new ProductAnalysisService();
    const asOf = '2024-06-15T00:00:00.000Z';
    const firstProfile = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf,
      includeAiExplanation: false
    });
    const firstReport = firstProfile.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(firstReport).toBeDefined();
    if (!firstReport) return;

    const firstPeriods = listSelectableMdAdPeriods(firstReport);
    const oldMahadasha = firstPeriods.mahadashas.find((period) => period.valid);
    const oldAntardasha = firstPeriods.antardashas.find(
      (period) => period.valid && period.mahadashaId === oldMahadasha?.id
    );
    expect(oldMahadasha).toBeDefined();
    expect(oldAntardasha).toBeDefined();
    if (!oldMahadasha || !oldAntardasha) return;

    const otherProfile = {
      latitude: 28.6139,
      longitude: 77.209,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: '1990-01-15T08:30:00.000Z'
    };
    const switchedProfile = await service.analyzeRun(otherProfile, {
      asOf,
      includeAiExplanation: false
    });
    const switchedReport = switchedProfile.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(switchedReport).toBeDefined();
    if (!switchedReport) return;
    const switchedPeriods = listSelectableMdAdPeriods(switchedReport);
    expect(switchedPeriods.mahadashas.some((period) => period.id === oldMahadasha.id)).toBe(false);

    const staleSelection = await service.analyzeRun(otherProfile, {
      asOf,
      includeAiExplanation: false,
      selectedPeriod: {
        mahadashaId: oldMahadasha.id,
        antardashaId: oldAntardasha.id
      }
    });
    expect(staleSelection.analysis.selectedPeriod).toEqual({
      status: 'INVALID_SELECTION',
      error: 'MAHADASHA_NOT_FOUND'
    });
  });

  it('is deterministic for identical selected-period analysis requests', async () => {
    const service = new ProductAnalysisService();
    const asOf = '2024-06-15T00:00:00.000Z';
    const baseline = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf,
      includeAiExplanation: false
    });
    const report = baseline.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(report).toBeDefined();
    if (!report) return;
    const selectable = listSelectableMdAdPeriods(report);
    const mahadasha = selectable.mahadashas.find((period) => period.valid);
    const antardasha = selectable.antardashas.find(
      (period) => period.valid && period.mahadashaId === mahadasha?.id
    );
    expect(mahadasha).toBeDefined();
    expect(antardasha).toBeDefined();
    if (!mahadasha || !antardasha) return;

    const options = {
      asOf,
      includeAiExplanation: false,
      selectedPeriod: { mahadashaId: mahadasha.id, antardashaId: antardasha.id }
    };
    const first = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, options);
    const second = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, options);
    expect(first.analysis.selectedPeriod).toEqual(second.analysis.selectedPeriod);
  });

  it('keeps lifetime career, wealth, C11, and CW-05 invariant across different selected periods', async () => {
    const asOf = '2024-06-15T00:00:00.000Z';
    const service = new ProductAnalysisService();
    const initial = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf,
      includeAiExplanation: false
    });
    const report = initial.snapshot.pipelineState?.temporalState?.dashaInterpretation;
    expect(report).toBeDefined();
    if (!report) return;

    const selectable = listSelectableMdAdPeriods(report);
    const validAntardashas = selectable.antardashas.filter((period) => period.valid);
    const firstPeriod = validAntardashas[0];
    const secondPeriod = validAntardashas.find((period) =>
      period.id !== firstPeriod?.id
    );
    expect(firstPeriod).toBeDefined();
    expect(secondPeriod).toBeDefined();
    if (!firstPeriod || !secondPeriod) return;

    const analyzePeriod = (period: typeof firstPeriod) => service.analyzeRun(
      CANONICAL_BIRTH_DETAILS,
      {
        asOf,
        includeAiExplanation: false,
        selectedPeriod: {
          mahadashaId: period.mahadashaId,
          antardashaId: period.id
        }
      }
    );
    const first = await analyzePeriod(firstPeriod);
    const second = await analyzePeriod(secondPeriod);

    expect(first.analysis.asOf).toBe(asOf);
    expect(second.analysis.asOf).toBe(asOf);
    expect(first.analysis.career).toEqual(second.analysis.career);
    expect(first.analysis.wealth).toEqual(second.analysis.wealth);
    expect(first.analysis.selectedPeriod?.status).toBe('OK');
    expect(second.analysis.selectedPeriod?.status).toBe('OK');
    if (first.analysis.selectedPeriod?.status !== 'OK'
      || second.analysis.selectedPeriod?.status !== 'OK') return;
    expect(first.analysis.selectedPeriod).not.toEqual(second.analysis.selectedPeriod);
    expect(first.analysis.selectedPeriod.synthesis.period).not.toEqual(
      second.analysis.selectedPeriod.synthesis.period
    );

    const firstState = first.snapshot.pipelineState;
    const secondState = second.snapshot.pipelineState;
    expect(firstState?.career).toBeDefined();
    expect(secondState?.career).toBeDefined();
    expect(firstState?.wealth).toBeDefined();
    expect(secondState?.wealth).toBeDefined();
    if (!firstState?.career || !secondState?.career
      || !firstState.wealth || !secondState.wealth) return;
    expect(isCareerDomainInterpretation(firstState.career)).toBe(true);
    expect(isCareerDomainInterpretation(secondState.career)).toBe(true);
    expect(isWealthDomainInterpretation(firstState.wealth)).toBe(true);
    expect(isWealthDomainInterpretation(secondState.wealth)).toBe(true);
    if (!isCareerDomainInterpretation(firstState.career)
      || !isCareerDomainInterpretation(secondState.career)
      || !isWealthDomainInterpretation(firstState.wealth)
      || !isWealthDomainInterpretation(secondState.wealth)) return;

    const lifetimeCareer = firstState.career.conclusionData;
    const lifetimeWealth = firstState.wealth.conclusionData;
    expect(lifetimeCareer).toBeDefined();
    expect(lifetimeWealth).toBeDefined();
    expect(secondState.career.conclusionData).toEqual(lifetimeCareer);
    expect(secondState.wealth.conclusionData).toEqual(lifetimeWealth);
    expect(lifetimeCareer?.careerFinalSynthesis).toEqual(
      secondState.career.conclusionData?.careerFinalSynthesis
    );
    expect(lifetimeWealth?.wealthFinalSynthesis).toEqual(
      secondState.wealth.conclusionData?.wealthFinalSynthesis
    );
  });

  it('reports future-event validation as blocked without an independent baseline', () => {
    expect(futureEventValidation.status).toBe('BLOCKED');
    expect(futureEventValidation.detail).toMatch(/independently sourced/);
  });

  it('reports sample-gap validation as blocked without production samples and a reference baseline', () => {
    expect(sampleGapValidation.status).toBe('BLOCKED');
    expect(sampleGapValidation.detail).toMatch(/independent gap-coverage baseline/);
  });
});
