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
  mapSpeculativePropensity,
  sanitizeSpeculativePropensityDescription,
  mapMethodology,
  mapDashaPeriodOptions,
  mapConfidence,
  mapEvidenceItems
} from '../productAnalysisMapper';
import { createAnalysisContext } from '../../../core/analysis/analysisContextFactory';
import { listSelectableMdAdPeriods } from '../../../core/analysis/selectedMdAdPeriod';
import { createUnavailableWealthFinancialDataSet, createUserReportedFinancialDatum, createConnectedFinancialDatum } from '../../../domain/wealth/wealthFinancialData';
import { createDomainInterpretation, createDomainEvidence, createNatalPromise } from '../../../domain/interpretation';
import type { ProductTemporalRelation } from '../productAnalysisTypes';
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
import type { CareerOutcomeAnalysis } from '../../../domain/career/careerOutcomeQualification/careerOutcomeTypes';

describe('Canonical ProductAnalysis Mapper & Selectors (P-UI-02)', () => {
  it('maps evidence direction and derivation from C4 polarity and provenance, not role', () => {
    const evidence = createDomainEvidence({
      id: 'CAREER_STRUCTURAL_TEST',
      sourceType: 'HOUSE',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'C4_STRUCTURAL_REASONING',
      statement: 'A structural career challenge.',
      polarity: 'CHALLENGING',
      strength: 'MODERATE',
      priority: 1,
      ruleId: 'CAREER_STRUCTURAL_TEST',
      relatedEvidenceIds: [],
      provenance: {
        evidenceId: 'CAREER_STRUCTURAL_TEST',
        ruleId: 'CAREER_STRUCTURAL_TEST',
        domain: 'CAREER',
        axis: 'NATAL',
        source: 'C4_STRUCTURAL_REASONING',
        effect: 'CHALLENGE',
        derivedFromIds: ['C4_STRUCTURAL_REASONING'],
        strength: 'PRIMARY'
      }
    });

    expect(mapEvidenceItems([evidence])[0]).toMatchObject({
      role: 'PRIMARY',
      direction: 'CHALLENGE',
      derivedFromIds: ['C4_STRUCTURAL_REASONING']
    });
  });

  it('preserves UNAVAILABLE confidence through the product confidence mapper', () => {
    expect(mapConfidence('UNAVAILABLE')).toBe('UNAVAILABLE');
    expect(mapConfidence('unavailable')).toBe('UNAVAILABLE');
  });

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
          conditionAssessment: 'PARTIAL',
          afflictionAssessed: false,
          statement: 'Jupiter Mahadasha establishes primary career elevation.'
        },
        antardasha: {
          period: 'AD',
          planet: Planet.SATURN,
          effect: 'CHALLENGES',
          evidenceIds: ['ev_ad_1'],
          conditionAssessment: 'FULL',
          afflictionAssessed: true,
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
      actionableTakeaways: ['Focus on strategic management'],
      careerEventTimeline: {
        reasoningVersion: 'B06',
        methodVersion: 'B06-EVENT-SPECIFIC-TIMELINE-v1',
        status: 'GENERIC_WINDOWS_ONLY',
        taxonomy: [{
          eventType: 'PROMOTION_ROLE_EXPANSION',
          validationStatus: 'UNVALIDATED',
          requiredEvidence: ['D1_NATAL_PROMISE', 'D10_SAME_EXPRESSION_QUALIFICATION'],
          validationGap: 'Authority expression is not evidence of promotion.',
          releaseEnabled: false
        }],
        eventCandidates: [],
        genericWindows: [{
          windowId: 'B06_GENERIC_WINDOW:source-event-1',
          sourceEventId: 'source-event-1',
          genericType: 'CAREER_OPPORTUNITY_WINDOW',
          status: 'GENERIC_CANDIDATE_WINDOW',
          specificEventInference: 'NOT_MADE',
          timing: { type: 'DASHA_PERIOD_WINDOW', start: '2027-01-01', end: '2027-12-31' },
          opportunityId: 'opportunity-1',
          activationId: 'activation-1',
          qualificationBasis: 'B02_NATAL_PROMISE_AND_LINKED_ACTIVATION',
          conditions: ['B02_CANDIDATE_OUTCOME_QUALIFIED'],
          counterEvidenceOccurrenceIds: [],
          evidence: {
            semanticIdentityIds: ['natal-identity-1', 'activation-1'],
            occurrenceIds: ['natal-occ-1', 'dasha-occ-1'],
            rootIdentityKeys: ['natal-root-1'],
            ruleIds: ['P2-09B-EVT-01']
          },
          limitations: ['Generic candidate window only.']
        }],
        observedOutcomeReportIds: ['report-1'],
        diagnostics: ['EVENT_SPECIFIC_TAXONOMY_NOT_VALIDATED'],
        guaranteedEventsAvailable: false,
        numericProbabilityAvailable: false,
        statement: 'Generic candidate window only.'
      }
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
      d2AvailabilityReason: 'D2 calculation and interpretation have not passed independent validation; D2 remains unavailable.',
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
    expect(analysis.wealth.d2.relationship).toBe('UNAVAILABLE');
    expect(analysis.wealth.d2.statement).toContain('independent validation');
    expect(analysis.career.eventTimeline?.reasoningVersion).toBe('B06');
    expect(analysis.career.eventTimeline?.genericWindows[0].specificEventInference).toBe('NOT_MADE');
    expect(analysis.career.eventTimeline?.taxonomy[0].releaseEnabled).toBe(false);
    expect(analysis.career.eventTimeline?.observedOutcomeReportIds).toEqual(['report-1']);
  });

  it('projects domain diagnostics into product warnings with their severity and domain', () => {
    const interpretation = createDomainInterpretation({
      domain: 'CAREER',
      natalPromise: createNatalPromise({ domain: 'CAREER', strength: 'UNDETERMINED' }),
      diagnostics: [
        {
          code: 'C11_DUPLICATE_EXPRESSION_MODE',
          severity: 'ERROR',
          message: 'Contradictory duplicate manifestation mode.'
        },
        {
          code: 'C11_UNRESOLVED_EVIDENCE_IDENTITY_KEY',
          severity: 'WARNING',
          message: 'An expression evidence identity key did not resolve.'
        }
      ]
    });

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      context: sampleContext,
      domainInterpretations: [interpretation]
    });

    expect(analysis.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'C11_DUPLICATE_EXPRESSION_MODE',
        severity: 'ERROR',
        domain: 'CAREER'
      }),
      expect.objectContaining({
        code: 'C11_UNRESOLVED_EVIDENCE_IDENTITY_KEY',
        severity: 'WARNING',
        domain: 'CAREER'
      })
    ]));
  });

  it('projects structured canonical career and wealth synthesis while retaining diagnostic statements', () => {
    const lifeAnalysisViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        canonicalFinalSynthesis: {
          finalStatus: 'MIXED',
          finalDirection: 'MIXED',
          finalStrength: 'MIXED',
          confidence: 'HIGH',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG',
          dashaDirection: 'SUPPORT',
          timingStatus: 'NOT_ACTIVE'
        } as NonNullable<LifeAnalysisViewModel['careerDetail']>['canonicalFinalSynthesis']
      },
      wealthDetail: {
        ...sampleViewModel.wealthDetail!,
        finalSynthesis: {
          finalStatus: 'MIXED',
          promiseStatus: 'MIXED',
          confidence: 'MEDIUM',
          primaryStrength: 'STRONG',
          activationStatus: 'SUPPORT',
          timingStatus: 'INSUFFICIENT_DATA',
          dimensions: {
            ACCUMULATION: { finalStatus: 'STRONG' },
            GAINS: { finalStatus: 'CHALLENGED' },
            FORTUNE: { finalStatus: 'MIXED' },
            SPECULATION: { finalStatus: 'INSUFFICIENT_DATA' }
          }
        } as NonNullable<LifeAnalysisViewModel['wealthDetail']>['finalSynthesis']
      }
    };

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel,
      context: sampleContext
    });

    expect(analysis.career.synthesis).toMatchObject({
      finalStatus: 'MIXED',
      finalDirection: 'MIXED',
      finalStrength: 'MIXED',
      confidence: 'HIGH',
      natalDirection: 'MIXED',
      natalStrength: 'STRONG',
      dashaDirection: 'SUPPORT',
      timingStatus: 'NOT_ACTIVE'
    });
    expect(analysis.wealth.synthesis).toMatchObject({
      overallStatus: 'MIXED',
      promiseStatus: 'MIXED',
      dimensionStatuses: {
        ACCUMULATION: 'STRONG',
        GAINS: 'CHALLENGED',
        FORTUNE: 'MIXED',
        SPECULATION: 'INSUFFICIENT_DATA'
      },
      confidence: 'MEDIUM',
      natalStrength: 'STRONG',
      dashaDirection: 'SUPPORT',
      timingStatus: 'INSUFFICIENT_DATA'
    });
    expect(analysis.career.synthesis?.statement).toBe(sampleViewModel.careerDetail?.promiseStatement);
    expect(analysis.career.synthesis?.canonicalTraceStatement).toBeUndefined();
    expect(analysis.wealth.synthesis?.statement).toBe(sampleViewModel.wealthDetail?.promiseStatement);
  });

  it('keeps a canonical C11 trace statement out of promise presentation fields', () => {
    const traceStatement = 'MIXED CHALLENGE SUPPORT INSUFFICIENT_DATA NOT_ACTIVE';
    const lifeAnalysisViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        canonicalFinalSynthesis: {
          finalStatus: 'MIXED',
          finalDirection: 'MIXED',
          finalStrength: 'MIXED',
          confidence: 'MEDIUM',
          natalDirection: 'MIXED',
          natalStrength: 'STRONG',
          dashaDirection: 'SUPPORT',
          timingStatus: 'NOT_ACTIVE',
          statement: traceStatement
        } as NonNullable<LifeAnalysisViewModel['careerDetail']>['canonicalFinalSynthesis']
      }
    };

    const career = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel,
      context: sampleContext
    }).career;

    expect(career.promise.headline).not.toBe(traceStatement);
    expect(career.promise.statement).not.toBe(traceStatement);
    expect(career.promise.headline).not.toMatch(/\b(MIXED|CHALLENGE|SUPPORT|INSUFFICIENT_DATA|NOT_ACTIVE)\b/);
    expect(career.promise.statement).not.toMatch(/\b(MIXED|CHALLENGE|SUPPORT|INSUFFICIENT_DATA|NOT_ACTIVE)\b/);
    expect(career.synthesis?.canonicalTraceStatement).toBe(traceStatement);
  });

  it('uses canonical C11 confidence instead of the legacy career summary confidence', () => {
    const lifeAnalysisViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        canonicalFinalSynthesis: {
          finalStatus: 'CHALLENGED',
          finalDirection: 'CHALLENGE',
          finalStrength: 'WEAK',
          confidence: 'LOW',
          natalDirection: 'CHALLENGE',
          natalStrength: 'WEAK',
          dashaDirection: 'UNAVAILABLE',
          timingStatus: 'UNKNOWN'
        } as NonNullable<LifeAnalysisViewModel['careerDetail']>['canonicalFinalSynthesis']
      }
    };

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel,
      context: sampleContext
    });

    expect(analysis.career.promise.confidence).toBe('LOW');
    expect(analysis.career.promise.confidence).not.toBe('HIGH');
  });

  it('marks product career confidence unavailable when canonical C11 omits confidence', () => {
    const lifeAnalysisViewModel: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        canonicalFinalSynthesis: {
          finalStatus: 'MIXED',
          finalDirection: 'MIXED',
          finalStrength: 'MIXED',
          natalDirection: 'MIXED',
          natalStrength: 'MIXED',
          dashaDirection: 'MIXED',
          timingStatus: 'UNKNOWN'
        } as NonNullable<LifeAnalysisViewModel['careerDetail']>['canonicalFinalSynthesis']
      }
    };

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel,
      context: sampleContext
    });

    expect(analysis.career.promise.confidence).toBe('UNAVAILABLE');
  });

  it('1.1 projects canonical Career analytical axes into the product DTO without sharing mutable arrays', () => {
    const axes = {
      version: 'B01-AXIS-PROJECTION-v1',
      promise: {
        axis: 'PROMISE',
        status: 'AVAILABLE',
        result: { direction: 'SUPPORT', strength: 'STRONG' },
        supportingEvidenceOccurrenceIds: ['promise-occurrence'],
        conflictingEvidenceOccurrenceIds: [],
        ruleIds: ['RULE_PROMISE'],
        coverage: { status: 'COMPLETE', availableSources: ['C4_C7_NATAL'], missingSources: [], evidenceOccurrenceCount: 1 },
        confidence: { status: 'NOT_ASSESSED', reason: 'Axis-specific confidence is not defined.' },
        methodVersion: 'B01-AXIS-PROJECTION-v1'
      },
      activation: {
        axis: 'ACTIVATION',
        status: 'PARTIAL',
        result: { direction: 'CHALLENGE', effect: 'CHALLENGES', strength: 'MODERATE', dominantLevel: 'MD' },
        supportingEvidenceOccurrenceIds: [],
        conflictingEvidenceOccurrenceIds: ['dasha-occurrence'],
        ruleIds: ['RULE_DASHA'],
        coverage: { status: 'PARTIAL', availableSources: ['C9_DASHA_EVIDENCE'], missingSources: ['C9_DASHA_PERIOD_LEVELS'], evidenceOccurrenceCount: 1 },
        confidence: { status: 'NOT_ASSESSED', reason: 'Axis-specific confidence is not defined.' },
        methodVersion: 'B01-AXIS-PROJECTION-v1'
      },
      sustainability: {
        axis: 'SUSTAINABILITY',
        status: 'UNAVAILABLE',
        result: { assessment: 'NOT_ASSESSED', requiredEvidenceFamily: 'CAREER_SUSTAINABILITY' },
        supportingEvidenceOccurrenceIds: [],
        conflictingEvidenceOccurrenceIds: [],
        ruleIds: [],
        coverage: { status: 'INSUFFICIENT', availableSources: [], missingSources: ['CAREER_SUSTAINABILITY_EVIDENCE'], evidenceOccurrenceCount: 0 },
        confidence: { status: 'NOT_ASSESSED', reason: 'No validated evidence family.' },
        methodVersion: 'B01-AXIS-PROJECTION-v1',
        unavailableReason: 'No validated sustainability evidence family.'
      },
      risk: {
        axis: 'RISK',
        status: 'AVAILABLE',
        result: { assessment: 'ADVERSE_EVIDENCE_PRESENT', conflictCount: 1, nonActivationOccurrences: [] },
        supportingEvidenceOccurrenceIds: ['risk-occurrence'],
        conflictingEvidenceOccurrenceIds: [],
        ruleIds: ['RULE_RISK'],
        coverage: { status: 'COMPLETE', availableSources: ['C4_C7_NATAL', 'C9_DASHA', 'C10_D10'], missingSources: [], evidenceOccurrenceCount: 1 },
        confidence: { status: 'NOT_ASSESSED', reason: 'Risk confidence is not calibrated.' },
        methodVersion: 'B01-AXIS-PROJECTION-v1'
      },
      timing: {
        axis: 'TIMING',
        status: 'PARTIAL',
        result: {
          candidateWindows: [{
            level: 'MD', start: '2025-01-01', end: '2026-01-01', dated: true,
            effect: 'ACTIVATES', direction: 'SUPPORT', strength: 'STRONG',
            activatedPromiseEvidenceIds: ['promise-key'],
            supportingEvidenceOccurrenceIds: ['timing-occurrence'], ruleIds: ['RULE_MD']
          }],
          untimedLevels: ['AD'],
          guarantee: 'NONE'
        },
        supportingEvidenceOccurrenceIds: ['timing-occurrence'],
        conflictingEvidenceOccurrenceIds: [],
        ruleIds: ['RULE_MD'],
        coverage: { status: 'PARTIAL', availableSources: ['C9_DASHA_PERIODS'], missingSources: ['C9_DASHA_PERIOD_LEVELS'], evidenceOccurrenceCount: 1 },
        confidence: { status: 'NOT_ASSESSED', reason: 'No timing probability is inferred.' },
        methodVersion: 'B01-AXIS-PROJECTION-v1'
      }
    };
    const viewModelWithAxes: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        analyticalAxes: axes as any
      }
    };

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: viewModelWithAxes,
      context: sampleContext
    });

    expect(analysis.career.analyticalAxes).toEqual(axes);
    expect(analysis.career.analyticalAxes).not.toBe(axes);
    expect(analysis.career.analyticalAxes?.promise.supportingEvidenceOccurrenceIds)
      .not.toBe(axes.promise.supportingEvidenceOccurrenceIds);
    expect(selectCareer(analysis).analyticalAxes).toEqual(axes);
  });

  it('1.2 projects B02 outcome candidates and user-reported facts as separate collections', () => {
    const outcomeQualification: CareerOutcomeAnalysis = {
      reasoningVersion: 'B02',
      methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
      status: 'CONDITIONAL',
      candidateOutcomes: [],
      observedOutcomes: [{
        reportId: 'reported-career-event-1',
        outcomeType: 'PROMOTION',
        statement: 'User reported a promotion.',
        source: 'USER_REPORTED',
        occurredAt: '2025-07-01'
      }],
      diagnostics: [],
      guaranteedOutcomeAvailable: false,
      numericProbabilityAvailable: false,
      statement: 'Candidate qualification is conditional; observed facts are user-reported.'
    };
    const viewModelWithOutcome: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        careerOutcomeAnalysis: outcomeQualification
      }
    };

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: viewModelWithOutcome,
      context: sampleContext
    });

    expect(analysis.career.outcomeQualification).toEqual(outcomeQualification);
    expect(analysis.career.outcomeQualification).not.toBe(outcomeQualification);
    expect(analysis.career.outcomeQualification?.observedOutcomes[0]?.source).toBe('USER_REPORTED');
    expect(selectCareer(analysis).outcomeQualification).toEqual(outcomeQualification);
  });

  it('1.3 maps B05 dual-potential analysis from explicit B02 outcome candidates', () => {
    const makeCandidate = (
      candidateId: string,
      outcomeType: 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY' | 'INDEPENDENT_OR_BUSINESS_ACTIVITY',
      qualification: 'SUPPORTED_CANDIDATE' | 'CONDITIONALLY_SUPPORTED_CANDIDATE'
    ) => ({
      candidateId,
      outcomeType,
      status: 'CANDIDATE' as const,
      qualification,
      qualificationBasis: 'NATAL_PROMISE_AND_LINKED_DASHA_ACTIVATION' as const,
      sourceEventId: 'event-' + candidateId,
      opportunityId: 'opportunity-' + candidateId,
      activationId: 'activation-' + candidateId,
      timing: { type: 'UNTIMED' as const },
      supportingEvidence: {
        natalPromiseOccurrenceIds: ['natal-' + candidateId],
        activationOccurrenceIds: ['activation-' + candidateId],
        candidateEventEvidenceIds: [],
        ruleIds: ['rule-' + candidateId]
      },
      executionConditions: {
        professionAnalysisStatus: 'COMPLETE' as const,
        d10Qualification: 'QUALIFIED' as const,
        practicalExecution: 'NOT_ASSESSED' as const,
        requiredChecks: [
          'SKILLS_AND_EXPERIENCE_FIT',
          'REAL_WORLD_OPPORTUNITY',
          'USER_ACTION_AND_EXECUTION',
          'EMPLOYER_MARKET_AND_RESOURCE_CONSTRAINTS'
        ] as const
      },
      counterIndications: { severity: 'NONE' as const, evidenceOccurrenceIds: [], conflicts: [] },
      guarantee: 'NONE' as const
    });
    const outcomeQualification: CareerOutcomeAnalysis = {
      reasoningVersion: 'B02',
      methodVersion: 'B02-OUTCOME-QUALIFICATION-v1',
      status: 'CANDIDATES_AVAILABLE',
      candidateOutcomes: [
        makeCandidate('employment-1', 'EMPLOYMENT_OR_SERVICE_OPPORTUNITY', 'SUPPORTED_CANDIDATE'),
        makeCandidate('business-1', 'INDEPENDENT_OR_BUSINESS_ACTIVITY', 'CONDITIONALLY_SUPPORTED_CANDIDATE')
      ],
      observedOutcomes: [],
      diagnostics: [],
      guaranteedOutcomeAvailable: false,
      numericProbabilityAvailable: false,
      statement: 'Two pathway candidate modes are present.'
    };
    const viewModelWithOutcome: LifeAnalysisViewModel = {
      ...sampleViewModel,
      careerDetail: {
        ...sampleViewModel.careerDetail!,
        careerOutcomeAnalysis: outcomeQualification
      }
    };

    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: viewModelWithOutcome,
      context: sampleContext
    });

    expect(analysis.career.pathwayPotential?.reasoningVersion).toBe('B05');
    expect(analysis.career.pathwayPotential?.verdict).toBe('CONDITIONAL_DUAL_POTENTIAL');
    expect(analysis.career.pathwayPotential?.employment.candidates[0]?.candidateId).toBe('employment-1');
    expect(analysis.career.pathwayPotential?.independent.candidates[0]?.candidateId).toBe('business-1');
    expect(analysis.career.pathwayPotential?.suitabilityAvailable).toBe(false);
    expect(selectCareer(analysis).pathwayPotential).toEqual(analysis.career.pathwayPotential);
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
    expect(mapD2Relationship('CONFIRMS')).toBe('UNAVAILABLE');
    expect(mapD2Relationship('MODIFIES')).toBe('UNAVAILABLE');
    expect(mapD2Relationship(undefined)).toBe('UNAVAILABLE');

    expect(mapSpeculativePropensity('VERY_STRONG')).toBe('VERY_STRONG');
    expect(mapSpeculativePropensity('STRONG')).toBe('STRONG');
    expect(mapSpeculativePropensity('MODERATE')).toBe('MODERATE');
    expect(mapSpeculativePropensity('MIXED')).toBe('MIXED');
    expect(mapSpeculativePropensity('CHALLENGED')).toBe('CHALLENGED');
    expect(mapSpeculativePropensity(undefined)).toBe('INSUFFICIENT_DATA');
    expect(mapSpeculativePropensity('HIGH RISK')).toBe('INSUFFICIENT_DATA');
    expect(sanitizeSpeculativePropensityDescription('Fifth house indicates speculative interest.')).toBe('Fifth house indicates speculative interest.');
    expect(sanitizeSpeculativePropensityDescription('Options may provide higher returns.')).toBeUndefined();
    expect(sanitizeSpeculativePropensityDescription('Buy shares during this period.')).toBeUndefined();
    expect(sanitizeSpeculativePropensityDescription('Expected profit is high.')).toBeUndefined();
  });

  it('maps only explicit financial-source facts into financialData and leaves chart output non-prescriptive', () => {
    const absent = mapProductAnalysis({
      birthDetails: sampleBirth, horoscope: sampleHoroscope, lifeAnalysisViewModel: sampleViewModel, context: sampleContext
    });
    expect(absent.wealth.financialData).toBeUndefined();
    expect(absent.wealth.speculativePropensity).toMatchObject({ source: 'ASTROLOGICAL_INDICATION', adviceAvailable: false });
    expect(absent.wealth.riskAndSuitability).toMatchObject({ actualExposure: 'UNAVAILABLE', tradingHistory: 'UNAVAILABLE', suitability: 'UNAVAILABLE' });

    const base = createUnavailableWealthFinancialDataSet();
    const p = { reportedBy: 'USER' as const, reportId: 'rep-1', reportedAt: '2026-11-04T06:00:00Z' };
    const data = [...base.data];
    data[data.findIndex((d) => d.concept === 'TRADING_EXPOSURE')] = createUserReportedFinancialDatum({
      id: 'trade-exposure', concept: 'TRADING_EXPOSURE', value: { gross: 5000 }, currency: 'INR', provenance: p
    });
    data[data.findIndex((d) => d.concept === 'TRADING_HISTORY')] = createConnectedFinancialDatum({
      id: 'trade-history', concept: 'TRADING_HISTORY', value: { count: 4 },
      provenance: { sourceType: 'BROKERAGE', providerId: 'broker', connectionId: 'connection', retrievedAt: '2026-11-04T06:05:00Z' }
    });
    const supplied = mapProductAnalysis({
      birthDetails: sampleBirth, horoscope: sampleHoroscope, lifeAnalysisViewModel: sampleViewModel, context: sampleContext,
      wealthFinancialData: { schemaVersion: 'C01-v1', status: 'AVAILABLE', data }
    });
    expect(supplied.wealth.financialData?.status).toBe('AVAILABLE');
    expect(supplied.wealth.financialData?.data).toHaveLength(12);
    expect(supplied.wealth.speculativePropensity).toMatchObject({ source: 'ASTROLOGICAL_INDICATION', adviceAvailable: false });
    expect(supplied.wealth.riskAndSuitability).toMatchObject({ actualExposure: 'AVAILABLE', tradingHistory: 'AVAILABLE', suitability: 'UNAVAILABLE' });
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
    expect(md.conditionAssessment).toBe('PARTIAL');
    expect(md.afflictionAssessed).toBe(false);

    expect(ad.role).toBe('MODIFIER');
    expect(ad.direction).toBe('CHALLENGE');
    expect(ad.evidenceIds).toEqual(['ev_ad_1']);
    expect(ad.conditionAssessment).toBe('FULL');
    expect(ad.afflictionAssessed).toBe(true);

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
              evidenceOccurrenceIds: [],
              semanticIdentityKeys: [],
              rootIdentityKeys: [],
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
              evidenceOccurrenceIds: [],
              semanticIdentityKeys: [],
              rootIdentityKeys: [],
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
          ranking: {
            policyVersion: 'B04-PROFESSION-RANKING-v1',
            status: 'AVAILABLE',
            rankedCandidates: [],
            diagnostics: []
          },
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
    expect(analysisComplete.career.profession!.candidates[0].domainEvidenceIds).toEqual(['domain-ev-1']);
    expect(analysisComplete.career.profession!.candidates[0].ruleId).toBe('RULE_CANDIDATE_1');
    expect(analysisComplete.career.profession!.candidates[0].evidence[0]).toMatchObject({
      evidenceId: 'ev-1',
      sourceIds: ['source-1'],
      ruleId: 'RULE_1'
    });
    expect(analysisComplete.career.profession!.candidates[0].d10Status).toBe('QUALIFIED');
    expect(analysisComplete.career.profession!.candidates[1].d10Status).toBe('NOT_PROVIDED');
    // Aggregate d10Status should be QUALIFIED (any candidate qualified)
    expect(analysisComplete.career.profession!.d10Status).toBe('QUALIFIED');
    expect(analysisComplete.career.profession!.ranking.status).toBe('AVAILABLE');

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
              evidenceOccurrenceIds: [],
              semanticIdentityKeys: [],
              rootIdentityKeys: [],
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

  it('9. computeTemporalRelation returns UNKNOWN for invalid/unparseable dates', () => {
    // Verify the ProductTemporalRelation type includes 'UNKNOWN'
    const validRelations: ProductTemporalRelation[] = ['PAST', 'CURRENT', 'FUTURE', 'UNKNOWN'];
    expect(validRelations).toContain('UNKNOWN');

    // Test mapDashaPeriodOptions with invalid dates to ensure it doesn't crash
    // and returns 'UNKNOWN' for temporalRelation
    // Create a mock selectable periods result with invalid dates
    const invalidSelectablePeriods = {
      mahadashas: [
        {
          id: 'md_invalid',
          planet: Planet.JUPITER,
          start: 'invalid-date',
          end: 'also-invalid',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [],
      diagnostics: []
    };

    const result = mapDashaPeriodOptions(invalidSelectablePeriods, '2026-01-15T08:30:00.000Z');

    // Should not crash and should return temporalRelation as 'UNKNOWN'
    expect(result.mahadashas).toHaveLength(1);
    expect(result.mahadashas[0].temporalRelation).toBe('UNKNOWN');
  });
});
