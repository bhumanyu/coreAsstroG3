import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProductAnalysisService,
  createProductAnalysisService
} from '../productAnalysisService';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import * as careerModule from '../../../domain/career/CareerDomainInterpreterV2';
import * as wealthModule from '../../../domain/wealth/WealthDomainInterpreterV2';

describe('Canonical Production Analysis Path Regression Suite', () => {
  const FIXED_AS_OF = '2026-01-01T00:00:00.000Z';

  let careerSpy: ReturnType<typeof vi.spyOn>;
  let wealthSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    careerSpy = vi.spyOn(careerModule, 'interpretCareerV2');
    wealthSpy = vi.spyOn(wealthModule, 'interpretWealthV2');
  });

  afterEach(() => {
    careerSpy.mockRestore();
    wealthSpy.mockRestore();
  });

  it('invokes interpretCareerV2 and interpretWealthV2 EXACTLY ONCE per chart analysis with AI explanation enabled', async () => {
    const service = createProductAnalysisService();

    const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: true
    });

    // Verify successful production analysis
    expect(result.status).toBe('READY');
    expect(result.career).toBeDefined();
    expect(result.wealth).toBeDefined();
    expect(result.ai).toBeDefined();
    expect(result.ai.status).toBe('AVAILABLE');
    expect(result.ai.explanation).toBeDefined();

    // Verify EXACTLY ONCE invocation (zero double/triple calculation along canonical path)
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);

    // Verify context and temporalState were properly passed to the domain interpreters and reference equality holds
    const careerDomainOptions = careerSpy.mock.calls[0][1];
    const wealthDomainOptions = wealthSpy.mock.calls[0][1];
    expect(careerDomainOptions?.context).toBeDefined();
    expect(careerDomainOptions?.context?.asOf).toBe(FIXED_AS_OF);
    expect(wealthDomainOptions?.context).toBeDefined();
    expect(wealthDomainOptions?.context?.asOf).toBe(FIXED_AS_OF);
    expect(careerDomainOptions?.context).toBe(wealthDomainOptions?.context);
    expect(careerDomainOptions?.temporalState).toBeDefined();
    expect(wealthDomainOptions?.temporalState).toBeDefined();
    expect(careerDomainOptions?.temporalState).toBe(wealthDomainOptions?.temporalState);
    expect(Object.isFrozen(careerDomainOptions?.temporalState)).toBe(true);
  });

  it('invokes interpretCareerV2 and interpretWealthV2 EXACTLY ONCE per chart analysis when AI explanation is disabled', async () => {
    const service = new ProductAnalysisService();

    const result = await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: false
    });

    expect(result.status).toBe('READY');
    expect(result.career).toBeDefined();
    expect(result.wealth).toBeDefined();
    expect(result.ai.status).toBe('UNAVAILABLE');
    expect(result.ai.explanation).toBeUndefined();

    // Single invocation guarantee holds regardless of AI explanation flag
    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);

    const careerDomainOptions = careerSpy.mock.calls[0][1];
    const wealthDomainOptions = wealthSpy.mock.calls[0][1];
    expect(careerDomainOptions?.context).toBeDefined();
    expect(wealthDomainOptions?.context).toBeDefined();
    expect(careerDomainOptions?.context).toBe(wealthDomainOptions?.context);
    expect(careerDomainOptions?.temporalState).toBeDefined();
    expect(wealthDomainOptions?.temporalState).toBeDefined();
    expect(careerDomainOptions?.temporalState).toBe(wealthDomainOptions?.temporalState);
  });

  it('proves shared frozen temporalState object-identity between Career and Wealth interpreters', async () => {
    const service = new ProductAnalysisService();

    await service.analyze(CANONICAL_BIRTH_DETAILS, {
      asOf: FIXED_AS_OF,
      includeAiExplanation: false
    });

    expect(careerSpy).toHaveBeenCalledTimes(1);
    expect(wealthSpy).toHaveBeenCalledTimes(1);

    const careerOptions = careerSpy.mock.calls[0][1];
    const wealthOptions = wealthSpy.mock.calls[0][1];

    expect(careerOptions.context === wealthOptions.context).toBe(true);
    expect(careerOptions.temporalState === wealthOptions.temporalState).toBe(true);
    expect(careerOptions.temporalState.asOf).toBe(FIXED_AS_OF);
    expect(Object.isFrozen(careerOptions.temporalState)).toBe(true);
  });
});
