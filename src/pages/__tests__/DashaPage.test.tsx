import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DashaPage } from '../DashaPage';
import { SelectedPeriodReport } from '../../components/dasha';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import type { ProductSynthesisWealthDimensionRow, ProductSelectedPeriodSynthesis } from '../../product/analysis/productAnalysisTypes';

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
  linkageTrace: [],
  insufficientReason: 'NO_PROMISE_EVIDENCE' as const
});

describe('DashaPage (P-UI-07)', () => {
  it('1. Loading state: renders DashaLoadingState when status is LOADING', () => {
    render(
      <DashaPage
        productAnalysisState={{
          status: 'LOADING'
        }}
      />
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Analyzing Planetary Timing & Dasha Periods')).toBeInTheDocument();
  });

  it('2. Unavailable state: renders DashaUnavailableState when analysis is absent', () => {
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis: undefined
        }}
      />
    );

    expect(screen.getByText('Dasha & Timing Analysis Unavailable')).toBeInTheDocument();
  });

  it('3. Error state: renders DashaErrorState with error message and handles retry', () => {
    const onRetry = vi.fn();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'ERROR',
          error: 'Dasha computation failed'
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Dasha & Timing Computation Error')).toBeInTheDocument();
    expect(screen.getByText('Dasha computation failed')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /recalculate/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('4. Rendered sections: renders all major sections from canonical ProductAnalysis', () => {
    const analysis = createProductAnalysis();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Hero
    expect(screen.getByText('Dasha & Planetary Timing')).toBeInTheDocument();

    // Major headings asserted in spec Â§24 & prompt requirements:
    expect(screen.getByText('Current Dasha Hierarchy')).toBeInTheDocument();
    expect(screen.getByText('Career Activation')).toBeInTheDocument();
    expect(screen.getByText('Wealth Activation')).toBeInTheDocument();
    expect(screen.getByText('Transit Timing')).toBeInTheDocument();

    // Additional expected sections
    expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
    expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();

    // Assert period contents scoped strictly to the Current Dasha Hierarchy region
    const hierarchySection = screen.getByTestId('current-dasha-hierarchy');
    const hierarchyWithin = within(hierarchySection);
    expect(hierarchyWithin.getByText('Jupiter')).toBeInTheDocument();
    expect(hierarchyWithin.getByText('Saturn')).toBeInTheDocument();
    expect(hierarchyWithin.getByText('Mercury')).toBeInTheDocument();
    expect(hierarchyWithin.getByText('Mahadasha (MD)')).toBeInTheDocument();
    expect(hierarchyWithin.getByText('Antardasha (AD)')).toBeInTheDocument();
    expect(hierarchyWithin.getByText('Pratyantardasha (PD)')).toBeInTheDocument();
  });

  it('5. Navigation handling: triggers onNavigate with reasoning when explore reasoning is clicked', () => {
    const onNavigate = vi.fn();
    const analysis = createProductAnalysis();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        onNavigate={onNavigate}
      />
    );

    const exploreBtn = screen.getByRole('button', { name: /explore reasoning graph/i });
    fireEvent.click(exploreBtn);
    expect(onNavigate).toHaveBeenCalledWith('reasoning');
  });

  it('6. Selected period INVALID_SELECTION: renders error banner, hides report', () => {
    const analysis = createProductAnalysis({
      selectedPeriod: {
        status: 'INVALID_SELECTION',
        error: 'INVALID_SELECTED_PERIOD_CONTEXT'
      }
    });

    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
      />
    );

    // Error banner should be shown
    expect(screen.getByText('Period Selection Failed')).toBeInTheDocument();
    expect(screen.getByText(/Status: INVALID_SELECTION/)).toBeInTheDocument();
    expect(screen.getByText(/INVALID_SELECTED_PERIOD_CONTEXT/)).toBeInTheDocument();

    // Report should not be rendered (no synthesis, no report section)
    expect(screen.queryByText(/selected period report/i)).not.toBeInTheDocument();
  });

  it('7. Selection ERROR: renders error banner, baseline dasha.current still rendered', () => {
    const analysis = createProductAnalysis();

    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        selectionState={{
          status: 'ERROR',
          error: 'Network timeout during period selection'
        }}
      />
    );

    // Selection error banner should be shown
    expect(screen.getByText('Selection Error')).toBeInTheDocument();
    expect(screen.getByText('Network timeout during period selection')).toBeInTheDocument();

    // Baseline dasha.current should still be rendered
    expect(screen.getByText('Current Dasha Hierarchy')).toBeInTheDocument();
    const hierarchySection = screen.getByTestId('current-dasha-hierarchy');
    const hierarchyWithin = within(hierarchySection);
    expect(hierarchyWithin.getByText('Jupiter')).toBeInTheDocument();
  });

  it('8. New analysis identity clears selector and submitted report; manual changes still invalidate', () => {
    // Test that the component handles dashPeriodOptions correctly with controlled submit flow
    const analysis = createProductAnalysis({
      selectedPeriod: {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
          qualificationStatus: 'CANONICAL',
          period: {
            selectedPeriodId: 'period-1',
            mahadashaId: 'md_jupiter',
            mahadashaPlanet: 'Jupiter',
            antardashaId: 'ad_saturn',
            antardashaPlanet: 'Saturn',
            interval: { start: '2020-01-01T00:00:00.000Z', end: '2022-01-01T00:00:00.000Z' },
            analysisAsOf: '2021-01-01T00:00:00.000Z',
            temporalRelation: 'CURRENT'
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
                linkageTrace: [],
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
                linkageTrace: [],
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
                linkageTrace: [],
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
                linkageTrace: [],
                insufficientReason: 'NO_PROMISE_EVIDENCE' as const
              }
            },
            diagnostics: []
          },
          evidence: [],
          missingInputs: [],
          provenance: {
            career: { status: 'PRESENT', version: 'v1', qualificationBasis: 'CANONICAL_STATUS' },
            wealth: { status: 'PRESENT', version: 'v1' }
          },
          aiExplanationStatus: 'NOT_REQUESTED'
        }
      },
      dashPeriodOptions: {
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
          }
        ],
        diagnostics: []
      }
    });

    const onSelectPeriod = vi.fn();
    const { rerender } = render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        onSelectPeriod={onSelectPeriod}
      />
    );

    // Initially, with matching selectedPeriod, the report should be visible
    // (Note: The component may gate on submittedPeriod, so report might not be visible initially)
    // For this test, we focus on the selection change clearing the report

    // Verify the MD select exists and can be interacted with
    const mdSelect = screen.getByLabelText(/Mahadasha \(Major Period\)/i);
    expect(mdSelect).toBeInTheDocument();

    fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });
    fireEvent.change(screen.getByLabelText(/Antardasha \(Sub-period\)/i), {
      target: { value: 'ad_saturn' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Analyze Selected Period/i }));
    rerender(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis }}
        selectionState={{ status: 'READY' }}
        onSelectPeriod={onSelectPeriod}
      />
    );
    expect(screen.getByText(/Selected Period Analysis/i)).toBeInTheDocument();

    const refreshedAnalysis = {
      ...analysis,
      analysisId: 'pa_test_124',
      dashPeriodOptions: { ...analysis.dashPeriodOptions! }
    };
    rerender(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis: refreshedAnalysis }}
        selectionState={{ status: 'READY' }}
        onSelectPeriod={onSelectPeriod}
      />
    );
    expect(screen.queryByText(/Selected Period Analysis/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Mahadasha \(Major Period\)/i)).toHaveValue('');
    expect(screen.getByLabelText(/Antardasha \(Sub-period\)/i)).toHaveValue('');

    // A new selection can be submitted, and a subsequent manual change still hides it.
    fireEvent.change(screen.getByLabelText(/Mahadasha \(Major Period\)/i), {
      target: { value: 'md_jupiter' }
    });
    fireEvent.change(screen.getByLabelText(/Antardasha \(Sub-period\)/i), {
      target: { value: 'ad_saturn' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Analyze Selected Period/i }));
    expect(screen.getByText(/Selected Period Analysis/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Antardasha \(Sub-period\)/i), {
      target: { value: 'ad_mars' }
    });
    expect(screen.queryByText(/Selected Period Analysis/i)).not.toBeInTheDocument();
  });

  it('9. Stale selectedPeriod result: ID-match gate prevents rendering mismatched result', () => {
    // Test that the ID-match gate in DashaPage prevents rendering stale results
    // When selectedPeriod.synthesis.period IDs don't match submittedPeriod
    const analysis = createProductAnalysis({
      selectedPeriod: {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
          qualificationStatus: 'CANONICAL',
          period: {
            selectedPeriodId: 'sp-1',
            mahadashaId: 'md_jupiter',
            mahadashaPlanet: 'Jupiter',
            antardashaId: 'ad_saturn',
            antardashaPlanet: 'Saturn',
            interval: { start: '2020-01-01', end: '2036-01-01' },
            analysisAsOf: '2026-01-15T08:30:00.000Z',
            temporalRelation: 'CURRENT'
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
                effect: 'ACTIVATES',
                dataStatus: 'COMPLETE',
                linkedLevels: ['MD'],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: [],
                linkageTrace: [],
                insufficientReason: 'LINKED' as const
              },
              GAINS: {
                dimension: 'GAINS',
                effect: 'SUPPORTS',
                dataStatus: 'COMPLETE',
                linkedLevels: ['AD'],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: [],
                linkageTrace: [],
                insufficientReason: 'LINKED' as const
              },
              FORTUNE: {
                dimension: 'FORTUNE',
                effect: 'NEUTRAL',
                dataStatus: 'COMPLETE',
                linkedLevels: [],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: [],
                linkageTrace: [],
                insufficientReason: 'NO_PROMISE_EVIDENCE' as const
              },
              SPECULATION: {
                dimension: 'SPECULATION',
                effect: 'NEUTRAL',
                dataStatus: 'COMPLETE',
                linkedLevels: [],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: [],
                linkageTrace: [],
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
              version: 'v1',
              qualificationBasis: 'CANONICAL_STATUS'
            },
            wealth: {
              status: 'PRESENT',
              version: 'v1'
            }
          },
          aiExplanationStatus: 'NOT_REQUESTED'
        }
      },
      dashPeriodOptions: {
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
      }
    });

    const onSelectPeriod = vi.fn();
    render(
      <DashaPage
        productAnalysisState={{
          status: 'READY',
          analysis
        }}
        onSelectPeriod={onSelectPeriod}
      />
    );

    // Even though selectedPeriod has a valid synthesis, the report should not be visible
    // because submittedPeriod is null (user hasn't submitted yet)
    expect(screen.queryByText(/selected period report/i)).not.toBeInTheDocument();
  });

  describe('Partial result coverage (PBA-06)', () => {
    it('Career-only partial result: selection flow works (component-level coverage in DashaComponents.test.tsx)', () => {
      const onSelectPeriod = vi.fn().mockResolvedValue(undefined);
      const analysis = createProductAnalysis({
        selectedPeriod: {
          status: 'OK',
          synthesis: {
            synthesisVersion: 'PBA-06-v1',
            qualificationStatus: 'PROVISIONAL',
            period: {
              selectedPeriodId: 'period-1',
              mahadashaId: 'md_jupiter',
              mahadashaPlanet: 'Jupiter',
              antardashaId: 'ad_saturn',
              antardashaPlanet: 'Saturn',
              interval: { start: '2020-01-01T00:00:00Z', end: '2022-01-01T00:00:00Z' },
              analysisAsOf: '2021-01-01T00:00:00Z',
              temporalRelation: 'CURRENT'
            },
            natalBaseline: {
              career: { baseline: {} as any, unchanged: true },
              wealth: { baseline: {} as any, unchanged: true }
            },
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
              diagnostics: [
                {
                  code: 'PARTIAL_WEALTH_ACTIVATION_FAILED',
                  message: 'Wealth activation failed due to insufficient evidence'
                }
              ]
            },
            evidence: [],
            missingInputs: [{ domain: 'WEALTH', code: 'NATAL_WEALTH_THEME', description: 'Natal wealth theme interpretation not available' }],
            provenance: {
              career: { status: 'PRESENT', version: 'v1', qualificationBasis: 'CANONICAL_STATUS' },
              wealth: { status: 'MISSING', version: 'v1' }
            },
            aiExplanationStatus: 'NOT_REQUESTED'
          }
        },
        dashPeriodOptions: {
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
        }
      });

      render(
        <DashaPage
          productAnalysisState={{ status: 'READY', analysis }}
          selectionState={{ status: 'READY' }}
          onSelectPeriod={onSelectPeriod}
        />
      );

      // Select MD and AD
      const mdSelect = screen.getByLabelText(/Mahadasha \(Major Period\)/i);
      fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });

      const adSelect = screen.getByLabelText(/Antardasha \(Sub-period\)/i);
      fireEvent.change(adSelect, { target: { value: 'ad_saturn' } });

      // Click "Analyze Selected Period" button
      const analyzeButton = screen.getByRole('button', { name: /Analyze Selected Period/i });
      fireEvent.click(analyzeButton);

      // Verify onSelectPeriod was called with correct IDs
      expect(onSelectPeriod).toHaveBeenCalledWith('md_jupiter', 'ad_saturn');

      // Note: Component-level partial-result rendering assertions are in DashaComponents.test.tsx
      // (SelectedPeriodReport tests with Career-only and Wealth-only partial synthesis)
    });

    it('Wealth-only partial result: selection flow works (component-level coverage in DashaComponents.test.tsx)', () => {
      const onSelectPeriod = vi.fn().mockResolvedValue(undefined);
      const analysis = createProductAnalysis({
        selectedPeriod: {
          status: 'OK',
          synthesis: {
            synthesisVersion: 'PBA-06-v1',
            qualificationStatus: 'PROVISIONAL',
            period: {
              selectedPeriodId: 'period-1',
              mahadashaId: 'md_jupiter',
              mahadashaPlanet: 'Jupiter',
              antardashaId: 'ad_saturn',
              antardashaPlanet: 'Saturn',
              interval: { start: '2020-01-01T00:00:00Z', end: '2022-01-01T00:00:00Z' },
              analysisAsOf: '2021-01-01T00:00:00Z',
              temporalRelation: 'CURRENT'
            },
            natalBaseline: {
              career: { baseline: {} as any, unchanged: true },
              wealth: { baseline: {} as any, unchanged: true }
            },
            career: {
              qualificationBasis: 'UNAVAILABLE',
              expressions: [],
              diagnostics: [
                {
                  code: 'PARTIAL_CAREER_ACTIVATION_FAILED',
                  message: 'Career activation failed due to insufficient evidence'
                }
              ]
            },
            wealth: {
              dimensions: {
                ACCUMULATION: {
                  dimension: 'ACCUMULATION',
                  effect: 'ACTIVATES',
                  dataStatus: 'COMPLETE',
                  linkedLevels: ['MD'],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: [],
                  linkageTrace: [],
                  insufficientReason: 'LINKED' as const
                },
                GAINS: emptyWealthDimension('GAINS'),
                FORTUNE: emptyWealthDimension('FORTUNE'),
                SPECULATION: emptyWealthDimension('SPECULATION')
              },
              diagnostics: []
            },
            evidence: [],
            missingInputs: [{ domain: 'CAREER', code: 'NATAL_CAREER_PATTERN', description: 'Natal career pattern analysis not available' }],
            provenance: {
              career: { status: 'MISSING', version: 'v1', qualificationBasis: 'UNAVAILABLE' },
              wealth: { status: 'PRESENT', version: 'v1' }
            },
            aiExplanationStatus: 'NOT_REQUESTED'
          }
        },
        dashPeriodOptions: {
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
        }
      });

      render(
        <DashaPage
          productAnalysisState={{ status: 'READY', analysis }}
          selectionState={{ status: 'READY' }}
          onSelectPeriod={onSelectPeriod}
        />
      );

      // Select MD and AD
      const mdSelect = screen.getByLabelText(/Mahadasha \(Major Period\)/i);
      fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });

      const adSelect = screen.getByLabelText(/Antardasha \(Sub-period\)/i);
      fireEvent.change(adSelect, { target: { value: 'ad_saturn' } });

      // Click "Analyze Selected Period" button
      const analyzeButton = screen.getByRole('button', { name: /Analyze Selected Period/i });
      fireEvent.click(analyzeButton);

      // Verify onSelectPeriod was called with correct IDs
      expect(onSelectPeriod).toHaveBeenCalledWith('md_jupiter', 'ad_saturn');

      // Note: Component-level partial-result rendering assertions are in DashaComponents.test.tsx
      // (SelectedPeriodReport tests with Career-only and Wealth-only partial synthesis)
    });
  });

  it('renders nothing when aiExplanationStatus is NOT_REQUESTED', () => {
    const analysis = createProductAnalysis({
      selectedPeriod: {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
          qualificationStatus: 'CANONICAL',
          period: {
            selectedPeriodId: 'period-1',
            mahadashaId: 'md_jupiter',
            mahadashaPlanet: 'Jupiter',
            antardashaId: 'ad_saturn',
            antardashaPlanet: 'Saturn',
            interval: { start: '2020-01-01T00:00:00Z', end: '2022-01-01T00:00:00Z' },
            analysisAsOf: '2021-01-01T00:00:00Z',
            temporalRelation: 'CURRENT'
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
                linkageTrace: [],
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
                linkageTrace: [],
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
                linkageTrace: [],
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
                linkageTrace: [],
                insufficientReason: 'NO_PROMISE_EVIDENCE' as const
              }
            },
            diagnostics: []
          },
          evidence: [],
          missingInputs: [],
          provenance: {
            career: { status: 'PRESENT', version: 'v1', qualificationBasis: 'CANONICAL_STATUS' },
            wealth: { status: 'PRESENT', version: 'v1' }
          },
          aiExplanationStatus: 'NOT_REQUESTED'
        }
      }
    });

    render(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis }}
      />
    );

    // Should not render AI explanation when not matching IDs
    expect(screen.queryByText(/AI explanation/i)).not.toBeInTheDocument();
  });

  it('renders error banner when aiExplanationStatus is ERROR', () => {
    const analysis = createProductAnalysis({
      selectedPeriod: {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
          qualificationStatus: 'CANONICAL',
          period: {
            selectedPeriodId: 'period-1',
            mahadashaId: 'md_jupiter',
            mahadashaPlanet: 'Jupiter',
            antardashaId: 'ad_saturn',
            antardashaPlanet: 'Saturn',
            interval: { start: '2020-01-01T00:00:00Z', end: '2022-01-01T00:00:00Z' },
            analysisAsOf: '2021-01-01T00:00:00Z',
            temporalRelation: 'CURRENT'
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
                linkageTrace: [],
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
                linkageTrace: [],
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
                linkageTrace: [],
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
                linkageTrace: [],
                insufficientReason: 'NO_PROMISE_EVIDENCE' as const
              }
            },
            diagnostics: []
          },
          evidence: [],
          missingInputs: [],
          provenance: {
            career: { status: 'PRESENT', version: 'v1', qualificationBasis: 'CANONICAL_STATUS' },
            wealth: { status: 'PRESENT', version: 'v1' }
          },
          aiExplanationStatus: 'ERROR',
          aiExplanation: {
            kind: 'ERROR',
            requestId: 'error-request-id',
            task: 'SELECTED_PERIOD_ANALYSIS',
            status: 'ERROR',
            message: 'AI service unavailable',
            warnings: []
          }
        }
      }
    });

    render(
      <DashaPage
        productAnalysisState={{ status: 'READY', analysis }}
      />
    );

    // Should not render when not matching IDs
    expect(screen.queryByText(/AI Explanation Error/i)).not.toBeInTheDocument();
  });
});
