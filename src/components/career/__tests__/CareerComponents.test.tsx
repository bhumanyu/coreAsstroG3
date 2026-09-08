import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CareerHero,
  CareerPromiseSection,
  CareerExpressionSection,
  CareerD10Section,
  CareerDashaSection,
  CareerTransitSection,
  CareerQualificationsSection,
  CareerEvidenceSection,
  CareerConclusionSection
} from '../index';
import type {
  CareerHeroViewModel,
  CareerPromiseViewModel,
  CareerExpressionViewModel,
  CareerD10ViewModel,
  CareerDashaViewModel,
  CareerTransitViewModel,
  CareerQualificationViewModel,
  CareerEvidenceViewModel,
  CareerConclusionViewModel
} from '../../../product/analysis/careerViewModel';

describe('Career Section Components Suite (P-UI-04)', () => {
  describe('CareerHero', () => {
    it('renders heading, chart sign chips, confidence, and notice badge', () => {
      const hero: CareerHeroViewModel = {
        ascendantSign: 'Capricorn',
        moonSign: 'Leo',
        sunSign: 'Capricorn',
        moonNakshatra: 'Magha',
        status: 'READY',
        confidence: 'HIGH',
        warnings: [
          {
            domain: 'CAREER',
            code: 'WARN_1',
            severity: 'INFO',
            message: 'Sample advisory'
          }
        ]
      };

      render(<CareerHero hero={hero} />);

      expect(screen.getByText('Career & Professional Trajectory')).toBeInTheDocument();
      expect(screen.getAllByText('Capricorn').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Leo')).toBeInTheDocument();
      expect(screen.getByText('Magha')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('1 Notice')).toBeInTheDocument();
    });
  });

  describe('CareerPromiseSection', () => {
    it('renders strength, confidence, headline, statement, and manifestations', () => {
      const promise: CareerPromiseViewModel = {
        strength: 'STRONG',
        confidence: 'HIGH',
        headline: 'Executive Trajectory',
        statement: 'High vocational promise across 10th lord and Lagna.',
        manifestations: ['Corporate Leadership', 'Strategic Operations']
      };

      render(<CareerPromiseSection promise={promise} />);

      expect(screen.getByText('Natal Vocational Promise')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('Executive Trajectory')).toBeInTheDocument();
      expect(
        screen.getByText('High vocational promise across 10th lord and Lagna.')
      ).toBeInTheDocument();
      expect(screen.getByText('Corporate Leadership')).toBeInTheDocument();
      expect(screen.getByText('Strategic Operations')).toBeInTheDocument();
    });
  });

  describe('CareerExpressionSection', () => {
    it('renders primary style, leadership potential, and secondary competencies when available', () => {
      const expression: CareerExpressionViewModel = {
        available: true,
        primaryStyle: 'Strategic Leadership',
        leadershipPotential: 'HIGH',
        secondaryTraits: ['Analytical Reasoning', 'Organizational Governance']
      };

      render(<CareerExpressionSection expression={expression} />);

      expect(screen.getByText('Vocational Expression & Working Style')).toBeInTheDocument();
      expect(screen.getByText('Strategic Leadership')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('Analytical Reasoning')).toBeInTheDocument();
      expect(screen.getByText('Organizational Governance')).toBeInTheDocument();
    });

    it('renders clean fallback when expression data is unavailable', () => {
      const expression: CareerExpressionViewModel = {
        available: false,
        secondaryTraits: []
      };

      render(<CareerExpressionSection expression={expression} />);
      expect(
        screen.getByText('Vocational expression nuances unavailable for this profile.')
      ).toBeInTheDocument();
    });
  });

  describe('CareerD10Section', () => {
    it.each([
      ['CONFIRMS', 'Confirms'],
      ['PARTIALLY_CONFIRMS', 'Partially Confirms'],
      ['MODIFIES', 'Modifies'],
      ['CONFLICTS', 'Conflicts']
    ])('renders %s relationship badge correctly', (relationship, expectedBadge) => {
      const d10: CareerD10ViewModel = {
        available: true,
        relationship,
        statement: `Dasamsa ${expectedBadge.toLowerCase()} vocational elevation.`
      };

      render(<CareerD10Section d10={d10} />);

      expect(screen.getByText('Dasamsa (D10) Divisional Alignment')).toBeInTheDocument();
      expect(screen.getByText(expectedBadge)).toBeInTheDocument();
      expect(screen.getByText(`Dasamsa ${expectedBadge.toLowerCase()} vocational elevation.`)).toBeInTheDocument();
    });

    it('renders unavailable state for UNAVAILABLE D10 relationship', () => {
      const d10: CareerD10ViewModel = {
        available: false,
        relationship: 'UNAVAILABLE',
        statement: 'D10 harmonic data unavailable'
      };

      render(<CareerD10Section d10={d10} />);

      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      expect(screen.getByText('D10 harmonic data unavailable')).toBeInTheDocument();
    });
  });

  describe('CareerDashaSection', () => {
    it('renders separate MD, AD, PD period cards with planets and roles', () => {
      const dasha: CareerDashaViewModel = {
        available: true,
        status: 'AVAILABLE',
        currentActivation: 'High-leverage vocational period actively engaged.',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: ['ev_md'],
            statement: 'Jupiter Mahadasha establishes primary career elevation.'
          },
          {
            level: 'AD',
            planet: 'Saturn',
            role: 'MODIFIER',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: ['ev_ad'],
            statement: 'Saturn Antardasha demands procedural discipline.'
          },
          {
            level: 'PD',
            planet: 'Mercury',
            role: 'REFINEMENT',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: ['ev_pd'],
            statement: 'Mercury Pratyantardasha enhances negotiations.'
          }
        ]
      };

      render(<CareerDashaSection dasha={dasha} />);

      expect(screen.getByText('Career Timing & Vimshottari Dasha Hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Active Window')).toBeInTheDocument();
      expect(screen.getByText('High-leverage vocational period actively engaged.')).toBeInTheDocument();

      expect(screen.getByText('Mahadasha (MD)')).toBeInTheDocument();
      expect(screen.getByText('Jupiter')).toBeInTheDocument();
      expect(screen.getByText('Primary Driver')).toBeInTheDocument();

      expect(screen.getByText('Antardasha (AD)')).toBeInTheDocument();
      expect(screen.getByText('Saturn')).toBeInTheDocument();
      expect(screen.getByText('Modifier')).toBeInTheDocument();

      expect(screen.getByText('Pratyantardasha (PD)')).toBeInTheDocument();
      expect(screen.getByText('Mercury')).toBeInTheDocument();
      expect(screen.getByText('Refinement')).toBeInTheDocument();
    });

    it('renders clean unavailable state when dasha timing is unavailable', () => {
      const dasha: CareerDashaViewModel = {
        available: false,
        status: 'UNAVAILABLE',
        periods: []
      };

      render(<CareerDashaSection dasha={dasha} />);
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      expect(
        screen.getByText('Vimshottari dasha timing calculations are currently unavailable for this career analysis.')
      ).toBeInTheDocument();
    });
  });

  describe('CareerTransitSection', () => {
    it('renders transit effect and statement when available', () => {
      const transit: CareerTransitViewModel = {
        available: true,
        status: 'AVAILABLE',
        effect: 'TRIGGER',
        statement: 'Saturn transits natal 3rd house triggering initiative.'
      };

      render(<CareerTransitSection transit={transit} />);

      expect(screen.getByText('Planetary Transits (Gochara)')).toBeInTheDocument();
      expect(screen.getByText('Trigger')).toBeInTheDocument();
      expect(
        screen.getByText('Saturn transits natal 3rd house triggering initiative.')
      ).toBeInTheDocument();
    });

    it('renders unavailable state when transit status is UNAVAILABLE', () => {
      const transit: CareerTransitViewModel = {
        available: false,
        status: 'UNAVAILABLE',
        effect: 'UNAVAILABLE',
        statement: 'Transit calculations unavailable'
      };

      render(<CareerTransitSection transit={transit} />);

      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      expect(screen.getByText('Transit calculations unavailable')).toBeInTheDocument();
    });
  });

  describe('CareerQualificationsSection', () => {
    it('renders qualification cards with type, severity, and description', () => {
      const qualifications: CareerQualificationViewModel[] = [
        {
          id: 'comb_1',
          type: 'COMBUSTION',
          severity: 'LOW',
          description: 'Mercury combust by 8 degrees.'
        },
        {
          id: 'deb_1',
          type: 'DEBILITATION',
          severity: 'HIGH',
          description: 'Venus debilitated in Virgo.'
        }
      ];

      render(<CareerQualificationsSection qualifications={qualifications} />);

      expect(screen.getByText('Qualifications & Modifiers')).toBeInTheDocument();
      expect(screen.getByText('2 Conditions')).toBeInTheDocument();
      expect(screen.getByText('COMBUSTION')).toBeInTheDocument();
      expect(screen.getByText('Low Impact')).toBeInTheDocument();
      expect(screen.getByText('DEBILITATION')).toBeInTheDocument();
      expect(screen.getByText('High Severity')).toBeInTheDocument();
    });

    it('renders empty state when qualifications array is empty', () => {
      render(<CareerQualificationsSection qualifications={[]} />);
      expect(
        screen.getByText('No modifying afflictions, combustions, or debility mitigations detected for this career profile.')
      ).toBeInTheDocument();
    });
  });

  describe('CareerEvidenceSection', () => {
    it('renders evidence rules, roles, directions, source, provenance, and invokes onOpenReasoning', () => {
      const onOpenReasoning = vi.fn();
      const evidence: CareerEvidenceViewModel[] = [
        {
          id: 'ev_1',
          title: '10th Lord Exaltation',
          statement: 'Mars exalted in 1st house.',
          direction: 'SUPPORT',
          role: 'PRIMARY',
          source: 'CAREER_ENGINE',
          ruleId: 'RULE_RUCHAKA',
          derivedFromIds: ['ev_mars_exalted']
        }
      ];

      render(
        <CareerEvidenceSection evidence={evidence} onOpenReasoning={onOpenReasoning} />
      );

      expect(screen.getByText('Evidential Reasoning Provenance')).toBeInTheDocument();
      expect(screen.getByText('10th Lord Exaltation')).toBeInTheDocument();
      expect(screen.getByText('Primary Driver')).toBeInTheDocument();
      expect(screen.getByText('Supporting')).toBeInTheDocument();
      expect(screen.getByText('Source: CAREER_ENGINE')).toBeInTheDocument();
      expect(screen.getByText('| Rule: RULE_RUCHAKA')).toBeInTheDocument();
      expect(screen.getByText('Provenance: ev_mars_exalted')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /explore reasoning graph/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });
  });

  describe('CareerConclusionSection', () => {
    it('renders synthesis conclusion, confidence, evidence counts, and reasoning navigation', () => {
      const onOpenReasoning = vi.fn();
      const conclusion: CareerConclusionViewModel = {
        headline: 'Unified Career Synthesis',
        statement: 'Broad alignment across 10th house, Dasamsa, and active timing windows.',
        confidence: 'HIGH',
        primaryEvidenceCount: 2,
        supportingEvidenceCount: 3,
        challengingEvidenceCount: 1
      };

      render(
        <CareerConclusionSection
          conclusion={conclusion}
          onOpenReasoning={onOpenReasoning}
        />
      );

      expect(screen.getByText('Integrated Vocational Synthesis')).toBeInTheDocument();
      expect(screen.getByText('Unified Career Synthesis')).toBeInTheDocument();
      expect(
        screen.getByText('Broad alignment across 10th house, Dasamsa, and active timing windows.')
      ).toBeInTheDocument();
      expect(screen.getByText('2 Primary')).toBeInTheDocument();
      expect(screen.getByText('3 Supporting')).toBeInTheDocument();
      expect(screen.getByText('1 Challenging')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /trace full evidential reasoning/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });
  });
});
