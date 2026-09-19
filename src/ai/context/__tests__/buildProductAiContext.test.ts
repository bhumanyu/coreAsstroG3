import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildProductAiContext } from '../aiContextFactory';
import { runAiExplanation } from '../../product/aiExplanationService';
import { Planet, Sign, type Horoscope } from '../../../types';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { mapMethodology } from '../../../product/analysis/productAnalysisMapper';
import { resolveAnalysisTemporalState } from '../../../core/analysis/resolveAnalysisTemporalState';
import { interpretCareerV2 } from '../../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../../domain/wealth/WealthDomainInterpreterV2';
import { buildLifeAnalysis } from '../../../domain/synthesis';
import type { AnalysisTemporalState } from '../../../core/analysis/AnalysisTemporalState';
import type { AiRouter } from '../../routing/AiRouter';
import type { AiRequest } from '../../types/aiRequestTypes';

describe('buildProductAiContext and runAiExplanation temporalState enforcement', () => {
  const baseHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, '2024-06-01T00:00:00.000Z');
  const context = createAnalysisContext({
    asOf: '2024-06-01T00:00:00.000Z',
    methodology: mapMethodology(CANONICAL_BIRTH_DETAILS)
  });
  const canonicalTemporalState = resolveAnalysisTemporalState(baseHoroscope, context);
  const career = interpretCareerV2(baseHoroscope, { context, temporalState: canonicalTemporalState });
  const wealth = interpretWealthV2(baseHoroscope, { context, temporalState: canonicalTemporalState });
  const lifeAnalysis = buildLifeAnalysis([career, wealth]);
  const domainInterpretations = [career, wealth];

  it('Test A: throws when temporalState is missing or undefined', () => {
    expect(() =>
      buildProductAiContext(baseHoroscope, {
        domainInterpretations,
        lifeAnalysis,
        temporalState: undefined as never
      })
    ).toThrow('buildProductAiContext requires canonical temporalState');
  });

  it('Test B: resolves Dasha from temporalState (Jupiter) and ignores embedded horoscope Dasha (Ketu)', () => {
    // Embedded horoscope has Ketu as active mahadasha
    const staleHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: {
        system: 'VIMSHOTTARI',
        birthAnchor: {
          nakshatra: 'ASHWINI',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0,
          remainingFraction: 1
        },
        mahadashas: [],
        confidence: 'HIGH',
        current: {
          at: '2020-01-01T00:00:00.000Z',
          confidence: 'HIGH',
          evidence: [],
          mahadasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2027-01-01T00:00:00.000Z',
            natal: { planet: Planet.KETU, sign: Sign.ARIES, house: 1 },
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          antardasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2021-01-01T00:00:00.000Z',
            natal: { planet: Planet.KETU, sign: Sign.ARIES, house: 1 },
            pratyantardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          pratyantardasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2020-06-01T00:00:00.000Z',
            natal: { planet: Planet.KETU, sign: Sign.ARIES, house: 1 },
            evidence: [],
            confidence: 'HIGH'
          }
        }
      }
    };

    // canonicalTemporalState computed as of 2024-06-01 has active Mahadasha JUPITER
    expect(canonicalTemporalState.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);

    const aiContext = buildProductAiContext(staleHoroscope, {
      domainInterpretations,
      lifeAnalysis,
      temporalState: canonicalTemporalState
    });

    expect(aiContext.dasha.active?.mahadasha).toBe(Planet.JUPITER);
    expect(aiContext.dasha.active?.mahadasha).not.toBe(Planet.KETU);
  });

  it('Test C: runAiExplanation routes AI request containing Jupiter Dasha from temporalState and not Ketu from horoscope', async () => {
    const staleHoroscope: Horoscope = {
      ...baseHoroscope,
      dashaInterpretation: {
        system: 'VIMSHOTTARI',
        birthAnchor: {
          nakshatra: 'ASHWINI',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0,
          remainingFraction: 1
        },
        mahadashas: [],
        confidence: 'HIGH',
        current: {
          at: '2020-01-01T00:00:00.000Z',
          confidence: 'HIGH',
          evidence: [],
          mahadasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2027-01-01T00:00:00.000Z',
            natal: { planet: Planet.KETU, sign: Sign.ARIES, house: 1 },
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          antardasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2021-01-01T00:00:00.000Z',
            natal: { planet: Planet.KETU, sign: Sign.ARIES, house: 1 },
            pratyantardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          pratyantardasha: {
            planet: Planet.KETU,
            start: '2020-01-01T00:00:00.000Z',
            end: '2020-06-01T00:00:00.000Z',
            natal: { planet: Planet.KETU, sign: Sign.ARIES, house: 1 },
            evidence: [],
            confidence: 'HIGH'
          }
        }
      }
    };

    let capturedRequest: AiRequest | undefined;
    const mockRouter: AiRouter = {
      route: async (request: AiRequest) => {
        capturedRequest = request;
        return {
          response: {
            content: '',
            structuredOutput: {
              status: 'SUCCESS',
              conclusion: 'Explanation verified.',
              supportingEvidenceIds: [],
              challengingEvidenceIds: [],
              unresolvedQuestions: [],
              warnings: []
            },
            warnings: []
          },
          providerId: 'mock-provider',
          providerName: 'Mock Provider',
          providerKind: 'LOCAL_RULES',
          routingMode: 'LOCAL_ONLY',
          fallbackUsed: false,
          selectionReason: 'TASK_MATCH',
          requestId: request.requestId
        };
      }
    } as unknown as AiRouter;

    const result = await runAiExplanation({
      horoscope: staleHoroscope,
      task: 'LIFE_ANALYSIS_EXPLANATION',
      domainInterpretations,
      lifeAnalysis,
      temporalState: canonicalTemporalState,
      router: mockRouter
    });

    expect(result.kind).toBe('SUCCESS');
    expect(capturedRequest).toBeDefined();
    expect(capturedRequest?.context.dasha.active?.mahadasha).toBe(Planet.JUPITER);
    expect(capturedRequest?.context.dasha.active?.mahadasha).not.toBe(Planet.KETU);
  });
});
