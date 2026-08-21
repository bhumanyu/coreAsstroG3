import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LifeAnalysisPage } from './LifeAnalysisPage';
import type {
  LifeAnalysisProductState,
  LifeAnalysisViewModel
} from '../../product/life-analysis/lifeAnalysisTypes';
import type { AiExplanationViewModel } from '../../ai';

describe('LifeAnalysisPage', () => {
  const mockReadyAnalysis: LifeAnalysisViewModel = {
    status: 'READY',
    overall: {
      status: 'STRONGLY_SUPPORTED',
      statement: 'Overall life alignment indicates exceptional potential in career and wealth generation.',
      strongestDomainNames: ['Career & Vocation', 'Wealth & Assets'],
      challengedDomainNames: []
    },
    strongestDomains: [
      {
        domain: 'CAREER',
        displayName: 'Career & Vocation',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        conclusion: 'Strong vocational leadership through 10th house Sun and Mars.',
        supportingEvidenceCount: 3,
        challengingEvidenceCount: 1
      },
      {
        domain: 'WEALTH',
        displayName: 'Wealth & Prosperity',
        status: 'SUPPORTED',
        strength: 'MODERATE',
        confidence: 'HIGH',
        conclusion: 'Solid asset accumulation reinforced by 2nd house lord Jupiter.',
        supportingEvidenceCount: 4,
        challengingEvidenceCount: 0
      }
    ],
    domains: [
      {
        domain: 'CAREER',
        displayName: 'Career & Vocation',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        conclusion: 'Strong vocational leadership through 10th house Sun and Mars.',
        supportingEvidenceCount: 3,
        challengingEvidenceCount: 1
      },
      {
        domain: 'WEALTH',
        displayName: 'Wealth & Prosperity',
        status: 'SUPPORTED',
        strength: 'MODERATE',
        confidence: 'HIGH',
        conclusion: 'Solid asset accumulation reinforced by 2nd house lord Jupiter.',
        supportingEvidenceCount: 4,
        challengingEvidenceCount: 0
      }
    ],
    careerDetail: {
      natalPromise: 'STRONG',
      d10Relationship: 'CONFIRMS',
      currentDashaEffect: 'SUPPORT',
      currentTransitEffect: 'TRIGGER',
      headline: 'Executive Leadership & Strategic Endeavors',
      statement: 'Natal 10th house lord is prominently placed in Kendra with supportive Dasamsa alignment.',
      dominantManifestations: ['LEADERSHIP', 'INDEPENDENT_ENTERPRISE']
    },
    wealthDetail: {
      natalPromise: 'MODERATE',
      d2Relationship: 'CONFIRMS',
      currentDashaEffect: 'SUPPORT',
      currentTransitEffect: 'MODIFIER',
      overallStatus: 'SUPPORTED',
      accumulationStatus: 'STRONGLY_SUPPORTED',
      gainsStatus: 'SUPPORTED',
      fortuneStatus: 'SUPPORTED',
      speculationStatus: 'CHALLENGED',
      headline: 'Sustainable Capital Growth via Long-Term Holdings',
      statement: 'Strong 2nd house ensures steady asset accumulation despite conservative speculative returns.'
    },
    sharedTiming: [
      {
        source: 'DASHA',
        title: 'Jupiter Mahadasha / Sun Antardasha',
        period: '2025 - 2027',
        domains: [
          { domain: 'CAREER', effect: 'SUPPORT' },
          { domain: 'WEALTH', effect: 'SUPPORT' }
        ],
        statement: 'Harmonious dasha activation elevating vocational status and asset accumulation simultaneously.',
        evidenceCount: 4,
        isConflict: false
      },
      {
        source: 'TRANSIT',
        title: 'Saturn transit 8th from Moon',
        period: '2026',
        domains: [
          { domain: 'CAREER', effect: 'CHALLENGE' },
          { domain: 'WEALTH', effect: 'MODIFIER' }
        ],
        statement: 'Transit pressure urging restructuring of professional responsibilities.',
        evidenceCount: 2,
        isConflict: true
      }
    ],
    conflicts: [
      {
        type: 'DOMAIN_VS_TIMING',
        severity: 'MODERATE',
        domains: ['CAREER', 'WEALTH'],
        statement: 'Dasha lord activates career while challenging wealth accumulation.',
        evidenceCount: 3
      }
    ],
    confidence: 'HIGH',
    completeness: {
      overall: 'COMPLETE',
      label: '100% Calculated Factors Verified'
    },
    evidence: [
      {
        id: 'EV-001',
        role: 'SUPPORTING',
        statement: 'Sun in 10th house in Digbala imparts inherent leadership authority.',
        source: 'D1 Natal Lagna'
      },
      {
        id: 'EV-002',
        role: 'CHALLENGING',
        statement: 'Saturn 8th transit casts restrictive aspect on wealth accumulation.',
        source: 'Gochara Transit'
      }
    ],
    careerWhy: {
      integrity: {
        status: 'VALID',
        resolved: 1,
        totalReferenced: 1,
        unresolved: 0,
        unresolvedIds: []
      },
      grouped: {
        primary: [
          {
            id: 'E-CAREER-01',
            domain: 'CAREER',
            role: 'PRIMARY',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            title: 'Sun Digbala in 10th House',
            statement: 'Sun occupies the 10th house Kendra possessing maximum directional strength.',
            source: { label: 'D1 Natal Chart', type: 'HOUSE' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-CAREER-01',
              domain: 'CAREER',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        supporting: [],
        challenging: [],
        conflicting: [],
        confirmations: [],
        timing: [],
        modifiers: []
      },
      evidence: [
        {
          id: 'E-CAREER-01',
          domain: 'CAREER',
          role: 'PRIMARY',
          polarity: 'SUPPORTING',
          displayPolarity: 'SUPPORTING',
          title: 'Sun Digbala in 10th House',
          statement: 'Sun occupies the 10th house Kendra possessing maximum directional strength.',
          source: { label: 'D1 Natal Chart', type: 'HOUSE' },
          relatedEvidenceIds: [],
          traceability: {
            evidenceId: 'E-CAREER-01',
            domain: 'CAREER',
            relatedEvidenceIds: [],
            valid: true
          },
          availability: 'AVAILABLE'
        }
      ]
    },
    wealthWhy: {
      integrity: {
        status: 'VALID',
        resolved: 2,
        totalReferenced: 2,
        unresolved: 0,
        unresolvedIds: []
      },
      grouped: {
        primary: [],
        supporting: [
          {
            id: 'E-WEALTH-ACC',
            domain: 'WEALTH',
            role: 'PRIMARY',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            dimension: 'ACCUMULATION',
            title: '2nd Lord Exalted in Kendra',
            statement: '2nd Lord strong in Kendra ensures liquid wealth preservation.',
            source: { label: 'D1 Natal Chart', type: 'HOUSE' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-WEALTH-ACC',
              domain: 'WEALTH',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          },
          {
            id: 'E-WEALTH-SPEC',
            domain: 'WEALTH',
            role: 'SECONDARY',
            polarity: 'CHALLENGING',
            displayPolarity: 'CHALLENGING',
            dimension: 'SPECULATION',
            title: '5th Lord in 8th House Placement',
            statement: 'Speculative returns experience elevated volatility.',
            source: { label: 'D1 Natal Chart', type: 'LORDSHIP' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-WEALTH-SPEC',
              domain: 'WEALTH',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        challenging: [],
        conflicting: [],
        confirmations: [],
        timing: [],
        modifiers: [],
        accumulation: [
          {
            id: 'E-WEALTH-ACC',
            domain: 'WEALTH',
            role: 'PRIMARY',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            dimension: 'ACCUMULATION',
            title: '2nd Lord Exalted in Kendra',
            statement: '2nd Lord strong in Kendra ensures liquid wealth preservation.',
            source: { label: 'D1 Natal Chart', type: 'HOUSE' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-WEALTH-ACC',
              domain: 'WEALTH',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        gains: [],
        fortune: [],
        speculation: [
          {
            id: 'E-WEALTH-SPEC',
            domain: 'WEALTH',
            role: 'SECONDARY',
            polarity: 'CHALLENGING',
            displayPolarity: 'CHALLENGING',
            dimension: 'SPECULATION',
            title: '5th Lord in 8th House Placement',
            statement: 'Speculative returns experience elevated volatility.',
            source: { label: 'D1 Natal Chart', type: 'LORDSHIP' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-WEALTH-SPEC',
              domain: 'WEALTH',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        unclassified: []
      },
      evidence: [
        {
          id: 'E-WEALTH-ACC',
          domain: 'WEALTH',
          role: 'PRIMARY',
          polarity: 'SUPPORTING',
          displayPolarity: 'SUPPORTING',
          dimension: 'ACCUMULATION',
          title: '2nd Lord Exalted in Kendra',
          statement: '2nd Lord strong in Kendra ensures liquid wealth preservation.',
          source: { label: 'D1 Natal Chart', type: 'HOUSE' },
          relatedEvidenceIds: [],
          traceability: {
            evidenceId: 'E-WEALTH-ACC',
            domain: 'WEALTH',
            relatedEvidenceIds: [],
            valid: true
          },
          availability: 'AVAILABLE'
        },
        {
          id: 'E-WEALTH-SPEC',
          domain: 'WEALTH',
          role: 'SECONDARY',
          polarity: 'CHALLENGING',
          displayPolarity: 'CHALLENGING',
          dimension: 'SPECULATION',
          title: '5th Lord in 8th House Placement',
          statement: 'Speculative returns experience elevated volatility.',
          source: { label: 'D1 Natal Chart', type: 'LORDSHIP' },
          relatedEvidenceIds: [],
          traceability: {
            evidenceId: 'E-WEALTH-SPEC',
            domain: 'WEALTH',
            relatedEvidenceIds: [],
            valid: true
          },
          availability: 'AVAILABLE'
        }
      ]
    },
    why: {
      integrity: {
        status: 'VALID',
        resolved: 6,
        totalReferenced: 6,
        unresolved: 0,
        unresolvedIds: []
      },
      grouped: {
        primary: [
          {
            id: 'E-PRI-01',
            domain: 'CAREER',
            role: 'PRIMARY',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            title: 'Sun Digbala in 10th House',
            statement: 'Sun occupies the 10th house Kendra possessing maximum directional strength.',
            source: { label: 'D1 Natal Chart', type: 'HOUSE' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-PRI-01',
              domain: 'CAREER',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        supporting: [
          {
            id: 'E-SUP-01',
            domain: 'WEALTH',
            role: 'SECONDARY',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            title: 'Jupiter in 2nd House Aspect',
            statement: 'Benefic Jupiter aspect stabilizes liquid wealth preservation.',
            source: { label: 'D1 Natal Chart', type: 'PLANET' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-SUP-01',
              domain: 'WEALTH',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        challenging: [
          {
            id: 'E-CHAL-01',
            domain: 'WEALTH',
            role: 'SECONDARY',
            polarity: 'CHALLENGING',
            displayPolarity: 'CHALLENGING',
            title: '5th Lord in 8th House Placement',
            statement: 'Speculative investments carry elevated volatility due to 8th house placement.',
            source: { label: 'D1 Natal Chart', type: 'LORDSHIP' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-CHAL-01',
              domain: 'WEALTH',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        conflicting: [],
        confirmations: [
          {
            id: 'E-CONF-01',
            domain: 'CAREER',
            role: 'CONFIRMATION',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            title: 'D10 Mars Exaltation',
            statement: 'Dasamsa D10 Mars exalted confirms executive initiative in vocational spheres.',
            source: { label: 'D10 Dasamsa', type: 'VARGA' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-CONF-01',
              domain: 'CAREER',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        timing: [
          {
            id: 'E-TIM-01',
            domain: 'CAREER',
            role: 'TIMING',
            polarity: 'SUPPORTING',
            displayPolarity: 'SUPPORTING',
            title: 'Jupiter-Sun Active Dasha',
            statement: 'Major and minor lords both occupy auspicious Kendras from Lagna.',
            source: { label: 'Vimshottari Dasha', type: 'DASHA' },
            relatedEvidenceIds: [],
            traceability: {
              evidenceId: 'E-TIM-01',
              domain: 'CAREER',
              relatedEvidenceIds: [],
              valid: true
            },
            availability: 'AVAILABLE'
          }
        ],
        modifiers: []
      },
      evidence: []
    }
  };

  const mockAiExplanation: AiExplanationViewModel = {
    kind: 'SUCCESS',
    requestId: 'ai-req-001',
    task: 'CHART_SYNTHESIS',
    status: 'SUCCESS',
    conclusion: 'AI synthesized reading: The native shows profound executive career capability with disciplined capital growth.',
    supportingEvidence: [
      {
        evidence: {
          id: 'AI-EV-01',
          dimension: 'NATAL_STRUCTURE',
          source: 'PLANET',
          statement: 'Sun in 10th House in Digbala',
          strength: 'STRONG',
          effect: 'SUPPORT'
        },
        role: 'SUPPORTING'
      }
    ],
    challengingEvidence: [
      {
        evidence: {
          id: 'AI-EV-02',
          dimension: 'TIMING',
          source: 'TRANSIT',
          statement: 'Saturn 8th transit urging moderation',
          strength: 'MODERATE',
          effect: 'CHALLENGE'
        },
        role: 'CHALLENGING'
      }
    ],
    unresolvedQuestions: [],
    warnings: [],
    triggeredRuleIds: ['RULE-01', 'RULE-02'],
    providerId: 'local-vedic-rules',
    providerName: 'Local Vedic Rules Provider',
    providerKind: 'LOCAL_RULES',
    routingMode: 'LOCAL_ONLY',
    fallbackUsed: false,
    selectionReason: 'ONLY_ELIGIBLE_PROVIDER',
    generatedAt: '2026-01-01T00:00:00.000Z'
  };

  it('LOADING renders the loading state', () => {
    const loadingState: LifeAnalysisProductState = {
      status: 'LOADING'
    };

    render(<LifeAnalysisPage state={loadingState} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Preparing Life Analysis…/i)).toBeInTheDocument();
    expect(screen.getByText(/Synthesizing Life Analysis/i)).toBeInTheDocument();
  });

  it('READY renders overall, Career, and Wealth sections', () => {
    const readyState: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={readyState} />);

    // Header & Overall
    expect(screen.getByText('Unified Life Domain Analysis')).toBeInTheDocument();
    expect(screen.getByText('Life Domain Synthesis Overview')).toBeInTheDocument();
    expect(
      screen.getByText(/Overall life alignment indicates exceptional potential/i)
    ).toBeInTheDocument();

    // Career Card
    expect(screen.getByText('Career & Vocation Domain (D10 / 10th House)')).toBeInTheDocument();
    expect(screen.getByText('Executive Leadership & Strategic Endeavors')).toBeInTheDocument();

    // Wealth Card
    expect(screen.getByText('Wealth & Prosperity Domain (D2 / 2nd & 11th Houses)')).toBeInTheDocument();
    expect(screen.getByText('Sustainable Capital Growth via Long-Term Holdings')).toBeInTheDocument();
  });

  it('PARTIAL shows the partial notice and is NOT treated as an error', () => {
    const partialAnalysis: LifeAnalysisViewModel = {
      ...mockReadyAnalysis,
      status: 'PARTIAL',
      completeness: {
        overall: 'PARTIAL',
        label: 'Partial Astrological Inputs'
      }
    };

    const partialState: LifeAnalysisProductState = {
      status: 'PARTIAL',
      analysis: partialAnalysis
    };

    render(<LifeAnalysisPage state={partialState} />);

    // Partial notice is rendered with role="status" and is not an alert error
    const partialNotice = screen.getByLabelText('Partial Analysis Notice');
    expect(partialNotice).toBeInTheDocument();
    expect(partialNotice).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Partial life domain analysis rendered/i)
    ).toBeInTheDocument();
  });

  it('ERROR with no analysis shows the retry action and clicking calls onRetry', () => {
    const onRetryMock = vi.fn();
    const errorState: LifeAnalysisProductState = {
      status: 'ERROR',
      errorMessage: 'Calculation engine timed out.'
    };

    render(<LifeAnalysisPage state={errorState} onRetry={onRetryMock} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Calculation engine timed out.')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry analysis/i });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('renders supporting and challenging evidence', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={state} />);

    expect(screen.getAllByText('Why this conclusion?').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Primary Structural Pillars')).toBeInTheDocument();
    expect(screen.getByText('Supporting Evidence')).toBeInTheDocument();
    expect(screen.getByText('Challenging Factors')).toBeInTheDocument();
    expect(screen.getByText('Sun Digbala in 10th House')).toBeInTheDocument();
    expect(screen.getByText('5th Lord in 8th House Placement')).toBeInTheDocument();
  });

  it('renders timing activation separately from domain promise', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={state} />);

    // Timing section header
    expect(
      screen.getByText('Shared Cross-Domain Timing Activations')
    ).toBeInTheDocument();

    // Timing activation title and statement
    expect(
      screen.getByText('Jupiter Mahadasha / Sun Antardasha')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Harmonious dasha activation elevating vocational status/i)
    ).toBeInTheDocument();

    // Verify timing has impact badges
    expect(screen.getByText('Saturn transit 8th from Moon')).toBeInTheDocument();
    expect(screen.getByText('Current Tension / Divergent Effects')).toBeInTheDocument();
  });

  it('renders conflicts without replacing the overall conclusion', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={state} />);

    // Overall conclusion exists
    expect(
      screen.getByText(/Overall life alignment indicates exceptional potential/i)
    ).toBeInTheDocument();

    // Conflict section exists
    expect(screen.getByText('Cross-Domain Conflicts & Tensions')).toBeInTheDocument();
    expect(
      screen.getByText(/Dasha lord activates career while challenging wealth accumulation/i)
    ).toBeInTheDocument();
  });

  it('AI output is labelled as explanation and is visually after deterministic sections', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis,
      aiExplanation: mockAiExplanation
    };

    const { container } = render(<LifeAnalysisPage state={state} />);

    // AI Explanation section heading
    expect(screen.getByText('AI Synthesis Explanation')).toBeInTheDocument();
    expect(
      screen.getByText(/AI synthesized reading: The native shows profound executive career capability/i)
    ).toBeInTheDocument();

    // Verify ordering: AI explanation section comes after deterministic domain-specific sections
    const headings = container.querySelectorAll('h2, h3');
    const headingTexts = Array.from(headings).map((h) => h.textContent?.trim());

    const overviewIndex = headingTexts.findIndex((t) => t?.includes('Life Domain Synthesis Overview'));
    const timingIndex = headingTexts.findIndex((t) => t?.includes('Shared Cross-Domain Timing Activations'));
    const conflictIndex = headingTexts.findIndex((t) => t?.includes('Cross-Domain Conflicts & Tensions'));
    const aiIndex = headingTexts.findIndex((t) => t?.includes('AI Synthesis Explanation'));

    expect(overviewIndex).toBeGreaterThan(-1);
    expect(timingIndex).toBeGreaterThan(overviewIndex);
    expect(conflictIndex).toBeGreaterThan(timingIndex);
    expect(aiIndex).toBeGreaterThan(conflictIndex);
  });

  it('Wealth renders four distinct dimensions (Accumulation/Gains/Fortune/Speculation)', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={state} />);

    expect(screen.getByText('4 Classical Wealth Dimensions:')).toBeInTheDocument();
    expect(screen.getByText('Accumulation (2H)')).toBeInTheDocument();
    expect(screen.getByText('Gains (11H)')).toBeInTheDocument();
    expect(screen.getByText('Fortune (9H)')).toBeInTheDocument();
    expect(screen.getByText('Speculation (5H)')).toBeInTheDocument();

    // Check independent note on accumulation vs speculation
    expect(
      screen.getByText(/High accumulation capacity \(2nd House\) reflects wealth retention and stability/i)
    ).toBeInTheDocument();
  });

  it('Regression test: no percentage numeric scores are rendered in the UI', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    const { container } = render(<LifeAnalysisPage state={state} />);

    // Categorical badges should not have % scores
    const badges = container.querySelectorAll('.rounded-full, .rounded-lg');
    const badgeTexts = Array.from(badges).map((b) => b.textContent || '');
    const hasNumericPercentScores = badgeTexts.some((text) => /^[0-9]+(\.[0-9]+)?%$/.test(text.trim()));

    expect(hasNumericPercentScores).toBe(false);
  });

  it('P-034: clicking "Why this conclusion?" on Career card opens dialog with aria-modal, correct banner, and Career evidence', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={state} />);

    // Find the Career card's "Why this conclusion?" button
    const whyButtons = screen.getAllByRole('button', { name: /Why this conclusion\?/i });
    expect(whyButtons.length).toBeGreaterThanOrEqual(2);

    const careerButton = whyButtons[0];
    careerButton.focus();
    expect(document.activeElement).toBe(careerButton);

    // Click the first one (Career card)
    fireEvent.click(careerButton);

    // Check modal opens with role="dialog" and aria-modal="true"
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Career & Vocation Evidence')).toBeInTheDocument();

    // Check updated banner wording
    expect(
      within(dialog).getByText(/All 1 referenced evidence items are resolved from the deterministic domain analysis\./i)
    ).toBeInTheDocument();

    // Check close button and click to close
    const closeBtns = within(dialog).getAllByRole('button', { name: /Close evidence/i });
    expect(closeBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(closeBtns[0]);

    // Dialog should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('P-034: clicking "Why this conclusion?" on Wealth card opens dialog showing Accumulation and Speculation dimensions', () => {
    const state: LifeAnalysisProductState = {
      status: 'READY',
      analysis: mockReadyAnalysis
    };

    render(<LifeAnalysisPage state={state} />);

    // Find the Wealth card's "Why this conclusion?" button (second button)
    const whyButtons = screen.getAllByRole('button', { name: /Why this conclusion\?/i });
    expect(whyButtons.length).toBeGreaterThanOrEqual(2);

    // Click the second one (Wealth card)
    fireEvent.click(whyButtons[1]);

    // Check modal opens
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Wealth & Prosperity Evidence')).toBeInTheDocument();

    // Wealth panel groups by dimension: should show Accumulation and Speculation sections in dialog
    expect(within(dialog).getByRole('heading', { name: /Accumulation/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /Speculation/i })).toBeInTheDocument();

    // Check close button
    const closeBtns = within(dialog).getAllByRole('button', { name: /Close evidence/i });
    expect(closeBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(closeBtns[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
