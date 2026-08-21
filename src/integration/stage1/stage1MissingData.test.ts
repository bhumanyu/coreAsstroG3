import { describe, expect, it } from 'vitest';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { buildLifeAnalysis } from '../../domain/synthesis';
import {
  createTestHoroscope,
  STAGE1_GOLDEN_WEALTH,
  buildHighPressureCareerInterpretation,
  buildIncompleteCareerInterpretation
} from './stage1GoldenFixture';
import type { Horoscope } from '../../types';

describe('Stage 1 - Missing Data & Conflict Resolution Invariants', () => {
  it('evaluates D10 relationship as UNAVAILABLE when D10 divisional data is missing', () => {
    const baseHoroscope = createTestHoroscope();
    const missingD10Horoscope: Horoscope = {
      ...baseHoroscope,
      divisionalInterpretation: baseHoroscope.divisionalInterpretation
        ? { ...baseHoroscope.divisionalInterpretation, d10: undefined }
        : undefined,
      fullNatalAnalysis: {
        ...baseHoroscope.fullNatalAnalysis,
        d10: undefined as any
      },
      vargas: baseHoroscope.vargas
        ? { ...baseHoroscope.vargas, D10: undefined as any }
        : undefined
    };

    const career = interpretCareerV2(missingD10Horoscope);
    const d10Conf = career.vargaConfirmations.find((v) => v.varga === 'D10');

    expect(d10Conf).toBeDefined();
    expect(d10Conf?.relationship).toBe('UNAVAILABLE');
    expect(d10Conf?.relationship).not.toBe('CONFIRMS');
  });

  it('evaluates Dasha effect as INSUFFICIENT_DATA or DOES_NOT_ACTIVATE when timing data is missing', () => {
    const baseHoroscope = createTestHoroscope();
    const missingTimingHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: undefined,
      vimshottari: undefined,
      fullNatalAnalysis: {
        ...baseHoroscope.fullNatalAnalysis,
        currentDasha: undefined as any,
        vimshottari: undefined as any
      }
    };

    const career = interpretCareerV2(missingTimingHoroscope);

    expect(['INSUFFICIENT_DATA', 'DOES_NOT_ACTIVATE']).toContain(
      career.dashaActivation.effect
    );
  });

  it('validates incomplete career fixture evaluation preserving UNAVAILABLE status', () => {
    const incompleteCareer = buildIncompleteCareerInterpretation();
    const d10Conf = incompleteCareer.vargaConfirmations.find((v) => v.varga === 'D10');

    expect(d10Conf?.relationship).toBe('UNAVAILABLE');
    expect(incompleteCareer.dashaActivation.effect).toBe('INSUFFICIENT_DATA');
  });

  it('validates conflict resolution invariant: high timing pressure does not collapse strong natal career promise', () => {
    const highPressureCareer = buildHighPressureCareerInterpretation();
    const analysis = buildLifeAnalysis([highPressureCareer, STAGE1_GOLDEN_WEALTH]);

    const careerSummary = analysis.domains.find((d) => d.domain === 'CAREER');
    expect(careerSummary).toBeDefined();

    // Invariant: timing pressure does NOT collapse natal status to INSUFFICIENT_DATA or UNDETERMINED
    expect(careerSummary?.status).not.toBe('INSUFFICIENT_DATA');
    expect(careerSummary?.status).not.toBe('UNDETERMINED');
    expect(careerSummary?.status).toBe('STRONGLY_SUPPORTED');
  });
});
