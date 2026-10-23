import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  DashaHero,
  TransitTimingSection,
  CurrentDashaHierarchy,
  CareerActivationSection,
  WealthActivationSection,
  DashaEvidenceSection,
  DashaPeriodCard,
  SelectedPeriodSection,
  SelectedPeriodReport
} from '../index';
import type {
  DashaHeroViewModel,
  DashaTransitViewModel,
  DashaPeriodViewModel,
  DashaEvidenceViewModel
} from '../../../product/analysis/dashaViewModel';
import type {
  ProductDashaPeriodOptions,
  ProductSelectedPeriodSynthesis,
  ProductSynthesisWealthDimensionRow
} from '../../../product/analysis/productAnalysisTypes';

const emptyWealthDimension = (
  dimension: ProductSynthesisWealthDimensionRow['dimension']
): ProductSynthesisWealthDimensionRow => ({
  dimension,
  effect: 'INSUFFICIENT_DATA',
  dataStatus: 'INSUFFICIENT_DATA',
  linkedLevels: [],
  diagnostics: [],
  promiseEvidenceIds: [],
  dashaRuleReferences: [],
  insufficientReason: 'NO_PROMISE_EVIDENCE' as const
});

const emptyWealthDimensions: ProductSelectedPeriodSynthesis['wealth']['dimensions'] = {
  ACCUMULATION: emptyWealthDimension('ACCUMULATION'),
  GAINS: emptyWealthDimension('GAINS'),
  FORTUNE: emptyWealthDimension('FORTUNE'),
  SPECULATION: emptyWealthDimension('SPECULATION')
};

