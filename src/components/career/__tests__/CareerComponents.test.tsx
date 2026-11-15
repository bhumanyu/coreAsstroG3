import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../../../i18n/i18n';
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
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

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
    it('does not attribute a stage when C8 diagnostics are partial', () => {
      render(<CareerExpressionSection expression={{
        available: false,
        status: 'EXECUTED_NO_CANDIDATES',
        coverageSummary: {
          mechanismCandidateCount: 0,
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 1,
          eligiblePatternCount: 1,
          invalidRolePatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'RESOLVED',
          expressionCount: 0,
          expressionsWithEvidenceCount: 0,
          evidenceCount: 0,
          evidenceWithPlanetAttributionCount: 0
        },
        candidates: []
      }} />);

      expect(screen.getByText('No canonical career expression candidates are available for this profile.')).toBeInTheDocument();
      expect(screen.queryByText('Career mechanisms could not be resolved from the qualified patterns.')).not.toBeInTheDocument();
    });

    it('does not infer a failing stage when candidate or qualification records were quarantined', () => {
      render(<CareerExpressionSection expression={{
        available: false,
        status: 'EXECUTED_NO_CANDIDATES',
        coverageSummary: {
          mechanismCandidateCount: 0,
          patternCandidateCount: 0,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 1,
          conflictedCandidateCount: 1,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 0,
          eligiblePatternCount: 0,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 1,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'NOT_REQUIRED',
          expressionCount: 0,
          expressionsWithEvidenceCount: 0,
          evidenceCount: 0,
          evidenceWithPlanetAttributionCount: 0
        },
        candidates: []
      }} />);

      expect(screen.getByText('The expression analysis completed without producing candidates.')).toBeInTheDocument();
      expect(screen.queryByText('No career patterns were discovered.')).not.toBeInTheDocument();
      expect(screen.queryByText(/none passed qualification/)).not.toBeInTheDocument();
    });

    it.each([
      [
        'no discovered patterns',
        {
          patternCandidateCount: 0,
          patternCandidateRecordCount: 0,
          distinctCandidateIdCount: 0,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 0,
          eligiblePatternCount: 0,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'NOT_REQUIRED' as const
        },
        'No career patterns were discovered.'
      ],
      [
        'failed qualification',
        {
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 0,
          eligiblePatternCount: 0,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'RESOLVED' as const
        },
        'Career patterns were identified, but none passed qualification.'
      ],
      [
        'participant role errors',
        {
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 2,
          eligiblePatternCount: 2,
          invalidRolePatternCount: 1,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'RESOLVED' as const
        },
        'Career patterns passed qualification, but participant roles could not be assigned.'
      ],
      [
        'missing network evidence',
        {
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 2,
          eligiblePatternCount: 2,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'MISSING' as const
        },
        'Required career network evidence was missing.'
      ],
      [
        'incomplete network evidence',
        {
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 2,
          eligiblePatternCount: 2,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'INCOMPLETE' as const
        },
        'Career network or qualification evaluation was incomplete.'
      ],
      [
        'mechanism resolver',
        {
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 2,
          eligiblePatternCount: 2,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'RESOLVED' as const
        },
        'No mechanism rule matched the eligible career patterns.'
      ],
      [
        'skipped role assignment',
        {
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 1,
          eligiblePatternCount: 2,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 1,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'RESOLVED' as const
        },
        'Some career patterns were skipped during participant-role assignment because qualification was unavailable.'
      ]
    ])('attributes zero candidates to %s', (_name, diagnostics, expectedMessage) => {
      render(<CareerExpressionSection expression={{
        available: false,
        status: 'EXECUTED_NO_CANDIDATES',
        coverageSummary: {
          mechanismCandidateCount: 0,
          ...diagnostics,
          expressionCount: 0,
          expressionsWithEvidenceCount: 0,
          evidenceCount: 0,
          evidenceWithPlanetAttributionCount: 0
        },
        candidates: []
      }} />);

      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      expect(screen.getByText('The expression analysis completed without producing candidates.')).toBeInTheDocument();
    });

    it('attributes eligible insufficient-data patterns to mechanism matching, not qualification rejection', () => {
      render(<CareerExpressionSection expression={{
        available: false,
        status: 'EXECUTED_NO_CANDIDATES',
        coverageSummary: {
          mechanismCandidateCount: 0,
          patternCandidateCount: 1,
          patternCandidateRecordCount: 1,
          distinctCandidateIdCount: 1,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 0,
          qualifiedPatternCount: 0,
          eligiblePatternCount: 1,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'RESOLVED',
          expressionCount: 0,
          expressionsWithEvidenceCount: 0,
          evidenceCount: 0,
          evidenceWithPlanetAttributionCount: 0
        },
        candidates: []
      }} />);

      expect(screen.getByText('No mechanism rule matched the eligible career patterns.')).toBeInTheDocument();
      expect(screen.queryByText('Career patterns were identified, but none passed qualification.')).not.toBeInTheDocument();
    });

    it('attributes missing qualification results without inferring that patterns failed qualification', () => {
      render(<CareerExpressionSection expression={{
        available: false,
        status: 'EXECUTED_NO_CANDIDATES',
        coverageSummary: {
          mechanismCandidateCount: 0,
          patternCandidateCount: 2,
          patternCandidateRecordCount: 2,
          distinctCandidateIdCount: 2,
          conflictedCandidateCount: 0,
          conflictedQualificationCount: 0,
          qualificationResultMissingCount: 1,
          qualifiedPatternCount: 0,
          eligiblePatternCount: 0,
          invalidRolePatternCount: 0,
          roleAssignmentSkippedPatternCount: 0,
          resolvedMechanismCount: 0,
          networkResolutionStatus: 'INCOMPLETE',
          expressionCount: 0,
          expressionsWithEvidenceCount: 0,
          evidenceCount: 0,
          evidenceWithPlanetAttributionCount: 0
        },
        candidates: []
      }} />);

      expect(screen.getByText('Some identified career patterns have no qualification result, so their eligibility cannot be determined.')).toBeInTheDocument();
      expect(screen.queryByText('Career patterns were identified, but none passed qualification.')).not.toBeInTheDocument();
    });

    it('renders primary style, leadership potential, and secondary competencies when available', () => {
      const expression: CareerExpressionViewModel = {
        available: true,
        status: 'AVAILABLE',
        primaryStyle: 'Strategic Leadership',
        leadershipPotential: 'HIGH',
        secondaryTraits: ['Analytical Reasoning', 'Organizational Governance'],
        candidates: [{
          expressionId: 'expr-candidate',
          expressionType: 'LEADERSHIP_EXPRESSION',
          qualificationStatus: 'CANDIDATE'
        }]
      };

      render(<CareerExpressionSection expression={expression} />);

      expect(screen.getByText('Vocational Expression & Working Style')).toBeInTheDocument();
      expect(screen.getByText('Strategic Leadership')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('Analytical Reasoning')).toBeInTheDocument();
      expect(screen.getByText('Organizational Governance')).toBeInTheDocument();
      expect(screen.getByText('Leadership expression')).toBeInTheDocument();
      expect(screen.getByText('Candidate')).toBeInTheDocument();
    });

    it('renders clean fallback when expression data is unavailable', () => {
      const expression: CareerExpressionViewModel = {
        available: false,
        status: 'ABSENT',
        secondaryTraits: [],
        candidates: []
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
            evidence: [],
            statement: 'Jupiter Mahadasha establishes primary career elevation.'
          },
          {
            level: 'AD',
            planet: 'Saturn',
            role: 'MODIFIER',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: ['ev_ad'],
            evidence: [],
            statement: 'Saturn Antardasha demands procedural discipline.'
          },
          {
            level: 'PD',
            planet: 'Mercury',
            role: 'REFINEMENT',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: ['ev_pd'],
            evidence: [],
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

    it('shows a partial-assessment badge for every partially assessed period', () => {
      const dasha: CareerDashaViewModel = {
        status: 'AVAILABLE',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: [],
            evidence: [],
            conditionAssessment: 'PARTIAL',
            afflictionAssessed: false,
            diagnostics: ['C9_PRIMARY_FALLBACK_EXPRESSION_ANALYSIS_UNAVAILABLE']
          },
          {
            level: 'AD',
            planet: 'Mercury',
            role: 'MODIFIER',
            direction: 'NEUTRAL',
            effect: 'DOES_NOT_ACTIVATE',
            evidenceIds: [],
            evidence: [],
            conditionAssessment: 'PARTIAL',
            afflictionAssessed: false
          }
        ]
      };

      render(<CareerDashaSection dasha={dasha} />);

      expect(screen.getAllByText('Partially assessed')).toHaveLength(2);
      expect(screen.getByText(
        'Expression analysis was unavailable; this period is not treated as an assessed neutral.'
      )).toBeInTheDocument();
    });

    it('renders the canonical C9 challenge verdict without a conflicting legacy verdict', () => {
      const dasha: CareerDashaViewModel = {
        status: 'AVAILABLE',
        periods: [{
          level: 'MD',
          planet: 'Jupiter',
          role: 'PRIMARY',
          direction: 'CHALLENGE',
          effect: 'CHALLENGES',
          evidenceIds: ['c9-jupiter-md'],
          evidence: [{
            id: 'c9-jupiter-evidence',
            title: 'Jupiter career relationship',
            explanation: 'Jupiter supplies challenging career evidence'
          }],
          statement: 'C9: Jupiter challenges career.'
        }]
      };

      render(<CareerDashaSection dasha={dasha} />);

      expect(screen.getByText('Challenges')).toBeInTheDocument();
      expect(screen.getByText('C9: Jupiter challenges career.')).toBeInTheDocument();
      expect(screen.getByText('Canonical C9 evidence')).toBeInTheDocument();
      expect(screen.getByText('Jupiter supplies challenging career evidence')).toBeInTheDocument();
      expect(screen.queryByText('STRONGLY_SUPPORTS')).not.toBeInTheDocument();
    });

    it('renders the localized evidence tally line and omits zero-count buckets', () => {
      const dasha: CareerDashaViewModel = {
        status: 'AVAILABLE',
        periods: [
          {
            level: 'MD',
            planet: 'Jupiter',
            role: 'PRIMARY',
            direction: 'SUPPORT',
            effect: 'ACTIVATES',
            evidenceIds: [],
            evidence: [],
            evidenceTally: { supportingCount: 2, challengingCount: 3, neutralCount: 0 }
          },
          {
            level: 'AD',
            planet: 'Saturn',
            role: 'MODIFIER',
            direction: 'CHALLENGE',
            effect: 'CHALLENGES',
            evidenceIds: [],
            evidence: [],
            statement: 'No tally period.'
          }
        ]
      };

      render(<CareerDashaSection dasha={dasha} />);

      expect(
        screen.getByText('2 supporting · 3 challenging evidence factors')
      ).toBeInTheDocument();
      expect(screen.queryByText(/neutral/)).not.toBeInTheDocument();
      // The period without a tally renders no tally line.
      expect(screen.getAllByText(/evidence factors/)).toHaveLength(1);
    });

    it('does not render a tally when every evidence direction is non-directional', () => {
      const dasha: CareerDashaViewModel = {
        status: 'AVAILABLE',
        periods: [{
          level: 'MD',
          planet: 'Jupiter',
          role: 'PRIMARY',
          direction: 'NEUTRAL',
          effect: 'INSUFFICIENT_DATA',
          evidenceIds: [],
          evidence: [],
          evidenceTally: { supportingCount: 0, challengingCount: 0, neutralCount: 0 }
        }]
      };

      render(<CareerDashaSection dasha={dasha} />);

      expect(screen.queryByText(/evidence factors/)).not.toBeInTheDocument();
    });

    it('renders clean unavailable state when dasha timing is unavailable', () => {
      const dasha: CareerDashaViewModel = {
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
          type: 'COMBUSTION',
          severity: 'LOW',
          description: 'Mercury combust by 8 degrees.'
        },
        {
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
          roleLabel: 'Primary factor',
          directionLabel: 'Supportive',
          explanation: 'Mars exalted in 1st house.',
          sourceLabel: 'CAREER_ENGINE',
          role: 'PRIMARY',
          direction: 'SUPPORT',
          ruleId: 'RULE_RUCHAKA',
          derivedFromIds: ['ev_mars_exalted'],
          technical: {
            id: 'ev_1',
            ruleId: 'RULE_RUCHAKA',
            source: 'CAREER_ENGINE',
            direction: 'SUPPORT',
            role: 'PRIMARY',
            statement: 'Mars exalted in 1st house.',
            derivedFromIds: ['ev_mars_exalted']
          }
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
      expect(screen.getByText('RULE_RUCHAKA')).toBeInTheDocument();
      expect(screen.getByText('ev_mars_exalted')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /explore reasoning graph/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });

    it('renders translated enum labels in Hindi instead of raw enum values', async () => {
      await i18n.changeLanguage('hi');
      const evidence: CareerEvidenceViewModel[] = [{
        id: 'ev_1',
        title: '10th Lord Exaltation',
        roleLabel: 'Primary factor',
        directionLabel: 'Supportive',
        explanation: 'Mars exalted in 1st house.',
        sourceLabel: 'CAREER_ENGINE',
        role: 'PRIMARY',
        direction: 'SUPPORT',
        derivedFromIds: [],
        technical: {
          id: 'ev_1',
          source: 'CAREER_ENGINE',
          direction: 'SUPPORT',
          role: 'PRIMARY',
          statement: 'Mars exalted in 1st house.'
        }
      }];

      render(<CareerEvidenceSection evidence={evidence} />);

      expect(screen.getByText('प्रमुख कारक')).toBeInTheDocument();
      expect(screen.getByText('समर्थक')).toBeInTheDocument();
      expect(screen.queryByText('PRIMARY', { selector: 'span' })).not.toBeInTheDocument();
      expect(screen.queryByText('SUPPORT', { selector: 'span' })).not.toBeInTheDocument();
    });
  });

  describe('CareerConclusionSection', () => {
    it('renders synthesis conclusion, confidence, evidence counts, and reasoning navigation', () => {
      const onOpenReasoning = vi.fn();
      const conclusion: CareerConclusionViewModel = {
        headline: 'Unified Career Synthesis',
        statement: 'Broad alignment across 10th house, Dasamsa, and active timing windows.',
        confidence: 'HIGH',
        integratedSynthesisAvailable: true,
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
      expect(screen.getByText('2 Primary Drivers')).toBeInTheDocument();
      expect(screen.getByText('3 Supporting Factors')).toBeInTheDocument();
      expect(screen.getByText('1 Challenging Factors')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /trace full evidential reasoning/i });
      fireEvent.click(btn);
      expect(onOpenReasoning).toHaveBeenCalledTimes(1);
    });

    it('renders honest fallback title and subtitle when integratedSynthesisAvailable is false', () => {
      const conclusion: CareerConclusionViewModel = {
        headline: 'Natal Trajectory',
        statement: 'Strong 10th house promise without multi-engine synthesis.',
        confidence: 'MEDIUM',
        integratedSynthesisAvailable: false,
        primaryEvidenceCount: 1,
        supportingEvidenceCount: 2,
        challengingEvidenceCount: 0
      };

      render(<CareerConclusionSection conclusion={conclusion} />);

      expect(screen.getByText('Career Conclusion')).toBeInTheDocument();
      expect(
        screen.getByText('Natal promise and available activation evidence indicate…')
      ).toBeInTheDocument();
      expect(screen.queryByText('Integrated Vocational Synthesis')).not.toBeInTheDocument();
      expect(screen.getByText('1 Primary Drivers')).toBeInTheDocument();
      expect(screen.getByText('2 Supporting Factors')).toBeInTheDocument();
      expect(screen.getByText('0 Challenging Factors')).toBeInTheDocument();
    });
  });
});
