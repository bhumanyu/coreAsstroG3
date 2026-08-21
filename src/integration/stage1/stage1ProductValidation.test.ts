import { describe, expect, it } from 'vitest';
import { runLifeAnalysisProduct } from '../../product/life-analysis/lifeAnalysisProductService';
import {
  STAGE1_GOLDEN_HOROSCOPE
} from './stage1GoldenFixture';

describe('Stage 1 - Life Analysis Product Validation', () => {
  it('validates full pipeline execution with career and wealth domain contracts', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    expect(result.status).toBe('READY');
    expect(result.analysis).toBeDefined();
    expect(result.analysis?.domains.length).toBeGreaterThanOrEqual(2);

    const careerDomain = result.analysis?.domains.find((d) => d.domain === 'CAREER');
    const wealthDomain = result.analysis?.domains.find((d) => d.domain === 'WEALTH');

    expect(careerDomain).toBeDefined();
    expect(wealthDomain).toBeDefined();

    expect(result.analysis?.careerDetail).toBeDefined();
    expect(result.analysis?.wealthDetail).toBeDefined();
    expect(result.analysis?.careerWhy).toBeDefined();
    expect(result.analysis?.wealthWhy).toBeDefined();
  });

  it('validates Career contract fields and why evidence', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const career = result.analysis?.careerDetail;
    expect(career).toBeDefined();
    expect(career?.natalPromise).toBeDefined();
    expect(career?.d10Relationship).toBeDefined();
    expect(career?.currentDashaEffect).toBeDefined();
    expect(career?.currentTransitEffect).toBeDefined();

    expect(result.analysis?.careerWhy?.evidence.length).toBeGreaterThan(0);
  });

  it('validates Wealth contract with all four dimensions and overallStatus', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const wealth = result.analysis?.wealthDetail;
    expect(wealth).toBeDefined();
    expect(wealth?.overallStatus).toBeDefined();
    expect(wealth?.accumulationStatus).toBeDefined();
    expect(wealth?.gainsStatus).toBeDefined();
    expect(wealth?.fortuneStatus).toBeDefined();
    expect(wealth?.speculationStatus).toBeDefined();

    expect(result.analysis?.wealthWhy).toBeDefined();
    expect(result.analysis?.wealthWhy?.evidence.length).toBeGreaterThan(0);
  });

  it('validates overall vs speculation independence as separate keys in wealthDetail', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    const wealth = result.analysis?.wealthDetail;
    expect(wealth).toBeDefined();
    expect('overallStatus' in (wealth || {})).toBe(true);
    expect('speculationStatus' in (wealth || {})).toBe(true);
  });

  it('validates LOCAL_ONLY execution without AI produces READY status and valid domains', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    expect(result.status).toBe('READY');
    expect(result.analysis).toBeDefined();
    expect(result.analysis?.domains.length).toBeGreaterThanOrEqual(2);
  });

  it('validates deterministic repeatability across repeated runs', async () => {
    const resultA = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });
    const resultB = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    expect(resultA.analysis).toEqual(resultB.analysis);
  });

  it('validates deep immutability of returned product state', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.analysis)).toBe(true);
    if (result.analysis?.careerWhy) {
      expect(Object.isFrozen(result.analysis.careerWhy)).toBe(true);
    }
    if (result.analysis?.wealthWhy) {
      expect(Object.isFrozen(result.analysis.wealthWhy)).toBe(true);
    }
  });

  it('validates golden smoke test for all essential LifeAnalysisViewModel contracts', async () => {
    const result = await runLifeAnalysisProduct({
      horoscope: STAGE1_GOLDEN_HOROSCOPE,
      includeAiExplanation: false
    });

    expect(result.status).toBe('READY');
    expect(result.analysis).toBeDefined();

    const analysis = result.analysis!;
    const domainNames = analysis.domains.map((d) => d.domain);
    expect(domainNames).toContain('CAREER');
    expect(domainNames).toContain('WEALTH');

    expect(analysis.careerDetail).toBeDefined();
    expect(analysis.wealthDetail).toBeDefined();
    expect(analysis.careerWhy?.evidence.length).toBeGreaterThan(0);
    expect(analysis.wealthWhy?.evidence.length).toBeGreaterThan(0);

    expect(analysis.overall.statement).toBeTruthy();
    expect(analysis.why.evidence.length).toBeGreaterThan(0);
    expect(analysis.completeness.overall).toBeDefined();
  });
});
