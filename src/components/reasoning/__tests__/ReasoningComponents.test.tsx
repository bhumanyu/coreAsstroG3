import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ReasoningHero,
  ReasoningChain,
  ReasoningEvidenceGroup,
  ReasoningEvidenceCard,
  ReasoningProvenance,
  ReasoningVargaSection,
  ReasoningDashaSection,
  ReasoningTransitSection,
  ReasoningQualificationSection,
  ReasoningConclusion,
  ReasoningAISection,
  ReasoningLoadingState,
  ReasoningErrorState,
  ReasoningUnavailableState
} from '../index';
import type {
  ReasoningHeroViewModel,
  ReasoningChainNodeViewModel,
  ReasoningEvidenceViewModel,
  ReasoningEvidenceGroupViewModel,
  ReasoningVargaViewModel,
  ReasoningDashaViewModel,
  ReasoningTransitViewModel,
  ReasoningQualificationViewModel,
  ReasoningConclusionViewModel,
  ReasoningAiViewModel
} from '../../../product/analysis/reasoningViewModel';

describe('Reasoning Section Components Suite (P-UI-06)', () => {
  describe('ReasoningHero', () => {
    it('renders title, signs, status, confidence, and metric counts', () => {
      const hero: ReasoningHeroViewModel = {
        domain: 'CAREER',
        title: 'Career & Vocational Reasoning',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        ascendantSign: 'Aries',
        moonSign: 'Taurus',
        sunSign: 'Leo',
        moonNakshatra: 'Rohini',
        evidenceCount: 5,
        supportingEvidenceCount: 4,
        challengingEvidenceCount: 1,
        warnings: [
          {
            domain: 'CAREER',
            code: 'WARN_1',
            severity: 'INFO',
            message: 'Notice message'
          }
        ]
      };

      render(<ReasoningHero hero={hero} />);

      expect(screen.getByText('Career & Vocational Reasoning')).toBeInTheDocument();
      expect(screen.getByText('Strongly Supported')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Aries')).toBeInTheDocument();
      expect(screen.getByText('Taurus')).toBeInTheDocument();
      expect(screen.getByText('Leo')).toBeInTheDocument();
      expect(screen.getByText('Rohini')).toBeInTheDocument();
      expect(screen.getByText('5 Evidence Items')).toBeInTheDocument();
      expect(screen.getByText('4 Factors')).toBeInTheDocument();
      expect(screen.getByText('1 Factors')).toBeInTheDocument();
      expect(screen.getByText('1 Notice')).toBeInTheDocument();
    });
  });

  describe('ReasoningChain & ReasoningNode', () => {
    it('renders sequential reasoning chain nodes with directions and statements', () => {
      const chain: ReasoningChainNodeViewModel[] = [
        {
          id: 'node_1',
          label: 'Natal Vocational Promise',
          type: 'PROMISE',
          direction: 'SUPPORT',
          statement: 'Strong 10th lord placement.'
        },
        {
          id: 'node_2',
          label: 'Dasamsa Alignment',
          type: 'VARGA',
          direction: 'SUPPORT',
          statement: 'D10 confirms status.'
        }
      ];

      render(<ReasoningChain chain={chain} />);

      expect(screen.getByText('Deterministic Evidence Framework')).toBeInTheDocument();
      expect(screen.getByText('The evidence layers contributing to this conclusion')).toBeInTheDocument();
      expect(screen.getByText('2 Evidence Layers')).toBeInTheDocument();
      expect(screen.getByText('Natal Vocational Promise')).toBeInTheDocument();
      expect(screen.getByText('Dasamsa Alignment')).toBeInTheDocument();
      expect(screen.getByText('Strong 10th lord placement.')).toBeInTheDocument();
      expect(screen.getByText('D10 confirms status.')).toBeInTheDocument();
    });
  });

  describe('ReasoningEvidenceCard & ReasoningProvenance', () => {
    it('renders evidence title, statement, badges, and provenance', () => {
      const evidence: ReasoningEvidenceViewModel = {
        id: 'ev_1',
        title: 'Exalted 10th Lord',
        statement: 'Mars exalted in Capricorn in 10th house.',
        direction: 'SUPPORT',
        role: 'PRIMARY',
        source: 'CAREER_ENGINE',
        ruleId: 'RULE_RUCHAKA_YOGA',
        derivedFromIds: ['ev_mars_capricorn'],
        provenance: {
          ruleId: 'RULE_RUCHAKA_YOGA',
          derivedFromIds: ['ev_mars_capricorn'],
          source: 'CAREER_ENGINE',
          isAvailable: true
        }
      };

      render(<ReasoningEvidenceCard evidence={evidence} />);

      expect(screen.getByText('Exalted 10th Lord')).toBeInTheDocument();
      expect(screen.getByText('Primary Driver')).toBeInTheDocument();
      expect(screen.getByText('Supporting')).toBeInTheDocument();
      expect(screen.getByText('Mars exalted in Capricorn in 10th house.')).toBeInTheDocument();
      expect(screen.getByText('Rule: RULE_RUCHAKA_YOGA')).toBeInTheDocument();
      expect(screen.getByText('Derived from: ev_mars_capricorn')).toBeInTheDocument();
      expect(screen.getByText('Source: CAREER_ENGINE')).toBeInTheDocument();
    });
  });

  describe('ReasoningEvidenceGroup', () => {
    it('renders evidence group with items', () => {
      const group: ReasoningEvidenceGroupViewModel = {
        id: 'PRIMARY',
        title: 'Primary Drivers',
        items: [
          {
            id: 'ev_1',
            title: 'Exalted Lord',
            statement: 'Exalted planet in quadrant.',
            direction: 'SUPPORT',
            role: 'PRIMARY',
            source: 'ENGINE',
            derivedFromIds: [],
            provenance: {
              derivedFromIds: [],
              source: 'ENGINE',
              isAvailable: false
            }
          }
        ]
      };

      render(<ReasoningEvidenceGroup group={group} />);

      expect(screen.getByText('Primary Drivers')).toBeInTheDocument();
      expect(screen.getByText('1 Rule')).toBeInTheDocument();
      expect(screen.getByText('Exalted Lord')).toBeInTheDocument();
    });
  });

  describe('ReasoningVargaSection', () => {
    it('renders D10 alignment with CONFIRMS relationship', () => {
      const varga: ReasoningVargaViewModel = {
        chart: 'D10',
        relationship: 'CONFIRMS',
        statement: 'Dasamsa confirms career trajectory.'
      };

      render(<ReasoningVargaSection varga={varga} />);

      expect(screen.getByText('Dasamsa (D10) Divisional Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Confirms')).toBeInTheDocument();
      expect(screen.getByText('Dasamsa confirms career trajectory.')).toBeInTheDocument();
    });

    it('renders D2 alignment with Hora chart', () => {
      const varga: ReasoningVargaViewModel = {
        chart: 'D2',
        relationship: 'MODIFIES',
        statement: 'Hora modifies asset growth timing.'
      };

      render(<ReasoningVargaSection varga={varga} />);

      expect(screen.getByText('Hora (D2) Divisional Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Modifies')).toBeInTheDocument();
      expect(screen.getByText('Hora modifies asset growth timing.')).toBeInTheDocument();
    });

    it('renders UNAVAILABLE varga relationship cleanly', () => {
      const varga: ReasoningVargaViewModel = {
        chart: 'D10',
        relationship: 'UNAVAILABLE',
        statement: undefined
      };

      render(<ReasoningVargaSection varga={varga} />);

      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      expect(
        screen.getByText('Dasamsa (D10) divisional relationship data is unavailable for this calculation.')
      ).toBeInTheDocument();
    });
  });

  describe('ReasoningDashaSection', () => {
    it('CRITICAL: renders period cards and planet names under PARTIAL status without crashing', () => {
      const dasha: ReasoningDashaViewModel = {
        status: 'PARTIAL',
        currentActivation: 'Partial timing active.',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: [],
            statement: 'Jupiter Mahadasha drives expansion.'
          }
        ]
      };

      render(<ReasoningDashaSection dasha={dasha} />);

      expect(screen.getByText('Partial')).toBeInTheDocument();
      expect(screen.getByText('Mahadasha (MD)')).toBeInTheDocument();
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
      expect(screen.getByText('Primary Driver')).toBeInTheDocument();
      expect(screen.getByText('Activates')).toBeInTheDocument();
      expect(screen.getByText('Jupiter Mahadasha drives expansion.')).toBeInTheDocument();
    });

    it('renders all MD, AD, PD cards under AVAILABLE status', () => {
      const dasha: ReasoningDashaViewModel = {
        status: 'AVAILABLE',
        currentActivation: 'High-impact timing window.',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: [],
            statement: 'MD statement'
          },
          {
            level: 'AD',
            planet: 'Saturn',
            role: 'MODIFIER',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: [],
            statement: 'AD statement'
          },
          {
            level: 'PD',
            planet: 'Mercury',
            role: 'REFINEMENT',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: [],
            statement: 'PD statement'
          }
        ]
      };

      render(<ReasoningDashaSection dasha={dasha} />);

      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
      expect(screen.getByText('Saturn')).toBeInTheDocument();
      expect(screen.getByText('Mercury')).toBeInTheDocument();
    });

    it('renders empty notice when status is UNAVAILABLE', () => {
      const dasha: ReasoningDashaViewModel = {
        status: 'UNAVAILABLE',
        periods: []
      };

      render(<ReasoningDashaSection dasha={dasha} />);

      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Dasha timing periods are unavailable for this calculation.')).toBeInTheDocument();
    });
  });

  describe('ReasoningTransitSection', () => {
    it('renders transit effect and statement', () => {
      const transit: ReasoningTransitViewModel = {
        status: 'AVAILABLE',
        effect: 'TRIGGER',
        statement: 'Jupiter transit activates 10th house.'
      };

      render(<ReasoningTransitSection transit={transit} />);

      expect(screen.getByText('Gochara (Transit) Triggers')).toBeInTheDocument();
      expect(screen.getByText('Trigger')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Jupiter transit activates 10th house.')).toBeInTheDocument();
    });
  });

  describe('ReasoningQualificationSection', () => {
    it('renders qualification items and severity', () => {
      const qualifications: ReasoningQualificationViewModel[] = [
        {
          type: 'COMBUSTION',
          severity: 'HIGH',
          description: 'Mercury combust by 2 degrees.'
        }
      ];

      render(<ReasoningQualificationSection qualifications={qualifications} />);

      expect(screen.getByText('Reasoning Qualifications & Caveats')).toBeInTheDocument();
      expect(screen.getByText('1 Condition')).toBeInTheDocument();
      expect(screen.getByText('COMBUSTION')).toBeInTheDocument();
      expect(screen.getByText('High Severity')).toBeInTheDocument();
      expect(screen.getByText('Mercury combust by 2 degrees.')).toBeInTheDocument();
    });

    it('renders clean empty state when no qualifications exist', () => {
      render(<ReasoningQualificationSection qualifications={[]} />);

      expect(screen.getByText('0 Conditions')).toBeInTheDocument();
      expect(
        screen.getByText('No qualifying conditions, severe afflictions, or adverse factors detected.')
      ).toBeInTheDocument();
    });
  });

  describe('ReasoningConclusion', () => {
    it('renders synthesized verdict with headline and metrics', () => {
      const conclusion: ReasoningConclusionViewModel = {
        headline: 'Executive Trajectory Confirmed',
        statement: 'Strong 10th lord and D10 alignment indicate corporate leadership.',
        status: 'STRONGLY_SUPPORTED',
        strength: 'STRONG',
        confidence: 'HIGH',
        integratedSynthesisAvailable: true,
        evidenceCount: 6,
        supportingEvidenceCount: 5,
        challengingEvidenceCount: 1,
        provenanceAvailable: true
      };

      render(<ReasoningConclusion conclusion={conclusion} />);

      expect(screen.getByText('Synthesized Astrological Verdict')).toBeInTheDocument();
      expect(screen.getByText('Executive Trajectory Confirmed')).toBeInTheDocument();
      expect(
        screen.getByText('Strong 10th lord and D10 alignment indicate corporate leadership.')
      ).toBeInTheDocument();
      expect(screen.getByText('6 Evidence Items')).toBeInTheDocument();
      expect(screen.getByText('5 Supporting')).toBeInTheDocument();
      expect(screen.getByText('1 Challenging')).toBeInTheDocument();
      expect(screen.getByText('Rule Provenance Available')).toBeInTheDocument();
    });
  });

  describe('ReasoningAISection', () => {
    it('renders AI explanatory commentary when available', () => {
      const ai: ReasoningAiViewModel = {
        available: true,
        status: 'AVAILABLE',
        statement: 'Benefic planets aspecting the 10th cusp produce notable governance power.',
        explanation: 'Classical text Brihat Parasara Hora Sastra indicates Ruchaka Yoga.',
        providerName: 'Gemini 1.5 Pro',
        routingMode: 'Deterministic Commentary'
      };

      render(<ReasoningAISection ai={ai} />);

      expect(screen.getByText('AI Explanation')).toBeInTheDocument();
      expect(screen.getByText('Derived from deterministic evidence')).toBeInTheDocument();
      expect(screen.getByText('Deterministic Commentary')).toBeInTheDocument();
      expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument();
      expect(
        screen.getByText('Benefic planets aspecting the 10th cusp produce notable governance power.')
      ).toBeInTheDocument();
    });

    it('does not render Deterministic Commentary fallback when routingMode is missing or empty', () => {
      const ai: ReasoningAiViewModel = {
        available: true,
        status: 'AVAILABLE',
        statement: 'Benefic planets aspecting the 10th cusp produce notable governance power.',
        explanation: 'Classical text Brihat Parasara Hora Sastra indicates Ruchaka Yoga.',
        providerName: 'Gemini 1.5 Pro'
      };

      render(<ReasoningAISection ai={ai} />);

      expect(screen.getByText('AI Explanation')).toBeInTheDocument();
      expect(screen.getByText('Derived from deterministic evidence')).toBeInTheDocument();
      expect(screen.queryByText('Deterministic Commentary')).not.toBeInTheDocument();
      expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument();
    });

    it('renders nothing when AI is unavailable or undefined', () => {
      const { container } = render(<ReasoningAISection ai={undefined} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('State components', () => {
    it('renders ReasoningLoadingState', () => {
      render(<ReasoningLoadingState />);
      expect(screen.getByText('Compiling Astrological Reasoning Graph')).toBeInTheDocument();
    });

    it('renders ReasoningErrorState', () => {
      render(<ReasoningErrorState errorMessage="Custom computation error" />);
      expect(screen.getByText('Reasoning Computation Error')).toBeInTheDocument();
      expect(screen.getByText('Custom computation error')).toBeInTheDocument();
    });

    it('renders ReasoningUnavailableState', () => {
      render(<ReasoningUnavailableState />);
      expect(screen.getByText('Astrological Reasoning Unavailable')).toBeInTheDocument();
    });
  });
});
