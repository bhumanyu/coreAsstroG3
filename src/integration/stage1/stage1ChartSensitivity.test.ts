import { describe, expect, it } from 'vitest';
import { runLifeAnalysisProduct } from '../../product/life-analysis/lifeAnalysisProductService';
import {
  STAGE1_GOLDEN_HOROSCOPE,
  createTestHoroscope
} from './stage1GoldenFixture';
import type { LifeAnalysisProductState } from '../../product/life-analysis/lifeAnalysisTypes';

export interface ChartFactItem {
  id: string;
  title: string;
  statement: string;
  sourceLabel: string;
  chartFactValue?: string;
}

export function collectEvidenceIds(result: LifeAnalysisProductState): string[] {
  return result.analysis?.why?.evidence.map((e) => e.id) ?? [];
}

export function collectChartFacts(
  result: LifeAnalysisProductState,
  domain: 'CAREER' | 'WEALTH'
): ChartFactItem[] {
  const why = domain === 'CAREER' ? result.analysis?.careerWhy : result.analysis?.wealthWhy;
  if (!why) return [];
  return why.evidence.map((e) => ({
    id: e.id,
    title: e.title,
    statement: e.statement,
    sourceLabel: e.source.label,
    chartFactValue: e.chartFact?.value
  }));
}

describe('Stage 1 - Life Analysis Chart Sensitivity', () => {
  const horoscopeA = STAGE1_GOLDEN_HOROSCOPE;
  const horoscopeB = createTestHoroscope({
    latitude: 13.0827,
    longitude: 80.2707,
    timeZone: 'Asia/Kolkata',
    dateTimeStr: '2005-11-20T18:45:00+05:30'
  });

  it('demonstrates chart sensitivity between distinct horoscopes across evidence and chart facts', async () => {
    const resultA = await runLifeAnalysisProduct({
      horoscope: horoscopeA,
      includeAiExplanation: false
    });
    const resultB = await runLifeAnalysisProduct({
      horoscope: horoscopeB,
      includeAiExplanation: false
    });

    expect(resultA.status).not.toBe('ERROR');
    expect(resultB.status).not.toBe('ERROR');
    expect(resultA.status).toBe('READY');
    expect(resultB.status).toBe('READY');

    // Horoscopes differ
    expect(horoscopeA).not.toEqual(horoscopeB);

    // Career facts differ
    const careerFactsA = collectChartFacts(resultA, 'CAREER');
    const careerFactsB = collectChartFacts(resultB, 'CAREER');
    expect(careerFactsA.length).toBeGreaterThan(0);
    expect(careerFactsB.length).toBeGreaterThan(0);
    expect(careerFactsA).not.toEqual(careerFactsB);

    // Wealth facts differ
    const wealthFactsA = collectChartFacts(resultA, 'WEALTH');
    const wealthFactsB = collectChartFacts(resultB, 'WEALTH');
    expect(wealthFactsA.length).toBeGreaterThan(0);
    expect(wealthFactsB.length).toBeGreaterThan(0);
    expect(wealthFactsA).not.toEqual(wealthFactsB);

    // Overall evidence-ID sets differ
    const evidenceIdsA = new Set(collectEvidenceIds(resultA));
    const evidenceIdsB = new Set(collectEvidenceIds(resultB));
    expect(evidenceIdsA.size).toBeGreaterThan(0);
    expect(evidenceIdsB.size).toBeGreaterThan(0);
    expect(evidenceIdsA).not.toEqual(evidenceIdsB);
  });

  it('demonstrates career-specific evidence sensitivity across distinct charts', async () => {
    const resultA = await runLifeAnalysisProduct({
      horoscope: horoscopeA,
      includeAiExplanation: false
    });
    const resultB = await runLifeAnalysisProduct({
      horoscope: horoscopeB,
      includeAiExplanation: false
    });

    const careerEvidenceA = resultA.analysis?.careerWhy?.evidence ?? [];
    const careerEvidenceB = resultB.analysis?.careerWhy?.evidence ?? [];

    expect(careerEvidenceA.length).toBeGreaterThan(0);
    expect(careerEvidenceB.length).toBeGreaterThan(0);
    expect(careerEvidenceA).not.toEqual(careerEvidenceB);
  });

  it('demonstrates wealth-specific evidence sensitivity across distinct charts', async () => {
    const resultA = await runLifeAnalysisProduct({
      horoscope: horoscopeA,
      includeAiExplanation: false
    });
    const resultB = await runLifeAnalysisProduct({
      horoscope: horoscopeB,
      includeAiExplanation: false
    });

    const wealthEvidenceA = resultA.analysis?.wealthWhy?.evidence ?? [];
    const wealthEvidenceB = resultB.analysis?.wealthWhy?.evidence ?? [];

    expect(wealthEvidenceA.length).toBeGreaterThan(0);
    expect(wealthEvidenceB.length).toBeGreaterThan(0);
    expect(wealthEvidenceA).not.toEqual(wealthEvidenceB);
  });
});
