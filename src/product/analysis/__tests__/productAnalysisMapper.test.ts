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
  mapSpeculativeRisk
} from '../productAnalysisMapper';
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
    overall: {
      status: 'STRONG',
      headline: 'Dominant Life Direction',
      statement: 'Natal indicators show sustained executive trajectory.'
    },
    domains: [
      {
        domain: 'CAREER',
        status: 'STRONG',
        confidence: 'HIGH',
        headline: 'Executive Trajectory',
        statement: 'High vocational promise.'
      },
      {
        domain: 'WEALTH',
        status: 'MODERATE',
        confidence: 'MEDIUM',
        headline: 'Stable Wealth Accumulation',
        statement: 'Solid 2nd house foundation.'
      }
    ],
    careerDetail: {
      status: 'STRONG',
      promiseHeadline: 'Executive Trajectory',
      promiseStatement: 'High vocational promise across 10th lord and Lagna.',
      capacityLevel: 'LEADERSHIP',
      manifestations: ['Corporate Leadership', 'Strategic Direction'],
      d10Relationship: 'CONFIRMS' as any,
      d10Statement: 'Dasamsa confirms strong 10th house status.',
      timing: {
        mahadasha: {
          planet: Planet.JUPITER,
          effect: 'STRONG_SUPPORT',
          evidenceIds: ['ev_md_1'],
          statement: 'Jupiter Mahadasha establishes primary career elevation.'
        },
        antardasha: {
          planet: Planet.SATURN,
          effect: 'MODERATE_CHALLENGE',
          evidenceIds: ['ev_ad_1'],
          statement: 'Saturn Antardasha introduces structural discipline.'
        },
        pratyantardasha: {
          planet: Planet.MERCURY,
          effect: 'SUPPORTIVE',
          evidenceIds: ['ev_pd_1'],
          statement: 'Mercury Pratyantardasha triggers communication gains.'
        },
        currentActivation: 'Jupiter / Saturn',
        currentPressure: 'High structural demands',
        transitEffect: 'FAVORABLE' as any,
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
      promiseHeadline: 'Stable Accumulation',
      promiseStatement: 'Consistent growth with steady savings.',
      accumulation: { status: 'STRONG', statement: '2nd lord exalted.' },
      gains: { status: 'MODERATE', statement: '11th lord neutral.' },
      fortune: { status: 'STRONG', statement: '9th lord well-placed.' },
      speculation: { status: 'MODERATE', statement: '5th house stable.' },
      d2Relationship: 'CONFIRMS' as any,
      d2Statement: 'Hora D2 confirms liquid capital accumulation.',
      timing: {
        currentActivation: 'Jupiter dasha brings steady financial inflow.',
        transitEffect: 'NEUTRAL' as any,
        transitStatement: 'Transits neutral for wealth.'
      },
      qualifications: []
    },
    evidence: []
  } as unknown as LifeAnalysisViewModel;

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

  it('1. MANDATORY evidence-provenance preservation: deep-equals input ProductEvidence', () => {
    const analysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel,
      careerEvidence: [sampleInputEvidence]
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
      lifeAnalysisViewModel: sampleViewModel
    });
    expect(analysis.career.d10.relationship).toBe('CONFIRMS');
    expect((analysis.career.d10 as any).percentage).toBeUndefined();
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
      lifeAnalysisViewModel: sampleViewModel
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

  it('5. Status derivation: READY, PARTIAL, and ERROR', () => {
    const readyAnalysis = mapProductAnalysis({
      birthDetails: sampleBirth,
      horoscope: sampleHoroscope,
      lifeAnalysisViewModel: sampleViewModel
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
      warnings: [warning]
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
      warnings: [errorWarning]
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
      careerEvidence: [sampleInputEvidence]
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
    const failed = buildFailedProductAnalysis(sampleBirth, new Error('Computational crash'));
    expect(failed.status).toBe('ERROR');
    expect(failed.warnings).toHaveLength(1);
    expect(failed.warnings[0].severity).toBe('ERROR');
    expect(failed.warnings[0].message).toBe('Computational crash');
    expect(failed.career.promise.strength).toBe('UNAVAILABLE');
    expect(failed.wealth.overall.status).toBe('UNAVAILABLE');
    expect(failed.ai.status).toBe('FAILED');
  });
});
