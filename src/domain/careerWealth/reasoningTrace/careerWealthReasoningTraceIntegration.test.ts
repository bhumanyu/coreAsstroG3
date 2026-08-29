import { describe, expect, it } from 'vitest';
import { interpretCareerV2 } from '../../career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../wealth/WealthDomainInterpreterV2';
import type { Horoscope } from '../../../types';
import { validateReasoningTrace } from './reasoningTraceValidator';

describe('Career & Wealth ReasoningTraceGraph Integration (CW-06B)', () => {
  const dummyHoroscope: Horoscope = {
    planets: [
      { name: 'Sun', longitude: 120, speed: 1, house: 5 },
      { name: 'Moon', longitude: 40, speed: 1, house: 2 },
      { name: 'Mars', longitude: 270, speed: 1, house: 10 },
      { name: 'Mercury', longitude: 150, speed: 1, house: 6 },
      { name: 'Jupiter', longitude: 280, speed: 1, house: 11 },
      { name: 'Venus', longitude: 60, speed: 1, house: 3 },
      { name: 'Saturn', longitude: 300, speed: 1, house: 11 },
      { name: 'Rahu', longitude: 10, speed: 1, house: 1 },
      { name: 'Ketu', longitude: 190, speed: 1, house: 7 }
    ],
    houses: [
      { number: 1, sign: 'Aries', degree: 10 },
      { number: 2, sign: 'Taurus', degree: 10 },
      { number: 3, sign: 'Gemini', degree: 10 },
      { number: 4, sign: 'Cancer', degree: 10 },
      { number: 5, sign: 'Leo', degree: 10 },
      { number: 6, sign: 'Virgo', degree: 10 },
      { number: 7, sign: 'Libra', degree: 10 },
      { number: 8, sign: 'Scorpio', degree: 10 },
      { number: 9, sign: 'Sagittarius', degree: 10 },
      { number: 10, sign: 'Capricorn', degree: 10 },
      { number: 11, sign: 'Aquarius', degree: 10 },
      { number: 12, sign: 'Pisces', degree: 10 }
    ],
    ascendant: { sign: 'Aries', degree: 10 }
  };

  it('populates valid reasoningTraceGraph on Career domain interpretation conclusionData', () => {
    const interpretation = interpretCareerV2(dummyHoroscope);
    const conclusionData = interpretation.conclusionData as { reasoningTraceGraph?: any };

    expect(conclusionData).toBeDefined();
    expect(conclusionData.reasoningTraceGraph).toBeDefined();
    expect(conclusionData.reasoningTraceGraph.traceId).toBe('CW-TRACE-CAREER');
    expect(conclusionData.reasoningTraceGraph.nodes.length).toBeGreaterThan(0);
    expect(conclusionData.reasoningTraceGraph.edges.length).toBeGreaterThan(0);

    // Validate structural integrity
    expect(() => validateReasoningTrace(conclusionData.reasoningTraceGraph)).not.toThrow();

    // Verify existing reasoningTrace is untouched
    expect(interpretation.reasoningTrace).toBeUndefined();
  });

  it('populates valid reasoningTraceGraph on Wealth domain interpretation conclusionData', () => {
    const interpretation = interpretWealthV2(dummyHoroscope);
    const conclusionData = interpretation.conclusionData as { reasoningTraceGraph?: any };

    expect(conclusionData).toBeDefined();
    expect(conclusionData.reasoningTraceGraph).toBeDefined();
    expect(conclusionData.reasoningTraceGraph.traceId).toBe('CW-TRACE-WEALTH');
    expect(conclusionData.reasoningTraceGraph.nodes.length).toBeGreaterThan(0);
    expect(conclusionData.reasoningTraceGraph.edges.length).toBeGreaterThan(0);

    // Validate structural integrity
    expect(() => validateReasoningTrace(conclusionData.reasoningTraceGraph)).not.toThrow();
  });
});
