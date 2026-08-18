import { describe, it, expect } from 'vitest';
import {
  TASK_REQUIRED_CAPABILITIES,
  requiredCapabilitiesForTask,
  requiredCapabilitiesForRequest
} from './providerCapabilityMap';
import type { AiTask, AiRequest } from '../types/aiRequestTypes';
import type { AiContext } from '../types/aiContextTypes';

describe('providerCapabilityMap', () => {
  const dummyContext = {} as AiContext;

  it('should map all six AiTask types correctly in TASK_REQUIRED_CAPABILITIES', () => {
    expect(TASK_REQUIRED_CAPABILITIES.CHART_SYNTHESIS).toEqual(['CHART_SYNTHESIS']);
    expect(TASK_REQUIRED_CAPABILITIES.CAREER_ANALYSIS).toEqual(['CAREER']);
    expect(TASK_REQUIRED_CAPABILITIES.WEALTH_ANALYSIS).toEqual(['WEALTH']);
    expect(TASK_REQUIRED_CAPABILITIES.DASHA_ANALYSIS).toEqual(['DASHA']);
    expect(TASK_REQUIRED_CAPABILITIES.LIFE_THEME_ANALYSIS).toEqual(['LIFE_THEMES']);
    expect(TASK_REQUIRED_CAPABILITIES.GENERAL_QUERY).toEqual([]);
  });

  it('should return frozen arrays for requiredCapabilitiesForTask', () => {
    const chartCaps = requiredCapabilitiesForTask('CHART_SYNTHESIS');
    expect(chartCaps).toEqual(['CHART_SYNTHESIS']);
    expect(Object.isFrozen(chartCaps)).toBe(true);

    const generalCaps = requiredCapabilitiesForTask('GENERAL_QUERY');
    expect(generalCaps).toEqual([]);
  });

  it('should append STRUCTURED_OUTPUT capability when responseFormat is STRUCTURED', () => {
    const narrativeRequest: AiRequest = {
      requestId: 'req-1',
      schemaVersion: '1.0.0',
      task: 'CAREER_ANALYSIS',
      context: dummyContext,
      responseFormat: 'NARRATIVE'
    };
    expect(requiredCapabilitiesForRequest(narrativeRequest)).toEqual(['CAREER']);

    const structuredRequest: AiRequest = {
      requestId: 'req-2',
      schemaVersion: '1.0.0',
      task: 'CAREER_ANALYSIS',
      context: dummyContext,
      responseFormat: 'STRUCTURED'
    };
    expect(requiredCapabilitiesForRequest(structuredRequest)).toEqual([
      'CAREER',
      'STRUCTURED_OUTPUT'
    ]);
  });

  it('should handle GENERAL_QUERY with structured output without duplicating capabilities', () => {
    const structuredGeneral: AiRequest = {
      requestId: 'req-3',
      schemaVersion: '1.0.0',
      task: 'GENERAL_QUERY',
      context: dummyContext,
      responseFormat: 'STRUCTURED'
    };
    expect(requiredCapabilitiesForRequest(structuredGeneral)).toEqual([
      'STRUCTURED_OUTPUT'
    ]);
  });
});
