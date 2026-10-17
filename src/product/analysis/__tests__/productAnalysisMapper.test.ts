import { describe, it, expect } from 'vitest';
import type { BirthDetails, Horoscope } from '../../../types';
import { AyanamsaType, Planet, Sign } from '../../../types';
import {
  mapProductAnalysis,
  createAnalysisId,
  deriveProductAnalysisStatus,
  buildFailedProductAnalysis,
  mapD10Relationship,
  mapD2Relationship,
  mapSpeculativeRisk,
  mapMethodology
} from '../productAnalysisMapper';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import {
  selectCareer,
  selectWealth,
  selectDasha,
  selectReasoning,
  selectOverview,
  selectAllEvidence,
  selectEvidenceById,
  selectEvidenceByIds,
  selectDashaHierarchy,
  deriveOverallStatus
} from '../productAnalysisSelectors';
import type { ProductEvidence, ProductWarning } from '../productAnalysisTypes';
import type { LifeAnalysisViewModel } from '../../life-analysis/lifeAnalysisTypes';
import type { CareerProfessionAnalysis } from '../../../domain/career/careerProfession/careerProfessionTypes';

describe('Canonical ProductAnalysis Mapper & Selectors (P-UI-02)', () => {
  const sampleBirth: BirthDetails = {
    name: 'Test Chart A',
    placeOfBirth: 'New Delhi, India',
    dateTimeStr: '1990-01-15T08:30:00.000Z',
    timeZone: 'Asia/Kolkata',
    latitude: 28.6139,
    longitude: 77.209,
    ayanamsa: AyanamsaType.LAHIRI
  };

  const sampleHoroscope = {
    birthDetails: sampleBirth,
    rasiChart: {
      ascendantSign: Sign.CAPRICORN,
      ascendantLongitude: 285.5
    },
    planetFacts: {
      [Planet.SUN]: { sign: Sign.CAPRICORN, position: { sign: Sign.CAPRICORN } },
      [Planet.MOON]: {
        sign: Sign.LEO,
        position: { sign: Sign.LEO },
        nakshatraResult: { nakshatra: 'Magha' }
      }
    }
  } as unknown as Horoscope;

  const sampleViewModel: LifeAnalysisViewModel = {
    status: 'READY',
    overall: {
      status: 'STRONGLY_SUPPORTED',
      headline: 'Dominant Life Direction',
      statement: 'Natal indicators show sustained executive trajectory.',
      strongestDomainNames: ['CAREER'],
      challengedDomainNames: []
    },
    strongestDomains: [],
    domains: [
      {
        domain: 'CAREER',
        displayName: 'Career & Vocation',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        headline: 'Executive Trajectory',
        statement: 'High vocational promise.',
        conclusion: 'High vocational promise across 10th lord and Lagna.',
        supportingEvidenceCount: 2,
        challengingEvidenceCount: 0
      },
      {
        domain: 'WEALTH',
        displayName: 'Wealth & Prosperity',
        status: 'SUPPORTED',
        strength: 'MODERATE',
        confidence: 'MODERATE',
        headline: 'Stable Wealth Accumulation',
        statement: 'Solid 2nd house foundation.',
        conclusion: 'Solid 2nd house foundation.',
        supportingEvidenceCount: 1,
        challengingEvidenceCount: 0
      }
    ],
    careerDetail: {
      status: 'STRONG',
      natalPromise: 'STRONG',
      d10Relationship: 'CONFIRMS',
      currentDashaEffect: 'ACTIVATES',
      currentTransitEffect: 'TRIGGER',
      promiseHeadline: 'Executive Trajectory',
      promiseStatement: 'High vocational promise across 10th lord and Lagna.',
      capacityLevel: 'LEADERSHIP',
      manifestations: ['Corporate Leadership', 'Strategic Direction'],
      d10Statement: 'Dasamsa confirms strong 10th house status.',
      timing: {
        status: 'AVAILABLE',
        mahadasha: {
          period: 'MD',
          planet: Planet.JUPITER,
          effect: 'ACTIVATES',
          evidenceIds: ['ev_md_1'],
          statement: 'Jupiter Mahadasha establishes primary career elevation.'
        },
        antardasha: {
          period: 'AD',
          planet: Planet.SATURN,
          effect: 'CHALLENGES',
          evidenceIds: ['ev_ad_1'],
          statement: 'Saturn Antardasha introduces structural discipline.'
        },
        pratyantardasha: {
          period: 'PD',
          planet: Planet.MERCURY,
          effect: 'ACTIVATES',
          evidenceIds: ['ev_pd_1'],
          statement: 'Mercury Pratyantardasha triggers communication gains.'
        },
        currentActivation: 'Jupiter / Saturn',
        currentPressure: 'High structural demands',
        transitEffect: 'TRIGGER',
        transitStatement: 'Saturn transits natal 3rd house.'
      },
      qualifications: [
        {
          type: 'COMBUSTION',
          severity: 'LOW',
          description: 'Mercury combust by 8 degrees.'
        }
      ],
      actionableTakeaways: ['Focus on strategic management']
    },
    wealthDetail: {
      status: 'MODERATE',
      overallStatus: 'SUPPORTED',
      natalPromise: 'MODERATE',
      accumulationStatus: 'STRONGLY_SUPPORTED',
      gainsStatus: 'SUPPORTED',
      fortuneStatus: 'STRONGLY_SUPPORTED',
      speculationStatus: 'SUPPORTED',
      d2Relationship: 'CONFIRMS',
      currentDashaEffect: 'ACTIVATES',
      currentTransitEffect: 'NO_MATERIAL_TRIGGER',
      promiseHeadline: 'Stable Accumulation',
      promiseStatement: 'Consistent growth with steady savings.',
      accumulation: { status: 'STRONGLY_SUPPORTED', statement: '2nd lord exalted.' },
      gains: { status: 'SUPPORTED', statement: '11th lord neutral.' },
      fortune: { status: 'STRONGLY_SUPPORTED', statement: '9th lord well-placed.' },
      speculation: { status: 'SUPPORTED', statement: '5th house stable.' },
      d2Statement: 'Hora D2 confirms liquid capital accumulation.',
      timing: {
        status: 'AVAILABLE',
        currentActivation: 'Jupiter dasha brings steady financial inflow.',
        transitEffect: 'NO_MATERIAL_TRIGGER',
        transitStatement: 'Transits neutral for wealth.'
      },
      qualifications: []
    },
    sharedTiming: [],
    conflicts: [],
    confidence: 'HIGH',
    completeness: { overall: 'COMPLETE', label: 'Complete' },
    why: {
      integrity: { status: 'VALID', totalReferenced: 0, resolved: 0, unresolved: 0, unresolvedIds: [] },
      evidence: [],
      grouped: { primary: [], supporting: [], challenging: [], conflicting: [], modifiers: [], confirmations: [], timing: [] }
    },
    evidence: []
  };

  const sampleInputEvidence: ProductEvidence = {
    id: 'ev_career_gold_101',
    title: '10th Lord Exaltation in Kendra',
    statement: 'Mars exalted in Capricorn in the 1st house forming Ruchaka Yoga.',
    direction: 'SUPPORT',
    role: 'PRIMARY',
    source: 'CAREER_ENGINE',
    ruleId: 'RULE_RUCHAKA_YOGA_10TH',
    derivedFromIds: ['ev_astronomy_mars_capricorn', 'ev_house_1_kendra']
  };

  const sampleContext = createAnalysisContext({
    asOf: '2026-01-15T08:30:00.000Z',
    methodology: mapMethodology(sampleBirth)
  });

  it('1. MANDATORY evidence-provenance preservation: deep-equals input ProductEvidence', () => {
    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      careerEvidence: [sampleInputEvidence],
      context: sampleContext
    });

    expect(analysis.career.evidence).toHaveLength(1);
    const mappedEvidence = analysis.career.evidence[0];

    // Assert that every provenance field is intact and deep-equals the input
    expect(mappedEvidence).toEqual(sampleInputEvidence);
    expect(mappedEvidence.id).toBe('ev_career_gold_101');
    expect(mappedEvidence.title).toBe('10th Lord Exaltation in Kendra');
    expect(mappedEvidence.statement).toBe('Mars exalted in Capricorn in the 1st house forming Ruchaka Yoga.');
    expect(mappedEvidence.direction).toBe('SUPPORT');
    expect(mappedEvidence.role).toBe('PRIMARY');
    expect(mappedEvidence.source).toBe('CAREER_ENGINE');
    expect(mappedEvidence.ruleId).toBe('RULE_RUCHAKA_YOGA_10TH');
    expect(mappedEvidence.derivedFromIds).toEqual(['ev_astronomy_mars_capricorn', 'ev_house_1_kendra']);
  });

  it('2. D10 relationship mapping preserves semantics and never returns percentage', () => {
    expect(mapD10Relationship('CONFIRMS')).toBe('CONFIRMS');
    expect(mapD10Relationship('PARTIALLY_CONFIRMS')).toBe('PARTIALLY_CONFIRMS');
    expect(mapD10Relationship('MODIFIES')).toBe('MODIFIES');
    expect(mapD10Relationship('CONFLICTS')).toBe('CONFLICTS');
    expect(mapD10Relationship(undefined)).toBe('UNAVAILABLE');
    expect(mapD10Relationship('unknown_string')).toBe('UNAVAILABLE');

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      context: sampleContext
    });
    expect(analysis.career.d10.relationship).toBe('CONFIRMS');
    expect('percentage' in analysis.career.d10).toBe(false);
  });

  it('3. D2 relationship and speculative risk mapping', () => {
    expect(mapD2Relationship('CONFIRMS')).toBe('CONFIRMS');
    expect(mapD2Relationship('MODIFIES')).toBe('MODIFIES');
    expect(mapD2Relationship(undefined)).toBe('UNAVAILABLE');

    expect(mapSpeculativeRisk('EXTREME')).toBe('EXTREME');
    expect(mapSpeculativeRisk('HIGH')).toBe('HIGH');
    expect(mapSpeculativeRisk('MODERATE')).toBe('MODERATE');
    expect(mapSpeculativeRisk('LOW')).toBe('LOW');
    expect(mapSpeculativeRisk(undefined)).toBe('UNAVAILABLE');
  });

  it('4. Dasha hierarchy mapping: MD -> PRIMARY, AD -> MODIFIER, PD -> REFINEMENT', () => {
    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      context: sampleContext
    });

    const { periods } = analysis.career.activation.dasha;
    expect(periods).toHaveLength(3);

    const md = periods.find((p) => p.level === 'MD')!;
    const ad = periods.find((p) => p.level === 'AD')!;
    const pd = periods.find((p) => p.level === 'PD')!;

    expect(md.role).toBe('PRIMARY');
    expect(md.direction).toBe('SUPPORT');
    expect(md.evidenceIds).toEqual(['ev_md_1']);

    expect(ad.role).toBe('MODIFIER');
    expect(ad.direction).toBe('CHALLENGE');
    expect(ad.evidenceIds).toEqual(['ev_ad_1']);

    expect(pd.role).toBe('REFINEMENT');
    expect(pd.direction).toBe('SUPPORT');
    expect(pd.evidenceIds).toEqual(['ev_pd_1']);

    // Dasha hierarchy selector
    const hierarchy = selectDashaHierarchy(analysis);
    expect(hierarchy.map((p) => p.level)).toEqual(['MD', 'AD', 'PD']);
  });

  it('4.5. Profession field flows from careerDetail.profession to CareerProductAnalysis', () => {
    // When profession is absent, the field should be undefined (fail-closed)
    const analysisWithoutProfession = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      context: sampleContext
    });

    expect(analysisWithoutProfession.career.profession).toBeUndefined();
  });

  it('4.6. Profession with candidates maps correctly with available status and d10Status derivation', () => {
    // Test COMPLETE status with candidates
    const viewModelWithCompleteProfession: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        profession: {
          status: 'COMPLETE',
          candidates: [
            {
              candidateId: 'candidate-1',
              domain: 'TECHNOLOGY',
              family: 'TECHNICAL_LEADERSHIP',
              basis: 'EXPRESSION',
              expressionTypes: ['TECHNICAL_SPECIALIZATION'],
              mechanismTypes: [],
              patternIds: ['pattern-1'],
              d10Status: 'QUALIFIED',
              evidence: [
                {
                  evidenceId: 'ev-1',
                  basis: 'EXPRESSION',
                  sourceIds: ['source-1'],
                  ruleId: 'RULE_1',
                  statement: 'Evidence for technical leadership'
                }
              ],
              domainEvidenceIds: ['domain-ev-1'],
              relatedEvidenceIds: ['related-ev-1'],
              ruleId: 'RULE_CANDIDATE_1'
            },
            {
              candidateId: 'candidate-2',
              domain: 'FINANCE',
              family: 'FINANCIAL_SERVICES',
              basis: 'MECHANISM',
              expressionTypes: [],
              mechanismTypes: ['RESOURCE_MANAGEMENT'],
              patternIds: ['pattern-2'],
              d10Status: 'NOT_PROVIDED',
              evidence: [
                {
                  evidenceId: 'ev-2',
                  basis: 'MECHANISM',
                  sourceIds: ['source-2'],
                  ruleId: 'RULE_2',
                  statement: 'Evidence for financial services'
                }
              ],
              domainEvidenceIds: ['domain-ev-2'],
              relatedEvidenceIds: ['related-ev-2'],
              ruleId: 'RULE_CANDIDATE_2'
            }
          ],
          unresolvedExpressionTypes: [],
          mappedTypes: ['TECHNICAL_SPECIALIZATION'],
          missingInputs: [],
          provenance: {
            expressionIds: [],
            mechanismIds: [],
            patternIds: [],
            evidenceIds: [],
            sourceIds: [],
            ruleIds: []
          }
        }
      }
    } as any;

    const analysisComplete = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: viewModelWithCompleteProfession,
      context: sampleContext
    });

    expect(analysisComplete.career.profession).toBeDefined();
    expect(analysisComplete.career.profession!.available).toBe(true);
    expect(analysisComplete.career.profession!.status).toBe('COMPLETE');
    expect(analysisComplete.career.profession!.candidates).toHaveLength(2);
    expect(analysisComplete.career.profession!.candidates[0].candidateId).toBe('candidate-1');
    expect(analysisComplete.career.profession!.candidates[0].d10Status).toBe('QUALIFIED');
    expect(analysisComplete.career.profession!.candidates[1].d10Status).toBe('NOT_PROVIDED');
    // Aggregate d10Status should be QUALIFIED (any candidate qualified)
    expect(analysisComplete.career.profession!.d10Status).toBe('QUALIFIED');

    // Test PARTIAL status with candidates
    const viewModelWithPartialProfession: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        profession: {
          status: 'PARTIAL',
          candidates: [
            {
              candidateId: 'candidate-3',
              domain: 'HEALTHCARE',
              family: 'MEDICAL_PRACTICE',
              basis: 'EXPRESSION',
              expressionTypes: ['SERVICE_WORK'],
              mechanismTypes: [],
              patternIds: ['pattern-3'],
              d10Status: 'UNAVAILABLE',
              evidence: [
                {
                  evidenceId: 'ev-3',
                  basis: 'EXPRESSION',
                  sourceIds: ['source-3'],
                  ruleId: 'RULE_3',
                  statement: 'Evidence for medical practice'
                }
              ],
              domainEvidenceIds: ['domain-ev-3'],
              relatedEvidenceIds: ['related-ev-3'],
              ruleId: 'RULE_CANDIDATE_3'
            }
          ],
          unresolvedExpressionTypes: [],
          mappedTypes: ['SERVICE_WORK'],
          missingInputs: ['D10_DATA'],
          provenance: {
            expressionIds: [],
            mechanismIds: [],
            patternIds: [],
            evidenceIds: [],
            sourceIds: [],
            ruleIds: []
          }
        }
      }
    };

    const analysisPartial = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: viewModelWithPartialProfession as any,
      context: sampleContext
    });

    expect(analysisPartial.career.profession).toBeDefined();
    expect(analysisPartial.career.profession!.available).toBe(true); // PARTIAL is available
    expect(analysisPartial.career.profession!.status).toBe('PARTIAL');
    expect(analysisPartial.career.profession!.candidates).toHaveLength(1);
    // Aggregate d10Status should be UNAVAILABLE (single candidate is UNAVAILABLE)
    expect(analysisPartial.career.profession!.d10Status).toBe('UNAVAILABLE');

    // Test INSUFFICIENT_DATA status (should not be available)
    const viewModelWithInsufficientData: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        profession: {
          status: 'INSUFFICIENT_DATA',
          candidates: [],
          unresolvedExpressionTypes: [],
          mappedTypes: [],
          missingInputs: ['EXPRESSIONS'],
          provenance: {
            expressionIds: [],
            mechanismIds: [],
            patternIds: [],
            evidenceIds: [],
            sourceIds: [],
            ruleIds: []
          }
        }
      }
    };

    const analysisInsufficient = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: viewModelWithInsufficientData as any,
      context: sampleContext
    });

    expect(analysisInsufficient.career.profession).toBeDefined();
    expect(analysisInsufficient.career.profession!.available).toBe(false); // INSUFFICIENT_DATA is not available
    expect(analysisInsufficient.career.profession!.status).toBe('INSUFFICIENT_DATA');
    expect(analysisInsufficient.career.profession!.candidates).toHaveLength(0);
    // Aggregate d10Status should be NOT_PROVIDED (no candidates)
    expect(analysisInsufficient.career.profession!.d10Status).toBe('NOT_PROVIDED');
  });

  it('5. Status derivation: READY, PARTIAL, and ERROR', () => {
    const readyAnalysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      context: sampleContext
    });
    expect(readyAnalysis.status).toBe('READY');
    expect(deriveOverallStatus(readyAnalysis)).toBe('READY');

    // Warning triggers PARTIAL
    const warning: ProductWarning = {
      code: 'PARTIAL_CALC',
      message: 'Planetary strength calculation partial',
      severity: 'WARNING'
    };
    const partialAnalysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      warnings: [warning],
      context: sampleContext
    });
    expect(partialAnalysis.status).toBe('PARTIAL');

    // Error warning triggers ERROR
    const errorWarning: ProductWarning = {
      code: 'ENGINE_CRASH',
      message: 'Transit engine failed',
      severity: 'ERROR'
    };
    const errorAnalysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      warnings: [errorWarning],
      context: sampleContext
    });
    expect(errorAnalysis.status).toBe('ERROR');
  });

  it('6. Deterministic analysisId produces distinct IDs for different births', () => {
    const asOf = '2026-01-01T00:00:00.000Z';
    const idA = createAnalysisId(sampleBirth, asOf);

    const birthB: BirthDetails = {
      ...sampleBirth,
      dateTimeStr: '1985-05-20T14:15:00.000Z',
      latitude: 40.7128,
      longitude: -74.006
    };
    const idB = createAnalysisId(birthB, asOf);

    expect(idA).not.toBe(idB);
    expect(idA).toContain('pa_');
    expect(idB).toContain('pa_');
  });

  it('7. Selectors return identical object references without recomputation', () => {
    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      careerEvidence: [sampleInputEvidence],
      context: sampleContext
    });

    expect(selectCareer(analysis)).toBe(analysis.career);
    expect(selectWealth(analysis)).toBe(analysis.wealth);
    expect(selectDasha(analysis)).toBe(analysis.dasha);
    expect(selectReasoning(analysis)).toBe(analysis.reasoning);

    const overview = selectOverview(analysis);
    expect(overview.analysisId).toBe(analysis.analysisId);
    expect(overview.careerPromise).toBe(analysis.career.promise);
    expect(overview.wealthOverall).toBe(analysis.wealth.overall);

    const allEv = selectAllEvidence(analysis);
    expect(allEv).toContain(sampleInputEvidence);

    const found = selectEvidenceById(analysis, 'ev_career_gold_101');
    expect(found).toBe(sampleInputEvidence);

    const map = selectEvidenceByIds(analysis, ['ev_career_gold_101']);
    expect(map.get('ev_career_gold_101')).toBe(sampleInputEvidence);
  });

  it('8. buildFailedProductAnalysis returns clean fallback without throwing', () => {
    const failed = buildFailedProductAnalysis(sampleBirth, new Error('Computational crash'), sampleContext);
    expect(failed.status).toBe('ERROR');
    expect(failed.warnings).toHaveLength(1);
    expect(failed.warnings[0].severity).toBe('ERROR');
    expect(failed.warnings[0].message).toBe('Computational crash');
    expect(failed.career.promise.strength).toBe('UNAVAILABLE');
    expect(failed.wealth.overall.status).toBe('UNAVAILABLE');
    expect(failed.ai.status).toBe('FAILED');
  });
});
