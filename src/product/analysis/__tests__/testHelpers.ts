import type { ProductAnalysis } from '../productAnalysisTypes';

/**
 * Test factory creating a valid ProductAnalysis aggregate matching the REAL type shape.
 */
export function createProductAnalysis(overrides?: Partial<ProductAnalysis>): ProductAnalysis {
  const defaultAnalysis: ProductAnalysis = {
    analysisId: 'pa_test_123',
    asOf: '2026-01-15T08:30:00.000Z',
    status: 'READY',
    birth: {
      name: 'Test Chart',
      placeOfBirth: 'New Delhi, India',
      dateTime: '1990-01-15T08:30:00.000Z',
      timezone: 'Asia/Kolkata',
      latitude: 28.6139,
      longitude: 77.209,
      ayanamsa: 'LAHIRI'
    },
    methodology: {
      zodiacSystem: 'SIDEREAL',
      houseSystem: 'PLACIDUS',
      ayanamsa: 'LAHIRI',
      calculationEngine: 'SWISSEPH'
    },
    chart: {
      ascendantSign: 'Capricorn',
      ascendantDegree: 285.5,
      moonSign: 'Leo',
      sunSign: 'Capricorn',
      moonNakshatra: 'Magha',
      isAvailable: true
    },
    career: {
      promise: {
        strength: 'STRONG',
        confidence: 'HIGH',
        headline: 'Executive Trajectory',
        statement: 'High vocational promise across 10th lord and Lagna.',
        dominantManifestations: ['Corporate Leadership']
      },
      expression: {
        primaryStyle: 'Strategic Leadership',
        leadershipPotential: 'HIGH'
      },
      d10: {
        relationship: 'CONFIRMS',
        statement: 'Dasamsa confirms strong 10th house status.'
      },
      activation: {
        dasha: {
          status: 'AVAILABLE',
          periods: [
            {
              level: 'MD',
              planet: 'Jupiter',
              role: 'PRIMARY',
              direction: 'SUPPORT',
              effect: 'ACTIVATES',
              evidenceIds: ['ev_md_1'],
              statement: 'Jupiter Mahadasha establishes primary career elevation.'
            }
          ]
        },
        transit: {
          status: 'AVAILABLE',
          effect: 'TRIGGER',
          statement: 'Saturn transits natal 3rd house.'
        }
      },
      qualifications: [
        {
          type: 'COMBUSTION',
          severity: 'LOW',
          description: 'Mercury combust by 8 degrees.'
        }
      ],
      evidence: [
        {
          id: 'ev_career_1',
          title: '10th Lord Exaltation',
          statement: 'Mars exalted in 1st house.',
          direction: 'SUPPORT',
          role: 'PRIMARY',
          source: 'CAREER_ENGINE',
          ruleId: 'RULE_RUCHAKA',
          derivedFromIds: ['ev_mars_exalted']
        },
        {
          id: 'ev_career_2',
          title: 'Saturn Aspect',
          statement: 'Saturn aspects 10th house.',
          direction: 'CHALLENGE',
          role: 'MODIFIER',
          source: 'CAREER_ENGINE',
          ruleId: 'RULE_SATURN_ASPECT'
        }
      ],
      synthesis: {
        headline: 'Strong Career Outlook',
        statement: 'Unified vocational trajectory indicates high executive capacity.'
      }
    },
    wealth: {
      overall: {
        status: 'STRONGLY_SUPPORTED',
        promise: 'MODERATE',
        confidence: 'HIGH',
        headline: 'Stable Accumulation',
        statement: 'Solid 2nd house foundation supporting liquid wealth.'
      },
      dimensions: {
        accumulation: { status: 'STRONGLY_SUPPORTED', statement: '2nd lord exalted.' },
        gains: { status: 'SUPPORTED', statement: '11th lord well-placed.' },
        fortune: { status: 'STRONGLY_SUPPORTED', statement: '9th lord in kendra.' },
        speculation: { status: 'SUPPORTED', statement: '5th house stable.' }
      },
      d2: {
        relationship: 'CONFIRMS',
        statement: 'Hora D2 confirms liquid capital accumulation.'
      },
      activation: {
        dasha: {
          status: 'AVAILABLE',
          periods: [],
          statement: 'Jupiter dasha brings financial stability.'
        },
        transit: {
          status: 'AVAILABLE',
          effect: 'NO_MATERIAL_TRIGGER',
          statement: 'Transits neutral for wealth.'
        }
      },
      speculativeRisk: {
        level: 'MODERATE',
        description: 'Disciplined investments recommended.'
      },
      qualifications: [
        {
          type: 'EXPENDITURE_PRESSURE',
          severity: 'MEDIUM',
          description: '12th house active during Mars transits.'
        }
      ],
      evidence: [
        {
          id: 'ev_wealth_1',
          title: '2nd Lord Exalted',
          statement: 'Jupiter in Cancer in 7th house.',
          direction: 'SUPPORT',
          role: 'PRIMARY',
          source: 'WEALTH_ENGINE',
          ruleId: 'RULE_DHANA_YOGA',
          derivedFromIds: ['ev_jupiter_cancer']
        }
      ],
      synthesis: {
        headline: 'Favorable Wealth Outlook',
        statement: 'Long-term asset growth underpinned by solid Dhana yogas.'
      }
    },
    dasha: {
      current: {
        mahadasha: {
          level: 'MD',
          planet: 'Jupiter',
          role: 'PRIMARY',
          direction: 'SUPPORT',
          effect: 'ACTIVATES',
          evidenceIds: ['ev_md_1'],
          statement: 'Jupiter Mahadasha establishes primary life elevation.',
          start: '2020-05-15',
          end: '2036-05-15'
        },
        antardasha: {
          level: 'AD',
          planet: 'Saturn',
          role: 'MODIFIER',
          direction: 'CHALLENGE',
          effect: 'CHALLENGES',
          evidenceIds: ['ev_ad_1'],
          statement: 'Saturn Antardasha introduces structural discipline.',
          start: '2024-03-10',
          end: '2026-09-22'
        },
        pratyantardasha: {
          level: 'PD',
          planet: 'Mercury',
          role: 'REFINEMENT',
          direction: 'SUPPORT',
          effect: 'ACTIVATES',
          evidenceIds: ['ev_pd_1'],
          statement: 'Mercury Pratyantardasha triggers communication gains.',
          start: '2026-04-01',
          end: '2026-08-15'
        }
      },
      summary: 'Jupiter-Saturn-Mercury active period favoring structural discipline.'
    },
    reasoning: {
      nodes: [],
      primaryConclusions: [
        { domain: 'CAREER', conclusion: 'High executive potential.' },
        { domain: 'WEALTH', conclusion: 'Solid capital accumulation.' }
      ],
      unresolvedQuestions: []
    },
    ai: {
      status: 'AVAILABLE',
      explanation: 'Synthesis consistent with classical texts.',
      conclusion: 'Executive trajectory supported.'
    },
    warnings: []
  };

  return {
    ...defaultAnalysis,
    ...overrides,
    chart: { ...defaultAnalysis.chart, ...overrides?.chart },
    career: { ...defaultAnalysis.career, ...overrides?.career },
    wealth: { ...defaultAnalysis.wealth, ...overrides?.wealth },
    dasha: {
      ...defaultAnalysis.dasha,
      ...overrides?.dasha,
      current: {
        ...defaultAnalysis.dasha.current,
        ...overrides?.dasha?.current
      }
    }
  };
}