describe('Dasha Presentational Components (P-UI-07)', () => {
  function makeSynthesis(overrides: Partial<ProductSelectedPeriodSynthesis> = {}): ProductSelectedPeriodSynthesis {
    const base: ProductSelectedPeriodSynthesis = {
      synthesisVersion: 'PBA-06-v1',
      period: {
        mahadashaPlanet: 'Jupiter',
        antardashaPlanet: 'Saturn',
        selectedPeriodId: 'md-jupiter-2020-2036_ad-saturn-2020-2022',
        mahadashaId: 'VIMSHOTTARI_MD:JUPITER',
        antardashaId: 'VIMSHOTTARI_AD:SATURN',
        interval: {
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z'
        },
        temporalRelation: 'CURRENT',
        analysisAsOf: '2021-06-15T00:00:00.000Z'
      },
      natalBaseline: {
        career: { baseline: {} as any, unchanged: true },
        wealth: { baseline: {} as any, unchanged: true }
      },
      career: {
        qualificationBasis: 'CANONICAL_STATUS',
        expressions: [],
        diagnostics: []
      },
      wealth: {
        dimensions: {
          ACCUMULATION: {
            dimension: 'ACCUMULATION',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: [],
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          },
          GAINS: {
            dimension: 'GAINS',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: [],
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          },
          FORTUNE: {
            dimension: 'FORTUNE',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: [],
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          },
          SPECULATION: {
            dimension: 'SPECULATION',
            effect: 'INSUFFICIENT_DATA',
            dataStatus: 'INSUFFICIENT_DATA',
            linkedLevels: [],
            diagnostics: [],
            promiseEvidenceIds: [],
            dashaRuleReferences: [],
            insufficientReason: 'NO_PROMISE_EVIDENCE' as const
          }
        },
        diagnostics: []
      },
      evidence: [],
      missingInputs: [],
      provenance: {
        career: {
          status: 'PRESENT',
          version: 'PBA-04-v1',
          qualificationBasis: 'CANONICAL_STATUS'
        },
        wealth: {
          status: 'PRESENT',
          version: 'PBA-04-v1'
        }
      },
      qualificationStatus: 'CANONICAL',
      aiExplanationStatus: 'NOT_REQUESTED'
    };
    return { ...base, ...overrides };
  }


  it('1. DashaHero: renders with all three periods and asserts planet names', () => {
    const hero: DashaHeroViewModel = {
      availability: 'AVAILABLE',
      status: 'READY',
      asOf: '2026-09-08',
      currentPeriodLabel: 'Jupiter → Saturn → Mercury',
      mdPlanet: 'Jupiter',
      adPlanet: 'Saturn',
      pdPlanet: 'Mercury'
    };

    render(<DashaHero hero={hero} />);

    expect(screen.getByText('Dasha & Planetary Timing')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('2. DashaHero: renders with null periods and asserts "Unavailable" fallback', () => {
    const hero: DashaHeroViewModel = {
      availability: 'UNAVAILABLE',
      status: 'READY',
      asOf: '2026-09-08',
      currentPeriodLabel: 'Timing Unavailable',
      mdPlanet: null,
      adPlanet: null,
      pdPlanet: null
    };

    render(<DashaHero hero={hero} />);

    expect(screen.getByText('Dasha & Planetary Timing')).toBeInTheDocument();
    const unavailElements = screen.getAllByText('Unavailable');
    expect(unavailElements.length).toBeGreaterThanOrEqual(3);
  });

  it('3. TransitTimingSection: renders both career and wealth domain blocks and asserts context copy', () => {
    const transit: DashaTransitViewModel = {
      career: {
        status: 'AVAILABLE',
        effect: 'TRIGGER',
        statement: 'Jupiter transit activates natal 10th house potential.'
      },
      wealth: {
        status: 'UNAVAILABLE',
        effect: 'UNAVAILABLE',
        statement: undefined
      }
    };

    render(<TransitTimingSection transit={transit} />);

    expect(screen.getByText('Transit Timing')).toBeInTheDocument();
    expect(screen.getByText('Career')).toBeInTheDocument();
    expect(screen.getByText('Wealth')).toBeInTheDocument();
    expect(screen.getByText('Trigger')).toBeInTheDocument();
    expect(screen.getByText('Jupiter transit activates natal 10th house potential.')).toBeInTheDocument();
    expect(screen.getByText(/timing or trigger context/i)).toBeInTheDocument();
  });

  it('4. CurrentDashaHierarchy: renders hierarchy with cards and independent role/direction', () => {
    const periods: DashaPeriodViewModel[] = [
      {
        level: 'MD',
        planet: 'Jupiter',
        start: '2020-05-15',
        end: '2036-05-15',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        statement: 'Jupiter Mahadasha establishes primary baseline.',
        available: true
      },
      {
        level: 'AD',
        planet: 'Saturn',
        start: '2024-03-10',
        end: '2026-09-22',
        role: 'MODIFIER',
        direction: 'CHALLENGE',
        statement: 'Saturn Antardasha introduces structural discipline.',
        available: true
      }
    ];

    render(<CurrentDashaHierarchy hierarchy={periods} availability="AVAILABLE" />);

    expect(screen.getByText('Current Dasha Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Mahadasha (MD)')).toBeInTheDocument();
    expect(screen.getByText('Primary Driver')).toBeInTheDocument();
    expect(screen.getByText('Supporting')).toBeInTheDocument();

    expect(screen.getByText('Antardasha (AD)')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Challenging')).toBeInTheDocument();
  });

  it('5. DashaPeriodCard: renders start and end dates formatted', () => {
    const period: DashaPeriodViewModel = {
      level: 'PD',
      planet: 'Mercury',
      start: '2026-04-01',
      end: '2026-08-15',
      role: 'REFINEMENT',
      direction: 'SUPPORT',
      statement: 'Operational refinement.',
      available: true
    };

    render(<DashaPeriodCard period={period} />);

    expect(screen.getByText('Mercury')).toBeInTheDocument();
    expect(screen.getByText('2026-04-01 → 2026-08-15')).toBeInTheDocument();
    expect(screen.getByText('Refinement')).toBeInTheDocument();
  });

  it('6. CareerActivationSection & WealthActivationSection: renders domain activations', () => {
    const careerActivation = {
      status: 'AVAILABLE' as const,
      periods: [],
      statement: 'Career dasha active',
      currentPressure: 'High workload requirement'
    };

    const wealthActivation = {
      status: 'PARTIAL' as const,
      periods: [],
      statement: 'Liquid asset accumulation window'
    };

    const { unmount: unmountCareer } = render(
      <CareerActivationSection activation={careerActivation} />
    );
    expect(screen.getByText('Career Activation')).toBeInTheDocument();
    expect(screen.getByText('Career dasha active')).toBeInTheDocument();
    expect(screen.getByText('High workload requirement')).toBeInTheDocument();
    unmountCareer();

    render(<WealthActivationSection activation={wealthActivation} />);
    expect(screen.getByText('Wealth Activation')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
    expect(screen.getByText('Liquid asset accumulation window')).toBeInTheDocument();
  });

  it('7. DashaEvidenceSection: groups evidence items by role', () => {
    const evidence: DashaEvidenceViewModel = {
      total: 1,
      groups: {
        PRIMARY: [
          {
            id: 'ev_1',
            title: '10th Lord Strength',
            statement: 'Mars exalted in Lagna.',
            direction: 'SUPPORT',
            role: 'PRIMARY',
            source: 'ENGINE'
          }
        ],
        SUPPORTING: [],
        CHALLENGING: [],
        MODIFIER: [],
        REFINEMENT: [],
        CONFLICTING: [],
        NEUTRAL: []
      }
    };

    render(<DashaEvidenceSection evidence={evidence} />);
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();
    expect(screen.getByText('10th Lord Strength')).toBeInTheDocument();
    expect(screen.getByText(/Primary Driver/i)).toBeInTheDocument();
  });

  it('8. SelectedPeriodSection: temporal labels appended to option text, value remains ID', () => {
    const dashPeriodOptions: ProductDashaPeriodOptions = {
      mahadashas: [
        {
          id: 'md_jupiter',
          planet: 'Jupiter',
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: [],
          temporalRelation: 'PAST',
          antardashas: [
            {
              id: 'ad_saturn',
              planet: 'Saturn',
              start: '2020-01-01T00:00:00.000Z',
              end: '2022-01-01T00:00:00.000Z',
              valid: true,
              diagnostics: [],
              temporalRelation: 'PAST'
            },
            {
              id: 'ad_mercury',
              planet: 'Mercury',
              start: '2024-01-01T00:00:00.000Z',
              end: '2026-01-01T00:00:00.000Z',
              valid: true,
              diagnostics: [],
              temporalRelation: 'CURRENT'
            }
          ]
        },
        {
          id: 'md_saturn',
          planet: 'Saturn',
          start: '2036-01-01T00:00:00.000Z',
          end: '2055-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: [],
          temporalRelation: 'FUTURE',
          antardashas: []
        }
      ],
      diagnostics: []
    };

    const onSelect = vi.fn();
    render(
      <SelectedPeriodSection
        dashPeriodOptions={dashPeriodOptions}
        onSelect={onSelect}
      />
    );

    // Get the MD select
    const mdSelect = screen.getByLabelText(/Mahadasha \(Major Period\)/i);
    const mdOptions = Array.from(mdSelect.querySelectorAll('option'));

    // Verify Jupiter option has temporal label "Past" and value is the ID
    const jupiterOption = mdOptions.find(opt => opt.value === 'md_jupiter');
    expect(jupiterOption).toBeDefined();
    expect(jupiterOption?.textContent).toContain('Jupiter');
    expect(jupiterOption?.textContent).toContain('Past');
    expect(jupiterOption?.value).toBe('md_jupiter');

    // Verify Saturn option has temporal label "Future" and value is the ID
    const saturnOption = mdOptions.find(opt => opt.value === 'md_saturn');
    expect(saturnOption).toBeDefined();
    expect(saturnOption?.textContent).toContain('Saturn');
    expect(saturnOption?.textContent).toContain('Future');
    expect(saturnOption?.value).toBe('md_saturn');

    // Select Jupiter to populate AD options
    fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });

    // Get the AD select
    const adSelect = screen.getByLabelText(/Antardasha \(Sub-period\)/i);
    const adOptions = Array.from(adSelect.querySelectorAll('option'));

    // Verify Saturn AD option has temporal label "Past" and value is the ID
    const saturnAdOption = adOptions.find(opt => opt.value === 'ad_saturn');
    expect(saturnAdOption).toBeDefined();
    expect(saturnAdOption?.textContent).toContain('Saturn');
    expect(saturnAdOption?.textContent).toContain('Past');
    expect(saturnAdOption?.value).toBe('ad_saturn');

    // Verify Mercury AD option has temporal label "Current" and value is the ID
    const mercuryAdOption = adOptions.find(opt => opt.value === 'ad_mercury');
    expect(mercuryAdOption).toBeDefined();
    expect(mercuryAdOption?.textContent).toContain('Mercury');
    expect(mercuryAdOption?.textContent).toContain('Current');
    expect(mercuryAdOption?.value).toBe('ad_mercury');
  });

  describe('SelectedPeriodReport', () => {
    it('renders primary period information (MD/AD planets, interval, temporal relation)', () => {
      const synthesis = makeSynthesis();

      render(<SelectedPeriodReport synthesis={synthesis} domainToggle="WEALTH" />);

      // Verify primary information is visible
      expect(screen.getByText(/Jupiter MD → Saturn AD/i)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1, 2020 – Jan 1, 2022/i)).toBeInTheDocument();
      expect(screen.getByText(/CURRENT/i)).toBeInTheDocument();
      expect(screen.getByText('CANONICAL')).toBeInTheDocument();
      expect(screen.queryByText(/Career Synthesis/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Analysis as of:/i)).toBeInTheDocument();
    });

    it('hides raw selectedPeriodId by default (in technical details)', () => {
      const synthesis = makeSynthesis();

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Raw ID should not be visible by default
      expect(screen.queryByText(/md-jupiter-2020-2036_ad-saturn-2020-2022/i)).not.toBeInTheDocument();

      // Technical details should be collapsible
      const techDetailsButton = screen.getByText(/Technical details/i);
      expect(techDetailsButton).toBeInTheDocument();
    });

    it('shows raw selectedPeriodId when technical details expanded', () => {
      const synthesis = makeSynthesis();

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Click to expand technical details
      const techDetailsButton = screen.getByText(/Technical details/i);
      fireEvent.click(techDetailsButton);

      // Raw ID should now be visible
      expect(screen.getByText(/md-jupiter-2020-2036_ad-saturn-2020-2022/i)).toBeInTheDocument();
    });

    it('renders career limitation warning for PROXY_DIRECTION qualification basis', () => {
      const synthesis = makeSynthesis({
        career: {
          qualificationBasis: 'PROXY_DIRECTION',
          expressions: [],
          diagnostics: []
        },
        qualificationStatus: 'PROVISIONAL'
      });

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Should show career limitation warning
      expect(screen.getByText(/Career qualification unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/Using interim proxy direction/i)).toBeInTheDocument();
    });

    it('renders career limitation warning for UNAVAILABLE qualification basis', () => {
      const synthesis = makeSynthesis({
        career: {
          qualificationBasis: 'UNAVAILABLE',
          expressions: [],
          diagnostics: []
        },
        qualificationStatus: 'UNAVAILABLE'
      });

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Should show career limitation warning
      expect(screen.getByText(/Career qualification unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/no qualifying mechanisms for this chart/i)).toBeInTheDocument();
    });

    it('renders the recognized-structure rule-coverage reason for UNAVAILABLE career qualification', () => {
      const reason =
        'Canonical inputs were provided but contained zero mechanism candidates because no resolver rule matched; this is a rule-coverage gap, not a disproven career promise.';
      const synthesis = makeSynthesis({
        career: {
          qualificationBasis: 'UNAVAILABLE',
          expressions: [],
          diagnostics: [
            {
              code: 'CAREER_UNAVAILABLE_NO_CANONICAL_MECHANISMS',
              message: reason
            }
          ]
        },
        qualificationStatus: 'UNAVAILABLE'
      });

      render(<SelectedPeriodReport synthesis={synthesis} />);

      expect(screen.getByText(reason)).toBeInTheDocument();
      expect(screen.queryByText(/CAREER_UNAVAILABLE_NO_CANONICAL_MECHANISMS/i)).not.toBeInTheDocument();
    });

    it('does not render career limitation warning for CANONICAL_STATUS', () => {
      const synthesis = makeSynthesis();

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Should NOT show career limitation warning
      expect(screen.queryByText(/Career qualification unavailable/i)).not.toBeInTheDocument();
    });

    it('renders CAREER_QUALIFICATION_UNAVAILABLE message exactly once when qualificationBasis === UNAVAILABLE', () => {
      const synthesis = makeSynthesis({
        career: {
          qualificationBasis: 'UNAVAILABLE',
          expressions: [],
          diagnostics: [
            {
              code: 'CAREER_QUALIFICATION_UNAVAILABLE',
              message: 'Career qualification unavailable: canonical inputs provided but no qualifying mechanisms for this chart'
            }
          ]
        },
        qualificationStatus: 'UNAVAILABLE'
      });

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Should show career limitation warning (friendly message)
      expect(screen.getByText(/Career qualification unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/no qualifying mechanisms for this chart/i)).toBeInTheDocument();

      // The CAREER_QUALIFICATION_UNAVAILABLE diagnostic should be filtered out from DiagnosticsList
      // when the friendly warning is shown, so the message should appear exactly once
      const warningMessages = screen.getAllByText(/Career qualification unavailable/i);
      expect(warningMessages.length).toBe(1);
    });

    it('renders other diagnostics when qualificationBasis === UNAVAILABLE (CAREER_QUALIFICATION_UNAVAILABLE filtered)', () => {
      const synthesis = makeSynthesis({
        career: {
          qualificationBasis: 'UNAVAILABLE',
          expressions: [],
          diagnostics: [
            {
              code: 'CAREER_QUALIFICATION_UNAVAILABLE',
              message: 'Career qualification unavailable: canonical inputs provided but no qualifying mechanisms for this chart'
            },
            {
              code: 'ADAPTER_FALLBACK_DROPPED_CANDIDATES',
              message: 'Multiple QUALIFIED canonical candidates available, but adapter fallback uses only the first candidate'
            }
          ]
        },
        qualificationStatus: 'UNAVAILABLE'
      });

      render(<SelectedPeriodReport synthesis={synthesis} />);

      // Should show career limitation warning
      expect(screen.getByText(/Career qualification unavailable/i)).toBeInTheDocument();

      // Should show the other diagnostic (ADAPTER_FALLBACK_DROPPED_CANDIDATES)
      expect(screen.getByText(/ADAPTER_FALLBACK_DROPPED_CANDIDATES/i)).toBeInTheDocument();

      // CAREER_QUALIFICATION_UNAVAILABLE should be filtered from DiagnosticsList
      // so it only appears in the friendly warning, not in the diagnostics list
      const diagnosticMessages = screen.getAllByText(/Career qualification unavailable/i);
      expect(diagnosticMessages.length).toBe(1);
    });

    it('renders wealth dimension diagnostics when dimension is linked with complete input but UNKNOWN effect', () => {
      const synthesis = makeSynthesis({
        wealth: {
          dimensions: {
            ACCUMULATION: {
              dimension: 'ACCUMULATION',
              effect: 'UNKNOWN',
              dataStatus: 'PARTIAL',
              linkedLevels: ['MD'],
              diagnostics: [
                {
                  code: 'WEALTH_DIMENSION_COMPLETE_BUT_INDETERMINATE',
                  message: 'Wealth dimension ACCUMULATION has complete input but indeterminate activation effect (UNKNOWN)'
                }
              ],
              promiseEvidenceIds: ['WEALTH_2H_STRONG_001:HOUSE_2'],
              dashaRuleReferences: [],
              insufficientReason: 'LINKED' as const
            },
            GAINS: emptyWealthDimension('GAINS'),
            FORTUNE: emptyWealthDimension('FORTUNE'),
            SPECULATION: emptyWealthDimension('SPECULATION')
          },
          diagnostics: []
        }
      });

      render(<SelectedPeriodReport synthesis={synthesis} domainToggle="WEALTH" />);

      // The dimension diagnostic code should be rendered in the UI
      expect(screen.getByText(/WEALTH_DIMENSION_COMPLETE_BUT_INDETERMINATE/i)).toBeInTheDocument();

      // The readable message should be visible (not just in title)
      expect(screen.getByText(/Wealth dimension ACCUMULATION has complete input but indeterminate activation effect \(UNKNOWN\)/i)).toBeInTheDocument();

      // The list should be exposed via role="list" with accessible name
      const diagnosticList = screen.getByRole('list', { name: /diagnostic explanations/i });
      expect(diagnosticList).toBeInTheDocument();
    });

    it('Career-only partial result renders career heading and wealth missing explanation', () => {
      const careerOnlySynthesis = makeSynthesis({
        career: {
          qualificationBasis: 'CANONICAL_STATUS',
          expressions: [
            {
              expressionRefKey: 'CAREER_EXPR_1',
              status: 'ACTIVATES',
              linkedLevels: ['MD'],
              qualificationBasis: 'CANONICAL_STATUS',
              matchBasis: 'UNAMBIGUOUS',
              diagnostics: [],
              expressionEvidenceIds: [],
              qualifiedEvidenceIds: [],
              unqualifiedEvidenceIds: [],
              mdDashaEvidenceIds: [],
              adDashaEvidenceIds: [],
              expressionSource: 'CALLER'
            }
          ],
          diagnostics: []
        },
        wealth: {
          dimensions: {
            ACCUMULATION: emptyWealthDimension('ACCUMULATION'),
            GAINS: emptyWealthDimension('GAINS'),
            FORTUNE: emptyWealthDimension('FORTUNE'),
            SPECULATION: emptyWealthDimension('SPECULATION')
          },
          diagnostics: []
        },
        missingInputs: [
          {
            domain: 'WEALTH',
            code: 'WEALTH_PROMISE_MISSING',
            description: 'Wealth promise evidence not available in chart'
          }
        ],
        provenance: {
          career: { status: 'PRESENT', version: 'v1', qualificationBasis: 'CANONICAL_STATUS' },
          wealth: { status: 'MISSING', version: 'v1' }
        }
      });

      render(<SelectedPeriodReport synthesis={careerOnlySynthesis} />);

      // Career section should be visible with heading
      expect(screen.getByText(/Career Synthesis/i)).toBeInTheDocument();

      // Career expression should be rendered
      expect(screen.getByText(/CAREER_EXPR_1/i)).toBeInTheDocument();
      expect(screen.getByText(/Activates/i)).toBeInTheDocument();

      // Wealth missing explanation should be visible via missingInputs
      expect(screen.getByText(/Missing Inputs/i)).toBeInTheDocument();
      expect(screen.getByText(/WEALTH_PROMISE_MISSING/i)).toBeInTheDocument();
      expect(screen.getByText(/Wealth promise evidence not available in chart/i)).toBeInTheDocument();

      // Wealth Synthesis section should show unavailable state
      expect(screen.getByText(/Wealth activation unavailable/i)).toBeInTheDocument();
    });

    it('Wealth-only partial result renders wealth heading and career missing explanation', () => {
      const wealthOnlySynthesis = makeSynthesis({
        career: {
          qualificationBasis: 'CANONICAL_STATUS',
          expressions: [],
          diagnostics: []
        },
        wealth: {
          dimensions: {
            ACCUMULATION: {
              dimension: 'ACCUMULATION',
              effect: 'ACTIVATES',
              dataStatus: 'COMPLETE',
              linkedLevels: ['MD'],
              diagnostics: [],
              promiseEvidenceIds: ['WEALTH_2H_STRONG_001'],
              dashaRuleReferences: [],
              insufficientReason: 'LINKED' as const
            },
            GAINS: emptyWealthDimension('GAINS'),
            FORTUNE: emptyWealthDimension('FORTUNE'),
            SPECULATION: emptyWealthDimension('SPECULATION')
          },
          diagnostics: []
        },
        missingInputs: [
          {
            domain: 'CAREER',
            code: 'CAREER_PROMISE_MISSING',
            description: 'Career promise evidence not available in chart'
          }
        ],
        provenance: {
          career: { status: 'MISSING', version: 'v1', qualificationBasis: 'CANONICAL_STATUS' },
          wealth: { status: 'PRESENT', version: 'v1' }
        }
      });

      render(<SelectedPeriodReport synthesis={wealthOnlySynthesis} />);

      // Wealth section should be visible with heading
      expect(screen.getByText(/Wealth Synthesis/i)).toBeInTheDocument();

      // ACCUMULATION dimension should be rendered with ACTIVATES effect
      expect(screen.getByText(/ACCUMULATION/i)).toBeInTheDocument();
      expect(screen.getByText(/Activates/i)).toBeInTheDocument();

      // Career missing explanation should be visible via missingInputs
      expect(screen.getByText(/Missing Inputs/i)).toBeInTheDocument();
      expect(screen.getByText(/CAREER_PROMISE_MISSING/i)).toBeInTheDocument();
      expect(screen.getByText(/Career promise evidence not available in chart/i)).toBeInTheDocument();

      // Career Synthesis section should show unavailable state
      expect(screen.getByText(/Career activation unavailable/i)).toBeInTheDocument();
    });

    it('SelectedPeriodSection: MD change clears AD and disables submit', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md_jupiter',
            planet: 'Jupiter',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: [
              {
                id: 'ad_saturn',
                planet: 'Saturn',
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                valid: true,
                diagnostics: [],
                temporalRelation: 'PAST'
              },
              {
                id: 'ad_mars',
                planet: 'Mars',
                start: '2022-01-01T00:00:00.000Z',
                end: '2024-01-01T00:00:00.000Z',
                valid: true,
                diagnostics: [],
                temporalRelation: 'CURRENT'
              }
            ]
          },
          {
            id: 'md_saturn',
            planet: 'Saturn',
            start: '2036-01-01T00:00:00.000Z',
            end: '2055-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'FUTURE',
            antardashas: []
          }
        ],
        diagnostics: []
      };

      const onSelect = vi.fn();
      render(
        <SelectedPeriodSection
          dashPeriodOptions={dashPeriodOptions}
          onSelect={onSelect}
        />
      );

      const mdSelect = screen.getByRole('combobox', { name: /Mahadasha/i });
      const adSelect = screen.getByRole('combobox', { name: /Antardasha/i });
      const submitButton = screen.getByRole('button', { name: /Analyze Selected Period/i });

      // Initially, AD select should be disabled
      expect(adSelect).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Select Jupiter MD
      fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });

      // AD select should now be enabled, but submit still disabled (no AD selected)
      expect(adSelect).not.toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Select Saturn AD
      fireEvent.change(adSelect, { target: { value: 'ad_saturn' } });

      // Submit should now be enabled
      expect(submitButton).not.toBeDisabled();

      // Change MD to Saturn - AD should be cleared and submit disabled
      fireEvent.change(mdSelect, { target: { value: 'md_saturn' } });

      expect(adSelect).toHaveValue('');
      expect(submitButton).toBeDisabled();
    });

    it('SelectedPeriodSection: renders unknown diagnostic codes visibly', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md_venus',
            planet: 'Venus',
            start: '2020-01-01T00:00:00.000Z',
            end: '2040-01-01T00:00:00.000Z',
            valid: false,
            diagnostics: ['UNRECOGNIZED_PERIOD_ISSUE'],
            temporalRelation: 'UNKNOWN',
            antardashas: []
          }
        ],
        diagnostics: []
      };

      render(
        <SelectedPeriodSection
          dashPeriodOptions={dashPeriodOptions}
          onSelect={vi.fn()}
        />
      );

      const diagnostics = screen.getByRole('alert', { name: 'Unavailable Dasha periods' });
      expect(within(diagnostics).getAllByText('UNRECOGNIZED_PERIOD_ISSUE').length).toBeGreaterThan(0);
    });

    it('SelectedPeriodSection: announces invalid-period explanations and codes accessibly', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md_venus',
            planet: 'Venus',
            start: '2020-01-01T00:00:00.000Z',
            end: '2040-01-01T00:00:00.000Z',
            valid: false,
            diagnostics: ['INVALID_MAHADASHA_INTERVAL'],
            temporalRelation: 'UNKNOWN',
            antardashas: []
          }
        ],
        diagnostics: []
      };

      render(
        <SelectedPeriodSection
          dashPeriodOptions={dashPeriodOptions}
          onSelect={vi.fn()}
        />
      );

      const diagnostics = screen.getByRole('alert', { name: 'Unavailable Dasha periods' });
      expect(diagnostics).toHaveTextContent('Invalid Mahadasha time interval');
      expect(diagnostics).toHaveTextContent('INVALID_MAHADASHA_INTERVAL');
    });

    it('SelectedPeriodSection: valid submit calls onSelect with exact canonical IDs', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md_jupiter',
            planet: 'Jupiter',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: [
              {
                id: 'ad_saturn',
                planet: 'Saturn',
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                valid: true,
                diagnostics: [],
                temporalRelation: 'PAST'
              }
            ]
          }
        ],
        diagnostics: []
      };

      const onSelect = vi.fn();
      render(
        <SelectedPeriodSection
          dashPeriodOptions={dashPeriodOptions}
          onSelect={onSelect}
        />
      );

      const mdSelect = screen.getByRole('combobox', { name: /Mahadasha/i });
      const adSelect = screen.getByRole('combobox', { name: /Antardasha/i });
      const submitButton = screen.getByRole('button', { name: /Analyze Selected Period/i });

      fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });
      fireEvent.change(adSelect, { target: { value: 'ad_saturn' } });
      fireEvent.click(submitButton);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('md_jupiter', 'ad_saturn');
    });

    it('SelectedPeriodSection: with isSubmitting, selects and button disabled, status announces "Analyzing"', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md_jupiter',
            planet: 'Jupiter',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: [
              {
                id: 'ad_saturn',
                planet: 'Saturn',
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                valid: true,
                diagnostics: [],
                temporalRelation: 'PAST'
              }
            ]
          }
        ],
        diagnostics: []
      };

      const onSelect = vi.fn();
      render(
        <SelectedPeriodSection
          dashPeriodOptions={dashPeriodOptions}
          onSelect={onSelect}
          isSubmitting={true}
        />
      );

      const mdSelect = screen.getByRole('combobox', { name: /Mahadasha/i });
      const adSelect = screen.getByRole('combobox', { name: /Antardasha/i });
      const submitButton = screen.getByRole('button', { name: /Analyzing selected period/i });

      // Selects should be disabled by fieldset
      expect(mdSelect).toBeDisabled();
      expect(adSelect).toBeDisabled();

      // Button should be disabled and show submitting state
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');

      // Live region should announce "Analyzing"
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent('Analyzing the selected period…');
    });
  });
});
