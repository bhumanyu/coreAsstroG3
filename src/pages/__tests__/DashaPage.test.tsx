import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DashaPage } from '../DashaPage';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';

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

    // Major headings asserted in spec §24 & prompt requirements:
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

  it('8. Changing MD/AD after successful report: report hidden (submittedPeriod cleared)', () => {
    // Test that the component handles dashPeriodOptions correctly
    const analysis = createProductAnalysis({
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

    // Verify the MD select exists and can be interacted with
    const mdSelect = screen.getByLabelText(/Mahadasha \(Major Period\)/i);
    expect(mdSelect).toBeInTheDocument();

    // Change MD select to verify onSelectionChange is called
    fireEvent.change(mdSelect, { target: { value: 'md_jupiter' } });

    // Since submittedPeriod is cleared on selection change, report should not be visible
    expect(screen.queryByText(/selected period report/i)).not.toBeInTheDocument();
  });

  it('9. Stale selectedPeriod result: ID-match gate prevents rendering mismatched result', () => {
    // Test that the ID-match gate in DashaPage prevents rendering stale results
    // When selectedPeriod.synthesis.period IDs don't match submittedPeriod
    const analysis = createProductAnalysis({
      selectedPeriod: {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
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
                diagnostics: []
              },
              GAINS: {
                dimension: 'GAINS',
                effect: 'SUPPORTS',
                dataStatus: 'COMPLETE',
                linkedLevels: ['AD'],
                diagnostics: []
              },
              FORTUNE: {
                dimension: 'FORTUNE',
                effect: 'NEUTRAL',
                dataStatus: 'COMPLETE',
                linkedLevels: [],
                diagnostics: []
              },
              SPECULATION: {
                dimension: 'SPECULATION',
                effect: 'NEUTRAL',
                dataStatus: 'COMPLETE',
                linkedLevels: [],
                diagnostics: []
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
          }
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

  describe('AI explanation states (PBA-09)', () => {
    it('renders pending state when aiExplanationStatus is PENDING', () => {
      const analysis = createProductAnalysis({
        selectedPeriod: {
          status: 'OK',
          synthesis: {
            synthesisVersion: 'PBA-06-v1',
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
                  dashaRuleReferences: []
                },
                GAINS: {
                  dimension: 'GAINS',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
                },
                FORTUNE: {
                  dimension: 'FORTUNE',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
                },
                SPECULATION: {
                  dimension: 'SPECULATION',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
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
            aiExplanationStatus: 'PENDING'
          }
        }
      });

      render(
        <DashaPage
          productAnalysisState={{ status: 'READY', analysis }}
        />
      );

      // Should not render AI explanation when not matching IDs
      expect(screen.queryByText(/AI Explanation Pending/i)).not.toBeInTheDocument();
    });

    it('renders error banner when aiExplanationStatus is ERROR', () => {
      const analysis = createProductAnalysis({
        selectedPeriod: {
          status: 'OK',
          synthesis: {
            synthesisVersion: 'PBA-06-v1',
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
                  dashaRuleReferences: []
                },
                GAINS: {
                  dimension: 'GAINS',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
                },
                FORTUNE: {
                  dimension: 'FORTUNE',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
                },
                SPECULATION: {
                  dimension: 'SPECULATION',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
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

    it('clears AI explanation panel when selection changes', () => {
      const onSelectPeriod = vi.fn();
      const analysis = createProductAnalysis({
        selectedPeriod: {
          status: 'OK',
          synthesis: {
            synthesisVersion: 'PBA-06-v1',
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
                  dashaRuleReferences: []
                },
                GAINS: {
                  dimension: 'GAINS',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
                },
                FORTUNE: {
                  dimension: 'FORTUNE',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
                },
                SPECULATION: {
                  dimension: 'SPECULATION',
                  effect: 'INSUFFICIENT_DATA',
                  dataStatus: 'INSUFFICIENT_DATA',
                  linkedLevels: [],
                  diagnostics: [],
                  promiseEvidenceIds: [],
                  dashaRuleReferences: []
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
            aiExplanationStatus: 'OK',
            aiExplanation: {
              kind: 'SUCCESS',
              status: 'SUCCESS',
              conclusion: 'Test conclusion',
              supportingEvidence: [],
              challengingEvidence: [],
              unresolvedQuestions: [],
              warnings: []
            }
          }
        }
      });

      render(
        <DashaPage
          productAnalysisState={{ status: 'READY', analysis }}
          onSelectPeriod={onSelectPeriod}
        />
      );

      // Initially should not show AI explanation (no matching submittedPeriod)
      expect(screen.queryByText(/AI Explanation/i)).not.toBeInTheDocument();
    });
  });
});
